"use client";

import { useState } from "react";
import TopicLayout from "@/components/TopicLayout";
import ModeSelection from "@/components/joy-stick-game/ModeSelection";
import QuizInterface from "@/components/joy-stick-game/QuizInterface";
import type { JoyStickGameQuizResponse } from "@/types";

export default function JoyStickGamePage() {
  const [quizData, setQuizData] = useState<JoyStickGameQuizResponse | null>(null);

  if (quizData) {
    return <QuizInterface quizData={quizData} onRestart={() => setQuizData(null)} />;
  }

  return (
    <TopicLayout
      title="Joy-Stick Game"
      description="Capture color targets, avoid moving obstacles, and answer questions under pressure."
      fullWidth={true}
    >
      <ModeSelection onStart={setQuizData} />
    </TopicLayout>
  );
}
