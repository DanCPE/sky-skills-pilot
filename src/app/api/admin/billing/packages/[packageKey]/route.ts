import { NextResponse } from "next/server";
import {
  getAdminBillingOverview,
  hasAccountDatabase,
  updateSubscriptionPackage,
} from "@/lib/account/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parsePackageDetailsInput(value: string) {
  const details: { label: string; subDetail?: string | null }[] = [];

  for (const rawLine of value.split("\n")) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();
    if (!trimmed) continue;

    const isSubDetail =
      /^\s+/.test(rawLine) || trimmed.startsWith("- ") || trimmed.startsWith("– ");
    const cleanedSubDetail = trimmed.replace(/^[-–]\s*/, "").trim();

    if (isSubDetail && details.length > 0) {
      const previous = details[details.length - 1];
      previous.subDetail = previous.subDetail
        ? `${previous.subDetail} ${cleanedSubDetail}`
        : cleanedSubDetail;
      continue;
    }

    details.push({ label: trimmed });
  }

  return details;
}

function parsePackageDetailsFormData(formData: FormData) {
  const labels = formData.getAll("detailLabel").map(String);
  const subDetails = formData.getAll("detailSubDetail").map(String);

  if (labels.length > 0) {
    return labels
      .map((label, index) => ({
        label: label.trim(),
        subDetail: subDetails[index]?.trim() || null,
      }))
      .filter((detail) => detail.label);
  }

  return parsePackageDetailsInput(String(formData.get("details") ?? ""));
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
    const details = parsePackageDetailsFormData(formData);

    const pkg = await updateSubscriptionPackage({
      key: packageKey,
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      details,
      priceThb: Number(formData.get("priceThb") ?? 0),
      durationMonths: Number(formData.get("durationMonths") ?? 1),
      currency: String(formData.get("currency") ?? "THB"),
      isActive: formData.getAll("isActive").map(String).includes("true"),
      sortOrder: Number(formData.get("sortOrder") ?? 0),
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
