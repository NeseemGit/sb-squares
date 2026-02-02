"use client";

import { useEffect, useState } from "react";
import { Authenticator, useAuthenticator } from "@aws-amplify/ui-react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>();

const STATUS_OPTIONS = ["DRAFT", "OPEN", "CLOSED", "COMPLETED"] as const;

function AdminContent() {
  const { user } = useAuthenticator((c) => [c.user]);
  const [pools, setPools] = useState<Schema["Pool"]["type"][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    eventDate: "",
    gridSize: 10,
  });

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

  const createPool = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      await client.models.Pool.create({
        name: form.name,
        description: form.description || undefined,
        eventDate: form.eventDate,
        gridSize: form.gridSize,
        status: "DRAFT",
      });
      setForm({ name: "", description: "", eventDate: "", gridSize: 10 });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCreating(false);
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
    try {
      const existing = await client.models.Square.listSquareByPoolId({ poolId });
      if (existing.data.length > 0) {
        setError("Squares already exist for this pool.");
        return;
      }
      for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
          await client.models.Square.create({
            poolId,
            row: r,
            col: c,
          });
        }
      }
    } catch (e) {
      setError((e as Error).message);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="mb-8 text-2xl font-bold text-white">Admin</h1>
        <p className="text-slate-400">Loading…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-8 text-2xl font-bold text-white">Admin</h1>
      {error && (
        <div className="mb-6 rounded-lg bg-red-900/20 p-4 text-red-400">
          {error}. You may need to be in the Cognito &quot;Admins&quot; group to manage pools.
        </div>
      )}

      <section className="mb-12 rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Create pool</h2>
        <form onSubmit={createPool} className="space-y-4">
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
          </div>
          <button
            type="submit"
            disabled={creating}
            className="rounded-lg bg-amber-600 px-4 py-2 font-medium text-white hover:bg-amber-500 disabled:opacity-50"
          >
            {creating ? "Creating…" : "Create pool"}
          </button>
        </form>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-white">Pools</h2>
        {pools.length === 0 ? (
          <p className="text-slate-400">No pools yet. Create one above.</p>
        ) : (
          <ul className="space-y-4">
            {pools.map((pool) => (
              <li
                key={pool.id}
                className="rounded-xl border border-slate-800 bg-slate-900/50 p-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-white">{pool.name}</h3>
                    <p className="text-sm text-slate-500">
                      {pool.eventDate} · {pool.gridSize}×{pool.gridSize} ·{" "}
                      {pool.status ?? "DRAFT"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={pool.status ?? "DRAFT"}
                      onChange={(e) => updateStatus(pool.id, e.target.value)}
                      className="rounded border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-white"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <a
                      href={`/pools/${pool.id}`}
                      className="rounded bg-slate-700 px-3 py-1.5 text-sm text-white hover:bg-slate-600"
                    >
                      View
                    </a>
                    <button
                      type="button"
                      onClick={() => initSquares(pool.id, pool.gridSize)}
                      className="rounded bg-slate-700 px-3 py-1.5 text-sm text-white hover:bg-slate-600"
                    >
                      Init squares
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
    <Authenticator hideSignUp>
      <AdminContent />
    </Authenticator>
  );
}
