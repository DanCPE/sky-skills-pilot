"use client";

import { useState, useEffect } from "react";
import Timer from "./Timer";
import ProgressBar from "./ProgressBar";
import QuestionCard from "./QuestionCard";
import ExplanationCard from "./ExplanationCard";
import ResultsScreen from "./ResultsScreen";
import type {
  NumberSeriesQuestion,
  NumberSeriesQuizResponse,
  NumberSeriesSubmitResult,
} from "@/types";

interface QuizAnswer {
  questionId: string;
  answer: string;
  isCorrect: boolean;
  timeTaken?: number;
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
  const [quizComplete, setQuizComplete] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [currentResult, setCurrentResult] =
    useState<NumberSeriesSubmitResult | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Timer state (practice mode only)
  const [timeRemaining, setTimeRemaining] = useState(
    timeLimit ?? questions.length * 30
  );
  const [totalTimeTaken, setTotalTimeTaken] = useState(0);
  const [quizStartTime] = useState(Date.now());

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
    if (isSubmitting) return;

    setSelectedAnswer(answer);
    setIsSubmitting(true);

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

      // Show explanation in learning mode, or move to next question in practice mode
      if (mode === "learning") {
        setShowExplanation(true);
      } else {
        // Practice mode: move to next question after a brief delay
        setTimeout(() => {
          moveToNextQuestion();
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
      moveToNextQuestion();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Move to next question
  const moveToNextQuestion = () => {
    setShowExplanation(false);
    setSelectedAnswer(null);
    setCurrentResult(null);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      setQuizComplete(true);
    }
  };

  // Calculate final score (practice mode only)
  const calculateScore = () => {
    if (mode !== "practice" || answers.length === 0) return undefined;
    const correct = answers.filter((a) => a.isCorrect).length;
    return Math.round((correct / questions.length) * 100);
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
        <ProgressBar
          current={currentQuestionIndex + 1}
          total={questions.length}
          score={mode === "practice" ? calculateScore() : undefined}
        />
        {mode === "practice" && timeLimit && (
          <Timer
            timeLimit={timeLimit}
            onTimeUp={handleTimeUp}
            isPaused={showExplanation}
          />
        )}
      </div>

      {/* Question Card */}
      <QuestionCard
        question={currentQuestion}
        onAnswer={handleAnswer}
        disabled={isSubmitting || showExplanation}
        selectedAnswer={selectedAnswer ?? undefined}
        showResult={mode === "practice" && currentResult !== null}
        isCorrect={currentResult?.correct}
      />

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
