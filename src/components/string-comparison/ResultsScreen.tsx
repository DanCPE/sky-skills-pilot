import Link from "next/link";
import type { ScanningPracticeQuestion } from "@/types";

interface QuizAnswer {
  questionId: string;
  answer: string;
  isCorrect: boolean;
  timeTaken?: number;
}

interface ResultsScreenProps {
  questions: ScanningPracticeQuestion[];
  answers: QuizAnswer[];
  mode: "learn" | "real";
  score?: number;
  timeTaken?: number; // Total time in seconds (real mode)
  onRestart: () => void;
}

export default function ResultsScreen({
  questions,
  answers,
  mode,
  score,
  timeTaken,
  onRestart,
}: ResultsScreenProps) {
  const correctCount = answers.filter((a) => a.isCorrect).length;
  const totalCount = questions.length;
  const percentage = Math.round((correctCount / totalCount) * 100);

  // Calculate average response time
  const answeredQuestions = answers.filter((a) => a.timeTaken !== undefined);
  const averageResponseTime =
    answeredQuestions.length > 0
      ? Math.round(
          answeredQuestions.reduce((sum, a) => sum + (a.timeTaken || 0), 0) /
            answeredQuestions.length
        )
      : null;

  // Get performance message
  const getPerformanceMessage = () => {
    if (percentage >= 90) return { text: "Excellent!", stars: "★★★★★" };
    if (percentage >= 75) return { text: "Great Job!", stars: "★★★★" };
    if (percentage >= 60) return { text: "Good Effort!", stars: "★★★" };
    return { text: "Keep Practicing!", stars: "★★" };
  };

  const performance = getPerformanceMessage();

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="mx-auto max-w-4xl">
      {/* Score Card */}
      <div className="mb-8 rounded-2xl border-2 bg-zinc-50 p-8 text-center dark:border-white/10 dark:bg-black/40 dark:backdrop-blur-md">
        <div className="mb-4 text-4xl">{performance.stars}</div>
        <h2 className="mb-2 text-3xl font-bold font-[family-name:var(--font-space-grotesk)] text-zinc-900 dark:text-brand-gold">
          {performance.text}
        </h2>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          You got {correctCount} out of {totalCount} correct
        </p>

        {/* Score Display (Real Mode Only) */}
        {mode === "real" && score !== undefined && (
          <div className="mt-6">
            <div className="mb-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Final Score
            </div>
            <div className="text-5xl font-bold text-brand-gold font-[family-name:var(--font-space-grotesk)]">
              {score}%
            </div>
          </div>
        )}

        {/* Time Display (Real Mode Only) */}
        {mode === "real" && timeTaken !== undefined && (
          <div className="mt-4">
            <div className="text-sm text-zinc-500 dark:text-zinc-400">
              Time Taken: {formatTime(timeTaken)}
            </div>
          </div>
        )}

        {/* Average Response Time (Both Modes) */}
        {averageResponseTime !== null && (
          <div className="mt-2">
            <div className="text-sm text-zinc-500 dark:text-zinc-400">
              Average Response Time: {averageResponseTime}s per question
            </div>
          </div>
        )}
      </div>

      {/* Questions Review */}
      <div className="mb-8">
        <h3 className="mb-4 text-xl font-bold text-zinc-900 dark:text-brand-gold">
          Review Your Answers
        </h3>
        <div className="space-y-4">
          {questions.map((question, index) => {
            const answer = answers[index];
            const isCorrect = answer?.isCorrect ?? false;

            return (
              <div
                key={question.id}
                className={`rounded-xl border-2 p-4 ${
                  isCorrect
                    ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950"
                    : "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                        Question {index + 1}
                      </span>
                      {isCorrect ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700 dark:bg-green-900 dark:text-green-300">
                          <svg
                            className="h-3 w-3"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Correct
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700 dark:bg-red-900 dark:text-red-300">
                          <svg
                            className="h-3 w-3"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Incorrect
                        </span>
                      )}
                    </div>

                    {/* String Pairs */}
                    <div className="mb-3 grid gap-2 md:grid-cols-2">
                      <div className="rounded-lg bg-white p-2 dark:bg-zinc-800">
                        <div className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                          String A
                        </div>
                        <div className="text-sm font-bold tracking-wider text-zinc-900 dark:text-zinc-100 font-[family-name:var(--font-geist-mono)]">
                          {question.stringA}
                        </div>
                      </div>
                      <div className="rounded-lg bg-white p-2 dark:bg-zinc-800">
                        <div className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                          String B
                        </div>
                        <div className="text-sm font-bold tracking-wider text-zinc-900 dark:text-zinc-100 font-[family-name:var(--font-geist-mono)]">
                          {question.stringB}
                        </div>
                      </div>
                    </div>

                    {/* Answer */}
                    <div className="mb-2 text-sm">
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">
                        Your answer:{" "}
                      </span>
                      <span
                        className={`font-bold ${
                          isCorrect
                            ? "text-green-700 dark:text-green-300"
                            : "text-red-700 dark:text-red-300"
                        } font-[family-name:var(--font-space-grotesk)]`}
                      >
                        {answer?.answer ?? "Not answered"}
                      </span>
                      {!isCorrect && (
                        <span className="ml-2 text-zinc-600 dark:text-zinc-400">
                          (Correct: {question.differenceCount})
                        </span>
                      )}
                    </div>

                    {/* Response Time */}
                    {answer?.timeTaken !== undefined && (
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        Response time: {answer.timeTaken}s
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
        <button
          onClick={onRestart}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-purple px-10 py-4 text-lg font-bold text-white transition-all hover:bg-violet-500 active:scale-95 shadow-lg shadow-brand-purple/20"
        >
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
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Try Again
        </button>
        <Link
          href="/sky-quest"
          className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-zinc-300 px-8 py-4 font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
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
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Sky Quests
        </Link>
      </div>
    </div>
  );
}
