import { NextResponse } from "next/server";
import { readNewsItems } from "@/lib/news";

export const runtime = "nodejs";

export async function GET() {
  try {
    const items = await readNewsItems();
    return NextResponse.json({
      items: items.filter((item) => item.isPublished),
    });
  } catch (error) {
    console.error("[news] failed to read news items:", error);
    return NextResponse.json(
      { error: "Failed to load news." },
      { status: 500 },
    );
  }
}
