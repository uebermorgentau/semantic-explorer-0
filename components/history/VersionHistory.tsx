"use client";
import { motion } from "framer-motion";
import { Clock, RotateCcw, Columns2, Trash2 } from "lucide-react";
import { Version } from "@/lib/types";
import { Separator } from "@/components/ui/separator";

interface Props {
  versions: Version[];
  onRestore: (version: Version) => void;
  onCompare: (version: Version) => void;
  onClear: () => void;
}

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export default function VersionHistory({
  versions,
  onRestore,
  onCompare,
  onClear,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.2 }}
      className="h-full flex flex-col border-r border-[#1f1f1f] bg-[#080808] w-[260px]"
    >
      <div className="px-5 py-4 flex items-center justify-between border-b border-[#1a1a1a]">
        <span className="text-[10px] tracking-widest uppercase font-mono text-[#4a4a4a]">
          History
        </span>
        {versions.length > 0 && (
          <button
            onClick={onClear}
            className="text-[9px] font-mono text-[#222] hover:text-[#555] flex items-center gap-1 transition-colors"
          >
            <Trash2 className="w-2.5 h-2.5" />
            clear
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {versions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2">
            <Clock className="w-4 h-4 text-[#1f1f1f]" />
            <span className="text-[9px] font-mono text-[#222]">No versions yet</span>
          </div>
        ) : (
          <div>
            {versions.map((v, i) => (
              <div key={v.id}>
                <div className="px-5 py-3 group">
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-[10px] font-mono text-[#555]">{v.label}</span>
                    <span className="text-[9px] font-mono text-[#2a2a2a]">
                      {timeAgo(v.timestamp)}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#2a2a2a] line-clamp-2 leading-relaxed mb-2">
                    {stripHtml(v.html).slice(0, 100)}
                    {stripHtml(v.html).length > 100 ? "…" : ""}
                  </p>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onRestore(v)}
                      className="flex items-center gap-1 px-2 py-1 text-[9px] font-mono text-[#444] hover:text-[#888] border border-[#1a1a1a] hover:border-[#222] rounded-sm transition-colors"
                    >
                      <RotateCcw className="w-2 h-2" />
                      Restore
                    </button>
                    <button
                      onClick={() => onCompare(v)}
                      className="flex items-center gap-1 px-2 py-1 text-[9px] font-mono text-[#444] hover:text-[#888] border border-[#1a1a1a] hover:border-[#222] rounded-sm transition-colors"
                    >
                      <Columns2 className="w-2 h-2" />
                      Compare
                    </button>
                  </div>
                </div>
                {i < versions.length - 1 && (
                  <Separator className="bg-[#0f0f0f]" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
