import { NextResponse } from "next/server";
import {
  deletePromotionCode,
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  if (!hasAccountDatabase()) {
    return NextResponse.json(
      { error: "Account database is not configured." },
      { status: 503 },
    );
  }

  try {
    const { code } = await params;
    const formData = await request.formData();
    const promotion = await upsertPromotionCode({
      code,
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
    console.error("[admin-billing] failed to update promotion", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update promotion.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  if (!hasAccountDatabase()) {
    return NextResponse.json(
      { error: "Account database is not configured." },
      { status: 503 },
    );
  }

  try {
    const { code } = await params;
    const promotion = await deletePromotionCode(code);

    if (!promotion) {
      return NextResponse.json(
        { error: "Promotion code not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      promotion,
      overview: await getAdminBillingOverview(),
    });
  } catch (error) {
    console.error("[admin-billing] failed to delete promotion", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { error: "Failed to delete promotion." },
      { status: 500 },
    );
  }
}
