"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getMissionControlHierarchy } from "@/lib/days";
import { fadeUpVariants } from "@/components/MotionEffects";

/**
 * Compact Mission Control instrument readout for the time hierarchy —
 * EON (Year) > GALAXY (Month) > MULTIVERSE (Week). Stepping it only
 * changes which real calendar week the breadcrumb is labeled against;
 * the Multiverse ring below always shows the same Monday..Sunday day
 * set it always has, so this can't regress existing day
 * navigation/scheduling — it's a read-out, not a new data model.
 */
export default function MissionControlBreadcrumb() {
  const [weekOffset, setWeekOffset] = useState(0);
  const { eon, galaxy, multiverse } = getMissionControlHierarchy(weekOffset);

  return (
    <motion.div
      custom={0}
      variants={fadeUpVariants}
      initial="hidden"
      animate="visible"
      className="glass-panel relative z-10 mb-6 flex items-center gap-2 rounded-full px-3 py-1.5 font-mono text-[8px] uppercase tracking-widest2 text-ink-secondary sm:mb-8 sm:gap-2.5 sm:text-[10px]"
    >
      <button
        type="button"
        onClick={() => setWeekOffset((w) => w - 1)}
        aria-label="Previous multiverse week"
        className="text-ink-faint transition-colors hover:text-cyan-glow"
      >
        <ChevronLeft size={12} />
      </button>

      <span className="flex items-center gap-1.5 whitespace-nowrap sm:gap-2">
        <span className="text-ink-faint">EON</span>
        <span className="text-ink-primary">{eon}</span>
        <span className="text-ink-faint/70">&rsaquo;</span>
        <span className="text-ink-faint">GALAXY</span>
        <span className="text-ink-primary">{galaxy}</span>
        <span className="text-ink-faint/70">&rsaquo;</span>
        <span className="text-amber-hud/80">MULTIVERSE</span>
        <span className="text-amber-hud">{multiverse}</span>
      </span>

      <button
        type="button"
        onClick={() => setWeekOffset((w) => w + 1)}
        aria-label="Next multiverse week"
        className="text-ink-faint transition-colors hover:text-cyan-glow"
      >
        <ChevronRight size={12} />
      </button>
    </motion.div>
  );
}
