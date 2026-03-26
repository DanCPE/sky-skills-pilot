"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import QuestionCard from "./QuestionCard";
import ExplanationCard from "./ExplanationCard";
import ResultsScreen from "./ResultsScreen";
import QuizCompleteConfirmation from "@/components/number-series/QuizCompleteConfirmation";
import QuizSidebar from "@/components/shared/QuizSidebar";
import QuizFooterNav from "@/components/shared/QuizFooterNav";
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
  const router = useRouter();
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
            timeTaken: 0,
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

  // Show results screen when quiz is complete
  if (quizComplete) {
    return (
      <ResultsScreen
        questions={questions}
        answers={answers}
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
      <div className="bg-[#F1F5F9] dark:bg-transparent min-h-screen flex flex-col w-full">
        <div className="flex-1 w-full max-w-[1200px] mx-auto p-4 sm:p-6 pt-12 sm:pt-16 mb-20 animate-in fade-in duration-700">
          <div className="flex flex-col gap-4">
            {/* Top Header Panel */}
            <div className="flex justify-between items-center bg-white dark:bg-black/40 backdrop-blur-md border-2 border-zinc-200 dark:border-white/5 rounded-2xl px-10 pt-2 pb-4">
              <div className="flex flex-col gap-1">
                <h1 className="text-[30px] font-bold text-zinc-900 dark:text-white tracking-tight">
                  String Comparison
                </h1>
                <div className="flex items-center gap-2">
                  <span className="uppercase text-[12px] font-bold tracking-[0.2em] bg-amber-400 text-zinc-900 px-2.5 py-1 rounded-md">
                    LEARN MODE
                  </span>
                </div>
              </div>
              <div className="text-[24px] font-bold text-zinc-900 dark:text-white/90 font-[family-name:var(--font-inter)]">
                Question {currentQuestionIndex + 1}
              </div>
            </div>

            {/* Main Content Area (Two Columns) */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_24rem] gap-4">
              {/* Left Column: Question Card + Explanation */}
              <div className="flex flex-col gap-4">
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

              {/* Right Column: Sidebar (learn mode — no timer, no submit) */}
              <QuizSidebar
                answeredCount={currentQuestionIndex + 1}
                totalQuestions={questions.length}
                currentIndex={currentQuestionIndex}
                answeredIndices={answeredQuestionIndices}
                onSelectQuestion={(index) => {
                  if (isSubmitting || showExplanation) return;
                  setCurrentQuestionIndex(index);
                }}
                onSubmit={handleSubmitClick}
              />
            </div>

            {/* Bottom Navigation Bar */}
            <QuizFooterNav
              onExit={() => router.back()}
              onPrevious={() =>
                setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))
              }
              previousDisabled={currentQuestionIndex === 0}
              onNext={moveToNextQuestion}
              nextDisabled={!showExplanation}
            />

            {/* Footer Bar */}
            <div className="w-full bg-white dark:bg-black/40 py-4 flex justify-center items-center mt-auto shrink-0">
              <p className="font-[family-name:var(--font-space-grotesk)] text-[14px] text-[#374151]">
                © 2026 SkySkills. All rights reserved.
              </p>
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
    <div className="bg-[#F1F5F9] dark:bg-transparent min-h-screen flex flex-col w-full">
      <div className="flex-1 w-full max-w-[1200px] mx-auto p-4 sm:p-6 pt-12 sm:pt-16 mb-20 animate-in fade-in duration-700">
        {/* Main Content Area (Two Columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_24rem] gap-4">
          {/* Left Column: Header + Scrollable Questions */}
          <div className="flex flex-col gap-4">
            {/* Top Header Panel */}
            <div className="flex justify-between items-center bg-white dark:bg-black/40 backdrop-blur-md border-2 border-zinc-200 dark:border-white/5 rounded-2xl px-10 pt-2 pb-4">
              <div className="flex flex-col gap-1">
                <h1 className="text-[30px] font-bold text-zinc-900 dark:text-white tracking-tight">
                  String Comparison
                </h1>
                <div className="flex items-center gap-2">
                  <span className="uppercase text-[12px] font-bold tracking-[0.2em] bg-amber-400 text-zinc-900 px-2.5 py-1 rounded-md">
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
                {questions.map((question, index) => (
                  <div
                    key={question.id}
                    id={`question-${index}`}
                    className={`rounded-xl p-4 border-2 transition-all ${
                      currentQuestionIndex === index
                        ? "border-[#4F12A6]/20 bg-[#4F12A6]/10"
                        : "border-zinc-200 dark:border-white/5 bg-[#F3F3F3] dark:bg-zinc-900/60"
                    }`}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-300 uppercase tracking-widest">
                        Question {index + 1}
                      </h3>
                      {selectedAnswers[index] && (
                        <span className="uppercase tracking-widest rounded-full bg-brand-purple/20 border border-brand-purple/40 px-3 py-0.5 text-[10px] font-black text-brand-purple">
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
            </div>
          </div>

          {/* Right Column: Sidebar (real mode) */}
          <QuizSidebar
            timeLimit={timeLimit}
            onTimeUp={handleTimeUp}
            isPaused={quizComplete || showConfirmation}
            answeredCount={answeredCount}
            totalQuestions={questions.length}
            score={calculateScore()}
            currentIndex={currentQuestionIndex}
            answeredIndices={answeredSet}
            onSelectQuestion={(index) => {
              const element = document.getElementById(`question-${index}`);
              if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "center" });
              }
              setCurrentQuestionIndex(index);
            }}
            onSubmit={handleSubmitClick}
          />
          </div>

          {/* Bottom Navigation Bar */}
          <QuizFooterNav onExit={() => router.back()} />
        </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
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
      )}
      {/* Footer Bar */}
      <div className="w-full bg-white py-4 flex justify-center items-center mt-auto shrink-0">
        <p className="font-[family-name:var(--font-space-grotesk)] text-[14px] text-[#374151]">
          © 2026 SkySkills. All rights reserved.
        </p>
      </div>
    </div>
  );
}
