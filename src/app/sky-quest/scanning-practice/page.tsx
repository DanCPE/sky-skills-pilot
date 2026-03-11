"use client";

import { useState } from "react";
import TopicLayout from "@/components/TopicLayout";
import ModeSelection from "@/components/scanning-practice/ModeSelection";
import QuizInterface from "@/components/scanning-practice/QuizInterface";
import type { ScanningPracticeQuizResponse } from "@/types";

export default function ScanningPracticePage() {
  const [quizData, setQuizData] = useState<ScanningPracticeQuizResponse | null>(
    null,
  );

  return (
    <TopicLayout
      title="Scanning Practice"
      description="Quickly compare alphanumeric strings and identify differences."
    >
      {!quizData ? (
        <ModeSelection onStart={setQuizData} />
      ) : (
        <QuizInterface quizData={quizData} onRestart={() => setQuizData(null)} />
      )}
    </TopicLayout>
  );
}
