'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { MarkdownData } from '@/app/components/Interfaces';
import { parseMarkdownContent, generateMarkdown } from './../../utils/markdownUtils';
import { Folder, Plus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { QuestionSkeleton, QuestionEditorSkeleton } from '../Skeleton';
import dynamic from 'next/dynamic';

interface ParsedMarkdownData {
  title: string;
  question: string;
  answers: { id: string; text: string; isCorrect: boolean; }[];
  difficulty: number;
  tags: string[];
  markdownContent: string;
  enableCodeFormatting?: boolean;
}

export interface Answer {
  id: string;
  text: string;
  isCorrect: boolean; 
}

export interface Question {
  id: string;
  title: string;
  question: string;
  answers: Answer[];
  difficulty: number;
  tags: string[];
  type?: 'question' | 'markdown';
  markdownContent?: string;
}

export interface QuestionData {
  id?: string;
  question: string;
  answers: Answer[];
  title: string;  
  difficulty: number;  
  tags: string[];  
}

export interface MarkdownEditData {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface DashboardQuestion extends Question {
  onEdit?: () => void;
  initialData?: Answer[];
  onEditMarkdown: (markdown: MarkdownData) => void;
  isExpanded?: boolean;
}

interface FileSystemState {
  handle: FileSystemDirectoryHandle | null;
  path: string;
}

// Dynamic imports
const QuestionEditor = dynamic(() => import('../questioneditor/components/QuestionEditor'), {
  loading: () => <QuestionEditorSkeleton />
});

const SavedQuestionsList = dynamic(() => import('../savedquestionslists/components/SavedQuestionsList'), {
  loading: () => (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <QuestionSkeleton key={i} />
      ))}
    </div>
  )
});

const DashboardHeader = ({
  onLoadDirectory,
  onNewQuestion,
  isLoading,
  hasFileSystem
}: {
  onLoadDirectory: () => void;
  onNewQuestion: () => void;
  isLoading: boolean;
  hasFileSystem: boolean;
}) => (
  <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
    <h1 className="text-2xl sm:text-3xl font-bold">Question Editor</h1>
    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
      <button
        onClick={onLoadDirectory}
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center justify-center gap-2 disabled:opacity-50 w-full sm:w-auto"
        disabled={isLoading}
      >
        <Folder className="w-4 h-4" />
        <span className="whitespace-nowrap">{isLoading ? 'Loading...' : 'Import Questions'}</span>
      </button>
      <button
        onClick={onNewQuestion}
        className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2 w-full sm:w-auto"
        disabled={!hasFileSystem}
      >
        <Plus className="w-4 h-4" />
        <span>Create New Question</span>
      </button>
    </div>
  </div>
);

const Dashboard = () => {
  const [questions, setQuestions] = useState<DashboardQuestion[]>([]);
  const [currentlyEditing, setCurrentlyEditing] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [initialData, setInitialData] = useState<Question | undefined>(undefined);
  const [markdowns, setMarkdowns] = useState<MarkdownData[]>([]);
  const [currentlyEditingMarkdown, setCurrentlyEditingMarkdown] = useState<string | null>(null);
  const [fileSystem, setFileSystem] = useState<FileSystemState>({ handle: null, path: '' });
  const [isLoading, setIsLoading] = useState(false);

  const loadDirectory = async () => {
    if (!window.showDirectoryPicker) {
      console.error('Directory picker is not supported in this environment');
      return;
    }

    setIsLoading(true);
    try {
      const handle = await window.showDirectoryPicker();
      setFileSystem({ handle, path: handle.name });

      const loadedQuestions: DashboardQuestion[] = [];
      for await (const entry of handle.values()) {
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
    } catch (error) {
      if ((error as Error).name === 'AbortError') return;
      console.error('Error accessing directory:', error);
      alert('Unable to access directory. Please check permissions and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const saveQuestionToFile = async (question: DashboardQuestion) => {
    if (!fileSystem.handle) return;

    try {
      const content = generateMarkdown(question);
      const filename = `${question.title.toLowerCase().replace(/\s+/g, '-')}.md`;
      
      const fileHandle = await fileSystem.handle.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();
    } catch (error) {
      console.error('Error saving file:', error);
      alert('Failed to save file. Please check permissions and try again.');
    }
  };

  useEffect(() => {
    if (fileSystem.handle && questions.length > 0) {
      questions.forEach(question => {
        saveQuestionToFile(question);
      });
    }
  }, [questions, fileSystem.handle]);

  const handleSaveMarkdown = (markdownData: MarkdownData) => {
    const updatedMarkdowns = [...markdowns];
    const existingIndex = markdowns.findIndex(m => m.title === markdownData.title);
    
    if (existingIndex !== -1) {
      updatedMarkdowns[existingIndex] = markdownData;
    } else {
      updatedMarkdowns.push(markdownData);
    }
    
    setMarkdowns(updatedMarkdowns);
  };

  const handleEditMarkdown = (markdown: MarkdownEditData) => {
    setCurrentlyEditingMarkdown(markdown.id);
    const markdownData: Question = {
      id: markdown.id,
      title: markdown.title || 'Untitled',
      question: '',
      answers: [],
      difficulty: 1,
      tags: [],
      type: 'markdown'
    };
    setInitialData(markdownData);
    setShowEditor(true);
  };

  const handleBack = () => {
    setShowEditor(false);
    setCurrentlyEditing(null);
    setCurrentlyEditingMarkdown(null);
    setInitialData(undefined);
  };

  const handleSaveQuestion = async (questionData: QuestionData) => {
    if (!questionData.question.trim()) return;
  
    const enableCodeFormatting = true; 
    const defaultLanguage = 'javascript'; 
  
    const newQuestionData: DashboardQuestion = {
      id: currentlyEditing || uuidv4(),
      title: questionData.title,
      question: questionData.question,
      answers: questionData.answers,
      difficulty: questionData.difficulty,
      tags: questionData.tags,
      isExpanded: false,
      onEditMarkdown: () => {},
      type: 'question',
      markdownContent: generateMarkdown(
        questionData,
        enableCodeFormatting,
        defaultLanguage
      ),
    };
  
    if (currentlyEditing) {
      const updatedQuestions = questions.map((q) =>
        q.id === currentlyEditing ? newQuestionData : q
      );
      setQuestions(updatedQuestions);
    } else {
      setQuestions([...questions, newQuestionData]);
    }
  
    setShowEditor(false);
    setInitialData(undefined);
    setCurrentlyEditing(null);
  };
  
  

  const handleEdit = (question: Question) => {
    setCurrentlyEditing(question.id);
    const questionData: Question = {
      ...question,
      answers: question.answers.map(a => ({
        ...a,
        isCorrect: a.isCorrect || false
      }))
    };
    setInitialData(questionData);
    setShowEditor(true);
  };

  const handleNewQuestion = () => {
    if (!fileSystem.handle) {
      alert('Please select a directory first');
      return;
    }
    setCurrentlyEditing(null);
    setInitialData(undefined);
    setShowEditor(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto">
          <DashboardHeader
            onLoadDirectory={loadDirectory}
            onNewQuestion={handleNewQuestion}
            isLoading={isLoading}
            hasFileSystem={!!fileSystem.handle}
          />

          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <Suspense fallback={showEditor ? <QuestionEditorSkeleton /> : <QuestionSkeleton />}>
              {showEditor ? (
                <QuestionEditor
                  onSave={handleSaveQuestion}
                  onBack={handleBack}
                  onSaveMarkdown={handleSaveMarkdown}
                  initialData={initialData}
                  isEditing={currentlyEditing !== null || currentlyEditingMarkdown !== null}
                  fileSystem={fileSystem}
                />
              ) : (
                <SavedQuestionsList
                  questions={questions}
                  onEdit={handleEdit}
                  onEditMarkdown={handleEditMarkdown}
                  setQuestions={setQuestions}
                  markdowns={markdowns}
                  setMarkdowns={setMarkdowns}
                  fileSystem={fileSystem}
                />
              )}
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;