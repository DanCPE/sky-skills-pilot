"use client";

import type { ManualPaymentSlip } from "@/lib/account/db";

function formatAmount(value: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
  }).format(value);
}

export default function SlipViewerModal({
  slip,
  fileUrl,
  onClose,
}: {
  slip: ManualPaymentSlip | null;
  fileUrl: string;
  onClose: () => void;
}) {
  if (!slip) return null;

  const isPdf = slip.slipContentType === "application/pdf";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Payment slip preview"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl dark:bg-zinc-950">
        <div className="flex flex-col gap-3 border-b border-zinc-200 p-4 dark:border-white/10 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-700 dark:text-violet-300">
              Payment Slip
            </p>
            <h2 className="mt-1 text-lg font-bold text-zinc-950 dark:text-zinc-100">
              {slip.email}
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {formatAmount(slip.amountThb)} · {slip.status}
            </p>
          </div>
          <div className="flex gap-2">
            <a
              href={fileUrl}
              download={slip.slipFileName}
              className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-bold text-zinc-700 transition hover:border-violet-300 hover:text-violet-700 dark:border-white/10 dark:text-zinc-200 dark:hover:border-violet-400 dark:hover:text-violet-200"
            >
              Download
            </a>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-zinc-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              Close
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 bg-zinc-100 p-3 dark:bg-black">
          {isPdf ? (
            <iframe
              src={fileUrl}
              title="Payment slip PDF"
              className="h-[72vh] w-full rounded-xl border border-zinc-200 bg-white dark:border-white/10"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={fileUrl}
              alt="Payment slip"
              className="mx-auto max-h-[72vh] w-auto max-w-full rounded-xl object-contain"
            />
          )}
        </div>
      </div>
    </div>
  );
}
