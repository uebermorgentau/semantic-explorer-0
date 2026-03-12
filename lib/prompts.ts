import { ParameterState, SelectionScope } from "./types";

// ─────────────────────────────────────────────
// Band descriptors — only non-neutral values appear in prompts
// ─────────────────────────────────────────────

type Band = { veryLow: string; low: string; high: string; veryHigh: string };

const DESCRIPTORS: Record<keyof ParameterState, Band> = {
  warmth: {
    veryLow: "Be very cold and clinical — no warmth or personal connection.",
    low: "Keep a cool, impersonal tone.",
    high: "Be warm and personable — make it feel human and approachable.",
    veryHigh: "Be very warm, intimate, and deeply personal.",
  },
  authority: {
    veryLow: "Sound tentative and uncertain — use hedging language.",
    low: "Sound modest and deferential.",
    high: "Sound confident and authoritative.",
    veryHigh: "Sound commanding and definitive — no hedging whatsoever.",
  },
  energy: {
    veryLow: "Write in a calm, subdued, understated manner.",
    low: "Keep energy levels low and restrained.",
    high: "Write with energy and drive — make it feel alive.",
    veryHigh: "Write with intense energy and urgency.",
  },
  formality: {
    veryLow: "Write very casually — as if speaking to a friend.",
    low: "Keep it conversational and informal.",
    high: "Write formally and professionally.",
    veryHigh: "Write in a highly formal, academic register.",
  },
  optimism: {
    veryLow: "Take a realistic, even pessimistic framing.",
    low: "Lean slightly cautious and realistic.",
    high: "Frame things positively and with optimism.",
    veryHigh: "Be strongly optimistic and encouraging.",
  },
  confidence: {
    veryLow: "Use lots of hedging: 'perhaps', 'might', 'could be'.",
    low: "Hedge slightly — acknowledge uncertainty.",
    high: "Write with confidence and directness.",
    veryHigh: "Write with complete confidence — no qualifications.",
  },
  sentenceLength: {
    veryLow: "Use very short, punchy sentences. Fragment freely.",
    low: "Favor short, concise sentences.",
    high: "Use longer, more complex sentences.",
    veryHigh: "Use long, elaborate sentence structures with multiple clauses.",
  },
  rhythm: {
    veryLow: "Write in staccato bursts — short punchy rhythms.",
    low: "Keep rhythm choppy and percussive.",
    high: "Write with fluid, flowing rhythm.",
    veryHigh: "Write in long, wave-like rhythmic patterns.",
  },
  density: {
    veryLow: "Write sparingly — lots of white space and breathing room.",
    low: "Keep it light — don't pack too much in.",
    high: "Write densely — pack ideas tightly.",
    veryHigh: "Write very densely — maximum information per sentence.",
  },
  directness: {
    veryLow: "Elaborate extensively — be discursive and expansive.",
    low: "Allow for some elaboration and context.",
    high: "Be direct and to the point.",
    veryHigh: "Be extremely direct — cut all elaboration and get to the point immediately.",
  },
  abstraction: {
    veryLow: "Use only concrete, specific, tangible examples and details.",
    low: "Stay concrete and grounded — minimal abstraction.",
    high: "Think conceptually and abstractly.",
    veryHigh: "Write at a high level of abstraction — concepts over specifics.",
  },
  strategicOperational: {
    veryLow: "Focus on operational, tactical, day-to-day details.",
    low: "Stay operational and practical.",
    high: "Frame things strategically and at a high level.",
    veryHigh: "Think entirely in strategic, big-picture terms.",
  },
  analyticalNarrative: {
    veryLow: "Tell a story — use narrative, not analysis.",
    low: "Lean toward narrative flow over analysis.",
    high: "Be analytical — use logic, structure, and reasoning.",
    veryHigh: "Write in a rigorously analytical mode — structured reasoning throughout.",
  },
  firstPrinciples: {
    veryLow: "Focus on applied, practical knowledge — no first principles.",
    low: "Stay applied and pragmatic.",
    high: "Reason from first principles where possible.",
    veryHigh: "Derive everything from foundational principles — question all assumptions.",
  },
};

function getBand(value: number): keyof Band | null {
  if (value <= 20) return "veryLow";
  if (value <= 38) return "low";
  if (value <= 62) return null; // neutral — omit
  if (value <= 80) return "high";
  return "veryHigh";
}

// ─────────────────────────────────────────────
// Compute temperature from how extreme the params are
// ─────────────────────────────────────────────

export function computeTemperature(params: ParameterState): number {
  const values = Object.values(params) as number[];
  const avgDeviation =
    values.reduce((sum, v) => sum + Math.abs(v - 50), 0) / values.length;
  // 0 deviation → 0.4, 50 deviation → 0.85
  return 0.4 + (avgDeviation / 50) * 0.45;
}

// ─────────────────────────────────────────────
// Build the transform prompt
// ─────────────────────────────────────────────

export function buildTransformPrompt(
  text: string,
  scope: SelectionScope,
  params: ParameterState
): { system: string; user: string } {
  const toneLines: string[] = [];
  const structureLines: string[] = [];
  const conceptualLines: string[] = [];

  const toneKeys: (keyof ParameterState)[] = ["warmth", "authority", "energy", "formality", "optimism", "confidence"];
  const structureKeys: (keyof ParameterState)[] = ["sentenceLength", "rhythm", "density", "directness"];
  const conceptualKeys: (keyof ParameterState)[] = ["abstraction", "strategicOperational", "analyticalNarrative", "firstPrinciples"];

  for (const key of toneKeys) {
    const band = getBand(params[key]);
    if (band) toneLines.push(`- ${DESCRIPTORS[key][band]}`);
  }
  for (const key of structureKeys) {
    const band = getBand(params[key]);
    if (band) structureLines.push(`- ${DESCRIPTORS[key][band]}`);
  }
  for (const key of conceptualKeys) {
    const band = getBand(params[key]);
    if (band) conceptualLines.push(`- ${DESCRIPTORS[key][band]}`);
  }

  const sections: string[] = [];
  if (toneLines.length > 0) sections.push(`TONE:\n${toneLines.join("\n")}`);
  if (structureLines.length > 0) sections.push(`STRUCTURE:\n${structureLines.join("\n")}`);
  if (conceptualLines.length > 0) sections.push(`CONCEPTUAL:\n${conceptualLines.join("\n")}`);

  const instructionBlock =
    sections.length > 0
      ? sections.join("\n\n")
      : "No strong parameter preferences set — make minimal changes while preserving the original voice.";

  const scopeLabel =
    scope === "document" ? "the following text" : "the following selected text";

  const system = `You are a writing transformation engine. Rewrite ${scopeLabel} according to the parameters below.

${instructionBlock}

Rules:
- Preserve all core meaning and factual content
- Do not add new ideas not present in the original
- Return ONLY the rewritten text — no explanations, no quotes, no preamble`;

  return { system, user: text };
}

// ─────────────────────────────────────────────
// Build the fingerprint prompt
// ─────────────────────────────────────────────

export function buildFingerprintPrompt(): string {
  return `You are a writing analysis engine. Analyze the provided text and score it on 8 dimensions from 0 to 100.

Return ONLY a valid JSON object with exactly these keys and integer values 0-100:
{
  "warmth": ...,
  "authority": ...,
  "formality": ...,
  "sentenceLength": ...,
  "density": ...,
  "abstraction": ...,
  "strategic": ...,
  "analytical": ...
}

Scoring guide:
- warmth: 0 = cold/clinical, 100 = warm/intimate
- authority: 0 = tentative/hedged, 100 = commanding/definitive
- formality: 0 = casual speech, 100 = formal academic
- sentenceLength: 0 = very short sentences, 100 = long complex sentences
- density: 0 = sparse/airy, 100 = dense/information-rich
- abstraction: 0 = concrete/specific, 100 = abstract/theoretical
- strategic: 0 = operational/tactical, 100 = strategic/big-picture
- analytical: 0 = narrative/intuitive, 100 = analytical/logical

No other output. No markdown. No explanation.`;
}
