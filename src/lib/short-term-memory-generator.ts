import type {
  ShortTermMemoryCell,
  ShortTermMemoryContentType,
  ShortTermMemoryMathQuestion,
  ShortTermMemoryOption,
  ShortTermMemoryQuizResponse,
} from "@/types";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const NUMBERS = "0123456789";
const SYMBOL_ASSETS = [
  "accessibility-svgrepo-com.svg",
  "activity-svgrepo-com.svg",
  "alarm-clock-svgrepo-com.svg",
  "align-bottom-svgrepo-com.svg",
  "align-right-svgrepo-com.svg",
  "anchor-svgrepo-com.svg",
  "angle-down-svgrepo-com.svg",
  "angle-left-svgrepo-com.svg",
  "angle-right-svgrepo-com.svg",
  "angle-up-svgrepo-com.svg",
  "aperture-svgrepo-com.svg",
  "archive-box-svgrepo-com.svg",
] as const;

type ConcreteContentType = Exclude<ShortTermMemoryContentType, "mixed">;

function randomInt(max: number) {
  return Math.floor(Math.random() * max);
}

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1);
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function pickContentType(): ShortTermMemoryContentType {
  const types: ConcreteContentType[] = ["alphabet", "numeric", "symbol"];
  return types[randomInt(types.length)];
}

function generateTextValue(pool: string, length: number) {
  return Array.from({ length }, () => pool[randomInt(pool.length)]).join("");
}

function titleFromFilename(fileName: string) {
  return fileName
    .replace(/-svgrepo-com\.svg$/, "")
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildAlphabetOption(id: string, length: number): ShortTermMemoryOption {
  const value = generateTextValue(LETTERS, length);

  return {
    id,
    value,
    label: value,
  };
}

function buildNumericOption(id: string, length: number): ShortTermMemoryOption {
  const value = generateTextValue(NUMBERS, length);

  return {
    id,
    value,
    label: value,
  };
}

function buildSymbolOption(id: string, excludedValue?: string): ShortTermMemoryOption {
  const availableAssets = excludedValue
    ? SYMBOL_ASSETS.filter((fileName) => fileName.replace(/\.svg$/, "") !== excludedValue)
    : SYMBOL_ASSETS;
  const fileName = availableAssets[randomInt(availableAssets.length)];
  const value = fileName.replace(/\.svg$/, "");

  return {
    id,
    value,
    label: titleFromFilename(fileName),
    imageSrc: `/images/short-term-table/${fileName}`,
  };
}

function ensureUniqueOption(
  options: ShortTermMemoryOption[],
  buildOption: (id: string) => ShortTermMemoryOption,
  id: string
) {
  let option = buildOption(id);

  while (options.some((existingOption) => existingOption.value === option.value)) {
    option = buildOption(id);
  }

  options.push(option);
}

function buildMixedOptions({
  id,
  correctOption,
  correctType,
  charactersPerCell,
}: {
  id: string;
  correctOption: ShortTermMemoryOption;
  correctType: ConcreteContentType;
  charactersPerCell: number;
}): ShortTermMemoryOption[] {
  const options: ShortTermMemoryOption[] = [correctOption];
  const sameTypeId = `${id}-option-same-type`;
  const alphabetBuilder = (optionId: string) =>
    buildAlphabetOption(optionId, charactersPerCell);
  const numericBuilder = (optionId: string) =>
    buildNumericOption(optionId, charactersPerCell);
  const symbolBuilder = (optionId: string) =>
    buildSymbolOption(optionId, correctType === "symbol" ? correctOption.value : undefined);

  ensureUniqueOption(options, alphabetBuilder, `${id}-option-alphabet`);
  ensureUniqueOption(options, numericBuilder, `${id}-option-numeric`);
  ensureUniqueOption(options, symbolBuilder, `${id}-option-symbol`);

  if (options.length < 4) {
    const sameTypeBuilder =
      correctType === "alphabet"
        ? alphabetBuilder
        : correctType === "numeric"
          ? numericBuilder
          : symbolBuilder;

    ensureUniqueOption(options, sameTypeBuilder, sameTypeId);
  }

  return shuffle(options).map((option, optionIndex) => ({
    ...option,
    id: `${id}-option-${optionIndex}`,
  }));
}

function buildAlphabetCell(
  rowIndex: number,
  columnIndex: number,
  charactersPerCell: number
): ShortTermMemoryCell {
  const id = `alphabet-${rowIndex}-${columnIndex}`;
  const correctOption = buildAlphabetOption(`${id}-correct`, charactersPerCell);

  return {
    id,
    value: correctOption.value,
    label: correctOption.label,
    contentType: "alphabet",
    options: buildMixedOptions({
      id,
      correctOption,
      correctType: "alphabet",
      charactersPerCell,
    }),
  };
}

function buildNumericCell(
  rowIndex: number,
  columnIndex: number,
  charactersPerCell: number
): ShortTermMemoryCell {
  const id = `numeric-${rowIndex}-${columnIndex}`;
  const correctOption = buildNumericOption(`${id}-correct`, charactersPerCell);

  return {
    id,
    value: correctOption.value,
    label: correctOption.label,
    contentType: "numeric",
    options: buildMixedOptions({
      id,
      correctOption,
      correctType: "numeric",
      charactersPerCell,
    }),
  };
}

function buildSymbolCell(
  rowIndex: number,
  columnIndex: number,
  charactersPerCell: number
): ShortTermMemoryCell {
  const correctFileName = SYMBOL_ASSETS[randomInt(SYMBOL_ASSETS.length)];
  const correctValue = correctFileName.replace(/\.svg$/, "");
  const id = `symbol-${rowIndex}-${columnIndex}`;
  const correctOption: ShortTermMemoryOption = {
    id: `${id}-correct`,
    value: correctValue,
    label: titleFromFilename(correctFileName),
    imageSrc: `/images/short-term-table/${correctFileName}`,
  };

  return {
    id,
    value: correctOption.value,
    label: correctOption.label,
    contentType: "symbol",
    imageSrc: correctOption.imageSrc,
    options: buildMixedOptions({
      id,
      correctOption,
      correctType: "symbol",
      charactersPerCell,
    }),
  };
}

function buildMathDistractors(correctAnswer: number) {
  const distractors = new Set<number>();

  while (distractors.size < 3) {
    const offset = randomInt(15) + 1;
    const candidate = correctAnswer + (randomInt(2) === 0 ? offset : -offset);
    if (candidate >= 0 && candidate !== correctAnswer) {
      distractors.add(candidate);
    }
  }

  return [...distractors];
}

function generateMathQuestion(index: number): ShortTermMemoryMathQuestion {
  const operators = ["+", "-", "×"] as const;
  const operator = operators[randomInt(operators.length)];
  const left = randomInt(18) + 7;
  const right = operator === "×" ? randomInt(8) + 2 : randomInt(18) + 3;
  const normalizedLeft = operator === "-" ? Math.max(left, right) : left;
  const normalizedRight = operator === "-" ? Math.min(left, right) : right;

  const correctAnswer =
    operator === "+"
      ? normalizedLeft + normalizedRight
      : operator === "-"
        ? normalizedLeft - normalizedRight
        : normalizedLeft * normalizedRight;

  return {
    id: `math-${index}-${randomInt(100000)}`,
    prompt: `${normalizedLeft} ${operator} ${normalizedRight} = ?`,
    options: shuffle([correctAnswer, ...buildMathDistractors(correctAnswer)]).map(String),
    correctAnswer: String(correctAnswer),
  };
}

export function generateShortTermMemoryQuiz({
  mode,
  rows,
  columns,
  memorizeSeconds = 120,
  charactersPerCell = 3,
  contentType,
}: {
  mode: "learn" | "real";
  rows: number;
  columns: number;
  memorizeSeconds?: number;
  charactersPerCell?: number;
  contentType?: ShortTermMemoryContentType;
}): ShortTermMemoryQuizResponse {
  const resolvedContentType = contentType ?? "mixed";

  const grid = Array.from({ length: rows }, (_, rowIndex) =>
    Array.from({ length: columns }, (_, columnIndex) => {
      const cellContentType =
        resolvedContentType === "mixed" ? pickContentType() : resolvedContentType;

      if (cellContentType === "symbol") {
        return buildSymbolCell(rowIndex, columnIndex, charactersPerCell);
      }

      if (cellContentType === "numeric") {
        return buildNumericCell(rowIndex, columnIndex, charactersPerCell);
      }

      return buildAlphabetCell(rowIndex, columnIndex, charactersPerCell);
    })
  );

  return {
    mode,
    rows,
    columns,
    memorizeSeconds,
    charactersPerCell,
    contentType: resolvedContentType,
    grid,
    mathQuestions: Array.from({ length: 3 }, (_, index) => generateMathQuestion(index)),
  };
}
