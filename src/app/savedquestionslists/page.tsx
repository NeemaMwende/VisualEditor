"use client"
import { useState } from 'react';
import SavedQuestionsList from './components/SavedQuestionsList';
import { BaseQuestion, MarkdownData, MarkdownEditData } from '../components/Interfaces';
import { DashboardQuestion } from '@/app/components/Dashboard';

export default function Home() {
  const [questions, setQuestions] = useState<DashboardQuestion[]>([]);
  const [markdowns, setMarkdowns] = useState<MarkdownData[]>([]);
  const [fsState] = useState({
    handle: null,
    path: '',
  });

  const handleEdit = (question: BaseQuestion | DashboardQuestion) => {
   
    console.log('Editing question:', question);
  };

  const handleEditMarkdown = (markdown: MarkdownEditData) => {
    
    console.log('Editing markdown:', markdown);
  };

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <SavedQuestionsList
        questions={questions}
        onEdit={handleEdit}
        onEditMarkdown={handleEditMarkdown}
        setQuestions={setQuestions}
        markdowns={markdowns}
        setMarkdowns={setMarkdowns}
        fileSystem={fsState}
      />
    </main>
  );
}