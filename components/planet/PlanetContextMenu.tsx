"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Move, Pencil, Trash2 } from "lucide-react";
import type { Planet } from "@/types/planet";
import { ORBITS, type OrbitInfo } from "@/lib/orbits";
import { getPlanetTypeMeta } from "@/types/planet";
import { dialogPanelVariants } from "@/components/MotionEffects";

interface PlanetContextMenuProps {
  /** Null closes the menu. */
  planet: Planet | null;
  orbitId: string | null;
  orbitLabel: string | null;
  /** Screen coordinates of the click/tap that opened the menu. */
  anchor: { x: number; y: number } | null;
  onClose: () => void;
  onMove: (targetOrbitId: string) => void;
  onEdit: () => void;
  onComplete: () => void;
  onDelete: () => void;
}

const MENU_WIDTH = 190;

/**
 * The small floating action menu opened by clicking a planet already
 * deployed on a ring — Phase 4.5's replacement for routing every
 * click through the full Planet Details sheet. Anchored near the
 * click point (clamped to stay on-screen) rather than centered as a
 * modal, and dismissed by a transparent click-catcher rather than a
 * dimmed backdrop, so it reads as a context menu, not a dialog.
 *
 * "Move" expands in place into a 3-way orbit picker instead of
 * requiring a drag — selecting a target reuses the exact same
 * pendingAssignment -> Time Assignment flow a drag-triggered move
 * already goes through (see UniverseLayout), so there's no separate
 * scheduling path to maintain.
 */
export default function PlanetContextMenu({
  planet,
  orbitId,
  orbitLabel,
  anchor,
  onClose,
  onMove,
  onEdit,
  onComplete,
  onDelete,
}: PlanetContextMenuProps) {
  const [mode, setMode] = useState<"menu" | "move">("menu");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<{ left: number; top: number }>({ left: 0, top: 0 });

  // Reset to the default menu face whenever a new planet is targeted.
  useEffect(() => {
    setMode("menu");
    setConfirmingDelete(false);
  }, [planet?.id]);

  // Clamp the anchored position so the menu never renders off-screen.
  useEffect(() => {
    if (!anchor) return;
    const estimatedHeight = mode === "move" ? 200 : 168;
    const left = Math.min(Math.max(8, anchor.x - MENU_WIDTH / 2), window.innerWidth - MENU_WIDTH - 8);
    const top = Math.min(Math.max(8, anchor.y + 14), window.innerHeight - estimatedHeight - 8);
    setStyle({ left, top });
  }, [anchor, mode]);

  if (!planet || !anchor) return null;

  const meta = getPlanetTypeMeta(planet.type);
  const timeLabel = planet.startTime && planet.endTime ? `${planet.startTime}–${planet.endTime}` : "Not set";

  function handleDeleteClick() {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    onDelete();
  }

  return (
    <AnimatePresence>
      {/* transparent click-catcher — closes the menu without dimming the screen, so this reads as a context menu, not a modal */}
      <motion.div
        className="fixed inset-0 z-40"
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 1 }}
        onClick={onClose}
      />
      <motion.div
        ref={menuRef}
        variants={dialogPanelVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        onClick={(e) => e.stopPropagation()}
        role="menu"
        aria-label={`${planet.name} actions`}
        className="glass-panel-strong fixed z-50 w-[190px] rounded-xl p-1.5 shadow-[0_0_40px_rgba(0,0,0,0.4)]"
        style={{ left: style.left, top: style.top }}
      >
        <div className="flex items-center gap-2 border-b border-line px-2.5 py-2">
          <span
            aria-hidden="true"
            className="h-3.5 w-3.5 shrink-0 rounded-full"
            style={{ background: `radial-gradient(circle at 32% 28%, ${meta.color}, ${meta.color}33)` }}
          />
          <div className="min-w-0">
            <p className="truncate font-mono text-[9px] uppercase tracking-widest2 text-ink-primary">
              {planet.name}
            </p>
            <p className="font-mono text-[8px] uppercase tracking-widest2 text-ink-faint">{timeLabel}</p>
          </div>
        </div>

        {mode === "menu" ? (
          <div className="py-1">
            <MenuButton icon={<Move size={12} />} label="Move" onClick={() => setMode("move")} />
            <MenuButton icon={<Pencil size={12} />} label="Edit" onClick={onEdit} />
            {planet.completed ? (
              <div className="flex items-center gap-2 px-2.5 py-2 font-mono text-[9px] uppercase tracking-widest2 text-cyan-glow/80">
                <Check size={12} />
                Completed
              </div>
            ) : (
              <MenuButton icon={<Check size={12} />} label="Complete" onClick={onComplete} tone="cyan" />
            )}
            <MenuButton
              icon={<Trash2 size={12} />}
              label={confirmingDelete ? "Confirm Delete" : "Delete"}
              onClick={handleDeleteClick}
              onBlur={() => setConfirmingDelete(false)}
              tone={confirmingDelete ? "danger" : "default"}
            />
          </div>
        ) : (
          <div className="py-1">
            <p className="px-2.5 pb-1.5 pt-2 font-mono text-[8px] uppercase tracking-widest2 text-ink-faint">
              Move to orbit
            </p>
            {ORBITS.map((orbit: OrbitInfo) => (
              <button
                key={orbit.id}
                type="button"
                disabled={orbit.id === orbitId}
                onClick={() => onMove(orbit.id)}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left font-mono text-[9px] uppercase tracking-widest2 text-ink-secondary transition-colors hover:bg-white/[0.05] hover:text-ink-primary disabled:cursor-not-allowed disabled:text-ink-faint disabled:hover:bg-transparent"
              >
                {orbit.label}
                {orbit.id === orbitId && <span className="text-[8px] text-ink-faint">Current</span>}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setMode("menu")}
              className="mt-1 w-full rounded-lg px-2.5 py-1.5 text-left font-mono text-[8px] uppercase tracking-widest2 text-ink-faint transition-colors hover:text-ink-secondary"
            >
              Back
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

interface MenuButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  onBlur?: () => void;
  tone?: "default" | "cyan" | "danger";
}

function MenuButton({ icon, label, onClick, onBlur, tone = "default" }: MenuButtonProps) {
  const toneClass =
    tone === "cyan"
      ? "text-cyan-glow hover:bg-cyan-dim"
      : tone === "danger"
        ? "text-red-300 bg-red-500/15 hover:bg-red-500/20"
        : "text-ink-secondary hover:bg-white/[0.05] hover:text-ink-primary";

  return (
    <button
      type="button"
      onClick={onClick}
      onBlur={onBlur}
      className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 font-mono text-[9px] uppercase tracking-widest2 transition-colors ${toneClass}`}
    >
      {icon}
      {label}
    </button>
  );
}
