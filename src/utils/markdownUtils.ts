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

export const synchronizeMarkdownFormatting = (
  text: string,
  enableFormatting: boolean,
  language: 'javascript' | 'html'
): string => {
  if (!enableFormatting) {
    return cleanupCodeBlocks(text, language);
  }

  const cleaned = cleanupCodeBlocks(text, language);
  return cleaned.replace(/```(javascript|html)?\n([\s\S]*?)\n```/g, 
    (_, __, code) => `\n\`\`\`${language}\n${code.trim()}\n\`\`\``
  );
};


export const detectCodeLanguage = (code: string): 'javascript' | 'html' | null => {
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

  const jsMatches = jsPatterns.filter(pattern => pattern.test(code.trim())).length;
  const htmlMatches = htmlPatterns.filter(pattern => pattern.test(code.trim())).length;

  if (jsMatches > 0 && jsMatches >= htmlMatches) return 'javascript';
  if (htmlMatches > 0) return 'html';
  return null;
};


export const updateMarkdownCodeBlocks = (
  markdown: string,
  formattingOptions: {
    enableCodeFormatting: boolean;
    defaultLanguage: 'javascript' | 'html';
  }
): string => {
  if (!formattingOptions.enableCodeFormatting) {
    return markdown.replace(/```(javascript|html)?\n([\s\S]*?)\n```/g, '$2');
  }

  return markdown.replace(/```(javascript|html)?\n([\s\S]*?)\n```/g, (match, lang, code) => {
    const detectedLang = detectCodeLanguage(code);
    const language = detectedLang || formattingOptions.defaultLanguage;
    return `\n\n\`\`\`${language}\n${code}\n\`\`\``;
  });
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
  let isInCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    if (trimmedLine.startsWith('```')) {
      if (!isInCodeBlock) {
        isInCodeBlock = true;
        codeBlockLines = [];
      } else {
        isInCodeBlock = false;
        if (codeBlockLines.length > 0) {
          formattedText += `\n\`\`\`${language}\n${codeBlockLines.join('\n')}\n\`\`\`\n`;
          codeBlockLines = [];
        }
      }
      continue;
    }

    if (isInCodeBlock) {
      codeBlockLines.push(line);
    } else {
      formattedText += line + '\n';
    }
  }

 
  if (isInCodeBlock && codeBlockLines.length > 0) {
    formattedText += `\n\`\`\`${language}\n${codeBlockLines.join('\n')}\n\`\`\`\n`;
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
    md += `title: ${question.title || ''}\n`;
    md += `difficulty: ${question.difficulty || 1}\n`;
    md += `tags: ${tagString}\n`;
    md += '---\n\n';

    // Process question text
    const questionText = question.question.trim();
    if (questionText) {
      const processedQuestion = processMarkdownBlock(questionText, defaultLanguage, enableFormatting);
      md += processedQuestion + '\n\n';
    }

    // Process answers
    if (Array.isArray(question.answers)) {
      question.answers.forEach((answer) => {
        if (answer && typeof answer === 'object') {
          md += `# ${answer.isCorrect ? 'Correct' : ''}\n`;
          const processedAnswer = processMarkdownBlock(answer.text.trim(), defaultLanguage, enableFormatting);
          md += processedAnswer + '\n\n';
        }
      });
    }

    return md.trim();
  } catch (error) {
    console.error('Error generating markdown:', error);
    return '';
  }
};

const cleanupCodeBlocks = (text: string, language: 'javascript' | 'html'): string => {
  if (!text) return '';

  let normalized = text.replace(/\r\n/g, '\n');
  normalized = normalized.replace(/```[^\n]*\n\s*```/g, '');
  const codeBlockRegex = /```(?:javascript|html)?\n([\s\S]*?)\n```/g;
  const codeBlocks: string[] = [];
  let match;

  while ((match = codeBlockRegex.exec(normalized)) !== null) {
    if (match[1].trim()) {
      codeBlocks.push(match[1].trim());
    }
  }

  // If we found code blocks, combine them into a single block
  if (codeBlocks.length > 0) {
    normalized = normalized.replace(/```(?:javascript|html)?\n[\s\S]*?\n```/g, '').trim();
    
    const combinedCode = codeBlocks.join('\n\n');
    normalized = `${normalized}\n\n\`\`\`${language}\n${combinedCode}\n\`\`\``;
  }

  normalized = normalized.replace(/\n{3,}/g, '\n\n');

  return normalized.trim();
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
    let title = '';
    let difficulty = 1;
    let tags: string[] = [];
    let question = '';
    let answers: Array<{ id: string; text: string; isCorrect: boolean }> = [];
    let currentSection = 'question';
    let currentContent = '';
    let isInCodeBlock = false;
    let codeBlockContent = '';

    const lines = content.split('\n');
    let inFrontMatter = false;

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (trimmedLine === '---') {
        inFrontMatter = !inFrontMatter;
        continue;
      }

      if (inFrontMatter) {
        if (trimmedLine.startsWith('title:')) {
          title = trimmedLine.substring(6).trim();
        } else if (trimmedLine.startsWith('difficulty:')) {
          const difficultyValue = parseInt(trimmedLine.substring(11).trim());
          difficulty = isNaN(difficultyValue) ? 1 : difficultyValue;
        } else if (trimmedLine.startsWith('tags:')) {
          tags = trimmedLine.substring(5).trim().split(' ').filter(Boolean);
        }
        continue;
      }

      if (trimmedLine.startsWith('```')) {
        if (!isInCodeBlock) {
          isInCodeBlock = true;
          codeBlockContent = '';
        } else {
          isInCodeBlock = false;
          currentContent += `\n\`\`\`${formattingOptions.defaultLanguage}\n${codeBlockContent.trim()}\n\`\`\`\n`;
          codeBlockContent = '';
        }
        continue;
      }

      if (isInCodeBlock) {
        codeBlockContent += line + '\n';
        continue;
      }

      if (trimmedLine.startsWith('#')) {
        if (currentContent) {
          if (currentSection === 'question') {
            question = currentContent.trim();
          } else {
            answers.push({
              id: (answers.length + 1).toString(),
              text: currentContent.trim(),
              isCorrect: currentSection.includes('Correct'),
            });
          }
          currentContent = '';
        }
        currentSection = trimmedLine;
        continue;
      }

      currentContent += line + '\n';
    }

    if (currentContent) {
      if (currentSection === 'question') {
        question = currentContent.trim();
      } else {
        answers.push({
          id: (answers.length + 1).toString(),
          text: currentContent.trim(),
          isCorrect: currentSection.includes('Correct'),
        });
      }
    }

    // Ensure we have exactly 4 answers
    while (answers.length < 4) {
      answers.push({
        id: (answers.length + 1).toString(),
        text: '',
        isCorrect: false,
      });
    }
    answers = answers.slice(0, 4);

    // Clean up any duplicate code block markers
    question = cleanupCodeBlocks(question, formattingOptions.defaultLanguage);
    answers = answers.map(answer => ({
      ...answer,
      text: cleanupCodeBlocks(answer.text, formattingOptions.defaultLanguage),
    }));

    return {
      title,
      question,
      answers,
      difficulty,
      tags,
      markdownContent: content,
      codeLanguage: formattingOptions.defaultLanguage,
      enableCodeFormatting: formattingOptions.enableCodeFormatting,
    };
  } catch (error) {
    console.error('Error parsing markdown content:', error);

    // Return a default structure in case of an error
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