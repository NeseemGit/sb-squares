"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { useAuthenticator } from "@aws-amplify/ui-react";

const client = generateClient<Schema>();

export default function PoolDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { authStatus } = useAuthenticator((c) => [c.authStatus]);
  const [pool, setPool] = useState<Schema["Pool"]["type"] | null>(null);
  const [squares, setSquares] = useState<Schema["Square"]["type"][]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchPool = async () => {
      try {
        const { data: p } = await client.models.Pool.get({ id });
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
    const sub = client.models.Square.observeQuery({
      filter: { poolId: { eq: id } },
    }).subscribe({
      next: ({ items }) => setSquares(items),
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

  const handleClaim = async (row: number, col: number) => {
    if (authStatus !== "authenticated") {
      router.push("/login");
      return;
    }
    const existing = squares.find((s) => s.row === row && s.col === col);
    if (!existing) {
      setError("This square isn’t set up yet. Ask the pool admin to initialize the grid.");
      return;
    }
    if (existing.ownerId) {
      setError("This square is already claimed.");
      return;
    }
    const key = `${row}-${col}`;
    setClaiming(key);
    setError(null);
    try {
      const { getCurrentUser } = await import("aws-amplify/auth");
      const { user } = await getCurrentUser();
      const userId = user?.userId ?? "";
      const name = user?.signInDetails?.loginId ?? "Me";
      await client.models.Square.update({
        id: existing.id,
        ownerId: userId,
        ownerName: name,
        claimedAt: new Date().toISOString(),
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setClaiming(null);
    }
  };

  if (loading || !pool) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        {loading ? (
          <p className="text-slate-400">Loading pool…</p>
        ) : (
          <p className="text-slate-400">Pool not found.</p>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <p className="rounded-lg bg-red-900/20 p-4 text-red-400">{error}</p>
        <Link href="/pools" className="mt-4 inline-block text-amber-400 hover:underline">
          Back to pools
        </Link>
      </div>
    );
  }

  const isOpen = pool.status === "OPEN";

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <Link href="/pools" className="mb-6 inline-block text-slate-400 hover:text-white">
        ← Pools
      </Link>
      <h1 className="mb-2 text-2xl font-bold text-white">{pool.name}</h1>
      {pool.description && (
        <p className="mb-4 text-slate-400">{pool.description}</p>
      )}
      <p className="mb-8 text-sm text-slate-500">
        Event: {pool.eventDate} · Grid: {gridSize}×{gridSize}
      </p>

      <div
        className="inline-grid gap-1 rounded-lg border border-slate-700 bg-slate-900/50 p-2"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, minmax(0, 2rem))`,
          gridTemplateRows: `repeat(${gridSize}, minmax(0, 2rem))`,
        }}
      >
        {grid.map(({ row, col, square }) => (
          <button
            key={`${row}-${col}`}
            type="button"
            disabled={!isOpen || !!square?.ownerId || claiming === `${row}-${col}`}
            onClick={() => handleClaim(row, col)}
            className={`flex items-center justify-center rounded text-xs font-medium transition ${
              square?.ownerId
                ? "bg-amber-600/80 text-white"
                : isOpen
                  ? "bg-slate-700 text-slate-300 hover:bg-amber-600/50"
                  : "bg-slate-800 text-slate-500"
            }`}
            title={square?.ownerName ? `Claimed by ${square.ownerName}` : isOpen ? "Click to claim" : "Pool closed"}
          >
            {square?.ownerId ? "•" : ""}
          </button>
        ))}
      </div>
      <p className="mt-4 text-sm text-slate-500">
        {isOpen ? "Click an empty square to claim it (must be signed in)." : "This pool is not open for claiming."}
      </p>
    </div>
  );
}
