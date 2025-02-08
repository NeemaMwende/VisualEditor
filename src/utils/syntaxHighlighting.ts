// import { detectCodeLanguage } from './markdownUtils';

// const jsKeywords = [
//   'const', 'let', 'var', 'function', 'class', 'extends',
//   'if', 'else', 'for', 'while', 'do', 'switch', 'case',
//   'break', 'continue', 'return', 'try', 'catch', 'finally',
//   'throw', 'new', 'delete', 'typeof', 'instanceof', 'void',
//   'async', 'await', 'yield', 'import', 'export', 'default',
//   'from', 'as', 'super', 'this', 'null', 'undefined'
// ];

// const htmlElements = [
//   'html', 'head', 'body', 'div', 'span', 'p', 'a', 'button',
//   'input', 'form', 'label', 'script', 'style', 'link', 'meta',
//   'title', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li',
//   'table', 'tr', 'td', 'th', 'thead', 'tbody', 'section', 'article',
//   'nav', 'header', 'footer', 'main', 'aside', 'canvas', 'video',
//   'audio', 'source', 'img', 'picture', 'figure', 'figcaption'
// ];

// const specialWords = {
//   '#': 'text-orange-500',
//   'Correct': 'text-orange-500',
//   'false': 'text-orange-500',
//   'true': 'text-blue-500',
//   'html': 'text-purple-500',
//   'javascript': 'text-yellow-500'
// };

// export const wrapWithSpan = (text: string, className: string): string => {
//   return `<span class="${className}">${text}</span>`;
// };

// export const highlightSyntax = (text: string): string => {
//   // First, protect existing HTML tags
//   const protectedText = text.replace(/<[^>]+>/g, match => {
//     return `%%%${Buffer.from(match).toString('base64')}%%%`;
//   });

//   let processedText = protectedText;

//   // Handle special words first
//   Object.entries(specialWords).forEach(([word, className]) => {
//     const regex = new RegExp(`\\b${word}\\b`, 'g');
//     processedText = processedText.replace(regex, wrapWithSpan(word, `${className} font-bold`));
//   });

//   // Handle JavaScript keywords
//   jsKeywords.forEach(keyword => {
//     const regex = new RegExp(`\\b${keyword}\\b`, 'g');
//     processedText = processedText.replace(regex, wrapWithSpan(keyword, 'text-pink-500 font-semibold'));
//   });

//   // Handle HTML elements
//   htmlElements.forEach(element => {
//     const regex = new RegExp(`\\b${element}\\b`, 'g');
//     processedText = processedText.replace(regex, wrapWithSpan(element, 'text-teal-500 font-semibold'));
//   });

//   // Restore protected HTML tags
//   processedText = processedText.replace(/%%%([^%]+)%%%/g, (_, encoded) => {
//     return Buffer.from(encoded, 'base64').toString();
//   });

//   return processedText;
// };

// export const processMarkdownContent = (content: string): string => {
//   const lines = content.split('\n');
//   let inCodeBlock = false;
//   let currentLanguage = '';
//   let result = '';

//   for (let i = 0; i < lines.length; i++) {
//     const line = lines[i];

//     if (line.startsWith('```')) {
//       inCodeBlock = !inCodeBlock;
//       if (inCodeBlock) {
//         const lang = line.slice(3).trim();
//         currentLanguage = lang || detectCodeLanguage(lines[i + 1]) || 'javascript';
//         result += `\`\`\`${currentLanguage}\n`;
//         continue;
//       } else {
//         currentLanguage = '';
//       }
//     }

//     if (inCodeBlock) {
//       const highlighted = highlightSyntax(line);
//       result += highlighted + '\n';
//     } else {
//       // Handle non-code content
//       if (line.startsWith('#') || line.includes('Correct')) {
//         result += highlightSyntax(line) + '\n';
//       } else {
//         result += line + '\n';
//       }
//     }
//   }

//   return result.trim();
// };

// export const formatCodeBlock = (code: string, language: string): string => {
//   const lines = code.split('\n');
//   let result = '';

//   lines.forEach(line => {
//     result += highlightSyntax(line) + '\n';
//   });

//   return result.trim();
// };

// // Function to process entire markdown file
// export const processMarkdownFile = (content: string): string => {
//   const sections = content.split(/^(?=# )/gm);
  
//   return sections.map(section => {
//     if (section.trim().startsWith('#')) {
//       const [title, ...rest] = section.split('\n');
//       return highlightSyntax(title) + '\n' + processMarkdownContent(rest.join('\n'));
//     }
//     return processMarkdownContent(section);
//   }).join('\n\n');
// };