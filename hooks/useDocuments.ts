"use client";
import { useCallback, useRef, useState } from "react";
import { Doc, Layer, ParameterState, SelectionScope } from "@/lib/types";
import { DEFAULT_PARAMETERS, autoLabelFromParams } from "@/lib/parameters";

const MAX_LAYERS = 30;
const DOCS_KEY = "pwi-docs";
const ACTIVE_KEY = "pwi-active-doc";
const DEBOUNCE_MS = 800;

function makeDefaultDoc(): Doc {
  return {
    id: crypto.randomUUID(),
    name: "Untitled",
    updatedAt: Date.now(),
    html: "",
    params: { ...DEFAULT_PARAMETERS },
    layers: [],
  };
}

// Always persists to localStorage so a second call is idempotent
function loadInitial(): { docs: Doc[]; activeId: string } {
  if (typeof window === "undefined") {
    const doc = makeDefaultDoc();
    return { docs: [doc], activeId: doc.id };
  }
  try {
    const stored = localStorage.getItem(DOCS_KEY);
    if (stored) {
      const docs = JSON.parse(stored) as Doc[];
      if (docs.length > 0) {
        const saved = localStorage.getItem(ACTIVE_KEY);
        const activeId = docs.find((d) => d.id === saved) ? saved! : docs[0].id;
        return { docs, activeId };
      }
    }

    // Migrate from old separate keys
    const oldParams = localStorage.getItem("pwi-parameters");
    const oldLayers = localStorage.getItem("pwi-layers");
    const params = oldParams
      ? (JSON.parse(oldParams) as ParameterState)
      : { ...DEFAULT_PARAMETERS };
    const layers = oldLayers ? (JSON.parse(oldLayers) as Layer[]) : [];
    if (oldParams) localStorage.removeItem("pwi-parameters");
    if (oldLayers) localStorage.removeItem("pwi-layers");

    const doc: Doc = { ...makeDefaultDoc(), params, layers };
    localStorage.setItem(DOCS_KEY, JSON.stringify([doc]));
    localStorage.setItem(ACTIVE_KEY, doc.id);
    return { docs: [doc], activeId: doc.id };
  } catch {
    const doc = makeDefaultDoc();
    localStorage.setItem(DOCS_KEY, JSON.stringify([doc]));
    localStorage.setItem(ACTIVE_KEY, doc.id);
    return { docs: [doc], activeId: doc.id };
  }
}

function persist(docs: Doc[]) {
  try {
    localStorage.setItem(DOCS_KEY, JSON.stringify(docs));
  } catch {
    // ignore
  }
}

export function useDocuments() {
  // Two separate lazy inits — loadInitial is idempotent after first call
  const [docs, setDocs] = useState<Doc[]>(() => loadInitial().docs);
  const [activeDocId, setActiveDocId] = useState<string>(
    () => loadInitial().activeId
  );

  const activeDocIdRef = useRef(activeDocId);
  activeDocIdRef.current = activeDocId;

  const pendingHTMLRef = useRef<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeDoc = docs.find((d) => d.id === activeDocId) ?? docs[0];

  // ─── Internal mutation helper ───
  const updateDoc = useCallback((id: string, updater: (d: Doc) => Doc) => {
    setDocs((prev) => {
      const next = prev.map((d) => (d.id === id ? updater(d) : d));
      persist(next);
      return next;
    });
  }, []);

  // ─── HTML auto-save (debounced) ───
  const saveHTML = useCallback((html: string) => {
    pendingHTMLRef.current = html;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const id = activeDocIdRef.current;
      const h = pendingHTMLRef.current;
      if (h === null) return;
      pendingHTMLRef.current = null;
      setDocs((prev) => {
        const next = prev.map((d) =>
          d.id === id ? { ...d, html: h, updatedAt: Date.now() } : d
        );
        persist(next);
        return next;
      });
    }, DEBOUNCE_MS);
  }, []);

  // Flush pending HTML save (called before switching docs)
  const flushHTML = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (pendingHTMLRef.current !== null) {
      const id = activeDocIdRef.current;
      const h = pendingHTMLRef.current;
      pendingHTMLRef.current = null;
      setDocs((prev) => {
        const next = prev.map((d) =>
          d.id === id ? { ...d, html: h, updatedAt: Date.now() } : d
        );
        persist(next);
        return next;
      });
    }
  }, []);

  // ─── Document management ───
  const newDoc = useCallback(() => {
    flushHTML();
    const doc = makeDefaultDoc();
    setDocs((prev) => {
      const next = [doc, ...prev];
      persist(next);
      return next;
    });
    setActiveDocId(doc.id);
    try {
      localStorage.setItem(ACTIVE_KEY, doc.id);
    } catch {}
  }, [flushHTML]);

  const switchDoc = useCallback(
    (id: string) => {
      if (id === activeDocIdRef.current) return;
      flushHTML();
      setActiveDocId(id);
      try {
        localStorage.setItem(ACTIVE_KEY, id);
      } catch {}
    },
    [flushHTML]
  );

  const renameDoc = useCallback(
    (id: string, name: string) => {
      updateDoc(id, (d) => ({ ...d, name: name.trim() || "Untitled" }));
    },
    [updateDoc]
  );

  // ─── Params ───
  const setParam = useCallback(
    (key: keyof ParameterState, value: number) => {
      updateDoc(activeDocId, (d) => ({
        ...d,
        params: { ...d.params, [key]: value },
        updatedAt: Date.now(),
      }));
    },
    [activeDocId, updateDoc]
  );

  const calibrateParams = useCallback(
    (partial: Partial<ParameterState>) => {
      updateDoc(activeDocId, (d) => ({
        ...d,
        params: { ...d.params, ...partial },
        updatedAt: Date.now(),
      }));
    },
    [activeDocId, updateDoc]
  );

  const resetParams = useCallback(() => {
    updateDoc(activeDocId, (d) => ({
      ...d,
      params: { ...DEFAULT_PARAMETERS },
      updatedAt: Date.now(),
    }));
  }, [activeDocId, updateDoc]);

  const hasChangedFromDefault = Object.keys(DEFAULT_PARAMETERS).some(
    (k) =>
      activeDoc.params[k as keyof ParameterState] !==
      DEFAULT_PARAMETERS[k as keyof ParameterState]
  );

  // ─── Layers ───
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
      updateDoc(activeDocId, (d) => ({
        ...d,
        layers: [layer, ...d.layers].slice(0, MAX_LAYERS),
        updatedAt: Date.now(),
      }));
      return layer;
    },
    [activeDocId, updateDoc]
  );

  const toggleLayer = useCallback(
    (id: string): string | null => {
      // Read current state snapshot synchronously
      const layer = docs.find((d) => d.id === activeDocId)?.layers.find((l) => l.id === id);
      if (!layer) return null;
      const nowActive = !layer.isActive;
      const resultHTML = nowActive ? layer.toHTML : layer.fromHTML;
      updateDoc(activeDocId, (d) => ({
        ...d,
        layers: d.layers.map((l) =>
          l.id === id ? { ...l, isActive: nowActive } : l
        ),
      }));
      return resultHTML;
    },
    [activeDocId, docs, updateDoc]
  );

  const clearLayers = useCallback(() => {
    updateDoc(activeDocId, (d) => ({ ...d, layers: [] }));
  }, [activeDocId, updateDoc]);

  return {
    docs,
    activeDoc,
    newDoc,
    switchDoc,
    renameDoc,
    saveHTML,
    params: activeDoc.params,
    setParam,
    calibrateParams,
    resetParams,
    hasChangedFromDefault,
    layers: activeDoc.layers,
    addLayer,
    toggleLayer,
    clearLayers,
  };
}
