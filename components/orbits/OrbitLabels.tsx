"use client";

import { motion } from "framer-motion";
import { polarToCartesian, tangentialRotation } from "@/lib/arc";
import { fadeUpVariants } from "@/components/MotionEffects";

interface OrbitLabelProps {
  cx: number;
  cy: number;
  radius: number;
  label: string;
  /** Angle (degrees, 0 = 12 o'clock, clockwise) at which the tag sits on the ring. */
  angle: number;
  index: number;
  /**
   * Renders the tag at a larger, higher-contrast size — used for the
   * final/largest orbit, which (a) has the most circumferential room
   * to spend on it and (b) is the one most likely to carry a lot of
   * deployed planets, so its own label needs to read clearly at a
   * glance rather than blend in at the same small size as the others.
   */
  emphasized?: boolean;
}

/**
 * A small mono readout tagging one orbit ring — a short tick mark plus
 * uppercase label, set tangent to the ring it describes. Purely
 * informational chrome; not interactive.
 */
export default function OrbitLabels({ cx, cy, radius, label, angle, index, emphasized = false }: OrbitLabelProps) {
  const tickInner = polarToCartesian(cx, cy, radius - 5, angle);
  const tickOuter = polarToCartesian(cx, cy, radius + 5, angle);
  const textPos = polarToCartesian(cx, cy, radius - (emphasized ? 15 : 12), angle);
  const rotation = tangentialRotation(angle);

  return (
    <motion.g custom={index} variants={fadeUpVariants} initial="hidden" animate="visible">
      <line
        x1={tickInner.x}
        y1={tickInner.y}
        x2={tickOuter.x}
        y2={tickOuter.y}
        stroke="rgba(34, 211, 238, 0.5)"
        strokeWidth={1}
      />
      <text
        x={textPos.x}
        y={textPos.y}
        transform={`rotate(${rotation} ${textPos.x} ${textPos.y})`}
        textAnchor="middle"
        dominantBaseline="middle"
        className="select-none font-mono uppercase"
        style={{
          fontSize: emphasized ? 9.5 : 7.5,
          letterSpacing: "0.16em",
          fill: emphasized ? "rgba(226, 232, 240, 0.82)" : "rgba(148, 163, 184, 0.68)",
        }}
      >
        {label}
      </text>
    </motion.g>
  );
}
