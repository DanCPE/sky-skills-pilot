import type {
  MissingOperatorQuestion,
  MissingOperatorSubmitResult,
} from "@/types";

interface ExplanationCardProps {
  question: MissingOperatorQuestion;
  result: MissingOperatorSubmitResult;
  onNext: () => void;
  isLastQuestion: boolean;
}

export default function ExplanationCard({
  question,
  result,
  onNext: _onNext,
  isLastQuestion: _isLastQuestion,
}: ExplanationCardProps) {
  void _onNext;
  void _isLastQuestion;

  return (
    <div className="mt-6 rounded-2xl border-2 border-zinc-200 dark:border-white/15 bg-white dark:bg-zinc-900/60 backdrop-blur-md p-6 hover:shadow-xl transition-shadow">
      <div className="mb-4 flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full ${
            result.correct ? "bg-green-500/20" : "bg-red-500/20"
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
        <h4 className="text-xl font-black text-zinc-900 dark:text-white font-[family-name:var(--font-space-grotesk)]">
          {result.correct ? "Correct!" : "Incorrect"}
        </h4>
      </div>

      <div className="mb-4">
        <span className="inline-block rounded-md bg-[#4F12A6]/20 border border-[#4F12A6]/30 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#4F12A6] dark:text-violet-400">
          Basic Calculation Pattern
        </span>
      </div>

      <div className="mb-6 rounded-xl bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200 dark:border-white/15 p-4 shadow-inner">
        <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium">
          {question.explanation}
        </p>
      </div>
    </div>
  );
}
