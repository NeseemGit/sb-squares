"use client";

import { confirmSignUp, fetchAuthSession, signIn, signUp } from "aws-amplify/auth";
import Link from "next/link";
import { useState } from "react";

const inputClass =
  "w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500";

const SIGNUP_DISPLAY_NAME_KEY = "signupDisplayName";
const SIGNUP_EMAIL_KEY = "signupEmail";

export default function SignUpPage() {
  const [step, setStep] = useState<"signup" | "confirm">("signup");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const saveSignupProfileAndRedirect = () => {
    if (typeof sessionStorage !== "undefined") {
      if (displayName.trim()) sessionStorage.setItem(SIGNUP_DISPLAY_NAME_KEY, displayName.trim());
      sessionStorage.setItem(SIGNUP_EMAIL_KEY, email.trim());
    }
    window.location.assign("/pools");
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords don’t match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const { nextStep } = await signUp({
        username: email.trim(),
        password,
        options: {
          userAttributes: {
            email: email.trim(),
          },
        },
      });
      if (nextStep.signUpStep === "CONFIRM_SIGN_UP") {
        setStep("confirm");
        setError(null);
      } else if (nextStep.signUpStep === "DONE") {
        saveSignupProfileAndRedirect();
      }
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Sign up failed. Try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await confirmSignUp({
        username: email.trim(),
        confirmationCode: code.trim(),
      });
      // Cognito does not sign the user in after confirm — sign in so they're logged in on redirect
      await signIn({ username: email.trim(), password });
      await fetchAuthSession();
      saveSignupProfileAndRedirect();
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Invalid or expired code. Try again or request a new code.";
      setError(message);
      setLoading(false);
    }
  };

  if (step === "confirm") {
    return (
      <div className="mx-auto flex min-h-[80vh] max-w-md items-center justify-center px-4">
        <div className="w-full">
          <h1 className="mb-2 text-center text-xl font-semibold text-white">
            Check your email
          </h1>
          <p className="mb-4 text-center text-sm text-slate-400">
            We sent a confirmation code to <strong className="text-slate-300">{email}</strong>. Enter it below.
          </p>
          <form
            onSubmit={handleConfirm}
            className="space-y-4 rounded-xl border border-slate-700 bg-slate-900/50 p-6"
          >
            <div>
              <label htmlFor="code" className="mb-1 block text-sm font-medium text-slate-300">
                Confirmation code
              </label>
              <input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                className={inputClass}
                required
                autoComplete="one-time-code"
              />
            </div>
            {error && (
              <p className="text-sm text-red-400" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-amber-600 px-4 py-2 font-medium text-white hover:bg-amber-500 disabled:opacity-50"
            >
              {loading ? "Confirming…" : "Confirm"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("signup");
                setCode("");
                setError(null);
              }}
              className="w-full text-center text-sm text-slate-400 hover:text-white"
            >
              Use a different email
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md items-center justify-center px-4">
      <div className="w-full">
        <h1 className="mb-2 text-center text-xl font-semibold text-white">
          Create your DB Squares account
        </h1>
        <form
          onSubmit={handleSignUp}
          className="space-y-4 rounded-xl border border-slate-700 bg-slate-900/50 p-6"
        >
          <div>
            <label htmlFor="displayName" className="mb-1 block text-sm font-medium text-slate-300">
              Display name
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. NI or Lions"
              className={inputClass}
              autoComplete="nickname"
            />
            <p className="mt-1 text-xs text-slate-500">
              Shown on your squares. Optional.
            </p>
          </div>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={inputClass}
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-300">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className={inputClass}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-slate-300">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className={inputClass}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          {error && (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-amber-600 px-4 py-2 font-medium text-white hover:bg-amber-500 disabled:opacity-50"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
          <p className="text-center text-sm text-slate-400">
            Already have an account?{" "}
            <Link href="/login" className="text-amber-400 hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
