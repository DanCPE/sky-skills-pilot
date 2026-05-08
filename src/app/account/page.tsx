import Link from "next/link";
import { redirect } from "next/navigation";
import DeleteAccountSection from "@/components/account/DeleteAccountSection";
import ProfileEditor from "@/components/account/ProfileEditor";
import { getCurrentAccountUser } from "@/lib/account/auth";
import {
  getAccountOverview,
  hasAccountDatabase,
  type RadarPoint,
  type ScoreHistoryEntry,
} from "@/lib/account/db";

export const dynamic = "force-dynamic";

const domainShortLabels: Record<string, string> = {
  "logical-reasoning": "Logical",
  "spatial-orientation": "Spatial",
  "visual-scanning": "Scanning",
  "numerical-agility": "Approximation",
  "short-term-memory": "Memory",
  "aviation-recall": "Recall",
};

const domainAccent: Record<string, string> = {
  "logical-reasoning": "text-rose-500 bg-rose-50 border-rose-100 dark:bg-rose-500/10 dark:border-rose-500/20",
  "spatial-orientation": "text-emerald-500 bg-emerald-50 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20",
  "visual-scanning": "text-sky-500 bg-sky-50 border-sky-100 dark:bg-sky-500/10 dark:border-sky-500/20",
  "numerical-agility": "text-amber-500 bg-amber-50 border-amber-100 dark:bg-amber-500/10 dark:border-amber-500/20",
  "short-term-memory": "text-fuchsia-500 bg-fuchsia-50 border-fuchsia-100 dark:bg-fuchsia-500/10 dark:border-fuchsia-500/20",
  "aviation-recall": "text-violet-500 bg-violet-50 border-violet-100 dark:bg-violet-500/10 dark:border-violet-500/20",
};

function averageRadar(points: RadarPoint[]) {
  const active = points.filter((point) => point.attempts > 0);
  if (active.length === 0) return 0;
  return Math.round(
    active.reduce((total, point) => total + point.value, 0) / active.length,
  );
}

function estimatedRank(average: number, attempts: number) {
  if (attempts === 0) return "Unranked";
  return `${Math.max(1, Math.round(500 - average * 4.65))}th`;
}

function HexRadar({ points }: { points: RadarPoint[] }) {
  const center = 160;
  const maxRadius = 102;
  const angleStep = (Math.PI * 2) / points.length;
  const chartPoints = points.map((point, index) => {
    const angle = -Math.PI / 2 + index * angleStep;
    const radius = (point.value / 100) * maxRadius;
    return {
      ...point,
      shortLabel: domainShortLabels[point.slug] ?? point.label,
      x: center + Math.cos(angle) * radius,
      y: center + Math.sin(angle) * radius,
      axisX: center + Math.cos(angle) * maxRadius,
      axisY: center + Math.sin(angle) * maxRadius,
      labelX: center + Math.cos(angle) * (maxRadius + 30),
      labelY: center + Math.sin(angle) * (maxRadius + 22),
    };
  });
  const polygon = chartPoints.map((point) => `${point.x},${point.y}`).join(" ");
  const outer = chartPoints
    .map((point) => `${point.axisX},${point.axisY}`)
    .join(" ");

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950">
      <div className="mb-3 flex items-center justify-between border-b border-zinc-200 pb-4 dark:border-white/10">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
          Skill Distribution
        </p>
        <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700 dark:bg-violet-500/15 dark:text-violet-200">
          Last 30 Days
        </span>
      </div>

      <svg
        viewBox="0 0 320 320"
        className="mx-auto mt-8 aspect-square w-full max-w-[500px]"
      >
        <defs>
          <radialGradient id="skillSpikeFill" cx="50%" cy="50%" r="65%">
            <stop offset="0%" stopColor="rgb(250 204 21)" stopOpacity="0.42" />
            <stop offset="55%" stopColor="rgb(124 58 237)" stopOpacity="0.24" />
            <stop offset="100%" stopColor="rgb(124 58 237)" stopOpacity="0.1" />
          </radialGradient>
          <filter id="skillSpikeGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {[0.25, 0.5, 0.75, 1].map((scale) => (
          <polygon
            key={scale}
            points={chartPoints
              .map((_, index) => {
                const angle = -Math.PI / 2 + index * angleStep;
                return `${center + Math.cos(angle) * maxRadius * scale},${
                  center + Math.sin(angle) * maxRadius * scale
                }`;
              })
              .join(" ")}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="text-zinc-200 dark:text-zinc-800"
          />
        ))}
        <polygon
          points={outer}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-zinc-300 dark:text-zinc-700"
        />
        {chartPoints.map((point) => (
          <line
            key={point.slug}
            x1={center}
            y1={center}
            x2={point.axisX}
            y2={point.axisY}
            stroke="currentColor"
            strokeWidth="1"
            className="text-zinc-100 dark:text-zinc-800"
          />
        ))}
        <polygon
          points={polygon}
          fill="url(#skillSpikeFill)"
          stroke="rgb(124 58 237)"
          strokeWidth="2.5"
          strokeLinejoin="round"
          filter="url(#skillSpikeGlow)"
        />
        <polygon
          points={polygon}
          fill="none"
          stroke="rgb(250 204 21)"
          strokeWidth="1.2"
          strokeLinejoin="round"
          opacity="0.78"
        />
        {chartPoints.map((point) => (
          <g key={point.slug}>
            <text
              x={point.labelX}
              y={point.labelY}
              textAnchor={
                point.labelX < center - 8
                  ? "end"
                  : point.labelX > center + 8
                    ? "start"
                    : "middle"
              }
              dominantBaseline="middle"
              className="fill-zinc-600 text-[8px] font-black dark:fill-zinc-300"
            >
              {point.shortLabel}
            </text>
          </g>
        ))}
      </svg>

      <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {points.map((point) => (
          <div
            key={point.slug}
            className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 text-xs dark:bg-white/5"
          >
            <span className="font-bold text-zinc-700 dark:text-zinc-200">
              {domainShortLabels[point.slug] ?? point.label}
            </span>
            <span className="font-black text-violet-700 dark:text-violet-300">
              {point.value}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RankingCard({
  average,
  attempts,
}: {
  average: number;
  attempts: number;
}) {
  return (
    <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-violet-950 via-violet-800 to-purple-700 p-6 text-white shadow-lg shadow-violet-900/20">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-violet-200">
          Ranking
        </p>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
          <span className="text-lg font-black">▥</span>
        </div>
      </div>
      <p className="text-5xl font-black tracking-tight font-[family-name:var(--font-space-grotesk)]">
        {estimatedRank(average, attempts)}
      </p>
      <p className="mt-2 text-sm text-violet-100">
        {attempts > 0
          ? `Current average score is ${average}%.`
          : "Finish a real-mode quiz to enter the ranking."}
      </p>
      <div className="mt-8 flex h-20 items-end gap-2">
        {[28, 36, 31, 48, 46, 57, 66].map((height, index) => (
          <div
            key={index}
            className="flex-1 rounded-t bg-white/25"
            style={{ height: `${height}%` }}
          />
        ))}
        <div
          className="flex-1 rounded-t bg-white"
          style={{ height: `${Math.max(18, average)}%` }}
        />
      </div>
      <div className="mt-3 flex items-center justify-between text-[10px] font-bold text-violet-200">
        <span>Last 30 Days Trend</span>
        <span>{attempts} attempts</span>
      </div>
    </div>
  );
}

function PriorityCard({ weakest }: { weakest: RadarPoint }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-white p-5 shadow-sm dark:border-rose-500/25 dark:bg-zinc-950">
      <p className="text-lg font-black text-zinc-950 dark:text-white">
        Top Improvement Priority
      </p>
      <div className="mt-5 rounded-xl bg-rose-50 p-4 dark:bg-rose-500/10">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-rose-500">
          Lowest Skill Area
        </p>
        <div className="mt-1 flex items-end justify-between gap-4">
          <p className="text-2xl font-black text-zinc-950 dark:text-white">
            {domainShortLabels[weakest.slug] ?? weakest.label}
          </p>
          <div className="text-right">
            <p className="text-3xl font-black text-rose-500">
              {weakest.value || 0}%
            </p>
            <p className="text-[10px] font-bold uppercase text-zinc-400">
              Average
            </p>
          </div>
        </div>
      </div>
      <div className="mt-5 rounded-xl border border-zinc-200 p-4 dark:border-white/10">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">
          Highest Impact Area
        </p>
        <p className="mt-2 text-sm font-black text-zinc-950 dark:text-white">
          Practice more {domainShortLabels[weakest.slug] ?? weakest.label}
        </p>
        <p className="mt-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
          This area currently pulls down the dashboard average. Complete more
          real-mode quizzes here to raise the hex graph.
        </p>
        <Link
          href="/sky-quest"
          className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-zinc-950 px-4 py-3 text-sm font-black text-white transition hover:bg-violet-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-violet-100"
        >
          Practice Now
        </Link>
      </div>
    </div>
  );
}

function BenchmarkCard({ point }: { point: RadarPoint }) {
  const bars = [18, 28, 48, 68, 54, 38, 24];
  const rank = point.attempts === 0 ? "--" : `${Math.max(1, 420 - point.value * 4)}th`;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-950">
      <div className="mb-4 flex items-center gap-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-black ${
            domainAccent[point.slug] ?? domainAccent["aviation-recall"]
          }`}
        >
          {point.value}
        </div>
        <p className="text-sm font-black text-zinc-600 dark:text-zinc-300">
          {domainShortLabels[point.slug] ?? point.label}
        </p>
      </div>
      <div className="flex h-14 items-end gap-1">
        {bars.map((height, index) => (
          <div
            key={index}
            className={`flex-1 rounded-t ${
              index === 5 ? "bg-yellow-300" : "bg-violet-800 dark:bg-violet-400"
            }`}
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
      <div className="mt-2 text-right">
        <p className="text-xs font-bold text-emerald-500">
          {point.attempts > 0 ? `+${Math.max(1, point.attempts)}%` : "0%"}
        </p>
        <p className="text-2xl font-black text-zinc-950 dark:text-white">
          {rank}
        </p>
      </div>
    </div>
  );
}

function HistoryPanel({ scoreHistory }: { scoreHistory: ScoreHistoryEntry[] }) {
  const recent = scoreHistory.slice(0, 6).reverse();

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-zinc-950 dark:text-white">
            Historical Ranking Progression
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Longitudinal analysis from real-mode score history.
          </p>
        </div>
        <div className="flex gap-2 text-xs font-black">
          <span className="rounded-lg bg-violet-100 px-3 py-2 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200">
            All Time
          </span>
          <span className="px-3 py-2 text-zinc-400">6 Months</span>
          <span className="px-3 py-2 text-zinc-400">30 Days</span>
        </div>
      </div>

      <div className="relative mt-10 h-56 overflow-hidden">
        <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-zinc-200 dark:border-white/10" />
        <div className="absolute right-0 top-[44%] text-[10px] font-black text-zinc-400">
          Platform Avg.
        </div>
        <div className="flex h-full items-end gap-4 pt-8">
          {recent.length === 0
            ? ["JAN", "FEB", "MAR", "APR", "MAY", "CURRENT"].map((label) => (
                <div key={label} className="flex flex-1 flex-col items-center">
                  <div className="h-2 w-2 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                  <span className="mt-20 text-[10px] font-black text-zinc-300 dark:text-zinc-700">
                    {label}
                  </span>
                </div>
              ))
            : recent.map((entry, index) => (
                <div key={entry.id} className="flex flex-1 flex-col items-center">
                  <div
                    className="w-full rounded-t-xl bg-violet-700 dark:bg-violet-400"
                    style={{ height: `${Math.max(10, entry.percentage)}%` }}
                  />
                  <span className="mt-3 text-[10px] font-black text-zinc-400">
                    {index === recent.length - 1 ? "CURRENT" : `#${index + 1}`}
                  </span>
                </div>
              ))}
        </div>
      </div>
    </section>
  );
}

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
  const totalAttempts = overview.radar.reduce(
    (total, point) => total + point.attempts,
    0,
  );
  const average = averageRadar(overview.radar);
  const weakest =
    [...overview.radar]
      .filter((point) => point.attempts > 0)
      .sort((a, b) => a.value - b.value)[0] ?? overview.radar[0];

  return (
    <main className="min-h-screen bg-[#f4f6f8] px-5 py-10 text-zinc-950 dark:bg-black dark:text-zinc-100">
      <div className="mx-auto max-w-7xl">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl font-[family-name:var(--font-space-grotesk)]">
            Skills Dashboard
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-zinc-500 dark:text-zinc-400">
            The Skill Dashboard provides a clear summary of your performance in
            each skill area, allowing you to assess your abilities and plan
            targeted development effectively.
          </p>
        </header>

        <section className="mb-8 flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-950 sm:flex-row sm:items-center sm:justify-between">
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
            <div className="text-left">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-700 dark:text-violet-300">
                Google account
              </p>
              <h2 className="text-2xl font-black">{overview.user.name}</h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {overview.user.email}
              </p>
            </div>
          </div>
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-black text-zinc-700 transition hover:bg-zinc-100 dark:border-white/15 dark:text-zinc-200 dark:hover:bg-white/10"
            >
              Sign out
            </button>
          </form>
        </section>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(320px,0.95fr)]">
          <HexRadar points={overview.radar} />
          <div className="space-y-5">
            <RankingCard average={average} attempts={totalAttempts} />
            <PriorityCard weakest={weakest} />
          </div>
        </section>

        <section className="mt-8">
          <h2 className="mb-5 text-2xl font-black">Category Benchmarking</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {overview.radar.map((point) => (
              <BenchmarkCard key={point.slug} point={point} />
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <HistoryPanel scoreHistory={overview.scoreHistory} />
          <div className="space-y-6">
            <ProfileEditor
              initialName={overview.user.name}
              initialImageUrl={overview.user.imageUrl}
            />
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-950">
              <h2 className="text-xl font-black">Subscription</h2>
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
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black">Recent Score Records</h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Real-mode quiz completions are ranked and saved here.
              </p>
            </div>
            <Link
              href="/sky-quest"
              className="rounded-xl bg-violet-700 px-4 py-2 text-sm font-black text-white transition hover:bg-violet-600"
            >
              Practice
            </Link>
          </div>

          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-950">
            {overview.scoreHistory.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <p className="text-sm font-bold text-zinc-700 dark:text-zinc-200">
                  No recorded scores yet.
                </p>
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                  Finish any real-mode quiz to populate the dashboard.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-white/10">
                {overview.scoreHistory.map((entry) => (
                  <div
                    key={entry.id}
                    className="grid gap-3 px-5 py-4 text-sm sm:grid-cols-[1fr_auto_auto]"
                  >
                    <div>
                      <p className="font-black text-zinc-950 dark:text-zinc-100">
                        {entry.topicTitle}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        {new Date(entry.completedAt).toLocaleString()} ·{" "}
                        {entry.mode ?? "practice"}
                      </p>
                    </div>
                    <div className="font-black text-violet-700 dark:text-violet-300">
                      {entry.percentage.toFixed(0)}%
                    </div>
                    <div className="text-zinc-500 dark:text-zinc-400">
                      {entry.rankLabel}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <DeleteAccountSection />
      </div>
    </main>
  );
}
