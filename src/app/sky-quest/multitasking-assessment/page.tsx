"use client";

import { useState } from "react";
import TopicLayout from "@/components/TopicLayout";
import ModeSelection from "@/components/multitasking-assessment/ModeSelection";
import QuizInterface from "@/components/multitasking-assessment/QuizInterface";
import type { MultitaskingAssessmentConfig } from "@/types";

export default function MultitaskingAssessmentPage() {
  const [config, setConfig] = useState<MultitaskingAssessmentConfig | null>(null);

  if (config) {
    return <QuizInterface config={config} onRestart={() => setConfig(null)} />;
  }

  return (
    <TopicLayout
      title="Multitasking Assessment"
      description="Monitor systems, track a moving target, handle radio calls, and balance resources in one timed run."
      fullWidth={true}
    >
      <ModeSelection onStart={setConfig} />
    </TopicLayout>
  );
}
