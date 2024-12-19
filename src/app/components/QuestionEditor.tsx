import React from 'react';

interface QuestionEditorProps {
  content: string;
  setContent: (content: string) => void;
}

const QuestionEditor: React.FC<QuestionEditorProps> = ({ content, setContent }) => {
  return (
    <div className="w-1/2">
      <h3 className="text-2xl font-semibold mb-2">Create Question</h3>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Start typing your question..."
        className="w-full h-96 p-4 border rounded-md shadow-md focus:outline-none"
      />
    </div>
  );
};

export default QuestionEditor;
