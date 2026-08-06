/**
 * Polar/arc math for the week wheel.
 *
 * Angle convention: 0deg points to 12 o'clock, increasing clockwise.
 * This matches how people read a dial, and how the day sectors are laid
 * out starting at Monday (top) moving clockwise through Sunday.
 */

export interface Point {
  x: number;
  y: number;
}

export function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angleDeg: number
): Point {
  const theta = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(theta),
    y: cy + r * Math.sin(theta),
  };
}

/**
 * Builds a flat-edged annulus (donut) segment path — the crisp,
 * instrument-grade look of a dial readout rather than a soft pie slice.
 */
export function describeDonutSegment(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startAngle: number,
  endAngle: number
): string {
  const outerStart = polarToCartesian(cx, cy, outerR, startAngle);
  const outerEnd = polarToCartesian(cx, cy, outerR, endAngle);
  const innerEnd = polarToCartesian(cx, cy, innerR, endAngle);
  const innerStart = polarToCartesian(cx, cy, innerR, startAngle);

  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    "Z",
  ].join(" ");
}

/** A single tick mark on the outer bezel, from radius r1 to r2 at angleDeg. */
export function describeTick(
  cx: number,
  cy: number,
  r1: number,
  r2: number,
  angleDeg: number
): string {
  const p1 = polarToCartesian(cx, cy, r1, angleDeg);
  const p2 = polarToCartesian(cx, cy, r2, angleDeg);
  return `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`;
}

/**
 * Rotation to apply to a text label so it sits tangent to the ring at
 * midAngle, and always reads left-to-right (flipped 180deg on the
 * bottom half so nothing renders upside down).
 */
export function tangentialRotation(midAngle: number): number {
  const normalized = ((midAngle % 360) + 360) % 360;
  return normalized > 90 && normalized < 270 ? midAngle + 180 : midAngle;
}
