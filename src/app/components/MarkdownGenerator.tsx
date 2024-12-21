import { Question } from './Interfaces';

export const generateMarkdown = (question: Question): string => {
  return `---
difficulty: ${question.difficulty}
tags: ${question.tags.join(', ')}
---

${question.question}

# Correct
${question.answers.map(answer => `\n#\n${answer.text}`).join('')}`;
};
