import { NextResponse } from "next/server";
import { getCurrentTopicsWithAccess } from "@/lib/account/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { isPaid, topics } = await getCurrentTopicsWithAccess();
  return NextResponse.json({ isPaid, topics });
}
