# Study Ranker — Phase 4.5

A retro-futuristic solar-system study scheduler.

**Phase 1** — the landing wheel: seven days on an instrument-style ring;
picking one routes to `/universe/[day]`.

**Phase 2** — the Day Universe screen at `/universe/[day]`: a fixed
central hub with empty orbit guides around it (Morning / Afternoon /
Evening). The weekly wheel lives only on the landing page — once
inside a universe it's gone entirely, replaced by a quiet "Weekly
Multiverse" text link.

**Phase 3** — the Planet System: planets are the app's primary object,
each one a study task. From a Day Universe you can Generate Planet
(create), see every generated planet in the Planet Dock along the
bottom of the screen, and select one to view its Planet Details.
Planets persist per day in `localStorage`.

**Phase 4 — Scheduler Engine** — planets deploy. Drag a planet from
the dock onto an orbit ring to open Time Assignment, which restricts
Start/End to that orbit's window and blocks overlapping slots. A
deployed planet renders directly on its ring, evenly spaced and
sorted by start time alongside whatever else is there, and is itself
a drag source (reposition within its orbit, or move to a different
one). The dock holds only unscheduled planets.

**Phase 4.5 — Helio Core + Planet Rework** — the center is no longer
an instrument card. **Helio**, a small warm sun (140–170px, CSS
gradients only), sits at the exact center; planets are the visual
hero now, roughly 2.25x their old size, each with a type-specific
multi-stop gradient, highlight, shadow blob, and soft atmosphere glow
— all CSS/SVG, no image assets. Ring labels are compact ("DSA · 08–10"
instead of a full time range). Clicking a deployed planet opens a
small floating action menu (Move / Edit / Complete / Delete) instead
of the full Planet Details sheet — Details is now dock-only, for
unscheduled planets. Completing a planet doesn't remove it: it
shrinks to 65%, dims, fires a brief particle burst toward Helio, and
raises Helio's **Solar Charge** (percent of this universe's deployed
planets that are complete), which brightens Helio's glow — never its
size.

Not yet implemented (intentionally, per Phase 4.5 scope): orbit
rotation-on-hover, planets animating mid-move, and true
drag-a-planet-off-every-ring-to-unschedule (dropping outside every
ring currently just springs the planet back to where it was).

## Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Structure

```
app/
  layout.tsx              root layout, font loading
  page.tsx                landing page (hero + wheel)
  globals.css              design tokens, base styles
  universe/[day]/page.tsx  Day Universe route, validates the day slug
  not-found.tsx            themed 404 for unknown day slugs

components/
  GalaxyBackground.tsx    ambient starfield, soft blue drifting motes, nebula drift
  WeekWheel.tsx           Phase 1 landing wheel: sectors, bezel, core, status line
  DaySector.tsx           one day's arc segment, label, and selection states (Phase 1 wheel)
  HeaderCopy.tsx          animated eyebrow / heading / instruction line
  MotionEffects.ts        shared Framer Motion variants & transitions

  mission-control/
    MissionControl.tsx    Helio — the small glowing sun at the center of the Day Universe (Phase 4.5; file path kept, component renamed HelioCore)

  orbits/
    OrbitRing.tsx          one holographic orbit guide, brightens as a live drop target
    OrbitLabels.tsx        HUD tag label for an orbit ring
    OrbitPlaceholder.tsx   "+" deployment preview marker on an empty orbit ring
    OrbitDropZone.tsx      one orbit as a dnd-kit droppable: ring + label + its deployed planets
    PlacedPlanet.tsx        a deployed planet rendered on its ring — textured sphere, compact label, drag source, completion state
    CompletionBurst.tsx     one-shot particle animation from a just-completed planet toward Helio (Phase 4.5)

  planet/
    Planet.tsx              shared textured-sphere orb (HTML/CSS gradients) used by the dock card and drag ghost
    PlanetCard.tsx           one unscheduled planet's tile inside the Planet Dock
    PlanetDock.tsx           bottom dock listing unscheduled planets + the Generate Planet trigger
    PlanetDialog.tsx         "Generate New Planet" glassmorphism creation dialog
    PlanetDetails.tsx        full readout for a dock (unscheduled) planet — change type, delete
    PlanetContextMenu.tsx    floating action menu for a deployed planet — Move / Edit / Complete / Delete (Phase 4.5)
    PlanetGhost.tsx          drag-overlay stand-in while a planet is being dragged
    TimeAssignmentDialog.tsx Start/End picker restricted to an orbit's window, with overlap checking

  layout/
    UniverseLayout.tsx      composes the Day Universe screen: DnD context, orbits, Helio, dock, dialogs, context menu

hooks/
  usePlanets.ts            owns a day's planets — generate, deploy, re-time, re-type, complete, delete — persisted to localStorage

types/
  planet.ts                Planet model, the five planet types (Ocean/Forest/Crystal/Lava/Moon), and their gradient palettes

lib/
  days.ts                  day data + universe designations
  arc.ts                   polar/SVG-arc math shared by both wheels
  orbits.ts                orbit data (id, label, time window) for the orbit stack
  scheduling.ts            orbit-window time math, conflict detection, angle distribution
```
