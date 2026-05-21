import { NextResponse } from "next/server";
import { readFreeResources } from "@/lib/free-resources";

export const runtime = "nodejs";

export async function GET() {
  try {
    const resources = await readFreeResources();
    return NextResponse.json({
      resources: resources.filter((resource) => resource.isPublished),
    });
  } catch (error) {
    console.error("[free-resources] failed to read resources:", error);
    return NextResponse.json(
      { error: "Failed to load free resources." },
      { status: 500 },
    );
  }
}
