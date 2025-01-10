"use client"
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FileText, Folder, ChevronRight, ChevronDown, ArrowLeft, Shuffle } from 'lucide-react';
import { generateMarkdown, parseMarkdownContent } from '../../../utils/markdownUtils';
import { EditorQuestion, MarkdownData } from '@/app/components/Interfaces';
import { v4 as uuidv4 } from 'uuid';
import TagSelector from './TagSelector';

interface QuestionEditorProps {
  onSave: (data: Question) => void;
  onBack: () => void;
  onEditQuestion?: (data: EditorQuestion) => void;
  initialData?: EditorQuestion | Question;
  isEditing?: boolean;
  setIsEditing?: (value: boolean) => void;
  onSaveMarkdown?: (data: MarkdownData) => void;
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
}

interface FileData {
  name: string;
  content: string;
  path: string;
}

interface FileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  webkitdirectory?: string;
  directory?: string;
}

interface MarkdownFile {
  id: string;
  title: string;
  content: string;
  isExpanded: boolean;
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
  const [selectedFiles, setSelectedFiles] = useState<FileData[]>([]);
  const [currentFile, setCurrentFile] = useState<FileData | null>(null);
  const [showFileList, setShowFileList] = useState(false);
  const [title, setTitle] = useState(initialData?.title || '');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [markdowns, setMarkdowns] = useState<MarkdownData[]>([]);

  const randomizeAnswers = () => {
    setAnswers(prevAnswers => {
      const shuffledAnswers = [...prevAnswers];
      for (let i = shuffledAnswers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledAnswers[i], shuffledAnswers[j]] = [shuffledAnswers[j], shuffledAnswers[i]];
      }
      return shuffledAnswers;
    });
  };

  const currentMarkdown = useMemo(() => {
    return generateMarkdown({
      id: String(initialData?.id || Date.now()),
      question,
      answers,
      difficulty,
      tags,
      title: title || currentFile?.name || ''
    });
  }, [question, answers, difficulty, tags, title, currentFile?.name, initialData?.id]);

  useEffect(() => {
    if (isEditing && initialData) {
      setQuestion(initialData.question || '');
      setAnswers(
        (initialData.answers || []).map((answer) => ({
          id: answer.id || uuidv4(),
          text: answer.text || "",
          isCorrect: !!answer.isCorrect,
        }))
      );
      setDifficulty(initialData.difficulty || 1);
      setTitle(initialData.title || '');
      if (initialData.tags) {
        setTags(initialData.tags);
      }
      setMarkdownContent(initialData.markdownContent || '');
    }
  }, [initialData, isEditing]);

  useEffect(() => {
    setMarkdownContent(currentMarkdown);
  }, [currentMarkdown]);

  // New effect to sync markdown changes with question state
  useEffect(() => {
    if (showMarkdown) {
      try {
        const parsedData = parseMarkdownContent(markdownContent);
        if (parsedData) {
          setQuestion(parsedData.question.trim());
          if (parsedData.answers.length > 0) {
            const updatedAnswers = answers.map((existingAnswer, index) => ({
              id: existingAnswer.id,
              text: parsedData.answers[index]?.text || '',
              isCorrect: parsedData.answers[index]?.isCorrect || false
            }));
            setAnswers(updatedAnswers);
          }
          setDifficulty(parsedData.difficulty);
          setTags(parsedData.tags);
        }
      } catch (error) {
        console.error('Error parsing markdown:', error);
      }
    }
  }, [markdownContent, showMarkdown]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const fileList: FileData[] = [];
    for (const file of files) {
      if (file.name.endsWith('.md')) {
        const content = await file.text();
        fileList.push({
          name: file.name,
          content,
          path: file.webkitRelativePath || file.name
        });
      }
    }
    setSelectedFiles(fileList);
    setShowFileList(true);
  };

  const handleFileClick = (file: FileData) => {
    setCurrentFile(file);
    const parsedData = parseMarkdownContent(file.content);
    const fileTitle = file.name.replace(/\.[^/.]+$/, '')
      .split(/[-_\s]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

    setTitle(fileTitle);
    setQuestion(parsedData.question);
    setAnswers(parsedData.answers);
    setDifficulty(parsedData.difficulty);
    setTags(parsedData.tags);
    setMarkdownContent(file.content);
    setShowMarkdown(true);
  };

  const handleMarkdownUpdate = (newContent: string) => {
    setMarkdownContent(newContent);
    const parsedData = parseMarkdownContent(newContent);
    if (parsedData) {
      setQuestion(parsedData.question);
      setAnswers(parsedData.answers);
      setDifficulty(parsedData.difficulty);
      setTags(parsedData.tags);
    }
  };

  const handleSaveMarkdown = async () => {
    try {
      if (!currentMarkdown?.trim()) {
        alert('Cannot save empty markdown content');
        return;
      }

      if (!title.trim() && currentFile?.name) {
        const fileTitle = currentFile.name.replace(/\.[^/.]+$/, '')
          .split(/[-_\s]/)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
        setTitle(fileTitle);
      }

      if (!title.trim()) {
        alert('Please provide a title');
        return;
      }

      const newMarkdownFile: MarkdownFile = {
        id: uuidv4(),
        title,
        content: currentMarkdown,
        isExpanded: false
      };

      const existingFiles: MarkdownFile[] = JSON.parse(localStorage.getItem('markdownFiles') || '[]');
      const existingIndex = existingFiles.findIndex(f => f.title === title);
      let updatedFiles;

      if (existingIndex !== -1) {
        updatedFiles = existingFiles.map((f, index) =>
          index === existingIndex ? { ...newMarkdownFile, id: f.id } : f
        );
      } else {
        updatedFiles = [...existingFiles, newMarkdownFile];
      }

      localStorage.setItem('markdownFiles', JSON.stringify(updatedFiles));

      const newMarkdown: MarkdownData = {
        id: newMarkdownFile.id,
        title,
        content: currentMarkdown,
        createdAt: new Date().toISOString(),
        type: 'markdown',
        isVisible: true,
        isExpanded: false
      };

      const existingMarkdowns = JSON.parse(localStorage.getItem('markdowns') || '[]');
      localStorage.setItem('markdowns', JSON.stringify([...existingMarkdowns, newMarkdown]));

      alert('Saved successfully!');

      if (!isEditing) {
        resetEditor();
      }

      onBack();
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save. Please try again.');
    }
  };

  const resetEditor = () => {
    setQuestion('');
    setAnswers([
      { id: uuidv4(), text: '', isCorrect: false },
      { id: uuidv4(), text: '', isCorrect: false },
      { id: uuidv4(), text: '', isCorrect: false },
      { id: uuidv4(), text: '', isCorrect: false }
    ]);
    setDifficulty(1);
    setTags([]);
    setMarkdownContent('');
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

    const savedData: Question = {
      id: initialData?.id || uuidv4(),
      question,
      answers,
      difficulty,
      tags,
      title,
      type: 'question',
      markdownContent: currentMarkdown
    };

    try {
      const existingQuestions = JSON.parse(localStorage.getItem("questions") || "[]");

      if (isEditing) {
        const updatedQuestions = existingQuestions.map((q: Question) =>
          q.id === initialData?.id ? savedData : q
        );
        localStorage.setItem("questions", JSON.stringify(updatedQuestions));
      } else {
        localStorage.setItem("questions", JSON.stringify([...existingQuestions, savedData]));
      }

      alert("Saved successfully!");
      onSave(savedData);
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

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="mb-4">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Questions
        </button>
      </div>

      <div className="bg-white shadow-sm form-content p-6 rounded-lg space-y-6">
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
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block text-gray-700 text-sm font-bold">
                Title
              </label>
              <input
                type="text"
                placeholder="Enter question title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full p-3 border rounded-md appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
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
                className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Enter your question here"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="block text-gray-700 text-sm font-bold">
                  Answers
                </label>
                <button
                  onClick={randomizeAnswers}
                  className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  <Shuffle size={16} />
                  Randomize Answers
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                      placeholder={`Enter answer ${String.fromCharCode(65 + index)}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-6 border-t">
          <button
            onClick={handleBack}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={() => setShowMarkdown(!showMarkdown)}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            {showMarkdown ? 'Edit Question' : 'View Markdown'}
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600"
          >
            {isEditing ? 'Save Changes' : 'Save Question'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionEditor;