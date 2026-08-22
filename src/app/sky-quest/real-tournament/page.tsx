import TopicLayout from "@/components/TopicLayout";
import TournamentLobby from "@/components/real-tournament/TournamentLobby";

export default function RealTournamentPage() {
  return (
    <TopicLayout
      title="Real Tournament"
      description="A fixed mixed-difficulty tournament assembled from core Sky Quests."
      fullWidth
    >
      <TournamentLobby />
    </TopicLayout>
  );
}
