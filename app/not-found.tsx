import Link from "next/link";
import GalaxyBackground from "@/components/GalaxyBackground";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden px-6 py-16 text-center">
      <GalaxyBackground />
      <p className="font-mono text-[11px] uppercase tracking-widest2 text-amber-hud/80">
        Signal lost
      </p>
      <h1 className="mt-4 font-display text-3xl uppercase tracking-wide text-ink-primary">
        Unknown universe
      </h1>
      <p className="mt-3 max-w-sm font-body text-sm text-ink-secondary">
        That day doesn&rsquo;t exist on the wheel.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-full border border-line px-5 py-2.5 font-mono text-xs uppercase tracking-widest2 text-ink-secondary transition-colors hover:border-cyan-glow/60 hover:text-cyan-glow"
      >
        Return to the wheel
      </Link>
    </main>
  );
}
