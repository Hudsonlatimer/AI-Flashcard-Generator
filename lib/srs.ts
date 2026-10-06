import type { Flashcard, Rating } from "./schema";

// SM-2 spaced repetition algorithm
export function schedule(card: Flashcard, rating: Rating): Flashcard {
  const ratingMap: Record<Rating, number> = {
    again: 0,
    hard: 2,
    good: 3,
    easy: 5,
  };
  const q = ratingMap[rating];
  let { interval, easeFactor, repetitions } = card;

  if (q < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);
    repetitions += 1;
  }

  easeFactor = Math.max(1.3, easeFactor + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));

  const dueDate = Date.now() + interval * 24 * 60 * 60 * 1000;

  return { ...card, interval, easeFactor, repetitions, dueDate };
}
