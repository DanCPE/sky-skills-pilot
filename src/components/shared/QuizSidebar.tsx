"use client";

import Timer from "./Timer";
import ProgressBar from "./ProgressBar";
import QuestionNavigator from "@/components/number-series/QuestionNavigator";

interface QuizSidebarProps {
  // Timer
  /** Pass undefined to show "--:--" (e.g. learn mode) */
  timeLimit?: number;
  onTimeUp?: () => void;
  isPaused?: boolean;

  // Progress
  answeredCount: number;
  totalQuestions: number;
  score?: number;
  /** Show "Progress: X% Complete  N of M" row. Defaults to true. */
  showProgressText?: boolean;

  // Navigator
  currentIndex: number;
  answeredIndices: Set<number>;
  skippedIndices?: Set<number>;
  onSelectQuestion: (index: number) => void;

  // Submit
  onSubmit: () => void;
}

export default function QuizSidebar({
  timeLimit,
  onTimeUp,
  isPaused = false,
  answeredCount,
  totalQuestions,
  score,
  showProgressText = true,
  currentIndex,
  answeredIndices,
  skippedIndices = new Set(),
  onSelectQuestion,
  onSubmit,
}: QuizSidebarProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Timer & Progress Panel */}
      <div className="rounded-2xl border-2 border-zinc-200 dark:border-white/5 bg-white dark:bg-black/40 backdrop-blur-md p-6 hover:shadow-xl transition-shadow flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <span className="font-bold text-zinc-500 dark:text-zinc-300 uppercase tracking-widest text-xs">
            Time Remaining
          </span>
          {timeLimit ? (
            <div className="text-xl font-black text-white font-[family-name:var(--font-space-grotesk)]">
              <Timer
                timeLimit={timeLimit}
                onTimeUp={onTimeUp ?? (() => {})}
                isPaused={isPaused}
                compact
              />
            </div>
          ) : (
            <span className="text-xl font-black text-zinc-500 font-[family-name:var(--font-space-grotesk)]">
              --:--
            </span>
          )}
        </div>

        <div className="space-y-2">
          <ProgressBar
            current={answeredCount}
            total={totalQuestions}
            score={score}
            compact
          />
          {showProgressText && (
            <div className="flex justify-between text-[10px] font-black text-zinc-500 uppercase tracking-widest">
              <span>
                Progress: {Math.round((answeredCount / totalQuestions) * 100)}%
                Complete
              </span>
              <span>
                {answeredCount} of {totalQuestions}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Question Navigator Panel */}
      <div className="rounded-2xl border-2 border-zinc-200 dark:border-white/5 bg-white dark:bg-black/40 backdrop-blur-md p-6 hover:shadow-xl transition-shadow">
        <h3 className="mb-2 font-bold text-zinc-500 dark:text-zinc-300 uppercase tracking-widest text-xs">
          Question Navigator
        </h3>
        <QuestionNavigator
          totalQuestions={totalQuestions}
          currentIndex={currentIndex}
          answeredIndices={answeredIndices}
          skippedIndices={skippedIndices}
          onSelectQuestion={onSelectQuestion}
        />
      </div>

      {/* Submit Button */}
      <button
        onClick={onSubmit}
        className="w-full px-16 py-3.5 rounded-xl bg-amber-400 text-zinc-900 hover:bg-amber-500 transition-all shadow-lg shadow-amber-400/20 active:scale-95 font-[family-name:var(--font-space-grotesk)] text-sm font-bold leading-none"
      >
        Submit
      </button>
    </div>
  );
}
