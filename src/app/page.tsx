import Link from "next/link";

function IconHidden({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className ?? "h-6 w-6"} aria-hidden>
      <path d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m3.65 3.65a10.477 10.477 0 0 1-4.293 5.774" />
    </svg>
  );
}

function IconRandom({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className ?? "h-6 w-6"} aria-hidden>
      <path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
    </svg>
  );
}

function IconCommish({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className ?? "h-6 w-6"} aria-hidden>
      <path d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2Zm10-10V7a4 4 0 0 0-8 0v4h8Z" />
    </svg>
  );
}

function IconTrophy({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className ?? "h-4 w-4"} aria-hidden>
      <path fillRule="evenodd" d="M5.166 2.621v.858a47.68 47.68 0 0 0-3.071.543.75.75 0 0 0-.584.859 6.753 6.753 0 0 0 6.138 5.6 6.73 6.73 0 0 0 2.743 1.346A6.707 6.707 0 0 1 9.279 15H8.54c-1.036 0-1.875.84-1.875 1.875V19.5h-.75a2.25 2.25 0 0 0-2.25 2.25c0 .414.336.75.75.75h15a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-2.25-2.25h-.75v-2.625c0-1.036-.84-1.875-1.875-1.875h-.739a6.706 6.706 0 0 1-1.112-3.173 6.73 6.73 0 0 0 2.743-1.347 6.753 6.753 0 0 0 6.139-5.6.75.75 0 0 0-.585-.858 47.077 47.077 0 0 0-3.07-.543V2.62a.75.75 0 0 0-.658-.744 49.22 49.22 0 0 0-6.093-.377c-2.063 0-4.096.128-6.093.377a.75.75 0 0 0-.657.744z" clipRule="evenodd" />
    </svg>
  );
}

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-20">
      {/* Hero */}
      <section className="text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-white md:text-5xl">
          SB Squares
        </h1>
        <p className="mb-8 text-lg text-slate-400">
          Create and join squares pools for the big game. Pick your squares,
          watch the scoreboard, and win.
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
      </section>

      {/* Section separator */}
      <div className="mt-16 border-t border-slate-800/80 pt-16">
        {/* How it works */}
        <section>
          <h2 className="mb-2 text-center text-3xl font-semibold tracking-tight text-white md:text-4xl">
            How it works
          </h2>
          <p className="mb-10 text-center text-slate-500">
            Four steps from joining to winning.
          </p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="group rounded-xl border border-slate-800 bg-slate-900/50 p-5 transition duration-200 hover:-translate-y-0.5 hover:border-amber-500/20 hover:shadow-lg hover:shadow-amber-500/5">
              <span className="mb-3 inline-block rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400">
                Step 1
              </span>
              <h3 className="mb-1.5 font-semibold text-white">Join a pool</h3>
              <p className="text-sm leading-relaxed text-slate-500">
                Sign up, browse open pools, and pick a pool for the big game.
              </p>
            </div>
            <div className="group rounded-xl border border-slate-800 bg-slate-900/50 p-5 transition duration-200 hover:-translate-y-0.5 hover:border-amber-500/20 hover:shadow-lg hover:shadow-amber-500/5">
              <span className="mb-3 inline-block rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400">
                Step 2
              </span>
              <h3 className="mb-1.5 font-semibold text-white">Claim squares</h3>
              <p className="text-sm leading-relaxed text-slate-500">
                Choose your squares on the grid and add your name or initials.
              </p>
            </div>
            <div className="group rounded-xl border border-slate-800 bg-slate-900/50 p-5 transition duration-200 hover:-translate-y-0.5 hover:border-amber-500/20 hover:shadow-lg hover:shadow-amber-500/5">
              <span className="mb-3 inline-block rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400">
                Step 3
              </span>
              <h3 className="mb-1.5 font-semibold text-white">Numbers assigned</h3>
              <p className="text-sm leading-relaxed text-slate-500">
                Numbers are hidden and randomly assigned when the grid fills (or at
                kickoff). No picking—pure luck.
              </p>
            </div>
            <div className="group rounded-xl border border-slate-800 bg-slate-900/50 p-5 transition duration-200 hover:-translate-y-0.5 hover:border-amber-500/20 hover:shadow-lg hover:shadow-amber-500/5">
              <span className="mb-3 inline-block rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400">
                Step 4
              </span>
              <h3 className="mb-1.5 font-semibold text-white">Track winners</h3>
              <p className="text-sm leading-relaxed text-slate-500">
                Match the last digit of each team’s score to your row and column.
                Winners by quarter and final.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Fair by design */}
      <div className="mt-16 border-t border-slate-800/80 pt-16">
        <section>
          <h2 className="mb-2 text-center text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Fair by design
          </h2>
          <p className="mb-10 text-center text-slate-500">
            Transparent rules. No surprises.
          </p>
          <div className="grid gap-5 sm:grid-cols-3">
            <div className="flex flex-col rounded-xl border border-slate-800 bg-slate-900/50 p-5">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                <IconHidden className="h-5 w-5" />
              </div>
              <h3 className="mb-1.5 font-semibold text-white">Hidden numbers</h3>
              <p className="text-sm leading-relaxed text-slate-500">
                Numbers stay hidden until the commish reveals them—no peeking.
              </p>
            </div>
            <div className="flex flex-col rounded-xl border border-slate-800 bg-slate-900/50 p-5">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                <IconRandom className="h-5 w-5" />
              </div>
              <h3 className="mb-1.5 font-semibold text-white">Random assignment</h3>
              <p className="text-sm leading-relaxed text-slate-500">
                Assignment when the grid fills (or at kickoff). No spreadsheets, no arguments.
              </p>
            </div>
            <div className="flex flex-col rounded-xl border border-slate-800 bg-slate-900/50 p-5">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                <IconCommish className="h-5 w-5" />
              </div>
              <h3 className="mb-1.5 font-semibold text-white">Commish controls</h3>
              <p className="text-sm leading-relaxed text-slate-500">
                Lock the grid, reveal numbers, and set winners—all in one place.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Game Day Mode */}
      <div className="mt-16 border-t border-slate-800/80 pt-16">
        <section className="lg:grid lg:grid-cols-2 lg:gap-10 lg:items-start">
          <div className="min-w-0">
            <h2 className="mb-2 text-3xl font-semibold tracking-tight text-white md:text-4xl">
              Game Day Mode
            </h2>
            <p className="mb-6 text-slate-500">
              When the game is on, the board comes alive. See who’s winning in
              real time without refreshing.
            </p>
            <ul className="list-outside list-disc space-y-2 pl-5 text-sm text-slate-500">
              <li>
                <span className="font-medium text-slate-300">Highlighted winning squares</span>—trophy
                on the square when a quarter or the final is won.
              </li>
              <li>
                <span className="font-medium text-slate-300">Quarter winner banners</span>—see who won
                Q1, Halftime, Q3, and Final at a glance.
              </li>
              <li>
                <span className="font-medium text-slate-300">Overtime counts for final</span>—the last
                digit of the final score (including OT) decides the final winner.
              </li>
            </ul>
          </div>
          <div className="mt-8 min-w-0 lg:mt-0">
            <div className="rounded-xl border border-slate-700/80 bg-slate-800/40 p-5 shadow-inner">
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">
                Winners preview
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 rounded-lg bg-slate-800/80 px-3 py-2 text-sm">
                  <IconTrophy className="h-4 w-4 shrink-0 text-amber-400" />
                  <span className="text-slate-300">Q1 Winner</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-slate-800/80 px-3 py-2 text-sm">
                  <IconTrophy className="h-4 w-4 shrink-0 text-amber-400" />
                  <span className="text-slate-300">Halftime Winner</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-slate-800/80 px-3 py-2 text-sm">
                  <IconTrophy className="h-4 w-4 shrink-0 text-amber-400" />
                  <span className="text-slate-300">Q3 Winner</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-emerald-900/30 px-3 py-2 text-sm ring-1 ring-emerald-500/20">
                  <IconTrophy className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span className="font-medium text-emerald-200">Final Winner</span>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-slate-700/60 pt-3 text-xs text-slate-500">
                <span className="font-medium text-slate-500">Key:</span>
                <span>Q1 Winner — 1st quarter score</span>
                <span>Halftime Winner — 2nd quarter</span>
                <span>Q3 Winner — 3rd quarter</span>
                <span className="text-emerald-400/90">Final Winner — game final (incl. OT)</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Commish's Corner */}
      <section className="mt-16 border-t border-slate-800/80 pt-16 text-center">
        <p className="text-lg italic text-slate-500">
          Claim squares. Watch football. Blame luck.
        </p>
      </section>
    </div>
  );
}
