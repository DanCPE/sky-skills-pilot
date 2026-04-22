"use client";

import { useState } from "react";
import TopicLayout from "@/components/TopicLayout";
import ModeSelection from "@/components/passage-recall/ModeSelection";
import QuizInterface from "@/components/passage-recall/QuizInterface";
import type { ShortTermMemoryQuizResponse } from "@/types";

export default function PassageRecallPage() {
  const [quizData, setQuizData] = useState<ShortTermMemoryQuizResponse | null>(null);

  const handlePassageExpired = () => {
    setQuizData((current) =>
      current
        ? {
            ...current,
            passage: null,
          }
        : current,
    );
  };

  if (quizData) {
    return (
      <QuizInterface
        quizData={quizData}
        onRestart={() => setQuizData(null)}
        onPassageExpired={handlePassageExpired}
      />
    );
  }

  return (
    <TopicLayout
      title="Passage Recall"
      description="Memorize a randomized aviation passage, then answer recall questions after it disappears."
      fullWidth
    >
      <ModeSelection onStart={setQuizData} />
    </TopicLayout>
  );
}
