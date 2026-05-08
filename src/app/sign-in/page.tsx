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
    <main className="min-h-screen bg-[#fafafa] px-6 py-16 text-zinc-900 dark:bg-black dark:text-zinc-100">
      <div className="mx-auto max-w-md rounded-lg border border-zinc-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-white/5">
        <p className="text-sm font-bold uppercase tracking-widest text-violet-700 dark:text-amber-300">
          SkySkills account
        </p>
        <h1 className="mt-3 text-3xl font-bold font-[family-name:var(--font-space-grotesk)]">
          Sign in with Google
        </h1>
        <p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
          Accounts use Google login only. Your score history, future rankings,
          and subscription status will stay attached to this Google account.
        </p>

        {params.error ? (
          <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
            {params.error}
          </div>
        ) : null}

        <a
          href={signInHref}
          className="mt-6 flex w-full items-center justify-center gap-3 rounded-lg bg-violet-700 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-violet-600"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-black text-violet-700">
            G
          </span>
          Continue with Google
        </a>
      </div>
    </main>
  );
}
