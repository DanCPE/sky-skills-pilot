"use client";

import { useState } from "react";
import TopicLayout from "@/components/TopicLayout";
import ModeSelection from "@/components/aircraft-rotation/ModeSelection";
import LearnMode from "@/components/aircraft-rotation/LearnMode";
import RealMode from "@/components/aircraft-rotation/RealMode";
import type { SpatialOrientationQuizResponse } from "@/types";

export default function SpatialOrientationPage() {
  const [quizData, setQuizData] = useState<SpatialOrientationQuizResponse | null>(null);

  // RealMode has its own full-page layout, so we don't use TopicLayout for it
  if (quizData && quizData.mode === "real") {
    return <RealMode quizData={quizData} onRestart={() => setQuizData(null)} />;
  }

  return (
    <TopicLayout
      title="Aircraft Rotation"
      description="Calculate aircraft heading changes and visualize rotations."
      fullWidth={true}
      showBackLink={!quizData}
    >
      {!quizData ? (
        <ModeSelection onStart={setQuizData} />
      ) : (
        <LearnMode onRestart={() => setQuizData(null)} />
      )}
    </TopicLayout>
  );
}
