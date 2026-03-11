import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildTransformPrompt, computeTemperature } from "@/lib/prompts";
import { TransformRequest } from "@/lib/types";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as TransformRequest;
    const { text, scope, parameters } = body;

    if (!text?.trim()) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const { system, user } = buildTransformPrompt(text, scope, parameters);
    const temperature = computeTemperature(parameters);

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      temperature,
      system,
      messages: [{ role: "user", content: user }],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type");
    }

    return NextResponse.json({ text: content.text.trim() });
  } catch (err) {
    console.error("[transform]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Transform failed" },
      { status: 500 }
    );
  }
}
