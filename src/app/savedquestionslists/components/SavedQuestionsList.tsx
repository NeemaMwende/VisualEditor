import React, { useState, useEffect, useMemo } from 'react';
import { MarkdownData, MarkdownEditData, DashboardQuestion } from '@/app/components/Interfaces';
import { generateMarkdown, parseMarkdownContent } from '../../../utils/markdownUtils';
import { Trash2, CheckSquare, Square, RefreshCw } from 'lucide-react';
import { Question } from '../../components/Dashboard';
import QuestionSearch from './QuestionSearch';
import { useSearchParams } from 'next/navigation';

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
  codeLanguage: "javascript" | "html" | undefined;
  title: string;
  question: string;
  answers: { id: string; text: string; isCorrect: boolean; }[];
  difficulty: number;
  tags: string[];
  markdownContent: string;
  enableCodeFormatting?: boolean;
}

const SavedQuestionsList: React.FC<SavedQuestionsListProps> = ({ 
  questions, 
  onEdit, 
  setQuestions,
  fileSystem,
  onEditMarkdown,
  markdowns,
  setMarkdowns
}) => {
  const [editingMarkdown, setEditingMarkdown] = useState<{
    id: string;
    content: string;
    filename: string;
    originalTitle: string;
  } | null>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const searchParams = useSearchParams();

  // Initialize search term from URL
  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      setSearchTerm(query);
    }
  }, [searchParams]);

  // Filter questions based on search term
  const filteredQuestions = useMemo(() => {
    if (!searchTerm.trim()) return questions;
    
    const term = searchTerm.toLowerCase().trim();
    return questions.filter(question => 
      question.title.toLowerCase().includes(term) || 
      question.question.toLowerCase().includes(term) ||
      question.tags.some(tag => tag.toLowerCase().includes(term)) ||
      question.answers.some(answer => answer.text.toLowerCase().includes(term))
    );
  }, [questions, searchTerm]);

  const refreshDirectory = async () => {
    if (!fileSystem.handle) {
      alert('Please select a directory first');
      return;
    }
  
    setIsRefreshing(true);
    try {
      const loadedQuestions: DashboardQuestion[] = [];
      for await (const entry of fileSystem.handle.values()) {
        if (entry.kind === 'file' && entry.name.endsWith('.md')) {
          if (entry instanceof FileSystemFileHandle) {
            const file = await entry.getFile();
            const content = await file.text();
            try {
              const parsedData = parseMarkdownContent(content) as ParsedMarkdownData;
              if (parsedData) {
                loadedQuestions.push({
                  ...parsedData,
                  id: entry.name.replace('.md', ''),
                  markdownContent: content,
                  type: 'question',
                  isExpanded: false,
                  title: parsedData.title || entry.name.replace('.md', ''),
                  onEditMarkdown: () => {},
                });
              }
            } catch (error) {
              console.error(`Error parsing ${entry.name}:`, error);
            }
          }
        }
      }
      setQuestions(loadedQuestions);
      setSelectedQuestions([]); // Clear selections after refresh
    } catch (error) {
      console.error('Error refreshing directory:', error);
      alert('Failed to refresh directory. Please check permissions and try again.');
    } finally {
      setIsRefreshing(false);
    }
  };
  
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
    
    // Use the question's detected language or fall back to default
    const markdownContent = generateMarkdown(
      question,
      question.enableCodeFormatting ?? true,
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
      alert(fileSystem.handle ? "No changes to save" : "Please select a directory first");
      return;
    }
  
    try {
      const originalQuestion = questions.find((q) => q.id === editingMarkdown.id);
      // Parse the content and detect the language used
      const parsedData = parseMarkdownContent(editingMarkdown.content, {
        enableCodeFormatting: originalQuestion?.enableCodeFormatting ?? true,
        defaultLanguage: originalQuestion?.codeLanguage || 'javascript'
      }) as ParsedMarkdownData;
  
      if (!parsedData) {
        throw new Error("Invalid markdown format");
      }
  
      const updatedTitle = parsedData.title || editingMarkdown.originalTitle;
      const newFilename = `${updatedTitle.toLowerCase().replace(/\s+/g, "-")}.md`;
  
      // Handle file rename if title changed
      if (newFilename !== editingMarkdown.filename) {
        try {
          await fileSystem.handle.removeEntry(editingMarkdown.filename);
        } catch (error) {
          if ((error as Error).name !== "NotFoundError") {
            throw error;
          }
        }
      }
  
      // Save updated content to file
      const fileHandle = await fileSystem.handle.getFileHandle(newFilename, {
        create: true,
      });
      const writable = await fileHandle.createWritable();
      await writable.write(editingMarkdown.content);
      await writable.close();
  
      // Update questions state with the detected language
      setQuestions((prevQuestions) =>
        prevQuestions.map((q) =>
          q.id === editingMarkdown.id
            ? {
                ...q,
                title: updatedTitle,
                question: parsedData.question,
                answers: parsedData.answers.map((answer) => ({
                  ...answer,
                  id: answer.id || Math.random().toString(36).substr(2, 9),
                })),
                difficulty: parsedData.difficulty,
                tags: parsedData.tags,
                markdownContent: editingMarkdown.content,
                codeLanguage: parsedData.codeLanguage, // Preserve detected language
                enableCodeFormatting: originalQuestion?.enableCodeFormatting,
                type: "question",
              }
            : q
        )
      );
  
      setEditingMarkdown(null);
    } catch (error) {
      console.error("Error saving markdown changes:", error);
      alert(
        "Error saving changes: " +
          ((error as Error).message ||
            "Please check the markdown format and try again.")
      );
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
    if (selectedQuestions.length === filteredQuestions.length) {
      setSelectedQuestions([]);
    } else {
      setSelectedQuestions(filteredQuestions.map(q => q.id));
    }
  };

  // Handle search 
  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
        <div className="w-full sm:w-auto flex items-center gap-2">
          {fileSystem.handle && (
            <>
              <span className="text-gray-600 text-sm break-all">
                Working directory: {fileSystem.path}
              </span>
              <button
                onClick={refreshDirectory}
                disabled={isRefreshing}
                className="p-2 text-gray-600 hover:text-blue-500 hover:bg-gray-100 rounded-full transition-colors"
                title="Refresh directory"
              >
                <RefreshCw 
                  size={16} 
                  className={`${isRefreshing ? 'animate-spin' : ''}`}
                />
              </button>
            </>
          )}
        </div>
        {selectedQuestions.length > 0 && (
          <div className="w-full sm:w-auto">
            <button
              onClick={handleDeleteSelected}
              className="w-full sm:w-auto px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center justify-center gap-2"
            >
              <Trash2 size={16} />
              Delete Selected ({selectedQuestions.length})
            </button>
          </div>
        )}
      </div>

      {questions.length === 0 ? (
        <p className="text-center text-gray-500 italic p-4">No questions created yet. Create New Question to get started.</p>
      ) : (
        <div className="space-y-4">
          <div className="relative w-full flex items-center justify-between gap-4">
            <button
              onClick={toggleSelectAll}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center gap-2"
            >
              {selectedQuestions.length === filteredQuestions.length && filteredQuestions.length > 0 ? (
                <Square className="w-4 h-4" />
              ) : (
                <CheckSquare className="w-4 h-4" />
              )}
              {selectedQuestions.length === filteredQuestions.length && filteredQuestions.length > 0
                ? 'Deselect All'
                : 'Select All'}
            </button>

            <div className="flex-1">
              <QuestionSearch 
                onSearch={handleSearch} 
                placeholder="Search by title, question, tags..." 
              />
            </div>
          </div>

          
          {filteredQuestions.length === 0 ? (
            <p className="text-center text-gray-500 italic p-4">
              No questions match your search. Try different keywords or clear the search.
            </p>
          ) : (
            filteredQuestions.map((question) => (
              <div
                key={question.id}
                className={`border rounded-lg p-3 sm:p-4 bg-white shadow-sm hover:shadow-md transition-shadow ${
                  selectedQuestions.includes(String(question.id)) ? 'border-blue-500' : ''
                }`}
              >
                {editingMarkdown?.id === question.id ? (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold break-all">Editing: {question.title}</h3>
                    <textarea
                      value={editingMarkdown.content}
                      onChange={(e) => setEditingMarkdown({
                        ...editingMarkdown,
                        content: e.target.value
                      })}
                      className="w-full h-64 p-4 font-mono text-sm bg-gray-50 rounded border focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <div className="flex flex-col sm:flex-row justify-end gap-2">
                      <button
                        onClick={() => setEditingMarkdown(null)}
                        className="w-full sm:w-auto px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={saveMarkdownChanges}
                        className="w-full sm:w-auto px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
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
                      className="mt-1 text-gray-500 hover:text-blue-500 transition-colors flex-shrink-0"
                    >
                      {selectedQuestions.includes(String(question.id)) ? (
                        <CheckSquare className="w-5 h-5" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                    <div className="flex-grow min-w-0">
                      <div
                        className="cursor-pointer"
                        onClick={() => toggleExpand(String(question.id))}
                      >
                        <div className="flex flex-col space-y-2">
                          <h3 className="text-lg font-semibold break-all">{question.title}</h3>
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
                          <div className="flex flex-col sm:flex-row justify-end gap-2 mt-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEdit(question);
                              }}
                              className="w-full sm:w-auto px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditMarkdown(question);
                              }}
                              className="w-full sm:w-auto px-3 py-1 text-sm bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
                            >
                              Edit as MD
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(String(question.id));
                              }}
                              className="w-full sm:w-auto px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
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
                              <p className="ml-2 sm:ml-4 mt-1 whitespace-pre-wrap break-words font-mono text-sm bg-gray-50 p-3 sm:p-4 rounded max-w-full overflow-x-auto">
                                {question.question}
                              </p>
                            </div>
                            <div>
                              <p className="font-medium">Answers:</p>
                              <ul className="ml-4 sm:ml-8 list-disc space-y-1 mt-1">
                                {question.answers.map((answer, index) => (
                                  <li 
                                    key={`answer-${question.id}-${index}`}
                                    className={`${answer.isCorrect ? 'text-green-600 font-medium' : ''} break-words`}
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
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SavedQuestionsList;