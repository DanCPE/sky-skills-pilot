"use client";

import { useState, useEffect, useRef } from "react";
import Timer from "@/components/shared/Timer";
import ProgressBar from "@/components/shared/ProgressBar";
import QuestionCard from "./QuestionCard";
import ExplanationCard from "./ExplanationCard";
import ResultsScreen from "./ResultsScreen";
import QuestionNavigator from "./QuestionNavigator";
import QuizCompleteConfirmation from "./QuizCompleteConfirmation";
import type {
  NumberSeriesQuizResponse,
  NumberSeriesSubmitResult,
} from "@/types";

interface QuizAnswer {
  questionId: string;
  answer: string;
  isCorrect: boolean;
  timeTaken?: number;
}

interface SkippedQuestion {
  questionId: string;
  questionIndex: number;
}

interface QuizInterfaceProps {
  quizData: NumberSeriesQuizResponse;
  onRestart: () => void;
}

export default function QuizInterface({
  quizData,
  onRestart,
}: QuizInterfaceProps) {
  const { questions, mode, timeLimit } = quizData;

  // Quiz state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [skippedQuestions, setSkippedQuestions] = useState<SkippedQuestion[]>(
    [],
  );
  const [answeredQuestionIndices, setAnsweredQuestionIndices] = useState<
    Set<number>
  >(new Set());
  const [quizComplete, setQuizComplete] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [currentResult, setCurrentResult] =
    useState<NumberSeriesSubmitResult | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Timer state (real mode only)
  const [totalTimeTaken, setTotalTimeTaken] = useState(0);
  const [quizStartTime] = useState(Date.now());

  // Calculate time remaining dynamically for API calls
  const getTimeRemaining = () => {
    if (!timeLimit) return 0;
    const elapsed = Math.floor((Date.now() - quizStartTime) / 1000);
    return Math.max(0, timeLimit - elapsed);
  };

  // Ref to track if submission is in progress (prevents double-clicks)
  const isSubmittingRef = useRef(false);

  // Update total time when quiz completes
  useEffect(() => {
    if (quizComplete) {
      setTotalTimeTaken(Math.floor((Date.now() - quizStartTime) / 1000));
    }
  }, [quizComplete, quizStartTime]);

  // Handle time up (real mode)
  const handleTimeUp = () => {
    // Submit remaining questions as incorrect
    const remainingAnswers = questions.slice(currentQuestionIndex).map((q) => ({
      questionId: q.id,
      answer: "",
      isCorrect: false,
    }));
    setAnswers((prev) => [...prev, ...remainingAnswers]);
    setQuizComplete(true);
  };

  // Handle answer selection
  const handleAnswer = async (answer: string) => {
    // Prevent double-clicks using both state and ref
    if (isSubmitting || isSubmittingRef.current) {
      return;
    }

    setSelectedAnswer(answer);
    setIsSubmitting(true);
    isSubmittingRef.current = true;

    const currentQuestion = questions[currentQuestionIndex];
    const questionStartTime = Date.now();

    try {
      // Submit answer to API
      const response = await fetch("/api/number-series/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          answer,
          mode,
          questionIndex: currentQuestionIndex,
          timeRemaining: getTimeRemaining(),
          correctAnswer: currentQuestion.correctAnswer,
          patternType: currentQuestion.patternType,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit answer");
      }

      const result: NumberSeriesSubmitResult = await response.json();
      setCurrentResult(result);

      // Store answer
      const answerData: QuizAnswer = {
        questionId: currentQuestion.id,
        answer,
        isCorrect: result.correct ?? false,
        timeTaken: Math.floor((Date.now() - questionStartTime) / 1000),
      };

      setAnswers((prev) => [...prev, answerData]);
      setAnsweredQuestionIndices(
        (prev) => new Set([...prev, currentQuestionIndex]),
      );

      // Remove from skipped if it was previously skipped
      setSkippedQuestions((prev) =>
        prev.filter((sq) => sq.questionIndex !== currentQuestionIndex),
      );

      // Show explanation in learn mode, or move to next question in real mode
      if (mode === "learn") {
        setShowExplanation(true);
        setIsSubmitting(false);
        isSubmittingRef.current = false;
      } else {
        // Real mode: move to next question immediately
        moveToNextQuestion();
        setIsSubmitting(false);
        isSubmittingRef.current = false;
      }
    } catch (error) {
      console.error("Error submitting answer:", error);
      // Fallback: mark as incorrect and continue
      const answerData: QuizAnswer = {
        questionId: currentQuestion.id,
        answer,
        isCorrect: answer === String(currentQuestion.correctAnswer),
      };
      setAnswers((prev) => [...prev, answerData]);
      setAnsweredQuestionIndices(
        (prev) => new Set([...prev, currentQuestionIndex]),
      );
      setSkippedQuestions((prev) =>
        prev.filter((sq) => sq.questionIndex !== currentQuestionIndex),
      );
      moveToNextQuestion();
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  // Move to next question
  const moveToNextQuestion = () => {
    // Clear all state before moving
    setShowExplanation(false);
    setSelectedAnswer(null);
    setCurrentResult(null);

    // Find all unattempted questions (not answered) - INCLUDE skipped questions
    // Exclude current question since we just answered it (state might not be updated yet)
    const allUnattempted = questions
      .map((_, idx) => idx)
      .filter(
        (idx) =>
          idx !== currentQuestionIndex && // Exclude current question we just answered
          !answeredQuestionIndices.has(idx), // Only exclude already answered questions
      );

    if (allUnattempted.length > 0) {
      // Find the NEAREST unattempted question (by distance)
      // If there are ties, prefer moving forward (higher index)
      const nextUnattemptedIndex = allUnattempted.reduce((nearest, idx) => {
        const distanceToNearest = Math.abs(nearest - currentQuestionIndex);
        const distanceToCurrent = Math.abs(idx - currentQuestionIndex);

        if (distanceToCurrent < distanceToNearest) {
          return idx;
        } else if (distanceToCurrent === distanceToNearest) {
          // Prefer moving forward if distances are equal
          return idx > nearest ? idx : nearest;
        }
        return nearest;
      });
      setCurrentQuestionIndex(nextUnattemptedIndex);
    } else {
      // All questions done
      setQuizComplete(true);
    }
  };

  // Skip current question (real mode only)
  const handleSkip = () => {
    if (mode !== "real") return;

    const currentQuestion = questions[currentQuestionIndex];
    const alreadySkipped = skippedQuestions.some(
      (sq) => sq.questionIndex === currentQuestionIndex,
    );

    if (!alreadySkipped) {
      setSkippedQuestions((prev) => [
        ...prev,
        {
          questionId: currentQuestion.id,
          questionIndex: currentQuestionIndex,
        },
      ]);
    }

    moveToNextQuestion();
  };

  // Calculate final score (real mode only)
  const calculateScore = () => {
    if (mode !== "real" || answers.length === 0) return undefined;
    const correct = answers.filter((a) => a.isCorrect).length;
    return Math.round((correct / questions.length) * 100);
  };

  // Show submit confirmation
  const handleSubmitClick = () => {
    const unansweredCount = questions.length - answeredQuestionIndices.size;
    if (unansweredCount > 0) {
      // Show confirmation if there are unanswered questions
      setShowConfirmation(true);
    } else {
      // All questions answered, submit directly
      handleSubmitQuiz();
    }
  };

  // Handle manual submit (real mode only)
  const handleSubmitQuiz = () => {
    if (mode !== "real") return;

    // Mark all unanswered/skipped questions as incorrect
    const unansweredCount = questions.length - answeredQuestionIndices.size;
    if (unansweredCount > 0) {
      const unansweredAnswers = questions
        .map((_, idx) => idx)
        .filter((idx) => !answeredQuestionIndices.has(idx))
        .map((idx) => ({
          questionId: questions[idx].id,
          answer: "",
          isCorrect: false,
        }));
      setAnswers((prev) => [...prev, ...unansweredAnswers]);
    }

    setShowConfirmation(false);
    setQuizComplete(true);
  };

  // Show loading state while questions load
  if (!questions || questions.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-violet-600 border-r-transparent dark:border-violet-500"></div>
          <p className="text-zinc-600 dark:text-zinc-400">
            Loading questions...
          </p>
        </div>
      </div>
    );
  }

  // Calculate skipped indices set for QuestionNavigator
  const skippedIndicesSet = new Set(
    skippedQuestions.map((sq) => sq.questionIndex),
  );

  // Show confirmation when there are skipped questions
  if (showConfirmation) {
    const unansweredCount = questions.length - answeredQuestionIndices.size;
    return (
      <QuizCompleteConfirmation
        totalQuestions={questions.length}
        answeredCount={answeredQuestionIndices.size}
        skippedCount={unansweredCount}
        onBackToQuestions={() => {
          setShowConfirmation(false);
          // Move to the first unanswered/skipped question
          const firstUnanswered = questions.findIndex(
            (_, idx) => !answeredQuestionIndices.has(idx),
          );
          if (firstUnanswered !== -1) {
            setCurrentQuestionIndex(firstUnanswered);
          }
        }}
        onFinishQuiz={() => {
          handleSubmitQuiz();
        }}
      />
    );
  }

  // Show results screen when quiz is complete
  if (quizComplete) {
    return (
      <ResultsScreen
        questions={questions}
        answers={answers}
        mode={mode}
        score={calculateScore()}
        timeTaken={mode === "real" ? totalTimeTaken : undefined}
        onRestart={onRestart}
      />
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  return (
    <div className="w-full max-w-[1600px] pr-4 sm:pr-6 lg:pr-8 pb-20">
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Left Column (Question Area) */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Header for Practice Mode / Modes */}
          <div className="flex justify-between items-center bg-white dark:bg-black/40 dark:backdrop-blur-md border-2 border-zinc-100 dark:border-white/10 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="text-2xl font-black text-brand-gold">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-black text-zinc-900 dark:text-brand-gold">
                  Series Pictures
                </h1>
                {mode !== "real" && (
                  <span className="inline-block mt-1 uppercase text-[10px] font-black tracking-widest bg-brand-gold text-zinc-900 px-2.5 py-1 rounded-sm">
                    PRACTICE MODE
                  </span>
                )}
              </div>
            </div>
            <div className="text-2xl font-bold font-[family-name:var(--font-space-grotesk)] text-zinc-800 dark:text-brand-gold/90">
              Question {currentQuestionIndex + 1}
            </div>
          </div>

          {/* Question Card */}
          <QuestionCard
            question={currentQuestion}
            onAnswer={handleAnswer}
            disabled={isSubmitting || showExplanation}
            selectedAnswer={selectedAnswer ?? undefined}
            showResult={mode === "real" && currentResult !== null}
            isCorrect={currentResult?.correct}
          />

          {/* Action Buttons row (Previous, Skip, Next) */}
          {mode === "real" &&
            !showExplanation &&
            !currentResult &&
            !isSubmitting && (
              <div className="mt-2 flex justify-center w-full">
                <button
                  onClick={handleSkip}
                  className="rounded-2xl border-2 border-zinc-200 px-10 py-3.5 text-sm font-bold text-zinc-600 transition-all hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  SKIP
                </button>
              </div>
            )}

          {/* Explanation Card (Learn Mode Only) */}
          {mode === "learn" && showExplanation && currentResult && (
            <ExplanationCard
              question={currentQuestion}
              result={currentResult}
              onNext={moveToNextQuestion}
              isLastQuestion={isLastQuestion}
            />
          )}

          {/* Real Mode: Auto-advance indicator */}
          {mode === "real" && isSubmitting && (
            <div className="mt-4 text-center text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Moving to next question...
            </div>
          )}
          
          <div className="mt-6">
            <button
              onClick={onRestart}
              className="group flex items-center gap-2 rounded-xl bg-zinc-200/60 px-5 py-2.5 text-sm font-bold text-zinc-700 transition-all hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 w-max"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-transform group-hover:-translate-x-1"
              >
                <path d="M9 14 4 9l5-5" />
                <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11" />
              </svg>
              Exit
            </button>
          </div>
        </div>

        {/* Right Column (Sidebar) */}
        <div className="flex w-full flex-col gap-6 md:w-80 shrink-0">
          {/* Top Panel: Timer and Progress Bar */}
          <div className="rounded-[1.5rem] border-2 border-zinc-100 dark:border-white/10 bg-white dark:bg-black/40 dark:backdrop-blur-md p-6 shadow-sm flex flex-col gap-5">
            {/* Timer header */}
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-800 dark:text-zinc-200">
                Time Remaining
              </span>
              {mode === "real" && timeLimit ? (
                <div className="[&>div]:mb-0 [&>div]:bg-transparent [&>div]:px-0">
                  <Timer
                    timeLimit={timeLimit}
                    onTimeUp={handleTimeUp}
                    isPaused={quizComplete || showConfirmation}
                    compact
                  />
                </div>
              ) : (
                <span className="text-xl font-bold font-[family-name:var(--font-space-grotesk)] text-zinc-400">
                  --:--
                </span>
              )}
            </div>

            {/* Progress Bar */}
            <ProgressBar
              current={currentQuestionIndex + 1}
              total={questions.length}
              score={mode === "real" ? calculateScore() : undefined}
              compact
            />
          </div>

          {/* Question Navigator Panel (Real Mode Only) */}
          {mode === "real" && (
            <div className="rounded-[1.5rem] border-2 border-zinc-100 dark:border-white/10 bg-white dark:bg-black/40 dark:backdrop-blur-md p-6 shadow-sm">
              <h3 className="mb-5 font-bold text-zinc-800 dark:text-zinc-200">
                Question Navigator
              </h3>
              <QuestionNavigator
                totalQuestions={questions.length}
                currentIndex={currentQuestionIndex}
                answeredIndices={answeredQuestionIndices}
                skippedIndices={skippedIndicesSet}
                onSelectQuestion={(index) => {
                  if (
                    isSubmitting ||
                    (mode === "real" && currentResult !== null)
                  ) {
                    return;
                  }
                  setShowExplanation(false);
                  setSelectedAnswer(null);
                  setCurrentResult(null);
                  setCurrentQuestionIndex(index);
                }}
              />
            </div>
          )}

          {/* Submit/Next Button Container */}
          {mode === "real" && (
            <button
              onClick={handleSubmitClick}
              className="w-full rounded-[1.25rem] bg-amber-400 py-3.5 text-base font-bold text-zinc-900 transition-all hover:bg-amber-500 active:scale-[0.98] shadow-sm shadow-amber-400/20"
            >
              Submit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
