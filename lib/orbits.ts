export interface OrbitInfo {
  /** Stable key, also used as the React list key. */
  id: string;
  /** Label shown on the orbit's HUD readout tag. */
  label: string;
  /** Human-readable display of the orbit's allowed deployment window. */
  timeRange: string;
  /** Earliest selectable time, "HH:MM". */
  minTime: string;
  /** Latest selectable time, "HH:MM". For orbits that cross midnight this
   *  is the next-day bound (e.g. Night's "02:00"), not a later same-day time. */
  maxTime: string;
  /** True when the window spans midnight (Evening: 17:00 -> 02:00). */
  crossesMidnight?: boolean;
}

/**
 * The three time-of-day orbits around Mission Control, ordered innermost
 * (closest to the hub) to outermost (closest to the navigation ring).
 * Each orbit is a live deployment zone (Phase 4) with a fixed time
 * window that constrains which start/end times a planet dropped there
 * can be assigned.
 *
 * Sprint (Scheduler Engine): the former standalone Night orbit
 * (21:00-02:00) is folded into Evening, which now spans 17:00-02:00.
 * Three orbits cover the full day with no dead zones and no orbit thin
 * enough to feel redundant on the ring stack.
 */
export const ORBITS: OrbitInfo[] = [
  { id: "morning", label: "Morning Orbit", timeRange: "06:00 – 12:00", minTime: "06:00", maxTime: "12:00" },
  { id: "afternoon", label: "Afternoon Orbit", timeRange: "12:00 – 17:00", minTime: "12:00", maxTime: "17:00" },
  { id: "evening", label: "Evening Orbit", timeRange: "17:00 – 02:00", minTime: "17:00", maxTime: "02:00", crossesMidnight: true },
];

export function getOrbitById(id: string): OrbitInfo | undefined {
  return ORBITS.find((o) => o.id === id);
}
