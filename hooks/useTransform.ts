"use client";
import { useState, useCallback } from "react";
import { ParameterState, SelectionScope } from "@/lib/types";

export type TransformState = {
  isLoading: boolean;
  previewText: string | null;
  error: string | null;
};

export function useTransform() {
  const [state, setState] = useState<TransformState>({
    isLoading: false,
    previewText: null,
    error: null,
  });

  const trigger = useCallback(
    async (text: string, scope: SelectionScope, params: ParameterState) => {
      if (!text.trim()) return;

      setState({ isLoading: true, previewText: null, error: null });

      try {
        const res = await fetch("/api/transform", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, scope, parameters: params }),
        });

        if (!res.ok) {
          const err = await res.text();
          throw new Error(err || `HTTP ${res.status}`);
        }

        const data = await res.json();
        setState({ isLoading: false, previewText: data.text, error: null });
      } catch (err) {
        setState({
          isLoading: false,
          previewText: null,
          error: err instanceof Error ? err.message : "Transform failed",
        });
      }
    },
    []
  );

  const discard = useCallback(() => {
    setState({ isLoading: false, previewText: null, error: null });
  }, []);

  return { ...state, trigger, discard };
}
