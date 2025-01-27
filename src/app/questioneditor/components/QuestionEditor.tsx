"use client"
import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ArrowLeft, Shuffle, Settings } from 'lucide-react';
import { generateMarkdown, parseMarkdownContent, synchronizeMarkdownFormatting } from '../../../utils/markdownUtils';
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

const QuestionEditor: React.FC<QuestionEditorProps> = ({
  onSave,
  onBack,
  initialData,
  isEditing = false,
}) => {
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
  const [title, setTitle] = useState(initialData?.title || '');
  const [formattingOptions, setFormattingOptions] = useState<FormattingOptions>({
    enableCodeFormatting: true,
    defaultLanguage: (initialData as Question)?.codeLanguage || 'javascript'
  });
  const [answerOrder, setAnswerOrder] = useState<string[]>([]);
  const [isMarkdownSyncing, setIsMarkdownSyncing] = useState(false);
  const questionRef = useRef<HTMLTextAreaElement>(null);
  const answerRefs = useRef<(HTMLTextAreaElement | null)[]>([]);
  const lastSyncedMarkdownRef = useRef<string>('');

  // Initialize answer order
  useEffect(() => {
    if (answers.length > 0 && answerOrder.length === 0) {
      setAnswerOrder(answers.map(a => a.id));
    }
  }, [answers]);

  // Load initial data
  useEffect(() => {
    if (isEditing && initialData) {
      const initialAnswers = (initialData.answers || []).map((answer) => ({
        id: answer.id || uuidv4(),
        text: answer.text || '',
        isCorrect: !!answer.isCorrect,
      }));

      setQuestion(initialData.question || '');
      setAnswers(initialAnswers);
      setAnswerOrder(initialAnswers.map((a) => a.id));
      setDifficulty(initialData.difficulty || 1);
      setTitle(initialData.title || '');
      setTags(initialData.tags || []);
      
      // Set initial markdown content
      const initialMarkdown = (initialData as Question).markdownContent || generateMarkdown(
        {
          id: initialData?.id || uuidv4(),
          question: initialData.question || '',
          answers: initialAnswers,
          difficulty: initialData.difficulty || 1,
          tags: initialData.tags || [],
          title: initialData.title || '',
          codeLanguage: (initialData as Question).codeLanguage || formattingOptions.defaultLanguage,
          enableCodeFormatting: formattingOptions.enableCodeFormatting,
        },
        formattingOptions.enableCodeFormatting,
        (initialData as Question).codeLanguage || formattingOptions.defaultLanguage
      );
      
      setMarkdownContent(initialMarkdown);
      lastSyncedMarkdownRef.current = initialMarkdown;

      // Set formatting options
      if ((initialData as Question).codeLanguage) {
        setFormattingOptions((prev) => ({
          ...prev,
          defaultLanguage: (initialData as Question).codeLanguage || 'javascript',
          enableCodeFormatting: (initialData as Question).enableCodeFormatting ?? true,
        }));
      }
    }
  }, [initialData, isEditing]);

  // Sync markdown when content changes
  useEffect(() => {
    if (!isMarkdownSyncing) {
      const newMarkdown = generateMarkdown(
        {
          id: initialData?.id || uuidv4(),
          question,
          answers,
          difficulty,
          tags,
          title,
          codeLanguage: formattingOptions.defaultLanguage,
          enableCodeFormatting: formattingOptions.enableCodeFormatting,
        },
        formattingOptions.enableCodeFormatting,
        formattingOptions.defaultLanguage
      );

      if (newMarkdown !== lastSyncedMarkdownRef.current) {
        setMarkdownContent(newMarkdown);
        lastSyncedMarkdownRef.current = newMarkdown;
      }
    }
  }, [question, answers, difficulty, tags, title, formattingOptions.enableCodeFormatting, formattingOptions.defaultLanguage, isMarkdownSyncing]);

  const handleMarkdownUpdate = (newContent: string) => {
    if (newContent === lastSyncedMarkdownRef.current) return;

    setMarkdownContent(newContent);
    lastSyncedMarkdownRef.current = newContent;

    try {
      setIsMarkdownSyncing(true);
      const parsedData = parseMarkdownContent(newContent, formattingOptions);
      
      if (parsedData) {
        setQuestion(parsedData.question.trim());
        setAnswers(parsedData.answers.map((answer, index) => ({
          id: answers[index]?.id || uuidv4(),
          text: answer.text.trim(),
          isCorrect: answer.isCorrect,
        })));
        setDifficulty(parsedData.difficulty);
        setTags(parsedData.tags);
        
        if (parsedData.codeLanguage && parsedData.codeLanguage !== formattingOptions.defaultLanguage) {
          setFormattingOptions(prev => ({
            ...prev,
            defaultLanguage: parsedData.codeLanguage,
          }));
        }
      }
    } catch (error) {
      console.error('Error parsing markdown:', error);
    } finally {
      setIsMarkdownSyncing(false);
    }
  };

  const handleFormatToggle = (enableFormatting: boolean) => {
    setFormattingOptions(prev => ({
      ...prev,
      enableCodeFormatting: enableFormatting
    }));

    const updatedQuestion = synchronizeMarkdownFormatting(
      question,
      enableFormatting,
      formattingOptions.defaultLanguage
    );
    
    const updatedAnswers = answers.map(answer => ({
      ...answer,
      text: synchronizeMarkdownFormatting(
        answer.text,
        enableFormatting,
        formattingOptions.defaultLanguage
      )
    }));

    setQuestion(updatedQuestion);
    setAnswers(updatedAnswers);

    const updatedMarkdown = generateMarkdown(
      {
        id: initialData?.id || uuidv4(),
        question: updatedQuestion,
        answers: updatedAnswers,
        difficulty,
        tags,
        title,
        codeLanguage: formattingOptions.defaultLanguage,
        enableCodeFormatting: enableFormatting,
      },
      enableFormatting,
      formattingOptions.defaultLanguage
    );

    setMarkdownContent(updatedMarkdown);
    lastSyncedMarkdownRef.current = updatedMarkdown;
  };

  const handleFormatText = (formattedText: string, language: 'javascript' | 'html') => {
    const activeElement = document.activeElement as HTMLTextAreaElement;
    const selectionStart = activeElement?.selectionStart || 0;
    const selectionEnd = activeElement?.selectionEnd || 0;
    
    if (activeElement === questionRef.current) {
      const updatedQuestion = 
        question.slice(0, selectionStart) + 
        `\n\`\`\`${language}\n${formattedText}\n\`\`\`\n` + 
        question.slice(selectionEnd);
      setQuestion(updatedQuestion);
    } else {
      const answerIndex = answerRefs.current.findIndex(ref => ref === activeElement);
      if (answerIndex !== -1) {
        const updatedAnswers = [...answers];
        const answer = updatedAnswers[answerIndex];
        updatedAnswers[answerIndex] = {
          ...answer,
          text: 
            answer.text.slice(0, selectionStart) + 
            `\n\`\`\`${language}\n${formattedText}\n\`\`\`\n` + 
            answer.text.slice(selectionEnd)
        };
        setAnswers(updatedAnswers);
      }
    }
  };

  const handleLanguageChange = (newLanguage: 'javascript' | 'html') => {
    setFormattingOptions(prev => ({
      ...prev,
      defaultLanguage: newLanguage
    }));

    if (formattingOptions.enableCodeFormatting) {
      const updatedQuestion = synchronizeMarkdownFormatting(
        question,
        true,
        newLanguage
      );
      
      const updatedAnswers = answers.map(answer => ({
        ...answer,
        text: synchronizeMarkdownFormatting(
          answer.text,
          true,
          newLanguage
        )
      }));

      setQuestion(updatedQuestion);
      setAnswers(updatedAnswers);

      const updatedMarkdown = generateMarkdown(
        {
          id: initialData?.id || uuidv4(),
          question: updatedQuestion,
          answers: updatedAnswers,
          difficulty,
          tags,
          title,
          codeLanguage: newLanguage,
          enableCodeFormatting: true,
        },
        true,
        newLanguage
      );

      setMarkdownContent(updatedMarkdown);
      lastSyncedMarkdownRef.current = updatedMarkdown;
    }
  };

  const randomizeAnswers = () => {
    const newOrder = [...answerOrder];
    for (let i = newOrder.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newOrder[i], newOrder[j]] = [newOrder[j], newOrder[i]];
    }
    setAnswerOrder(newOrder);
    const reorderedAnswers = newOrder.map(id => answers.find(a => a.id === id)!);
    setAnswers(reorderedAnswers);
  };

  const handleSave = () => {
    if (!title.trim()) {
      alert('Please provide a title');
      return;
    }

    const savedData: Question = {
      id: initialData?.id || uuidv4(),
      question,
      answers,
      difficulty,
      tags,
      title,
      type: 'question',
      markdownContent,
      codeLanguage: formattingOptions.defaultLanguage,
      enableCodeFormatting: formattingOptions.enableCodeFormatting
    };

    try {
      const existingQuestions = JSON.parse(localStorage.getItem("questions") || "[]");
      const updatedQuestions = isEditing
        ? existingQuestions.map((q: Question) =>
            q.id === initialData?.id ? savedData : q
          )
        : [...existingQuestions, savedData];

      localStorage.setItem("questions", JSON.stringify(updatedQuestions));
      onSave(savedData);
      alert("Saved successfully!");
    } catch (error) {
      console.error("Error saving:", error);
      alert("Failed to save. Please try again.");
    }
  };

  const handleBack = () => {
    if (question.trim() || answers.some(a => a.text.trim())) {
      const confirm = window.confirm('You have unsaved changes. Are you sure you want to go back?');
      if (!confirm) return;
    }
    onBack();
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
            onChange={(e) => handleFormatToggle(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <span className="text-sm">Enable automatic code formatting</span>
        </label>

        <div className="flex items-center gap-2">
          <span className="text-sm">Default language:</span>
          <select
            value={formattingOptions.defaultLanguage}
            onChange={(e) => handleLanguageChange(e.target.value as 'javascript' | 'html')}
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

  return (
    <div className="w-full max-w-4xl mx-auto p-2 sm:p-4">
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
                  onTagsChange={setTags} files={[]}              />
            </div>

            <TextSelectionFormatter 
              questionRef={questionRef}
              answerRefs={answerRefs}
              onFormat={handleFormatText}
              currentQuestion={{
                question,
                answers,
                difficulty,
                tags,
                title
              }}
              onQuestionChange={setQuestion}
              onAnswerChange={setAnswers}
              formattingOptions={formattingOptions}
              onFormatToggle={handleFormatToggle}
              onLanguageChange={handleLanguageChange}
            />

            <div className="space-y-2">
              <label className="block text-gray-700 text-sm font-bold">
                Question
              </label>
              <textarea
                value={question}
                ref={questionRef}
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
                        id={`answer-${index}`}
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
                      <label 
                        htmlFor={`answer-${index}`}
                        className="text-sm font-medium text-gray-700"
                      >
                        Answer {String.fromCharCode(65 + index)}
                      </label>
                    </div>
                    <textarea
                      ref={(el) => {
                        answerRefs.current[index] = el;
                      }}
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