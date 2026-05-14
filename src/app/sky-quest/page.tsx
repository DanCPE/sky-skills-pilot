import SkyQuestBrowser from "@/components/SkyQuestBrowser";
import { getCurrentAccountUser } from "@/lib/account/auth";
import { getTopicsWithAccess } from "@/lib/account/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function SkyQuestPage() {
  const user = await getCurrentAccountUser();
  const { topics, isPaid } = await getTopicsWithAccess(user);

  return <SkyQuestBrowser topics={topics} isPaid={isPaid} />;
}
