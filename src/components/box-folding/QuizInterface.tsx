"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import TopicLayout from "@/components/TopicLayout";
import FoldingAnimation, {
  FoldedCubeSnapshot,
} from "@/components/box-folding/FoldingAnimation";
import NetViewer from "@/components/box-folding/NetViewer";
import QuizCompleteConfirmation from "@/components/shared/QuizCompleteConfirmation";
import QuizFooterNav from "@/components/shared/QuizFooterNav";
import QuizSidebar from "@/components/shared/QuizSidebar";
import SharedResultsScreen from "@/components/shared/ResultsScreen";
import { useRecordRealModeScore } from "@/lib/account/client-score-history";
import type {
  BoxFoldingOption,
  BoxFoldingQuestion,
  BoxFoldingQuizResponse,
} from "@/types";

interface QuizInterfaceProps {
  quizData: BoxFoldingQuizResponse;
  onRestart: () => void;
}

function difficultyLabel(difficulty: string) {
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
}

const CUBE_CELL_SIZE = 54;

function OptionCell({
  option,
  question,
  isSelected,
  isCorrect,
  isSubmitted,
  isAnswered,
  onSelect,
}: {
  option: BoxFoldingOption;
  question: BoxFoldingQuestion;
  isSelected: boolean;
  isCorrect: boolean;
  isSubmitted: boolean;
  isAnswered: boolean;
  onSelect: () => void;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [cubeScale, setCubeScale] = useState(2.0);

  useEffect(() => {
    const el = buttonRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      setCubeScale((w * 0.82) / (CUBE_CELL_SIZE * Math.sqrt(3)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

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
    <div className="flex flex-col items-center gap-2">
      <button
        ref={buttonRef}
        disabled={isSubmitted || isAnswered}
        onClick={onSelect}
        className={`aspect-square w-full overflow-hidden rounded-xl border-2 transition-all active:scale-[0.98] ${stateClass}`}
      >
        <FoldedCubeSnapshot
          pattern={question.pattern}
          images={option.netImages}
          faceAssignments={question.faceAssignments}
          faceOrientations={question.faceOrientations}
          view={option.view}
          imageRotations={option.netImageRotations}
          className="h-full"
          cubeScale={cubeScale}
        />
      </button>
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-[12px] font-bold transition-all ${
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

      <div className="grid gap-4 lg:grid-cols-3">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-500">
            Fold / Deflip
          </p>
          <FoldingAnimation
            pattern={question.pattern}
            images={question.images}
            faceAssignments={question.faceAssignments}
            faceOrientations={question.faceOrientations}
            interactive
          />
        </div>
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-500">
            Your Choice
          </p>
          {selected ? (
            <ReviewCube option={selected} question={question} />
          ) : (
            <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-zinc-300 text-sm font-semibold text-zinc-400 dark:border-white/15">
              No answer
            </div>
          )}
        </div>
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-500">
            Possible View
          </p>
          {correct && (
            <ReviewCube option={correct} question={question} />
          )}
        </div>
      </div>

      {correct && (
        <p className="mt-3 text-sm font-medium text-zinc-600 dark:text-zinc-300">
          Correct answer:{" "}
          <span className="font-bold text-[#4F12A6] dark:text-brand-gold">
            {correct.label}
          </span>
          . This is the only option that matches the folded net.
        </p>
      )}
    </div>
  );
}

function ReviewCube({
  option,
  question,
}: {
  option: BoxFoldingOption;
  question: BoxFoldingQuestion;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cubeScale, setCubeScale] = useState(1.8);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width: w, height: h } = entry.contentRect;
      const dim = Math.min(w, h > 0 ? h : w);
      setCubeScale((dim * 0.82) / (CUBE_CELL_SIZE * Math.sqrt(3)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border-2 border-zinc-200 bg-white dark:border-white/10 dark:bg-zinc-900">
      <div className="flex shrink-0 items-center justify-between border-b border-zinc-100 px-3 py-2 dark:border-white/5">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-[11px] font-bold text-white dark:bg-white dark:text-zinc-950">
          {option.label}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">
          Drag to tilt
        </span>
      </div>
      <div ref={containerRef} className="min-h-0 flex-1">
        <FoldedCubeSnapshot
          pattern={question.pattern}
          images={option.netImages}
          faceAssignments={question.faceAssignments}
          faceOrientations={question.faceOrientations}
          view={option.view}
          imageRotations={option.netImageRotations}
          className="h-full"
          cubeScale={cubeScale}
          interactive
        />
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
  onSkip,
  onNext,
  isLastQuestion,
}: {
  question: BoxFoldingQuestion;
  index: number;
  selectedId?: string;
  isSubmitted: boolean;
  mode: "learn" | "real";
  onSelect: (optionId: string) => void;
  onSkip: () => void;
  onNext: () => void;
  isLastQuestion: boolean;
}) {
  const selected = question.options.find((option) => option.id === selectedId);
  const isAnswered = Boolean(selectedId);
  const isCorrect = selectedId === question.correctOptionId;

  return (
    <div
      id={`question-${question.id}`}
      className="rounded-2xl border-2 border-[#E2EAF0] bg-white px-4 py-6 dark:border-white/10 dark:bg-black/20"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
            Question {index + 1}
          </h3>
          <p className="mt-0.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            {question.prompt}
          </p>
        </div>
        <span className="rounded-md bg-amber-400 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-zinc-900">
          {difficultyLabel(question.difficulty)}
        </span>
      </div>

      <div className="mb-3 flex items-center justify-center overflow-hidden rounded-[1rem] border-2 border-[#4F12A6] bg-white px-4 py-6 dark:border-white/60 dark:bg-zinc-900/80">
        <NetViewer
          pattern={question.pattern}
          images={question.images}
          faceAssignments={question.faceAssignments}
          faceOrientations={question.faceOrientations}
          large
        />
      </div>

      <div className="mb-4 flex justify-end gap-2">
        {!isAnswered && !isSubmitted && (
          <button
            type="button"
            onClick={onSkip}
            className="rounded-xl border border-zinc-200 bg-white px-6 py-2 text-sm font-bold text-zinc-600 transition hover:bg-zinc-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10"
          >
            Skip
          </button>
        )}
        <button
          type="button"
          onClick={onNext}
          disabled={!isAnswered}
          className="rounded-xl bg-[#4F12A6] px-8 py-2 text-sm font-bold text-white shadow shadow-[#4F12A6]/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
        >
          {isLastQuestion ? "Finish" : "Next"}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {question.options.map((option) => (
          <OptionCell
            key={option.id}
            option={option}
            question={question}
            isSelected={selectedId === option.id}
            isCorrect={option.id === question.correctOptionId}
            isSubmitted={isSubmitted}
            isAnswered={isAnswered}
            onSelect={() => onSelect(option.id)}
          />
        ))}
      </div>

      {mode === "learn" && selected && (
        <div
          className={`mt-3 rounded-xl border-2 p-3 ${
            isCorrect
              ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950"
              : "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950"
          }`}
        >
          <div className="mb-2 flex items-center justify-between gap-3">
            <span
              className={`text-sm font-bold ${
                isCorrect ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"
              }`}
            >
              {isCorrect ? "Correct" : `Correct answer: ${question.options.find((option) => option.id === question.correctOptionId)?.label}`}
            </span>
            <button
              type="button"
              onClick={onNext}
              className="rounded-lg bg-[#4F12A6] px-4 py-2 text-sm font-bold text-white transition hover:bg-violet-700 active:scale-95"
            >
              {isLastQuestion ? "Finish" : "Next"}
            </button>
          </div>
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            {question.explanation}
          </p>
        </div>
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
    topicSlug: "box-folding",
    topicTitle: "Box Folding",
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
        title="Box Folding"
        description="Choose the folded cube view that can come from the net."
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
            Review the Folds
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
    <div className="flex min-h-screen w-full flex-col bg-[#F1F5F9] dark:bg-transparent">
      <div className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col p-3 pt-4 sm:p-4 sm:pt-5">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_24rem]">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between rounded-2xl border-2 border-zinc-200 bg-white px-6 py-2 dark:border-white/15 dark:bg-zinc-900/80">
              <div>
                <h1 className="text-[26px] font-bold tracking-tight text-zinc-900 dark:text-white">
                  Box Folding
                </h1>
                <span className="mt-1 inline-flex rounded-md bg-amber-400 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-900">
                  {quizData.mode === "real" ? "Real Mode" : "Learn Mode"}
                </span>
              </div>
              <div className="text-[22px] font-bold text-zinc-900 dark:text-white/90">
                Question {currentQuestionIndex + 1}
              </div>
            </div>

            <div className="rounded-2xl border-2 border-zinc-200 bg-white p-3 dark:border-white/15 dark:bg-black/20">
              {currentQuestion && (
                <QuestionCard
                  key={currentQuestion.id}
                  question={currentQuestion}
                  index={currentQuestionIndex}
                  selectedId={answers[currentQuestion.id]}
                  isSubmitted={isSubmitted}
                  mode={quizData.mode}
                  onSelect={handleSelectAnswer}
                  onSkip={handleSkip}
                  onNext={moveToNextQuestion}
                  isLastQuestion={
                    answeredCount >= questions.length ||
                    !questions.some((question) => !answers[question.id])
                  }
                />
              )}
            </div>
          </div>

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

        <QuizFooterNav
          onExit={() => router.back()}
          onPrevious={() => setCurrentQuestionIndex((previous) => Math.max(0, previous - 1))}
          previousDisabled={currentQuestionIndex === 0}
        />
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
