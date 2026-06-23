"use client";

import Image from "next/image";
import {
  DERN_JOOD_PAPER_PATTERNS,
  DERN_JOOD_PAPER_SIZE,
  type DernJoodPaperColorFilter,
  type DernJoodPaperPatternId,
  type DernJoodPaperPoint,
  type DernJoodPaperShapeFilter,
} from "@/lib/dern-jood-paper";

interface PaperTrackerProps {
  step: number;
  bpm: number;
  isRunning: boolean;
  isPaused: boolean;
  interactionMode: "guide" | "tablet";
  isTabletFullscreen: boolean;
  wrongPositionCount: number;
  tabletCountdown: number | null;
  patternId: DernJoodPaperPatternId;
  shapeFilter: DernJoodPaperShapeFilter;
  colorFilter: DernJoodPaperColorFilter;
  leftStart: "top" | "bottom";
  rightStart: "top" | "bottom";
  onPatternChange: (patternId: DernJoodPaperPatternId) => void;
  onToggleTabletFullscreen: () => void;
  onStartTabletQuiz: () => void;
  onTabletCorrectPoint: () => void;
  onTabletWrongPoint: () => void;
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

function DirectionArrow({
  route,
  label,
  direction,
}: {
  route: DernJoodPaperPoint[];
  label: "L" | "R";
  direction: "up" | "down";
}) {
  const routePath = route
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${DERN_JOOD_PAPER_SIZE.width} ${DERN_JOOD_PAPER_SIZE.height}`}
      className="pointer-events-none absolute inset-0 z-[1] h-full w-full"
      aria-hidden="true"
    >
      <path
        d={routePath}
        fill="none"
        stroke="#22c55e"
        strokeDasharray="24 30"
        strokeLinecap="round"
        strokeWidth={10}
        opacity={0.22}
      />
      <g>
        <circle r="45" fill="#dcfce7" opacity="0.92" />
        <circle r="44" fill="none" stroke="#22c55e" strokeWidth="8" />
        <text
          y="-52"
          fill="#15803d"
          fontSize="42"
          fontWeight="900"
          textAnchor="middle"
        >
          {label}
        </text>
        <line
          x1="0"
          y1={direction === "down" ? -34 : 34}
          x2="0"
          y2={direction === "down" ? 18 : -18}
          stroke="#16a34a"
          strokeLinecap="round"
          strokeWidth="14"
        />
        <path
          d={direction === "down" ? "M-24 8L0 36L24 8" : "M-24 -8L0 -36L24 -8"}
          fill="none"
          stroke="#16a34a"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="14"
        />
        <animateMotion
          dur="2.8s"
          path={routePath}
          repeatCount="indefinite"
        />
      </g>
    </svg>
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

function filterRoute(
  points: DernJoodPaperPoint[],
  shapeFilter: DernJoodPaperShapeFilter,
  colorFilter: DernJoodPaperColorFilter,
) {
  const filteredPoints = points.filter((point) => {
    const matchesShape = shapeFilter === "all" || point.shape === shapeFilter;
    const matchesColor = colorFilter === "all" || point.color === colorFilter;

    return matchesShape && matchesColor;
  });

  return filteredPoints.length > 0 ? filteredPoints : points;
}

function pingPongIndex(stepCount: number, routeLength: number) {
  if (routeLength <= 1) return 0;

  const period = (routeLength - 1) * 2;
  const cycleStep = stepCount % period;

  return cycleStep < routeLength ? cycleStep : period - cycleStep;
}

function distanceBetweenPoints(
  first: Pick<DernJoodPaperPoint, "x" | "y">,
  second: Pick<DernJoodPaperPoint, "x" | "y">,
) {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

export default function PaperTracker({
  step,
  bpm,
  isRunning,
  isPaused,
  interactionMode,
  isTabletFullscreen,
  wrongPositionCount,
  tabletCountdown,
  patternId,
  shapeFilter,
  colorFilter,
  leftStart,
  rightStart,
  onPatternChange,
  onToggleTabletFullscreen,
  onStartTabletQuiz,
  onTabletCorrectPoint,
  onTabletWrongPoint,
  className = "",
}: PaperTrackerProps) {
  const pattern =
    DERN_JOOD_PAPER_PATTERNS.find((item) => item.id === patternId) ??
    DERN_JOOD_PAPER_PATTERNS[0];
  const activeShapeFilter = pattern.id === "mixed" ? shapeFilter : "all";
  const activeColorFilter = colorFilter;
  const leftRoute = filterRoute(
    orientRoute(pattern.leftHandPoints, leftStart),
    activeShapeFilter,
    activeColorFilter,
  );
  const rightRoute = filterRoute(
    orientRoute(pattern.rightHandPoints, rightStart),
    activeShapeFilter,
    activeColorFilter,
  );
  const leftIndex = pingPongIndex(Math.ceil(step / 2), leftRoute.length);
  const rightIndex = pingPongIndex(Math.floor(step / 2), rightRoute.length);
  const leftPoint = leftRoute[leftIndex];
  const rightPoint = rightRoute[rightIndex];
  const nextStep = step + 1;
  const expectedTabletHand = nextStep % 2 === 1 ? "Left" : "Right";
  const expectedTabletPoint =
    expectedTabletHand === "Left"
      ? leftRoute[pingPongIndex(Math.ceil(nextStep / 2), leftRoute.length)]
      : rightRoute[pingPongIndex(Math.floor(nextStep / 2), rightRoute.length)];
  const activeHand = step === 0 ? "Ready" : step % 2 === 1 ? "Left" : "Right";
  const nextHand = step % 2 === 0 ? "Left" : "Right";
  const leftColor = "#2563eb";
  const rightColor = "#f97316";
  const leftDirection = leftStart === "top" ? "down" : "up";
  const rightDirection = rightStart === "top" ? "down" : "up";
  const showTabletPrep = interactionMode === "tablet" && !isRunning;
  const showTabletStartButton =
    interactionMode === "tablet" && !isRunning && tabletCountdown === null;
  const trackerChromeClass = isTabletFullscreen
    ? "fixed inset-0 z-[100] flex flex-col rounded-none border-0 bg-white p-2 dark:bg-zinc-950"
    : `rounded-2xl border-2 border-zinc-200 bg-white p-3 transition dark:border-white/5 dark:bg-black/30 ${className}`;
  const paperViewportClass = isTabletFullscreen
    ? "relative flex flex-1 items-center justify-center overflow-hidden bg-white dark:bg-zinc-950"
    : "relative overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-white/10";
  const paperSurfaceClass = isTabletFullscreen
    ? "relative origin-center rotate-90 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-white/10"
    : "relative overflow-hidden";
  const paperSurfaceStyle = isTabletFullscreen
    ? {
        width:
          "min(100dvh, calc(100dvw * 1917 / 2508), 1000px)",
      }
    : undefined;

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
      className={trackerChromeClass}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
            Paper Position
          </p>
          <p className="mt-1 text-sm font-bold text-zinc-900 dark:text-white">
            {isPaused
              ? "Paused · check position"
              : tabletCountdown !== null
                ? `Starting in ${tabletCountdown}`
              : interactionMode === "tablet" && isRunning
                ? `Tap next ${expectedTabletHand}`
              : isRunning
                ? `${activeHand} moved · next ${nextHand}`
                : "Ready"}
          </p>
          <p className="mt-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            L {leftStart} · R {rightStart}
            {activeShapeFilter !== "all" ? ` · ${activeShapeFilter} only` : ""}
            {activeColorFilter !== "all" ? ` · ${activeColorFilter} only` : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-black text-zinc-700 dark:bg-white/10 dark:text-zinc-200">
            {pattern.label}
          </div>
          {interactionMode === "tablet" && (
            <div className="rounded-lg bg-red-100 px-2.5 py-1 text-xs font-black text-red-700 dark:bg-red-900/50 dark:text-red-200">
              Wrong {wrongPositionCount}
            </div>
          )}
          {interactionMode === "tablet" && (
            <button
              type="button"
              onClick={onToggleTabletFullscreen}
              className="rounded-lg bg-zinc-900 px-2.5 py-1 text-xs font-black text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {isTabletFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            </button>
          )}
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

      <div className={paperViewportClass}>
        <div
          className={`${paperSurfaceClass} ${
          interactionMode === "tablet" ? "touch-none cursor-crosshair" : ""
        }`}
          style={paperSurfaceStyle}
        onPointerDown={(event) => {
          if (
            interactionMode !== "tablet" ||
            !isRunning ||
            isPaused ||
            event.pointerType === "mouse" && event.button !== 0
          ) {
            return;
          }

          const bounds = event.currentTarget.getBoundingClientRect();
          const relativeX = (event.clientX - bounds.left) / bounds.width;
          const relativeY = (event.clientY - bounds.top) / bounds.height;
          const tappedPoint = isTabletFullscreen
            ? {
                x: relativeY * DERN_JOOD_PAPER_SIZE.width,
                y: (1 - relativeX) * DERN_JOOD_PAPER_SIZE.height,
              }
            : {
                x: relativeX * DERN_JOOD_PAPER_SIZE.width,
                y: relativeY * DERN_JOOD_PAPER_SIZE.height,
              };
          const allowedDistance = 95;

          if (
            distanceBetweenPoints(tappedPoint, expectedTabletPoint) <=
            allowedDistance
          ) {
            onTabletCorrectPoint();
            return;
          }

          onTabletWrongPoint();
        }}
      >
        <Image
          src={pattern.svg}
          alt={`${pattern.label} Dern-Jood PRO MAX paper`}
          width={DERN_JOOD_PAPER_SIZE.width}
          height={DERN_JOOD_PAPER_SIZE.height}
          className="block h-auto w-full"
          priority={false}
        />
        {isRunning && interactionMode === "guide" && (
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
        {showTabletPrep && (
          <>
            <DirectionArrow
              route={leftRoute}
              label="L"
              direction={leftDirection}
            />
            <DirectionArrow
              route={rightRoute}
              label="R"
              direction={rightDirection}
            />
            {tabletCountdown !== null && (
              <div className="pointer-events-none absolute left-1/2 top-1/2 z-30 flex h-32 w-32 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-brand-purple bg-white/95 text-7xl font-black text-brand-purple shadow-2xl dark:border-brand-gold dark:bg-zinc-950/95 dark:text-brand-gold">
                {tabletCountdown}
              </div>
            )}
            {showTabletStartButton && (
              <button
                type="button"
                onClick={onStartTabletQuiz}
                className="absolute left-1/2 top-1/2 z-30 flex h-32 w-32 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-brand-purple bg-brand-purple text-2xl font-black text-white shadow-2xl transition hover:opacity-90 active:scale-95 dark:border-brand-gold dark:bg-brand-gold dark:text-zinc-950"
              >
                Start
              </button>
            )}
          </>
        )}
        </div>
      </div>
    </div>
  );
}
