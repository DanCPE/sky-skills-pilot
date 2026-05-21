import SharedQuizCompleteConfirmation from "@/components/shared/QuizCompleteConfirmation";

interface QuizCompleteConfirmationProps {
  totalQuestions: number;
  answeredCount: number;
  skippedCount: number;
  onBackToQuestions: () => void;
  onFinishQuiz: () => void;
}

export default function QuizCompleteConfirmation({
  totalQuestions,
  answeredCount,
  skippedCount,
  onBackToQuestions,
  onFinishQuiz,
}: QuizCompleteConfirmationProps) {
  return (
    <SharedQuizCompleteConfirmation
      totalQuestions={totalQuestions}
      answeredCount={answeredCount}
      remainingCount={skippedCount}
      remainingLabel="skipped"
      onBackToQuestions={onBackToQuestions}
      onFinishQuiz={onFinishQuiz}
    />
  );
}
