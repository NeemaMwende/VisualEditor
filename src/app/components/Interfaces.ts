// interfaces.ts

export interface Answer {
    text: string;
    isCorrect: boolean;
  }
  
  export interface Question {
    id: number;
    title: string;
    // difficulty: string;
    tags: string[];
    question: string;
    answers: Answer[];
    // isExpanded?: boolean;
  }
  
  export interface Markdown {
    id: number;
    content: string;
  }
  
  export interface SavedQuestionsListProps {
    questions: Question[];
    markdowns: Markdown[];
    onEditQuestion: (question: Question) => void;
    onEditMarkdown: (markdown: Markdown) => void;
    setQuestions: (questions: Question[]) => void;
    setMarkdowns: (markdowns: Markdown[]) => void;
  }
  
  // SavedQuestionsList  interfaces.ts
export interface Answer {
    id: number;
    text: string;
  }
  
  export interface Question {
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
  
  export interface QuestionData {
    question: string;
    answers: Answer[];
  }
  

  