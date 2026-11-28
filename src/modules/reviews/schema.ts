/**
 * @file src/modules/reviews/schema.ts
 * @purpose Isolated Product Reviews & Comments Schemas: ratings (1-5), verified status, store replies, and moderation rules stored in __isolated_reviews_v1__.
 */

import { z } from "zod";

export const ProductReviewItemSchema = z.object({
  id: z.string().min(1),
  productId: z.string().min(1),
  productSlug: z.string().min(1),
  authorName: z.string().min(1),
  city: z.string().default(""),
  rating: z.number().int().min(1).max(5),
  title: z.string().default(""),
  comment: z.string().min(1),
  adminReply: z.string().nullable().default(null),
  isApproved: z.boolean().default(true),
  isVerified: z.boolean().default(false),
  createdAt: z.string(),
});

export type ProductReviewItem = z.infer<typeof ProductReviewItemSchema>;

export const ReviewsSettingsSchema = z.object({
  autoApprove: z.boolean().default(true),
  requireTitle: z.boolean().default(false),
  showCityField: z.boolean().default(true),
});

export const ReviewsRegistrySchema = z.object({
  schemaVersion: z.literal(1),
  updatedAt: z.string(),
  settings: ReviewsSettingsSchema,
  reviews: z.array(ProductReviewItemSchema),
});

export type ReviewsRegistry = z.infer<typeof ReviewsRegistrySchema>;
