"use client";
import React from 'react';
import { Settings } from 'lucide-react';

interface FormattingOptions {
  enableCodeFormatting: boolean;
  defaultLanguage: 'javascript' | 'html';
}

interface Answer {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface CurrentQuestion {
  question: string;
  answers: Answer[];
  difficulty: number;
  tags: string[];
  title: string;
}
interface TextSelectionFormatterProps {
  questionRef: React.RefObject<HTMLDivElement | null>; 
  answerRefs: React.RefObject<(HTMLDivElement | null)[]>;
  onFormat: (formattedText: string, language: 'javascript' | 'html') => void;
  currentQuestion: CurrentQuestion;
  onQuestionChange: (question: string) => void;
  onAnswerChange: (answers: Answer[]) => void;
  formattingOptions: FormattingOptions;
  onFormatToggle: (enableFormatting: boolean) => void;
  onLanguageChange: (language: 'javascript' | 'html') => void;
}

const TextSelectionFormatter: React.FC<TextSelectionFormatterProps> = ({
  onFormat,
  formattingOptions,
  onFormatToggle,
  onLanguageChange
}) => {
  const getSelectedText = (): string => {
    const selection = window.getSelection();
    return selection ? selection.toString() : '';
  };

  const handleFormatButtonClick = () => {
    const selectedText = getSelectedText();
    if (selectedText) {

      onFormat(selectedText, formattingOptions.defaultLanguage);
    }
  };

  return (
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
            onChange={(e) => onFormatToggle(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <span className="text-sm">Enable automatic code formatting</span>
        </label>

        <div className="flex items-center gap-2">
          <span className="text-sm">Default language:</span>
          <select
            value={formattingOptions.defaultLanguage}
            onChange={(e) => onLanguageChange(e.target.value as 'javascript' | 'html')}
            disabled={!formattingOptions.enableCodeFormatting}
            className="text-sm border rounded p-1"
          >
            <option value="javascript">JavaScript</option>
            <option value="html">HTML</option>
          </select>
        </div>
        
        <button
          onClick={handleFormatButtonClick}
          disabled={!formattingOptions.enableCodeFormatting}
          className={`px-3 py-1 text-sm rounded-md ${
            formattingOptions.enableCodeFormatting
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Format Selected Text
        </button>
      </div>
    </div>
  );
};

export default TextSelectionFormatter;