import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://tareq612345.github.io/room-storefront";
  const routes = [
    "/",
    "/policies/returns/",
    "/policies/shipping/",
    "/policies/privacy/",
    "/policies/terms/",
    "/faq/",
    "/contact/",
  ];

  const now = new Date();
  return routes.map((route) => ({
    url: `${base}${route}`,
    lastModified: now,
    changeFrequency: route === "/" ? "daily" : "monthly",
    priority: route === "/" ? 1 : 0.6,
  }));
}
