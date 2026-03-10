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

  return (
    <TopicLayout
      title="Number Series"
      description="Find the pattern in numerical sequences."
    >
      {!quizData ? (
        <ModeSelection onStart={setQuizData} />
      ) : (
        <QuizInterface quizData={quizData} onRestart={() => setQuizData(null)} />
      )}
    </TopicLayout>
  );
}
