/**
 * @file src/modules/policies/components/PolicyPageClient.tsx
 * @purpose Dedicated Page Renderer for each separated Policy (/policies/returns, /policies/shipping, /policies/privacy, /policies/terms), /faq/, and /contact/ — zero mixing, clean cards & live DB hydration.
 */

"use client";

import { sbSelect } from "@shared/db/supabase-rest";
import { formatEgp } from "@shared/types/common";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  HelpCircle,
  Mail,
  MapPin,
  MessageCircle,
  RefreshCw,
  ShieldCheck,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchPoliciesSnapshot } from "../client-api";
import { buildInitialPoliciesRegistry } from "../helpers";
import type { FaqEntry, PoliciesRegistry, PolicyKey } from "../schema";

type IsolatedPageKind = PolicyKey | "faq" | "contact";

interface PolicyPageClientProps {
  kind: IsolatedPageKind;
}

const SIBLING_NAV: Array<{ kind: IsolatedPageKind; href: string; labelAr: string }> = [
  { kind: "returns", href: "/policies/returns/", labelAr: "الاستبدال والاسترجاع" },
  { kind: "shipping", href: "/policies/shipping/", labelAr: "سياسة الشحن" },
  { kind: "privacy", href: "/policies/privacy/", labelAr: "الخصوصية" },
  { kind: "terms", href: "/policies/terms/", labelAr: "الشروط والأحكام" },
  { kind: "faq", href: "/faq/", labelAr: "الأسئلة الشائعة" },
  { kind: "contact", href: "/contact/", labelAr: "تواصل معنا" },
];

const FAQ_CATEGORY_LABELS: Record<FaqEntry["category"], string> = {
  orders: "الطلبات",
  shipping: "الشحن والتوصيل",
  products: "المنتجات والمقاسات",
  payments: "طرق الدفع والكوبونات",
};

export function PolicyPageClient({ kind }: PolicyPageClientProps) {
  const [registry, setRegistry] = useState<PoliciesRegistry>(() =>
    buildInitialPoliciesRegistry()
  );
  const [storeMeta, setStoreMeta] = useState({
    storeName: "",
    whatsapp: "",
    supportEmail: "",
  });
  const [liveZones, setLiveZones] = useState<
    Array<{
      id: string;
      name: string;
      city: string;
      fee: number;
      freeThreshold: number;
      estimatedDays: string;
    }>
  >([]);
  const [faqCategory, setFaqCategory] = useState<"all" | FaqEntry["category"]>("all");
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const [snap, zones] = await Promise.all([
        fetchPoliciesSnapshot(),
        kind === "shipping"
          ? sbSelect<{
              id: string;
              name: string;
              city: string;
              fee: number | string;
              freeShippingThreshold: number | string | null;
              estimatedDays: string;
            }>(
              "shipping_zones",
              "select=id,name,city,fee,freeShippingThreshold,estimatedDays&isActive=eq.true&order=sortOrder.asc"
            ).catch(() => [])
          : Promise.resolve([]),
      ]);
      if (!active) return;
      setRegistry(snap.registry);
      setStoreMeta({
        storeName: snap.storeName,
        whatsapp: snap.whatsapp,
        supportEmail: snap.supportEmail,
      });
      if (zones.length > 0) {
        setLiveZones(
          zones.map((z) => ({
            id: z.id,
            name: z.name,
            city: z.city,
            fee: Number(z.fee),
            freeThreshold: z.freeShippingThreshold
              ? Number(z.freeShippingThreshold)
              : 2500,
            estimatedDays: z.estimatedDays,
          }))
        );
      }
    })();
    return () => {
      active = false;
    };
  }, [kind]);

  const cleanWa = storeMeta.whatsapp.replace(/[^0-9]/g, "");

  return (
    <section dir="rtl" className="mx-auto w-full max-w-4xl px-4 py-10 pb-20">
      {/* Top Breadcrumb + Clean Navigation Pills between separated pages */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/50 px-4 py-2 text-xs font-semibold text-white/80 hover:border-white/35 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>العودة للمتجر</span>
        </Link>

        <div className="flex flex-wrap gap-1.5">
          {SIBLING_NAV.map((item) => (
            <Link
              key={item.kind}
              href={item.href}
              className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                item.kind === kind
                  ? "bg-white text-black"
                  : "border border-white/15 bg-black/40 text-white/70 hover:border-white/35 hover:text-white"
              }`}
            >
              {item.labelAr}
            </Link>
          ))}
        </div>
      </div>

      {/* SEPARATED FAQ PAGE */}
      {kind === "faq" ? (
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/15 bg-[#0b0815] p-7">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/35 bg-cyan-500/10">
                <HelpCircle className="h-5 w-5 text-cyan-300" />
              </div>
              <div>
                <h1 className="font-serif text-2xl font-semibold text-white">
                  {registry.faq.titleAr}
                </h1>
                <p className="mt-1 text-xs text-white/60">
                  {registry.faq.subtitleAr}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setFaqCategory("all")}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold ${
                  faqCategory === "all"
                    ? "bg-cyan-400 text-black"
                    : "border border-white/15 bg-black/40 text-white/75"
                }`}
              >
                الكل
              </button>
              {(["orders", "shipping", "products", "payments"] as const).map(
                (cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFaqCategory(cat)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-bold ${
                      faqCategory === cat
                        ? "bg-cyan-400 text-black"
                        : "border border-white/15 bg-black/40 text-white/75"
                    }`}
                  >
                    {FAQ_CATEGORY_LABELS[cat]}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="space-y-3">
            {registry.faq.items
              .filter(
                (it) =>
                  it.isActive &&
                  (faqCategory === "all" || it.category === faqCategory)
              )
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((item) => {
                const open = openFaqId === item.id;
                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-white/10 bg-[#0b0815] p-5"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqId(open ? null : item.id)}
                      className="flex w-full items-center justify-between gap-3 text-start"
                    >
                      <div>
                        <span className="mb-1 inline-block rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold text-cyan-200">
                          {FAQ_CATEGORY_LABELS[item.category]}
                        </span>
                        <h2 className="text-sm font-bold text-white">
                          {item.questionAr}
                        </h2>
                      </div>
                      {open ? (
                        <ChevronUp className="h-4 w-4 shrink-0 text-white/60" />
                      ) : (
                        <ChevronDown className="h-4 w-4 shrink-0 text-white/60" />
                      )}
                    </button>
                    {open ? (
                      <p className="mt-3 border-t border-white/10 pt-3 text-xs leading-relaxed text-white/80">
                        {item.answerAr}
                      </p>
                    ) : null}
                  </div>
                );
              })}
          </div>
        </div>
      ) : kind === "contact" ? (
        /* SEPARATED CONTACT & ABOUT PAGE */
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/15 bg-[#0b0815] p-7">
            <h1 className="font-serif text-2xl font-semibold text-white">
              {registry.contact.titleAr}
            </h1>
            <p className="mt-1.5 text-xs text-white/60">
              {registry.contact.subtitleAr}
            </p>
            <p className="mt-5 rounded-2xl border border-white/10 bg-black/40 p-4 text-sm leading-relaxed text-white/85">
              {registry.contact.storyAr}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {cleanWa ? (
              <a
                href={`https://wa.me/${cleanWa}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-start gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-5 transition-colors hover:bg-emerald-500/15"
              >
                <MessageCircle className="mt-0.5 h-5 w-5 text-emerald-300" />
                <div>
                  <h2 className="text-sm font-bold text-white">واتساب خدمة العملاء</h2>
                  <p className="mt-1 font-mono text-xs text-emerald-200" dir="ltr">
                    {storeMeta.whatsapp}
                  </p>
                </div>
              </a>
            ) : null}

            {storeMeta.supportEmail ? (
              <a
                href={`mailto:${storeMeta.supportEmail}`}
                className="flex items-start gap-3 rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-5 transition-colors hover:bg-cyan-500/15"
              >
                <Mail className="mt-0.5 h-5 w-5 text-cyan-300" />
                <div>
                  <h2 className="text-sm font-bold text-white">البريد الإلكتروني</h2>
                  <p className="mt-1 font-mono text-xs text-cyan-200" dir="ltr">
                    {storeMeta.supportEmail}
                  </p>
                </div>
              </a>
            ) : null}

            <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-[#0b0815] p-5">
              <Clock className="mt-0.5 h-5 w-5 text-amber-300" />
              <div>
                <h2 className="text-sm font-bold text-white">ساعات العمل</h2>
                <p className="mt-1 text-xs text-white/75">
                  {registry.contact.workingHoursAr}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-[#0b0815] p-5">
              <MapPin className="mt-0.5 h-5 w-5 text-fuchsia-300" />
              <div>
                <h2 className="text-sm font-bold text-white">نطاق التواجد</h2>
                <p className="mt-1 text-xs text-white/75">
                  {registry.contact.locationAr}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* SEPARATED INDIVIDUAL POLICY DOCUMENT PAGE */
        (() => {
          const doc = registry.documents[kind];
          const IconComp =
            kind === "returns"
              ? RefreshCw
              : kind === "shipping"
                ? Truck
                : kind === "privacy"
                  ? ShieldCheck
                  : FileText;

          return (
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/15 bg-[#0b0815] p-7">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/5">
                      <IconComp className="h-5 w-5 text-cyan-300" />
                    </div>
                    <div>
                      <h1 className="font-serif text-2xl font-semibold text-white">
                        {doc.titleAr}
                      </h1>
                      <p className="mt-1 text-xs text-white/60">
                        {doc.subtitleAr}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full border border-white/15 bg-black/50 px-3 py-1 font-mono text-[11px] text-white/55">
                    Updated: {doc.updatedLabel}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {doc.sections.map((sec, idx) => (
                  <article
                    key={sec.id}
                    className="rounded-2xl border border-white/10 bg-[#0b0815] p-6"
                  >
                    <h2 className="flex items-center gap-2 text-base font-bold text-white">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 font-mono text-xs text-cyan-300">
                        {idx + 1}
                      </span>
                      <span>{sec.titleAr}</span>
                    </h2>
                    <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-white/80">
                      {sec.bodyAr}
                    </p>
                  </article>
                ))}
              </div>

              {/* Live DB Shipping Zones table strictly inside Shipping Policy page */}
              {kind === "shipping" && liveZones.length > 0 ? (
                <div className="rounded-2xl border border-emerald-400/25 bg-[#0b0815] p-6">
                  <h2 className="font-serif text-lg font-semibold text-white">
                    مناطق الشحن والأسعار الحالية (محدّثة تلقائياً)
                  </h2>
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {liveZones.map((z) => (
                      <div
                        key={z.id}
                        className="rounded-xl border border-white/10 bg-black/45 p-4 text-xs"
                      >
                        <p className="font-bold text-white">{z.name}</p>
                        <p className="mt-1 text-white/60">
                          {z.city} • {z.estimatedDays}
                        </p>
                        <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2">
                          <span className="font-bold text-emerald-300">
                            الشحن: {formatEgp(z.fee)}
                          </span>
                          <span className="text-white/65">
                            مجاني فوق {formatEgp(z.freeThreshold)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })()
      )}
    </section>
  );
}
