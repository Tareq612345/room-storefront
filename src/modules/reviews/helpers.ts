/**
 * @file src/modules/reviews/helpers.ts
 * @purpose Constants and initial registry builder for the isolated Product Reviews module.
 */

import type { ProductReviewItem, ReviewsRegistry } from "./schema";

export const REVIEWS_PAGE_KEY = "__isolated_reviews_v1__";
export const REVIEWS_RECORD_ID = "rev_isolated_registry_v1";
export const REVIEWS_LOCAL_STORAGE_KEY = "room_isolated_reviews_v1";

export function buildInitialReviewsRegistry(): ReviewsRegistry {
  return {
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
    settings: {
      autoApprove: true,
      requireTitle: false,
      showCityField: true,
    },
    reviews: [],
  };
}

export function computeReviewSummary(reviews: ProductReviewItem[]): {
  count: number;
  average: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
} {
  const distribution: Record<1 | 2 | 3 | 4 | 5, number> = {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  };
  if (reviews.length === 0) {
    return { count: 0, average: 0, distribution };
  }
  let sum = 0;
  for (const r of reviews) {
    sum += r.rating;
    const star = Math.min(5, Math.max(1, r.rating)) as 1 | 2 | 3 | 4 | 5;
    distribution[star] += 1;
  }
  return {
    count: reviews.length,
    average: Number((sum / reviews.length).toFixed(1)),
    distribution,
  };
}
