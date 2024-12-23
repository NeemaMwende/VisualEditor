export interface Answer {
  id: number;
  text: string;
  isCorrect?: boolean; 
}

// Base Question Interface (Shared Fields)
export interface BaseQuestion {
  id: number;
  title: string;
  question: string;
  answers: Answer[];
  difficulty: number;
  tags: string[];
  isExpanded?: boolean;
}

// Question for Editor Component (Full Details)
export interface EditorQuestion extends BaseQuestion {
  initialData?: Answer[]; 
}

// Question for List Component (Simplified)
export interface ListQuestion extends BaseQuestion {
  onEdit: () => void; 
}

// Adjusted QuestionData to Match Both
export interface QuestionData {
  question: string;
  answers: Answer[];
  title?: string;      
  difficulty?: number; 
  tags?: string[];   
  id: number;  
}

// Markdown Interface
export interface Markdown {
  id: number;
  content: string;
}

// export interface MarkdownData {
//   id: number;
//   title: string;
//   content: string;
//   createdAt: string;
//   isExpanded?: boolean;
// }

// Props for SavedQuestionsList Component
export interface SavedQuestionsListProps {
  questions: ListQuestion[]; 
  markdowns: Markdown[];
  onEditQuestion: (question: ListQuestion) => void;
  onEditMarkdown: (markdown: Markdown) => void;
  setQuestions: (questions: ListQuestion[]) => void;
  setMarkdowns: (markdowns: Markdown[]) => void;
}
