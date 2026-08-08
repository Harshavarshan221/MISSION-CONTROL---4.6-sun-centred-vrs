"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Rocket, Satellite, CheckCircle2 } from "lucide-react";
import type { OrbitInfo } from "@/lib/orbits";
import { buildOrbitTimeline, formatTimeRangeLabel, timeToOrbitMinutes } from "@/lib/scheduling";
import type { Planet } from "@/types/planet";
import PlanetGlyph from "@/components/planet/Planet";
import { dialogFadeVariants, sheetSlideVariants } from "@/components/MotionEffects";

interface TimeAssignmentDialogProps {
  open: boolean;
  mode: "assign" | "edit" | "move";
  /** The planet being assigned/moved/edited — carries type + name so the expanded Mission Slot can show its generated art. */
  planet: Planet | null;
  /** The orbit this deployment targets. Fixed for the lifetime of the console — set once from the drop/action that opened it and never re-derived, so the planet always lands in the orbit it was dropped on. */
  orbit: OrbitInfo | null;
  /** Orbit label the planet is moving from — shown only in "move" mode. */
  fromOrbitLabel?: string | null;
  /** Every planet, so the panel can lay out the orbit's complete occupied/open timeline. */
  planets: Planet[];
  /** The planet being assigned/moved/edited — excluded from the timeline so its own current slot (if any) reopens instead of blocking itself. */
  excludePlanetId?: string;
  onClose: () => void;
  onSave: (startTime: string, endTime: string) => void;
  /** Retained for API compatibility with existing callers. The timeline only ever offers already-open gaps, so nothing here can conflict — always fires with null. */
  onConflictChange?: (conflictPlanetId: string | null) => void;
}

interface SelectedSlot {
  startTime: string;
  endTime: string;
}

/**
 * MISSION DEPLOYMENT CONSOLE — the compact side panel that turns a
 * drop (or an "Edit Time" action) into an actual schedule entry.
 *
 * Lays out the destination orbit's entire day as a single
 * chronological timeline — every planet already deployed there
 * (MISSION ACTIVE) interleaved with every open gap between them
 * (MISSION SLOT) — so occupied time and available time are never shown
 * separately.
 *
 * Tapping "Launch Mission" on an open slot does NOT save immediately.
 * It expands that one slot inline into a small deployment form —
 * selected planet, and start/end time fields defaulted to (and
 * clamped within) that slot's bounds — and only "Confirm Schedule"
 * commits it. The orbit itself is fixed for the whole flow (passed in
 * once as `orbit`), so whichever slot the user launches and confirms,
 * the planet is deployed into the orbit it was dropped on — never
 * somewhere else, never back to the dock.
 *
 * Cancel — the header's X, ESC, or clicking outside the panel —
 * always closes the console without saving anything, regardless of
 * whether a slot is currently expanded.
 *
 * The solar system stays visible behind the panel — this is a slide-in
 * console, not a full-screen modal.
 */
export default function TimeAssignmentDialog({
  open,
  mode,
  planet,
  orbit,
  fromOrbitLabel,
  planets,
  excludePlanetId,
  onClose,
  onSave,
  onConflictChange,
}: TimeAssignmentDialogProps) {
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");

  // Fresh console every time it opens — no slot carried over from a
  // previous deployment, and nothing pre-selected from a slot that
  // isn't onscreen anymore.
  useEffect(() => {
    if (!open) {
      setSelectedSlot(null);
      setEditStart("");
      setEditEnd("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onConflictChange?.(null);
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose, onConflictChange]);

  if (!orbit) return null;

  const timeline = open ? buildOrbitTimeline(planets, orbit, excludePlanetId) : [];
  const hasOpenSlot = timeline.some((entry) => entry.type === "open");

  function handleClose() {
    onConflictChange?.(null);
    onClose();
  }

  function handleSelectSlot(slot: SelectedSlot) {
    setSelectedSlot(slot);
    setEditStart(slot.startTime);
    setEditEnd(slot.endTime);
  }

  // Times must stay inside the launched slot's own window — the slot
  // IS the allowed range, nothing outside it is selectable.
  const slotStartMin = selectedSlot && orbit ? timeToOrbitMinutes(selectedSlot.startTime, orbit) : null;
  const slotEndMin = selectedSlot && orbit ? timeToOrbitMinutes(selectedSlot.endTime, orbit) : null;
  const editStartMin = editStart && orbit ? timeToOrbitMinutes(editStart, orbit) : null;
  const editEndMin = editEnd && orbit ? timeToOrbitMinutes(editEnd, orbit) : null;

  const timesInBounds =
    slotStartMin !== null &&
    slotEndMin !== null &&
    editStartMin !== null &&
    editEndMin !== null &&
    editStartMin >= slotStartMin &&
    editEndMin <= slotEndMin &&
    editStartMin < editEndMin;

  function handleConfirm() {
    if (!selectedSlot || !timesInBounds) return;
    onConflictChange?.(null);
    onSave(editStart, editEnd);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          variants={dialogFadeVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="fixed inset-0 z-50 flex items-stretch justify-end sm:items-center sm:p-4"
          // No dimming scrim: the whole point of the console is that the
          // solar system stays visible and in-context behind it.
          onClick={handleClose}
        >
          <motion.div
            variants={sheetSlideVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mission-deployment-title"
            className="glass-panel-strong flex h-full w-full max-w-[360px] min-w-[320px] flex-col shadow-[0_0_60px_rgba(34,211,238,0.12)] sm:h-auto sm:max-h-[85vh] sm:rounded-2xl"
          >
            <div className="flex items-start justify-between gap-3 border-b border-line p-5">
              <div>
                <p className="mb-1 flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-widest2 text-amber-hud/80">
                  <Satellite size={10} />
                  Mission Deployment Console
                </p>
                <h2
                  id="mission-deployment-title"
                  className="font-display text-sm uppercase tracking-wide text-ink-primary"
                >
                  {planet?.name ?? ""}
                </h2>
                <p className="mt-1 font-mono text-[8px] uppercase tracking-widest2 text-ink-faint">
                  {mode === "move" && fromOrbitLabel ? `${fromOrbitLabel} \u2192 ` : ""}
                  {orbit.label}
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Cancel"
                className="text-ink-faint transition-colors hover:text-ink-primary"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <ol className="space-y-2">
                {timeline.map((entry, i) => {
                  if (entry.type === "occupied") {
                    return (
                      <li
                        key={entry.planet.id}
                        className="rounded-xl border border-line bg-white/[0.02] px-3.5 py-3"
                      >
                        <p className="font-mono text-[9px] uppercase tracking-widest2 text-ink-faint">
                          {formatTimeRangeLabel(entry.planet.startTime, entry.planet.endTime)}
                        </p>
                        <p className="mt-1 font-body text-sm text-ink-secondary">{entry.planet.name}</p>
                        <p className="mt-1.5 font-mono text-[8px] uppercase tracking-widest2 text-cyan-glow/80">
                          Mission Active
                        </p>
                      </li>
                    );
                  }

                  const isSelected =
                    selectedSlot !== null &&
                    selectedSlot.startTime === entry.startTime &&
                    selectedSlot.endTime === entry.endTime;

                  if (!isSelected) {
                    return (
                      <li
                        key={`open-${entry.startTime}-${i}`}
                        className="rounded-xl border border-dashed border-amber-hud/40 bg-amber-hud/[0.04] px-3.5 py-3"
                      >
                        <p className="font-mono text-[9px] uppercase tracking-widest2 text-ink-faint">
                          {formatTimeRangeLabel(entry.startTime, entry.endTime)}
                        </p>
                        <p className="mt-1 font-mono text-[10px] uppercase tracking-widest2 text-amber-hud">
                          Mission Slot
                        </p>
                        <p className="mt-0.5 font-mono text-[8px] uppercase tracking-widest2 text-ink-faint">
                          Ready For Deployment
                        </p>
                        <button
                          type="button"
                          onClick={() => handleSelectSlot({ startTime: entry.startTime, endTime: entry.endTime })}
                          className="mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-cyan-glow px-3 py-2 font-mono text-[9px] uppercase tracking-widest2 text-void transition-opacity hover:opacity-90"
                        >
                          <Rocket size={12} />
                          Launch Mission
                        </button>
                      </li>
                    );
                  }

                  // Expanded: this is the ONE slot Launch Mission was
                  // pressed on. Everything needed to confirm the
                  // deployment lives inline here, still inside the same
                  // side panel — no second popup.
                  return (
                    <li
                      key={`open-${entry.startTime}-${i}`}
                      className="rounded-xl border border-cyan-glow/50 bg-cyan-glow/[0.06] px-3.5 py-3.5"
                    >
                      <p className="font-mono text-[8px] uppercase tracking-widest2 text-cyan-glow/80">
                        Selected Planet
                      </p>
                      <div className="mt-2 flex items-center gap-2.5">
                        {planet && <PlanetGlyph type={planet.type} size={30} glow="soft" />}
                        <p className="font-body text-sm text-ink-primary">{planet?.name}</p>
                      </div>

                      <div className="mt-3.5 grid grid-cols-2 gap-2.5">
                        <label className="flex flex-col gap-1">
                          <span className="font-mono text-[8px] uppercase tracking-widest2 text-ink-faint">
                            Start Time
                          </span>
                          <input
                            type="time"
                            value={editStart}
                            onChange={(e) => setEditStart(e.target.value)}
                            className="rounded-lg border border-line bg-white/[0.03] px-2 py-1.5 font-mono text-[11px] text-ink-primary outline-none focus:border-cyan-glow/60"
                          />
                        </label>
                        <label className="flex flex-col gap-1">
                          <span className="font-mono text-[8px] uppercase tracking-widest2 text-ink-faint">
                            End Time
                          </span>
                          <input
                            type="time"
                            value={editEnd}
                            onChange={(e) => setEditEnd(e.target.value)}
                            className="rounded-lg border border-line bg-white/[0.03] px-2 py-1.5 font-mono text-[11px] text-ink-primary outline-none focus:border-cyan-glow/60"
                          />
                        </label>
                      </div>

                      <p className="mt-2 font-mono text-[8px] uppercase tracking-widest2 text-ink-faint">
                        Must stay within {formatTimeRangeLabel(entry.startTime, entry.endTime)}
                      </p>
                      {!timesInBounds && (
                        <p className="mt-1 font-mono text-[8px] uppercase tracking-widest2 text-red-400">
                          Selected time is outside this Mission Slot
                        </p>
                      )}

                      <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={!timesInBounds}
                        className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-cyan-glow px-3 py-2 font-mono text-[9px] uppercase tracking-widest2 text-void transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <CheckCircle2 size={12} />
                        Confirm Schedule
                      </button>
                    </li>
                  );
                })}
              </ol>

              {!hasOpenSlot && (
                <p className="mt-4 text-center font-mono text-[9px] uppercase tracking-widest2 text-ink-faint">
                  {orbit.label} is fully deployed — no open mission slots remain.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-line p-4">
              <button
                type="button"
                onClick={handleClose}
                className="font-mono text-[9px] uppercase tracking-widest2 text-ink-secondary transition-colors hover:text-ink-primary"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
