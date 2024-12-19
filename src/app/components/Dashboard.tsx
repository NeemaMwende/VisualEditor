'use client';
import React, { useState, useEffect } from 'react';
import QuestionEditor from './QuestionEditor';
import SavedQuestionsList from './SavedQuestionsList';

// Define Question type
interface Question {
  id: number;
  title: string;
  content: string;
  isExpanded: boolean;
}

const Dashboard = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [plainContent, setPlainContent] = useState('');
  const [markdownContent, setMarkdownContent] = useState('');
  const [currentlyEditing, setCurrentlyEditing] = useState<number | null>(null);
  const [nextId, setNextId] = useState(1);

  // Convert plain text to markdown whenever content changes
  useEffect(() => {
    const convertToMarkdown = (text: string) => {
      return text
        .split('\n')
        .map(line => {
          const trimmedLine = line.trim();
          if (trimmedLine.startsWith('Q:')) return `## ${trimmedLine}`;
          if (trimmedLine.startsWith('A:')) return `* ${trimmedLine}`;
          return line;
        })
        .join('\n');
    };

    const newMarkdown = convertToMarkdown(plainContent);
    setMarkdownContent(newMarkdown);
  }, [plainContent]);

  // Prompt for question title
  const promptForTitle = async () => {
    const title = window.prompt('Enter a title for this question:', '');
    return title || 'Untitled Question';
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const text = await file.text();
        setMarkdownContent(text); // Display markdown in preview
        
        // Convert markdown to plain text for editor
        const plainText = text
          .replace(/^##\s*(Q:.*)$/gm, '$1')
          .replace(/^\*\s*(A:.*)$/gm, '$1')
          .replace(/^[-*]\s*/gm, '')
          .trim();
        
        setPlainContent(plainText);
      } catch (error) {
        console.error('Error reading file:', error);
      }
    }
  };

  // Handle saving questions
  const handleSaveQuestion = async () => {
    if (markdownContent.trim()) {
      if (currentlyEditing !== null) {
        // Update existing question
        const updatedQuestions = questions.map(q =>
          q.id === currentlyEditing
            ? { ...q, content: markdownContent }
            : q
        );
        setQuestions(updatedQuestions);
        setCurrentlyEditing(null);
      } else {
        // Create new question
        const title = await promptForTitle();
        const newQuestion: Question = {
          id: nextId,
          title,
          content: markdownContent,
          isExpanded: false
        };
        setQuestions([...questions, newQuestion]);
        setNextId(nextId + 1);
      }
      setPlainContent('');
      setMarkdownContent('');
    }
  };

  // Export markdown file
  const handleExport = () => {
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'questions.md';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-2 text-center">Question Editor Dashboard</h1>
      <h2 className="text-lg mb-6 text-center">Let's create some questions!</h2>

      <div className="flex gap-8 mb-6">
        <QuestionEditor 
          content={plainContent} 
          setContent={setPlainContent} 
        />

        <div className="w-1/2">
          <h3 className="text-2xl font-semibold mb-2">Markdown Preview</h3>
          <div className="border rounded-md p-4 h-96 bg-gray-50 overflow-auto">
            <pre className="whitespace-pre-wrap font-mono text-sm">
              {markdownContent}
            </pre>
          </div>
        </div>
      </div>

      <div className="flex gap-4 justify-center mb-6">
        <div className="flex-1 max-w-md">
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
          onClick={handleSaveQuestion}
          className={`px-6 py-2 rounded-md text-white ${
            currentlyEditing !== null 
              ? 'bg-green-500 hover:bg-green-600' 
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {currentlyEditing !== null ? 'Save Changes' : 'Save Question'}
        </button>
        <button
          onClick={handleExport}
          className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600"
        >
          Download Markdown
        </button>
      </div>

      <SavedQuestionsList
        questions={questions}
        setCurrentContent={setPlainContent}
        setQuestions={setQuestions}
        currentlyEditing={currentlyEditing}
        setCurrentlyEditing={setCurrentlyEditing}
      />
    </div>
  );
};

export default Dashboard;