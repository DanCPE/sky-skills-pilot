import Link from "next/link";
import Image from "next/image";
import { getHomeAudienceStats } from "@/lib/home-stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function formatCount(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

async function getHomeStats() {
  return getHomeAudienceStats();
}

export default async function Home() {
  const stats = await getHomeStats();

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="fixed inset-0 z-0 bg-black">
        <Image
          src="/images/backgrounds/home-dark.png"
          alt="Cockpit background"
          fill
          priority
          quality={90}
          className="object-cover opacity-75"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-violet-950/45 via-black/45 to-black" />
      </div>

      <section className="relative z-10 flex min-h-[calc(100vh-4rem)] items-center justify-center px-6 py-24 text-center">
        <div className="mx-auto max-w-4xl">
          <p className="mb-5 text-sm font-bold uppercase tracking-[0.24em] text-amber-300">
            SkySkills
          </p>
          <h1 className="text-5xl font-bold tracking-tight text-white drop-shadow-md md:text-7xl">
            Pilot Aptitude Practice Platform
          </h1>

          <p className="mx-auto mt-8 max-w-2xl text-lg font-medium leading-8 text-zinc-300 md:text-xl">
            SkySkills helps students and pilot candidates practice cognitive
            skill areas such as logical reasoning, spatial orientation, visual
            scanning, mental math, multitasking, and short-term memory.
          </p>
          <div className="mx-auto mt-8 grid max-w-2xl gap-3 sm:grid-cols-2">
            <div className="border border-white/10 bg-white/10 px-5 py-4 text-left shadow-xl backdrop-blur">
              <p className="text-3xl font-bold text-white">
                {formatCount(stats.registeredUsers)}
              </p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-amber-300">
                Registered users
              </p>
            </div>
            <div className="border border-white/10 bg-white/10 px-5 py-4 text-left shadow-xl backdrop-blur">
              <p className="text-3xl font-bold text-white">
                {formatCount(stats.estimatedUnregisteredUsers)}
              </p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-amber-300">
                Unregistered users
              </p>
            </div>
          </div>
          <p className="mt-8 text-xs font-medium text-amber-300 md:text-sm opacity-60">
            Don&apos;t want to be left behind ?
          </p>
          <Link
            href="/sky-quest"
            className="mt-1 inline-flex min-h-12 items-center justify-center rounded-xl bg-amber-400 px-7 text-sm font-bold text-zinc-950 shadow-lg shadow-amber-400/20 transition hover:bg-amber-300"
          >
            Open SkySkills
          </Link>
        </div>
      </section>

      <section className="relative z-10 border-t border-white/10 bg-black/70 px-6 py-16 backdrop-blur">
        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
          <div>
            <h2 className="text-xl font-bold">What the app does</h2>
            <p className="mt-4 text-sm leading-7 text-zinc-300">
              Users can complete practice quizzes, review performance, track
              score history, and prepare across multiple aptitude-test
              categories.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-bold">Why Google sign-in is used</h2>
            <p className="mt-4 text-sm leading-7 text-zinc-300">
              Google sign-in is used to create a secure SkySkills account and
              connect practice progress to the user&apos;s email address.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-bold">Data requested</h2>
            <p className="mt-4 text-sm leading-7 text-zinc-300">
              SkySkills requests basic Google profile data: name, email address,
              profile image, and Google account identifier. This data is used
              only for account access and platform features.
            </p>
          </div>
        </div>

        <div className="mx-auto mt-12 flex max-w-5xl flex-wrap items-center gap-5 border-t border-white/10 pt-8 text-sm font-semibold text-zinc-300">
          <span>© 2026 SkySkills</span>
          <Link href="/privacy" className="text-amber-300 hover:text-amber-200">
            Privacy Policy
          </Link>
          <Link href="/terms" className="text-amber-300 hover:text-amber-200">
            Terms of Service
          </Link>
          <a
            href="mailto:skyskills.contact@gmail.com"
            className="text-amber-300 hover:text-amber-200"
          >
            Contact
          </a>
        </div>
      </section>
    </main>
  );
}
