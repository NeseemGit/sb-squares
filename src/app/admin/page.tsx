"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { generateClient } from "aws-amplify/data";
import { RequireAuth } from "@/components/AuthGuard";
import { DEFAULT_COMMISH_NOTES } from "@/lib/constants";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>();

const STATUS_OPTIONS = ["DRAFT", "OPEN", "CLOSED", "COMPLETED"] as const;

function AdminContent() {
  const router = useRouter();
  const { user } = useAuthenticator((c) => [c.user]);
  const [pools, setPools] = useState<Schema["Pool"]["type"][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  /** Shown next to spinner while creating pool + initializing grid. */
  const [creatingMessage, setCreatingMessage] = useState("");
  const [inAdminsGroup, setInAdminsGroup] = useState<boolean | null>(null);
  const [tokenGroups, setTokenGroups] = useState<string[] | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    eventDate: "",
    gridSize: 10,
    pricePerSquare: "",
    teamRowName: "",
    teamColName: "",
    commishNotes: DEFAULT_COMMISH_NOTES,
    prizePayouts: "",
  });
  /** Local value while editing commish notes in the pools list. */
  const [editingCommishNotes, setEditingCommishNotes] = useState<Record<string, string>>({});
  /** Local value while editing prize payouts in the pools list. */
  const [editingPrizePayouts, setEditingPrizePayouts] = useState<Record<string, string>>({});
  /** Local value while editing price in the pools list (poolId -> input value string). */
  const [editingPrice, setEditingPrice] = useState<Record<string, string>>({});
  /** Local values while editing team names in the pools list. */
  const [editingTeamRowName, setEditingTeamRowName] = useState<Record<string, string>>({});
  const [editingTeamColName, setEditingTeamColName] = useState<Record<string, string>>({});
  /** Local values while editing pool name and description in the pools list. */
  const [editingName, setEditingName] = useState<Record<string, string>>({});
  const [editingDescription, setEditingDescription] = useState<Record<string, string>>({});
  /** Local value while editing event date in the pools list. */
  const [editingEventDate, setEditingEventDate] = useState<Record<string, string>>({});
  /** Pool id currently being deleted (for loading state). */
  const [deletingPoolId, setDeletingPoolId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { fetchAuthSession } = await import("aws-amplify/auth");
        const { tokens } = await fetchAuthSession({ forceRefresh: true });
        const fromId = (tokens?.idToken?.payload["cognito:groups"] as string[] | undefined) ?? [];
        const fromAccess = (tokens?.accessToken?.payload["cognito:groups"] as string[] | undefined) ?? [];
        const groups = [...new Set([...fromId, ...fromAccess])];
        setTokenGroups(groups);
        setInAdminsGroup(groups.includes("Admins"));
      } catch {
        setTokenGroups([]);
        setInAdminsGroup(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (inAdminsGroup === false && tokenGroups !== null) {
      router.replace("/");
    }
  }, [inAdminsGroup, tokenGroups, router]);

  useEffect(() => {
    const sub = client.models.Pool.observeQuery().subscribe({
      next: ({ items }) => setPools([...items]),
      error: (e) => {
        setError(e.message);
        setLoading(false);
      },
    });
    client.models.Pool.list().then(() => setLoading(false)).catch(() => {});
    return () => sub.unsubscribe();
  }, []);

  const countSquaresInPool = async (poolId: string): Promise<number> => {
    let total = 0;
    let nextToken: string | null | undefined = undefined;
    do {
      const result: { data: Schema["Square"]["type"][]; nextToken?: string | null } =
        await client.models.Square.listSquareByPoolId({
          poolId,
          ...(nextToken ? { nextToken } : {}),
        });
      total += result.data.length;
      nextToken = result.nextToken ?? null;
    } while (nextToken);
    return total;
  };

  const createPool = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreatingMessage("Creating pool…");
    setError(null);
    const gridSize = form.gridSize;
    const expectedSquares = gridSize * gridSize;
    try {
      const price =
        form.pricePerSquare === "" ? undefined : Number(form.pricePerSquare);
      const result = await client.models.Pool.create({
        name: form.name,
        description: form.description || undefined,
        eventDate: form.eventDate,
        gridSize,
        pricePerSquare: price !== undefined && !Number.isNaN(price) ? price : undefined,
        teamRowName: form.teamRowName.trim() || undefined,
        teamColName: form.teamColName.trim() || undefined,
        commishNotes: form.commishNotes.trim() || undefined,
        prizePayouts: form.prizePayouts.trim() || undefined,
        status: "DRAFT",
      });
      const newPool = (result as { data?: Schema["Pool"]["type"] }).data ?? (result as Schema["Pool"]["type"]);
      const poolId = newPool?.id;
      if (!poolId) {
        setError("Pool was created but could not get its id.");
        return;
      }
      setCreatingMessage(`Initializing grid (${gridSize}×${gridSize})…`);
      let lastCount = 0;
      const size = newPool?.gridSize ?? gridSize ?? 10;
      for (let pass = 0; pass < 3; pass++) {
        await initSquares(poolId, size);
        lastCount = await countSquaresInPool(poolId);
        if (lastCount >= expectedSquares) break;
        if (pass < 2) {
          setCreatingMessage(`Completing grid… (${lastCount}/${expectedSquares})`);
          await new Promise((r) => setTimeout(r, 1200));
        } else {
          setError(`Grid has ${lastCount}/${expectedSquares} squares. Click Init on the pool to fill the rest.`);
        }
      }
      if (lastCount >= expectedSquares) {
        setForm({ name: "", description: "", eventDate: "", gridSize: 10, pricePerSquare: "", teamRowName: "", teamColName: "", commishNotes: DEFAULT_COMMISH_NOTES, prizePayouts: "" });
        setError(null);
      }
    } catch (e) {
      const err = e as Error & { errors?: unknown[] };
      const message = err.message ?? (err.errors?.[0] && String(err.errors[0])) ?? String(e);
      setError(message);
    } finally {
      setCreating(false);
      setCreatingMessage("");
    }
  };

  const updateStatus = async (poolId: string, status: string) => {
    try {
      await client.models.Pool.update({ id: poolId, status: status as Schema["Pool"]["type"]["status"] });
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const initSquares = async (poolId: string, gridSize: number) => {
    const maxRetries = 3;
    const retryDelayMs = 800;

    const createWithRetry = async (row: number, col: number) => {
      let lastErr: Error | null = null;
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          await client.models.Square.create({
            poolId,
            row,
            col,
          });
          return;
        } catch (e) {
          lastErr = e as Error;
          if (attempt < maxRetries - 1) {
            await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
          }
        }
      }
      throw lastErr ?? new Error("Create failed");
    };

    try {
      const existingKeys = new Set<string>();
      let nextToken: string | null | undefined = undefined;
      do {
        const result = await client.models.Square.listSquareByPoolId({
          poolId,
          ...(nextToken ? { nextToken } : {}),
        });
        for (const s of result.data) {
          existingKeys.add(`${s.row}-${s.col}`);
        }
        nextToken = (result as { nextToken?: string | null }).nextToken ?? null;
      } while (nextToken);

      for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
          if (existingKeys.has(`${r}-${c}`)) continue;
          await createWithRetry(r, c);
        }
      }
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const shuffle = (n: number): number[] => {
    const a = Array.from({ length: n }, (_, i) => i);
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const randomizeNumbers = async (poolId: string, gridSize: number) => {
    try {
      const rowNumbers = JSON.stringify(shuffle(gridSize));
      const colNumbers = JSON.stringify(shuffle(gridSize));
      await client.models.Pool.update({
        id: poolId,
        rowNumbers,
        colNumbers,
        numbersRevealed: false,
      });
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const setNumbersRevealed = async (poolId: string, revealed: boolean) => {
    try {
      await client.models.Pool.update({ id: poolId, numbersRevealed: revealed });
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const updatePrice = async (poolId: string, value: string) => {
    const num = value === "" ? undefined : Number(value);
    if (value !== "" && (Number.isNaN(num) || num! < 0)) return;
    try {
      await client.models.Pool.update({
        id: poolId,
        pricePerSquare: num,
      });
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const updateTeamNames = async (
    poolId: string,
    teamRowName: string,
    teamColName: string
  ) => {
    try {
      await client.models.Pool.update({
        id: poolId,
        teamRowName: teamRowName.trim() || undefined,
        teamColName: teamColName.trim() || undefined,
      });
      setEditingTeamRowName((prev) => {
        const next = { ...prev };
        delete next[poolId];
        return next;
      });
      setEditingTeamColName((prev) => {
        const next = { ...prev };
        delete next[poolId];
        return next;
      });
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const updateCommishNotes = async (poolId: string, commishNotes: string) => {
    try {
      await client.models.Pool.update({
        id: poolId,
        commishNotes: commishNotes.trim() || undefined,
      });
      setEditingCommishNotes((prev) => {
        const next = { ...prev };
        delete next[poolId];
        return next;
      });
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const updatePrizePayouts = async (poolId: string, prizePayouts: string) => {
    try {
      await client.models.Pool.update({
        id: poolId,
        prizePayouts: prizePayouts.trim() || undefined,
      });
      setEditingPrizePayouts((prev) => {
        const next = { ...prev };
        delete next[poolId];
        return next;
      });
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const updatePoolNameAndDescription = async (
    poolId: string,
    name: string,
    description: string
  ) => {
    try {
      await client.models.Pool.update({
        id: poolId,
        name: name.trim() || "Untitled Pool",
        description: description.trim() || undefined,
      });
      setEditingName((prev) => {
        const next = { ...prev };
        delete next[poolId];
        return next;
      });
      setEditingDescription((prev) => {
        const next = { ...prev };
        delete next[poolId];
        return next;
      });
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const updateEventDate = async (poolId: string, eventDate: string) => {
    const trimmed = eventDate.trim();
    if (!trimmed) return;
    try {
      await client.models.Pool.update({
        id: poolId,
        eventDate: trimmed,
      });
      setEditingEventDate((prev) => {
        const next = { ...prev };
        delete next[poolId];
        return next;
      });
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const deletePool = async (poolId: string) => {
    if (!confirm("Delete this pool and all its squares? This cannot be undone.")) return;
    setDeletingPoolId(poolId);
    setError(null);
    try {
      const { data: squares } = await client.models.Square.listSquareByPoolId({ poolId });
      for (const sq of squares) {
        await client.models.Square.delete({ id: sq.id });
      }
      await client.models.Pool.delete({ id: poolId });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDeletingPoolId(null);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="mb-8 text-2xl font-bold text-white">Admin</h1>
        <p className="text-slate-400">Loading…</p>
      </div>
    );
  }

  if (inAdminsGroup === false && tokenGroups !== null) {
    return null;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-8 text-2xl font-bold text-white">Admin</h1>
      {error && (
        <div className="mb-6 rounded-lg bg-red-900/20 p-4 text-red-400">
          {error}
        </div>
      )}

      <section className="mb-12 rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Create pool</h2>
        <form onSubmit={createPool} className="space-y-4">
          <fieldset disabled={creating} className={creating ? "pointer-events-none opacity-80" : undefined}>
          <div>
            <label htmlFor="name" className="mb-1 block text-sm text-slate-400">
              Name
            </label>
            <input
              id="name"
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
              placeholder="e.g. Super Bowl 2026"
            />
          </div>
          <div>
            <label htmlFor="description" className="mb-1 block text-sm text-slate-400">
              Description (optional)
            </label>
            <textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
              rows={2}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="eventDate" className="mb-1 block text-sm text-slate-400">
                Event date
              </label>
              <input
                id="eventDate"
                type="date"
                required
                value={form.eventDate}
                onChange={(e) => setForm((f) => ({ ...f, eventDate: e.target.value }))}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
              />
            </div>
            <div>
              <label htmlFor="gridSize" className="mb-1 block text-sm text-slate-400">
                Grid size
              </label>
              <input
                id="gridSize"
                type="number"
                min={5}
                max={20}
                value={form.gridSize}
                onChange={(e) =>
                  setForm((f) => ({ ...f, gridSize: parseInt(e.target.value, 10) || 10 }))
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
              />
            </div>
            <div>
              <label htmlFor="pricePerSquare" className="mb-1 block text-sm text-slate-400">
                Price per square ($)
              </label>
              <input
                id="pricePerSquare"
                type="number"
                min={0}
                step={0.01}
                placeholder="e.g. 5"
                value={form.pricePerSquare}
                onChange={(e) =>
                  setForm((f) => ({ ...f, pricePerSquare: e.target.value }))
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="teamRowName" className="mb-1 block text-sm text-slate-400">
                Team name (rows / left)
              </label>
              <input
                id="teamRowName"
                type="text"
                placeholder="e.g. Chiefs"
                value={form.teamRowName}
                onChange={(e) => setForm((f) => ({ ...f, teamRowName: e.target.value }))}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
              />
            </div>
            <div>
              <label htmlFor="teamColName" className="mb-1 block text-sm text-slate-400">
                Team name (columns / top)
              </label>
              <input
                id="teamColName"
                type="text"
                placeholder="e.g. 49ers"
                value={form.teamColName}
                onChange={(e) => setForm((f) => ({ ...f, teamColName: e.target.value }))}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
              />
            </div>
          </div>
          <div>
            <label htmlFor="commishNotes" className="mb-1 block text-sm text-slate-400">
              Commish notes (one bullet per line)
            </label>
            <textarea
              id="commishNotes"
              value={form.commishNotes}
              onChange={(e) => setForm((f) => ({ ...f, commishNotes: e.target.value }))}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
              rows={4}
              placeholder={"Numbers will be randomized once the grid fills\nPlease pay before kickoff"}
            />
          </div>
          <div>
            <label htmlFor="prizePayouts" className="mb-1 block text-sm text-slate-400">
              Prize payouts (one bullet per line)
            </label>
            <textarea
              id="prizePayouts"
              value={form.prizePayouts}
              onChange={(e) => setForm((f) => ({ ...f, prizePayouts: e.target.value }))}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
              rows={6}
              placeholder={"Q1 – 10%\nHalftime – 20%\nQ3 – 20%\nFinal – 50%\n\nFinal score includes overtime."}
            />
          </div>
          {creating && (
            <div className="flex items-center gap-3 rounded-lg border border-amber-700/50 bg-amber-900/20 px-4 py-3 text-amber-200">
              <svg
                className="h-5 w-5 shrink-0 animate-spin text-amber-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>{creatingMessage || "Please wait…"}</span>
            </div>
          )}
          <button
            type="submit"
            disabled={creating}
            className="rounded-lg bg-amber-600 px-4 py-2 font-medium text-white hover:bg-amber-500 disabled:opacity-50"
          >
            {creating ? "Please wait…" : "Create pool"}
          </button>
          </fieldset>
        </form>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-white">Pools</h2>
        {pools.length === 0 ? (
          <p className="text-slate-400">No pools yet. Create one above.</p>
        ) : (
          <ul className="space-y-5">
            {pools.map((pool) => (
              <li
                key={pool.id}
                className="overflow-hidden rounded-xl border border-slate-700/80 bg-slate-800/40 shadow-sm"
              >
                <div className="space-y-6 p-6">
                  {/* Row 1: Event date (editable) & grid size */}
                  <div className="grid gap-x-4 gap-y-2 sm:grid-cols-[1fr_auto_auto] sm:items-end">
                    <div className="flex flex-col gap-1">
                      <label htmlFor={`eventDate-${pool.id}`} className="text-xs font-medium text-slate-500">
                        Event date
                      </label>
                      <input
                        id={`eventDate-${pool.id}`}
                        type="date"
                        className="h-9 min-w-0 rounded-lg border border-slate-600 bg-slate-800/80 px-3 text-sm text-white focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                        value={
                          pool.id in editingEventDate
                            ? editingEventDate[pool.id]
                            : pool.eventDate ?? ""
                        }
                        onChange={(e) =>
                          setEditingEventDate((prev) => ({
                            ...prev,
                            [pool.id]: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <p className="flex items-center rounded-lg bg-slate-800/80 px-3 py-2 text-xs font-medium text-slate-400">
                      {pool.gridSize}×{pool.gridSize} grid
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        updateEventDate(
                          pool.id,
                          pool.id in editingEventDate
                            ? editingEventDate[pool.id]
                            : pool.eventDate ?? ""
                        )
                      }
                      className="h-9 shrink-0 rounded-lg border border-slate-600 bg-slate-700 px-4 text-sm font-medium text-white hover:bg-slate-600"
                    >
                      Save date
                    </button>
                  </div>

                  {/* Row 2: Title & description — same layout as teams */}
                  <div className="grid gap-x-4 gap-y-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                    <div className="flex flex-col gap-1">
                      <label htmlFor={`name-${pool.id}`} className="text-xs font-medium text-slate-500">
                        Title
                      </label>
                      <input
                        id={`name-${pool.id}`}
                        type="text"
                        className="h-9 min-w-0 rounded-lg border border-slate-600 bg-slate-800/80 px-3 text-sm text-white placeholder-slate-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                        placeholder="Pool name"
                        value={
                          pool.id in editingName
                            ? editingName[pool.id]
                            : pool.name ?? ""
                        }
                        onChange={(e) =>
                          setEditingName((prev) => ({
                            ...prev,
                            [pool.id]: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label htmlFor={`desc-${pool.id}`} className="text-xs font-medium text-slate-500">
                        Description
                      </label>
                      <input
                        id={`desc-${pool.id}`}
                        type="text"
                        className="h-9 min-w-0 rounded-lg border border-slate-600 bg-slate-800/80 px-3 text-sm text-white placeholder-slate-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                        placeholder="Optional"
                        value={
                          pool.id in editingDescription
                            ? editingDescription[pool.id]
                            : pool.description ?? ""
                        }
                        onChange={(e) =>
                          setEditingDescription((prev) => ({
                            ...prev,
                            [pool.id]: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        updatePoolNameAndDescription(
                          pool.id,
                          pool.id in editingName
                            ? editingName[pool.id]
                            : pool.name ?? "",
                          pool.id in editingDescription
                            ? editingDescription[pool.id]
                            : pool.description ?? ""
                        )
                      }
                      className="h-9 shrink-0 rounded-lg border border-slate-600 bg-slate-700 px-4 text-sm font-medium text-white hover:bg-slate-600"
                    >
                      Save title
                    </button>
                  </div>

                  {/* Row 3: Status — own row */}
                  <div className="grid gap-x-4 gap-y-2 sm:grid-cols-[1fr_auto] sm:items-end">
                    <div className="flex flex-col gap-1">
                      <label htmlFor={`status-${pool.id}`} className="text-xs font-medium text-slate-500">
                        Status
                      </label>
                      <select
                        id={`status-${pool.id}`}
                        value={pool.status ?? "DRAFT"}
                        onChange={(e) => updateStatus(pool.id, e.target.value)}
                        className="h-9 min-w-0 max-w-xs rounded-lg border border-slate-600 bg-slate-800/80 px-3 text-sm text-white focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Row 4: Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={`/pools/${pool.id}`}
                      className="inline-flex h-9 shrink-0 items-center rounded-lg border border-slate-600 bg-slate-700 px-3 text-sm text-white hover:bg-slate-600"
                    >
                      View
                    </a>
                    <button
                      type="button"
                      onClick={() => deletePool(pool.id)}
                      disabled={deletingPoolId === pool.id}
                      className="inline-flex h-9 shrink-0 items-center rounded-lg border border-red-800 bg-red-900/60 px-3 text-sm text-red-200 hover:bg-red-800 disabled:opacity-50"
                      title="Delete pool and all squares"
                    >
                      {deletingPoolId === pool.id ? "Deleting…" : "Delete"}
                    </button>
                    <button
                      type="button"
                      onClick={() => initSquares(pool.id, pool.gridSize)}
                      className="inline-flex h-9 shrink-0 items-center rounded-lg border border-slate-600 bg-slate-700 px-3 text-sm text-white hover:bg-slate-600"
                    >
                      Init
                    </button>
                    <button
                      type="button"
                      onClick={() => randomizeNumbers(pool.id, pool.gridSize)}
                      className="inline-flex h-9 shrink-0 items-center rounded-lg border border-slate-600 bg-slate-700 px-3 text-sm text-white hover:bg-slate-600"
                      title="Randomize row and column numbers"
                    >
                      Rand
                    </button>
                    {pool.numbersRevealed ? (
                      <button
                        type="button"
                        onClick={() => setNumbersRevealed(pool.id, false)}
                        className="inline-flex h-9 shrink-0 items-center rounded-lg border border-slate-600 bg-slate-700 px-3 text-sm text-white hover:bg-slate-600"
                      >
                        Hide #
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setNumbersRevealed(pool.id, true)}
                        className="inline-flex h-9 shrink-0 items-center rounded-lg border border-amber-700 bg-amber-700 px-3 text-sm text-white hover:bg-amber-600"
                      >
                        Reveal #
                      </button>
                    )}
                  </div>

                  {/* Row 5: Cost — own row, same layout as title/teams */}
                  <div className="grid gap-x-4 gap-y-2 sm:grid-cols-[1fr_auto] sm:items-end">
                    <div className="flex flex-col gap-1">
                      <label htmlFor={`price-${pool.id}`} className="text-xs font-medium text-slate-500">
                        Price per square
                      </label>
                      <div className="inline-flex h-9 min-w-0 max-w-xs items-center gap-2 rounded-lg border border-slate-600 bg-slate-800/80 px-3">
                        <span className="text-sm text-slate-500">$</span>
                        <input
                          id={`price-${pool.id}`}
                          type="number"
                          min={0}
                          step={0.01}
                          className="h-8 min-w-0 flex-1 border-0 bg-transparent text-sm text-white focus:outline-none"
                          placeholder="0"
                          value={
                            pool.id in editingPrice
                              ? editingPrice[pool.id]
                              : pool.pricePerSquare != null
                                ? String(pool.pricePerSquare)
                                : ""
                          }
                          onChange={(e) =>
                            setEditingPrice((prev) => ({
                              ...prev,
                              [pool.id]: e.target.value,
                            }))
                          }
                          onBlur={() => {
                            const raw = editingPrice[pool.id];
                            if (raw !== undefined) {
                              updatePrice(pool.id, raw);
                              setEditingPrice((prev) => {
                                const next = { ...prev };
                                delete next[pool.id];
                                return next;
                              });
                            }
                          }}
                        />
                        <span className="text-xs text-slate-500">/sq</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const raw =
                          pool.id in editingPrice
                            ? editingPrice[pool.id]
                            : pool.pricePerSquare != null
                              ? String(pool.pricePerSquare)
                              : "";
                        updatePrice(pool.id, raw);
                        setEditingPrice((prev) => {
                          const next = { ...prev };
                          delete next[pool.id];
                          return next;
                        });
                      }}
                      className="h-9 shrink-0 rounded-lg border border-slate-600 bg-slate-700 px-4 text-sm font-medium text-white hover:bg-slate-600"
                    >
                      Save
                    </button>
                  </div>

                  {/* Row 6: Teams — grid, aligned */}
                  <div className="grid gap-x-4 gap-y-2 border-t border-slate-700/60 pt-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                    <div className="flex flex-col gap-1">
                      <label htmlFor={`team-row-${pool.id}`} className="text-xs font-medium text-slate-500">
                        Team (rows / left)
                      </label>
                      <input
                        id={`team-row-${pool.id}`}
                        type="text"
                        className="h-9 min-w-0 rounded-lg border border-slate-600 bg-slate-800/80 px-3 text-sm text-white placeholder-slate-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                        placeholder="e.g. Patriots"
                        value={
                          pool.id in editingTeamRowName
                            ? editingTeamRowName[pool.id]
                            : pool.teamRowName ?? ""
                        }
                        onChange={(e) =>
                          setEditingTeamRowName((prev) => ({
                            ...prev,
                            [pool.id]: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label htmlFor={`team-col-${pool.id}`} className="text-xs font-medium text-slate-500">
                        Team (cols / top)
                      </label>
                      <input
                        id={`team-col-${pool.id}`}
                        type="text"
                        className="h-9 min-w-0 rounded-lg border border-slate-600 bg-slate-800/80 px-3 text-sm text-white placeholder-slate-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                        placeholder="e.g. Seahawks"
                        value={
                          pool.id in editingTeamColName
                            ? editingTeamColName[pool.id]
                            : pool.teamColName ?? ""
                        }
                        onChange={(e) =>
                          setEditingTeamColName((prev) => ({
                            ...prev,
                            [pool.id]: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        updateTeamNames(
                          pool.id,
                          pool.id in editingTeamRowName
                            ? editingTeamRowName[pool.id]
                            : pool.teamRowName ?? "",
                          pool.id in editingTeamColName
                            ? editingTeamColName[pool.id]
                            : pool.teamColName ?? ""
                        )
                      }
                      className="h-9 shrink-0 rounded-lg border border-slate-600 bg-slate-700 px-4 text-sm font-medium text-white hover:bg-slate-600"
                    >
                      Save teams
                    </button>
                  </div>

                  {/* Row: Commish notes */}
                  <div className="grid gap-x-4 gap-y-2 border-t border-slate-700/60 pt-5 sm:grid-cols-[1fr_auto] sm:items-end">
                    <div className="flex flex-col gap-1">
                      <label htmlFor={`commish-${pool.id}`} className="text-xs font-medium text-slate-500">
                        Commish notes (one per line)
                      </label>
                      <textarea
                        id={`commish-${pool.id}`}
                        rows={3}
                        className="min-w-0 rounded-lg border border-slate-600 bg-slate-800/80 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                        placeholder="Optional"
                        value={
                          pool.id in editingCommishNotes
                            ? editingCommishNotes[pool.id]
                            : pool.commishNotes?.trim() || DEFAULT_COMMISH_NOTES
                        }
                        onChange={(e) =>
                          setEditingCommishNotes((prev) => ({
                            ...prev,
                            [pool.id]: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        updateCommishNotes(
                          pool.id,
                          pool.id in editingCommishNotes
                            ? editingCommishNotes[pool.id]
                            : pool.commishNotes?.trim() || DEFAULT_COMMISH_NOTES
                        )
                      }
                      className="h-9 shrink-0 rounded-lg border border-slate-600 bg-slate-700 px-4 text-sm font-medium text-white hover:bg-slate-600"
                    >
                      Save notes
                    </button>
                  </div>

                  {/* Row: Prize payouts */}
                  <div className="grid gap-x-4 gap-y-2 border-t border-slate-700/60 pt-5 sm:grid-cols-[1fr_auto] sm:items-end">
                    <div className="flex flex-col gap-1">
                      <label htmlFor={`prize-payouts-${pool.id}`} className="text-xs font-medium text-slate-500">
                        Prize payouts (one bullet per line)
                      </label>
                      <textarea
                        id={`prize-payouts-${pool.id}`}
                        rows={5}
                        className="min-w-0 rounded-lg border border-slate-600 bg-slate-800/80 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                        placeholder={"Q1 – 10%\nHalftime – 20%\nQ3 – 20%\nFinal – 50%"}
                        value={
                          pool.id in editingPrizePayouts
                            ? editingPrizePayouts[pool.id]
                            : pool.prizePayouts ?? ""
                        }
                        onChange={(e) =>
                          setEditingPrizePayouts((prev) => ({
                            ...prev,
                            [pool.id]: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        updatePrizePayouts(
                          pool.id,
                          pool.id in editingPrizePayouts
                            ? editingPrizePayouts[pool.id]
                            : pool.prizePayouts ?? ""
                        )
                      }
                      className="h-9 shrink-0 rounded-lg border border-slate-600 bg-slate-700 px-4 text-sm font-medium text-white hover:bg-slate-600"
                    >
                      Save payouts
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default function AdminPage() {
  return (
    <RequireAuth>
      <AdminContent />
    </RequireAuth>
  );
}
