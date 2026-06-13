"use client";

import { useState } from "react";
import TopicLayout from "@/components/TopicLayout";
import ModeSelection from "@/components/box-unfolding/ModeSelection";
import QuizInterface from "@/components/box-unfolding/QuizInterface";
import type { BoxFoldingQuizResponse } from "@/types";

export default function BoxUnfoldingPage() {
  const [quizData, setQuizData] = useState<BoxFoldingQuizResponse | null>(null);

  if (quizData) {
    return <QuizInterface quizData={quizData} onRestart={() => setQuizData(null)} />;
  }

  return (
    <TopicLayout
      title="Box Unfolding"
      description="Rotate a folded cube and find the flat net that unfolds from it."
      fullWidth={true}
      showBackLink={true}
    >
      <ModeSelection onStart={setQuizData} />
    </TopicLayout>
  );
}
