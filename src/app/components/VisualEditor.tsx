'use client';
import React, { useState, useEffect } from 'react';
import { saveAs } from 'file-saver';
import { marked } from 'marked';

const VisualEditor = () => {
  const [content, setContent] = useState<string>(''); // Raw text content
  const [markdownContent, setMarkdownContent] = useState<string>(''); // Markdown syntax version
  const [previewContent, setPreviewContent] = useState<string>(''); // HTML preview content
  const [fileName, setFileName] = useState<string>('questions.md');

  // Update preview whenever markdown content changes
  useEffect(() => {
    try {
      const htmlContent = marked(markdownContent);
      setPreviewContent(htmlContent);
    } catch (error) {
      console.error('Error converting markdown to HTML:', error);
    }
  }, [markdownContent]);

  // Handle content changes in the text editor
  const handleModelChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = event.target.value;
    setContent(newContent);
    // Convert the plain text to markdown syntax
    generateMarkdown(newContent);
  };

  // Generate markdown syntax from plain text
  const generateMarkdown = (plainText: string) => {
    // Convert plain text to markdown syntax
    const markdownText = plainText
      .split('\n')
      .map(line => {
        if (line.trim().startsWith('Q:')) return `## ${line.trim()}`;
        if (line.trim().startsWith('A:')) return `* ${line.trim()}`;
        return line;
      })
      .join('\n');
    
    setMarkdownContent(markdownText);
  };

  // Export markdown file
  const exportMarkdown = () => {
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    saveAs(blob, fileName);
  };

  // Load markdown file and handle content display
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const text = await file.text();
        
        // Store the original markdown content
        setMarkdownContent(text);
        
        // Convert markdown to plain text for the editor
        const plainText = text
          .replace(/^##\s*(Q:.*)$/gm, '$1')
          .replace(/^\*\s*(A:.*)$/gm, '$1')
          .trim();
        
        setContent(plainText);
        
        // Update preview
        const htmlContent = marked(text);
        setPreviewContent(htmlContent);
        
        // Update filename
        setFileName(file.name);
      } catch (error) {
        console.error('Error reading file:', error);
      }
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4 text-center">Visual Question Editor</h1>
      
      {/* Split view container */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Left side: Markdown syntax view */}
        <div className="markdown-syntax p-4 border rounded-md bg-gray-50">
          <h3 className="text-xl font-semibold mb-2">Markdown Syntax</h3>
          <pre className="whitespace-pre-wrap font-mono text-sm overflow-auto max-h-[400px]">
            {markdownContent}
          </pre>
        </div>
        
        {/* Right side: Rendered preview */}
        <div className="markdown-preview p-4 border rounded-md bg-white">
          <h3 className="text-xl font-semibold mb-2">Rendered Preview</h3>
          <div 
            className="prose max-w-none overflow-auto max-h-[400px]"
            dangerouslySetInnerHTML={{ __html: previewContent }} 
          />
        </div>
      </div>
      
      {/* Text Area for Plain Text Editing */}
      <div className="my-4">
        <h3 className="text-xl font-semibold mb-2">Question Editor</h3>
        <textarea
          value={content}
          onChange={handleModelChange}
          className="w-full h-64 p-4 border rounded-md"
          placeholder="Enter your questions and answers here...
Example:
Q: What is React?
A: React is a JavaScript library for building user interfaces"
        />
      </div>

      {/* File Actions */}
      <div className="flex items-center gap-4 my-4">
        <div className="flex-1">
          <input 
            type="file" 
            accept=".md" 
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
        </div>
        <button 
          onClick={exportMarkdown} 
          className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition-colors"
        >
          Export as Markdown
        </button>
      </div>
    </div>
  );
};

export default VisualEditor;