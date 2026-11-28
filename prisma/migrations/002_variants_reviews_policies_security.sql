-- Migration 002: Product Reviews, Policies/FAQ, Secure Admin RPC, and Public Media Bucket
-- Run via DIRECT_URL or Supabase SQL Editor to enforce server-side password check & native tables.

CREATE TABLE IF NOT EXISTS "product_reviews" (
  "id" TEXT PRIMARY KEY,
  "storeId" TEXT NOT NULL REFERENCES "store_configs"("id") ON DELETE CASCADE,
  "productId" TEXT NOT NULL,
  "productSlug" TEXT NOT NULL,
  "authorName" TEXT NOT NULL,
  "city" TEXT,
  "rating" INTEGER NOT NULL DEFAULT 5,
  "title" TEXT,
  "comment" TEXT NOT NULL,
  "adminReply" TEXT,
  "isApproved" BOOLEAN NOT NULL DEFAULT true,
  "isVerified" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "policy_documents" (
  "id" TEXT PRIMARY KEY,
  "storeId" TEXT NOT NULL REFERENCES "store_configs"("id") ON DELETE CASCADE,
  "slug" TEXT NOT NULL,
  "titleAr" TEXT NOT NULL,
  "titleEn" TEXT NOT NULL,
  "subtitleAr" TEXT,
  "subtitleEn" TEXT,
  "sections" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "isPublished" BOOLEAN NOT NULL DEFAULT true,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("storeId", "slug")
);

CREATE TABLE IF NOT EXISTS "faq_items" (
  "id" TEXT PRIMARY KEY,
  "storeId" TEXT NOT NULL REFERENCES "store_configs"("id") ON DELETE CASCADE,
  "category" TEXT NOT NULL DEFAULT 'orders',
  "questionAr" TEXT NOT NULL,
  "answerAr" TEXT NOT NULL,
  "questionEn" TEXT,
  "answerEn" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create public bucket for media uploads when activating Supabase Storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('room-media', 'room-media', true)
ON CONFLICT (id) DO NOTHING;

-- Optional RPC to look up an admin account by email/username without exposing the full users list
CREATE OR REPLACE FUNCTION public.get_admin_login_candidate(p_identifier TEXT)
RETURNS TABLE (
  id TEXT,
  email TEXT,
  username TEXT,
  name TEXT,
  role "UserRole",
  "isActive" BOOLEAN,
  "passwordHash" TEXT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT u.id, u.email, u.username, u.name, u.role, u."isActive", u."passwordHash"
  FROM public.users u
  WHERE u.role IN ('OWNER', 'ADMIN', 'STAFF')
    AND u."isActive" = true
    AND (LOWER(COALESCE(u.email, '')) = LOWER(TRIM(p_identifier))
      OR LOWER(COALESCE(u.username, '')) = LOWER(TRIM(p_identifier)))
  LIMIT 1;
$$;
