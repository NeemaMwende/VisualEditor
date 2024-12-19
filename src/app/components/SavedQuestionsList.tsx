// types.ts
interface Question {
  id: number;
  title: string;
  content: string;
  isExpanded: boolean;
}

// SavedQuestionsList.tsx
import React, { useState } from 'react';

interface SavedQuestionsListProps {
  questions: Question[];
  setCurrentContent: (content: string) => void;
  setQuestions: (questions: Question[]) => void;
  currentlyEditing: number | null;
  setCurrentlyEditing: (id: number | null) => void;
}

const SavedQuestionsList: React.FC<SavedQuestionsListProps> = ({
  questions,
  setCurrentContent,
  setQuestions,
  currentlyEditing,
  setCurrentlyEditing
}) => {
  const [newTitle, setNewTitle] = useState('');
  
  const handleDelete = (id: number) => {
    const updatedQuestions = questions.filter(q => q.id !== id);
    setQuestions(updatedQuestions);
  };

  const handleEdit = (question: Question) => {
    setCurrentlyEditing(question.id);
    setCurrentContent(question.content);
  };

  const handleSaveEdit = (editedContent: string) => {
    if (currentlyEditing === null) return;

    const updatedQuestions = questions.map(q =>
      q.id === currentlyEditing
        ? { ...q, content: editedContent }
        : q
    );
    setQuestions(updatedQuestions);
    setCurrentlyEditing(null);
    setCurrentContent('');
  };

  const handleToggleExpand = (id: number) => {
    setQuestions(questions.map(q =>
      q.id === id
        ? { ...q, isExpanded: !q.isExpanded }
        : { ...q, isExpanded: false }
    ));
  };

  const promptForTitle = () => {
    return new Promise<string>((resolve) => {
      const title = window.prompt('Enter a title for this question:', '');
      resolve(title || 'Untitled Question');
    });
  };

  return (
    <div className="mt-8">
      <h3 className="text-2xl font-semibold mb-4">Saved Questions</h3>
      
      {questions.length === 0 ? (
        <p className="text-gray-500 italic">No saved questions yet.</p>
      ) : (
        <div className="space-y-4">
          {questions.map((question, index) => (
            <div
              key={question.id}
              className="border rounded-lg shadow-sm overflow-hidden"
            >
              {/* Question Header */}
              <div 
                className="bg-gray-50 p-4 flex items-center justify-between cursor-pointer"
                onClick={() => handleToggleExpand(question.id)}
              >
                <div className="flex items-center space-x-3">
                  <span className="font-mono text-gray-500">#{question.id}</span>
                  <h4 className="font-medium text-lg">{question.title}</h4>
                </div>
                <div className="flex items-center space-x-2">
                  {currentlyEditing === question.id ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveEdit(question.content);
                      }}
                      className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
                    >
                      Save Changes
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(question);
                      }}
                      className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                    >
                      Edit
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(question.id);
                    }}
                    className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Question Content */}
              {question.isExpanded && (
                <div className="p-4 bg-white">
                  <pre className="whitespace-pre-wrap font-mono text-sm">
                    {question.content}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedQuestionsList;