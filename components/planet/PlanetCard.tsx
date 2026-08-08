"use client";

import { useDraggable } from "@dnd-kit/core";
import { motion } from "framer-motion";
import type { Planet as PlanetModel } from "@/types/planet";
import { getPlanetTypeMeta } from "@/types/planet";
import { planetAppearVariants } from "@/components/MotionEffects";
import Planet from "@/components/planet/Planet";

interface PlanetCardProps {
  planet: PlanetModel;
  onSelect: (planet: PlanetModel) => void;
}

/**
 * One generated, unscheduled planet, rendered as a dock tile: a
 * glowing orb, its name, and its type. Selecting it opens Planet
 * Details. The Planet Dock only ever holds unscheduled planets (a
 * deployed planet belongs to its orbit and is removed from here), so
 * every card the dock renders is always a valid drag source into an
 * orbit — no per-card draggable/disabled branching needed.
 */
export default function PlanetCard({ planet, onSelect }: PlanetCardProps) {
  const meta = getPlanetTypeMeta(planet.type);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: planet.id,
    data: { planet },
  });

  return (
    <motion.button
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      type="button"
      layout
      variants={planetAppearVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(planet)}
      className="glass-panel group relative flex w-[128px] shrink-0 flex-col items-center gap-2.5 rounded-2xl px-3 py-4 text-center transition-shadow duration-300"
      style={{
        boxShadow: "none",
        opacity: isDragging ? 0.35 : 1,
        touchAction: "none",
        cursor: "grab",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 0 22px ${meta.color}33, 0 0 2px ${meta.color}55`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <Planet
        type={planet.type}
        size={52}
        glow="soft"
        className="transition-transform duration-300 group-hover:scale-110"
      />
      <p className="line-clamp-1 w-full font-display text-[11px] uppercase tracking-wide text-ink-primary">
        {planet.name}
      </p>
      <p className="font-mono text-[8px] uppercase tracking-widest2 text-ink-faint">
        {meta.shortLabel}
      </p>
      <span className="font-mono text-[8px] uppercase tracking-widest2 text-amber-hud/80">
        Unscheduled
      </span>
    </motion.button>
  );
}
