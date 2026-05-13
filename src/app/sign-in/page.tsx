import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const params = await searchParams;
  const callbackUrl = params.callbackUrl || "/account";
  const signInHref = `/api/auth/google?callbackUrl=${encodeURIComponent(
    callbackUrl,
  )}`;

  return (
    <main className="min-h-screen bg-white text-zinc-950">
      <div className="grid min-h-screen lg:grid-cols-2">
        <section className="relative min-h-[46rem] overflow-hidden bg-black text-white lg:min-h-screen">
          <Image
            src="/images/signin/Background.png"
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-violet-950/20 to-black/50" />

          <div className="relative z-10 flex min-h-[46rem] flex-col px-8 py-8 sm:px-14 lg:min-h-screen lg:px-20">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/images/icons/Logo from Google Drive.png"
                alt="SkySkills"
                width={58}
                height={58}
                className="h-12 w-12 object-contain"
                priority
              />
              <span className="text-2xl font-bold tracking-tight text-white">
                SkySkills
              </span>
            </Link>

            <div className="mt-52 max-w-xl pb-16">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[12px] font-bold text-amber-400 shadow-sm backdrop-blur">
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-amber-300/40 text-[10px]">
                  ✦
                </span>
                One platform. 15+ aptitude tests.
              </div>

              <h1 className="text-[48px] font-bold leading-[1.08] tracking-tight">
                Ready for
                <br />
                Takeoff?
              </h1>

              <ul className="mt-10 space-y-5 text-[16px] font-medium text-white/90">
                {[
                  "Unlimited practice exams",
                  "Real-time performance analytics",
                  "Compare your skills with all users.",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-4">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-400 text-sm font-bold text-zinc-950">
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <footer className="relative z-10 mt-auto flex flex-wrap gap-5 pb-6 text-sm font-medium text-white/60">
              <span>© 2026 SkySkills Inc.</span>
              <span>•</span>
              <Link href="/" className="transition hover:text-white">
                Privacy
              </Link>
              <span>•</span>
              <Link href="/" className="transition hover:text-white">
                Terms
              </Link>
            </footer>
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center bg-white px-6 py-16">
          <div className="w-full max-w-lg text-center">
            <h2 className="text-[30px] font-bold tracking-tight text-zinc-950">
              SkySkills Account
            </h2>
            <p className="mt-4 text-lg font-medium text-zinc-500">
              Start your journey to the cockpit today.
            </p>

            {params.error ? (
              <div className="mt-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {params.error}
              </div>
            ) : null}

            <a
              href={signInHref}
              className="mt-10 flex min-h-14 w-full items-center justify-center gap-4 rounded-xl border border-zinc-200 bg-white px-5 py-4 text-base font-bold text-zinc-800 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50"
            >
              <Image src="/images/icons/google.svg" alt="Google" width={20} height={20} className="h-5 w-5" />
              Continue with Gmail
            </a>

            <p className="mt-10 text-center text-base font-medium text-zinc-500">
                            Accounts use Google login only.

            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
