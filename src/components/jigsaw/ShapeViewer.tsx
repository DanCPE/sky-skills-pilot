"use client";

import type { JigsawPiece, JigsawPoint } from "@/types";

interface ShapeViewerProps {
  polygons?: JigsawPoint[][];
  pieces?: JigsawPiece[];
  colored?: boolean;
  compact?: boolean;
  className?: string;
  fitBounds?: {
    width: number;
    height: number;
  };
}

function getBounds(polygons: JigsawPoint[][]) {
  const points = polygons.flat();
  const minX = Math.min(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxX = Math.max(...points.map((point) => point.x));
  const maxY = Math.max(...points.map((point) => point.y));
  return { minX, minY, maxX, maxY };
}

function polygonPath(points: JigsawPoint[], minX: number, minY: number) {
  return points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x - minX} ${point.y - minY}`)
    .join(" ")
    .concat(" Z");
}

export default function ShapeViewer({
  polygons,
  pieces,
  colored = false,
  compact = false,
  className = "",
  fitBounds,
}: ShapeViewerProps) {
  const sourcePolygons = polygons ?? pieces?.map((piece) => piece.polygon) ?? [];

  if (sourcePolygons.length === 0) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl border border-dashed border-zinc-300 text-sm font-semibold text-zinc-400 dark:border-white/15 ${className}`}
      >
        Empty shape
      </div>
    );
  }

  const box = getBounds(sourcePolygons);
  const padding = compact ? 1.25 : 1.5;
  const sourceWidth = box.maxX - box.minX;
  const sourceHeight = box.maxY - box.minY;
  const frameWidth = fitBounds?.width ?? sourceWidth;
  const frameHeight = fitBounds?.height ?? sourceHeight;
  const minX = box.minX - Math.max((frameWidth - sourceWidth) / 2, 0) - padding;
  const minY = box.minY - Math.max((frameHeight - sourceHeight) / 2, 0) - padding;
  const width = Math.max(sourceWidth, frameWidth) + padding * 2;
  const height = Math.max(sourceHeight, frameHeight) + padding * 2;
  const scaledSize = fitBounds
    ? {
        width: `${width * 13}px`,
        height: `${height * 13}px`,
      }
    : undefined;

  return (
    <div
      className={`flex h-full min-h-32 items-center justify-center rounded-xl bg-transparent p-3 ${className}`}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className={
          fitBounds
            ? "max-h-full max-w-full shrink-0"
            : compact
              ? "h-28 w-28 shrink-0"
              : "h-44 w-44 shrink-0"
        }
        style={scaledSize}
        role="img"
        aria-label="Shape diagram"
      >
        {pieces
          ? pieces.map((piece) => (
              <path
                key={piece.id}
                d={polygonPath(piece.polygon, minX, minY)}
                fill={colored ? piece.color : "#111827"}
                opacity={colored ? 0.92 : 0.88}
                stroke="#18181B"
                strokeWidth={compact ? 0.08 : 0.1}
                vectorEffect="non-scaling-stroke"
              />
            ))
          : sourcePolygons.map((polygon, index) => (
              <path
                key={`${index}-${polygon.length}`}
                d={polygonPath(polygon, minX, minY)}
                fill="#111827"
                opacity={0.78}
                stroke="white"
                strokeWidth={compact ? 0.09 : 0.12}
                vectorEffect="non-scaling-stroke"
              />
            ))}
      </svg>
    </div>
  );
}
