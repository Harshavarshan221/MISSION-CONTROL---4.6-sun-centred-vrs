"use client";

import { motion } from "framer-motion";
import type { Point } from "@/lib/arc";

interface CompletionBurstProps {
  from: Point;
  to: Point;
  color: string;
}

const PARTICLE_COUNT = 5;

/**
 * A short-lived burst of particles leaving a just-completed planet and
 * flying toward Helio at the stage center — the "energy transfer" beat
 * of the completion animation. Purely decorative (aria-hidden) and
 * self-contained: PlacedPlanet mounts this for ~1s when `completed`
 * flips false -> true, then unmounts it. No state lives here.
 */
export default function CompletionBurst({ from, to, color }: CompletionBurstProps) {
  return (
    <g aria-hidden="true">
      {Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
        // Slight spread on the starting point so particles don't all
        // travel the exact same line — reads as several motes of
        // light, not one dot.
        const spread = (i - (PARTICLE_COUNT - 1) / 2) * 3;
        const startX = from.x + spread;
        const startY = from.y + spread * 0.6;
        const delay = i * 0.05;

        return (
          <motion.circle
            key={i}
            r={2.2}
            fill={color}
            initial={{ opacity: 0 }}
            animate={{
              cx: [startX, startX, to.x],
              cy: [startY, startY, to.y],
              opacity: [0, 1, 0],
              scale: [0.6, 1, 0.3],
            }}
            transition={{ duration: 0.85, delay, ease: "easeIn", times: [0, 0.15, 1] }}
            style={{ filter: `drop-shadow(0 0 4px ${color})`, transformOrigin: `${startX}px ${startY}px` }}
          />
        );
      })}
    </g>
  );
}
