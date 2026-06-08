import { NextRequest, NextResponse } from "next/server";
import {
  createNewsItem,
  deleteNewsItem,
  readNewsItems,
  updateNewsItem,
} from "@/lib/news";

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
    date: getString(body.date),
    summary: getString(body.summary),
    isPublished: getBoolean(body.isPublished),
    sortOrder: getNumber(body.sortOrder),
  };
}

export async function GET() {
  try {
    return NextResponse.json({ items: await readNewsItems() });
  } catch (error) {
    console.error("[admin-news] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to load news items." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const item = await createNewsItem(normalizeBody(await readBody(request)));
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create news item.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await readBody(request);
    const id = getString(body.id);

    if (!id) {
      return NextResponse.json({ error: "News item id is required." }, { status: 400 });
    }

    const item = await updateNewsItem(id, normalizeBody(body));
    if (!item) {
      return NextResponse.json({ error: "News item not found." }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update news item.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "News item id is required." }, { status: 400 });
    }

    const deleted = await deleteNewsItem(id);
    if (!deleted) {
      return NextResponse.json({ error: "News item not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[admin-news] DELETE failed:", error);
    return NextResponse.json(
      { error: "Failed to delete news item." },
      { status: 500 },
    );
  }
}
