"use client";
import { useState, useCallback, useRef } from "react";
import { FingerprintScores } from "@/lib/types";

export function useFingerprint() {
  const [scores, setScores] = useState<FingerprintScores | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);
  const lastTextHash = useRef<string>("");

  const analyze = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const hash = `${text.length}:${text.slice(0, 80)}`;

    if (hash === lastTextHash.current && scores) {
      setIsStale(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/fingerprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      setScores(data);
      lastTextHash.current = hash;
      setIsStale(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setIsLoading(false);
    }
  }, [scores]);

  const markStale = useCallback(() => {
    if (scores) setIsStale(true);
  }, [scores]);

  return { scores, isLoading, error, isStale, analyze, markStale };
}
