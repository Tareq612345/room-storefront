/**
 * @file src/shared/utils/asset-path.ts
 * @purpose Asset Path Helper: Resolves public image/SVG URLs cleanly for both localhost and GitHub Pages basePath.
 */

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/**
 * Resolves static public asset paths cleanly for both localhost and GitHub Pages basePath.
 */
export function getAssetPath(path: string): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_PATH}${normalized}`;
}
