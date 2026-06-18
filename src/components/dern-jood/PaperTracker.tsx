"use client";

import Image from "next/image";
import {
  DERN_JOOD_PAPER_PATTERNS,
  DERN_JOOD_PAPER_SIZE,
  type DernJoodPaperPatternId,
  type DernJoodPaperPoint,
} from "@/lib/dern-jood-paper";

interface PaperTrackerProps {
  step: number;
  bpm: number;
  isRunning: boolean;
  isPaused: boolean;
  patternId: DernJoodPaperPatternId;
  leftStart: "top" | "bottom";
  rightStart: "top" | "bottom";
  onPatternChange: (patternId: DernJoodPaperPatternId) => void;
  className?: string;
}

function pointStyle(point: DernJoodPaperPoint) {
  return {
    left: `${(point.x / DERN_JOOD_PAPER_SIZE.width) * 100}%`,
    top: `${(point.y / DERN_JOOD_PAPER_SIZE.height) * 100}%`,
  };
}

function HandMarker({
  point,
  label,
  color,
  active,
}: {
  point: DernJoodPaperPoint;
  label: "L" | "R";
  color: string;
  active: boolean;
}) {
  return (
    <div
      className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
      style={pointStyle(point)}
    >
      <div
        className="flex items-center justify-center rounded-full border-[5px] bg-white/30 font-black"
        style={{
          width: active ? 52 : 42,
          height: active ? 52 : 42,
          borderColor: color,
          color,
          boxShadow: active ? `0 0 0 8px ${color}33` : undefined,
          opacity: active ? 1 : 0.72,
        }}
      >
        {label}
      </div>
    </div>
  );
}

function orientRoute(points: DernJoodPaperPoint[], start: "top" | "bottom") {
  const first = points[0];
  const last = points[points.length - 1];
  const startsAtTop = first.y <= last.y;

  if ((start === "top" && startsAtTop) || (start === "bottom" && !startsAtTop)) {
    return points;
  }

  return [...points].reverse();
}

function pingPongIndex(stepCount: number, routeLength: number) {
  if (routeLength <= 1) return 0;

  const period = (routeLength - 1) * 2;
  const cycleStep = stepCount % period;

  return cycleStep < routeLength ? cycleStep : period - cycleStep;
}

export default function PaperTracker({
  step,
  bpm,
  isRunning,
  isPaused,
  patternId,
  leftStart,
  rightStart,
  onPatternChange,
  className = "",
}: PaperTrackerProps) {
  const pattern =
    DERN_JOOD_PAPER_PATTERNS.find((item) => item.id === patternId) ??
    DERN_JOOD_PAPER_PATTERNS[0];
  const leftRoute = orientRoute(pattern.leftHandPoints, leftStart);
  const rightRoute = orientRoute(pattern.rightHandPoints, rightStart);
  const leftIndex = pingPongIndex(Math.ceil(step / 2), leftRoute.length);
  const rightIndex = pingPongIndex(Math.floor(step / 2), rightRoute.length);
  const leftPoint = leftRoute[leftIndex];
  const rightPoint = rightRoute[rightIndex];
  const activeHand = step === 0 ? "Ready" : step % 2 === 1 ? "Left" : "Right";
  const nextHand = step % 2 === 0 ? "Left" : "Right";
  const leftColor = "#2563eb";
  const rightColor = "#f97316";

  return (
    <div
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const droppedPatternId = event.dataTransfer.getData(
          "application/dern-jood-pattern",
        ) as DernJoodPaperPatternId;

        if (
          DERN_JOOD_PAPER_PATTERNS.some(
            (item) => item.id === droppedPatternId,
          )
        ) {
          onPatternChange(droppedPatternId);
        }
      }}
      className={`rounded-2xl border-2 border-zinc-200 bg-white p-3 transition dark:border-white/5 dark:bg-black/30 ${className}`}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
            Paper Position
          </p>
          <p className="mt-1 text-sm font-bold text-zinc-900 dark:text-white">
            {isPaused
              ? "Paused · check position"
              : isRunning
                ? `${activeHand} moved · next ${nextHand}`
                : "Ready"}
          </p>
          <p className="mt-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            L {leftStart} · R {rightStart}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-black text-zinc-700 dark:bg-white/10 dark:text-zinc-200">
            {pattern.label}
          </div>
          <div className="rounded-lg border border-dashed border-brand-purple/30 px-2.5 py-1 text-xs font-black text-brand-purple dark:border-brand-purple/40 dark:text-brand-gold">
            Drop pattern here
          </div>
          <div
            className="rounded-lg px-2.5 py-1 text-xs font-black text-white"
            style={{
              backgroundColor:
                !isRunning || activeHand === "Ready"
                  ? "#71717a"
                  : activeHand === "Left"
                    ? leftColor
                    : rightColor,
            }}
          >
            {bpm} BPM
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-white/10">
        <Image
          src={pattern.svg}
          alt={`${pattern.label} Dern-Jood PRO MAX paper`}
          width={DERN_JOOD_PAPER_SIZE.width}
          height={DERN_JOOD_PAPER_SIZE.height}
          className="block h-auto w-full"
          priority={false}
        />
        {isRunning && (
          <svg
            viewBox={`0 0 ${DERN_JOOD_PAPER_SIZE.width} ${DERN_JOOD_PAPER_SIZE.height}`}
            className="pointer-events-none absolute inset-0 h-full w-full"
            aria-hidden="true"
          >
            <line
              x1={leftPoint.x}
              y1={leftPoint.y}
              x2={rightPoint.x}
              y2={rightPoint.y}
              stroke="#111827"
              strokeDasharray="18 18"
              strokeWidth={5}
              opacity={0.18}
            />
          </svg>
        )}
        <HandMarker
          point={leftPoint}
          label="L"
          color={leftColor}
          active={isRunning && step % 2 === 1}
        />
        <HandMarker
          point={rightPoint}
          label="R"
          color={rightColor}
          active={isRunning && step > 0 && step % 2 === 0}
        />
      </div>
    </div>
  );
}
