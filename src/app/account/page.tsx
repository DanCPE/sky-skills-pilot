import Link from "next/link";
import { redirect } from "next/navigation";
import DeleteAccountSection from "@/components/account/DeleteAccountSection";
import ProfileEditor from "@/components/account/ProfileEditor";
import { getCurrentAccountUser } from "@/lib/account/auth";
import { getAccountOverview, hasAccountDatabase } from "@/lib/account/db";

export const dynamic = "force-dynamic";

function HexRadar({
  points,
}: {
  points: { label: string; value: number; attempts: number }[];
}) {
  const center = 120;
  const maxRadius = 92;
  const angleStep = (Math.PI * 2) / 6;
  const chartPoints = points.map((point, index) => {
    const angle = -Math.PI / 2 + index * angleStep;
    const radius = (point.value / 100) * maxRadius;
    return {
      ...point,
      x: center + Math.cos(angle) * radius,
      y: center + Math.sin(angle) * radius,
      labelX: center + Math.cos(angle) * 112,
      labelY: center + Math.sin(angle) * 112,
      axisX: center + Math.cos(angle) * maxRadius,
      axisY: center + Math.sin(angle) * maxRadius,
    };
  });
  const polygon = chartPoints.map((point) => `${point.x},${point.y}`).join(" ");
  const outer = chartPoints
    .map((point) => `${point.axisX},${point.axisY}`)
    .join(" ");

  return (
    <div className="w-full overflow-hidden rounded-lg border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-black/30">
      <svg viewBox="0 0 240 240" className="mx-auto aspect-square w-full max-w-[360px]">
        <polygon
          points={outer}
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          className="text-zinc-200 dark:text-zinc-700"
        />
        {[0.33, 0.66].map((scale) => (
          <polygon
            key={scale}
            points={chartPoints
              .map((point, index) => {
                const angle = -Math.PI / 2 + index * angleStep;
                return `${center + Math.cos(angle) * maxRadius * scale},${
                  center + Math.sin(angle) * maxRadius * scale
                }`;
              })
              .join(" ")}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="text-zinc-100 dark:text-zinc-800"
          />
        ))}
        {chartPoints.map((point) => (
          <line
            key={point.label}
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
          fill="rgb(124 58 237 / 0.28)"
          stroke="rgb(124 58 237)"
          strokeWidth="2"
        />
        {chartPoints.map((point) => (
          <g key={point.label}>
            <circle cx={point.x} cy={point.y} r="3.5" fill="rgb(245 158 11)" />
            <text
              x={point.labelX}
              y={point.labelY}
              textAnchor={point.labelX < center - 8 ? "end" : point.labelX > center + 8 ? "start" : "middle"}
              dominantBaseline="middle"
              className="fill-zinc-700 text-[8px] font-semibold dark:fill-zinc-300"
            >
              {point.value}
            </text>
          </g>
        ))}
      </svg>
      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {points.map((point) => (
          <div
            key={point.label}
            className="flex items-center justify-between rounded-md bg-zinc-50 px-3 py-2 text-xs dark:bg-white/5"
          >
            <span className="font-semibold text-zinc-700 dark:text-zinc-200">
              {point.label}
            </span>
            <span className="text-zinc-500 dark:text-zinc-400">
              {point.attempts} attempts
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function AccountPage() {
  if (!hasAccountDatabase()) {
    return (
      <main className="min-h-screen bg-[#fafafa] px-6 py-16 text-zinc-900 dark:bg-black dark:text-zinc-100">
        <div className="mx-auto max-w-3xl rounded-lg border border-zinc-200 bg-white p-8 dark:border-white/10 dark:bg-white/5">
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
    <main className="min-h-screen bg-[#fafafa] px-6 py-10 text-zinc-900 dark:bg-black dark:text-zinc-100">
      <div className="mx-auto max-w-6xl">
        <section className="flex flex-col gap-6 border-b border-zinc-200 pb-8 dark:border-white/10 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            {overview.user.imageUrl ? (
              // Google profile images are external and user-controlled; keep this simple.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={overview.user.imageUrl}
                alt=""
                className="h-16 w-16 rounded-full border border-zinc-200 object-cover dark:border-white/10"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-700 text-xl font-bold text-white">
                {overview.user.name.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-violet-700 dark:text-amber-300">
                Google account
              </p>
              <h1 className="text-3xl font-bold font-[family-name:var(--font-space-grotesk)]">
                {overview.user.name}
              </h1>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {overview.user.email}
              </p>
            </div>
          </div>
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-bold text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-white/15 dark:text-zinc-200 dark:hover:bg-white/10"
            >
              Sign out
            </button>
          </form>
        </section>

        <ProfileEditor
          initialName={overview.user.name}
          initialImageUrl={overview.user.imageUrl}
        />

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold font-[family-name:var(--font-space-grotesk)]">
                  Skill profile
                </h2>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Prepared for the future hexagonal quiz graph.
                </p>
              </div>
            </div>
            <HexRadar points={overview.radar} />
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
            <h2 className="text-xl font-bold font-[family-name:var(--font-space-grotesk)]">
              Subscription
            </h2>
            <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
              Payment records are ready in the database, but checkout is not
              connected yet.
            </p>
            <div className="mt-5 rounded-md bg-zinc-50 p-4 text-sm dark:bg-black/30">
              <div className="flex justify-between gap-4">
                <span className="font-semibold">Status</span>
                <span className="text-zinc-500 dark:text-zinc-400">
                  {overview.subscription?.status ?? "not_started"}
                </span>
              </div>
              <div className="mt-2 flex justify-between gap-4">
                <span className="font-semibold">Provider</span>
                <span className="text-zinc-500 dark:text-zinc-400">
                  {overview.subscription?.provider ?? "pending"}
                </span>
              </div>
            </div>
            <button
              type="button"
              disabled
              className="mt-5 w-full rounded-lg bg-zinc-200 px-4 py-2.5 text-sm font-bold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
            >
              Checkout coming soon
            </button>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-bold font-[family-name:var(--font-space-grotesk)]">
                Score history
              </h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Future quiz results will appear here after completion.
              </p>
            </div>
            <Link
              href="/sky-quest"
              className="text-sm font-bold text-violet-700 hover:text-violet-600 dark:text-amber-300"
            >
              Practice quests
            </Link>
          </div>

          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-white/10 dark:bg-white/5">
            {overview.scoreHistory.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                  No recorded scores yet.
                </p>
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                  The account is ready; score recording can be attached to quiz
                  completion when those result flows are finalized.
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
                      <p className="font-bold text-zinc-900 dark:text-zinc-100">
                        {entry.topicTitle}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        {new Date(entry.completedAt).toLocaleString()} ·{" "}
                        {entry.mode ?? "practice"}
                      </p>
                    </div>
                    <div className="font-bold text-violet-700 dark:text-amber-300">
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
