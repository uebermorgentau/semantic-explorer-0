"use client";
import { Zap } from "lucide-react";
import { SelectionScope } from "@/lib/types";

interface Props {
  onApply: () => void;
  isLoading: boolean;
  scope: SelectionScope;
}

export default function BubbleToolbar({ onApply, isLoading, scope }: Props) {
  if (scope === "document") return null;

  return (
    <div className="flex items-center gap-px bg-[#111] border border-[#222] rounded-sm shadow-lg overflow-hidden">
      <button
        onClick={onApply}
        disabled={isLoading}
        className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] tracking-widest uppercase font-mono text-[#888] hover:text-[#e2e2e2] hover:bg-[#161616] transition-colors disabled:opacity-40"
      >
        <Zap className="w-2.5 h-2.5" />
        {isLoading ? "…" : "Transform"}
      </button>
    </div>
  );
}
