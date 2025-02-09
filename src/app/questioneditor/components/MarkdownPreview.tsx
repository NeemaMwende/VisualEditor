import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { TabsList, TabsTrigger, TabsContent, Tabs } from '@/components/ui/tabs';
import { Eye, Edit } from 'lucide-react';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-markup';
import 'prismjs/themes/prism-tomorrow.css';

interface MarkdownPreviewProps {
  markdown: string;
  onMarkdownChange: (markdown: string) => void;
  isFullScreen?: boolean;
}

const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({
  markdown,
  onMarkdownChange,
  isFullScreen = false,
}) => {
  const [activeTab, setActiveTab] = useState('edit');
  const [editableContent, setEditableContent] = useState(markdown);
  const [highlightedEditor, setHighlightedEditor] = useState('');

  // Language configuration map
  const languageMap = {
    html: { grammar: Prism.languages.markup, name: 'markup' },
    javascript: { grammar: Prism.languages.javascript, name: 'javascript' },
    js: { grammar: Prism.languages.javascript, name: 'javascript' },
    jsx: { grammar: Prism.languages.jsx, name: 'jsx' }
  };

  // Function to detect and process code blocks
  const detectCodeBlocks = (content: string) => {
    const codeBlockRegex = /```(html|javascript|js|jsx)?\n([\s\S]*?)```/gi;
    const blocks: { lang: string; content: string; start: number; end: number }[] = [];
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      let lang = (match[1] || 'javascript').toLowerCase();
      // Normalize language identifiers
      if (lang === 'js') lang = 'javascript';
      
      blocks.push({
        lang,
        content: match[2],
        start: match.index,
        end: match.index + match[0].length
      });
    }
    return blocks;
  };

  // Safe highlight function
  const safeHighlight = (code: string, lang: string) => {
    try {
      const language = lang.toLowerCase();
      const langConfig = languageMap[language as keyof typeof languageMap] || languageMap.javascript;
      return Prism.highlight(code, langConfig.grammar, langConfig.name);
    } catch (error) {
      console.warn(`Failed to highlight ${lang} code:`, error);
      return code;
    }
  };

  // Highlight editor content
  const highlightEditorContent = (content: string) => {
    let highlightedContent = content;
    const codeBlocks = detectCodeBlocks(content);
    
    // Process code blocks from end to start
    for (const block of codeBlocks.reverse()) {
      const highlightedCode = safeHighlight(block.content, block.lang);
      
      const before = highlightedContent.slice(0, block.start);
      const after = highlightedContent.slice(block.end);
      highlightedContent = before + 
        `<span class="token keyword">\`\`\`${block.lang}</span>\n` +
        highlightedCode +
        '\n<span class="token keyword">```</span>' +
        after;
    }

    // Highlight markdown syntax
    highlightedContent = highlightedContent
      .split('\n')
      .map(line => {
        // Headers
        if (line.startsWith('#')) {
          const [hashes, ...text] = line.split(' ');
          return `<span class="token title important">${hashes}</span> ${text.join(' ')}`;
        }
        return line;
      })
      .join('\n');

    setHighlightedEditor(highlightedContent);
  };

  useEffect(() => {
    highlightEditorContent(markdown);
  }, [markdown]);

  useEffect(() => {
    if (activeTab === 'preview') {
      setTimeout(() => Prism.highlightAll(), 0);
    }
  }, [activeTab, editableContent]);

  const handleEditorChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setEditableContent(newContent);
    onMarkdownChange(newContent);
    highlightEditorContent(newContent);
  };

  const renderMarkdown = (content: string) => {
    const sections = content.split(/^# /m).filter(Boolean);

    return (
      <div className="space-y-4">
        {sections.map((section, index) => {
          const [title, ...contentLines] = section.split('\n');
          const content = contentLines.join('\n');

          const formattedContent = content.split('```').map((block, blockIndex) => {
            if (blockIndex % 2 === 1) {
              const [firstLine, ...rest] = block.split('\n');
              let language = (firstLine.trim() || 'javascript').toLowerCase();
              if (language === 'js') language = 'javascript';
              
              const langConfig = languageMap[language as keyof typeof languageMap] || languageMap.javascript;
              const codeContent = rest.join('\n').trim();

              return (
                <pre key={blockIndex} className="relative rounded-md overflow-hidden bg-gray-800">
                  <div className="absolute right-2 top-2 text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
                    {language}
                  </div>
                  <code className={`language-${langConfig.name} block p-4 overflow-x-auto`}>
                    {codeContent}
                  </code>
                </pre>
              );
            }
            return <p key={blockIndex} className="whitespace-pre-wrap text-gray-800">{block}</p>;
          });

          return (
            <div key={index} className="space-y-2">
              {title && <h3 className="text-lg font-semibold text-gray-800">{title.trim()}</h3>}
              <div className="prose max-w-none">{formattedContent}</div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderEditor = () => {
    const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
      const textarea = e.currentTarget;
      const overlay = textarea.nextElementSibling as HTMLElement;
      if (overlay) {
        overlay.scrollTop = textarea.scrollTop;
      }
    };
  
    return (
      <div className="relative h-full">
        <textarea
          value={editableContent}
          onChange={handleEditorChange}
          onScroll={handleScroll}
          className="w-full h-full min-h-[300px] p-4 font-mono text-sm bg-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-y-auto"
          placeholder="Enter markdown content..."
          spellCheck={false}
        />
        <div
          className="absolute top-0 left-0 w-full h-full pointer-events-none p-4 font-mono text-sm whitespace-pre-wrap overflow-y-auto bg-gray-50"
          dangerouslySetInnerHTML={{ __html: highlightedEditor }}
        />
      </div>
    );
  };

  return (
    <Card className={`${isFullScreen ? 'h-full' : ''} flex flex-col`}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="edit" className="flex items-center gap-2">
            <Edit size={16} />
            Edit
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye size={16} />
            Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="flex-1 min-h-0">
          {renderEditor()}
        </TabsContent>

        <TabsContent value="preview" className="flex-1 min-h-0 overflow-auto">
          <div className="p-4 prose max-w-none">
            {renderMarkdown(editableContent)}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default MarkdownPreview;