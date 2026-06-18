"use client";

import type {
  BoxFoldingFaceName,
  BoxFoldingFaceOrientation,
} from "@/types";

export default function NetViewer({
  pattern,
  images,
  imageRotations = {},
  compact = false,
  choice = false,
  large = false,
}: {
  pattern: number[][];
  images: Record<number, string>;
  imageRotations?: Record<number, number>;
  faceAssignments?: Record<number, BoxFoldingFaceName>;
  faceOrientations?: Record<number, BoxFoldingFaceOrientation>;
  compact?: boolean;
  choice?: boolean;
  large?: boolean;
}) {
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
  const rowCount = visiblePattern.length;
  const colCount = visiblePattern[0]?.length ?? 0;
  const maxAxisCells = Math.max(rowCount, colCount, 1);
  const targetGridSize = large ? 272 : choice ? 158 : compact ? 118 : 188;
  const gapSize = large ? 4 : 3;
  const maxCellSize = large ? 68 : choice ? 52 : compact ? 40 : 48;
  const minCellSize = compact ? 20 : 28;
  const cellSize = Math.min(
    maxCellSize,
    Math.max(
      minCellSize,
      Math.floor((targetGridSize - gapSize * (maxAxisCells - 1)) / maxAxisCells),
    ),
  );

  return (
    <div className="flex h-full w-full items-center justify-center overflow-hidden p-1">
      <div
        className="grid"
        style={{
          gap: `${gapSize}px`,
          gridTemplateColumns: `repeat(${colCount}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${rowCount}, ${cellSize}px)`,
        }}
      >
        {visiblePattern.flatMap((row, rowIndex) =>
          row.map((faceIndex, colIndex) => {
            if (faceIndex === 0) {
              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  aria-hidden="true"
                />
              );
            }

            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className="relative flex items-center justify-center border-2 border-zinc-300 bg-white shadow-sm dark:border-zinc-500 dark:bg-white"
              >
                <img
                  src={images[faceIndex]}
                  alt=""
                  className={`${imageClass} object-contain`}
                  draggable={false}
                  style={{ transform: `rotate(${imageRotations[faceIndex] ?? 0}deg)` }}
                />
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}
