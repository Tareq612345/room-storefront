import type { Metadata } from "next";
import { Cinzel, Plus_Jakarta_Sans } from "next/font/google";
import { MyRoomTriggerAndDrawer } from "@modules/cart-checkout";
import { AmbientBackground } from "@shared/components/AmbientBackground";
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${cinzel.variable} dark`}>
      <body className="relative min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] selection:bg-[var(--color-accent)] selection:text-white">
        <AmbientBackground />
        <MyRoomTriggerAndDrawer />

        <main className="relative z-10">{children}</main>

        <footer className="relative z-10 border-t border-[var(--color-border-subtle)] bg-black/60 py-8 text-center text-xs text-[var(--color-text-muted)]">
          <div className="mx-auto max-w-6xl px-4">
            <p className="font-serif tracking-[0.2em] text-white/80">ROOM</p>
            <p className="mt-2">
              Cairo &amp; New Cairo Express Delivery • COD &amp; Online Payments
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
