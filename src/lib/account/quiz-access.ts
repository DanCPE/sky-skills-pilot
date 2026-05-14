import { NextResponse } from "next/server";
import { getCurrentAccountUser } from "./auth";
import { getTopicAccessState } from "./db";

export async function getTopicAccessDeniedResponse(topicSlug: string) {
  const user = await getCurrentAccountUser();
  const access = await getTopicAccessState(topicSlug, user);

  if (access.canAccess) return null;

  return NextResponse.json(
    {
      error: "This quiz requires paid access.",
      code: "PAID_ACCESS_REQUIRED",
      topicSlug,
    },
    { status: 402 },
  );
}
