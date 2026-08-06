"use client";

import { motion } from "framer-motion";
import { fadeUpVariants } from "./MotionEffects";

export default function HeaderCopy() {
  return (
    <div className="relative z-10 flex flex-col items-center text-center">
      <motion.p
        custom={0}
        variants={fadeUpVariants}
        initial="hidden"
        animate="visible"
        className="font-mono text-[11px] uppercase tracking-widest2 text-amber-hud/80"
      >
        Study Ranker &middot; Mission Control
      </motion.p>

      <motion.h1
        custom={1}
        variants={fadeUpVariants}
        initial="hidden"
        animate="visible"
        className="mt-4 font-display text-3xl uppercase tracking-wide text-ink-primary sm:text-4xl"
      >
        Seven Universes. One Week.
      </motion.h1>

      <motion.p
        custom={2}
        variants={fadeUpVariants}
        initial="hidden"
        animate="visible"
        className="mt-3 max-w-md font-body text-sm text-ink-secondary"
      >
        Select a day on the ring to enter its universe.
      </motion.p>
    </div>
  );
}
