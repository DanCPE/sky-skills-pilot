import { NextResponse } from "next/server";
import {
  getAdminBillingOverview,
  hasAccountDatabase,
  updateSubscriptionPackage,
} from "@/lib/account/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

async function readOptionalImage(formData: FormData, key: string) {
  const file = formData.get(key);
  if (!(file instanceof File) || file.size === 0) return null;

  if (!allowedImageTypes.has(file.type)) {
    throw new Error(`${key} must be a JPG, PNG, or WEBP image.`);
  }

  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error(`${key} must be 4MB or smaller.`);
  }

  return {
    fileName: file.name || key,
    contentType: file.type,
    bytes: Buffer.from(await file.arrayBuffer()),
  };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ packageKey: string }> },
) {
  if (!hasAccountDatabase()) {
    return NextResponse.json(
      { error: "Account database is not configured." },
      { status: 503 },
    );
  }

  try {
    const { packageKey } = await params;
    const formData = await request.formData();
    const details = String(formData.get("details") ?? "")
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    const pkg = await updateSubscriptionPackage({
      key: packageKey,
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      details,
      priceThb: Number(formData.get("priceThb") ?? 0),
      currency: String(formData.get("currency") ?? "THB"),
      isActive: formData.getAll("isActive").map(String).includes("true"),
      sortOrder: Number(formData.get("sortOrder") ?? 0),
      image: await readOptionalImage(formData, "image"),
      qrImage: await readOptionalImage(formData, "qrImage"),
    });

    return NextResponse.json({
      package: pkg,
      overview: await getAdminBillingOverview(),
    });
  } catch (error) {
    console.error("[admin-billing] failed to update subscription package", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update subscription package.",
      },
      { status: 500 },
    );
  }
}
