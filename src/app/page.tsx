import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* Hero Section with Background Image */}
      <div className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
        {/* Background Image Layer */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/backgrounds/hero-banner.webp"
            alt=""
            fill
            priority
            quality={85}
            className="object-cover"
            sizes="100vw"
          />
          {/* Overlay for text readability */}
          <div className="absolute inset-0 bg-white/80 dark:bg-black/70" />
        </div>

        {/* Content Layer */}
        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <h1 className="text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Clear for Takeoff
          </h1>
          <h2 className="mt-4 text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Ace Your SkySkills
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-lg text-zinc-600 dark:text-zinc-400">
            Develop the logical, spatial, scanning and short-term memory skills
            essential for your exams. The most comprehensive,
            distraction-free preparation platform designed for your
            success.
          </p>

          <div className="mt-10">
            <Link
              href="/sky-quest"
              className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-8 py-3 text-base font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Start Practicing →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
