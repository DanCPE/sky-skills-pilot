"use client";

import { useState } from "react";
import TopicLayout from "@/components/TopicLayout";
import ModeSelection from "@/components/scanning-shape/ModeSelection";
import QuizInterface from "@/components/scanning-shape/QuizInterface";
import type { ScanningShapeQuizResponse } from "@/types";

export default function ScanningShapePage() {
  const [quizData, setQuizData] = useState<ScanningShapeQuizResponse | null>(
    null,
  );

  if (quizData) {
    return <QuizInterface quizData={quizData} onRestart={() => setQuizData(null)} />;
  }

  return (
    <TopicLayout
      title="Scanning Shape"
      description="Scan shape panels and identify hidden letters across timed visual sections."
      fullWidth
    >
      <ModeSelection onStart={setQuizData} />
    </TopicLayout>
  );
}
