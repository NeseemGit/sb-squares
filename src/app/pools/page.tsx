"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>();

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  OPEN: "Open",
  CLOSED: "Closed",
  COMPLETED: "Completed",
};

export default function PoolsPage() {
  const [pools, setPools] = useState<Schema["Pool"]["type"][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="mb-8 text-2xl font-bold text-white">Pools</h1>
        <p className="text-slate-400">Loading pools…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="mb-8 text-2xl font-bold text-white">Pools</h1>
        <p className="rounded-lg bg-red-900/20 p-4 text-red-400">
          {error}. Run <code className="rounded bg-slate-800 px-1">npx ampx sandbox</code> and ensure{" "}
          <code className="rounded bg-slate-800 px-1">amplify_outputs.json</code> is updated.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
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
                <div className="mt-3 flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      pool.status === "OPEN"
                        ? "bg-emerald-900/50 text-emerald-400"
                        : pool.status === "COMPLETED"
                          ? "bg-slate-700 text-slate-400"
                          : "bg-slate-700 text-slate-400"
                    }`}
                  >
                    {STATUS_LABELS[pool.status ?? "DRAFT"] ?? pool.status}
                  </span>
                  <span className="text-xs text-slate-500">
                    {pool.gridSize}×{pool.gridSize} · {pool.eventDate}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
