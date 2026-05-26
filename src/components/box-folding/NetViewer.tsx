"use client";

import type {
  BoxFoldingFaceName,
  BoxFoldingFaceOrientation,
} from "@/types";

export default function NetViewer({
  pattern,
  images,
  compact = false,
  large = false,
}: {
  pattern: number[][];
  images: Record<number, string>;
  faceAssignments?: Record<number, BoxFoldingFaceName>;
  faceOrientations?: Record<number, BoxFoldingFaceOrientation>;
  compact?: boolean;
  large?: boolean;
}) {
  const cellClass = large ? "h-[4.25rem] w-[4.25rem]" : compact ? "h-10 w-10" : "h-10 w-10 sm:h-12 sm:w-12";
  const imageClass = large ? "h-[82%] w-[82%]" : "h-[68%] w-[68%]";
  const filledCells = pattern.flatMap((row, rowIndex) =>
    row.map((faceIndex, colIndex) => ({ faceIndex, rowIndex, colIndex })),
  ).filter((cell) => cell.faceIndex !== 0);
  const rowMin = Math.min(...filledCells.map((cell) => cell.rowIndex));
  const rowMax = Math.max(...filledCells.map((cell) => cell.rowIndex));
  const colMin = Math.min(...filledCells.map((cell) => cell.colIndex));
  const colMax = Math.max(...filledCells.map((cell) => cell.colIndex));
  const visiblePattern = pattern
    .slice(rowMin, rowMax + 1)
    .map((row) => row.slice(colMin, colMax + 1));

  return (
    <div className="flex h-full w-full items-center justify-center overflow-hidden py-1">
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${visiblePattern[0]?.length ?? 0}, minmax(0, auto))` }}
      >
        {visiblePattern.flatMap((row, rowIndex) =>
          row.map((faceIndex, colIndex) => {
            if (faceIndex === 0) {
              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={cellClass}
                  aria-hidden="true"
                />
              );
            }

            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`${cellClass} relative flex items-center justify-center border-2 border-zinc-300 bg-white shadow-sm dark:border-zinc-500 dark:bg-white`}
              >
                <img
                  src={images[faceIndex]}
                  alt=""
                  className={`${imageClass} object-contain`}
                  draggable={false}
                />
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}
