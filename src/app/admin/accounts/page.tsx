"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import type { AdminAccountFleetSummary } from "@/lib/account/db";

interface LeaderboardProfile {
  actualPlatformRank: number;
  fleetId: string;
  email: string;
  profileId: string;
  callSign: string;
  dashboardAverage: number | null;
  totalAttempts: number;
  scoreCount: number;
  latestScoreAt: string | null;
}

interface AdminAccountsResponse {
  generatedAt: string;
  notes: {
    dashboardRank: string;
    actualPlatformRank: string;
  };
  totals: {
    fleets: number;
    profiles: number;
    activeSessions: number;
    rankedProfiles: number;
  };
  leaderboard: LeaderboardProfile[];
  fleets: AdminAccountFleetSummary[];
}

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function formatPercent(value: number | null) {
  return value === null ? "Unranked" : `${value}%`;
}

function ProfileAvatar({
  imageUrl,
  name,
}: {
  imageUrl: string | null;
  name: string;
}) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-violet-700 text-xs font-bold text-white">
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        name.slice(0, 1).toUpperCase()
      )}
    </span>
  );
}

export default function AdminAccountsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AdminAccountsResponse | null>(null);
  const [expandedFleetIds, setExpandedFleetIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [query, setQuery] = useState("");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/accounts", {
        cache: "no-store",
      });
      const json = (await response.json().catch(() => null)) as
        | AdminAccountsResponse
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(
          json && "error" in json && json.error
            ? json.error
            : "Failed to load platform accounts.",
        );
      }

      setData(json as AdminAccountsResponse);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Failed to load platform accounts.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const filteredFleets = useMemo(() => {
    if (!data) return [];
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return data.fleets;

    return data.fleets.filter((fleet) => {
      if (fleet.email.toLowerCase().includes(normalizedQuery)) return true;
      if (fleet.name.toLowerCase().includes(normalizedQuery)) return true;
      return fleet.profiles.some((profile) =>
        profile.callSign.toLowerCase().includes(normalizedQuery),
      );
    });
  }, [data, query]);

  const visibleLeaderboard = useMemo(() => {
    if (!data) return [];
    return data.leaderboard.slice(0, 25);
  }, [data]);

  function toggleFleet(fleetId: string) {
    setExpandedFleetIds((current) => {
      const next = new Set(current);
      if (next.has(fleetId)) {
        next.delete(fleetId);
      } else {
        next.add(fleetId);
      }
      return next;
    });
  }

  return (
    <main className="min-h-screen bg-[#f4f6f8] px-5 py-10 text-zinc-950 dark:bg-black dark:text-zinc-100">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-violet-700 dark:text-violet-300">
                Admin Observability
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight">
                Platform Accounts
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                Inspect registered emails, fleet profiles, recorded-score ranking,
                and the real recorded-score rank used by the dashboard.
              </p>
              {data ? (
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                  Last generated: {formatDate(data.generatedAt)}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => void fetchData()}
              disabled={isLoading}
              className="rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-violet-600 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500 dark:disabled:bg-zinc-800"
            >
              {isLoading ? "Loading..." : "Refresh"}
            </button>
          </div>
        </header>

        {error ? (
          <section className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm font-semibold text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </section>
        ) : null}

        {data ? (
          <>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-950">
                <p className="text-xs uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                  Registered Emails
                </p>
                <p className="mt-2 text-3xl font-bold">{data.totals.fleets}</p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-950">
                <p className="text-xs uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                  Profiles
                </p>
                <p className="mt-2 text-3xl font-bold">{data.totals.profiles}</p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-950">
                <p className="text-xs uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                  Ranked Profiles
                </p>
                <p className="mt-2 text-3xl font-bold">
                  {data.totals.rankedProfiles}
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-950">
                <p className="text-xs uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                  Active Sessions
                </p>
                <p className="mt-2 text-3xl font-bold">
                  {data.totals.activeSessions}
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-100">
              <p className="font-bold">Dashboard rank explanation</p>
              <p className="mt-2">{data.notes.dashboardRank}</p>
              <p className="mt-3 text-amber-900/80 dark:text-amber-100/80">
                {data.notes.actualPlatformRank}
              </p>
            </section>

            <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-950">
              <div className="border-b border-zinc-200 px-5 py-4 dark:border-white/10">
                <h2 className="text-lg font-bold">Actual Recorded Leaderboard</h2>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Top 25 profiles by recorded dashboard average.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-zinc-50 dark:bg-white/5">
                    <tr>
                      <th className="px-4 py-3 font-bold">Rank</th>
                      <th className="px-4 py-3 font-bold">Profile</th>
                      <th className="px-4 py-3 font-bold">Email</th>
                      <th className="px-4 py-3 font-bold">Average</th>
                      <th className="px-4 py-3 font-bold">Attempts</th>
                      <th className="px-4 py-3 font-bold">Scores</th>
                      <th className="px-4 py-3 font-bold">Latest Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleLeaderboard.map((profile) => (
                      <tr
                        key={profile.profileId}
                        className="border-t border-zinc-100 dark:border-white/10"
                      >
                        <td className="px-4 py-3 font-bold">
                          {profile.actualPlatformRank}
                        </td>
                        <td className="px-4 py-3 font-bold">
                          {profile.callSign}
                        </td>
                        <td className="px-4 py-3">{profile.email}</td>
                        <td className="px-4 py-3">
                          {formatPercent(profile.dashboardAverage)}
                        </td>
                        <td className="px-4 py-3">{profile.totalAttempts}</td>
                        <td className="px-4 py-3">{profile.scoreCount}</td>
                        <td className="px-4 py-3">
                          {formatDate(profile.latestScoreAt)}
                        </td>
                      </tr>
                    ))}
                    {visibleLeaderboard.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400"
                        >
                          No recorded scores yet.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-950">
              <div className="flex flex-col gap-3 border-b border-zinc-200 px-5 py-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold">Registered Fleets</h2>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    Expand each registered email to inspect its profiles.
                  </p>
                </div>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search email, fleet, profile"
                  className="min-h-10 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-semibold outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:border-white/10 dark:bg-black/40 dark:focus:ring-violet-500/20"
                />
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-zinc-50 dark:bg-white/5">
                    <tr>
                      <th className="w-12 px-4 py-3 font-bold" />
                      <th className="px-4 py-3 font-bold">Registered Email</th>
                      <th className="px-4 py-3 font-bold">Profiles</th>
                      <th className="px-4 py-3 font-bold">Active Sessions</th>
                      <th className="px-4 py-3 font-bold">Scores</th>
                      <th className="px-4 py-3 font-bold">Latest Score</th>
                      <th className="px-4 py-3 font-bold">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFleets.map((fleet) => {
                      const isExpanded = expandedFleetIds.has(fleet.fleetId);
                      return (
                        <Fragment key={fleet.fleetId}>
                          <tr className="border-t border-zinc-100 dark:border-white/10">
                            <td className="px-4 py-3">
                              <button
                                type="button"
                                onClick={() => toggleFleet(fleet.fleetId)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-lg font-bold transition hover:bg-zinc-50 dark:border-white/10 dark:hover:bg-white/10"
                                aria-label={
                                  isExpanded
                                    ? `Hide profiles for ${fleet.email}`
                                    : `Show profiles for ${fleet.email}`
                                }
                                aria-expanded={isExpanded}
                              >
                                {isExpanded ? "-" : "+"}
                              </button>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <ProfileAvatar
                                  imageUrl={fleet.imageUrl}
                                  name={fleet.name}
                                />
                                <div>
                                  <p className="font-bold">{fleet.email}</p>
                                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                    {fleet.name}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">{fleet.profileCount}</td>
                            <td className="px-4 py-3">
                              {fleet.activeSessionCount}
                            </td>
                            <td className="px-4 py-3">{fleet.scoreCount}</td>
                            <td className="px-4 py-3">
                              {formatDate(fleet.latestScoreAt)}
                            </td>
                            <td className="px-4 py-3">
                              {formatDate(fleet.createdAt)}
                            </td>
                          </tr>
                          {isExpanded ? (
                            <tr className="border-t border-zinc-100 bg-zinc-50/80 dark:border-white/10 dark:bg-white/5">
                              <td className="px-4 py-4" />
                              <td colSpan={6} className="px-4 py-4">
                                <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-white/10 dark:bg-black/30">
                                  <table className="min-w-full text-left text-xs">
                                    <thead className="bg-zinc-50 text-zinc-500 dark:bg-white/5 dark:text-zinc-400">
                                      <tr>
                                        <th className="px-3 py-2 font-bold">
                                          Profile
                                        </th>
                                        <th className="px-3 py-2 font-bold">
                                          Dashboard Rank
                                        </th>
                                        <th className="px-3 py-2 font-bold">
                                          Actual Rank
                                        </th>
                                        <th className="px-3 py-2 font-bold">
                                          Average
                                        </th>
                                        <th className="px-3 py-2 font-bold">
                                          Attempts
                                        </th>
                                        <th className="px-3 py-2 font-bold">
                                          Radar
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {fleet.profiles.map((profile) => (
                                        <tr
                                          key={profile.id}
                                          className="border-t border-zinc-100 dark:border-white/10"
                                        >
                                          <td className="px-3 py-2">
                                            <div className="flex items-center gap-3">
                                              <ProfileAvatar
                                                imageUrl={profile.imageUrl}
                                                name={profile.callSign}
                                              />
                                              <div>
                                                <p className="font-bold text-zinc-900 dark:text-zinc-100">
                                                  {profile.callSign}
                                                </p>
                                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                                  {profile.isDefault
                                                    ? "Default"
                                                    : "Additional"}
                                                </p>
                                              </div>
                                            </div>
                                          </td>
                                          <td className="px-3 py-2 font-bold">
                                            {profile.dashboardRank}
                                          </td>
                                          <td className="px-3 py-2">
                                            {profile.actualPlatformRank ?? "-"}
                                          </td>
                                          <td className="px-3 py-2">
                                            {formatPercent(profile.dashboardAverage)}
                                          </td>
                                          <td className="px-3 py-2">
                                            {profile.totalAttempts}
                                          </td>
                                          <td className="px-3 py-2">
                                            <div className="flex flex-wrap gap-1">
                                              {profile.radar.map((point) => (
                                                <span
                                                  key={point.slug}
                                                  className="rounded-full bg-zinc-100 px-2 py-1 text-[11px] font-bold text-zinc-600 dark:bg-white/10 dark:text-zinc-300"
                                                >
                                                  {point.label}: {point.value}% (
                                                  {point.attempts})
                                                </span>
                                              ))}
                                            </div>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          ) : null}
                        </Fragment>
                      );
                    })}
                    {filteredFleets.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400"
                        >
                          No registered fleets match this search.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
