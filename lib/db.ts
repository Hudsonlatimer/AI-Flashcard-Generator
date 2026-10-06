import { openDB, type IDBPDatabase } from "idb";
import type { Flashcard } from "./schema";

const DB_NAME = "recall-db";
const DB_VERSION = 1;
const CARDS_STORE = "cards";
const DECKS_STORE = "decks";

let db: IDBPDatabase | null = null;

async function getDB() {
  if (db) return db;
  db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(database) {
      if (!database.objectStoreNames.contains(CARDS_STORE)) {
        const store = database.createObjectStore(CARDS_STORE, { keyPath: "id" });
        store.createIndex("deckName", "deckName");
        store.createIndex("dueDate", "dueDate");
      }
      if (!database.objectStoreNames.contains(DECKS_STORE)) {
        database.createObjectStore(DECKS_STORE, { keyPath: "name" });
      }
    },
  });
  return db;
}

export async function upsertCards(cards: Flashcard[]) {
  const database = await getDB();
  const tx = database.transaction([CARDS_STORE, DECKS_STORE], "readwrite");
  for (const card of cards) {
    await tx.objectStore(CARDS_STORE).put(card);
  }
  if (cards.length > 0) {
    const deckName = cards[0].deckName;
    const decksStore = tx.objectStore(DECKS_STORE);
    const existing = await decksStore.get(deckName);
    if (!existing) {
      await decksStore.put({ name: deckName, createdAt: Date.now() });
    }
  }
  await tx.done;
}

export async function getCardsByDeck(deckName: string): Promise<Flashcard[]> {
  const database = await getDB();
  return database.getAllFromIndex(CARDS_STORE, "deckName", deckName);
}

export async function getDueCards(deckName: string): Promise<Flashcard[]> {
  const cards = await getCardsByDeck(deckName);
  const now = Date.now();
  return cards.filter((c) => c.dueDate <= now);
}

export async function updateCard(card: Flashcard) {
  const database = await getDB();
  await database.put(CARDS_STORE, card);
}

export async function getAllDecks(): Promise<{ name: string; createdAt: number }[]> {
  const database = await getDB();
  return database.getAll(DECKS_STORE);
}

export async function renameDeck(oldName: string, newName: string) {
  const database = await getDB();
  const cards = await getCardsByDeck(oldName);
  const tx = database.transaction([CARDS_STORE, DECKS_STORE], "readwrite");
  for (const card of cards) {
    await tx.objectStore(CARDS_STORE).delete(card.id);
    await tx.objectStore(CARDS_STORE).put({ ...card, deckName: newName });
  }
  await tx.objectStore(DECKS_STORE).delete(oldName);
  await tx.objectStore(DECKS_STORE).put({ name: newName, createdAt: Date.now() });
  await tx.done;
}

export async function deleteDeck(deckName: string) {
  const database = await getDB();
  const cards = await getCardsByDeck(deckName);
  const tx = database.transaction([CARDS_STORE, DECKS_STORE], "readwrite");
  for (const card of cards) {
    await tx.objectStore(CARDS_STORE).delete(card.id);
  }
  await tx.objectStore(DECKS_STORE).delete(deckName);
  await tx.done;
}

export async function exportDeckAsCSV(deckName: string): Promise<string> {
  const cards = await getCardsByDeck(deckName);
  const header = "Question,Answer\n";
  const rows = cards
    .map((c) => `"${c.question.replace(/"/g, '""')}","${c.answer.replace(/"/g, '""')}"`)
    .join("\n");
  return header + rows;
}
