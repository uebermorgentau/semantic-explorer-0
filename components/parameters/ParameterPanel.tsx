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
  fingerprint?: Partial<Record<keyof ParameterState, number>>;
  onAnalyze: () => void;
  onCalibrate: () => void;
  isAnalyzing: boolean;
  isCalibrating: boolean;
  isStale: boolean;
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
  fingerprint,
  onAnalyze,
  onCalibrate,
  isAnalyzing,
  isCalibrating,
  isStale,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="h-full flex flex-col bg-[var(--c-bg)]"
    >
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-[var(--c-border-1)]">
        <span className="text-[10px] tracking-widest uppercase font-mono text-[var(--c-tx-2)]">
          Parameters
        </span>
        {hasChangedFromDefault && (
          <button
            onClick={onReset}
            className="text-[9px] font-mono text-[var(--c-tx-1)] hover:text-[var(--c-tx-4)] flex items-center gap-1 transition-colors"
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
              fingerprint={fingerprint}
            />
            {i < LAYERS.length - 1 && <Separator className="bg-[var(--c-border-1)]" />}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-[var(--c-border-1)] space-y-2">
        {/* Analyze / Calibrate */}
        <div className="flex gap-1.5">
          <button
            onClick={onAnalyze}
            disabled={isAnalyzing || isCalibrating}
            className="flex-1 h-6 text-[9px] font-mono border border-[var(--c-border-2)] text-[var(--c-tx-1)] hover:text-[var(--c-tx-5)] hover:border-[var(--c-tx-1)] transition-colors disabled:opacity-30 rounded-sm"
          >
            {isAnalyzing ? "…" : isStale && fingerprint ? "Analyze*" : "Analyze"}
          </button>
          <button
            onClick={onCalibrate}
            disabled={isAnalyzing || isCalibrating}
            className="flex-1 h-6 text-[9px] font-mono border border-[var(--c-border-2)] text-[var(--c-tx-1)] hover:text-[var(--c-tx-5)] hover:border-[var(--c-tx-1)] transition-colors disabled:opacity-30 rounded-sm"
          >
            {isCalibrating ? "…" : "Calibrate"}
          </button>
        </div>

        {/* Scope context */}
        <p className="text-[9px] font-mono text-[var(--c-tx-1)]">
          {hasSelection
            ? `↳ Selection · ${selectionWordCount} word${selectionWordCount !== 1 ? "s" : ""}`
            : "↳ Full document"}
        </p>

        <Button
          onClick={onApply}
          disabled={isLoading}
          className="w-full h-8 text-[10px] tracking-widest uppercase font-mono bg-[var(--c-btn-bg)] text-[var(--c-btn-fg)] hover:bg-[var(--c-btn-hover)] rounded-sm transition-colors"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-[var(--c-btn-fg)] animate-pulse" />
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
