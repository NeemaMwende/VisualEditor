// // QuestionEditor.tsx
// import React from 'react';

// interface QuestionEditorProps {
//   content: string;
//   setContent: (content: string) => void;
// }

// const QuestionEditor: React.FC<QuestionEditorProps> = ({ content, setContent }) => {
//   return (
//     <div className="w-1/2">
//       <h3 className="text-2xl font-semibold mb-2">Create Question</h3>
      
//       <textarea
//         value={content}
//         onChange={(e) => setContent(e.target.value)}
//         placeholder="Start typing your question..."
//         className="w-full h-96 p-4 border rounded-md shadow-md focus:outline-none"
//       />
//     </div>
//   );
// };

// export default QuestionEditor;
// interface Answer {
//   text: string;
//   isCorrect: boolean;
// }

// interface Question {
//   id: number;
//   title: string;
//   question: string;
//   answers: Answer[];
//   isExpanded: boolean;
// }

"use client"

import React from 'react';
import { useState, useEffect } from 'react';

interface QuestionEditorProps {
  content: string;
  setContent: (content: string) => void;
  onSave: (questionData: {
    question: string;
    answers: Answer[];
  }) => void;
  initialData?: {
    question: string;
    answers: Answer[];
  };
  isEditing: boolean;
}

const QuestionEditor: React.FC<QuestionEditorProps> = ({
  onSave,
  initialData,
  isEditing
}) => {
  const [question, setQuestion] = useState('');
  const [answers, setAnswers] = useState<Answer[]>([
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false }
  ]);
  const [showMarkdown, setShowMarkdown] = useState(false);
  const [markdownContent, setMarkdownContent] = useState('');

  useEffect(() => {
    if (initialData) {
      setQuestion(initialData.question);
      setAnswers(initialData.answers);
    }
  }, [initialData]);

  useEffect(() => {
    // Generate markdown whenever question or answers change
    const markdown = generateMarkdown();
    setMarkdownContent(markdown);
  }, [question, answers]);

  const generateMarkdown = () => {
    let md = `## Q: ${question}\n\n`;
    answers.forEach((answer, index) => {
      md += `* ${String.fromCharCode(65 + index)}) ${answer.text}${answer.isCorrect ? ' [✓]' : ''}\n`;
    });
    return md;
  };

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

  const handleSave = () => {
    onSave({ question, answers });
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-lg shadow-md">
        {!showMarkdown ? (
          <>
            {/* Question Input */}
            <div className="mb-6">
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

            {/* Answers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {answers.map((answer, index) => (
                <div key={index} className="relative">
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
              Markdown Editor
            </label>
            <pre className="w-full p-4 bg-gray-50 rounded-md font-mono text-sm">
              {markdownContent}
            </pre>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => setShowMarkdown(!showMarkdown)}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            {showMarkdown ? 'Edit Question' : 'View Markdown'}
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600"
          >
            {isEditing ? 'Save Changes' : 'Save Question'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionEditor;
