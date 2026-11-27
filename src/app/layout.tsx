/**
 * @file src/app/layout.tsx
 * @purpose Root App Layout: Loads fonts, applies instant pre-paint theme snapshot to prevent refresh flash, and renders AmbientBackground & My Room drawer.
 */

import { MyRoomTriggerAndDrawer } from "@modules/cart-checkout";
import { AmbientBackground } from "@shared/components/AmbientBackground";
import { StorefrontFooter } from "@shared/components/StorefrontFooter";
import { UniverseThemeSync } from "@shared/components/UniverseThemeSync";
import type { Metadata } from "next";
import { Cinzel, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ROOM — Build Your Universe",
  description:
    "High-craft themed bedsheets & full bedroom Loadouts for Anime, Gaming, and Car setups in Cairo & New Cairo.",
  icons: {
    icon: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/brand/logo.jpeg`,
  },
};

const PRE_PAINT_THEME_SCRIPT = `
(function() {
  try {
    var raw = localStorage.getItem('room_theme_snapshot_v1');
    if (!raw) return;
    var snap = JSON.parse(raw);
    var root = document.documentElement;
    if (snap.bgPrimary) root.style.setProperty('--color-bg-primary', snap.bgPrimary);
    if (snap.bgSecondary) root.style.setProperty('--color-bg-secondary', snap.bgSecondary);
    if (snap.bgElevated) {
      root.style.setProperty('--color-bg-elevated', snap.bgElevated);
      var p = snap.bgPrimary || '#05030a';
      var s = snap.bgSecondary || '#0b0617';
      root.style.setProperty('--color-bg-canvas-gradient', 'linear-gradient(180deg, ' + p + ' 0%, ' + s + ' 45%, ' + snap.bgElevated + ' 100%)');
    }
    var path = window.location.pathname || '';
    var match = path.match(/\\/universes\\/([^\\/]+)/);
    var slug = match && match[1];
    if (!slug && path.indexOf('/universe') !== -1 && window.location.search) {
      slug = new URLSearchParams(window.location.search).get('slug');
    }
    if (slug && snap.universes && snap.universes[slug]) {
      root.setAttribute('data-universe', slug);
      root.style.setProperty('--color-accent', snap.universes[slug]);
    } else if (snap.defaultAccent) {
      root.style.setProperty('--color-accent', snap.defaultAccent);
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${cinzel.variable} dark`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: PRE_PAINT_THEME_SCRIPT }} />
      </head>
      <body className="relative min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] selection:bg-[var(--color-accent)] selection:text-[var(--color-accent-foreground)]">
        <UniverseThemeSync />
        <AmbientBackground />
        <MyRoomTriggerAndDrawer />

        <main className="relative z-10">{children}</main>

        <StorefrontFooter />
      </body>
    </html>
  );
}
