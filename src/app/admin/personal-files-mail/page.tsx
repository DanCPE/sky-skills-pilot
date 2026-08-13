"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { PersonalFileMailOverview } from "@/lib/account/db";

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function formatBytes(value: number) {
  if (value >= 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)} MB`;
  if (value >= 1024) return `${Math.round(value / 1024)} KB`;
  return `${value} B`;
}

function statusClass(status: string) {
  if (status === "sent") {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200";
  }
  if (status === "failed") {
    return "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-200";
  }
  return "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-100";
}

const MAX_CREATE_EVENT_TOTAL_BYTES = 120 * 1024 * 1024;
const VERCEL_FUNCTION_BODY_LIMIT_BYTES = 4.5 * 1024 * 1024;

function debugClient(message: string, meta?: Record<string, unknown>) {
  console.log(`[personal-files-mail:client] ${message}`, meta ?? {});
}

function createClientTraceId(label: string) {
  return `${label}-${crypto.randomUUID()}`;
}

export default function AdminPersonalFilesMailPage() {
  const [data, setData] = useState<PersonalFileMailOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [selectedFleetIds, setSelectedFleetIds] = useState<Set<string>>(
    new Set(),
  );

  const batches = useMemo(() => data?.batches ?? [], [data?.batches]);
  const selectedBatch = useMemo(
    () => batches.find((batch) => batch.id === selectedBatchId) ?? batches[0] ?? null,
    [batches, selectedBatchId],
  );
  const paidRecipients = useMemo(
    () => data?.paidRecipients ?? [],
    [data?.paidRecipients],
  );
  const unsentPaidRecipients = useMemo(
    () =>
      paidRecipients.filter(
        (recipient) => recipient.eventRecipientStatus !== "sent",
      ),
    [paidRecipients],
  );
  const selectedPaidRecipients = useMemo(
    () =>
      unsentPaidRecipients.filter((recipient) =>
        selectedFleetIds.has(recipient.fleetId),
      ),
    [unsentPaidRecipients, selectedFleetIds],
  );
  const allPaidRecipientsSelected =
    unsentPaidRecipients.length > 0 &&
    selectedPaidRecipients.length === unsentPaidRecipients.length;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const url = selectedBatchId
        ? `/api/admin/personal-files-mail?batchId=${encodeURIComponent(selectedBatchId)}`
        : "/api/admin/personal-files-mail";
      const traceId = createClientTraceId("overview");
      debugClient("GET overview start", { traceId, url, selectedBatchId });
      const response = await fetch(url, {
        cache: "no-store",
        headers: {
          "x-personal-mail-trace-id": traceId,
        },
      });
      const json = (await response.json().catch(() => null)) as
        | PersonalFileMailOverview
        | { error?: string; traceId?: string }
        | null;

      if (!response.ok) {
        throw new Error(
          json && "error" in json && json.error
            ? json.error
            : "Failed to load personal file mail.",
        );
      }

      setData(json as PersonalFileMailOverview);
      debugClient("GET overview success", {
        traceId,
        responseTraceId: response.headers.get("x-personal-mail-trace-id"),
        status: response.status,
        batchCount:
          json && "batches" in json && Array.isArray(json.batches)
            ? json.batches.length
            : null,
        paidRecipientCount:
          json && "paidRecipientCount" in json ? json.paidRecipientCount : null,
      });
    } catch (fetchError) {
      debugClient("GET overview failed", {
        selectedBatchId,
        error:
          fetchError instanceof Error ? fetchError.message : String(fetchError),
      });
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Failed to load personal file mail.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [selectedBatchId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!selectedBatchId && data?.batches[0]) {
      setSelectedBatchId(data.batches[0].id);
    }
  }, [data?.batches, selectedBatchId]);

  async function createEvent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsCreating(true);
    setError(null);
    setSuccess(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const files = formData
      .getAll("files")
      .filter((value): value is File => value instanceof File);
    const totalBytes = files.reduce((total, file) => total + file.size, 0);
    const traceId = createClientTraceId("create-event");
    debugClient("create-event POST start", {
      traceId,
      fileCount: files.length,
      totalBytes,
      files: files.map((file) => ({
        name: file.name,
        type: file.type,
        size: file.size,
      })),
    });

    if (totalBytes > MAX_CREATE_EVENT_TOTAL_BYTES) {
      const message = `Selected files are ${formatBytes(totalBytes)} total. Limit is ${formatBytes(MAX_CREATE_EVENT_TOTAL_BYTES)}.`;
      debugClient("create-event blocked by client total limit", {
        totalBytes,
        maxBytes: MAX_CREATE_EVENT_TOTAL_BYTES,
      });
      setError(message);
      setIsCreating(false);
      return;
    }

    if (
      window.location.hostname.endsWith(".vercel.app") &&
      totalBytes > VERCEL_FUNCTION_BODY_LIMIT_BYTES
    ) {
      const message = `Selected files are ${formatBytes(totalBytes)} total. Vercel blocks server uploads above about ${formatBytes(VERCEL_FUNCTION_BODY_LIMIT_BYTES)}, so this request would fail before reaching our API route. Use a smaller file or switch this flow to direct object-storage uploads.`;
      debugClient("create-event blocked by Vercel function body limit", {
        totalBytes,
        maxBytes: VERCEL_FUNCTION_BODY_LIMIT_BYTES,
        hostname: window.location.hostname,
      });
      setError(message);
      setIsCreating(false);
      return;
    }

    try {
      const response = await fetch("/api/admin/personal-files-mail", {
        method: "POST",
        headers: {
          "x-personal-mail-trace-id": traceId,
        },
        body: formData,
      });
      const json = (await response.json().catch(() => null)) as
        | { overview?: PersonalFileMailOverview; error?: string; traceId?: string }
        | null;

      if (!response.ok) {
        debugClient("create-event POST rejected", {
          traceId,
          responseTraceId: response.headers.get("x-personal-mail-trace-id"),
          status: response.status,
          error: json?.error ?? null,
          responseBodyTraceId: json?.traceId ?? null,
        });
        throw new Error(
          `${json?.error ?? "Failed to create sending event."} Trace: ${
            json?.traceId ?? traceId
          }`,
        );
      }

      if (json?.overview) {
        setData(json.overview);
        const latestBatch = json.overview.batches[0];
        if (latestBatch) setSelectedBatchId(latestBatch.id);
        setSuccess("Sending event created.");
        debugClient("create-event POST success", {
          traceId,
          responseTraceId: response.headers.get("x-personal-mail-trace-id"),
          status: response.status,
          selectedBatchId: latestBatch?.id ?? null,
        });
      }
      form.reset();
      setSelectedFleetIds(new Set());
    } catch (createError) {
      debugClient("create-event POST failed", {
        traceId,
        error:
          createError instanceof Error
            ? createError.message
            : String(createError),
      });
      setError(
        createError instanceof Error
          ? createError.message
          : "Failed to create sending event.",
      );
    } finally {
      setIsCreating(false);
    }
  }

  async function sendEvent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedBatch) return;

    setIsSending(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData(event.currentTarget);
    formData.set("action", "send-event");
    formData.set("batchId", selectedBatch.id);
    const traceId = createClientTraceId("send-event");
    debugClient("send-event POST start", {
      traceId,
      batchId: selectedBatch.id,
      selectedRecipientCount: selectedPaidRecipients.length,
      selectedFleetIds: selectedPaidRecipients.map((recipient) => recipient.fleetId),
      fileCount: selectedBatch.files.length,
      totalFileSizeBytes: selectedBatch.fileSizeBytes,
      hasSmtpPasswordOverride: Boolean(formData.get("smtpPasswordOverride")),
    });

    try {
      const response = await fetch("/api/admin/personal-files-mail", {
        method: "POST",
        headers: {
          "x-personal-mail-trace-id": traceId,
        },
        body: formData,
      });
      const json = (await response.json().catch(() => null)) as
        | { overview?: PersonalFileMailOverview; error?: string; traceId?: string }
        | null;

      if (!response.ok) {
        debugClient("send-event POST rejected", {
          traceId,
          responseTraceId: response.headers.get("x-personal-mail-trace-id"),
          status: response.status,
          error: json?.error ?? null,
          responseBodyTraceId: json?.traceId ?? null,
        });
        throw new Error(
          `${json?.error ?? "Failed to send personal file mail."} Trace: ${
            json?.traceId ?? traceId
          }`,
        );
      }

      if (json?.overview) {
        setData(json.overview);
        const refreshedBatch = json.overview.batches.find(
          (batch) => batch.id === selectedBatch.id,
        );
        setSuccess(
          refreshedBatch
            ? `Event sent to ${selectedPaidRecipients.length} selected users.`
            : "Personal file mail sent.",
        );
        debugClient("send-event POST success", {
          traceId,
          responseTraceId: response.headers.get("x-personal-mail-trace-id"),
          status: response.status,
          batchId: selectedBatch.id,
          sentSelectionCount: selectedPaidRecipients.length,
        });
      }
      setSelectedFleetIds(new Set());
    } catch (sendError) {
      debugClient("send-event POST failed", {
        traceId,
        batchId: selectedBatch.id,
        error: sendError instanceof Error ? sendError.message : String(sendError),
      });
      setError(
        sendError instanceof Error
          ? sendError.message
          : "Failed to send personal file mail.",
      );
    } finally {
      setIsSending(false);
    }
  }

  function toggleRecipient(fleetId: string) {
    setSelectedFleetIds((current) => {
      const next = new Set(current);
      if (next.has(fleetId)) {
        next.delete(fleetId);
      } else {
        next.add(fleetId);
      }
      return next;
    });
  }

  function selectAllRecipients() {
    setSelectedFleetIds(
      new Set(unsentPaidRecipients.map((recipient) => recipient.fleetId)),
    );
  }

  function clearSelectedRecipients() {
    setSelectedFleetIds(new Set());
  }

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6">
        <section>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-violet-700 dark:text-violet-300">
            Paid Subscriber Mail
          </p>
          <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Personal File Delivery</h1>
              <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-300">
                Create a sending event with files and a draft message, then send
                that event to selected active paid subscribers.
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm shadow-sm dark:border-white/10 dark:bg-white/5">
              <span className="font-bold">{data?.paidRecipientCount ?? 0}</span>{" "}
              active paid recipients
            </div>
          </div>
        </section>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
            {success}
          </div>
        ) : null}

        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
          <div className="mb-4">
            <h2 className="text-lg font-bold">Create Sending Event</h2>
          </div>
          <form onSubmit={(event) => void createEvent(event)} className="grid gap-4">
            <input type="hidden" name="action" value="create-event" />
            <div className="grid gap-4 lg:grid-cols-2">
              <label className="grid gap-2 text-sm font-bold">
                Subject
                <input
                  name="subject"
                  required
                  defaultValue="Your SkySkills personal file"
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-2 font-normal outline-none transition focus:border-violet-400 dark:border-white/10 dark:bg-zinc-950"
                />
              </label>
              <label className="grid gap-2 text-sm font-bold">
                Files
                <input
                  name="files"
                  type="file"
                  multiple
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-2 font-normal file:mr-3 file:rounded-md file:border-0 file:bg-violet-100 file:px-3 file:py-1.5 file:text-sm file:font-bold file:text-violet-800 dark:border-white/10 dark:bg-zinc-950 dark:file:bg-violet-500/20 dark:file:text-violet-100"
                />
                <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">
                  Optional. Upload up to 5 files, or leave empty for a link-only email.
                </span>
              </label>
            </div>
            <label className="grid gap-2 text-sm font-bold">
              Message
              <textarea
                name="message"
                required
                rows={5}
                defaultValue="Your personal SkySkills file is attached. Thank you for subscribing."
                className="rounded-lg border border-zinc-200 bg-white px-3 py-2 font-normal outline-none transition focus:border-violet-400 dark:border-white/10 dark:bg-zinc-950"
              />
            </label>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isCreating}
                className="rounded-lg bg-zinc-950 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-brand-gold dark:text-zinc-950 dark:hover:bg-amber-300"
              >
                {isCreating ? "Creating..." : "Create Event"}
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
          <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h2 className="text-lg font-bold">Send Selected Event</h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Users who have not received the selected event are shown first.
              </p>
            </div>
            <label className="grid gap-2 text-sm font-bold">
              Event
              <select
                value={selectedBatch?.id ?? ""}
                onChange={(event) => {
                  setSelectedBatchId(event.target.value || null);
                  setSelectedFleetIds(new Set());
                }}
                className="min-w-72 rounded-lg border border-zinc-200 bg-white px-3 py-2 font-normal outline-none transition focus:border-violet-400 dark:border-white/10 dark:bg-zinc-950"
              >
                {batches.length === 0 ? (
                  <option value="">No events yet</option>
                ) : null}
                {batches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.subject} - {formatDate(batch.createdAt)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {selectedBatch ? (
            <div className="mb-4 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm dark:border-white/10 dark:bg-white/5">
              <p className="font-bold">{selectedBatch.subject}</p>
              <p className="mt-1 text-zinc-500 dark:text-zinc-400">
                {selectedBatch.files.length > 0
                  ? selectedBatch.files.map((file) => file.fileName).join(", ")
                  : "No attached files"}
              </p>
            </div>
          ) : null}

          <form onSubmit={(event) => void sendEvent(event)} className="grid gap-4">
            <label className="grid gap-2 text-sm font-bold">
              Temporary SMTP password override
              <input
                name="smtpPasswordOverride"
                type="password"
                autoComplete="off"
                placeholder="Optional Gmail app password for this send only"
                className="rounded-lg border border-zinc-200 bg-white px-3 py-2 font-normal outline-none transition focus:border-violet-400 dark:border-white/10 dark:bg-zinc-950"
              />
              <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">
                Optional. Used only for this send request and not saved in the database.
              </span>
            </label>
            <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-white/10">
              <div className="flex flex-col gap-3 border-b border-zinc-100 bg-zinc-50 px-4 py-3 dark:border-white/10 dark:bg-white/5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold">Active paid recipients</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {selectedPaidRecipients.length} selected from{" "}
                    {unsentPaidRecipients.length} available active paid users
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={selectAllRecipients}
                    disabled={
                      !selectedBatch ||
                      unsentPaidRecipients.length === 0 ||
                      allPaidRecipientsSelected
                    }
                    className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-bold text-zinc-700 transition hover:border-violet-300 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-200"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={clearSelectedRecipients}
                    disabled={selectedPaidRecipients.length === 0}
                    className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-bold text-zinc-700 transition hover:border-violet-300 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-200"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {paidRecipients.length === 0 ? (
                <p className="px-4 py-5 text-sm text-zinc-500 dark:text-zinc-400">
                  No active paid users are available.
                </p>
              ) : !selectedBatch ? (
                <p className="px-4 py-5 text-sm text-zinc-500 dark:text-zinc-400">
                  Create or select an event before choosing recipients.
                </p>
              ) : (
                <div className="max-h-80 overflow-y-auto">
                  {paidRecipients.map((recipient) => {
                    const isSelected = selectedFleetIds.has(recipient.fleetId);
                    const alreadySent = recipient.eventRecipientStatus === "sent";

                    return (
                      <label
                        key={recipient.fleetId}
                        className={`flex cursor-pointer items-center gap-3 border-t border-zinc-100 px-4 py-3 text-sm transition first:border-t-0 dark:border-white/10 ${
                          isSelected
                            ? "bg-violet-50 dark:bg-violet-500/10"
                            : alreadySent
                              ? "bg-zinc-50 text-zinc-500 dark:bg-white/5 dark:text-zinc-400"
                            : "hover:bg-zinc-50 dark:hover:bg-white/5"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={alreadySent}
                          onChange={() => toggleRecipient(recipient.fleetId)}
                          className="h-4 w-4 rounded border-zinc-300 text-violet-700"
                        />
                        {isSelected ? (
                          <input
                            type="hidden"
                            name="recipientFleetIds"
                            value={recipient.fleetId}
                          />
                        ) : null}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-bold">
                            {recipient.email}
                          </span>
                          <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                            {recipient.name} ·{" "}
                            {recipient.packageTitle ?? recipient.packageKey}
                          </span>
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                            recipient.eventRecipientStatus
                              ? statusClass(recipient.eventRecipientStatus)
                              : "bg-zinc-100 text-zinc-700 dark:bg-white/10 dark:text-zinc-200"
                          }`}
                        >
                          {recipient.eventRecipientStatus ?? "not sent"}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={
                  !selectedBatch || isSending || selectedPaidRecipients.length === 0
                }
                className="rounded-lg bg-zinc-950 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-brand-gold dark:text-zinc-950 dark:hover:bg-amber-300"
              >
                {isSending
                  ? "Sending..."
                  : `Send Event (${selectedPaidRecipients.length})`}
              </button>
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/5">
          <div className="border-b border-zinc-100 px-5 py-4 dark:border-white/10">
            <h2 className="text-lg font-bold">Delivery History</h2>
          </div>

          {isLoading ? (
            <p className="px-5 py-6 text-sm text-zinc-500 dark:text-zinc-400">
              Loading mail batches...
            </p>
          ) : data?.batches.length === 0 ? (
            <p className="px-5 py-6 text-sm text-zinc-500 dark:text-zinc-400">
              No files have been mailed yet.
            </p>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-white/10">
              {data?.batches.map((batch) => (
                <details key={batch.id} className="group">
                  <summary className="grid cursor-pointer gap-3 px-5 py-4 marker:text-zinc-400 lg:grid-cols-[1fr_auto]">
                    <div>
                      <p className="font-bold">{batch.subject}</p>
                      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                        {batch.files.length}{" "}
                        {batch.files.length === 1 ? "file" : "files"} ·{" "}
                        {formatBytes(batch.fileSizeBytes)} · {formatDate(batch.createdAt)}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        {batch.files.length > 0
                          ? batch.files.map((file) => file.fileName).join(", ")
                          : "No attached files"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs font-bold">
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200">
                        Sent {batch.sentCount}
                      </span>
                      <span className="rounded-full bg-red-100 px-2.5 py-1 text-red-700 dark:bg-red-500/15 dark:text-red-200">
                        Failed {batch.failedCount}
                      </span>
                      <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-zinc-700 dark:bg-white/10 dark:text-zinc-200">
                        Total {batch.recipientCount}
                      </span>
                    </div>
                  </summary>
                  <div className="overflow-x-auto border-t border-zinc-100 dark:border-white/10">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-zinc-50 text-xs uppercase text-zinc-500 dark:bg-white/5 dark:text-zinc-400">
                        <tr>
                          <th className="px-5 py-3 font-bold">Email</th>
                          <th className="px-5 py-3 font-bold">Package</th>
                          <th className="px-5 py-3 font-bold">Status</th>
                          <th className="px-5 py-3 font-bold">Sent At</th>
                          <th className="px-5 py-3 font-bold">Error</th>
                        </tr>
                      </thead>
                      <tbody>
                        {batch.recipients.map((recipient) => (
                          <tr
                            key={recipient.id}
                            className="border-t border-zinc-100 dark:border-white/10"
                          >
                            <td className="px-5 py-3">
                              <p className="font-bold">{recipient.email}</p>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                {recipient.name}
                              </p>
                            </td>
                            <td className="px-5 py-3">
                              {recipient.packageTitle ?? recipient.packageKey}
                            </td>
                            <td className="px-5 py-3">
                              <span
                                className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusClass(recipient.status)}`}
                              >
                                {recipient.status}
                              </span>
                            </td>
                            <td className="px-5 py-3">
                              {formatDate(recipient.sentAt)}
                            </td>
                            <td className="max-w-sm px-5 py-3 text-xs text-red-600 dark:text-red-300">
                              {recipient.error ?? "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
