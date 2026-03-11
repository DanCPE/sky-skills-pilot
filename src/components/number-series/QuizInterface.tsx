"use client";

import { useState, useEffect, useRef } from "react";
import Timer from "./Timer";
import ProgressBar from "./ProgressBar";
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

  // Timer state (practice mode only)
  const [timeRemaining, setTimeRemaining] = useState(
    timeLimit ?? questions.length * 30,
  );
  const [totalTimeTaken, setTotalTimeTaken] = useState(0);
  const [quizStartTime] = useState(Date.now());

  // Ref to track if submission is in progress (prevents double-clicks)
  const isSubmittingRef = useRef(false);

  // Update total time when quiz completes
  useEffect(() => {
    if (quizComplete) {
      setTotalTimeTaken(Math.floor((Date.now() - quizStartTime) / 1000));
    }
  }, [quizComplete, quizStartTime]);

  // Handle time up (practice mode)
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
          timeRemaining,
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

      // Show explanation in learning mode, or move to next question in practice mode
      if (mode === "learning") {
        setShowExplanation(true);
        setIsSubmitting(false);
        isSubmittingRef.current = false;
      } else {
        // Practice mode: move to next question after a brief delay
        setTimeout(() => {
          moveToNextQuestion();
          setIsSubmitting(false);
          isSubmittingRef.current = false;
        }, 500);
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

  // Skip current question (practice mode only)
  const handleSkip = () => {
    if (mode !== "practice") return;

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

  // Calculate final score (practice mode only)
  const calculateScore = () => {
    if (mode !== "practice" || answers.length === 0) return undefined;
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

  // Handle manual submit (practice mode only)
  const handleSubmitQuiz = () => {
    if (mode !== "practice") return;

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
        timeTaken={mode === "practice" ? totalTimeTaken : undefined}
        onRestart={onRestart}
      />
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header with Progress and Timer */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <ProgressBar
            current={currentQuestionIndex + 1}
            total={questions.length}
            score={mode === "practice" ? calculateScore() : undefined}
          />
          {mode === "practice" && (
            <button
              onClick={handleSubmitClick}
              className="rounded-lg border-2 border-green-600 bg-green-600 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-green-700 active:scale-95 dark:border-green-500 dark:bg-green-500 dark:hover:bg-green-600"
            >
              Submit Quiz
            </button>
          )}
        </div>
        {mode === "practice" && timeLimit && (
          <Timer
            timeLimit={timeLimit}
            onTimeUp={handleTimeUp}
            isPaused={showExplanation}
          />
        )}
      </div>

      {/* Question Navigator (Practice Mode Only) */}
      {mode === "practice" && (
        <QuestionNavigator
          totalQuestions={questions.length}
          currentIndex={currentQuestionIndex}
          answeredIndices={answeredQuestionIndices}
          skippedIndices={skippedIndicesSet}
          onSelectQuestion={(index) => {
            // Prevent changing questions while submitting or showing results
            if (
              isSubmitting ||
              (mode === "practice" && currentResult !== null)
            ) {
              return;
            }
            setShowExplanation(false);
            setSelectedAnswer(null);
            setCurrentResult(null);
            setCurrentQuestionIndex(index);
          }}
        />
      )}

      {/* Question Card */}
      <QuestionCard
        question={currentQuestion}
        onAnswer={handleAnswer}
        disabled={isSubmitting || showExplanation}
        selectedAnswer={selectedAnswer ?? undefined}
        showResult={mode === "practice" && currentResult !== null}
        isCorrect={currentResult?.correct}
      />

      {/* Skip Button (Practice Mode Only) */}
      {mode === "practice" &&
        !showExplanation &&
        !currentResult &&
        !isSubmitting && (
          <div className="mt-4 text-center">
            <button
              onClick={handleSkip}
              className="rounded-lg border-2 border-zinc-300 px-6 py-2.5 text-sm font-medium text-zinc-600 transition-all hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
            >
              Skip Question →
            </button>
          </div>
        )}

      {/* Explanation Card (Learning Mode Only) */}
      {mode === "learning" && showExplanation && currentResult && (
        <ExplanationCard
          question={currentQuestion}
          result={currentResult}
          onNext={moveToNextQuestion}
          isLastQuestion={isLastQuestion}
        />
      )}

      {/* Practice Mode: Auto-advance indicator */}
      {mode === "practice" && isSubmitting && (
        <div className="mt-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Moving to next question...
        </div>
      )}
    </div>
  );
}
