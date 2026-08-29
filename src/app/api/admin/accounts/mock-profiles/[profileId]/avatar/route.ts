import { NextResponse } from "next/server";
import { requireAdminApiAccess } from "@/lib/account/admin";
import {
  hasAccountDatabase,
  updateMockAccountProfileImage,
} from "@/lib/account/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_PROFILE_IMAGE_BYTES = 750 * 1024;
const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

class ProfileImageInputError extends Error {}

function isUploadedFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0;
}

async function fileToDataUrl(file: File) {
  if (!allowedImageTypes.has(file.type)) {
    throw new ProfileImageInputError(
      "Profile picture must be a JPG, PNG, or WEBP image.",
    );
  }

  if (file.size > MAX_PROFILE_IMAGE_BYTES) {
    throw new ProfileImageInputError(
      "Profile picture must be smaller than 750 KB.",
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  return `data:${file.type};base64,${buffer.toString("base64")}`;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ profileId: string }> },
) {
  const forbiddenResponse = await requireAdminApiAccess(request);
  if (forbiddenResponse) return forbiddenResponse;

  if (!hasAccountDatabase()) {
    return NextResponse.json(
      { error: "Account database is not configured." },
      { status: 503 },
    );
  }

  try {
    const { profileId } = await params;
    const formData = await request.formData();
    const action = String(formData.get("action") ?? "upload");
    const file = formData.get("image");

    const imageUrl =
      action === "clear"
        ? null
        : isUploadedFile(file)
          ? await fileToDataUrl(file)
          : undefined;

    if (imageUrl === undefined) {
      return NextResponse.json(
        { error: "Choose a profile picture to upload." },
        { status: 400 },
      );
    }

    const profile = await updateMockAccountProfileImage({
      profileId,
      imageUrl,
    });

    return NextResponse.json({ profile });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update mock profile picture.";
    const status = error instanceof ProfileImageInputError ? 400 : 500;

    console.error("[admin-accounts] failed to update mock profile avatar", {
      error: message,
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json({ error: message }, { status });
  }
}
