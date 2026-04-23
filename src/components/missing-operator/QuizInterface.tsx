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
  MissingOperatorQuizResponse,
  MissingOperatorSubmitResult,
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
  quizData: MissingOperatorQuizResponse;
  onRestart: () => void;
}

export default function QuizInterface({
  quizData,
  onRestart,
}: QuizInterfaceProps) {
  const router = useRouter();
  const { questions, mode, timeLimit } = quizData;

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
    useState<MissingOperatorSubmitResult | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [totalTimeTaken, setTotalTimeTaken] = useState(0);
  const [quizStartTime] = useState(Date.now());

  const isSubmittingRef = useRef(false);
  const realConfirmTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingAnswerRef = useRef<string | null>(null);

  const clearRealConfirmTimeout = () => {
    if (realConfirmTimeoutRef.current) {
      clearTimeout(realConfirmTimeoutRef.current);
      realConfirmTimeoutRef.current = null;
    }
  };

  const getTimeRemaining = () => {
    if (!timeLimit) return 0;
    const elapsed = Math.floor((Date.now() - quizStartTime) / 1000);
    return Math.max(0, timeLimit - elapsed);
  };

  useEffect(() => {
    if (quizComplete) {
      setTotalTimeTaken(Math.floor((Date.now() - quizStartTime) / 1000));
    }
  }, [quizComplete, quizStartTime]);

  const handleTimeUp = () => {
    const answeredQuestionIds = new Set(answers.map((a) => a.questionId));
    const currentQ = questions[currentQuestionIndex];

    const pendingAnswers: QuizAnswer[] = [];
    if (!answeredQuestionIds.has(currentQ.id) && selectedAnswer) {
      pendingAnswers.push({
        questionId: currentQ.id,
        answer: selectedAnswer,
        isCorrect: selectedAnswer === currentQ.correctAnswer,
      });
      answeredQuestionIds.add(currentQ.id);
    }

    const remainingAnswers = questions
      .filter((q) => !answeredQuestionIds.has(q.id))
      .map((q) => ({ questionId: q.id, answer: "", isCorrect: false }));

    setAnswers((prev) => [...prev, ...pendingAnswers, ...remainingAnswers]);
    setQuizComplete(true);
  };

  const moveToNextQuestion = () => {
    setShowExplanation(false);
    setSelectedAnswer(null);
    setCurrentResult(null);

    const allUnattempted = questions
      .map((_, idx) => idx)
      .filter(
        (idx) =>
          idx !== currentQuestionIndex && !answeredQuestionIndices.has(idx),
      );

    if (allUnattempted.length > 0) {
      const nextUnattemptedIndex = allUnattempted.reduce((nearest, idx) => {
        const distanceToNearest = Math.abs(nearest - currentQuestionIndex);
        const distanceToCurrent = Math.abs(idx - currentQuestionIndex);

        if (distanceToCurrent < distanceToNearest) {
          return idx;
        }

        if (distanceToCurrent === distanceToNearest) {
          return idx > nearest ? idx : nearest;
        }

        return nearest;
      });
      setCurrentQuestionIndex(nextUnattemptedIndex);
    } else {
      setQuizComplete(true);
    }
  };

  const handleAnswer = async (answer: string) => {
    if (isSubmitting || isSubmittingRef.current) return;

    setSelectedAnswer(answer);

    if (mode === "real") {
      clearRealConfirmTimeout();
      pendingAnswerRef.current = answer;
      realConfirmTimeoutRef.current = setTimeout(() => {
        handleRealConfirmWithAnswer(pendingAnswerRef.current!);
      }, 800);
      return;
    }

    // Learn mode: submit immediately after short delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    setIsSubmitting(true);
    isSubmittingRef.current = true;

    const currentQuestion = questions[currentQuestionIndex];
    const questionStartTime = Date.now();

    try {
      const response = await fetch("/api/missing-operator/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          answer,
          mode,
          questionIndex: currentQuestionIndex,
          timeRemaining: getTimeRemaining(),
          correctAnswer: currentQuestion.correctAnswer,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit answer");
      }

      const result: MissingOperatorSubmitResult = await response.json();
      setCurrentResult(result);

      const answerData: QuizAnswer = {
        questionId: currentQuestion.id,
        answer,
        isCorrect: result.correct ?? false,
        timeTaken: Math.floor((Date.now() - questionStartTime) / 1000),
      };

      setAnswers((prev) => [...prev, answerData]);
      setAnsweredQuestionIndices((prev) => new Set([...prev, currentQuestionIndex]));
      setSkippedQuestions((prev) =>
        prev.filter((sq) => sq.questionIndex !== currentQuestionIndex),
      );

      setShowExplanation(true);
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    } catch (error) {
      console.error("Error submitting missing operator answer:", error);
      const answerData: QuizAnswer = {
        questionId: currentQuestion.id,
        answer,
        isCorrect: answer === currentQuestion.correctAnswer,
      };
      setAnswers((prev) => [...prev, answerData]);
      setAnsweredQuestionIndices((prev) => new Set([...prev, currentQuestionIndex]));
      setSkippedQuestions((prev) =>
        prev.filter((sq) => sq.questionIndex !== currentQuestionIndex),
      );
      setShowExplanation(true);
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  // Confirm answer and advance in real mode — called by timeout or footer Next button
  const handleRealConfirmWithAnswer = async (answer: string) => {
    if (!answer || isSubmitting || isSubmittingRef.current) return;
    setIsSubmitting(true);
    isSubmittingRef.current = true;

    const currentQuestion = questions[currentQuestionIndex];
    const questionStartTime = Date.now();

    try {
      const response = await fetch("/api/missing-operator/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          answer,
          mode,
          questionIndex: currentQuestionIndex,
          timeRemaining: getTimeRemaining(),
          correctAnswer: currentQuestion.correctAnswer,
        }),
      });

      if (!response.ok) throw new Error("Failed to submit answer");

      const result: MissingOperatorSubmitResult = await response.json();

      const answerData: QuizAnswer = {
        questionId: currentQuestion.id,
        answer,
        isCorrect: result.correct ?? false,
        timeTaken: Math.floor((Date.now() - questionStartTime) / 1000),
      };

      setAnswers((prev) => [...prev, answerData]);
      setAnsweredQuestionIndices((prev) => new Set([...prev, currentQuestionIndex]));
      setSkippedQuestions((prev) =>
        prev.filter((sq) => sq.questionIndex !== currentQuestionIndex),
      );
      moveToNextQuestion();
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    } catch (error) {
      console.error("Error submitting missing operator answer:", error);
      const answerData: QuizAnswer = {
        questionId: currentQuestion.id,
        answer,
        isCorrect: answer === currentQuestion.correctAnswer,
      };
      setAnswers((prev) => [...prev, answerData]);
      setAnsweredQuestionIndices((prev) => new Set([...prev, currentQuestionIndex]));
      setSkippedQuestions((prev) =>
        prev.filter((sq) => sq.questionIndex !== currentQuestionIndex),
      );
      moveToNextQuestion();
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

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

  const calculateScore = () => {
    if (mode !== "real" || answers.length === 0) return undefined;
    const correct = answers.filter((a) => a.isCorrect).length;
    return Math.round((correct / questions.length) * 100);
  };

  const handleSubmitClick = () => {
    const answeredCount = new Set(answers.map((a) => a.questionId)).size;
    const unansweredCount = questions.length - answeredCount;
    if (unansweredCount > 0) {
      setShowConfirmation(true);
    } else {
      handleSubmitQuiz();
    }
  };

  const handleSubmitQuiz = () => {
    const answeredQuestionIds = new Set(answers.map((a) => a.questionId));
    const currentQ = questions[currentQuestionIndex];

    const pendingAnswers: QuizAnswer[] = [];
    if (mode === "real" && !answeredQuestionIds.has(currentQ.id) && selectedAnswer) {
      pendingAnswers.push({
        questionId: currentQ.id,
        answer: selectedAnswer,
        isCorrect: selectedAnswer === currentQ.correctAnswer,
      });
      answeredQuestionIds.add(currentQ.id);
    }

    const unansweredAnswers = questions
      .filter((q) => !answeredQuestionIds.has(q.id))
      .map((q) => ({
        questionId: q.id,
        answer: "",
        isCorrect: false,
        timeTaken: 0,
      }));

    setAnswers((prev) => [...prev, ...pendingAnswers, ...unansweredAnswers]);
    setShowConfirmation(false);
    setQuizComplete(true);
  };

  if (!questions || questions.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-[#4F12A6] border-r-transparent" />
          <p className="text-zinc-600 dark:text-zinc-400">Loading questions...</p>
        </div>
      </div>
    );
  }

  const skippedIndicesSet = new Set(
    skippedQuestions.map((sq) => sq.questionIndex),
  );

  if (quizComplete) {
    return (
      <TopicLayout
        title="Missing Operator"
        description="Practice arithmetic and mental math."
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

  const existingAnswer = answers.find((a) => a.questionId === currentQuestion.id);
  const effIsAnswered = existingAnswer !== undefined;
  const effSelectedAnswer = selectedAnswer ?? existingAnswer?.answer;
  const effShowExplanation =
    showExplanation || (mode === "learn" && effIsAnswered);

  const effResult: MissingOperatorSubmitResult | null =
    currentResult ??
    (existingAnswer
      ? {
          correct: existingAnswer.isCorrect,
          correctAnswer: currentQuestion.correctAnswer,
          explanation: currentQuestion.explanation,
        }
      : null);

  return (
    <div className="bg-[#F1F5F9] dark:bg-transparent min-h-screen flex flex-col w-full">
      <div className="flex-1 w-full max-w-[1200px] mx-auto p-4 sm:p-6 pt-12 sm:pt-16 mb-20 animate-in fade-in duration-700">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_24rem] gap-4">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center bg-white dark:bg-black/40 backdrop-blur-md border-2 border-zinc-200 dark:border-white/5 rounded-2xl px-10 pt-2 pb-4">
              <div className="flex flex-col gap-1">
                <h1 className="text-[30px] font-bold text-zinc-900 dark:text-white tracking-tight">
                  Missing Operator
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

            <div className="flex flex-col space-y-4">
              <QuestionCard
                question={currentQuestion}
                onAnswer={handleAnswer}
                disabled={isSubmitting || effShowExplanation}
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
              if (isSubmitting) return;
              clearRealConfirmTimeout();
              setShowExplanation(false);
              setSelectedAnswer(null);
              setCurrentResult(null);
              setCurrentQuestionIndex(index);
            }}
            onSubmit={handleSubmitClick}
          />

          <QuizFooterNav
            onExit={() => router.back()}
            onPrevious={() => {
              clearRealConfirmTimeout();
              setShowExplanation(false);
              setSelectedAnswer(null);
              setCurrentResult(null);
              setCurrentQuestionIndex((prev) => Math.max(0, prev - 1));
            }}
            previousDisabled={currentQuestionIndex === 0}
            onSkip={handleSkip}
            onNext={
              mode === "real" && !effIsAnswered
                ? () => handleRealConfirmWithAnswer(selectedAnswer!)
                : () => {
                    setShowExplanation(false);
                    setSelectedAnswer(null);
                    setCurrentResult(null);
                    setCurrentQuestionIndex((prev) =>
                      Math.min(questions.length - 1, prev + 1),
                    );
                  }
            }
            nextDisabled={
              mode === "real" && !effIsAnswered
                ? !selectedAnswer || isSubmitting
                : currentQuestionIndex === questions.length - 1
            }
          />
        </div>
      </div>

      <div className="w-full bg-white dark:bg-black/40 py-4 flex justify-center items-center mt-auto shrink-0">
        <p className="font-[family-name:var(--font-space-grotesk)] text-[14px] text-[#374151]">
          © 2026 SkySkills. All rights reserved.
        </p>
      </div>

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
