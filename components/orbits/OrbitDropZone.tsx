"use client";

import { useDroppable } from "@dnd-kit/core";
import { motion } from "framer-motion";
import type { OrbitInfo } from "@/lib/orbits";
import type { Planet as PlanetModel } from "@/types/planet";
import { distributePlanetAngles } from "@/lib/scheduling";
import OrbitRing from "@/components/orbits/OrbitRing";
import OrbitLabels from "@/components/orbits/OrbitLabels";
import OrbitPlaceholder from "@/components/orbits/OrbitPlaceholder";
import PlacedPlanet from "@/components/orbits/PlacedPlanet";

interface OrbitDropZoneProps {
  orbit: OrbitInfo;
  cx: number;
  cy: number;
  radius: number;
  labelAngle: number;
  placeholderAngle: number;
  index: number;
  /** This orbit's planets, already filtered and chronologically sorted by the caller. */
  planets: PlanetModel[];
  /** Id of the planet an in-progress Time Assignment save would conflict with, if any — passed through so that planet can be called out on the ring. */
  conflictPlanetId?: string | null;
  /** Id of the planet whose floating action menu is currently open, if any — passed through so that planet renders its selected outline/glow. */
  selectedPlanetId?: string | null;
  /** Opens the floating action menu for a placed planet, anchored at the click point. Forwarded straight through to PlacedPlanet. */
  onSelectPlanet: (planet: PlanetModel, orbitId: string, orbitLabel: string, anchor: { x: number; y: number }) => void;
  /** The planet a still-open Mission Deployment Console is targeting at THIS orbit, if any — not yet persisted, so it's drawn as an extra, non-interactive preview rather than folded into `planets`. Null once nothing is pending here (including while the console targets a different orbit). */
  pendingPlanet?: PlanetModel | null;
  /** True for the final/largest ring — renders its label larger and gives it the callers-chosen `labelAngle` (typically the opposite side of the ring from the other orbits' labels) so it has room to breathe. */
  emphasizeLabel?: boolean;
}

/**
 * One orbit ring as a live deployment zone: the ring itself, its HUD
 * label, every planet currently deployed to it (evenly spaced around
 * the ring in chronological order), and — only while the orbit is
 * empty — the quiet "+" preview marker carried over from Phase 3.
 * Registers as a dnd-kit droppable so dragging a planet here and
 * releasing routes into the Time Assignment dialog.
 */
export default function OrbitDropZone({
  orbit,
  cx,
  cy,
  radius,
  labelAngle,
  placeholderAngle,
  index,
  planets,
  conflictPlanetId = null,
  selectedPlanetId = null,
  onSelectPlanet,
  pendingPlanet = null,
  emphasizeLabel = false,
}: OrbitDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({ id: orbit.id });
  // The pending preview (if any targets this orbit) gets its own slot
  // in the evenly-spaced layout, appended after the real deployed
  // planets — it has no start time yet to sort by, so chronological
  // order doesn't apply to it.
  const totalCount = planets.length + (pendingPlanet ? 1 : 0);
  const angles = distributePlanetAngles(totalCount);
  const isEmpty = totalCount === 0;

  return (
    <motion.g ref={setNodeRef}>
      <OrbitRing cx={cx} cy={cy} radius={radius} index={index} highlighted={isOver} />
      <OrbitLabels
        cx={cx}
        cy={cy}
        radius={radius}
        label={orbit.label}
        angle={labelAngle}
        index={index}
        emphasized={emphasizeLabel}
      />
      {isEmpty ? (
        <OrbitPlaceholder cx={cx} cy={cy} radius={radius} angle={placeholderAngle} index={index} />
      ) : (
        <>
          {planets.map((planet, i) => (
            <PlacedPlanet
              key={planet.id}
              planet={planet}
              cx={cx}
              cy={cy}
              radius={radius}
              angle={angles[i]}
              orbitId={orbit.id}
              orbitLabel={orbit.label}
              highlighted={planet.id === conflictPlanetId}
              selected={planet.id === selectedPlanetId}
              onSelect={onSelectPlanet}
            />
          ))}
          {pendingPlanet && (
            <PlacedPlanet
              key={`pending-${pendingPlanet.id}`}
              planet={pendingPlanet}
              cx={cx}
              cy={cy}
              radius={radius}
              angle={angles[planets.length]}
              orbitId={orbit.id}
              orbitLabel={orbit.label}
              isPending
            />
          )}
        </>
      )}
    </motion.g>
  );
}
