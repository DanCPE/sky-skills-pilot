import { NextResponse } from "next/server";
import {
  getSubscriptionPackage,
  hasAccountDatabase,
  validatePromotionCodeForPackage,
} from "@/lib/account/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!hasAccountDatabase()) {
    return NextResponse.json(
      { error: "Account database is not configured." },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json().catch(() => null)) as
      | { code?: string; planKey?: string }
      | null;

    const code = String(body?.code ?? "").trim();
    const planKey = String(body?.planKey ?? "").trim();
    const subscriptionPackage = planKey
      ? await getSubscriptionPackage(planKey)
      : null;

    if (!subscriptionPackage || !subscriptionPackage.isActive) {
      return NextResponse.json(
        { error: "Selected package is not available." },
        { status: 400 },
      );
    }

    const appliedPromotion = code
      ? await validatePromotionCodeForPackage({
          code,
          packageKey: subscriptionPackage.key,
          originalAmountCents: subscriptionPackage.priceCents,
        })
      : null;

    if (!appliedPromotion) {
      return NextResponse.json(
        { error: "Promotion code is invalid for this package." },
        { status: 400 },
      );
    }

    return NextResponse.json({
      promotion: appliedPromotion.promotion,
      originalAmountThb: appliedPromotion.originalAmountCents / 100,
      discountThb: appliedPromotion.discountCents / 100,
      finalAmountThb: appliedPromotion.finalAmountCents / 100,
    });
  } catch (error) {
    console.error("[billing-promo] failed to validate promotion", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { error: "Failed to validate promotion code." },
      { status: 500 },
    );
  }
}
