import React from 'react';

interface QuestionEditorProps {
  content: string;
  setContent: (content: string) => void;
}

const QuestionEditor: React.FC<QuestionEditorProps> = ({ content, setContent }) => {
  const insertText = (syntax: string, placeholder: string) => {
    setContent(content + ` ${syntax}${placeholder}${syntax} `);
  };

  return (
    <div className="w-1/2">
      <h3 className="text-2xl font-semibold mb-2">Create Question</h3>
      
      {/* Toolbar for formatting */}
      <div className="mb-2 space-x-2">
        <button onClick={() => insertText('**', 'bold')} className="bg-gray-300 px-2 py-1 rounded">Bold</button>
        <button onClick={() => insertText('*', 'italic')} className="bg-gray-300 px-2 py-1 rounded">Italic</button>
        <button onClick={() => insertText('### ', 'Heading')} className="bg-gray-300 px-2 py-1 rounded">Heading</button>
        <button onClick={() => insertText('- ', 'List item')} className="bg-gray-300 px-2 py-1 rounded">List</button>
        <button onClick={() => insertText('> ', 'Quote')} className="bg-gray-300 px-2 py-1 rounded">Quote</button>
      </div>

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
