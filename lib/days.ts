export interface DayInfo {
  /** URL slug, used for /universe/[day] routing */
  slug: string;
  /** Human-readable label shown on the ring */
  label: string;
  /** Mission-control callsign, in Greek-letter sequence order */
  designation: string;
}

export const DAYS: DayInfo[] = [
  { slug: "monday", label: "Monday", designation: "ALPHA" },
  { slug: "tuesday", label: "Tuesday", designation: "BETA" },
  { slug: "wednesday", label: "Wednesday", designation: "GAMMA" },
  { slug: "thursday", label: "Thursday", designation: "DELTA" },
  { slug: "friday", label: "Friday", designation: "EPSILON" },
  { slug: "saturday", label: "Saturday", designation: "ZETA" },
  { slug: "sunday", label: "Sunday", designation: "OMEGA" },
];

export const SECTOR_ANGLE = 360 / DAYS.length;

export function getDayBySlug(slug: string): DayInfo | undefined {
  return DAYS.find((d) => d.slug === slug);
}
