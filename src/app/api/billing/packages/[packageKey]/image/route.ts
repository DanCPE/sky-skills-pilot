import { NextResponse } from "next/server";
import { getSubscriptionPackageFile, hasAccountDatabase } from "@/lib/account/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ packageKey: string }> },
) {
  if (!hasAccountDatabase()) {
    return NextResponse.json(
      { error: "Account database is not configured." },
      { status: 503 },
    );
  }

  const { packageKey } = await params;
  const file = await getSubscriptionPackageFile(packageKey, "image");

  if (!file) {
    return NextResponse.redirect(new URL("/images/icons/Subscription/Seat.png", _request.url));
  }

  return new NextResponse(Uint8Array.from(file.bytes).buffer, {
    headers: {
      "Content-Type": file.contentType,
      "Cache-Control": "no-cache, max-age=0, must-revalidate",
    },
  });
}
