"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { forwardRef, useImperativeHandle, useEffect, useRef } from "react";

export interface WritingEditorRef {
  getHTML: () => string;
  getText: () => string;
  getSelection: () => { text: string; from: number; to: number; wordCount: number } | null;
  setHTML: (html: string) => void;
  replaceSelection: (newText: string) => void;
  flash: () => void;
  focus: () => void;
}

interface Props {
  onContentChange?: (text: string) => void;
  onSelectionChange?: (hasSelection: boolean, wordCount: number) => void;
  disabled?: boolean;
}

const WritingEditor = forwardRef<WritingEditorRef, Props>(
  ({ onContentChange, onSelectionChange, disabled }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);

    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: false,
          blockquote: false,
          code: false,
          codeBlock: false,
          horizontalRule: false,
          listItem: false,
          orderedList: false,
          bulletList: false,
        }),
        Placeholder.configure({
          placeholder: "Start writing…",
        }),
      ],
      editorProps: {
        attributes: {
          class: "tiptap",
        },
      },
      onUpdate: ({ editor: ed }) => {
        onContentChange?.(ed.getText());
      },
      onSelectionUpdate: ({ editor: ed }) => {
        const { from, to } = ed.state.selection;
        const hasSelection = from !== to;
        const wordCount = hasSelection
          ? ed.state.doc.textBetween(from, to, " ").trim().split(/\s+/).filter(Boolean).length
          : 0;
        onSelectionChange?.(hasSelection, wordCount);
      },
      editable: !disabled,
      immediatelyRender: false,
    });

    useEffect(() => {
      if (editor) {
        editor.setEditable(!disabled);
      }
    }, [editor, disabled]);

    useImperativeHandle(ref, () => ({
      getHTML: () => editor?.getHTML() ?? "",
      getText: () => editor?.getText() ?? "",
      getSelection: () => {
        if (!editor) return null;
        const { from, to } = editor.state.selection;
        if (from === to) return null;
        const text = editor.state.doc.textBetween(from, to, " ");
        const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
        return { text, from, to, wordCount };
      },
      setHTML: (html: string) => {
        editor?.commands.setContent(html);
      },
      replaceSelection: (newText: string) => {
        if (!editor) return;
        const { from, to } = editor.state.selection;
        editor.chain().focus().deleteRange({ from, to }).insertContent(newText).run();
      },
      flash: () => {
        const el = containerRef.current;
        if (!el) return;
        el.classList.remove("transform-flash");
        // Force reflow to restart animation
        void el.offsetWidth;
        el.classList.add("transform-flash");
        setTimeout(() => el.classList.remove("transform-flash"), 1600);
      },
      focus: () => editor?.commands.focus(),
    }));

    return (
      <div ref={containerRef} className="relative h-full">
        <EditorContent editor={editor} className="h-full" />
      </div>
    );
  }
);

WritingEditor.displayName = "WritingEditor";
export default WritingEditor;
