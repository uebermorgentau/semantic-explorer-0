"use client";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

interface Props {
  previewText: string;
  onAccept: () => void;
  onDiscard: () => void;
}

export default function TransformPreview({ previewText, onAccept, onDiscard }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      className="border border-[#1f1f1f] bg-[#0a0a0a] rounded-sm overflow-hidden"
    >
      <div className="px-4 py-2 border-b border-[#1a1a1a] flex items-center justify-between">
        <span className="text-[9px] tracking-widest uppercase font-mono text-[#7c6af5]">
          Preview
        </span>
        <div className="flex gap-1">
          <button
            onClick={onDiscard}
            className="flex items-center gap-1 px-2 py-1 text-[9px] font-mono text-[#333] hover:text-[#888] border border-transparent hover:border-[#222] rounded-sm transition-colors"
          >
            <X className="w-2.5 h-2.5" />
            Discard
          </button>
          <button
            onClick={onAccept}
            className="flex items-center gap-1 px-2 py-1 text-[9px] font-mono text-[#e2e2e2] bg-[#161616] hover:bg-[#1f1f1f] border border-[#222] rounded-sm transition-colors"
          >
            <Check className="w-2.5 h-2.5" />
            Accept
          </button>
        </div>
      </div>
      <div className="px-4 py-3">
        <p className="text-sm text-[#aaa] leading-relaxed whitespace-pre-wrap font-sans">
          {previewText}
        </p>
      </div>
    </motion.div>
  );
}
