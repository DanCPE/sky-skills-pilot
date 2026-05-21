"use client";

import type { JigsawCell, JigsawPiece } from "@/types";

interface ShapeViewerProps {
  cells?: JigsawCell[];
  pieces?: JigsawPiece[];
  colored?: boolean;
  compact?: boolean;
  className?: string;
}

function getBounds(cells: JigsawCell[]) {
  const minX = Math.min(...cells.map((cell) => cell.x));
  const minY = Math.min(...cells.map((cell) => cell.y));
  const maxX = Math.max(...cells.map((cell) => cell.x));
  const maxY = Math.max(...cells.map((cell) => cell.y));
  return { minX, minY, maxX, maxY };
}

export default function ShapeViewer({
  cells,
  pieces,
  colored = false,
  compact = false,
  className = "",
}: ShapeViewerProps) {
  const sourceCells = cells ?? pieces?.flatMap((piece) => piece.cells) ?? [];

  if (sourceCells.length === 0) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl border border-dashed border-zinc-300 text-sm font-semibold text-zinc-400 dark:border-white/15 ${className}`}
      >
        Empty shape
      </div>
    );
  }

  const bounds = getBounds(sourceCells);
  const cellSize = compact ? 18 : 26;
  const gap = compact ? 2 : 3;
  const width = (bounds.maxX - bounds.minX + 1) * (cellSize + gap) + gap;
  const height = (bounds.maxY - bounds.minY + 1) * (cellSize + gap) + gap;
  const viewBox = `0 0 ${width} ${height}`;

  const renderCell = (
    cell: JigsawCell,
    fill: string,
    id: string,
    opacity = 1,
  ) => (
    <rect
      key={id}
      x={(cell.x - bounds.minX) * (cellSize + gap) + gap}
      y={(cell.y - bounds.minY) * (cellSize + gap) + gap}
      width={cellSize}
      height={cellSize}
      rx={compact ? 4 : 5}
      fill={fill}
      opacity={opacity}
      stroke="currentColor"
      strokeWidth={compact ? 1.5 : 2}
      className="text-zinc-900/20 dark:text-white/20"
    />
  );

  return (
    <div
      className={`flex h-full min-h-32 items-center justify-center rounded-xl bg-white p-3 dark:bg-zinc-950 ${className}`}
    >
      <svg
        viewBox={viewBox}
        className={compact ? "h-28 w-full" : "h-44 w-full"}
        role="img"
        aria-label="Shape diagram"
      >
        {pieces
          ? pieces.flatMap((piece) =>
              piece.cells.map((cell, index) =>
                renderCell(
                  cell,
                  colored ? piece.color : "#111827",
                  `${piece.id}-${index}`,
                  colored ? 0.92 : 0.88,
                ),
              ),
            )
          : sourceCells.map((cell, index) =>
              renderCell(cell, "#111827", `cell-${index}`, 0.88),
            )}
      </svg>
    </div>
  );
}
