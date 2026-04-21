import type {
  ShortTermMemoryCell,
  ShortTermMemoryContentType,
  ShortTermMemoryOption,
  ShortTermMemoryQuizResponse,
} from "@/types";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const NUMBERS = "0123456789";
const SYMBOL_ASSETS = [
  {
    value: "shocked",
    label: "Shocked Face",
    imageSrc: "/images/short-term-table/shocked_982950.png",
  },
  {
    value: "smartphone",
    label: "Smartphone",
    imageSrc: "/images/short-term-table/smartphone_946132.png",
  },
  {
    value: "recycle",
    label: "Recycle",
    imageSrc: "/images/short-term-table/recycle_9306518.png",
  },
  {
    value: "globe",
    label: "Globe",
    imageSrc: "/images/short-term-table/globe_1042134.png",
  },
  {
    value: "jerrycan",
    label: "Jerrycan",
    imageSrc: "/images/short-term-table/jerrycan_3438368.png",
  },
  {
    value: "certificate",
    label: "Certificate",
    imageSrc: "/images/short-term-table/guarantee-certificate_2602853.png",
  },
  {
    value: "train",
    label: "Train",
    imageSrc: "/images/short-term-table/train_1255788.png",
  },
  {
    value: "shop",
    label: "Online Shop",
    imageSrc: "/images/short-term-table/online-shop_1078755.png",
  },
  {
    value: "programming",
    label: "Programming",
    imageSrc: "/images/short-term-table/programing_983816.png",
  },
  {
    value: "idea",
    label: "Idea",
    imageSrc: "/images/short-term-table/idea_929246.png",
  },
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
  const types: ShortTermMemoryContentType[] = ["alphabet", "number", "symbol"];
  return types[randomInt(types.length)];
}

function generateTextValue(pool: string, length: number) {
  return Array.from({ length }, () => pool[randomInt(pool.length)]).join("");
}

function generateTextDistractors(correctValue: string, pool: string, count: number) {
  const distractors = new Set<string>();

  while (distractors.size < count) {
    const candidate = generateTextValue(pool, correctValue.length);
    if (candidate !== correctValue) {
      distractors.add(candidate);
    }
  }

  return [...distractors];
}

function buildTextCell(
  prefix: string,
  rowIndex: number,
  columnIndex: number,
  pool: string,
  charactersPerCell: number,
  includeOptions: boolean
): ShortTermMemoryCell {
  const value = generateTextValue(pool, charactersPerCell);
  const id = `${prefix}-${rowIndex}-${columnIndex}`;

  let options: ShortTermMemoryOption[] | undefined;
  if (includeOptions) {
    const distractors = generateTextDistractors(value, pool, 3);
    options = shuffle([value, ...distractors]).map((optionValue, optionIndex) => ({
      id: `${id}-option-${optionIndex}`,
      value: optionValue,
      label: optionValue,
    }));
  }

  return {
    id,
    value,
    label: value,
    contentType: prefix === "alpha" ? "alphabet" : "number",
    options,
  };
}

function buildSymbolCell(
  prefix: string,
  rowIndex: number,
  columnIndex: number,
  includeOptions: boolean
): ShortTermMemoryCell {
  const correctAsset = SYMBOL_ASSETS[randomInt(SYMBOL_ASSETS.length)];
  const id = `${prefix}-${rowIndex}-${columnIndex}`;

  let options: ShortTermMemoryOption[] | undefined;
  if (includeOptions) {
    const distractors = shuffle(
      SYMBOL_ASSETS.filter((asset) => asset.value !== correctAsset.value)
    ).slice(0, 3);

    options = shuffle([correctAsset, ...distractors]).map((asset, optionIndex) => ({
      id: `${id}-option-${optionIndex}`,
      value: asset.value,
      label: asset.label,
      imageSrc: asset.imageSrc,
    }));
  }

  return {
    id,
    value: correctAsset.value,
    label: correctAsset.label,
    contentType: "symbol",
    imageSrc: correctAsset.imageSrc,
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
  const includeOptions = mode === "real";

  const grid = Array.from({ length: rows }, (_, rowIndex) =>
    Array.from({ length: columns }, (_, columnIndex) => {
      const cellContentType =
        resolvedContentType === "mixed" ? pickContentType() : resolvedContentType;

      if (cellContentType === "alphabet") {
        return buildTextCell(
          "alpha",
          rowIndex,
          columnIndex,
          LETTERS,
          charactersPerCell,
          includeOptions
        );
      }

      if (cellContentType === "number") {
        return buildTextCell(
          "number",
          rowIndex,
          columnIndex,
          NUMBERS,
          charactersPerCell,
          includeOptions
        );
      }

      return buildSymbolCell("symbol", rowIndex, columnIndex, includeOptions);
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
