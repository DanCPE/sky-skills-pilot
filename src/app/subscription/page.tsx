import Link from "next/link";
import ManualSlipPaymentForm from "@/components/account/ManualSlipPaymentForm";
import { getCurrentAccountUser } from "@/lib/account/auth";
import {
  getManualPaymentConfig,
  getManualPaymentSlipsForFleet,
  getSubscriptionPackages,
  hasAccountDatabase,
} from "@/lib/account/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function SubscriptionPage() {
  const user = await getCurrentAccountUser();

  if (!hasAccountDatabase()) {
    return (
      <main className="min-h-screen bg-[#f4f6f8] px-5 py-12 text-zinc-950 dark:bg-black dark:text-zinc-100">
        <section className="mx-auto max-w-3xl rounded-2xl border border-red-300 bg-red-50 p-6 text-red-800 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-200">
          Account database is not configured.
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[#f4f6f8] px-5 py-12 text-zinc-950 dark:bg-black dark:text-zinc-100">
        <section className="mx-auto max-w-3xl rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-zinc-950">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-violet-700 dark:text-violet-300">
            Full Access
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Sign in to submit your payment slip
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-zinc-500 dark:text-zinc-400">
            Payment approval is attached to your registered fleet email, so you
            need to sign in before uploading a Krungthai transfer slip.
          </p>
          <Link
            href="/sign-in?callbackUrl=/subscription"
            className="mt-6 inline-flex rounded-xl bg-violet-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-600"
          >
            Sign In
          </Link>
        </section>
      </main>
    );
  }

  const [config, slips, packages] = await Promise.all([
    Promise.resolve(getManualPaymentConfig()),
    getManualPaymentSlipsForFleet(user.fleetId),
    getSubscriptionPackages(),
  ]);

  return (
    <main className="min-h-screen bg-[#f4f6f8] px-5 py-10 text-zinc-950 dark:bg-black dark:text-zinc-100">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-violet-700 dark:text-violet-300">
            Full Access
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            Subscription Payment
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500 dark:text-zinc-400">
            Transfer to the SkySkills Krungthai business account and upload your
            slip. Your fleet email is <span className="font-bold">{user.email}</span>.
          </p>
        </header>

        <ManualSlipPaymentForm
          config={config}
          initialSlips={slips}
          packages={packages}
        />
      </div>
    </main>
  );
}
