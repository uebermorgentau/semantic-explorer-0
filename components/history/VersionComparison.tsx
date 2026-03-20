"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Version } from "@/lib/types";

interface Props {
  currentHTML: string;
  compareVersion: Version | null;
  onClose: () => void;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

// Simple word-level diff
type DiffToken = { text: string; type: "same" | "added" | "removed" };

function wordDiff(a: string, b: string): { left: DiffToken[]; right: DiffToken[] } {
  const aWords = a.split(/(\s+)/);
  const bWords = b.split(/(\s+)/);

  // LCS-based diff (simplified — treats each word as a token)
  const aSet = new Set(aWords);
  const bSet = new Set(bWords);

  const left: DiffToken[] = aWords.map((w) => ({
    text: w,
    type: bSet.has(w) ? "same" : "removed",
  }));

  const right: DiffToken[] = bWords.map((w) => ({
    text: w,
    type: aSet.has(w) ? "same" : "added",
  }));

  return { left, right };
}

function DiffView({ tokens }: { tokens: DiffToken[] }) {
  return (
    <p className="text-sm leading-relaxed font-sans text-[var(--c-tx-5)]">
      {tokens.map((t, i) => (
        <span
          key={i}
          className={
            t.type === "removed"
              ? "text-red-900 line-through"
              : t.type === "added"
              ? "text-[#7c6af5]"
              : ""
          }
        >
          {t.text}
        </span>
      ))}
    </p>
  );
}

export default function VersionComparison({
  currentHTML,
  compareVersion,
  onClose,
}: Props) {
  if (!compareVersion) return null;

  const currentText = stripHtml(currentHTML);
  const compareText = stripHtml(compareVersion.html);
  const { left, right } = wordDiff(compareText, currentText);

  return (
    <Dialog open={!!compareVersion} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl w-[90vw] bg-[var(--c-bg)] border border-[var(--c-border-2)] rounded-sm p-0">
        <DialogHeader className="px-6 py-4 border-b border-[var(--c-border-1)]">
          <DialogTitle className="text-[10px] tracking-widest uppercase font-mono text-[var(--c-tx-2)]">
            Compare
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 divide-x divide-[var(--c-border-1)] max-h-[70vh] overflow-auto">
          <div className="p-8">
            <p className="text-[9px] tracking-widest uppercase font-mono text-[var(--c-tx-1)] mb-4">
              {compareVersion.label}
            </p>
            <DiffView tokens={left} />
          </div>
          <div className="p-8">
            <p className="text-[9px] tracking-widest uppercase font-mono text-[#7c6af5] mb-4">
              Current
            </p>
            <DiffView tokens={right} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
