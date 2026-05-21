"use client";

import { useState } from "react";
import TopicLayout from "@/components/TopicLayout";
import ModeSelection from "@/components/short-term-memory/ModeSelection";
import QuizInterface from "@/components/short-term-memory/QuizInterface";
import type { ShortTermMemoryQuizResponse } from "@/types";

export default function ShortTermMemoryPage() {
  const [quizData, setQuizData] = useState<ShortTermMemoryQuizResponse | null>(null);

  if (quizData) {
    return <QuizInterface quizData={quizData} onRestart={() => setQuizData(null)} />;
  }

  return (
    <TopicLayout
      title="Short-Term Memory Table"
      description="Memorize a grid of mixed characters, then recreate every cell from memory."
      fullWidth
    >
      <ModeSelection onStart={setQuizData} />
    </TopicLayout>
  );
}

