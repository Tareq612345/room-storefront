/**
 * @file src/modules/policies/schema.ts
 * @purpose Isolated Policies, FAQ & Contact Schemas: strictly separated per-page data contracts stored in __isolated_policies_v1__.
 */

import { z } from "zod";

export const PolicyKeySchema = z.enum([
  "returns",
  "shipping",
  "privacy",
  "terms",
]);

export type PolicyKey = z.infer<typeof PolicyKeySchema>;

export const PolicySectionBlockSchema = z.object({
  id: z.string().min(1),
  titleAr: z.string(),
  bodyAr: z.string(),
  titleEn: z.string().default(""),
  bodyEn: z.string().default(""),
});

export const PolicyDocumentItemSchema = z.object({
  slug: PolicyKeySchema,
  titleAr: z.string(),
  titleEn: z.string(),
  subtitleAr: z.string(),
  subtitleEn: z.string(),
  updatedLabel: z.string().default("2026-11"),
  isPublished: z.boolean().default(true),
  sections: z.array(PolicySectionBlockSchema),
});

export type PolicyDocumentItem = z.infer<typeof PolicyDocumentItemSchema>;

export const FaqEntrySchema = z.object({
  id: z.string().min(1),
  category: z.enum(["orders", "shipping", "products", "payments"]),
  questionAr: z.string(),
  answerAr: z.string(),
  questionEn: z.string().default(""),
  answerEn: z.string().default(""),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(1),
});

export type FaqEntry = z.infer<typeof FaqEntrySchema>;

export const ContactPageDataSchema = z.object({
  titleAr: z.string(),
  titleEn: z.string(),
  subtitleAr: z.string(),
  subtitleEn: z.string(),
  storyAr: z.string(),
  storyEn: z.string(),
  workingHoursAr: z.string(),
  workingHoursEn: z.string(),
  locationAr: z.string(),
  locationEn: z.string(),
});

export const PoliciesRegistrySchema = z.object({
  schemaVersion: z.literal(1),
  updatedAt: z.string(),
  documents: z.object({
    returns: PolicyDocumentItemSchema,
    shipping: PolicyDocumentItemSchema,
    privacy: PolicyDocumentItemSchema,
    terms: PolicyDocumentItemSchema,
  }),
  faq: z.object({
    titleAr: z.string(),
    titleEn: z.string(),
    subtitleAr: z.string(),
    subtitleEn: z.string(),
    items: z.array(FaqEntrySchema),
  }),
  contact: ContactPageDataSchema,
});

export type PoliciesRegistry = z.infer<typeof PoliciesRegistrySchema>;
