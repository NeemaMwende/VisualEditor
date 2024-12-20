"use client"

import React, { useState, useEffect } from 'react';

interface QuestionEditorProps {
  content?: string;
  setContent?: (content: string) => void;
  onSave: (data: { 
    question: string; 
    answers: { id: number; text: string; isCorrect: boolean }[]; 
    difficulty: number; 
    tags: string[];
    title?: string;
  }) => void;
  initialData?: { 
    question: string; 
    answers: { id: number; text: string; isCorrect: boolean }[];
    difficulty?: number;
    tags?: string[];
    title?: string;
  };
  isEditing?: boolean;
}

interface Answer {
  id: number;
  text: string;
  isCorrect: boolean;
}

interface Question {
  question: string;
  answers: Answer[];
  difficulty: number;
  tags: string[];
  title: string;
}

const QuestionEditor: React.FC<QuestionEditorProps> = ({
  onSave,
  initialData,
  isEditing = false
}) => {
  const [question, setQuestion] = useState('');
  const [answers, setAnswers] = useState<Answer[]>([
    { id: 1, text: '', isCorrect: false },
    { id: 2, text: '', isCorrect: false },
    { id: 3, text: '', isCorrect: false },
    { id: 4, text: '', isCorrect: false }
  ]);
  const [showMarkdown, setShowMarkdown] = useState(false);
  const [markdownContent, setMarkdownContent] = useState('');
  const [difficulty, setDifficulty] = useState(1);
  const [tags, setTags] = useState<string[]>([]);
  const [tagsInput, setTagsInput] = useState('');

  const detectAndWrapCode = (text: string): string => {
    const codePatterns = [
      /\b(const|let|var|function)\b.*[=;]/,  // JavaScript declarations
      /{[\s\S]*}/,                           // Object/block definitions
      /\b(useHash|pushState|useHTML5):/,     // Angular router options
      /<[^>]+>/,                             // HTML tags
      /\b(new \w+)\b/,                       // Class instantiation
      /\b\w+\((.*)\)/,                       // Function calls
      /import .* from/,                      // Import statements
      /export .*/,                           // Export statements
      /async|await/,                         // Async/await keywords
      /\.[a-zA-Z]+\((.*)\)/                 // Method calls
    ];

    const isCode = codePatterns.some(pattern => pattern.test(text));
    
    if (isCode) {
      let language = 'javascript';
      if (text.includes('useHash') || text.includes('pushState')) {
        language = 'typescript';
      } else if (text.includes('<') && text.includes('>')) {
        language = 'html';
      }
      
      return `\`\`\`${language}\n${text}\n\`\`\``;
    }
    
    return text;
  };

  // Load initial data on mount or when editing
  useEffect(() => {
    if (initialData) {
      setQuestion(initialData.question || '');
      setAnswers(initialData.answers.map(answer => ({
        ...answer,
        isCorrect: answer.isCorrect || false
      })));
      setDifficulty(initialData.difficulty || 1);
      if (initialData.tags) {
        setTags(initialData.tags);
        setTagsInput(initialData.tags.join(', '));
      }
    }
  }, [initialData]);

  // Load markdown content from localStorage if available
  useEffect(() => {
    const savedMarkdown = localStorage.getItem('markdownContent');
    if (savedMarkdown) {
      setMarkdownContent(savedMarkdown);
    }
  }, []);

  const generateMarkdown = () => {
    let md = '---\n';
    md += `difficulty: ${difficulty}\n`;
    md += `tags: ${tags.join(' ')}\n`;
    md += '---\n\n';

    const processedQuestion = detectAndWrapCode(question);
    md += `${processedQuestion}\n\n`;

    answers.forEach((answer) => {
      const processedAnswer = detectAndWrapCode(answer.text);
      md += `# ${answer.isCorrect ? 'Correct' : ''}\n`;
      md += `${processedAnswer}\n\n`;
    });

    return md.trim();
  };

  // Update markdown content whenever relevant data changes
  useEffect(() => {
    const markdown = generateMarkdown();
    setMarkdownContent(markdown);
    localStorage.setItem('markdownContent', markdown);
  }, [question, answers, difficulty, tags]);

  const handleAnswerChange = (index: number, text: string) => {
    const newAnswers = [...answers];
    newAnswers[index] = { ...newAnswers[index], text };
    setAnswers(newAnswers);
  };

  const handleCorrectAnswer = (index: number) => {
    const newAnswers = answers.map((answer, i) => ({
      ...answer,
      isCorrect: i === index
    }));
    setAnswers(newAnswers);
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setTagsInput(input);
    const newTags = input.split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
    setTags(newTags);
  };

  const handleSave = () => {
    const title = isEditing 
      ? initialData?.title || 'Untitled Question'
      : prompt('Enter a title for the question:', 'New Question') || 'Untitled Question';

    const savedData: Question = {
      question,
      answers,
      difficulty,
      tags,
      title
    };

    try {
      const existingQuestions: Question[] = JSON.parse(localStorage.getItem('questions') || '[]');
      if (isEditing && initialData?.title) {
        const updatedQuestions = existingQuestions.map((q) => 
          q.title === initialData.title ? savedData : q
        );
        localStorage.setItem('questions', JSON.stringify(updatedQuestions));
      } else {
        localStorage.setItem('questions', JSON.stringify([...existingQuestions, savedData]));
      }

      onSave(savedData);
    } catch (error) {
      console.error('Error saving question:', error);
      alert('Failed to save question. Please try again.');
    }
  };

  const handleSaveMarkdown = () => {
    localStorage.setItem('markdownContent', markdownContent);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-lg shadow-md">
        {!showMarkdown ? (
          <>
            <div className="mb-6">
              <div className="flex flex-col gap-4 m-4">
                <div className="w-full">
                  <select
                    value={difficulty}
                    onChange={e => setDifficulty(parseInt(e.target.value))}
                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={1}>Difficulty 1</option>
                    <option value={2}>Difficulty 2</option>
                    <option value={3}>Difficulty 3</option>
                  </select>
                </div>
                <div className="w-full">
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={handleTagsChange}
                    placeholder="Enter tags (comma-separated)"
                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <label className="block text-gray-700 text-sm font-bold mb-2">
                Question
              </label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Type your question here..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {answers.map((answer, index) => (
                <div key={answer.id} className="relative">
                  <div className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      checked={answer.isCorrect}
                      onChange={() => handleCorrectAnswer(index)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label className="ml-2 text-sm font-medium text-gray-700">
                      Answer {String.fromCharCode(65 + index)}
                    </label>
                  </div>
                  <textarea
                    value={answer.text}
                    onChange={(e) => handleAnswerChange(index, e.target.value)}
                    className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder={`Type answer ${String.fromCharCode(65 + index)} here...`}
                  />
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Markdown Preview
            </label>
            <pre className="w-full p-4 bg-gray-50 rounded-md font-mono text-sm whitespace-pre-wrap">
              {markdownContent}
            </pre>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            onClick={() => setShowMarkdown(!showMarkdown)}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            {showMarkdown ? 'Edit Question' : 'View Markdown'}
          </button>
          {!showMarkdown && (
            <button
              onClick={handleSave}
              className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600"
            >
              {isEditing ? 'Save Changes' : 'Save Question'}
            </button>
          )}
          {showMarkdown && (
            <button
              onClick={handleSaveMarkdown}
              className="px-4 py-2 text-white bg-green-500 rounded-md hover:bg-green-600"
            >
              Save Markdown
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionEditor;