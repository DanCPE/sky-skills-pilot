"use client";

interface QuizCompleteConfirmationProps {
  totalQuestions: number;
  answeredCount: number;
  onBackToQuestions: () => void;
  onFinishQuiz: () => void;
}

export default function QuizCompleteConfirmation({
  totalQuestions,
  answeredCount,
  onBackToQuestions,
  onFinishQuiz,
}: QuizCompleteConfirmationProps) {
  const unansweredCount = totalQuestions - answeredCount;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-8 text-center dark:border-amber-900 dark:bg-amber-950">
        {/* Warning Icon */}
        <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900">
          <svg
            className="h-10 w-10 text-amber-600 dark:text-amber-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Title */}
        <h2 className="mb-4 text-2xl font-bold text-amber-900 dark:text-amber-100">
          Wait! You have {unansweredCount} {unansweredCount === 1 ? "question" : "questions"} remaining
        </h2>

        {/* Details */}
        <div className="mb-8 rounded-xl border border-amber-200 bg-amber-100 p-4 dark:border-amber-800 dark:bg-amber-900">
          <div className="flex items-center justify-center gap-8 text-sm">
            <div>
              <span className="font-semibold text-amber-900 dark:text-amber-100">
                {answeredCount}
              </span>
              <span className="mx-1 text-amber-700 dark:text-amber-300">/ {totalQuestions}</span>
              <span className="text-amber-700 dark:text-amber-300">answered</span>
            </div>
            <div className="h-4 w-px bg-amber-300 dark:bg-amber-700"></div>
            <div>
              <span className="font-semibold text-amber-900 dark:text-amber-100">{unansweredCount}</span>
              <span className="ml-1 text-amber-700 dark:text-amber-300">unanswered</span>
            </div>
          </div>
        </div>

        {/* Message */}
        <p className="mb-8 text-amber-800 dark:text-amber-200">
          Would you like to go back and answer the {unansweredCount === 1 ? "unanswered question" : "unanswered questions"},
          or finish the quiz now? Unanswered questions will be marked as incorrect.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={onBackToQuestions}
            className="rounded-xl border-2 border-amber-600 bg-amber-600 px-6 py-3 font-semibold text-white transition-all hover:bg-amber-700 active:scale-95 dark:border-amber-500 dark:bg-amber-500 dark:hover:bg-amber-600"
          >
            Go Back to Questions
          </button>
          <button
            onClick={onFinishQuiz}
            className="rounded-xl border-2 border-zinc-300 bg-white px-6 py-3 font-semibold text-zinc-700 transition-all hover:bg-zinc-50 active:scale-95 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Finish Quiz
          </button>
        </div>
      </div>
    </div>
  );
}
