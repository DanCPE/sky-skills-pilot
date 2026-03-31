"use client";

import SharedModeSelection from "@/components/shared/ModeSelection";
import { generateScanningShapeQuiz } from "@/lib/scanning-shape-generator";
import type { ScanningShapeQuizResponse } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Map the shared slider range (10–50, step 10) to a section count (2–8).
 * 10→2  20→4  30→5  40→7  50→8
 */
function countToSections(count: number): number {
  return Math.min(8, Math.max(2, Math.ceil(count / 6.25)));
}

function formatSectionTime(count: number): string {
  const sections = countToSections(count);
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
      defaultQuestionCount={40}
      formatRealModeTime={formatSectionTime}
      learnDescription="Work through shape sections at your own pace with no time pressure. Build scanning accuracy before attempting timed runs."
      realDescription={(count, timeDisplay) => {
        const sections = countToSections(count);
        return `Race against the clock across ${sections} section${sections !== 1 ? "s" : ""} — ${sections * 8} answers total. ${timeDisplay}. Your score is tracked live.`;
      }}
      onFetch={async (mode, difficulty, count) => {
        const sectionCount = countToSections(count);
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
