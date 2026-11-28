/**
 * @file src/modules/reviews/client-api.ts
 * @purpose Isolated Reviews API: fetches, submits, and moderates customer product reviews inside __isolated_reviews_v1__.
 */

import { sbInsert, sbPatch, sbSelect } from "@shared/db/supabase-rest";
import { generateClientId } from "@shared/utils/client-auth";
import {
  REVIEWS_LOCAL_STORAGE_KEY,
  REVIEWS_PAGE_KEY,
  REVIEWS_RECORD_ID,
  buildInitialReviewsRegistry,
} from "./helpers";
import {
  ReviewsRegistrySchema,
  type ProductReviewItem,
  type ReviewsRegistry,
} from "./schema";

function cacheReviewsLocally(registry: ReviewsRegistry): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(REVIEWS_LOCAL_STORAGE_KEY, JSON.stringify(registry));
  } catch {
    // Ignore storage quota errors
  }
}

export async function fetchReviewsSnapshot(): Promise<{
  storeId: string;
  registry: ReviewsRegistry;
}> {
  const [sbStores, sbRows] = await Promise.all([
    sbSelect<{ id: string }>("store_configs", "select=id&slug=eq.room-egypt").catch(
      () => []
    ),
    sbSelect<{ id: string; config: unknown }>(
      "page_sections",
      `select=id,config&pageKey=eq.${encodeURIComponent(REVIEWS_PAGE_KEY)}`
    ).catch(() => []),
  ]);

  const storeId = sbStores[0]?.id ?? "store_room_egypt";
  const parsed = sbRows[0] ? ReviewsRegistrySchema.safeParse(sbRows[0].config) : null;
  if (parsed?.success) {
    cacheReviewsLocally(parsed.data);
    return { storeId, registry: parsed.data };
  }

  return { storeId, registry: buildInitialReviewsRegistry() };
}

export async function saveIsolatedReviewsRegistry(params: {
  storeId: string;
  registry: ReviewsRegistry;
}): Promise<boolean> {
  const validated = ReviewsRegistrySchema.parse({
    ...params.registry,
    updatedAt: new Date().toISOString(),
  });
  cacheReviewsLocally(validated);

  const patched = await sbPatch<{ id: string }>(
    "page_sections",
    `pageKey=eq.${encodeURIComponent(REVIEWS_PAGE_KEY)}`,
    {
      config: validated,
      isVisible: false,
      updatedAt: validated.updatedAt,
    }
  );
  if (patched.length > 0) return true;

  await sbInsert("page_sections", {
    id: REVIEWS_RECORD_ID,
    storeId: params.storeId,
    pageKey: REVIEWS_PAGE_KEY,
    type: "NEW_ARRIVALS",
    title: "Isolated Product Reviews",
    subtitle: "Customer product ratings, comments, and replies",
    sortOrder: 9992,
    isVisible: false,
    config: validated,
    updatedAt: validated.updatedAt,
  });
  return true;
}

export async function fetchApprovedProductReviews(
  productIdOrSlug: string
): Promise<{
  reviews: ProductReviewItem[];
  showCityField: boolean;
  autoApprove: boolean;
}> {
  const snap = await fetchReviewsSnapshot();
  const matching = snap.registry.reviews
    .filter(
      (r) =>
        r.isApproved &&
        (r.productId === productIdOrSlug || r.productSlug === productIdOrSlug)
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return {
    reviews: matching,
    showCityField: snap.registry.settings.showCityField,
    autoApprove: snap.registry.settings.autoApprove,
  };
}

export async function submitProductReview(input: {
  productId: string;
  productSlug: string;
  authorName: string;
  city?: string;
  rating: number;
  title?: string;
  comment: string;
}): Promise<{ review: ProductReviewItem; autoApproved: boolean }> {
  const cleanName = input.authorName.trim();
  const cleanComment = input.comment.trim();
  if (cleanName.length < 2 || cleanComment.length < 3) {
    throw new Error("يرجى إدخال اسمك وتعليقك بشكل واضح.");
  }

  const snap = await fetchReviewsSnapshot();
  const autoApproved = snap.registry.settings.autoApprove;
  const nowIso = new Date().toISOString();

  const created: ProductReviewItem = {
    id: generateClientId("rev"),
    productId: input.productId,
    productSlug: input.productSlug,
    authorName: cleanName,
    city: input.city?.trim() ?? "",
    rating: Math.min(5, Math.max(1, Math.round(input.rating))),
    title: input.title?.trim() ?? "",
    comment: cleanComment,
    adminReply: null,
    isApproved: autoApproved,
    isVerified: false,
    createdAt: nowIso,
  };

  await saveIsolatedReviewsRegistry({
    storeId: snap.storeId,
    registry: {
      ...snap.registry,
      reviews: [created, ...snap.registry.reviews].slice(0, 500),
    },
  });

  return { review: created, autoApproved };
}
