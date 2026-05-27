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
  const file = await getSubscriptionPackageFile(packageKey, "qr");

  if (!file) {
    return NextResponse.json({ error: "QR image is not configured." }, { status: 404 });
  }

  return new NextResponse(Uint8Array.from(file.bytes).buffer, {
    headers: {
      "Content-Type": file.contentType,
      "Cache-Control": "public, max-age=300",
    },
  });
}
