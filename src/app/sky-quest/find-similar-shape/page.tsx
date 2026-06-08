"use client";

import { useState } from "react";
import TopicLayout from "@/components/TopicLayout";
import ModeSelection from "@/components/find-similar-shape/ModeSelection";
import QuizInterface from "@/components/find-similar-shape/QuizInterface";
import type { FindSimilarShapeQuizResponse } from "@/types";

export default function FindSimilarShapePage() {
  const [quizData, setQuizData] =
    useState<FindSimilarShapeQuizResponse | null>(null);

  if (quizData) {
    return <QuizInterface quizData={quizData} onRestart={() => setQuizData(null)} />;
  }

  return (
    <TopicLayout
      title="Find Similar Shape"
      description="Find the answer choice that exactly matches the target shape."
      fullWidth
      showBackLink
    >
      <ModeSelection onStart={setQuizData} />
    </TopicLayout>
  );
}
