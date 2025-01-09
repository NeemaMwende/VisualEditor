"use client"
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FileText, Folder, ChevronRight, ChevronDown, ArrowLeft, Shuffle } from 'lucide-react';
import {
  generateMarkdown,
  parseMarkdownContent,
} from '../../../utils/markdownUtils';
import { EditorQuestion, MarkdownData } from '@/app/components/Interfaces';
import { v4 as uuidv4 } from 'uuid';
import TagSelector from './TagSelector';

interface QuestionEditorProps {
  onSave: (data: Question) => void;
  onBack: () => void;
  onEditQuestion?: (data: EditorQuestion) => void;
  initialData?: EditorQuestion | Question;
  isEditing?: boolean;
  setIsEditing?: (value: boolean) => void;
  onSaveMarkdown?: (data: MarkdownData) => void;
}

interface Answer {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id?: string;
  question: string;
  answers: Answer[];
  difficulty: number;
  tags: string[];
  title: string;
  markdownContent?: string;
  type?: 'question' | 'markdown';
}

interface FileData {
  name: string;
  content: string;
  path: string;
}

interface FileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  webkitdirectory?: string;
  directory?: string;
}

const QuestionEditor: React.FC<QuestionEditorProps> = ({
  onSave,
  onBack,
  initialData,
  isEditing = false,
}) => {
  const [question, setQuestion] = useState('');
  const [answers, setAnswers] = useState<Answer[]>([
    { id: uuidv4(), text: '', isCorrect: false },
    { id: uuidv4(), text: '', isCorrect: false },
    { id: uuidv4(), text: '', isCorrect: false },
    { id: uuidv4(), text: '', isCorrect: false },
  ]);
  const [difficulty, setDifficulty] = useState(1);
  const [tags, setTags] = useState<string[]>([]);
  const [showMarkdown, setShowMarkdown] = useState(false);
  const [markdownContent, setMarkdownContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<FileData[]>([]);
  const [currentFile, setCurrentFile] = useState<FileData | null>(null);
  const [showFileList, setShowFileList] = useState(false);
  const [title, setTitle] = useState(initialData?.title || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentMarkdown = useMemo(() => {
    return generateMarkdown({
      id: String(initialData?.id || Date.now()),
      question,
      answers,
      difficulty,
      tags,
      title: initialData?.title || currentFile?.name || ''
    });
  }, [question, answers, difficulty, tags, initialData?.title, currentFile?.name, initialData?.id]);

  // Initialize editor with existing question data
  useEffect(() => {
    if (initialData) {
      setQuestion(initialData.question || '');
      setAnswers(initialData.answers?.length > 0 ? initialData.answers.map(answer => ({
        id: answer.id || uuidv4(),
        text: answer.text || '',
        isCorrect: answer.isCorrect || false,
      })) : answers);
      setDifficulty(initialData.difficulty || 1);
      setTitle(initialData.title || '');
      setTags(Array.isArray(initialData.tags) ? initialData.tags : []);
      setMarkdownContent(initialData.markdownContent || '');
    }
  }, [initialData]);

  // Fetch question data for editing
  useEffect(() => {
    if (isEditing && initialData?.id) {
      const loadQuestion = async () => {
        try {
          setIsLoading(true);
          setError(null);

          const response = await fetch(`/api/questions/${initialData.id}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            cache: 'no-store'
          });
          
          if (!response.ok) {
            throw new Error(`Failed to fetch question details: ${response.statusText}`);
          }
          
          const questionData = await response.json();
          
          if (!questionData) {
            throw new Error('No question data received');
          }

          setQuestion(questionData.question || '');
          setAnswers(questionData.answers?.length > 0 ? questionData.answers.map((answer: Answer) => ({
            id: answer.id || uuidv4(),
            text: answer.text || '',
            isCorrect: answer.isCorrect || false,
          })) : answers);
          setDifficulty(questionData.difficulty || 1);
          setTitle(questionData.title || '');
          setTags(Array.isArray(questionData.tags) ? questionData.tags.map((tag: any) => tag.name || tag) : []);
          setMarkdownContent(questionData.markdownContent || '');
        } catch (error) {
          console.error('Error loading question:', error);
          setError(error instanceof Error ? error.message : 'Failed to load question details');
        } finally {
          setIsLoading(false);
        }
      };

      loadQuestion();
    }
  }, [isEditing, initialData?.id]);

  useEffect(() => {
    setMarkdownContent(currentMarkdown);
  }, [currentMarkdown]);

  const validateQuestion = () => {
    if (!title.trim()) {
      setError('Please provide a title');
      return false;
    }
    if (!question.trim()) {
      setError('Please provide a question');
      return false;
    }
    if (!answers.some(answer => answer.text.trim())) {
      setError('Please provide at least one answer');
      return false;
    }
    if (!answers.some(answer => answer.isCorrect)) {
      setError('Please mark at least one answer as correct');
      return false;
    }
    return true;
  };

  const randomizeAnswers = () => {
    setAnswers(prevAnswers => {
      const shuffledAnswers = [...prevAnswers];
      for (let i = shuffledAnswers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledAnswers[i], shuffledAnswers[j]] = [shuffledAnswers[j], shuffledAnswers[i]];
      }
      return shuffledAnswers;
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const fileList: FileData[] = [];
    
    for (const file of files) {
      if (file.name.endsWith('.md')) {
        const content = await file.text();
        fileList.push({
          name: file.name,
          content,
          path: file.webkitRelativePath || file.name
        });
      }
    }

    setSelectedFiles(fileList);
    setShowFileList(true);
  };

  const handleFileClick = (file: FileData) => {
    setCurrentFile(file);
    const parsedData = parseMarkdownContent(file.content);
    const fileTitle = file.name.replace(/\.[^/.]+$/, '')
      .split(/[-_\s]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    
    setTitle(fileTitle);
    setQuestion(parsedData.question);
    setAnswers(parsedData.answers);
    setDifficulty(parsedData.difficulty);
    setTags(parsedData.tags);
    setMarkdownContent(file.content);
    setShowMarkdown(true);
  };

  const handleSaveMarkdown = async () => {
    try {
      if (!validateQuestion()) return;
      
      setIsLoading(true);
      setError(null);

      const markdownData = {
        title,
        content: currentMarkdown,
        type: 'markdown' as const,
      };

      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(markdownData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Failed to save markdown: ${response.statusText}`);
      }

      const savedData = await response.json();
      alert('Saved successfully!');
      
      if (!isEditing) {
        resetEditor();
      }
      
      onBack();
    } catch (error) {
      console.error('Error saving:', error);
      setError(error instanceof Error ? error.message : 'Failed to save markdown');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!validateQuestion()) return;

      setIsLoading(true);
      setError(null);

      const savedData = {
        id: initialData?.id || undefined,
        question,
        answers,
        difficulty,
        tags,
        title,
        type: 'question' as const,
        markdownContent: currentMarkdown,
      };
      
      const url = isEditing 
        ? `/api/questions/${initialData?.id}`
        : '/api/questions';
      
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(savedData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Failed to save question: ${response.statusText}`);
      }

      const savedQuestion = await response.json();
      alert('Saved successfully!');
      onSave(savedQuestion);
    } catch (error) {
      console.error('Error saving:', error);
      setError(error instanceof Error ? error.message : 'Failed to save question');
    } finally {
      setIsLoading(false);
    }
  };

  const resetEditor = () => {
    setQuestion('');
    setAnswers([
      { id: uuidv4(), text: '', isCorrect: false },
      { id: uuidv4(), text: '', isCorrect: false },
      { id: uuidv4(), text: '', isCorrect: false },
      { id: uuidv4(), text: '', isCorrect: false }
    ]);
    setDifficulty(1);
    setTags([]);
    setMarkdownContent('');
    setTitle('');
    setError(null);
  };

  const handleBack = () => {
    if (question.trim() || answers.some(a => a.text.trim())) {
      const confirm = window.confirm('You have unsaved changes. Are you sure you want to go back?');
      if (!confirm) return;
    }
    onBack();
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          {error}
        </div>
      )}

      <div className="mb-4">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
          disabled={isLoading}
        >
          <ArrowLeft size={20} />
          Back to Questions
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="bg-white shadow-sm form-content p-6 rounded-lg space-y-6">
          {/* File Selection Section */}
          <div className="flex gap-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              multiple
              {...({ webkitdirectory: "", directory: "" } as FileInputProps)}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 w-full text-white bg-blue-500 rounded-md hover:bg-blue-600 flex items-center gap-2"
            >
              <Folder size={16} />
              Select Folder
            </button>
            {selectedFiles.length > 0 && (
              <button
                onClick={() => setShowFileList(!showFileList)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 flex items-center gap-2"
              >
                {showFileList ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                {selectedFiles.length} Files
              </button>
            )}
          </div>

          {/* File List Section */}
          {showFileList && selectedFiles.length > 0 && (
            <div className="border rounded-md overflow-hidden">
              <div className="bg-gray-50 p-2 font-medium text-gray-700">
                Available Files
              </div>
              <div className="max-h-60 overflow-y-auto">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className={`border-t ${currentFile?.name === file.name ? 'bg-blue-50' : ''}`}
                  >
                    <div
                      onClick={() => handleFileClick(file)}
                      className="p-3 flex items-center gap-2 cursor-pointer hover:bg-gray-50"
                    >
                      <FileText size={16} />
                      <span className="text-sm">{file.path}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {showMarkdown ? (
            <div className="space-y-4">
              <label className="block text-gray-700 text-sm font-bold">
                Markdown Content
              </label>
              <pre className="w-full p-4 bg-gray-50 rounded-md font-mono text-sm whitespace-pre-wrap break-words">
                {markdownContent}
              </pre>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Title Section */}
              <div className="space-y-2">
                <label className="block text-gray-700 text-sm font-bold">
                  Title
                </label>
                <input type="text"
                  placeholder="Enter question title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  readOnly={!!currentFile}
                />
              </div>

              {/* Difficulty Section */}
              <div className="space-y-2">
                <label className="block text-gray-700 text-sm font-bold">
                  Difficulty Level
                </label>
                <div className="relative">
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(parseInt(e.target.value))}
                    className="w-full p-3 border rounded-md appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value={1}>Beginner (Level 1)</option>
                    <option value={2}>Intermediate (Level 2)</option>
                    <option value={3}>Advanced (Level 3)</option>
                  </select>
                  <ChevronDown 
                    size={20} 
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none"
                  />
                </div>
              </div>

              {/* Tags Section */}
              <div className="space-y-2">
                <label className="block text-gray-700 text-sm font-bold">
                  Tags
                </label>
                <TagSelector
                  selectedTags={tags}
                  onTagsChange={setTags}
                  files={selectedFiles}
                />
              </div>

              {/* Question Section */}
              <div className="space-y-2">
                <label className="block text-gray-700 text-sm font-bold">
                  Question
                </label>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Enter your question here"
                />
              </div>

              {/* Answers Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="block text-gray-700 text-sm font-bold">
                    Answers
                  </label>
                  <button
                    onClick={randomizeAnswers}
                    className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                    disabled={isLoading}
                  >
                    <Shuffle size={16} />
                    Randomize Answers
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {answers.map((answer, index) => (
                    <div key={answer.id} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={answer.isCorrect}
                          onChange={() => {
                            const newAnswers = answers.map((ans, i) => ({
                              ...ans,
                              isCorrect: i === index
                            }));
                            setAnswers(newAnswers);
                          }}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          disabled={isLoading}
                        />
                        <label className="text-sm font-medium text-gray-700">
                          Answer {String.fromCharCode(65 + index)}
                        </label>
                      </div>
                      <textarea
                        value={answer.text}
                        onChange={(e) => {
                          const newAnswers = [...answers];
                          newAnswers[index] = { ...answer, text: e.target.value };
                          setAnswers(newAnswers);
                        }}
                        className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={2}
                        placeholder={`Enter answer ${String.fromCharCode(65 + index)}`}
                        disabled={isLoading}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <button
              onClick={handleBack}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={() => setShowMarkdown(!showMarkdown)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {showMarkdown ? 'Edit Question' : 'View Markdown'}
            </button>
            {showMarkdown && (
              <button
                onClick={handleSaveMarkdown}
                className="px-4 py-2 text-white bg-green-500 rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save as Markdown'}
              </button>
            )}
            <button
              onClick={handleSave}
              className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : (isEditing ? 'Save Changes' : 'Save Question')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionEditor;