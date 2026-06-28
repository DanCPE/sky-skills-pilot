import { NextResponse } from "next/server";
import { isAdminAccountUser } from "@/lib/account/admin";
import { getCurrentAccountUser } from "@/lib/account/auth";
import { getManualPaymentSlipFile, hasAccountDatabase } from "@/lib/account/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slipId: string }> },
) {
  if (!hasAccountDatabase()) {
    return NextResponse.json(
      { error: "Account database is not configured." },
      { status: 503 },
    );
  }

  const { slipId } = await params;
  const file = await getManualPaymentSlipFile(slipId);

  if (!file) {
    return NextResponse.json({ error: "Slip not found." }, { status: 404 });
  }

  const user = await getCurrentAccountUser();
  const isAdminView = new URL(request.url).searchParams.get("admin") === "1";

  if (isAdminView && !isAdminAccountUser(user)) {
    return NextResponse.redirect(new URL("/", request.url), 303);
  }

  if (!isAdminView && user?.fleetId !== file.fleetId) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const body = Uint8Array.from(file.bytes).buffer;

  return new NextResponse(body, {
    headers: {
      "Content-Type": file.contentType,
      "Content-Disposition": `inline; filename="${file.fileName.replaceAll('"', "")}"`,
      "Cache-Control": "private, max-age=300",
    },
  });
}
