import React from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownPreviewProps {
  content: string;
}

const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ content }) => {
  return (
    <div className="w-1/2">
      <h3 className="text-2xl font-semibold mb-2">Markdown Preview</h3>
      <div className="w-full h-96 p-4 border rounded-md shadow-md overflow-y-auto bg-white">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  );
};

export default MarkdownPreview;
