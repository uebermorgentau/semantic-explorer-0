"use client";
import { useCallback } from "react";
import { ParameterState } from "@/lib/types";
import { DEFAULT_PARAMETERS } from "@/lib/parameters";
import { useLocalStorage } from "./useLocalStorage";

export function useParameterState() {
  const [params, setParams] = useLocalStorage<ParameterState>(
    "pwi-parameters",
    DEFAULT_PARAMETERS
  );

  const setParam = useCallback(
    (key: keyof ParameterState, value: number) => {
      setParams((prev) => ({ ...prev, [key]: value }));
    },
    [setParams]
  );

  // Bulk setter for calibration — merges partial state
  const calibrateParams = useCallback(
    (partial: Partial<ParameterState>) => {
      setParams((prev) => ({ ...prev, ...partial }));
    },
    [setParams]
  );

  const resetParams = useCallback(() => {
    setParams(DEFAULT_PARAMETERS);
  }, [setParams]);

  const hasChangedFromDefault = Object.keys(DEFAULT_PARAMETERS).some(
    (k) =>
      params[k as keyof ParameterState] !==
      DEFAULT_PARAMETERS[k as keyof ParameterState]
  );

  return { params, setParam, calibrateParams, resetParams, hasChangedFromDefault };
}
