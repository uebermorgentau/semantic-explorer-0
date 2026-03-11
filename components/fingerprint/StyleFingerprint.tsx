"use client";
import { ScanLine, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import RadarChart from "./RadarChart";
import { FingerprintScores, ParameterState, FINGERPRINT_AXES } from "@/lib/types";

// Compute target polygon from current parameter state
function paramsToTarget(params: ParameterState): Record<string, number> {
  return {
    warmth: params.warmth,
    authority: params.authority,
    formality: params.formality,
    sentenceLength: params.sentenceLength,
    density: params.density,
    abstraction: params.abstraction,
    strategic: params.strategicOperational,
    analytical: params.analyticalNarrative,
  };
}

interface Props {
  scores: FingerprintScores | null;
  isLoading: boolean;
  isStale: boolean;
  error: string | null;
  onAnalyze: () => void;
  params: ParameterState;
}

export default function StyleFingerprint({
  scores,
  isLoading,
  isStale,
  error,
  onAnalyze,
  params,
}: Props) {
  const target = paramsToTarget(params);

  return (
    <div className="px-5 pb-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-[10px] tracking-widest uppercase font-mono text-[#4a4a4a]">
            Style Fingerprint
          </span>
          {isStale && (
            <span className="text-[9px] font-mono text-[#333]">stale</span>
          )}
        </div>
        <button
          onClick={onAnalyze}
          disabled={isLoading}
          className="flex items-center gap-1 text-[9px] font-mono text-[#333] hover:text-[#888] transition-colors disabled:opacity-30"
        >
          {isLoading ? (
            <RefreshCw className="w-2.5 h-2.5 animate-spin" />
          ) : (
            <ScanLine className="w-2.5 h-2.5" />
          )}
          {isLoading ? "Analyzing" : "Analyze"}
        </button>
      </div>

      {/* Radar */}
      <div className="aspect-square w-full">
        {!scores && !isLoading ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 border border-dashed border-[#1a1a1a] rounded-sm">
            <ScanLine className="w-4 h-4 text-[#222]" />
            <span className="text-[9px] font-mono text-[#222]">
              Analyze text to see fingerprint
            </span>
          </div>
        ) : (
          <RadarChart actual={scores} target={target} isStale={isStale} />
        )}
      </div>

      {error && (
        <p className="mt-2 text-[9px] font-mono text-red-800">{error}</p>
      )}

      {/* Legend */}
      <div className="mt-3 flex gap-4">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-px bg-[#7c6af5]" />
          <span className="text-[9px] font-mono text-[#333]">Actual</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-4 h-px"
            style={{
              background:
                "repeating-linear-gradient(90deg, #c9984a 0, #c9984a 2px, transparent 2px, transparent 5px)",
            }}
          />
          <span className="text-[9px] font-mono text-[#333]">Target</span>
        </div>
      </div>
    </div>
  );
}
