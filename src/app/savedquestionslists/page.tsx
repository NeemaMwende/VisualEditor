"use client";

import { useState, Suspense } from 'react';
import SavedQuestionsList from './components/SavedQuestionsList';
import { DashboardQuestion } from '../components/Interfaces'; 
import { BaseQuestion, MarkdownData, MarkdownEditData } from '../components/Interfaces';

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
      <Suspense fallback={<p>Loading saved questions...</p>}>
        <SavedQuestionsList
          questions={questions}
          onEdit={handleEdit}
          onEditMarkdown={handleEditMarkdown}
          setQuestions={setQuestions}
          markdowns={markdowns}
          setMarkdowns={setMarkdowns}
          fileSystem={fsState}
        />
      </Suspense>
    </main>
  );
}
