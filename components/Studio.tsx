"use client";
import { useRef, useState, useCallback, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { Layers, Save, Sun, Moon } from "lucide-react";
import WritingEditor, { WritingEditorRef } from "./editor/WritingEditor";
import ParameterPanel from "./parameters/ParameterPanel";
import LayersPanel from "./history/LayersPanel";
import VersionComparison from "./history/VersionComparison";
import { useDocuments } from "@/hooks/useDocuments";
import { useTransform } from "@/hooks/useTransform";
import { useFingerprint } from "@/hooks/useFingerprint";
import { useVersionHistory } from "@/hooks/useVersionHistory";
import { Layer, ParameterState, SelectionScope, Version } from "@/lib/types";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function Studio() {
  const editorRef = useRef<WritingEditorRef>(null);

  // Panel visibility
  const [showLayers, setShowLayers] = useState(false);

  // Theme
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // Selection state
  const [hasSelection, setHasSelection] = useState(false);
  const [selectionWordCount, setSelectionWordCount] = useState(0);

  // Reapply tracking
  const [reapplyingId, setReapplyingId] = useState<string | null>(null);

  // Analyze / Calibrate state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);

  // Compare
  const [compareVersion, setCompareVersion] = useState<Version | null>(null);

  // Doc switcher UI state
  const [docDropdownOpen, setDocDropdownOpen] = useState(false);
  const [isRenamingDoc, setIsRenamingDoc] = useState(false);
  const [renamingValue, setRenamingValue] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Hooks
  const {
    docs,
    activeDoc,
    newDoc,
    switchDoc,
    renameDoc,
    saveHTML,
    params,
    setParam,
    calibrateParams,
    resetParams,
    hasChangedFromDefault,
    layers,
    addLayer,
    toggleLayer,
    clearLayers,
  } = useDocuments();
  const { isLoading, error: transformError, trigger } = useTransform();
  const { scores, isStale, analyze, markStale, setScores } = useFingerprint();
  const { saveVersion } = useVersionHistory();

  // Theme management
  useEffect(() => {
    const saved = localStorage.getItem("pwi-theme") as "dark" | "light" | null;
    if (saved === "light") setTheme("light");
  }, []);
  useEffect(() => {
    const html = document.documentElement;
    html.classList.toggle("light", theme === "light");
    html.classList.toggle("dark", theme === "dark");
    localStorage.setItem("pwi-theme", theme);
  }, [theme]);

  // Map fingerprint scores → slider param keys for ghost markers
  const fingerprintForSliders: Partial<Record<keyof ParameterState, number>> | undefined =
    scores
      ? {
          warmth: scores.warmth,
          authority: scores.authority,
          formality: scores.formality,
          sentenceLength: scores.sentenceLength,
          density: scores.density,
          abstraction: scores.abstraction,
          strategicOperational: scores.strategic,
          analyticalNarrative: scores.analytical,
        }
      : undefined;

  // Sync editor content when active doc changes
  const prevDocIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (prevDocIdRef.current === activeDoc.id) return;
    prevDocIdRef.current = activeDoc.id;
    editorRef.current?.setHTML(activeDoc.html ?? "");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDoc.id]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!docDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDocDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [docDropdownOpen]);

  // Selection change from editor
  const handleSelectionChange = useCallback((sel: boolean, wordCount: number) => {
    setHasSelection(sel);
    setSelectionWordCount(wordCount);
  }, []);

  // Content change — mark stale + debounced save
  const handleContentChange = useCallback(() => {
    markStale();
    const html = editorRef.current?.getHTML() ?? "";
    saveHTML(html);
  }, [markStale, saveHTML]);

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

  // Analyze: run fingerprint → show ghost markers on sliders
  const handleAnalyze = useCallback(async () => {
    const text = editorRef.current?.getText() ?? "";
    if (!text.trim()) return;
    setIsAnalyzing(true);
    try {
      await analyze(text);
    } finally {
      setIsAnalyzing(false);
    }
  }, [analyze]);

  // Calibrate: run fingerprint → move sliders to match text
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

      setScores(data);
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

  // Doc rename commit
  const commitRename = useCallback(() => {
    renameDoc(activeDoc.id, renamingValue);
    setIsRenamingDoc(false);
  }, [renameDoc, activeDoc.id, renamingValue]);

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
    <div className="h-screen flex flex-col bg-[var(--c-bg)] overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-[var(--c-border-1)] shrink-0">
        {/* Doc switcher */}
        <div className="flex items-center gap-3">
          <div className="relative" ref={dropdownRef}>
            {isRenamingDoc ? (
              <input
                autoFocus
                value={renamingValue}
                onChange={(e) => setRenamingValue(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitRename();
                  if (e.key === "Escape") setIsRenamingDoc(false);
                }}
                className="text-[10px] tracking-widest uppercase font-mono bg-transparent text-[var(--c-tx-5)] border-b border-[var(--c-tx-1)] outline-none w-32"
              />
            ) : (
              <button
                onClick={() => setDocDropdownOpen((v) => !v)}
                onDoubleClick={() => {
                  setDocDropdownOpen(false);
                  setRenamingValue(activeDoc.name);
                  setIsRenamingDoc(true);
                }}
                className="text-[10px] tracking-widest uppercase font-mono text-[var(--c-tx-3)] hover:text-[var(--c-tx-5)] transition-colors"
              >
                {activeDoc.name}
              </button>
            )}

            {docDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 py-1 bg-[var(--c-panel)] border border-[var(--c-border-2)] rounded-sm z-50 min-w-[180px]">
                {docs.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => {
                      switchDoc(doc.id);
                      setDocDropdownOpen(false);
                    }}
                    className={`flex items-center justify-between w-full px-3 py-1.5 text-left text-[9px] font-mono transition-colors ${
                      doc.id === activeDoc.id
                        ? "text-[var(--c-tx-4)]"
                        : "text-[var(--c-tx-1)] hover:text-[var(--c-tx-4)]"
                    }`}
                  >
                    <span>{doc.name}</span>
                    {doc.id === activeDoc.id && (
                      <span className="text-[var(--c-tx-0)]">·</span>
                    )}
                  </button>
                ))}
                <div className="border-t border-[var(--c-border-1)] my-1" />
                <button
                  onClick={() => {
                    newDoc();
                    setDocDropdownOpen(false);
                  }}
                  className="block w-full text-left px-3 py-1.5 text-[9px] font-mono text-[var(--c-tx-0)] hover:text-[var(--c-tx-3)] transition-colors"
                >
                  + new document
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger
              render={<button onClick={() => setTheme(t => t === "dark" ? "light" : "dark")} className="p-2 text-[var(--c-tx-0)] hover:text-[var(--c-tx-4)] transition-colors" />}
            >
              {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </TooltipTrigger>
            <TooltipContent className="bg-[var(--c-panel)] border-[var(--c-border-3)] text-[var(--c-tx-5)] text-[10px] font-mono rounded-sm">
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              render={<button onClick={handleSaveVersion} className="p-2 text-[var(--c-tx-0)] hover:text-[var(--c-tx-4)] transition-colors" />}
            >
              <Save className="w-3.5 h-3.5" />
            </TooltipTrigger>
            <TooltipContent className="bg-[var(--c-panel)] border-[var(--c-border-3)] text-[var(--c-tx-5)] text-[10px] font-mono rounded-sm">
              Save version
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              render={<button onClick={() => setShowLayers((v) => !v)} className={`p-2 transition-colors ${showLayers ? "text-[#c9984a]" : "text-[var(--c-tx-0)] hover:text-[var(--c-tx-4)]"}`} />}
            >
              <Layers className="w-3.5 h-3.5" />
            </TooltipTrigger>
            <TooltipContent className="bg-[var(--c-panel)] border-[var(--c-border-3)] text-[var(--c-tx-5)] text-[10px] font-mono rounded-sm">
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
        <div className="w-[280px] shrink-0 flex flex-col border-l border-[var(--c-border-2)] overflow-hidden">
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
              fingerprint={fingerprintForSliders}
              onAnalyze={handleAnalyze}
              onCalibrate={handleCalibrate}
              isAnalyzing={isAnalyzing}
              isCalibrating={isCalibrating}
              isStale={isStale}
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
