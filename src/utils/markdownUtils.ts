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

export interface FormattingOptions {
  enableCodeFormatting: boolean;
  defaultLanguage: 'javascript' | 'html';
}

const isCodeBlock = (text: string): { isCode: boolean; language: 'javascript' | 'html' | '' } => {
  const jsPatterns = [
    /\b(const|let|var|function)\s+\w+/,
    /\bclass\s+\w+/,
    /\b(import|export)\b/,
    /=>\s*{|\(\)\s*=>/,
    /\b(if|for|while|switch|return)\b/,
    /\b(try|catch|finally)\b/,
    /\b(async|await)\b/,
    /\.\w+\(/,
    /new\s+\w+/
  ];

  const htmlPatterns = [
    /<[a-zA-Z][^>]*>/,
    /<\/[a-zA-Z][^>]*>/,
    /<[^>]+\/>/,
    /<!DOCTYPE/i,
    /<(div|span|p|a|button|input|form|label)/i
  ];

  if (text.includes('```')) return { isCode: true, language: '' };

  const jsMatches = jsPatterns.filter(pattern => pattern.test(text)).length;
  const htmlMatches = htmlPatterns.filter(pattern => pattern.test(text)).length;

  if (jsMatches > 0 && jsMatches >= htmlMatches) return { isCode: true, language: 'javascript' };
  if (htmlMatches > 0) return { isCode: true, language: 'html' };
  return { isCode: false, language: '' };
};

// const formatCodeBlock = (code: string, language: string): string => {
//   if (!code.trim()) return code;

//   code = code.replace(/```[\w-]*\n|```$/g, '');
  
//   const lines = code.split('\n').map(line => line.trim()).filter(Boolean);
//   let formattedCode = lines.join('\n');

//   if (!formattedCode.startsWith('```')) {
//     formattedCode = `\`\`\`${language}\n${formattedCode}\n\`\`\``;
//   }

//   return formattedCode;
// };
export const generateMarkdown = (
  question: BaseQuestion,
  enableFormatting: boolean = true,
  defaultLanguage: 'javascript' | 'html' = 'javascript'
): string => {
  if (!question || typeof question !== 'object') return '';

  try {
    const tagString = Array.isArray(question.tags) ? question.tags.join(' ') : '';
    let md = '---\n';
    md += `difficulty: ${question.difficulty || 1}\n`;
    md += `tags: ${tagString}\n`;
    md += '---\n\n';

    const questionLines = question.question.split('\n');
    let processedQuestion = '';
    //let codeContent = '';
    let inQuestionText = true;
    
    for (const line of questionLines) {
      const trimmedLine = line.trim();
      
      if (enableFormatting) {
        const { isCode } = isCodeBlock(trimmedLine);
        
        if (isCode && inQuestionText) {
          if (processedQuestion) {
            processedQuestion += '\n';
          }
          processedQuestion += `\`\`\`${defaultLanguage}\n`;
          inQuestionText = false;
        }
        
        if (!inQuestionText || isCode) {
          processedQuestion += line + '\n';
        } else {
          processedQuestion += line + '\n';
        }
      } else {
        if (trimmedLine) {
          processedQuestion += line + '\n';
        }
      }
    }

    if (!inQuestionText) {
      processedQuestion += '```\n';
    }

    md += processedQuestion.trim() + '\n\n';

    // Process answers
    if (Array.isArray(question.answers)) {
      question.answers.forEach((answer) => {
        if (answer && typeof answer === 'object') {
          md += `# ${answer.isCorrect ? 'Correct' : ''}\n`;
          const answerText = answer.text.trim();

          if (enableFormatting) {
            const { isCode } = isCodeBlock(answerText);
            if (isCode) {
              md += `\`\`\`${defaultLanguage}\n${answerText}\n\`\`\`\n\n`;
            } else {
              md += `${answerText}\n\n`;
            }
          } else {
            md += `${answerText}\n\n`;
          }
        }
      });
    }

    return md.trim();
  } catch (error) {
    console.error('Error generating markdown:', error);
    return '';
  }
};
export const parseMarkdownContent = (
  content: string,
  formattingOptions: FormattingOptions = {
    enableCodeFormatting: true,
    defaultLanguage: 'javascript',
  }
): {
  title: string;
  question: string;
  answers: Array<{ id: string; text: string; isCorrect: boolean }>;
  difficulty: number;
  tags: string[];
  markdownContent: string;
  codeLanguage: 'javascript' | 'html';
} => {
  if (!content || typeof content !== 'string') {
    return {
      title: '',
      question: '',
      answers: Array(4).fill({ id: '', text: '', isCorrect: false }),
      difficulty: 1,
      tags: [],
      markdownContent: '',
      codeLanguage: formattingOptions.defaultLanguage,
    };
  }

  try {
    let detectedLanguage: 'javascript' | 'html' = formattingOptions.defaultLanguage;
    const languageMatch = content.match(/language:\s*(javascript|html)/);
    if (languageMatch && (languageMatch[1] === 'javascript' || languageMatch[1] === 'html')) {
      detectedLanguage = languageMatch[1];
    }

    const lines = content.split('\n');
    let inFrontMatter = false;
    let currentSection = '';
    let currentContent = '';
    let codeBuffer = '';
    let isInCodeBlock = false;

    const parsedData = {
      title: '',
      question: '',
      answers: [] as Array<{ id: string; text: string; isCorrect: boolean }>,
      difficulty: 1,
      tags: [] as string[],
      markdownContent: content,
      codeLanguage: detectedLanguage,
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      if (trimmedLine === '---') {
        inFrontMatter = !inFrontMatter;
        continue;
      }

      if (inFrontMatter) {
        if (trimmedLine.startsWith('difficulty:')) {
          const difficultyValue = parseInt(trimmedLine.substring(11).trim());
          parsedData.difficulty = isNaN(difficultyValue) ? 1 : difficultyValue;
        } else if (trimmedLine.startsWith('tags:')) {
          parsedData.tags = trimmedLine.substring(5).trim().split(' ').filter(Boolean);
        }
        continue;
      }

      if (trimmedLine.startsWith('```')) {
        isInCodeBlock = !isInCodeBlock;
        if (!isInCodeBlock && codeBuffer) {
          if (currentSection === '') {
            parsedData.question += codeBuffer;
          } else {
            currentContent += codeBuffer;
          }
          codeBuffer = '';
        }
        continue;
      }

      if (isInCodeBlock) {
        codeBuffer += line + '\n';
        continue;
      }

      if (trimmedLine.startsWith('#')) {
        if (currentContent) {
          parsedData.answers.push({
            id: (parsedData.answers.length + 1).toString(),
            text: currentContent.trim(),
            isCorrect: currentSection.includes('Correct'),
          });
          currentContent = '';
        }
        currentSection = trimmedLine;
        continue;
      }

      if (currentSection === '') {
        if (trimmedLine) parsedData.question += line + '\n';
      } else {
        if (trimmedLine) currentContent += line + '\n';
      }
    }

    if (currentContent) {
      parsedData.answers.push({
        id: (parsedData.answers.length + 1).toString(),
        text: currentContent.trim(),
        isCorrect: currentSection.includes('Correct'),
      });
    }

    while (parsedData.answers.length < 4) {
      parsedData.answers.push({
        id: (parsedData.answers.length + 1).toString(),
        text: '',
        isCorrect: false,
      });
    }

    return parsedData;
  } catch (error) {
    console.error('Error parsing markdown:', error);
    return {
      title: '',
      question: '',
      answers: Array(4).fill({ id: '', text: '', isCorrect: false }),
      difficulty: 1,
      tags: [],
      markdownContent: content,
      codeLanguage: formattingOptions.defaultLanguage,
    };
  }
};

export const saveMarkdownToLocalStorage = (files: MarkdownFile[]): void => {
  try {
    localStorage.setItem('markdownFiles', JSON.stringify(files));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
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