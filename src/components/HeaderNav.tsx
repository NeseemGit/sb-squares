"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { useBackendConfigured } from "./AmplifyProvider";
import { AuthGuard } from "./AuthGuard";

function MenuIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    );
  }
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

const linkBase = "rounded-lg text-slate-300 transition hover:bg-slate-800 hover:text-white";
const linkMobile = "flex min-h-[44px] w-full items-center px-4 py-3 text-left";
const linkDesktop = "min-h-[44px] min-w-[44px] flex items-center justify-center sm:min-h-0 sm:min-w-0 sm:justify-start";

function HeaderNavWithAuth() {
  const { signOut } = useAuthenticator((context) => [context.signOut]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const handler = () => setMenuOpen(false);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { fetchAuthSession } = await import("aws-amplify/auth");
        const { tokens } = await fetchAuthSession();
        const fromId = (tokens?.idToken?.payload["cognito:groups"] as string[] | undefined) ?? [];
        const fromAccess = (tokens?.accessToken?.payload["cognito:groups"] as string[] | undefined) ?? [];
        const groups = [...new Set([...fromId, ...fromAccess])];
        setIsAdmin(groups.includes("Admins"));
      } catch {
        setIsAdmin(false);
      }
    })();
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      {/* Desktop nav */}
      <nav className="hidden items-center gap-2 sm:flex sm:gap-6">
        <Link href="/pools" className={`${linkBase} ${linkDesktop}`}>
          Pools
        </Link>
        <AuthGuard
          fallback={
            <>
              <Link href="/login" className={`${linkBase} ${linkDesktop}`}>
                Log in
              </Link>
              <Link
                href="/signup"
                className="flex min-h-[44px] items-center justify-center rounded-lg bg-amber-600 px-4 py-2 font-medium text-white transition hover:bg-amber-500"
              >
                Sign up
              </Link>
            </>
          }
        >
          <Link href="/account" className={`${linkBase} ${linkDesktop}`}>
            Account
          </Link>
          {isAdmin && (
            <Link href="/admin" className={`${linkBase} ${linkDesktop}`}>
              Admin
            </Link>
          )}
          <button
            type="button"
            onClick={signOut}
            className={`${linkBase} min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 sm:min-h-0 sm:min-w-0`}
          >
            Sign out
          </button>
        </AuthGuard>
      </nav>

      {/* Mobile: hamburger + menu */}
      <div className="relative sm:hidden">
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-300 transition hover:bg-slate-800 hover:text-white"
          aria-expanded={menuOpen}
          aria-controls="mobile-nav-menu"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          <MenuIcon open={menuOpen} />
        </button>

        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/50"
              aria-hidden
              onClick={closeMenu}
            />
            <div
              id="mobile-nav-menu"
              className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-slate-700 bg-slate-900 py-2 shadow-xl"
              role="dialog"
              aria-label="Navigation menu"
            >
              <Link
                href="/pools"
                className={`${linkBase} ${linkMobile}`}
                onClick={closeMenu}
              >
                Pools
              </Link>
              <AuthGuard
                fallback={
                  <>
                    <Link href="/login" className={`${linkBase} ${linkMobile}`} onClick={closeMenu}>
                      Log in
                    </Link>
                    <Link
                      href="/signup"
                      className={`flex min-h-[44px] items-center px-4 py-3 text-left font-medium text-white transition hover:bg-slate-800 rounded-lg bg-amber-600`}
                      onClick={closeMenu}
                    >
                      Sign up
                    </Link>
                  </>
                }
              >
                <Link href="/account" className={`${linkBase} ${linkMobile}`} onClick={closeMenu}>
                  Account
                </Link>
                {isAdmin && (
                  <Link href="/admin" className={`${linkBase} ${linkMobile}`} onClick={closeMenu}>
                    Admin
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => {
                    signOut();
                    closeMenu();
                  }}
                  className={`${linkBase} ${linkMobile} w-full text-left text-slate-400`}
                >
                  Sign out
                </button>
              </AuthGuard>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function HeaderNavWithoutAuth() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setMenuOpen(false);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      {/* Desktop nav */}
      <nav className="hidden items-center gap-2 sm:flex sm:gap-6">
        <Link href="/pools" className={`${linkBase} ${linkDesktop}`}>
          Pools
        </Link>
        <Link href="/login" className={`${linkBase} ${linkDesktop}`}>
          Log in
        </Link>
        <Link
          href="/signup"
          className="flex min-h-[44px] items-center justify-center rounded-lg bg-amber-600 px-4 py-2 font-medium text-white transition hover:bg-amber-500"
        >
          Sign up
        </Link>
      </nav>

      {/* Mobile: hamburger + menu */}
      <div className="relative sm:hidden">
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-300 transition hover:bg-slate-800 hover:text-white"
          aria-expanded={menuOpen}
          aria-controls="mobile-nav-menu-guest"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          <MenuIcon open={menuOpen} />
        </button>

        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/50"
              aria-hidden
              onClick={closeMenu}
            />
            <div
              id="mobile-nav-menu-guest"
              className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-slate-700 bg-slate-900 py-2 shadow-xl"
              role="dialog"
              aria-label="Navigation menu"
            >
              <Link href="/pools" className={`${linkBase} ${linkMobile}`} onClick={closeMenu}>
                Pools
              </Link>
              <Link href="/login" className={`${linkBase} ${linkMobile}`} onClick={closeMenu}>
                Log in
              </Link>
              <Link
                href="/signup"
                className="flex min-h-[44px] items-center px-4 py-3 font-medium text-white transition hover:bg-slate-800 rounded-lg bg-amber-600"
                onClick={closeMenu}
              >
                Sign up
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export function HeaderNav() {
  const configured = useBackendConfigured();

  if (configured) {
    return <HeaderNavWithAuth />;
  }

  return <HeaderNavWithoutAuth />;
}
