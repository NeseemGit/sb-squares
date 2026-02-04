"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { PoolStatusBadges } from "@/components/PoolStatusBadges";
import { LoadingScreen, LoadingSpinner } from "@/components/LoadingSpinner";

const client = generateClient<Schema>();

/** Hash a string to a hue 0–360 for consistent per-user colors. */
function hueForOwner(ownerId: string): number {
  let h = 0;
  for (let i = 0; i < ownerId.length; i++) {
    h = (h * 31 + ownerId.charCodeAt(i)) >>> 0;
  }
  return h % 360;
}

/** Return CSS background and text color for a square owned by ownerId. */
function colorsForOwner(ownerId: string): { bg: string; text: string } {
  const hue = hueForOwner(ownerId);
  const bg = `hsl(${hue}, 55%, 42%)`;
  const text = "rgb(255,255,255)";
  return { bg, text };
}

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className ?? "h-4 w-4"}
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M5.166 2.621v.858a47.68 47.68 0 0 0-3.071.543.75.75 0 0 0-.584.859 6.753 6.753 0 0 0 6.138 5.6 6.73 6.73 0 0 0 2.743 1.346A6.707 6.707 0 0 1 9.279 15H8.54c-1.036 0-1.875.84-1.875 1.875V19.5h-.75a2.25 2.25 0 0 0-2.25 2.25c0 .414.336.75.75.75h15a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-2.25-2.25h-.75v-2.625c0-1.036-.84-1.875-1.875-1.875h-.739a6.706 6.706 0 0 1-1.112-3.173 6.73 6.73 0 0 0 2.743-1.347 6.753 6.753 0 0 0 6.139-5.6.75.75 0 0 0-.585-.858 47.077 47.077 0 0 0-3.07-.543V2.62a.75.75 0 0 0-.658-.744 49.22 49.22 0 0 0-6.093-.377c-2.063 0-4.096.128-6.093.377a.75.75 0 0 0-.657.744zm0 2.629c0 1.196.312 2.32.857 3.294A5.266 5.266 0 0 1 3.16 5.337a45.6 45.6 0 0 1 2.006-.343zm13.5 0v-.256c.674.1 1.343.214 2.006.343a5.265 5.265 0 0 1-2.863 3.207 6.72 6.72 0 0 0 .857-3.294z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/** American football icon for selected (unclaimed) squares. Uses asset from public/images. */
function FootballIcon({ className }: { className?: string }) {
  return (
    <img
      src="/images/football-icon.svg"
      alt=""
      className={className ?? "h-4 w-4"}
      aria-hidden
    />
  );
}

export default function PoolDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { authStatus } = useAuthenticator((c) => [c.authStatus]);
  const [pool, setPool] = useState<Schema["Pool"]["type"] | null>(null);
  const [squares, setSquares] = useState<Schema["Square"]["type"][]>([]);
  const [loading, setLoading] = useState(true);
  const [unclaiming, setUnclaiming] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pendingUnclaimIds = useRef<Set<string>>(new Set());
  /** Square ids we just claimed; subscription must not overwrite with stale data until it has the update. */
  const justClaimedIds = useRef<Set<string>>(new Set());
  /** Squares the user has selected to claim; Claim bar appears and they can claim all at once. */
  const [selectedForClaim, setSelectedForClaim] = useState<
    Array<{ row: number; col: number; square: Schema["Square"]["type"] }>
  >([]);
  const [claimDisplayName, setClaimDisplayName] = useState("");
  /** True while the claim API request(s) are in flight. */
  const [claimSubmitting, setClaimSubmitting] = useState(false);
  /** Admin: selecting which square is the winner. */
  const [selectingWinner, setSelectingWinner] = useState(false);
  const [settingWinner, setSettingWinner] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { fetchAuthSession, getCurrentUser } = await import("aws-amplify/auth");
        const { tokens } = await fetchAuthSession();
        const fromId = (tokens?.idToken?.payload["cognito:groups"] as string[] | undefined) ?? [];
        const fromAccess = (tokens?.accessToken?.payload["cognito:groups"] as string[] | undefined) ?? [];
        const groups = [...new Set([...fromId, ...fromAccess])];
        setIsAdmin(groups.includes("Admins"));
        const user = await getCurrentUser();
        setCurrentUserId(user?.userId ?? null);
      } catch {
        setIsAdmin(false);
        setCurrentUserId(null);
      }
    })();
  }, []);

  useEffect(() => {
    if (!id) return;
    const apiKey = { authMode: "apiKey" as const };
    const fetchPool = async () => {
      try {
        const { data: p } = await client.models.Pool.get({ id }, apiKey);
        setPool(p ?? null);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    };
    fetchPool();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const sub = client.models.Square.observeQuery(
      { filter: { poolId: { eq: id } }, authMode: "apiKey" },
    ).subscribe({
      next: ({ items }) => {
        const pending = pendingUnclaimIds.current;
        const justClaimed = justClaimedIds.current;
        setSquares((prev) => {
          let next = items.map((sq) => {
            if (pending.has(sq.id)) {
              if (!sq.ownerId) pending.delete(sq.id);
              return { ...sq, ownerId: undefined, ownerName: undefined, claimedAt: undefined };
            }
            // Don't overwrite newly claimed squares with stale subscription data
            if (justClaimed.has(sq.id) && !sq.ownerId) {
              const p = prev.find((s) => s.id === sq.id);
              if (p?.ownerId)
                return { ...sq, ownerId: p.ownerId, ownerName: p.ownerName, claimedAt: p.claimedAt };
            }
            if (sq.ownerId) justClaimed.delete(sq.id);
            return sq;
          });
          return next;
        });
      },
    });
    return () => sub.unsubscribe();
  }, [id]);

  const gridSize = pool?.gridSize ?? 10;
  const grid: { row: number; col: number; square?: Schema["Square"]["type"] }[] = [];
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const square = squares.find((s) => s.row === r && s.col === c);
      grid.push({ row: r, col: c, square });
    }
  }

  const isSelected = (r: number, c: number) =>
    selectedForClaim.some((s) => s.row === r && s.col === c);

  useEffect(() => {
    if (selectedForClaim.length === 0 || claimDisplayName !== "") return;
    const cancelled = { current: false };
    (async () => {
      try {
        const { getCurrentUser } = await import("aws-amplify/auth");
        const user = await getCurrentUser();
        const loginId = user?.signInDetails?.loginId ?? "Me";
        let defaultName = loginId;
        if (user?.userId) {
          try {
            const { data: profiles } = await client.models.UserProfile.listUserProfileByUserId(
              { userId: user.userId },
              { authMode: "userPool" },
            );
            const profile = profiles[0];
            if (profile?.displayName?.trim()) defaultName = profile.displayName.trim();
          } catch {
            /* use loginId */
          }
        }
        if (!cancelled.current) setClaimDisplayName(defaultName);
      } catch {
        if (!cancelled.current) setClaimDisplayName("Me");
      }
    })();
    return () => {
      cancelled.current = true;
    };
  }, [selectedForClaim.length]);

  const handleSelectForClaim = (row: number, col: number, square: Schema["Square"]["type"]) => {
    if (authStatus !== "authenticated") {
      router.push("/login");
      return;
    }
    if (isSelected(row, col)) {
      setSelectedForClaim((prev) => prev.filter((s) => !(s.row === row && s.col === col)));
      return;
    }
    setSelectedForClaim((prev) => [...prev, { row, col, square }]);
  };

  const handleClaim = async (displayName?: string) => {
    if (selectedForClaim.length === 0 || claimSubmitting) return;
    const name = (displayName ?? claimDisplayName).trim() || "Me";

    if (authStatus !== "authenticated") {
      router.push("/login");
      return;
    }
    const alreadyClaimed = selectedForClaim.find((s) => s.square.ownerId);
    if (alreadyClaimed) {
      setError("One or more selected squares are already claimed. Clear selection and try again.");
      return;
    }
    setClaimSubmitting(true);
    setError(null);
    try {
      const { getCurrentUser } = await import("aws-amplify/auth");
      const user = await getCurrentUser();
      const userId = user?.userId ?? "";
      if (!userId) {
        setError("Session expired. Please sign in again.");
        setClaimSubmitting(false);
        return;
      }
      const claimedAt = new Date().toISOString();

      const toClaim = [...selectedForClaim];
      for (const { square: existing } of toClaim) {
        const result = await client.models.Square.update(
          {
            id: existing.id,
            poolId: existing.poolId,
            row: existing.row,
            col: existing.col,
            ownerId: userId,
            ownerName: name,
            claimedAt,
          },
          { authMode: "userPool" },
        );
        const errors = (result as { errors?: unknown[] }).errors;
        if (errors?.length) {
          throw new Error(String(errors[0]));
        }
        justClaimedIds.current.add(existing.id);
        setSquares((prev) =>
          prev.map((s) =>
            s.id === existing.id
              ? { ...s, ownerId: userId, ownerName: name, claimedAt }
              : s,
          ),
        );
        setSelectedForClaim((prev) => prev.filter((s) => s.square.id !== existing.id));
      }
      setClaimDisplayName("");
      // Refetch from DB; merge with optimistic state so stale refetch doesn't wipe claims
      const applyRefetch = (fresh: Schema["Square"]["type"][] | undefined) => {
        setSquares((prev) => {
          const list = fresh ?? [];
          const merged = list.map((sq) => {
            if (justClaimedIds.current.has(sq.id) && !sq.ownerId) {
              const p = prev.find((s) => s.id === sq.id);
              if (p?.ownerId)
                return { ...sq, ownerId: p.ownerId, ownerName: p.ownerName, claimedAt: p.claimedAt };
            }
            if (sq.ownerId) justClaimedIds.current.delete(sq.id);
            return sq;
          });
          return merged;
        });
      };
      const { data: freshSquares } = await client.models.Square.listSquareByPoolId(
        { poolId: id! },
        { authMode: "apiKey" },
      );
      applyRefetch(freshSquares ?? undefined);
      // If refetch was stale (claimed squares still missing), retry once after a short delay
      const stillPending = [...justClaimedIds.current];
      if (stillPending.length > 0) {
        await new Promise((r) => setTimeout(r, 600));
        const { data: retrySquares } = await client.models.Square.listSquareByPoolId(
          { poolId: id! },
          { authMode: "apiKey" },
        );
        applyRefetch(retrySquares ?? undefined);
      }
      setTimeout(
        () => toClaim.forEach(({ square: s }) => justClaimedIds.current.delete(s.id)),
        8000,
      );
    } catch (e) {
      const err = e as Error & { errors?: unknown[] };
      const message = err.message ?? (err.errors?.[0] && String(err.errors[0])) ?? String(e);
      setError(message);
    } finally {
      setClaimSubmitting(false);
    }
  };

  const winningSquaresArray: [number, number][] = (() => {
    try {
      if (pool?.winningSquares) return JSON.parse(pool.winningSquares) as [number, number][];
    } catch {
      /* ignore */
    }
    return [];
  })();

  const toggleWinningSquare = async (row: number, col: number) => {
    if (!pool || !isAdmin) return;
    const next = winningSquaresArray.some(([r, c]) => r === row && c === col)
      ? winningSquaresArray.filter(([r, c]) => !(r === row && c === col))
      : [...winningSquaresArray, [row, col]];
    const winningSquares = JSON.stringify(next);
    setSettingWinner(true);
    setError(null);
    try {
      await client.models.Pool.update({
        id: pool.id,
        winningSquares,
      });
      setPool((prev) => (prev ? { ...prev, winningSquares } : null));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSettingWinner(false);
    }
  };

  const clearAllWinningSquares = async () => {
    if (!pool || !isAdmin) return;
    setSettingWinner(true);
    setError(null);
    try {
      await client.models.Pool.update({
        id: pool.id,
        winningSquares: "[]",
      });
      setPool((prev) => (prev ? { ...prev, winningSquares: "[]" } : null));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSettingWinner(false);
    }
  };

  const handleUnclaim = async (row: number, col: number) => {
    const existing = squares.find((s) => s.row === row && s.col === col);
    if (!existing?.ownerId) return;
    const key = `unclaim-${row}-${col}`;
    setUnclaiming(key);
    setError(null);
    try {
      const result = await client.models.Square.update(
        {
          id: existing.id,
          poolId: existing.poolId,
          row: existing.row,
          col: existing.col,
          ownerId: "",
          ownerName: "",
          claimedAt: "",
        },
        { authMode: "userPool" },
      );
      const errors = (result as { errors?: unknown[] }).errors;
      if (errors?.length) throw new Error(String(errors[0]));
      pendingUnclaimIds.current.add(existing.id);
      setTimeout(() => pendingUnclaimIds.current.delete(existing.id), 5000);
      setSquares((prev) =>
        prev.map((s) =>
          s.id === existing.id ? { ...s, ownerId: "", ownerName: "", claimedAt: "" } : s,
        ),
      );
      const { data: freshSquares } = await client.models.Square.listSquareByPoolId(
        { poolId: id },
        { authMode: "apiKey" },
      );
      if (freshSquares) setSquares(freshSquares);
    } catch (e) {
      const err = e as Error & { errors?: unknown[] };
      const message = err.message ?? (err.errors?.[0] && String(err.errors[0])) ?? String(e);
      setError(message);
    } finally {
      setUnclaiming(null);
    }
  };

  if (loading || !pool) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        {loading ? (
          <LoadingScreen message="Loading pool…" />
        ) : (
          <p className="text-slate-400">Pool not found.</p>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        <p className="rounded-lg bg-red-900/20 p-4 text-red-400">{error}</p>
        <Link href="/pools" className="mt-4 inline-block text-amber-400 hover:underline">
          Back to pools
        </Link>
      </div>
    );
  }

  const isOpen = pool.status === "OPEN";

  const rowNumbers: number[] = (() => {
    try {
      if (pool.rowNumbers) return JSON.parse(pool.rowNumbers) as number[];
    } catch {
      /* ignore */
    }
    return [];
  })();
  const colNumbers: number[] = (() => {
    try {
      if (pool.colNumbers) return JSON.parse(pool.colNumbers) as number[];
    } catch {
      /* ignore */
    }
    return [];
  })();
  const numbersRevealed = pool.numbersRevealed === true;
  const showRowNum = (i: number) => (numbersRevealed && rowNumbers[i] !== undefined ? String(rowNumbers[i]) : "?");
  const showColNum = (i: number) => (numbersRevealed && colNumbers[i] !== undefined ? String(colNumbers[i]) : "?");
  const teamRowName = (pool.teamRowName ?? "").trim() || "Team 1";
  const teamColName = (pool.teamColName ?? "").trim() || "Team 2";

  /** Show initials (e.g. "JD") or first few chars of owner name for grid cells (multi-word: 2 initials; single: up to 8 chars). */
  const squareLabel = (ownerName: string | null | undefined) => {
    if (!ownerName?.trim()) return "•";
    const s = ownerName.trim();
    const parts = s.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase().slice(0, 2);
    }
    return s.slice(0, 8).toUpperCase();
  };

  const totalSquares = gridSize * gridSize;
  const claimedSquares = squares.filter((s) => s.ownerId);
  const claimedCount = claimedSquares.length;
  const leftCount = totalSquares - claimedCount;
  const myCount = currentUserId ? claimedSquares.filter((s) => s.ownerId === currentUserId).length : 0;

  const showClaimBar = isOpen && selectedForClaim.length > 0;

  return (
    <div
      className={`mx-auto max-w-6xl px-4 py-6 sm:py-12 ${showClaimBar ? "pb-24" : ""}`}
    >
      <header className="mb-6 sm:mb-8">
        <h1 className="mb-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">
          {pool.name}
        </h1>
        {pool.description && (
          <p className="mb-4 text-slate-400">{pool.description}</p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="text-slate-500">
              <span className="font-medium text-slate-400">Event</span> {pool.eventDate}
            </span>
          </div>
          {pool.pricePerSquare != null && pool.pricePerSquare > 0 && (
            <p className="inline-flex shrink-0 items-center rounded-lg bg-emerald-500/10 px-4 py-2 text-base font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
              ${Number(pool.pricePerSquare).toFixed(2)} per square
            </p>
          )}
        </div>
        <div className="mt-3">
          <PoolStatusBadges
            status={pool.status}
            numbersRevealed={numbersRevealed}
            hasWinners={winningSquaresArray.length > 0}
            leftCount={leftCount}
          />
        </div>
      </header>

      {pool.commishNotes?.trim() && (
        <div className="mb-6 rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-3">
          <h2 className="mb-2 font-semibold text-slate-200">Commish Notes</h2>
          <ul className="list-outside list-disc space-y-1 pl-5 text-sm text-slate-400">
            {pool.commishNotes
              .trim()
              .split(/\n+/)
              .map((line) => line.trim())
              .filter(Boolean)
              .map((line, i) => (
                <li key={i}>{line}</li>
              ))}
          </ul>
        </div>
      )}

      {pool.prizePayouts?.trim() && (
        <div className="mb-6 rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-3">
          <h2 className="mb-2 font-semibold text-slate-200">Prize Payouts</h2>
          <ul className="list-outside list-disc space-y-1 pl-5 text-sm text-slate-400">
            {pool.prizePayouts
              .trim()
              .split(/\n+/)
              .map((line) => line.trim())
              .filter(Boolean)
              .map((line, i) => (
                <li key={i}>{line}</li>
              ))}
          </ul>
        </div>
      )}

      {showClaimBar && (
        <div className="toolbar-fade-in fixed bottom-0 left-0 right-0 z-50 border-t-2 border-[#fbbf24] bg-emerald-950 py-3 shadow-[0_-8px_32px_rgba(0,0,0,0.5)]">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-3 px-4 sm:justify-between">
            <span className="font-medium text-amber-200">
              Selected: {selectedForClaim.length} square{selectedForClaim.length !== 1 ? "s" : ""}
            </span>
            <label className="flex items-center gap-2 text-slate-300">
              <span className="text-sm">Name/initials:</span>
              <input
                type="text"
                value={claimDisplayName}
                onChange={(e) => setClaimDisplayName(e.target.value)}
                placeholder="Your name or initials"
                className="w-40 rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-70"
                maxLength={20}
                disabled={claimSubmitting}
                onKeyDown={(e) => e.key === "Enter" && !claimSubmitting && handleClaim()}
              />
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleClaim()}
                disabled={claimSubmitting}
                className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 font-medium text-white hover:bg-amber-500 disabled:cursor-wait disabled:opacity-70"
              >
                {claimSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" className="shrink-0" />
                    <span>Claiming…</span>
                  </>
                ) : (
                  `Claim ${selectedForClaim.length} square${selectedForClaim.length !== 1 ? "s" : ""}`
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedForClaim([]);
                  setClaimDisplayName("");
                }}
                disabled={claimSubmitting}
                className="rounded-lg px-3 py-2 text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-50"
              >
                Clear selection
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm min-h-[3rem]">
        <span className="shrink-0 font-medium text-slate-300">
          <span className="text-white">{leftCount}</span> left
          <span className="ml-1 text-slate-500">(of {totalSquares})</span>
        </span>
        {currentUserId && (
          <span className="flex flex-wrap items-center gap-x-6 gap-y-1 shrink-0">
            <span className="text-slate-400">
              You have <span className="font-medium text-amber-400">{myCount}</span> square{myCount !== 1 ? "s" : ""}
            </span>
            {pool.pricePerSquare != null && pool.pricePerSquare > 0 && myCount > 0 && (
              <span className="text-slate-400">
                Your total: <span className="font-medium text-emerald-400">
                  ${(myCount * Number(pool.pricePerSquare)).toFixed(2)}
                </span>
              </span>
            )}
          </span>
        )}
      </div>

      {winningSquaresArray.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-emerald-800 bg-emerald-900/30 px-4 py-2 text-emerald-200">
          <span className="flex items-center gap-2 font-medium">
            <TrophyIcon className="h-5 w-5 shrink-0 text-emerald-400" />
            Winner{winningSquaresArray.length !== 1 ? "s" : ""}:
          </span>
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {winningSquaresArray.map(([wr, wc]) => {
              const sq = squares.find((s) => s.row === wr && s.col === wc);
              const label = sq?.ownerName?.trim() ? `${sq.ownerName} (${wr + 1}, ${wc + 1})` : `Row ${wr + 1}, Col ${wc + 1}`;
              return <span key={`${wr}-${wc}`}>{label}</span>;
            })}
          </span>
        </div>
      )}

      {isAdmin && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm">
          {selectingWinner ? (
            <>
              <span className="text-slate-300">Click squares to add or remove winners (click again to remove).</span>
              <button
                type="button"
                onClick={() => setSelectingWinner(false)}
                className="rounded bg-slate-600 px-2 py-1 text-slate-200 hover:bg-slate-500"
              >
                Done
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setSelectingWinner(true)}
                disabled={settingWinner}
                className="rounded bg-amber-600 px-3 py-1.5 font-medium text-white hover:bg-amber-500 disabled:opacity-50"
              >
                Set winning squares
              </button>
              {winningSquaresArray.length > 0 && (
                <button
                  type="button"
                  onClick={clearAllWinningSquares}
                  disabled={settingWinner}
                  className="rounded border border-slate-600 px-3 py-1.5 text-slate-300 hover:bg-slate-700"
                >
                  Clear all winners
                </button>
              )}
            </>
          )}
        </div>
      )}

      <div className="mb-6 w-full overflow-x-auto overflow-y-visible text-center sm:overflow-visible" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="pool-grid-wrapper inline-block w-max rounded-lg border border-slate-700 bg-slate-900/50 p-2 text-left sm:p-3">
          <div className="flex flex-col items-center">
            <div className="mb-1.5 text-sm font-bold uppercase tracking-wide text-amber-400 sm:mb-2 sm:text-base">{teamColName}</div>
            <div className="flex items-stretch gap-2 sm:gap-3">
              <div className="flex w-6 shrink-0 items-center justify-end sm:w-8">
                <div
                  className="flex flex-col-reverse items-center font-bold uppercase leading-none tracking-wide text-amber-400 text-sm sm:text-base"
                  style={{ gap: "0.025em" }}
                >
                  {teamRowName.split("").map((char, i) => (
                    <span
                      key={`${i}-${char}`}
                      className="inline-block h-[1em] leading-none"
                      style={{ transform: "rotate(-90deg)" }}
                    >
                      {char}
                    </span>
                  ))}
                </div>
              </div>
              <div
                className="inline-grid gap-1 sm:gap-1.5"
                style={{
                  gridTemplateColumns: `var(--pool-label-size) repeat(${gridSize}, minmax(0, var(--pool-cell-size)))`,
                  gridTemplateRows: `var(--pool-label-size) repeat(${gridSize}, minmax(0, var(--pool-cell-size)))`,
                }}
              >
        {/* Top-left corner */}
        <div className="flex items-center justify-center rounded bg-slate-800/80 text-xs text-slate-500" />
        {/* Column numbers (top row) */}
        {Array.from({ length: gridSize }, (_, c) => (
          <div
            key={`col-${c}`}
            className="flex items-center justify-center rounded bg-slate-800/80 text-xs font-medium text-slate-300"
          >
            {showColNum(c)}
          </div>
        ))}
        {/* Rows: row number + squares */}
        {Array.from({ length: gridSize }, (_, r) => (
          <React.Fragment key={r}>
            <div className="flex items-center justify-center rounded bg-slate-800/80 text-xs font-medium text-slate-300">
              {showRowNum(r)}
            </div>
            {Array.from({ length: gridSize }, (_, c) => {
              const square = grid.find((g) => g.row === r && g.col === c)?.square;
              const claimed = !!square?.ownerId;
              const canUnclaim = claimed && (isAdmin || square?.ownerId === currentUserId);
              const unclaimKey = `unclaim-${r}-${c}`;
              const isUnclaiming = unclaiming === unclaimKey;
              const ownerColors = square?.ownerId ? colorsForOwner(square.ownerId) : null;
              const isWinningSquare = winningSquaresArray.some(([wr, wc]) => wr === r && wc === c);

              if (selectingWinner && isAdmin) {
                return (
                  <button
                    key={`${r}-${c}`}
                    type="button"
                    onClick={() => toggleWinningSquare(r, c)}
                    className={`flex flex-col items-center justify-center gap-0 rounded text-[10px] font-medium transition ${
                      isWinningSquare ? "bg-emerald-600 text-white" : claimed ? "text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    }`}
                    style={!isWinningSquare && claimed && ownerColors ? { backgroundColor: ownerColors.bg } : undefined}
                    title={isWinningSquare ? "Winning square (click to remove)" : "Click to add as winner"}
                  >
                    {isWinningSquare ? (
                      <>
                        <TrophyIcon className="h-3.5 w-3.5" />
                        <span className="truncate max-w-full px-0.5">{squareLabel(square?.ownerName)}</span>
                      </>
                    ) : (
                      <span className="truncate max-w-full px-0.5">{claimed ? squareLabel(square?.ownerName) : ""}</span>
                    )}
                  </button>
                );
              }

              if (isWinningSquare) {
                return (
                  <div
                    key={`${r}-${c}`}
                    className="flex flex-col items-center justify-center gap-0 rounded bg-emerald-600 text-white"
                    title={square?.ownerName ? `Winner: ${square.ownerName}` : "Winning square"}
                  >
                    <TrophyIcon className="h-3.5 w-3.5 shrink-0" />
                    <span className="text-[10px] font-medium leading-tight truncate max-w-full px-0.5" title={square?.ownerName ?? undefined}>
                      {squareLabel(square?.ownerName)}
                    </span>
                  </div>
                );
              }

              if (canUnclaim) {
                return (
                  <div
                    key={`${r}-${c}`}
                    className="flex flex-col items-center justify-center gap-0 rounded text-white"
                    style={ownerColors ? { backgroundColor: ownerColors.bg } : undefined}
                    title={square?.ownerName ? `Claimed by ${square.ownerName}` : "Claimed"}
                  >
                    <span className="text-[10px] font-medium leading-tight truncate max-w-full px-0.5" title={square?.ownerName ?? undefined}>
                      {squareLabel(square?.ownerName)}
                    </span>
                    <button
                      type="button"
                      disabled={isUnclaiming || (unclaiming !== null && !isUnclaiming)}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnclaim(r, c);
                      }}
                      className="flex items-center justify-center rounded px-0.5 text-[10px] opacity-90 hover:opacity-100 disabled:opacity-50 min-w-[1.25rem]"
                      title={square?.ownerId === currentUserId ? "Unclaim (change your mind)" : `Unclaim (admin: was ${square?.ownerName ?? "claimed"})`}
                    >
                      {isUnclaiming ? (
                        <LoadingSpinner size="sm" className="h-3 w-3" />
                      ) : (
                        "×"
                      )}
                    </button>
                  </div>
                );
              }
              const selected = isSelected(r, c);
              return (
                <button
                  key={`${r}-${c}`}
                  type="button"
                  disabled={!isOpen || claimed || !square || claimSubmitting}
                  onClick={() => (claimed || !square ? undefined : handleSelectForClaim(r, c, square))}
                  className={`flex flex-col items-center justify-center rounded text-[10px] font-medium transition ${
                    claimed
                      ? "text-white"
                      : selected
                        ? "ring-2 ring-[#fbbf24] ring-offset-1 ring-offset-slate-900 bg-emerald-950 text-emerald-100"
                        : isOpen
                          ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                          : "bg-slate-800 text-slate-500"
                  }`}
                  style={claimed && ownerColors ? { backgroundColor: ownerColors.bg } : undefined}
                  title={square?.ownerName ? `Claimed by ${square.ownerName}` : isOpen ? (selected ? "Selected — use Claim bar below" : "Click to select, then claim below") : "Pool closed"}
                >
                  {claimed ? (
                    <span className="truncate max-w-full px-0.5" title={square?.ownerName ?? undefined}>
                      {squareLabel(square?.ownerName)}
                    </span>
                  ) : selected ? (
                    <FootballIcon className="h-5 w-5 sm:h-6 sm:w-6 text-amber-200" />
                  ) : (
                    ""
                  )}
                </button>
              );
            })}
          </React.Fragment>
        ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {claimSubmitting && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40" aria-live="polite">
          <div className="flex items-center gap-3 rounded-xl border border-amber-700/50 bg-slate-800 px-5 py-3 shadow-xl">
            <LoadingSpinner size="sm" className="shrink-0" />
            <span className="font-medium text-amber-200">Claiming square…</span>
          </div>
        </div>
      )}

      {unclaiming !== null && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40" aria-live="polite">
          <div className="flex items-center gap-3 rounded-xl border border-slate-600 bg-slate-800 px-4 py-2.5 shadow-xl">
            <LoadingSpinner size="sm" className="shrink-0" />
            <span className="text-sm font-medium text-slate-200">Unclaiming…</span>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3 rounded-lg border border-slate-700/80 bg-slate-800/50 px-3 py-2.5 text-xs text-slate-400 sm:px-4 sm:text-sm">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <span className="font-medium text-slate-500">Key:</span>
          <span className="inline-flex items-center gap-2">
            <span className="inline-block h-5 w-5 shrink-0 rounded bg-slate-700" aria-hidden />
            <span>Available</span>
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="inline-block h-5 w-5 shrink-0 rounded bg-slate-800" aria-hidden />
            <span>Closed / unclaimed</span>
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="inline-block h-5 w-5 shrink-0 rounded" style={{ backgroundColor: colorsForOwner("sample").bg }} aria-hidden />
            <span>Claimed (initials shown)</span>
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded bg-emerald-600 text-white" aria-hidden>
              <TrophyIcon className="h-3 w-3" />
            </span>
            <span>Winning square</span>
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-slate-700/60 pt-2">
          <span className="font-medium text-slate-500">Winners:</span>
          <span className="inline-flex items-center gap-2">
            <TrophyIcon className="h-4 w-4 shrink-0 text-amber-400" aria-hidden />
            <span>Q1 Winner</span>
          </span>
          <span className="inline-flex items-center gap-2">
            <TrophyIcon className="h-4 w-4 shrink-0 text-amber-400" aria-hidden />
            <span>Halftime Winner</span>
          </span>
          <span className="inline-flex items-center gap-2">
            <TrophyIcon className="h-4 w-4 shrink-0 text-amber-400" aria-hidden />
            <span>Q3 Winner</span>
          </span>
          <span className="inline-flex items-center gap-2">
            <TrophyIcon className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
            <span>Final Winner</span>
          </span>
        </div>
      </div>

    </div>
  );
}
