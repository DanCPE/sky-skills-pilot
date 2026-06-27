import { NextResponse } from "next/server";
import { getCurrentAccountUser } from "@/lib/account/auth";
import {
  createManualPaymentSlip,
  getManualPaymentConfig,
  getManualPaymentSlipBySlip2GoTransRef,
  getManualPaymentSlipsForFleet,
  getSubscriptionPackage,
  getSubscriptionPackages,
  hasAccountDatabase,
  validatePromotionCodeForPackage,
} from "@/lib/account/db";
import {
  isSlip2GoConfigured,
  validateSlip2GoReceiver,
  verifySlipWithSlip2Go,
  type Slip2GoVerificationResult,
} from "@/lib/slip2go";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SLIP_BYTES = 6 * 1024 * 1024;
const allowedContentTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

function toPayloadRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return { value };
}

function cents(value: number | null) {
  return value === null ? null : Math.round(value * 100);
}

function slipRejectionReason(
  verification: Slip2GoVerificationResult,
  expectedAmountCents: number,
  receiverRejectionReason?: string | null,
) {
  if (!verification.ok) {
    return verification.error ?? "Slip2Go could not validate this slip.";
  }
  if (!verification.verified) {
    const details = verification.message ? ` ${verification.message}` : "";
    if (verification.status === "200401") {
      return `Slip2Go rejected this slip because the destination bank account does not match the configured receiving account.${details}`;
    }
    return `Slip2Go rejected this slip with status: ${verification.status}.${details}`;
  }
  if (!verification.transRef) {
    return "Slip2Go did not return a transaction reference.";
  }

  const verifiedAmountCents = cents(verification.amountThb);
  if (verifiedAmountCents === null) {
    return "Slip2Go did not return a transfer amount.";
  }
  if (verifiedAmountCents !== expectedAmountCents) {
    return `Transfer amount does not match selected package. Expected ${expectedAmountCents / 100} THB, got ${verifiedAmountCents / 100} THB.`;
  }
  if (receiverRejectionReason) {
    return receiverRejectionReason;
  }

  return null;
}

function hasProxyReceiverData(verification: Slip2GoVerificationResult) {
  const raw = verification.raw;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return false;

  const data = (raw as Record<string, unknown>).data;
  if (!data || typeof data !== "object" || Array.isArray(data)) return false;

  const receiver = (data as Record<string, unknown>).receiver;
  if (!receiver || typeof receiver !== "object" || Array.isArray(receiver)) {
    return false;
  }

  const account = (receiver as Record<string, unknown>).account;
  if (!account || typeof account !== "object" || Array.isArray(account)) {
    return false;
  }

  const proxy = (account as Record<string, unknown>).proxy;
  return Boolean(proxy && typeof proxy === "object" && !Array.isArray(proxy));
}

export async function GET() {
  if (!hasAccountDatabase()) {
    return NextResponse.json(
      { error: "Account database is not configured." },
      { status: 503 },
    );
  }

  const user = await getCurrentAccountUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  return NextResponse.json({
    config: await getManualPaymentConfig(),
    packages: await getSubscriptionPackages(),
    slips: await getManualPaymentSlipsForFleet(user.fleetId),
  });
}

export async function POST(request: Request) {
  if (!hasAccountDatabase()) {
    return NextResponse.json(
      { error: "Account database is not configured." },
      { status: 503 },
    );
  }

  const user = await getCurrentAccountUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const packageKey = String(formData.get("planKey") ?? "");
    const promotionCode = String(formData.get("promotionCode") ?? "").trim();
    const subscriptionPackage = packageKey
      ? await getSubscriptionPackage(packageKey)
      : null;
    const slipFile = formData.get("slip");

    if (!subscriptionPackage || !subscriptionPackage.isActive) {
      return NextResponse.json(
        { error: "Selected package is not available." },
        { status: 400 },
      );
    }

    if (!(slipFile instanceof File)) {
      return NextResponse.json(
        { error: "Payment slip file is required." },
        { status: 400 },
      );
    }

    if (!allowedContentTypes.has(slipFile.type)) {
      return NextResponse.json(
        { error: "Slip must be a JPG, PNG, WEBP, or PDF file." },
        { status: 400 },
      );
    }

    if (slipFile.size <= 0 || slipFile.size > MAX_SLIP_BYTES) {
      return NextResponse.json(
        { error: "Slip file must be 6MB or smaller." },
        { status: 400 },
      );
    }

    const slipBytes = Buffer.from(await slipFile.arrayBuffer());
    const miniQrPayload = String(formData.get("miniQrPayload") ?? "");
    const appliedPromotion = promotionCode
      ? await validatePromotionCodeForPackage({
          code: promotionCode,
          packageKey: subscriptionPackage.key,
          originalAmountCents: subscriptionPackage.priceCents,
        })
      : null;

    if (promotionCode && !appliedPromotion) {
      return NextResponse.json(
        { error: "Promotion code is invalid for this package." },
        { status: 400 },
      );
    }

    const expectedAmountCents =
      appliedPromotion?.finalAmountCents ?? subscriptionPackage.priceCents;
    const expectedAmountThb = expectedAmountCents / 100;
    const manualPaymentConfig = await getManualPaymentConfig();
    const receiverAccountNumber = manualPaymentConfig.accountNumber.trim();
    const receiverPromptPayId = manualPaymentConfig.promptPayId.trim();
    const receiverAccountName = manualPaymentConfig.accountName.trim();
    const manualFallbackEnabled =
      process.env.SLIP2GO_ALLOW_MANUAL_FALLBACK === "true";

    if (!isSlip2GoConfigured()) {
      if (!manualFallbackEnabled) {
        return NextResponse.json(
          {
            error:
              "Slip2Go is not configured. Set SLIP2GO_API_URL before accepting automatic slip payments.",
          },
          { status: 503 },
        );
      }

      const fallbackSlip = await createManualPaymentSlip({
        user,
        amountThb: expectedAmountThb,
        planKey: subscriptionPackage.key,
        promotionCode: appliedPromotion?.promotion.code,
        originalAmountThb: appliedPromotion
          ? subscriptionPackage.priceThb
          : undefined,
        discountThb: appliedPromotion
          ? appliedPromotion.discountCents / 100
          : undefined,
        transferReference: String(formData.get("transferReference") ?? ""),
        miniQrPayload,
        note: String(formData.get("note") ?? ""),
        verificationError: "Slip2Go was not configured; queued for manual review.",
        slipFileName: slipFile.name || "payment-slip",
        slipContentType: slipFile.type,
        slipBytes,
      });

      return NextResponse.json(
        {
          slip: fallbackSlip,
          message: "Slip2Go is not configured; slip queued for manual approval.",
        },
        { status: 201 },
      );
    }

    if (!receiverAccountNumber && !receiverPromptPayId && !receiverAccountName) {
      return NextResponse.json(
        {
          error:
            "Payment receiver is not configured. Set the account number, PromptPay/Biller ID, or account name in the admin billing QR settings before accepting automatic slip payments.",
        },
        { status: 503 },
      );
    }

    let verification = await verifySlipWithSlip2Go({
      miniQrPayload,
      receiverAccountNumbers: receiverAccountNumber
        ? [receiverAccountNumber]
        : undefined,
      receiverAccountType: process.env.SLIP2GO_RECEIVER_ACCOUNT_TYPE ?? "03000",
      slipFileName: slipFile.name || "payment-slip",
      slipContentType: slipFile.type,
      slipBytes,
    });
    if (
      verification.status === "200401" &&
      receiverAccountNumber &&
      hasProxyReceiverData(verification)
    ) {
      console.warn("[manual-payment] retrying Slip2Go without bank receiver check because slip receiver is a proxy", {
        fleetId: user.fleetId,
        slip2goStatus: verification.status,
        slip2goMessage: verification.message,
      });
      verification = await verifySlipWithSlip2Go({
        miniQrPayload,
        slipFileName: slipFile.name || "payment-slip",
        slipContentType: slipFile.type,
        slipBytes,
      });
    }
    const receiverValidation = verification.verified
      ? validateSlip2GoReceiver(verification.raw, {
          accountNumber: receiverAccountNumber,
          accountName: receiverAccountName,
          promptPayId: receiverPromptPayId,
        })
      : { ok: false, reason: null };
    const rejectionReason = slipRejectionReason(
      verification,
      expectedAmountCents,
      receiverValidation.ok ? null : receiverValidation.reason,
    );

    if (verification.transRef) {
      const duplicate = await getManualPaymentSlipBySlip2GoTransRef(
        verification.transRef,
      );
      if (duplicate) {
        console.warn("[manual-payment] duplicate Slip2Go transRef rejected", {
          fleetId: user.fleetId,
          duplicateSlipId: duplicate.id,
          transRef: verification.transRef,
        });
        return NextResponse.json(
          { error: "This bank transfer slip has already been used." },
          { status: 409 },
        );
      }
    }

    const slip = await createManualPaymentSlip({
      user,
      amountThb: expectedAmountThb,
      planKey: subscriptionPackage.key,
      promotionCode: appliedPromotion?.promotion.code,
      originalAmountThb: appliedPromotion ? subscriptionPackage.priceThb : undefined,
      discountThb: appliedPromotion
        ? appliedPromotion.discountCents / 100
        : undefined,
      transferReference: String(formData.get("transferReference") ?? ""),
      miniQrPayload,
      note: String(formData.get("note") ?? ""),
      status: rejectionReason ? "rejected" : "approved",
      reviewedBy: "slip2go",
      slip2goStatus: verification.status,
      slip2goTransRef: verification.transRef,
      slip2goAmountThb: verification.amountThb,
      slip2goPayload: toPayloadRecord(verification.raw),
      verificationError: rejectionReason,
      slipFileName: slipFile.name || "payment-slip",
      slipContentType: slipFile.type,
      slipBytes,
    });

    console.log("[manual-payment] Slip2Go verification completed", {
      fleetId: user.fleetId,
      slipId: slip.id,
      status: slip.status,
      slip2goStatus: verification.status,
      slip2goHttpStatus: verification.httpStatus,
      slip2goEndpoint: verification.endpoint,
      slip2goRequestMode: verification.requestMode,
      transRef: verification.transRef,
      verifiedAmountThb: verification.amountThb,
      expectedAmountThb,
      receiverAccountNumber,
      hasReceiverPromptPayId: Boolean(receiverPromptPayId),
      receiverValidationOk: receiverValidation.ok,
      receiverValidationReason: receiverValidation.reason,
      promotionCode: appliedPromotion?.promotion.code ?? null,
      discountThb: appliedPromotion ? appliedPromotion.discountCents / 100 : 0,
      durationMs: verification.durationMs,
      rejected: Boolean(rejectionReason),
      rejectionReason,
    });

    return NextResponse.json(
      {
        slip,
        verification: {
          status: verification.status,
          httpStatus: verification.httpStatus,
          requestMode: verification.requestMode,
          transRef: verification.transRef,
          amountThb: verification.amountThb,
          durationMs: verification.durationMs,
        },
        message: rejectionReason
          ? `Slip rejected: ${rejectionReason}`
          : "Slip verified by Slip2Go. Paid access is active.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[manual-payment] failed to submit slip", {
      fleetId: user.fleetId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to submit payment slip.",
      },
      { status: 500 },
    );
  }
}
