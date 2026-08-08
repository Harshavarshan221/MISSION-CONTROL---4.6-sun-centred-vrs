import { Variants, Transition } from "framer-motion";

/** Standard premium spring — used for selection and hover state changes. */
export const springTransition: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 22,
  mass: 0.7,
};

export const softSpringTransition: Transition = {
  type: "spring",
  stiffness: 160,
  damping: 20,
};

/** Fade + gentle rise, used for page-level chrome (eyebrow, headings, status line). */
export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { ...softSpringTransition, delay: 0.15 + i * 0.08 },
  }),
};

/** Simple fade, used for the wheel container and background layers. */
export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.9, ease: "easeOut" } },
};

/** Scale + fade entrance for the wheel itself. */
export const wheelEntranceVariants: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { ...softSpringTransition, delay: 0.2, duration: 0.8 },
  },
};

/** Staggers each day sector in on mount. */
export const wheelContainerStagger: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.045, delayChildren: 0.35 },
  },
};

export const sectorEntranceVariants: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: springTransition,
  },
};

/** Universe destination page entrance. */
export const universeEntranceVariants: Variants = {
  hidden: { opacity: 0, scale: 0.97, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { ...softSpringTransition, duration: 0.6 },
  },
};

/* -------------------------------------------------------------------- */
/* Phase 2 — Day Universe / Mission Control                             */
/* -------------------------------------------------------------------- */

/** Staggers the orbit rings in one after another, innermost first. */
export const orbitStagger: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.18, delayChildren: 0.5 },
  },
};

/** A single orbit ring settling into place. Calm — no overshoot, no bounce. */
export const orbitRingVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { ...softSpringTransition, duration: 0.9 },
  },
};

/** The Mission Control hub fading in at the center, fixed once settled. */
export const missionControlVariants: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { ...softSpringTransition, delay: 0.25, duration: 0.7 },
  },
};

/* -------------------------------------------------------------------- */
/* Phase 3 — Planet System                                              */
/* -------------------------------------------------------------------- */

/** A planet card appearing in the dock — quiet scale + fade, no bounce. */
export const planetAppearVariants: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { ...softSpringTransition, duration: 0.4 },
  },
};

/** Backdrop fade shared by the Generate Planet dialog and Planet Details. */
export const dialogFadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.22, ease: "easeOut" } },
};

/** The Generate Planet dialog panel — a fade with a very small settle. */
export const dialogPanelVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { ...softSpringTransition, duration: 0.35 },
  },
};

/** Planet Details panel entrance. */
export const sheetSlideVariants: Variants = {
  hidden: { opacity: 0, x: 24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { ...softSpringTransition, duration: 0.35 },
  },
};
