"use client";

import { useEffect, useState, useCallback } from "react";
import FlipCard from "./FlipCard";
import { schedule } from "@/lib/srs";
import { updateCard } from "@/lib/db";
import type { Flashcard, Rating } from "@/lib/schema";

interface ReviewSessionProps {
  cards: Flashcard[];
  onDone: () => void;
}

export default function ReviewSession({ cards, onDone }: ReviewSessionProps) {
  const [queue, setQueue] = useState<Flashcard[]>(cards);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);

  const current = queue[index];

  const flip = useCallback(() => setFlipped((f) => !f), []);

  const rate = useCallback(
    async (rating: Rating) => {
      if (!current) return;
      const updated = schedule(current, rating);
      await updateCard(updated);

      const next = index + 1;
      if (next >= queue.length) {
        setDone(true);
      } else {
        setIndex(next);
        setFlipped(false);
      }
    },
    [current, index, queue.length]
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === " ") {
        e.preventDefault();
        flip();
      }
      if (!flipped) return;
      if (e.key === "1") rate("again");
      if (e.key === "2") rate("hard");
      if (e.key === "3") rate("good");
      if (e.key === "4") rate("easy");
      if (e.key === "ArrowRight") rate("good");
      if (e.key === "ArrowLeft") rate("again");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [flip, flipped, rate]);

  if (done) {
    return (
      <div className="flex flex-col items-center gap-6 py-12">
        <div className="text-5xl">🎉</div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Session complete!</h2>
        <p className="text-zinc-500">All {cards.length} cards reviewed.</p>
        <button
          onClick={onDone}
          className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition"
        >
          Back to deck
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <FlipCard
        question={current.question}
        answer={current.answer}
        flipped={flipped}
        index={index}
        total={queue.length}
      />

      {/* Progress bar */}
      <div className="w-full max-w-2xl bg-zinc-200 dark:bg-zinc-700 rounded-full h-1.5">
        <div
          className="bg-indigo-500 h-1.5 rounded-full transition-all"
          style={{ width: `${((index) / queue.length) * 100}%` }}
        />
      </div>

      {!flipped ? (
        <button
          onClick={flip}
          className="px-8 py-3 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold text-lg hover:opacity-90 transition"
        >
          Show Answer
        </button>
      ) : (
        <div className="flex gap-3 flex-wrap justify-center">
          {(["again", "hard", "good", "easy"] as Rating[]).map((r, i) => {
            const colors: Record<Rating, string> = {
              again: "bg-red-100 text-red-700 border-red-200 hover:bg-red-200",
              hard: "bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200",
              good: "bg-green-100 text-green-700 border-green-200 hover:bg-green-200",
              easy: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200",
            };
            return (
              <button
                key={r}
                onClick={() => rate(r)}
                className={`px-5 py-2.5 rounded-xl border font-medium capitalize transition ${colors[r]}`}
              >
                {r}
                <span className="ml-2 text-xs opacity-60">{i + 1}</span>
              </button>
            );
          })}
        </div>
      )}

      <p className="text-xs text-zinc-400">
        Space: flip · 1 Again · 2 Hard · 3 Good · 4 Easy · ← Again · → Good
      </p>
    </div>
  );
}
