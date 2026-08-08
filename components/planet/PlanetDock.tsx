"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import type { Planet } from "@/types/planet";
import PlanetCard from "@/components/planet/PlanetCard";
import { fadeUpVariants } from "@/components/MotionEffects";

interface PlanetDockProps {
  planets: Planet[];
  onGenerate: () => void;
  onSelect: (planet: Planet) => void;
}

/**
 * Fixed dock at the bottom of the Universe screen — the drag source
 * for deployment. Only unscheduled planets live here: the moment a
 * planet is deployed to an orbit it belongs to that orbit and is
 * removed from the dock, and it comes back only if it's deleted or
 * dragged back out (drag-out-of-any-orbit isn't part of this sprint —
 * see Known Limitations). The Generate Planet trigger sits at the
 * dock's edge so it's always reachable regardless of how many planets
 * have been generated.
 */
export default function PlanetDock({ planets, onGenerate, onSelect }: PlanetDockProps) {
  const unscheduled = planets.filter((p) => !p.scheduled);

  return (
    <motion.div
      custom={2}
      variants={fadeUpVariants}
      initial="hidden"
      animate="visible"
      className="fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-4 sm:pb-6"
    >
      <div className="glass-panel-strong flex w-full max-w-[720px] items-center gap-3 rounded-2xl px-3 py-3 sm:px-4">
        <button
          type="button"
          onClick={onGenerate}
          className="group flex shrink-0 flex-col items-center gap-1.5 rounded-xl border border-dashed border-cyan-glow/40 px-4 py-3.5 font-mono text-[8px] uppercase tracking-widest2 text-cyan-glow/90 transition-colors hover:border-cyan-glow hover:bg-cyan-dim sm:text-[9px]"
        >
          <Plus size={16} className="transition-transform duration-300 group-hover:rotate-90" />
          Generate Planet
        </button>

        <div className="h-9 w-px shrink-0 bg-line" aria-hidden="true" />

        <div className="scrollbar-none flex flex-1 items-center gap-3 overflow-x-auto py-1">
          <AnimatePresence initial={false}>
            {planets.length === 0 ? (
              <p className="whitespace-nowrap font-mono text-[9px] uppercase tracking-widest2 text-ink-faint">
                No planets generated yet
              </p>
            ) : unscheduled.length === 0 ? (
              <p className="whitespace-nowrap font-mono text-[9px] uppercase tracking-widest2 text-ink-faint">
                All planets deployed — see the orbits above
              </p>
            ) : (
              unscheduled.map((planet) => (
                <PlanetCard key={planet.id} planet={planet} onSelect={onSelect} />
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
