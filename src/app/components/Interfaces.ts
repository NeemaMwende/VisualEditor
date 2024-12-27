export interface Answer {
  id: string;
  text: string;
  isCorrect?: boolean; 
}

// Base Question Interface (Shared Fields)
export interface BaseQuestion {
  id: string;
  title: string;
  question: string;
  answers: Answer[];
  difficulty: number;
  tags: string[];
  isExpanded?: boolean;
  onEditMarkdown?: (markdown: MarkdownData) => void;  
}

export interface DashboardQuestion extends BaseQuestion {
  onEdit?: () => void;
  initialData?: Answer[];
  onEditMarkdown: (markdown: MarkdownData) => void; 
}

// Question for Editor Component
export interface EditorQuestion extends BaseQuestion {
  initialData?: Answer[]; 
  markdownContent?: string;
  isEditing: boolean;
}

// Question for List Component 
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
  id: string;  
}

// Markdown Interface
export interface Markdown {
  id: string;
  content: string;
}


export interface MarkdownEditData{
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface QuestionEditorProps {
  onSave: (data: QuestionData) => Promise<void>;
  onSaveMarkdown: (data: MarkdownData) => void;
  initialData?: QuestionData | MarkdownEditData;
  isEditing: boolean;
}

export interface MarkdownData {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  isExpanded?: boolean;
  type: string;
  isVisible?: boolean;
}

// Props for SavedQuestionsList Component
export interface SavedQuestionsListProps {
  questions: ListQuestion[]; 
  markdowns: Markdown[];
  onEditQuestion: (question: ListQuestion) => void;
  onEditMarkdown: (markdown: Markdown) => void;
  setQuestions: (questions: ListQuestion[]) => void;
  setMarkdowns: (markdowns: Markdown[]) => void;
}
