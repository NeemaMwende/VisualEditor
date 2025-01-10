'use client';
import React, { useState, useEffect, useRef } from 'react';
import QuestionEditor from '../questioneditor/components/QuestionEditor';
import SavedQuestionsList from '../savedquestionslists/components/SavedQuestionsList';
import { MarkdownData, BaseQuestion } from '@/app/components/Interfaces';
import { parseMarkdownContent } from './../../utils/markdownUtils';
import { Folder } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface FileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  webkitdirectory?: string;
  directory?: string;
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

const Dashboard = () => {
  const [questions, setQuestions] = useState<DashboardQuestion[]>([]);
  const [currentlyEditing, setCurrentlyEditing] = useState<string | null>(null);
  const [nextId, setNextId] = useState(1);
  const [showEditor, setShowEditor] = useState(false);
  const [initialData, setInitialData] = useState<Question | undefined>(undefined);
  const [markdowns, setMarkdowns] = useState<MarkdownData[]>([]);
  const [currentlyEditingMarkdown, setCurrentlyEditingMarkdown] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedQuestions = localStorage.getItem('questions');
    if (savedQuestions) {
      const parsedQuestions: DashboardQuestion[] = JSON.parse(savedQuestions);
      setQuestions(parsedQuestions);
      setNextId(parsedQuestions.length ? Number(parsedQuestions[parsedQuestions.length - 1].id) + 1 : 1);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('questions', JSON.stringify(questions));
  }, [questions]);

  useEffect(() => {
    const savedMarkdowns = localStorage.getItem('markdowns');
    if (savedMarkdowns) {
      setMarkdowns(JSON.parse(savedMarkdowns));
    }
  }, []);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newQuestions: DashboardQuestion[] = [];
    
    for (const file of files) {
      if (file.name.endsWith('.md')) {
        const content = await file.text();
        const parsedData = parseMarkdownContent(content);
        const fileTitle = file.name.replace(/\.[^/.]+$/, '')
          .split(/[-_\s]/)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');

        const newQuestion: DashboardQuestion = {
          id: uuidv4(),
          title: fileTitle,
          question: parsedData.question,
          answers: parsedData.answers,
          difficulty: parsedData.difficulty,
          tags: parsedData.tags,
          markdownContent: content,
          isExpanded: false,
          onEditMarkdown: () => {},
          type: 'question'
        };
        
        newQuestions.push(newQuestion);
      }
    }
    
    setQuestions(prevQuestions => [...prevQuestions, ...newQuestions]);
  };

  const handleSaveMarkdown = (markdownData: MarkdownData) => {
    const updatedMarkdowns = [...markdowns];
    const existingIndex = markdowns.findIndex(m => m.title === markdownData.title);
    
    if (existingIndex !== -1) {
      updatedMarkdowns[existingIndex] = markdownData;
    } else {
      updatedMarkdowns.push(markdownData);
    }
    
    setMarkdowns(updatedMarkdowns);
    localStorage.setItem('markdowns', JSON.stringify(updatedMarkdowns));
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
    if (questionData.question.trim()) {
      if (currentlyEditing !== null) {
        const updatedQuestions = questions.map(q =>
          q.id === currentlyEditing
            ? {
                ...q,
                question: questionData.question,
                answers: questionData.answers,
                tags: questionData.tags,
                difficulty: questionData.difficulty,
                title: questionData.title,
              }
            : q
        );
        setQuestions(updatedQuestions);
        setCurrentlyEditing(null);
      } else {
        const newQuestion: DashboardQuestion = {
          id: nextId.toString(),
          title: questionData.title,
          question: questionData.question,
          answers: questionData.answers,
          difficulty: questionData.difficulty,
          tags: questionData.tags,
          isExpanded: false,
          onEditMarkdown: () => {},
          type: 'question'
        };
        setQuestions([...questions, newQuestion]);
        setNextId(nextId + 1);
      }
      setShowEditor(false);
      setInitialData(undefined);
    }
  };

  const handleEdit = (question: BaseQuestion | DashboardQuestion) => {
    setCurrentlyEditing(question.id);
    const questionData: Question = {
      id: question.id,
      question: question.question,
      answers: question.answers.map(a => ({
        ...a,
        isCorrect: a.isCorrect || false
      })),
      title: question.title,
      difficulty: question.difficulty,
      tags: question.tags,
      type: 'question'
    };
    setInitialData(questionData);
    setShowEditor(true);
  };

  const handleNewQuestion = () => {
    setCurrentlyEditing(null);
    setInitialData(undefined);
    setShowEditor(true);
  };

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl text-center font-bold">Question Editor</h1>
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
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-2"
          >
            <Folder size={16} />
            Import Questions
          </button>
          <button
            onClick={handleNewQuestion}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
          >
            Create New Question
          </button>
        </div>
      </div>

      {showEditor ? (
        <QuestionEditor
          onSave={handleSaveQuestion}
          onBack={handleBack}
          onSaveMarkdown={handleSaveMarkdown}
          initialData={initialData}
          isEditing={currentlyEditing !== null || currentlyEditingMarkdown !== null}
        />
      ) : (
        <SavedQuestionsList
          questions={questions}
          onEdit={handleEdit}
          onEditMarkdown={handleEditMarkdown}
          setQuestions={setQuestions}
          markdowns={markdowns}
          setMarkdowns={setMarkdowns}
        />
      )}
    </div>
  );
};

export default Dashboard;