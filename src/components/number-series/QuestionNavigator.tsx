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
      return "bg-[#FFFFFF] text-[#4F12A6] border-2 border-[#4F12A6] font-black shadow-lg scale-105 z-10";
    }

    if (status === "answered") {
      return "bg-[#4F12A6] text-white font-bold border-2 border-transparent";
    }

    if (status === "skipped") {
      return "bg-amber-400 text-white font-bold border-2 border-transparent";
    }

    return "bg-[#F1F5F9] text-zinc-500 font-semibold border-2 border-white/5 hover:border-white/10 hover:bg-zinc-800 transition-all";
  };

  return (
    <div className="flex flex-col gap-10">
      <div className="grid grid-cols-10 gap-1.5 content-start">
        {Array.from({ length: totalQuestions }, (_, i) => i).map((index) => (
          <button
            key={index}
            onClick={() => onSelectQuestion(index)}
            className={`aspect-square w-full rounded-md text-[10px] flex items-center justify-center transition-all duration-200 active:scale-95 ${getButtonStyle(index)}`}
            aria-label={`Go to question ${index + 1}`}
            aria-current={index === currentIndex ? "step" : undefined}
          >
            {index + 1}
          </button>
        ))}
      </div>

      <div className="flex gap-6 text-[10px] font-black text-zinc-400 tracking-widest uppercase">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-[#4F12A6]"></div>
          <span>DONE</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-amber-400"></div>
          <span>SKIP</span>
        </div>
      </div>
    </div>
  );
}
