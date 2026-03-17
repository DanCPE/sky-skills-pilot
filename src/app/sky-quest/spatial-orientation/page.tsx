"use client";

import { useState } from "react";
import TopicLayout from "@/components/TopicLayout";
import ModeSelection from "@/components/spatial-orientation/ModeSelection";
import LearnMode from "@/components/spatial-orientation/LearnMode";
import RealMode from "@/components/spatial-orientation/RealMode";
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
      ) : quizData.mode === "learn" ? (
        <LearnMode onRestart={() => setQuizData(null)} />
      ) : (
        <RealMode quizData={quizData} onRestart={() => setQuizData(null)} />
      )}
    </TopicLayout>
  );
}
