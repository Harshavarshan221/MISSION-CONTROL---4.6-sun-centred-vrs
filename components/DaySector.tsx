"use client";

import { motion } from "framer-motion";
import type { DayInfo } from "@/lib/days";
import {
  describeDonutSegment,
  polarToCartesian,
  tangentialRotation,
} from "@/lib/arc";
import { sectorEntranceVariants, springTransition } from "./MotionEffects";

export type SectorState = "idle" | "hovered" | "selected" | "recedes";

interface DaySectorProps {
  day: DayInfo;
  startAngle: number;
  endAngle: number;
  cx: number;
  cy: number;
  outerR: number;
  innerR: number;
  state: SectorState;
  onHoverStart: () => void;
  onHoverEnd: () => void;
  onSelect: () => void;
}

const PUSH: Record<SectorState, number> = {
  idle: 0,
  hovered: 6,
  selected: 11,
  recedes: 0,
};

const SCALE: Record<SectorState, number> = {
  idle: 1,
  hovered: 1.015,
  selected: 1.035,
  recedes: 0.985,
};

const OPACITY: Record<SectorState, number> = {
  idle: 1,
  hovered: 1,
  selected: 1,
  recedes: 0.32,
};

export default function DaySector({
  day,
  startAngle,
  endAngle,
  cx,
  cy,
  outerR,
  innerR,
  state,
  onHoverStart,
  onHoverEnd,
  onSelect,
}: DaySectorProps) {
  const midAngle = (startAngle + endAngle) / 2;
  const dir = polarToCartesian(0, 0, 1, midAngle);

  const push = PUSH[state];
  const dx = dir.x * push;
  const dy = dir.y * push;

  const pathD = describeDonutSegment(cx, cy, outerR, innerR, startAngle, endAngle);

  const labelRadius = (outerR + innerR) / 2;
  const labelPos = polarToCartesian(cx, cy, labelRadius, midAngle);
  const labelRotation = tangentialRotation(midAngle);

  const readoutRadius = innerR + (outerR - innerR) * 0.24;
  const readoutPos = polarToCartesian(cx, cy, readoutRadius, midAngle);
  const readoutRotation = tangentialRotation(midAngle);

  const isActive = state === "hovered" || state === "selected";
  const isSelected = state === "selected";

  // Outer-corner lock-on brackets, only meaningful once selected.
  const bracketA = polarToCartesian(cx, cy, outerR + 4, startAngle + 3);
  const bracketAEnd1 = polarToCartesian(cx, cy, outerR + 4, startAngle + 7);
  const bracketAEnd2 = polarToCartesian(cx, cy, outerR - 4, startAngle + 3);
  const bracketB = polarToCartesian(cx, cy, outerR + 4, endAngle - 3);
  const bracketBEnd1 = polarToCartesian(cx, cy, outerR + 4, endAngle - 7);
  const bracketBEnd2 = polarToCartesian(cx, cy, outerR - 4, endAngle - 3);

  return (
    // Outer group: entrance only. It purely inherits the "hidden" / "visible"
    // stagger from the wheel's container variants — it never sets its own
    // `animate`, so parent propagation drives it.
    <motion.g variants={sectorEntranceVariants}>
      {/* Inner group: interaction state (hover / select). Kept separate from
          the entrance group above so its explicit `animate` object never
          shadows the inherited stagger. */}
      <motion.g
        animate={{ x: dx, y: dy, scale: SCALE[state], opacity: OPACITY[state] }}
        transition={springTransition}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
        className="cursor-pointer focus:outline-none"
        role="button"
        tabIndex={0}
        aria-label={`Enter the ${day.label} universe`}
        aria-pressed={isSelected}
        onClick={onSelect}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect();
          }
        }}
        onMouseEnter={onHoverStart}
        onMouseLeave={onHoverEnd}
        onFocus={onHoverStart}
        onBlur={onHoverEnd}
      >
      {/* glow layer */}
      <motion.path
        d={pathD}
        fill="none"
        stroke="#22d3ee"
        strokeWidth={isSelected ? 8 : 5}
        filter="url(#sector-glow-blur)"
        animate={{ opacity: isSelected ? 0.85 : isActive ? 0.4 : 0 }}
        transition={{ duration: 0.3 }}
      />

      {/* base segment */}
      <motion.path
        d={pathD}
        strokeLinejoin="round"
        animate={{
          fill: isSelected
            ? "rgba(34, 211, 238, 0.12)"
            : isActive
            ? "rgba(34, 211, 238, 0.06)"
            : "rgba(148, 163, 184, 0.045)",
          stroke: isSelected
            ? "#67e8f9"
            : isActive
            ? "rgba(34, 211, 238, 0.65)"
            : "rgba(148, 163, 184, 0.32)",
          strokeWidth: isSelected ? 2.5 : isActive ? 2 : 1.25,
        }}
        transition={{ duration: 0.28 }}
      />

      {/* lock-on brackets, selected only */}
      <motion.g
        initial={false}
        animate={{ opacity: isSelected ? 1 : 0 }}
        transition={{ duration: 0.25, delay: isSelected ? 0.1 : 0 }}
      >
        <path
          d={`M ${bracketAEnd1.x} ${bracketAEnd1.y} L ${bracketA.x} ${bracketA.y} L ${bracketAEnd2.x} ${bracketAEnd2.y}`}
          fill="none"
          stroke="#67e8f9"
          strokeWidth={1.5}
          strokeLinecap="round"
        />
        <path
          d={`M ${bracketBEnd1.x} ${bracketBEnd1.y} L ${bracketB.x} ${bracketB.y} L ${bracketBEnd2.x} ${bracketBEnd2.y}`}
          fill="none"
          stroke="#67e8f9"
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      </motion.g>

      {/* day label */}
      <motion.text
        x={labelPos.x}
        y={labelPos.y}
        transform={`rotate(${labelRotation} ${labelPos.x} ${labelPos.y})`}
        textAnchor="middle"
        dominantBaseline="middle"
        className="select-none font-display uppercase"
        style={{ fontSize: 15, letterSpacing: "0.06em" }}
        animate={{
          fill: isActive ? "#ecfeff" : "#a9b4c8",
        }}
        transition={{ duration: 0.25 }}
      >
        {day.label}
      </motion.text>

      {/* HUD designation readout, fades in on interaction */}
      <motion.text
        x={readoutPos.x}
        y={readoutPos.y}
        transform={`rotate(${readoutRotation} ${readoutPos.x} ${readoutPos.y})`}
        textAnchor="middle"
        dominantBaseline="middle"
        className="select-none font-mono"
        style={{ fontSize: 8.5, letterSpacing: "0.12em" }}
        initial={false}
        animate={{
          opacity: isActive ? 0.9 : 0,
          fill: "#67e8f9",
        }}
        transition={{ duration: 0.2 }}
      >
        {day.designation}
      </motion.text>
      </motion.g>
    </motion.g>
  );
}
