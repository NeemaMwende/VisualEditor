import React, { useState, useEffect } from 'react';
import { FaUndo } from "react-icons/fa";

interface TextSelectionFormatterProps {
  questionRef: React.RefObject<HTMLDivElement | null>; 
  answerRefs: React.RefObject<(HTMLDivElement | null)[]>;
  onFormat: (formattedText: string, language: 'javascript' | 'html') => void;
  currentQuestion: {
    question: string;
    answers: { id: string; text: string; isCorrect: boolean }[];
    difficulty: number;
    tags: string[];
    title: string;
  };
  onQuestionChange: (newQuestion: string) => void;
  onAnswerChange: (answers: { id: string; text: string; isCorrect: boolean }[]) => void;
  formattingOptions: {
    enableCodeFormatting: boolean;
    defaultLanguage: 'javascript' | 'html';
  };
  onFormatToggle: (enabled: boolean) => void;
  onLanguageChange: (language: 'javascript' | 'html') => void;
}

const TextSelectionFormatter: React.FC<TextSelectionFormatterProps> = ({
  questionRef,
  answerRefs,
  //onFormat,
  currentQuestion,
  onQuestionChange,
  onAnswerChange,
  formattingOptions,
 // onFormatToggle,
  onLanguageChange
}) => {
  const [format, setFormat] = useState<'javascript' | 'html'>(formattingOptions.defaultLanguage);
  const [previousState, setPreviousState] = useState<{
    question: string;
    answers: { id: string; text: string; isCorrect: boolean }[];
  }>({
    question: currentQuestion.question,
    answers: currentQuestion.answers
  });

  useEffect(() => {
    setFormat(formattingOptions.defaultLanguage);
  }, [formattingOptions.defaultLanguage]);

  const updateFormatting = (text: string, newFormat: 'javascript' | 'html'): string => {
    return text.replace(/```(javascript|html)?\n([\s\S]*?)\n```/g, 
      (_, __, code) => `\`\`\`${newFormat}\n${code}\n\`\`\``
    );
  };

  const handleTextFormat = () => {
    if (!formattingOptions.enableCodeFormatting) {
      return;
    }
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.toString().trim() === '') {
      return;
    }

    setPreviousState({
      question: currentQuestion.question,
      answers: [...currentQuestion.answers],
    });

    const selectedText = selection.toString().trim();
    const formattedCode = `\`\`\`${format}\n${selectedText}\n\`\`\``;

    let isQuestionSelected = false;
    let selectedAnswerIndex = -1;

    // Check if selection is in question editor
    if (questionRef.current && questionRef.current.contains(selection.anchorNode)) {
      isQuestionSelected = true;
    } else {
      answerRefs.current?.forEach((answerRef, index) => {
        if (answerRef && answerRef.contains(selection.anchorNode)) {
          selectedAnswerIndex = index;
        }
      });
    }

    if (isQuestionSelected) {

      const updatedQuestion = replaceSelectedInText(currentQuestion.question, selectedText, formattedCode);
      onQuestionChange(updatedQuestion);
    } else if (selectedAnswerIndex !== -1) {
      const updatedAnswers = [...currentQuestion.answers];
      const answerText = updatedAnswers[selectedAnswerIndex].text;
      updatedAnswers[selectedAnswerIndex] = {
        ...updatedAnswers[selectedAnswerIndex],
        text: replaceSelectedInText(answerText, selectedText, formattedCode)
      };
      onAnswerChange(updatedAnswers);
    }
  };

  // Helper function to replace text while preserving the rest of the content
  const replaceSelectedInText = (text: string, selectedText: string, replacement: string): string => {
    if (!text.includes(selectedText)) {
      return text + '\n' + replacement; 
    }
    
    const before = text.substring(0, text.indexOf(selectedText));
    const after = text.substring(text.indexOf(selectedText) + selectedText.length);
    return before + replacement + after;
  };

  const handleLanguageChange = (newFormat: 'javascript' | 'html') => {
    setFormat(newFormat);
    onLanguageChange(newFormat);

    if (formattingOptions.enableCodeFormatting) {
      const updatedQuestion = updateFormatting(currentQuestion.question, newFormat);
      const updatedAnswers = currentQuestion.answers.map(answer => ({
        ...answer,
        text: updateFormatting(answer.text, newFormat)
      }));

      onQuestionChange(updatedQuestion);
      onAnswerChange(updatedAnswers);
    }
  };

  const handleUndo = () => {
    onQuestionChange(previousState.question);
    onAnswerChange(previousState.answers);
  };

  return (
    <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
      <div className="flex items-center gap-4 mb-2">
        <select
          value={format}
          onChange={(e) => handleLanguageChange(e.target.value as 'javascript' | 'html')}
          className="px-3 py-2 border rounded-md text-sm"
          disabled={!formattingOptions.enableCodeFormatting}
        >
          <option value="javascript">JavaScript</option>
          <option value="html">HTML</option>
        </select>
        <button
          onClick={handleTextFormat}
          className={`px-4 py-2 ${
            formattingOptions.enableCodeFormatting 
            ? 'bg-blue-500 text-white hover:bg-blue-600' 
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          } rounded-md text-sm transition-colors`}
          disabled={!formattingOptions.enableCodeFormatting}
        >
          Format Selected Text
        </button>
        <button
          onClick={handleUndo}
          className="text-gray-600 hover:text-gray-800"
          title="Undo last change"
        >
          <FaUndo />
        </button>
      </div>
      <p className="text-xs text-gray-600">
        {formattingOptions.enableCodeFormatting 
          ? "Select text in the question or answer fields, then click Format Selected Text"
          : "Enable code formatting to add code blocks"}
      </p>
    </div>
  );
};

export default TextSelectionFormatter;