"use client";

import { useAuthenticator } from "@aws-amplify/ui-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function AuthGuard({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback: React.ReactNode;
}) {
  const { authStatus } = useAuthenticator((context) => [context.authStatus]);

  if (authStatus === "authenticated") {
    return <>{children}</>;
  }
  return <>{fallback}</>;
}

/** Redirects to homepage if not authenticated. Use for protected pages (account, admin). */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { authStatus } = useAuthenticator((context) => [context.authStatus]);
  const router = useRouter();

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.replace("/");
    }
  }, [authStatus, router]);

  if (authStatus === "unauthenticated") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-4">
        <p className="text-slate-400">Redirecting…</p>
      </div>
    );
  }
  if (authStatus !== "authenticated") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-4">
        <p className="text-slate-400">Loading…</p>
      </div>
    );
  }
  return <>{children}</>;
}
