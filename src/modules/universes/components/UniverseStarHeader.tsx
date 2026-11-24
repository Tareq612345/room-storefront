"use client";

import Link from "next/link";
import type { UniverseDTO } from "../schema";

interface UniverseStarHeaderProps {
  universes: UniverseDTO[];
  activeSlug?: string;
}

function FourPointStarFrame({
  size,
  glowColor,
  isCenter = false,
  children,
}: {
  size: number;
  glowColor?: string;
  isCenter?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`relative flex items-center justify-center shrink-0 ${
        isCenter ? "animate-star-breathe" : ""
      }`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 120 120"
        className="absolute inset-0 h-full w-full pointer-events-none transition-all duration-300"
        fill="none"
        aria-hidden="true"
        style={
          glowColor
            ? { filter: `drop-shadow(0 0 10px ${glowColor}66)` }
            : undefined
        }
      >
        {/* Outer crisp 4-point star touching horizontal edges at x=0 and x=120 */}
        <path
          d="M60 1 C61.5 47, 73 58.5, 120 60 C73 61.5, 61.5 73, 60 119 C58.5 73, 47 61.5, 0 60 C47 58.5, 58.5 47, 60 1 Z"
          stroke="rgba(255,255,255,0.82)"
          strokeWidth="1.25"
        />
        {/* Inner layered echo star */}
        <path
          d="M60 16 C61.5 49, 71 58.5, 104 60 C71 61.5, 61.5 71, 60 104 C58.5 71, 49 61.5, 16 60 C49 58.5, 58.5 49, 60 16 Z"
          stroke="rgba(255,255,255,0.34)"
          strokeWidth="0.9"
        />
      </svg>
      <div className="relative z-10 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

const TRACK_MASKS = [
  "repeating-linear-gradient(90deg, #000 0 22px, transparent 22px 30px, #000 30px 40px, transparent 40px 46px)",
  "repeating-linear-gradient(90deg, #000 0 12px, transparent 12px 18px, #000 18px 36px, transparent 36px 44px)",
  "repeating-linear-gradient(90deg, #000 0 28px, transparent 28px 35px, #000 35px 42px, transparent 42px 50px)",
  "repeating-linear-gradient(90deg, #000 0 16px, transparent 16px 24px, #000 24px 44px, transparent 44px 52px)",
  "repeating-linear-gradient(90deg, #000 0 10px, transparent 10px 16px, #000 16px 26px, transparent 26px 34px)",
  "repeating-linear-gradient(90deg, #000 0 24px, transparent 24px 32px, #000 32px 38px, transparent 38px 46px)",
];

function FullBleedCyberTrack({ side }: { side: "left" | "right" }) {
  const isLeft = side === "left";

  return (
    <div
      className="relative flex flex-1 flex-col justify-center gap-[4px] overflow-hidden py-2"
      aria-hidden="true"
    >
      {TRACK_MASKS.map((mask, idx) => (
        <div
          key={`${side}-line-${idx}`}
          className="relative h-[1.25px] w-full overflow-hidden"
          style={{
            maskImage: mask,
            WebkitMaskImage: mask,
          }}
        >
          {/* Base crisp white dashed line fading gently toward the outer viewport edge */}
          <div
            className="absolute inset-0"
            style={{
              background: isLeft
                ? "linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.65) 100%)"
                : "linear-gradient(90deg, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0.05) 100%)",
            }}
          />
          {/* Animated traveling light pulse */}
          <div
            className={`absolute inset-y-0 w-1/3 ${
              isLeft ? "animate-track-left" : "animate-track-right"
            }`}
            style={{
              animationDelay: `${idx * 0.45}s`,
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.95) 50%, rgba(201,75,153,0.9) 75%, transparent 100%)",
            }}
          />
        </div>
      ))}
    </div>
  );
}

function UniverseGlyph({ slug }: { slug: string }) {
  if (slug === "cars") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4 md:h-5 md:w-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M5 14l1.5-4.5A2 2 0 0 1 8.4 8h7.2a2 2 0 0 1 1.9 1.5L19 14" />
        <rect x="3" y="14" width="18" height="4" rx="1.5" />
        <circle cx="7" cy="18" r="1.5" fill="currentColor" />
        <circle cx="17" cy="18" r="1.5" fill="currentColor" />
      </svg>
    );
  }
  if (slug === "gaming") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4 md:h-5 md:w-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M6 11h4M8 9v4M15.5 11.5h.01M17.5 10.5h.01" strokeLinecap="round" />
        <path d="M4.5 16.5L6 9.5A3 3 0 0 1 8.9 7h6.2A3 3 0 0 1 18 9.5l1.5 7a2 2 0 0 1-3.3 1.7L14 16h-4l-2.2 2.2a2 2 0 0 1-3.3-1.7Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 md:h-5 md:w-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.7">
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
    <header className="relative w-full pt-5 pb-4 overflow-hidden select-none">
      <div className="flex w-full items-center justify-center">
        {/* Left Full-Bleed Cyber Track touching outer star tip */}
        <FullBleedCyberTrack side="left" />

        {/* Left flanking Universe stars (tips connected) */}
        <div className="hidden sm:flex items-center">
          {leftNodes.map((univ) => (
            <Link
              key={`left-${univ.id}`}
              href={`/universes/${univ.slug}`}
              title={univ.name}
              className="group relative -mx-[1px] transition-transform duration-300 hover:z-30 hover:scale-110"
            >
              <FourPointStarFrame
                size={84}
                glowColor={
                  activeSlug === univ.slug ? univ.accentColor : undefined
                }
              >
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/80 transition-all duration-300 group-hover:border-white/70"
                  style={
                    activeSlug === univ.slug
                      ? {
                          borderColor: univ.accentColor,
                          boxShadow: `0 0 16px ${univ.accentColor}88`,
                        }
                      : undefined
                  }
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
          className="group relative z-20 -mx-[2px] flex items-center justify-center transition-transform duration-300 hover:scale-105"
          aria-label="ROOM Home"
        >
          <FourPointStarFrame size={142} isCenter>
            <div className="relative h-20 w-20">
              <span className="absolute left-2 top-1 font-serif text-3xl font-semibold tracking-tight text-white drop-shadow-[0_0_14px_rgba(255,255,255,0.45)]">
                R
              </span>
              <span className="absolute bottom-1 right-1 font-serif text-3xl font-semibold tracking-tight text-white drop-shadow-[0_0_14px_rgba(255,255,255,0.45)]">
                M
              </span>
            </div>
          </FourPointStarFrame>
        </Link>

        {/* Right flanking Universe stars (tips connected) */}
        <div className="hidden sm:flex items-center">
          {rightNodes.map((univ) => (
            <Link
              key={`right-${univ.id}`}
              href={`/universes/${univ.slug}`}
              title={univ.name}
              className="group relative -mx-[1px] transition-transform duration-300 hover:z-30 hover:scale-110"
            >
              <FourPointStarFrame
                size={84}
                glowColor={
                  activeSlug === univ.slug ? univ.accentColor : undefined
                }
              >
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/80 transition-all duration-300 group-hover:border-white/70"
                  style={
                    activeSlug === univ.slug
                      ? {
                          borderColor: univ.accentColor,
                          boxShadow: `0 0 16px ${univ.accentColor}88`,
                        }
                      : undefined
                  }
                >
                  <UniverseGlyph slug={univ.slug} />
                </span>
              </FourPointStarFrame>
            </Link>
          ))}
        </div>

        {/* Right Full-Bleed Cyber Track touching outer star tip */}
        <FullBleedCyberTrack side="right" />
      </div>

      {/* Compact Universe Star Pills on Mobile (<640px) */}
      <div className="mt-3 flex items-center justify-center gap-3 sm:hidden">
        {universes.map((univ) => (
          <Link
            key={`mob-${univ.id}`}
            href={`/universes/${univ.slug}`}
            className="flex items-center gap-1.5 rounded-full border border-white/15 bg-black/70 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/85"
            style={
              activeSlug === univ.slug
                ? { borderColor: univ.accentColor, color: "#ffffff" }
                : undefined
            }
          >
            <UniverseGlyph slug={univ.slug} />
            <span>{univ.slug}</span>
          </Link>
        ))}
      </div>
    </header>
  );
}
