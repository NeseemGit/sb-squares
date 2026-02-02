"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Authenticator, useAuthenticator } from "@aws-amplify/ui-react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>();

function DashboardContent() {
  const { user } = useAuthenticator((c) => [c.user]);
  const [squares, setSquares] = useState<Schema["Square"]["type"][]>([]);
  const [pools, setPools] = useState<Record<string, Schema["Pool"]["type"]>>({});
  const [loading, setLoading] = useState(true);

  const userId = user?.userId ?? "";

  useEffect(() => {
    if (!userId) return;
    client.models.Square.list().then(({ data: items }) => {
      const mine = items.filter((s) => s.ownerId === userId);
      setSquares(mine);
      const poolIds = [...new Set(mine.map((s) => s.poolId))];
      Promise.all(poolIds.map((id) => client.models.Pool.get({ id }))).then(
        (results) => {
          const map: Record<string, Schema["Pool"]["type"]> = {};
          results.forEach(({ data: p }) => {
            if (p) map[p.id] = p;
          });
          setPools(map);
        }
      );
      setLoading(false);
    });
  }, [userId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="mb-8 text-2xl font-bold text-white">My squares</h1>
        <p className="text-slate-400">Loading…</p>
      </div>
    );
  }

  const byPool = squares.reduce<Record<string, Schema["Square"]["type"][]>>(
    (acc, s) => {
      if (!acc[s.poolId]) acc[s.poolId] = [];
      acc[s.poolId].push(s);
      return acc;
    },
    {}
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-2 text-2xl font-bold text-white">
        {user?.signInDetails?.loginId ?? "My"} squares
      </h1>
      <p className="mb-8 text-slate-400">
        Squares you’ve claimed across pools.
      </p>
      {squares.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-center">
          <p className="text-slate-400">You haven’t claimed any squares yet.</p>
          <Link
            href="/pools"
            className="mt-4 inline-block text-amber-400 hover:underline"
          >
            Browse pools
          </Link>
        </div>
      ) : (
        <ul className="space-y-6">
          {Object.entries(byPool).map(([poolId, poolSquares]) => {
            const pool = pools[poolId];
            return (
              <li
                key={poolId}
                className="rounded-xl border border-slate-800 bg-slate-900/50 p-6"
              >
                <Link
                  href={`/pools/${poolId}`}
                  className="font-semibold text-white hover:text-amber-400"
                >
                  {pool?.name ?? poolId}
                </Link>
                <p className="mt-1 text-sm text-slate-500">
                  {poolSquares.length} square{poolSquares.length !== 1 ? "s" : ""}{" "}
                  (row, col):{" "}
                  {poolSquares
                    .map((s) => `(${s.row}, ${s.col})`)
                    .join(", ")}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Authenticator hideSignUp>
      <DashboardContent />
    </Authenticator>
  );
}
