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
  difficulty: number; 
  tags: string[]; 
  initialData: Answer[];
  questions: string;
  onEdit: string;
}

const Dashboard = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentlyEditing, setCurrentlyEditing] = useState<number | null>(null);
  const [nextId, setNextId] = useState(1);
  const [showEditor, setShowEditor] = useState(false);
  const [initialData, setInitialData] = useState<{ question: string; answers: Answer[] } | null>(null);
  const [markdownContent, setMarkdownContent] = useState('');
  const [isFileUploaded, setIsFileUploaded] = useState(false);
  const [viewMarkdown, setViewMarkdown] = useState(false);


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
      const difficulty = parseInt(prompt('Enter difficulty level (1, 2, or 3):', '1') || '1');
      const tagsInput = prompt('Enter tags (comma-separated):', '') || '';
      const tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag);
  
      if (currentlyEditing !== null) {
        const updatedQuestions = questions.map(q =>
          q.id === currentlyEditing
            ? { ...q, question: questionData.question, answers: questionData.answers, difficulty, tags }
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
        setIsFileUploaded(true);
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
    let currentDifficulty = 1;
    let currentTags: string[] = [];
    let currentId = 1;
  
    lines.forEach(line => {
      if (line.startsWith('## ')) {
        if (currentQuestion) {
          parsedQuestions.push({
            id: currentId++,
            title: currentQuestion,
            question: currentQuestion,
            answers: currentAnswers,
            difficulty: currentDifficulty,
            tags: currentTags,
            isExpanded: false,
          });
        }
        currentQuestion = line.slice(3).trim();
        currentAnswers = [];
        currentDifficulty = 1;
        currentTags = [];
      } else if (line.startsWith('* ')) {
        currentAnswers.push({ id: currentAnswers.length + 1, text: line.slice(2).trim() });
      } else if (line.startsWith('**Difficulty:**')) {
        currentDifficulty = parseInt(line.split(':')[1].trim()) || 1;
      } else if (line.startsWith('**Tags:**')) {
        currentTags = line.split(':')[1].trim().split(',').map(tag => tag.trim());
      }
    });
  
    if (currentQuestion) {
      parsedQuestions.push({
        id: currentId++,
        title: currentQuestion,
        question: currentQuestion,
        answers: currentAnswers,
        difficulty: currentDifficulty,
        tags: currentTags,
        isExpanded: false,
      });
    }
  
    setQuestions(parsedQuestions);
    setNextId(currentId);
  };
  

  const updateMarkdownContent = () => {
    const newMarkdown = questions
      .map(q => {
        const answers = q.answers.map(a => (a.text.startsWith('```') ? a.text : `* ${a.text}`)).join('\n');
        return `## ${q.title}\n**Difficulty:** ${q.difficulty}\n**Tags:** ${q.tags.join(', ')}\n${answers}`;
      })
      .join('\n\n');
    setMarkdownContent(newMarkdown);
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
          {isFileUploaded && (
            <>
              <button onClick={() => setViewMarkdown(true)} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
                View Markdown
              </button>
              <button onClick={() => setViewMarkdown(false)} className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600">
                View Questions
              </button>
            </>
          )}
        </div>
      </div>

      {viewMarkdown && isFileUploaded ? (
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
