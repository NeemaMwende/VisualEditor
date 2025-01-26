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

const isStrictCodeBlock = (text: string): { isCode: boolean; language: 'javascript' | 'html' | '' } => {
  const jsPatterns = [
    /^(const|let|var|function)\s+\w+/,
    /^(export\s+)?(class)\s+\w+/,
    /^(import|export)\b/,
    /^const\s+\w+\s*=\s*\(.*\)\s*=>\s*{/,
    /^(if|for|while|switch|return)\b/,
    /^(try|catch|finally)\b/,
    /^(async|await)\b/,
    /^\w+\.\w+\(/,
    /^new\s+\w+/
  ];

  const htmlPatterns = [
    /^<[a-zA-Z][^>]*>/,
    /^<\/[a-zA-Z][^>]*>/,
    /^<[^>]+\/>/,
    /^<(div|span|p|a|button|input|form|label|!DOCTYPE)/i
  ];

  const jsMatches = jsPatterns.filter(pattern => pattern.test(text)).length;
  const htmlMatches = htmlPatterns.filter(pattern => pattern.test(text)).length;

  if (jsMatches > 0 && jsMatches >= htmlMatches) return { isCode: true, language: 'javascript' };
  if (htmlMatches > 0) return { isCode: true, language: 'html' };
  return { isCode: false, language: '' };
};

export const formatCode = (code: string, language: 'javascript' | 'html'): string => {
  if (!code.trim()) return code;
  const lines = code.split('\n').filter(line => line.trim());
  if (language === 'javascript') {
    return lines.map(line => {
      line = line.replace(/([;{}])\s*([^;{}])/g, '$1\n$2');
      line = line.replace(/([^\s{])\s*({)/g, '$1\n$2');
      return line;
    }).join('\n');
  }
  
  // Format HTML code
  if (language === 'html') {
    let indentLevel = 0;
    return lines.map(line => {
      const isClosingTag = line.trim().startsWith('</');
      if (isClosingTag) indentLevel = Math.max(0, indentLevel - 1);
      const formatted = '  '.repeat(indentLevel) + line.trim();
      if (!isClosingTag && line.includes('>') && !line.includes('/>')) indentLevel++;
      return formatted;
    }).join('\n');
  }
  
  return code;
};

export const processMarkdownBlock = (
  text: string,
  language: 'javascript' | 'html',
  enableFormatting: boolean
): string => {
  if (!enableFormatting) return text;

  const lines = text.split('\n');
  let formattedText = '';
  let codeBlockLines: string[] = [];
  let isCurrentlyInCodeBlock = false;

  for (const line of lines) {
    const trimmedLine = line.trim();
    const codeCheck = isStrictCodeBlock(trimmedLine);

    if (codeCheck.isCode) {
      if (!isCurrentlyInCodeBlock) {
        isCurrentlyInCodeBlock = true;
        codeBlockLines = [trimmedLine];
      } else {
        codeBlockLines.push(trimmedLine);
      }
    } else {
      // Non-code line
      if (isCurrentlyInCodeBlock) {
        formattedText += `\`\`\`${language}\n${codeBlockLines.join('\n')}\n\`\`\`\n\n`;
        isCurrentlyInCodeBlock = false;
        codeBlockLines = [];
      }

      // Add non-code text if not empty
      if (trimmedLine) {
        formattedText += `${line}\n`;
      }
    }
  }

  if (isCurrentlyInCodeBlock && codeBlockLines.length > 0) {
    formattedText += `\`\`\`${language}\n${codeBlockLines.join('\n')}\n\`\`\`\n`;
  }

  return formattedText.trim();
};

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

    // Format the question text
    const processedQuestion = processMarkdownBlock(question.question, defaultLanguage, enableFormatting);
    md += processedQuestion.trim() + '\n\n';

    // Format the answers
    if (Array.isArray(question.answers)) {
      question.answers.forEach((answer) => {
        if (answer && typeof answer === 'object') {
          md += `# ${answer.isCorrect ? 'Correct' : ''}\n\n`;
          const processedAnswer = processMarkdownBlock(answer.text, defaultLanguage, enableFormatting);
          md += processedAnswer.trim() + '\n\n';
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
  enableCodeFormatting?: boolean;
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
      enableCodeFormatting: formattingOptions.enableCodeFormatting,
    };
  }

  try {
    let detectedLanguage: 'javascript' | 'html' = formattingOptions.defaultLanguage;
    const languageMatch = content.match(/language:\s*(javascript|html)/);
    const enableFormattingMatch = content.match(/enableCodeFormatting:\s*(true|false)/);

    if (languageMatch && (languageMatch[1] === 'javascript' || languageMatch[1] === 'html')) {
      detectedLanguage = languageMatch[1];
    }

    const lines = content.split('\n');
    let inFrontMatter = false;
    let currentSection = 'question';
    let currentContent = '';
    let isInCodeBlock = false;

    const parsedData = {
      title: '',
      question: '',
      answers: [] as Array<{ id: string; text: string; isCorrect: boolean }>,
      difficulty: 1,
      tags: [] as string[],
      markdownContent: content,
      codeLanguage: detectedLanguage,
      enableCodeFormatting: enableFormattingMatch
        ? enableFormattingMatch[1] === 'true'
        : formattingOptions.enableCodeFormatting || false,
    };

    for (const line of lines) {
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
          parsedData.tags = trimmedLine
            .substring(5)
            .trim()
            .split(' ')
            .filter(Boolean);
        }
        continue;
      }

      if (trimmedLine.startsWith('```')) {
        const languageMatch = trimmedLine.match(/```(javascript|html)?/);
        if (languageMatch && languageMatch[1]) {
          detectedLanguage = languageMatch[1] as 'javascript' | 'html';
          parsedData.codeLanguage = detectedLanguage;
        }

        isInCodeBlock = !isInCodeBlock;
        currentContent += `${line}\n`; 
        continue;
      }

      if (isInCodeBlock) {
        currentContent += `${line}\n`;
        continue;
      }

      if (trimmedLine.startsWith('#')) {
        if (currentContent) {
          if (currentSection === 'question') {
            parsedData.question += currentContent.trim() + '\n';
          } else {
            parsedData.answers.push({
              id: (parsedData.answers.length + 1).toString(),
              text: currentContent.trim(),
              isCorrect: currentSection.includes('Correct'),
            });
          }
          currentContent = '';
        }
        currentSection = trimmedLine;
        continue;
      }

      if (currentSection === 'question') {
        parsedData.question += `${line}\n`;
      } else {
        currentContent += `${line}\n`;
      }
    }

    if (currentContent) {
      if (currentSection === 'question') {
        parsedData.question += currentContent.trim() + '\n';
      } else {
        parsedData.answers.push({
          id: (parsedData.answers.length + 1).toString(),
          text: currentContent.trim(),
          isCorrect: currentSection.includes('Correct'),
        });
      }
    }

    // Strictly limit answers to 4
    parsedData.answers = parsedData.answers.slice(0, 4);

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
      enableCodeFormatting: formattingOptions.enableCodeFormatting,
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