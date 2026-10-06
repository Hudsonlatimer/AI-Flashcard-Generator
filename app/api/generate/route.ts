import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { DeckResponseSchema } from "@/lib/schema";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === "your_api_key_here") {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY is not configured." }, { status: 500 });
  }

  const body = await req.json();
  const { text, count = 10 } = body as { text: string; count?: number };

  if (!text || text.trim().length < 10) {
    return NextResponse.json({ error: "Study text is too short." }, { status: 400 });
  }

  const cardCount = Math.min(Math.max(5, count), 20);

  const message = await client.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 4096,
    system: `You are a flashcard generator. Given study text, produce exactly ${cardCount} concise Q&A flashcards as a JSON object.

Return ONLY valid JSON matching this schema — no markdown fences, no prose:
{
  "cards": [
    { "question": "...", "answer": "..." }
  ]
}

Rules:
- Each question tests one specific fact or concept
- Answers are short and precise (1-3 sentences max)
- No duplicate questions
- Cover the most important concepts in the text`,
    messages: [
      {
        role: "user",
        content: `Generate ${cardCount} flashcards from this text:\n\n${text}`,
      },
    ],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text : "";

  let parsed;
  try {
    const json = JSON.parse(raw);
    parsed = DeckResponseSchema.parse(json);
  } catch {
    return NextResponse.json(
      { error: "Claude returned an invalid response. Please try again." },
      { status: 502 }
    );
  }

  return NextResponse.json(parsed);
}
