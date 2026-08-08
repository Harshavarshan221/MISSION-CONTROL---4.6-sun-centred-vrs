"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import type { DayInfo } from "@/lib/days";
import { ORBITS, getOrbitById, type OrbitInfo } from "@/lib/orbits";
import type { Planet, PlanetType } from "@/types/planet";
import { PLANET_TYPES } from "@/types/planet";
import { usePlanets } from "@/hooks/usePlanets";
import { getPlanetsForOrbit } from "@/lib/scheduling";
import HelioCore from "@/components/mission-control/MissionControl";
import OrbitDropZone from "@/components/orbits/OrbitDropZone";
import PlanetDock from "@/components/planet/PlanetDock";
import PlanetDialog from "@/components/planet/PlanetDialog";
import PlanetDetails from "@/components/planet/PlanetDetails";
import PlanetContextMenu from "@/components/planet/PlanetContextMenu";
import TimeAssignmentDialog from "@/components/planet/TimeAssignmentDialog";
import PlanetGhost from "@/components/planet/PlanetGhost";
import { fadeUpVariants, wheelEntranceVariants } from "@/components/MotionEffects";

const CX = 360;
const CY = 360;
const VIEWBOX_SIZE = 720;

// Orbit stack, innermost (morning) to outermost (evening). Phase 6
// widens the gap between rings a little further still (~75-80 vs.
// Phase 5's ~70) and grows the stage to match, giving the busiest ring
// (evening — the widest scheduling window, so usually the most
// crowded) extra breathing room without dramatically enlarging the
// whole system.
const ORBIT_RADII = [190, 265, 345];
// Every ring's label sits at the same angle EXCEPT the final/largest
// one (evening): that ring tends to carry the most deployed planets,
// and Phase 5's single shared LABEL_ANGLE put its tag right where
// those planets' own name/time labels cluster. Moving just that one
// tag to the opposite side of the ring (roughly 180deg around) gives
// it a quiet stretch of its own instead.
const LABEL_ANGLES = [-46, -46, 134];
// Where the "+" empty-orbit marker sits on each ring — a quiet spot
// clear of the orbit's label tag. Only shown when a ring is empty (no
// planet labels onscreen to collide with), so it stays shared across
// all three rings even though the evening ring's label moved.
const PLACEHOLDER_ANGLE = 132;
// How far (in viewBox units) the pointer may sit from a ring's exact
// radius and still count as a drop on that ring — roughly half the
// gap between rings plus a little slack, so a drop anywhere near a
// ring resolves to it rather than requiring pixel-perfect aim.
const ORBIT_HIT_BAND = 48;

interface PendingAssignment {
  planet: Planet;
  orbit: OrbitInfo;
  /** Orbit id the planet was dragged from, if it was already deployed — null for a fresh dock -> orbit assignment. */
  fromOrbit: string | null;
}

interface MenuTarget {
  planet: Planet;
  orbitId: string;
  orbitLabel: string;
  anchor: { x: number; y: number };
}

interface UniverseLayoutProps {
  day: DayInfo;
}

/**
 * The Day Universe screen: Helio fixed and centered as the sole light
 * source, three orbit rings around it acting as live drop zones, and
 * the Planet Dock anchoring the bottom of the screen as the drag
 * source. A planet dragged from the dock and dropped on a ring opens
 * the Time Assignment dialog; saving it deploys the planet, which
 * then renders directly on that ring, evenly spaced and sorted by
 * start time. A planet already on a ring is itself a drag source too
 * (reposition within its orbit, or move to a different one), and
 * clicking it opens a small floating action menu — Move, Edit,
 * Complete, Delete — rather than a full sheet. Completing a planet
 * never removes it: it shrinks and dims in place, and its energy
 * feeds Helio's Solar Charge.
 */
export default function UniverseLayout({ day }: UniverseLayoutProps) {
  const {
    planets,
    generatePlanet,
    assignToOrbit,
    updatePlanetTime,
    updatePlanetType,
    deletePlanet,
    completePlanet,
  } = usePlanets(day.slug);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPlanet, setSelectedPlanet] = useState<Planet | null>(null);
  const [menuTarget, setMenuTarget] = useState<MenuTarget | null>(null);
  const [activePlanet, setActivePlanet] = useState<Planet | null>(null);
  const [pendingAssignment, setPendingAssignment] = useState<PendingAssignment | null>(null);
  const [editingTime, setEditingTime] = useState<PendingAssignment | null>(null);
  // Which planet the currently-open Time Assignment dialog would
  // conflict with, if any — surfaced here so it can be passed down to
  // the ring and highlighted (Case 4: "highlight the conflicting planet").
  const [conflictPlanetId, setConflictPlanetId] = useState<string | null>(null);

  const stageRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Solar Charge — the share of this universe's deployed planets that
  // are complete. Purely derived from `planets` on every render, same
  // as orbit membership and angle distribution; nothing new persisted.
  const scheduledCount = planets.filter((p) => p.scheduled).length;
  const completedCount = planets.filter((p) => p.scheduled && p.completed).length;
  const solarCharge = scheduledCount === 0 ? 0 : (completedCount / scheduledCount) * 100;

  // Orbits are concentric rings, not rectangles, so dnd-kit's default
  // rectangle-based collision detection doesn't apply cleanly. Instead:
  // convert the pointer's screen position into the SVG's viewBox space,
  // measure its distance from Helio's center, and hand the drop to
  // whichever ring's radius that distance is closest to (within
  // ORBIT_HIT_BAND). Outside every band, there's no collision — the
  // planet is "dropped outside" and springs back to the dock.
  const orbitCollisionDetection: CollisionDetection = useCallback(({ droppableContainers, pointerCoordinates }) => {
    if (!pointerCoordinates || !stageRef.current) return [];
    const rect = stageRef.current.getBoundingClientRect();
    if (rect.width === 0) return [];

    const scale = VIEWBOX_SIZE / rect.width;
    const localX = (pointerCoordinates.x - rect.left) * scale;
    const localY = (pointerCoordinates.y - rect.top) * scale;
    const distance = Math.hypot(localX - CX, localY - CY);

    let bestIndex = -1;
    let bestDelta = Infinity;
    ORBIT_RADII.forEach((radius, i) => {
      const delta = Math.abs(distance - radius);
      if (delta < bestDelta) {
        bestDelta = delta;
        bestIndex = i;
      }
    });

    if (bestIndex === -1 || bestDelta > ORBIT_HIT_BAND) return [];

    const orbitId = ORBITS[bestIndex].id;
    const container = droppableContainers.find((c) => c.id === orbitId);
    return container ? [{ id: orbitId }] : [];
  }, []);

  function handleDragStart(event: DragStartEvent) {
    const planet = event.active.data.current?.planet as Planet | undefined;
    setActivePlanet(planet ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActivePlanet(null);
    const planet = event.active.data.current?.planet as Planet | undefined;
    const fromOrbit = (event.active.data.current?.fromOrbit as string | undefined) ?? null;
    if (!planet) return;

    // Dropped outside every ring (and outside the dock, for a placed
    // planet being re-dragged): nothing was ever mutated, so the
    // planet is already exactly where it started. No data lost.
    if (!event.over) return;

    const orbit = getOrbitById(String(event.over.id));
    if (!orbit) return;

    // Case 1 (Priority 12): re-dropped on the SAME orbit it came from.
    // Order is always derived fresh from start time (Priority 2), so a
    // same-orbit drag has nothing to persist — no dialog, no state
    // change, the planet just settles back into its sorted position.
    if (fromOrbit && fromOrbit === orbit.id) return;

    // Otherwise: a fresh dock -> orbit assignment, or a real move to a
    // different orbit. Either way, open Time Assignment restricted to
    // the destination orbit's window before anything is committed.
    setPendingAssignment({ planet, orbit, fromOrbit });
  }

  function handleDragCancel() {
    setActivePlanet(null);
  }

  function handleSelectPlacedPlanet(
    planet: Planet,
    orbitId: string,
    orbitLabel: string,
    anchor: { x: number; y: number }
  ) {
    setMenuTarget({ planet, orbitId, orbitLabel, anchor });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={orbitCollisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="relative z-10 flex w-full flex-col items-center gap-10 pb-28 sm:gap-12 sm:pb-32">
        {/* HUD chrome */}
        <div className="flex w-full max-w-[680px] items-center justify-between px-1">
          <motion.div custom={0} variants={fadeUpVariants} initial="hidden" animate="visible">
            <Link
              href="/"
              className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest2 text-ink-secondary transition-colors hover:text-cyan-glow"
            >
              <ArrowLeft size={12} />
              Weekly Multiverse
            </Link>
          </motion.div>
          <motion.p
            custom={0}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="font-mono text-[10px] uppercase tracking-widest2 text-amber-hud/80"
          >
            Universe {day.designation}
          </motion.p>
        </div>

        {/* stage */}
        <motion.div
          ref={stageRef}
          variants={wheelEntranceVariants}
          initial="hidden"
          animate="visible"
          className="relative aspect-square w-[min(92vw,680px)]"
        >
          {/* subtle radial lighting — Helio as the one light source the
              whole composition reads outward from, centered precisely
              so nothing feels off-balance */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{
              background:
                "radial-gradient(34% 34% at 50% 50%, rgba(255,165,36,0.10) 0%, rgba(255,165,36,0.03) 48%, rgba(255,165,36,0) 74%)",
            }}
          />

          <svg
            viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
            className="absolute inset-0 h-full w-full"
            role="img"
            aria-label={`${day.label} universe — Helio with morning, afternoon, and evening orbits`}
          >
            <defs>
              {PLANET_TYPES.map((t) => (
                <radialGradient key={t.id} id={`planet-grad-${t.id}`} cx="38%" cy="34%" r="68%">
                  <stop offset="0%" stopColor={t.gradientStops.highlight} />
                  <stop offset="42%" stopColor={t.gradientStops.mid} />
                  <stop offset="78%" stopColor={t.gradientStops.base} />
                  <stop offset="100%" stopColor={t.gradientStops.edge} />
                </radialGradient>
              ))}
              {/* Generated-asset planet art is embedded directly by
                  PlacedPlanet as a clipped <image> (per-planet clipPath,
                  since it needs that planet's actual on-ring position) —
                  no shared pattern def needed here. */}
            </defs>

            {/* orbit drop zones, sequenced innermost (morning) outward */}
            {ORBITS.map((orbit, i) => (
              <OrbitDropZone
                key={orbit.id}
                orbit={orbit}
                cx={CX}
                cy={CY}
                radius={ORBIT_RADII[i]}
                labelAngle={LABEL_ANGLES[i]}
                placeholderAngle={PLACEHOLDER_ANGLE}
                index={i}
                planets={getPlanetsForOrbit(planets, orbit)}
                conflictPlanetId={conflictPlanetId}
                selectedPlanetId={menuTarget?.planet.id ?? null}
                onSelectPlanet={handleSelectPlacedPlanet}
                pendingPlanet={
                  pendingAssignment && pendingAssignment.orbit.id === orbit.id
                    ? pendingAssignment.planet
                    : null
                }
                emphasizeLabel={i === ORBITS.length - 1}
              />
            ))}
          </svg>

          <HelioCore day={day} solarCharge={solarCharge} />
        </motion.div>

        <PlanetDock
          planets={planets}
          onGenerate={() => setDialogOpen(true)}
          onSelect={setSelectedPlanet}
        />

        <PlanetDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onGenerate={(name: string, type: PlanetType) => generatePlanet(name, type)}
        />

        <PlanetDetails
          planet={selectedPlanet}
          onClose={() => setSelectedPlanet(null)}
          onEditTime={() => {
            if (!selectedPlanet?.orbit) return;
            const orbit = getOrbitById(selectedPlanet.orbit);
            if (!orbit) return;
            setEditingTime({ planet: selectedPlanet, orbit, fromOrbit: selectedPlanet.orbit });
            setSelectedPlanet(null);
          }}
          onChangeType={(type) => {
            if (!selectedPlanet) return;
            updatePlanetType(selectedPlanet.id, type);
          }}
          onDelete={() => {
            if (!selectedPlanet) return;
            deletePlanet(selectedPlanet.id);
            setSelectedPlanet(null);
          }}
        />

        <PlanetContextMenu
          planet={menuTarget?.planet ?? null}
          orbitId={menuTarget?.orbitId ?? null}
          orbitLabel={menuTarget?.orbitLabel ?? null}
          anchor={menuTarget?.anchor ?? null}
          onClose={() => setMenuTarget(null)}
          onMove={(targetOrbitId) => {
            if (!menuTarget) return;
            const orbit = getOrbitById(targetOrbitId);
            if (!orbit) return;
            // Same underlying flow a drag-triggered move uses — see
            // handleDragEnd above. mode resolves to "move" because
            // fromOrbit is set, which is exactly what re-dragging a
            // placed planet onto a different ring also produces.
            setPendingAssignment({ planet: menuTarget.planet, orbit, fromOrbit: menuTarget.orbitId });
            setMenuTarget(null);
          }}
          onEdit={() => {
            if (!menuTarget) return;
            const orbit = getOrbitById(menuTarget.orbitId);
            if (!orbit) return;
            setEditingTime({ planet: menuTarget.planet, orbit, fromOrbit: menuTarget.orbitId });
            setMenuTarget(null);
          }}
          onComplete={() => {
            if (!menuTarget) return;
            completePlanet(menuTarget.planet.id);
            setMenuTarget(null);
          }}
          onDelete={() => {
            if (!menuTarget) return;
            deletePlanet(menuTarget.planet.id);
            setMenuTarget(null);
          }}
        />

        <TimeAssignmentDialog
          open={pendingAssignment !== null}
          mode={pendingAssignment?.fromOrbit ? "move" : "assign"}
          planet={pendingAssignment?.planet ?? null}
          orbit={pendingAssignment?.orbit ?? null}
          fromOrbitLabel={
            pendingAssignment?.fromOrbit ? getOrbitById(pendingAssignment.fromOrbit)?.label : null
          }
          planets={planets}
          excludePlanetId={pendingAssignment?.planet.id}
          onClose={() => setPendingAssignment(null)}
          onConflictChange={setConflictPlanetId}
          onSave={(start, end) => {
            if (!pendingAssignment) return;
            // assignToOrbit doubles as "move": it always overwrites
            // orbit/start/end regardless of what the planet's previous
            // orbit was, so a dock -> orbit assignment and an
            // orbit -> orbit move are the same commit.
            assignToOrbit(pendingAssignment.planet.id, pendingAssignment.orbit.id, start, end);
            setPendingAssignment(null);
          }}
        />

        <TimeAssignmentDialog
          open={editingTime !== null}
          mode="edit"
          planet={editingTime?.planet ?? null}
          orbit={editingTime?.orbit ?? null}
          planets={planets}
          excludePlanetId={editingTime?.planet.id}
          onClose={() => setEditingTime(null)}
          onConflictChange={setConflictPlanetId}
          onSave={(start, end) => {
            if (!editingTime) return;
            updatePlanetTime(editingTime.planet.id, start, end);
            setEditingTime(null);
          }}
        />
      </div>

      <DragOverlay>{activePlanet ? <PlanetGhost planet={activePlanet} /> : null}</DragOverlay>
    </DndContext>
  );
}
