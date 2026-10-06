import { z } from "zod";

export const FlashcardSchema = z.object({
  id: z.string(),
  question: z.string(),
  answer: z.string(),
  deckName: z.string(),
  dueDate: z.number(),
  interval: z.number().default(1),
  easeFactor: z.number().default(2.5),
  repetitions: z.number().default(0),
});

export const GeneratedCardSchema = z.object({
  question: z.string(),
  answer: z.string(),
});

export const DeckResponseSchema = z.object({
  cards: z.array(GeneratedCardSchema).min(1).max(20),
});

export type Flashcard = z.infer<typeof FlashcardSchema>;
export type GeneratedCard = z.infer<typeof GeneratedCardSchema>;
export type DeckResponse = z.infer<typeof DeckResponseSchema>;

export type Rating = "again" | "hard" | "good" | "easy";
