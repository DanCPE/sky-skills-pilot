"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import TopicLayout from "@/components/TopicLayout";
import ResultsScreen from "@/components/shared/ResultsScreen";
import QuestionCard from "./QuestionCard";
import type { PassageRecallQuizResponse, ShortTermMemoryMathQuestion } from "@/types";

type Phase = "reading" | "math" | "evaluation" | "results";

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

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function MathQuestionCard({
  question,
  selectedAnswer,
  onAnswer,
}: {
  question: ShortTermMemoryMathQuestion;
  selectedAnswer?: string;
  onAnswer: (answer: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
      <p className="mb-4 text-center font-[family-name:var(--font-space-grotesk)] text-2xl font-black text-zinc-900 dark:text-zinc-100">
        {question.prompt}
      </p>
      <div className="grid grid-cols-2 gap-3">
        {question.options.map((option) => (
          <button
            key={option}
            onClick={() => onAnswer(option)}
            className={`rounded-xl border-2 px-4 py-3 text-lg font-bold transition ${
              selectedAnswer === option
                ? "border-brand-purple bg-brand-purple text-white"
                : "border-zinc-200 bg-white text-zinc-900 hover:border-brand-purple dark:border-white/10 dark:bg-black/30 dark:text-zinc-100"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function QuizInterface({
  quizData,
  onRestart,
  onPassageExpired,
}: QuizInterfaceProps) {
  const { questions, mathQuestions, readingDurationSeconds } = quizData;

  const [phase, setPhase] = useState<Phase>("reading");
  const [timeRemaining, setTimeRemaining] = useState(readingDurationSeconds);
  const [answers, setAnswers] = useState<Record<string, RecordedAnswer>>({});
  const [mathAnswers, setMathAnswers] = useState<Record<string, string>>({});
  const [completedTime, setCompletedTime] = useState<number | undefined>(undefined);
  const startTimeRef = useRef<number | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (phase !== "reading") return;

    startTimeRef.current = Date.now();

    const intervalId = window.setInterval(() => {
      setTimeRemaining((previous) => {
        if (previous <= 1) {
          window.clearInterval(intervalId);
          onPassageExpired();
          setPhase("math");
          return 0;
        }
        return previous - 1;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [phase, onPassageExpired]);

  useEffect(() => {
    if (phase === "reading" || phase === "math" || phase === "evaluation") {
      requestAnimationFrame(() => {
        contentRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }
  }, [phase]);

  const answerEntries = useMemo(() => Object.values(answers), [answers]);
  const answeredCount = answerEntries.length;
  const answeredMathCount = Object.keys(mathAnswers).length;
  const allMathAnswered = answeredMathCount === mathQuestions.length;

  const mathReview = useMemo(
    () =>
      mathQuestions.map((question) => ({
        answer: mathAnswers[question.id] ?? "",
        isCorrect: mathAnswers[question.id] === question.correctAnswer,
        question,
      })),
    [mathAnswers, mathQuestions]
  );

  const handleAnswerNow = () => {
    onPassageExpired();
    setPhase("math");
  };

  const handleAnswer = (questionId: string, answer: string, correctAnswer: string) => {
    setAnswers((current) => ({
      ...current,
      [questionId]: { questionId, answer, isCorrect: answer === correctAnswer },
    }));
  };

  const handleMathAnswer = (questionId: string, answer: string) => {
    setMathAnswers((previous) => ({ ...previous, [questionId]: answer }));
  };

  const handleSubmit = () => {
    const startedAt = startTimeRef.current ?? Date.now();
    setCompletedTime(Math.floor((Date.now() - startedAt) / 1000));
    setPhase("results");
  };

  const handleResetAnswers = () => setAnswers({});

  if (phase === "results") {
    return (
      <TopicLayout
        title="Passage Recall"
        description="Memorize a randomized aviation passage, then answer recall questions after it disappears."
        showBackLink={false}
      >
        <ResultsScreen
          totalCount={questions.length + mathQuestions.length}
          answers={[
            ...answerEntries,
            ...mathReview.map((m) => ({ questionId: m.question.id, answer: m.answer, isCorrect: m.isCorrect })),
          ]}
          timeTaken={completedTime}
          onRestart={onRestart}
          restartLabel="Back to Mode Selection"
          showBackButton={false}
        >
          <div className="mb-6 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-white/10 dark:bg-black/40">
            <h3 className="mb-4 text-xl font-bold text-zinc-900 dark:text-zinc-100">
              Math Distraction Review
            </h3>
            <div className="grid gap-3 md:grid-cols-3">
              {mathReview.map(({ question, answer, isCorrect }) => (
                <div
                  key={question.id}
                  className={`rounded-xl border p-4 ${
                    isCorrect
                      ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/30"
                      : "border-rose-200 bg-rose-50 dark:border-rose-900/60 dark:bg-rose-950/30"
                  }`}
                >
                  <p className="font-bold text-zinc-900 dark:text-zinc-100">{question.prompt}</p>
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    Your answer: <span className="font-bold">{answer || "---"}</span>
                  </p>
                  {!isCorrect && (
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      Correct: <span className="font-bold">{question.correctAnswer}</span>
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-white/10 dark:bg-black/40">
            <h3 className="mb-4 text-xl font-bold text-zinc-900 dark:text-zinc-100">
              Recall Review
            </h3>
            <div className="space-y-3">
              {questions.map((question, index) => {
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
      </TopicLayout>
    );
  }

  const phaseLabel =
    phase === "reading" ? "READING PHASE" : phase === "math" ? "DISTRACTION PHASE" : "RECALL PHASE";

  const phaseTitle =
    phase === "reading"
      ? "Memorize the Passage"
      : phase === "math"
        ? "Solve the Math Questions"
        : "Recall the Passage";

  const phaseDescription =
    phase === "reading"
      ? "Study the aviation passage carefully before the timer wipes it. You can also proceed early when ready."
      : phase === "math"
        ? "Answer all 3 questions to distract working memory before the passage recall begins."
        : "Choose the detail you remember for each question. The passage has been cleared from state.";

  const statusLabel =
    phase === "reading" ? "Time Remaining" : phase === "math" ? "Progress" : "Answered";

  const statusValue =
    phase === "reading"
      ? formatTime(timeRemaining)
      : phase === "math"
        ? `${answeredMathCount}/3`
        : `${answeredCount}/${questions.length}`;

  return (
    <TopicLayout
      title="Passage Recall"
      description="Memorize a randomized aviation passage, then answer recall questions after it disappears."
      fullWidth
      showBackLink={false}
    >
      <div ref={contentRef} className="mx-auto flex h-[calc(100dvh-10rem)] max-w-6xl flex-col px-4">
        <div className="mb-3 shrink-0 rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-black/40">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="mb-2 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                {phaseLabel}
              </p>
              <h2 className="text-2xl font-bold font-[family-name:var(--font-space-grotesk)] text-zinc-900 dark:text-zinc-100">
                {phaseTitle}
              </h2>
              <p className="mt-2 text-sm font-[family-name:var(--font-inter)] text-zinc-600 dark:text-zinc-400">
                {phaseDescription}
              </p>
            </div>

            <div className="flex flex-col items-start gap-3 md:items-end">
              <button
                onClick={onRestart}
                className="rounded-xl border-2 border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-white/10 dark:text-zinc-200 dark:hover:bg-white/5"
              >
                Back to Mode Selection
              </button>
              <div className="rounded-2xl bg-zinc-100 px-5 py-4 text-center dark:bg-white/5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                  {statusLabel}
                </p>
                <p className="mt-1 text-3xl font-bold font-[family-name:var(--font-space-grotesk)] text-brand-purple dark:text-brand-gold">
                  {statusValue}
                </p>
              </div>
            </div>
          </div>
        </div>

        {phase === "math" ? (
          <div className="min-h-0 flex-1 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-black/40">
            <div className="mx-auto grid max-w-4xl gap-4 md:grid-cols-3">
              {mathQuestions.map((question) => (
                <MathQuestionCard
                  key={question.id}
                  question={question}
                  selectedAnswer={mathAnswers[question.id]}
                  onAnswer={(answer) => handleMathAnswer(question.id, answer)}
                />
              ))}
            </div>
          </div>
        ) : phase === "reading" ? (
          <div className="min-h-0 flex-1 overflow-y-auto rounded-3xl border border-zinc-200 bg-white px-8 py-8 shadow-sm dark:border-white/10 dark:bg-black/40">
            <p className="whitespace-pre-line text-lg leading-9 text-zinc-800 dark:text-zinc-100">
              {quizData.passage}
            </p>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-black/40">
            <div className="space-y-4">
              {questions.map((question, index) => (
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
          </div>
        )}

        <div className="mt-3 flex shrink-0 flex-col gap-3 sm:flex-row sm:justify-center">
          {phase === "reading" ? (
            <button
              onClick={handleAnswerNow}
              className="rounded-xl border-2 border-zinc-300 px-6 py-3 font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-white/10 dark:text-zinc-200 dark:hover:bg-white/5"
            >
              Continue to Math Questions
            </button>
          ) : phase === "math" ? (
            <button
              onClick={() => setPhase("evaluation")}
              disabled={!allMathAnswered}
              className="rounded-xl bg-brand-purple px-6 py-3 font-bold text-white shadow-lg shadow-brand-purple/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Continue to Memory Recall
            </button>
          ) : (
            <>
              <button
                onClick={handleResetAnswers}
                className="rounded-xl border-2 border-zinc-300 px-6 py-3 font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-white/10 dark:text-zinc-200 dark:hover:bg-white/5"
              >
                Clear Answers
              </button>
              <button
                onClick={handleSubmit}
                className="rounded-xl bg-brand-purple px-6 py-3 font-bold text-white shadow-lg shadow-brand-purple/20 transition hover:opacity-90"
              >
                Finish Quiz
              </button>
            </>
          )}
        </div>
      </div>
    </TopicLayout>
  );
}
