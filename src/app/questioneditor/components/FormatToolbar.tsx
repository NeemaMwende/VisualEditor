import React from "react";
import { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline,
  Code,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
} from "lucide-react";

interface FormatToolbarProps {
  editor: Editor | null;
}

const FormatToolbar: React.FC<FormatToolbarProps> = ({ editor }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1 p-1 border-b editor-toolbar">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-1 rounded ${
          editor.isActive("bold") ? "bg-gray-200" : "hover:bg-gray-100"
        }`}
        title="Bold"
      >
        <Bold size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-1 rounded ${
          editor.isActive("italic") ? "bg-gray-200" : "hover:bg-gray-100"
        }`}
        title="Italic"
      >
        <Italic size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`p-1 rounded ${
          editor.isActive("underline") ? "bg-gray-200" : "hover:bg-gray-100"
        }`}
        title="Underline"
      >
        <Underline size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={`p-1 rounded ${
          editor.isActive("codeBlock") ? "bg-gray-200" : "hover:bg-gray-100"
        }`}
        title="Code Block"
      >
        <Code size={16} />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1"></div>

      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        className={`p-1 rounded ${
          editor.isActive({ textAlign: "left" }) ? "bg-gray-200" : "hover:bg-gray-100"
        }`}
        title="Align Left"
      >
        <AlignLeft size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        className={`p-1 rounded ${
          editor.isActive({ textAlign: "center" }) ? "bg-gray-200" : "hover:bg-gray-100"
        }`}
        title="Align Center"
      >
        <AlignCenter size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        className={`p-1 rounded ${
          editor.isActive({ textAlign: "right" }) ? "bg-gray-200" : "hover:bg-gray-100"
        }`}
        title="Align Right"
      >
        <AlignRight size={16} />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1"></div>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-1 rounded ${
          editor.isActive("bulletList") ? "bg-gray-200" : "hover:bg-gray-100"
        }`}
        title="Bullet List"
      >
        <List size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-1 rounded ${
          editor.isActive("orderedList") ? "bg-gray-200" : "hover:bg-gray-100"
        }`}
        title="Ordered List"
      >
        <ListOrdered size={16} />
      </button>
    </div>
  );
};

export default FormatToolbar;