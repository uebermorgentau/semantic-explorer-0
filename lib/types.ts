// ─────────────────────────────────────────────
// Parameter types
// ─────────────────────────────────────────────

export type LayerKey = "tone" | "structure" | "conceptual";

export interface ParameterDef {
  key: keyof ParameterState;
  label: string;
  layer: LayerKey;
  leftLabel: string;
  rightLabel: string;
}

export interface ParameterState {
  // Tone
  warmth: number;
  authority: number;
  energy: number;
  formality: number;
  optimism: number;
  confidence: number;
  // Structure
  sentenceLength: number;
  rhythm: number;
  density: number;
  directness: number;
  // Conceptual
  abstraction: number;
  strategicOperational: number;
  analyticalNarrative: number;
  firstPrinciples: number;
}

// ─────────────────────────────────────────────
// Selection / scope
// ─────────────────────────────────────────────

export type SelectionScope = "document" | "selection";

export interface EditorSelection {
  scope: SelectionScope;
  text: string;
  isEmpty: boolean;
}

// ─────────────────────────────────────────────
// Transform
// ─────────────────────────────────────────────

export interface TransformRequest {
  text: string;
  scope: SelectionScope;
  parameters: ParameterState;
}

export interface TransformResult {
  text: string;
}

// ─────────────────────────────────────────────
// Versions
// ─────────────────────────────────────────────

export interface Version {
  id: string;
  timestamp: number;
  html: string;
  params: ParameterState;
  label: string;
}

// ─────────────────────────────────────────────
// Transform Layers (non-linear history)
// ─────────────────────────────────────────────

export interface Layer {
  id: string;
  timestamp: number;
  label: string;           // auto-generated from top deviating params
  params: ParameterState;  // slider values at transform time
  scope: SelectionScope;
  fromHTML: string;        // editor state BEFORE transform
  toHTML: string;          // editor state AFTER transform
  isActive: boolean;       // currently shown?
  selectionWordCount?: number;
}

// ─────────────────────────────────────────────
// Document workspace
// ─────────────────────────────────────────────

export interface Doc {
  id: string;
  name: string;
  updatedAt: number;
  html: string;
  params: ParameterState;
  layers: Layer[];
}

// ─────────────────────────────────────────────
// Fingerprint
// ─────────────────────────────────────────────

export interface FingerprintScores {
  warmth: number;
  authority: number;
  formality: number;
  sentenceLength: number;
  density: number;
  abstraction: number;
  strategic: number;
  analytical: number;
  [key: string]: number;
}

export const FINGERPRINT_AXES: Array<{
  key: keyof FingerprintScores;
  label: string;
}> = [
  { key: "warmth", label: "Warmth" },
  { key: "authority", label: "Authority" },
  { key: "formality", label: "Formality" },
  { key: "sentenceLength", label: "Length" },
  { key: "density", label: "Density" },
  { key: "abstraction", label: "Abstract" },
  { key: "strategic", label: "Strategic" },
  { key: "analytical", label: "Analytical" },
];
