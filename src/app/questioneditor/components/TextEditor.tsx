"use client";
import React, { useEffect, RefObject } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import FormatToolbar from "./FormatToolbar";

interface TextEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  rows?: number;
  textareaRef?: RefObject<HTMLTextAreaElement> | ((el: HTMLTextAreaElement | null) => void);
  id?: string;
}

const TextEditor: React.FC<TextEditorProps> = ({ 
  value, 
  onChange,
  label,
  placeholder,
  rows = 3,
  id 
}) => {
 
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Configure to preserve markdown content
        codeBlock: {
          HTMLAttributes: {
            class: 'code-block',
          },
        },
      }),
      Underline,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getText());
    },
    editorProps: {
      attributes: {
        ...(id ? { id } : {}), 
        ...(placeholder ? { placeholder } : {}),
        style: rows ? `min-height: ${rows * 24}px` : "" 
      }
    }
  });

  // Update editor content when value changes externally
  useEffect(() => {
    if (editor && editor.getText() !== value) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  return (
    <div className="w-full">
      {label && (
        <label className="block text-gray-700 text-sm font-bold mb-2">
          {label}
        </label>
      )}
      <div className="border rounded-md">
        <FormatToolbar editor={editor} />
        <div className="p-3 bg-white" style={{ minHeight: `${rows * 24}px` }}>
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
};

export default TextEditor;