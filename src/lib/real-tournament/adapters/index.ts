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
          expression: [
            `Start ${question.initialHeading}°`,
            ...question.sequence.map(
              (instruction) => `${instruction.angle}° ${instruction.dir}`,
            ),
            `Target ${question.targetHeading}°`,
          ].join(" → "),
        },
      };
    },
  );
}

function toPassageRecallRound(count: number) {
  const quiz = generatePassageRecallQuiz({
    mode: "real",
    readingDurationSeconds: 120,
  });

  return {
    briefingText: quiz.passage,
    questions: quiz.questions.slice(0, count).map((question) => ({
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
    category: "logical",
    timeLimitSeconds: 5 * 60,
    generate: toNumberSeries,
  },
  {
    topic: "calculate",
    title: "Calculate",
    category: "approximation",
    timeLimitSeconds: 5 * 60,
    generate: toCalculation,
  },
  {
    topic: "approximation",
    title: "Approximation",
    category: "approximation",
    timeLimitSeconds: 5 * 60,
    generate: toApproximation,
  },
  {
    topic: "missing-operator",
    title: "Missing Operator",
    category: "approximation",
    timeLimitSeconds: 5 * 60,
    generate: toMissingOperator,
  },
  {
    topic: "string-comparison",
    title: "String Comparison",
    category: "scanning",
    timeLimitSeconds: 4 * 60,
    generate: toStringComparison,
  },
  {
    topic: "string-sprint",
    title: "String Sprint",
    category: "scanning",
    timeLimitSeconds: 3 * 60,
    generate: toStringSprint,
  },
  {
    topic: "aircraft-rotation",
    title: "Aircraft Rotation",
    category: "spatial",
    timeLimitSeconds: 5 * 60,
    generate: toAircraftRotation,
  },
  {
    topic: "passage-recall",
    title: "Passage Recall",
    category: "short-term-memory",
    timeLimitSeconds: 5 * 60,
    generate: () => [],
    generateRound: toPassageRecallRound,
  },
];
