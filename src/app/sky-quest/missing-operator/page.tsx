"use client";

import { useState } from "react";
import TopicLayout from "@/components/TopicLayout";
import ModeSelection from "@/components/missing-operator/ModeSelection";
import QuizInterface from "@/components/missing-operator/QuizInterface";
import type { MissingOperatorQuizResponse } from "@/types";

export default function MissingOperatorPage() {
  const [quizData, setQuizData] = useState<MissingOperatorQuizResponse | null>(
    null,
  );

  if (quizData) {
    return <QuizInterface quizData={quizData} onRestart={() => setQuizData(null)} />;
  }

  return (
    <TopicLayout
      title="Missing Operator"
      description="Practice arithmetic and mental math."
      fullWidth={true}
    >
      <ModeSelection onStart={setQuizData} />
    </TopicLayout>
  );
}
