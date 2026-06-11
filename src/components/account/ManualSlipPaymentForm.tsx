"use client";

import { useMemo, useState } from "react";
import type {
  ManualPaymentConfig,
  ManualPaymentSlip,
  SubscriptionPackage,
} from "@/lib/account/db";
import SlipViewerModal from "./SlipViewerModal";

type BarcodeDetectorResult = { rawValue?: string };
type BarcodeDetectorInstance = {
  detect: (source: ImageBitmapSource) => Promise<BarcodeDetectorResult[]>;
};
type BarcodeDetectorConstructor = new (options: {
  formats: string[];
}) => BarcodeDetectorInstance;

interface WindowWithBarcodeDetector extends Window {
  BarcodeDetector?: BarcodeDetectorConstructor;
}

function formatAmount(value: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function statusClass(status: ManualPaymentSlip["status"]) {
  if (status === "approved") {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200";
  }
  if (status === "rejected") {
    return "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-200";
  }
  return "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-100";
}

export default function ManualSlipPaymentForm({
  config,
  initialSlips,
  packages,
}: {
  config: ManualPaymentConfig;
  initialSlips: ManualPaymentSlip[];
  packages: SubscriptionPackage[];
}) {
  const [selectedPackageKey, setSelectedPackageKey] = useState(
    packages[0]?.key ?? "",
  );
  const [transferReference, setTransferReference] = useState("");
  const [miniQrPayload, setMiniQrPayload] = useState("");
  const [note, setNote] = useState("");
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slips, setSlips] = useState(initialSlips);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [qrMessage, setQrMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedSlip, setSelectedSlip] = useState<ManualPaymentSlip | null>(
    null,
  );
  const [paymentQrFailed, setPaymentQrFailed] = useState(false);

  const selectedPackage =
    packages.find((item) => item.key === selectedPackageKey) ?? null;
  const previewUrl = useMemo(() => {
    if (!slipFile || !slipFile.type.startsWith("image/")) return null;
    return URL.createObjectURL(slipFile);
  }, [slipFile]);

  async function tryReadMiniQr(file: File) {
    setQrMessage(null);
    setMiniQrPayload("");

    if (!file.type.startsWith("image/")) return;

    const BarcodeDetector = (window as WindowWithBarcodeDetector).BarcodeDetector;
    if (!BarcodeDetector) {
      setQrMessage("Mini-QR auto-read is not supported in this browser.");
      return;
    }

    try {
      const bitmap = await createImageBitmap(file);
      const detector = new BarcodeDetector({ formats: ["qr_code"] });
      const results = await detector.detect(bitmap);
      bitmap.close();

      const rawValue = results.find((result) => result.rawValue)?.rawValue;
      if (rawValue) {
        setMiniQrPayload(rawValue);
        setQrMessage("Mini-QR/reference was detected from the slip.");
      } else {
        setQrMessage("No QR code was detected. You can submit without it.");
      }
    } catch {
      setQrMessage("Mini-QR could not be read. You can submit without it.");
    }
  }

  async function handleFileChange(file: File | null) {
    setSlipFile(file);
    if (file) await tryReadMiniQr(file);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!slipFile) {
      setError("Please upload your payment slip.");
      return;
    }
    if (!selectedPackage) {
      setError("Please select a package.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("amountThb", String(selectedPackage.priceThb));
      formData.set("planKey", selectedPackage.key);
      formData.set("transferReference", transferReference);
      formData.set("miniQrPayload", miniQrPayload);
      formData.set("note", note);
      formData.set("slip", slipFile);

      const response = await fetch("/api/account/billing/slips", {
        method: "POST",
        body: formData,
      });
      const json = (await response.json().catch(() => null)) as
        | { slip?: ManualPaymentSlip; error?: string; message?: string }
        | null;

      if (!response.ok) {
        throw new Error(json?.error ?? "Failed to submit payment slip.");
      }

      if (json?.slip) setSlips((current) => [json.slip as ManualPaymentSlip, ...current]);
      setSlipFile(null);
      setTransferReference("");
      setMiniQrPayload("");
      setNote("");
      setQrMessage(null);
      if (json?.slip?.status === "rejected") {
        setError(
          json.message ??
            json.slip.verificationError ??
            "Slip was rejected by verification.",
        );
      } else {
        setSuccess(
          json?.message ??
            (json?.slip?.status === "approved"
              ? "Slip verified. Paid access is active."
              : "Slip checked and saved."),
        );
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to submit payment slip.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950 lg:col-span-2">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-violet-700 dark:text-violet-300">
          Choose Package
        </p>
        <h2 className="mt-2 text-2xl font-bold">Subscription Packages</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {packages.map((pkg) => {
            const isSelected = pkg.key === selectedPackageKey;
            return (
              <button
                key={pkg.key}
                type="button"
                onClick={() => {
                  setSelectedPackageKey(pkg.key);
                }}
                className={`overflow-hidden rounded-2xl border text-left transition ${
                  isSelected
                    ? "border-violet-500 ring-2 ring-violet-200 dark:ring-violet-500/30"
                    : "border-zinc-200 hover:border-violet-300 dark:border-white/10 dark:hover:border-violet-400"
                }`}
              >
                <div className="relative h-36 bg-zinc-100 dark:bg-white/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={pkg.imageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-bold">{pkg.title}</p>
                      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                        {pkg.description}
                      </p>
                    </div>
                    <span className="rounded-full bg-violet-100 px-3 py-1 text-sm font-bold text-violet-700 dark:bg-violet-500/15 dark:text-violet-200">
                      {formatAmount(pkg.priceThb)}
                    </span>
                  </div>
                  <ul className="space-y-1 text-sm text-zinc-600 dark:text-zinc-300">
                    {pkg.details.map((detail) => (
                      <li key={detail}>• {detail}</li>
                    ))}
                  </ul>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-violet-700 dark:text-violet-300">
          Payment QR
        </p>
        <h2 className="mt-2 text-2xl font-bold">Reusable Receiving QR</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
          Scan the shared receiving QR, enter the exact selected package amount,
          then upload your slip. Slip2Go verifies the bank transaction before
          access is unlocked.
        </p>

        {selectedPackage ? (
          <div className="mt-6 rounded-2xl border border-zinc-200 p-4 dark:border-white/10">
            <p className="text-sm font-bold">Pay Exactly</p>
            <p className="mt-1 text-3xl font-bold text-violet-700 dark:text-violet-300">
              {formatAmount(selectedPackage.priceThb)}
            </p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {selectedPackage.title}
            </p>
            {paymentQrFailed ? (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-100">
                Payment QR is not configured yet.
              </div>
            ) : (
              <div className="mt-3 rounded-xl bg-white p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={config.paymentQrImageUrl}
                  alt="Payment receiving QR"
                  onError={() => setPaymentQrFailed(true)}
                  className="mx-auto max-h-72 w-auto max-w-full object-contain"
                />
              </div>
            )}
            <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
              The QR receives payment only. The selected amount is verified from
              your uploaded slip.
            </p>
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950">
        <h2 className="text-2xl font-bold">Upload Payment Slip</h2>
        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <div className="rounded-xl bg-zinc-50 p-4 text-sm dark:bg-white/5">
            <p className="font-bold">
              {selectedPackage
                ? `${selectedPackage.title} · ${formatAmount(selectedPackage.priceThb)}`
                : "Select a package before uploading"}
            </p>
            <p className="mt-1 text-zinc-500 dark:text-zinc-400">
              Slip2Go will check the transaction reference and exact package
              amount before access is unlocked.
            </p>
          </div>

          <label className="block">
            <span className="text-sm font-bold">Slip Image or PDF</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,application/pdf"
              onChange={(event) =>
                void handleFileChange(event.target.files?.[0] ?? null)
              }
              required
              className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-violet-700 file:px-3 file:py-2 file:text-sm file:font-bold file:text-white dark:border-white/10 dark:bg-black"
            />
          </label>

          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Payment slip preview"
              className="max-h-72 w-full rounded-xl border border-zinc-200 object-contain dark:border-white/10"
            />
          ) : null}

          {qrMessage ? (
            <p className="rounded-xl bg-zinc-50 p-3 text-sm text-zinc-600 dark:bg-white/5 dark:text-zinc-300">
              {qrMessage}
            </p>
          ) : null}

          <label className="block">
            <span className="text-sm font-bold">Transfer Reference</span>
            <input
              value={transferReference}
              onChange={(event) => setTransferReference(event.target.value)}
              className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-500 dark:border-white/10 dark:bg-black"
              placeholder="Optional transaction ID from slip"
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold">Mini-QR Payload</span>
            <textarea
              value={miniQrPayload}
              onChange={(event) => setMiniQrPayload(event.target.value)}
              rows={3}
              className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-500 dark:border-white/10 dark:bg-black"
              placeholder="Auto-filled when the browser can read the slip QR"
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold">Note</span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={2}
              className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-500 dark:border-white/10 dark:bg-black"
              placeholder="Optional note for admin"
            />
          </label>

          {error ? (
            <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm font-semibold text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-200">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-200">
              {success}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-violet-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-violet-600 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500 dark:disabled:bg-zinc-800"
          >
            {isSubmitting ? "Verifying..." : "Verify Slip & Unlock"}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950 lg:col-span-2">
        <h2 className="text-2xl font-bold">Submission History</h2>
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-white/5">
              <tr>
                <th className="px-4 py-3 font-bold">Date</th>
                <th className="px-4 py-3 font-bold">Amount</th>
                <th className="px-4 py-3 font-bold">Package</th>
                <th className="px-4 py-3 font-bold">Reference</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold">Slip</th>
              </tr>
            </thead>
            <tbody>
              {slips.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="border-t border-zinc-100 px-4 py-6 text-center text-zinc-500 dark:border-white/10 dark:text-zinc-400"
                  >
                    No slips submitted yet.
                  </td>
                </tr>
              ) : (
                slips.map((slip) => (
                  <tr
                    key={slip.id}
                    className="border-t border-zinc-100 dark:border-white/10"
                  >
                    <td className="px-4 py-3">{formatDate(slip.createdAt)}</td>
                    <td className="px-4 py-3">{formatAmount(slip.amountThb)}</td>
                    <td className="px-4 py-3">
                      {slip.planTitle ?? slip.planKey}
                    </td>
                    <td className="px-4 py-3">
                      {slip.transferReference || slip.miniQrPayload || "-"}
                      {slip.slip2goTransRef ? (
                        <span className="block max-w-56 truncate text-xs text-zinc-500 dark:text-zinc-400">
                          Slip2Go: {slip.slip2goTransRef}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusClass(slip.status)}`}
                      >
                        {slip.status}
                      </span>
                      {slip.verificationError ? (
                        <span className="mt-1 block max-w-56 text-xs text-red-600 dark:text-red-300">
                          {slip.verificationError}
                        </span>
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
      <SlipViewerModal
        slip={selectedSlip}
        fileUrl={
          selectedSlip
            ? `/api/account/billing/slips/${selectedSlip.id}/file`
            : ""
        }
        onClose={() => setSelectedSlip(null)}
      />
    </div>
  );
}
