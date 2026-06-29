import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAccountUser } from "@/lib/account/auth";
import {
  getAccountOverview,
  getLeaderboardContext,
  hasAccountDatabase,
  type LeaderboardContextEntry,
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
  multitasking: "Multitasking",
};

const domainAccent: Record<string, string> = {
  "logical-reasoning": "text-rose-500 bg-rose-50 border-rose-100 dark:bg-rose-500/10 dark:border-rose-500/20",
  "spatial-orientation": "text-emerald-500 bg-emerald-50 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20",
  "visual-scanning": "text-sky-500 bg-sky-50 border-sky-100 dark:bg-sky-500/10 dark:border-sky-500/20",
  "numerical-agility": "text-amber-500 bg-amber-50 border-amber-100 dark:bg-amber-500/10 dark:border-amber-500/20",
  "short-term-memory": "text-fuchsia-500 bg-fuchsia-50 border-fuchsia-100 dark:bg-fuchsia-500/10 dark:border-fuchsia-500/20",
  multitasking: "text-violet-500 bg-violet-50 border-violet-100 dark:bg-violet-500/10 dark:border-violet-500/20",
};

function formatRank(rank: number | null) {
  if (!rank) return "Unranked";
  const mod100 = rank % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${rank}th`;
  if (rank % 10 === 1) return `${rank}st`;
  if (rank % 10 === 2) return `${rank}nd`;
  if (rank % 10 === 3) return `${rank}rd`;
  return `${rank}th`;
}

function HexRadar({ points }: { points: RadarPoint[] }) {
  const center = 160;
  const maxRadius = 102;
  const labelRadius = maxRadius + 20;
  const safePoints = points.length > 0 ? points : [];
  const angleStep = safePoints.length > 0 ? (Math.PI * 2) / safePoints.length : 0;
  const chartPoints = safePoints.map((point, index) => {
    const angle = -Math.PI / 2 + index * angleStep;
    const safeValue = Number.isFinite(point.value) ? point.value : 0;
    const radius = (safeValue / 100) * maxRadius;
    return {
      ...point,
      value: safeValue,
      shortLabel: domainShortLabels[point.slug] ?? point.label,
      x: center + Math.cos(angle) * radius,
      y: center + Math.sin(angle) * radius,
      axisX: center + Math.cos(angle) * maxRadius,
      axisY: center + Math.sin(angle) * maxRadius,
      labelX: center + Math.cos(angle) * labelRadius,
      labelY: center + Math.sin(angle) * labelRadius,
    };
  });
  const polygon = chartPoints.map((point) => `${point.x},${point.y}`).join(" ");
  const outer = chartPoints
    .map((point) => `${point.axisX},${point.axisY}`)
    .join(" ");

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950">
      <div className="mb-3 flex items-center justify-between border-b border-zinc-200 pb-4 dark:border-white/10">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
          Skill Distribution
        </p>
        <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700 dark:bg-violet-500/15 dark:text-violet-200">
          Last 30 Days
        </span>
      </div>

      <svg
        viewBox="-12 -12 344 344"
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
              className="fill-zinc-600 text-[8px] font-bold dark:fill-zinc-300"
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
            <span className="font-bold text-violet-700 dark:text-violet-300">
              {point.value}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RankingCard({
  rank,
  rankedProfiles,
  average,
  attempts,
  profilesAhead,
  recentScores,
}: {
  rank: number | null;
  rankedProfiles: number;
  average: number | null;
  attempts: number;
  profilesAhead: number;
  recentScores: number[];
}) {
  const safeAverage = average ?? 0;
  const bars = recentScores.length > 0 ? recentScores : [safeAverage];
  return (
    <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-violet-950 via-violet-800 to-purple-700 p-6 text-white shadow-lg shadow-violet-900/20">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-violet-200">
          Ranking
        </p>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
          <span className="text-lg font-bold">▥</span>
        </div>
      </div>
      <p className="text-5xl font-bold tracking-tight">
        {formatRank(rank)}
      </p>
      <p className="mt-2 text-sm text-violet-100">
        {attempts > 0
          ? `${profilesAhead} of ${rankedProfiles} ranked profiles are ahead. Average score is ${safeAverage}%.`
          : "Finish a real-mode quiz to enter the ranking."}
      </p>
      <div className="mt-8 flex h-20 items-end gap-2">
        {bars.map((height, index) => (
          <div
            key={index}
            className="flex-1 rounded-t bg-white/25"
            style={{ height: `${Math.max(8, height)}%` }}
          />
        ))}
        <div
          className="flex-1 rounded-t bg-white"
          style={{ height: `${Math.max(18, safeAverage)}%` }}
        />
      </div>
      <div className="mt-3 flex items-center justify-between text-[10px] font-bold text-violet-200">
        <span>Recent Recorded Scores</span>
        <span>{attempts} attempts</span>
      </div>
    </div>
  );
}

function PriorityCard({ weakest }: { weakest: RadarPoint }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-white p-5 shadow-sm dark:border-rose-500/25 dark:bg-zinc-950">
      <p className="text-lg font-bold text-zinc-950 dark:text-white">
        Top Improvement Priority
      </p>
      <div className="mt-5 rounded-xl bg-rose-50 p-4 dark:bg-rose-500/10">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-rose-500">
          Lowest Skill Area
        </p>
        <div className="mt-1 flex items-end justify-between gap-4">
          <p className="text-2xl font-bold text-zinc-950 dark:text-white">
            {domainShortLabels[weakest.slug] ?? weakest.label}
          </p>
          <div className="text-right">
            <p className="text-3xl font-bold text-rose-500">
              {weakest.value || 0}%
            </p>
            <p className="text-[10px] font-bold uppercase text-zinc-400">
              Average
            </p>
          </div>
        </div>
      </div>
      <div className="mt-5 rounded-xl border border-zinc-200 p-4 dark:border-white/10">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">
          Highest Impact Area
        </p>
        <p className="mt-2 text-sm font-bold text-zinc-950 dark:text-white">
          Practice more {domainShortLabels[weakest.slug] ?? weakest.label}
        </p>
        <p className="mt-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
          This area currently pulls down the dashboard average. Complete more
          real-mode quizzes here to raise the hex graph.
        </p>
        <Link
          href="/sky-quest"
          className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-zinc-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-violet-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-violet-100"
        >
          Practice Now
        </Link>
      </div>
    </div>
  );
}

function BenchmarkCard({ point }: { point: RadarPoint }) {
  const value = Number.isFinite(point.value) ? point.value : 0;
  const rank = point.rank ? formatRank(point.rank) : "--";

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-950">
      <div className="mb-4 flex items-center gap-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-bold ${
            domainAccent[point.slug] ?? domainAccent.multitasking
          }`}
        >
          {value}
        </div>
        <p className="text-sm font-bold text-zinc-600 dark:text-zinc-300">
          {domainShortLabels[point.slug] ?? point.label}
        </p>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-zinc-100 dark:bg-white/10">
        <div
          className="h-full rounded-full bg-violet-800 dark:bg-violet-400"
          style={{ width: `${value}%` }}
        />
      </div>
      <div className="mt-2 text-right">
        <p className="text-xs font-bold text-emerald-500">
          {point.rank ? `${point.rankedProfiles} ranked` : "No rank"}
        </p>
        <p className="text-2xl font-bold text-zinc-950 dark:text-white">
          {rank}
        </p>
      </div>
    </div>
  );
}

function GlobalRankingCard({
  entries,
  userRank,
  rankedProfiles,
}: {
  entries: LeaderboardContextEntry[];
  userRank: number | null;
  rankedProfiles: number;
}) {
  const top3 = entries.filter((e) => e.rank <= 3);
  const rest = entries.filter((e) => e.rank > 3);
  const lowestTop3 = top3.length > 0 ? top3[top3.length - 1].rank : 0;
  const showSeparator = rest.length > 0 && rest[0].rank > lowestTop3 + 1;

  const rankLabel = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  const Row = ({ entry }: { entry: LeaderboardContextEntry }) => (
    <div
      className={`flex items-center gap-3 rounded-xl px-3 py-2 transition-colors ${
        entry.isCurrentUser
          ? "bg-violet-50 ring-1 ring-violet-200 dark:bg-violet-500/10 dark:ring-violet-500/30"
          : "hover:bg-zinc-50 dark:hover:bg-white/5"
      }`}
    >
      <span
        className={`w-9 shrink-0 text-center text-sm font-bold ${
          entry.rank <= 3
            ? "text-base"
            : entry.isCurrentUser
              ? "text-violet-700 dark:text-violet-300"
              : "text-zinc-400 dark:text-zinc-500"
        }`}
      >
        {rankLabel(entry.rank)}
      </span>

      <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-violet-700 text-[11px] font-bold text-white">
        {entry.displayName.slice(0, 1).toUpperCase()}
      </span>

      <span className={`flex-1 truncate text-sm font-semibold ${entry.isCurrentUser ? "text-violet-700 dark:text-violet-300" : "text-zinc-700 dark:text-zinc-200"}`}>
        {entry.displayName}
        {entry.isCurrentUser && (
          <span className="ml-2 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-violet-700 dark:bg-violet-500/20 dark:text-violet-300">
            You
          </span>
        )}
      </span>

      <span className={`shrink-0 text-sm font-bold ${entry.isCurrentUser ? "text-violet-700 dark:text-violet-300" : "text-zinc-500 dark:text-zinc-400"}`}>
        {entry.dashboardAverage}%
      </span>
    </div>
  );

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-950">
      <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4 dark:border-white/10">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
            Global Leaderboard
          </p>
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
            {rankedProfiles} ranked pilots
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
            Your Rank
          </p>
          <p className="text-2xl font-bold text-violet-700 dark:text-violet-300">
            {userRank ? `#${userRank}` : "—"}
          </p>
        </div>
      </div>

      <div className="p-3">
        {entries.length === 0 ? (
          <p className="py-6 text-center text-sm text-zinc-400 dark:text-zinc-500">
            No ranked pilots yet. Finish a real-mode quiz to appear here.
          </p>
        ) : (
          <>
            {top3.map((entry) => (
              <Row key={entry.profileId} entry={entry} />
            ))}

            {showSeparator && (
              <div className="my-1 flex items-center gap-2 px-3 py-1">
                <div className="h-px flex-1 border-t border-dashed border-zinc-200 dark:border-white/10" />
                <span className="text-xs font-bold text-zinc-300 dark:text-zinc-600">
                  ···
                </span>
                <div className="h-px flex-1 border-t border-dashed border-zinc-200 dark:border-white/10" />
              </div>
            )}

            {rest.map((entry) => (
              <Row key={entry.profileId} entry={entry} />
            ))}

            {!userRank && (
              <p className="mt-3 rounded-xl bg-zinc-50 px-4 py-3 text-center text-xs text-zinc-400 dark:bg-white/5 dark:text-zinc-500">
                Complete a real-mode quiz to enter the ranking.
              </p>
            )}
          </>
        )}
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
          <h2 className="text-xl font-bold text-zinc-950 dark:text-white">
            Historical Ranking Progression
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Longitudinal analysis from real-mode score history.
          </p>
        </div>
        <div className="flex gap-2 text-xs font-bold">
          <span className="rounded-lg bg-violet-100 px-3 py-2 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200">
            All Time
          </span>
          <span className="px-3 py-2 text-zinc-400">6 Months</span>
          <span className="px-3 py-2 text-zinc-400">30 Days</span>
        </div>
      </div>

      <div className="relative mt-10 h-56 overflow-hidden">
        <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-zinc-200 dark:border-white/10" />
        <div className="absolute right-0 top-[44%] text-[10px] font-bold text-zinc-400">
          Platform Avg.
        </div>
        <div className="flex h-full items-end gap-4 pt-8">
          {recent.length === 0
            ? ["JAN", "FEB", "MAR", "APR", "MAY", "CURRENT"].map((label) => (
                <div key={label} className="flex flex-1 flex-col items-center">
                  <div className="h-2 w-2 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                  <span className="mt-20 text-[10px] font-bold text-zinc-300 dark:text-zinc-700">
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
                  <span className="mt-3 text-[10px] font-bold text-zinc-400">
                    {index === recent.length - 1 ? "CURRENT" : `#${index + 1}`}
                  </span>
                </div>
              ))}
        </div>
      </div>
    </section>
  );
}

function monotonicMs() {
  return Number(process.hrtime.bigint() / BigInt(1000000));
}

export default async function DashboardPage() {
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

  let user;
  try {
    const sessionStartedAt = monotonicMs();
    user = await getCurrentAccountUser();
    console.log("[dashboard] session resolved", {
      hasUser: Boolean(user),
      durationMs: monotonicMs() - sessionStartedAt,
    });
  } catch (error) {
    console.error("[dashboard] failed to read current account user", error);
    return (
      <main className="min-h-screen bg-[#f4f6f8] px-5 py-16 text-zinc-950 dark:bg-black dark:text-zinc-100">
        <div className="mx-auto max-w-3xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-zinc-950">
          <h1 className="text-3xl font-bold">
            Dashboard unavailable
          </h1>
          <p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            We could not verify your account session. Please sign in again.
          </p>
          <Link
            href="/sign-in?callbackUrl=/dashboard"
            className="mt-6 inline-flex rounded-xl bg-violet-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-violet-600"
          >
            Sign in
          </Link>
        </div>
      </main>
    );
  }
  if (!user) redirect("/sign-in");

  let overview;
  let leaderboard: LeaderboardContextEntry[] = [];
  try {
    const overviewStartedAt = monotonicMs();
    [overview, leaderboard] = await Promise.all([
      getAccountOverview(user.profileId),
      getLeaderboardContext(user.profileId).catch(() => []),
    ]);
    console.log("[dashboard] overview resolved", {
      profileId: user.profileId,
      durationMs: monotonicMs() - overviewStartedAt,
      totalMs: monotonicMs() - pageStartedAt,
    });
  } catch (error) {
    console.error("[dashboard] failed to load account overview", error);
    return (
      <main className="min-h-screen bg-[#f4f6f8] px-5 py-16 text-zinc-950 dark:bg-black dark:text-zinc-100">
        <div className="mx-auto max-w-3xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-zinc-950">
          <h1 className="text-3xl font-bold">
            Dashboard unavailable
          </h1>
          <p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            Your account loaded, but the score dashboard data could not be read.
            Try again after the latest staging deployment finishes.
          </p>
          <Link
            href="/account"
            className="mt-6 inline-flex rounded-xl bg-violet-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-violet-600"
          >
            Account settings
          </Link>
        </div>
      </main>
    );
  }
  const totalAttempts = overview.radar.reduce(
    (total, point) => total + point.attempts,
    0,
  );
  const weakest =
    [...overview.radar]
      .filter((point) => point.attempts > 0)
      .sort((a, b) => a.value - b.value)[0] ?? overview.radar[0];
  const recentScores = overview.scoreHistory
    .slice(0, 7)
    .reverse()
    .map((entry) => Math.round(entry.percentage));

  return (
    <main className="min-h-screen bg-[#f4f6f8] px-5 py-10 text-zinc-950 dark:bg-black dark:text-zinc-100">
      <div className="mx-auto max-w-7xl">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
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
            <div className="text-left">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-violet-700 dark:text-violet-300">
                Google account
              </p>
              <h2 className="text-2xl font-bold">{overview.user.name}</h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {overview.user.email}
              </p>
            </div>
          </div>
          <Link
            href="/account"
            className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-bold text-zinc-700 transition hover:bg-zinc-100 dark:border-white/15 dark:text-zinc-200 dark:hover:bg-white/10"
          >
            Account settings
          </Link>
        </section>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(320px,0.95fr)]">
          <HexRadar points={overview.radar} />
          <div className="space-y-5">
            <RankingCard
              rank={overview.ranking.actualPlatformRank}
              rankedProfiles={overview.ranking.rankedProfiles}
              average={overview.ranking.dashboardAverage}
              attempts={overview.ranking.totalAttempts || totalAttempts}
              profilesAhead={overview.ranking.profilesAhead}
              recentScores={recentScores}
            />
            <PriorityCard weakest={weakest} />
          </div>
        </section>

        <section className="mt-8">
          <h2 className="mb-5 text-2xl font-bold">Category Benchmarking</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {overview.radar.map((point) => (
              <BenchmarkCard key={point.slug} point={point} />
            ))}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="mb-5 text-2xl font-bold">Global Ranking</h2>
          <GlobalRankingCard
            entries={leaderboard}
            userRank={overview.ranking.actualPlatformRank}
            rankedProfiles={overview.ranking.rankedProfiles}
          />
        </section>

        <section className="mt-8">
          <HistoryPanel scoreHistory={overview.scoreHistory} />
        </section>

        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">Recent Score Records</h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Real-mode quiz completions are ranked and saved here.
              </p>
            </div>
            <Link
              href="/sky-quest"
              className="rounded-xl bg-violet-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-violet-600"
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
                      <p className="font-bold text-zinc-950 dark:text-zinc-100">
                        {entry.topicTitle}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        {new Date(entry.completedAt).toLocaleString()} ·{" "}
                        {entry.mode ?? "practice"}
                      </p>
                    </div>
                    <div className="font-bold text-violet-700 dark:text-violet-300">
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
      </div>
    </main>
  );
}
