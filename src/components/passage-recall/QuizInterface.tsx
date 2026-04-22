"use client";

import { useMemo, useState } from "react";
import ProgressBar from "@/components/shared/ProgressBar";
import QuizFooterNav from "@/components/shared/QuizFooterNav";
import ResultsScreen from "@/components/shared/ResultsScreen";
import Timer from "@/components/shared/Timer";
import QuestionCard from "./QuestionCard";
import type { ShortTermMemoryQuizResponse } from "@/types";

interface RecordedAnswer {
  questionId: string;
  answer: string;
  isCorrect: boolean;
}

interface QuizInterfaceProps {
  quizData: ShortTermMemoryQuizResponse;
  onRestart: () => void;
  onPassageExpired: () => void;
}

export default function QuizInterface({
  quizData,
  onRestart,
  onPassageExpired,
}: QuizInterfaceProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answers, setAnswers] = useState<RecordedAnswer[]>([]);
  const [timeTaken, setTimeTaken] = useState<number>(0);
  const [isComplete, setIsComplete] = useState(false);
  const [questionStartTimestamp] = useState(() => Date.now());

  const phase = isComplete ? "results" : quizData.passage ? "reading" : "evaluation";
  const currentQuestion = quizData.questions[currentQuestionIndex];
  const answerMap = useMemo(
    () => new Map(answers.map((answer) => [answer.questionId, answer])),
    [answers],
  );

  const handleNext = () => {
    if (!selectedAnswer) {
      return;
    }

    const nextAnswers = [
      ...answers,
      {
        questionId: currentQuestion.id,
        answer: selectedAnswer,
        isCorrect: selectedAnswer === currentQuestion.correctAnswer,
      },
    ];

    setAnswers(nextAnswers);
    setSelectedAnswer(null);

    if (currentQuestionIndex === quizData.questions.length - 1) {
      setTimeTaken(Math.floor((Date.now() - questionStartTimestamp) / 1000));
      setIsComplete(true);
      return;
    }

    setCurrentQuestionIndex((index) => index + 1);
  };

  if (phase === "results") {
    return (
      <ResultsScreen
        totalCount={quizData.questions.length}
        answers={answers}
        timeTaken={timeTaken}
        onRestart={onRestart}
        restartLabel="Generate Another Passage"
      >
        <div className="rounded-2xl border-2 border-zinc-200 bg-white p-6 dark:border-white/10 dark:bg-black/40 dark:backdrop-blur-md">
          <h3 className="mb-4 text-xl font-bold text-zinc-900 dark:text-zinc-100 font-[family-name:var(--font-space-grotesk)]">
            Recall Review
          </h3>
          <div className="space-y-3">
            {quizData.questions.map((question, index) => {
              const answer = answerMap.get(question.id);

              return (
                <div
                  key={question.id}
                  className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-white/10 dark:bg-white/5"
                >
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {index + 1}. {question.prompt}
                  </p>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    Your answer: {answer?.answer ?? "Not answered"}
                  </p>
                  <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
                    Correct answer: {question.correctAnswer}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </ResultsScreen>
    );
  }

  if (phase === "reading" && quizData.passage) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 rounded-2xl border-2 border-zinc-200 bg-white p-6 dark:border-white/10 dark:bg-black/40 dark:backdrop-blur-md">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                Reading Phase
              </p>
              <h2 className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-[family-name:var(--font-space-grotesk)]">
                Memorize the passage
              </h2>
            </div>
            <Timer
              timeLimit={quizData.readingDurationSeconds}
              onTimeUp={onPassageExpired}
              compact
            />
          </div>
          <p className="text-sm leading-7 text-zinc-600 dark:text-zinc-400">
            Focus on the callsign, waypoint, level, heading, runway, and other
            aviation details. The passage will be removed completely when time is up.
          </p>
        </div>

        <div className="rounded-2xl border-2 border-[#E2EAF0] bg-white px-6 py-8 dark:border-white/10 dark:bg-black/20">
          <p className="text-lg leading-9 text-zinc-800 dark:text-zinc-100">
            {quizData.passage}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 rounded-2xl border-2 border-zinc-200 bg-white p-6 dark:border-white/10 dark:bg-black/40 dark:backdrop-blur-md">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
          Evaluation Phase
        </p>
        <h2 className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-[family-name:var(--font-space-grotesk)]">
          Recall the passage from memory
        </h2>
        <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
          The passage has been cleared from application state. Choose the detail you
          remember for each question.
        </p>
      </div>

      <ProgressBar
        current={currentQuestionIndex + 1}
        total={quizData.questions.length}
      />

      <QuestionCard
        question={currentQuestion}
        selectedAnswer={selectedAnswer ?? undefined}
        onAnswer={setSelectedAnswer}
      />

      <div className="mt-6">
        <QuizFooterNav
          onExit={onRestart}
          onNext={handleNext}
          nextDisabled={!selectedAnswer}
        />
      </div>
    </div>
  );
}
