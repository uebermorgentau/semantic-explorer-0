# Parametric Writing Interface — Product Requirements Document

---

## Summary

A writing tool that treats text as a design surface. Instead of rewriting manually, users adjust parametric sliders that describe the stylistic and conceptual dimensions of their writing — tone, structure, abstraction, rhythm — and AI transforms the text accordingly. A style fingerprint radar visualizes where the text currently sits across those dimensions, and version history lets users branch, compare, and restore previous states.

This is not an editor. It is a **thinking sandbox for shaping ideas through language**.

---

## Vision

Writing tools have barely evolved since the 1970s. Most editors assume writing is a linear process:

> characters → words → sentences → document

But writing is rarely linear. Writing is **externalized thinking**.

Traditional tools only capture the **final artifact**, not the **process of shaping ideas**.

At the same time, modern language models represent text in high-dimensional semantic spaces — where meaning, tone, and structure exist as coordinates in a conceptual landscape.

This project explores a new type of interface:

> **Treat writing like a design surface rather than static text.**

Instead of rewriting blocks of text, users can **inspect, manipulate, and sculpt writing across multiple dimensions** — the way a designer adjusts parameters in a generative tool, or a producer mixes audio across a board.

---

## Design Philosophy

- Writing is not just communication. Writing is a **medium for thinking**.
- Current tools treat text as a **finished artifact**. This system treats it as a **living design object**.
- The interface should feel like **Figma for language** — precise, minimal, and deeply controllable.
- Every interaction should expose something about the text that was previously invisible.

---

## Goals

### Core Goal

Enable nuanced manipulation of text using AI through a multidimensional parametric interface.

### Key Objectives

1. **Make writing sculptable** — adjust tone, structure, and meaning through parameters rather than rewriting.
2. **Expose layers of language** — let users interact with text across multiple conceptual dimensions simultaneously.
3. **Turn writing into a design space** — treat text like parametric design, not a static artifact.
4. **Support thinking, not just editing** — enable exploration of ideas and stylistic directions.
5. **Make differences between versions visible** — help users see and understand how ideas evolve.

---

## Users

**Primary:** Writers, strategists, researchers, founders, and thinkers who treat writing as a core part of their work — not just communication, but reasoning.

**Secondary:** Anyone iterating on high-stakes prose: essays, memos, pitches, documentation, creative nonfiction.

**Not:** Casual email users, content marketers looking for bulk generation, or users who want AI to write for them.

---

## Core Features

### 1. Writing Surface

A minimal, distraction-free prose editor (Tiptap).

- Write and paste text normally
- No formatting toolbar
- Focus entirely on content and ideas
- Placeholder: "Start writing…"

---

### 2. Parametric Control Panel

A collapsible right panel with 14 sliders organized across 3 layers.

Each slider maps a stylistic dimension from one extreme to another. Sliders default to neutral (50). Moving a slider away from neutral encodes an intent that gets translated into Claude's transformation prompt.

**Layer 1 — Tone** (6 parameters)
| Parameter | Left | Right |
|---|---|---|
| Warmth | Cold | Warm |
| Authority | Tentative | Commanding |
| Energy | Subdued | Energetic |
| Formality | Casual | Formal |
| Optimism | Realist | Optimist |
| Confidence | Hedged | Confident |

**Layer 2 — Structure** (4 parameters)
| Parameter | Left | Right |
|---|---|---|
| Sentence Length | Short | Long |
| Rhythm | Staccato | Flowing |
| Density | Airy | Dense |
| Directness | Elaborate | Direct |

**Layer 3 — Conceptual** (4 parameters)
| Parameter | Left | Right |
|---|---|---|
| Abstraction | Concrete | Abstract |
| Strategic / Operational | Operational | Strategic |
| Analytical / Narrative | Narrative | Analytical |
| First Principles | Applied | Foundational |

Each layer has a distinct accent color: **muted gold** (Tone), **cool zinc** (Structure), **restrained violet** (Conceptual). Active parameters (deviated from 50) are counted and shown in the layer header.

---

### 3. AI Transformation

When the user clicks **Apply**, the selected text (or full document) is sent to Claude along with a natural-language instruction block derived from the current slider positions.

**How it works:**
- Sliders in the neutral range (38–62) are silently omitted from the prompt
- Active sliders are translated into prose directives using a 5-band vocabulary (very low / low / neutral / high / very high)
- Temperature is computed dynamically from how extreme the average slider deviation is (range: 0.4–0.85)
- Result is shown as a **preview** before the user commits — not applied immediately

**Scope options:**
- **Document** — transforms the full text
- **Selection** — transforms only highlighted text, replaces inline

The preview-before-commit pattern is intentional. It removes anxiety from experimentation and makes the tool feel like a collaborator, not an autocomplete.

---

### 4. Style Fingerprint

A radar chart (spider chart) showing the current text's position across 8 stylistic dimensions:

> Warmth · Authority · Formality · Sentence Length · Density · Abstraction · Strategic · Analytical

**Dual polygon visualization:**
- **Actual** (violet, solid) — computed by Claude analyzing the current text
- **Target** (amber, dashed) — computed directly from the current slider values (no API call)

The gap between the two polygons is the core signal: it shows how far the current text is from where the sliders are pointing. This makes the fingerprint a live diagnostic, not just a readout.

The "Analyze" button triggers the actual API call. The target polygon updates live as sliders move.

---

### 5. Version History

Every transform auto-saves a version before applying. Users can also save versions manually.

**Capabilities:**
- Browse saved versions in a slide-out left panel
- Restore any previous version
- Compare any version to the current text side-by-side
- Word-level diff with removed words struck through and added words highlighted in violet

Versions are stored in `localStorage`. Cap: 50 versions.

---

### 6. Keyboard Shortcuts

| Action | Shortcut |
|---|---|
| Apply transform | `Cmd + Enter` |
| Discard preview | `Esc` |

---

## UX Principles

- **Preview before commit.** Transformations are shown as a preview block with Accept / Discard. Never applied blindly.
- **Auto-save before every transform.** The user can always go back.
- **Sliders are not bureaucratic.** The panel should feel responsive and live, not like a settings menu.
- **Only active parameters go into the prompt.** Neutral sliders don't add noise. The prompt stays concise and directive.
- **The fingerprint shows a gap, not a score.** The point is to see the distance between intention (sliders) and reality (text), not to grade the writing.

---

## Visual Design

**Reference aesthetic:** Linear, Cursor, Figma, Luma.ai, RunwayML — Swiss grid, ultra-minimal, monochromatic.

**Rules:**
- Dark background: `#080808`
- No rounded corners beyond 2px
- No shadows, no gradients, no blur backgrounds
- 1px borders everywhere
- 8px spacing grid throughout
- Labels in `10px UPPERCASE MONO` — like Linear's sidebar
- Ghost/outline buttons only — except the primary Apply CTA
- Layer accent colors are muted, not loud: gold, zinc, violet

**Typography:** Geist Sans for prose, Geist Mono for all UI chrome.

---

## Technical Architecture

| Concern | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| UI Components | shadcn/ui (base-ui primitives) |
| Animation | Framer Motion |
| Editor | Tiptap (StarterKit + Placeholder) |
| AI | Anthropic Claude (claude-sonnet-4-6) |
| Persistence | localStorage |
| Hosting | Vercel-ready |

**AI endpoints:**
- `POST /api/transform` — text transformation with parameter-to-prose prompt builder
- `POST /api/fingerprint` — 8-dimension style analysis, returns JSON scores

---

## Out of Scope (v1)

- Real-time collaboration
- Cloud persistence / accounts
- Mobile layout
- Sentence/paragraph-level auto-detection (scope is user-selected)
- Streaming responses
- Export / publish
- Custom persona or voice training

---

## Future Directions

- **Semantic map of ideas** — visualize the conceptual landscape of a text as a node graph
- **Conceptual distance** — show how far variants drift from the original idea
- **Thought evolution** — animate how ideas change across versions
- **Style presets** — save named slider configurations (e.g., "Board memo", "Startup pitch", "Personal essay")
- **Sentence-level fingerprinting** — show which sentences pull the text toward or away from the target
- **Voice calibration** — analyze a reference text to set the target automatically
