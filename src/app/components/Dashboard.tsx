'use client';
import React, { useState, useEffect } from 'react';
import QuestionEditor from '../questioneditor/components/QuestionEditor';
import SavedQuestionsList from '../savedquestionslists/components/SavedQuestionsList';
import { MarkdownData } from '@/app/components/Interfaces';
export interface Answer {
  id: number;
  text: string;
  isCorrect?: boolean;
}

export interface QuestionEditorProps {
  onSave: (data: QuestionData) => Promise<void>;
  onSaveMarkdown: (data: MarkdownData) => void;
  initialData?: QuestionData | MarkdownEditData;
  isEditing: boolean;
}

export interface BaseQuestion {
  id: number;
  title: string;
  question: string;
  answers: Answer[];
  difficulty: number;
  tags: string[];
  isExpanded?: boolean;
}

export interface QuestionData {
  question: string;
  answers: Answer[];
  title?: string;
  difficulty?: number;
  tags?: string[];
  // id: number;
  // content: string;
  //  createdAt: string;
}

export interface MarkdownEditData{
  id: number;
  title: string;
  content: string;
  createdAt: string;
}

export interface DashboardQuestion extends BaseQuestion {
  onEdit?: () => void;
  initialData?: Answer[];
  onEditMarkdown: (markdown: MarkdownData) => void;
}

export interface EditorQuestion extends QuestionData {
  isEditing: boolean;
  id: number;
}


const Dashboard = () => {
  const [questions, setQuestions] = useState<DashboardQuestion[]>([]);
  const [currentlyEditing, setCurrentlyEditing] = useState<number | null>(null);
  const [nextId, setNextId] = useState(1);
  const [showEditor, setShowEditor] = useState(false);
  const [initialData, setInitialData] = useState<EditorQuestion | undefined>(undefined);
  const [markdowns, setMarkdowns] = useState<MarkdownData[]>([]);
  const [currentlyEditingMarkdown, setCurrentlyEditingMarkdown] = useState<number | null>(null);

  useEffect(() => {
    const savedQuestions = localStorage.getItem('questions');
    if (savedQuestions) {
      const parsedQuestions: DashboardQuestion[] = JSON.parse(savedQuestions);
      setQuestions(parsedQuestions);
      setNextId(parsedQuestions.length ? parsedQuestions[parsedQuestions.length - 1].id + 1 : 1);
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
    const markdownData: EditorQuestion = {
      id: markdown.id,
      title: markdown.title,
      question: '',
      answers: [],
      difficulty: 1,
      tags: [],
      isEditing: true
    };
    setInitialData(markdownData);
    setShowEditor(true);
  };
  

  const promptForTitle = async () => {
    const title = window.prompt('Enter a title for the question:', 'New Question');
    return title || 'Untitled Question';
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
                tags: questionData.tags || q.tags,
                difficulty: questionData.difficulty || q.difficulty,
                title: questionData.title || q.title,
              }
            : q
        );
        setQuestions(updatedQuestions);
        setCurrentlyEditing(null);
      } else {
        
        const newQuestion: DashboardQuestion = {
          id: nextId,
          title: await promptForTitle(),
          question: questionData.question,
          answers: questionData.answers,
          difficulty: 1,
          tags: questionData.tags || [],
          isExpanded: false,
          onEditMarkdown: () => {},
        };
        setQuestions([...questions, newQuestion]);
        setNextId(nextId + 1);
      }
  
      setShowEditor(false);
      setInitialData(undefined);
    }
  };
  
 const handleEdit = (question: BaseQuestion | DashboardQuestion) => {
  if ('onEditMarkdown' in question) {
    setCurrentlyEditing(question.id);
    const questionData: EditorQuestion = {
      id: question.id,
      question: question.question,
      answers: question.answers,
      title: question.title,
      difficulty: question.difficulty,
      tags: question.tags,
      isEditing: true,
    };
    setInitialData(questionData);
    setShowEditor(true);
  }
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
          onSaveMarkdown={handleSaveMarkdown}
          initialData={initialData}
          isEditing={currentlyEditing !== null || currentlyEditingMarkdown !== null}
        />
      ) : (
        <SavedQuestionsList
          questions={questions}
          onEdit={(question: BaseQuestion | DashboardQuestion) => handleEdit(question)}
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