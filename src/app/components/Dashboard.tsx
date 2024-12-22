'use client';
import React, { useState, useEffect } from 'react';
import QuestionEditor from '../questioneditor/components/QuestionEditor';
import SavedQuestionsList from '../savedquestionslists/components/SavedQuestionsList';

export interface Answer {
  id: number;
  text: string;
  isCorrect?: boolean;
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
}

export interface DashboardQuestion extends BaseQuestion {
  onEdit?: () => void;
  initialData?: Answer[];
}

const Dashboard = () => {
  const [questions, setQuestions] = useState<DashboardQuestion[]>([]);
  const [currentlyEditing, setCurrentlyEditing] = useState<number | null>(null);
  const [nextId, setNextId] = useState(1);
  const [showEditor, setShowEditor] = useState(false);
  const [initialData, setInitialData] = useState<QuestionData | undefined>(undefined);

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
        const title = await promptForTitle();
        const newQuestion: DashboardQuestion = {
          id: nextId,
          title,
          question: questionData.question,
          answers: questionData.answers,
          difficulty: 1,
          tags: questionData.tags || [],
          isExpanded: false,
        };
        setQuestions([...questions, newQuestion]);
        setNextId(nextId + 1);
      }
  
      setShowEditor(false);
      setInitialData(undefined);
    }
  };
  
  const handleEdit = (question: DashboardQuestion) => {
    setCurrentlyEditing(question.id);
    setInitialData({
      question: question.question,
      answers: question.answers,
      title: question.title,
      difficulty: question.difficulty,
      tags: question.tags
    });
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
          initialData={initialData}
          isEditing={currentlyEditing !== null}
        />
      ) : (
        <SavedQuestionsList
          questions={questions}
          onEdit={handleEdit}
          setQuestions={setQuestions}
          markdowns={[]}  
          onEditMarkdown={() => {}} 
          setMarkdowns={() => {}}  
        />
      )}
    </div>
  );
};

export default Dashboard;