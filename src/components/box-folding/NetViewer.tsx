"use client";

import type {
  BoxFoldingFaceName,
  BoxFoldingFaceOrientation,
} from "@/types";

const ORIENTATION_DEGREES: Record<BoxFoldingFaceOrientation, number> = {
  A: 0,
  B: 90,
  C: 180,
  D: 270,
};

function TransparentDebugOverlay({
  faceIndex,
  faceName,
  orientation,
  compact,
}: {
  faceIndex: number;
  faceName?: BoxFoldingFaceName;
  orientation?: BoxFoldingFaceOrientation;
  compact: boolean;
}) {
  const edgeClass = compact ? "text-[6px]" : "text-[8px]";

  return (
    <div className="pointer-events-none absolute inset-0 z-10 opacity-55">
      <div className={`absolute left-1/2 top-0 -translate-x-1/2 rounded-b bg-red-500/45 px-1 font-black uppercase leading-tight text-white ${edgeClass}`}>
        head
      </div>
      <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 rounded-t bg-blue-600/45 px-1 font-black uppercase leading-tight text-white ${edgeClass}`}>
        bottom
      </div>
      <div className={`absolute left-0 top-1/2 -translate-y-1/2 rounded-r bg-emerald-600/45 px-1 font-black uppercase leading-tight text-white ${edgeClass}`}>
        left
      </div>
      <div className={`absolute right-0 top-1/2 -translate-y-1/2 rounded-l bg-amber-400/45 px-1 font-black uppercase leading-tight text-zinc-950 ${edgeClass}`}>
        right
      </div>
      <div className="absolute left-1 top-1 rounded bg-zinc-950/35 px-1 py-0.5 text-[8px] font-black uppercase leading-none text-white">
        #{faceIndex}
      </div>
      {faceName && (
        <div className="absolute inset-x-1 top-1/2 -translate-y-1/2 rounded bg-white/45 px-1 py-0.5 text-center text-[9px] font-black uppercase leading-tight text-zinc-950 shadow-sm">
          {faceName}
          {orientation && (
            <span className="ml-1 text-[7px] text-zinc-700">
              {orientation}/{ORIENTATION_DEGREES[orientation]}°
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default function NetViewer({
  pattern,
  images,
  faceAssignments,
  faceOrientations,
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
  const cellClass = large ? "h-16 w-16" : compact ? "h-10 w-10" : "h-10 w-10 sm:h-12 sm:w-12";

  return (
    <div className="flex justify-center overflow-x-auto py-1">
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${pattern[0]?.length ?? 0}, minmax(0, auto))` }}
      >
        {pattern.flatMap((row, rowIndex) =>
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
                className={`${cellClass} relative flex items-center justify-center border-2 border-zinc-300 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900`}
              >
                <img
                  src={images[faceIndex]}
                  alt=""
                  className="h-[68%] w-[68%] object-contain"
                  draggable={false}
                />
                <TransparentDebugOverlay
                  faceIndex={faceIndex}
                  faceName={faceAssignments?.[faceIndex]}
                  orientation={faceOrientations?.[faceIndex]}
                  compact={compact}
                />
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}
