"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

interface TopicRow {
  topic: string;
  events: number;
  pageViews: number;
  quizStarts: number;
  uniqueUsersByIp: number;
  uniqueSessions: number;
}

interface BacklogResponse {
  generatedAt: string;
  filters: {
    topic: string | null;
    from: string | null;
    to: string | null;
  };
  totalEvents: number;
  uniqueUsersByIp: number;
  uniqueSessions: number;
  byTopic: TopicRow[];
}

function toIsoOrNull(datetimeLocal: string): string | null {
  if (!datetimeLocal) return null;
  const parsed = new Date(datetimeLocal);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

export default function AdminAnalyticsPage() {
  const [topic, setTopic] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<BacklogResponse | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      const fromIso = toIsoOrNull(from);
      const toIso = toIsoOrNull(to);

      if (topic.trim()) params.set("topic", topic.trim());
      if (fromIso) params.set("from", fromIso);
      if (toIso) params.set("to", toIso);

      const response = await fetch(`/api/analytics/backlog?${params.toString()}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to load analytics backlog.");
      }

      const json = (await response.json()) as BacklogResponse;
      setData(json);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Failed to load analytics backlog.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [from, to, topic]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const sortedTopics = useMemo(() => {
    if (!data) return [];
    return [...data.byTopic].sort((a, b) => b.uniqueUsersByIp - a.uniqueUsersByIp);
  }, [data]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] px-4 pb-12 pt-10 text-zinc-900 dark:bg-transparent dark:text-zinc-100 sm:px-6">
      <main className="mx-auto w-full max-w-6xl space-y-6">
        <header className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-black/40">
          <h1 className="text-3xl font-bold tracking-tight font-[family-name:var(--font-space-grotesk)]">
            Admin Analytics Dashboard
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            URL: <code>/admin/analytics</code> - unique client estimation grouped by IP hash.
          </p>
          {data && (
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              Last generated: {new Date(data.generatedAt).toLocaleString()}
            </p>
          )}
        </header>

        <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-black/40 sm:p-6">
          <h2 className="mb-4 text-lg font-semibold">Filters</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <input
              type="text"
              placeholder="Topic slug (e.g. scanning-shape)"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-brand-purple/30 transition focus:ring dark:border-white/15 dark:bg-black/30"
            />
            <input
              type="datetime-local"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-brand-purple/30 transition focus:ring dark:border-white/15 dark:bg-black/30"
            />
            <input
              type="datetime-local"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-brand-purple/30 transition focus:ring dark:border-white/15 dark:bg-black/30"
            />
            <button
              onClick={() => void fetchData()}
              disabled={isLoading}
              className={`rounded-xl px-4 py-2 text-sm font-bold text-white transition ${
                isLoading
                  ? "cursor-not-allowed bg-zinc-400"
                  : "bg-brand-purple hover:opacity-90"
              }`}
            >
              {isLoading ? "Loading..." : "Apply Filters"}
            </button>
          </div>
        </section>

        {error && (
          <section className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </section>
        )}

        {data && (
          <>
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-black/40">
                <p className="text-xs uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                  Unique Clients (IP)
                </p>
                <p className="mt-2 text-3xl font-bold">{data.uniqueUsersByIp}</p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-black/40">
                <p className="text-xs uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                  Unique Sessions
                </p>
                <p className="mt-2 text-3xl font-bold">{data.uniqueSessions}</p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-black/40">
                <p className="text-xs uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                  Total Events
                </p>
                <p className="mt-2 text-3xl font-bold">{data.totalEvents}</p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-black/40">
                <p className="text-xs uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                  Topics Tracked
                </p>
                <p className="mt-2 text-3xl font-bold">{data.byTopic.length}</p>
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-white/10 dark:bg-black/40">
              <div className="border-b border-zinc-200 px-5 py-4 dark:border-white/10">
                <h2 className="text-lg font-semibold">By Topic</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-zinc-50 dark:bg-white/5">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Topic</th>
                      <th className="px-4 py-3 font-semibold">Unique Clients</th>
                      <th className="px-4 py-3 font-semibold">Sessions</th>
                      <th className="px-4 py-3 font-semibold">Page Views</th>
                      <th className="px-4 py-3 font-semibold">Quiz Starts</th>
                      <th className="px-4 py-3 font-semibold">Events</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTopics.map((row) => (
                      <tr
                        key={row.topic}
                        className="border-t border-zinc-100 dark:border-white/10"
                      >
                        <td className="px-4 py-3 font-medium">{row.topic}</td>
                        <td className="px-4 py-3">{row.uniqueUsersByIp}</td>
                        <td className="px-4 py-3">{row.uniqueSessions}</td>
                        <td className="px-4 py-3">{row.pageViews}</td>
                        <td className="px-4 py-3">{row.quizStarts}</td>
                        <td className="px-4 py-3">{row.events}</td>
                      </tr>
                    ))}
                    {sortedTopics.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400"
                        >
                          No analytics rows for the current filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
