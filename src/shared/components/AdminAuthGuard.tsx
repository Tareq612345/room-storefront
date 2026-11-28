/**
 * @file src/shared/components/AdminAuthGuard.tsx
 * @purpose Unified Session Gate for all /admin/* Studios and /schema/: prevents direct unauthenticated URL access without exposing password hashes on load.
 */

"use client";

import { sbSelect } from "@shared/db/supabase-rest";
import { ShieldCheck, Lock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const SESSION_KEY = "room_admin_session_v1";

interface SafeSessionUser {
  id: string;
  name: string;
  username: string | null;
  role: "OWNER" | "ADMIN" | "STAFF";
  isActive: boolean;
}

interface AdminAuthGuardProps {
  children: React.ReactNode;
  allowStaff?: boolean;
}

export function AdminAuthGuard({
  children,
  allowStaff = true,
}: AdminAuthGuardProps) {
  const [status, setStatus] = useState<"checking" | "authorized" | "denied">(
    "checking"
  );

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const sessionId = localStorage.getItem(SESSION_KEY);
        if (!sessionId) {
          if (active) setStatus("denied");
          return;
        }

        // Only verify active status & role (never fetches passwordHash)
        const rows = await sbSelect<SafeSessionUser>(
          "users",
          `select=id,name,username,role,isActive&id=eq.${encodeURIComponent(sessionId)}&role=in.(OWNER,ADMIN,STAFF)&isActive=eq.true`
        );

        if (!active) return;
        const user = rows[0];
        if (!user || (!allowStaff && user.role === "STAFF")) {
          setStatus("denied");
          return;
        }
        setStatus("authorized");
      } catch {
        if (active) setStatus("denied");
      }
    })();

    return () => {
      active = false;
    };
  }, [allowStaff]);

  if (status === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#040308] text-white">
        <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-[#0b0815] px-6 py-4 text-xs text-white/75">
          <ShieldCheck className="h-4 w-4 animate-pulse text-cyan-300" />
          <span>جاري التحقق من صلاحية الجلسة...</span>
        </div>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#040308] px-4 text-white"
      >
        <div className="w-full max-w-md space-y-5 rounded-3xl border border-white/15 bg-[#0b0815] p-8 text-center shadow-2xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-400/35 bg-amber-500/10">
            <Lock className="h-6 w-6 text-amber-300" />
          </div>
          <div>
            <h1 className="font-serif text-xl font-semibold text-white">
              منطقة إدارة محمية
            </h1>
            <p className="mt-2 text-xs leading-relaxed text-white/65">
              يجب تسجيل الدخول بحساب مشرف مفعّل عبر لوحة الإدارة الرئيسية للوصول إلى هذا الاستوديو.
            </p>
          </div>
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <Link
              href="/admin/"
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-bold text-black hover:opacity-90"
            >
              <span>تسجيل الدخول في /admin/</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/"
              className="flex items-center justify-center rounded-full border border-white/15 px-5 py-2.5 text-xs font-semibold text-white/80 hover:bg-white/10"
            >
              العودة للمتجر
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
