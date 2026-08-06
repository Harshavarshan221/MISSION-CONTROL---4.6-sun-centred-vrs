"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Sun } from "lucide-react";
import type { DayInfo } from "@/lib/days";

interface HelioCoreProps {
  day: DayInfo;
  /** 0-100. Derived from completed-vs-scheduled planets — see UniverseLayout. */
  solarCharge: number;
}

/**
 * Helio — the sun at the exact center of the Day Universe screen.
 * Phase 4.5 replaces the old Mission Control instrument card with
 * this: not a panel, just a warm glowing sphere with a soft corona.
 * Planets are the hero now; Helio is the quiet anchor everything
 * orbits, so it stays small (140-170px) and gets brighter — never
 * bigger — as Solar Charge rises with completed planets.
 */
export default function HelioCore({ day, solarCharge }: HelioCoreProps) {
  const prefersReducedMotion = useReducedMotion();
  const chargeRef = useRef(solarCharge);
  const [pulse, setPulse] = useState(0);

  // A brief extra brightness pulse whenever charge actually rises —
  // Solar Charge itself already keeps Helio persistently brighter, but
  // a completion should still feel like a distinct moment.
  useEffect(() => {
    if (solarCharge > chargeRef.current) setPulse((n) => n + 1);
    chargeRef.current = solarCharge;
  }, [solarCharge]);

  const chargeRatio = Math.max(0, Math.min(100, solarCharge)) / 100;
  const coronaOpacity = 0.35 + chargeRatio * 0.45;
  const glowSpread = 46 + chargeRatio * 34;

  return (
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
      {/* corona — soft outer bloom, brightens with charge, never resizes */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: "clamp(140px, 20vw, 170px)",
          height: "clamp(140px, 20vw, 170px)",
          background:
            "radial-gradient(circle, rgba(255,200,87,0.9) 0%, rgba(255,165,36,0.35) 45%, rgba(255,165,36,0) 72%)",
          filter: "blur(18px)",
        }}
        animate={
          prefersReducedMotion
            ? { opacity: coronaOpacity }
            : { opacity: [coronaOpacity * 0.85, coronaOpacity, coronaOpacity * 0.85], scale: [1, 1.04, 1] }
        }
        transition={prefersReducedMotion ? undefined : { duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* charge pulse — a one-shot brightening the instant a planet completes */}
      {pulse > 0 && (
        <motion.div
          key={pulse}
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: "clamp(140px, 20vw, 170px)",
            height: "clamp(140px, 20vw, 170px)",
            background: "radial-gradient(circle, rgba(255,248,225,0.9) 0%, rgba(255,200,87,0) 70%)",
          }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: [0, 0.9, 0], scale: [0.9, 1.25, 1.3] }}
          transition={{ duration: 1.1, ease: "easeOut" }}
        />
      )}

      {/* the sphere itself — warm gradient, no card, no border */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 160, damping: 20, delay: 0.2, duration: 0.7 }}
        className="relative flex aspect-square w-[clamp(140px,20vw,170px)] flex-col items-center justify-center rounded-full text-center"
        style={{
          background:
            "radial-gradient(circle at 38% 32%, #fff8e1 0%, #ffe0a3 14%, #ffc857 34%, #f5a524 58%, #d97706 80%, #b45309 100%)",
          boxShadow: `0 0 ${glowSpread}px rgba(255,165,36,0.55), 0 0 ${glowSpread * 2.2}px rgba(255,165,36,${(0.16 + chargeRatio * 0.14).toFixed(2)}), inset -6px -8px 20px rgba(120,53,15,0.35), inset 4px 6px 14px rgba(255,255,255,0.35)`,
        }}
      >
        <Sun size={15} strokeWidth={1.75} className="text-amber-950/80" />
        <p className="mt-1.5 font-mono text-[7px] font-semibold uppercase tracking-widest2 text-amber-950/85">
          Helio
        </p>
        <p className="mt-1 font-mono text-[6.5px] uppercase tracking-widest2 text-amber-950/60">
          Universe {day.designation} · {day.label}
        </p>
        <div className="mt-2 h-px w-6 bg-amber-950/25" />
        <p className="mt-2 font-mono text-[6.5px] uppercase tracking-widest2 text-amber-950/70">
          Solar Charge
        </p>
        <p className="font-display text-sm text-amber-950">{Math.round(solarCharge)}%</p>
      </motion.div>
    </div>
  );
}
