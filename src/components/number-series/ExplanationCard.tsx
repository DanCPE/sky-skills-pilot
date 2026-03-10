import type { NumberSeriesQuestion, NumberSeriesSubmitResult } from "@/types";

interface ExplanationCardProps {
  question: NumberSeriesQuestion;
  result: NumberSeriesSubmitResult;
  onNext: () => void;
  isLastQuestion: boolean;
}

export default function ExplanationCard({
  question,
  result,
  onNext,
  isLastQuestion,
}: ExplanationCardProps) {
  return (
    <div className="mt-6 rounded-2xl border-2 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-800">
      <div className="mb-4 flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full ${
            result.correct
              ? "bg-green-100 dark:bg-green-900"
              : "bg-red-100 dark:bg-red-900"
          }`}
        >
          {result.correct ? (
            <svg
              className="h-6 w-6 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : (
            <svg
              className="h-6 w-6 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          )}
        </div>
        <h4 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 font-[family-name:var(--font-space-grotesk)]">
          {result.correct ? "Correct!" : "Incorrect"}
        </h4>
      </div>

      {/* Pattern Type Badge */}
      <div className="mb-4">
        <span className="inline-block rounded-full bg-violet-100 px-3 py-1 text-sm font-medium text-violet-700 dark:bg-violet-900 dark:text-violet-300">
          {question.patternType
            .split("_")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")}{" "}
          Pattern
        </span>
      </div>

      {/* Explanation */}
      <div className="mb-6 rounded-lg bg-white p-4 dark:bg-zinc-900">
        <p className="text-zinc-700 dark:text-zinc-300">
          {question.explanation}
        </p>
      </div>

      {/* Next Button */}
      <div className="flex justify-end">
        <button
          onClick={onNext}
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-violet-500 active:bg-violet-700 dark:bg-violet-600 dark:hover:bg-violet-500"
        >
          {isLastQuestion ? (
            <>
              See Results
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </>
          ) : (
            <>
              Next Question
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
