/**
 * @file src/modules/universes/components/UniverseStarHeader.tsx
 * @purpose Morphing Star Header: Primary sticky navigation with RM 4-point star emblem, Universe star nodes, full-bleed crisp dash tracks, and scroll-shrink animation.
 */

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { UniverseDTO } from "../schema";

interface UniverseStarHeaderProps {
  universes: UniverseDTO[];
  activeSlug?: string;
}

function FourPointStarFrame({
  size,
  glowColor,
  children,
}: {
  size: number;
  glowColor?: string;
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
        style={
          glowColor
            ? { filter: `drop-shadow(0 0 10px ${glowColor}77)` }
            : undefined
        }
      >
        <path
          d="M60 1 C61.5 47, 73 58.5, 120 60 C73 61.5, 61.5 73, 60 119 C58.5 73, 47 61.5, 0 60 C47 58.5, 58.5 47, 60 1 Z"
          stroke="rgba(255,255,255,0.85)"
          strokeWidth="1.2"
        />
        <path
          d="M60 16 C61.5 49, 71 58.5, 104 60 C71 61.5, 61.5 71, 60 104 C58.5 71, 49 61.5, 16 60 C49 58.5, 58.5 49, 60 16 Z"
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

const CRISP_DASH_MASKS = [
  "repeating-linear-gradient(90deg, #000 0 18px, transparent 18px 25px, #000 25px 32px, transparent 32px 38px)",
  "repeating-linear-gradient(90deg, #000 0 10px, transparent 10px 15px, #000 15px 30px, transparent 30px 36px)",
  "repeating-linear-gradient(90deg, #000 0 24px, transparent 24px 30px, #000 30px 36px, transparent 36px 44px)",
  "repeating-linear-gradient(90deg, #000 0 14px, transparent 14px 20px, #000 20px 36px, transparent 36px 43px)",
  "repeating-linear-gradient(90deg, #000 0 8px, transparent 8px 14px, #000 14px 22px, transparent 22px 28px)",
];

function CyberDashTrack({
  side,
  isScrolled,
}: {
  side: "left" | "right";
  isScrolled: boolean;
}) {
  const isLeft = side === "left";

  return (
    <div
      className={`flex flex-1 flex-col justify-center gap-[2.5px] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isLeft ? "-mr-3" : "-ml-3"
      } ${isScrolled ? "opacity-45 scale-y-75" : "opacity-85"}`}
      aria-hidden="true"
    >
      {CRISP_DASH_MASKS.map((mask, idx) => (
        <div
          key={`${side}-dash-${idx}`}
          className="h-[1px] w-full"
          style={{
            maskImage: mask,
            WebkitMaskImage: mask,
            background: isLeft
              ? "linear-gradient(90deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.88) 100%)"
              : "linear-gradient(90deg, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.08) 100%)",
          }}
        />
      ))}
    </div>
  );
}

function UniverseGlyph({ slug }: { slug: string }) {
  if (slug === "cars") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M5 14l1.5-4.5A2 2 0 0 1 8.4 8h7.2a2 2 0 0 1 1.9 1.5L19 14" />
        <rect x="3" y="14" width="18" height="4" rx="1.5" />
        <circle cx="7" cy="18" r="1.5" fill="currentColor" />
        <circle cx="17" cy="18" r="1.5" fill="currentColor" />
      </svg>
    );
  }
  if (slug === "gaming") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M6 11h4M8 9v4M15.5 11.5h.01M17.5 10.5h.01" strokeLinecap="round" />
        <path d="M4.5 16.5L6 9.5A3 3 0 0 1 8.9 7h6.2A3 3 0 0 1 18 9.5l1.5 7a2 2 0 0 1-3.3 1.7L14 16h-4l-2.2 2.2a2 2 0 0 1-3.3-1.7Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 4a8 8 0 0 0 0 16M4 12h16M7 7.5c3 1.5 7 1.5 10 0M7 16.5c3-1.5 7-1.5 10 0" />
    </svg>
  );
}

export function UniverseStarHeader({
  universes,
  activeSlug,
}: UniverseStarHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 36);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const leftNodes = universes.slice(0, 2);
  const rightNodes = universes.slice(1, 3);

  return (
    <header
      className={`sticky top-0 z-40 w-full select-none transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isScrolled
          ? "border-b border-white/10 bg-black/75 py-1.5 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.6)]"
          : "bg-transparent pt-5 pb-3"
      }`}
    >
      <div className="flex w-full items-center justify-center">
        {/* Left Full-Bleed Crisp Dash Track connected to outer star tip */}
        <CyberDashTrack side="left" isScrolled={isScrolled} />

        {/* Left flanking Universe stars (compress smoothly on scroll) */}
        <div
          className={`hidden sm:flex items-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isScrolled ? "scale-[0.72] -mr-4" : "scale-100"
          }`}
        >
          {leftNodes.map((univ) => (
            <Link
              key={`left-${univ.id}`}
              href={`/universes/${univ.slug}`}
              title={univ.name}
              className="group relative -mx-[1px] transition-transform duration-300 hover:z-30 hover:scale-110"
            >
              <FourPointStarFrame
                size={74}
                glowColor={
                  activeSlug === univ.slug ? univ.accentColor : undefined
                }
              >
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/85 transition-all duration-300 group-hover:border-white/75"
                  style={
                    activeSlug === univ.slug
                      ? {
                          borderColor: univ.accentColor,
                          boxShadow: `0 0 14px ${univ.accentColor}88`,
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

        {/* Center RM Signature Star Emblem (morphs smoothly on scroll) */}
        <Link
          href="/"
          className={`group relative z-20 -mx-[1px] flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-105 ${
            isScrolled ? "scale-[0.58] -my-6" : "scale-100"
          }`}
          aria-label="ROOM Home"
        >
          <FourPointStarFrame size={120}>
            <div className="relative h-16 w-16">
              <span className="absolute left-1.5 top-0.5 font-serif text-2xl font-semibold tracking-tight text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]">
                R
              </span>
              <span className="absolute bottom-0.5 right-1 font-serif text-2xl font-semibold tracking-tight text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]">
                M
              </span>
            </div>
          </FourPointStarFrame>
        </Link>

        {/* Right flanking Universe stars (compress smoothly on scroll) */}
        <div
          className={`hidden sm:flex items-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isScrolled ? "scale-[0.72] -ml-4" : "scale-100"
          }`}
        >
          {rightNodes.map((univ) => (
            <Link
              key={`right-${univ.id}`}
              href={`/universes/${univ.slug}`}
              title={univ.name}
              className="group relative -mx-[1px] transition-transform duration-300 hover:z-30 hover:scale-110"
            >
              <FourPointStarFrame
                size={74}
                glowColor={
                  activeSlug === univ.slug ? univ.accentColor : undefined
                }
              >
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/85 transition-all duration-300 group-hover:border-white/75"
                  style={
                    activeSlug === univ.slug
                      ? {
                          borderColor: univ.accentColor,
                          boxShadow: `0 0 14px ${univ.accentColor}88`,
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

        {/* Right Full-Bleed Crisp Dash Track connected to outer star tip */}
        <CyberDashTrack side="right" isScrolled={isScrolled} />
      </div>

      {/* Compact Universe Pills on Mobile (<640px) */}
      <div
        className={`flex items-center justify-center gap-2.5 sm:hidden transition-all duration-300 ${
          isScrolled ? "mt-1 scale-90" : "mt-2"
        }`}
      >
        {universes.map((univ) => (
          <Link
            key={`mob-${univ.id}`}
            href={`/universes/${univ.slug}`}
            className="flex items-center gap-1.5 rounded-full border border-white/15 bg-black/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-white/85"
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
