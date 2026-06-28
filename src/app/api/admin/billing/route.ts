import { NextResponse } from "next/server";
import { requireAdminApiAccess } from "@/lib/account/admin";
import {
  getAdminBillingOverview,
  hasAccountDatabase,
  reviewManualPaymentSlip,
  setManualPaymentPersonalFilesSent,
  setFleetManualSubscription,
  setQuizAccessRule,
  type SubscriptionStatus,
} from "@/lib/account/db";

export const runtime = "nodejs";

const subscriptionStatuses = new Set<SubscriptionStatus>([
  "active",
  "not_started",
  "canceled",
  "past_due",
  "trialing",
]);

export async function GET(request: Request) {
  const forbiddenResponse = await requireAdminApiAccess(request);
  if (forbiddenResponse) return forbiddenResponse;

  if (!hasAccountDatabase()) {
    return NextResponse.json(
      { error: "Account database is not configured." },
      { status: 503 },
    );
  }

  try {
    return NextResponse.json(await getAdminBillingOverview());
  } catch (error) {
    console.error("[admin-billing] failed to load billing overview", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { error: "Failed to load billing overview." },
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
      | {
          type?: string;
          fleetId?: string;
          email?: string;
          status?: SubscriptionStatus;
          topicSlug?: string;
          isLocked?: boolean;
          slipId?: string;
          action?: "approve" | "reject";
          reviewedBy?: string;
          rejectionReason?: string;
          sent?: boolean;
        }
      | null;

    if (!body || typeof body.type !== "string") {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    if (body.type === "fleet") {
      if (!body.status || !subscriptionStatuses.has(body.status)) {
        return NextResponse.json(
          { error: "Invalid subscription status." },
          { status: 400 },
        );
      }

      if (!body.fleetId && !body.email) {
        return NextResponse.json(
          { error: "fleetId or email is required." },
          { status: 400 },
        );
      }

      const subscription = await setFleetManualSubscription({
        fleetId: body.fleetId,
        email: body.email,
        status: body.status,
      });

      return NextResponse.json({
        subscription,
        overview: await getAdminBillingOverview(),
      });
    }

    if (body.type === "quiz") {
      if (!body.topicSlug || typeof body.isLocked !== "boolean") {
        return NextResponse.json(
          { error: "topicSlug and isLocked are required." },
          { status: 400 },
        );
      }

      const quizAccess = await setQuizAccessRule({
        topicSlug: body.topicSlug,
        isLocked: body.isLocked,
      });

      return NextResponse.json({
        quizAccess,
        overview: await getAdminBillingOverview(),
      });
    }

    if (body.type === "slip") {
      if (!body.slipId || (body.action !== "approve" && body.action !== "reject")) {
        return NextResponse.json(
          { error: "slipId and action are required." },
          { status: 400 },
        );
      }

      const slip = await reviewManualPaymentSlip({
        slipId: body.slipId,
        action: body.action,
        reviewedBy: body.reviewedBy,
        rejectionReason: body.rejectionReason,
      });

      return NextResponse.json({
        slip,
        overview: await getAdminBillingOverview(),
      });
    }

    if (body.type === "personal-files") {
      if (!body.slipId || typeof body.sent !== "boolean") {
        return NextResponse.json(
          { error: "slipId and sent are required." },
          { status: 400 },
        );
      }

      const slip = await setManualPaymentPersonalFilesSent({
        slipId: body.slipId,
        sent: body.sent,
      });

      return NextResponse.json({
        slip,
        overview: await getAdminBillingOverview(),
      });
    }

    return NextResponse.json({ error: "Unknown update type." }, { status: 400 });
  } catch (error) {
    console.error("[admin-billing] failed to update billing config", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update billing config.",
      },
      { status: 500 },
    );
  }
}
