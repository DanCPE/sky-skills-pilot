"use client";

import { useState } from "react";
import TopicLayout from "@/components/TopicLayout";
import ModeSelection from "@/components/string-sprint/ModeSelection";
import QuizInterface from "@/components/string-sprint/QuizInterface";
import type { StringSprintQuizResponse } from "@/types";

export default function StringSprintPage() {
  const [quizData, setQuizData] = useState<StringSprintQuizResponse | null>(
    null,
  );

  if (quizData) {
    return (
      <QuizInterface quizData={quizData} onRestart={() => setQuizData(null)} />
    );
  }

  return (
    <TopicLayout
      title="String Sprint"
      description="Make rapid same-or-different calls on string pairs under a tight clock."
      fullWidth={true}
    >
      <ModeSelection onStart={setQuizData} />
    </TopicLayout>
  );
}
