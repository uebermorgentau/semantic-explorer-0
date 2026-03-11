import { ParameterDef, ParameterState } from "./types";

export const DEFAULT_PARAMETERS: ParameterState = {
  warmth: 50,
  authority: 50,
  energy: 50,
  formality: 50,
  optimism: 50,
  confidence: 50,
  sentenceLength: 50,
  rhythm: 50,
  density: 50,
  directness: 50,
  abstraction: 50,
  strategicOperational: 50,
  analyticalNarrative: 50,
  firstPrinciples: 50,
};

export const PARAMETERS: ParameterDef[] = [
  // Tone
  { key: "warmth", label: "Warmth", layer: "tone", leftLabel: "Cold", rightLabel: "Warm" },
  { key: "authority", label: "Authority", layer: "tone", leftLabel: "Tentative", rightLabel: "Commanding" },
  { key: "energy", label: "Energy", layer: "tone", leftLabel: "Subdued", rightLabel: "Energetic" },
  { key: "formality", label: "Formality", layer: "tone", leftLabel: "Casual", rightLabel: "Formal" },
  { key: "optimism", label: "Optimism", layer: "tone", leftLabel: "Realist", rightLabel: "Optimist" },
  { key: "confidence", label: "Confidence", layer: "tone", leftLabel: "Hedged", rightLabel: "Confident" },
  // Structure
  { key: "sentenceLength", label: "Sentence Length", layer: "structure", leftLabel: "Short", rightLabel: "Long" },
  { key: "rhythm", label: "Rhythm", layer: "structure", leftLabel: "Staccato", rightLabel: "Flowing" },
  { key: "density", label: "Density", layer: "structure", leftLabel: "Airy", rightLabel: "Dense" },
  { key: "directness", label: "Directness", layer: "structure", leftLabel: "Elaborate", rightLabel: "Direct" },
  // Conceptual
  { key: "abstraction", label: "Abstraction", layer: "conceptual", leftLabel: "Concrete", rightLabel: "Abstract" },
  { key: "strategicOperational", label: "Strategic / Operational", layer: "conceptual", leftLabel: "Operational", rightLabel: "Strategic" },
  { key: "analyticalNarrative", label: "Analytical / Narrative", layer: "conceptual", leftLabel: "Narrative", rightLabel: "Analytical" },
  { key: "firstPrinciples", label: "First Principles", layer: "conceptual", leftLabel: "Applied", rightLabel: "Foundational" },
];

export const LAYER_PARAMS: Record<string, ParameterDef[]> = {
  tone: PARAMETERS.filter((p) => p.layer === "tone"),
  structure: PARAMETERS.filter((p) => p.layer === "structure"),
  conceptual: PARAMETERS.filter((p) => p.layer === "conceptual"),
};

export const LAYER_COLOR: Record<string, string> = {
  tone: "#c9984a",
  structure: "#5a6a7e",
  conceptual: "#7c6af5",
};

export const LAYER_LABEL: Record<string, string> = {
  tone: "Tone",
  structure: "Structure",
  conceptual: "Conceptual",
};
