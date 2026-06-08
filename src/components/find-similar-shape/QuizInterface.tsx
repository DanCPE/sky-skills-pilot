"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import TopicLayout from "@/components/TopicLayout";
import ShapeViewer from "@/components/jigsaw/ShapeViewer";
import QuizCompleteConfirmation from "@/components/shared/QuizCompleteConfirmation";
import QuizSidebar from "@/components/shared/QuizSidebar";
import SharedResultsScreen from "@/components/shared/ResultsScreen";
import { useRecordRealModeScore } from "@/lib/account/client-score-history";
import type {
  FindSimilarShapeQuestion,
  FindSimilarShapeQuizResponse,
  JigsawOption,
  JigsawPoint,
} from "@/types";

interface QuizInterfaceProps {
  quizData: FindSimilarShapeQuizResponse;
  onRestart: () => void;
}

function difficultyLabel(difficulty: string) {
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
}

function getPointBounds(polygons: JigsawPoint[][]) {
  const points = polygons.flat();
  return {
    minX: Math.min(...points.map((point) => point.x)),
    minY: Math.min(...points.map((point) => point.y)),
    maxX: Math.max(...points.map((point) => point.x)),
    maxY: Math.max(...points.map((point) => point.y)),
  };
}

function getSharedFitBounds(polygons: JigsawPoint[][]) {
  if (polygons.length === 0 || polygons.every((polygon) => polygon.length === 0)) {
    return { width: 1, height: 1 };
  }
  const box = getPointBounds(polygons);
  const size = Math.max(box.maxX - box.minX, box.maxY - box.minY);
  return { width: size, height: size };
}

function ReviewShapeBox({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full min-h-40 items-center justify-center rounded-xl border-2 border-zinc-200 bg-white p-3 dark:border-white/10 dark:bg-zinc-950">
      {children}
    </div>
  );
}

function OptionCell({
  option,
  isSelected,
  isCorrect,
  isSubmitted,
  isAnswered,
  onSelect,
  fitBounds,
}: {
  option: JigsawOption;
  isSelected: boolean;
  isCorrect: boolean;
  isSubmitted: boolean;
  isAnswered: boolean;
  onSelect: () => void;
  fitBounds: { width: number; height: number };
}) {
  let stateClass =
    "border-zinc-200 bg-white hover:border-zinc-400 dark:border-white/10 dark:bg-zinc-950";
  if (isSubmitted) {
    if (isCorrect) {
      stateClass = "border-green-500 bg-green-500/10";
    } else if (isSelected) {
      stateClass = "border-red-500 bg-red-500/10";
    } else {
      stateClass =
        "border-zinc-200 bg-white opacity-55 dark:border-white/10 dark:bg-zinc-950";
    }
  } else if (isSelected) {
    stateClass =
      "border-brand-purple bg-brand-purple/10 shadow-lg shadow-brand-purple/10";
  }

  return (
    <div className="relative min-h-0">
      <button
        type="button"
        disabled={isSubmitted || isAnswered}
        onClick={onSelect}
        className={`h-full min-h-[150px] w-full overflow-hidden rounded-xl border-2 p-4 transition-all active:scale-[0.98] ${stateClass}`}
      >
        <ShapeViewer
          polygons={option.polygons}
          compact
          fitBounds={fitBounds}
          highContrastBoundaries
        />
      </button>
      <div
        className={`pointer-events-none absolute left-2 top-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-bold transition-all ${
          isSelected
            ? "border-brand-purple bg-brand-purple text-white"
            : "border-zinc-300 bg-white text-zinc-500 dark:border-white/20 dark:bg-zinc-950 dark:text-zinc-400"
        }`}
      >
        {option.label}
      </div>
    </div>
  );
}

function QuestionCard({
  question,
  index,
  selectedId,
  isSubmitted,
  mode,
  onSelect,
}: {
  question: FindSimilarShapeQuestion;
  index: number;
  selectedId?: string;
  isSubmitted: boolean;
  mode: "learn" | "real";
  onSelect: (optionId: string) => void;
}) {
  const selected = question.options.find((option) => option.id === selectedId);
  const fitBounds = getSharedFitBounds(question.targetPolygons);
  const isAnswered = Boolean(selectedId);
  const isCorrect = selectedId === question.correctOptionId;

  return (
    <div
      id={`question-${question.id}`}
      className={`min-h-[760px] rounded-2xl border-2 p-4 transition-all lg:h-full lg:min-h-0 ${
        selectedId
          ? "border-brand-purple bg-brand-purple/5 dark:bg-brand-purple/10"
          : "border-zinc-200 bg-[#F3F3F3] dark:border-white/10 dark:bg-[#464543]/50"
      }`}
    >
      <div className="grid h-full gap-3 lg:min-h-0 lg:grid-cols-[minmax(340px,0.85fr)_minmax(500px,1.15fr)]">
        <section className="flex min-h-[260px] flex-col overflow-hidden rounded-md lg:min-h-0">
          <div className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
              Question {index + 1}
            </h3>
            <span className="inline-flex h-6 w-16 shrink-0 items-center justify-center rounded-md bg-amber-400 text-center text-[10px] font-bold uppercase tracking-wide text-zinc-900">
              {difficultyLabel(question.difficulty)}
            </span>
          </div>

          <div className="flex min-h-0 flex-1 items-center justify-center rounded-xl border-2 border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-zinc-950">
            <ShapeViewer
              polygons={question.targetPolygons}
              compact
              fitBounds={fitBounds}
              highContrastBoundaries
              className="min-h-0"
            />
          </div>

          {mode === "learn" && selected && (
            <div
              className={`m-3 mt-3 shrink-0 rounded-xl border-2 p-3 ${
                isCorrect
                  ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950"
                  : "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950"
              }`}
            >
              <span
                className={`block text-sm font-bold ${
                  isCorrect
                    ? "text-green-700 dark:text-green-300"
                    : "text-red-700 dark:text-red-300"
                }`}
              >
                {isCorrect
                  ? "Correct"
                  : `Correct answer: ${
                      question.options.find(
                        (option) => option.id === question.correctOptionId,
                      )?.label
                    }`}
              </span>
              <p className="mt-1 line-clamp-2 text-xs text-zinc-700 dark:text-zinc-300">
                {question.explanation}
              </p>
            </div>
          )}
        </section>

        <section className="flex min-h-[460px] flex-col rounded-xl bg-zinc-50 p-3 dark:bg-zinc-950 lg:min-h-0">
          <div className="mb-2 flex shrink-0 items-start justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                Answer Choices
              </h4>
              {!isAnswered && (
                <p className="mt-0.5 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                  Find the exact same shape and internal boundary positions.
                </p>
              )}
            </div>
          </div>
          <div className="grid min-h-0 flex-1 grid-cols-2 gap-2 sm:grid-cols-3">
            {question.options.map((option) => (
              <OptionCell
                key={option.id}
                option={option}
                isSelected={selectedId === option.id}
                isCorrect={option.id === question.correctOptionId}
                isSubmitted={isSubmitted}
                isAnswered={isAnswered}
                fitBounds={fitBounds}
                onSelect={() => onSelect(option.id)}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function QuestionReview({
  question,
  index,
  selectedId,
}: {
  question: FindSimilarShapeQuestion;
  index: number;
  selectedId?: string;
}) {
  const selected = question.options.find((option) => option.id === selectedId);
  const correct = question.options.find(
    (option) => option.id === question.correctOptionId,
  );
  const isCorrect = selectedId === question.correctOptionId;
  const fitBounds = getSharedFitBounds(question.targetPolygons);
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonArrived, setComparisonArrived] = useState(false);
  const canCompare = Boolean(selected && !isCorrect);

  useEffect(() => {
    if (!isComparing) return;

    const frame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setComparisonArrived(true));
    });
    return () => window.cancelAnimationFrame(frame);
  }, [isComparing]);

  const handleCompareToggle = () => {
    if (isComparing) {
      setIsComparing(false);
      setComparisonArrived(false);
      return;
    }

    setComparisonArrived(false);
    setIsComparing(true);
  };

  return (
    <div className="rounded-2xl border-2 border-zinc-200 bg-white p-3 dark:border-white/10 dark:bg-black/30">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-base font-bold text-zinc-900 dark:text-white">
            Question {index + 1}
          </h4>
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            {question.explanation}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canCompare && (
            <button
              type="button"
              onClick={handleCompareToggle}
              className={`rounded-lg px-3 py-2 text-xs font-bold shadow-sm transition active:scale-95 ${
                isComparing
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "bg-[#4F12A6] text-white hover:bg-violet-700"
              }`}
            >
              {isComparing ? "Separate Choice" : "Compare Shape"}
            </button>
          )}
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              isCorrect
                ? "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300"
                : "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300"
            }`}
          >
            {isCorrect ? "Correct" : "Incorrect"}
          </span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-500">
            {isComparing ? "Target + Your Choice" : "Target"}
          </p>
          <ReviewShapeBox>
            <div className="relative flex h-full w-full items-center justify-center">
            <ShapeViewer
              polygons={question.targetPolygons}
              compact
              className="min-h-0"
              fitBounds={fitBounds}
              highContrastBoundaries
            />
              {isComparing && selected && (
                <div
                  className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-[transform,opacity] duration-[1800ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    comparisonArrived
                      ? "translate-x-0 translate-y-0 opacity-100"
                      : "translate-y-[calc(100%+1rem)] opacity-80 lg:translate-x-[calc(100%+1rem)] lg:translate-y-0"
                  }`}
                >
                  <ShapeViewer
                    polygons={question.targetPolygons}
                    overlayPolygons={selected.polygons}
                    compact
                    className="min-h-0"
                    fitBounds={fitBounds}
                    hideBaseShape
                  />
                </div>
              )}
            </div>
          </ReviewShapeBox>
        </div>
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-500">
            Your Choice
          </p>
          {selected ? (
            <ReviewShapeBox>
              <div
                className={`flex h-full w-full items-center justify-center transition-opacity duration-700 ${
                  isComparing ? "opacity-35" : "opacity-100"
                }`}
              >
                <ShapeViewer
                  polygons={selected.polygons}
                  compact
                  className="min-h-0"
                  fitBounds={fitBounds}
                  highContrastBoundaries
                />
              </div>
            </ReviewShapeBox>
          ) : (
            <ReviewShapeBox>
              <div className="flex h-full min-h-32 w-full items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 text-sm font-semibold text-zinc-400 dark:border-white/15">
                No answer
              </div>
            </ReviewShapeBox>
          )}
        </div>
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-500">
            Exact Match
          </p>
          {correct && (
            <ReviewShapeBox>
              <ShapeViewer
                polygons={correct.polygons}
                compact
                className="min-h-0"
                fitBounds={fitBounds}
                highContrastBoundaries
              />
            </ReviewShapeBox>
          )}
        </div>
      </div>

      {correct && (
        <p className="mt-3 text-sm font-medium text-zinc-600 dark:text-zinc-300">
          Correct answer:{" "}
          <span className="font-bold text-[#4F12A6] dark:text-brand-gold">
            {correct.label}
          </span>
        </p>
      )}
    </div>
  );
}

export default function QuizInterface({ quizData, onRestart }: QuizInterfaceProps) {
  const router = useRouter();
  const { questions, timeLimit } = quizData;
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [skippedIndices, setSkippedIndices] = useState<Set<number>>(new Set());
  const [quizStartTime] = useState(() => Date.now());
  const [totalTimeTaken, setTotalTimeTaken] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const answeredCount = Object.keys(answers).length;
  const correctCount = questions.filter(
    (question) => answers[question.id] === question.correctOptionId,
  ).length;
  const answeredSet = new Set(
    questions
      .map((question, index) => (answers[question.id] ? index : -1))
      .filter((index) => index !== -1),
  );
  const skippedSet = new Set(
    [...skippedIndices].filter((index) => !answers[questions[index]?.id]),
  );
  const currentQuestion = questions[currentQuestionIndex];

  useRecordRealModeScore({
    completed: isSubmitted,
    mode: quizData.mode,
    topicSlug: "find-similar-shape",
    topicTitle: "Find Similar Shape",
    score: correctCount,
    maxScore: questions.length,
    questionCount: questions.length,
    timeTakenSeconds: totalTimeTaken,
  });

  const handleSubmitQuiz = () => {
    setShowConfirmation(false);
    setIsSubmitted(true);
    setTotalTimeTaken(Math.floor((Date.now() - quizStartTime) / 1000));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmitClick = () => {
    if (answeredCount < questions.length) {
      setShowConfirmation(true);
      return;
    }
    handleSubmitQuiz();
  };

  const moveToNextQuestion = () => {
    const unanswered = questions.findIndex(
      (question, index) => index > currentQuestionIndex && !answers[question.id],
    );
    if (unanswered >= 0) {
      setCurrentQuestionIndex(unanswered);
      return;
    }

    const anyUnanswered = questions.findIndex((question) => !answers[question.id]);
    if (anyUnanswered >= 0) {
      setCurrentQuestionIndex(anyUnanswered);
      return;
    }

    handleSubmitQuiz();
  };

  const handleSkip = () => {
    setSkippedIndices((previous) => new Set([...previous, currentQuestionIndex]));
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < questions.length) {
      setCurrentQuestionIndex(nextIndex);
      return;
    }
    moveToNextQuestion();
  };

  const handleSelectAnswer = (optionId: string) => {
    if (!currentQuestion || answers[currentQuestion.id]) return;

    setAnswers((previous) => ({ ...previous, [currentQuestion.id]: optionId }));
    setSkippedIndices((previous) => {
      const next = new Set(previous);
      next.delete(currentQuestionIndex);
      return next;
    });

    if (quizData.mode === "real") {
      window.setTimeout(() => {
        const nextIndex = currentQuestionIndex + 1;
        if (nextIndex < questions.length) {
          setCurrentQuestionIndex(nextIndex);
        }
      }, 500);
    }
  };

  if (isSubmitted) {
    return (
      <TopicLayout
        title="Find Similar Shape"
        description="Find the choice that exactly matches the target shape."
        fullWidth={false}
      >
        <SharedResultsScreen
          totalCount={questions.length}
          answers={questions.map((question) => ({
            isCorrect: answers[question.id] === question.correctOptionId,
            answer: answers[question.id],
          }))}
          timeTaken={totalTimeTaken}
          onRestart={onRestart}
          restartLabel="Play Again"
          showBackButton={false}
        >
          <h3 className="mb-3 text-lg font-bold text-zinc-900 dark:text-brand-gold">
            Review the Matches
          </h3>
          <div className="space-y-3">
            {questions.map((question, index) => (
              <QuestionReview
                key={question.id}
                question={question}
                index={index}
                selectedId={answers[question.id]}
              />
            ))}
          </div>
        </SharedResultsScreen>
      </TopicLayout>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-65px)] w-full flex-col overflow-y-auto bg-[#F1F5F9] dark:bg-transparent lg:h-[calc(100vh-65px)] lg:overflow-hidden">
      <div className="mx-auto flex min-h-full w-full max-w-[1200px] flex-col gap-3 p-3 sm:p-4 lg:h-full">
        <div className="grid flex-1 grid-cols-1 gap-4 lg:min-h-0 lg:grid-cols-[1fr_17rem]">
          <div className="flex flex-col gap-3 lg:min-h-0">
            <div className="flex items-center justify-between rounded-2xl border-2 border-zinc-200 bg-white px-6 py-2 dark:border-white/15 dark:bg-zinc-900/80">
              <div>
                <h1 className="text-[26px] font-bold tracking-tight text-zinc-900 dark:text-white">
                  Find Similar Shape
                </h1>
                <span className="mt-1 inline-flex rounded-md bg-amber-400 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-900">
                  {quizData.mode === "real" ? "Real Mode" : "Learn Mode"}
                </span>
              </div>
              <div className="text-[22px] font-bold text-zinc-900 dark:text-white/90">
                Question {currentQuestionIndex + 1}
              </div>
            </div>

            <div className="flex-1 lg:min-h-0">
              {currentQuestion && (
                <QuestionCard
                  key={currentQuestion.id}
                  question={currentQuestion}
                  index={currentQuestionIndex}
                  selectedId={answers[currentQuestion.id]}
                  isSubmitted={isSubmitted}
                  mode={quizData.mode}
                  onSelect={handleSelectAnswer}
                />
              )}
            </div>
          </div>

          <div className="[&>div]:gap-3 [&>div>button]:px-10 [&>div>div]:p-4 [&>div>div:first-child]:gap-4">
            <QuizSidebar
              timeLimit={timeLimit}
              onTimeUp={handleSubmitQuiz}
              isPaused={isSubmitted}
              answeredCount={answeredCount}
              totalQuestions={questions.length}
              currentIndex={currentQuestionIndex}
              answeredIndices={answeredSet}
              skippedIndices={skippedSet}
              onSelectQuestion={setCurrentQuestionIndex}
              onSubmit={handleSubmitClick}
            />
          </div>
        </div>

        <div className="grid shrink-0 grid-cols-1 gap-4 lg:grid-cols-[1fr_17rem]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-100 px-4 py-3 text-sm font-bold text-zinc-600 transition-all hover:border-zinc-300 hover:bg-zinc-200 hover:text-zinc-900 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400 dark:hover:border-white/20 dark:hover:bg-white/10 dark:hover:text-white"
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
            <button
              type="button"
              onClick={() =>
                setCurrentQuestionIndex((previous) => Math.max(0, previous - 1))
              }
              disabled={currentQuestionIndex === 0}
              className="rounded-xl border border-[#E0E0E0] bg-white px-8 py-3 text-sm font-bold text-zinc-700 transition-all hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-30 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
            >
              Previous
            </button>
            <div className="flex-1" />
            <button
              type="button"
              onClick={handleSkip}
              className="rounded-xl border border-[#E0E0E0] bg-white px-10 py-3 text-sm font-bold text-zinc-700 transition-all hover:bg-zinc-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
            >
              Skip
            </button>
            <button
              type="button"
              onClick={moveToNextQuestion}
              disabled={currentQuestionIndex === questions.length - 1}
              className="rounded-xl border border-[#4F12A6] bg-[#4F12A6] px-12 py-3 text-sm font-bold text-white shadow-lg shadow-[#4F12A6]/20 transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
            >
              Next
            </button>
          </div>
          <div aria-hidden="true" />
        </div>
      </div>

      {showConfirmation && (
        <QuizCompleteConfirmation
          totalQuestions={questions.length}
          answeredCount={answeredCount}
          remainingCount={questions.length - answeredCount}
          onBackToQuestions={() => setShowConfirmation(false)}
          onFinishQuiz={handleSubmitQuiz}
        />
      )}
    </div>
  );
}
