"use client";

import { useState } from "react";
import { renameDeck, deleteDeck, exportDeckAsCSV, getCardsByDeck } from "@/lib/db";

interface Deck {
  name: string;
  createdAt: number;
  cardCount?: number;
}

interface DeckManagerProps {
  decks: Deck[];
  onSelect: (name: string) => void;
  onRefresh: () => void;
}

export default function DeckManager({ decks, onSelect, onRefresh }: DeckManagerProps) {
  const [renaming, setRenaming] = useState<string | null>(null);
  const [newName, setNewName] = useState("");

  const handleRename = async (old: string) => {
    if (!newName.trim() || newName === old) {
      setRenaming(null);
      return;
    }
    await renameDeck(old, newName.trim());
    setRenaming(null);
    setNewName("");
    onRefresh();
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`Delete deck "${name}" and all its cards? This cannot be undone.`)) return;
    await deleteDeck(name);
    onRefresh();
  };

  const handleExport = async (name: string) => {
    const csv = await exportDeckAsCSV(name);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (decks.length === 0) {
    return (
      <p className="text-zinc-400 text-sm text-center py-8">
        No decks yet. Generate some flashcards to get started.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {decks.map((deck) => (
        <div
          key={deck.name}
          className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition group"
        >
          {renaming === deck.name ? (
            <input
              autoFocus
              className="flex-1 text-sm bg-transparent border-b border-indigo-400 outline-none"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename(deck.name);
                if (e.key === "Escape") setRenaming(null);
              }}
              onBlur={() => handleRename(deck.name)}
            />
          ) : (
            <button
              onClick={() => onSelect(deck.name)}
              className="flex-1 text-left font-medium text-zinc-900 dark:text-zinc-100 truncate"
            >
              {deck.name}
              {deck.cardCount !== undefined && (
                <span className="ml-2 text-xs text-zinc-400">{deck.cardCount} cards</span>
              )}
            </button>
          )}

          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
            <button
              title="Review"
              onClick={() => onSelect(deck.name)}
              className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900 text-indigo-500"
            >
              ▶
            </button>
            <button
              title="Rename"
              onClick={() => { setRenaming(deck.name); setNewName(deck.name); }}
              className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-500"
            >
              ✏️
            </button>
            <button
              title="Export CSV"
              onClick={() => handleExport(deck.name)}
              className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-500"
            >
              ⬇️
            </button>
            <button
              title="Delete"
              onClick={() => handleDelete(deck.name)}
              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-red-400"
            >
              🗑️
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
