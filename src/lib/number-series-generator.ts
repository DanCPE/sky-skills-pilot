import type {
  NumberSeriesQuestion,
  NumberSeriesPatternType,
} from "@/types";

// Helper: Generate unique question ID
function generateId(): string {
  return `ns_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Helper: Generate random number in range
function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper: Generate distractors (wrong answers)
function generateDistractors(
  correctAnswer: number,
  patternType: NumberSeriesPatternType
): string[] {
  const distractors = new Set<number>();

  // Strategy 1: Numbers close to correct answer (±10%)
  const offset1 = Math.floor(correctAnswer * 0.1) || 1;
  distractors.add(correctAnswer + offset1);
  distractors.add(correctAnswer - offset1);

  // Strategy 2: Off-by-one errors
  distractors.add(correctAnswer + 1);
  distractors.add(correctAnswer - 1);

  // Strategy 3: Add more variety based on pattern
  if (patternType === "geometric" || patternType === "powers_of_two") {
    // For multiplicative patterns, add numbers that could be from similar patterns
    distractors.add(correctAnswer * 2);
    distractors.add(Math.floor(correctAnswer / 2));
  } else if (patternType === "arithmetic") {
    // For additive patterns, add numbers with different step sizes
    distractors.add(correctAnswer + offset1 * 2);
    distractors.add(correctAnswer - offset1 * 2);
  } else {
    // For complex patterns, add random nearby numbers
    distractors.add(correctAnswer + randomInRange(2, 5));
    distractors.add(correctAnswer - randomInRange(2, 5));
  }

  // Convert to array, ensure we have exactly 4 unique distractors
  const uniqueDistractors = Array.from(distractors)
    .filter((n) => n !== correctAnswer && n > 0) // Remove correct answer and negatives
    .slice(0, 4);

  // Fill with more random numbers if needed
  while (uniqueDistractors.length < 4) {
    const randomOffset = randomInRange(2, 10);
    const newDistractor =
      correctAnswer + (Math.random() > 0.5 ? randomOffset : -randomOffset);
    if (newDistractor > 0 && newDistractor !== correctAnswer) {
      uniqueDistractors.push(newDistractor);
    }
  }

  return uniqueDistractors.slice(0, 4).map(String);
}

// Helper: Shuffle array
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Helper: Generate explanation
function generateExplanation(
  patternType: NumberSeriesPatternType,
  sequence: number[],
  correctAnswer: number
): string {
  switch (patternType) {
    case "arithmetic": {
      const diff = sequence[1] - sequence[0];
      return `This is an arithmetic sequence where each number increases by ${diff}: ${sequence.join(
        " + "
      )} → ${sequence.map((n) => `${n}`).join(", ")}, so ${sequence[sequence.length - 1]} + ${diff} = ${correctAnswer}.`;
    }
    case "geometric": {
      const ratio = sequence[1] / sequence[0];
      return `This is a geometric sequence where each number is multiplied by ${ratio}: ${sequence.join(
        " × "
      )} → ${sequence.map((n) => `${n}`).join(", ")}, so ${sequence[sequence.length - 1]} × ${ratio} = ${correctAnswer}.`;
    }
    case "fibonacci": {
      return `This is a Fibonacci-style sequence where each number is the sum of the previous two: ${sequence.join(", ")}, so ${sequence[sequence.length - 2]} + ${sequence[sequence.length - 1]} = ${correctAnswer}.`;
    }
    case "square": {
      return `This sequence consists of square numbers: ${sequence.map((n) => `√${n} = ${Math.sqrt(n)}`).join(", ")}, so the next square is ${Math.sqrt(sequence[sequence.length - 1]) + 1}² = ${correctAnswer}.`;
    }
    case "cube": {
      return `This sequence consists of cube numbers: ${sequence.map((n) => `∛${n} = ${Math.cbrt(n)}`).join(", ")}, so the next cube is ${Math.cbrt(sequence[sequence.length - 1]) + 1}³ = ${correctAnswer}.`;
    }
    case "powers_of_two": {
      const exponents = sequence.map((n) => Math.log2(n));
      return `This is a powers of 2 sequence: ${sequence.map((n, i) => `2^${i} = ${n}`).join(", ")}, so 2^${exponents.length} = ${correctAnswer}.`;
    }
    case "prime": {
      return `This is a sequence of prime numbers in order: ${sequence.join(", ")}, so the next prime is ${correctAnswer}.`;
    }
    case "alternating": {
      const odd = sequence.filter((_, i) => i % 2 === 0);
      const even = sequence.filter((_, i) => i % 2 === 1);
      const oddDiff = odd[1] - odd[0];
      const evenDiff = even[1] - even[0];
      return `This is an alternating sequence with two interleaved patterns: Odd positions: ${odd.join(
        ", "
      )} (increasing by ${oddDiff}), Even positions: ${even.join(", ")} (increasing by ${evenDiff}). The next number follows the odd pattern: ${odd[odd.length - 1]} + ${oddDiff} = ${correctAnswer}.`;
    }
    case "mixed_operation": {
      // Detect pattern: +2, ×3, +2, ×3 style
      const ops: string[] = [];
      for (let i = 1; i < sequence.length; i++) {
        const diff = sequence[i] - sequence[i - 1];
        if (sequence[i] % sequence[i - 1] === 0 && diff > sequence[i - 1]) {
          ops.push(`×${sequence[i] / sequence[i - 1]}`);
        } else {
          ops.push(diff >= 0 ? `+${diff}` : `${diff}`);
        }
      }
      return `This sequence follows a mixed operation pattern: ${ops.join(", ")}. ${sequence[0]} ${ops[0]} = ${sequence[1]}, ${sequence[1]} ${ops[1]} = ${sequence[2]}, etc. Continuing: ${sequence[sequence.length - 1]} ${ops[sequence.length % ops.length]} = ${correctAnswer}.`;
    }
    default:
      return `Find the pattern in the sequence: ${sequence.join(", ")}. The next number is ${correctAnswer}.`;
  }
}

// Pattern Generators

function generateArithmetic(
  difficulty: "easy" | "medium" | "hard"
): NumberSeriesQuestion {
  let start: number;
  let diff: number;
  let length: number;

  if (difficulty === "easy") {
    start = randomInRange(1, 20);
    diff = randomInRange(2, 10);
    length = 4;
  } else if (difficulty === "medium") {
    start = randomInRange(1, 50);
    diff = randomInRange(3, 15);
    length = 5;
  } else {
    start = randomInRange(10, 100);
    diff = randomInRange(5, 25);
    length = 6;
  }

  const sequence: number[] = [];
  for (let i = 0; i < length; i++) {
    sequence.push(start + diff * i);
  }

  const correctAnswer = sequence[sequence.length - 1] + diff;
  const distractors = generateDistractors(correctAnswer, "arithmetic");
  const options = shuffleArray([String(correctAnswer), ...distractors]);

  return {
    id: generateId(),
    prompt: "What number comes next in the series?",
    options,
    patternType: "arithmetic",
    sequence,
    correctAnswer,
    difficulty,
    explanation: generateExplanation("arithmetic", sequence, correctAnswer),
  };
}

function generateGeometric(
  difficulty: "easy" | "medium" | "hard"
): NumberSeriesQuestion {
  let start: number;
  let ratio: number;
  let length: number;

  if (difficulty === "easy") {
    start = randomInRange(2, 5);
    ratio = randomInRange(2, 3);
    length = 4;
  } else if (difficulty === "medium") {
    start = randomInRange(2, 8);
    ratio = randomInRange(2, 4);
    length = 5;
  } else {
    start = randomInRange(3, 10);
    ratio = randomInRange(2, 5);
    length = 6;
  }

  const sequence: number[] = [];
  for (let i = 0; i < length; i++) {
    sequence.push(start * Math.pow(ratio, i));
  }

  const correctAnswer = sequence[sequence.length - 1] * ratio;
  const distractors = generateDistractors(correctAnswer, "geometric");
  const options = shuffleArray([String(correctAnswer), ...distractors]);

  return {
    id: generateId(),
    prompt: "What number comes next in the series?",
    options,
    patternType: "geometric",
    sequence,
    correctAnswer,
    difficulty,
    explanation: generateExplanation("geometric", sequence, correctAnswer),
  };
}

function generateFibonacci(
  difficulty: "easy" | "medium" | "hard"
): NumberSeriesQuestion {
  let start1: number;
  let start2: number;
  let length: number;

  if (difficulty === "easy") {
    start1 = randomInRange(1, 3);
    start2 = randomInRange(1, 3);
    length = 4;
  } else if (difficulty === "medium") {
    start1 = randomInRange(1, 5);
    start2 = randomInRange(1, 5);
    length = 5;
  } else {
    start1 = randomInRange(2, 8);
    start2 = randomInRange(2, 8);
    length = 6;
  }

  const sequence: number[] = [start1, start2];
  for (let i = 2; i < length; i++) {
    sequence.push(sequence[i - 1] + sequence[i - 2]);
  }

  const correctAnswer = sequence[length - 1] + sequence[length - 2];
  const distractors = generateDistractors(correctAnswer, "fibonacci");
  const options = shuffleArray([String(correctAnswer), ...distractors]);

  return {
    id: generateId(),
    prompt: "What number comes next in the series?",
    options,
    patternType: "fibonacci",
    sequence,
    correctAnswer,
    difficulty,
    explanation: generateExplanation("fibonacci", sequence, correctAnswer),
  };
}

function generateSquare(
  difficulty: "easy" | "medium" | "hard"
): NumberSeriesQuestion {
  let start: number;
  let length: number;

  if (difficulty === "easy") {
    start = randomInRange(1, 3);
    length = 4;
  } else if (difficulty === "medium") {
    start = randomInRange(2, 5);
    length = 5;
  } else {
    start = randomInRange(3, 8);
    length = 6;
  }

  const sequence: number[] = [];
  for (let i = start; i < start + length; i++) {
    sequence.push(i * i);
  }

  const nextN = start + length;
  const correctAnswer = nextN * nextN;
  const distractors = generateDistractors(correctAnswer, "square");
  const options = shuffleArray([String(correctAnswer), ...distractors]);

  return {
    id: generateId(),
    prompt: "What number comes next in the series?",
    options,
    patternType: "square",
    sequence,
    correctAnswer,
    difficulty,
    explanation: generateExplanation("square", sequence, correctAnswer),
  };
}

function generateCube(
  difficulty: "easy" | "medium" | "hard"
): NumberSeriesQuestion {
  let start: number;
  let length: number;

  if (difficulty === "easy") {
    start = randomInRange(1, 2);
    length = 4;
  } else if (difficulty === "medium") {
    start = randomInRange(2, 3);
    length = 5;
  } else {
    start = randomInRange(2, 4);
    length = 6;
  }

  const sequence: number[] = [];
  for (let i = start; i < start + length; i++) {
    sequence.push(i * i * i);
  }

  const nextN = start + length;
  const correctAnswer = nextN * nextN * nextN;
  const distractors = generateDistractors(correctAnswer, "cube");
  const options = shuffleArray([String(correctAnswer), ...distractors]);

  return {
    id: generateId(),
    prompt: "What number comes next in the series?",
    options,
    patternType: "cube",
    sequence,
    correctAnswer,
    difficulty,
    explanation: generateExplanation("cube", sequence, correctAnswer),
  };
}

function generatePowersOfTwo(
  difficulty: "easy" | "medium" | "hard"
): NumberSeriesQuestion {
  let start: number;
  let length: number;

  if (difficulty === "easy") {
    start = randomInRange(0, 2);
    length = 4;
  } else if (difficulty === "medium") {
    start = randomInRange(1, 4);
    length = 5;
  } else {
    start = randomInRange(2, 5);
    length = 6;
  }

  const sequence: number[] = [];
  for (let i = start; i < start + length; i++) {
    sequence.push(Math.pow(2, i));
  }

  const nextExp = start + length;
  const correctAnswer = Math.pow(2, nextExp);
  const distractors = generateDistractors(correctAnswer, "powers_of_two");
  const options = shuffleArray([String(correctAnswer), ...distractors]);

  return {
    id: generateId(),
    prompt: "What number comes next in the series?",
    options,
    patternType: "powers_of_two",
    sequence,
    correctAnswer,
    difficulty,
    explanation: generateExplanation("powers_of_two", sequence, correctAnswer),
  };
}

function generatePrime(
  difficulty: "easy" | "medium" | "hard"
): NumberSeriesQuestion {
  const primes = [
    2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67,
    71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149,
    151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227,
    229, 233, 239, 241, 251, 257, 263, 269, 271, 277, 281, 283, 293, 307,
    311, 313, 317, 331, 337, 347, 349, 353, 359, 367, 373, 379, 383, 389,
    397, 401, 409, 419, 421, 431, 433, 439, 443, 449, 457, 461, 463, 467,
    479, 487, 491, 499, 503, 509, 521, 523, 541, 547, 557, 563, 569, 571,
    577, 587, 593, 599, 601, 607, 613, 617, 619, 631, 641, 643, 647, 653,
    659, 661, 673, 677, 683, 691, 701, 709, 719, 727, 733, 739, 743, 751,
    757, 761, 769, 773, 787, 797, 809, 811, 821, 823, 827, 829, 839, 853,
    857, 859, 863, 877, 881, 883, 887, 907, 911, 919, 929, 937, 941, 947,
    953, 967, 971, 977, 983, 991, 997,
  ];

  let startIndex: number;
  let length: number;

  if (difficulty === "easy") {
    startIndex = randomInRange(0, 5);
    length = 4;
  } else if (difficulty === "medium") {
    startIndex = randomInRange(5, 15);
    length = 5;
  } else {
    startIndex = randomInRange(15, 40);
    length = 6;
  }

  const sequence = primes.slice(startIndex, startIndex + length);
  const correctAnswer = primes[startIndex + length];
  const distractors = generateDistractors(correctAnswer, "prime");
  const options = shuffleArray([String(correctAnswer), ...distractors]);

  return {
    id: generateId(),
    prompt: "What number comes next in the series?",
    options,
    patternType: "prime",
    sequence,
    correctAnswer,
    difficulty,
    explanation: generateExplanation("prime", sequence, correctAnswer),
  };
}

function generateAlternating(
  difficulty: "easy" | "medium" | "hard"
): NumberSeriesQuestion {
  // Generate two interleaved arithmetic sequences
  let oddStart: number;
  let oddDiff: number;
  let evenStart: number;
  let evenDiff: number;
  let length: number;

  if (difficulty === "easy") {
    oddStart = randomInRange(1, 10);
    oddDiff = randomInRange(2, 5);
    evenStart = randomInRange(1, 10);
    evenDiff = randomInRange(2, 5);
    length = 4;
  } else if (difficulty === "medium") {
    oddStart = randomInRange(1, 20);
    oddDiff = randomInRange(3, 8);
    evenStart = randomInRange(1, 20);
    evenDiff = randomInRange(3, 8);
    length = 5;
  } else {
    oddStart = randomInRange(5, 30);
    oddDiff = randomInRange(5, 12);
    evenStart = randomInRange(5, 30);
    evenDiff = randomInRange(5, 12);
    length = 6;
  }

  const sequence: number[] = [];
  for (let i = 0; i < length; i++) {
    if (i % 2 === 0) {
      sequence.push(oddStart + (i / 2) * oddDiff);
    } else {
      sequence.push(evenStart + Math.floor(i / 2) * evenDiff);
    }
  }

  // Next number follows the odd pattern
  const correctAnswer = oddStart + Math.ceil(length / 2) * oddDiff;
  const distractors = generateDistractors(correctAnswer, "alternating");
  const options = shuffleArray([String(correctAnswer), ...distractors]);

  return {
    id: generateId(),
    prompt: "What number comes next in the series?",
    options,
    patternType: "alternating",
    sequence,
    correctAnswer,
    difficulty,
    explanation: generateExplanation("alternating", sequence, correctAnswer),
  };
}

function generateMixedOperation(
  difficulty: "easy" | "medium" | "hard"
): NumberSeriesQuestion {
  // Pattern like: +2, ×3, +2, ×3, ...
  const operations: Array<(n: number) => number> = [];

  if (difficulty === "easy") {
    const addValue = randomInRange(2, 5);
    const multValue = randomInRange(2, 3);
    operations.push((n) => n + addValue);
    operations.push((n) => n * multValue);
  } else if (difficulty === "medium") {
    const addValue = randomInRange(2, 8);
    const multValue = randomInRange(2, 4);
    operations.push((n) => n + addValue);
    operations.push((n) => n * multValue);
    operations.push((n) => n - randomInRange(1, 3));
  } else {
    const addValue = randomInRange(3, 12);
    const multValue = randomInRange(2, 5);
    operations.push((n) => n + addValue);
    operations.push((n) => n * multValue);
    operations.push((n) => n - randomInRange(2, 5));
    operations.push((n) => n + randomInRange(5, 10));
  }

  const length = difficulty === "easy" ? 4 : difficulty === "medium" ? 5 : 6;
  const start = randomInRange(1, 10);
  const sequence: number[] = [start];

  for (let i = 1; i < length; i++) {
    const opIndex = (i - 1) % operations.length;
    sequence.push(operations[opIndex](sequence[i - 1]));
  }

  const nextOpIndex = (length - 1) % operations.length;
  const correctAnswer = operations[nextOpIndex](sequence[length - 1]);
  const distractors = generateDistractors(correctAnswer, "mixed_operation");
  const options = shuffleArray([String(correctAnswer), ...distractors]);

  return {
    id: generateId(),
    prompt: "What number comes next in the series?",
    options,
    patternType: "mixed_operation",
    sequence,
    correctAnswer,
    difficulty,
    explanation: generateExplanation("mixed_operation", sequence, correctAnswer),
  };
}

// Master generator
function generateQuestion(
  patternType: NumberSeriesPatternType,
  difficulty: "easy" | "medium" | "hard"
): NumberSeriesQuestion {
  switch (patternType) {
    case "arithmetic":
      return generateArithmetic(difficulty);
    case "geometric":
      return generateGeometric(difficulty);
    case "fibonacci":
      return generateFibonacci(difficulty);
    case "square":
      return generateSquare(difficulty);
    case "cube":
      return generateCube(difficulty);
    case "powers_of_two":
      return generatePowersOfTwo(difficulty);
    case "prime":
      return generatePrime(difficulty);
    case "alternating":
      return generateAlternating(difficulty);
    case "mixed_operation":
      return generateMixedOperation(difficulty);
    default:
      return generateArithmetic(difficulty);
  }
}

// Quiz batch generator
export function generateQuiz(
  questionCount: number,
  difficulty: "easy" | "medium" | "hard" | "mixed"
): NumberSeriesQuestion[] {
  const questions: NumberSeriesQuestion[] = [];
  const patternTypes: NumberSeriesPatternType[] = [
    "arithmetic",
    "geometric",
    "fibonacci",
    "square",
    "cube",
    "powers_of_two",
    "prime",
    "alternating",
    "mixed_operation",
  ];

  for (let i = 0; i < questionCount; i++) {
    let selectedDifficulty: "easy" | "medium" | "hard";

    if (difficulty === "mixed") {
      // Distribute difficulty: 30% easy, 50% medium, 20% hard
      const rand = Math.random();
      if (rand < 0.3) {
        selectedDifficulty = "easy";
      } else if (rand < 0.8) {
        selectedDifficulty = "medium";
      } else {
        selectedDifficulty = "hard";
      }
    } else {
      selectedDifficulty = difficulty;
    }

    // Select pattern type (cycle through to ensure variety)
    const patternType = patternTypes[i % patternTypes.length];
    questions.push(generateQuestion(patternType, selectedDifficulty));
  }

  return questions;
}
