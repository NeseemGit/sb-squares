import Link from "next/link";

export default function HomePage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-20 text-center">
      <h1 className="mb-4 text-4xl font-bold tracking-tight text-white md:text-5xl">
        SB Squares
      </h1>
      <p className="mb-8 text-lg text-slate-400">
        Create and join squares pools for the big game. Pick your squares, watch
        the scoreboard, and win.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/pools"
          className="rounded-lg bg-amber-600 px-6 py-3 font-medium text-white transition hover:bg-amber-500"
        >
          Browse pools
        </Link>
        <Link
          href="/signup"
          className="rounded-lg border border-slate-600 bg-slate-800/50 px-6 py-3 font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
        >
          Sign up
        </Link>
      </div>
      <div className="mt-16 grid gap-8 text-left md:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="mb-2 font-semibold text-amber-400">Join a pool</h2>
          <p className="text-sm text-slate-400">
            Sign up, browse open pools, and claim your squares before the game.
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="mb-2 font-semibold text-amber-400">Track scores</h2>
          <p className="text-sm text-slate-400">
            Row and column numbers are drawn. Match the score digits to win.
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="mb-2 font-semibold text-amber-400">Run a pool</h2>
          <p className="text-sm text-slate-400">
            Admins can create pools, set the grid, and assign numbers.
          </p>
        </div>
      </div>
    </section>
  );
}
