"use client";

import { useState } from "react";
import SharedResultsScreen from "@/components/shared/ResultsScreen";
import type { NumberSeriesQuestion } from "@/types";

interface QuizAnswer {
  questionId: string;
  answer: string;
  isCorrect: boolean;
  timeTaken?: number;
}

interface ResultsScreenProps {
  questions: NumberSeriesQuestion[];
  answers: QuizAnswer[];
  mode: "learn" | "real";
  score?: number;
  timeTaken?: number;
  onRestart: () => void;
}

export default function ResultsScreen({
  questions,
  answers,
  timeTaken,
  onRestart,
}: ResultsScreenProps) {
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(
    new Set(),
  );

  const toggleExplanation = (questionId: string) => {
    setExpandedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  };

  return (
    <SharedResultsScreen
      totalCount={questions.length}
      answers={answers}
      timeTaken={timeTaken}
      onRestart={onRestart}
      restartLabel="Try Again"
    >
      {/* Question Review */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xl font-bold text-zinc-900 dark:text-brand-gold">
          Review Your Answers
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Click to view explanation and correct answer
        </p>
      </div>
      <div className="space-y-4">
        {questions.map((question, index) => {
          const answer = answers[index];
          const isCorrect = answer?.isCorrect ?? false;
          const isExpanded = expandedQuestions.has(question.id);

          return (
            <div
              key={question.id}
              className={`overflow-hidden rounded-xl border-2 transition-all ${
                isCorrect
                  ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950"
                  : "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950"
              } ${isExpanded ? "shadow-md" : ""}`}
            >
              <button
                onClick={() => toggleExplanation(question.id)}
                className="w-full text-left"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                          Question {index + 1}
                        </span>
                        {isCorrect ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700 dark:bg-green-900 dark:text-green-300">
                            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Correct
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700 dark:bg-red-900 dark:text-red-300">
                            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            Incorrect
                          </span>
                        )}
                        <span className="ml-auto text-xs text-zinc-400 dark:text-zinc-500">
                          {isExpanded ? "▼ Hide" : "▶ Show Answer & Explanation"}
                        </span>
                      </div>
                      <div className="mb-2 text-sm">
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">Sequence: </span>
                        <span className="font-[family-name:var(--font-space-grotesk)] text-zinc-900 dark:text-zinc-100">
                          {question.sequence.join(", ")}, ?
                        </span>
                      </div>
                      <div className="mb-2 text-sm">
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">Your answer: </span>
                        <span className={`font-bold font-[family-name:var(--font-space-grotesk)] ${isCorrect ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}`}>
                          {answer?.answer ?? "Not answered"}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        Pattern:{" "}
                        {question.patternType
                          .split("_")
                          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                          .join(" ")}
                      </div>
                    </div>
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="animate-in slide-in-from-top-2 border-t border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
                  <div className="mb-3 flex items-center gap-2">
                    <svg className="h-5 w-5 text-[#4F12A6] dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h4 className="text-sm font-bold font-[family-name:var(--font-space-grotesk)] text-zinc-900 dark:text-zinc-100">
                      Explanation
                    </h4>
                  </div>
                  <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                    {question.explanation}
                  </p>
                  {!isCorrect && (
                    <div className="mt-4 rounded-lg bg-green-50 p-3 dark:bg-green-950/50">
                      <div className="flex items-center gap-2 text-sm font-medium text-green-800 dark:text-green-300">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Correct Answer: {question.correctAnswer}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </SharedResultsScreen>
  );
}
