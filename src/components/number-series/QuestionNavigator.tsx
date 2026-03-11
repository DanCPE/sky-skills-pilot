"use client";

interface QuestionNavigatorProps {
  totalQuestions: number;
  currentIndex: number;
  answeredIndices: Set<number>;
  skippedIndices: Set<number>;
  onSelectQuestion: (index: number) => void;
}

export default function QuestionNavigator({
  totalQuestions,
  currentIndex,
  answeredIndices,
  skippedIndices,
  onSelectQuestion,
}: QuestionNavigatorProps) {
  const getQuestionStatus = (index: number) => {
    if (answeredIndices.has(index)) return "answered";
    if (skippedIndices.has(index)) return "skipped";
    return "pending";
  };

  const getButtonStyle = (index: number) => {
    const status = getQuestionStatus(index);
    const isCurrent = index === currentIndex;

    if (isCurrent) {
      return "border-violet-600 bg-violet-600 text-white shadow-lg shadow-violet-300 dark:shadow-violet-900 scale-110";
    }

    if (status === "answered") {
      return "border-green-600 bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400 dark:border-green-700";
    }

    if (status === "skipped") {
      return "border-amber-500 bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-600";
    }

    return "border-zinc-300 bg-white text-zinc-600 hover:border-violet-400 hover:bg-violet-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-violet-600 dark:hover:bg-violet-950";
  };

  return (
    <div className="mb-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Question Navigator
        </h3>
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full border-2 border-violet-600 bg-violet-600"></div>
            <span className="text-zinc-600 dark:text-zinc-400">Current</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full border-2 border-green-600 bg-green-100 dark:bg-green-950"></div>
            <span className="text-zinc-600 dark:text-zinc-400">Answered</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full border-2 border-amber-500 bg-amber-100 dark:bg-amber-950"></div>
            <span className="text-zinc-600 dark:text-zinc-400">Skipped</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {Array.from({ length: totalQuestions }, (_, i) => i).map((index) => (
          <button
            key={index}
            onClick={() => onSelectQuestion(index)}
            className={`h-10 w-10 rounded-xl border-2 text-sm font-semibold transition-all duration-200 ${
              index === currentIndex ? "" : "hover:scale-105"
            } active:scale-95 ${getButtonStyle(index)}`}
            aria-label={`Go to question ${index + 1}`}
            aria-current={index === currentIndex ? "step" : undefined}
          >
            {index + 1}
          </button>
        ))}
      </div>

      {/* Stats summary */}
      <div className="mt-3 flex gap-4 text-xs text-zinc-600 dark:text-zinc-400">
        <span>
          <strong>{answeredIndices.size}</strong> answered
        </span>
        <span>
          <strong>{skippedIndices.size}</strong> skipped
        </span>
        <span>
          <strong>{totalQuestions - answeredIndices.size - skippedIndices.size}</strong> remaining
        </span>
      </div>
    </div>
  );
}
