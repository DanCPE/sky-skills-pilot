import { NextResponse } from "next/server";
import { getCurrentAccountUser } from "@/lib/account/auth";
import {
  createManualPaymentSlip,
  getManualPaymentConfig,
  getManualPaymentSlipsForFleet,
  getSubscriptionPackage,
  getSubscriptionPackages,
  hasAccountDatabase,
} from "@/lib/account/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SLIP_BYTES = 6 * 1024 * 1024;
const allowedContentTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

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
    config: getManualPaymentConfig(),
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
    const subscriptionPackage = packageKey
      ? await getSubscriptionPackage(packageKey)
      : null;
    const amountThb = subscriptionPackage
      ? subscriptionPackage.priceThb
      : Number(String(formData.get("amountThb") ?? ""));
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

    const slip = await createManualPaymentSlip({
      user,
      amountThb,
      planKey: subscriptionPackage.key,
      transferReference: String(formData.get("transferReference") ?? ""),
      miniQrPayload: String(formData.get("miniQrPayload") ?? ""),
      note: String(formData.get("note") ?? ""),
      slipFileName: slipFile.name || "payment-slip",
      slipContentType: slipFile.type,
      slipBytes: Buffer.from(await slipFile.arrayBuffer()),
    });

    return NextResponse.json({ slip }, { status: 201 });
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
