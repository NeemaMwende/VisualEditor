'use client';
import React, { useState, useEffect } from 'react';
import QuestionEditor from './QuestionEditor';
import SavedQuestionsList from './SavedQuestionsList';
import { Question, QuestionData } from './Interfaces';


const Dashboard = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentlyEditing, setCurrentlyEditing] = useState<number | null>(null);
  const [nextId, setNextId] = useState(1);
  const [showEditor, setShowEditor] = useState(false);
  const [initialData, setInitialData] = useState<QuestionData | undefined>(undefined);

  // Load questions from local storage when the component mounts
  useEffect(() => {
    const savedQuestions = localStorage.getItem('questions');
    if (savedQuestions) {
      const parsedQuestions: Question[] = JSON.parse(savedQuestions);
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

  // Save a new or edited question
  const handleSaveQuestion = async (questionData: QuestionData) => {
    if (questionData.question.trim()) {
      const difficulty = parseInt(prompt('Enter difficulty level (1, 2, or 3):', '1') || '1');
      const tagsInput = prompt('Enter tags (comma-separated):', '') || '';
      const tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag);
  
      if (currentlyEditing !== null) {
        const updatedQuestions = questions.map(q =>
          q.id === currentlyEditing
            ? { 
                ...q, 
                question: questionData.question, 
                answers: questionData.answers, 
                difficulty, 
                tags 
              }
            : q
        );
        setQuestions(updatedQuestions);
        setCurrentlyEditing(null);
      } else {
        const title = await promptForTitle();
        const newQuestion: Question = {
          id: nextId,
          title,
          question: questionData.question,
          answers: questionData.answers,
          difficulty,
          tags,
          isExpanded: false
        };
        setQuestions([...questions, newQuestion]);
        setNextId(nextId + 1);
      }
  
      setShowEditor(false);
      setInitialData(undefined);
    }
  };

  // Edit an existing question
  const handleEdit = (question: Question) => {
    setCurrentlyEditing(question.id);
    setInitialData({ question: question.question, answers: question.answers });
    setShowEditor(true);
  };

  // Create a new question
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
        />
      )}
    </div>
  );
};

export default Dashboard;