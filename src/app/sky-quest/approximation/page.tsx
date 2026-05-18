"use client";

import { useState } from "react";
import TopicLayout from "@/components/TopicLayout";
import ModeSelection from "@/components/approximation/ModeSelection";
import QuizInterface from "@/components/approximation/QuizInterface";
import type { ApproximationQuizResponse } from "@/types";

export default function ApproximationPage() {
  const [quizData, setQuizData] = useState<ApproximationQuizResponse | null>(
    null,
  );

  if (quizData) {
    return <QuizInterface quizData={quizData} onRestart={() => setQuizData(null)} />;
  }

  return (
    <TopicLayout
      title="Approximation"
      description="Estimate answers across arithmetic, units, geometry, physics, finance, and time questions."
      fullWidth={true}
    >
      <ModeSelection onStart={setQuizData} />
    </TopicLayout>
  );
}
