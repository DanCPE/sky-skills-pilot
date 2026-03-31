import type {
  ScanningPracticeQuestion,
  ScanningPracticeSubmitResult,
} from "@/types";

interface ExplanationCardProps {
  question: ScanningPracticeQuestion;
  result: ScanningPracticeSubmitResult;
}

export default function ExplanationCard({
  question,
  result,
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

      {/* Explanation */}
      <div className="mb-6 rounded-lg bg-white p-4 dark:bg-zinc-900">
        <p className="text-zinc-700 dark:text-zinc-300">
          {result.correct
            ? `Well done! You correctly identified that there ${question.differenceCount === 1 ? "is" : "are"} ${question.differenceCount} difference${question.differenceCount === 1 ? "" : "s"} between the strings.`
            : `Not quite. There ${question.differenceCount === 1 ? "is" : "are"} ${question.differenceCount} difference${question.differenceCount === 1 ? "" : "s"} between the strings. Keep practicing!`}
        </p>
      </div>

    </div>
  );
}
