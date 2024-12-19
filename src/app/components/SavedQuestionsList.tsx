import React from 'react';

interface SavedQuestionsListProps {
  questions: string[];
  setCurrentContent: (content: string) => void;
  setQuestions: (questions: string[]) => void;
}

const SavedQuestionsList: React.FC<SavedQuestionsListProps> = ({ questions, setCurrentContent, setQuestions }) => {
  const handleDelete = (index: number) => {
    const updatedQuestions = questions.filter((_, i) => i !== index);
    setQuestions(updatedQuestions);
  };

  return (
    <div>
      <h3 className="text-2xl font-semibold mb-4">Saved Questions</h3>
      {questions.length === 0 ? (
        <p>No saved questions yet.</p>
      ) : (
        questions.map((question, index) => (
          <div key={index} className="p-4 border rounded-md mb-2 flex justify-between items-center">
            <div className="w-3/4 truncate">{question}</div>
            <div className="flex gap-2">
              <button onClick={() => setCurrentContent(question)} className="bg-yellow-500 text-white px-2 py-1 rounded">
                Edit
              </button>
              <button onClick={() => handleDelete(index)} className="bg-red-500 text-white px-2 py-1 rounded">
                Delete
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default SavedQuestionsList;
