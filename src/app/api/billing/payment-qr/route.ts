import { NextResponse } from "next/server";
import { getBillingAssetFile, hasAccountDatabase } from "@/lib/account/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!hasAccountDatabase()) {
    return NextResponse.json(
      { error: "Account database is not configured." },
      { status: 503 },
    );
  }

  const file = await getBillingAssetFile("payment_qr");
  if (!file) {
    return NextResponse.json(
      { error: "Payment QR is not configured." },
      { status: 404 },
    );
  }

  const body = new ArrayBuffer(file.bytes.byteLength);
  new Uint8Array(body).set(file.bytes);

  return new NextResponse(body, {
    headers: {
      "Content-Type": file.contentType,
      "Content-Disposition": `inline; filename="${file.fileName.replaceAll('"', "")}"`,
      "Cache-Control": "no-cache, max-age=0, must-revalidate",
    },
  });
}
