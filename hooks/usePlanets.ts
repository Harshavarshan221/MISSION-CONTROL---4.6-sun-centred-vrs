"use client";

import { useCallback, useEffect, useState } from "react";
import type { Planet, PlanetType } from "@/types/planet";
import { getPlanetTypeMeta } from "@/types/planet";

function storageKey(daySlug: string): string {
  return `study-ranker:planets:${daySlug}`;
}

function createPlanetId(): string {
  return `planet_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Owns the generated planets for one day universe. Planets persist to
 * localStorage per day so they survive a refresh — this predates Phase
 * 4 and stays in place since removing it would drop a user's schedule
 * on every reload. Phase 4 adds orbital deployment: assigning a planet
 * to an orbit with a start/end time, editing that time, changing a
 * planet's type, and deleting a planet outright.
 */
export function usePlanets(daySlug: string) {
  const [planets, setPlanets] = useState<Planet[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Load this day's planets on mount / when the day changes.
  useEffect(() => {
    setHydrated(false);
    try {
      const raw = window.localStorage.getItem(storageKey(daySlug));
      setPlanets(raw ? (JSON.parse(raw) as Planet[]) : []);
    } catch {
      setPlanets([]);
    }
    setHydrated(true);
  }, [daySlug]);

  // Persist on change, once initial hydration has happened.
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(storageKey(daySlug), JSON.stringify(planets));
    } catch {
      // Storage unavailable (private browsing, quota, etc.) — planets
      // still work for the current session, just won't persist.
    }
  }, [planets, daySlug, hydrated]);

  const generatePlanet = useCallback((name: string, type: PlanetType): Planet => {
    const meta = getPlanetTypeMeta(type);
    const planet: Planet = {
      id: createPlanetId(),
      name: name.trim() || meta.label,
      type,
      color: meta.color,
      scheduled: false,
      orbit: null,
      startTime: null,
      endTime: null,
      completed: false,
    };
    setPlanets((prev) => [...prev, planet]);
    return planet;
  }, []);

  /** Deploys an unscheduled planet into an orbit with a start/end time. */
  const assignToOrbit = useCallback(
    (planetId: string, orbitId: string, startTime: string, endTime: string) => {
      setPlanets((prev) =>
        prev.map((p) =>
          p.id === planetId ? { ...p, scheduled: true, orbit: orbitId, startTime, endTime } : p
        )
      );
    },
    []
  );

  /** Re-times an already-deployed planet within its current orbit. */
  const updatePlanetTime = useCallback((planetId: string, startTime: string, endTime: string) => {
    setPlanets((prev) => prev.map((p) => (p.id === planetId ? { ...p, startTime, endTime } : p)));
  }, []);

  const updatePlanetType = useCallback((planetId: string, type: PlanetType) => {
    const meta = getPlanetTypeMeta(type);
    setPlanets((prev) =>
      prev.map((p) => (p.id === planetId ? { ...p, type, color: meta.color } : p))
    );
  }, []);

  const deletePlanet = useCallback((planetId: string) => {
    setPlanets((prev) => prev.filter((p) => p.id !== planetId));
  }, []);

  /**
   * Marks a deployed planet complete. It stays exactly where it is —
   * still on its orbit, still occupying its time slot — just dormant:
   * PlacedPlanet reads `completed` to render the shrunk, dimmed state,
   * and Helio's Solar Charge (derived from completed-vs-scheduled
   * counts) rises. No removal, no schema change beyond the existing
   * `completed` flag Phase 3 already reserved for this.
   */
  const completePlanet = useCallback((planetId: string) => {
    setPlanets((prev) => prev.map((p) => (p.id === planetId ? { ...p, completed: true } : p)));
  }, []);

  return {
    planets,
    generatePlanet,
    assignToOrbit,
    updatePlanetTime,
    updatePlanetType,
    deletePlanet,
    completePlanet,
    hydrated,
  };
}
