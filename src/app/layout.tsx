import type { Metadata } from "next";
import { Cinzel, Plus_Jakarta_Sans } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
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
      <body className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] selection:bg-[var(--color-accent)] selection:text-white">
        <header className="sticky top-0 z-50 border-b border-[var(--color-border-subtle)] bg-black/75 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/brand/logo.jpeg"
                alt="ROOM Logo"
                width={38}
                height={38}
                className="rounded-lg border border-white/15 object-cover"
              />
              <span className="font-serif text-lg font-semibold tracking-[0.22em] text-white">
                ROOM
              </span>
            </Link>

            <nav className="hidden items-center gap-7 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-secondary)] md:flex">
              <Link href="/universes/cars" className="transition-colors hover:text-white">
                Cars
              </Link>
              <Link href="/universes/gaming" className="transition-colors hover:text-white">
                Gaming
              </Link>
              <Link href="/universes/anime" className="transition-colors hover:text-white">
                Anime
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <span className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-[var(--color-text-secondary)] sm:inline-block">
                Cairo • New Cairo
              </span>
              <button
                type="button"
                className="rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:border-white/40 hover:bg-white/15"
              >
                My Room (0)
              </button>
            </div>
          </div>
        </header>

        <main>{children}</main>

        <footer className="border-t border-[var(--color-border-subtle)] bg-black/60 py-8 text-center text-xs text-[var(--color-text-muted)]">
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
