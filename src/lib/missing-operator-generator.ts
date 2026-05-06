import type { CalculationOperator, MissingOperatorQuestion } from "@/types";

const OPERATORS: CalculationOperator[] = ["+", "-", "×", "÷"];

function generateId(): string {
  return `missing_operator_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function formatOperators(operators: CalculationOperator[]): string {
  return operators.join(", ");
}

function evaluateOperation(
  left: number,
  operator: CalculationOperator,
  right: number,
): number {
  if (operator === "+") return left + right;
  if (operator === "-") return left - right;
  if (operator === "×") return left * right;
  return left / right;
}

function evaluateExpression(
  operands: number[],
  operators: CalculationOperator[],
): number {
  return operators.reduce(
    (current, operator, index) =>
      evaluateOperation(current, operator, operands[index + 1]),
    operands[0],
  );
}

function getDivisors(value: number, min: number, max: number): number[] {
  const absValue = Math.abs(value);
  const divisors: number[] = [];

  for (let divisor = min; divisor <= max; divisor += 1) {
    if (absValue !== 0 && absValue % divisor === 0) {
      divisors.push(divisor);
    }
  }

  return divisors;
}

function generateOperatorCombinations(
  length: number,
): CalculationOperator[][] {
  if (length === 1) {
    return OPERATORS.map((operator) => [operator]);
  }

  return OPERATORS.flatMap((operator) =>
    generateOperatorCombinations(length - 1).map((rest) => [
      operator,
      ...rest,
    ]),
  );
}

function buildVisibleExpression(
  operands: number[],
  targetResult: number,
  blankCount: number,
): string {
  const pieces = operands.flatMap((operand, index) =>
    index < blankCount ? [String(operand), "?"] : [String(operand)],
  );

  return `${pieces.join(" ")} = ${targetResult}`;
}

function buildExplanation(
  operands: number[],
  operators: CalculationOperator[],
  result: number,
): string {
  const expression = operands
    .flatMap((operand, index) =>
      index < operators.length
        ? [String(operand), operators[index]]
        : [String(operand)],
    )
    .join(" ");

  return `${expression} = ${result}`;
}

function generateOperandsAndOperators(difficulty: "easy" | "medium" | "hard") {
  const operationCount = difficulty === "easy" ? 1 : difficulty === "medium" ? 2 : 3;
  const minOperand = difficulty === "easy" ? 2 : difficulty === "medium" ? 5 : 10;
  const maxOperand = difficulty === "easy" ? 25 : difficulty === "medium" ? 75 : 150;
  const allowedOperators =
    difficulty === "easy" ? (["+", "-", "×"] as CalculationOperator[]) : OPERATORS;

  const operands: number[] = [randomInRange(minOperand, maxOperand)];
  const operators: CalculationOperator[] = [];
  let currentValue = operands[0];

  for (let index = 0; index < operationCount; index += 1) {
    let operator =
      allowedOperators[randomInRange(0, allowedOperators.length - 1)];
    let operand = randomInRange(minOperand, maxOperand);

    if (operator === "-") {
      operand = randomInRange(minOperand, Math.max(minOperand, currentValue));
    } else if (operator === "×") {
      const multiplierMax = difficulty === "hard" ? 12 : 9;
      operand = randomInRange(2, multiplierMax);
    } else if (operator === "÷") {
      const divisors = getDivisors(currentValue, 2, difficulty === "hard" ? 20 : 12);
      if (divisors.length === 0) {
        operator = "+";
        operand = randomInRange(minOperand, maxOperand);
      } else {
        operand = divisors[randomInRange(0, divisors.length - 1)];
      }
    }

    operators.push(operator);
    operands.push(operand);
    currentValue = evaluateOperation(currentValue, operator, operand);
  }

  return { operands, operators, result: currentValue };
}

function generateOptions(
  operands: number[],
  correctOperators: CalculationOperator[],
  result: number,
): string[] | null {
  const combinations = generateOperatorCombinations(correctOperators.length);
  const matchingCombinations = combinations.filter(
    (operators) => evaluateExpression(operands, operators) === result,
  );

  if (matchingCombinations.length !== 1) {
    return null;
  }

  const correctAnswer = formatOperators(correctOperators);
  const distractors = shuffleArray(
    combinations
      .filter((operators) => evaluateExpression(operands, operators) !== result)
      .map(formatOperators)
      .filter((answer) => answer !== correctAnswer),
  );

  return shuffleArray([correctAnswer, ...distractors.slice(0, 3)]);
}

function generateQuestion(
  difficulty: "easy" | "medium" | "hard",
): MissingOperatorQuestion {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const { operands, operators, result } = generateOperandsAndOperators(difficulty);
    const options = generateOptions(operands, operators, result);

    if (!options) {
      continue;
    }

    return {
      id: generateId(),
      prompt: "Solve this calculation",
      expression: buildVisibleExpression(operands, result, operators.length),
      options,
      correctAnswer: formatOperators(operators),
      correctOperators: operators,
      result,
      difficulty,
      explanation: buildExplanation(operands, operators, result),
    };
  }

  return generateQuestion("easy");
}

export function generateMissingOperatorQuiz(
  count: number,
  difficulty: "easy" | "medium" | "hard" | "mixed",
): MissingOperatorQuestion[] {
  return Array.from({ length: count }, () => {
    const resolvedDifficulty =
      difficulty === "mixed"
        ? (["easy", "medium", "hard"] as const)[randomInRange(0, 2)]
        : difficulty;

    return generateQuestion(resolvedDifficulty);
  });
}
