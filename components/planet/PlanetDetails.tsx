"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Trash2 } from "lucide-react";
import type { Planet, PlanetType } from "@/types/planet";
import { PLANET_TYPES, getPlanetTypeMeta } from "@/types/planet";
import { dialogFadeVariants, sheetSlideVariants } from "@/components/MotionEffects";

interface PlanetDetailsProps {
  planet: Planet | null;
  onClose: () => void;
  onEditTime: () => void;
  onChangeType: (type: PlanetType) => void;
  onDelete: () => void;
}

/**
 * Planet readout, opened by selecting a planet in the dock or on an
 * orbit ring. Shows what's known about the planet, and — for a
 * deployed planet — offers Edit Time, Change Planet Type, and Delete
 * Planet. After any edit, the orbit re-sorts and redistributes
 * automatically (it's derived fresh from planet data on every render,
 * not stored order), so nothing extra needs to happen here.
 */
export default function PlanetDetails({
  planet,
  onClose,
  onEditTime,
  onChangeType,
  onDelete,
}: PlanetDetailsProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const meta = planet ? getPlanetTypeMeta(planet.type) : null;

  function handleClose() {
    setConfirmingDelete(false);
    onClose();
  }

  function handleDeleteClick() {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    onDelete();
    setConfirmingDelete(false);
  }

  return (
    <AnimatePresence>
      {planet && meta && (
        <motion.div
          variants={dialogFadeVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="fixed inset-0 z-50 flex items-stretch justify-end bg-void/60 backdrop-blur-sm sm:items-center sm:justify-center sm:px-6"
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
            aria-labelledby="planet-details-title"
            className="glass-panel-strong flex h-full w-full max-w-[360px] flex-col p-6 sm:h-auto sm:max-h-[85vh] sm:rounded-2xl"
          >
            <div className="mb-6 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="h-10 w-10 shrink-0 rounded-full"
                  style={{
                    background: `radial-gradient(circle at 32% 28%, ${meta.color}, ${meta.color}33)`,
                    boxShadow: `0 0 16px ${meta.color}66`,
                  }}
                />
                <div>
                  <p className="font-mono text-[8px] uppercase tracking-widest2 text-ink-faint">
                    Planet File
                  </p>
                  <h2
                    id="planet-details-title"
                    className="font-display text-base uppercase tracking-wide text-ink-primary"
                  >
                    {planet.name}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close"
                className="text-ink-faint transition-colors hover:text-ink-primary"
              >
                <X size={16} />
              </button>
            </div>

            <dl className="space-y-4 font-mono text-[10px] uppercase tracking-widest2">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <dt className="text-ink-faint">Planet Type</dt>
                <dd className="text-ink-primary">{meta.label}</dd>
              </div>
              <div className="flex items-center justify-between border-b border-line pb-3">
                <dt className="text-ink-faint">Status</dt>
                <dd className={planet.scheduled ? "text-cyan-glow" : "text-amber-hud"}>
                  {planet.scheduled ? "Deployed" : "Unscheduled"}
                </dd>
              </div>
              <div className="flex items-center justify-between border-b border-line pb-3">
                <dt className="text-ink-faint">Orbit</dt>
                <dd className="text-ink-secondary">{planet.orbit ?? "Not deployed"}</dd>
              </div>
              <div className="flex items-center justify-between pb-1">
                <dt className="text-ink-faint">Time</dt>
                <dd className="text-ink-secondary">
                  {planet.startTime && planet.endTime
                    ? `${planet.startTime} – ${planet.endTime}`
                    : "Not set"}
                </dd>
              </div>
            </dl>

            {!planet.scheduled ? (
              <p className="mt-6 font-mono text-[8px] uppercase tracking-widest2 text-ink-faint">
                Drag this planet from the dock into an orbit to deploy it.
              </p>
            ) : (
              <p className="mt-6 font-mono text-[8px] uppercase tracking-widest2 text-ink-faint">
                Drag this planet on the ring to move it to another orbit, or use Edit Time to re-time it within {planet.orbit}.
              </p>
            )}

            <fieldset className="mt-6">
              <legend className="mb-2 block font-mono text-[9px] uppercase tracking-widest2 text-ink-secondary">
                Change Planet Type
              </legend>
              <div className="grid grid-cols-5 gap-2">
                {PLANET_TYPES.map((t) => {
                  const active = planet.type === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => onChangeType(t.id)}
                      aria-pressed={active}
                      aria-label={t.label}
                      className={`flex flex-col items-center gap-1 rounded-xl border p-2 transition-colors ${
                        active ? "border-cyan-glow/70 bg-cyan-dim" : "border-line bg-white/[0.02] hover:border-line"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className="h-5 w-5 rounded-full"
                        style={{
                          background: `radial-gradient(circle at 32% 28%, ${t.color}, ${t.color}33)`,
                          boxShadow: active ? `0 0 10px ${t.color}88` : undefined,
                        }}
                      />
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="mt-6 flex items-center justify-between gap-3">
              {planet.scheduled ? (
                <button
                  type="button"
                  onClick={onEditTime}
                  className="rounded-lg border border-cyan-glow/50 px-4 py-2 font-mono text-[9px] uppercase tracking-widest2 text-cyan-glow transition-colors hover:bg-cyan-dim"
                >
                  Edit Time
                </button>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={handleDeleteClick}
                onBlur={() => setConfirmingDelete(false)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 font-mono text-[9px] uppercase tracking-widest2 transition-colors ${
                  confirmingDelete
                    ? "border-red-400/70 bg-red-500/15 text-red-300"
                    : "border-line text-ink-secondary hover:border-red-400/50 hover:text-red-300"
                }`}
              >
                <Trash2 size={12} />
                {confirmingDelete ? "Confirm Delete" : "Delete Planet"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
