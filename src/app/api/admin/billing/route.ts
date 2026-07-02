import { NextResponse } from "next/server";
import { requireAdminApiAccess } from "@/lib/account/admin";
import {
  getAdminBillingOverview,
  hasAccountDatabase,
  reviewManualPaymentSlip,
  setManualPaymentPersonalFilesSent,
  setFleetManualSubscription,
  setQuizAccessRule,
  setQuizAccessRules,
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
          packageKey?: string | null;
          topicSlug?: string;
          topicSlugs?: string[];
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
      console.log("[admin-billing-debug] api fleet request", {
        fleetId: body.fleetId ?? null,
        email: body.email ?? null,
        status: body.status ?? null,
        packageKey: body.packageKey ?? null,
      });

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
        packageKey: body.packageKey,
      });
      const overview = await getAdminBillingOverview();
      const updatedFleet = overview.fleets.find((fleet) =>
        body.fleetId
          ? fleet.fleetId === body.fleetId
          : body.email
            ? fleet.email.toLowerCase() === body.email.toLowerCase()
            : false,
      );

      console.log("[admin-billing-debug] api fleet response", {
        subscription: subscription
          ? {
              status: subscription.status,
              currentPeriodEnd: subscription.currentPeriodEnd,
              provider: subscription.provider,
            }
          : null,
        overviewFleet: updatedFleet
          ? {
              fleetId: updatedFleet.fleetId,
              email: updatedFleet.email,
              subscriptionStatus: updatedFleet.subscriptionStatus,
              latestPackageKey: updatedFleet.latestPackageKey,
              currentPeriodEnd: updatedFleet.currentPeriodEnd,
              provider: updatedFleet.provider,
            }
          : null,
      });

      return NextResponse.json({
        subscription,
        overview,
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

    if (body.type === "quiz-bulk") {
      if (
        !Array.isArray(body.topicSlugs) ||
        body.topicSlugs.length === 0 ||
        typeof body.isLocked !== "boolean"
      ) {
        return NextResponse.json(
          { error: "topicSlugs and isLocked are required." },
          { status: 400 },
        );
      }

      const topicSlugs = body.topicSlugs.filter(
        (topicSlug): topicSlug is string => typeof topicSlug === "string",
      );
      if (topicSlugs.length === 0) {
        return NextResponse.json(
          { error: "At least one valid topic is required." },
          { status: 400 },
        );
      }

      const quizAccess = await setQuizAccessRules({
        topicSlugs,
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
