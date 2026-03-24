"use client";

import { useState, useEffect } from "react";
import ProgressBar from "@/components/shared/ProgressBar";
import { Direction, Instruction } from "@/types";
import CompassCircle from "@/components/spatial-orientation/CompassCircle";

interface RoundData {
  initial: number;
  seq: Instruction[];
  resultAfterSeq: number;
  targetHeading: number;
  correctAngle: number;
}

const AirplaneIcon = ({
  angle,
  color = "currentColor",
  className = "",
}: {
  angle: number;
  color?: string;
  className?: string;
}) => (
  <div
    className={`relative flex items-center justify-center ${className}`}
    style={{
      transform: `rotate(${angle}deg)`,
      transition: "transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
    }}
  >
    <svg
      viewBox="0 0 24 24"
      className="w-full h-full drop-shadow-lg"
      style={{ filter: `drop-shadow(0 4px 6px rgba(0,0,0,0.3))` }}
    >
      <path
        d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"
        fill={color}
      />
    </svg>
  </div>
);

export default function LearnMode({ onRestart }: { onRestart: () => void }) {
  const [status, setStatus] = useState<"playing" | "feedback" | "gameover">(
    "playing"
  );
  const [roundData, setRoundData] = useState<RoundData | null>(null);
  const [selectedAngle, setSelectedAngle] = useState<number | null>(null);
  const [selectedDir, setSelectedDir] = useState<Direction | null>(null);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [feedbackHeading, setFeedbackHeading] = useState<number>(0);
  const [isCorrect, setIsCorrect] = useState(false);
  const maxRounds = 10;

  const generateRound = () => {
    const possibleAngles = [45, 90, 135, 180];
    const possibleDirs: Direction[] = ["L", "R"];
    const initial = Math.floor(Math.random() * 8) * 45;

    const seqLengths = [3, 4, 5];
    const length = seqLengths[Math.floor(Math.random() * seqLengths.length)];
    const seq: Instruction[] = [];

    let currentHeading = initial;
    for (let i = 0; i < length; i++) {
      const angle =
        possibleAngles[Math.floor(Math.random() * possibleAngles.length)];
      const dir = possibleDirs[Math.floor(Math.random() * possibleDirs.length)];
      seq.push({ angle, dir });

      let factor = dir === "R" ? 1 : -1;
      currentHeading = (currentHeading + angle * factor + 360) % 360;
    }

    let targetHeading = Math.floor(Math.random() * 8) * 45;
    while (targetHeading === currentHeading) {
      targetHeading = Math.floor(Math.random() * 8) * 45;
    }

    let diff = (targetHeading - currentHeading + 360) % 360;
    let correctAngle = diff > 180 ? 360 - diff : diff;

    setRoundData({
      initial,
      seq,
      resultAfterSeq: currentHeading,
      targetHeading,
      correctAngle,
    });
    setFeedbackHeading(initial);
    setSelectedAngle(null);
    setSelectedDir(null);
    setStatus("playing");
  };

  useEffect(() => {
    generateRound();
  }, []);

  const handleSubmit = async () => {
    if (selectedAngle === null || selectedDir === null || !roundData) return;

    let userFinalHeading = roundData.resultAfterSeq;
    let factor = selectedDir === "R" ? 1 : -1;
    userFinalHeading =
      (userFinalHeading + selectedAngle * factor + 360) % 360;

    const correct = userFinalHeading === roundData.targetHeading;
    setIsCorrect(correct);
    if (correct) {
      setScore((s) => s + 1);
    }
    
    setStatus("feedback");
    
    // Animate through sequence
    let currentAnimHeading = roundData.initial;
    for (let i = 0; i < roundData.seq.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 600));
      const step = roundData.seq[i];
      let stepFactor = step.dir === "R" ? 1 : -1;
      currentAnimHeading =
        (currentAnimHeading + step.angle * stepFactor + 360) % 360;
      setFeedbackHeading(currentAnimHeading);
    }
    
    // Animate user's answer
    await new Promise((resolve) => setTimeout(resolve, 800));
    setFeedbackHeading(userFinalHeading);
  };

  const handleNextRound = () => {
    if (round >= maxRounds) {
      setStatus("gameover");
    } else {
      setRound((r) => r + 1);
      generateRound();
    }
  };

  if (!roundData) return null;

  return (
    <div className="w-full max-w-[1600px] pr-4 sm:pr-6 lg:pr-8 pb-20">
      {status === "gameover" ? (
        <div className="flex flex-col items-center">
          <div className="text-center mt-20 p-10 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl dark:shadow-zinc-950 border border-zinc-200 dark:border-zinc-800 w-full max-w-2xl">
            <h2 className="text-4xl font-bold mb-4 font-[family-name:var(--font-space-grotesk)]">
              Game Over!
            </h2>
            <p className="text-xl mb-8">
              Final Score: {score} out of {maxRounds}
            </p>
            <button
              onClick={() => {
                setScore(0);
                setRound(1);
                generateRound();
              }}
              className="rounded-full bg-violet-700 px-8 py-3 font-bold text-white transition-colors hover:bg-violet-600"
            >
              Play Again
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex flex-col gap-6 w-full max-w-[1400px] mx-auto">
          {/* Header Bar */}
          <div className="flex justify-between items-center bg-white dark:bg-black/40 dark:backdrop-blur-md border-2 border-zinc-100 dark:border-white/10 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="text-2xl font-black">
                <span className="text-2xl">✈️</span>
              </div>
              <div>
                <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
                  Aircraft Rotation
                </h1>
                <span className="inline-block mt-1 uppercase text-[10px] font-black tracking-widest bg-brand-gold text-zinc-900 px-2.5 py-1 rounded-sm">
                  PRACTICE MODE
                </span>
              </div>
            </div>
            <div className="text-2xl font-bold font-[family-name:var(--font-space-grotesk)] text-zinc-800 dark:text-zinc-100/90">
              Round {round}
            </div>
          </div>

          {/* Main Content Area (Two Columns) */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_20rem] gap-4 items-stretch">
            
            {/* Left: Main Visualizer */}
            <div className="bg-zinc-950/80 backdrop-blur-xl rounded-3xl border border-white/5 shadow-2xl overflow-hidden flex-1 py-8 px-4 sm:px-10 flex flex-col items-center gap-4 relative h-full">
              {/* Question Header */}
              <div className="w-full text-center">
                <h2 className="text-xl sm:text-2xl font-bold text-white font-[family-name:var(--font-space-grotesk)]">
                  What is the final adjustment?
                </h2>
              </div>

              <div className="w-full h-full flex flex-col sm:flex-row items-center justify-center gap-8 py-10">
                {/* Start Plane */}
                <div className="flex flex-col items-center gap-4 z-10 w-fit">
                  <CompassCircle size="lg">
                    <AirplaneIcon
                      angle={
                        status === "playing" ? roundData.initial : feedbackHeading
                      }
                      color={
                        status === "playing"
                          ? "#fbbf24" // brand-gold/yellow
                          : isCorrect
                            ? "#22c55e"
                            : "#ef4444"
                      }
                      className="w-24 h-24"
                    />
                  </CompassCircle>
                  <div className="text-sm font-black uppercase tracking-widest text-zinc-300">
                    START
                  </div>
                </div>

                {/* Sequence */}
                <div className="flex flex-col items-center gap-2 z-10">
                  <div className="flex flex-col gap-2">
                    {roundData.seq.map((step, idx) => (
                      <div
                        key={idx}
                        className="flex justify-center items-center bg-transparent px-8 py-2 rounded-xl text-lg font-black border border-white/40 text-white min-w-[140px]"
                      >
                        <span className="flex items-center gap-1">
                          {step.angle}
                          <span className={step.dir === "L" ? "text-rose-500" : "text-blue-400"}>
                            {step.dir}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Target Plane */}
                <div className="flex flex-col items-center gap-4 z-10 w-fit">
                  <CompassCircle size="lg">
                    <AirplaneIcon
                      angle={roundData.targetHeading}
                      color="#7c3aed" // violet target
                      className="w-24 h-24"
                    />
                  </CompassCircle>
                  <div className="text-sm font-black uppercase tracking-widest text-zinc-300 flex items-center gap-2">
                    TARGET{" "}
                    <span className="w-3 h-3 rounded-full bg-brand-purple animate-pulse"></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Answer & Progress Column */}
            <div className="w-full rounded-3xl border border-white/5 bg-zinc-950/80 backdrop-blur-xl p-6 flex flex-col gap-6 shadow-2xl h-full">
              {/* Progress */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-500 uppercase tracking-widest text-[10px]">
                    Progress
                  </span>
                  <span className="text-lg font-bold font-[family-name:var(--font-space-grotesk)] text-brand-gold">
                    {score}/{maxRounds}
                  </span>
                </div>
                <ProgressBar current={round} total={maxRounds} compact />
              </div>

              {/* Answers */}
              <div className="flex-1 flex flex-col">
                <h3 className="text-[10px] font-bold text-zinc-500 mb-4 uppercase tracking-widest text-center">
                  Your Answer
                </h3>

                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-2">
                    {[45, 90, 135, 180].map((angle) => (
                      <button
                        key={angle}
                        disabled={status !== "playing"}
                        onClick={() => setSelectedAngle(angle)}
                        className={`py-1.5 rounded-lg font-bold text-sm transition-all ${
                          selectedAngle === angle
                            ? "bg-violet-700 text-white shadow-lg shadow-violet-900/40 ring-1 ring-violet-400"
                            : "bg-white/5 text-zinc-400 hover:bg-white/10 border border-white/10"
                        } ${status !== "playing" ? "opacity-30 cursor-not-allowed" : ""}`}
                      >
                        {angle}°
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { val: "L", label: "↺ Left" },
                      { val: "R", label: "↻ Right" },
                    ].map((dir) => (
                      <button
                        key={dir.val}
                        disabled={status !== "playing"}
                        onClick={() => setSelectedDir(dir.val as Direction)}
                        className={`py-1.5 rounded-lg font-bold text-sm transition-all ${
                          selectedDir === dir.val
                            ? dir.val === "L"
                              ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40 ring-1 ring-blue-400"
                              : "bg-amber-600 text-white shadow-lg shadow-amber-900/40 ring-1 ring-amber-400"
                            : "bg-white/5 text-zinc-400 hover:bg-white/10 border border-white/10"
                        } ${status !== "playing" ? "opacity-30 cursor-not-allowed" : ""}`}
                      >
                        {dir.label}
                      </button>
                    ))}
                  </div>
                </div>

                {status === "playing" ? (
                  <button
                    onClick={handleSubmit}
                    disabled={selectedAngle === null || selectedDir === null}
                    className="mt-auto w-full py-3.5 rounded-xl bg-white text-zinc-900 disabled:opacity-20 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-95 shadow-xl font-[family-name:var(--font-space-grotesk)] text-[16px] font-bold leading-none"
                  >
                    Submit Route
                  </button>
                ) : (
                  <div className="mt-auto pt-4">
                    <div
                      className={`p-3 rounded-lg mb-3 text-center font-bold text-sm ${
                        isCorrect
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : "bg-red-500/20 text-red-400 border border-red-500/30"
                      }`}
                    >
                      {isCorrect ? "Correct!" : "Incorrect"}
                    </div>
                    <button
                      onClick={handleNextRound}
                      className="w-full py-4 rounded-xl bg-violet-700 text-white font-bold text-lg hover:bg-violet-600 transition-all shadow-xl"
                    >
                      Next Round
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <button
              onClick={onRestart}
              className="group flex items-center gap-2 rounded-xl bg-zinc-200/60 px-5 py-2.5 text-sm font-bold text-zinc-700 transition-all hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 w-max"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-transform group-hover:-translate-x-1"
              >
                <path d="M9 14 4 9l5-5" />
                <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11" />
              </svg>
              Exit
            </button>
          </div>
        </div>
        </div>
      )}
    </div>
  );
}
