"use client";
import { useState, useCallback } from "react";
import { ParameterState, SelectionScope } from "@/lib/types";

export function useTransform() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trigger = useCallback(
    async (
      text: string,
      scope: SelectionScope,
      params: ParameterState,
      onResult: (result: string) => void
    ) => {
      if (!text.trim()) return;

      setIsLoading(true);
      setError(null);

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
        onResult(data.text);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Transform failed");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { isLoading, error, trigger };
}
