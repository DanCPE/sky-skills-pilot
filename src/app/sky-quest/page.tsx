import SkyQuestBrowser from "@/components/SkyQuestBrowser";
import { getCurrentTopicsWithAccess } from "@/lib/account/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function SkyQuestPage() {
  const { topics, isPaid } = await getCurrentTopicsWithAccess();
  return <SkyQuestBrowser topics={topics} isPaid={isPaid} />;
}
