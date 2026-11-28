/**
 * @file src/modules/analytics/components/TrackingScripts.tsx
 * @purpose Dynamically injects Google Analytics 4 (gtag.js) and Meta Pixel (fbevents.js) on Storefront pages only when configured inside __isolated_analytics_v1__.
 */

"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { fetchAnalyticsRegistry } from "../client-api";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

export function TrackingScripts() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname?.includes("/admin") || pathname?.includes("/schema")) return;

    let active = true;
    (async () => {
      try {
        const { registry } = await fetchAnalyticsRegistry();
        if (!active) return;

        const gaId = registry.config.ga4MeasurementId?.trim();
        const pixelId = registry.config.metaPixelId?.trim();

        if (gaId && !document.getElementById("room-ga4-script")) {
          const s1 = document.createElement("script");
          s1.id = "room-ga4-script";
          s1.async = true;
          s1.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
          document.head.appendChild(s1);

          window.dataLayer = window.dataLayer || [];
          window.gtag = function gtag(...args: unknown[]) {
            window.dataLayer?.push(args);
          };
          window.gtag("js", new Date());
          window.gtag("config", gaId);
        }

        if (pixelId && !document.getElementById("room-meta-pixel-script")) {
          const inline = document.createElement("script");
          inline.id = "room-meta-pixel-script";
          inline.textContent = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixelId.replace(/'/g, "")}');fbq('track','PageView');`;
          document.head.appendChild(inline);
        }
      } catch {
        // Never block storefront UI
      }
    })();

    return () => {
      active = false;
    };
  }, [pathname]);

  return null;
}
