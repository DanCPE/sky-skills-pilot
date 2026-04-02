"use client";

import SharedModeSelection from "@/components/shared/ModeSelection";
import { generateScanningShapeQuiz } from "@/lib/scanning-shape-generator";
import type { ScanningShapeQuizResponse } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSectionTime(sections: number): string {
  const totalSecs = sections * 30; // 30 seconds per section
  const m = Math.floor(totalSecs / 60);
  const s = totalSecs % 60;
  if (s === 0) return `${m} minute${m !== 1 ? "s" : ""}`;
  return `${m} minute${m !== 1 ? "s" : ""} ${s} seconds`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ModeSelection({
  onStart,
}: {
  onStart: (quizData: ScanningShapeQuizResponse) => void;
}) {
  return (
    <SharedModeSelection<ScanningShapeQuizResponse>
      subtitle="Scan shape panels and identify the hidden letter inside each shape using only the 2-digit number as your clue."
      defaultQuestionCount={7}
      sliderLabel="Number of Sections"
      sliderHelperText={(sections) => `${sections * 8} questions total`}
      sliderMin={1}
      sliderMax={8}
      sliderStep={1}
      sliderLabels={[1, 2, 3, 4, 5, 6, 7, 8]}
      formatRealModeTime={formatSectionTime}
      learnDescription="Work through shape sections at your own pace with no time pressure. Build scanning accuracy before attempting timed runs."
      realDescription={(sections, timeDisplay) => {
        return `Race against the clock across ${sections} section${sections !== 1 ? "s" : ""} — ${sections * 8} answers total. ${timeDisplay}. Your score is tracked live.`;
      }}
      onFetch={async (mode, difficulty, sectionCount) => {
        const timeLimit = mode === "real" ? sectionCount * 30 : null;
        return generateScanningShapeQuiz(
          mode,
          difficulty,
          sectionCount,
          timeLimit,
        );
      }}
      onStart={onStart}
    />
  );
}
