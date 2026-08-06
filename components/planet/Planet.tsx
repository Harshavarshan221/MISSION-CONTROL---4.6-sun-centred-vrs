import type { PlanetType } from "@/types/planet";
import { getPlanetTypeMeta } from "@/types/planet";

interface PlanetProps {
  type: PlanetType;
  /** Diameter in pixels. */
  size?: number;
  glow?: "none" | "soft" | "strong";
  className?: string;
}

/**
 * The orb itself — a textured radial-gradient sphere (highlight fleck,
 * shadowed far edge, lit mid-tone) with a soft outer glow, no emoji,
 * purely CSS gradients and light. This is the one visual primitive
 * every HTML planet rendering (dock card, drag overlay) is built from,
 * so the "planet" look stays identical everywhere it appears. The
 * SVG-rendered orbit planets (PlacedPlanet) use the same gradient
 * stops via matching SVG defs, so a planet reads the same whether
 * it's sitting in the dock or deployed on a ring.
 */
export default function Planet({ type, size = 36, glow = "soft", className = "" }: PlanetProps) {
  const meta = getPlanetTypeMeta(type);
  const { highlight, mid, base, edge } = meta.gradientStops;

  const glowSize = glow === "strong" ? size * 0.75 : glow === "soft" ? size * 0.42 : 0;

  return (
    <span
      aria-hidden="true"
      className={`relative inline-block shrink-0 rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        boxShadow: glow === "none" ? undefined : `0 0 ${glowSize}px ${meta.color}66`,
      }}
    >
      {/* base sphere: lit mid-tone fading to the shadowed edge */}
      <span
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle at 40% 38%, ${mid} 0%, ${base} 48%, ${edge} 92%)`,
        }}
      />
      {/* shadow blob — terminator-side shading, gives the sphere volume */}
      <span
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle at 68% 70%, ${edge} 0%, transparent 45%)`,
          opacity: 0.65,
        }}
      />
      {/* highlight fleck — light source, upper-left */}
      <span
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle at 30% 26%, ${highlight} 0%, transparent 15%)`,
          opacity: 0.9,
        }}
      />
      {/* rim shading for a spherical (not flat) read */}
      <span
        className="absolute inset-0 rounded-full"
        style={{
          boxShadow: "inset -3px -4px 8px rgba(0,0,0,0.35), inset 2px 3px 5px rgba(255,255,255,0.15)",
        }}
      />
    </span>
  );
}
