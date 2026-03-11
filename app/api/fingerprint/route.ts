import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildFingerprintPrompt } from "@/lib/prompts";
import { FingerprintScores } from "@/lib/types";

const client = new Anthropic();

const REQUIRED_KEYS: (keyof FingerprintScores)[] = [
  "warmth", "authority", "formality", "sentenceLength",
  "density", "abstraction", "strategic", "analytical",
];

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text?.trim()) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 256,
      system: buildFingerprintPrompt(),
      messages: [{ role: "user", content: text }],
    });

    const content = message.content[0];
    if (content.type !== "text") throw new Error("Unexpected response type");

    // Extract JSON from response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    const scores = JSON.parse(jsonMatch[0]) as FingerprintScores;

    // Validate and clamp all keys
    const validated: FingerprintScores = {} as FingerprintScores;
    for (const key of REQUIRED_KEYS) {
      const val = Number(scores[key]);
      validated[key] = isNaN(val) ? 50 : Math.max(0, Math.min(100, val));
    }

    return NextResponse.json(validated);
  } catch (err) {
    console.error("[fingerprint]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Analysis failed" },
      { status: 500 }
    );
  }
}
