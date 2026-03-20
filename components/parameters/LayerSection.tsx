"use client";
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import ParameterSlider from "./ParameterSlider";
import { ParameterDef, ParameterState } from "@/lib/types";
import { LAYER_COLOR } from "@/lib/parameters";

interface Props {
  layerKey: string;
  label: string;
  params: ParameterDef[];
  values: ParameterState;
  onChange: (key: keyof ParameterState, value: number) => void;
  defaultOpen?: boolean;
  fingerprint?: Partial<Record<keyof ParameterState, number>>;
}

export default function LayerSection({
  layerKey,
  label,
  params,
  values,
  onChange,
  defaultOpen = true,
  fingerprint,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const color = LAYER_COLOR[layerKey];

  const activeCount = params.filter((p) => Math.abs(values[p.key] - 50) > 12).length;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="w-full flex items-center justify-between py-3 group cursor-pointer">
        <div className="flex items-center gap-2">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: color }}
          />
          <span className="text-[10px] tracking-widest uppercase font-mono text-[var(--c-tx-5)]">
            {label}
          </span>
          {activeCount > 0 && (
            <span
              className="text-[9px] font-mono px-1 rounded-sm"
              style={{ color, background: `${color}18` }}
            >
              {activeCount}
            </span>
          )}
        </div>
        <ChevronRight
          className="w-3 h-3 text-[var(--c-tx-1)] transition-transform duration-200"
          style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-5 pb-4"
            >
              {params.map((param) => (
                <ParameterSlider
                  key={param.key}
                  param={param}
                  value={values[param.key]}
                  onChange={(key, val) =>
                    onChange(key as keyof ParameterState, val)
                  }
                  actualValue={fingerprint?.[param.key]}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </CollapsibleContent>
    </Collapsible>
  );
}
