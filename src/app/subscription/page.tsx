import Link from "next/link";
import Image from "next/image";
import {
  getFleetMemberLimitForPackageKey,
  getSubscriptionPackages,
  hasAccountDatabase,
  type SubscriptionPackage,
} from "@/lib/account/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const freePlan = {
  title: "Economy",
  price: "฿0",
  period: "/mo",
  description: "Foundations for new student pilots.",
  details: ["Access to 3 Quests only"],
  icon: "/images/icons/Subscription/Seat.png",
};

const packageCardCopy = [
  {
    icon: "/images/icons/Subscription/takeoff.png",
    description: "Increase your altitude with more resources.",
  },
  {
    icon: "/images/icons/Subscription/landing.png",
    description: "Full throttle for professional certifications.",
  },
  {
    icon: "/images/icons/Subscription/Star.png",
    description: "Command the cockpit with complete preparation access.",
  },
  {
    icon: "/images/icons/Subscription/Star.png",
    description: "Captain access with personal file support from our team.",
  },
];

const paidFeatures = [
  "Full access to all Sky Quests",
  "Unlimited access to all tests",
  "Access to Mock Tests",
  "Skills Dashboard",
];

const dashboardFeatureNote =
  "compare, and analyze your scores to identify strengths and areas for improvement";

function formatAmount(value: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(value);
}

function periodLabel(durationMonths: number) {
  if (durationMonths >= 12) return "/yr";
  if (durationMonths === 6) return "/6mo";
  return "/mo";
}

function validityLabel(durationMonths: number) {
  if (durationMonths >= 12) return "Valid for 1 year";
  return `Valid for ${durationMonths} ${durationMonths === 1 ? "month" : "months"}`;
}

function fleetLabel(limit: number) {
  return `${limit} ${limit === 1 ? "profile" : "profiles"} fleet`;
}

function iconForIndex(index: number) {
  return packageCardCopy[index]?.icon ?? "/images/icons/Subscription/purple.png";
}

function descriptionForIndex(index: number, fallback: string) {
  return packageCardCopy[index]?.description ?? fallback;
}

function PaidPackageCard({
  pkg,
  index,
  isFeatured,
}: {
  pkg: SubscriptionPackage;
  index: number;
  isFeatured: boolean;
}) {
  const href = `/payment?package=${encodeURIComponent(pkg.key)}`;
  const details =
    pkg.key === "captain-pro-max"
      ? [...paidFeatures, "Personal file delivery"]
      : paidFeatures;
  const description = descriptionForIndex(index, pkg.description);
  const fleetLimit = getFleetMemberLimitForPackageKey(pkg.key);

  if (isFeatured) {
    return (
      <article className="relative flex min-h-[450px] flex-col overflow-hidden rounded-2xl border-2 border-[#FFD700] bg-[radial-gradient(184.71%_103.88%_at_50%_0%,rgba(255,215,0,0.15)_0%,rgba(255,215,0,0)_100%),linear-gradient(135deg,#413256_0%,#2D1B4E_50%,#181121_100%)] p-6 text-white shadow-[0_20px_50px_rgba(80,18,165,0.4)]">
        <span className="absolute right-0 top-0 rounded-bl-xl bg-[#FFD700] px-5 py-2 text-[10.5px] font-bold uppercase leading-4 tracking-[1.05px] text-[#5012A5] shadow-sm">
          Recommended
        </span>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFD700] p-2 shadow-[0_0_20px_rgba(255,215,0,0.3)]">
          <Image
            src={iconForIndex(index)}
            alt=""
            width={28}
            height={28}
            className="h-7 w-7 object-contain"
          />
        </div>
        <h2 className="mt-4 text-2xl font-bold leading-8">
          {pkg.title}
        </h2>
        <div className="mt-1 flex items-end gap-2">
          <span className="text-[40px] font-bold leading-10 tracking-tight">
            {formatAmount(pkg.priceThb)}
          </span>
          <span className="pb-1 text-[14.7px] font-bold leading-[21px] text-[#FFD700]/80">
            {periodLabel(pkg.durationMonths)}
          </span>
        </div>
        <span className="mt-2 inline-flex w-fit rounded-full bg-[#FFD700]/15 px-3 py-1 text-xs font-bold text-[#FFD700] ring-1 ring-[#FFD700]/35">
          {fleetLabel(fleetLimit)}
        </span>
        <p className="mt-1 min-h-9 text-[13px] leading-[18px] text-white/80">
          {description}
        </p>
        <Link
          href={href}
          className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-[#FFD700] px-5 text-sm font-bold leading-5 text-[#5012A5] shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] transition hover:bg-yellow-300"
        >
          Upgrade to {pkg.title}
        </Link>
        <div className="mt-4 border-t border-white/20 pt-4">
          <ul className="space-y-2 text-[13px] leading-[18px]">
            {details.map((detail) => (
              <li key={detail} className="flex gap-3">
                <Image
                  src="/images/icons/Subscription/yellow.png"
                  alt=""
                  width={20}
                  height={20}
                  className="mt-0.5 h-5 w-5 shrink-0 object-contain"
                />
                <span>
                  <span className="font-semibold">{detail}</span>
                  {detail === "Skills Dashboard" ? (
                    <span className="mt-1 block text-[11px] font-light leading-[15px] text-white/90">
                      {dashboardFeatureNote}
                    </span>
                  ) : null}
                </span>
              </li>
            ))}
            <li className="flex gap-3 text-[#FACC15]">
              <Image
                src="/images/icons/Subscription/yellow.png"
                alt=""
                width={20}
                height={20}
                className="mt-0.5 h-5 w-5 shrink-0 object-contain"
              />
              <span className="font-bold">{validityLabel(pkg.durationMonths)}</span>
            </li>
          </ul>
        </div>
      </article>
    );
  }

  return (
    <article className="flex min-h-[450px] flex-col rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.1)]">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F6F3FA] p-2 shadow-sm">
        <Image
          src={iconForIndex(index)}
          alt=""
          width={28}
          height={28}
          className="h-7 w-7 object-contain"
        />
      </div>
      <h2 className="mt-3 text-xl font-bold leading-7 text-[#111827]">
        {pkg.title}
      </h2>
      <div className="mt-1 flex items-end gap-2">
        <span className="text-[32px] font-bold leading-9 tracking-tight text-[#111827]">
          {formatAmount(pkg.priceThb)}
        </span>
        <span className="pb-1 text-sm font-medium leading-5 text-[#6B7280]">
          {periodLabel(pkg.durationMonths)}
        </span>
      </div>
      <span className="mt-2 inline-flex w-fit rounded-full bg-[#F6F3FA] px-3 py-1 text-xs font-bold text-[#5012A5] ring-1 ring-[#5012A5]/15">
        {fleetLabel(fleetLimit)}
      </span>
      <p className="mt-1 min-h-9 text-[13px] leading-[18px] text-[#6B7280]">
        {description}
      </p>
      <Link
        href={href}
        className="mt-3 inline-flex h-10 items-center justify-center rounded-xl border-2 border-[#5012A5] px-4 text-sm font-bold leading-5 text-[#5012A5] transition hover:bg-violet-50"
      >
        Upgrade to {pkg.title}
      </Link>
      <div className="mt-3 border-t border-[#F3F4F6] pt-3">
        <ul className="space-y-2 text-[13px] leading-[18px] text-[#4B5563]">
          {details.map((detail) => (
            <li key={detail} className="flex gap-3">
              <Image
                src="/images/icons/Subscription/purple.png"
                alt=""
                width={20}
                height={20}
                className="mt-0.5 h-5 w-5 shrink-0 object-contain"
              />
              <span>
                {detail}
                {detail === "Skills Dashboard" ? (
                  <span className="mt-1 block text-[11px] leading-[15px] text-[#4B5563]">
                    {dashboardFeatureNote}
                  </span>
                ) : null}
              </span>
            </li>
          ))}
          <li className="flex gap-3 font-bold text-[#4F12A6]">
            <Image
              src="/images/icons/Subscription/purple.png"
              alt=""
              width={20}
              height={20}
              className="mt-0.5 h-5 w-5 shrink-0 object-contain"
            />
            <span>{validityLabel(pkg.durationMonths)}</span>
          </li>
        </ul>
      </div>
    </article>
  );
}

export default async function SubscriptionPage() {
  if (!hasAccountDatabase()) {
    return (
      <main className="min-h-screen bg-[#f4f6f8] px-5 py-12 text-zinc-950 dark:bg-black dark:text-zinc-100">
        <section className="mx-auto max-w-3xl rounded-2xl border border-red-300 bg-red-50 p-6 text-red-800 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-200">
          Account database is not configured.
        </section>
      </main>
    );
  }

  const packages = await getSubscriptionPackages();
  const featuredIndex = Math.max(0, packages.length - 1);

  return (
    <main className="min-h-screen bg-[#F7F6F8] text-zinc-950">
      <section className="relative h-[260px] overflow-hidden bg-[#5012A5] text-white">
        <Image
          src="/images/backgrounds/home-dark.png"
          alt="Cockpit background"
          fill
          priority
          quality={90}
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[#5012A5]/80 mix-blend-multiply" />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-x-0 bottom-0 h-12 bg-[#F7F6F8]" />
        <div className="relative z-10 mx-auto flex h-[212px] max-w-[1400px] flex-col items-center px-6 pt-6 text-center">
          <span className="rounded-full border border-white/20 bg-white/10 px-8 py-[7px] text-xs font-bold uppercase leading-4 tracking-[0.6px] shadow-inner backdrop-blur-sm">
            Subscription
          </span>
          <h1 className="mt-4 max-w-[760px] text-3xl font-bold leading-[1.04] tracking-tight md:text-[44px] md:leading-[46px]">
            Master the Skills That Matter with{" "}
            <span className="text-yellow-400">SkySkills</span>
          </h1>
          <p className="mt-3 max-w-[660px] text-sm leading-5 text-white/90 md:text-base">
            designed to support every step of your aviation aptitude preparation.
          </p>
        </div>
      </section>

      <section className="relative z-10 -mt-9 bg-[#F7F6F8] px-5 pb-20">
        <div className="mx-auto grid max-w-[1600px] gap-6 lg:grid-cols-3 xl:grid-cols-5">
          <article className="flex min-h-[450px] flex-col rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.1)]">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F3F4F6] p-2 shadow-sm">
              <Image
                src={freePlan.icon}
                alt=""
                width={28}
                height={28}
                className="h-7 w-7 object-contain"
              />
            </div>
            <h2 className="mt-3 text-xl font-bold leading-7 text-[#111827]">
              {freePlan.title}
            </h2>
            <div className="mt-1 flex items-end gap-2">
              <span className="text-[32px] font-bold leading-9 tracking-tight text-[#111827]">
                {freePlan.price}
              </span>
              <span className="pb-1 text-sm font-medium leading-5 text-[#6B7280]">
                {freePlan.period}
              </span>
            </div>
            <span className="mt-2 inline-flex w-fit rounded-full bg-[#F3F4F6] px-3 py-1 text-xs font-bold text-[#6B7280] ring-1 ring-[#9CA3AF]/20">
              {fleetLabel(1)}
            </span>
            <p className="mt-1 min-h-9 text-[13px] leading-[18px] text-[#6B7280]">
              {freePlan.description}
            </p>
            <span className="mt-3 inline-flex h-10 items-center justify-center rounded-xl bg-[#EEEEEF] px-4 text-sm font-bold leading-5 text-[#6B7280]">
              Current Plan
            </span>
            <div className="mt-3 border-t border-[#F3F4F6] pt-3">
              <ul className="space-y-2 text-[13px] leading-[18px] text-[#4B5563]">
                {freePlan.details.map((detail) => (
                  <li key={detail} className="flex gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#9CA3AF] text-[10px] text-[#9CA3AF]">
                      ✓
                    </span>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          </article>

          {packages.map((pkg, index) => (
            <PaidPackageCard
              key={pkg.key}
              pkg={pkg}
              index={index}
              isFeatured={index === featuredIndex}
            />
          ))}
        </div>

      </section>
    </main>
  );
}
