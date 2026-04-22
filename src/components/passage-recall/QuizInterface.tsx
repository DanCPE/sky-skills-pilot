"use client";

import { useMemo, useState } from "react";
import ProgressBar from "@/components/shared/ProgressBar";
import ResultsScreen from "@/components/shared/ResultsScreen";
import Timer from "@/components/shared/Timer";
import QuestionCard from "./QuestionCard";
import type { PassageRecallQuizResponse } from "@/types";

interface RecordedAnswer {
  questionId: string;
  answer: string;
  isCorrect: boolean;
}

interface QuizInterfaceProps {
  quizData: PassageRecallQuizResponse;
  onRestart: () => void;
  onPassageExpired: () => void;
}

export default function QuizInterface({
  quizData,
  onRestart,
  onPassageExpired,
}: QuizInterfaceProps) {
  const [answers, setAnswers] = useState<Record<string, RecordedAnswer>>({});
  const [timeTaken, setTimeTaken] = useState<number>(0);
  const [isComplete, setIsComplete] = useState(false);
  const [questionStartTimestamp] = useState(() => Date.now());

  const phase = isComplete ? "results" : quizData.passage ? "reading" : "evaluation";
  const answerEntries = useMemo(() => Object.values(answers), [answers]);
  const answeredCount = answerEntries.length;
  const unansweredCount = quizData.questions.length - answeredCount;

  const handleAnswer = (questionId: string, answer: string, correctAnswer: string) => {
    setAnswers((current) => ({
      ...current,
      [questionId]: {
        questionId,
        answer,
        isCorrect: answer === correctAnswer,
      },
    }));
  };

  const handleFinish = () => {
    setTimeTaken(Math.floor((Date.now() - questionStartTimestamp) / 1000));
    setIsComplete(true);
  };

  if (phase === "results") {
    return (
        <ResultsScreen
          totalCount={quizData.questions.length}
          answers={answerEntries}
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
              const answer = answers[question.id];

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
            aviation details. You can jump straight to the questions at any time, or
            wait for the timer to wipe the passage automatically.
          </p>
          <div className="mt-4">
            <button
              onClick={onPassageExpired}
              className="rounded-xl bg-[#4F12A6] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#4F12A6]/20 transition-all hover:opacity-90 active:scale-[0.98]"
            >
              Answer Now
            </button>
          </div>
        </div>

        <div className="rounded-2xl border-2 border-[#E2EAF0] bg-white px-6 py-8 dark:border-white/10 dark:bg-black/20">
          <p className="whitespace-pre-line text-lg leading-9 text-zinc-800 dark:text-zinc-100">
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

      <div className="mb-6 rounded-2xl border-2 border-zinc-200 bg-white p-5 dark:border-white/10 dark:bg-black/40 dark:backdrop-blur-md">
        <div className="mb-3 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
              Answered {answeredCount} of {quizData.questions.length}
            </p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Scroll freely and answer in any order.
              {unansweredCount > 0
                ? ` ${unansweredCount} question${unansweredCount === 1 ? "" : "s"} still unanswered.`
                : " All questions have an answer selected."}
            </p>
          </div>
          <button
            onClick={() => setAnswers({})}
            disabled={answeredCount === 0}
            className="rounded-xl border-2 border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-zinc-200 dark:hover:bg-white/5"
          >
            Clear All
          </button>
        </div>
        <ProgressBar
          current={answeredCount}
          total={quizData.questions.length}
        />
      </div>

      <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-2">
        {quizData.questions.map((question, index) => (
          <div key={question.id}>
            <p className="mb-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
              Question {index + 1}
            </p>
            <QuestionCard
              question={question}
              selectedAnswer={answers[question.id]?.answer}
              onAnswer={(answer) => handleAnswer(question.id, answer, question.correctAnswer)}
            />
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <button
          onClick={onRestart}
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
          onClick={handleFinish}
          disabled={answeredCount === 0}
          className="rounded-xl bg-[#4F12A6] px-8 py-3 text-sm font-bold text-white shadow-lg shadow-[#4F12A6]/20 transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
        >
          Submit Answers
        </button>
      </div>
    </div>
  );
}
