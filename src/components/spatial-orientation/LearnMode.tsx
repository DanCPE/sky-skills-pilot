"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Direction, Instruction } from "@/types";

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
    <div className="flex flex-col items-center">
      <div className="w-full max-w-4xl flex justify-between items-center mb-8">
        <button
          onClick={onRestart}
          className="text-sm font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          ← Change Mode
        </button>
        <div className="text-xl font-bold font-[family-name:var(--font-space-grotesk)]">
          Score: {score} / {maxRounds}
        </div>
      </div>

      <div className="text-center mb-8">
         <h1 className="text-3xl font-extrabold tracking-tight mb-2 font-[family-name:var(--font-space-grotesk)]">
          Learn Mode
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          Round {round} of {maxRounds}
        </p>
      </div>

      {status === "gameover" ? (
        <div className="text-center mt-20 p-10 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl dark:shadow-zinc-950 border border-zinc-200 dark:border-zinc-800">
          <h2 className="text-4xl font-bold mb-4 font-[family-name:var(--font-space-grotesk)]">
            Game Over!
          </h2>
          <p className="text-xl mb-8">Final Score: {score} out of {maxRounds}</p>
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
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-5xl">
          {/* Main Visualizer */}
          <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center gap-10 sm:gap-4 justify-between relative overflow-hidden">
            
            {/* Start Plane */}
            <div className="flex flex-col items-center gap-6 z-10">
              <div className="text-sm font-bold uppercase tracking-widest text-zinc-400">
                Start
              </div>
              <div className="relative w-32 h-32 rounded-full border-2 border-dashed border-zinc-200 dark:border-zinc-800 flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
                 {/* Compass Ticks */}
                 <div className="absolute inset-0">
                    {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
                       <div key={deg} className="absolute w-full h-full" style={{ transform: `rotate(${deg}deg)` }}>
                          <div className={`w-1 h-3 mx-auto ${deg % 90 === 0 ? 'bg-zinc-400' : 'bg-zinc-200 dark:bg-zinc-800'}`}></div>
                       </div>
                    ))}
                 </div>
                 <AirplaneIcon
                  angle={status === "playing" ? roundData.initial : feedbackHeading}
                  color={status === "playing" ? "#3b82f6" : isCorrect ? "#22c55e" : "#ef4444"} // blue start, green/red feedback
                  className="w-20 h-20"
                />
              </div>
               {status !== 'playing' && (
                  <div className="text-xs font-bold text-zinc-500 absolute bottom-4 border border-zinc-200 dark:border-zinc-800 px-2 rounded bg-white dark:bg-zinc-800">
                     Heading: {feedbackHeading}°
                  </div>
               )}
            </div>

            {/* Sequence */}
            <div className="flex flex-col items-center gap-2 flex-1 px-4 z-10 w-full">
              <div className="w-full flex sm:flex-col gap-2 overflow-x-auto pb-2 sm:pb-0">
                {roundData.seq.map((step, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center bg-zinc-100 dark:bg-zinc-800 px-4 py-2 rounded-lg text-sm font-bold min-w-[100px]"
                  >
                    <span>{step.angle}°</span>
                    <span className={step.dir === "L" ? "text-blue-500" : "text-amber-500"}>
                      {step.dir === "L" ? "↺ L" : "↻ R"}
                    </span>
                  </div>
                ))}
              </div>
              <div className="text-2xl font-black text-zinc-300 dark:text-zinc-700 rotate-90 sm:rotate-0 my-2">→</div>
              <div className="border-t-2 border-dashed border-zinc-200 dark:border-zinc-700 w-full pt-4 text-center">
                 <div className="font-[family-name:var(--font-space-grotesk)] text-lg font-bold">What is the final adjustment?</div>
              </div>
            </div>

            {/* Target Plane */}
            <div className="flex flex-col items-center gap-6 z-10">
              <div className="text-sm font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                Target Image <span className="w-3 h-3 rounded-full bg-violet-600 animate-pulse"></span>
              </div>
              <div className="relative w-32 h-32 rounded-full border-2 border-zinc-200 dark:border-zinc-800 flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
                 {/* Compass Ticks */}
                 <div className="absolute inset-0">
                    {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
                       <div key={deg} className="absolute w-full h-full" style={{ transform: `rotate(${deg}deg)` }}>
                          <div className={`w-1 h-3 mx-auto ${deg % 90 === 0 ? 'bg-zinc-400' : 'bg-zinc-200 dark:bg-zinc-800'}`}></div>
                       </div>
                    ))}
                 </div>
                <AirplaneIcon
                  angle={roundData.targetHeading}
                  color="#7c3aed" // violet target
                  className="w-20 h-20 opacity-80"
                />
              </div>
            </div>

          </div>

          {/* Controls */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col">
            <h3 className="text-sm font-bold text-zinc-500 mb-4 uppercase tracking-widest text-center">
              Your Answer
            </h3>
            
            <div className="flex-1 flex flex-col justify-center gap-6">
               <div className="grid grid-cols-2 gap-3">
                 {[45, 90, 135, 180].map((angle) => (
                   <button
                     key={angle}
                     disabled={status !== "playing"}
                     onClick={() => setSelectedAngle(angle)}
                     className={`py-3 rounded-xl font-bold text-lg transition-all ${
                       selectedAngle === angle
                         ? "bg-violet-700 text-white shadow-md shadow-violet-500/30 ring-2 ring-violet-400 ring-offset-2 ring-offset-zinc-900"
                         : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                     } ${status !== "playing" ? "opacity-50 cursor-not-allowed" : ""}`}
                   >
                     {angle}°
                   </button>
                 ))}
               </div>
   
               <div className="grid grid-cols-2 gap-3">
                 {[
                   { val: "L", label: "↺ Left" },
                   { val: "R", label: "↻ Right" },
                 ].map((dir) => (
                   <button
                     key={dir.val}
                     disabled={status !== "playing"}
                     onClick={() => setSelectedDir(dir.val as Direction)}
                     className={`py-3 rounded-xl font-bold transition-all ${
                       selectedDir === dir.val
                         ? dir.val === "L" 
                           ? "bg-blue-600 text-white shadow-md shadow-blue-500/30 ring-2 ring-blue-400 ring-offset-2 ring-offset-zinc-900"
                           : "bg-amber-600 text-white shadow-md shadow-amber-500/30 ring-2 ring-amber-400 ring-offset-2 ring-offset-zinc-900"
                         : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                     } ${status !== "playing" ? "opacity-50 cursor-not-allowed" : ""}`}
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
                className="mt-8 w-full py-4 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold text-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-95 shadow-xl"
              >
                Submit Route
              </button>
            ) : (
              <div className="mt-8">
                <div
                  className={`p-4 rounded-xl mb-4 text-center font-bold ${
                    isCorrect
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
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
      )}
    </div>
  );
}
