"use client";

import SharedResultsScreen from "@/components/shared/ResultsScreen";
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
  return (
    <SharedResultsScreen
      totalCount={questions.length}
      answers={answers}
      timeTaken={timeTaken}
      onRestart={onRestart}
      restartLabel="Play Again"
      showBackButton={false}
    >
      {/* Question Review */}
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
              className={`relative rounded-xl border-2 p-4 ${
                isCorrect
                  ? "border-green-500/50 bg-green-500/10"
                  : "border-red-500/50 bg-red-500/10"
              }`}
            >
              {isCorrect ? (
                <svg className="absolute right-3 top-3 h-8 w-8 text-green-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                </svg>
              ) : (
                <svg className="absolute right-3 top-3 h-8 w-8 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
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
                  <div className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">String A</div>
                  <div className="font-[family-name:var(--font-geist-mono)] text-sm font-bold tracking-wider text-zinc-900 dark:text-zinc-100">
                    {question.stringA}
                  </div>
                </div>
                <div className="rounded-lg bg-white p-2 dark:bg-zinc-800">
                  <div className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">String B</div>
                  <div className="font-[family-name:var(--font-geist-mono)] text-sm font-bold tracking-wider text-zinc-900 dark:text-zinc-100">
                    {question.stringB}
                  </div>
                </div>
              </div>

              {/* Answer Buttons */}
              <div className="grid grid-cols-6 gap-2">
                {[0, 1, 2, 3, 4, 5].map((opt) => {
                  const isActuallyCorrect = opt === question.differenceCount;
                  const isSelected = answer?.answer === String(opt);

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
                      className={`h-12 rounded-xl border-2 text-sm font-black ${btnStyle}`}
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
    </SharedResultsScreen>
  );
}
