"use client";
import { SelectionScope } from "@/lib/types";

interface Props {
  scope: SelectionScope;
  onChange: (scope: SelectionScope) => void;
  hasSelection: boolean;
}

const SCOPES: { key: SelectionScope; label: string }[] = [
  { key: "document", label: "Doc" },
  { key: "paragraph", label: "Para" },
  { key: "sentence", label: "Sent" },
  { key: "words", label: "Words" },
];

export default function ScopeSelector({ scope, onChange, hasSelection }: Props) {
  return (
    <div className="flex gap-px">
      {SCOPES.map(({ key, label }) => {
        const active = scope === key;
        const needsSelection = key !== "document";
        const disabled = needsSelection && !hasSelection;
        return (
          <button
            key={key}
            onClick={() => !disabled && onChange(key)}
            disabled={disabled}
            className={`
              flex-1 text-[9px] tracking-widest uppercase font-mono py-1.5 px-1
              border transition-colors duration-100
              ${active
                ? "border-[#333] text-[#e2e2e2] bg-[#161616]"
                : "border-transparent text-[#333] hover:text-[#666]"
              }
              ${disabled ? "opacity-20 cursor-not-allowed" : "cursor-pointer"}
            `}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
