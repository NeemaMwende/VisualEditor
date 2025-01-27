import React, { useState, useEffect } from 'react';
import { FaUndo } from "react-icons/fa";

interface TextSelectionFormatterProps {
  questionRef: React.RefObject<HTMLTextAreaElement | null>;
  answerRefs: React.RefObject<(HTMLTextAreaElement | null)[]>; 
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
  //onFormatToggle,
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

  const getSelectedText = (): {
    text: string | null;
    type: 'question' | 'answer' | null;
    index?: number;
    fullText?: string;
    selectionStart?: number;
    selectionEnd?: number;
  } => {
    if (questionRef.current) {
      const start = questionRef.current.selectionStart;
      const end = questionRef.current.selectionEnd;
      const selectedText = questionRef.current.value.slice(start, end);
      if (selectedText.trim()) {
        return { 
          text: selectedText, 
          type: 'question',
          fullText: questionRef.current.value,
          selectionStart: start,
          selectionEnd: end 
        };
      }
    }

    if (answerRefs.current) {
      for (let i = 0; i < answerRefs.current.length; i++) {
        const textarea = answerRefs.current[i];
        if (textarea) {
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const selectedText = textarea.value.slice(start, end);
          if (selectedText.trim()) {
            return { 
              text: selectedText, 
              type: 'answer', 
              index: i,
              fullText: textarea.value,
              selectionStart: start,
              selectionEnd: end 
            };
          }
        }
      }
    }

    return { text: null, type: null };
  };

  const handleTextFormat = () => {
    if (!formattingOptions.enableCodeFormatting) {
      alert("Please enable code formatting to add code blocks.");
      return;
    }

    const selectedInfo = getSelectedText();

    if (!selectedInfo.text) {
      alert("Please select some text to format.");
      return;
    }

    setPreviousState({
      question: currentQuestion.question,
      answers: currentQuestion.answers,
    });

    const formatText = (text: string, start: number, end: number, fullText: string) => {
      const formattedContent = `\`\`\`${format}\n${text}\n\`\`\``;
      return fullText.slice(0, start) + formattedContent + fullText.slice(end);
    };

    if (selectedInfo.type === 'question' && selectedInfo.fullText) {
      const updatedQuestion = formatText(
        selectedInfo.text,
        selectedInfo.selectionStart!,
        selectedInfo.selectionEnd!,
        selectedInfo.fullText
      );
      onQuestionChange(updatedQuestion);
    } else if (
      selectedInfo.type === 'answer' &&
      selectedInfo.index !== undefined &&
      selectedInfo.fullText
    ) {
      const updatedAnswers = currentQuestion.answers.map((answer, index) => {
        if (index === selectedInfo.index) {
          return {
            ...answer,
            text: formatText(
              selectedInfo.text!,
              selectedInfo.selectionStart!,
              selectedInfo.selectionEnd!,
              selectedInfo.fullText!
            ),
          };
        }
        return answer;
      });
      onAnswerChange(updatedAnswers);
    }
  };

  // const handleFormatToggle = (enabled: boolean) => {
  //   if (!enabled) {
  //     // Remove code blocks when disabling formatting
  //     const updatedQuestion = removeCodeBlocks(currentQuestion.question);
  //     const updatedAnswers = currentQuestion.answers.map(answer => ({
  //       ...answer,
  //       text: removeCodeBlocks(answer.text)
  //     }));

  //     onQuestionChange(updatedQuestion);
  //     onAnswerChange(updatedAnswers);
  //   } else {
  //     // Restore code blocks with current format when enabling
  //     const updatedQuestion = updateFormatting(currentQuestion.question, format);
  //     const updatedAnswers = currentQuestion.answers.map(answer => ({
  //       ...answer,
  //       text: updateFormatting(answer.text, format)
  //     }));

  //     onQuestionChange(updatedQuestion);
  //     onAnswerChange(updatedAnswers);
  //   }
  //   onFormatToggle(enabled);
  // };

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