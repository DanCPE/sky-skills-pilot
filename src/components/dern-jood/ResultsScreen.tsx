"use client";

import { useState } from "react";
import SharedResultsScreen from "@/components/shared/ResultsScreen";
import type { DernJoodQuestion } from "@/types";

interface QuizAnswer {
  questionId: string;
  answer: string;
  isCorrect: boolean;
  timeTaken?: number;
}

interface ResultsScreenProps {
  questions: DernJoodQuestion[];
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
      <div className="mb-4 flex items-center justify-between gap-4">
        <h3 className="text-xl font-bold text-zinc-900 dark:text-brand-gold">
          Review Your Rhythm Math
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          BPM, timing, and answer by question
        </p>
      </div>

      <div className="space-y-4">
        {questions.map((question, index) => {
          const answer = answers.find((item) => item.questionId === question.id);
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
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                      Question {index + 1}
                    </span>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        isCorrect
                          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                          : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                      }`}
                    >
                      {isCorrect ? "Correct" : "Incorrect"}
                    </span>
                    <span className="rounded-full bg-white/70 px-2 py-1 text-xs font-semibold capitalize text-zinc-600 dark:bg-black/20 dark:text-zinc-300">
                      {question.difficulty}
                    </span>
                    <span className="rounded-full bg-white/70 px-2 py-1 text-xs font-semibold text-zinc-600 dark:bg-black/20 dark:text-zinc-300">
                      {question.bpm} BPM
                    </span>
                    <span className="ml-auto text-xs text-zinc-400 dark:text-zinc-500">
                      {isExpanded ? "Hide" : "Show"}
                    </span>
                  </div>
                  <div className="font-[family-name:var(--font-space-grotesk)] text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    {question.expression}
                  </div>
                  <div className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
                    Your answer:{" "}
                    <span className={isCorrect ? "font-bold text-green-700" : "font-bold text-red-700"}>
                      {answer?.answer || "No answer"}
                    </span>
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-zinc-200 bg-white p-4 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                  <p>{question.explanation}</p>
                  <p className="mt-2">
                    Timer: {question.timeLimitSeconds}s
                    {answer?.timeTaken !== undefined
                      ? `, answered in ${answer.timeTaken}s`
                      : ""}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </SharedResultsScreen>
  );
}
