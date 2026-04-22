import type {
  ShortTermMemoryCell,
  ShortTermMemoryContentType,
  ShortTermMemoryOption,
  ShortTermMemoryQuizResponse,
} from "@/types";

const ALPHANUMERIC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
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
  const types: ShortTermMemoryContentType[] = ["alphanumeric", "symbol"];
  return types[randomInt(types.length)];
}

function generateTextValue(length: number) {
  return Array.from({ length }, () => ALPHANUMERIC[randomInt(ALPHANUMERIC.length)]).join("");
}

function generateTextDistractors(correctValue: string, count: number) {
  const distractors = new Set<string>();

  while (distractors.size < count) {
    const candidate = generateTextValue(correctValue.length);
    if (candidate !== correctValue) {
      distractors.add(candidate);
    }
  }

  return [...distractors];
}

function titleFromFilename(fileName: string) {
  return fileName
    .replace(/-svgrepo-com\.svg$/, "")
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildAlphanumericCell(
  rowIndex: number,
  columnIndex: number,
  charactersPerCell: number
): ShortTermMemoryCell {
  const value = generateTextValue(charactersPerCell);
  const id = `alphanumeric-${rowIndex}-${columnIndex}`;
  const distractors = generateTextDistractors(value, 3);

  const options: ShortTermMemoryOption[] = shuffle([value, ...distractors]).map(
    (optionValue, optionIndex) => ({
      id: `${id}-option-${optionIndex}`,
      value: optionValue,
      label: optionValue,
    })
  );

  return {
    id,
    value,
    label: value,
    contentType: "alphanumeric",
    options,
  };
}

function buildSymbolCell(rowIndex: number, columnIndex: number): ShortTermMemoryCell {
  const correctFileName = SYMBOL_ASSETS[randomInt(SYMBOL_ASSETS.length)];
  const correctValue = correctFileName.replace(/\.svg$/, "");
  const id = `symbol-${rowIndex}-${columnIndex}`;

  const distractors = shuffle(
    SYMBOL_ASSETS.filter((fileName) => fileName !== correctFileName)
  ).slice(0, 3);

  const options: ShortTermMemoryOption[] = shuffle([correctFileName, ...distractors]).map(
    (fileName, optionIndex) => ({
      id: `${id}-option-${optionIndex}`,
      value: fileName.replace(/\.svg$/, ""),
      label: titleFromFilename(fileName),
      imageSrc: `/images/short-term-table/${fileName}`,
    })
  );

  return {
    id,
    value: correctValue,
    label: titleFromFilename(correctFileName),
    contentType: "symbol",
    imageSrc: `/images/short-term-table/${correctFileName}`,
    options,
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
        return buildSymbolCell(rowIndex, columnIndex);
      }

      return buildAlphanumericCell(rowIndex, columnIndex, charactersPerCell);
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
  };
}

