'use client';

import React, { useState, useEffect } from 'react';
import FroalaEditorComponent from 'react-froala-wysiwyg';
import 'froala-editor/css/froala_editor.pkgd.min.css';
import { saveAs } from 'file-saver';
import { marked } from 'marked';

const VisualEditor = () => {
  const [content, setContent] = useState<string>(''); // Froala content
  const [markdown, setMarkdown] = useState<string>(''); // Markdown content
  const [fileName, setFileName] = useState<string>('questions.md');

  // Handle Froala content changes
  const handleModelChange = (newContent: string) => {
    setContent(newContent);
    generateMarkdown(newContent);
  };

  // Generate markdown based on content
  const generateMarkdown = (html: string) => {
    const markdownText = `---\ndifficulty: 3\ntags: advanced-angular-architecture-2\n---\n\n${html}`;
    setMarkdown(markdownText);
  };

  // Export markdown file
  const exportMarkdown = () => {
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    saveAs(blob, fileName);
  };

  // Load markdown from file input
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setMarkdown(content);
        setContent(content);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4 text-center">Visual Question Editor</h1>
      <div dangerouslySetInnerHTML={{ __html: marked(content) }} />
      {/* Froala Editor */}
      <FroalaEditorComponent
        model={content}
        onModelChange={handleModelChange}
        config={{
          placeholderText: 'Enter your question and answers here...',
          charCounterCount: true,
          charCounterMax: 5000,
          saveInterval: 2000,
        }}
      />

      {/* File Input for Importing Markdown */}
      <div className="my-4">
        <input type="file" accept=".md" onChange={handleFileUpload} />
      </div>

      {/* Buttons */}
      <div className="flex justify-center gap-4">
        <button onClick={exportMarkdown} className="bg-blue-500 text-white px-4 py-2 rounded">
          Export as Markdown
        </button>
      </div>
    </div>
  );
};

export default VisualEditor;
