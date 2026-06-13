import { NextResponse } from "next/server";
import {
  getAdminBillingOverview,
  hasAccountDatabase,
  updateManualPaymentConfig,
  updatePaymentQrAsset,
} from "@/lib/account/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function PATCH(request: Request) {
  if (!hasAccountDatabase()) {
    return NextResponse.json(
      { error: "Account database is not configured." },
      { status: 503 },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("paymentQrImage");
    const bankName = String(formData.get("bankName") ?? "");
    const accountName = String(formData.get("accountName") ?? "");
    const accountNumber = String(formData.get("accountNumber") ?? "");
    const promptPayId = String(formData.get("promptPayId") ?? "");
    const currency = String(formData.get("currency") ?? "THB");

    const hasImage = file instanceof File && file.size > 0;

    if (hasImage && !allowedImageTypes.has(file.type)) {
      return NextResponse.json(
        { error: "Payment QR must be a JPG, PNG, or WEBP image." },
        { status: 400 },
      );
    }

    if (hasImage && file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: "Payment QR must be 4MB or smaller." },
        { status: 400 },
      );
    }

    const [paymentQr, manualPaymentConfig] = await Promise.all([
      hasImage
        ? updatePaymentQrAsset({
            fileName: file.name || "payment-qr",
            contentType: file.type,
            bytes: Buffer.from(await file.arrayBuffer()),
          })
        : Promise.resolve(null),
      updateManualPaymentConfig({
        bankName,
        accountName,
        accountNumber,
        promptPayId,
        currency,
      }),
    ]);

    return NextResponse.json({
      paymentQr,
      manualPaymentConfig,
      overview: await getAdminBillingOverview(),
    });
  } catch (error) {
    console.error("[admin-billing] failed to update payment QR", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update payment QR.",
      },
      { status: 500 },
    );
  }
}
