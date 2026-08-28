import SkyQuestBrowser from "@/components/SkyQuestBrowser";
import { topics } from "@/lib/topics";

export default function SkyQuestPage() {
  return <SkyQuestBrowser topics={topics} isPaid={false} />;
}
