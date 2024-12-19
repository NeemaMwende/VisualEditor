"use client"
import React, { useState } from 'react';
import QuestionEditor from './QuestionEditor';
import MarkdownPreview from './MarkdownPreview';
import SavedQuestionsList from './SavedQuestionsList';
import FileActions from './FileActions';

const Dashboard = () => {
  const [questions, setQuestions] = useState([]);
  const [currentContent, setCurrentContent] = useState('');

  const handleSaveQuestion = (markdown: string) => {
    setQuestions([...questions, markdown]);
    setCurrentContent('');
  };

  return (
    <div className="container mx-auto">
      <h1 className="text-4xl font-bold mb-2 text-center">Question Editor Dashboard</h1>
      <h2 className="text-lg mb-6 text-center">Let's create some questions!</h2>

      <div className="flex gap-8 mb-6">
        <QuestionEditor content={currentContent} setContent={setCurrentContent} />
        <MarkdownPreview content={currentContent} />
      </div>

      <FileActions
        content={currentContent}
        onSave={handleSaveQuestion}
        setContent={setCurrentContent}
      />

      <SavedQuestionsList
        questions={questions}
        setCurrentContent={setCurrentContent}
        setQuestions={setQuestions}
      />
    </div>
  );
};

export default Dashboard;
