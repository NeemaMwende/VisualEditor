import React, { useState } from 'react';
import { MarkdownData, MarkdownEditData } from '@/app/components/Interfaces';
import { generateMarkdown, parseMarkdownContent } from '../../../utils/markdownUtils';
import { Trash2, CheckSquare, Square } from 'lucide-react';
import { Question, DashboardQuestion } from '../../components/Dashboard';

interface SavedQuestionsListProps {
  questions: DashboardQuestion[];
  onEdit: (question: Question) => void;
  setQuestions: React.Dispatch<React.SetStateAction<DashboardQuestion[]>>;
  onEditMarkdown: (markdown: MarkdownEditData) => void;
  markdowns: MarkdownData[];
  setMarkdowns: React.Dispatch<React.SetStateAction<MarkdownData[]>>;
  fileSystem: {
    handle: FileSystemDirectoryHandle | null;
    path: string;
  };
}

interface ParsedMarkdownData {
  title: string;
  question: string;
  answers: { id: string; text: string; isCorrect: boolean; }[];
  difficulty: number;
  tags: string[];
  markdownContent: string;
}

const SavedQuestionsList: React.FC<SavedQuestionsListProps> = ({ 
  questions, 
  onEdit, 
  setQuestions,
  fileSystem,
}) => {
  const [editingMarkdown, setEditingMarkdown] = useState<{
    id: string;
    content: string;
    filename: string;
    originalTitle: string;
  } | null>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);

  const handleDelete = async (id: string) => {
    if (!fileSystem.handle) return;

    if (window.confirm('Are you sure you want to delete this question? This will remove the file from your local directory.')) {
      try {
        const questionToDelete = questions.find(q => q.id === id);
        if (questionToDelete) {
          const filename = `${questionToDelete.title.toLowerCase().replace(/\s+/g, '-')}.md`;
          await fileSystem.handle.removeEntry(filename);
          
          setQuestions(prevQuestions => 
            prevQuestions.filter(q => q.id !== id)
          );
          setSelectedQuestions(prev => prev.filter(qId => qId !== id));
        }
      } catch (error) {
        console.error('Error deleting file:', error);
        if ((error as Error).name === 'NotFoundError') {
          setQuestions(prevQuestions => 
            prevQuestions.filter(q => q.id !== id)
          );
        } else {
          alert('Failed to delete file. Please check permissions and try again.');
        }
      }
    }
  };

  const handleDeleteSelected = async () => {
    if (!fileSystem.handle || selectedQuestions.length === 0) {
      alert(fileSystem.handle ? 'Please select questions to delete' : 'Please select a directory first');
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete ${selectedQuestions.length} selected question(s)?`)) {
      for (const id of selectedQuestions) {
        const questionToDelete = questions.find(q => q.id === id);
        if (questionToDelete) {
          const filename = `${questionToDelete.title.toLowerCase().replace(/\s+/g, '-')}.md`;
          try {
            await fileSystem.handle.removeEntry(filename);
          } catch (error) {
            if ((error as Error).name !== 'NotFoundError') {
              console.error(`Error deleting file ${filename}:`, error);
            }
          }
        }
      }

      setQuestions(prevQuestions => 
        prevQuestions.filter(q => !selectedQuestions.includes(q.id))
      );
      setSelectedQuestions([]);
    }
  };

  const toggleExpand = (id: string) => {
    setQuestions(questions.map(q =>
      q.id === id ? { ...q, isExpanded: !q.isExpanded } : q
    ));
  };

  const handleEditMarkdown = (question: DashboardQuestion) => {
    const filename = `${question.title.toLowerCase().replace(/\s+/g, '-')}.md`;
    
    const markdownContent = generateMarkdown(question,
      question.enableCodeFormatting || false,
      question.codeLanguage || 'javascript'
    );
    setEditingMarkdown({
      id: question.id,
      content: markdownContent,
      filename: filename,
      originalTitle: question.title
    });
  };

  const saveMarkdownChanges = async () => {
    if (!fileSystem.handle || !editingMarkdown) {
      alert(fileSystem.handle ? 'No changes to save' : 'Please select a directory first');
      return;
    }
  
    try {
      const parsedData = parseMarkdownContent(editingMarkdown.content) as ParsedMarkdownData;
      if (!parsedData) {
        throw new Error('Invalid markdown format');
      }
  
      const originalQuestion = questions.find(q => q.id === editingMarkdown.id);
      if (!originalQuestion) {
        throw new Error('Question not found');
      }
  
      const updatedTitle = parsedData.title || editingMarkdown.originalTitle;
      
      let fileHandle: FileSystemFileHandle;
      try {
        fileHandle = await fileSystem.handle.getFileHandle(editingMarkdown.filename);
      } catch (error) {
        if ((error as Error).name === 'NotFoundError') {
          fileHandle = await fileSystem.handle.getFileHandle(editingMarkdown.filename, { create: true });
        } else {
          throw error;
        }
      }
  
      // Write the updated content to the existing file
      const writable = await fileHandle.createWritable();
      await writable.write(editingMarkdown.content);
      await writable.close();
  
      setQuestions(prevQuestions =>
        prevQuestions.map(q =>
          q.id === editingMarkdown.id
            ? {
                ...q,
                title: updatedTitle,
                question: parsedData.question,
                answers: parsedData.answers.map(answer => ({
                  ...answer,
                  id: answer.id || Math.random().toString(36).substr(2, 9)
                })),
                difficulty: parsedData.difficulty,
                tags: parsedData.tags,
                markdownContent: editingMarkdown.content,
                enableCodeFormatting: parsedData.enableCodeFormatting,
                type: 'question'
              }
            : q
        )
      );
  
      setEditingMarkdown(null);
    } catch (error) {
      console.error('Error saving markdown changes:', error);
      alert('Error saving changes: ' + ((error as Error).message || 'Please check the markdown format and try again.'));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedQuestions(prev => 
      prev.includes(id) 
        ? prev.filter(qId => qId !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    setSelectedQuestions(prev =>
      prev.length === questions.length ? [] : questions.map(q => q.id)
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex justify-between items-center mb-4">
          {fileSystem.handle && (
            <span className="text-gray-600">
              Working directory: {fileSystem.path}
            </span>
          )}
        </div>
        {selectedQuestions.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={handleDeleteSelected}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center gap-2"
            >
              <Trash2 size={16} />
              Delete Selected
            </button>
          </div>
        )}
      </div>

      {questions.length === 0 ? (
        <p className="text-center text-gray-500 italic">No questions created yet. Create New Question to get started.</p>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSelectAll}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center gap-2"
            >
              {selectedQuestions.length === questions.length ? (
                <Square className="w-4 h-4" />
              ) : (
                <CheckSquare className="w-4 h-4" />
              )}
              {selectedQuestions.length === questions.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
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