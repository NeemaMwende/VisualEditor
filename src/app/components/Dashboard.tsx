'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { MarkdownData } from '@/app/components/Interfaces';
import { parseMarkdownContent, generateMarkdown } from './../../utils/markdownUtils';
import { Folder, Plus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { QuestionSkeleton, QuestionEditorSkeleton } from '../Skeleton';
import dynamic from 'next/dynamic';
import { DashboardQuestion } from './Interfaces';

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
  enableCodeFormatting?: boolean;
  codeLanguage?: 'javascript' | 'html';
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
  
  const verifyPermission = async (handle: FileSystemDirectoryHandle): Promise<boolean> => {
    const options = { mode: 'readwrite' } as const;
  
    // Check if queryPermission exists and if permission is granted
    if (handle.queryPermission && (await handle.queryPermission(options)) === 'granted') {
      return true;
    }
  
    // Check if requestPermission exists and request permission if not granted
    if (handle.requestPermission && (await handle.requestPermission(options)) === 'granted') {
      return true;
    }
  
    return false;
  };

  const handleFileSystemError = async (error: Error) => {
    console.error("File system error:", error);
  
    if (error.name === "InvalidStateError") {
      setFileSystem({ handle: null, path: "" });
  
      // Automatically prompt the user to reload the directory
      if (window.confirm("File system access has expired. Would you like to reload the directory?")) {
        await loadDirectory();
      }
    } else {
      alert(`File system error: ${error.message}`);
    }
  };
  

  const loadDirectory = async () => {
    if (!window.showDirectoryPicker) {
      console.error("Directory picker is not supported in this environment");
      return;
    }
  
    setIsLoading(true);
    try {
      let handle = fileSystem.handle;
  
      // If the handle is null or invalid, request a new one
      if (!handle || !(await verifyPermission(handle))) {
        handle = await window.showDirectoryPicker();
      }
  
      // Verify we have permission
      const hasPermission = await verifyPermission(handle);
      if (!hasPermission) {
        throw new Error("Permission denied");
      }
  
      // Update the handle in state
      setFileSystem({ handle, path: handle.name });
  
      const loadedQuestions: DashboardQuestion[] = [];
  
      for await (const entry of handle.values()) {
        if (entry.kind === "file" && entry.name.endsWith(".md")) {
          try {
            const fileHandle = entry as FileSystemFileHandle;
            const file = await fileHandle.getFile();
            const content = await file.text();
  
            const parsedData = parseMarkdownContent(content) as ParsedMarkdownData;
            if (parsedData) {
              loadedQuestions.push({
                ...parsedData,
                id: entry.name.replace(".md", ""),
                markdownContent: content,
                type: "question",
                isExpanded: false,
                title: parsedData.title || entry.name.replace(".md", ""),
                onEditMarkdown: () => {},
                enableCodeFormatting: parsedData.enableCodeFormatting ?? true,
              });
            }
          } catch (error) {
            console.error(`Error parsing ${entry.name}:`, error);
          }
        }
      }
  
      setQuestions(loadedQuestions);
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
      await handleFileSystemError(error as Error);
    } finally {
      setIsLoading(false);
    }
  };
  
  
  const saveQuestionToFile = async (question: DashboardQuestion) => {
    if (!fileSystem.handle) return;

    try {
      // Verify permission before saving
      const hasPermission = await verifyPermission(fileSystem.handle);
      if (!hasPermission) {
        throw new Error('Permission denied');
      }

      const content = generateMarkdown(question);
      const filename = `${question.title.toLowerCase().replace(/\s+/g, '-')}.md`;
      
      const fileHandle = await fileSystem.handle.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();
    } catch (error) {
      await handleFileSystemError(error as Error);
    }
  };

  // Add a retry mechanism for file system operations
  const retryOperation = async <T,>(
    operation: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> => {
    let lastError: Error | null = null;
  
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        if (error instanceof Error) {
          lastError = error;
          if (error.name === 'InvalidStateError' && i < maxRetries - 1) {
            // Try to reload the directory handle
            await loadDirectory();
            continue;
          }
        } else {
          lastError = new Error('An unknown error occurred');
        }
        break;
      }
    }
  
    throw lastError;
  };
  
  useEffect(() => {
    if (fileSystem.handle && questions.length > 0) {
      questions.forEach(async (question) => {
        try {
          await retryOperation(() => saveQuestionToFile(question));
        } catch (error) {
          await handleFileSystemError(error as Error);
        }
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
      type: 'markdown',
      enableCodeFormatting: false
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
    if (!questionData.question.trim() || !fileSystem.handle) return;
  
    const enableCodeFormatting = true;
    const defaultLanguage = "javascript";
  
    const newQuestionData: DashboardQuestion = {
      id: currentlyEditing || uuidv4(),
      title: questionData.title,
      question: questionData.question,
      answers: questionData.answers,
      difficulty: questionData.difficulty,
      tags: questionData.tags,
      isExpanded: false,
      onEditMarkdown: () => { },
      type: "question",
      markdownContent: generateMarkdown(
        questionData,
        enableCodeFormatting,
        defaultLanguage
      ),
      enableCodeFormatting: false
    };
  
    try {
      // Generate markdown content
      const markdownContent = generateMarkdown(
        newQuestionData,
        enableCodeFormatting,
        defaultLanguage
      );
  
      // Save to file system
      const filename = `${questionData.title
        .toLowerCase()
        .replace(/\s+/g, "-")}.md`;
      const fileHandle = await fileSystem.handle.getFileHandle(filename, {
        create: true,
      });
      const writable = await fileHandle.createWritable();
      await writable.write(markdownContent || "");
      await writable.close();
  
      // Update state
      if (currentlyEditing) {
        setQuestions(
          questions.map((q) =>
            q.id === currentlyEditing ? newQuestionData : q
          )
        );
      } else {
        setQuestions([...questions, newQuestionData]);
      }
  
      setShowEditor(false);
      setInitialData(undefined);
      setCurrentlyEditing(null);
    } catch (error) {
      console.error("Error saving question:", error);
      alert("Failed to save question. Please try again.");
    }
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