"use client";
import { useCallback } from "react";
import { Version, ParameterState } from "@/lib/types";
import { useLocalStorage } from "./useLocalStorage";

const MAX_VERSIONS = 50;

function formatLabel(index: number): string {
  const now = new Date();
  const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return `v${index + 1} · ${time}`;
}

export function useVersionHistory() {
  const [versions, setVersions] = useLocalStorage<Version[]>("pwi-versions", []);

  const saveVersion = useCallback(
    (html: string, params: ParameterState) => {
      setVersions((prev) => {
        const newVersion: Version = {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          html,
          params,
          label: formatLabel(prev.length),
        };
        const updated = [newVersion, ...prev].slice(0, MAX_VERSIONS);
        return updated;
      });
    },
    [setVersions]
  );

  const clearHistory = useCallback(() => {
    setVersions([]);
  }, [setVersions]);

  return { versions, saveVersion, clearHistory };
}
