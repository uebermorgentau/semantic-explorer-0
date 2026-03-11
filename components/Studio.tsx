"use client";
import { useRef, useState, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { History, ScanLine, Save } from "lucide-react";
import WritingEditor, { WritingEditorRef } from "./editor/WritingEditor";
import TransformPreview from "./editor/TransformPreview";
import ParameterPanel from "./parameters/ParameterPanel";
import StyleFingerprint from "./fingerprint/StyleFingerprint";
import VersionHistory from "./history/VersionHistory";
import VersionComparison from "./history/VersionComparison";
import { useParameterState } from "@/hooks/useParameterState";
import { useTransform } from "@/hooks/useTransform";
import { useFingerprint } from "@/hooks/useFingerprint";
import { useVersionHistory } from "@/hooks/useVersionHistory";
import { SelectionScope, Version } from "@/lib/types";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function Studio() {
  const editorRef = useRef<WritingEditorRef>(null);

  // Panels
  const [showHistory, setShowHistory] = useState(false);
  const [showFingerprint, setShowFingerprint] = useState(false);

  // Scope
  const [scope, setScope] = useState<SelectionScope>("document");
  const [hasSelection, setHasSelection] = useState(false);

  // Compare
  const [compareVersion, setCompareVersion] = useState<Version | null>(null);

  // Hooks
  const { params, setParam, resetParams, hasChangedFromDefault } = useParameterState();
  const { isLoading, previewText, error: transformError, trigger, discard } = useTransform();
  const { scores, isLoading: fpLoading, isStale, error: fpError, analyze, markStale } = useFingerprint();
  const { versions, saveVersion, clearHistory } = useVersionHistory();

  // Handle content changes
  const handleContentChange = useCallback(() => {
    markStale();
  }, [markStale]);

  // Get text for current scope
  const getScopedText = useCallback((): string => {
    const editor = editorRef.current;
    if (!editor) return "";

    if (scope === "document") {
      return editor.getText();
    }

    if (scope === "words" || scope === "sentence" || scope === "paragraph") {
      const sel = editor.getSelection();
      if (sel) return sel.text;
      return editor.getText();
    }

    return editor.getText();
  }, [scope]);

  // Apply transform
  const handleApply = useCallback(async () => {
    const text = getScopedText();
    if (!text.trim()) return;

    // Auto-save before transform
    const html = editorRef.current?.getHTML() ?? "";
    if (html.trim() && html !== "<p></p>") {
      saveVersion(html, params);
    }

    await trigger(text, scope, params);
  }, [getScopedText, saveVersion, params, trigger, scope]);

  // Accept preview
  const handleAccept = useCallback(() => {
    if (!previewText || !editorRef.current) return;

    const sel = editorRef.current.getSelection();
    if (sel && scope !== "document") {
      editorRef.current.replaceSelection(previewText);
    } else {
      editorRef.current.setHTML(`<p>${previewText.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>")}</p>`);
    }
    discard();
    markStale();
  }, [previewText, scope, discard, markStale]);

  // Save version manually
  const handleSaveVersion = useCallback(() => {
    const html = editorRef.current?.getHTML() ?? "";
    if (html.trim() && html !== "<p></p>") {
      saveVersion(html, params);
    }
  }, [saveVersion, params]);

  // Restore version
  const handleRestore = useCallback((version: Version) => {
    editorRef.current?.setHTML(version.html);
    setShowHistory(false);
    markStale();
  }, [markStale]);

  // Analyze fingerprint
  const handleAnalyze = useCallback(() => {
    const text = editorRef.current?.getText() ?? "";
    analyze(text);
  }, [analyze]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleApply();
      }
      if (e.key === "Escape" && previewText) {
        discard();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleApply, previewText, discard]);

  return (
    <div className="h-screen flex flex-col bg-[#080808] overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-[#1a1a1a] shrink-0">
        <div className="flex items-center gap-6">
          <span className="text-[10px] tracking-widest uppercase font-mono text-[#333]">
            Parametric Writing
          </span>
        </div>
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
              render={<button onClick={() => setShowHistory((v) => !v)} className={`p-2 transition-colors ${showHistory ? "text-[#c9984a]" : "text-[#2a2a2a] hover:text-[#666]"}`} />}
            >
              <History className="w-3.5 h-3.5" />
            </TooltipTrigger>
            <TooltipContent className="bg-[#111] border-[#222] text-[#888] text-[10px] font-mono rounded-sm">
              Version history
            </TooltipContent>
          </Tooltip>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* History panel */}
        <AnimatePresence>
          {showHistory && (
            <VersionHistory
              versions={versions}
              onRestore={handleRestore}
              onCompare={setCompareVersion}
              onClear={clearHistory}
            />
          )}
        </AnimatePresence>

        {/* Editor + preview */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-8 py-10 max-w-3xl w-full mx-auto">
            <WritingEditor
              ref={editorRef}
              onContentChange={handleContentChange}
              onSelectionChange={setHasSelection}
              disabled={isLoading}
            />
          </div>

          {/* Preview */}
          <AnimatePresence>
            {previewText && (
              <div className="px-8 pb-6 max-w-3xl w-full mx-auto">
                <TransformPreview
                  previewText={previewText}
                  onAccept={handleAccept}
                  onDiscard={discard}
                />
              </div>
            )}
          </AnimatePresence>

          {/* Error */}
          {transformError && (
            <div className="px-8 pb-4 max-w-3xl w-full mx-auto">
              <p className="text-[10px] font-mono text-red-800">{transformError}</p>
            </div>
          )}
        </div>

        {/* Right panel: Parameters + optional fingerprint */}
        <div className="w-[280px] shrink-0 flex flex-col border-l border-[#1f1f1f] overflow-hidden">
          {/* Fingerprint (collapsible top section) */}
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
                    params={params}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Parameter panel */}
          <div className="flex-1 overflow-hidden">
            <ParameterPanel
              params={params}
              onParamChange={setParam}
              onReset={resetParams}
              hasChangedFromDefault={hasChangedFromDefault}
              scope={scope}
              onScopeChange={setScope}
              hasSelection={hasSelection}
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
