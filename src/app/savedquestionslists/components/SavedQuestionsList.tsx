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
  fileSystem
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


  const verifyPermission = async (handle: FileSystemDirectoryHandle): Promise<boolean> => {
    try {
      const options = { mode: 'readwrite' } as const;
  
      // Check if requestPermission method exists and then call it
      if (handle.requestPermission) {
        return (await handle.requestPermission(options)) === 'granted';
      }
      
      // If requestPermission doesn't exist, we'll assume permission is granted
      // This handles potential browser compatibility issues
      return true;
    } catch (error) {
      console.error('Error verifying permission:', error);
      return false;
    }
  };
  

  // get all files in the directory
  const getDirectoryFiles = async (): Promise<Map<string, FileSystemFileHandle>> => {
    if (!fileSystem.handle) return new Map();
    
    const existingFiles = new Map<string, FileSystemFileHandle>();
    try {
      for await (const entry of fileSystem.handle.values()) {
        if (entry.kind === 'file' && entry.name.endsWith('.md')) {
          existingFiles.set(entry.name.toLowerCase(), entry as FileSystemFileHandle);
        }
      }
    } catch (error) {
      console.error('Error reading directory files:', error);
    }
    return existingFiles;
  };

  const getFilenameFromQuestion = (question: DashboardQuestion): string[] => {
    return [

      `${question.title.toLowerCase().replace(/\s+/g, '-')}.md`,
      `${question.id}.md`,
      question.id,
      `${question.title.replace(/\s+/g, '-')}.md`,
      `${question.id.toLowerCase()}.md`
    ];
  };

  const refreshDirectory = async () => {
    if (!fileSystem.handle) {
      return;
    }
  
    setIsRefreshing(true);
    try {
      const hasPermission = await verifyPermission(fileSystem.handle);
      if (!hasPermission) {
        throw new Error('Permission denied for directory access');
      }

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
                  id: entry.name, 
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
    } finally {
      setIsRefreshing(false);
    }
  };
  
  const handleDelete = async (id: string) => {
    if (!fileSystem.handle) return;

    try {
      const questionToDelete = questions.find(q => q.id === id);
      if (!questionToDelete) return;
      
      const hasPermission = await verifyPermission(fileSystem.handle);
      if (!hasPermission) {
        throw new Error('Permission denied for directory access');
      }

      const existingFiles = await getDirectoryFiles();
      const possibleFilenames = getFilenameFromQuestion(questionToDelete);
      
      let fileDeleted = false;
      for (const filename of possibleFilenames) {
        // First check if the exact name exists
        if (existingFiles.has(filename.toLowerCase())) {
          const exactFile = existingFiles.get(filename.toLowerCase());
          if (exactFile) {
            try {
            
              const actualFilename = exactFile.name;
              await fileSystem.handle.removeEntry(actualFilename);
              fileDeleted = true;
              console.log(`Successfully deleted file: ${actualFilename}`);
              break;
            } catch (removeError) {
              console.warn(`Failed to delete ${filename}:`, removeError);
            }
          }
        }
      }
      
      // If none of the generated filenames matched, try to find the file by checking content
      if (!fileDeleted && questionToDelete.markdownContent) {
        const fileContent = questionToDelete.markdownContent;
        for (const fileHandle of existingFiles.values()) {
          try {
            const file = await fileHandle.getFile();
            const content = await file.text();
            
            if (content === fileContent) {
             
              await fileSystem.handle.removeEntry(fileHandle.name);
              fileDeleted = true;
              console.log(`Successfully deleted file by content match: ${fileHandle.name}`);
              break;
            }
          } catch (readError) {
            console.warn('Error reading file for content comparison:', readError);
          }
        }
      }
      
      if (!fileDeleted) {
        console.warn('Could not find exact file to delete. Updating UI only.');
      }

      // Update the UI state
      setQuestions(prevQuestions => prevQuestions.filter(q => q.id !== id));
      setSelectedQuestions(prev => prev.filter(qId => qId !== id));
      
    } catch (error) {
      console.error('Error in delete operation:', error);
      
      // Still update the UI state to maintain user experience
      setQuestions(prevQuestions => prevQuestions.filter(q => q.id !== id));
      setSelectedQuestions(prev => prev.filter(qId => qId !== id));
    }
  };

  const handleDeleteSelected = async () => {
    if (!fileSystem.handle || selectedQuestions.length === 0) {
      return;
    }
    
    // Verify permission first
    const hasPermission = await verifyPermission(fileSystem.handle);
    if (!hasPermission) {
      console.error('Permission denied for directory access');
      return;
    }
    
    // Get all files in the directory for matching
    const existingFiles = await getDirectoryFiles();
    
    const successfullyDeletedIds: string[] = [];
    
    for (const id of selectedQuestions) {
      const questionToDelete = questions.find(q => q.id === id);
      if (questionToDelete) {
        const possibleFilenames = getFilenameFromQuestion(questionToDelete);
        
        let deleted = false;
        // Try all possible filenames
        for (const filename of possibleFilenames) {
          const fileHandle = existingFiles.get(filename.toLowerCase());
          if (fileHandle) {
            try {
              await fileSystem.handle.removeEntry(fileHandle.name);
              deleted = true;
              successfullyDeletedIds.push(id);
              break;
            } catch (error) {
              console.warn(`Failed to delete ${fileHandle.name}:`, error);
            }
          }
        }
        
        // If none of the generated filenames matched, try to find the file by checking content
        if (!deleted && questionToDelete.markdownContent) {
          const fileContent = questionToDelete.markdownContent;
          for (const fileHandle of existingFiles.values()) {
            try {
              const file = await fileHandle.getFile();
              const content = await file.text();
              
              if (content === fileContent) {
                // Found a matching file by content
                await fileSystem.handle.removeEntry(fileHandle.name);
                deleted = true;
                successfullyDeletedIds.push(id);
                break;
              }
            } catch (readError) {
              console.warn('Error reading file for content comparison:', readError);
            }
          }
        }
        
        if (!deleted) {
          console.warn(`Could not find file for question: ${questionToDelete.title}`);
          // Add to successfully deleted anyway to update UI
          successfullyDeletedIds.push(id);
        }
      }
    }

    // Update UI state for all selected IDs
    setQuestions(prevQuestions => 
      prevQuestions.filter(q => !selectedQuestions.includes(q.id))
    );
    setSelectedQuestions([]);
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
      return;
    }
  
    try {
      // Verify permission first
      const hasPermission = await verifyPermission(fileSystem.handle);
      if (!hasPermission) {
        throw new Error('Permission denied for directory access');
      }
      
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
  
      // Get existing files for handling file rename
      const existingFiles = await getDirectoryFiles();
  
      // Handle file rename if title changed
      if (newFilename !== editingMarkdown.filename) {
       
        const originalFileHandle = existingFiles.get(editingMarkdown.filename.toLowerCase());
        if (originalFileHandle) {
          try {
            await fileSystem.handle.removeEntry(originalFileHandle.name);
          } catch (error) {
            console.warn(`Failed to delete old file ${originalFileHandle.name}:`, error);
          
          }
        } else {
         
          const originalQuestion = questions.find(q => q.id === editingMarkdown.id);
          if (originalQuestion) {
            const possibleFilenames = getFilenameFromQuestion(originalQuestion);
            for (const filename of possibleFilenames) {
              const fileHandle = existingFiles.get(filename.toLowerCase());
              if (fileHandle) {
                try {
                  await fileSystem.handle.removeEntry(fileHandle.name);
                  break;
                } catch (error) {
                  console.warn(`Failed to delete old file ${fileHandle.name}:`, error);
                }
              }
            }
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
                id: newFilename, 
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

 
  const handleQuestionSelect = (questionId: string) => {

    setQuestions(questions.map(q =>
      q.id === questionId ? { ...q, isExpanded: true } : q
    ));
    
    // Scroll to the selected question
    setTimeout(() => {
      const element = document.getElementById(`question-${questionId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
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
                questions={questions}
                onQuestionSelect={handleQuestionSelect}
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
                id={`question-${question.id}`}
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