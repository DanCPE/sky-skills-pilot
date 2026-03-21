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
    <div className="mt-6 rounded-2xl border-2 border-white/5 bg-zinc-900/60 backdrop-blur-md p-6 shadow-xl">
      <div className="mb-4 flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full ${
            result.correct
              ? "bg-green-500/20"
              : "bg-red-500/20"
          }`}
        >
          {result.correct ? (
            <svg
              className="h-6 w-6 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : (
            <svg
              className="h-6 w-6 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          )}
        </div>
        <h4 className="text-xl font-black text-white font-[family-name:var(--font-space-grotesk)]">
          {result.correct ? "Correct!" : "Incorrect"}
        </h4>
      </div>

      {/* Pattern Type Badge */}
      <div className="mb-4">
        <span className="inline-block rounded-md bg-brand-purple/20 border border-brand-purple/30 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-brand-purple-light dark:text-violet-400">
          {question.patternType
            .split("_")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")}{" "}
          Pattern
        </span>
      </div>

      {/* Explanation */}
      <div className="mb-6 rounded-xl bg-black/40 border border-white/5 p-4 shadow-inner">
        <p className="text-zinc-300 leading-relaxed font-medium">
          {question.explanation}
        </p>
      </div>

      {/* Next Button */}
      <div className="flex justify-end">
        <button
          onClick={onNext}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-purple px-8 py-3.5 font-bold text-white transition-all hover:opacity-90 active:scale-95 shadow-lg shadow-brand-purple/20"
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
                  strokeWidth={2.5}
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
                  strokeWidth={2.5}
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
