import Image from "next/image";
import TemporaryCloseCountdown from "@/components/TemporaryCloseCountdown";

export default function TemporarilyClosedPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950 px-6 text-white">
      <Image
        src="/images/backgrounds/home-dark.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover opacity-70"
      />
      <div className="absolute inset-0 bg-black/60" />
      <div className="absolute inset-0 bg-gradient-to-b from-violet-950/45 via-black/25 to-black/80" />

      <div className="relative z-10 max-w-xl text-center">
        <p className="text-sm font-bold uppercase tracking-[0.24em] text-amber-300">
          SkySkills is temporarily closed
        </p>
        <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-6xl">
          We will be back shortly.
        </h1>
        <TemporaryCloseCountdown />
      </div>
    </main>
  );
}
