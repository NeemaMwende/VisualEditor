"use client"
import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ArrowLeft, Shuffle, Settings } from 'lucide-react';
import { generateMarkdown, parseMarkdownContent } from '../../../utils/markdownUtils';
import { EditorQuestion } from '@/app/components/Interfaces';
import { v4 as uuidv4 } from 'uuid';
import TagSelector from './TagSelector';
import { MarkdownData } from '@/app/components/Interfaces';
import TextSelectionFormatter from '@/app/components/TextSelectionFormatter';

interface QuestionEditorProps {
  onSave: (data: Question) => void;
  onBack: () => void;
  initialData?: EditorQuestion | Question;
  isEditing?: boolean;
  onSaveMarkdown?: (markdownData: MarkdownData) => void;
}


interface FormattingOptions {
  enableCodeFormatting: boolean;
  defaultLanguage: 'javascript' | 'html';
}

interface Answer {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id?: string;
  question: string;
  answers: Answer[];
  difficulty: number;
  tags: string[];
  title: string;
  markdownContent?: string;
  type?: 'question' | 'markdown';
  codeLanguage?: 'javascript' | 'html'; 
  enableCodeFormatting?: boolean;
}

interface FileData {
  name: string;
  content: string;
  path: string;
}

const QuestionEditor: React.FC<QuestionEditorProps> = ({ onSave, onBack, initialData, isEditing = false, }) => {
  const [question, setQuestion] = useState('');
  const [answers, setAnswers] = useState<Answer[]>([
    { id: '1', text: '', isCorrect: false },
    { id: '2', text: '', isCorrect: false },
    { id: '3', text: '', isCorrect: false },
    { id: '4', text: '', isCorrect: false }
  ]);
  const [difficulty, setDifficulty] = useState(1);
  const [tags, setTags] = useState<string[]>([]);
  const [showMarkdown, setShowMarkdown] = useState(false);
  const [markdownContent, setMarkdownContent] = useState('');
  const [selectedFiles] = useState<FileData[]>([]);
  const [currentFile] = useState<FileData | null>(null);
  const [title, setTitle] = useState(initialData?.title || '');
  const [isMarkdownSyncing, setIsMarkdownSyncing] = useState(false);
  const [formattingOptions, setFormattingOptions] = useState<FormattingOptions>({
    enableCodeFormatting: true,
    defaultLanguage: (initialData as Question)?.codeLanguage || 'javascript'
  });
  const [answerOrder, setAnswerOrder] = useState<string[]>([]);
  const lastLanguageRef = useRef<'javascript' | 'html'>(formattingOptions.defaultLanguage);

 
  const handleFormatText = (formattedText: string, language: 'javascript' | 'html') => {
    // Update either question or answer based on current selection context
    const currentQuestionData = {
      id: initialData?.id || uuidv4(),
      question,
      answers,
      difficulty,
      tags,
      title,
      codeLanguage: formattingOptions.defaultLanguage,
    };

    const newMarkdownContent = generateMarkdown(
      {
        ...currentQuestionData,
        question: formattedText
      },
      formattingOptions.enableCodeFormatting,
      language
    );
    setMarkdownContent(newMarkdownContent);
  };

  const FormattingControls = () => (
    <div className="mb-6 p-2 sm:p-4 bg-gray-50 rounded-lg border">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
        <div className="flex items-center gap-2">
          <Settings size={20} className="text-gray-500" />
          <h3 className="font-medium">Code Formatting Options</h3>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formattingOptions.enableCodeFormatting}
            onChange={(e) => {
              const newFormattingState = e.target.checked;
              setFormattingOptions((prev) => ({
                ...prev,
                enableCodeFormatting: newFormattingState,
              }));
              updateMarkdownFormatting(newFormattingState);
            }}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <span className="text-sm">Enable automatic code formatting</span>
        </label>

        <div className="flex items-center gap-2">
          <span className="text-sm">Default language:</span>
          <select
            value={formattingOptions.defaultLanguage}
            onChange={(e) => setFormattingOptions(prev => ({
              ...prev,
              defaultLanguage: e.target.value as 'javascript' | 'html'
            }))}
            disabled={!formattingOptions.enableCodeFormatting}
            className="text-sm border rounded p-1"
          >
            <option value="javascript">JavaScript</option>
            <option value="html">HTML</option>
          </select>
        </div>
      </div>
    </div>
  );


  useEffect(() => {
    if (answers.length > 0 && answerOrder.length === 0) {
      setAnswerOrder(answers.map(a => a.id));
    }
  }, [answers]);

  const randomizeAnswers = () => {
    const newOrder = [...answerOrder];
    for (let i = newOrder.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newOrder[i], newOrder[j]] = [newOrder[j], newOrder[i]];
    }
    setAnswerOrder(newOrder);
  
    const reorderedAnswers = newOrder.map(id => answers.find(a => a.id === id)!);
    setAnswers(reorderedAnswers);
  
    const updatedMarkdown = generateMarkdown(
      {
        id: initialData?.id || uuidv4(),
        question,
        answers: reorderedAnswers,
        difficulty,
        tags,
        title,
        codeLanguage: formattingOptions.defaultLanguage,
      },
      formattingOptions.enableCodeFormatting,
      formattingOptions.defaultLanguage
    );
  
    setMarkdownContent(updatedMarkdown);
  };
  

  useEffect(() => {
    if (isEditing && initialData) {
      setQuestion(initialData.question || '');
      const initialAnswers = (initialData.answers || []).map((answer) => ({
        id: answer.id || uuidv4(),
        text: answer.text || "",
        isCorrect: !!answer.isCorrect,
      }));
      setAnswers(initialAnswers);
      setAnswerOrder(initialAnswers.map(a => a.id));
      setDifficulty(initialData.difficulty || 1);
      setTitle(initialData.title || '');
      if (initialData.tags) {
        setTags(initialData.tags);
      }
      setMarkdownContent(initialData.markdownContent || '');
      if ((initialData as Question).codeLanguage) {
        setFormattingOptions(prev => ({
          ...prev,
          defaultLanguage: (initialData as Question).codeLanguage || 'javascript'
        }));
      }
    }
  }, [initialData, isEditing]);

useEffect(() => {
  if (showMarkdown && !isMarkdownSyncing && formattingOptions.defaultLanguage) {
    const shouldUpdate = lastLanguageRef.current !== formattingOptions.defaultLanguage;
    if (shouldUpdate) {
      const newMarkdown = generateMarkdown(
        {
          id: initialData?.id || uuidv4(),
          question,
          answers,
          difficulty,
          tags,
          title,
          codeLanguage: formattingOptions.defaultLanguage,
        },
        formattingOptions.enableCodeFormatting,
        formattingOptions.defaultLanguage
      );
      setMarkdownContent(newMarkdown);
      lastLanguageRef.current = formattingOptions.defaultLanguage;
    }
  }
}, [showMarkdown, formattingOptions.defaultLanguage, question, answers, difficulty, tags, title]);

 
  useEffect(() => {
    if (showMarkdown && markdownContent && !isMarkdownSyncing) {
      try {
        const parsedData = parseMarkdownContent(markdownContent, formattingOptions);
        if (parsedData) {
          setIsMarkdownSyncing(true);
          
          const updatedAnswers = parsedData.answers.map((answer, index) => ({
            id: answers[index]?.id || uuidv4(),
            text: answer.text || '',
            isCorrect: answer.isCorrect || false
          }));

          setQuestion(parsedData.question.trim());
          setAnswers(updatedAnswers);
          setAnswerOrder(updatedAnswers.map(a => a.id));
          setDifficulty(parsedData.difficulty);
          setTags(parsedData.tags);
          
          setTimeout(() => setIsMarkdownSyncing(false), 0);
        }
      } catch (error) {
        console.error('Error parsing markdown:', error);
        setIsMarkdownSyncing(false);
      }
    }
  }, [markdownContent, showMarkdown]);

  const handleMarkdownUpdate = (newContent: string) => {
    setMarkdownContent(newContent);
  };


  const handleSave = () => {
    if (!title.trim()) {
      if (currentFile?.name) {
        const fileTitle = currentFile.name.replace(/\.[^/.]+$/, '')
          .split(/[-_\s]/)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
        setTitle(fileTitle);
      } else {
        alert('Please provide a title');
        return;
      }
    }
  
    const orderedAnswers = answerOrder.map((id) => answers.find((a) => a.id === id)!);
  
    // Generate markdown with the current formatting preference
    const updatedMarkdown = generateMarkdown(
      {
        id: initialData?.id || uuidv4(),
        question,
        answers: orderedAnswers,
        difficulty,
        tags,
        title,
        codeLanguage: formattingOptions.defaultLanguage,
        enableCodeFormatting: formattingOptions.enableCodeFormatting // Pass the formatting preference
      },
      formattingOptions.enableCodeFormatting,
      formattingOptions.defaultLanguage
    );
  
    const savedData: Question = {
      id: initialData?.id || uuidv4(),
      question,
      answers: orderedAnswers,
      difficulty,
      tags,
      title,
      type: 'question',
      markdownContent: updatedMarkdown,
      codeLanguage: formattingOptions.defaultLanguage,
      enableCodeFormatting: formattingOptions.enableCodeFormatting // Save the formatting preference
    };
  
    try {
      const existingQuestions = JSON.parse(localStorage.getItem("questions") || "[]");
  
      const updatedQuestions = isEditing
        ? existingQuestions.map((q: Question) =>
            q.id === initialData?.id ? savedData : q
          )
        : [...existingQuestions, savedData];
  
      localStorage.setItem("questions", JSON.stringify(updatedQuestions));
      alert("Saved successfully!");
      onSave(savedData);
    } catch (error) {
      console.error("Error saving:", error);
      alert("Failed to save. Please try again.");
    }
  };
  

  const updateMarkdownFormatting = (enableFormatting: boolean) => {
    const updatedMarkdown = generateMarkdown(
      {
        id: initialData?.id || uuidv4(),
        question,
        answers,
        difficulty,
        tags,
        title,
        codeLanguage: formattingOptions.defaultLanguage,
      },
      enableFormatting,
      formattingOptions.defaultLanguage
    );
  
    setMarkdownContent(updatedMarkdown);
  };
  
  const handleBack = () => {
    if (question.trim() || answers.some(a => a.text.trim())) {
      const confirm = window.confirm('You have unsaved changes. Are you sure you want to go back?');
      if (!confirm) return;
    }
    onBack();
  };


  return (
    <div className="w-full max-w-4xl mx-auto p-2 sm:p-4">
        <TextSelectionFormatter 
  onFormat={handleFormatText} 
  currentQuestion={{
    question,
    answers,
    difficulty,
    tags,
    title
  }} 
  onQuestionChange={setQuestion}
/>
      <div className="mb-4">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="hidden sm:inline">Back to Questions</span>
        </button>
      </div>

      <div className="bg-white shadow-sm form-content p-3 sm:p-6 rounded-lg space-y-4 sm:space-y-6">
        <FormattingControls />
        
        {showMarkdown ? (
          <div className="space-y-4">
            <label className="block text-gray-700 text-sm font-bold">
              Markdown Content
            </label>
            <textarea
              value={markdownContent}
              onChange={(e) => handleMarkdownUpdate(e.target.value)}
              className="w-full p-4 bg-gray-50 rounded-md font-mono text-sm"
              rows={20}
            />
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            <div className="space-y-2">
              <label className="block text-gray-700 text-sm font-bold">
                Title
              </label>
              <input
                type="text"
                placeholder="Enter question title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2 sm:p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                readOnly={!!currentFile}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-gray-700 text-sm font-bold">
                Difficulty Level
              </label>
              <div className="relative">
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(parseInt(e.target.value))}
                  className="w-full p-2 sm:p-3 border rounded-md appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value={1}>Beginner (Level 1)</option>
                  <option value={2}>Intermediate (Level 2)</option>
                  <option value={3}>Advanced (Level 3)</option>
                </select>
                <ChevronDown
                  size={20}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-gray-700 text-sm font-bold">
                Tags
              </label>
              <TagSelector
                selectedTags={tags}
                onTagsChange={setTags}
                files={selectedFiles}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-gray-700 text-sm font-bold">
                Question
              </label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full p-2 sm:p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Enter your question here"
              />
            </div>

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <label className="block text-gray-700 text-sm font-bold">
                  Answers
                </label>
                <button
                  onClick={randomizeAnswers}
                  className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors w-full sm:w-auto justify-center sm:justify-start"
                >
                  <Shuffle size={16} />
                  Randomize Answers
                </button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {answers.map((answer, index) => (
                  <div key={answer.id} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={answer.isCorrect}
                        onChange={() => {
                          const newAnswers = answers.map((ans, i) => ({
                            ...ans,
                            isCorrect: i === index
                          }));
                          setAnswers(newAnswers);
                        }}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <label className="text-sm font-medium text-gray-700">
                        Answer {String.fromCharCode(65 + index)}
                      </label>
                    </div>
                    <textarea
                      value={answer.text}
                      onChange={(e) => {
                        const newAnswers = [...answers];
                        newAnswers[index] = { ...answer, text: e.target.value };
                        setAnswers(newAnswers);
                      }}
                      className="w-full p-2 sm:p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                      placeholder={`Enter answer ${String.fromCharCode(65 + index)}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 sm:pt-6 border-t">
          <button
            onClick={handleBack}
            className="w-full sm:w-auto px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={() => setShowMarkdown(!showMarkdown)}
            className="w-full sm:w-auto px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            {showMarkdown ? 'Edit Question' : 'View Markdown'}
          </button>
          <button
            onClick={handleSave}
            className="w-full sm:w-auto px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600"
          >
            {isEditing ? 'Save Changes' : 'Save Question'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionEditor;