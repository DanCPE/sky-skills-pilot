"use client";

import { useState } from "react";
import TopicLayout from "@/components/TopicLayout";
import ModeSelection from "@/components/jigsaw/ModeSelection";
import QuizInterface from "@/components/jigsaw/QuizInterface";
import type { JigsawQuizResponse } from "@/types";

export default function JigsawPage() {
  const [quizData, setQuizData] = useState<JigsawQuizResponse | null>(null);

  if (quizData) {
    return <QuizInterface quizData={quizData} onRestart={() => setQuizData(null)} />;
  }

  return (
    <TopicLayout
      title="Jigsaw"
      description="Assemble simple loose shape parts in your head and identify the completed silhouette."
      fullWidth
      showBackLink
    >
      <ModeSelection onStart={setQuizData} />
    </TopicLayout>
  );
}
