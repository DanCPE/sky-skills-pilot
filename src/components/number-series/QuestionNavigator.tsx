"use client";

interface QuestionNavigatorProps {
  totalQuestions: number;
  currentIndex: number;
  answeredIndices: Set<number>;
  skippedIndices: Set<number>;
  onSelectQuestion: (index: number) => void;
}

export default function QuestionNavigator({
  totalQuestions,
  currentIndex,
  answeredIndices,
  skippedIndices,
  onSelectQuestion,
}: QuestionNavigatorProps) {
  const getQuestionStatus = (index: number) => {
    if (answeredIndices.has(index)) return "answered";
    if (skippedIndices.has(index)) return "skipped";
    return "pending";
  };

  const getButtonStyle = (index: number) => {
    const status = getQuestionStatus(index);
    const isCurrent = index === currentIndex;

    if (isCurrent) {
      return "bg-white text-violet-900 border-2 border-violet-100 font-black shadow-sm dark:bg-zinc-800 dark:text-violet-400 dark:border-violet-900/50";
    }

    if (status === "answered") {
      return "bg-[#4314A0] text-white font-bold border-2 border-transparent dark:bg-violet-900";
    }

    if (status === "skipped") {
      return "bg-[#FFC000] text-zinc-900 font-bold border-2 border-transparent dark:bg-amber-500";
    }

    return "bg-zinc-100/80 text-zinc-400 font-semibold border-2 border-transparent hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-500 dark:hover:bg-zinc-700";
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-10 gap-1.5 sm:gap-2">
        {Array.from({ length: totalQuestions }, (_, i) => i).map((index) => (
          <button
            key={index}
            onClick={() => onSelectQuestion(index)}
            className={`aspect-square w-full rounded-md text-[10px] sm:text-xs flex items-center justify-center transition-all duration-200 active:scale-95 ${getButtonStyle(index)}`}
            aria-label={`Go to question ${index + 1}`}
            aria-current={index === currentIndex ? "step" : undefined}
          >
            {index + 1}
          </button>
        ))}
      </div>

      <div className="flex gap-6 mt-2 pt-4 border-t border-zinc-100 dark:border-zinc-800/50 text-[10px] font-bold text-zinc-500 tracking-widest uppercase">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-[#4314A0] dark:bg-violet-900"></div>
          <span>DONE</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-[#FFC000] dark:bg-amber-500"></div>
          <span>SKIP</span>
        </div>
      </div>
    </div>
  );
}
