"use client";

import { useAuthenticator } from "@aws-amplify/ui-react";

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
