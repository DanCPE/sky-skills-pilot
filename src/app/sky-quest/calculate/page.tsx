"use client";

import { useState } from "react";
import TopicLayout from "@/components/TopicLayout";
import ModeSelection from "@/components/calculate/ModeSelection";
import QuizInterface from "@/components/calculate/QuizInterface";
import type { CalculationQuizResponse } from "@/types";

export default function CalculatePage() {
  const [quizData, setQuizData] = useState<CalculationQuizResponse | null>(null);

  if (quizData) {
    return <QuizInterface quizData={quizData} onRestart={() => setQuizData(null)} />;
  }

  return (
    <TopicLayout
      title="Calculate"
      description="Practice arithmetic and mental math."
      fullWidth={true}
    >
      <ModeSelection onStart={setQuizData} />
    </TopicLayout>
  );
}
