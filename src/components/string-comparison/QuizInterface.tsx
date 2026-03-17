"use client";

import { useState, useEffect, useRef } from "react";
import Timer from "@/components/shared/Timer";
import ProgressBar from "@/components/shared/ProgressBar";
import QuestionCard from "./QuestionCard";
import ExplanationCard from "./ExplanationCard";
import ResultsScreen from "./ResultsScreen";
import QuizCompleteConfirmation from "@/components/number-series/QuizCompleteConfirmation";
import type {
  ScanningPracticeQuizResponse,
  ScanningPracticeSubmitResult,
} from "@/types";

interface QuizAnswer {
  questionId: string;
  answer: string;
  isCorrect: boolean;
  timeTaken?: number;
}

interface QuizInterfaceProps {
  quizData: ScanningPracticeQuizResponse;
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
  const [answeredQuestionIndices, setAnsweredQuestionIndices] = useState<
    Set<number>
  >(new Set());
  const [quizComplete, setQuizComplete] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [currentResult, setCurrentResult] =
    useState<ScanningPracticeSubmitResult | null>(null);

  // Real mode: Store selected answer for each question
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<number, string>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Timer state (real mode only)
  const [timeRemaining, setTimeRemaining] = useState(
    timeLimit ?? questions.length * 3,
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

  // Handle time up (real mode)
  const handleTimeUp = () => {
    // Submit all unanswered questions as incorrect
    const unansweredAnswers = questions
      .map((q, idx) => ({ question: q, index: idx }))
      .filter(({ index }) => !answeredQuestionIndices.has(index))
      .map(({ question }) => ({
        questionId: question.id,
        answer: "",
        isCorrect: false,
      }));
    setAnswers((prev) => [...prev, ...unansweredAnswers]);
    setQuizComplete(true);
  };

  // Handle answer selection for real mode (all questions visible)
  const handleRealAnswer = (questionIndex: number, answer: string) => {
    if (answeredQuestionIndices.has(questionIndex)) {
      return; // Already answered, don't allow changes
    }

    setSelectedAnswers((prev) => ({ ...prev, [questionIndex]: answer }));
  };

  // Handle answer selection for learn mode (single question at a time)
  const handleLearnAnswer = async (answer: string) => {
    if (isSubmitting || isSubmittingRef.current) {
      return;
    }

    setIsSubmitting(true);
    isSubmittingRef.current = true;

    const currentQuestion = questions[currentQuestionIndex];
    const questionStartTime = Date.now();

    try {
      const response = await fetch("/api/string-comparison/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          answer,
          mode,
          questionIndex: currentQuestionIndex,
          timeRemaining,
          differenceCount: currentQuestion.differenceCount,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit answer");
      }

      const result: ScanningPracticeSubmitResult = await response.json();
      setCurrentResult(result);

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

      setShowExplanation(true);
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    } catch (error) {
      console.error("Error submitting answer:", error);
      const answerData: QuizAnswer = {
        questionId: currentQuestion.id,
        answer,
        isCorrect: answer === String(currentQuestion.differenceCount),
      };
      setAnswers((prev) => [...prev, answerData]);
      setAnsweredQuestionIndices(
        (prev) => new Set([...prev, currentQuestionIndex]),
      );
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  // Move to next question (learn mode only)
  const moveToNextQuestion = () => {
    setShowExplanation(false);
    setCurrentResult(null);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      setQuizComplete(true);
    }
  };

  // Calculate final score (real mode only)
  const calculateScore = () => {
    if (mode !== "real" || answers.length === 0) return undefined;
    const correct = answers.filter((a) => a.isCorrect).length;
    return Math.round((correct / questions.length) * 100);
  };

  // Handle submit quiz (real mode)
  const handleSubmitQuiz = async () => {
    if (mode !== "real") {
      return;
    }

    // Hide confirmation immediately
    setShowConfirmation(false);
    setIsSubmitting(true);
    const submitStartTime = Date.now();

    try {
      // Submit all answers to the API
      const submitPromises = questions.map(async (question, index) => {
        const selectedAnswer = selectedAnswers[index];

        if (!selectedAnswer) {
          return {
            questionId: question.id,
            answer: "",
            isCorrect: false,
          };
        }

        const response = await fetch("/api/string-comparison/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionId: question.id,
            answer: selectedAnswer,
            mode,
            questionIndex: index,
            timeRemaining,
            differenceCount: question.differenceCount,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to submit answer");
        }

        const result: ScanningPracticeSubmitResult = await response.json();

        return {
          questionId: question.id,
          answer: selectedAnswer,
          isCorrect: result.correct ?? false,
          timeTaken: Math.floor((Date.now() - submitStartTime) / 1000),
        };
      });

      const submittedAnswers = await Promise.all(submitPromises);
      setAnswers(submittedAnswers);
      setQuizComplete(true);
    } catch (error) {
      console.error("Error submitting quiz:", error);
      // Fallback: validate answers locally
      const localAnswers = questions.map((question, index) => {
        const selectedAnswer = selectedAnswers[index];
        return {
          questionId: question.id,
          answer: selectedAnswer || "",
          isCorrect: selectedAnswer === String(question.differenceCount),
        };
      });
      setAnswers(localAnswers);
      setQuizComplete(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show submit confirmation (real mode)
  const handleSubmitClick = () => {
    const answeredCount = Object.keys(selectedAnswers).length;
    if (answeredCount < questions.length) {
      setShowConfirmation(true);
    } else {
      handleSubmitQuiz();
    }
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

  // Show confirmation when there are unanswered questions (real mode)
  if (showConfirmation) {
    const answeredCount = Object.keys(selectedAnswers).length;
    return (
      <QuizCompleteConfirmation
        totalQuestions={questions.length}
        answeredCount={answeredCount}
        skippedCount={questions.length - answeredCount}
        onBackToQuestions={() => {
          setShowConfirmation(false);
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

  // LEARN MODE: Single question with explanation
  if (mode === "learn") {
    const currentQuestion = questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === questions.length - 1;

    return (
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <ProgressBar
            current={currentQuestionIndex + 1}
            total={questions.length}
          />
        </div>

        <QuestionCard
          question={currentQuestion}
          onAnswer={handleLearnAnswer}
          disabled={isSubmitting || showExplanation}
          selectedAnswer={undefined}
          showResult={false}
        />

        {showExplanation && currentResult && (
          <ExplanationCard
            question={currentQuestion}
            result={currentResult}
            onNext={moveToNextQuestion}
            isLastQuestion={isLastQuestion}
          />
        )}
      </div>
    );
  }

  // REAL MODE: All questions visible, scrollable
  const answeredCount = Object.keys(selectedAnswers).length;

  return (
    <div className="mx-auto max-w-4xl">
      {/* Sticky Header with Timer and Submit Button */}
      <div className="sticky top-16 z-40 mb-8 rounded-3xl border-2 border-zinc-200 bg-white/95 p-4 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/95">
        <div className="mb-4 flex items-center justify-between">
          <ProgressBar
            current={answeredCount}
            total={questions.length}
            score={calculateScore()}
          />
          <button
            onClick={handleSubmitClick}
            disabled={isSubmitting || answeredCount === 0}
            className={`rounded-2xl border-2 px-6 py-2.5 text-sm font-semibold text-white transition-all ${
              isSubmitting || answeredCount === 0
                ? "cursor-not-allowed bg-zinc-400"
                : "cursor-pointer border-green-600 bg-green-600 hover:bg-green-700 active:scale-95 dark:border-green-500 dark:bg-green-500 dark:hover:bg-green-600"
            }`}
          >
            {isSubmitting ? "Submitting..." : "Submit Quiz"}
          </button>
        </div>
        {timeLimit && (
          <div className="rounded-2xl bg-zinc-100 px-4 py-3 dark:bg-zinc-800">
            <Timer
              timeLimit={timeLimit}
              onTimeUp={handleTimeUp}
              isPaused={false}
            />
          </div>
        )}
      </div>

      {/* All Questions */}
      <div className="space-y-6">
        {questions.map((question, index) => (
          <div
            key={question.id}
            id={`question-${index}`}
            className="rounded-3xl bg-zinc-50 p-4 dark:bg-zinc-800/50"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Question {index + 1}
              </h3>
              {selectedAnswers[index] && (
                <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
                  ✓ Answered
                </span>
              )}
            </div>
            <QuestionCard
              question={question}
              onAnswer={(answer) => handleRealAnswer(index, answer)}
              disabled={answeredQuestionIndices.has(index)}
              selectedAnswer={selectedAnswers[index]}
              showResult={false}
              compact={true}
            />
          </div>
        ))}
      </div>

      {/* Submit Button at Bottom */}
      <div className="mt-12 text-center">
        <button
          onClick={handleSubmitClick}
          disabled={isSubmitting || answeredCount === 0}
          className={`inline-flex items-center gap-2 rounded-xl px-8 py-4 text-lg font-bold text-white transition-all ${
            isSubmitting || answeredCount === 0
              ? "cursor-not-allowed bg-zinc-400"
              : "cursor-pointer bg-violet-600 hover:bg-violet-500 active:bg-violet-700 dark:bg-violet-600 dark:hover:bg-violet-500"
          }`}
        >
          {isSubmitting ? (
            <>
              <svg
                className="h-5 w-5 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Submitting...
            </>
          ) : (
            <>
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Submit Quiz ({answeredCount}/{questions.length} answered)
            </>
          )}
        </button>
      </div>
    </div>
  );
}
