"use client";
import { useCallback } from "react";
import { Layer, ParameterState, SelectionScope } from "@/lib/types";
import { autoLabelFromParams } from "@/lib/parameters";
import { useLocalStorage } from "./useLocalStorage";

const MAX_LAYERS = 30;

export function useLayers() {
  const [layers, setLayers] = useLocalStorage<Layer[]>("pwi-layers", []);

  const addLayer = useCallback(
    (
      fromHTML: string,
      toHTML: string,
      params: ParameterState,
      scope: SelectionScope,
      selectionWordCount?: number
    ) => {
      const layer: Layer = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        label: autoLabelFromParams(params),
        params,
        scope,
        fromHTML,
        toHTML,
        isActive: true,
        selectionWordCount,
      };
      setLayers((prev) => [layer, ...prev].slice(0, MAX_LAYERS));
      return layer;
    },
    [setLayers]
  );

  // Toggle: swap between fromHTML and toHTML — returns the new HTML to set
  const toggleLayer = useCallback(
    (id: string): string | null => {
      let resultHTML: string | null = null;
      setLayers((prev) =>
        prev.map((l) => {
          if (l.id !== id) return l;
          const nowActive = !l.isActive;
          resultHTML = nowActive ? l.toHTML : l.fromHTML;
          return { ...l, isActive: nowActive };
        })
      );
      return resultHTML;
    },
    [setLayers]
  );

  const clearLayers = useCallback(() => {
    setLayers([]);
  }, [setLayers]);

  return { layers, addLayer, toggleLayer, clearLayers };
}
