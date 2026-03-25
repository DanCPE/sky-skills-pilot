"use client";

import Link from "next/link";
import { useState } from "react";
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
  timeTaken?: number; // Total time in seconds (real mode)
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
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const correctCount = answers.filter((a) => a.isCorrect).length;
  const totalCount = questions.length;
  const percentage = Math.round((correctCount / totalCount) * 100);

  // Get performance message
  const getPerformanceMessage = () => {
    if (percentage >= 90) return { text: "Excellent!", stars: "★★★★★" };
    if (percentage >= 75) return { text: "Great Job!", stars: "★★★★" };
    if (percentage >= 60) return { text: "Good Effort!", stars: "★★★" };
    if (percentage >= 40) return { text: "Keep Practicing!", stars: "★★" };
    return { text: "Keep Practicing!", stars: "★" };
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
        {/* Stars */}
        <div className="mb-4 flex justify-center gap-1">
          {Array.from({ length: performance.stars.length }).map((_, i) => (
            <svg key={i} className="w-14 h-14" fill="none" stroke="#FACC15" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5z" />
            </svg>
          ))}
        </div>
        <h2 className="mb-2 text-3xl font-bold font-[family-name:var(--font-space-grotesk)] text-zinc-900 dark:text-brand-gold">
          {performance.text}
        </h2>
        <p className="text-base text-zinc-500 dark:text-zinc-400 mb-6">
          You got {correctCount} out of {totalCount} correct
        </p>

        {/* Stats Row */}
        <div className="flex justify-center gap-8 mb-4">
          <div className="flex flex-col items-center">
            <span className="text-4xl font-bold text-[#4F12A6] dark:text-brand-gold font-[family-name:var(--font-space-grotesk)]">{answers.length}</span>
            <span className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Attempted</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-4xl font-bold text-[#4F12A6] dark:text-brand-gold font-[family-name:var(--font-space-grotesk)]">{correctCount}</span>
            <span className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Correct</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-4xl font-bold text-[#4F12A6] dark:text-brand-gold font-[family-name:var(--font-space-grotesk)]">
              {answers.length > 0 ? Math.round((correctCount / answers.length) * 100) : 0}%
            </span>
            <span className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Accuracy</span>
          </div>
        </div>

        {/* Duration */}
        {timeTaken !== undefined && (
          <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
            Duration : {formatTime(timeTaken)}
          </p>
        )}
      </div>

      {/* Questions Review */}
      <div className="mb-8">
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
                {/* Question Header - Always Visible */}
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
                          <span className="ml-auto text-xs text-zinc-400 dark:text-zinc-500">
                            {isExpanded ? "▼ Hide" : "▶ Show Answer & Explanation"}
                          </span>
                        </div>

                        {/* Sequence */}
                        <div className="mb-2 text-sm">
                          <span className="font-medium text-zinc-700 dark:text-zinc-300">
                            Sequence:{" "}
                          </span>
                          <span className="text-zinc-900 dark:text-zinc-100 font-[family-name:var(--font-space-grotesk)]">
                            {question.sequence.join(", ")}, ?
                          </span>
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
                        </div>

                        {/* Pattern Type */}
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">
                          Pattern:{" "}
                          {question.patternType
                            .split("_")
                            .map(
                              (word) =>
                                word.charAt(0).toUpperCase() + word.slice(1),
                            )
                            .join(" ")}
                        </div>
                      </div>
                    </div>
                  </div>
                </button>

                {/* Expandable Explanation */}
                {isExpanded && (
                  <div className="border-t border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 animate-in slide-in-from-top-2">
                    <div className="mb-3 flex items-center gap-2">
                      <svg
                        className="h-5 w-5 text-[#4F12A6] dark:text-violet-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-[family-name:var(--font-space-grotesk)]">
                        Explanation
                      </h4>
                    </div>
                    <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                      {question.explanation}
                    </p>

                    {/* Correct Answer Highlight */}
                    {!isCorrect && (
                      <div className="mt-4 rounded-lg bg-green-50 p-3 dark:bg-green-950/50">
                        <div className="flex items-center gap-2 text-sm font-medium text-green-800 dark:text-green-300">
                          <svg
                            className="h-4 w-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
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
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
        <button
          onClick={onRestart}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#4F12A6] px-10 py-4 text-lg font-bold text-white transition-all hover:opacity-90 active:scale-95 shadow-lg shadow-[#4F12A6]/20"
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
