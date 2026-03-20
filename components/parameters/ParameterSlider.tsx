"use client";
import { Slider } from "@/components/ui/slider";
import { ParameterDef } from "@/lib/types";
import { LAYER_COLOR } from "@/lib/parameters";

interface Props {
  param: ParameterDef;
  value: number;
  onChange: (key: string, value: number) => void;
  actualValue?: number;
}

export default function ParameterSlider({ param, value, onChange, actualValue }: Props) {
  const color = LAYER_COLOR[param.layer];

  return (
    <div
      className="group"
      style={{ "--layer-color": color } as React.CSSProperties}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] tracking-widest uppercase text-[var(--c-tx-2)] font-mono">
          {param.label}
        </span>
        <span
          className="text-[10px] font-mono tabular-nums"
          style={{ color: value === 50 ? "var(--c-tx-1)" : color }}
        >
          {value}
        </span>
      </div>
      <div className="relative w-full">
        <Slider
          value={value}
          min={0}
          max={100}
          step={1}
          onValueChange={(v) => onChange(param.key, typeof v === "number" ? v : Array.isArray(v) ? v[0] : v)}
          className="w-full"
        />
        {actualValue !== undefined && (
          <div
            className="absolute pointer-events-none"
            style={{
              left: `calc(${actualValue}% - 1px)`,
              top: "50%",
              transform: "translateY(-50%)",
              width: "2px",
              height: "10px",
              background: "var(--c-ghost-marker)",
              borderRadius: "1px",
            }}
          />
        )}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[9px] text-[var(--c-tx-0)] font-mono">{param.leftLabel}</span>
        <span className="text-[9px] text-[var(--c-tx-0)] font-mono">{param.rightLabel}</span>
      </div>
    </div>
  );
}
