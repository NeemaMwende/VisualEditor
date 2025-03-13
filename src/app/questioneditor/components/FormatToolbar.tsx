"use client";
import React from "react";
import { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  // Link,
  // Image,
} from "lucide-react";

interface FormatToolbarProps {
  editor: Editor | null;
}

const FormatToolbar: React.FC<FormatToolbarProps> = ({ editor }) => {
  if (!editor) return null;

  return (
    <div className="flex gap-2 p-2 border-b bg-gray-100">
      <button onClick={() => editor.chain().focus().toggleBold().run()} className="btn">
        <Bold size={16} />
      </button>
      <button onClick={() => editor.chain().focus().toggleItalic().run()} className="btn">
        <Italic size={16} />
      </button>
      <button onClick={() => editor.chain().focus().toggleUnderline().run()} className="btn">
        <Underline size={16} />
      </button>
      <button onClick={() => editor.chain().focus().toggleStrike().run()} className="btn">
        <Strikethrough size={16} />
      </button>

      {editor.can().setTextAlign?.("left") && (
        <button onClick={() => editor.chain().focus().setTextAlign("left").run()} className="btn">
          <AlignLeft size={16} />
        </button>
      )}
      {editor.can().setTextAlign?.("center") && (
        <button onClick={() => editor.chain().focus().setTextAlign("center").run()} className="btn">
          <AlignCenter size={16} />
        </button>
      )}
      {editor.can().setTextAlign?.("right") && (
        <button onClick={() => editor.chain().focus().setTextAlign("right").run()} className="btn">
          <AlignRight size={16} />
        </button>
      )}

      <button onClick={() => editor.chain().focus().toggleBulletList().run()} className="btn">
        <List size={16} />
      </button>
      <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className="btn">
        <ListOrdered size={16} />
      </button>
      {/* <button onClick={() => {
        const url = prompt("Enter image URL");
        if (url) editor.chain().focus().setImage({ src: url }).run();
      }} className="btn">
        <Image size={16} />
      </button>
      <button onClick={() => {
        const url = prompt("Enter URL");
        if (url) editor.chain().focus().setLink({ href: url }).run();
      }} className="btn">
        <Link size={16} />
      </button> */}
    </div>
  );
};

export default FormatToolbar;
