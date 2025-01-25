import React, { useRef, useState } from "react";

const TextSelectionFormatter: React.FC = () => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null); 
  const [format, setFormat] = useState<string>("");

  const handleApplyFormat = () => {
    const textArea = textAreaRef.current;

    if (!textArea) {
      console.error("Textarea element not found.");
      return;
    }

    // Get the selection start and end
    const selectionStart = textArea.selectionStart || 0;
    const selectionEnd = textArea.selectionEnd || 0;

    if (selectionStart === selectionEnd) {
      alert("Please select some text to format.");
      return;
    }

    const selectedText = textArea.value.slice(selectionStart, selectionEnd);

    if (!format) {
      alert("Please select a format from the dropdown!");
      return;
    }

    const formattedText = `\`\`\`${format}\n${selectedText}\n\`\`\``;

    const beforeText = textArea.value.slice(0, selectionStart);
    const afterText = textArea.value.slice(selectionEnd);
    textArea.value = `${beforeText}${formattedText}${afterText}`;

    const newCaretPosition = beforeText.length + formattedText.length;
    textArea.setSelectionRange(newCaretPosition, newCaretPosition);

    textArea.focus();
  };

  return (
    <div className="p-6 font-sans">
      <textarea
        ref={textAreaRef}
        className="w-full h-48 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
        defaultValue="What is the output of the code below. \n\nConst a = 12;\nConst b = 13;\nsum = a + b;\nconsole.log(sum);"
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
      </div>
    </div>
  );
};

export default TextSelectionFormatter;
