import { generateApproximationQuiz } from "@/lib/approximation-generator";
import { generateSpatialOrientationQuiz } from "@/lib/aircraft-rotation-generator";
import { generateCalculationQuiz } from "@/lib/calculate-generator";
import { generateMissingOperatorQuiz } from "@/lib/missing-operator-generator";
import { generateQuiz as generateNumberSeriesQuiz } from "@/lib/number-series-generator";
import { generatePassageRecallQuiz } from "@/lib/passage-recall-generator";
import { generateQuiz as generateStringComparisonQuiz } from "@/lib/string-comparison-generator";
import { generateQuiz as generateStringSprintQuiz } from "@/lib/string-sprint-generator";
import type {
  TournamentDifficulty,
  TournamentQuestionAdapter,
  TournamentQuestionInternal,
} from "../types";

function toNumberSeries(
  difficulty: TournamentDifficulty,
  count: number,
): TournamentQuestionInternal[] {
  return generateNumberSeriesQuiz(count, difficulty).map((question) => ({
    id: `rt_${question.id}`,
    sourceTopic: "number-series",
    sourceTitle: "Number Series",
    prompt: question.prompt,
    kind: "multiple-choice",
    difficulty: question.difficulty,
    options: question.options,
    correctAnswer: String(question.correctAnswer),
    explanation: question.explanation,
    detail: {
      sequence: question.sequence,
      nextNumberAfterAnswer: question.nextNumberAfterAnswer,
    },
  }));
}

function toCalculation(
  difficulty: TournamentDifficulty,
  count: number,
): TournamentQuestionInternal[] {
  return generateCalculationQuiz(count, difficulty).map((question) => ({
    id: `rt_${question.id}`,
    sourceTopic: "calculate",
    sourceTitle: "Calculate",
    prompt: question.prompt,
    kind: "multiple-choice",
    difficulty: question.difficulty,
    options: question.options,
    correctAnswer: String(question.correctAnswer),
    explanation: question.explanation,
    detail: {
      expression: question.expression,
    },
  }));
}

function toApproximation(
  difficulty: TournamentDifficulty,
  count: number,
): TournamentQuestionInternal[] {
  return generateApproximationQuiz(count, difficulty).map((question) => ({
    id: `rt_${question.id}`,
    sourceTopic: "approximation",
    sourceTitle: "Approximation",
    prompt: question.prompt,
    kind: "multiple-choice",
    difficulty: question.difficulty,
    options: question.options,
    correctAnswer: String(question.correctAnswer),
    explanation: question.explanation,
    detail: {
      category: question.category,
    },
  }));
}

function toMissingOperator(
  difficulty: TournamentDifficulty,
  count: number,
): TournamentQuestionInternal[] {
  return generateMissingOperatorQuiz(count, difficulty).map((question) => ({
    id: `rt_${question.id}`,
    sourceTopic: "missing-operator",
    sourceTitle: "Missing Operator",
    prompt: question.prompt,
    kind: "multiple-choice",
    difficulty: question.difficulty,
    options: question.options,
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
    detail: {
      expression: question.expression,
    },
  }));
}

function toStringComparison(
  difficulty: TournamentDifficulty,
  count: number,
): TournamentQuestionInternal[] {
  return generateStringComparisonQuiz(count, difficulty).map((question) => ({
    id: `rt_${question.id}`,
    sourceTopic: "string-comparison",
    sourceTitle: "String Comparison",
    prompt: question.prompt,
    kind: "string-difference",
    difficulty,
    options: ["0", "1", "2", "3", "4", "5"],
    correctAnswer: String(question.differenceCount),
    explanation: `${question.differenceCount} character${question.differenceCount === 1 ? "" : "s"} differ.`,
    detail: {
      stringA: question.stringA,
      stringB: question.stringB,
    },
  }));
}

function toStringSprint(
  difficulty: TournamentDifficulty,
  count: number,
): TournamentQuestionInternal[] {
  return generateStringSprintQuiz(count, difficulty).map((question) => ({
    id: `rt_${question.id}`,
    sourceTopic: "string-sprint",
    sourceTitle: "String Sprint",
    prompt: question.prompt,
    kind: "same-different",
    difficulty,
    options: ["Same", "Different"],
    correctAnswer: question.isSame ? "Same" : "Different",
    explanation: question.isSame
      ? "The two strings are identical."
      : "The two strings are different.",
    detail: {
      stringA: question.stringA,
      stringB: question.stringB,
    },
  }));
}

function toAircraftRotation(
  difficulty: TournamentDifficulty,
  count: number,
): TournamentQuestionInternal[] {
  return generateSpatialOrientationQuiz(count, "real", difficulty).questions.map(
    (question) => {
      const correctAnswer = `${question.correctAngle}${question.correctDir}`;
      return {
        id: `rt_${question.id}`,
        sourceTopic: "aircraft-rotation",
        sourceTitle: "Aircraft Rotation",
        prompt: "Find the shortest turn from the final heading to the target.",
        kind: "multiple-choice",
        difficulty,
        options: question.options.map((option) =>
          option.dir === null ? "NO ANSWER" : `${option.angle}${option.dir}`,
        ),
        correctAnswer,
        explanation: `The shortest turn is ${correctAnswer}.`,
        detail: {
          aircraftRotation: {
            initialHeading: question.initialHeading,
            sequence: question.sequence,
            targetHeading: question.targetHeading,
          },
        },
      };
    },
  );
}

function toPassageRecallRound({
  questionCount,
  passageReadingSeconds,
}: {
  questionCount: number;
  passageReadingSeconds: number;
}) {
  const quiz = generatePassageRecallQuiz({
    mode: "real",
    readingDurationSeconds: passageReadingSeconds,
  });

  return {
    briefingText: quiz.passage,
    readingDurationSeconds: quiz.readingDurationSeconds,
    questions: quiz.questions.slice(0, questionCount).map((question) => ({
      id: `rt_${question.id}`,
      sourceTopic: "passage-recall",
      sourceTitle: "Passage Recall",
      prompt: question.prompt,
      kind: "multiple-choice" as const,
      difficulty: "medium" as const,
      options: question.options,
      correctAnswer: question.correctAnswer,
      explanation: `Correct answer: ${question.correctAnswer}`,
    })),
  };
}

export const tournamentAdapters: TournamentQuestionAdapter[] = [
  {
    topic: "number-series",
    title: "Number Series",
    secondsPerQuestion: 8,
    generate: toNumberSeries,
  },
  {
    topic: "calculate",
    title: "Calculate",
    secondsPerQuestion: 8,
    generate: toCalculation,
  },
  {
    topic: "approximation",
    title: "Approximation",
    secondsPerQuestion: 8,
    generate: toApproximation,
  },
  {
    topic: "missing-operator",
    title: "Missing Operator",
    secondsPerQuestion: 8,
    generate: toMissingOperator,
  },
  {
    topic: "string-comparison",
    title: "String Comparison",
    secondsPerQuestion: 8,
    generate: toStringComparison,
  },
  {
    topic: "string-sprint",
    title: "String Sprint",
    secondsPerQuestion: 5,
    generate: toStringSprint,
  },
  {
    topic: "aircraft-rotation",
    title: "Aircraft Rotation",
    secondsPerQuestion: 10,
    generate: toAircraftRotation,
  },
  {
    topic: "passage-recall",
    title: "Passage Recall",
    timeLimitSeconds: 2 * 60,
    generate: () => [],
    generateRound: toPassageRecallRound,
  },
];
