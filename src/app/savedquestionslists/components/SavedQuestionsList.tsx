import React, { Dispatch, SetStateAction, useState } from 'react';
import { BaseQuestion, DashboardQuestion } from '@/app/components/Interfaces';
import { generateMarkdown, parseMarkdownContent } from '../../../utils/markdownUtils';
import { Trash2, Download, CheckSquare, Square } from 'lucide-react';

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
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      setQuestions(prevQuestions => 
        prevQuestions.filter(q => String(q.id) !== String(id))
      );
      setSelectedQuestions(prev => prev.filter(qId => qId !== id));
    }
  };

  const handleDeleteAll = () => {
    if (window.confirm('Are you sure you want to delete all questions? This action cannot be undone.')) {
      setQuestions([]);
      setSelectedQuestions([]);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedQuestions.length === 0) {
      alert('Please select questions to delete');
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete ${selectedQuestions.length} selected question(s)? This action cannot be undone.`)) {
      setQuestions(prevQuestions => 
        prevQuestions.filter(q => !selectedQuestions.includes(String(q.id)))
      );
      setSelectedQuestions([]);
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
      try {
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
      } catch (error) {
        console.error('Error parsing markdown content:', error);
        alert('Error parsing markdown content. Please check the format and try again.');
      }
      
    }
  };

  const downloadQuestion = (question: DashboardQuestion) => {
    try {
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
    } catch (error) {
      console.error('Error downloading question:', error);
      alert('Failed to download question. Please try again.');
    }
  };

  const downloadSelected = () => {
    if (selectedQuestions.length === 0) {
      alert('Please select questions to download');
      return;
    }
    questions
      .filter(q => selectedQuestions.includes(String(q.id)))
      .forEach(question => {
        downloadQuestion(question);
      });
  };

  const downloadAll = () => {
    if (questions.length === 0) {
      alert('No questions to download');
      return;
    }
    questions.forEach(question => downloadQuestion(question));
  };

  const toggleSelect = (id: string) => {
    setSelectedQuestions(prev => 
      prev.includes(id) 
        ? prev.filter(qId => qId !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedQuestions.length === questions.length) {
      setSelectedQuestions([]);
    } else {
      setSelectedQuestions(questions.map(q => String(q.id)));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          {questions.length > 0 && (
            <button
              onClick={toggleSelectAll}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 flex items-center gap-2"
            >
              {selectedQuestions.length === questions.length ? (
                <CheckSquare size={16} />
              ) : (
                <Square size={16} />
              )}
              {selectedQuestions.length === questions.length ? 'Deselect All' : 'Select All'}
            </button>
          )}
          {selectedQuestions.length > 0 && (
            <>
              <button
                onClick={handleDeleteSelected}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center gap-2"
              >
                <Trash2 size={16} />
                Delete Selected ({selectedQuestions.length})
              </button>
              <button
                onClick={downloadSelected}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2"
              >
                <Download size={16} />
                Download Selected ({selectedQuestions.length})
              </button>
            </>
          )}
        </div>
        {questions.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={downloadAll}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center gap-2"
            >
              <Download size={16} />
              Download All
            </button>
            <button
              onClick={handleDeleteAll}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center gap-2"
            >
              <Trash2 size={16} />
              Delete All
            </button>
          </div>
        )}
      </div>

      {questions.length === 0 ? (
        <p className="text-center text-gray-500 italic">No questions created yet. Create New Question to get started.</p>
      ) : (
        <div className="space-y-4">
          {questions.map((question) => (
            <div
              key={question.id}
              className={`border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow ${
                selectedQuestions.includes(String(question.id)) ? 'border-blue-500' : ''
              }`}
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
                    className="w-full h-64 p-4 font-mono text-sm bg-gray-50 rounded border focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                <div className="flex items-start gap-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelect(String(question.id));
                    }}
                    className="mt-1 text-gray-500 hover:text-blue-500 transition-colors"
                  >
                    {selectedQuestions.includes(String(question.id)) ? (
                      <CheckSquare className="w-5 h-5" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                  <div className="flex-grow">
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
                              className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="flex justify-end space-x-2 mt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(question);
                            }}
                            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditMarkdown(question);
                            }}
                            className="px-3 py-1 text-sm bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
                          >
                            Edit as MD
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(String(question.id));
                            }}
                            className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                          >
                            Delete
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadQuestion(question);
                            }}
                            className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
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
                  </div>
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