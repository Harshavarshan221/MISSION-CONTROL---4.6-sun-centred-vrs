"use client";

import { motion, useReducedMotion } from "framer-motion";
import { orbitRingVariants } from "@/components/MotionEffects";

interface OrbitRingProps {
  cx: number;
  cy: number;
  radius: number;
  /** Position in the orbit stack — varies rotation speed and direction so the stack doesn't feel mechanical. */
  index: number;
  /** True while a dragged planet is hovering over this ring's drop band. */
  highlighted?: boolean;
}

/**
 * A single orbital path: a dashed instrument circle with a faint glow
 * line beneath it. Each ring drifts in its own very slow, independent
 * rotation so the stack reads as a living orbital system without ever
 * feeling busy or distracting. While a dragged planet hovers over it,
 * the ring brightens and gains a soft halo so the drop target is
 * unmistakable.
 */
export default function OrbitRing({ cx, cy, radius, index, highlighted = false }: OrbitRingProps) {
  const prefersReducedMotion = useReducedMotion();
  const duration = 160 + index * 55; // deliberately slow; each ring is out of phase with the others
  const direction = index % 2 === 0 ? 360 : -360;

  return (
    <motion.g variants={orbitRingVariants}>
      {highlighted && (
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="rgba(34, 211, 238, 0.5)"
          strokeWidth={14}
          opacity={0.16}
        />
      )}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke={highlighted ? "rgba(34, 211, 238, 0.5)" : "rgba(148, 163, 184, 0.15)"}
        strokeWidth={highlighted ? 1.6 : 1}
      />
      <motion.circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke={highlighted ? "rgba(34, 211, 238, 0.75)" : "rgba(34, 211, 238, 0.34)"}
        strokeWidth={highlighted ? 1.6 : 1.1}
        strokeDasharray="1.5 10"
        strokeLinecap="round"
        style={{ transformOrigin: `${cx}px ${cy}px` }}
        animate={prefersReducedMotion ? undefined : { rotate: direction }}
        transition={
          prefersReducedMotion ? undefined : { duration, repeat: Infinity, ease: "linear" }
        }
      />
    </motion.g>
  );
}
