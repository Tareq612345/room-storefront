"use client";

export function AmbientBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* Subtle drifting midnight-violet & crimson/orchid nebula glows */}
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

      {/* Ultra-subtle twinkling starlight field */}
      <div className="ambient-stars-layer absolute inset-0 opacity-45" />
    </div>
  );
}
