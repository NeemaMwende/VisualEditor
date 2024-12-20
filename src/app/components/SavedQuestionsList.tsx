import React, { useState } from 'react';

interface Answer {
  text: string;
  isCorrect: boolean;
}

interface Question {
  id: number;
  title: string;
  difficulty: string;
  tags: string[];
  question: string;
  answers: Answer[];
  isExpanded?: boolean;
}

interface Markdown {
  id: number;
  content: string;
}

interface SavedQuestionsListProps {
  questions: Question[];
  markdowns: Markdown[];
  onEditQuestion: (question: Question) => void;
  onEditMarkdown: (markdown: Markdown) => void;
  setQuestions: (questions: Question[]) => void;
  setMarkdowns: (markdowns: Markdown[]) => void;
}

const SavedQuestionsList: React.FC<SavedQuestionsListProps> = ({
  questions,
  markdowns = [],
  onEditQuestion,
  onEditMarkdown,
  setQuestions,
  setMarkdowns
}) => {
  const [activeTab, setActiveTab] = useState<'questions' | 'markdowns'>('questions');

  const handleDeleteQuestion = (id: number) => {
    const updatedQuestions = questions.filter(q => q.id !== id);
    setQuestions(updatedQuestions);
  };

  const handleDeleteMarkdown = (id: number) => {
    const updatedMarkdowns = markdowns.filter(m => m.id !== id);
    setMarkdowns(updatedMarkdowns);
  };

  const handleToggleExpand = (id: number) => {
    setQuestions(questions.map(q =>
      q.id === id
        ? { ...q, isExpanded: !q.isExpanded }
        : { ...q, isExpanded: false }
    ));
  };

  // Function to save markdown content (doesn't download the file, just saves the markdown)
  const handleSaveMarkdown = (markdown: Markdown) => {
    // Handle saving markdown (e.g., save to state or backend)
    console.log('Saved markdown:', markdown);
    // Here you can add logic to save the markdown to your database or server
  };

  // Function to download markdown as a text file
  const handleDownloadMarkdown = (markdown: Markdown) => {
    const blob = new Blob([markdown.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `markdown-${markdown.id}.txt`; // File name for download
    link.click();
    URL.revokeObjectURL(url); // Clean up the URL object after download
  };

  // Function to download question as a text file
  const handleDownloadQuestion = (question: Question) => {
    const content = `Title: ${question.title}\nDifficulty: ${question.difficulty}\nTags: ${question.tags.join(', ')}\nQuestion: ${question.question}\n\nAnswers:\n${question.answers.map((answer, index) => `${String.fromCharCode(65 + index)}) ${answer.text}`).join('\n')}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `question-${question.id}.txt`; // File name for download
    link.click();
    URL.revokeObjectURL(url); // Clean up the URL object after download
  };

  const renderQuestions = () => (
    <div className="space-y-4">
      {questions.length === 0 ? (
        <p className="text-center text-gray-500 italic">No questions created yet.</p>
      ) : (
        questions.map((question) => (
          <div key={question.id} className="border rounded-lg shadow-sm overflow-hidden">
            <div
              className="bg-gray-50 p-4 flex flex-col cursor-pointer"
              onClick={() => handleToggleExpand(question.id)}
            >
              <div className="flex flex-col w-full space-y-2">
                <h4 className="font-medium text-lg">
                  <strong>Title:</strong> {question.title}
                </h4>

                <div className="w-full space-y-1">
                  <p className="text-sm text-gray-500"><strong>Difficulty:</strong> {question.difficulty}</p>
                  <p className="text-sm text-gray-500"><strong>Tags:</strong> {question.tags.join(', ')}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2 mt-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditQuestion(question);
                  }}
                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteQuestion(question.id);
                  }}
                  className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Delete
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadQuestion(question);
                  }}
                  className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Download
                </button>
              </div>
            </div>

            {question.isExpanded && (
              <div className="p-4 bg-white">
                <div className="font-medium mb-2">{question.question}</div>
                <div className="space-y-2">
                  {question.answers.map((answer, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded ${
                        answer.isCorrect ? 'bg-green-50 border-green-200' : 'bg-gray-50'
                      }`}
                    >
                      {String.fromCharCode(65 + index)}) {answer.text}
                      {answer.isCorrect && (
                        <span className="ml-2 text-green-600">✓</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );

  const renderMarkdowns = () => (
    <div className="space-y-4">
      {markdowns.length === 0 ? (
        <p className="text-center text-gray-500 italic">No markdowns created yet.</p>
      ) : (
        markdowns.map((markdown) => (
          <div key={markdown.id} className="border rounded-lg shadow-sm overflow-hidden">
            <div className="bg-gray-50 p-4 flex flex-col">
              <div className="w-full space-y-2">
                <h4 className="font-medium text-lg">
                  <strong>Markdown {markdown.id}</strong>
                </h4>
                <div className="w-full space-y-1">
                  <p className="text-sm text-gray-500">{markdown.content}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2 mt-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditMarkdown(markdown);
                  }}
                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteMarkdown(markdown.id);
                  }}
                  className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Delete
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSaveMarkdown(markdown);
                  }}
                  className="px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600"
                >
                  Save
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadMarkdown(markdown);
                  }}
                  className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Download
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex space-x-4 mb-4">
        <button
          onClick={() => setActiveTab('questions')}
          className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'questions' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          Questions
        </button>
        <button
          onClick={() => setActiveTab('markdowns')}
          className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'markdowns' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          Markdowns
        </button>
      </div>

      {/* Render active tab content */}
      {activeTab === 'questions' ? renderQuestions() : renderMarkdowns()}
    </div>
  );
};

export default SavedQuestionsList;
