import GalaxyBackground from "@/components/GalaxyBackground";
import WeekWheel from "@/components/WeekWheel";
import HeaderCopy from "@/components/HeaderCopy";
import MissionControlBreadcrumb from "@/components/nav/MissionControlBreadcrumb";

export default function Home() {
  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden px-6 py-16">
      <GalaxyBackground />
      <MissionControlBreadcrumb />
      <HeaderCopy />
      <div className="mt-10 flex w-full flex-1 items-center justify-center sm:mt-14">
        <WeekWheel />
      </div>
    </main>
  );
}
