"use client";

import { useState, useEffect } from "react";
import Timer from "@/components/shared/Timer";
import ProgressBar from "@/components/shared/ProgressBar";
import QuizCompleteConfirmation from "@/components/spatial-orientation/QuizCompleteConfirmation";
import {
  SpatialOrientationQuizResponse,
  SpatialOrientationQuestion,
  Direction,
} from "@/types";

interface RealModeProps {
  quizData: SpatialOrientationQuizResponse;
  onRestart: () => void;
}

// Reusing the airplane component inline to ensure zero missing exports
const AirplaneIcon = ({
  angle,
  color = "currentColor",
  className = "",
}: {
  angle: number;
  color?: string;
  className?: string;
}) => (
  <div
    className={`relative flex items-center justify-center ${className}`}
    style={{ transform: `rotate(${angle}deg)` }}
  >
    <svg viewBox="0 0 24 24" className="w-full h-full drop-shadow-sm">
      <path
        d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"
        fill={color}
      />
    </svg>
  </div>
);

// Individual Row Component
const QuestionRow = ({
  question,
  index,
  selectedAnswer,
  onSelect,
  isSubmitted,
}: {
  question: SpatialOrientationQuestion;
  index: number;
  selectedAnswer: string | null;
  onSelect: (val: string) => void;
  isSubmitted: boolean;
}) => {
  const isCorrect =
    isSubmitted &&
    selectedAnswer === `${question.correctAngle}${question.correctDir}`;

  return (
    <div
      id={`question-${question.id}`}
      className={`mb-6 p-6 rounded-3xl bg-white dark:bg-zinc-900 border-2 transition-colors ${
        isSubmitted
          ? isCorrect
            ? "border-green-500"
            : "border-red-500"
          : "border-zinc-200 dark:border-zinc-800"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="font-bold text-lg text-zinc-900 dark:text-zinc-100">
          Q{index + 1}
        </span>
        {isSubmitted && (
          <span
            className={`font-bold uppercase tracking-widest text-xs px-3 py-1 rounded-full ${isCorrect ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
          >
            {isCorrect ? "CORRECT" : "INCORRECT"}
          </span>
        )}
      </div>

      {/* Visual Sequence Row */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl">
        {/* START */}
        <div className="flex flex-col items-center flex-shrink-0">
          <div className="text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wide">
            Start
          </div>
          <div className="w-16 h-16 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-center p-2 shadow-sm">
            <AirplaneIcon angle={question.initialHeading} color="#3b82f6" />
          </div>
        </div>

        {/* SEQUENCE */}
        <div className="flex-1 flex flex-wrap items-center justify-center gap-2">
          {question.sequence.map((step, i) => (
            <div
              key={i}
              className="flex items-center gap-1 font-bold text-sm bg-zinc-200 dark:bg-zinc-800 px-3 py-1.5 rounded-lg text-zinc-700 dark:text-zinc-300"
            >
              <span>{step.angle}°</span>
              <span
                className={
                  step.dir === "L" ? "text-blue-500" : "text-amber-500"
                }
              >
                {step.dir}
              </span>
            </div>
          ))}
        </div>

        {/* TARGET */}
        <div className="flex flex-col items-center flex-shrink-0">
          <div className="text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wide">
            Target
          </div>
          <div className="w-16 h-16 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-center p-2 shadow-sm">
            <AirplaneIcon angle={question.targetHeading} color="#7c3aed" />
          </div>
        </div>
      </div>

      {/* Answer Choices Panel */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {question.options.map((opt, i) => {
          const optVal =
            opt.dir === null ? "NO_ANSWER" : `${opt.angle}${opt.dir}`;
          const isSelected = selectedAnswer === optVal;
          const isActuallyCorrect =
            optVal === `${question.correctAngle}${question.correctDir}`;

          // Styling logic for submission phase
          let btnStyle =
            "bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300";

          if (isSubmitted) {
            if (isActuallyCorrect) {
              btnStyle =
                "bg-green-500 text-white ring-2 ring-green-400 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900"; // Always show the real right answer
            } else if (isSelected && !isActuallyCorrect) {
              btnStyle = "bg-red-500 text-white"; // Highlight wrong choice
            } else {
              btnStyle =
                "bg-zinc-100 text-zinc-400 opacity-50 dark:bg-zinc-800 dark:text-zinc-600"; // Grey out others
            }
          } else if (isSelected) {
            btnStyle = "bg-violet-600 text-white shadow-md";
          }

          return (
            <button
              key={i}
              disabled={isSubmitted}
              onClick={() => onSelect(optVal)}
              className={`py-3 px-2 rounded-xl font-bold text-[15px] transition-all ${btnStyle}`}
            >
              {opt.dir === null ? "NO ANSWER" : `${opt.angle}° ${opt.dir}`}
            </button>
          );
        })}
      </div>

      {/* Show context after submission if wrong */}
      {isSubmitted && !isCorrect && selectedAnswer !== null && (
        <div className="mt-4 text-xs font-medium text-red-500/80">
          Correct Answer: {question.correctAngle}° {question.correctDir}
        </div>
      )}
    </div>
  );
};

export default function RealMode({
  quizData,
  onRestart,
}: RealModeProps) {
  const { questions, timeLimit } = quizData;
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [quizStartTime] = useState(Date.now());
  const [totalTimeTaken, setTotalTimeTaken] = useState(0);

  const answeredCount = Object.keys(answers).length;

  const handleTimeUp = () => {
    handleSubmitQuiz();
  };

  const handleSubmitClick = () => {
    const unansweredCount = questions.length - answeredCount;
    if (unansweredCount > 0) {
      // Show confirmation if there are unanswered questions
      setShowConfirmation(true);
    } else {
      // All questions answered, submit directly
      handleSubmitQuiz();
    }
  };

  const handleSubmitQuiz = () => {
    setShowConfirmation(false);
    setIsSubmitted(true);
    setTotalTimeTaken(Math.floor((Date.now() - quizStartTime) / 1000));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const calculateScore = () => {
    let score = 0;
    questions.forEach((q) => {
      if (answers[q.id] === `${q.correctAngle}${q.correctDir}`) {
        score++;
      }
    });
    return Math.round((score / questions.length) * 100);
  };

  return (
    <div className="mx-auto max-w-4xl pb-20">
      {/* Show confirmation when there are unanswered questions */}
      {showConfirmation ? (
        <QuizCompleteConfirmation
          totalQuestions={questions.length}
          answeredCount={answeredCount}
          onBackToQuestions={() => {
            setShowConfirmation(false);
            // Scroll to first unanswered question
            const firstUnanswered = questions.find((q) => !answers[q.id]);
            if (firstUnanswered) {
              const element = document.getElementById(
                `question-${firstUnanswered.id}`,
              );
              if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "center" });
              }
            }
          }}
          onFinishQuiz={handleSubmitQuiz}
        />
      ) : (
        <>
          {/* Sticky Top Bar Header */}
          <div className="sticky top-16 z-40 mb-8 rounded-3xl border-2 border-zinc-200 bg-white/95 p-4 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/95 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex-1 w-full">
              <ProgressBar
                current={answeredCount}
                total={questions.length}
                score={isSubmitted ? calculateScore() : undefined}
              />
            </div>

            <div className="flex flex-col gap-3 w-full sm:w-48">
              {timeLimit && !isSubmitted && (
                <div className="w-full flex items-center justify-center rounded-2xl bg-zinc-100 py-2 dark:bg-zinc-800 [&>div]:mb-0 [&>div]:bg-transparent [&>div]:dark:bg-transparent [&>div]:px-0">
                  <Timer
                    timeLimit={timeLimit}
                    onTimeUp={handleTimeUp}
                    isPaused={isSubmitted}
                  />
                </div>
              )}

              <button
                onClick={handleSubmitClick}
                disabled={isSubmitted}
                className={`w-full rounded-2xl px-6 py-3 text-sm font-bold text-white transition-all ${
                  isSubmitted
                    ? "bg-zinc-400 cursor-not-allowed hidden"
                    : "bg-green-600 hover:bg-green-700 active:scale-95 shadow-md shadow-green-600/20"
                }`}
              >
                Submit Quiz
              </button>
            </div>
          </div>

          {isSubmitted && (
            <div className="mb-10 text-center bg-violet-50 dark:bg-violet-900/20 p-8 rounded-3xl border border-violet-200 dark:border-violet-800/50">
              <h2 className="text-3xl font-black mb-2 text-violet-700 dark:text-violet-400">
                Score: {calculateScore()}%
              </h2>
              <p className="font-bold text-zinc-600 dark:text-zinc-400 mb-6">
                Completed in {Math.floor(totalTimeTaken / 60)}m{" "}
                {totalTimeTaken % 60}s
              </p>
              <button
                onClick={onRestart}
                className="bg-violet-600 hover:bg-violet-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-md"
              >
                Play Again
              </button>
            </div>
          )}

          {/* Render 20 Questions in a List */}
          <div className="space-y-2">
            {questions.map((q, idx) => (
              <QuestionRow
                key={q.id}
                question={q}
                index={idx}
                selectedAnswer={answers[q.id] || null}
                onSelect={(val) => {
                  if (!isSubmitted) {
                    setAnswers((prev) => ({ ...prev, [q.id]: val }));
                  }
                }}
                isSubmitted={isSubmitted}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
