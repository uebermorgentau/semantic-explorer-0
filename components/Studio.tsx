"use client";
import { useRef, useState, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Layers, ScanLine, Save } from "lucide-react";
import WritingEditor, { WritingEditorRef } from "./editor/WritingEditor";
import ParameterPanel from "./parameters/ParameterPanel";
import StyleFingerprint from "./fingerprint/StyleFingerprint";
import LayersPanel from "./history/LayersPanel";
import VersionComparison from "./history/VersionComparison";
import { useParameterState } from "@/hooks/useParameterState";
import { useTransform } from "@/hooks/useTransform";
import { useFingerprint } from "@/hooks/useFingerprint";
import { useVersionHistory } from "@/hooks/useVersionHistory";
import { useLayers } from "@/hooks/useLayers";
import { Layer, ParameterState, SelectionScope, Version } from "@/lib/types";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function Studio() {
  const editorRef = useRef<WritingEditorRef>(null);

  // Panel visibility
  const [showLayers, setShowLayers] = useState(false);
  const [showFingerprint, setShowFingerprint] = useState(false);

  // Selection state
  const [hasSelection, setHasSelection] = useState(false);
  const [selectionWordCount, setSelectionWordCount] = useState(0);

  // Reapply tracking
  const [reapplyingId, setReapplyingId] = useState<string | null>(null);

  // Calibrating state (separate from fingerprint isLoading)
  const [isCalibrating, setIsCalibrating] = useState(false);

  // Compare
  const [compareVersion, setCompareVersion] = useState<Version | null>(null);

  // Hooks
  const { params, setParam, calibrateParams, resetParams, hasChangedFromDefault } = useParameterState();
  const { isLoading, error: transformError, trigger } = useTransform();
  const { scores, isLoading: fpLoading, isStale, error: fpError, analyze, markStale, setScores } = useFingerprint();
  const { versions, saveVersion } = useVersionHistory();
  const { layers, addLayer, toggleLayer, clearLayers } = useLayers();

  // Selection change from editor
  const handleSelectionChange = useCallback((sel: boolean, wordCount: number) => {
    setHasSelection(sel);
    setSelectionWordCount(wordCount);
  }, []);

  // Content change
  const handleContentChange = useCallback(() => {
    markStale();
  }, [markStale]);

  // Derive scope from selection
  const scope: SelectionScope = hasSelection ? "selection" : "document";

  // Get text to transform
  const getScopedText = useCallback((): string => {
    const editor = editorRef.current;
    if (!editor) return "";
    if (scope === "selection") {
      const sel = editor.getSelection();
      return sel ? sel.text : editor.getText();
    }
    return editor.getText();
  }, [scope]);

  // Apply transform
  const handleApply = useCallback(async () => {
    const editor = editorRef.current;
    const text = getScopedText();
    if (!text.trim() || !editor) return;

    const fromHTML = editor.getHTML();

    // Save to linear history
    if (fromHTML.trim() && fromHTML !== "<p></p>") {
      saveVersion(fromHTML, params);
    }

    await trigger(text, scope, params, (result) => {
      const sel = scope === "selection" ? editor.getSelection() : null;

      if (sel) {
        editor.replaceSelection(result);
      } else {
        editor.setHTML(
          `<p>${result.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>")}</p>`
        );
      }

      // Flash the editor
      editor.flash();

      // Record as a layer
      const toHTML = editor.getHTML();
      addLayer(fromHTML, toHTML, params, scope, sel ? selectionWordCount : undefined);

      // Auto-analyze after transform
      setTimeout(() => {
        const newText = editor.getText();
        if (newText.trim()) analyze(newText);
      }, 200);
    });
  }, [getScopedText, saveVersion, params, trigger, scope, addLayer, selectionWordCount, analyze]);

  // Toggle a layer (instant HTML swap)
  const handleToggleLayer = useCallback((id: string) => {
    const newHTML = toggleLayer(id);
    if (newHTML !== null) {
      editorRef.current?.setHTML(newHTML);
      markStale();
    }
  }, [toggleLayer, markStale]);

  // Re-apply a layer's recipe to current text
  const handleReapply = useCallback(async (layer: Layer) => {
    const editor = editorRef.current;
    const text = editor?.getText() ?? "";
    if (!text.trim() || !editor) return;

    setReapplyingId(layer.id);
    const fromHTML = editor.getHTML();

    await trigger(text, layer.scope, layer.params, (result) => {
      editor.setHTML(
        `<p>${result.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>")}</p>`
      );
      editor.flash();
      const toHTML = editor.getHTML();
      addLayer(fromHTML, toHTML, layer.params, layer.scope);

      setTimeout(() => {
        const newText = editor.getText();
        if (newText.trim()) analyze(newText);
      }, 200);
    });

    setReapplyingId(null);
  }, [trigger, addLayer, analyze]);

  // Save version manually
  const handleSaveVersion = useCallback(() => {
    const html = editorRef.current?.getHTML() ?? "";
    if (html.trim() && html !== "<p></p>") {
      saveVersion(html, params);
    }
  }, [saveVersion, params]);

  // Analyze fingerprint
  const handleAnalyze = useCallback(() => {
    const text = editorRef.current?.getText() ?? "";
    analyze(text);
  }, [analyze]);

  // Calibrate: run fingerprint analysis, then set sliders to match
  const handleCalibrate = useCallback(async () => {
    const text = editorRef.current?.getText() ?? "";
    if (!text.trim()) return;

    setIsCalibrating(true);
    try {
      const res = await fetch("/api/fingerprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error("Fingerprint failed");
      const data = await res.json();

      // Set the fingerprint scores (shows the radar)
      setScores(data);

      // Map fingerprint scores to slider params
      calibrateParams({
        warmth: data.warmth,
        authority: data.authority,
        formality: data.formality,
        sentenceLength: data.sentenceLength,
        density: data.density,
        abstraction: data.abstraction,
        strategicOperational: data.strategic,
        analyticalNarrative: data.analytical,
      });
    } catch {
      // ignore
    } finally {
      setIsCalibrating(false);
    }
  }, [calibrateParams, setScores]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleApply();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleApply]);

  return (
    <div className="h-screen flex flex-col bg-[#080808] overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-[#1a1a1a] shrink-0">
        <span className="text-[10px] tracking-widest uppercase font-mono text-[#333]">
          Parametric Writing
        </span>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger
              render={<button onClick={handleSaveVersion} className="p-2 text-[#2a2a2a] hover:text-[#666] transition-colors" />}
            >
              <Save className="w-3.5 h-3.5" />
            </TooltipTrigger>
            <TooltipContent className="bg-[#111] border-[#222] text-[#888] text-[10px] font-mono rounded-sm">
              Save version
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              render={<button onClick={() => setShowFingerprint((v) => !v)} className={`p-2 transition-colors ${showFingerprint ? "text-[#7c6af5]" : "text-[#2a2a2a] hover:text-[#666]"}`} />}
            >
              <ScanLine className="w-3.5 h-3.5" />
            </TooltipTrigger>
            <TooltipContent className="bg-[#111] border-[#222] text-[#888] text-[10px] font-mono rounded-sm">
              Style fingerprint
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              render={<button onClick={() => setShowLayers((v) => !v)} className={`p-2 transition-colors ${showLayers ? "text-[#c9984a]" : "text-[#2a2a2a] hover:text-[#666]"}`} />}
            >
              <Layers className="w-3.5 h-3.5" />
            </TooltipTrigger>
            <TooltipContent className="bg-[#111] border-[#222] text-[#888] text-[10px] font-mono rounded-sm">
              Transform layers
            </TooltipContent>
          </Tooltip>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Layers panel */}
        <AnimatePresence>
          {showLayers && (
            <LayersPanel
              layers={layers}
              onToggle={handleToggleLayer}
              onReapply={handleReapply}
              onClear={clearLayers}
              isReapplying={reapplyingId}
            />
          )}
        </AnimatePresence>

        {/* Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-8 py-10 max-w-3xl w-full mx-auto">
            <WritingEditor
              ref={editorRef}
              onContentChange={handleContentChange}
              onSelectionChange={handleSelectionChange}
              disabled={isLoading}
            />
          </div>

          {/* Error */}
          {transformError && (
            <div className="px-8 pb-4 max-w-3xl w-full mx-auto">
              <p className="text-[10px] font-mono text-red-800">{transformError}</p>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="w-[280px] shrink-0 flex flex-col border-l border-[#1f1f1f] overflow-hidden">
          {/* Fingerprint */}
          <AnimatePresence>
            {showFingerprint && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="border-b border-[#1a1a1a] overflow-hidden"
              >
                <div className="pt-5">
                  <StyleFingerprint
                    scores={scores}
                    isLoading={fpLoading}
                    isStale={isStale}
                    error={fpError}
                    onAnalyze={handleAnalyze}
                    onCalibrate={handleCalibrate}
                    isCalibrating={isCalibrating}
                    params={params}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Parameters */}
          <div className="flex-1 overflow-hidden">
            <ParameterPanel
              params={params}
              onParamChange={setParam}
              onReset={resetParams}
              hasChangedFromDefault={hasChangedFromDefault}
              hasSelection={hasSelection}
              selectionWordCount={selectionWordCount}
              onApply={handleApply}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>

      {/* Version comparison modal */}
      <VersionComparison
        currentHTML={editorRef.current?.getHTML() ?? ""}
        compareVersion={compareVersion}
        onClose={() => setCompareVersion(null)}
      />
    </div>
  );
}
