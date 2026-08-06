"use client";

import { useEffect, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, AlertTriangle } from "lucide-react";
import type { OrbitInfo } from "@/lib/orbits";
import { generateOrbitTimeSlots, findTimeConflict } from "@/lib/scheduling";
import type { Planet } from "@/types/planet";
import { dialogFadeVariants, dialogPanelVariants } from "@/components/MotionEffects";

interface TimeAssignmentDialogProps {
  open: boolean;
  mode: "assign" | "edit" | "move";
  planetName: string;
  orbit: OrbitInfo | null;
  /** Orbit label the planet is moving from — shown only in "move" mode. */
  fromOrbitLabel?: string | null;
  initialStart?: string | null;
  initialEnd?: string | null;
  /** Every planet, so the currently selected time can be checked for overlaps against whatever's already deployed in `orbit`. */
  planets: Planet[];
  /** The planet being assigned/moved/edited — excluded from its own conflict check. */
  excludePlanetId?: string;
  onClose: () => void;
  onSave: (startTime: string, endTime: string) => void;
  /** Fires whenever the live conflict target changes, so the ring can highlight it. Called with null when there's no conflict or the dialog is closed. */
  onConflictChange?: (conflictPlanetId: string | null) => void;
}

/**
 * The dialog that turns a drop (or an "Edit Time" action) into an
 * actual schedule entry: the planet's name read-only, a Start Time and
 * End Time restricted to the target orbit's allowed window, and Save.
 * This is the one place start/end times get chosen — the orbit's
 * window is the hard constraint, so invalid combinations are simply
 * not offered as options.
 */
export default function TimeAssignmentDialog({
  open,
  mode,
  planetName,
  orbit,
  fromOrbitLabel,
  initialStart,
  initialEnd,
  planets,
  excludePlanetId,
  onClose,
  onSave,
  onConflictChange,
}: TimeAssignmentDialogProps) {
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  useEffect(() => {
    if (!open || !orbit) return;
    const slots = generateOrbitTimeSlots(orbit);
    const start = initialStart && slots.includes(initialStart) ? initialStart : slots[0];
    const startIndex = slots.indexOf(start);
    const end =
      initialEnd && slots.includes(initialEnd) && slots.indexOf(initialEnd) > startIndex
        ? initialEnd
        : slots[Math.min(startIndex + 1, slots.length - 1)];
    setStartTime(start);
    setEndTime(end);
  }, [open, orbit, initialStart, initialEnd]);

  // Live conflict check (Priority 12 / Case 4): re-evaluated on every
  // start/end change so the Save button is disabled and the offending
  // planet is named *before* the user tries to submit, not after.
  const conflict =
    open && orbit ? findTimeConflict(planets, orbit, startTime, endTime, excludePlanetId) : null;

  useEffect(() => {
    onConflictChange?.(open ? conflict?.id ?? null : null);
    // Clear the highlight on unmount / close too.
    return () => onConflictChange?.(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, conflict?.id]);

  if (!orbit) return null;

  const slots = generateOrbitTimeSlots(orbit);
  const startIndex = slots.indexOf(startTime);
  const startOptions = slots.slice(0, -1);
  const endOptions = slots.filter((_, i) => i > startIndex);

  function handleStartChange(value: string) {
    setStartTime(value);
    const newStartIndex = slots.indexOf(value);
    if (slots.indexOf(endTime) <= newStartIndex) {
      setEndTime(slots[newStartIndex + 1] ?? slots[slots.length - 1]);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!startTime || !endTime || conflict) return;
    onSave(startTime, endTime);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          variants={dialogFadeVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="fixed inset-0 z-50 flex items-center justify-center bg-void/70 px-6 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.form
            variants={dialogPanelVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmit}
            role="dialog"
            aria-modal="true"
            aria-labelledby="time-assignment-title"
            className="glass-panel-strong w-full max-w-[380px] rounded-2xl p-6 shadow-[0_0_60px_rgba(34,211,238,0.12)]"
          >
            <div className="mb-5 flex items-start justify-between">
              <div>
                <p className="mb-1 font-mono text-[8px] uppercase tracking-widest2 text-amber-hud/80">
                  {orbit.label}
                </p>
                <h2
                  id="time-assignment-title"
                  className="font-display text-sm uppercase tracking-wide text-ink-primary"
                >
                  {mode === "assign" ? "Assign Orbit Time" : mode === "move" ? "Move to New Orbit" : "Edit Orbit Time"}
                </h2>
                {mode === "move" && fromOrbitLabel && (
                  <p className="mt-1 font-mono text-[8px] uppercase tracking-widest2 text-ink-faint">
                    From {fromOrbitLabel}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cancel"
                className="text-ink-faint transition-colors hover:text-ink-primary"
              >
                <X size={16} />
              </button>
            </div>

            <label className="mb-4 block">
              <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-widest2 text-ink-secondary">
                Planet Name
              </span>
              <input
                value={planetName}
                readOnly
                disabled
                className="w-full rounded-lg border border-line bg-white/[0.02] px-3 py-2 font-body text-sm text-ink-secondary outline-none"
              />
            </label>

            <div className="mb-2 grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-widest2 text-ink-secondary">
                  Start Time
                </span>
                <select
                  value={startTime}
                  onChange={(e) => handleStartChange(e.target.value)}
                  className="w-full rounded-lg border border-line bg-white/[0.03] px-2 py-2 font-mono text-xs text-ink-primary outline-none focus:border-cyan-glow/60"
                >
                  {startOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-widest2 text-ink-secondary">
                  End Time
                </span>
                <select
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full rounded-lg border border-line bg-white/[0.03] px-2 py-2 font-mono text-xs text-ink-primary outline-none focus:border-cyan-glow/60"
                >
                  {endOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p className="mb-4 font-mono text-[8px] uppercase tracking-widest2 text-ink-faint">
              {orbit.label} window: {orbit.timeRange}
            </p>

            {conflict && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2.5">
                <AlertTriangle size={13} className="mt-0.5 shrink-0 text-red-300" />
                <p className="font-mono text-[9px] uppercase tracking-widest2 text-red-300">
                  Conflicts with {conflict.name} ({conflict.startTime}–{conflict.endTime}). Choose another time.
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="font-mono text-[9px] uppercase tracking-widest2 text-ink-secondary transition-colors hover:text-ink-primary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!!conflict}
                className="rounded-lg bg-cyan-glow px-4 py-2 font-mono text-[9px] uppercase tracking-widest2 text-void transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Save
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
