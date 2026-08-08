/**
 * Phase 3 — Planet System.
 *
 * A Planet represents a study task. In this phase planets can only be
 * generated, stored, viewed, and selected — they are not yet deployed
 * into an orbit. `orbit`, `startTime`, and `endTime` are reserved for
 * the next phase and stay `null` until then.
 */

export type PlanetType = "ocean" | "forest" | "crystal" | "lava" | "moon";

export interface Planet {
  /** Stable unique id, also used as the React list key. */
  id: string;
  /** User-given name for the planet (the study task). */
  name: string;
  type: PlanetType;
  /** Hex color driving the planet's visual treatment, derived from its type. */
  color: string;
  /** Whether this planet has been deployed to an orbit. Always false in Phase 3. */
  scheduled: boolean;
  /** Orbit id it's deployed to (e.g. "morning"), or null while unscheduled. */
  orbit: string | null;
  /** Reserved for Phase 4 orbital deployment — time-of-day scheduling. */
  startTime: string | null;
  endTime: string | null;
  /** Reserved for the mission-complete flow — always false in Phase 3. */
  completed: boolean;
}

/** The color stops a planet's sphere is built from — shared by the HTML
 *  orb (Planet.tsx, used in the dock/drag-ghost) and the SVG orb (drawn
 *  directly on an orbit ring), so both renderings read as the same planet. */
export interface PlanetGradientStops {
  /** Bright specular fleck, upper-left light source. */
  highlight: string;
  /** Lit mid-tone, between highlight and base. */
  mid: string;
  /** The planet's dominant surface tone. */
  base: string;
  /** Shadowed far edge / terminator line. */
  edge: string;
}

export interface PlanetTypeMeta {
  id: PlanetType;
  /** Full display label, e.g. "Ocean Planet". */
  label: string;
  /** Short label for tight spaces, e.g. dock cards. */
  shortLabel: string;
  color: string;
  /** Multi-stop palette for the textured sphere look — see PlanetGradientStops. */
  gradientStops: PlanetGradientStops;
}

/**
 * The five planet types a user can generate, in the order they're
 * presented throughout the UI. Each has its own gradient palette so
 * every type reads as visually distinct at a glance, not just
 * differently colored.
 */
export const PLANET_TYPES: PlanetTypeMeta[] = [
  {
    id: "ocean",
    label: "Ocean Planet",
    shortLabel: "Ocean",
    color: "#22d3ee",
    gradientStops: { highlight: "#e6faff", mid: "#67e8f9", base: "#0891b2", edge: "#0c2d3f" },
  },
  {
    id: "forest",
    label: "Forest Planet",
    shortLabel: "Forest",
    color: "#34d399",
    gradientStops: { highlight: "#ecfdf5", mid: "#6ee7b7", base: "#16a34a", edge: "#0b2b18" },
  },
  {
    id: "crystal",
    label: "Crystal Planet",
    shortLabel: "Crystal",
    color: "#a78bfa",
    gradientStops: { highlight: "#f5f3ff", mid: "#d8b4fe", base: "#8b5cf6", edge: "#3b0764" },
  },
  {
    id: "lava",
    label: "Lava Planet",
    shortLabel: "Lava",
    color: "#f97316",
    gradientStops: { highlight: "#fff7ed", mid: "#fdba74", base: "#ea580c", edge: "#431407" },
  },
  {
    id: "moon",
    label: "Moon Planet",
    shortLabel: "Moon",
    color: "#94a3b8",
    gradientStops: { highlight: "#f8fafc", mid: "#e2e8f0", base: "#64748b", edge: "#1e293b" },
  },
];

export function getPlanetTypeMeta(type: PlanetType): PlanetTypeMeta {
  return PLANET_TYPES.find((t) => t.id === type) ?? PLANET_TYPES[0];
}
