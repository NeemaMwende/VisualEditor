'use client';
import React, { useState, useEffect } from 'react';
import QuestionEditor from './QuestionEditor';
import SavedQuestionsList from './SavedQuestionsList';

interface Answer {
  id: number;
  text: string;
}

interface Question {
  id: number;
  title: string;
  question: string;
  answers: Answer[];
  isExpanded: boolean;
}

const Dashboard = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentlyEditing, setCurrentlyEditing] = useState<number | null>(null);
  const [nextId, setNextId] = useState(1);
  const [showEditor, setShowEditor] = useState(false);
  const [initialData, setInitialData] = useState<{ question: string; answers: Answer[] } | null>(null);
  const [markdownContent, setMarkdownContent] = useState('');
  const [showMarkdown, setShowMarkdown] = useState(false);

  // Load questions from local storage when the component mounts
  useEffect(() => {
    const savedQuestions = localStorage.getItem('questions');
    if (savedQuestions) {
      const parsedQuestions = JSON.parse(savedQuestions);
      setQuestions(parsedQuestions);
      setNextId(parsedQuestions.length ? parsedQuestions[parsedQuestions.length - 1].id + 1 : 1);
    }
  }, []);

  // Save questions to local storage whenever the questions state changes
  useEffect(() => {
    localStorage.setItem('questions', JSON.stringify(questions));
  }, [questions]);

  // Prompt for a title when creating a new question
  const promptForTitle = async () => {
    const title = window.prompt('Enter a title for the question:', 'New Question');
    return title || 'Untitled Question';
  };

  // Save a new or edited question
  const handleSaveQuestion = async (questionData: { question: string; answers: Answer[] }) => {
    if (questionData.question.trim()) {
      if (currentlyEditing !== null) {
        const updatedQuestions = questions.map(q =>
          q.id === currentlyEditing
            ? { ...q, question: questionData.question, answers: questionData.answers }
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
          isExpanded: false,
        };
        setQuestions([...questions, newQuestion]);
        setNextId(nextId + 1);
      }
      setShowEditor(false);
      setInitialData(null);
      updateMarkdownContent();
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
    setInitialData(null);
    setShowEditor(true);
  };

  // Upload a markdown file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const text = await file.text();
        setMarkdownContent(text);
        parseMarkdownToQuestions(text);
      } catch (error) {
        console.error('Error reading file:', error);
      }
    }
  };

  // Parse markdown content to extract questions
  const parseMarkdownToQuestions = (markdown: string) => {
    const lines = markdown.split('\n');
    const parsedQuestions: Question[] = [];
    let currentQuestion = '';
    let currentAnswers: Answer[] = [];
    let currentId = 1;

    lines.forEach(line => {
      if (line.startsWith('## ')) {
        if (currentQuestion) {
          parsedQuestions.push({
            id: currentId++,
            title: currentQuestion,
            question: currentQuestion,
            answers: currentAnswers,
            isExpanded: false,
          });
        }
        currentQuestion = line.slice(3).trim();
        currentAnswers = [];
      } else if (line.startsWith('* ')) {
        currentAnswers.push({ id: currentAnswers.length + 1, text: line.slice(2).trim() });
      }
    });

    if (currentQuestion) {
      parsedQuestions.push({
        id: currentId++,
        title: currentQuestion,
        question: currentQuestion,
        answers: currentAnswers,
        isExpanded: false,
      });
    }

    setQuestions(parsedQuestions);
    setNextId(currentId);
  };

  // Update markdown content based on current questions
  const updateMarkdownContent = () => {
    const newMarkdown = questions
      .map(q => {
        const answers = q.answers.map(a => `* ${a.text}`).join('\n');
        return `## ${q.title}\n${answers}`;
      })
      .join('\n\n');
    setMarkdownContent(newMarkdown);
  };

  // Toggle markdown view
  const toggleMarkdownView = () => {
    setShowMarkdown(!showMarkdown);
  };

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Question Editor</h1>
        <div className="flex gap-4">
          <input
            type="file"
            accept=".md"
            onChange={handleFileUpload}
            className="block text-sm text-gray-500 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <button onClick={handleNewQuestion} className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600">
            Create New Question
          </button>
          <button onClick={toggleMarkdownView} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
            {showMarkdown ? 'View Questions' : 'View Markdown'}
          </button>
        </div>
      </div>

      {showMarkdown ? (
        <div className="border rounded-md p-4 h-96 bg-gray-50 overflow-auto">
          <pre className="whitespace-pre-wrap font-mono text-sm">{markdownContent}</pre>
        </div>
      ) : showEditor ? (
        <QuestionEditor onSave={handleSaveQuestion} initialData={initialData} isEditing={currentlyEditing !== null} />
      ) : (
        <SavedQuestionsList questions={questions} onEdit={handleEdit} setQuestions={setQuestions} />
      )}
    </div>
  );
};

export default Dashboard;
