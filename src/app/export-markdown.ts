import { saveAs } from 'file-saver';

export const exportMarkdownFile = (content: string, fileName: string = 'questions.md') => {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  saveAs(blob, fileName);
};
