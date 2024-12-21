import { Question } from '../app/components/Interfaces';

export interface MarkdownFile {
  id: number;
  title: string;
  content: string;
  isExpanded: boolean;
}

export const generateMarkdown = (question: Question): string => {
  // Format tags as comma-separated string
  const tagString = question.tags.join(', ');
  
  // Build markdown content
  let markdown = `---\ndifficulty: ${question.difficulty}\ntags: ${tagString}\n---\n\n`;
  
  // Add question
  markdown += `${question.question}\n\n`;
  
  // Add answers
  question.answers.forEach((answer, index) => {
    const prefix = answer.isCorrect ? '# Correct' : '#';
    const answerText = answer.text;
    
    // Check if the answer contains code
    if (answerText.includes('```')) {
      markdown += `${prefix}\n${answerText}\n\n`;
    } else {
      markdown += `${prefix}\n${answerText}\n\n`;
    }
  });
  
  return markdown.trim();
};

// Local storage functions
export const saveMarkdownToLocalStorage = (markdownFiles: MarkdownFile[]) => {
  localStorage.setItem('markdownFiles', JSON.stringify(markdownFiles));
};

export const getMarkdownFromLocalStorage = (): MarkdownFile[] => {
  const stored = localStorage.getItem('markdownFiles');
  return stored ? JSON.parse(stored) : [];
};

export const addNewMarkdownFile = (
  markdownFiles: MarkdownFile[],
  content: string,
  title: string
): MarkdownFile[] => {
  const newFile: MarkdownFile = {
    id: Date.now(),
    title,
    content,
    isExpanded: false
  };
  const updatedFiles = [...markdownFiles, newFile];
  saveMarkdownToLocalStorage(updatedFiles);
  return updatedFiles;
};

export const deleteMarkdownFile = (
  markdownFiles: MarkdownFile[],
  id: number
): MarkdownFile[] => {
  const updatedFiles = markdownFiles.filter(m => m.id !== id);
  saveMarkdownToLocalStorage(updatedFiles);
  return updatedFiles;
};

export const toggleMarkdownExpand = (
  markdownFiles: MarkdownFile[],
  id: number
): MarkdownFile[] => {
  const updatedFiles = markdownFiles.map(m =>
    m.id === id ? { ...m, isExpanded: !m.isExpanded } : m
  );
  saveMarkdownToLocalStorage(updatedFiles);
  return updatedFiles;
};