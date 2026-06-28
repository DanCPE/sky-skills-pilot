"use client";

import { useEffect, useState } from "react";
import type {
  ManualPaymentConfig,
  ManualPaymentSlip,
  SubscriptionPackage,
} from "@/lib/account/db";

type BarcodeDetectorResult = { rawValue?: string };
type BarcodeDetectorInstance = {
  detect: (source: ImageBitmapSource) => Promise<BarcodeDetectorResult[]>;
};
type BarcodeDetectorConstructor = new (options: {
  formats: string[];
}) => BarcodeDetectorInstance;
type AppliedPromotionResponse = {
  promotion: { code: string };
  originalAmountThb: number;
  discountThb: number;
  finalAmountThb: number;
};

interface WindowWithBarcodeDetector extends Window {
  BarcodeDetector?: BarcodeDetectorConstructor;
}

function formatAmount(value: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
  }).format(value);
}

function durationSummary(months: number) {
  if (months >= 12) return "Yearly Subscription";
  if (months === 6) return "6 Month Subscription";
  return "Monthly Subscription";
}

export default function ManualSlipPaymentForm({
  config,
  packages,
  initialPackageKey,
}: {
  config: ManualPaymentConfig;
  packages: SubscriptionPackage[];
  initialPackageKey?: string;
}) {
  const [selectedPackageKey] = useState(
    packages.some((pkg) => pkg.key === initialPackageKey)
      ? initialPackageKey ?? ""
      : packages[0]?.key ?? "",
  );
  const [transferReference, setTransferReference] = useState("");
  const [promotionCode, setPromotionCode] = useState("");
  const [appliedPromotion, setAppliedPromotion] =
    useState<AppliedPromotionResponse | null>(null);
  const [miniQrPayload, setMiniQrPayload] = useState("");
  const [note, setNote] = useState("");
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [qrMessage, setQrMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [paymentQrFailed, setPaymentQrFailed] = useState(false);

  const selectedPackage =
    packages.find((item) => item.key === selectedPackageKey) ?? null;
  const originalAmount = selectedPackage ? selectedPackage.priceThb : 0;
  const discountAmount = appliedPromotion?.discountThb ?? 0;
  const totalAmount = appliedPromotion?.finalAmountThb ?? originalAmount;
  const promotionAdjustmentLabel =
    discountAmount >= 0
      ? `-${formatAmount(discountAmount)}`
      : `+${formatAmount(Math.abs(discountAmount))}`;
  const selectedAmount = selectedPackage ? formatAmount(originalAmount) : "-";
  const totalAmountLabel = selectedPackage ? formatAmount(totalAmount) : "-";
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!slipFile || !slipFile.type.startsWith("image/")) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(slipFile);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
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

  async function applyPromotion() {
    setError(null);
    setSuccess(null);
    setAppliedPromotion(null);

    if (!selectedPackage) {
      setError("Please select a package first.");
      return;
    }
    if (!promotionCode.trim()) {
      setError("Please enter a promotion code.");
      return;
    }

    try {
      const response = await fetch("/api/account/billing/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planKey: selectedPackage.key,
          code: promotionCode,
        }),
      });
      const json = (await response.json().catch(() => null)) as
        | AppliedPromotionResponse
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(
          json && "error" in json && json.error
            ? json.error
            : "Promotion code could not be applied.",
        );
      }

      setAppliedPromotion(json as AppliedPromotionResponse);
      setPromotionCode((json as AppliedPromotionResponse).promotion.code);
    } catch (promotionError) {
      setError(
        promotionError instanceof Error
          ? promotionError.message
          : "Promotion code could not be applied.",
      );
    }
  }

  function clearPromotion() {
    setAppliedPromotion(null);
    setPromotionCode("");
    setError(null);
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
      formData.set("amountThb", String(totalAmount));
      formData.set("planKey", selectedPackage.key);
      if (appliedPromotion) {
        formData.set("promotionCode", appliedPromotion.promotion.code);
      }
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

      setSlipFile(null);
      setTransferReference("");
      setPromotionCode("");
      setAppliedPromotion(null);
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
    <div className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(320px,0.92fr)_minmax(420px,1.18fr)]">
        <aside className="space-y-5">
          <section className="overflow-hidden rounded-xl border border-zinc-300 bg-white shadow-sm">
            <h2 className="border-b border-zinc-300 bg-[#f4f2f7] px-5 py-4 text-lg font-semibold text-zinc-950">
              Subscription Summary
            </h2>
            <div className="space-y-5 p-5">
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className="text-lg font-semibold text-[#5012A5]">
                    {selectedPackage ? `${selectedPackage.title} Plan` : "Selected Plan"}
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">
                    {selectedPackage
                      ? durationSummary(selectedPackage.durationMonths)
                      : "Subscription"}
                  </p>
                </div>
                <p className="pt-1 text-lg font-semibold text-zinc-950">
                  {selectedAmount}
                </p>
              </div>

              <div className="border-t border-zinc-300 pt-4">
                <label className="block text-xs font-semibold text-zinc-500">
                  Add Your Promotion
                </label>
                <div className="mt-3 flex gap-2">
                  <input
                    value={promotionCode}
                    onChange={(event) => {
                      setPromotionCode(event.target.value);
                      setAppliedPromotion(null);
                    }}
                    disabled={isSubmitting || !selectedPackage}
                    placeholder="Enter promo code"
                    className="min-h-10 flex-1 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-950 disabled:bg-[#faf9fc] disabled:text-zinc-500"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      appliedPromotion ? clearPromotion() : void applyPromotion()
                    }
                    disabled={isSubmitting || !selectedPackage || !promotionCode.trim()}
                    className="rounded-lg bg-[#5817b7] px-5 text-sm font-semibold text-white transition hover:bg-[#5012A5] disabled:cursor-not-allowed disabled:bg-zinc-500 disabled:opacity-80"
                  >
                    {appliedPromotion ? "Clear" : "Apply"}
                  </button>
                </div>
                {appliedPromotion ? (
                  <p className="mt-2 text-xs font-semibold text-emerald-700">
                    {appliedPromotion.promotion.code} applied.
                  </p>
                ) : null}
              </div>

              <div className="space-y-3 border-t border-zinc-200 pt-4 text-sm">
                <div className="flex justify-between gap-4 text-zinc-500">
                  <span>Original Price</span>
                  <span>{selectedAmount}</span>
                </div>
                <div className="flex justify-between gap-4 text-zinc-500">
                  <span>
                    {discountAmount < 0 ? "Special Add-on" : "Discount"}
                  </span>
                  <span className="text-red-700">
                    {promotionAdjustmentLabel}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4 pt-2">
                  <span className="text-2xl font-semibold text-zinc-950">
                    Total Amount
                  </span>
                  <span className="text-2xl font-semibold text-zinc-950">
                    {totalAmountLabel}
                  </span>
                </div>
              </div>

            </div>
          </section>

          <div className="flex gap-3 rounded-xl bg-[#f4f2f7] p-4 text-xs font-semibold leading-5 text-zinc-500">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-[#5012A5] text-xs font-semibold text-[#5012A5]">
              i
            </span>
            <p>
              After uploading the proof, our staff will verify it within 15-30
              minutes during business hours.
            </p>
          </div>
        </aside>

        <section className="rounded-xl border border-zinc-300 bg-white p-7 shadow-sm">
          <h2 className="text-2xl font-semibold uppercase tracking-tight text-zinc-950">
            Payment QR
          </h2>
          <p className="mt-3 text-base leading-6 text-zinc-600">
            Please use your mobile banking app to scan the PromptPay QR code
            below.
          </p>

          <div className="mt-8 flex items-center gap-5 rounded-xl border border-[#d8c7ea] bg-[#f6f4f8] px-7 py-5">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-[#5817b7]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/icons/Subscription/bank.svg"
                alt=""
                className="h-8 w-8"
              />
            </span>
            <div>
              <p className="text-base font-semibold tracking-wide text-zinc-500">
                Bank Account Name
              </p>
              <p className="mt-1 text-size[18px] font-semibold text-zinc-950">
                SKYSKILLS (สกายสกิล)
              </p>
            </div>
          </div>

          {selectedPackage ? (
            <div className="mt-12 flex justify-center">
              {paymentQrFailed ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  Payment QR is not configured yet.
                </div>
              ) : (
                <div className="rounded-[28px] bg-white p-8 shadow-[0_22px_50px_rgba(80,18,165,0.18)] ring-1 ring-zinc-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={config.paymentQrImageUrl}
                    alt="Payment receiving QR"
                    onError={() => setPaymentQrFailed(true)}
                    className="mx-auto h-72 w-72 object-contain"
                  />
                  <p className="mt-5 flex items-center justify-center gap-2 text-center text-base font-medium uppercase text-zinc-700">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/images/icons/Subscription/camera.svg"
                      alt=""
                      className="h-5 w-5 object-contain -translate-y-0.5"
                    />
                    Scan with any bank app
                  </p>
                </div>
              )}
            </div>
          ) : null}

          <form
            id="payment-proof-form"
            className="mt-9 space-y-4"
            onSubmit={handleSubmit}
          >
            <h3 className="text-lg font-semibold text-zinc-950">
              Upload Payment Proof
            </h3>
            <label className="flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 px-6 py-8 text-center transition hover:border-[#5012A5] hover:bg-violet-50/40">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,application/pdf"
                onChange={(event) =>
                  void handleFileChange(event.target.files?.[0] ?? null)
                }
                required
                className="sr-only"
              />
              {slipFile ? (
                <span className="flex w-full flex-col items-center gap-3">
                  {previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewUrl}
                      alt="Payment slip preview"
                      className="max-h-72 w-full rounded-lg object-contain"
                    />
                  ) : (
                    <span className="flex h-24 w-24 items-center justify-center rounded-2xl bg-[#f4f2f7] text-4xl text-[#5012A5]">
                      PDF
                    </span>
                  )}
                  <span className="max-w-full break-all text-sm font-medium text-[#5012A5]">
                    {slipFile.name}
                  </span>
                  <span className="rounded-lg border border-zinc-400 px-6 py-2 text-sm font-semibold text-zinc-950">
                    Change File
                  </span>
                </span>
              ) : (
                <>
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f4f2f7] text-3xl text-[#5012A5]">
                    ☁
                  </span>
                  <span className="mt-5 text-base font-semibold text-zinc-950">
                    Drag and drop files here or click to browse
                  </span>
                  <span className="mt-1 text-sm text-zinc-500">
                    Supports JPG, PNG or PDF (Max 5MB)
                  </span>
                  <span className="mt-5 rounded-lg border border-zinc-400 px-6 py-2 text-sm font-semibold text-zinc-950">
                    Browse Files
                  </span>
                </>
              )}
            </label>

            {qrMessage ? (
              <p className="rounded-xl bg-zinc-50 p-3 text-sm text-zinc-600">
                {qrMessage}
              </p>
            ) : null}

            <details className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <summary className="cursor-pointer text-sm font-semibold text-zinc-700">
                Optional transfer details
              </summary>
              <div className="mt-4 space-y-4">
                <label className="block">
                  <span className="text-sm font-semibold">Transfer Reference</span>
                  <input
                    value={transferReference}
                    onChange={(event) => setTransferReference(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-500"
                    placeholder="Optional transaction ID from slip"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold">Mini-QR Payload</span>
                  <textarea
                    value={miniQrPayload}
                    onChange={(event) => setMiniQrPayload(event.target.value)}
                    rows={3}
                    className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-500"
                    placeholder="Auto-filled when the browser can read the slip QR"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold">Note</span>
                  <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    rows={2}
                    className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-500"
                    placeholder="Optional note for admin"
                  />
                </label>
              </div>
            </details>

            <button
              type="submit"
              disabled={isSubmitting || !selectedPackage}
              className="flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#5817b7] px-5 text-base font-semibold text-white shadow-sm transition hover:bg-[#5012A5] disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500"
            >
              {isSubmitting ? "Verifying..." : "Submit Payment"}
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs text-[#5012A5]">
                ✓
              </span>
            </button>

            {error ? (
              <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm font-medium text-red-700">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
                {success}
              </div>
            ) : null}
          </form>
        </section>
      </div>
    </div>
  );
}
