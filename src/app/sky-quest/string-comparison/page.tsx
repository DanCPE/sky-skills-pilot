"use client";

import { useState } from "react";
import TopicLayout from "@/components/TopicLayout";
import ModeSelection from "@/components/string-comparison/ModeSelection";
import QuizInterface from "@/components/string-comparison/QuizInterface";
import type { ScanningPracticeQuizResponse } from "@/types";

export default function ScanningPracticePage() {
  const [quizData, setQuizData] = useState<ScanningPracticeQuizResponse | null>(
    null,
  );

  return (
    <TopicLayout
      title="String Comparison"
      description="Quickly compare alphanumeric strings and identify differences."
      fullWidth={true}
    >
      {!quizData ? (
        <ModeSelection onStart={setQuizData} />
      ) : (
        <QuizInterface quizData={quizData} onRestart={() => setQuizData(null)} />
      )}
    </TopicLayout>
  );
}
