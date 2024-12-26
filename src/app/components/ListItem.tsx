import React from 'react';
import { BaseQuestion, MarkdownData } from '../components/Interfaces';

interface ListItemProps {
  item: BaseQuestion | MarkdownData;  
  viewMode: 'questions' | 'markdown';
  onEdit: (item: BaseQuestion | MarkdownData) => void;
  onDelete: (id: number) => void;
  onToggleExpand: (id: number) => void;
  saveAsMarkdown: (item: BaseQuestion) => void;
  handleDownload: (id: number) => void;
}

const ListItem: React.FC<ListItemProps> = ({
  item,
  viewMode,
  onEdit,
  onDelete,
  onToggleExpand,
  saveAsMarkdown,
  handleDownload
}) => {
  const isQuestion = viewMode === 'questions' && (item as BaseQuestion).question !== undefined;
  const isMarkdown = viewMode === 'markdown' && (item as MarkdownData).content !== undefined;
  
  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="cursor-pointer" onClick={() => onToggleExpand(item.id)}>
        <div className="flex flex-col space-y-2">
          <h3 className="text-lg font-semibold">{item.title}</h3>
          <div className="flex justify-end space-x-2 mt-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(item);
              }}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item.id);
              }}
              className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
            >
              Delete
            </button>
            {isQuestion && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  saveAsMarkdown(item as BaseQuestion);
                }}
                className="px-3 py-1 text-sm bg-purple-500 text-white rounded hover:bg-purple-600"
              >
                Save as MD
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownload(item.id);
              }}
              className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
            >
              Download
            </button>
          </div>
        </div>
      </div>

      {item.isExpanded && (
        <div className="mt-4 space-y-2 border-t pt-4">
          {isQuestion && (
            <div>
              <p className="font-medium">Question:</p>
              <p className="ml-4 mt-1 whitespace-pre-wrap break-words font-mono text-sm bg-gray-50 p-4 rounded max-w-full overflow-x-auto">{(item as BaseQuestion).question}</p>
              <div>
                <p className="font-medium">Answers:</p>
                <ul className="ml-8 list-disc space-y-1 mt-1">
                  {(item as BaseQuestion).answers.map((answer, index) => (
                    <li key={`answer-${item.id}-${index}`} className={answer.isCorrect ? 'text-green-600 font-medium' : ''}>
                      {answer.text}
                      {answer.isCorrect && ' (Correct)'}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {isMarkdown && (
            <pre className="whitespace-pre-wrap break-words font-mono text-sm bg-gray-50 p-4 rounded max-w-full overflow-x-auto">
              {(item as MarkdownData).content}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};

export default ListItem;
