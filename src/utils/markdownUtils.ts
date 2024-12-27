
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
  /\.[a-zA-Z]+\((.*)\)/
];

export const detectAndWrapCode = (text: string): string => {
  const isCode = codePatterns.some(pattern => pattern.test(text));
  
  if (isCode) {
    let language = 'javascript';
    if (text.includes('useHash') || text.includes('pushState')) {
      language = 'typescript';
    } else if (text.includes('<') && text.includes('>')) {
      language = 'html';
    }
    return `\`\`\`${language}\n${text}\n\`\`\``;
  }
  
  return text;
};

export const generateMarkdown = (question: BaseQuestion): string => {
  const tagString = question.tags.join(' ');
  let md = '---\n';
  md += `difficulty: ${question.difficulty}\n`;
  md += `tags: ${tagString}\n`;
  md += '---\n\n\n';

  const processedQuestion = detectAndWrapCode(question.question);
  md += `${processedQuestion}\n\n`;

  question.answers.forEach((answer) => {
    const processedAnswer = detectAndWrapCode(answer.text);
    md += `# ${answer.isCorrect ? 'Correct' : ''}\n\n`;
    md += `${processedAnswer}\n\n`;
  });

  return md.trim();
};

export const parseMarkdownContent = (content: string) => {
  const lines = content.split('\n');
  const parsedData = {
    question: '',
    answers: [] as Array<{ id: string; text: string; isCorrect: boolean }>,
    difficulty: 1,
    tags: [] as string[],
    markdownContent: content
  };

  let inFrontMatter = false;
  let currentSection = '';
  let currentAnswer = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line === '---') {
      inFrontMatter = !inFrontMatter;
      continue;
    }

    if (inFrontMatter) {
      if (line.startsWith('difficulty:')) {
        parsedData.difficulty = parseInt(line.split(':')[1].trim());
      } else if (line.startsWith('tags:')) {
        parsedData.tags = line.split(':')[1].trim().split(' ');
      }
    } else {
      if (line.startsWith('#')) {
        if (currentAnswer) {
          parsedData.answers.push({
            id: parsedData.answers.length + 1,
            text: currentAnswer.trim(),
            isCorrect: currentSection === 'correct'
          });
          currentAnswer = '';
        }
        currentSection = line.toLowerCase().includes('correct') ? 'correct' : 'answer';
      } else if (line && !parsedData.question && currentSection !== 'answer') {
        parsedData.question = line + '\n\n';
      } else if (line && currentSection === 'answer' || currentSection === 'correct') {
        currentAnswer += line + '\n';
      }
    }
  }

  if (currentAnswer) {
    parsedData.answers.push({
      id: parsedData.answers.length + 1,
      text: currentAnswer.trim(),
      isCorrect: false
    });
  }

  while (parsedData.answers.length < 4) {
    parsedData.answers.push({
      id: parsedData.answers.length + 1,
      text: '',
      isCorrect: false
    });
  }

  return parsedData;
};

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

export const saveQuestionToLocalStorage = (savedData: BaseQuestion, isEditing: boolean, initialData?: BaseQuestion) => {
  try {
    const existingQuestions = JSON.parse(localStorage.getItem('questions') || '[]');
    const timestamp = new Date().getTime();
    const fileName = `question_${timestamp}.md`;
    
    const questionWithMetadata = {
      ...savedData,
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
    console.error('Error saving to localStorage:', error);
    return false;
  }
};

export interface MarkdownFile {
  id: number;
  title: string;
  content: string;
  isExpanded: boolean;
}

export const updateMarkdownFile = (files: MarkdownFile[], id: number, content: string): MarkdownFile[] => {
  const updatedFiles = files.map(file =>
    file.id === id ? { ...file, content } : file
  );
  saveMarkdownToLocalStorage(updatedFiles);
  return updatedFiles;
};