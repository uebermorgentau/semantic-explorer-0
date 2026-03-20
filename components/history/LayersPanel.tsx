"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Layers, RotateCcw, RefreshCw, Trash2 } from "lucide-react";
import { Layer } from "@/lib/types";
import { Separator } from "@/components/ui/separator";

interface Props {
  layers: Layer[];
  onToggle: (id: string) => void;
  onReapply: (layer: Layer) => void;
  onClear: () => void;
  isReapplying: string | null; // layer id being reapplied
}

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ago`;
}

export default function LayersPanel({
  layers,
  onToggle,
  onReapply,
  onClear,
  isReapplying,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.2 }}
      className="h-full flex flex-col border-r border-[var(--c-border-2)] bg-[var(--c-bg)] w-[260px]"
    >
      <div className="px-5 py-4 flex items-center justify-between border-b border-[var(--c-border-1)]">
        <span className="text-[10px] tracking-widest uppercase font-mono text-[var(--c-tx-2)]">
          Transforms
        </span>
        {layers.length > 0 && (
          <button
            onClick={onClear}
            className="text-[9px] font-mono text-[var(--c-tx-0)] hover:text-[var(--c-tx-3)] flex items-center gap-1 transition-colors"
          >
            <Trash2 className="w-2.5 h-2.5" />
            clear
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {layers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2">
            <Layers className="w-4 h-4 text-[var(--c-border-2)]" />
            <span className="text-[9px] font-mono text-[var(--c-tx-0)]">No transforms yet</span>
          </div>
        ) : (
          <>
            {/* Explanation */}
            <div className="px-5 py-3 border-b border-[var(--c-border-0)]">
              <p className="text-[9px] font-mono text-[var(--c-tx-0)] leading-relaxed">
                Toggle to preview without a transform. Re-apply runs its recipe against the current text.
              </p>
            </div>

            {layers.map((layer, i) => (
              <div key={layer.id}>
                <div className="px-5 py-3 group">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <span
                        className={`text-[11px] font-mono block truncate transition-colors ${
                          layer.isActive ? "text-[var(--c-tx-5)]" : "text-[var(--c-tx-1)] line-through"
                        }`}
                      >
                        {layer.label}
                      </span>
                      <span className="text-[9px] font-mono text-[var(--c-tx-0)]">
                        {timeAgo(layer.timestamp)}
                        {layer.scope === "selection" && layer.selectionWordCount
                          ? ` · ${layer.selectionWordCount}w`
                          : ""}
                      </span>
                    </div>

                    {/* Toggle switch */}
                    <button
                      onClick={() => onToggle(layer.id)}
                      className={`w-7 h-4 rounded-sm flex-shrink-0 relative transition-colors mt-0.5 ${
                        layer.isActive ? "bg-[#7c6af5]" : "bg-[var(--c-border-3)]"
                      }`}
                      title={layer.isActive ? "Toggle off (revert)" : "Toggle on (restore)"}
                    >
                      <span
                        className={`absolute top-0.5 w-3 h-3 rounded-sm bg-white transition-transform ${
                          layer.isActive ? "translate-x-3.5" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Re-apply button */}
                  <button
                    onClick={() => onReapply(layer)}
                    disabled={isReapplying === layer.id}
                    className="flex items-center gap-1 text-[9px] font-mono text-[var(--c-tx-0)] hover:text-[var(--c-tx-4)] transition-colors disabled:opacity-30"
                  >
                    {isReapplying === layer.id ? (
                      <RefreshCw className="w-2 h-2 animate-spin" />
                    ) : (
                      <RotateCcw className="w-2 h-2" />
                    )}
                    Re-apply recipe
                  </button>
                </div>
                {i < layers.length - 1 && <Separator className="bg-[var(--c-deep)]" />}
              </div>
            ))}
          </>
        )}
      </div>
    </motion.div>
  );
}
