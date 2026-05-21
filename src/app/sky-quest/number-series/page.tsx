"use client";

import { useState } from "react";
import TopicLayout from "@/components/TopicLayout";
import ModeSelection from "@/components/number-series/ModeSelection";
import QuizInterface from "@/components/number-series/QuizInterface";
import type { NumberSeriesQuizResponse } from "@/types";

export default function NumberSeriesPage() {
  const [quizData, setQuizData] = useState<NumberSeriesQuizResponse | null>(
    null
  );

  if (quizData) {
    return <QuizInterface quizData={quizData} onRestart={() => setQuizData(null)} />;
  }

  return (
    <TopicLayout
      title="Number Series"
      description="Find the pattern in numerical sequences."
      fullWidth={true}
    >
      <ModeSelection onStart={setQuizData} />
    </TopicLayout>
  );
}
