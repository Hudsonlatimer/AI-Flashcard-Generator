"use client";

interface FlipCardProps {
  question: string;
  answer: string;
  flipped: boolean;
  index: number;
  total: number;
}

export default function FlipCard({ question, answer, flipped, index, total }: FlipCardProps) {
  return (
    <div className="w-full max-w-2xl mx-auto perspective-1000">
      <div
        className={`relative w-full h-64 transition-transform duration-500 transform-style-3d ${
          flipped ? "rotate-y-180" : ""
        }`}
        style={{
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          transition: "transform 0.5s",
        }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center p-8 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-lg"
          style={{ backfaceVisibility: "hidden" }}
        >
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-widest mb-4">
            {index + 1} / {total} · Question
          </span>
          <p className="text-xl font-medium text-center text-zinc-900 dark:text-zinc-100">
            {question}
          </p>
          <span className="mt-6 text-sm text-zinc-400">Press Space to flip</span>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center p-8 rounded-2xl bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 shadow-lg"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <span className="text-xs font-medium text-indigo-400 uppercase tracking-widest mb-4">
            {index + 1} / {total} · Answer
          </span>
          <p className="text-xl font-medium text-center text-zinc-900 dark:text-zinc-100">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}
