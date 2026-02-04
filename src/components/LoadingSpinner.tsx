"use client";

type LoadingSpinnerProps = {
  size?: "sm" | "md";
  className?: string;
};

export function LoadingSpinner({ size = "md", className = "" }: LoadingSpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`loading-spinner ${size === "sm" ? "loading-spinner-sm" : ""} ${className}`.trim()}
    />
  );
}

type LoadingScreenProps = {
  message?: string;
};

export function LoadingScreen({ message = "Loading…" }: LoadingScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <LoadingSpinner />
      <p className="text-sm text-slate-400">{message}</p>
    </div>
  );
}
