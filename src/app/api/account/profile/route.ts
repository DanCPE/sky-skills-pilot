import { NextRequest, NextResponse } from "next/server";
import { getCurrentAccountUser } from "@/lib/account/auth";
import { hasAccountDatabase, updateAccountProfile } from "@/lib/account/db";

export const runtime = "nodejs";

const MAX_PROFILE_IMAGE_BYTES = 750 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function isUploadedFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0;
}

async function fileToDataUrl(file: File) {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Profile picture must be a JPG, PNG, or WebP image.");
  }

  if (file.size > MAX_PROFILE_IMAGE_BYTES) {
    throw new Error("Profile picture must be smaller than 750 KB.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  return `data:${file.type};base64,${buffer.toString("base64")}`;
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

  const formData = await request.formData();
  const name = String(formData.get("name") ?? "").trim();
  const removeImage = formData.get("removeImage") === "true";
  const imageFile = formData.get("image");

  if (name.length < 2 || name.length > 80) {
    return NextResponse.json(
      { error: "Call sign must be between 2 and 80 characters." },
      { status: 400 },
    );
  }

  let imageUrl = user.imageUrl;

  try {
    if (removeImage) {
      imageUrl = null;
    } else if (isUploadedFile(imageFile)) {
      imageUrl = await fileToDataUrl(imageFile);
    }
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Profile picture could not be uploaded.",
      },
      { status: 400 },
    );
  }

  const updatedUser = await updateAccountProfile({
    profileId: user.profileId,
    name,
    imageUrl,
  });

  return NextResponse.json({ user: updatedUser });
}
