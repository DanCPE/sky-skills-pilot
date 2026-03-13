"use client";

import { useState } from "react";
import TopicLayout from "@/components/TopicLayout";
import ModeSelection from "@/components/spatial-orientation/ModeSelection";
import LearningMode from "@/components/spatial-orientation/LearningMode";
import PracticeMode from "@/components/spatial-orientation/PracticeMode";
import type { SpatialOrientationQuizResponse } from "@/types";

export default function SpatialOrientationPage() {
  const [quizData, setQuizData] = useState<SpatialOrientationQuizResponse | null>(null);

  return (
    <TopicLayout
      title="Spatial Orientation"
      description="Calculate aircraft heading changes and visualize rotations."
    >
      {!quizData ? (
        <ModeSelection onStart={setQuizData} />
      ) : quizData.mode === "learning" ? (
        <LearningMode onRestart={() => setQuizData(null)} />
      ) : (
        <PracticeMode quizData={quizData} onRestart={() => setQuizData(null)} />
      )}
    </TopicLayout>
  );
}
