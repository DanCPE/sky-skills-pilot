import { NextResponse } from "next/server";
import { requireAdminApiAccess } from "@/lib/account/admin";
import {
  bulkUpdatePromotionCodes,
  generateOneTimePromotionCodes,
  getAdminBillingOverview,
  hasAccountDatabase,
  upsertPromotionCode,
  type PromotionDiscountType,
} from "@/lib/account/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function nullableNumber(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function nullableDate(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text ? new Date(text).toISOString() : null;
}

export async function POST(request: Request) {
  const forbiddenResponse = await requireAdminApiAccess(request);
  if (forbiddenResponse) return forbiddenResponse;

  if (!hasAccountDatabase()) {
    return NextResponse.json(
      { error: "Account database is not configured." },
      { status: 503 },
    );
  }

  try {
    const formData = await request.formData();
    const mode = String(formData.get("mode") ?? "single");

    if (mode === "batch") {
      const promotions = await generateOneTimePromotionCodes({
        prefix: String(formData.get("prefix") ?? ""),
        quantity: Number(formData.get("quantity") ?? 0),
        packageKey: String(formData.get("packageKey") ?? "captain"),
        discountType: String(
          formData.get("discountType") ?? "percent",
        ) as PromotionDiscountType,
        discountValue: Number(formData.get("discountValue") ?? 0),
        isActive: formData.getAll("isActive").map(String).includes("true"),
      });

      return NextResponse.json({
        promotions,
        overview: await getAdminBillingOverview(),
      });
    }

    const promotion = await upsertPromotionCode({
      code: String(formData.get("code") ?? ""),
      promotionType: "shared",
      packageKey: String(formData.get("packageKey") ?? "captain"),
      discountType: String(
        formData.get("discountType") ?? "percent",
      ) as PromotionDiscountType,
      discountValue: Number(formData.get("discountValue") ?? 0),
      maxRedemptions: nullableNumber(formData.get("maxRedemptions")),
      startsAt: nullableDate(formData.get("startsAt")),
      endsAt: nullableDate(formData.get("endsAt")),
      isActive: formData.getAll("isActive").map(String).includes("true"),
    });

    return NextResponse.json({
      promotion,
      overview: await getAdminBillingOverview(),
    });
  } catch (error) {
    console.error("[admin-billing] failed to save promotion", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to save promotion.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const forbiddenResponse = await requireAdminApiAccess(request);
  if (forbiddenResponse) return forbiddenResponse;

  if (!hasAccountDatabase()) {
    return NextResponse.json(
      { error: "Account database is not configured." },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json().catch(() => null)) as
      | { codes?: string[]; action?: "activate" | "deactivate" }
      | null;

    if (
      !body ||
      !Array.isArray(body.codes) ||
      (body.action !== "activate" && body.action !== "deactivate")
    ) {
      return NextResponse.json(
        { error: "codes and action are required." },
        { status: 400 },
      );
    }

    const promotions = await bulkUpdatePromotionCodes({
      codes: body.codes,
      action: body.action,
    });

    return NextResponse.json({
      promotions,
      overview: await getAdminBillingOverview(),
    });
  } catch (error) {
    console.error("[admin-billing] failed to bulk update promotions", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update promotion codes.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const forbiddenResponse = await requireAdminApiAccess(request);
  if (forbiddenResponse) return forbiddenResponse;

  if (!hasAccountDatabase()) {
    return NextResponse.json(
      { error: "Account database is not configured." },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json().catch(() => null)) as
      | { codes?: string[] }
      | null;

    if (!body || !Array.isArray(body.codes)) {
      return NextResponse.json(
        { error: "codes are required." },
        { status: 400 },
      );
    }

    const promotions = await bulkUpdatePromotionCodes({
      codes: body.codes,
      action: "delete",
    });

    return NextResponse.json({
      promotions,
      overview: await getAdminBillingOverview(),
    });
  } catch (error) {
    console.error("[admin-billing] failed to bulk delete promotions", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete promotion codes.",
      },
      { status: 500 },
    );
  }
}
