"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { forwardRef, useImperativeHandle, useEffect } from "react";

export interface WritingEditorRef {
  getHTML: () => string;
  getText: () => string;
  getSelection: () => { text: string; from: number; to: number } | null;
  setHTML: (html: string) => void;
  replaceSelection: (newText: string) => void;
  focus: () => void;
}

interface Props {
  onContentChange?: (text: string) => void;
  onSelectionChange?: (hasSelection: boolean) => void;
  disabled?: boolean;
}

const WritingEditor = forwardRef<WritingEditorRef, Props>(
  ({ onContentChange, onSelectionChange, disabled }, ref) => {
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
        onSelectionChange?.(from !== to);
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
        return { text, from, to };
      },
      setHTML: (html: string) => {
        editor?.commands.setContent(html);
      },
      replaceSelection: (newText: string) => {
        if (!editor) return;
        const { from, to } = editor.state.selection;
        editor.chain().focus().deleteRange({ from, to }).insertContent(newText).run();
      },
      focus: () => editor?.commands.focus(),
    }));

    return (
      <div className="relative h-full">
        <EditorContent editor={editor} className="h-full" />
      </div>
    );
  }
);

WritingEditor.displayName = "WritingEditor";
export default WritingEditor;
