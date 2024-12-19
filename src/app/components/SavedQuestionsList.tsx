// SavedQuestionsList.tsx
import React from 'react';

interface SavedQuestionsListProps {
  questions: Question[];
  onEdit: (question: Question) => void;
  setQuestions: (questions: Question[]) => void;
}

const SavedQuestionsList: React.FC<SavedQuestionsListProps> = ({
  questions,
  onEdit,
  setQuestions
}) => {
  const handleDelete = (id: number) => {
    const updatedQuestions = questions.filter(q => q.id !== id);
    setQuestions(updatedQuestions);
  };

  const handleToggleExpand = (id: number) => {
    setQuestions(questions.map(q =>
      q.id === id
        ? { ...q, isExpanded: !q.isExpanded }
        : { ...q, isExpanded: false }
    ));
  };

  return (
    <div className="space-y-4">
      {questions.length === 0 ? (
        <p className="text-center text-gray-500 italic">No questions created yet.</p>
      ) : (
        questions.map((question) => (
          <div
            key={question.id}
            className="border rounded-lg shadow-sm overflow-hidden"
          >
            <div 
              className="bg-gray-50 p-4 flex items-center justify-between cursor-pointer"
              onClick={() => handleToggleExpand(question.id)}
            >
              <div className="flex items-center space-x-3">
                <span className="font-mono text-gray-500">#{question.id}</span>
                <h4 className="font-medium text-lg">{question.title}</h4>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(question);
                  }}
                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(question.id);
                  }}
                  className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Delete
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
};

export default SavedQuestionsList;