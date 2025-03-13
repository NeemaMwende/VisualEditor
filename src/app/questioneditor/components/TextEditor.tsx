"use client";
import React, { useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import FormatToolbar from "./FormatToolbar";
import TextAlign from "@tiptap/extension-text-align";

interface TextEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  rows?: number;
  id?: string;
}

const TextEditor: React.FC<TextEditorProps> = ({ 
  value, 
  onChange,
  label,
 // placeholder,
  rows = 3,
  id 
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: {
          HTMLAttributes: {
            class: 'code-block',
          },
        },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Underline,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const newValue = editor.getText();
      onChange(newValue);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm focus:outline-none w-full overflow-visible',
        spellcheck: 'false',
      }
    }
  });

  // Update editor content when value changes externally
  useEffect(() => {
    if (editor && value !== editor.getText()) {
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
      <div className="border rounded-md flex flex-col" id={id} ref={editorRef}>
        <FormatToolbar editor={editor} />
        <div 
          className="p-3 bg-white editor-content overflow-y-auto" 
          style={{ 
            height: `${rows * 24}px`, 
            maxHeight: `${rows * 24}px`
          }}
        >
          <EditorContent 
            editor={editor} 
            className="h-full"
          />
        </div>
      </div>
    </div>
  );
};

export default TextEditor;