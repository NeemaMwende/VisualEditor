import { BaseQuestion } from '../app/components/Interfaces';

export interface MarkdownFile {
  id: number;
  title: string;
  content: string;
  isExpanded: boolean;
}

export interface FileData {
  name: string;
  content: string;
  path: string;
}

export interface MarkdownData {
  id: string;
  title: string;
  content: string;
  fileName: string;
  createdAt: number;
}

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
  /\.[a-zA-Z]+\((.*)\)/,
  /class\s+\w+/,
  /=>\s*{/,
  /return\s+.*[;{]/
];

const detectCodeLanguage = (text: string): string => {
  if (!text || typeof text !== 'string') return 'javascript';
  
  if (text.includes('interface ') || text.includes('type ') || text.includes(': ')) {
    return 'typescript';
  }
  if (text.includes('<') && text.includes('>') && !text.includes('function')) {
    return 'html';
  }
  if (text.includes('def ') || text.includes('import ') && text.includes('from') && !text.includes(';')) {
    return 'python';
  }
  if (text.includes('<?php') || text.includes('->')) {
    return 'php';
  }
  return 'javascript';
};

const wrapCodeForMarkdown = (text: string): string => {
  if (!text || typeof text !== 'string') return '';
  
  const trimmedText = text.trim();
  if (!trimmedText) return '';

  const isCode = codePatterns.some(pattern => pattern.test(trimmedText));
  if (isCode) {
    const language = detectCodeLanguage(trimmedText);
    return `\`\`\`${language}\n${trimmedText}\n\`\`\``;
  }
  return trimmedText;
};

const unwrapCodeForDisplay = (text: string): string => {
  if (!text || typeof text !== 'string') return '';
  
  return text.replace(/```[\w]*\n([\s\S]*?)\n```/g, (_, code) => code.trim());
};

export const generateMarkdown = (question: BaseQuestion): string => {
  if (!question || typeof question !== 'object') return '';

  try {
    const tagString = Array.isArray(question.tags) ? question.tags.join(' ') : '';
    let md = '---\n';
    md += `difficulty: ${question.difficulty || 1}\n`;
    md += `tags: ${tagString}\n`;
    md += '---\n\n\n';
    
    const processedQuestion = question.question ? wrapCodeForMarkdown(question.question) : '';
    md += `${processedQuestion}\n\n`;

    if (Array.isArray(question.answers)) {
      question.answers.forEach((answer) => {
        if (answer && typeof answer === 'object') {
          md += `# ${answer.isCorrect ? 'Correct' : ''}\n\n`;
          const processedAnswer = answer.text ? wrapCodeForMarkdown(answer.text) : '';
          md += `${processedAnswer}\n\n`;
        }
      });
    }

    return md.trim();
  } catch (error) {
    console.error('Error generating markdown:', error);
    return '';
  }
};

export const parseMarkdownContent = (content: string) => {
  if (!content || typeof content !== 'string') {
    return {
      title: '',
      question: '',
      answers: Array(4).fill({ id: '', text: '', isCorrect: false }),
      difficulty: 1,
      tags: [],
      markdownContent: ''
    };
  }

  try {
    const lines = content.split('\n');
    const parsedData = {
      title: '',
      question: '',
      answers: [] as Array<{ id: string; text: string; isCorrect: boolean }>,
      difficulty: 1,
      tags: [] as string[],
      markdownContent: content
    };

    let inFrontMatter = false;
    let inCodeBlock = false;
    let currentSection = '';
    let currentAnswer = '';
    let codeBlockContent = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // Handle front matter
      if (trimmedLine === '---') {
        inFrontMatter = !inFrontMatter;
        continue;
      }

      // Process front matter content
      if (inFrontMatter) {
        if (trimmedLine.startsWith('difficulty:')) {
          const difficultyValue = parseInt(trimmedLine.substring(11).trim());
          parsedData.difficulty = isNaN(difficultyValue) ? 1 : difficultyValue;
        } else if (trimmedLine.startsWith('tags:')) {
          parsedData.tags = trimmedLine.substring(5).trim().split(' ').filter(Boolean);
        }
        continue;
      }

      // Handle code blocks
      if (trimmedLine.startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          continue;
        } else {
          inCodeBlock = false;
          if (currentSection === '') {
            parsedData.question += codeBlockContent.trim();
          } else {
            currentAnswer += codeBlockContent.trim();
          }
          codeBlockContent = '';
          continue;
        }
      }

      // Collect code block content
      if (inCodeBlock) {
        codeBlockContent += line + '\n';
        continue;
      }

      // Handle section headers
      if (trimmedLine.startsWith('#')) {
        if (currentAnswer) {
          parsedData.answers.push({
            id: (parsedData.answers.length + 1).toString(),
            text: unwrapCodeForDisplay(currentAnswer.trim()),
            isCorrect: currentSection.includes('correct')
          });
          currentAnswer = '';
        }
        currentSection = trimmedLine.toLowerCase();
        continue;
      }

      // Handle regular content
      if (trimmedLine) {
        if (currentSection === '') {
          if (!parsedData.question) {
            parsedData.question = trimmedLine;
          } else {
            parsedData.question += '\n\n' + trimmedLine;
          }
        } else {
          currentAnswer += trimmedLine + '\n';
        }
      }
    }

    if (currentAnswer) {
      parsedData.answers.push({
        id: (parsedData.answers.length + 1).toString(),
        text: unwrapCodeForDisplay(currentAnswer.trim()),
        isCorrect: currentSection.includes('correct')
      });
    }

    // Ensure exactly 4 answers
    while (parsedData.answers.length < 4) {
      parsedData.answers.push({
        id: (parsedData.answers.length + 1).toString(),
        text: '',
        isCorrect: false
      });
    }

    parsedData.question = unwrapCodeForDisplay(parsedData.question.trim());
    parsedData.answers = parsedData.answers.map(answer => ({
      ...answer,
      text: unwrapCodeForDisplay(answer.text.trim())
    }));

    return parsedData;
  } catch (error) {
    console.error('Error parsing markdown:', error);
    return {
      title: '',
      question: '',
      answers: Array(4).fill({ id: '', text: '', isCorrect: false }),
      difficulty: 1,
      tags: [],
      markdownContent: content
    };
  }
};

export const saveMarkdownToLocalStorage = (markdownFiles: MarkdownFile[]): void => {
  try {
    localStorage.setItem('markdownFiles', JSON.stringify(markdownFiles));
  } catch (error) {
    console.error('Error saving markdown files to localStorage:', error);
  }
};

export const getMarkdownFromLocalStorage = (): MarkdownFile[] => {
  try {
    const stored = localStorage.getItem('markdownFiles');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error retrieving markdown files from localStorage:', error);
    return [];
  }
};

export const addNewMarkdownFile = (
  markdownFiles: MarkdownFile[],
  content: string,
  title: string
): MarkdownFile[] => {
  if (!content || !title) return markdownFiles;

  try {
    const newFile: MarkdownFile = {
      id: Date.now(),
      title: title.trim(),
      content: content.trim(),
      isExpanded: false
    };
    const updatedFiles = [...markdownFiles, newFile];
    saveMarkdownToLocalStorage(updatedFiles);
    return updatedFiles;
  } catch (error) {
    console.error('Error adding new markdown file:', error);
    return markdownFiles;
  }
};

export const deleteMarkdownFile = (
  markdownFiles: MarkdownFile[],
  id: string
): MarkdownFile[] => {
  if (!id) return markdownFiles;

  try {
    const updatedFiles = markdownFiles.filter(m => m.id.toString() !== id);
    saveMarkdownToLocalStorage(updatedFiles);
    return updatedFiles;
  } catch (error) {
    console.error('Error deleting markdown file:', error);
    return markdownFiles;
  }
};

export const toggleMarkdownExpand = (
  markdownFiles: MarkdownFile[],
  id: string
): MarkdownFile[] => {
  if (!id) return markdownFiles;

  try {
    const updatedFiles = markdownFiles.map(m =>
      m.id.toString() === id ? { ...m, isExpanded: !m.isExpanded } : m
    );
    saveMarkdownToLocalStorage(updatedFiles);
    return updatedFiles;
  } catch (error) {
    console.error('Error toggling markdown expansion:', error);
    return markdownFiles;
  }
};

export const updateMarkdownFile = (
  files: MarkdownFile[],
  id: string,
  content: string
): MarkdownFile[] => {
  if (!id || !content) return files;

  try {
    const updatedFiles = files.map(file =>
      file.id.toString() === id ? { ...file, content: content.trim() } : file
    );
    saveMarkdownToLocalStorage(updatedFiles);
    return updatedFiles;
  } catch (error) {
    console.error('Error updating markdown file:', error);
    return files;
  }
};

export const saveQuestionToLocalStorage = (
  question: BaseQuestion,
  isEditing: boolean = false,
  initialData?: BaseQuestion
): boolean => {
  try {
    const existingQuestions = JSON.parse(localStorage.getItem('questions') || '[]');
    const timestamp = Date.now();
    const fileName = `question_${timestamp}.md`;
    
    const questionWithMetadata = {
      ...question,
      fileName,
      createdAt: timestamp,
      type: 'markdown'
    };

    if (isEditing && initialData?.title) {
      const updatedQuestions = existingQuestions.map((q: BaseQuestion) => 
        q.title === initialData.title ? questionWithMetadata : q
      );
      localStorage.setItem('questions', JSON.stringify(updatedQuestions));
    } else {
      localStorage.setItem('questions', JSON.stringify([...existingQuestions, questionWithMetadata]));
    }
    
    return true;
  } catch (error) {
    console.error('Error saving question to localStorage:', error);
    return false;
  }
};