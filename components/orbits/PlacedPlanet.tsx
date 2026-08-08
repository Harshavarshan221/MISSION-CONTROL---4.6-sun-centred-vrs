"use client";

import { useEffect, useRef, useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { motion } from "framer-motion";
import { polarToCartesian, tangentialRotation } from "@/lib/arc";
import type { Planet as PlanetModel } from "@/types/planet";
import { getPlanetTypeMeta } from "@/types/planet";
import { formatTimeRangeLabel } from "@/lib/scheduling";
import { planetAppearVariants, placedPlanetHoverTransition, placedPlanetSelectTransition } from "@/components/MotionEffects";
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
  /** True while this planet's floating action menu is open — draws the soft cyan selection outline/glow. */
  selected?: boolean;
  /** True for the temporary, not-yet-persisted preview planet shown on an orbit while the deployment console is open — draws a soft pulsing halo instead of the normal glow and isn't draggable. */
  isPending?: boolean;
  /** Opens the floating action menu, anchored at the click/tap point, with this planet's orbit context. Omitted for the pending preview, which isn't interactive. */
  onSelect?: (planet: PlanetModel, orbitId: string, orbitLabel: string, anchor: { x: number; y: number }) => void;
}

// Phase 5: ~30% bigger than Phase 4.5's sizing (core r=18, halo r=30) —
// planets are the primary visual focus of the screen, more so than
// before.
const CORE_R = 24;
const HALO_R = 39;
// Completed planets settle to 75% scale (up from 65%) — still visibly
// smaller/dormant, but the generated art stays legible rather than
// shrinking to an unreadable dot.
const DORMANT_SCALE = 0.75;
// Radial offsets for the name/time labels, expressed relative to
// HALO_R so they scale with the bigger sphere. Phase 6 widens the gap
// between the two lines (was +6/-4, an 10-unit spread) since the
// larger Phase 6 label text needs more room to stay legible without
// the name and time crowding together.
const NAME_LABEL_OFFSET = HALO_R - 2;
const TIME_LABEL_OFFSET = HALO_R + 10;
// Planets within this many degrees of due-12-o'clock or due-6-o'clock
// get their labels flipped to sit *inward* (toward Helio) instead of
// outward — outward labels on those two zones are the ones most likely
// to run past the top/bottom edge of the stage, and inward reads
// naturally as "below the planet" at the top and "above the planet" at
// the bottom. Widened slightly in Phase 6 (30 -> 34) since the larger
// label text needs a bit more clearance before it starts running off
// the edge.
const FLIP_ZONE_DEGREES = 34;

export default function PlacedPlanet({
  planet,
  cx,
  cy,
  radius,
  angle,
  orbitId,
  orbitLabel,
  highlighted = false,
  selected = false,
  isPending = false,
  onSelect,
}: PlacedPlanetProps) {
  const meta = getPlanetTypeMeta(planet.type);
  const pos = polarToCartesian(cx, cy, radius, angle);
  const rotation = tangentialRotation(angle);
  const [hovered, setHovered] = useState(false);

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

  // Zone-aware label placement: near the top or bottom of the ring,
  // push labels inward so they never run off the top/bottom edge of
  // the stage; everywhere else, the existing outward placement (tangent
  // to the ring) already reads clearly and keeps left/right planets'
  // labels clear of their neighbors.
  const normalizedAngle = ((angle % 360) + 360) % 360;
  const nearTop = normalizedAngle <= FLIP_ZONE_DEGREES || normalizedAngle >= 360 - FLIP_ZONE_DEGREES;
  const nearBottom = normalizedAngle >= 180 - FLIP_ZONE_DEGREES && normalizedAngle <= 180 + FLIP_ZONE_DEGREES;
  const flipInward = nearTop || nearBottom;
  const nameRadius = flipInward ? radius - NAME_LABEL_OFFSET : radius + NAME_LABEL_OFFSET;
  const timeRadius = flipInward ? radius - TIME_LABEL_OFFSET : radius + TIME_LABEL_OFFSET;
  const nameLabelPos = polarToCartesian(cx, cy, nameRadius, angle);
  const timeLabelPos = polarToCartesian(cx, cy, timeRadius, angle);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: planet.id,
    data: { planet, fromOrbit: orbitId },
    // The pending preview planet is a visual stand-in for an
    // unconfirmed deployment, not a real draggable/selectable planet —
    // re-dragging or clicking it before it's persisted doesn't make
    // sense, so it opts out of both.
    disabled: isPending,
  });

  const shortName = planet.name.trim().slice(0, 10).toUpperCase();
  const shortTime = formatTimeRangeLabel(planet.startTime, planet.endTime);
  const fullLabel = `${planet.name} — ${formatTimeRangeLabel(planet.startTime, planet.endTime) || "Time not set"} — ${orbitLabel} — ${meta.label}${
    planet.completed ? " — Completed" : ""
  }`;

  function handleSelect(anchor: { x: number; y: number }) {
    if (isPending) return;
    onSelect?.(planet, orbitId, orbitLabel, anchor);
  }

  const baseScale = planet.completed ? DORMANT_SCALE : 1;
  // Hover (+8%) and selection are both quiet, additive scale bumps on
  // top of whatever base scale completion already applies, so a
  // completed planet still enlarges slightly on hover/select rather
  // than snapping back to full size.
  const liveScale = baseScale * (hovered ? 1.08 : 1) * (selected ? 1.04 : 1);
  // Only used for the gradient-sphere fallback (types without generated
  // art) — types with `imageSrc` render a clipped <image> directly, see
  // below.
  const fillUrl = `url(#planet-grad-${planet.type})`;

  return (
    <motion.g
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      custom={0}
      variants={planetAppearVariants}
      initial="hidden"
      animate={{
        opacity: isDragging ? 0.35 : isPending ? 0.85 : 1,
        scale: liveScale,
      }}
      style={{
        cursor: isPending ? "default" : "grab",
        touchAction: isPending ? "auto" : "none",
        transformOrigin: `${pos.x}px ${pos.y}px`,
        pointerEvents: isPending ? "none" : undefined,
      }}
      transition={hovered || selected ? placedPlanetHoverTransition : placedPlanetSelectTransition}
      role={isPending ? undefined : "button"}
      tabIndex={isPending ? undefined : 0}
      onClick={(e) => handleSelect({ x: e.clientX, y: e.clientY })}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          const rect = (e.currentTarget as SVGGElement).getBoundingClientRect();
          handleSelect({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
        }
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
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

      {/* selected — soft cyan outline, no harsh effects */}
      {selected && (
        <circle
          cx={pos.x}
          cy={pos.y}
          r={HALO_R + 7}
          fill="none"
          stroke="rgba(34, 211, 238, 0.75)"
          strokeWidth={1.5}
        />
      )}

      {/* pending — this planet hasn't been confirmed yet; a soft dashed
          amber ring marks it as a preview rather than a real deployment,
          without a new animation (no pulse/keyframes, just a static
          outline layered on the same halo/atmosphere every planet has). */}
      {isPending && (
        <circle
          cx={pos.x}
          cy={pos.y}
          r={HALO_R + 7}
          fill="none"
          stroke="rgba(255, 165, 36, 0.7)"
          strokeWidth={1.5}
          strokeDasharray="3 3"
        />
      )}

      {/* atmosphere / soft glow — brightens a touch on hover */}
      <circle
        cx={pos.x}
        cy={pos.y}
        r={HALO_R}
        fill={`${meta.color}20`}
        opacity={(planet.completed ? 0.45 : 1) * (hovered || selected ? 1.25 : 1)}
      />

      {/* sphere — generated asset when available, gradient sphere
          otherwise. The generated art is embedded as a directly clipped
          <image> (clipPath + circle, both in real user-space units)
          rather than an objectBoundingBox <pattern>: pattern content
          defaults to userSpaceOnUse, which silently shrank the old
          fractional x/y/width/height to a near-invisible sliver instead
          of filling the circle. Clipping the image directly is the
          simplest reliable way to get "same asset, cropped into a
          circle, no stretching" out of raw SVG. */}
      {meta.imageSrc ? (
        <>
          <clipPath id={`planet-clip-${planet.id}`}>
            <circle cx={pos.x} cy={pos.y} r={CORE_R} />
          </clipPath>
          <image
            href={meta.imageSrc}
            x={pos.x - CORE_R * 1.15}
            y={pos.y - CORE_R * 1.15}
            width={CORE_R * 2.3}
            height={CORE_R * 2.3}
            preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#planet-clip-${planet.id})`}
            opacity={planet.completed ? 0.8 : 1}
            style={{
              filter: planet.completed
                ? `saturate(0.4) drop-shadow(0 0 4px ${meta.color}55)`
                : `drop-shadow(0 0 ${hovered || selected ? 13 : 9}px ${meta.color}aa)`,
            }}
          />
          <circle
            cx={pos.x}
            cy={pos.y}
            r={CORE_R}
            fill="none"
            stroke="rgba(5, 6, 10, 0.55)"
            strokeWidth={1}
          />
        </>
      ) : (
        <circle
          cx={pos.x}
          cy={pos.y}
          r={CORE_R}
          fill={fillUrl}
          stroke="rgba(5, 6, 10, 0.55)"
          strokeWidth={1}
          opacity={planet.completed ? 0.8 : 1}
          style={{
            filter: planet.completed
              ? `saturate(0.4) drop-shadow(0 0 4px ${meta.color}55)`
              : `drop-shadow(0 0 ${hovered || selected ? 13 : 9}px ${meta.color}aa)`,
          }}
        />
      )}

      {/* shadow blob — terminator-side shading, skipped for the image
          fill (the generated art already carries its own shading) */}
      {!meta.imageSrc && (
        <circle
          cx={pos.x + CORE_R * 0.32}
          cy={pos.y + CORE_R * 0.34}
          r={CORE_R * 0.62}
          fill={meta.gradientStops.edge}
          opacity={planet.completed ? 0.2 : 0.3}
          style={{ mixBlendMode: "multiply" }}
        />
      )}

      {/* highlight fleck — light source, upper-left; skipped for image fill */}
      {!meta.imageSrc && (
        <circle
          cx={pos.x - CORE_R * 0.34}
          cy={pos.y - CORE_R * 0.36}
          r={CORE_R * 0.24}
          fill={meta.gradientStops.highlight}
          opacity={planet.completed ? 0.35 : 0.85}
        />
      )}

      {planet.completed && (
        <text
          x={pos.x}
          y={pos.y}
          textAnchor="middle"
          dominantBaseline="middle"
          className="select-none pointer-events-none font-mono"
          style={{ fontSize: 10, fill: "rgba(226, 232, 240, 0.92)", filter: "drop-shadow(0 0 2px rgba(5,6,10,0.8))" }}
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
        className="select-none pointer-events-none font-mono uppercase font-medium"
        style={{
          fontSize: 9,
          letterSpacing: "0.04em",
          fill: planet.completed ? "rgba(226, 232, 240, 0.6)" : "rgba(226, 232, 240, 0.98)",
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
          fontSize: 7.5,
          letterSpacing: "0.03em",
          fill: planet.completed ? "rgba(148, 163, 184, 0.55)" : "rgba(203, 213, 225, 0.92)",
        }}
      >
        {shortTime}
      </text>
    </motion.g>
  );
}
