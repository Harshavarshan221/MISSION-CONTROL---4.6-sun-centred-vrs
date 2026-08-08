import type { Planet as PlanetModel } from "@/types/planet";
import Planet from "@/components/planet/Planet";

interface PlanetGhostProps {
  planet: PlanetModel;
}

/**
 * The planet's floating stand-in while it's being dragged — rendered
 * inside dnd-kit's DragOverlay so it follows the pointer above
 * everything else and isn't clipped by the dock's scroll container.
 */
export default function PlanetGhost({ planet }: PlanetGhostProps) {
  return (
    <div className="flex flex-col items-center gap-1.5" style={{ cursor: "grabbing" }}>
      <Planet type={planet.type} size={46} glow="strong" />
      <span className="whitespace-nowrap rounded-md bg-void/80 px-2 py-0.5 font-mono text-[8px] uppercase tracking-widest2 text-ink-primary">
        {planet.name}
      </span>
    </div>
  );
}
