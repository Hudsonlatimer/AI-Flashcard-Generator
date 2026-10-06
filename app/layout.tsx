import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Recall — AI Flashcard Generator",
  description: "Generate spaced-repetition flashcards from any study text using Claude AI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
