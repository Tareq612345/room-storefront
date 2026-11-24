/**
 * @file src/modules/admin/components/AdminInviteClient.tsx
 * @purpose Single-use 48-hour Admin Invite onboarding page: validates token, lets invited admin set username + password, and marks invite as used.
 */

"use client";

import { CheckCircle2, ShieldAlert, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface LocalInvite {
  id: string;
  email: string;
  role: "ADMIN" | "STAFF";
  token: string;
  expiresAt: string;
  usedAt: string | null;
}

interface LocalAdminAccount {
  id: string;
  email: string;
  username: string;
  name: string;
  role: "OWNER" | "ADMIN" | "STAFF";
  password: string;
}

const STORAGE_ACCOUNTS_KEY = "room_admin_accounts_v1";
const STORAGE_INVITES_KEY = "room_admin_invites_v1";
const STORAGE_SESSION_KEY = "room_admin_session_v1";

export function AdminInviteClient() {
  const [token, setToken] = useState<string | null>(null);
  const [invite, setInvite] = useState<LocalInvite | null>(null);
  const [status, setStatus] = useState<"loading" | "valid" | "invalid" | "used" | "expired" | "done">("loading");

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    setToken(t);

    if (!t) {
      setStatus("invalid");
      return;
    }

    try {
      const saved = localStorage.getItem(STORAGE_INVITES_KEY);
      const list: LocalInvite[] = saved ? (JSON.parse(saved) as LocalInvite[]) : [];
      const found = list.find((i) => i.token === t) ?? null;

      if (!found) {
        setStatus("invalid");
        return;
      }
      if (found.usedAt) {
        setStatus("used");
        return;
      }
      if (new Date(found.expiresAt).getTime() < Date.now()) {
        setStatus("expired");
        return;
      }

      setInvite(found);
      setStatus("valid");
    } catch {
      setStatus("invalid");
    }
  }, []);

  const handleCompleteInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invite || !token) return;
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    const cleanUsername = username.trim().toLowerCase();
    const savedAcc = localStorage.getItem(STORAGE_ACCOUNTS_KEY);
    const accounts: LocalAdminAccount[] = savedAcc
      ? (JSON.parse(savedAcc) as LocalAdminAccount[])
      : [];

    if (accounts.some((a) => a.username.toLowerCase() === cleanUsername)) {
      setError("This username is already taken.");
      return;
    }

    const newAccount: LocalAdminAccount = {
      id: `adm_${Date.now()}`,
      email: invite.email,
      username: cleanUsername,
      name: name.trim(),
      role: invite.role,
      password,
    };

    const nextAccounts = [...accounts, newAccount];
    localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(nextAccounts));

    const savedInv = localStorage.getItem(STORAGE_INVITES_KEY);
    const invites: LocalInvite[] = savedInv ? (JSON.parse(savedInv) as LocalInvite[]) : [];
    const nextInvites = invites.map((i) =>
      i.token === token ? { ...i, usedAt: new Date().toISOString() } : i
    );
    localStorage.setItem(STORAGE_INVITES_KEY, JSON.stringify(nextInvites));
    localStorage.setItem(STORAGE_SESSION_KEY, newAccount.id);

    setStatus("done");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#05030a] px-4 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/15 bg-[#0c0916]/95 p-8 shadow-2xl">
        {status === "valid" && invite ? (
          <>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/35 bg-cyan-500/10">
                <ShieldCheck className="h-5 w-5 text-cyan-300" />
              </div>
              <div>
                <h1 className="font-serif text-xl font-semibold">Accept Admin Invite</h1>
                <p className="text-xs text-white/55">{invite.email} • {invite.role}</p>
              </div>
            </div>

            <form onSubmit={handleCompleteInvite} className="mt-6 space-y-4">
              <div>
                <label className="mb-1 block text-xs text-white/70">Full Name</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  className="h-10 w-full rounded-xl border border-white/15 bg-black/60 px-3 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-white/70">
                  Choose Username (for login without email)
                </label>
                <input
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  pattern="^[a-zA-Z0-9_]+$"
                  placeholder="e.g. ahmed_admin"
                  className="h-10 w-full rounded-xl border border-white/15 bg-black/60 px-3 font-mono text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-white/70">Set Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="h-10 w-full rounded-xl border border-white/15 bg-black/60 px-3 text-sm"
                />
              </div>

              {error ? (
                <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                className="h-11 w-full rounded-full bg-white text-xs font-bold uppercase tracking-wider text-black"
              >
                Activate Admin Account
              </button>
            </form>
          </>
        ) : status === "done" ? (
          <div className="text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />
            <h1 className="mt-4 font-serif text-xl font-semibold">Account Activated</h1>
            <p className="mt-2 text-xs text-white/60">
              This single-use invite link is now consumed. You can sign in anytime using your username or email.
            </p>
            <Link
              href="/admin/"
              className="mt-6 inline-block rounded-full bg-white px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-black"
            >
              Open Admin Dashboard →
            </Link>
          </div>
        ) : (
          <div className="text-center">
            <ShieldAlert className="mx-auto h-12 w-12 text-red-400" />
            <h1 className="mt-4 font-serif text-xl font-semibold">
              {status === "used"
                ? "Invite Already Used"
                : status === "expired"
                ? "Invite Expired (48h)"
                : "Invalid Invite Link"}
            </h1>
            <p className="mt-2 text-xs text-white/60">
              Ask an Owner to generate a new 48-hour single-use invite link from the Admin Portal.
            </p>
            <Link
              href="/admin/"
              className="mt-6 inline-block rounded-full border border-white/20 px-6 py-2 text-xs font-semibold text-white"
            >
              Back to Admin Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
