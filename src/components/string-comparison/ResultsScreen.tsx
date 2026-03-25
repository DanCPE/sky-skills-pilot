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
  timeTaken?: number;
  onRestart: () => void;
}

export default function ResultsScreen({
  questions,
  answers,
  timeTaken,
  onRestart,
}: ResultsScreenProps) {
  const correctCount = answers.filter((a) => a.isCorrect).length;
  const totalCount = questions.length;
  const percentage = Math.round((correctCount / totalCount) * 100);

  const attemptedCount = answers.filter((a) => a.answer !== undefined && a.answer !== "").length;
  const accuracy = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;

  // Get performance message
  const getPerformanceMessage = () => {
    if (percentage >= 90) return { text: "Excellent!", starCount: 5 };
    if (percentage >= 75) return { text: "Great Job!", starCount: 4 };
    if (percentage >= 60) return { text: "Good Effort!", starCount: 3 };
    if (percentage >= 40) return { text: "Keep Practicing!", starCount: 2 };
    return { text: "Keep Practicing!", starCount: 1 };
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
        <div className="mb-4 flex justify-center gap-1">
          {Array.from({ length: performance.starCount }).map((_, i) => (
            <svg key={i} className="w-14 h-14" fill="none" stroke="#FACC15" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5z" />
            </svg>
          ))}
        </div>
        <h2 className="mb-1 text-3xl font-bold font-[family-name:var(--font-space-grotesk)] text-zinc-900 dark:text-white">
          {performance.text}
        </h2>
        <p className="text-base text-zinc-500 dark:text-zinc-400 mb-6">
          You got {correctCount} out of {totalCount} correct
        </p>
        <div className="flex justify-center gap-8 mb-4">
          <div className="flex flex-col items-center">
            <span className="text-4xl font-bold text-[#4F12A6] dark:text-brand-gold font-[family-name:var(--font-space-grotesk)]">{attemptedCount}</span>
            <span className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Attempted</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-4xl font-bold text-[#4F12A6] dark:text-brand-gold font-[family-name:var(--font-space-grotesk)]">{correctCount}</span>
            <span className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Correct</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-4xl font-bold text-[#4F12A6] dark:text-brand-gold font-[family-name:var(--font-space-grotesk)]">{accuracy}%</span>
            <span className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Accuracy</span>
          </div>
        </div>
        {timeTaken !== undefined && (
          <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
            Duration : {formatTime(timeTaken)}
          </p>
        )}
      </div>

      {/* Questions Review */}
      <div className="mb-8">
        <h3 className="text-xl font-bold text-zinc-900 dark:text-brand-gold mb-4">
          Review Your Answers
        </h3>
        <div className="space-y-4">
          {questions.map((question, index) => {
            const answer = answers[index];
            const isCorrect = answer?.isCorrect ?? false;

            return (
              <div
                key={question.id}
                className={`relative rounded-xl border-2 p-4 ${
                  isCorrect
                    ? "border-green-500/50 bg-green-500/10"
                    : "border-red-500/50 bg-red-500/10"
                }`}
              >
                {isCorrect ? (
                  <svg className="absolute top-3 right-3 w-8 h-8 text-green-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                  </svg>
                ) : (
                  <svg className="absolute top-3 right-3 w-8 h-8 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                  </svg>
                )}
                <div className="mb-2">
                  <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    Question {index + 1}
                  </span>
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

                {/* Answer Buttons */}
                <div className="grid grid-cols-6 gap-2">
                  {[0, 1, 2, 3, 4, 5].map((opt) => {
                    const optStr = String(opt);
                    const isActuallyCorrect = opt === question.differenceCount;
                    const isSelected = answer?.answer === optStr;

                    let btnStyle: string;
                    if (isActuallyCorrect) {
                      btnStyle = "bg-green-500 text-white shadow-lg shadow-green-500/20 border-transparent";
                    } else if (isSelected && !isActuallyCorrect) {
                      btnStyle = "bg-red-500 text-white shadow-lg shadow-red-500/20 border-red-400";
                    } else {
                      btnStyle = "bg-white dark:bg-white/5 text-zinc-600 dark:text-zinc-600 opacity-50 border-zinc-200 dark:border-white/5";
                    }

                    return (
                      <button
                        key={opt}
                        disabled
                        className={`h-12 rounded-xl font-black text-sm border-2 ${btnStyle}`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center">
        <button
          onClick={onRestart}
          className="bg-[#4F12A6] hover:bg-[#4F12A6]/80 text-white px-10 py-4 rounded-xl font-black transition-all shadow-lg shadow-[#4F12A6]/20 active:scale-95 text-lg"
        >
          Play Again
        </button>
      </div>
    </div>
  );
}
