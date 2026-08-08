"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { DAYS, SECTOR_ANGLE, DayInfo } from "@/lib/days";
import { describeTick } from "@/lib/arc";
import DaySector, { SectorState } from "./DaySector";
import {
  wheelEntranceVariants,
  wheelContainerStagger,
  fadeUpVariants,
} from "./MotionEffects";

const CX = 300;
const CY = 300;
const OUTER_R = 258;
const INNER_R = 152;
const CORE_R = 128;
const SECTOR_GAP = 3.2; // degrees of empty space between sectors

const NAV_DELAY_MS = 560;

export default function WeekWheel() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();

  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  const activeDay: DayInfo | undefined = useMemo(
    () => DAYS.find((d) => d.slug === (selectedSlug ?? hoveredSlug)),
    [selectedSlug, hoveredSlug]
  );

  function handleSelect(day: DayInfo) {
    if (selectedSlug) return; // ignore extra clicks mid-transition
    setSelectedSlug(day.slug);
    window.setTimeout(() => {
      router.push(`/universe/${day.slug}`);
    }, NAV_DELAY_MS);
  }

  function sectorState(day: DayInfo): SectorState {
    if (selectedSlug) {
      return selectedSlug === day.slug ? "selected" : "recedes";
    }
    return hoveredSlug === day.slug ? "hovered" : "idle";
  }

  const minorTickCount = DAYS.length * 8;
  const ticks = Array.from({ length: minorTickCount }, (_, i) => {
    const angle = i * (360 / minorTickCount);
    const isMajor = i % 8 === 0;
    return {
      angle,
      isMajor,
      d: describeTick(
        CX,
        CY,
        OUTER_R + 6,
        OUTER_R + (isMajor ? 17 : 10),
        angle
      ),
    };
  });

  const statusLabel = selectedSlug
    ? `ORBIT LOCK ENGAGED \u2014 ${activeDay?.label.toUpperCase()}`
    : activeDay
    ? `TARGET ACQUIRED \u2014 ${activeDay.label.toUpperCase()} / ${activeDay.designation}`
    : "AWAITING SELECTION";

  return (
    <div className="flex flex-col items-center gap-8">
      <motion.div
        variants={wheelEntranceVariants}
        initial="hidden"
        animate="visible"
        className="relative aspect-square w-[min(88vw,600px)]"
      >
        {/* outer glass bezel */}
        <div className="glass-panel absolute inset-[-14px] rounded-full shadow-[0_0_90px_rgba(34,211,238,0.06)]" />

        <svg
          viewBox="0 0 600 600"
          className="relative h-full w-full"
          role="group"
          aria-label="Weekly universe selector"
        >
          <defs>
            <filter id="sector-glow-blur" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="6" />
            </filter>
          </defs>

          {/* bezel ticks */}
          <g>
            {ticks.map((t, i) => (
              <path
                key={i}
                d={t.d}
                stroke={t.isMajor ? "#f5a524" : "rgba(148,163,184,0.28)"}
                strokeWidth={t.isMajor ? 1.4 : 1}
                strokeLinecap="round"
                opacity={t.isMajor ? 0.55 : 0.4}
              />
            ))}
          </g>

          {/* day sectors */}
          <motion.g
            variants={wheelContainerStagger}
            initial="hidden"
            animate="visible"
          >
            {DAYS.map((day, i) => {
              const start = i * SECTOR_ANGLE + SECTOR_GAP / 2;
              const end = (i + 1) * SECTOR_ANGLE - SECTOR_GAP / 2;
              return (
                <DaySector
                  key={day.slug}
                  day={day}
                  startAngle={start}
                  endAngle={end}
                  cx={CX}
                  cy={CY}
                  outerR={OUTER_R}
                  innerR={INNER_R}
                  state={sectorState(day)}
                  onHoverStart={() => setHoveredSlug(day.slug)}
                  onHoverEnd={() => setHoveredSlug(null)}
                  onSelect={() => handleSelect(day)}
                />
              );
            })}
          </motion.g>

          {/* instrument core — decorative only, not interactive */}
          <g>
            <circle
              cx={CX}
              cy={CY}
              r={CORE_R}
              fill="none"
              stroke="rgba(148,163,184,0.14)"
              strokeWidth={1}
            />
            <circle
              cx={CX}
              cy={CY}
              r={CORE_R - 22}
              fill="none"
              stroke="rgba(34,211,238,0.10)"
              strokeWidth={1}
            />
            {[0, 90, 180, 270].map((a) => {
              const rad = ((a - 90) * Math.PI) / 180;
              const x1 = CX + (CORE_R - 34) * Math.cos(rad);
              const y1 = CY + (CORE_R - 34) * Math.sin(rad);
              const x2 = CX + (CORE_R - 24) * Math.cos(rad);
              const y2 = CY + (CORE_R - 24) * Math.sin(rad);
              return (
                <line
                  key={a}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="rgba(148,163,184,0.22)"
                  strokeWidth={1}
                />
              );
            })}
            <motion.circle
              cx={CX}
              cy={CY}
              r={3.5}
              fill="#22d3ee"
              animate={
                prefersReducedMotion
                  ? { opacity: 0.75 }
                  : { opacity: [0.45, 0.95, 0.45], scale: [1, 1.25, 1] }
              }
              transition={
                prefersReducedMotion
                  ? undefined
                  : { duration: 4.5, repeat: Infinity, ease: "easeInOut" }
              }
              style={{ transformOrigin: `${CX}px ${CY}px` }}
            />
          </g>
        </svg>
      </motion.div>

      {/* HUD status readout */}
      <motion.div
        custom={0}
        variants={fadeUpVariants}
        initial="hidden"
        animate="visible"
        className="glass-panel rounded-full px-5 py-2"
      >
        <p className="font-mono text-[11px] tracking-widest2 text-cyan-glow/90">
          {statusLabel}
        </p>
      </motion.div>
    </div>
  );
}
