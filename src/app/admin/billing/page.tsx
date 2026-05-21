"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AdminBillingFleet, QuizAccessRule } from "@/lib/account/db";
import { topics } from "@/lib/topics";

interface AdminBillingResponse {
  generatedAt: string;
  fleets: AdminBillingFleet[];
  quizAccess: QuizAccessRule[];
}

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function paidLabel(status: string) {
  return status === "active" || status === "trialing" ? "Paid" : "Free";
}

export default function AdminBillingPage() {
  const [data, setData] = useState<AdminBillingResponse | null>(null);
  const [query, setQuery] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/billing", { cache: "no-store" });
      const json = (await response.json().catch(() => null)) as
        | AdminBillingResponse
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(
          json && "error" in json && json.error
            ? json.error
            : "Failed to load billing config.",
        );
      }

      setData(json as AdminBillingResponse);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Failed to load billing config.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const filteredFleets = useMemo(() => {
    const fleets = data?.fleets ?? [];
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return fleets;

    return fleets.filter(
      (fleet) =>
        fleet.email.toLowerCase().includes(normalizedQuery) ||
        fleet.name.toLowerCase().includes(normalizedQuery),
    );
  }, [data, query]);

  async function patchBilling(body: Record<string, unknown>, key: string) {
    setPendingKey(key);
    setError(null);

    try {
      const response = await fetch("/api/admin/billing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await response.json().catch(() => null)) as
        | { overview?: AdminBillingResponse; error?: string }
        | null;

      if (!response.ok) {
        throw new Error(json?.error ?? "Failed to update billing config.");
      }

      if (json?.overview) setData(json.overview);
    } catch (patchError) {
      setError(
        patchError instanceof Error
          ? patchError.message
          : "Failed to update billing config.",
      );
    } finally {
      setPendingKey(null);
    }
  }

  async function markEmailPaid() {
    const email = newEmail.trim();
    if (!email) return;

    await patchBilling(
      { type: "fleet", email, status: "active" },
      `email:${email}`,
    );
    setNewEmail("");
  }

  const rulesBySlug = new Map(
    (data?.quizAccess ?? []).map((rule) => [rule.topicSlug, rule]),
  );

  return (
    <main className="min-h-screen bg-[#f4f6f8] px-5 py-10 text-zinc-950 dark:bg-black dark:text-zinc-100">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-violet-700 dark:text-violet-300">
                Manual Payment Gateway
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight">
                Billing Access
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                Mark registered fleet emails as paid and control which quizzes
                require paid access. Admin verification is intentionally not
                enabled yet.
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

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-950">
            <p className="text-xs uppercase text-zinc-500 dark:text-zinc-400">
              Registered Fleets
            </p>
            <p className="mt-2 text-3xl font-bold">{data?.fleets.length ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-950">
            <p className="text-xs uppercase text-zinc-500 dark:text-zinc-400">
              Paid Fleets
            </p>
            <p className="mt-2 text-3xl font-bold">
              {data?.fleets.filter((fleet) => paidLabel(fleet.subscriptionStatus) === "Paid")
                .length ?? 0}
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-950">
            <p className="text-xs uppercase text-zinc-500 dark:text-zinc-400">
              Locked Quizzes
            </p>
            <p className="mt-2 text-3xl font-bold">
              {data?.quizAccess.filter((rule) => rule.isLocked).length ?? 0}
            </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-950">
          <div className="flex flex-col gap-3 border-b border-zinc-200 px-5 py-4 dark:border-white/10 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold">Manual Paid Fleets</h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Use registered email addresses. Paid fleets can access every
                quiz regardless of lock settings.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search email"
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-500 dark:border-white/10 dark:bg-black"
              />
              <input
                value={newEmail}
                onChange={(event) => setNewEmail(event.target.value)}
                placeholder="email@domain.com"
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-500 dark:border-white/10 dark:bg-black"
              />
              <button
                type="button"
                onClick={() => void markEmailPaid()}
                disabled={!newEmail.trim() || pendingKey !== null}
                className="rounded-xl bg-zinc-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
              >
                Mark Paid
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-zinc-50 dark:bg-white/5">
                <tr>
                  <th className="px-4 py-3 font-bold">Email</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 font-bold">Provider</th>
                  <th className="px-4 py-3 font-bold">Profiles</th>
                  <th className="px-4 py-3 font-bold">Sessions</th>
                  <th className="px-4 py-3 font-bold">Updated</th>
                  <th className="px-4 py-3 font-bold">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredFleets.map((fleet) => {
                  const isPaid = paidLabel(fleet.subscriptionStatus) === "Paid";
                  const key = `fleet:${fleet.fleetId}`;
                  return (
                    <tr
                      key={fleet.fleetId}
                      className="border-t border-zinc-100 dark:border-white/10"
                    >
                      <td className="px-4 py-3">
                        <p className="font-bold">{fleet.email}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {fleet.name}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                            isPaid
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200"
                              : "bg-zinc-100 text-zinc-600 dark:bg-white/10 dark:text-zinc-300"
                          }`}
                        >
                          {paidLabel(fleet.subscriptionStatus)}
                        </span>
                      </td>
                      <td className="px-4 py-3">{fleet.provider ?? "-"}</td>
                      <td className="px-4 py-3">{fleet.profileCount}</td>
                      <td className="px-4 py-3">{fleet.activeSessionCount}</td>
                      <td className="px-4 py-3">{formatDate(fleet.updatedAt)}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          disabled={pendingKey !== null}
                          onClick={() =>
                            void patchBilling(
                              {
                                type: "fleet",
                                fleetId: fleet.fleetId,
                                status: isPaid ? "not_started" : "active",
                              },
                              key,
                            )
                          }
                          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-bold transition hover:border-violet-300 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:hover:border-violet-400 dark:hover:text-violet-200"
                        >
                          {pendingKey === key
                            ? "Saving..."
                            : isPaid
                              ? "Mark Free"
                              : "Mark Paid"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-950">
          <div className="border-b border-zinc-200 px-5 py-4 dark:border-white/10">
            <h2 className="text-lg font-bold">Quiz Lock Config</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Locked quizzes require paid access for free fleets.
            </p>
          </div>
          <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
            {topics.map((topic) => {
              const rule = rulesBySlug.get(topic.slug);
              const isLocked = rule?.isLocked ?? Boolean(topic.isLocked);
              const key = `quiz:${topic.slug}`;
              return (
                <div
                  key={topic.slug}
                  className="rounded-xl border border-zinc-200 p-4 dark:border-white/10"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold">{topic.title}</p>
                      <p className="mt-1 text-xs capitalize text-zinc-500 dark:text-zinc-400">
                        {topic.category.replaceAll("-", " ")}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                        isLocked
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-100"
                          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200"
                      }`}
                    >
                      {isLocked ? "Locked" : "Free"}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={pendingKey !== null}
                    onClick={() =>
                      void patchBilling(
                        {
                          type: "quiz",
                          topicSlug: topic.slug,
                          isLocked: !isLocked,
                        },
                        key,
                      )
                    }
                    className="mt-4 w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs font-bold transition hover:border-violet-300 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:hover:border-violet-400 dark:hover:text-violet-200"
                  >
                    {pendingKey === key
                      ? "Saving..."
                      : isLocked
                        ? "Unlock for Free"
                        : "Require Paid"}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
