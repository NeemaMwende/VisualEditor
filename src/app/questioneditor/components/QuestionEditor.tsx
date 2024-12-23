"use client"
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FileText, Folder, ChevronRight, ChevronDown } from 'lucide-react';
import {
  generateMarkdown,
  parseMarkdownContent,
} from '../../../utils/markdownUtils';
import { EditorQuestion, MarkdownData } from '@/app/components/Interfaces';

interface QuestionEditorProps {
  onSave: (data: Question) => void;
  onBack: () => void;
  onEditQuestion?: (data: EditorQuestion) => void;
  initialData?: EditorQuestion;
  isEditing?: boolean;
  setIsEditing?: (value: boolean) => void;
  onSaveMarkdown?: (data: MarkdownData) => void;
}

interface Answer {
  id: number;
  text: string;
  isCorrect: boolean;
}

interface Question {
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

interface FileInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  webkitdirectory?: string;
  directory?: string;
}

const QuestionEditor: React.FC<QuestionEditorProps> = ({
  onSave,
  //onBack,
  initialData,
  isEditing = false,
  //setIsEditing,
  onSaveMarkdown 
}) => {
  const [question, setQuestion] = useState('');
  const [answers, setAnswers] = useState<Answer[]>([
    { id: 1, text: '', isCorrect: false },
    { id: 2, text: '', isCorrect: false },
    { id: 3, text: '', isCorrect: false },
    { id: 4, text: '', isCorrect: false }
  ]);
  const [difficulty, setDifficulty] = useState(1);
  const [tags, setTags] = useState<string[]>([]);
  const [tagsInput, setTagsInput] = useState('');
  const [showMarkdown, setShowMarkdown] = useState(false);
  const [markdownContent, setMarkdownContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<FileData[]>([]);
  const [currentFile, setCurrentFile] = useState<FileData | null>(null);
  const [showFileList, setShowFileList] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // const [currentMarkdown, setCurrentMarkdown] = useState('');
  const [markdowns, setMarkdowns] = useState<MarkdownData[]>([]);
  const [nextMarkdownId, setNextMarkdownId] = useState(1);

  const currentMarkdown = useMemo(() => {
    return generateMarkdown({ 
      question, 
      answers, 
      difficulty, 
      tags, 
      title: initialData?.title || currentFile?.name || '' 
    });
  }, [question, answers, difficulty, tags, initialData?.title, currentFile?.name]);

  useEffect(() => {
    if (isEditing && initialData) {
      setQuestion(initialData.question || '');
      setAnswers(initialData.answers.map(answer => ({
        ...answer,
        isCorrect: answer.isCorrect || false
      })));
      setDifficulty(initialData.difficulty || 1);
      if (initialData.tags) {
        setTags(initialData.tags);
        setTagsInput(initialData.tags.join(', '));
        setMarkdownContent(initialData.markdownContent || '');
      }
    }
  }, [initialData, isEditing]);

  useEffect(() => {
    setMarkdownContent(currentMarkdown);
  }, [currentMarkdown]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const fileList: FileData[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
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
    
    setQuestion(parsedData.question);
    setAnswers(parsedData.answers);
    setDifficulty(parsedData.difficulty);
    setTags(parsedData.tags);
    setTagsInput(parsedData.tags.join(', '));
    setMarkdownContent(file.content);
    setShowMarkdown(true);
  };


  useEffect(() => {
    const savedMarkdowns = localStorage.getItem('markdowns');
    if (savedMarkdowns) {
      const parsedMarkdowns: MarkdownData[] = JSON.parse(savedMarkdowns);
      setMarkdowns(parsedMarkdowns);
      setNextMarkdownId(parsedMarkdowns.length ? 
        Math.max(...parsedMarkdowns.map(m => m.id)) + 1 : 1);
    }
  }, []);

  const promptForMarkdownTitle = async () => {
    const title = window.prompt('Enter a title for the markdown:', 'New Markdown');
    return title || 'Untitled Markdown';
  };

  const handleSaveMarkdown = async () => {
    try {
      if (!currentMarkdown?.trim()) {
        alert('Cannot save empty markdown content');
        return;
      }

      const title = await promptForMarkdownTitle();
      if (!title) return;

      const newMarkdown: MarkdownData = {
        id: nextMarkdownId,
        title,
        content: currentMarkdown,
        createdAt: new Date().toISOString(),
        type: 'markdown',
        isVisible: true 
      };

      const existingMarkdowns = JSON.parse(localStorage.getItem('markdowns') || '[]');
      const existingIndex = existingMarkdowns.findIndex(
        (m: MarkdownData) => m.title === title
      );
  
      let updatedMarkdowns;
      if (existingIndex !== -1) {
        updatedMarkdowns = existingMarkdowns.map((m: MarkdownData, index: number) =>
          index === existingIndex ? newMarkdown : m
        );
      } else {
        updatedMarkdowns = [...existingMarkdowns, newMarkdown];
        setNextMarkdownId(nextMarkdownId + 1);
      }
  
      localStorage.setItem('markdowns', JSON.stringify(updatedMarkdowns));
  
      setMarkdowns(updatedMarkdowns);
      setShowMarkdown(false);
  
      if (onSaveMarkdown) {
        onSaveMarkdown(newMarkdown);
      }
  
      alert('Markdown saved successfully!');
    } catch (error) {
      console.error('Error saving markdown:', error);
      alert('Failed to save markdown. Please try again.');
    }
  };

  useEffect(() => {
    if (markdowns.length > 0) {
      localStorage.setItem('markdowns', JSON.stringify(markdowns));
    }
  }, [markdowns]);

  const loadSavedMarkdowns = () => {
    try {
      const savedMarkdowns = JSON.parse(localStorage.getItem('markdowns') || '[]');
      return savedMarkdowns;
    } catch (error) {
      console.error('Error loading markdowns:', error);
      return [];
    }
  };

  useEffect(() => {
    loadSavedMarkdowns();
  }, []);



  const handleSave = () => {
    let savedData: Question;
    

    if (isEditing && initialData?.title) {
      savedData = {
        question,
        answers,
        difficulty,
        tags,
        title: initialData.title,
        type: 'question',
        markdownContent: currentMarkdown
      };

      try {
        const existingQuestions = JSON.parse(localStorage.getItem('questions') || '[]');
        const updatedQuestions = existingQuestions.map((q: Question) => 
          q.title === initialData.title ? savedData : q
        );
        localStorage.setItem('questions', JSON.stringify(updatedQuestions));
        alert('File edited successfully!');
        onSave(savedData);
      } catch (error) {
        console.error('Error updating question:', error);
        alert('Failed to update question. Please try again.');
      }
    } else {

      savedData = {
        question,
        answers,
        difficulty,
        tags,
        title: currentFile?.name || initialData?.title || '', 
        type: 'question',
        markdownContent: currentMarkdown
      };
      

      try {
        const existingQuestions = JSON.parse(localStorage.getItem('questions') || '[]');
        localStorage.setItem('questions', JSON.stringify([...existingQuestions, savedData]));
        onSave(savedData);
      } catch (error) {
        console.error('Error saving question:', error);
        alert('Failed to save question. Please try again.');
      }
    }
  };

  
  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setTagsInput(input);
    setTags(input.split(',').map(tag => tag.trim()).filter(tag => tag));
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="mb-6">
          <div className="flex gap-4 mb-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              multiple
              {...({ webkitdirectory: "", directory: "" } as FileInputProps)}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 w-full text-white bg-blue-500 rounded-md hover:bg-blue-600 flex items-center gap-2"
            >
              <Folder size={16} />
              Select Folder
            </button>
            {selectedFiles.length > 0 && (
              <button
                onClick={() => setShowFileList(!showFileList)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 flex items-center gap-2"
              >
                {showFileList ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                {selectedFiles.length} Files
              </button>
            )}
          </div>

          {showFileList && selectedFiles.length > 0 && (
            <div className="mb-6 border rounded-md overflow-hidden">
              <div className="bg-gray-50 p-2 font-medium text-gray-700">
                Available Files
              </div>
              <div className="max-h-60 overflow-y-auto">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className={`border-t ${
                      currentFile?.name === file.name ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div
                      onClick={() => handleFileClick(file)}
                      className="p-3 flex items-center gap-2 cursor-pointer hover:bg-gray-50"
                    >
                      <FileText size={16} />
                      <span className="text-sm">{file.path}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {showMarkdown ? (
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Markdown Content
              </label>
              <pre className="w-full p-4 bg-gray-50 rounded-md font-mono text-sm whitespace-pre-wrap break-words">
                {markdownContent}
              </pre>
            </div>
          ) : (
            <>
               <div className="flex flex-col gap-4 m-4">
                <div className="w-full">
                  <select
                    value={difficulty}
                    onChange={e => setDifficulty(parseInt(e.target.value))}
                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={1}>Difficulty Level 1</option>
                    <option value={2}>Difficulty Level 2</option>
                    <option value={3}>Difficulty Level 3</option>
                  </select>
                </div> 

                 <div className="w-full">
                  <input
                    type="text"
                    placeholder="Enter tags here eg advanced-react"
                    value={tagsInput}
                    onChange={handleTagsChange}
                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div> 
               </div>

              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Question
                </label>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {answers.map((answer, index) => (
                  <div key={answer.id} className="relative">
                    <div className="flex items-center mb-2">
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
                      <label className="ml-2 text-sm font-medium text-gray-700">
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
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={() => setShowMarkdown(!showMarkdown)}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            {showMarkdown ? 'Edit Question' : 'View Markdown'}
          </button>
          {showMarkdown && (
            <button
              onClick={handleSaveMarkdown}
              className="px-4 py-2 text-white bg-green-500 rounded-md hover:bg-green-600"
            >
              Save as Markdown
            </button>
          )}
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