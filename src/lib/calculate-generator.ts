import type { CalculationOperator, CalculationQuestion } from "@/types";

function generateId(): string {
  return `calc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomThreeDigit(): number {
  return randomInRange(100, 999);
}

function countDigits(value: number): number {
  return Math.abs(value).toString().length;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function generateEasyExpression() {
  const operationCount = 2;
  const easyOperators: CalculationOperator[] = ["+", "-", "×"];

  let currentValue = randomInRange(10, 99);
  let expression = String(currentValue);

  for (let i = 0; i < operationCount; i += 1) {
    const operator =
      easyOperators[randomInRange(0, easyOperators.length - 1)];
    let operand = 0;

    if (operator === "+") {
      operand = randomInRange(10, 99);
      currentValue += operand;
    } else if (operator === "-") {
      // Keep easy-mode results non-negative.
      operand = randomInRange(10, Math.min(99, currentValue));
      currentValue -= operand;
    } else {
      // Light multiplication only (single digit) to keep easy manageable.
      operand = randomInRange(2, 9);
      currentValue *= operand;
    }

    expression = `(${expression} ${operator} ${operand})`;
  }

  return {
    expression,
    correctAnswer: currentValue,
    explanation: `${expression} = ${currentValue}`,
  };
}

function generateMediumExpression() {
  const operationCount = 3;
  const mediumOperators: CalculationOperator[] = ["+", "-", "×", "÷"];

  let currentValue = randomInRange(20, 150);
  let expression = String(currentValue);

  for (let i = 0; i < operationCount; i += 1) {
    let operator =
      mediumOperators[randomInRange(0, mediumOperators.length - 1)];
    let operand = 0;

    if (operator === "+") {
      operand = randomInRange(20, 199);
      currentValue += operand;
    } else if (operator === "-") {
      if (currentValue < 20) {
        operator = "+";
        operand = randomInRange(20, 199);
        currentValue += operand;
      } else {
        operand = randomInRange(20, Math.min(199, currentValue));
        currentValue -= operand;
      }
    } else if (operator === "×") {
      operand = randomInRange(2, 12);
      const nextValue = currentValue * operand;
      if (Math.abs(nextValue) > 2_000_000) {
        operator = "+";
        operand = randomInRange(20, 199);
        currentValue += operand;
      } else {
        currentValue = nextValue;
      }
    } else {
      const divisors: number[] = [];
      const absCurrent = Math.abs(currentValue);

      for (let d = 2; d <= 20; d += 1) {
        if (absCurrent !== 0 && absCurrent % d === 0) {
          divisors.push(d);
        }
      }

      if (divisors.length === 0) {
        operator = "+";
        operand = randomInRange(20, 199);
        currentValue += operand;
      } else {
        operand = divisors[randomInRange(0, divisors.length - 1)];
        currentValue /= operand;
      }
    }

    expression = `(${expression} ${operator} ${operand})`;
  }

  return {
    expression,
    correctAnswer: currentValue,
    explanation: `${expression} = ${currentValue}`,
  };
}

function generateHardExpression() {
  const operationCount = randomInRange(4, 6);
  const hardOperators: CalculationOperator[] = ["+", "-", "×", "÷"];

  let currentValue = randomThreeDigit();
  let expression = String(currentValue);

  for (let i = 0; i < operationCount; i += 1) {
    let operator =
      hardOperators[randomInRange(0, hardOperators.length - 1)];
    let operand = 0;

    if (operator === "+") {
      operand = randomThreeDigit();
      currentValue += operand;
    } else if (operator === "-") {
      // Keep results mostly non-negative while preserving 3-digit subtraction operands.
      if (currentValue < 100) {
        operator = "+";
        operand = randomThreeDigit();
        currentValue += operand;
      } else {
        operand = randomInRange(100, Math.min(999, currentValue));
        currentValue -= operand;
      }
    } else if (operator === "×") {
      // Multiplication rule: the two multiplicands must have combined digits <= 4.
      // Example valid pairs: 12×34, 123×4, 9×999.
      const leftDigits = countDigits(currentValue);
      const maxRightDigits = 4 - leftDigits;

      if (maxRightDigits < 1) {
        // Cannot satisfy multiplication digit rule with current left operand.
        operator = "-";
        if (currentValue < 100) {
          operator = "+";
          operand = randomThreeDigit();
          currentValue += operand;
        } else {
          operand = randomInRange(100, Math.min(999, currentValue));
          currentValue -= operand;
        }
      } else {
        const rightMin = maxRightDigits === 1 ? 1 : 10;
        const rightMax = maxRightDigits === 1 ? 9 : 99;
        operand = randomInRange(rightMin, rightMax);
        const nextValue = currentValue * operand;

        // Avoid exploding values in very long hard-mode chains.
        if (Math.abs(nextValue) > 100_000_000) {
          operator = "+";
          operand = randomThreeDigit();
          currentValue += operand;
        } else {
          currentValue = nextValue;
        }
      }
    } else {
      const divisors: number[] = [];
      const absCurrent = Math.abs(currentValue);

      for (let d = 10; d <= 99; d += 1) {
        if (d !== 0 && absCurrent !== 0 && absCurrent % d === 0) {
          divisors.push(d);
        }
      }

      if (divisors.length === 0) {
        // Fall back while still respecting the requested operand range rules.
        operator = "+";
        operand = randomThreeDigit();
        currentValue += operand;
      } else {
        operand = divisors[randomInRange(0, divisors.length - 1)];
        currentValue /= operand;
      }
    }

    expression = `(${expression} ${operator} ${operand})`;
  }

  return {
    expression,
    correctAnswer: currentValue,
    explanation: `${expression} = ${currentValue}`,
  };
}

function generateExpression(difficulty: "easy" | "medium" | "hard") {
  if (difficulty === "easy") {
    return generateEasyExpression();
  }

  if (difficulty === "medium") {
    return generateMediumExpression();
  }

  if (difficulty === "hard") {
    return generateHardExpression();
  }

  return generateHardExpression();
}

function generateDistractors(correctAnswer: number): string[] {
  const distractors = new Set<number>();

  const baseOffset = Math.max(1, Math.floor(Math.abs(correctAnswer) * 0.1));
  distractors.add(correctAnswer + baseOffset);
  distractors.add(correctAnswer - baseOffset);
  distractors.add(correctAnswer + 1);
  distractors.add(correctAnswer - 1);
  distractors.add(correctAnswer + randomInRange(2, 9));
  distractors.add(correctAnswer - randomInRange(2, 9));

  const uniqueDistractors = Array.from(distractors).filter(
    (n) => n !== correctAnswer && n >= 0,
  );

  while (uniqueDistractors.length < 3) {
    uniqueDistractors.push(Math.max(0, correctAnswer + randomInRange(-12, 12)));
  }

  return uniqueDistractors.slice(0, 3).map(String);
}

function generateQuestion(
  difficulty: "easy" | "medium" | "hard",
): CalculationQuestion {
  const { expression, correctAnswer, explanation } = generateExpression(difficulty);
  const options = shuffleArray([
    String(correctAnswer),
    ...generateDistractors(correctAnswer),
  ]);

  return {
    id: generateId(),
    prompt: "Solve this calculation",
    expression,
    options,
    correctAnswer,
    difficulty,
    explanation,
  };
}

export function generateCalculationQuiz(
  count: number,
  difficulty: "easy" | "medium" | "hard" | "mixed",
): CalculationQuestion[] {
  return Array.from({ length: count }, () => {
    const resolvedDifficulty =
      difficulty === "mixed"
        ? (["easy", "medium", "hard"] as const)[randomInRange(0, 2)]
        : difficulty;

    return generateQuestion(resolvedDifficulty);
  });
}
