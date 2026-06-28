"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  AdminBillingFleet,
  ManualPaymentConfig,
  ManualPaymentSlip,
  PromotionCode,
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
  promotionCodes: PromotionCode[];
}

type SlipTimeSort = "newest" | "oldest";

const TABLE_PAGE_SIZE = 10;

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function formatDateOnly(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function isPaidSubscription(
  status: string,
  currentPeriodEnd: string | null | undefined,
) {
  if (status !== "active" && status !== "trialing") return false;
  if (!currentPeriodEnd) return true;
  return new Date(currentPeriodEnd).getTime() > Date.now();
}

function paidLabel(status: string, currentPeriodEnd?: string | null) {
  return isPaidSubscription(status, currentPeriodEnd) ? "Paid" : "Free";
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

function isCaptainProMaxDeal(value: Pick<ManualPaymentSlip, "planKey">) {
  return value.planKey === "captain-pro-max";
}

function getPageCount(totalItems: number) {
  return Math.max(1, Math.ceil(totalItems / TABLE_PAGE_SIZE));
}

function getPageWindow(totalItems: number, page: number) {
  if (totalItems === 0) {
    return { start: 0, end: 0 };
  }

  const start = (page - 1) * TABLE_PAGE_SIZE + 1;
  const end = Math.min(page * TABLE_PAGE_SIZE, totalItems);
  return { start, end };
}

function TablePagination({
  label,
  page,
  pageCount,
  totalItems,
  onPageChange,
}: {
  label: string;
  page: number;
  pageCount: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}) {
  const { start, end } = getPageWindow(totalItems, page);

  return (
    <div className="flex flex-col gap-3 border-t border-zinc-100 px-4 py-3 text-sm text-zinc-500 dark:border-white/10 dark:text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
      <p>
        Showing {start}-{end} of {totalItems} {label}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-bold text-zinc-700 transition hover:border-violet-300 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-zinc-200 dark:hover:border-violet-400 dark:hover:text-violet-200"
        >
          Previous
        </button>
        <span className="min-w-20 text-center text-xs font-bold text-zinc-700 dark:text-zinc-200">
          Page {page} / {pageCount}
        </span>
        <button
          type="button"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-bold text-zinc-700 transition hover:border-violet-300 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-zinc-200 dark:hover:border-violet-400 dark:hover:text-violet-200"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default function AdminBillingPage() {
  const [data, setData] = useState<AdminBillingResponse | null>(null);
  const [query, setQuery] = useState("");
  const [slipReferenceQuery, setSlipReferenceQuery] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [slipTimeSort, setSlipTimeSort] = useState<SlipTimeSort>("newest");
  const [selectedSlip, setSelectedSlip] = useState<ManualPaymentSlip | null>(
    null,
  );
  const [selectedPromotionCodes, setSelectedPromotionCodes] = useState<
    Set<string>
  >(new Set());
  const [slipPage, setSlipPage] = useState(1);
  const [fleetPage, setFleetPage] = useState(1);
  const [sharedPromotionPage, setSharedPromotionPage] = useState(1);
  const [oneTimePromotionPage, setOneTimePromotionPage] = useState(1);

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

  useEffect(() => {
    setFleetPage(1);
  }, [query]);

  useEffect(() => {
    setSlipPage(1);
  }, [slipReferenceQuery, slipTimeSort]);

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
    const normalizedReferenceQuery = slipReferenceQuery.trim().toLowerCase();
    const slips = (data?.manualPaymentSlips ?? []).filter((slip) => {
      if (!normalizedReferenceQuery) return true;
      return [
        slip.slip2goTransRef,
        slip.transferReference,
        slip.miniQrPayload,
        slip.email,
        slip.planTitle,
        slip.planKey,
      ].some((value) =>
        String(value ?? "").toLowerCase().includes(normalizedReferenceQuery),
      );
    });
    return slips.sort((first, second) => {
      const firstTime = new Date(first.createdAt).getTime();
      const secondTime = new Date(second.createdAt).getTime();
      return slipTimeSort === "newest"
        ? secondTime - firstTime
        : firstTime - secondTime;
    });
  }, [data?.manualPaymentSlips, slipReferenceQuery, slipTimeSort]);

  const fleetPageCount = getPageCount(filteredFleets.length);
  const activeFleetPage = Math.min(fleetPage, fleetPageCount);
  const visibleFleets = useMemo(() => {
    const start = (activeFleetPage - 1) * TABLE_PAGE_SIZE;
    return filteredFleets.slice(start, start + TABLE_PAGE_SIZE);
  }, [activeFleetPage, filteredFleets]);

  const slipPageCount = getPageCount(sortedManualPaymentSlips.length);
  const activeSlipPage = Math.min(slipPage, slipPageCount);
  const visibleManualPaymentSlips = useMemo(() => {
    const start = (activeSlipPage - 1) * TABLE_PAGE_SIZE;
    return sortedManualPaymentSlips.slice(start, start + TABLE_PAGE_SIZE);
  }, [activeSlipPage, sortedManualPaymentSlips]);
  const sharedPromotionCodes = useMemo(
    () =>
      (data?.promotionCodes ?? []).filter(
        (promotion) => promotion.promotionType === "shared",
      ),
    [data?.promotionCodes],
  );
  const oneTimePromotionCodes = useMemo(
    () =>
      (data?.promotionCodes ?? []).filter(
        (promotion) => promotion.promotionType === "one_time",
      ),
    [data?.promotionCodes],
  );
  const selectedPromotionList = useMemo(
    () => Array.from(selectedPromotionCodes),
    [selectedPromotionCodes],
  );
  const sharedPromotionPageCount = getPageCount(sharedPromotionCodes.length);
  const activeSharedPromotionPage = Math.min(
    sharedPromotionPage,
    sharedPromotionPageCount,
  );
  const visibleSharedPromotionCodes = useMemo(() => {
    const start = (activeSharedPromotionPage - 1) * TABLE_PAGE_SIZE;
    return sharedPromotionCodes.slice(start, start + TABLE_PAGE_SIZE);
  }, [activeSharedPromotionPage, sharedPromotionCodes]);
  const oneTimePromotionPageCount = getPageCount(oneTimePromotionCodes.length);
  const activeOneTimePromotionPage = Math.min(
    oneTimePromotionPage,
    oneTimePromotionPageCount,
  );
  const visibleOneTimePromotionCodes = useMemo(() => {
    const start = (activeOneTimePromotionPage - 1) * TABLE_PAGE_SIZE;
    return oneTimePromotionCodes.slice(start, start + TABLE_PAGE_SIZE);
  }, [activeOneTimePromotionPage, oneTimePromotionCodes]);

  function openSlipFromFleet(slipId: string | null) {
    if (!slipId) return;

    const slip = data?.manualPaymentSlips.find((item) => item.id === slipId);
    if (slip) {
      setSelectedSlip(slip);
      setSlipReferenceQuery(slip.slip2goTransRef ?? "");
      setSlipPage(1);
      document
        .getElementById("payment-slip-approvals")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

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

  async function togglePersonalFilesSent(slip: ManualPaymentSlip) {
    await patchBilling(
      {
        type: "personal-files",
        slipId: slip.id,
        sent: !slip.personalFilesSentAt,
      },
      `personal-files:${slip.id}`,
    );
  }

  async function togglePersonalFilesSentBySlipId(
    slipId: string,
    sent: boolean,
  ) {
    await patchBilling(
      {
        type: "personal-files",
        slipId,
        sent,
      },
      `personal-files:${slipId}`,
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

  async function savePromotion(
    event: React.FormEvent<HTMLFormElement>,
    code?: string,
  ) {
    event.preventDefault();
    const key = code ? `promotion:${code}` : "promotion:new";
    setPendingKey(key);
    setError(null);

    try {
      const formData = new FormData(event.currentTarget);
      const response = await fetch(
        code
          ? `/api/admin/billing/promotions/${encodeURIComponent(code)}`
          : "/api/admin/billing/promotions",
        {
          method: code ? "PATCH" : "POST",
          body: formData,
        },
      );
      const json = (await response.json().catch(() => null)) as
        | { overview?: AdminBillingResponse; error?: string }
        | null;

      if (!response.ok) {
        throw new Error(json?.error ?? "Failed to save promotion.");
      }

      if (json?.overview) setData(json.overview);
      setSelectedPromotionCodes(new Set());
      if (!code) event.currentTarget.reset();
    } catch (promotionError) {
      const message =
        promotionError instanceof Error
          ? promotionError.message
          : "Failed to save promotion.";
      setError(message);
      if (!code) window.alert(message);
    } finally {
      setPendingKey(null);
    }
  }

  async function deletePromotion(code: string) {
    if (!window.confirm(`Delete promotion code ${code}?`)) return;

    const key = `promotion:${code}:delete`;
    setPendingKey(key);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/billing/promotions/${encodeURIComponent(code)}`,
        { method: "DELETE" },
      );
      const json = (await response.json().catch(() => null)) as
        | { overview?: AdminBillingResponse; error?: string }
        | null;

      if (!response.ok) {
        throw new Error(json?.error ?? "Failed to delete promotion.");
      }

      if (json?.overview) setData(json.overview);
      setSelectedPromotionCodes((current) => {
        const next = new Set(current);
        next.delete(code);
        return next;
      });
    } catch (promotionError) {
      setError(
        promotionError instanceof Error
          ? promotionError.message
          : "Failed to delete promotion.",
      );
    } finally {
      setPendingKey(null);
    }
  }

  function togglePromotionSelection(code: string, checked: boolean) {
    setSelectedPromotionCodes((current) => {
      const next = new Set(current);
      if (checked) next.add(code);
      else next.delete(code);
      return next;
    });
  }

  function setPromotionGroupSelection(codes: string[], checked: boolean) {
    setSelectedPromotionCodes((current) => {
      const next = new Set(current);
      for (const code of codes) {
        if (checked) next.add(code);
        else next.delete(code);
      }
      return next;
    });
  }

  async function bulkPromotionAction(action: "activate" | "deactivate" | "delete") {
    if (selectedPromotionList.length === 0) {
      window.alert("Select at least one promotion code.");
      return;
    }
    if (
      action === "delete" &&
      !window.confirm(`Delete ${selectedPromotionList.length} promotion codes?`)
    ) {
      return;
    }

    const key = `promotion:bulk:${action}`;
    setPendingKey(key);
    setError(null);

    try {
      const response = await fetch("/api/admin/billing/promotions", {
        method: action === "delete" ? "DELETE" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codes: selectedPromotionList,
          action,
        }),
      });
      const json = (await response.json().catch(() => null)) as
        | { overview?: AdminBillingResponse; error?: string }
        | null;

      if (!response.ok) {
        throw new Error(json?.error ?? "Failed to update promotion codes.");
      }

      if (json?.overview) setData(json.overview);
      setSelectedPromotionCodes(new Set());
    } catch (promotionError) {
      const message =
        promotionError instanceof Error
          ? promotionError.message
          : "Failed to update promotion codes.";
      setError(message);
      window.alert(message);
    } finally {
      setPendingKey(null);
    }
  }

  function renderPromotionTable({
    title,
    promotions,
    visiblePromotions,
    page,
    pageCount,
    onPageChange,
  }: {
    title: string;
    promotions: PromotionCode[];
    visiblePromotions: PromotionCode[];
    page: number;
    pageCount: number;
    onPageChange: (page: number) => void;
  }) {
    const groupCodes = promotions.map((promotion) => promotion.code);
    const allSelected =
      groupCodes.length > 0 &&
      groupCodes.every((code) => selectedPromotionCodes.has(code));

    return (
      <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-white/10">
        <div className="flex items-center justify-between gap-3 border-b border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-white/10 dark:bg-white/5">
          <label className="flex items-center gap-2 text-sm font-bold">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={(event) =>
                setPromotionGroupSelection(groupCodes, event.target.checked)
              }
              className="h-4 w-4 accent-violet-700"
            />
            {title}
          </label>
          <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
            {promotions.length} codes
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-white/5">
              <tr>
                <th className="px-4 py-3 font-bold">Select</th>
                <th className="px-4 py-3 font-bold">Code</th>
                <th className="px-4 py-3 font-bold">Package</th>
                <th className="px-4 py-3 font-bold">Discount</th>
                <th className="px-4 py-3 font-bold">Usage</th>
                <th className="px-4 py-3 font-bold">Period</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold">Action</th>
              </tr>
            </thead>
            <tbody>
              {promotions.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="border-t border-zinc-100 px-4 py-5 text-center text-zinc-500 dark:border-white/10 dark:text-zinc-400"
                  >
                    No {title.toLowerCase()} configured.
                  </td>
                </tr>
              ) : (
                visiblePromotions.map((promotion) => {
                  const isSelected = selectedPromotionCodes.has(promotion.code);
                  const deleteKey = `promotion:${promotion.code}:delete`;
                  return (
                    <tr
                      key={promotion.code}
                      className="border-t border-zinc-100 dark:border-white/10"
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(event) =>
                            togglePromotionSelection(
                              promotion.code,
                              event.target.checked,
                            )
                          }
                          className="h-4 w-4 accent-violet-700"
                        />
                      </td>
                      <td className="px-4 py-3 font-bold">{promotion.code}</td>
                      <td className="px-4 py-3">{promotion.packageKey}</td>
                      <td className="px-4 py-3">
                        {promotion.discountType === "percent"
                          ? `${promotion.discountValue}%`
                          : formatAmount(promotion.discountValue)}
                      </td>
                      <td className="px-4 py-3">
                        {promotion.redeemedCount}
                        {promotion.maxRedemptions
                          ? ` / ${promotion.maxRedemptions}`
                          : " / unlimited"}
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400">
                        {promotion.promotionType === "one_time" ? (
                          "Forever"
                        ) : (
                          <>
                            <p>Start {formatDateOnly(promotion.startsAt)}</p>
                            <p>End {formatDateOnly(promotion.endsAt)}</p>
                          </>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                            promotion.isActive
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200"
                              : "bg-zinc-100 text-zinc-600 dark:bg-white/10 dark:text-zinc-300"
                          }`}
                        >
                          {promotion.isActive ? "active" : "inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          disabled={pendingKey !== null}
                          onClick={() => void deletePromotion(promotion.code)}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-500/30 dark:text-red-200 dark:hover:bg-red-500/10"
                        >
                          {pendingKey === deleteKey ? "Deleting..." : "Delete"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <TablePagination
          label="codes"
          page={page}
          pageCount={pageCount}
          totalItems={promotions.length}
          onPageChange={onPageChange}
        />
      </div>
    );
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
              {data?.fleets.filter((fleet) =>
                isPaidSubscription(fleet.subscriptionStatus, fleet.currentPeriodEnd),
              ).length ?? 0}
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

        <section
          id="payment-slip-approvals"
          className="scroll-mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-950"
        >
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
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                value={slipReferenceQuery}
                onChange={(event) => setSlipReferenceQuery(event.target.value)}
                placeholder="Search ref no."
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-500 dark:border-white/10 dark:bg-black"
              />
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
                      {slipReferenceQuery.trim()
                        ? "No payment slips match this reference."
                        : "No payment slips submitted yet."}
                    </td>
                  </tr>
                ) : (
                  visibleManualPaymentSlips.map((slip) => {
                    const approveKey = `slip:${slip.id}:approve`;
                    const rejectKey = `slip:${slip.id}:reject`;
                    const filesKey = `personal-files:${slip.id}`;
                    const isSpecialDeal = isCaptainProMaxDeal(slip);
                    return (
                      <tr
                        key={slip.id}
                        className={`border-t border-zinc-100 dark:border-white/10 ${
                          isSpecialDeal
                            ? "bg-amber-50/70 dark:bg-amber-500/10"
                            : ""
                        }`}
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
                          {isSpecialDeal ? (
                            <p className="mt-1 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-500/20 dark:text-amber-100">
                              Captain Pro Max
                            </p>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          {formatAmount(slip.amountThb)}
                          {slip.promotionCode ? (
                            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                              {slip.promotionCode}:{" "}
                              {slip.originalAmountThb !== null
                                ? formatAmount(slip.originalAmountThb)
                                : "-"}{" "}
                              {slip.discountThb >= 0 ? "-" : "+"}{" "}
                              {formatAmount(Math.abs(slip.discountThb))}
                            </p>
                          ) : null}
                          {isSpecialDeal ? (
                            <p className="mt-1 text-xs font-bold text-amber-700 dark:text-amber-200">
                              Personal files{" "}
                              {slip.personalFilesSentAt
                                ? `sent ${formatDate(slip.personalFilesSentAt)}`
                                : "not sent"}
                            </p>
                          ) : null}
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
                            <div className="flex flex-wrap gap-2">
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
                            <div className="space-y-2">
                              <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                                {slip.reviewedAt
                                  ? `Reviewed ${formatDate(slip.reviewedAt)}`
                                  : "-"}
                              </span>
                              {isSpecialDeal && slip.status === "approved" ? (
                                <button
                                  type="button"
                                  disabled={pendingKey !== null}
                                  onClick={() =>
                                    void togglePersonalFilesSent(slip)
                                  }
                                  className="rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-bold text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-amber-500/40 dark:text-amber-100 dark:hover:bg-amber-500/10"
                                >
                                  {pendingKey === filesKey
                                    ? "Saving..."
                                    : slip.personalFilesSentAt
                                      ? "Mark files unsent"
                                      : "Mark files sent"}
                                </button>
                              ) : null}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <TablePagination
            label="slips"
            page={activeSlipPage}
            pageCount={slipPageCount}
            totalItems={sortedManualPaymentSlips.length}
            onPageChange={setSlipPage}
          />
        </section>

        <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-950">
          <div className="border-b border-zinc-200 px-5 py-4 dark:border-white/10">
            <h2 className="text-lg font-bold">Package Management</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Adjust subscription card text, price, life span, and display
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
            <div className="space-y-4">
              <p className="text-sm font-bold">Shared Reusable Payment QR</p>
              <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                Upload the single Krungthai receiving QR used for every package.
                Users will manually enter the exact package amount, and Slip2Go
                will verify the uploaded slip amount against the system price.
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-bold">Bank Name</span>
                  <input
                    name="bankName"
                    defaultValue={data?.manualPaymentConfig.bankName ?? ""}
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-black"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-bold">Account Name</span>
                  <input
                    name="accountName"
                    defaultValue={data?.manualPaymentConfig.accountName ?? ""}
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-black"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-bold">Account Number</span>
                  <input
                    name="accountNumber"
                    defaultValue={data?.manualPaymentConfig.accountNumber ?? ""}
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-black"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-bold">PromptPay ID</span>
                  <input
                    name="promptPayId"
                    defaultValue={data?.manualPaymentConfig.promptPayId ?? ""}
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-black"
                  />
                </label>
              </div>
              <input
                type="hidden"
                name="currency"
                value={data?.manualPaymentConfig.currency ?? "THB"}
              />
              <label className="block">
                <span className="text-xs font-bold">Payment QR Image</span>
                <input
                  name="paymentQrImage"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="mt-1 w-full text-xs"
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={pendingKey !== null}
              className="self-end rounded-lg bg-violet-700 px-4 py-2 text-xs font-bold text-white transition hover:bg-violet-600 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500"
            >
              {pendingKey === "payment-qr" ? "Saving..." : "Save Settings"}
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
                      Details
                    </span>
                    <div className="mt-1 space-y-2">
                      <div className="grid gap-2 text-[11px] font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 md:grid-cols-[0.85fr_1.15fr]">
                        <span>Detail</span>
                        <span>Sub-detail</span>
                      </div>
                      {[
                        ...pkg.details,
                        ...Array.from({ length: Math.max(2, 6 - pkg.details.length) }, () => ({
                          label: "",
                          subDetail: "",
                        })),
                      ].map((detail, detailIndex) => (
                        <div
                          key={`${pkg.key}:detail:${detailIndex}`}
                          className="grid gap-2 md:grid-cols-[0.85fr_1.15fr]"
                        >
                          <input
                            name="detailLabel"
                            defaultValue={detail.label}
                            placeholder="Skills Dashboard"
                            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-black"
                          />
                          <input
                            name="detailSubDetail"
                            defaultValue={detail.subDetail ?? ""}
                            placeholder="compare, and analyze your scores..."
                            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-600 dark:border-white/10 dark:bg-black dark:text-zinc-300"
                          />
                        </div>
                      ))}
                    </div>
                  </label>
                  <div className="grid grid-cols-3 gap-3">
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
                      <span className="text-xs font-bold">Life Span</span>
                      <select
                        name="durationMonths"
                        defaultValue={String(pkg.durationMonths)}
                        className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-black"
                      >
                        <option value="1">1 month</option>
                        <option value="6">6 months</option>
                        <option value="12">12 months</option>
                      </select>
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
          <div className="border-b border-zinc-200 px-5 py-4 dark:border-white/10">
            <h2 className="text-lg font-bold">Promotion Codes</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Create shared promo codes, or generate many one-time codes for
              campaigns. Each payment slip is verified against the discounted
              bank transfer amount.
            </p>
          </div>
          <form
            onSubmit={(event) => void savePromotion(event)}
            className="m-5 grid gap-3 rounded-xl border border-violet-200 bg-violet-50 p-4 dark:border-violet-500/20 dark:bg-violet-500/10 lg:grid-cols-7"
          >
            <input type="hidden" name="mode" value="single" />
            <label className="block lg:col-span-1">
              <span className="text-xs font-bold">Code</span>
              <input
                name="code"
                placeholder="CAPTAIN20"
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm uppercase dark:border-white/10 dark:bg-black"
              />
            </label>
            <label className="block lg:col-span-1">
              <span className="text-xs font-bold">Package</span>
              <select
                name="packageKey"
                defaultValue="captain"
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-black"
              >
                {(data?.subscriptionPackages ?? []).map((pkg) => (
                  <option key={pkg.key} value={pkg.key}>
                    {pkg.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="block lg:col-span-1">
              <span className="text-xs font-bold">Type</span>
              <select
                name="discountType"
                defaultValue="percent"
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-black"
              >
                <option value="percent">Percent</option>
                <option value="fixed">Fixed THB</option>
              </select>
            </label>
            <label className="block lg:col-span-1">
              <span className="text-xs font-bold">Discount</span>
              <input
                name="discountValue"
                inputMode="decimal"
                placeholder="20"
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-black"
              />
            </label>
            <label className="block lg:col-span-1">
              <span className="text-xs font-bold">Max Uses</span>
              <input
                name="maxRedemptions"
                inputMode="numeric"
                placeholder="Unlimited"
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-black"
              />
            </label>
            <label className="flex items-end gap-2 pb-2 text-sm font-bold">
              <input
                name="isActive"
                type="checkbox"
                value="true"
                defaultChecked
                className="h-4 w-4 accent-violet-700"
              />
              Active
            </label>
            <button
              type="submit"
              disabled={pendingKey !== null}
              className="self-end rounded-lg bg-violet-700 px-4 py-2 text-xs font-bold text-white transition hover:bg-violet-600 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500"
            >
              {pendingKey === "promotion:new" ? "Saving..." : "Add Code"}
            </button>
          </form>

          <form
            onSubmit={(event) => void savePromotion(event)}
            className="mx-5 mb-5 grid gap-3 rounded-xl border border-zinc-200 p-4 dark:border-white/10 lg:grid-cols-6"
          >
            <input type="hidden" name="mode" value="batch" />
            <label className="block lg:col-span-1">
              <span className="text-xs font-bold">Prefix</span>
              <input
                name="prefix"
                placeholder="CAP"
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm uppercase dark:border-white/10 dark:bg-black"
              />
            </label>
            <label className="block lg:col-span-1">
              <span className="text-xs font-bold">Quantity</span>
              <input
                name="quantity"
                defaultValue="10"
                inputMode="numeric"
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-black"
              />
            </label>
            <label className="block lg:col-span-1">
              <span className="text-xs font-bold">Package</span>
              <select
                name="packageKey"
                defaultValue="captain"
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-black"
              >
                {(data?.subscriptionPackages ?? []).map((pkg) => (
                  <option key={pkg.key} value={pkg.key}>
                    {pkg.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="block lg:col-span-1">
              <span className="text-xs font-bold">Type</span>
              <select
                name="discountType"
                defaultValue="percent"
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-black"
              >
                <option value="percent">Percent</option>
                <option value="fixed">Fixed THB</option>
              </select>
            </label>
            <label className="block lg:col-span-1">
              <span className="text-xs font-bold">Discount</span>
              <input
                name="discountValue"
                inputMode="decimal"
                placeholder="20"
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-black"
              />
            </label>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm font-bold">
                <input
                  name="isActive"
                  type="checkbox"
                  value="true"
                  defaultChecked
                  className="h-4 w-4 accent-violet-700"
                />
                Active
              </label>
              <button
                type="submit"
                disabled={pendingKey !== null}
                className="w-full rounded-lg bg-zinc-950 px-4 py-2 text-xs font-bold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
              >
                {pendingKey === "promotion:new"
                  ? "Generating..."
                  : "Generate"}
              </button>
            </div>
          </form>

          <div className="space-y-4 p-5">
            <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-bold">
                {selectedPromotionCodes.size} selected
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={pendingKey !== null || selectedPromotionCodes.size === 0}
                  onClick={() => void bulkPromotionAction("activate")}
                  className="rounded-lg border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-500/30 dark:text-emerald-200 dark:hover:bg-emerald-500/10"
                >
                  {pendingKey === "promotion:bulk:activate"
                    ? "Saving..."
                    : "Activate"}
                </button>
                <button
                  type="button"
                  disabled={pendingKey !== null || selectedPromotionCodes.size === 0}
                  onClick={() => void bulkPromotionAction("deactivate")}
                  className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-bold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:text-zinc-200 dark:hover:bg-white/5"
                >
                  {pendingKey === "promotion:bulk:deactivate"
                    ? "Saving..."
                    : "Deactivate"}
                </button>
                <button
                  type="button"
                  disabled={pendingKey !== null || selectedPromotionCodes.size === 0}
                  onClick={() => void bulkPromotionAction("delete")}
                  className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-500/30 dark:text-red-200 dark:hover:bg-red-500/10"
                >
                  {pendingKey === "promotion:bulk:delete"
                    ? "Deleting..."
                    : "Delete Selected"}
                </button>
              </div>
            </div>
            {renderPromotionTable({
              title: "Shared Codes",
              promotions: sharedPromotionCodes,
              visiblePromotions: visibleSharedPromotionCodes,
              page: activeSharedPromotionPage,
              pageCount: sharedPromotionPageCount,
              onPageChange: setSharedPromotionPage,
            })}
            {renderPromotionTable({
              title: "One-Time Codes",
              promotions: oneTimePromotionCodes,
              visiblePromotions: visibleOneTimePromotionCodes,
              page: activeOneTimePromotionPage,
              pageCount: oneTimePromotionPageCount,
              onPageChange: setOneTimePromotionPage,
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
                  <th className="px-4 py-3 font-bold">Subscription Detail</th>
                  <th className="px-4 py-3 font-bold">Provider</th>
                  <th className="px-4 py-3 font-bold">Profiles</th>
                  <th className="px-4 py-3 font-bold">Sessions</th>
                  <th className="px-4 py-3 font-bold">Updated</th>
                  <th className="px-4 py-3 font-bold">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredFleets.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="border-t border-zinc-100 px-4 py-6 text-center text-zinc-500 dark:border-white/10 dark:text-zinc-400"
                    >
                      {query.trim()
                        ? "No fleets match this email."
                        : "No registered fleets yet."}
                    </td>
                  </tr>
                ) : (
                  visibleFleets.map((fleet) => {
                    const isPaid = isPaidSubscription(
                      fleet.subscriptionStatus,
                      fleet.currentPeriodEnd,
                    );
                    const key = `fleet:${fleet.fleetId}`;
                    const isSpecialDeal =
                      fleet.latestPackageKey === "captain-pro-max";
                    return (
                      <tr
                        key={fleet.fleetId}
                        className={`border-t border-zinc-100 dark:border-white/10 ${
                          isSpecialDeal
                            ? "bg-amber-50/70 dark:bg-amber-500/10"
                            : ""
                        }`}
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
                          {paidLabel(
                            fleet.subscriptionStatus,
                            fleet.currentPeriodEnd,
                          )}
                        </span>
                      </td>
                      <td className="min-w-60 px-4 py-3">
                        {fleet.latestPackageTitle || fleet.latestPackageKey ? (
                          <div className="space-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                            <p className="text-sm font-bold text-zinc-950 dark:text-zinc-100">
                              {fleet.latestPackageTitle ??
                                fleet.latestPackageKey}{" "}
                              package
                            </p>
                            {isSpecialDeal ? (
                              <p className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-500/20 dark:text-amber-100">
                                Captain Pro Max · personal files{" "}
                                {fleet.latestPersonalFilesSentAt
                                  ? "sent"
                                  : "not sent"}
                              </p>
                            ) : null}
                            <p>
                              {fleet.latestPackageAmountThb !== null
                                ? formatAmount(fleet.latestPackageAmountThb)
                                : "-"}
                            </p>
                            <p>
                              {fleet.latestPackageDurationMonths
                                ? `${fleet.latestPackageDurationMonths} ${
                                    fleet.latestPackageDurationMonths === 1
                                      ? "month"
                                      : "months"
                                  }`
                                : "-"}
                            </p>
                            {fleet.latestSlip2goTransRef &&
                            fleet.latestSlipId ? (
                              <button
                                type="button"
                                onClick={() => openSlipFromFleet(fleet.latestSlipId)}
                                className="text-left font-bold text-violet-700 hover:text-violet-500 dark:text-violet-300"
                              >
                                Slip2Go transRef {fleet.latestSlip2goTransRef}
                              </button>
                            ) : (
                              <p>Slip2Go transRef -</p>
                            )}
                            <p>
                              Expires {formatDateOnly(fleet.currentPeriodEnd)}
                            </p>
                            {isSpecialDeal &&
                            fleet.latestSlipId &&
                            fleet.latestPersonalFilesSentAt ? (
                              <p>
                                Files sent{" "}
                                {formatDate(fleet.latestPersonalFilesSentAt)}
                              </p>
                            ) : null}
                            {isSpecialDeal && fleet.latestSlipId ? (
                              <button
                                type="button"
                                disabled={pendingKey !== null}
                                onClick={() =>
                                  void togglePersonalFilesSentBySlipId(
                                    fleet.latestSlipId as string,
                                    !fleet.latestPersonalFilesSentAt,
                                  )
                                }
                                className="rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-bold text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-amber-500/40 dark:text-amber-100 dark:hover:bg-amber-500/10"
                              >
                                {pendingKey ===
                                `personal-files:${fleet.latestSlipId}`
                                  ? "Saving..."
                                  : fleet.latestPersonalFilesSentAt
                                    ? "Mark files unsent"
                                    : "Mark files sent"}
                              </button>
                            ) : null}
                          </div>
                        ) : (
                          <div className="space-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                            <p className="text-sm font-bold text-zinc-950 dark:text-zinc-100">
                              Manual override
                            </p>
                            <p>Package -</p>
                            <p>Amount -</p>
                            <p>Duration -</p>
                            <p>Slip2Go transRef -</p>
                            <p>
                              Expires {formatDateOnly(fleet.currentPeriodEnd)}
                            </p>
                          </div>
                        )}
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
                  })
                )}
              </tbody>
            </table>
          </div>
          <TablePagination
            label="fleets"
            page={activeFleetPage}
            pageCount={fleetPageCount}
            totalItems={filteredFleets.length}
            onPageChange={setFleetPage}
          />
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
