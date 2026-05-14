import { NextResponse } from "next/server";
import { getCurrentAccountUser } from "@/lib/account/auth";
import { getTopicAccessState } from "@/lib/account/db";
import { topicSlugs } from "@/lib/topics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ topic: string }> },
) {
  const { topic } = await params;

  if (!topicSlugs.has(topic)) {
    return NextResponse.json({ error: "Topic not found." }, { status: 404 });
  }

  const user = await getCurrentAccountUser();
  const access = await getTopicAccessState(topic, user);

  return NextResponse.json(access, {
    status: access.canAccess ? 200 : 402,
  });
}
