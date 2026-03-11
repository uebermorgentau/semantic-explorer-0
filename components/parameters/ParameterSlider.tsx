"use client";
import { Slider } from "@/components/ui/slider";
import { ParameterDef } from "@/lib/types";
import { LAYER_COLOR } from "@/lib/parameters";

interface Props {
  param: ParameterDef;
  value: number;
  onChange: (key: string, value: number) => void;
}

export default function ParameterSlider({ param, value, onChange }: Props) {
  const color = LAYER_COLOR[param.layer];

  return (
    <div
      className="group"
      style={{ "--layer-color": color } as React.CSSProperties}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] tracking-widest uppercase text-[#4a4a4a] font-mono">
          {param.label}
        </span>
        <span
          className="text-[10px] font-mono tabular-nums"
          style={{ color: value === 50 ? "#333" : color }}
        >
          {value}
        </span>
      </div>
      <Slider
        value={value}
        min={0}
        max={100}
        step={1}
        onValueChange={(v) => onChange(param.key, typeof v === "number" ? v : Array.isArray(v) ? v[0] : v)}
        className="w-full"
      />
      <div className="flex justify-between mt-1">
        <span className="text-[9px] text-[#2a2a2a] font-mono">{param.leftLabel}</span>
        <span className="text-[9px] text-[#2a2a2a] font-mono">{param.rightLabel}</span>
      </div>
    </div>
  );
}
