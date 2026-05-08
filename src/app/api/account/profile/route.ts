import { NextRequest, NextResponse } from "next/server";
import { getCurrentAccountUser } from "@/lib/account/auth";
import {
  hasAccountDatabase,
  updateAccountProfile,
} from "@/lib/account/db";

interface UpdateProfilePayload {
  name?: string;
  imageUrl?: string | null;
}

function normalizeImageUrl(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") return undefined;

  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.toString();
    }
  } catch {
    return undefined;
  }

  return undefined;
}

export async function PATCH(request: NextRequest) {
  if (!hasAccountDatabase()) {
    return NextResponse.json(
      { error: "Account database is not configured." },
      { status: 503 },
    );
  }

  const user = await getCurrentAccountUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = (await request.json()) as UpdateProfilePayload;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const imageUrl = normalizeImageUrl(body.imageUrl);

  if (name.length < 2 || name.length > 80) {
    return NextResponse.json(
      { error: "Username must be between 2 and 80 characters." },
      { status: 400 },
    );
  }

  if (imageUrl === undefined) {
    return NextResponse.json(
      { error: "Profile picture must be a valid http or https image URL." },
      { status: 400 },
    );
  }

  const updatedUser = await updateAccountProfile({
    userId: user.id,
    name,
    imageUrl,
  });

  return NextResponse.json({ user: updatedUser });
}
