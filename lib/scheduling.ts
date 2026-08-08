import type { OrbitInfo } from "@/lib/orbits";
import type { Planet } from "@/types/planet";

/**
 * Converts an "HH:MM" time into linear minutes for comparison within a
 * specific orbit's window. Only the Evening orbit needs this to be
 * orbit-aware: its window crosses midnight (17:00 -> 02:00), so a time
 * like "00:30" must sort *after* "23:30", not before "17:00".
 */
export function timeToOrbitMinutes(time: string, orbit: OrbitInfo): number {
  const [h, m] = time.split(":").map(Number);
  let minutes = h * 60 + m;
  if (orbit.crossesMidnight && h < 6) {
    minutes += 24 * 60;
  }
  return minutes;
}

/** Sorts a set of already-deployed planets chronologically by start time. */
export function sortPlanetsInOrbit(planets: Planet[], orbit: OrbitInfo): Planet[] {
  return [...planets].sort((a, b) => {
    if (!a.startTime || !b.startTime) return 0;
    return timeToOrbitMinutes(a.startTime, orbit) - timeToOrbitMinutes(b.startTime, orbit);
  });
}

/** Every planet currently deployed to one orbit, sorted chronologically. */
export function getPlanetsForOrbit(planets: Planet[], orbit: OrbitInfo): Planet[] {
  return sortPlanetsInOrbit(
    planets.filter((p) => p.scheduled && p.orbit === orbit.id),
    orbit
  );
}

/**
 * The selectable time slots (30-minute increments) within an orbit's
 * window, inclusive of both endpoints. Used to restrict the Time
 * Assignment dialog's Start/End options to what that orbit allows.
 */
export function generateOrbitTimeSlots(orbit: OrbitInfo): string[] {
  const [minH, minM] = orbit.minTime.split(":").map(Number);
  const [maxH, maxM] = orbit.maxTime.split(":").map(Number);

  const startTotal = minH * 60 + minM;
  const endTotal = maxH * 60 + maxM + (orbit.crossesMidnight ? 24 * 60 : 0);

  const slots: string[] = [];
  for (let t = startTotal; t <= endTotal; t += 30) {
    const h = Math.floor(t / 60) % 24;
    const m = t % 60;
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }
  return slots;
}

/**
 * Checks a candidate [startTime, endTime) window against every planet
 * already deployed in `orbit`, and returns the first one it overlaps
 * with (or null if the slot is free). Used by the Time Assignment
 * dialog to block saving an overlapping schedule — required for both
 * a fresh assignment and a drag-triggered move/edit, so the planet
 * being placed is always excluded from its own check via
 * `excludePlanetId` (otherwise re-saving a planet's own current slot
 * would "conflict" with itself).
 */
export function findTimeConflict(
  planets: Planet[],
  orbit: OrbitInfo,
  startTime: string,
  endTime: string,
  excludePlanetId?: string
): Planet | null {
  if (!startTime || !endTime) return null;
  const startMin = timeToOrbitMinutes(startTime, orbit);
  const endMin = timeToOrbitMinutes(endTime, orbit);

  const others = getPlanetsForOrbit(planets, orbit).filter((p) => p.id !== excludePlanetId);
  for (const p of others) {
    if (!p.startTime || !p.endTime) continue;
    const pStart = timeToOrbitMinutes(p.startTime, orbit);
    const pEnd = timeToOrbitMinutes(p.endTime, orbit);
    // Two half-open ranges [a,b) and [c,d) overlap iff a < d && c < b.
    if (startMin < pEnd && pStart < endMin) {
      return p;
    }
  }
  return null;
}

/**
 * Evenly spaced angles (degrees, clockwise from 12 o'clock — see
 * lib/arc.ts) for `count` planets placed on one orbit ring. Recomputed
 * fresh from the current count every render, so inserting, editing, or
 * removing a deployed planet automatically redistributes the whole
 * ring while the chronological order (already applied by the caller
 * via getPlanetsForOrbit) is preserved.
 */
export function distributePlanetAngles(count: number, startAngle = 30): number[] {
  if (count === 0) return [];
  const step = 360 / count;
  return Array.from({ length: count }, (_, i) => startAngle + i * step);
}
