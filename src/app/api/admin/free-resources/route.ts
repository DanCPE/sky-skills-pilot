import { NextRequest, NextResponse } from "next/server";
import { requireAdminApiAccess } from "@/lib/account/admin";
import {
  createFreeResource,
  deleteFreeResource,
  readFreeResources,
  updateFreeResource,
} from "@/lib/free-resources";

export const runtime = "nodejs";

async function readBody(request: NextRequest) {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function getString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function getBoolean(value: unknown) {
  return typeof value === "boolean" ? value : undefined;
}

function getNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function normalizeBody(body: Record<string, unknown>) {
  return {
    title: getString(body.title),
    description: getString(body.description),
    imageUrl: getString(body.imageUrl),
    downloadUrl: getString(body.downloadUrl),
    buttonLabel: getString(body.buttonLabel),
    isPublished: getBoolean(body.isPublished),
    sortOrder: getNumber(body.sortOrder),
  };
}

export async function GET(request: NextRequest) {
  const forbiddenResponse = await requireAdminApiAccess(request);
  if (forbiddenResponse) return forbiddenResponse;

  try {
    return NextResponse.json({ resources: await readFreeResources() });
  } catch (error) {
    console.error("[admin-free-resources] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to load free resources." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const forbiddenResponse = await requireAdminApiAccess(request);
  if (forbiddenResponse) return forbiddenResponse;

  try {
    const resource = await createFreeResource(normalizeBody(await readBody(request)));
    return NextResponse.json({ resource }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create resource.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  const forbiddenResponse = await requireAdminApiAccess(request);
  if (forbiddenResponse) return forbiddenResponse;

  try {
    const body = await readBody(request);
    const id = getString(body.id);

    if (!id) {
      return NextResponse.json({ error: "Resource id is required." }, { status: 400 });
    }

    const resource = await updateFreeResource(id, normalizeBody(body));
    if (!resource) {
      return NextResponse.json({ error: "Resource not found." }, { status: 404 });
    }

    return NextResponse.json({ resource });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update resource.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const forbiddenResponse = await requireAdminApiAccess(request);
  if (forbiddenResponse) return forbiddenResponse;

  try {
    const id = request.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Resource id is required." }, { status: 400 });
    }

    const deleted = await deleteFreeResource(id);
    if (!deleted) {
      return NextResponse.json({ error: "Resource not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[admin-free-resources] DELETE failed:", error);
    return NextResponse.json(
      { error: "Failed to delete resource." },
      { status: 500 },
    );
  }
}
