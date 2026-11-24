/**
 * @file src/shared/components/AmbientBackground.tsx
 * @purpose Continuous Live-Wallpaper Background: Smooth 60fps canvas stardust & aurora waves behind the entire storefront (zero distraction on products).
 */

"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  twinkleSpeed: number;
  phase: number;
  color: string;
}

const PARTICLE_COLORS = [
  "255, 255, 255",
  "201, 75, 153",
  "99, 102, 241",
  "217, 35, 35",
];

export function AmbientBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId = 0;
    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    const count = Math.min(75, Math.max(36, Math.floor((width * height) / 22000)));
    const particles: Particle[] = Array.from({ length: count }, (_, idx) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.22,
      vy: -0.12 - Math.random() * 0.25,
      radius: 0.7 + Math.random() * 1.4,
      alpha: 0.2 + Math.random() * 0.55,
      twinkleSpeed: 0.012 + Math.random() * 0.02,
      phase: Math.random() * Math.PI * 2,
      color: PARTICLE_COLORS[idx % PARTICLE_COLORS.length] ?? "255, 255, 255",
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.phase += p.twinkleSpeed;

        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        const currentAlpha = p.alpha * (0.55 + 0.45 * Math.sin(p.phase));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${currentAlpha.toFixed(3)})`;
        ctx.fill();
      }

      animationFrameId = window.requestAnimationFrame(render);
    };

    animationFrameId = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* Slow-breathing live aurora blobs */}
      <div
        className="animate-nebula-slow absolute -top-40 left-1/4 h-[520px] w-[520px] rounded-full opacity-20 blur-[130px]"
        style={{ background: "radial-gradient(circle, #4338ca 0%, transparent 70%)" }}
      />
      <div
        className="animate-nebula-reverse absolute top-1/3 -right-32 h-[460px] w-[460px] rounded-full opacity-15 blur-[130px]"
        style={{ background: "radial-gradient(circle, #c94b99 0%, transparent 70%)" }}
      />
      <div
        className="animate-nebula-slow absolute -bottom-40 left-1/3 h-[500px] w-[500px] rounded-full opacity-15 blur-[140px]"
        style={{ background: "radial-gradient(circle, #d92323 0%, transparent 70%)" }}
      />

      {/* Continuous 60fps floating stardust canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
