import React, { useRef, useState } from "react";
import { FaUndo } from "react-icons/fa";

const TextSelectionFormatter: React.FC = () => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null); 
  const [format, setFormat] = useState<string>("");
  const [originalText, setOriginalText] = useState<string>(""); // Stores the text before formatting
  const [selectionStart, setSelectionStart] = useState<number>(0);
  const [selectionEnd, setSelectionEnd] = useState<number>(0);

  const handleApplyFormat = () => {
    const textArea = textAreaRef.current;

    if (!textArea) {
      console.error("Textarea element not found.");
      return;
    }

    const start = textArea.selectionStart || 0;
    const end = textArea.selectionEnd || 0;

    if (start === end) {
      alert("Please select some text to format.");
      return;
    }

    const selectedText = textArea.value.slice(start, end);

    if (!format) {
      alert("Please select a format from the dropdown!");
      return;
    }

    const formattedText = `\`\`\`${format}${selectedText}\`\`\``;

    const beforeText = textArea.value.slice(0, start);
    const afterText = textArea.value.slice(end);
    textArea.value = `${beforeText}${formattedText}${afterText}`;

    const newCaretPosition = beforeText.length + formattedText.length;
    textArea.setSelectionRange(newCaretPosition, newCaretPosition);

    // Save original text
    setOriginalText(textArea.value); // Save original before applying format
    setSelectionStart(newCaretPosition);
    setSelectionEnd(newCaretPosition);

    textArea.focus();
  };

  const handleUndo = () => {
    const textArea = textAreaRef.current;

    if (!textArea) {
      console.error("Textarea element not found.");
      return;
    }
    
    textArea.value = originalText;
    textArea.setSelectionRange(selectionStart, selectionEnd);

    textArea.focus();
  };

  return (
    <div className="p-6 font-sans">
      <textarea
        ref={textAreaRef}
        className="w-full h-48 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
        defaultValue="What is the output of the code below. Const a = 12; Const b = 13; sum = a + b; console.log(sum);"
      />
      <div className="mt-4 flex items-center gap-4">
        <select
          value={format}
          onChange={(e) => setFormat(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="">Select Format</option>
          <option value="javascript">JavaScript</option>
          <option value="html">HTML</option>
        </select>
        <button
          onClick={handleApplyFormat}
          className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          Apply Format
        </button>
        <div
          onClick={handleUndo}
          className="relative cursor-pointer"
          title="Undo changes"
        >
          <FaUndo className="text-xl text-gray-600 hover:text-gray-800" />
        </div>
      </div>
    </div>
  );
};

export default TextSelectionFormatter;
