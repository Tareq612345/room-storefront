/**
 * @file src/shared/utils/media-upload.ts
 * @purpose Unified Image Optimizer & Storage Uploader: attempts Supabase Storage (room-media bucket) first for CDN URLs and compresses seamlessly to lightweight WebP on fallback instead of bloated raw Base64.
 */

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://rjwthvvvmlkchjmwjixv.supabase.co";

const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "sb_publishable_UoGGs_Febjhywr_LxLIq5A_v1lmZl1r";

const MEDIA_BUCKET = "room-media";

export interface ProcessedMediaResult {
  url: string;
  source: "supabase-storage" | "compressed-webp";
}

function readFileAsImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Invalid image file"));
      img.src = String(reader.result || "");
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

async function compressToWebpBlob(
  file: File,
  maxDimension = 1280,
  quality = 0.8
): Promise<{ blob: Blob; dataUrl: string }> {
  const img = await readFileAsImage(file);
  let targetW = img.naturalWidth || 800;
  let targetH = img.naturalHeight || 800;

  if (targetW > maxDimension || targetH > maxDimension) {
    const ratio = Math.min(maxDimension / targetW, maxDimension / targetH);
    targetW = Math.max(1, Math.round(targetW * ratio));
    targetH = Math.max(1, Math.round(targetH * ratio));
  }

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas context unavailable");
  }
  ctx.drawImage(img, 0, 0, targetW, targetH);

  // Preserve PNG transparency cleanly if the source is PNG
  const targetMime =
    file.type === "image/png" ? "image/png" : "image/webp";
  const dataUrl = canvas.toDataURL(targetMime, quality);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Image encode failed"))),
      targetMime,
      quality
    );
  });

  return { blob, dataUrl };
}

export async function processAndUploadMedia(
  file: File,
  folder = "catalog"
): Promise<ProcessedMediaResult> {
  if (!file || !file.type.startsWith("image/")) {
    throw new Error("يرجى اختيار ملف صورة صالح (PNG / JPG / WEBP).");
  }
  if (file.size > 12 * 1024 * 1024) {
    throw new Error("حجم الصورة يتجاوز الحد الأقصى (12 ميجابايت).");
  }

  const { blob, dataUrl } = await compressToWebpBlob(file);
  const ext = blob.type === "image/png" ? "png" : "webp";
  const safeName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  try {
    const uploadRes = await fetch(
      `${SUPABASE_URL}/storage/v1/object/${MEDIA_BUCKET}/${safeName}`,
      {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": blob.type,
          "x-upsert": "true",
        },
        body: blob,
      }
    );

    if (uploadRes.ok) {
      return {
        url: `${SUPABASE_URL}/storage/v1/object/public/${MEDIA_BUCKET}/${safeName}`,
        source: "supabase-storage",
      };
    }
  } catch {
    // Fall back cleanly to compressed WebP/PNG data URL when bucket policy is unconfigured
  }

  return {
    url: dataUrl,
    source: "compressed-webp",
  };
}
