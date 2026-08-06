"use client";

import { useEffect, useRef, useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { motion } from "framer-motion";
import { polarToCartesian, tangentialRotation } from "@/lib/arc";
import type { Planet as PlanetModel } from "@/types/planet";
import { getPlanetTypeMeta } from "@/types/planet";
import { planetAppearVariants } from "@/components/MotionEffects";
import CompletionBurst from "@/components/orbits/CompletionBurst";

interface PlacedPlanetProps {
  planet: PlanetModel;
  cx: number;
  cy: number;
  radius: number;
  /** Angle (degrees, 0 = 12 o'clock, clockwise) this planet currently occupies on the ring. */
  angle: number;
  /** This orbit's id — carried in the drag payload so drop handling can tell a same-orbit reposition from a real move. */
  orbitId: string;
  /** This orbit's label — surfaced only in the hover tooltip. */
  orbitLabel: string;
  /** True while this planet is the one flagged by an in-progress Time Assignment conflict, so it can be called out on the ring itself. */
  highlighted?: boolean;
  /** Opens the floating action menu, anchored at the click/tap point, with this planet's orbit context. */
  onSelect: (planet: PlanetModel, orbitId: string, orbitLabel: string, anchor: { x: number; y: number }) => void;
}

// Roughly 2.25x the Phase 4 sizing (core r=8, halo r=14) — planets are
// the hero of the composition now, not a small marker on the ring.
const CORE_R = 18;
const HALO_R = 30;
const DORMANT_SCALE = 0.65;

/**
 * One deployed planet, rendered directly on its orbit ring: a large
 * textured sphere (SVG gradient fill keyed to its type, plus a
 * highlight fleck and a shadow blob for a lit-sphere read) at its
 * assigned angle, with a compact name + hour-range tag. Also a drag
 * source in its own right — re-dragging it reposition within the same
 * orbit (no dialog) or moves it to a different one (opens Time
 * Assignment). Clicking opens the floating action menu instead of a
 * full sheet — Phase 4.5's lighter-weight interaction for a planet
 * that's already deployed.
 *
 * Once `planet.completed` flips true it never disappears: it shrinks
 * to 65% and dims, reading as dormant rather than gone, and — for the
 * ~1s right after the flip — fires a small burst of particles toward
 * Helio at the stage center as the one-time "energy transfer" beat.
 */
export default function PlacedPlanet({
  planet,
  cx,
  cy,
  radius,
  angle,
  orbitId,
  orbitLabel,
  highlighted = false,
  onSelect,
}: PlacedPlanetProps) {
  const meta = getPlanetTypeMeta(planet.type);
  const pos = polarToCartesian(cx, cy, radius, angle);
  const rotation = tangentialRotation(angle);

  const wasCompletedRef = useRef(planet.completed);
  const [showBurst, setShowBurst] = useState(false);

  useEffect(() => {
    if (!wasCompletedRef.current && planet.completed) {
      setShowBurst(true);
      const t = setTimeout(() => setShowBurst(false), 900);
      wasCompletedRef.current = true;
      return () => clearTimeout(t);
    }
    wasCompletedRef.current = planet.completed;
  }, [planet.completed]);

  // Labels sit further out than the sphere's own radius so they never
  // overlap it — scaled up to match the bigger planet.
  const nameLabelPos = polarToCartesian(cx, cy, radius + 26, angle);
  const timeLabelPos = polarToCartesian(cx, cy, radius + 36, angle);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: planet.id,
    data: { planet, fromOrbit: orbitId },
  });

  const shortName = planet.name.trim().slice(0, 10).toUpperCase();
  const shortTime = compactTimeRange(planet.startTime, planet.endTime);
  const fullLabel = `${planet.name} — ${planet.startTime ?? "?"}–${planet.endTime ?? "?"} — ${orbitLabel} — ${meta.label}${
    planet.completed ? " — Completed" : ""
  }`;

  function handleSelect(anchor: { x: number; y: number }) {
    onSelect(planet, orbitId, orbitLabel, anchor);
  }

  return (
    <motion.g
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      custom={0}
      variants={planetAppearVariants}
      initial="hidden"
      animate={{ opacity: isDragging ? 0.35 : 1, scale: planet.completed ? DORMANT_SCALE : 1 }}
      style={{ cursor: "grab", touchAction: "none", transformOrigin: `${pos.x}px ${pos.y}px` }}
      transition={{ type: "spring", stiffness: 160, damping: 20 }}
      role="button"
      tabIndex={0}
      onClick={(e) => handleSelect({ x: e.clientX, y: e.clientY })}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          const rect = (e.currentTarget as SVGGElement).getBoundingClientRect();
          handleSelect({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
        }
      }}
      aria-label={fullLabel}
    >
      <title>{fullLabel}</title>

      {showBurst && <CompletionBurst from={pos} to={{ x: cx, y: cy }} color={meta.color} />}

      {highlighted && (
        <circle
          cx={pos.x}
          cy={pos.y}
          r={HALO_R + 4}
          fill="none"
          stroke="rgba(248, 113, 113, 0.85)"
          strokeWidth={1.4}
          strokeDasharray="2 2"
        />
      )}

      {/* atmosphere / soft glow */}
      <circle
        cx={pos.x}
        cy={pos.y}
        r={HALO_R}
        fill={`${meta.color}20`}
        opacity={planet.completed ? 0.45 : 1}
      />

      {/* sphere */}
      <circle
        cx={pos.x}
        cy={pos.y}
        r={CORE_R}
        fill={`url(#planet-grad-${planet.type})`}
        stroke="rgba(5, 6, 10, 0.55)"
        strokeWidth={1}
        opacity={planet.completed ? 0.75 : 1}
        style={{
          filter: planet.completed
            ? `drop-shadow(0 0 4px ${meta.color}55)`
            : `drop-shadow(0 0 9px ${meta.color}aa)`,
        }}
      />

      {/* shadow blob — terminator-side shading */}
      <circle
        cx={pos.x + CORE_R * 0.32}
        cy={pos.y + CORE_R * 0.34}
        r={CORE_R * 0.62}
        fill={meta.gradientStops.edge}
        opacity={planet.completed ? 0.2 : 0.3}
        style={{ mixBlendMode: "multiply" }}
      />

      {/* highlight fleck — light source, upper-left */}
      <circle
        cx={pos.x - CORE_R * 0.34}
        cy={pos.y - CORE_R * 0.36}
        r={CORE_R * 0.24}
        fill={meta.gradientStops.highlight}
        opacity={planet.completed ? 0.35 : 0.85}
      />

      {planet.completed && (
        <text
          x={pos.x}
          y={pos.y}
          textAnchor="middle"
          dominantBaseline="middle"
          className="select-none pointer-events-none font-mono"
          style={{ fontSize: 9, fill: "rgba(226, 232, 240, 0.85)" }}
        >
          ✓
        </text>
      )}

      <text
        x={nameLabelPos.x}
        y={nameLabelPos.y}
        transform={`rotate(${rotation} ${nameLabelPos.x} ${nameLabelPos.y})`}
        textAnchor="middle"
        dominantBaseline="middle"
        className="select-none pointer-events-none font-mono uppercase"
        style={{
          fontSize: 7.5,
          letterSpacing: "0.05em",
          fill: planet.completed ? "rgba(226, 232, 240, 0.55)" : "rgba(226, 232, 240, 0.92)",
        }}
      >
        {shortName}
      </text>
      <text
        x={timeLabelPos.x}
        y={timeLabelPos.y}
        transform={`rotate(${rotation} ${timeLabelPos.x} ${timeLabelPos.y})`}
        textAnchor="middle"
        dominantBaseline="middle"
        className="select-none pointer-events-none font-mono uppercase"
        style={{
          fontSize: 6.5,
          letterSpacing: "0.04em",
          fill: planet.completed ? "rgba(148, 163, 184, 0.55)" : "rgba(148, 163, 184, 0.9)",
        }}
      >
        {shortTime}
      </text>
    </motion.g>
  );
}

/** "06:00" / "08:00" -> "06–08" — the compact hour-only tag on the ring. Full precision is still in the hover title. */
function compactTimeRange(start: string | null, end: string | null): string {
  if (!start || !end) return "";
  const startHour = start.split(":")[0];
  const endHour = end.split(":")[0];
  return `${startHour}–${endHour}`;
}
