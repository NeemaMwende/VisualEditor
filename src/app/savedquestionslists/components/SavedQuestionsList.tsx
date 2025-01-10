"use client"
import React, { Dispatch, SetStateAction, useState } from 'react';
import { BaseQuestion, DashboardQuestion } from '@/app/components/Interfaces';
import { generateMarkdown, parseMarkdownContent } from '../../../utils/markdownUtils';

interface SavedQuestionsListProps {
  questions: DashboardQuestion[];
  onEdit: (question: BaseQuestion | DashboardQuestion) => void;
  setQuestions: Dispatch<SetStateAction<DashboardQuestion[]>>;
}

const SavedQuestionsList: React.FC<SavedQuestionsListProps> = ({ 
  questions, 
  onEdit, 
  setQuestions,
}) => {
  const [editingMarkdown, setEditingMarkdown] = useState<{id: string, content: string} | null>(null);

  const handleEditClick = (question: DashboardQuestion) => {
    console.log("Editing Question:", question);
    onEdit(question);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      setQuestions(prevQuestions => 
        prevQuestions.filter(q => String(q.id) !== String(id))
      );
    }
  };

  const toggleExpand = (id: string) => {
    setQuestions(questions.map(q =>
      q.id === String(id) ? { ...q, isExpanded: !q.isExpanded } : q
    ));
  };

  const handleEditMarkdown = (question: DashboardQuestion) => {
    const markdownContent = generateMarkdown(question);
    setEditingMarkdown({
      id: question.id,
      content: markdownContent
    });
  };

  const saveMarkdownChanges = () => {
    if (editingMarkdown) {
      const parsedData = parseMarkdownContent(editingMarkdown.content);
  
      const updatedQuestions = questions.map(q =>
        q.id === editingMarkdown.id
          ? {
              ...q,
              markdownContent: editingMarkdown.content,
              question: parsedData.question,
              answers: parsedData.answers,
              difficulty: parsedData.difficulty,
              tags: parsedData.tags,
            }
          : q
      );
  
      setQuestions(updatedQuestions);
      setEditingMarkdown(null);
    }
  };
  

  const downloadQuestion = (question: DashboardQuestion) => {
    const content = generateMarkdown(question);
    const filename = `${question.title.toLowerCase().replace(/\s+/g, '-')}.md`;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAll = () => {
    questions.forEach(question => {
      const content = generateMarkdown(question);
      const filename = `${question.title.toLowerCase().replace(/\s+/g, '-')}.md`;
      const blob = new Blob([content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-4">
        {questions.length > 0 && (
          <button
            onClick={downloadAll}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Download All
          </button>
        )}
      </div>

      {questions.length === 0 ? (
        <p className="text-center text-gray-500 italic">No questions created yet. Create New Question to get started.</p>
      ) : (
        <div className="space-y-4">
          {questions.map((question) => (
            <div
              key={question.id}
              className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              {editingMarkdown?.id === question.id ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Editing: {question.title}</h3>
                  <textarea
                    value={editingMarkdown.content}
                    onChange={(e) => setEditingMarkdown({
                      ...editingMarkdown,
                      content: e.target.value
                    })}
                    className="w-full h-64 p-4 font-mono text-sm bg-gray-50 rounded border"
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setEditingMarkdown(null)}
                      className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveMarkdownChanges}
                      className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div
                    className="cursor-pointer"
                    onClick={() => toggleExpand(String(question.id))}
                  >
                    <div className="flex flex-col space-y-2">
                      <h3 className="text-lg font-semibold">{question.title}</h3>
                      <div className="text-sm text-gray-600">
                        Difficulty: {question.difficulty}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {question.tags.map((tag, index) => (
                          <span
                            key={`tag-${question.id}-${index}`}
                            className="px-2 py-1 text-xs bg-blue-100 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex justify-end space-x-2 mt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClick(question);
                          }}
                          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditMarkdown(question);
                          }}
                          className="px-3 py-1 text-sm bg-purple-500 text-white rounded hover:bg-purple-600"
                        >
                          Edit as MD
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(String(question.id));
                          }}
                          className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          Delete
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadQuestion(question);
                          }}
                          className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                        >
                          Download
                        </button>
                      </div>
                    </div>
                  </div>

                  {question.isExpanded && (
                    <div className="mt-4 space-y-2 border-t pt-4">
                      <div className="space-y-4">
                        <div>
                          <p className="font-medium">Question:</p>
                          <p className="ml-4 mt-1 whitespace-pre-wrap break-words font-mono text-sm bg-gray-50 p-4 rounded max-w-full overflow-x-auto">
                            {question.question}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium">Answers:</p>
                          <ul className="ml-8 list-disc space-y-1 mt-1">
                            {question.answers.map((answer, index) => (
                              <li 
                                key={`answer-${question.id}-${index}`}
                                className={answer.isCorrect ? 'text-green-600 font-medium' : ''}
                              >
                                {answer.text}
                                {answer.isCorrect && ' (Correct)'}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedQuestionsList;