export interface Answer {
  id: string;
  text: string;
  isCorrect: boolean;
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

export interface BaseQuestion {
  id?: string;
  title: string;
  question: string;
  answers: Answer[];
  difficulty: number;
  tags: string[];
  isExpanded?: boolean;
  onEditMarkdown?: (markdown: MarkdownData) => void;
  codeLanguage?: 'javascript' | 'html';
  markdownContent?: string;
  enableCodeFormatting?: boolean;
}

export interface QuestionData extends BaseQuestion {
  type?: 'question' | 'markdown';
  id: string;
}

export interface DashboardQuestion extends BaseQuestion {
  onEdit?: () => void;
  initialData?: Answer[];
  type?: 'question' | 'markdown';
  enableCodeFormatting?: boolean;
  codeLanguage?: 'javascript' | 'html';
  id: string;
}

export interface DashboardQuestion {
  id: string;
  title: string;
  question: string;
  answers: Answer[];
  difficulty: number;
  tags: string[];
  isExpanded?: boolean;
  onEditMarkdown?: (markdown: MarkdownData) => void;
  codeLanguage?: 'javascript' | 'html';
  markdownContent?: string;
  enableCodeFormatting?: boolean; 
}


export interface EditorQuestion extends BaseQuestion {
  initialData?: Answer[];
  isEditing: boolean;
}

export interface ListQuestion extends BaseQuestion {
  onEdit: () => void;
}

export interface Markdown {
  id: string;
  content: string;
}

export interface MarkdownEditData {
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
  onBack: () => void;
}

export interface SavedQuestionsListProps {
  questions: ListQuestion[];
  markdowns: Markdown[];
  onEditQuestion: (question: ListQuestion) => void;
  onEditMarkdown: (markdown: Markdown) => void;
  setQuestions: (questions: ListQuestion[]) => void;
  setMarkdowns: (markdowns: Markdown[]) => void;
}