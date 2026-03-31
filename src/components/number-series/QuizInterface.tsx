"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import QuestionCard from "./QuestionCard";
import ExplanationCard from "./ExplanationCard";
import ResultsScreen from "./ResultsScreen";
import TopicLayout from "@/components/TopicLayout";
import QuizCompleteConfirmation from "./QuizCompleteConfirmation";
import QuizSidebar from "@/components/shared/QuizSidebar";
import QuizFooterNav from "@/components/shared/QuizFooterNav";
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
  const router = useRouter();
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

    // Add 0.1s delay before proceeding with submission logic
    await new Promise((resolve) => setTimeout(resolve, 100));

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

  // Skip current question
  const handleSkip = () => {
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
    const answeredCount = new Set(answers.map((a) => a.questionId)).size;
    const unansweredCount = questions.length - answeredCount;
    if (unansweredCount > 0) {
      // Show confirmation if there are unanswered questions
      setShowConfirmation(true);
    } else {
      // All questions answered, submit directly
      handleSubmitQuiz();
    }
  };

  // Handle manual submit
  const handleSubmitQuiz = () => {
    // Mark all unanswered/skipped questions as incorrect
    const unansweredCount = questions.length - answers.length;
    if (unansweredCount > 0) {
      const answeredQuestionIds = new Set(answers.map((a) => a.questionId));
      const unansweredAnswers = questions
        .filter((q) => !answeredQuestionIds.has(q.id))
        .map((q) => ({
          questionId: q.id,
          answer: "",
          isCorrect: false,
          timeTaken: 0,
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
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-[#4F12A6] border-r-transparent"></div>
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

  // Show results screen when quiz is complete
  if (quizComplete) {
    return (
      <TopicLayout
        title="Number Series"
        description="Find the pattern in numerical sequences."
        fullWidth={false}
      >
        <ResultsScreen
          questions={questions}
          answers={answers}
          mode={mode}
          score={calculateScore()}
          timeTaken={mode === "real" ? totalTimeTaken : undefined}
          onRestart={onRestart}
        />
      </TopicLayout>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const confirmedAnsweredCount = new Set(answers.map((a) => a.questionId)).size;
  const confirmedUnansweredCount = questions.length - confirmedAnsweredCount;

  // Derive visual state for the current question
  const existingAnswer = answers.find(
    (a) => a.questionId === currentQuestion.id,
  );
  const effIsAnswered = existingAnswer !== undefined;

  // Use temporary state if we are currently interacting, otherwise use saved state
  const effSelectedAnswer = selectedAnswer ?? existingAnswer?.answer;
  const effShowExplanation =
    showExplanation || (mode === "learn" && effIsAnswered);

  // Reconstruct result for explanation card if needed
  const effResult: NumberSeriesSubmitResult | null =
    currentResult ??
    (existingAnswer
      ? {
          correct: existingAnswer.isCorrect,
          correctAnswer: currentQuestion.correctAnswer,
        }
      : null);

  return (
    <div className="bg-[#F1F5F9] dark:bg-transparent min-h-screen flex flex-col w-full">
      <div className="flex-1 w-full max-w-[1200px] mx-auto p-4 sm:p-6 pt-12 sm:pt-16 mb-20 animate-in fade-in duration-700">
        {/* Main Content Area (Two Columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_24rem] gap-4">
          {/* Left Column: Header + Question Card */}
          <div className="flex flex-col gap-4">
            {/* Top Header Panel */}
            <div className="flex justify-between items-center bg-white dark:bg-black/40 backdrop-blur-md border-2 border-zinc-200 dark:border-white/5 rounded-2xl px-10 pt-2 pb-4">
              <div className="flex flex-col gap-1">
                <h1 className="text-[30px] font-bold text-zinc-900 dark:text-white tracking-tight">
                  Number Series
                </h1>
                <div className="flex items-center gap-2">
                  <span className="uppercase text-[12px] font-bold tracking-[0.2em] bg-amber-400 text-zinc-900 px-2.5 py-1 rounded-md">
                    {mode === "real" ? "REAL MODE" : "LEARN MODE"}
                  </span>
                </div>
              </div>
              <div className="text-[24px] font-bold text-zinc-900 dark:text-white/90 font-[family-name:var(--font-inter)]">
                Question {currentQuestionIndex + 1}
              </div>
            </div>

            {/* Question Card */}
            <div className="flex flex-col space-y-4">
              <QuestionCard
                question={currentQuestion}
                onAnswer={handleAnswer}
                disabled={
                  isSubmitting ||
                  effShowExplanation ||
                  (mode === "real" && effIsAnswered)
                }
                selectedAnswer={effSelectedAnswer ?? undefined}
                showResult={mode === "real" && effResult !== null}
                isCorrect={effResult?.correct}
              />

              {effShowExplanation && effResult && (
                <ExplanationCard
                  question={currentQuestion}
                  result={effResult}
                  onNext={moveToNextQuestion}
                  isLastQuestion={isLastQuestion}
                />
              )}
            </div>
          </div>

          {/* Right Column: Sidebar */}
          <QuizSidebar
            timeLimit={mode === "real" ? timeLimit : undefined}
            onTimeUp={handleTimeUp}
            isPaused={quizComplete || showConfirmation}
            answeredCount={currentQuestionIndex + 1}
            totalQuestions={questions.length}
            score={mode === "real" ? calculateScore() : undefined}
            currentIndex={currentQuestionIndex}
            answeredIndices={answeredQuestionIndices}
            skippedIndices={skippedIndicesSet}
            onSelectQuestion={(index) => {
              if (isSubmitting || (mode === "real" && currentResult !== null))
                return;
              setShowExplanation(false);
              setSelectedAnswer(null);
              setCurrentResult(null);
              setCurrentQuestionIndex(index);
            }}
            onSubmit={handleSubmitClick}
          />

          {/* Bottom Navigation Bar */}
          <QuizFooterNav
            onExit={() => router.back()}
            onPrevious={() => {
              setShowExplanation(false);
              setSelectedAnswer(null);
              setCurrentResult(null);
              setCurrentQuestionIndex((prev) => Math.max(0, prev - 1));
            }}
            previousDisabled={currentQuestionIndex === 0}
            onSkip={handleSkip}
            onNext={() => {
              setShowExplanation(false);
              setSelectedAnswer(null);
              setCurrentResult(null);
              setCurrentQuestionIndex((prev) =>
                Math.min(questions.length - 1, prev + 1),
              );
            }}
            nextDisabled={currentQuestionIndex === questions.length - 1}
          />
        </div>
      </div>

      {/* Footer Bar */}
      <div className="w-full bg-white dark:bg-black/40 py-4 flex justify-center items-center mt-auto shrink-0">
        <p className="font-[family-name:var(--font-space-grotesk)] text-[14px] text-[#374151]">
          © 2026 SkySkills. All rights reserved.
        </p>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <QuizCompleteConfirmation
          totalQuestions={questions.length}
          answeredCount={confirmedAnsweredCount}
          skippedCount={confirmedUnansweredCount}
          onBackToQuestions={() => {
            setShowConfirmation(false);
            const answeredQuestionIds = new Set(answers.map((a) => a.questionId));
            const firstUnanswered = questions.findIndex(
              (q) => !answeredQuestionIds.has(q.id),
            );
            if (firstUnanswered !== -1) {
              setCurrentQuestionIndex(firstUnanswered);
            }
          }}
          onFinishQuiz={() => {
            handleSubmitQuiz();
          }}
        />
      )}
    </div>
  );
}
