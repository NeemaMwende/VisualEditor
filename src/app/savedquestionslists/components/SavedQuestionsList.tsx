"use client"
import React, { Dispatch, SetStateAction, useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { BaseQuestion } from '../../components/Interfaces';
import {
  MarkdownFile,
  generateMarkdown,
  //saveMarkdownToLocalStorage,
  getMarkdownFromLocalStorage,
  addNewMarkdownFile,
  deleteMarkdownFile,
  toggleMarkdownExpand,
  //updateMarkdownFile
} from '../../../utils/markdownUtils';


interface SavedQuestionsListProps {
  questions: BaseQuestion[];
  onEdit: (question: BaseQuestion) => void;
  setQuestions: Dispatch<SetStateAction<BaseQuestion[]>>;
  onExit?: () => void;
}

const SavedQuestionsList: React.FC<SavedQuestionsListProps> = ({ 
  questions, 
  onEdit, 
  setQuestions,
  onExit 
}) => {
  const [viewMode, setViewMode] = useState<'questions' | 'markdown'>('questions');
  const [markdownFiles, setMarkdownFiles] = useState<MarkdownFile[]>([]);
  const [editingMarkdown, setEditingMarkdown] = useState<BaseQuestion | null>(null);
  
  useEffect(() => {
    const storedFiles = getMarkdownFromLocalStorage();
    setMarkdownFiles(storedFiles);
  }, []);

  const handleDelete = (id: number) => {
    if (viewMode === 'questions') {
      if (window.confirm('Are you sure you want to delete this question?')) {
        setQuestions(questions.filter(q => q.id !== id));
      }
    } else {
      if (window.confirm('Are you sure you want to delete this markdown file?')) {
        const updatedFiles = deleteMarkdownFile(markdownFiles, id);
        setMarkdownFiles(updatedFiles);
      }
    }
  };

  const toggleExpand = (id: number) => {
    if (viewMode === 'questions') {
      setQuestions(questions.map(q =>
        q.id === id ? { ...q, isExpanded: !q.isExpanded } : q
      ));
    } else {
      const updatedFiles = toggleMarkdownExpand(markdownFiles, id);
      setMarkdownFiles(updatedFiles);
    }
  };

  // const promptForTitle = (defaultTitle: string = ''): Promise<string | null> => {
  //   return new Promise((resolve) => {
  //     const title = window.prompt('Enter a title for the markdown file:', defaultTitle);
  //     resolve(title || null);
  //   });
  // };

  const saveAsMarkdown = async (question: BaseQuestion) => {
    const content = generateMarkdown(question);
    const updatedFiles = addNewMarkdownFile(markdownFiles, content, question.title);
    setMarkdownFiles(updatedFiles);
  };

  // const createNewMarkdown = async (content: string) => {
  //   const title = await promptForTitle();
  //   if (title) {
  //     const updatedFiles = addNewMarkdownFile(markdownFiles, content, title);
  //     setMarkdownFiles(updatedFiles);
  //   }
  // };

  const handleEditMarkdown = (file: MarkdownFile) => {
    const markdownQuestion: BaseQuestion = {
      id: file.id,
      title: file.title,
      question: file.content,
      difficulty: 'N/A',
      tags: [],
      answers: [],
      isExpanded: false
    };
    setEditingMarkdown(markdownQuestion);
    setViewMode('markdown');
  };

  // const saveMarkdownChanges = (question: BaseQuestion) => {
  //   const content = question.question;
  //   const updatedFiles = updateMarkdownFile(markdownFiles, question.id, content);
  //   setMarkdownFiles(updatedFiles);
  //   setEditingMarkdown(null);
  // };

  const downloadFile = (content: string, filename: string) => {
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

  const handleDownload = (id: number) => {
    if (viewMode === 'questions') {
      const question = questions.find(q => q.id === id);
      if (!question) return;
      const content = generateMarkdown(question);
      const filename = `${question.title.toLowerCase().replace(/\s+/g, '-')}.md`;
      downloadFile(content, filename);
    } else {
      const markdownFile = markdownFiles.find(m => m.id === id);
      if (!markdownFile) return;
      const filename = `${markdownFile.title.toLowerCase().replace(/\s+/g, '-')}.md`;
      downloadFile(markdownFile.content, filename);
    }
  };

  const downloadAll = () => {
    if (viewMode === 'questions') {
      questions.forEach(question => {
        const content = generateMarkdown(question);
        const filename = `${question.title.toLowerCase().replace(/\s+/g, '-')}.md`;
        downloadFile(content, filename);
      });
    } else {
      markdownFiles.forEach(file => {
        const filename = `${file.title.toLowerCase().replace(/\s+/g, '-')}.md`;
        downloadFile(file.content, filename);
      });
    }
  };

  const renderQuestions = () => (
    <div className="space-y-4">
      {questions.length === 0 ? (
        <p className="text-center text-gray-500 italic">No questions created yet.</p>
      ) : (
        questions.map((question, index) => (
          <div
            key={question.id || `question-${index}`}
            className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
          >
            <div
              className="cursor-pointer"
              onClick={() => toggleExpand(question.id)}  // Toggle expand when clicked
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
                      onEdit(question);
                    }}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(question.id);
                    }}
                    className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      saveAsMarkdown(question);
                    }}
                    className="px-3 py-1 text-sm bg-purple-500 text-white rounded hover:bg-purple-600"
                  >
                    Save as MD
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(question.id);
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
                    <p className="ml-4 mt-1">{question.question}</p>
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
        ))
      )}
    </div>
  );
  
  const saveMarkdownChanges = (updatedQuestion: BaseQuestion) => {
    const updatedQuestions = questions.map((q) =>
      q.id === updatedQuestion.id ? { ...q, question: updatedQuestion.question } : q
    );
    setQuestions(updatedQuestions);  
    setEditingMarkdown(null); 
  };
  

  const renderMarkdownFiles = () => (
    <div className="space-y-4">
      {markdownFiles.length === 0 ? (
        <p className="text-center text-gray-500 italic">No markdown files saved yet.</p>
      ) : (
        markdownFiles.map((file, index) => (
          <div
            key={file.id ||`file-${index}`}
            className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
          >
            <div
              className="cursor-pointer"
              onClick={() => toggleExpand(file.id)}
            >
              <div className="flex flex-col space-y-2">
                <h3 className="text-lg font-semibold">{file.title}</h3>
                <div className="flex justify-end space-x-2 mt-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditMarkdown(file);
                    }}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(file.id);
                    }}
                    className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(file.id);
                    }}
                    className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Download
                  </button>
                </div>
              </div>
            </div>

            {file.isExpanded && (
              <div className="mt-4 space-y-2 border-t pt-4">
                <pre className="whitespace-pre-wrap font-mono text-sm bg-gray-50 p-4 rounded">
                  {file.content}
                </pre>
              </div>
            )}
          </div>
        ))
      )}
        {editingMarkdown && viewMode === 'markdown' && (
        <div className="max-w-2xl mx-auto p-6 bg-gray-50 rounded-lg shadow-md">
          <h3 className="text-2xl font-bold text-gray-700 mb-6">Edit Question: {editingMarkdown.title}</h3>
          
          <div className="space-y-6">
            <label htmlFor="questionContent" className="block text-lg font-semibold text-gray-600">
              Question Content
            </label>
            
            <textarea
              id="questionContent"
              value={editingMarkdown.question}
              onChange={(e) => {
                setEditingMarkdown({
                  ...editingMarkdown,
                  question: e.target.value,
                });
              }}
              className="w-full h-48 p-4 text-base border border-gray-300 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Edit the content of the question here..."
            />
            
            <div className="flex justify-between space-x-4">
              <button
                onClick={() => saveMarkdownChanges(editingMarkdown)}
                className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Save Changes
              </button>
              
              <button
                onClick={() => setViewMode('list')}
                className="px-6 py-2 bg-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-4">
          {onExit && (
            <button
              onClick={onExit}
              className="p-2 hover:bg-gray-100 rounded-full"
              aria-label="Exit"
            >
              <X className="w-6 h-6" />
            </button>
          )}
          <div className="space-x-2">
            <button
              onClick={() => setViewMode('questions')}
              className={`px-4 py-2 rounded ${
                viewMode === 'questions'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Questions 
            </button>
            <button
              onClick={() => setViewMode('markdown')}
              className={`px-4 py-2 rounded ${
                viewMode === 'markdown'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Markdown 
            </button>
          </div>
        </div>
        {(viewMode === 'questions' ? questions.length > 0 : markdownFiles.length > 0) && (
          <button
            onClick={downloadAll}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Download All
          </button>
        )}
      </div>
      {viewMode === 'questions' ? renderQuestions() : renderMarkdownFiles()}
    </div>
  );
};

export default SavedQuestionsList;