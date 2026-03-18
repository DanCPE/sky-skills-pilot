"use client";

import { useState, useEffect, useRef } from "react";
import Timer from "@/components/shared/Timer";
import ProgressBar from "@/components/shared/ProgressBar";
import QuestionCard from "./QuestionCard";
import ExplanationCard from "./ExplanationCard";
import ResultsScreen from "./ResultsScreen";
import QuestionNavigator from "@/components/number-series/QuestionNavigator";
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
          timeRemaining: getTimeRemaining(),
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
            timeRemaining: getTimeRemaining(),
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
      <div className="w-full max-w-[1600px] pr-4 sm:pr-6 lg:pr-8">
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Left Column */}
          <div className="flex-1 flex flex-col gap-6">
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
                    String Comparison
                  </h1>
                  <span className="inline-block mt-1 uppercase text-[10px] font-black tracking-widest bg-brand-gold text-zinc-900 px-2.5 py-1 rounded-sm">
                    PRACTICE MODE
                  </span>
                </div>
              </div>
              <div className="text-2xl font-bold font-[family-name:var(--font-space-grotesk)] text-zinc-800 dark:text-brand-gold/90">
                Question {currentQuestionIndex + 1}
              </div>
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
            <div className="rounded-[1.5rem] border-2 border-zinc-100 dark:border-white/10 bg-white dark:bg-black/40 dark:backdrop-blur-md p-6 shadow-sm flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-zinc-800 dark:text-zinc-200">
                  Time Remaining
                </span>
                <span className="text-xl font-bold font-[family-name:var(--font-space-grotesk)] text-zinc-400 dark:text-brand-gold/60">
                  --:--
                </span>
              </div>
              <ProgressBar
                current={currentQuestionIndex + 1}
                total={questions.length}
                compact
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // REAL MODE: All questions visible, scrollable
  const answeredCount = Object.keys(selectedAnswers).length;
  const answeredSet = new Set(Object.keys(selectedAnswers).map(Number));

  return (
    <div className="w-full max-w-[1600px] pr-4 sm:pr-6 lg:pr-8 pb-20">
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Left Column (Questions) */}
        <div className="flex-1 flex flex-col gap-6">
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
                  String Comparison
                </h1>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {questions.map((question, index) => (
              <div
                key={question.id}
                id={`question-${index}`}
                className="scroll-mt-24 rounded-3xl bg-zinc-50 p-6 dark:bg-black/20 dark:backdrop-blur-sm border-2 border-transparent dark:border-white/5"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    Question {index + 1}
                  </h3>
                  {selectedAnswers[index] && (
                    <span className="uppercase tracking-widest rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700 dark:bg-green-900 dark:text-green-300">
                      Answered
                    </span>
                  )}
                </div>
                <QuestionCard
                  question={question}
                  onAnswer={(answer) => {
                    handleRealAnswer(index, answer);
                    setCurrentQuestionIndex(index);
                  }}
                  disabled={answeredQuestionIndices.has(index)}
                  selectedAnswer={selectedAnswers[index]}
                  showResult={false}
                  compact={true}
                />
              </div>
            ))}
          </div>

          <div className="mt-8">
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
        <div className="flex w-full flex-col gap-6 md:w-80 shrink-0 sticky top-24 self-start">
          <div className="rounded-[1.5rem] border-2 border-zinc-100 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-800 dark:text-zinc-200">
                Time Remaining
              </span>
              {timeLimit ? (
                <div className="[&>div]:mb-0 [&>div]:bg-transparent [&>div]:px-0">
                  <Timer
                    timeLimit={timeLimit || 0}
                    onTimeUp={handleTimeUp}
                    isPaused={quizComplete || showConfirmation}
                    compact
                  />
                </div>
              ) : (
                <span className="text-xl font-bold font-[family-name:var(--font-space-grotesk)] text-zinc-400 dark:text-brand-gold/60">
                  --:--
                </span>
              )}
            </div>

            <ProgressBar
              current={answeredCount}
              total={questions.length}
              score={calculateScore()}
              compact
            />
          </div>

          <div className="rounded-[1.5rem] border-2 border-zinc-100 dark:border-white/10 bg-white dark:bg-black/40 dark:backdrop-blur-md p-6 shadow-sm">
            <h3 className="mb-5 font-bold text-zinc-800 dark:text-zinc-200">
              Question Navigator
            </h3>
            <QuestionNavigator
              totalQuestions={questions.length}
              currentIndex={currentQuestionIndex}
              answeredIndices={answeredSet}
              skippedIndices={new Set()}
              onSelectQuestion={(index) => {
                const element = document.getElementById(`question-${index}`);
                if (element) {
                  element.scrollIntoView({ behavior: "smooth", block: "center" });
                }
                setCurrentQuestionIndex(index);
              }}
            />
          </div>

          <button
            onClick={handleSubmitClick}
            disabled={isSubmitting || answeredCount === 0}
            className={`w-full rounded-[1.25rem] py-3.5 text-base font-bold transition-all shadow-sm ${
              isSubmitting || answeredCount === 0
                ? "bg-zinc-300 text-zinc-500 cursor-not-allowed dark:bg-zinc-700 dark:text-zinc-400"
                : "bg-brand-gold text-zinc-900 hover:bg-amber-300 active:scale-[0.98] shadow-brand-gold/20"
            }`}
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}
