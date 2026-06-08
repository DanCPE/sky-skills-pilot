"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import TopicLayout from "@/components/TopicLayout";
import QuizCompleteConfirmation from "@/components/shared/QuizCompleteConfirmation";
import QuizFooterNav from "@/components/shared/QuizFooterNav";
import QuizSidebar from "@/components/shared/QuizSidebar";
import SharedResultsScreen from "@/components/shared/ResultsScreen";
import VoxelViewer from "@/components/missing-cube/VoxelViewer";
import { useRecordRealModeScore } from "@/lib/account/client-score-history";
import type {
  CubeCell,
  MissingCubePiece,
  MissingCubeQuestion,
  MissingCubeQuizResponse,
} from "@/types";

interface QuizInterfaceProps {
  quizData: MissingCubeQuizResponse;
  onRestart: () => void;
}

function key(cell: CubeCell) {
  return `${cell.x},${cell.y},${cell.z}`;
}

function fullCubeWithoutMissing(question: MissingCubeQuestion): CubeCell[] {
  const missing = new Set(question.missingPiece.cells.map(key));
  const cells: CubeCell[] = [];
  for (let x = 0; x < question.size; x++) {
    for (let y = 0; y < question.size; y++) {
      for (let z = 0; z < question.size; z++) {
        const cell = { x, y, z };
        if (!missing.has(key(cell))) cells.push(cell);
      }
    }
  }
  return cells;
}

function QuestionReview({
  question,
  index,
  selectedId,
}: {
  question: MissingCubeQuestion;
  index: number;
  selectedId?: string;
}) {
  const selected = question.options.find((option) => option.id === selectedId);
  const isCorrect = selectedId === question.correctOptionId;
  const animationFrameRef = useRef<number | null>(null);
  const [assemblyProgress, setAssemblyProgress] = useState(0);
  const [isAssembled, setIsAssembled] = useState(false);
  const [assemblyRotation, setAssemblyRotation] = useState({
    yaw: question.initialRotation.yaw,
    pitch: question.initialRotation.pitch,
  });
  const assembledVisible: MissingCubePiece = {
    id: `${question.id}-assembled-visible`,
    label: "Cube body",
    cells: fullCubeWithoutMissing(question),
  };

  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const handleAssemblyToggle = () => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    const duration = 1500;
    const start = performance.now();
    const startProgress = assemblyProgress;
    const targetProgress = isAssembled ? 0 : 1;
    setIsAssembled(targetProgress === 1);

    const animate = (now: number) => {
      const rawProgress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - rawProgress, 3);
      const nextProgress =
        startProgress + (targetProgress - startProgress) * eased;
      setAssemblyProgress(nextProgress);
      setAssemblyRotation({
        yaw: question.initialRotation.yaw + nextProgress * 90,
        pitch:
          question.initialRotation.pitch +
          Math.sin(nextProgress * Math.PI) * 18,
      });

      if (rawProgress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        animationFrameRef.current = null;
      }
    };

    setAssemblyRotation({
      yaw: question.initialRotation.yaw + startProgress * 90,
      pitch:
        question.initialRotation.pitch +
        Math.sin(startProgress * Math.PI) * 18,
    });
    animationFrameRef.current = requestAnimationFrame(animate);
  };

  return (
    <div className="rounded-2xl border-2 border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-black/30">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-base font-bold text-zinc-900 dark:text-white">
            Question {index + 1}
          </h4>
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            {question.prompt}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAssemblyToggle}
            className="rounded-lg bg-[#4F12A6] px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-violet-700 active:scale-95"
          >
            {isAssembled ? "Disassemble" : "Assemble"}
          </button>
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
            Question
          </p>
          <VoxelViewer
            parts={question.visibleParts}
            yaw={assemblyRotation.yaw}
            pitch={assemblyRotation.pitch}
            shellSize={question.size}
            assemblyProgress={assemblyProgress}
            compact
          />
        </div>
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-500">
            Your Choice
          </p>
          {selected ? (
            <VoxelViewer
              parts={[selected]}
              yaw={question.initialRotation.yaw}
              pitch={question.initialRotation.pitch}
              opacity={1}
              exteriorGrid
              compact
            />
          ) : (
            <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-zinc-300 text-sm font-semibold text-zinc-400 dark:border-white/15">
              No answer
            </div>
          )}
        </div>
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-500">
            Completed Cube
          </p>
          <VoxelViewer
            parts={[
              assembledVisible,
              {
                ...question.missingPiece,
                id: `${question.id}-correct-piece`,
                label: "Missing piece",
              },
            ]}
            yaw={question.initialRotation.yaw}
            pitch={question.initialRotation.pitch}
            shellSize={question.size}
            compact
          />
        </div>
      </div>

      {!isCorrect && (
        <p className="mt-3 text-sm font-medium text-zinc-600 dark:text-zinc-300">
          Correct answer:{" "}
          <span className="font-bold text-[#4F12A6] dark:text-brand-gold">
            {question.options.find((option) => option.id === question.correctOptionId)?.label}
          </span>
        </p>
      )}
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
  question: MissingCubeQuestion;
  index: number;
  selectedId?: string;
  isSubmitted: boolean;
  mode: "learn" | "real";
  onSelect: (optionId: string) => void;
}) {
  const canTilt = mode === "learn";

  return (
    <div
      id={`question-${question.id}`}
      className={`rounded-2xl border-2 p-4 transition-all ${
        selectedId
          ? "border-brand-purple bg-brand-purple/5 dark:bg-brand-purple/10"
          : "border-zinc-200 bg-[#F3F3F3] dark:border-white/10 dark:bg-[#464543]/50"
      }`}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
            Question {index + 1}
          </h3>
          <p className="mt-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            {question.prompt}
          </p>
        </div>
        <span className="rounded-md bg-amber-400 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-zinc-900">
          {question.size}x{question.size}x{question.size}
        </span>
      </div>

      <VoxelViewer
        parts={question.visibleParts}
        yaw={question.initialRotation.yaw}
        pitch={question.initialRotation.pitch}
        interactive={canTilt}
        shellSize={question.size}
        className="mb-4"
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {question.options.map((option) => {
          const isSelected = selectedId === option.id;
          const isCorrect = option.id === question.correctOptionId;
          let stateClass =
            "border-zinc-200 bg-white hover:border-zinc-400 dark:border-white/10 dark:bg-zinc-950";

          if (isSubmitted) {
            if (isCorrect) {
              stateClass = "border-green-500 bg-green-500/10";
            } else if (isSelected) {
              stateClass = "border-red-500 bg-red-500/10";
            } else {
              stateClass = "border-zinc-200 bg-white dark:border-white/10 dark:bg-zinc-950";
            }
          } else if (isSelected) {
            stateClass = "border-brand-purple bg-brand-purple/10 shadow-lg shadow-brand-purple/10";
          }

          return (
            <button
              key={option.id}
              disabled={isSubmitted}
              onClick={() => onSelect(option.id)}
              className={`rounded-xl border-2 p-2 text-left transition-all active:scale-[0.98] ${stateClass}`}
            >
              <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 text-xs font-bold text-white dark:bg-white dark:text-zinc-950">
                {option.label}
              </div>
              <VoxelViewer
                parts={[option]}
                yaw={45}
                pitch={45}
                interactive={canTilt}
                opacity={1}
                exteriorGrid
                compact
              />
            </button>
          );
        })}
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
  const [quizStartTime] = useState(() => Date.now());
  const [totalTimeTaken, setTotalTimeTaken] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const answeredCount = Object.keys(answers).length;
  const correctCount = questions.filter(
    (question) => answers[question.id] === question.correctOptionId,
  ).length;
  const answeredSet = new Set(
    questions.map((question, index) => (answers[question.id] ? index : -1)).filter((index) => index !== -1),
  );

  useRecordRealModeScore({
    completed: isSubmitted,
    mode: quizData.mode,
    topicSlug: "missing-cube",
    topicTitle: "Missing Cube",
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

  if (isSubmitted) {
    return (
      <TopicLayout
        title="Missing Cube"
        description="Choose the piece that completes the 3D cube."
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
          <h3 className="mb-4 text-xl font-bold text-zinc-900 dark:text-brand-gold">
            Review the Fit
          </h3>
          <div className="space-y-4">
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
      <div className="mx-auto mb-20 w-full max-w-[1200px] flex-1 p-4 pt-12 sm:p-6 sm:pt-16">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_24rem]">
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border-2 border-zinc-200 bg-white px-8 py-5 dark:border-white/15 dark:bg-zinc-900/80">
              <h1 className="text-[30px] font-bold tracking-tight text-zinc-900 dark:text-white">
                Missing Cube
              </h1>
              <span className="mt-2 inline-flex rounded-md bg-amber-400 px-2.5 py-1 text-[12px] font-bold uppercase tracking-[0.2em] text-zinc-900">
                {quizData.mode === "real" ? "Real Mode" : "Learn Mode"}
              </span>
            </div>

            <div
              className="overflow-y-auto rounded-2xl border-2 border-zinc-200 bg-white p-4 dark:border-white/15 dark:bg-black/20"
              style={{ height: "calc(100vh - 260px)", minHeight: "520px" }}
            >
              <div className="space-y-4">
                {questions.map((question, index) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    index={index}
                    selectedId={answers[question.id]}
                    isSubmitted={isSubmitted}
                    mode={quizData.mode}
                    onSelect={(optionId) => {
                      setAnswers((previous) => ({ ...previous, [question.id]: optionId }));
                      setCurrentQuestionIndex(index);
                    }}
                  />
                ))}
              </div>
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
            onSelectQuestion={(index) => {
              document
                .getElementById(`question-${questions[index].id}`)
                ?.scrollIntoView({ behavior: "smooth", block: "center" });
              setCurrentQuestionIndex(index);
            }}
            onSubmit={handleSubmitClick}
          />
        </div>

        <QuizFooterNav onExit={() => router.back()} />
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
