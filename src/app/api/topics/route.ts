import { NextResponse } from "next/server";
import { getCurrentAccountUser } from "@/lib/account/auth";
import { getTopicsWithAccess } from "@/lib/account/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentAccountUser();
  const access = await getTopicsWithAccess(user);
  return NextResponse.json(access);
}
