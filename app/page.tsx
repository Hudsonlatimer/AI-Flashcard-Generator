"use client";

import { useState, useEffect, useCallback } from "react";
import DeckManager from "@/components/DeckManager";
import ReviewSession from "@/components/ReviewSession";
import { upsertCards, getAllDecks, getCardsByDeck, getDueCards } from "@/lib/db";
import type { Flashcard } from "@/lib/schema";

type View = "home" | "review";

interface DeckInfo {
  name: string;
  createdAt: number;
  cardCount: number;
}

export default function Home() {
  const [view, setView] = useState<View>("home");
  const [text, setText] = useState("");
  const [deckName, setDeckName] = useState("");
  const [cardCount, setCardCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [decks, setDecks] = useState<DeckInfo[]>([]);
  const [reviewCards, setReviewCards] = useState<Flashcard[]>([]);
  const [reviewDeck, setReviewDeck] = useState("");
  const [tab, setTab] = useState<"generate" | "decks">("generate");

  const loadDecks = useCallback(async () => {
    try {
      const all = await getAllDecks();
      const withCounts = await Promise.all(
        all.map(async (d) => {
          const cards = await getCardsByDeck(d.name);
          return { ...d, cardCount: cards.length };
        })
      );
      withCounts.sort((a, b) => b.createdAt - a.createdAt);
      setDecks(withCounts);
    } catch {
      // IndexedDB not available (SSR guard)
    }
  }, []);

  useEffect(() => {
    loadDecks();
  }, [loadDecks]);

  const handleGenerate = async () => {
    setError(null);
    if (!text.trim()) return setError("Please paste some study text.");
    const name = deckName.trim() || "Untitled Deck";

    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, count: cardCount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed.");

      const now = Date.now();
      const cards: Flashcard[] = data.cards.map((c: { question: string; answer: string }, i: number) => ({
        id: `${name}-${now}-${i}`,
        question: c.question,
        answer: c.answer,
        deckName: name,
        dueDate: now,
        interval: 1,
        easeFactor: 2.5,
        repetitions: 0,
      }));

      await upsertCards(cards);
      await loadDecks();
      setText("");
      setDeckName("");
      setTab("decks");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDeck = async (name: string) => {
    const due = await getDueCards(name);
    const all = await getCardsByDeck(name);
    const cards = due.length > 0 ? due : all;
    setReviewCards(cards);
    setReviewDeck(name);
    setView("review");
  };

  if (view === "review") {
    return (
      <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => { setView("home"); loadDecks(); }}
              className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition"
            >
              ← Back
            </button>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{reviewDeck}</h1>
            <span className="text-sm text-zinc-400">{reviewCards.length} cards</span>
          </div>
          <ReviewSession
            cards={reviewCards}
            onDone={() => { setView("home"); loadDecks(); }}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Recall
          </h1>
          <p className="mt-2 text-zinc-500 text-sm">
            AI-powered flashcards with spaced repetition
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-zinc-200 dark:bg-zinc-800 rounded-xl p-1">
          {(["generate", "decks"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition capitalize ${
                tab === t
                  ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              {t === "decks" ? `My Decks (${decks.length})` : "Generate"}
            </button>
          ))}
        </div>

        {tab === "generate" && (
          <div className="flex flex-col gap-4">
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Deck name (optional)"
                value={deckName}
                onChange={(e) => setDeckName(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800">
                <label className="text-xs text-zinc-500 whitespace-nowrap">Cards:</label>
                <input
                  type="number"
                  min={5}
                  max={20}
                  value={cardCount}
                  onChange={(e) => setCardCount(Number(e.target.value))}
                  className="w-12 bg-transparent text-sm text-center text-zinc-900 dark:text-zinc-100 focus:outline-none"
                />
              </div>
            </div>

            <textarea
              placeholder="Paste your study text here — notes, chapters, articles, anything…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={10}
              className="w-full px-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            {error && (
              <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950 px-4 py-3 rounded-xl">
                {error}
              </p>
            )}

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating…
                </>
              ) : (
                "Generate Flashcards"
              )}
            </button>
          </div>
        )}

        {tab === "decks" && (
          <DeckManager
            decks={decks}
            onSelect={handleSelectDeck}
            onRefresh={loadDecks}
          />
        )}
      </div>
    </main>
  );
}
