"use client";

import { motion } from "framer-motion";
import { polarToCartesian } from "@/lib/arc";
import { fadeUpVariants } from "@/components/MotionEffects";

interface OrbitPlaceholderProps {
  cx: number;
  cy: number;
  radius: number;
  /** Angle (degrees, 0 = 12 o'clock, clockwise) at which the marker sits on the ring. */
  angle: number;
  index: number;
}

/**
 * A quiet "+" marker sitting on an orbit ring — a preview of where a
 * planet will be deployed once orbital scheduling ships. Purely
 * indicative in Phase 3: not a click target, nothing draggable, no
 * orbit assignment happens here.
 */
export default function OrbitPlaceholder({ cx, cy, radius, angle, index }: OrbitPlaceholderProps) {
  const pos = polarToCartesian(cx, cy, radius, angle);

  return (
    <motion.g custom={index} variants={fadeUpVariants} initial="hidden" animate="visible" aria-hidden="true">
      <circle
        cx={pos.x}
        cy={pos.y}
        r={7}
        fill="rgba(148, 163, 184, 0.05)"
        stroke="rgba(148, 163, 184, 0.28)"
        strokeWidth={1}
        strokeDasharray="2 2"
      />
      <line
        x1={pos.x - 3}
        y1={pos.y}
        x2={pos.x + 3}
        y2={pos.y}
        stroke="rgba(148, 163, 184, 0.55)"
        strokeWidth={1}
        strokeLinecap="round"
      />
      <line
        x1={pos.x}
        y1={pos.y - 3}
        x2={pos.x}
        y2={pos.y + 3}
        stroke="rgba(148, 163, 184, 0.55)"
        strokeWidth={1}
        strokeLinecap="round"
      />
    </motion.g>
  );
}
