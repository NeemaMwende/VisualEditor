import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
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
  defaultLanguage?: string;
}

const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({
  markdown,
  onMarkdownChange,
  isFullScreen = false,
}) => {
  const [activeTab, setActiveTab] = useState('edit');
  const [editableContent, setEditableContent] = useState(markdown);
  const [highlightedEditor, setHighlightedEditor] = useState('');
  const detectedLanguagesRef = useRef<{ [key: number]: string }>({});

  const languageMap = useMemo(() => ({
    html: { grammar: Prism.languages.markup, name: 'markup' },
    javascript: { grammar: Prism.languages.javascript, name: 'javascript' },
  }), []);

  const stripMetadata = (content: string) => {
    return content.replace(/^---\s*\ndifficulty:.*\ntags:.*\n---\s*\n/m, '');
  };

  const detectCodeBlocks = useCallback((content: string) => {
    const codeBlockRegex = /```(html|javascript|js|jsx)?\n([\s\S]*?)```/gi;
    const blocks: { lang: string; content: string; start: number; end: number }[] = [];
    let match;
    const newDetectedLanguages: { [key: number]: string } = {};
  
    while ((match = codeBlockRegex.exec(content)) !== null) {
      let lang = match[1]?.toLowerCase() || '';
      if (!lang || lang === 'js') {
        const hasHtmlTags = /<[^>]+>/.test(match[2]);
        lang = hasHtmlTags ? 'html' : 'javascript';
      }
      newDetectedLanguages[match.index] = lang;
      blocks.push({
        lang,
        content: match[2],
        start: match.index,
        end: match.index + match[0].length
      });
    }
    // Update the ref instead of using setState
    detectedLanguagesRef.current = newDetectedLanguages;
    return blocks;
  }, []);

  const safeHighlight = useCallback((code: string, lang: string) => {
    try {
      const language = lang.toLowerCase();
      const langConfig = languageMap[language as keyof typeof languageMap] || languageMap.javascript;
      return Prism.highlight(code, langConfig.grammar, langConfig.name);
    } catch (error) {
      console.warn(`Failed to highlight ${lang} code:`, error);
      return code;
    }
  }, [languageMap]); 
  
  const highlightEditorContent = useCallback((content: string) => {
    let highlightedContent = content;
    const codeBlocks = detectCodeBlocks(content);
    
    for (const block of codeBlocks.reverse()) {
      const highlightedCode = safeHighlight(block.content, block.lang);
      const before = highlightedContent.slice(0, block.start);
      const after = highlightedContent.slice(block.end);
      highlightedContent = before + 
        `<span class="token keyword" style="color: #ff79c6">\`\`\`${block.lang}</span>\n` +
        highlightedCode +
        '\n<span class="token keyword" style="color: #ff79c6">```</span>' +
        after;
    }
  
    highlightedContent = highlightedContent
      .split('\n')
      .map(line => {
        if (line.startsWith('#')) {
          const [hashes, ...text] = line.split(' ');
          return `<span class="token title important" style="color:rgb(224, 146, 29)">${hashes}</span> ${text.join(' ')}`;
        }
        if (line.match(/^(difficulty|tags):/)) {
          const [key, ...value] = line.split(':');
          return `<span class="token property" style="color:rgb(224, 146, 29)">${key}:</span>${value.join(':')}`;
        }
        if (line === '---') {
          return `<span class="token hr" style="color: rgb(224, 146, 29)">---</span>`;
        }
        return line;
      })
      .join('\n');
  
    return highlightedContent;
  }, [detectCodeBlocks, safeHighlight]);
  
  useEffect(() => {
    // Compute the highlighted content and set state only once
    const highlighted = highlightEditorContent(markdown);
    setHighlightedEditor(highlighted);
  }, [markdown, highlightEditorContent]);

  useEffect(() => {
    if (activeTab === 'preview') {
      setTimeout(() => Prism.highlightAll(), 0);
    }
  }, [activeTab, editableContent]);

  const handleEditorChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setEditableContent(newContent);
    onMarkdownChange(newContent);
    
    // Compute the highlighted content and set state only once
    const highlighted = highlightEditorContent(newContent);
    setHighlightedEditor(highlighted);
  };

  const renderMarkdown = (content: string) => {
    const cleanContent = stripMetadata(content);
    const sections = cleanContent.split(/^# /m).filter(Boolean);
  
    return (
      <div className="space-y-4">
        {sections.map((section, index) => {
          const [title, ...contentLines] = section.split('\n');
          const content = contentLines.join('\n');
  
          const formattedContent = content.split('```').map((block, blockIndex) => {
            if (blockIndex % 2 === 1) {
              const [firstLine, ...rest] = block.split('\n');
              const language = firstLine.trim().toLowerCase();
              const position = content.indexOf(block);
              const detectedLanguage = detectedLanguagesRef.current[position] || language || 'javascript';
              const langConfig = languageMap[detectedLanguage as keyof typeof languageMap] || languageMap.javascript;
              const codeContent = rest.join('\n').trim();
  
              return (
                <pre key={blockIndex} className="relative rounded-md overflow-hidden bg-gray-900">
                  <code className={`language-${langConfig.name} block p-4 overflow-x-auto text-white`}>
                    {codeContent}
                  </code>
                </pre>
              );
            }
            return <p key={blockIndex} className="whitespace-pre-wrap text-gray-900">{block}</p>;
          });
  
          return (
            <div key={index} className="space-y-2">
              {title && <h3 className="text-lg font-semibold text-gray-900">{title.trim()}</h3>}
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
          className="w-full h-full min-h-[300px] p-4 font-mono text-sm bg-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-y-auto text-gray-900"
          placeholder="Enter markdown content..."
          spellCheck={false}
        />
        <div
          className="absolute top-0 left-0 w-full h-full pointer-events-none p-4 font-mono text-sm whitespace-pre-wrap overflow-y-auto bg-white"
          dangerouslySetInnerHTML={{ __html: highlightedEditor }}
        />
      </div>
    );
  };

  return (
    <Card className={`${isFullScreen ? 'h-full' : ''} flex flex-col bg-white`}>
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