import React, { useState } from 'react';
import { FaUndo } from "react-icons/fa";

interface TextSelectionFormatterProps {
  questionRef: React.RefObject<HTMLTextAreaElement | null>;
  answerRefs: React.RefObject<Array<HTMLTextAreaElement>>;
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
}

const TextSelectionFormatter: React.FC<TextSelectionFormatterProps> = ({
  questionRef,
  answerRefs,
  onFormat,
  currentQuestion,
  onQuestionChange,
  onAnswerChange
}) => {
  const [format, setFormat] = useState<'javascript' | 'html'>('javascript');
  const [previousState, setPreviousState] = useState<{
    question: string;
    answers: { id: string; text: string; isCorrect: boolean }[];
  }>({
    question: currentQuestion.question,
    answers: currentQuestion.answers
  });

  const getSelectedText = (): {
    text: string | null;
    type: 'question' | 'answer' | null;
    index?: number;
  } => {
    if (questionRef.current) {
      const start = questionRef.current.selectionStart;
      const end = questionRef.current.selectionEnd;
      const selectedText = questionRef.current.value.slice(start, end);
      if (selectedText.trim()) {
        return { text: selectedText, type: 'question' };
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
            return { text: selectedText, type: 'answer', index: i };
          }
        }
      }
    }

    return { text: null, type: null };
  };

  const handleTextFormat = () => {
    const selectedInfo = getSelectedText();
  
    if (!selectedInfo.text) {
      alert("Please select some text to format.");
      return;
    }
  
    setPreviousState({
      question: currentQuestion.question,
      answers: currentQuestion.answers,
    });
  
    if (selectedInfo.type === 'question' && questionRef.current) {
      const start = questionRef.current.selectionStart;
      const end = questionRef.current.selectionEnd;
  
      const formattedContent = `\`\`\`${format}\n${selectedInfo.text}\n\`\`\``;
  
      const updatedQuestion =
        questionRef.current.value.slice(0, start) +
        selectedInfo.text + 
        ' ' + formattedContent +
        questionRef.current.value.slice(end);
  
      onQuestionChange(updatedQuestion);
      onFormat(selectedInfo.text, format);
    } else if (
      selectedInfo.type === 'answer' &&
      selectedInfo.index !== undefined &&
      answerRefs.current?.[selectedInfo.index]
    ) {
      const textarea = answerRefs.current[selectedInfo.index];
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
  
      const formattedContent = `\`\`\`${format}\n${selectedInfo.text}\n\`\`\``;
  
      const updatedAnswers = currentQuestion.answers.map((answer, index) => {
        if (index === selectedInfo.index) {
          return {
            ...answer,
            text:
              textarea.value.slice(0, start) +
              selectedInfo.text + // Append the original text before formatting
              ' ' + formattedContent +
              textarea.value.slice(end),
          };
        }
        return answer;
      });
  
      onAnswerChange(updatedAnswers);
      onFormat(selectedInfo.text, format);
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
          onChange={(e) => setFormat(e.target.value as 'javascript' | 'html')}
          className="px-3 py-2 border rounded-md text-sm"
        >
          <option value="javascript">JavaScript</option>
          <option value="html">HTML</option>
        </select>
        <button
          onClick={handleTextFormat}
          className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
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
        Select text in the question or answer fields, then click Format Selected Text Button.
      </p>
    </div>
  );
};

export default TextSelectionFormatter;
