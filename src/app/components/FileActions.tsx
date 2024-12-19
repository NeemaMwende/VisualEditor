import React from 'react';
import { saveAs } from 'file-saver';

interface FileActionsProps {
  content: string;
  onSave: (markdown: string) => void;
  setContent: (content: string) => void;
}

const FileActions: React.FC<FileActionsProps> = ({ content, onSave, setContent }) => {
  const handleSave = () => {
    if (content) {
      onSave(content);
    }
  };

  const handleDownloadMarkdown = () => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    saveAs(blob, 'question.md');
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setContent(event.target?.result as string);
      reader.readAsText(file);
    }
  };

  return (
    <div className="flex gap-4 mb-6">
      <button onClick={handleSave} className="bg-blue-500 text-white px-4 py-2 rounded">
        Save Question
      </button>
      <button onClick={handleDownloadMarkdown} className="bg-green-500 text-white px-4 py-2 rounded">
        Download as Markdown
      </button>
      <input type="file" accept=".md" onChange={handleUpload} className="border p-2 rounded" />
    </div>
  );
};

export default FileActions;
