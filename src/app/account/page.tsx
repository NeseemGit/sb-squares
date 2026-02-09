"use client";

import { useEffect, useState } from "react";
import { useAuthenticator } from "@aws-amplify/ui-react";
import Link from "next/link";
import { RequireAuth } from "@/components/AuthGuard";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>();

function AccountContent() {
  const { user } = useAuthenticator((c) => [c.user]);
  const userId = user?.userId ?? "";
  const loginId = user?.signInDetails?.loginId ?? "";

  const [profile, setProfile] = useState<Schema["UserProfile"]["type"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [form, setForm] = useState({ displayName: "", email: "" });

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const { data: items } = await client.models.UserProfile.listUserProfileByUserId({
          userId,
        });
        const existing = items[0] ?? null;
        setProfile(existing);
        setForm({
          displayName: existing?.displayName ?? "",
          email: existing?.email ?? loginId,
        });
      } catch {
        setForm({ displayName: "", email: loginId });
      } finally {
        setLoading(false);
      }
    })();
  }, [userId, loginId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setMessage(null);
    setSaving(true);
    try {
      const displayName = form.displayName.trim() || loginId;
      const email = form.email.trim() || loginId;
      if (profile) {
        await client.models.UserProfile.update({
          id: profile.id,
          displayName,
          email,
        });
        setProfile({ ...profile, displayName, email });
      } else {
        const { data: created } = await client.models.UserProfile.create({
          userId,
          displayName,
          email,
        });
        if (created) setProfile(created);
      }
      setMessage({ type: "success", text: "Profile saved." });
    } catch (err) {
      setMessage({ type: "error", text: (err as Error).message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-md px-4 py-12">
        <h1 className="mb-6 text-2xl font-bold text-white">Account</h1>
        <p className="text-slate-400">Loading…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="mb-2 text-2xl font-bold text-white">Account</h1>
      <p className="mb-6 text-slate-400">
        Set the name and email shown when you claim squares. This will be used as the default on pools.
      </p>

      {userId && (
        <div className="mb-6 rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-3">
          <p className="mb-1 text-xs font-medium text-slate-500">Your user ID</p>
          <p className="mb-2 truncate font-mono text-sm text-slate-300" title={userId}>
            {userId}
          </p>
          <button
            type="button"
            onClick={() => void navigator.clipboard.writeText(userId)}
            className="text-xs text-amber-400 hover:text-amber-300"
          >
            Copy ID
          </button>
          <p className="mt-1 text-xs text-slate-500">
            Share this with the pool admin if they need to assign a square back to you (e.g. after an accidental unclaim).
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-700 bg-slate-900/50 p-6">
        <div>
          <label htmlFor="displayName" className="mb-1 block text-sm font-medium text-slate-300">
            Display name
          </label>
          <input
            id="displayName"
            type="text"
            value={form.displayName}
            onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
            placeholder="e.g. NI or Lions"
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            maxLength={100}
          />
          <p className="mt-1 text-xs text-slate-500">
            Name or initials shown on your squares. Leave blank to use your sign-in email.
          </p>
        </div>
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-300">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
        {message && (
          <p
            className={`text-sm ${message.type === "success" ? "text-emerald-400" : "text-red-400"}`}
          >
            {message.text}
          </p>
        )}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-amber-600 px-4 py-2 font-medium text-white hover:bg-amber-500 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <Link
            href="/pools"
            className="rounded-lg border border-slate-600 px-4 py-2 text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

export default function AccountPage() {
  return (
    <RequireAuth>
      <AccountContent />
    </RequireAuth>
  );
}
