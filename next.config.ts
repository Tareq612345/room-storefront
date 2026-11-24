/**
 * @file next.config.ts
 * @purpose Next.js configuration: static export (output: 'export'), GitHub Pages basePath, and unoptimized images.
 */

import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
