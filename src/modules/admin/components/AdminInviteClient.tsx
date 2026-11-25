/**
 * @file src/modules/admin/components/AdminInviteClient.tsx
 * @purpose Single-use 48-hour Admin Invite onboarding page backed directly by Supabase (admin_invites & users tables).
 */

"use client";

import { sbInsert, sbPatch, sbSelect } from "@shared/db/supabase-rest";
import { generateClientId, hashPasswordWeb } from "@shared/utils/client-auth";
import { CheckCircle2, ShieldAlert, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface SbInviteRow {
  id: string;
  storeId: string;
  email: string;
  role: "ADMIN" | "STAFF";
  token: string;
  expiresAt: string;
  usedAt: string | null;
}

export function AdminInviteClient() {
  const [token, setToken] = useState<string | null>(null);
  const [invite, setInvite] = useState<SbInviteRow | null>(null);
  const [status, setStatus] = useState<
    "loading" | "valid" | "invalid" | "used" | "expired" | "done"
  >("loading");

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    setToken(t);

    if (!t) {
      setStatus("invalid");
      return;
    }

    (async () => {
      try {
        const rows = await sbSelect<SbInviteRow>(
          "admin_invites",
          `select=id,storeId,email,role,token,expiresAt,usedAt&token=eq.${encodeURIComponent(t)}`
        );
        const found = rows[0] ?? null;

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
    })();
  }, []);

  const handleCompleteInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invite || !token) return;
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const cleanUsername = username.trim().toLowerCase();
      const existing = await sbSelect<{ id: string }>(
        "users",
        `select=id&storeId=eq.${encodeURIComponent(invite.storeId)}&username=eq.${encodeURIComponent(cleanUsername)}`
      );

      if (existing.length > 0) {
        setError("This username is already taken.");
        setSubmitting(false);
        return;
      }

      const passwordHash = await hashPasswordWeb(password);
      const nowIso = new Date().toISOString();
      const userId = generateClientId("adm");

      await sbInsert("users", {
        id: userId,
        storeId: invite.storeId,
        email: invite.email.toLowerCase(),
        username: cleanUsername,
        name: name.trim(),
        role: invite.role,
        passwordHash,
        isActive: true,
        updatedAt: nowIso,
      });

      await sbPatch("admin_invites", `id=eq.${encodeURIComponent(invite.id)}`, {
        usedAt: nowIso,
      });

      localStorage.setItem("room_admin_session_v1", userId);
      setStatus("done");
    } catch {
      setError("Failed to activate account. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#05030a] px-4 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/15 bg-[#0c0916]/95 p-8 shadow-2xl">
        {status === "loading" ? (
          <p className="text-center text-xs text-white/60">Validating invite...</p>
        ) : status === "valid" && invite ? (
          <>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/35 bg-cyan-500/10">
                <ShieldCheck className="h-5 w-5 text-cyan-300" />
              </div>
              <div>
                <h1 className="font-serif text-xl font-semibold">Accept Admin Invite</h1>
                <p className="text-xs text-white/55">
                  {invite.email} • {invite.role}
                </p>
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
                disabled={submitting}
                className="h-11 w-full rounded-full bg-white text-xs font-bold uppercase tracking-wider text-black disabled:opacity-50"
              >
                {submitting ? "Activating..." : "Activate Admin Account"}
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
