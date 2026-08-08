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
  /** Opens the floating action menu for a placed planet, anchored at the click point. Forwarded straight through to PlacedPlanet. */
  onSelectPlanet: (planet: PlanetModel, orbitId: string, orbitLabel: string, anchor: { x: number; y: number }) => void;
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
  onSelectPlanet,
}: OrbitDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({ id: orbit.id });
  const angles = distributePlanetAngles(planets.length);

  return (
    <motion.g ref={setNodeRef}>
      <OrbitRing cx={cx} cy={cy} radius={radius} index={index} highlighted={isOver} />
      <OrbitLabels cx={cx} cy={cy} radius={radius} label={orbit.label} angle={labelAngle} index={index} />
      {planets.length === 0 ? (
        <OrbitPlaceholder cx={cx} cy={cy} radius={radius} angle={placeholderAngle} index={index} />
      ) : (
        planets.map((planet, i) => (
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
            onSelect={onSelectPlanet}
          />
        ))
      )}
    </motion.g>
  );
}
