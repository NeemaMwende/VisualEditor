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
const isCodeBlock = (text: string): boolean => {
  const patterns = [
    // HTML-specific patterns 
    /<[a-zA-Z][\s\S]*?>/,  
    /<\/[a-zA-Z]+>/,        
    /<!DOCTYPE\s+html>/i,   
    /^<(html|head|body|div|span|p|a|button|input|form|label)\b/i,
    
    // JavaScript patterns
    /function\s+\w+\s*\([^)]*\)\s*{/,
    /const\s+\w+\s*=\s*\([^)]*\)\s*=>/,
    /class\s+\w+(\s+extends\s+\w+)?\s*{/,
    /(const|let|var)\s+\w+\s*=\s*(\{|\[|new\s+|require\(|import)/,
    /(if|for|while|switch)\s*\([^)]*\)\s*{/,
    /\w+\.(map|filter|reduce|forEach|then|catch)\(/,
    /(import|export)\s+(?:{[^}]+}|\w+|\*)\s+from/,
    /\(\s*\)\s*=>\s*{/,
    /async\s+function/,
    /await\s+\w+/,
    /try\s*{\s*.*}\s*catch/,
    /return\s+[\w\{\[\(]/,
    /throw\s+new\s+\w+/,
    /console\.(log|error|warn|info)/
  ];

  return patterns.some(pattern => pattern.test(text.trim()));
};

const findCodeBlocks = (text: string): { 
  start: number; 
  end: number; 
  content: string;
  language?: 'javascript' | 'html' 
}[] => {
  const lines = text.split('\n');
  const blocks: { start: number; end: number; content: string; language?: 'javascript' | 'html' }[] = [];
  let currentBlock: string[] = [];
  let blockStart = -1;
  let inExistingCodeBlock = false;
  let existingBlockLanguage: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Handle existing markdown code blocks
    if (line.startsWith('```')) {
      if (!inExistingCodeBlock) {
        inExistingCodeBlock = true;
        blockStart = i;
        // Extract language if specified
        const match = line.match(/^```(\w+)/);
        existingBlockLanguage = match ? match[1] : null;
      } else {
        if (blockStart !== -1) {
          const content = lines.slice(blockStart + 1, i).join('\n');
          blocks.push({
            start: blockStart,
            end: i,
            content,
            language: (existingBlockLanguage as 'javascript' | 'html') || detectCodeLanguage(content) || 'javascript'
          });
        }
        inExistingCodeBlock = false;
        blockStart = -1;
        existingBlockLanguage = null;
      }
      continue;
    }

    if (inExistingCodeBlock) continue;

    // Auto-detect code blocks
    if (isCodeBlock(line)) {
      if (currentBlock.length === 0) {
        blockStart = i;
      }
      currentBlock.push(lines[i]);
    } else if (currentBlock.length > 0) {
      // Check if the line might be part of the code block
      if (line.match(/[{}\[\]();,>]$/) || line.trim() === '') {
        currentBlock.push(lines[i]);
      } else {
        const content = currentBlock.join('\n');
        const language = detectCodeLanguage(content) || 'javascript';
        blocks.push({
          start: blockStart,
          end: i - 1,
          content,
          language
        });
        currentBlock = [];
        blockStart = -1;
      }
    }
  }

  // Handle last auto-detected block
  if (currentBlock.length > 0) {
    const content = currentBlock.join('\n');
    const language = detectCodeLanguage(content) || 'javascript';
    blocks.push({
      start: blockStart,
      end: lines.length - 1,
      content,
      language
    });
  }

  return blocks;
};

 
  export const synchronizeMarkdownFormatting = (
    text: string,
    enableFormatting: boolean,
    language: 'javascript' | 'html'
  ): string => {
    if (!text) return '';
    if (!enableFormatting) return cleanupCodeBlocks(text, language);
  
    // Preserve existing language tags if present, otherwise use the specified language
    const cleaned = cleanupCodeBlocks(text, language);
    return cleaned.replace(/```(\w+)?\n([\s\S]*?)\n```/g, (match, lang, code) => {
      // Keep the original language tag if it exists, otherwise use the specified language
      const codeLanguage = lang || language;
      return `\n\`\`\`${codeLanguage}\n${code.trim()}\n\`\`\``;
    });
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
    /^<(?:!DOCTYPE\s+html|[a-zA-Z][\s\S]*?)>/i,
    /^<!DOCTYPE\s+html>/i,
    /^<html\b/i,
    /^<(div|span|p|a|button|input|form|label|head|body)\b/i,
    /^<\/[a-zA-Z]+>/,
    /^<[^>]+\/>/
  ];

  const jsMatches = jsPatterns.filter(pattern => pattern.test(code.trim())).length;
  const htmlMatches = htmlPatterns.filter(pattern => pattern.test(code.trim())).length;

  if (htmlMatches > 0 && htmlMatches >= jsMatches) return 'html';
  if (jsMatches > 0 && jsMatches > htmlMatches) return 'javascript';
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

const processMarkdownBlock = (
  text: string,
  defaultLanguage: 'javascript' | 'html',
  enableFormatting: boolean
): string => {
  if (!enableFormatting) return text;

  const lines = text.split('\n');
  let result = '';
  let isInCodeBlock = false;
  let skipUntil = -1;

  const codeBlocks = findCodeBlocks(text);
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (i <= skipUntil) continue;

    // Handle existing code block markers
    if (line.trim().startsWith('```')) {
      isInCodeBlock = !isInCodeBlock;
      result += line + '\n';
      continue;
    }

    if (isInCodeBlock) {
      result += line + '\n';
      continue;
    }

    const codeBlock = codeBlocks.find(block => block.start === i);
    if (codeBlock) {
      // Don't wrap already wrapped code blocks
      if (!lines[codeBlock.start].trim().startsWith('```')) {
        result += `\n\`\`\`${codeBlock.language}\n${codeBlock.content}\n\`\`\`\n`;
      } else {
        result += lines.slice(codeBlock.start, codeBlock.end + 1).join('\n') + '\n';
      }
      skipUntil = codeBlock.end;
    } else {
      result += line + '\n';
    }
  }

  return result.trim();
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

    const questionText = question.question.trim();
    if (questionText) {
      const processedQuestion = processMarkdownBlock(questionText, defaultLanguage, enableFormatting);
      md += processedQuestion + '\n\n';
    }

    if (Array.isArray(question.answers)) {
      question.answers.forEach((answer) => {
        if (answer && typeof answer === 'object') {
          md += `# ${answer.isCorrect ? 'Correct' : ''}\n\n`;
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
  normalized = normalized.replace(/(\n\s*\n)/g, '\n');
  
  // First, preserve existing code blocks
  const existingBlocks: string[] = [];
  normalized = normalized.replace(/```(?:javascript|html)?\n([\s\S]*?)\n```/g, (match, code) => {
    if (code.trim()) {
      existingBlocks.push(code.trim());
      return '[CODE_BLOCK_PLACEHOLDER]';
    }
    return '';
  });

  // Then detect and format new code blocks
  const detectedBlocks = findCodeBlocks(normalized);
  let result = normalized;

  // Replace detected blocks from bottom to top to maintain indices
  for (let i = detectedBlocks.length - 1; i >= 0; i--) {
    const block = detectedBlocks[i];
    const before = result.slice(0, block.start);
    const after = result.slice(block.end + 1);
    result = before + `[CODE_BLOCK_PLACEHOLDER]` + after;
    existingBlocks.unshift(block.content);
  }

  // Restore all code blocks with proper formatting
  result = result.replace(/\[CODE_BLOCK_PLACEHOLDER\]/g, () => {
    const code = existingBlocks.shift() || '';
    const detectedLang = detectCodeLanguage(code) || language;
    return `\`\`\`${detectedLang}\n${code.trim()}\n\`\`\``;

  });

  return result.trim();
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
