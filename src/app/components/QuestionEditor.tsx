
import React, { useState, useEffect, useRef } from 'react';
import { FileText, Folder, ChevronRight, ChevronDown, ArrowLeft } from 'lucide-react';
// import { useRouter } from 'next/router';

interface QuestionEditorProps {
  onSave: (data: Question) => void;
  onBack: () => void;
  onEditQuestion?: (data: Question) => void;
  initialData?: Question;
  isEditing?: boolean;
}

interface Answer {
  id: number;
  text: string;
  isCorrect: boolean;
}

interface FileData {
  name: string;
  content: string;
  path: string;
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

const QuestionEditor: React.FC<QuestionEditorProps> = ({
  onSave,
  // onBack,
  //onEditQuestion,
  initialData,
  isEditing = false
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

  const codePatterns = [
    /\b(const|let|var|function)\b.*[=;]/,
    /{[\s\S]*}/,
    /\b(useHash|pushState|useHTML5):/,
    /<[^>]+>/,
    /\b(new \w+)\b/,
    /\b\w+\((.*)\)/,
    /import .* from/,
    /export .*/,
    /async|await/,
    /\.[a-zA-Z]+\((.*)\)/
  ];

  const detectAndWrapCode = (text: string): string => {
    const isCode = codePatterns.some(pattern => pattern.test(text));
    
    if (isCode) {
      let language = 'javascript';
      if (text.includes('useHash') || text.includes('pushState')) {
        language = 'typescript';
      } else if (text.includes('<') && text.includes('>')) {
        language = 'html';
      }
      return `\`\`\`${language}\n${text}\n\`\`\``;
    }
    
    return text;
  };

  useEffect(() => {
    if (initialData) {
      setQuestion(initialData.question || '');
      setAnswers(initialData.answers.map(answer => ({
        ...answer,
        isCorrect: answer.isCorrect || false
      })));
      setDifficulty(initialData.difficulty || 1);
      if (initialData.tags) {
        setTags(initialData.tags);
        setTagsInput(initialData.tags.join(', '));
      }
    }
  }, [initialData]);

  const parseMarkdownContent = (content: string) => {
    const lines = content.split('\n');
    const parsedData = {
      question: '',
      answers: [] as Answer[],
      difficulty: 1,
      tags: [] as string[],
      markdownContent: content
    };

    let inFrontMatter = false;
    let currentSection = '';
    let currentAnswer = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line === '---') {
        inFrontMatter = !inFrontMatter;
        continue;
      }

      if (inFrontMatter) {
        if (line.startsWith('difficulty:')) {
          parsedData.difficulty = parseInt(line.split(':')[1].trim());
        } else if (line.startsWith('tags:')) {
          parsedData.tags = line.split(':')[1].trim().split(' ');
        }
      } else {
        if (line.startsWith('#')) {
          if (currentAnswer) {
            parsedData.answers.push({
              id: parsedData.answers.length + 1,
              text: currentAnswer.trim(),
              isCorrect: line.toLowerCase().includes('correct')
            });
            currentAnswer = '';
          }
          currentSection = 'answer';
        } else if (line && !parsedData.question && currentSection !== 'answer') {
          parsedData.question = line;
        } else if (line && currentSection === 'answer') {
          currentAnswer += line + '\n';
        }
      }
    }

    if (currentAnswer) {
      parsedData.answers.push({
        id: parsedData.answers.length + 1,
        text: currentAnswer.trim(),
        isCorrect: false
      });
    }

    while (parsedData.answers.length < 4) {
      parsedData.answers.push({
        id: parsedData.answers.length + 1,
        text: '',
        isCorrect: false
      });
    }

    return parsedData;
  };

  const generateMarkdown = () => {
    let md = '---\n';
    md += `difficulty: ${difficulty}\n`;
    md += `tags: ${tags.join(' ')}\n`;
    md += '---\n\n';

    const processedQuestion = detectAndWrapCode(question);
    md += `${processedQuestion}\n\n`;

    answers.forEach((answer) => {
      const processedAnswer = detectAndWrapCode(answer.text);
      md += `# ${answer.isCorrect ? 'Correct' : ''}\n`;
      md += `${processedAnswer}\n\n`;
    });

    return md.trim();
  };

  const saveToLocalStorage = (savedData: Question) => {
    try {
      const existingQuestions = JSON.parse(localStorage.getItem('questions') || '[]');
      const timestamp = new Date().getTime();
      const fileName = `question_${timestamp}.md`;
      
      const questionWithMetadata = {
        ...savedData,
        fileName,
        createdAt: timestamp,
        type: 'markdown'
      };

      if (isEditing && initialData?.title) {
        const updatedQuestions = existingQuestions.map((q: Question) => 
          q.title === initialData.title ? questionWithMetadata : q
        );
        localStorage.setItem('questions', JSON.stringify(updatedQuestions));
      } else {
        localStorage.setItem('questions', JSON.stringify([...existingQuestions, questionWithMetadata]));
      }
      
      return true;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      return false;
    }
  };

  const handleSaveMarkdown = () => {
    const markdown = generateMarkdown();
    const title = currentFile?.name || `Question_${new Date().getTime()}`;
    
    const savedData: Question = {
      title,
      markdownContent: markdown,
      type: 'markdown',
      question,
      answers,
      difficulty,
      tags
    };

    if (saveToLocalStorage(savedData)) {
      alert('Markdown saved successfully!');
      onSave(savedData);
    } else {
      alert('Failed to save markdown. Please try again.');
    }
  };

  useEffect(() => {
    const markdown = generateMarkdown();
    setMarkdownContent(markdown);
  }, [question, answers, difficulty, tags]);

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

  const handleSave = () => {
    const title = isEditing 
      ? initialData?.title || 'Untitled Question'
      : prompt('Enter a title for the question:', 'New Question') || 'Untitled Question';

    const savedData: Question = {
      question,
      answers,
      difficulty,
      tags,
      title,
      type: 'question',
      markdownContent: generateMarkdown()
    };

    try {
      const existingQuestions = JSON.parse(localStorage.getItem('questions') || '[]');
      if (isEditing && initialData?.title) {
        const updatedQuestions = existingQuestions.map((q: Question) => 
          q.title === initialData.title ? savedData : q
        );
        localStorage.setItem('questions', JSON.stringify(updatedQuestions));
      } else {
        localStorage.setItem('questions', JSON.stringify([...existingQuestions, savedData]));
      }

      onSave(savedData);
    } catch (error) {
      console.error('Error saving question:', error);
      alert('Failed to save question. Please try again.');
    }
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setTagsInput(input);
    setTags(input.split(',').map(tag => tag.trim()).filter(tag => tag));
  };

  const handleBackClick = () => {
    console.log("this is a placeholder")
  }
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="mb-4">
          <button
            onClick={handleBackClick}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
        </div>

        <div className="mb-6">
          <div className="flex gap-4 mb-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              webkitdirectory=""
              directory=""
              multiple
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
              <pre className="w-full p-4 bg-gray-50 rounded-md font-mono text-sm whitespace-pre-wrap">
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
                    <option value="" disabled>Select difficulty level</option>
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                  </select>
                </div>

                <div className="w-full">
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={handleTagsChange}
                    placeholder="Enter tag eg intermediate-angular-routing"
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
                  placeholder="Type your question here..."
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
                      placeholder={`Type answer ${String.fromCharCode(65 + index)} here...`}
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
              Save Markdown
            </button>
          )}
          {!showMarkdown && (
            <button
              onClick={handleSave}
              className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600"
            >
              {isEditing ? 'Save Changes' : 'Save Question'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionEditor;