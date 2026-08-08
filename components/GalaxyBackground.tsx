"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface Star {
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  opacity: number;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  driftX: number;
  driftY: number;
  delay: number;
  duration: number;
  opacity: number;
}

/** Small deterministic PRNG so the star field is identical on server and client. */
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateStars(count: number): Star[] {
  const rand = mulberry32(1337);
  return Array.from({ length: count }, () => ({
    x: rand() * 100,
    y: rand() * 100,
    size: 0.8 + rand() * 1.6,
    delay: rand() * 6,
    duration: 3 + rand() * 4,
    opacity: 0.3 + rand() * 0.7,
  }));
}

/** Larger, softly-glowing motes that drift almost imperceptibly — depth without distraction. */
function generateParticles(count: number): Particle[] {
  const rand = mulberry32(9001);
  return Array.from({ length: count }, () => ({
    x: rand() * 100,
    y: rand() * 100,
    size: 2 + rand() * 2.4,
    driftX: (rand() - 0.5) * 5,
    driftY: -4 - rand() * 6,
    delay: rand() * 12,
    duration: 42 + rand() * 30,
    opacity: 0.12 + rand() * 0.18,
  }));
}

export default function GalaxyBackground() {
  const prefersReducedMotion = useReducedMotion();
  const stars = useMemo(() => generateStars(170), []);
  const particles = useMemo(() => generateParticles(26), []);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-void">
      {/* base gradient — deep void to a faint nebula wash */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 0%, #0b1020 0%, #05060a 55%, #05060a 100%)",
        }}
      />

      {/* soft drifting nebula blobs */}
      <div
        className={`absolute -left-1/4 top-[-10%] h-[60vmax] w-[60vmax] rounded-full opacity-40 blur-3xl ${
          prefersReducedMotion ? "" : "animate-drift"
        }`}
        style={{
          background:
            "radial-gradient(circle, rgba(34,211,238,0.16) 0%, rgba(34,211,238,0) 70%)",
        }}
      />
      <div
        className={`absolute -right-1/4 bottom-[-15%] h-[55vmax] w-[55vmax] rounded-full opacity-30 blur-3xl ${
          prefersReducedMotion ? "" : "animate-drift"
        }`}
        style={{
          background:
            "radial-gradient(circle, rgba(245,165,36,0.10) 0%, rgba(245,165,36,0) 70%)",
          animationDelay: "-13s",
        }}
      />

      {/* faint deep-space haze, off-center and stationary — one more
          layer of depth behind the drifting blobs, kept extremely
          subtle (low opacity, no animation) so it reads as atmosphere
          rather than another visible shape */}
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 h-[85vmax] w-[85vmax] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.12] blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(139,150,172,0.10) 0%, rgba(139,150,172,0) 60%)",
        }}
      />

      {/* star field */}
      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
        {stars.map((star, i) => (
          <motion.circle
            key={i}
            cx={`${star.x}%`}
            cy={`${star.y}%`}
            r={star.size}
            fill="#e2e8f0"
            initial={{ opacity: star.opacity }}
            animate={
              prefersReducedMotion
                ? { opacity: star.opacity }
                : { opacity: [star.opacity * 0.3, star.opacity, star.opacity * 0.3] }
            }
            transition={
              prefersReducedMotion
                ? undefined
                : {
                    duration: star.duration,
                    delay: star.delay,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }
            }
          />
        ))}
      </svg>

      {/* slow floating particles — soft blue motes, barely moving */}
      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
        <defs>
          <filter id="particle-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="1.6" />
          </filter>
        </defs>
        {particles.map((p, i) => (
          <motion.circle
            key={i}
            cx={`${p.x}%`}
            cy={`${p.y}%`}
            r={p.size}
            fill="#60a5fa"
            filter="url(#particle-glow)"
            initial={{ opacity: p.opacity, x: 0, y: 0 }}
            animate={
              prefersReducedMotion
                ? { opacity: p.opacity }
                : {
                    opacity: [p.opacity * 0.5, p.opacity, p.opacity * 0.5],
                    x: [0, p.driftX, 0],
                    y: [0, p.driftY, 0],
                  }
            }
            transition={
              prefersReducedMotion
                ? undefined
                : {
                    duration: p.duration,
                    delay: p.delay,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }
            }
          />
        ))}
      </svg>

      {/* subtle vignette to keep focus on the wheel */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 55%, rgba(0,0,0,0) 0%, rgba(5,6,10,0.55) 100%)",
        }}
      />
    </div>
  );
}
