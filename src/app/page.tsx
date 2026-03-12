import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0f18] text-white" style={{ "--font-scale": 1 } as React.CSSProperties}>
      {/* Hero Section */}
      <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden">
        {/* Background Image Layer */}
        <div className="absolute inset-0 z-0 bg-[#0a0f18]">
          <Image
            src="/images/backgrounds/home.png"
            alt="Cockpit background"
            fill
            priority
            quality={90}
            className="object-cover opacity-80"
            sizes="100vw"
          />
          {/* Overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-[#0a0f18]" />
        </div>

        {/* Content Layer */}
        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center mt-[-10vh]">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight font-[family-name:var(--font-space-grotesk)] text-white mb-2 shadow-sm drop-shadow-md">
            Clear for Takeoff
          </h1>
          <h2 className="text-5xl md:text-7xl font-bold tracking-tight font-[family-name:var(--font-space-grotesk)] text-white drop-shadow-md">
            Ace Your <span className="text-amber-400">SkySkills</span>
          </h2>

          <p className="mx-auto mt-8 max-w-2xl text-lg md:text-xl text-slate-300 font-medium leading-relaxed ">
            Develop the logical, spatial, scanning and short-term memory skills
            essential for your exams. The most comprehensive, distraction-free
            preparation platform designed for your success.
          </p>

          <div className="mt-10 flex flex-col items-center">
            <Link
              href="/sky-quest"
              className="inline-flex items-center justify-center rounded-lg bg-violet-700 px-8 py-3.5 text-base font-semibold text-white transition-colors hover:bg-violet-600 shadow-lg"
            >
              Start Free Trial
            </Link>
            <p className="mt-3 text-sm text-zinc-400 font-medium">
              No credit card required for trial
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
