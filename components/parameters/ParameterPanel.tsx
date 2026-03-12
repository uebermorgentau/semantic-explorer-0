"use client";
import { RotateCcw } from "lucide-react";
import { motion } from "framer-motion";
import LayerSection from "./LayerSection";
import { ParameterState } from "@/lib/types";
import { LAYER_PARAMS, LAYER_LABEL } from "@/lib/parameters";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface Props {
  params: ParameterState;
  onParamChange: (key: keyof ParameterState, value: number) => void;
  onReset: () => void;
  hasChangedFromDefault: boolean;
  hasSelection: boolean;
  selectionWordCount: number;
  onApply: () => void;
  isLoading: boolean;
}

const LAYERS = ["tone", "structure", "conceptual"] as const;

export default function ParameterPanel({
  params,
  onParamChange,
  onReset,
  hasChangedFromDefault,
  hasSelection,
  selectionWordCount,
  onApply,
  isLoading,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="h-full flex flex-col border-l border-[#1f1f1f] bg-[#080808]"
    >
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-[#1a1a1a]">
        <span className="text-[10px] tracking-widest uppercase font-mono text-[#4a4a4a]">
          Parameters
        </span>
        {hasChangedFromDefault && (
          <button
            onClick={onReset}
            className="text-[9px] font-mono text-[#333] hover:text-[#666] flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-2.5 h-2.5" />
            reset
          </button>
        )}
      </div>

      {/* Layers */}
      <div className="flex-1 overflow-y-auto px-5">
        {LAYERS.map((layerKey, i) => (
          <div key={layerKey}>
            <LayerSection
              layerKey={layerKey}
              label={LAYER_LABEL[layerKey]}
              params={LAYER_PARAMS[layerKey]}
              values={params}
              onChange={onParamChange}
              defaultOpen={i === 0}
            />
            {i < LAYERS.length - 1 && <Separator className="bg-[#1a1a1a]" />}
          </div>
        ))}
      </div>

      {/* Apply footer */}
      <div className="px-5 py-4 border-t border-[#1a1a1a] space-y-2">
        {/* Scope context — auto-detected */}
        <p className="text-[9px] font-mono text-[#333]">
          {hasSelection
            ? `↳ Selection · ${selectionWordCount} word${selectionWordCount !== 1 ? "s" : ""}`
            : "↳ Full document"}
        </p>
        <Button
          onClick={onApply}
          disabled={isLoading}
          className="w-full h-8 text-[10px] tracking-widest uppercase font-mono bg-[#e2e2e2] text-[#080808] hover:bg-white rounded-sm transition-colors"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-[#080808] animate-pulse" />
              Transforming
            </span>
          ) : (
            "Apply"
          )}
        </Button>
      </div>
    </motion.div>
  );
}
