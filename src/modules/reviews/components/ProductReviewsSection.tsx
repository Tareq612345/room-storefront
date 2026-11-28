/**
 * @file src/modules/reviews/components/ProductReviewsSection.tsx
 * @purpose Customer Reviews & Comments block (Oraimo-style clear breakdown in ROOM dark aesthetic) with interactive star filter & comment submission.
 */

"use client";

import { CheckCircle2, MessageSquare, Send, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  fetchApprovedProductReviews,
  submitProductReview,
} from "../client-api";
import { computeReviewSummary } from "../helpers";
import type { ProductReviewItem } from "../schema";

interface ProductReviewsSectionProps {
  productId: string;
  productSlug: string;
  accentColor: string;
  onSummaryChange?: (summary: { average: number; count: number }) => void;
}

export function ProductReviewsSection({
  productId,
  productSlug,
  accentColor,
  onSummaryChange,
}: ProductReviewsSectionProps) {
  const [reviews, setReviews] = useState<ProductReviewItem[]>([]);
  const [showCityField, setShowCityField] = useState(true);
  const [loading, setLoading] = useState(true);
  const [starFilter, setStarFilter] = useState<number | null>(null);

  // Form
  const [authorName, setAuthorName] = useState("");
  const [city, setCity] = useState("");
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(
    null
  );

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetchApprovedProductReviews(productSlug || productId);
        if (!active) return;
        setReviews(res.reviews);
        setShowCityField(res.showCityField);
        const s = computeReviewSummary(res.reviews);
        onSummaryChange?.({ average: s.average, count: s.count });
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [productId, productSlug, onSummaryChange]);

  const summary = useMemo(() => computeReviewSummary(reviews), [reviews]);

  const visibleReviews = useMemo(
    () =>
      starFilter === null
        ? reviews
        : reviews.filter((r) => r.rating === starFilter),
    [reviews, starFilter]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setSubmitting(true);
    try {
      const res = await submitProductReview({
        productId,
        productSlug,
        authorName,
        city,
        rating,
        title,
        comment,
      });

      if (res.autoApproved) {
        const next = [res.review, ...reviews];
        setReviews(next);
        const s = computeReviewSummary(next);
        onSummaryChange?.({ average: s.average, count: s.count });
        setFeedback({ ok: true, msg: "شكراً لك! تم نشر تقييمك وتعليقك مباشرة." });
      } else {
        setFeedback({
          ok: true,
          msg: "شكراً لك! تم استلام تعليقك وسيظهر فور المراجعة.",
        });
      }

      setAuthorName("");
      setCity("");
      setTitle("");
      setComment("");
      setRating(5);
    } catch (err) {
      setFeedback({
        ok: false,
        msg: err instanceof Error ? err.message : "تعذر إرسال التقييم حالياً.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="reviews"
      dir="auto"
      className="mt-14 space-y-6 rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] p-6 md:p-8"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <p
            className="text-[11px] font-bold uppercase tracking-[0.2em]"
            style={{ color: accentColor }}
          >
            Customer Feedback
          </p>
          <h2 className="mt-1 font-serif text-2xl font-semibold text-white">
            التقييمات والتعليقات ({summary.count})
          </h2>
        </div>

        {summary.count > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setStarFilter(null)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                starFilter === null
                  ? "bg-white text-black"
                  : "border border-white/15 bg-black/40 text-white/75"
              }`}
            >
              الكل ({summary.count})
            </button>
            {[5, 4, 3, 2, 1].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStarFilter(starFilter === s ? null : s)}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                  starFilter === s
                    ? "bg-white text-black"
                    : "border border-white/15 bg-black/40 text-white/75"
                }`}
              >
                <span>{s}</span>
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <span>({summary.distribution[s as 1 | 2 | 3 | 4 | 5]})</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {/* Aggregate Score + Write Review Form */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Rating Breakdown */}
        <div className="space-y-4 rounded-2xl border border-white/10 bg-black/40 p-5 lg:col-span-5">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="font-serif text-4xl font-bold text-white">
                {summary.count > 0 ? summary.average : "—"}
              </p>
              <div className="mt-1 flex items-center justify-center gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className={`h-3.5 w-3.5 ${
                      i <= Math.round(summary.average)
                        ? "fill-amber-400 text-amber-400"
                        : "text-white/25"
                    }`}
                  />
                ))}
              </div>
              <p className="mt-1 text-[11px] text-white/55">
                {summary.count} تقييم
              </p>
            </div>

            <div className="flex-1 space-y-1.5">
              {([5, 4, 3, 2, 1] as const).map((star) => {
                const cnt = summary.distribution[star];
                const pct = summary.count > 0 ? (cnt / summary.count) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2 text-[11px]">
                    <span className="w-4 text-white/70">{star}★</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-amber-400"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-6 text-end text-white/50">{cnt}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Add Review Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-3 rounded-2xl border border-white/10 bg-black/40 p-5 lg:col-span-7"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-xs font-bold text-white">
              <MessageSquare className="h-4 w-4 text-cyan-300" />
              <span>أضف تقييمك وتعليقك على المنتج</span>
            </p>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRating(s)}
                  className="p-0.5 transition-transform hover:scale-110"
                  aria-label={`${s} stars`}
                >
                  <Star
                    className={`h-5 w-5 ${
                      s <= rating
                        ? "fill-amber-400 text-amber-400"
                        : "text-white/25"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <input
              required
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="الاسم *"
              className="h-9 rounded-xl border border-white/15 bg-black/60 px-3 text-xs text-white placeholder:text-white/40"
            />
            {showCityField ? (
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="المدينة (مثال: القاهرة الجديدة - اختياري)"
                className="h-9 rounded-xl border border-white/15 bg-black/60 px-3 text-xs text-white placeholder:text-white/40"
              />
            ) : null}
          </div>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="عنوان مختصر لتجربتك (اختياري)"
            className="h-9 w-full rounded-xl border border-white/15 bg-black/60 px-3 text-xs text-white placeholder:text-white/40"
          />

          <textarea
            required
            rows={2}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="اكتب رأيك في الخامة، الألوان، والتوصيل..."
            className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-xs text-white placeholder:text-white/40"
          />

          {feedback ? (
            <p
              className={`text-xs ${
                feedback.ok ? "text-emerald-300" : "text-red-300"
              }`}
            >
              {feedback.msg}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: accentColor }}
          >
            <Send className="h-3.5 w-3.5" />
            <span>{submitting ? "جاري الإرسال..." : "نشر التقييم"}</span>
          </button>
        </form>
      </div>

      {/* Review List */}
      <div className="space-y-3 pt-2">
        {loading ? (
          <div className="h-24 animate-pulse rounded-2xl bg-white/5" />
        ) : visibleReviews.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-black/35 p-6 text-center text-xs text-white/55">
            لا توجد تعليقات مطابقة بعد — كن أول من يشارك تجربته مع هذا المنتج.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {visibleReviews.map((rev) => (
              <article
                key={rev.id}
                className="space-y-2.5 rounded-2xl border border-white/10 bg-black/45 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">
                        {rev.authorName}
                      </span>
                      {rev.isVerified ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                          <CheckCircle2 className="h-3 w-3" /> Verified
                        </span>
                      ) : null}
                    </div>
                    <p className="text-[11px] text-white/45">
                      {rev.city ? `${rev.city} • ` : ""}
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 ${
                          i <= rev.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-white/20"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {rev.title ? (
                  <p className="text-xs font-bold text-white/95">{rev.title}</p>
                ) : null}
                <p className="whitespace-pre-line text-xs leading-relaxed text-white/80">
                  {rev.comment}
                </p>

                {rev.adminReply ? (
                  <div className="rounded-xl border border-cyan-400/25 bg-cyan-500/10 p-3 text-[11px] text-cyan-100">
                    <strong className="block text-cyan-300">رد المتجر:</strong>
                    <span>{rev.adminReply}</span>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
