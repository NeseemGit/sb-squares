"use client";

import Link from "next/link";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { useBackendConfigured } from "./AmplifyProvider";
import { AuthGuard } from "./AuthGuard";

function HeaderNavWithAuth() {
  const { signOut } = useAuthenticator((context) => [context.signOut]);

  return (
    <nav className="flex items-center gap-6">
      <Link
        href="/pools"
        className="text-slate-300 transition hover:text-white"
      >
        Pools
      </Link>
      <AuthGuard
        fallback={
          <>
            <Link
              href="/login"
              className="text-slate-300 transition hover:text-white"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-amber-600 px-4 py-2 font-medium text-white transition hover:bg-amber-500"
            >
              Sign up
            </Link>
          </>
        }
      >
        <Link
          href="/dashboard"
          className="text-slate-300 transition hover:text-white"
        >
          My squares
        </Link>
        <Link
          href="/admin"
          className="text-slate-300 transition hover:text-white"
        >
          Admin
        </Link>
        <button
          type="button"
          onClick={signOut}
          className="text-slate-400 transition hover:text-white"
        >
          Sign out
        </button>
      </AuthGuard>
    </nav>
  );
}

function HeaderNavWithoutAuth() {
  return (
    <nav className="flex items-center gap-6">
      <Link
        href="/pools"
        className="text-slate-300 transition hover:text-white"
      >
        Pools
      </Link>
      <Link
        href="/login"
        className="text-slate-300 transition hover:text-white"
      >
        Log in
      </Link>
      <Link
        href="/signup"
        className="rounded-lg bg-amber-600 px-4 py-2 font-medium text-white transition hover:bg-amber-500"
      >
        Sign up
      </Link>
    </nav>
  );
}

export function HeaderNav() {
  const configured = useBackendConfigured();

  if (configured) {
    return <HeaderNavWithAuth />;
  }

  return <HeaderNavWithoutAuth />;
}
