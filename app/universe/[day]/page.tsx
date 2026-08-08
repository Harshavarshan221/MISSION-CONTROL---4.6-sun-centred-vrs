import { notFound } from "next/navigation";
import { DAYS, getDayBySlug } from "@/lib/days";
import GalaxyBackground from "@/components/GalaxyBackground";
import UniverseLayout from "@/components/layout/UniverseLayout";

export function generateStaticParams() {
  return DAYS.map((day) => ({ day: day.slug }));
}

export default function UniversePage({
  params,
}: {
  params: { day: string };
}) {
  const day = getDayBySlug(params.day);

  if (!day) {
    notFound();
  }

  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden px-6 py-16 sm:py-20">
      <GalaxyBackground />
      <UniverseLayout day={day!} />
    </main>
  );
}
