"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  AdminBillingFleet,
  ManualPaymentConfig,
  ManualPaymentSlip,
  QuizAccessRule,
  SubscriptionPackage,
} from "@/lib/account/db";
import SlipViewerModal from "@/components/account/SlipViewerModal";
import { topics } from "@/lib/topics";

interface AdminBillingResponse {
  generatedAt: string;
  fleets: AdminBillingFleet[];
  quizAccess: QuizAccessRule[];
  manualPaymentSlips: ManualPaymentSlip[];
  manualPaymentConfig: ManualPaymentConfig;
  subscriptionPackages: SubscriptionPackage[];
}

type SlipTimeSort = "newest" | "oldest";

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function paidLabel(status: string) {
  return status === "active" || status === "trialing" ? "Paid" : "Free";
}

function formatAmount(value: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
  }).format(value);
}

function versionedImageUrl(url: string, version: string | number | null | undefined) {
  if (!url) return "";
  if (!version) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}v=${encodeURIComponent(String(version))}`;
}

function slipStatusClass(status: ManualPaymentSlip["status"]) {
  if (status === "approved") {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200";
  }
  if (status === "rejected") {
    return "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-200";
  }
  return "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-100";
}

export default function AdminBillingPage() {
  const [data, setData] = useState<AdminBillingResponse | null>(null);
  const [query, setQuery] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [slipTimeSort, setSlipTimeSort] = useState<SlipTimeSort>("newest");
  const [selectedSlip, setSelectedSlip] = useState<ManualPaymentSlip | null>(
    null,
  );

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
  const pendingSlipCount =
    data?.manualPaymentSlips.filter((slip) => slip.status === "pending").length ??
    0;
  const sortedManualPaymentSlips = useMemo(() => {
    const slips = [...(data?.manualPaymentSlips ?? [])];
    return slips.sort((first, second) => {
      const firstTime = new Date(first.createdAt).getTime();
      const secondTime = new Date(second.createdAt).getTime();
      return slipTimeSort === "newest"
        ? secondTime - firstTime
        : firstTime - secondTime;
    });
  }, [data?.manualPaymentSlips, slipTimeSort]);

  async function reviewSlip(
    slip: ManualPaymentSlip,
    action: "approve" | "reject",
  ) {
    const rejectionReason =
      action === "reject"
        ? window.prompt("Reason for rejecting this slip?") || "Rejected by admin"
        : undefined;

    await patchBilling(
      {
        type: "slip",
        slipId: slip.id,
        action,
        reviewedBy: "admin",
        rejectionReason,
      },
      `slip:${slip.id}:${action}`,
    );
  }

  async function updatePackage(
    event: React.FormEvent<HTMLFormElement>,
    packageKey: string,
  ) {
    event.preventDefault();
    setPendingKey(`package:${packageKey}`);
    setError(null);

    try {
      const formData = new FormData(event.currentTarget);
      const response = await fetch(`/api/admin/billing/packages/${packageKey}`, {
        method: "PATCH",
        body: formData,
      });
      const json = (await response.json().catch(() => null)) as
        | { overview?: AdminBillingResponse; error?: string }
        | null;

      if (!response.ok) {
        throw new Error(json?.error ?? "Failed to update package.");
      }

      if (json?.overview) setData(json.overview);
    } catch (packageError) {
      setError(
        packageError instanceof Error
          ? packageError.message
          : "Failed to update package.",
      );
    } finally {
      setPendingKey(null);
    }
  }

  async function updatePaymentQr(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPendingKey("payment-qr");
    setError(null);

    try {
      const formData = new FormData(event.currentTarget);
      const response = await fetch("/api/admin/billing/payment-qr", {
        method: "PATCH",
        body: formData,
      });
      const json = (await response.json().catch(() => null)) as
        | { overview?: AdminBillingResponse; error?: string }
        | null;

      if (!response.ok) {
        throw new Error(json?.error ?? "Failed to update payment QR.");
      }

      if (json?.overview) setData(json.overview);
      event.currentTarget.reset();
    } catch (qrError) {
      setError(
        qrError instanceof Error
          ? qrError.message
          : "Failed to update payment QR.",
      );
    } finally {
      setPendingKey(null);
    }
  }

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

        <section className="grid gap-4 md:grid-cols-4">
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
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-950">
            <p className="text-xs uppercase text-zinc-500 dark:text-zinc-400">
              Pending Slips
            </p>
            <p className="mt-2 text-3xl font-bold">{pendingSlipCount}</p>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-950">
          <div className="flex flex-col gap-3 border-b border-zinc-200 px-5 py-4 dark:border-white/10 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-lg font-bold">Payment Slip Approvals</h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Slip2Go-approved slips unlock automatically. Pending slips can
                still be approved manually when the verifier is unavailable.
              </p>
              {data?.manualPaymentConfig ? (
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                  Receiving account: {data.manualPaymentConfig.bankName} ·{" "}
                  {data.manualPaymentConfig.accountName || "No account name"} ·{" "}
                  {data.manualPaymentConfig.accountNumber || "No account number"}
                </p>
              ) : null}
            </div>
            <label className="flex items-center gap-2 text-sm font-bold">
              Time
              <select
                value={slipTimeSort}
                onChange={(event) =>
                  setSlipTimeSort(event.target.value as SlipTimeSort)
                }
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-500 dark:border-white/10 dark:bg-black"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </label>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-zinc-50 dark:bg-white/5">
                <tr>
                  <th className="px-4 py-3 font-bold">
                    <button
                      type="button"
                      onClick={() =>
                        setSlipTimeSort((current) =>
                          current === "newest" ? "oldest" : "newest",
                        )
                      }
                      className="inline-flex items-center gap-1 font-bold text-zinc-950 hover:text-violet-700 dark:text-zinc-100 dark:hover:text-violet-300"
                    >
                      Submitted
                      <span className="text-xs">
                        {slipTimeSort === "newest" ? "↓" : "↑"}
                      </span>
                    </button>
                  </th>
                  <th className="px-4 py-3 font-bold">Fleet</th>
                  <th className="px-4 py-3 font-bold">Package</th>
                  <th className="px-4 py-3 font-bold">Amount</th>
                  <th className="px-4 py-3 font-bold">Reference</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 font-bold">Slip</th>
                  <th className="px-4 py-3 font-bold">Action</th>
                </tr>
              </thead>
              <tbody>
                {sortedManualPaymentSlips.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="border-t border-zinc-100 px-4 py-6 text-center text-zinc-500 dark:border-white/10 dark:text-zinc-400"
                    >
                      No payment slips submitted yet.
                    </td>
                  </tr>
                ) : (
                  sortedManualPaymentSlips.map((slip) => {
                    const approveKey = `slip:${slip.id}:approve`;
                    const rejectKey = `slip:${slip.id}:reject`;
                    return (
                      <tr
                        key={slip.id}
                        className="border-t border-zinc-100 dark:border-white/10"
                      >
                        <td className="px-4 py-3">{formatDate(slip.createdAt)}</td>
                        <td className="px-4 py-3">
                          <p className="font-bold">{slip.email}</p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            {slip.callSign ?? "-"}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          {slip.planTitle ?? slip.planKey}
                        </td>
                        <td className="px-4 py-3">
                          {formatAmount(slip.amountThb)}
                        </td>
                        <td className="max-w-xs px-4 py-3">
                          <p className="truncate">
                            {slip.slip2goTransRef ||
                              slip.transferReference ||
                              slip.miniQrPayload ||
                              "-"}
                          </p>
                          {slip.slip2goStatus ? (
                            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                              Slip2Go: {slip.slip2goStatus}
                              {slip.slip2goAmountThb
                                ? ` · ${formatAmount(slip.slip2goAmountThb)}`
                                : ""}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-bold ${slipStatusClass(slip.status)}`}
                          >
                            {slip.status}
                          </span>
                          {slip.verificationError ? (
                            <p className="mt-1 max-w-xs text-xs text-red-600 dark:text-red-300">
                              {slip.verificationError}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => setSelectedSlip(slip)}
                            className="font-bold text-violet-700 hover:text-violet-500 dark:text-violet-300"
                          >
                            View
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          {slip.status === "pending" ? (
                            <div className="flex gap-2">
                              <button
                                type="button"
                                disabled={pendingKey !== null}
                                onClick={() => void reviewSlip(slip, "approve")}
                                className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-500/30 dark:text-emerald-200 dark:hover:bg-emerald-500/10"
                              >
                                {pendingKey === approveKey
                                  ? "Saving..."
                                  : "Approve"}
                              </button>
                              <button
                                type="button"
                                disabled={pendingKey !== null}
                                onClick={() => void reviewSlip(slip, "reject")}
                                className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-500/30 dark:text-red-200 dark:hover:bg-red-500/10"
                              >
                                {pendingKey === rejectKey
                                  ? "Saving..."
                                  : "Reject"}
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">
                              {slip.reviewedAt
                                ? `Reviewed ${formatDate(slip.reviewedAt)}`
                                : "-"}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-950">
          <div className="border-b border-zinc-200 px-5 py-4 dark:border-white/10">
            <h2 className="text-lg font-bold">Package Management</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Adjust subscription card text, price, package image, and display
              order. Payment uses the shared receiving QR below.
            </p>
          </div>
          <form
            onSubmit={(event) => void updatePaymentQr(event)}
            className="m-5 grid gap-4 rounded-xl border border-violet-200 bg-violet-50 p-4 dark:border-violet-500/20 dark:bg-violet-500/10 lg:grid-cols-[220px_1fr_auto]"
          >
            <div className="overflow-hidden rounded-xl bg-white p-3 dark:bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={versionedImageUrl(
                  data?.manualPaymentConfig.paymentQrImageUrl ?? "",
                  data?.generatedAt,
                )}
                alt="Shared payment QR"
                className="h-44 w-full object-contain"
              />
            </div>
            <div>
              <p className="text-sm font-bold">Shared Reusable Payment QR</p>
              <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                Upload the single Krungthai receiving QR used for every package.
                Users will manually enter the exact package amount, and Slip2Go
                will verify the uploaded slip amount against the system price.
              </p>
              <label className="mt-4 block">
                <span className="text-xs font-bold">Payment QR Image</span>
                <input
                  name="paymentQrImage"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  required
                  className="mt-1 w-full text-xs"
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={pendingKey !== null}
              className="self-end rounded-lg bg-violet-700 px-4 py-2 text-xs font-bold text-white transition hover:bg-violet-600 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500"
            >
              {pendingKey === "payment-qr" ? "Saving..." : "Save QR"}
            </button>
          </form>
          <div className="grid gap-4 p-5 lg:grid-cols-3">
            {(data?.subscriptionPackages ?? []).map((pkg) => {
              const key = `package:${pkg.key}`;
              return (
                <form
                  key={pkg.key}
                  onSubmit={(event) => void updatePackage(event, pkg.key)}
                  className="space-y-3 rounded-xl border border-zinc-200 p-4 dark:border-white/10"
                >
                  <div className="overflow-hidden rounded-xl bg-zinc-100 dark:bg-white/5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={versionedImageUrl(pkg.imageUrl, pkg.updatedAt)}
                      alt=""
                      className="h-28 w-full object-cover"
                    />
                  </div>

                  <label className="block">
                    <span className="text-xs font-bold">Title</span>
                    <input
                      name="title"
                      defaultValue={pkg.title}
                      className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-black"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold">Description</span>
                    <textarea
                      name="description"
                      defaultValue={pkg.description}
                      rows={2}
                      className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-black"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold">
                      Details (one per line)
                    </span>
                    <textarea
                      name="details"
                      defaultValue={pkg.details.join("\n")}
                      rows={4}
                      className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-black"
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="text-xs font-bold">Price THB</span>
                      <input
                        name="priceThb"
                        defaultValue={String(pkg.priceThb)}
                        inputMode="decimal"
                        className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-black"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-bold">Sort</span>
                      <input
                        name="sortOrder"
                        defaultValue={String(pkg.sortOrder)}
                        inputMode="numeric"
                        className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-black"
                      />
                    </label>
                  </div>
                  <input type="hidden" name="currency" value={pkg.currency} />
                  <input type="hidden" name="isActive" value="false" />
                  <label className="flex items-center gap-2 text-sm font-bold">
                    <input
                      name="isActive"
                      type="checkbox"
                      value="true"
                      defaultChecked={pkg.isActive}
                      className="h-4 w-4 accent-violet-700"
                    />
                    Active
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold">Card Image</span>
                    <input
                      name="image"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="mt-1 w-full text-xs"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={pendingKey !== null}
                    className="w-full rounded-lg bg-violet-700 px-3 py-2 text-xs font-bold text-white transition hover:bg-violet-600 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500"
                  >
                    {pendingKey === key ? "Saving..." : "Save Package"}
                  </button>
                </form>
              );
            })}
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
      <SlipViewerModal
        slip={selectedSlip}
        fileUrl={
          selectedSlip
            ? `/api/account/billing/slips/${selectedSlip.id}/file?admin=1`
            : ""
        }
        onClose={() => setSelectedSlip(null)}
      />
    </main>
  );
}
