"use client";

function LockIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className ?? "h-4 w-4"} aria-hidden>
      <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z" clipRule="evenodd" />
    </svg>
  );
}

function DiceIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className ?? "h-4 w-4"} aria-hidden>
      <path d="M14.25 7.5a.75.75 0 0 1 .75.75v.75h.75a.75.75 0 0 1 0 1.5h-.75v.75a.75.75 0 0 1-1.5 0v-.75h-.75a.75.75 0 0 1 0-1.5h.75v-.75a.75.75 0 0 1 .75-.75Z" />
      <path fillRule="evenodd" d="M3 6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6Zm4.5 7.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm9-1.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm-9 4.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm9-1.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" clipRule="evenodd" />
    </svg>
  );
}

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className ?? "h-4 w-4"} aria-hidden>
      <path fillRule="evenodd" d="M5.166 2.621v.858a47.68 47.68 0 0 0-3.071.543.75.75 0 0 0-.584.859 6.753 6.753 0 0 0 6.138 5.6 6.73 6.73 0 0 0 2.743 1.346A6.707 6.707 0 0 1 9.279 15H8.54c-1.036 0-1.875.84-1.875 1.875V19.5h-.75a2.25 2.25 0 0 0-2.25 2.25c0 .414.336.75.75.75h15a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-2.25-2.25h-.75v-2.625c0-1.036-.84-1.875-1.875-1.875h-.739a6.706 6.706 0 0 1-1.112-3.173 6.73 6.73 0 0 0 2.743-1.347 6.753 6.753 0 0 0 6.139-5.6.75.75 0 0 0-.585-.858 47.077 47.077 0 0 0-3.07-.543V2.62a.75.75 0 0 0-.658-.744 49.22 49.22 0 0 0-6.093-.377c-2.063 0-4.096.128-6.093.377a.75.75 0 0 0-.657.744zm0 2.629c0 1.196.312 2.32.857 3.294A5.266 5.266 0 0 1 3.16 5.337a45.6 45.6 0 0 1 2.006-.343zm13.5 0v-.256c.674.1 1.343.214 2.006.343a5.265 5.265 0 0 1-2.863 3.207 6.72 6.72 0 0 0 .857-3.294z" clipRule="evenodd" />
    </svg>
  );
}

const ALMOST_FULL_THRESHOLD = 20;

export type PoolStatusBadgesProps = {
  status: string | null | undefined;
  numbersRevealed: boolean;
  hasWinners: boolean;
  /** When provided and pool is OPEN, show "Almost Full (X left)" when leftCount <= threshold */
  leftCount?: number;
};

export function PoolStatusBadges({ status, numbersRevealed, hasWinners, leftCount }: PoolStatusBadgesProps) {
  const isOpen = status === "OPEN";
  const isClosed = status === "CLOSED";
  const isDraft = status === "DRAFT";
  const isCompleted = status === "COMPLETED";
  const showAlmostFull = isOpen && leftCount !== undefined && leftCount <= ALMOST_FULL_THRESHOLD && leftCount > 0;

  const badges: { icon: React.ReactNode; label: string; className: string }[] = [];

  if (isDraft) {
    badges.push({
      icon: <span className="h-2 w-2 shrink-0 rounded-full bg-slate-500" aria-hidden />,
      label: "Draft",
      className: "text-slate-500",
    });
  }
  if (isOpen) {
    badges.push({
      icon: <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" aria-hidden />,
      label: "Open",
      className: "text-emerald-400",
    });
  }
  if (showAlmostFull) {
    badges.push({
      icon: <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" aria-hidden />,
      label: `Almost Full (${leftCount} left)`,
      className: "text-amber-400",
    });
  }
  if (isClosed) {
    badges.push({
      icon: <LockIcon className="h-4 w-4 shrink-0" />,
      label: "Locked",
      className: "text-slate-400",
    });
  }
  if (numbersRevealed) {
    badges.push({
      icon: <DiceIcon className="h-4 w-4 shrink-0" />,
      label: "Numbers Assigned",
      className: "text-slate-300",
    });
  }
  if (hasWinners) {
    badges.push({
      icon: <TrophyIcon className="h-4 w-4 shrink-0" />,
      label: "Final Winners Posted",
      className: "text-amber-400",
    });
  }
  if (isCompleted && !hasWinners) {
    badges.push({
      icon: <LockIcon className="h-4 w-4 shrink-0" />,
      label: "Completed",
      className: "text-slate-400",
    });
  }

  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2" role="list" aria-label="Pool status">
      {badges.map(({ icon, label, className }) => (
        <span
          key={label}
          className={`inline-flex items-center gap-2 text-sm font-medium ${className}`}
          role="listitem"
        >
          {icon}
          {label}
        </span>
      ))}
    </div>
  );
}
