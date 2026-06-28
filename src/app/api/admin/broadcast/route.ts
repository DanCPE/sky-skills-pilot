import { NextRequest, NextResponse } from "next/server";
import { requireAdminApiAccess } from "@/lib/account/admin";
import {
  readBroadcastSettings,
  updateBroadcastSettings,
} from "@/lib/broadcast";

export const runtime = "nodejs";

async function readBody(request: NextRequest) {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function getPhrase(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

export async function GET(request: NextRequest) {
  const forbiddenResponse = await requireAdminApiAccess(request);
  if (forbiddenResponse) return forbiddenResponse;

  try {
    return NextResponse.json({ broadcast: await readBroadcastSettings() });
  } catch (error) {
    console.error("[admin-broadcast] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to load broadcast phrase." },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  const forbiddenResponse = await requireAdminApiAccess(request);
  if (forbiddenResponse) return forbiddenResponse;

  try {
    const body = await readBody(request);
    const phrase = getPhrase(body.phrase);

    if (phrase === undefined) {
      return NextResponse.json(
        { error: "Broadcast phrase is required." },
        { status: 400 },
      );
    }

    return NextResponse.json({
      broadcast: await updateBroadcastSettings({ phrase }),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update broadcast phrase.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  return PUT(request);
}
