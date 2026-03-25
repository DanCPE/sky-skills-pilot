"use client";

import { useState } from "react";
import React from "react";
import { useRouter } from "next/navigation";
import Timer from "@/components/shared/Timer";
import ProgressBar from "@/components/shared/ProgressBar";
import QuizCompleteConfirmation from "@/components/aircraft-rotation/QuizCompleteConfirmation";
import QuestionNavigator from "@/components/number-series/QuestionNavigator";
import {
  SpatialOrientationQuizResponse,
  SpatialOrientationQuestion,
} from "@/types";

interface RealModeProps {
  quizData: SpatialOrientationQuizResponse;
  onRestart: () => void;
}

// Airplane icon component
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
    <svg
      viewBox="0 0 24 24"
      className="w-full h-full drop-shadow-sm"
      style={{ transform: "translateX(1px)" }}
    >
      <path
        d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"
        fill={color}
      />
    </svg>
  </div>
);

// Compass circle component
const CompassCircle = ({
  size,
  children,
  className,
}: {
  size?: "sm" | "md";
  children?: React.ReactNode;
  className?: string;
}) => {
  const sizeClasses = size === "sm" ? "w-14 h-14" : "w-16 h-16";
  const tickSize = size === "sm" ? "h-1.5" : "h-2";

  // Generate 16 ticks (every 22.5 degrees)
  const ticks = Array.from({ length: 16 }, (_, i) => i * 22.5);

  return (
    <div
      className={`relative rounded-full border-2 border-zinc-200 dark:border-zinc-700 flex items-center justify-center bg-white dark:bg-zinc-900 shadow-sm ${sizeClasses} ${className}`}
    >
      {/* Compass Ticks */}
      <div className="absolute inset-0">
        {ticks.map((deg) => (
          <div
            key={deg}
            className="absolute w-full h-full"
            style={{ transform: `rotate(${deg}deg)` }}
          >
            <div
              className={`mx-auto ${tickSize} ${
                deg % 90 === 0
                  ? "w-1 bg-zinc-400 dark:bg-zinc-500"
                  : deg % 45 === 0
                    ? "w-0.5 bg-zinc-300 dark:bg-zinc-600"
                    : "w-px bg-zinc-200 dark:bg-zinc-700"
              }`}
            ></div>
          </div>
        ))}
      </div>

      {/* Central Crosshair Grid */}
      <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
        <div className="absolute w-[95%] h-px bg-zinc-300 dark:bg-white/20"></div>
        <div className="absolute h-[95%] w-px bg-zinc-300 dark:bg-white/20"></div>
        <div className="absolute w-[95%] h-px bg-zinc-300 dark:bg-white/20 rotate-45"></div>
        <div className="absolute w-[95%] h-px bg-zinc-300 dark:bg-white/20 -rotate-45"></div>
      </div>

      {children}
    </div>
  );
};

// Individual Question Row Component
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
      className={`relative p-4 rounded-xl transition-all ${
        isSubmitted
          ? isCorrect
            ? "border-2 border-green-500/50 bg-green-500/10"
            : "border-2 border-red-500/50 bg-red-500/10"
          : selectedAnswer
            ? "border-2 border-brand-purple/50 bg-brand-purple/10"
            : "border-2 border-zinc-200 dark:border-white/5 bg-[#F3F3F3] dark:bg-zinc-900/60"
      }`}
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-300 uppercase tracking-widest">
              Question {index + 1}
            </h3>
            {selectedAnswer && !isSubmitted && (
              <span className="uppercase tracking-widest rounded-full bg-brand-purple/20 border border-brand-purple/40 px-3 py-0.5 text-[10px] font-black text-brand-purple">
                Answered
              </span>
            )}
            {isSubmitted && (
              <span
                className={`uppercase tracking-widest rounded-full border px-3 py-0.5 text-[10px] font-black ${
                  isCorrect
                    ? "bg-green-500/20 border-green-500/40 text-green-400"
                    : "bg-red-500/20 border-red-500/40 text-red-400"
                }`}
              >
                {isCorrect ? "Correct" : "Incorrect"}
              </span>
            )}
          </div>
        </div>

        {/* Visual Sequence Box */}
        <div className="flex flex-1 items-center gap-4 min-w-0 bg-white dark:bg-black/40 px-4 py-3 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm">
          <CompassCircle size="sm" className="shrink-0 ring-2 ring-blue-500/20">
            <AirplaneIcon angle={question.initialHeading} color="#3b82f6" />
          </CompassCircle>

          <div className="flex flex-1 items-center justify-center flex-wrap gap-2 min-w-0 py-1">
            {question.sequence.map((step, i) => {
              const isLast = i === question.sequence.length - 1;
              return (
                <React.Fragment key={i}>
                  <div className="flex items-center gap-1.5 shrink-0 font-bold text-sm bg-zinc-100 dark:bg-white/5 px-3 py-2 rounded-lg border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white shadow-sm">
                    <span>{step.angle}°</span>
                    <span
                      className={
                        step.dir === "L"
                          ? "text-blue-500 dark:text-blue-400 font-black"
                          : "text-amber-500 dark:text-amber-400 font-black"
                      }
                    >
                      {step.dir}
                    </span>
                  </div>
                  {!isLast && (
                    <span className="text-zinc-400 dark:text-zinc-600 font-black shrink-0">
                      →
                    </span>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          <CompassCircle size="sm" className="ring-2 ring-brand-purple/20">
            <AirplaneIcon angle={question.targetHeading} color="#8b5cf6" />
          </CompassCircle>
        </div>

        {/* Bottom Row: Answer Buttons */}
        <div className="grid grid-cols-5 gap-2">
          {question.options.map((opt, i) => {
            const optVal =
              opt.dir === null ? "NO_ANSWER" : `${opt.angle}${opt.dir}`;
            const isSelected = selectedAnswer === optVal;
            const isActuallyCorrect =
              optVal === `${question.correctAngle}${question.correctDir}`;

            let btnStyle =
              "bg-white dark:bg-zinc-950 dark:border-white/5 text-zinc-900 dark:text-white hover:border-zinc-400 dark:hover:border-white/20 hover:bg-zinc-50 dark:hover:bg-zinc-900";

            if (isSubmitted) {
              if (isActuallyCorrect) {
                btnStyle =
                  "bg-green-500 text-white shadow-lg shadow-green-500/20 ring-2 ring-green-400 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900 border-green-400";
              } else if (isSelected && !isActuallyCorrect) {
                btnStyle =
                  "bg-red-500 text-white shadow-lg shadow-red-500/20 border-red-400";
              } else {
                btnStyle =
                  "bg-white dark:bg-white/5 text-zinc-600 dark:text-zinc-600 opacity-50 border-zinc-200 dark:border-white/5";
              }
            } else if (isSelected) {
              btnStyle =
                "bg-[#4F12A6] text-white shadow-lg shadow-[#4F12A6]/20 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900 border-[#4F12A6] scale-105 z-10";
            }

            return (
              <button
                key={i}
                disabled={isSubmitted}
                onClick={() => onSelect(optVal)}
                className={`h-12 px-2 sm:px-3 rounded-xl font-black text-xs sm:text-sm transition-all tracking-tight border-2 ${btnStyle}`}
              >
                {opt.dir === null ? "N/A" : `${opt.angle}° ${opt.dir}`}
              </button>
            );
          })}
        </div>
      </div>

      {isSubmitted && !isCorrect && selectedAnswer !== null && (
        <div className="mt-5 pt-4 border-t border-zinc-200 dark:border-white/10 flex items-center justify-center gap-2 text-sm">
          <span className="font-black uppercase tracking-widest text-red-400">
            Target was:
          </span>
          <span className="font-bold text-zinc-900 dark:text-white bg-zinc-200 dark:bg-white/10 px-3 py-1 rounded-md">
            {question.correctAngle}° {question.correctDir}
          </span>
        </div>
      )}
    </div>
  );
};

export default function RealMode({ quizData, onRestart }: RealModeProps) {
  const router = useRouter();
  const { questions, timeLimit } = quizData;
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [quizStartTime] = useState(Date.now());
  const [totalTimeTaken, setTotalTimeTaken] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const answeredCount = Object.keys(answers).length;

  const answeredSet = new Set(
    questions.map((q, i) => (answers[q.id] ? i : -1)).filter((i) => i !== -1),
  );

  const skippedSet = new Set<number>();

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
    <div className="bg-[#F1F5F9] dark:bg-transparent min-h-screen flex flex-col w-full">
      <div className="flex-1 w-full max-w-[1200px] mx-auto p-4 sm:p-6 pt-12 sm:pt-16 mb-20 animate-in fade-in duration-700">
        <div className="flex flex-col gap-4">
          {isSubmitted && (
            <div className="mb-2 text-center bg-white dark:bg-black/20 backdrop-blur-md p-8 rounded-2xl border-2 border-zinc-200 dark:border-white/5 shadow-xl shadow-zinc-200/50">
              <h2 className="text-4xl font-black mb-2 text-zinc-900 dark:text-white">
                Score: {calculateScore()}%
              </h2>
              <p className="font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest text-sm mb-6">
                Completed in {Math.floor(totalTimeTaken / 60)}m{" "}
                {totalTimeTaken % 60}s
              </p>
              <button
                onClick={onRestart}
                className="bg-[#4F12A6] hover:bg-[#4F12A6]/80 text-white px-10 py-4 rounded-xl font-black transition-all shadow-lg shadow-[#4F12A6]/20 active:scale-95 text-lg"
              >
                Play Again
              </button>
            </div>
          )}

          {/* Main Content Area (Two Columns) */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_24rem] gap-4">
            {/* Left Column: Header + Scrollable Questions */}
            <div className="flex flex-col gap-4">
              {/* Top Header Panel */}
              <div className="flex justify-between items-center bg-white dark:bg-black/40 backdrop-blur-md border-2 border-zinc-200 dark:border-white/5 rounded-2xl p-6">
                <div className="flex flex-col gap-1">
                  <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                    Aircraft Rotation
                  </h1>
                  <div className="flex items-center gap-2">
                    <span className="uppercase text-[10px] font-black tracking-[0.2em] bg-amber-400 text-zinc-900 px-2.5 py-1 rounded-md">
                      REAL MODE
                    </span>
                  </div>
                </div>
              </div>

              {/* Scrollable Questions */}
              <div
                className="flex flex-col bg-white dark:bg-black/20 rounded-2xl border-2 border-zinc-200 dark:border-white/5 overflow-hidden"
                style={{ height: "calc(100vh - 320px)", minHeight: "400px" }}
              >
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                  {questions.map((q, idx) => (
                    <div key={q.id}>
                      <QuestionRow
                        question={q}
                        index={idx}
                        selectedAnswer={answers[q.id] || null}
                        onSelect={(val) => {
                          if (!isSubmitted) {
                            setAnswers((prev) => ({ ...prev, [q.id]: val }));
                            setCurrentQuestionIndex(idx);
                          }
                        }}
                        isSubmitted={isSubmitted}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Sidebar Panels */}
            <div className="flex flex-col gap-4">
              {/* Timer & Progress Panel */}
              <div className="rounded-2xl border-2 border-zinc-200 dark:border-white/5 bg-white dark:bg-black/40 backdrop-blur-md p-6 hover:shadow-xl transition-shadow flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-500 dark:text-zinc-300 uppercase tracking-widest text-xs">
                    Time Remaining
                  </span>
                  {timeLimit && !isSubmitted ? (
                    <div className="text-xl font-black text-white font-[family-name:var(--font-space-grotesk)]">
                      <Timer
                        timeLimit={timeLimit}
                        onTimeUp={handleTimeUp}
                        isPaused={isSubmitted}
                        compact
                      />
                    </div>
                  ) : (
                    <span className="text-xl font-black text-zinc-500 font-[family-name:var(--font-space-grotesk)]">
                      --:--
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  <ProgressBar
                    current={answeredCount}
                    total={questions.length}
                    score={isSubmitted ? calculateScore() : undefined}
                    compact
                  />
                  <div className="flex justify-between text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                    <span>
                      Progress:{" "}
                      {Math.round((answeredCount / questions.length) * 100)}%
                      Complete
                    </span>
                    <span>
                      {answeredCount} of {questions.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Question Navigator Panel */}
              <div className="rounded-2xl border-2 border-zinc-200 dark:border-white/5 bg-white dark:bg-black/40 backdrop-blur-md p-6 hover:shadow-xl transition-shadow">
                <h3 className="mb-2 font-bold text-zinc-500 dark:text-zinc-300 uppercase tracking-widest text-xs">
                  Question Navigator
                </h3>
                <QuestionNavigator
                  totalQuestions={questions.length}
                  currentIndex={currentQuestionIndex}
                  answeredIndices={answeredSet}
                  skippedIndices={skippedSet}
                  onSelectQuestion={(index) => {
                    const element = document.getElementById(
                      `question-${questions[index].id}`,
                    );
                    if (element) {
                      element.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      });
                    }
                    setCurrentQuestionIndex(index);
                  }}
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmitClick}
                className="w-full px-16 py-3.5 rounded-xl bg-amber-400 text-zinc-900 hover:bg-amber-500 transition-all shadow-lg shadow-amber-400/20 active:scale-95 font-[family-name:var(--font-space-grotesk)] text-sm font-bold leading-none"
              >
                Submit
              </button>
            </div>
          </div>

          {/* Bottom Navigation Bar */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 flex gap-3">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 px-4 py-3.5 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-400 font-bold text-sm hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-white/20 hover:bg-zinc-200 dark:hover:bg-white/10 transition-all"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Exit
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <QuizCompleteConfirmation
          totalQuestions={questions.length}
          answeredCount={answeredCount}
          onBackToQuestions={() => {
            setShowConfirmation(false);
          }}
          onFinishQuiz={handleSubmitQuiz}
        />
      )}
      {/* Footer Bar */}
      <div className="w-full bg-white dark:bg-black/40 py-4 flex justify-center items-center mt-auto shrink-0">
        <p className="font-[family-name:var(--font-space-grotesk)] text-[14px] text-[#374151]">
          © 2026 SkySkills. All rights reserved.
        </p>
      </div>
    </div>
  );
}
