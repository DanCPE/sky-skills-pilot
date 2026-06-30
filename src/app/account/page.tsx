import Link from "next/link";
import { redirect } from "next/navigation";
import DeleteAccountSection from "@/components/account/DeleteAccountSection";
import ProfileEditor from "@/components/account/ProfileEditor";
import ProfileManager from "@/components/account/ProfileManager";
import { getCurrentAccountUser } from "@/lib/account/auth";
import {
  getAccountSettingsOverview,
  hasAccountDatabase,
} from "@/lib/account/db";

export const dynamic = "force-dynamic";

function monotonicMs() {
  return Number(process.hrtime.bigint() / BigInt(1000000));
}

function isPaidStatus(
  status: string | null | undefined,
  currentPeriodEnd: string | null | undefined,
) {
  if (status !== "active" && status !== "trialing") return false;
  if (!currentPeriodEnd) return true;
  return new Date(currentPeriodEnd).getTime() > Date.now();
}

function formatAmount(value: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

export default async function AccountPage() {
  const pageStartedAt = monotonicMs();
  if (!hasAccountDatabase()) {
    return (
      <main className="min-h-screen bg-zinc-100 px-6 py-16 text-zinc-950 dark:bg-black dark:text-zinc-100">
        <div className="mx-auto max-w-3xl rounded-2xl border border-zinc-200 bg-white p-8 dark:border-white/10 dark:bg-zinc-950">
          <h1 className="text-3xl font-bold">
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

  const sessionStartedAt = monotonicMs();
  const user = await getCurrentAccountUser();
  console.log("[account-page] session resolved", {
    hasUser: Boolean(user),
    durationMs: monotonicMs() - sessionStartedAt,
  });
  if (!user) redirect("/sign-in");

  const settingsStartedAt = monotonicMs();
  const overview = await getAccountSettingsOverview(user);
  console.log("[account-page] settings resolved", {
    profileId: user.profileId,
    durationMs: monotonicMs() - settingsStartedAt,
    totalMs: monotonicMs() - pageStartedAt,
  });
  const isPaid = isPaidStatus(
    overview.subscription?.status,
    overview.subscription?.currentPeriodEnd,
  );
  const latestSlip = overview.latestPaymentSlip;

  return (
    <main className="min-h-screen bg-[#f4f6f8] px-5 py-10 text-zinc-950 dark:bg-black dark:text-zinc-100">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-950 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-violet-700 text-xl font-bold text-white">
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
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-violet-700 dark:text-violet-300">
                Account settings
              </p>
              <h1 className="text-3xl font-bold">
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
              className="rounded-xl bg-violet-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-violet-600"
            >
              View dashboard
            </Link>
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-bold text-zinc-700 transition hover:bg-zinc-100 dark:border-white/15 dark:text-zinc-200 dark:hover:bg-white/10"
              >
                Sign out
              </button>
            </form>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <ProfileEditor
              initialName={overview.user.name}
              initialImageUrl={overview.user.imageUrl}
            />
            <ProfileManager
              profiles={overview.profiles}
              activeProfileId={overview.user.profileId}
              maxProfiles={overview.maxProfiles}
            />
          </div>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-950">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold">Subscription</h2>
                  <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                    Manage package payment and manual slip approval.
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                    isPaid
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200"
                      : "bg-zinc-100 text-zinc-600 dark:bg-white/10 dark:text-zinc-300"
                  }`}
                >
                  {isPaid ? "Paid" : "Free"}
                </span>
              </div>
              {latestSlip ? (
                <div className="mt-5 space-y-3 rounded-xl bg-zinc-50 p-4 text-sm dark:bg-white/5">
                  <div className="flex justify-between gap-4">
                    <span className="font-bold">Package</span>
                    <span className="text-right text-zinc-500 dark:text-zinc-400">
                      {latestSlip.planTitle ?? latestSlip.planKey}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="font-bold">Amount</span>
                    <span className="text-zinc-500 dark:text-zinc-400">
                      {formatAmount(latestSlip.amountThb)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="font-bold">Slip status</span>
                    <span className="text-zinc-500 dark:text-zinc-400">
                      {latestSlip.status}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="font-bold">Submitted</span>
                    <span className="text-right text-zinc-500 dark:text-zinc-400">
                      {formatDate(latestSlip.createdAt)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mt-5 rounded-xl bg-zinc-50 p-4 text-sm dark:bg-white/5">
                  <p className="font-bold">No payment slip submitted</p>
                  <p className="mt-1 text-zinc-500 dark:text-zinc-400">
                    Choose a package and upload a Krungthai transfer slip to
                    request paid access.
                  </p>
                </div>
              )}
              <div className="mt-5 rounded-xl bg-zinc-50 p-4 text-sm dark:bg-white/5">
                <div className="flex justify-between gap-4">
                  <span className="font-bold">Access status</span>
                  <span className="text-zinc-500 dark:text-zinc-400">
                    {overview.subscription?.status ?? "not_started"}
                  </span>
                </div>
                <div className="mt-2 flex justify-between gap-4">
                  <span className="font-bold">Provider</span>
                  <span className="text-zinc-500 dark:text-zinc-400">
                    {overview.subscription?.provider ?? "manual slip"}
                  </span>
                </div>
                <div className="mt-2 flex justify-between gap-4">
                  <span className="font-bold">Expires</span>
                  <span className="text-right text-zinc-500 dark:text-zinc-400">
                    {formatDate(overview.subscription?.currentPeriodEnd ?? null)}
                  </span>
                </div>
              </div>
              <Link
                href="/subscription"
                className="mt-5 flex w-full justify-center rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-violet-600"
              >
                {isPaid ? "View subscription packages" : "Choose subscription"}
              </Link>
            </section>
          </aside>
        </div>

        <DeleteAccountSection />
      </div>
    </main>
  );
}
