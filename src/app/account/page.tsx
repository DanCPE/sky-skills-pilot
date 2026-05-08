import Link from "next/link";
import { redirect } from "next/navigation";
import DeleteAccountSection from "@/components/account/DeleteAccountSection";
import ProfileEditor from "@/components/account/ProfileEditor";
import { getCurrentAccountUser } from "@/lib/account/auth";
import { getAccountOverview, hasAccountDatabase } from "@/lib/account/db";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  if (!hasAccountDatabase()) {
    return (
      <main className="min-h-screen bg-zinc-100 px-6 py-16 text-zinc-950 dark:bg-black dark:text-zinc-100">
        <div className="mx-auto max-w-3xl rounded-2xl border border-zinc-200 bg-white p-8 dark:border-white/10 dark:bg-zinc-950">
          <h1 className="text-3xl font-bold font-[family-name:var(--font-space-grotesk)]">
            Account setup needed
          </h1>
          <p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            Account login needs a PostgreSQL database. Set DATABASE_URL and the
            Google OAuth variables, then restart the app.
          </p>
        </div>
      </main>
    );
  }

  const user = await getCurrentAccountUser();
  if (!user) redirect("/sign-in");

  const overview = await getAccountOverview(user.id);

  return (
    <main className="min-h-screen bg-[#f4f6f8] px-5 py-10 text-zinc-950 dark:bg-black dark:text-zinc-100">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-950 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-violet-700 text-xl font-black text-white">
              {overview.user.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={overview.user.imageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                overview.user.name.slice(0, 1).toUpperCase()
              )}
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-700 dark:text-violet-300">
                Account settings
              </p>
              <h1 className="text-3xl font-black font-[family-name:var(--font-space-grotesk)]">
                {overview.user.name}
              </h1>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {overview.user.email}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="rounded-xl bg-violet-700 px-4 py-2 text-sm font-black text-white transition hover:bg-violet-600"
            >
              View dashboard
            </Link>
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-black text-zinc-700 transition hover:bg-zinc-100 dark:border-white/15 dark:text-zinc-200 dark:hover:bg-white/10"
              >
                Sign out
              </button>
            </form>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <ProfileEditor
            initialName={overview.user.name}
            initialImageUrl={overview.user.imageUrl}
          />

          <aside className="space-y-6">
            <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-950">
              <h2 className="text-xl font-black">Subscription</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                Payment records are prepared for future checkout integration.
              </p>
              <div className="mt-5 rounded-xl bg-zinc-50 p-4 text-sm dark:bg-white/5">
                <div className="flex justify-between gap-4">
                  <span className="font-bold">Status</span>
                  <span className="text-zinc-500 dark:text-zinc-400">
                    {overview.subscription?.status ?? "not_started"}
                  </span>
                </div>
                <div className="mt-2 flex justify-between gap-4">
                  <span className="font-bold">Provider</span>
                  <span className="text-zinc-500 dark:text-zinc-400">
                    {overview.subscription?.provider ?? "pending"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                disabled
                className="mt-5 w-full rounded-xl bg-zinc-200 px-4 py-2.5 text-sm font-black text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
              >
                Checkout coming soon
              </button>
            </section>
          </aside>
        </div>

        <DeleteAccountSection />
      </div>
    </main>
  );
}
