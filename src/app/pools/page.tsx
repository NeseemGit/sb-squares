"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { generateClient } from "aws-amplify/data";
import { PoolStatusBadges } from "@/components/PoolStatusBadges";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>();

const SIGNUP_DISPLAY_NAME_KEY = "signupDisplayName";
const SIGNUP_EMAIL_KEY = "signupEmail";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  OPEN: "Open",
  CLOSED: "Closed",
  COMPLETED: "Completed",
};

export default function PoolsPage() {
  const { user } = useAuthenticator((c) => [c.user]);
  const [pools, setPools] = useState<Schema["Pool"]["type"][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userId = user?.userId ?? "";
  const loginId = user?.signInDetails?.loginId ?? "";

  // Apply signup display name / email from sessionStorage (set after signup)
  useEffect(() => {
    if (typeof window === "undefined" || !userId) return;
    const pendingDisplayName = sessionStorage.getItem(SIGNUP_DISPLAY_NAME_KEY);
    const pendingEmail = sessionStorage.getItem(SIGNUP_EMAIL_KEY);
    if (!pendingDisplayName && !pendingEmail) return;

    (async () => {
      try {
        const { data: items } = await client.models.UserProfile.listUserProfileByUserId({ userId });
        const existing = items[0] ?? null;
        const displayName = (pendingDisplayName || existing?.displayName || loginId).trim() || loginId;
        const email = (pendingEmail || existing?.email || loginId).trim() || loginId;

        if (existing) {
          await client.models.UserProfile.update({
            id: existing.id,
            displayName,
            email,
          });
        } else {
          await client.models.UserProfile.create({
            userId,
            displayName,
            email,
          });
        }
      } finally {
        sessionStorage.removeItem(SIGNUP_DISPLAY_NAME_KEY);
        sessionStorage.removeItem(SIGNUP_EMAIL_KEY);
      }
    })();
  }, [userId, loginId]);

  useEffect(() => {
    const listOptions = { authMode: "apiKey" as const };
    const sub = client.models.Pool.observeQuery(listOptions).subscribe({
      next: ({ items }) => setPools([...items]),
      error: (e) => {
        setError(e.message);
        setLoading(false);
      },
    });
    client.models.Pool.list(listOptions).then(() => setLoading(false)).catch(() => {});
    return () => sub.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="mb-8 text-2xl font-bold text-white">Pools</h1>
        <p className="text-slate-400">Loading pools…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="mb-8 text-2xl font-bold text-white">Pools</h1>
        <p className="rounded-lg bg-red-900/20 p-4 text-red-400">
          {error}. Run <code className="rounded bg-slate-800 px-1">npx ampx sandbox</code> and ensure{" "}
          <code className="rounded bg-slate-800 px-1">amplify_outputs.json</code> is updated.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-8 text-2xl font-bold text-white">Pools</h1>
      {pools.length === 0 ? (
        <p className="rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-center text-slate-400">
          No pools yet. Admins can create the first pool.
        </p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {pools.map((pool) => (
            <li key={pool.id}>
              <Link
                href={`/pools/${pool.id}`}
                className="block rounded-xl border border-slate-800 bg-slate-900/50 p-6 transition hover:border-amber-600/50 hover:bg-slate-900"
              >
                <h2 className="font-semibold text-white">{pool.name}</h2>
                {pool.description && (
                  <p className="mt-1 text-sm text-slate-400 line-clamp-2">
                    {pool.description}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <PoolStatusBadges
                    status={pool.status}
                    numbersRevealed={pool.numbersRevealed === true}
                    hasWinners={(() => {
                      try {
                        const w = pool.winningSquares;
                        if (!w) return false;
                        const arr = JSON.parse(w) as unknown[];
                        return Array.isArray(arr) && arr.length > 0;
                      } catch {
                        return false;
                      }
                    })()}
                  />
                  <span className="text-xs text-slate-500">
                    {pool.gridSize}×{pool.gridSize} · {pool.eventDate}
                  </span>
                  {pool.pricePerSquare != null && pool.pricePerSquare > 0 && (
                    <span className="text-xs text-amber-400">
                      ${Number(pool.pricePerSquare).toFixed(2)}/square
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
