"use client";

import Link from "next/link";
import type { UniverseDTO } from "../schema";

interface UniverseStarHeaderProps {
  universes: UniverseDTO[];
  activeSlug?: string;
}

function FourPointStarFrame({
  size,
  children,
}: {
  size: number;
  children?: React.ReactNode;
}) {
  return (
    <div
      className="relative flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 120 120"
        className="absolute inset-0 h-full w-full pointer-events-none"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M60 2 C62 46, 74 58, 118 60 C74 62, 62 74, 60 118 C58 74, 46 62, 2 60 C46 58, 58 46, 60 2 Z"
          stroke="rgba(255,255,255,0.72)"
          strokeWidth="1.15"
        />
        <path
          d="M60 18 C61.5 49, 71 58.5, 102 60 C71 61.5, 61.5 71, 60 102 C58.5 71, 49 61.5, 18 60 C49 58.5, 58.5 49, 60 18 Z"
          stroke="rgba(255,255,255,0.32)"
          strokeWidth="0.9"
        />
      </svg>
      <div className="relative z-10 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

function CyberDashTrack({ side }: { side: "left" | "right" }) {
  return (
    <div
      className={`hidden md:flex flex-1 flex-col gap-[5px] opacity-65 ${
        side === "left" ? "items-end pr-2" : "items-start pl-2"
      }`}
      aria-hidden="true"
    >
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/45 to-white/60 [mask-image:repeating-linear-gradient(90deg,#000_0_14px,transparent_14px_22px)]" />
      <div className="h-[1px] w-[92%] bg-gradient-to-r from-transparent via-white/35 to-white/55 [mask-image:repeating-linear-gradient(90deg,#000_0_24px,transparent_24px_32px)]" />
      <div className="h-[1px] w-[96%] bg-gradient-to-r from-transparent via-white/50 to-white/70 [mask-image:repeating-linear-gradient(90deg,#000_0_10px,transparent_10px_16px)]" />
      <div className="h-[1px] w-[88%] bg-gradient-to-r from-transparent via-white/30 to-white/45 [mask-image:repeating-linear-gradient(90deg,#000_0_18px,transparent_18px_28px)]" />
    </div>
  );
}

function UniverseGlyph({ slug }: { slug: string }) {
  if (slug === "cars") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M5 14l1.5-4.5A2 2 0 0 1 8.4 8h7.2a2 2 0 0 1 1.9 1.5L19 14" />
        <rect x="3" y="14" width="18" height="4" rx="1.5" />
        <circle cx="7" cy="18" r="1.5" fill="currentColor" />
        <circle cx="17" cy="18" r="1.5" fill="currentColor" />
      </svg>
    );
  }
  if (slug === "gaming") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M6 11h4M8 9v4M15.5 11.5h.01M17.5 10.5h.01" strokeLinecap="round" />
        <path d="M4.5 16.5L6 9.5A3 3 0 0 1 8.9 7h6.2A3 3 0 0 1 18 9.5l1.5 7a2 2 0 0 1-3.3 1.7L14 16h-4l-2.2 2.2a2 2 0 0 1-3.3-1.7Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 4a8 8 0 0 0 0 16M4 12h16M7 7.5c3 1.5 7 1.5 10 0M7 16.5c3-1.5 7-1.5 10 0" />
    </svg>
  );
}

export function UniverseStarHeader({
  universes,
  activeSlug,
}: UniverseStarHeaderProps) {
  const leftNodes = universes.slice(0, 2);
  const rightNodes = universes.slice(1, 3);

  return (
    <section className="relative w-full pt-8 pb-6 overflow-hidden">
      <div className="mx-auto flex max-w-7xl items-center justify-center px-4">
        <CyberDashTrack side="left" />

        {/* Left flanking Universe stars */}
        <div className="hidden sm:flex items-center -mr-3">
          {leftNodes.map((univ) => (
            <Link
              key={`left-${univ.id}`}
              href={`/universes/${univ.slug}`}
              title={univ.name}
              className="group transition-transform duration-300 hover:scale-110 -mx-1"
            >
              <FourPointStarFrame size={78}>
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
                    activeSlug === univ.slug
                      ? "border-white bg-white/15"
                      : "border-white/20 bg-black/70 group-hover:border-white/60"
                  }`}
                >
                  <UniverseGlyph slug={univ.slug} />
                </span>
              </FourPointStarFrame>
            </Link>
          ))}
        </div>

        {/* Center RM Signature Star Emblem */}
        <Link
          href="/"
          className="group relative z-20 mx-1 flex items-center justify-center transition-transform duration-300 hover:scale-105"
          aria-label="ROOM Home"
        >
          <FourPointStarFrame size={136}>
            <div className="relative h-20 w-20 select-none">
              <span
                className="absolute left-2 top-1 font-serif text-3xl font-semibold tracking-tight text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.35)]"
              >
                R
              </span>
              <span
                className="absolute bottom-1 right-1 font-serif text-3xl font-semibold tracking-tight text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.35)]"
              >
                M
              </span>
            </div>
          </FourPointStarFrame>
        </Link>

        {/* Right flanking Universe stars */}
        <div className="hidden sm:flex items-center -ml-3">
          {rightNodes.map((univ) => (
            <Link
              key={`right-${univ.id}`}
              href={`/universes/${univ.slug}`}
              title={univ.name}
              className="group transition-transform duration-300 hover:scale-110 -mx-1"
            >
              <FourPointStarFrame size={78}>
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
                    activeSlug === univ.slug
                      ? "border-white bg-white/15"
                      : "border-white/20 bg-black/70 group-hover:border-white/60"
                  }`}
                >
                  <UniverseGlyph slug={univ.slug} />
                </span>
              </FourPointStarFrame>
            </Link>
          ))}
        </div>

        <CyberDashTrack side="right" />
      </div>
    </section>
  );
}
