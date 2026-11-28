/**
 * @file src/modules/reviews/components/ReviewsOrganizerClient.tsx
 * @purpose Dedicated Isolated Admin Reviews Moderation Studio (/admin/reviews/): approve/hide/verify/reply/delete reviews stored inside __isolated_reviews_v1__.
 */

"use client";

import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Database,
  Eye,
  EyeOff,
  Languages,
  MessageSquare,
  Save,
  Star,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { fetchReviewsSnapshot, saveIsolatedReviewsRegistry } from "../client-api";
import { buildInitialReviewsRegistry } from "../helpers";
import type { ReviewsRegistry } from "../schema";

export function ReviewsOrganizerClient() {
  const [lang, setLang] = useState<"ar" | "en">("ar");
  const [storeId, setStoreId] = useState("store_room_egypt");
  const [registry, setRegistry] = useState<ReviewsRegistry>(() =>
    buildInitialReviewsRegistry()
  );
  const [saving, setSaving] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [search, setSearch] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const snap = await fetchReviewsSnapshot();
      if (!active) return;
      setStoreId(snap.storeId);
      setRegistry(snap.registry);
    })();
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return registry.reviews;
    return registry.reviews.filter(
      (r) =>
        r.authorName.toLowerCase().includes(q) ||
        r.productSlug.toLowerCase().includes(q) ||
        r.comment.toLowerCase().includes(q)
    );
  }, [registry.reviews, search]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveIsolatedReviewsRegistry({ storeId, registry });
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 2200);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} className="min-h-screen bg-[#040308] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#070510]/90 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 text-xs font-semibold text-white/80 hover:bg-white/15"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>{lang === "ar" ? "لوحة الإدارة" : "Admin"}</span>
            </Link>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-400/35 bg-amber-500/10">
              <MessageSquare className="h-5 w-5 text-amber-300" />
            </div>
            <div>
              <h1 className="font-serif text-base font-semibold">
                {lang === "ar" ? "إدارة تقييمات وتعليقات المنتجات" : "Product Reviews Moderation"}
              </h1>
              <p className="text-[11px] text-white/55">__isolated_reviews_v1__</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/schema/"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 text-xs"
            >
              <Database className="h-3.5 w-3.5 text-cyan-300" />
              <span>Schema</span>
            </Link>
            <button
              type="button"
              onClick={() => setLang((p) => (p === "ar" ? "en" : "ar"))}
              className="inline-flex h-9 items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 text-xs"
            >
              <Languages className="h-3.5 w-3.5" />
              <span>{lang === "ar" ? "EN" : "ع"}</span>
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSave()}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-xs font-bold text-black"
            >
              {savedToast ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Save className="h-3.5 w-3.5" />}
              <span>{saving ? "..." : savedToast ? "تم الحفظ!" : "حفظ التغييرات"}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] space-y-6 p-6">
        {/* Settings */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#0b0815] p-5 text-xs">
          <div className="flex flex-wrap gap-5">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={registry.settings.autoApprove}
                onChange={(e) =>
                  setRegistry((prev) => ({
                    ...prev,
                    settings: { ...prev.settings, autoApprove: e.target.checked },
                  }))
                }
              />
              <span>{lang === "ar" ? "نشر التعليقات تلقائياً" : "Auto-approve new reviews"}</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={registry.settings.showCityField}
                onChange={(e) =>
                  setRegistry((prev) => ({
                    ...prev,
                    settings: { ...prev.settings, showCityField: e.target.checked },
                  }))
                }
              />
              <span>{lang === "ar" ? "إظهار حقل المدينة" : "Show city input"}</span>
            </label>
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={lang === "ar" ? "بحث بالاسم أو المنتج أو النص..." : "Search reviews..."}
            className="h-9 w-64 rounded-full border border-white/15 bg-black/60 px-4 text-xs"
          />
        </div>

        {/* Reviews */}
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[#0b0815] p-10 text-center text-xs text-white/55">
            {lang === "ar" ? "لا توجد تقييمات حتى الآن." : "No reviews found."}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((rev) => (
              <div
                key={rev.id}
                className="space-y-3 rounded-2xl border border-white/10 bg-[#0b0815] p-5 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{rev.authorName}</span>
                      <span className="font-mono text-[11px] text-cyan-300" dir="ltr">
                        /{rev.productSlug}
                      </span>
                      <span className="inline-flex items-center gap-0.5 text-amber-400">
                        {rev.rating} <Star className="h-3 w-3 fill-amber-400" />
                      </span>
                    </div>
                    <p className="mt-1 text-white/80">{rev.comment}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setRegistry((prev) => ({
                          ...prev,
                          reviews: prev.reviews.map((x) =>
                            x.id === rev.id ? { ...x, isVerified: !x.isVerified } : x
                          ),
                        }))
                      }
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold ${
                        rev.isVerified ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-white/50"
                      }`}
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Verified</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setRegistry((prev) => ({
                          ...prev,
                          reviews: prev.reviews.map((x) =>
                            x.id === rev.id ? { ...x, isApproved: !x.isApproved } : x
                          ),
                        }))
                      }
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold ${
                        rev.isApproved ? "bg-cyan-500/20 text-cyan-200" : "bg-red-500/20 text-red-300"
                      }`}
                    >
                      {rev.isApproved ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      <span>{rev.isApproved ? "ظاهر" : "مخفي"}</span>
                    </button>

                    {confirmDeleteId === rev.id ? (
                      <button
                        type="button"
                        onClick={() => {
                          setRegistry((prev) => ({
                            ...prev,
                            reviews: prev.reviews.filter((x) => x.id !== rev.id),
                          }));
                          setConfirmDeleteId(null);
                        }}
                        className="rounded-full bg-red-500 px-3 py-1 text-[11px] font-bold text-white"
                      >
                        تأكيد الحذف؟
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(rev.id)}
                        className="rounded-full border border-white/15 p-1.5 text-white/55 hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <input
                  value={rev.adminReply ?? ""}
                  onChange={(e) =>
                    setRegistry((prev) => ({
                      ...prev,
                      reviews: prev.reviews.map((x) =>
                        x.id === rev.id ? { ...x, adminReply: e.target.value || null } : x
                      ),
                    }))
                  }
                  placeholder={lang === "ar" ? "اكتب رد المتجر الرسمي على العميل..." : "Official store reply..."}
                  className="h-9 w-full rounded-xl border border-white/10 bg-black/50 px-3 text-xs text-white"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
