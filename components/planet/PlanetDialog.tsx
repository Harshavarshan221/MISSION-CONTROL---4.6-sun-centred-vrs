"use client";

import { useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { PlanetType } from "@/types/planet";
import { PLANET_TYPES } from "@/types/planet";
import { dialogFadeVariants, dialogPanelVariants } from "@/components/MotionEffects";

interface PlanetDialogProps {
  open: boolean;
  onClose: () => void;
  onGenerate: (name: string, type: PlanetType) => void;
}

/**
 * "Generate New Planet" — the premium glassmorphism dialog for
 * creating a planet (a study task). Read-only fields only: a name and
 * a type. No orbit, no timing — that's deployment, and deployment is
 * next-phase work. On submit the planet appears immediately in the
 * Planet Dock, unscheduled.
 */
export default function PlanetDialog({ open, onClose, onGenerate }: PlanetDialogProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<PlanetType>(PLANET_TYPES[0].id);

  function reset() {
    setName("");
    setType(PLANET_TYPES[0].id);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onGenerate(trimmed, type);
    reset();
    onClose();
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
          onClick={handleClose}
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
            aria-labelledby="generate-planet-title"
            className="glass-panel-strong w-full max-w-[380px] rounded-2xl p-6 shadow-[0_0_60px_rgba(34,211,238,0.12)]"
          >
            <div className="mb-5 flex items-center justify-between">
              <h2
                id="generate-planet-title"
                className="font-display text-sm uppercase tracking-wide text-ink-primary"
              >
                Generate New Planet
              </h2>
              <button
                type="button"
                onClick={handleClose}
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
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Calculus Review"
                maxLength={40}
                className="w-full rounded-lg border border-line bg-white/[0.03] px-3 py-2 font-body text-sm text-ink-primary outline-none transition-colors placeholder:text-ink-faint focus:border-cyan-glow/60"
              />
            </label>

            <fieldset className="mb-6">
              <legend className="mb-2 block font-mono text-[9px] uppercase tracking-widest2 text-ink-secondary">
                Planet Type
              </legend>
              <div className="grid grid-cols-3 gap-2">
                {PLANET_TYPES.map((t) => {
                  const active = type === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setType(t.id)}
                      aria-pressed={active}
                      className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-2.5 transition-colors ${
                        active
                          ? "border-cyan-glow/70 bg-cyan-dim"
                          : "border-line bg-white/[0.02] hover:border-line"
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
                      <span className="font-mono text-[8px] uppercase tracking-widest2 text-ink-secondary">
                        {t.shortLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="font-mono text-[9px] uppercase tracking-widest2 text-ink-secondary transition-colors hover:text-ink-primary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!name.trim()}
                className="rounded-lg bg-cyan-glow px-4 py-2 font-mono text-[9px] uppercase tracking-widest2 text-void transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Generate Planet
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
