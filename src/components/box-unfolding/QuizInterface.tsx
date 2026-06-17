"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TopicLayout from "@/components/TopicLayout";
import FoldingAnimation, {
  FoldedCubeSnapshot,
} from "@/components/box-folding/FoldingAnimation";
import NetViewer from "@/components/box-folding/NetViewer";
import QuizCompleteConfirmation from "@/components/shared/QuizCompleteConfirmation";
import QuizSidebar from "@/components/shared/QuizSidebar";
import SharedResultsScreen from "@/components/shared/ResultsScreen";
import { BOX_FOLDING_CHOICE_VIEW } from "@/lib/box-folding-generator";
import { useRecordRealModeScore } from "@/lib/account/client-score-history";
import type {
  BoxFoldingOption,
  BoxFoldingQuestion,
  BoxFoldingQuizResponse,
  BoxUnfoldingMode,
} from "@/types";

interface QuizInterfaceProps {
  quizData: BoxFoldingQuizResponse;
  onRestart: () => void;
}

function difficultyLabel(difficulty: string) {
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
}

function NetOptionCell({
  option,
  question,
  isSelected,
  isCorrect,
  isSubmitted,
  isAnswered,
  largeChoice,
  onSelect,
}: {
  option: BoxFoldingOption;
  question: BoxFoldingQuestion;
  isSelected: boolean;
  isCorrect: boolean;
  isSubmitted: boolean;
  isAnswered: boolean;
  largeChoice: boolean;
  onSelect: () => void;
}) {
  let stateClass =
    "border-zinc-200 bg-white hover:border-zinc-400 dark:border-white/10 dark:bg-zinc-950";
  if (isSubmitted) {
    if (isCorrect) {
      stateClass = "border-green-500 bg-green-500/10";
    } else if (isSelected) {
      stateClass = "border-red-500 bg-red-500/10";
    } else {
      stateClass = "border-zinc-200 bg-white opacity-55 dark:border-white/10 dark:bg-zinc-950";
    }
  } else if (isSelected) {
    stateClass = "border-brand-purple bg-brand-purple/10 shadow-lg shadow-brand-purple/10";
  }

  return (
    <div className="relative min-h-0">
      <button
        type="button"
        disabled={isSubmitted || isAnswered}
        onClick={onSelect}
        className={`h-full w-full overflow-hidden rounded-xl border-2 transition-all active:scale-[0.98] ${
          largeChoice ? "min-h-[160px]" : "min-h-[112px]"
        } ${stateClass}`}
      >
        <NetViewer
          pattern={option.pattern ?? question.pattern}
          images={option.netImages}
          imageRotations={option.netImageRotations}
          choice={!largeChoice}
          choiceLarge={largeChoice}
        />
      </button>
      <div
        className={`pointer-events-none absolute left-2 top-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-bold transition-all ${
          isSelected
            ? "border-brand-purple bg-brand-purple text-white"
            : "border-zinc-300 text-zinc-500 dark:border-white/20 dark:text-zinc-400"
        }`}
      >
        {option.label}
      </div>
    </div>
  );
}

function ReviewNet({
  option,
  question,
}: {
  option: BoxFoldingOption;
  question: BoxFoldingQuestion;
}) {
  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-xl border-2 border-zinc-200 bg-white dark:border-white/10 dark:bg-zinc-900">
      <span className="pointer-events-none absolute left-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-[11px] font-bold text-white shadow-sm dark:bg-white dark:text-zinc-950">
        {option.label}
      </span>
      <div className="min-h-0 flex-1 overflow-hidden p-3">
        <NetViewer
          pattern={option.pattern ?? question.pattern}
          images={option.netImages}
          imageRotations={option.netImageRotations}
        />
      </div>
    </div>
  );
}

function QuestionReview({
  question,
  index,
  selectedId,
}: {
  question: BoxFoldingQuestion;
  index: number;
  selectedId?: string;
}) {
  const selected = question.options.find((option) => option.id === selectedId);
  const correct = question.options.find((option) => option.id === question.correctOptionId);
  const isCorrect = selectedId === question.correctOptionId;

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

      <div className="grid items-start gap-4 lg:grid-cols-3">
        <div className="flex min-h-0 flex-col">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-500">
            Unfold / Refold
          </p>
          <div className="h-[260px]">
            <FoldingAnimation
              pattern={correct?.pattern ?? question.pattern}
              images={correct?.netImages ?? question.images}
              imageRotations={correct?.netImageRotations}
              faceAssignments={question.faceAssignments}
              faceOrientations={question.faceOrientations}
              interactive
              initialProgress={1}
              title="Unfold Preview"
              primaryLabel="Unfold"
              primaryTarget={0}
              secondaryLabel="Fold"
              secondaryTarget={1}
              className="h-full"
            />
          </div>
        </div>
        <div className="flex min-h-0 flex-col">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-500">
            Your Choice
          </p>
          <div className="h-[260px]">
            {selected ? (
              <ReviewNet option={selected} question={question} />
            ) : (
              <div className="flex h-full items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 text-sm font-semibold text-zinc-400 dark:border-white/15">
                No answer
              </div>
            )}
          </div>
        </div>
        <div className="flex min-h-0 flex-col">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-500">
            Correct Net
          </p>
          <div className="h-[260px]">
            {correct && <ReviewNet option={correct} question={question} />}
          </div>
        </div>
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
  unfoldingMode,
  onSelect,
}: {
  question: BoxFoldingQuestion;
  index: number;
  selectedId?: string;
  isSubmitted: boolean;
  mode: "learn" | "real";
  unfoldingMode: BoxUnfoldingMode;
  onSelect: (optionId: string) => void;
}) {
  const [isAnswered, setIsAnswered] = useState(Boolean(selectedId));
  const selected = question.options.find((option) => option.id === selectedId);
  const isCorrect = selectedId === question.correctOptionId;
  const isSixChoiceLayout = question.options.length === 6;

  useEffect(() => {
    setIsAnswered(Boolean(selectedId));
  }, [selectedId]);

  return (
    <div
      id={`question-${question.id}`}
      className="h-full min-h-0 rounded-2xl border-2 border-[#E2EAF0] bg-white p-3 dark:border-white/10 dark:bg-black/20"
    >
      <div className="grid h-full min-h-0 gap-3 lg:grid-cols-[minmax(240px,0.55fr)_minmax(720px,1.45fr)]">
        <section className="flex min-h-0 flex-col overflow-hidden rounded-xl bg-white dark:bg-zinc-900/80">
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-zinc-100 px-3 py-2 dark:border-white/10">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                Question {index + 1}
              </h3>
              <p className="mt-0.5 text-xs font-semibold leading-snug text-zinc-500 dark:text-zinc-400">
                {question.prompt}
              </p>
            </div>
            <span className="shrink-0 rounded-md bg-amber-400 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-zinc-900">
              {difficultyLabel(question.difficulty)}
            </span>
          </div>

          <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden px-2 py-2">
            <FoldedCubeSnapshot
              pattern={question.pattern}
              images={question.images}
              faceAssignments={question.faceAssignments}
              faceOrientations={question.faceOrientations}
              view={BOX_FOLDING_CHOICE_VIEW}
              interactive={unfoldingMode !== "3-side"}
              className="h-full w-full"
              cubeScale={1.28}
            />
          </div>

          {mode === "learn" && selected && (
            <div
              className={`m-3 mt-0 shrink-0 rounded-xl border-2 p-3 ${
                isCorrect
                  ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950"
                  : "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950"
              }`}
            >
              <span
                className={`block text-sm font-bold ${
                  isCorrect ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"
                }`}
              >
                {isCorrect ? "Correct" : `Correct answer: ${question.options.find((option) => option.id === question.correctOptionId)?.label}`}
              </span>
              <p className="mt-1 line-clamp-2 text-xs text-zinc-700 dark:text-zinc-300">
                Rotate the cube to compare every face against the chosen net.
              </p>
            </div>
          )}
        </section>

        <section className="flex min-h-0 flex-col rounded-xl bg-zinc-50 p-3 dark:bg-zinc-950">
          <div className="mb-2 flex shrink-0 items-start justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                Answer Choices
              </h4>
            </div>
            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-zinc-400">
              {isSixChoiceLayout ? "3 x 2" : "3 x 3"}
            </span>
          </div>
          <div
            className={`grid min-h-0 flex-1 grid-cols-3 gap-3 ${
              isSixChoiceLayout ? "grid-rows-2" : "grid-rows-3"
            }`}
          >
            {question.options.map((option) => (
              <NetOptionCell
                key={option.id}
                option={option}
                question={question}
                isSelected={selectedId === option.id}
                isCorrect={option.id === question.correctOptionId}
                isSubmitted={isSubmitted}
                isAnswered={isAnswered}
                largeChoice={isSixChoiceLayout}
                onSelect={() => onSelect(option.id)}
              />
            ))}
          </div>
        </section>
      </div>
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
      .filter((questionIndex) => questionIndex !== -1),
  );
  const skippedSet = new Set(
    [...skippedIndices].filter((index) => !answers[questions[index]?.id]),
  );
  const currentQuestion = questions[currentQuestionIndex];

  useRecordRealModeScore({
    completed: isSubmitted,
    mode: quizData.mode,
    topicSlug: "box-unfolding",
    topicTitle: "Box Unfolding",
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
        title="Box Unfolding"
        description="Choose the flat net that can unfold from the folded cube."
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
            Review the Unfolds
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
    <div className="flex h-[calc(100vh-65px)] w-full flex-col overflow-hidden bg-[#F1F5F9] dark:bg-transparent">
      <div className="mx-auto flex h-full w-full max-w-[1200px] flex-col gap-3 p-3 sm:p-4">
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[1fr_17rem]">
          <div className="flex min-h-0 flex-col gap-3">
            <div className="flex items-center justify-between rounded-2xl border-2 border-zinc-200 bg-white px-6 py-2 dark:border-white/15 dark:bg-zinc-900/80">
              <div>
                <h1 className="text-[26px] font-bold tracking-tight text-zinc-900 dark:text-white">
                  Box Unfolding
                </h1>
                <span className="mt-1 inline-flex rounded-md bg-amber-400 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-900">
                  {quizData.mode === "real" ? "Real Mode" : "Learn Mode"}
                </span>
              </div>
              <div className="text-[22px] font-bold text-zinc-900 dark:text-white/90">
                Question {currentQuestionIndex + 1}
              </div>
            </div>

            <div className="min-h-0 flex-1">
              {currentQuestion && (
                <QuestionCard
                  key={currentQuestion.id}
                  question={currentQuestion}
                  index={currentQuestionIndex}
                  selectedId={answers[currentQuestion.id]}
                  isSubmitted={isSubmitted}
                  mode={quizData.mode}
                  unfoldingMode={quizData.unfoldingMode ?? "6-side"}
                  onSelect={handleSelectAnswer}
                />
              )}
            </div>

            <div className="flex shrink-0 items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-100 px-4 py-3 text-sm font-bold text-zinc-600 transition-all hover:border-zinc-300 hover:bg-zinc-200 hover:text-zinc-900 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400 dark:hover:border-white/20 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  Exit
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentQuestionIndex((previous) => Math.max(0, previous - 1))}
                  disabled={currentQuestionIndex === 0}
                  className="rounded-xl border border-[#E0E0E0] bg-white px-6 py-3 text-sm font-bold text-zinc-700 transition-all hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-30 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                >
                  Previous
                </button>
              </div>
              <div className="flex items-center gap-3">
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
              onSelectQuestion={(index) => {
                setCurrentQuestionIndex(index);
              }}
              onSubmit={handleSubmitClick}
            />
          </div>
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
