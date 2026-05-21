"use client";

import { useState } from "react";
import TopicLayout from "@/components/TopicLayout";
import ModeSelection from "@/components/dern-jood/ModeSelection";
import QuizInterface from "@/components/dern-jood/QuizInterface";
import type { DernJoodQuizResponse } from "@/types";

export default function DernJoodPage() {
  const [quizData, setQuizData] = useState<DernJoodQuizResponse | null>(null);

  if (quizData) {
    return <QuizInterface quizData={quizData} onRestart={() => setQuizData(null)} />;
  }

  return (
    <TopicLayout
      title="Dern-Jood"
      description="Mental math under a metronome beat."
      fullWidth={true}
    >
      <ModeSelection onStart={setQuizData} />
    </TopicLayout>
  );
}
