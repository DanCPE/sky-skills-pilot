"use client";

import SharedQuizCompleteConfirmation from "@/components/shared/QuizCompleteConfirmation";

interface QuizCompleteConfirmationProps {
  totalQuestions: number;
  answeredCount: number;
  onBackToQuestions: () => void;
  onFinishQuiz: () => void;
}

export default function QuizCompleteConfirmation({
  totalQuestions,
  answeredCount,
  onBackToQuestions,
  onFinishQuiz,
}: QuizCompleteConfirmationProps) {
  return (
    <SharedQuizCompleteConfirmation
      totalQuestions={totalQuestions}
      answeredCount={answeredCount}
      remainingCount={totalQuestions - answeredCount}
      onBackToQuestions={onBackToQuestions}
      onFinishQuiz={onFinishQuiz}
    />
  );
}
