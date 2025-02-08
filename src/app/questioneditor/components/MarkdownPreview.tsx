import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { TabsList, TabsTrigger, TabsContent, Tabs } from '@/components/ui/tabs';
import { Eye, Edit } from 'lucide-react';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-typescript';
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
  const [editorContent, setEditorContent] = useState(markdown);
  const [highlightedEditor, setHighlightedEditor] = useState<string>('');

  useEffect(() => {
    setEditorContent(markdown);
  }, [markdown]);

  const detectLanguage = useCallback((code: string): string => {
    const tsPattern = /\bnew\s+\w+<\w+>/;
    if (tsPattern.test(code)) {
      return 'typescript';
    }

    const htmlPatterns = [/<[^>]+>/, /<!DOCTYPE\s+html>/i, /<html\b/i, /<\/[a-z]+>/i];
    const jsPatterns = [/\b(const|let|var|function)\b/, /=>/, /\bimport\b/, /\bexport\b/];

    const isHTML = htmlPatterns.some(pattern => pattern.test(code));
    const isJS = jsPatterns.some(pattern => pattern.test(code));

    return isHTML ? 'html' : isJS ? 'javascript' : 'javascript';
  }, []);

  const applyCustomStyling = (content: string): string => {
    return content
      .replace(/^# (.+)/gm, '<span class="text-orange-500 font-bold"># $1</span>')
      .replace(/\b(Correct)\b/g, '<span class="text-orange-500 font-bold">$1</span>') 
      .replace(/\b(html)\b/g, '<span class="text-purple-500 font-bold">$1</span>') 
      .replace(/\b(javascript)\b/g, '<span class="text-yellow-500 font-bold">$1</span>') 
      .replace(/\bfalse\b/g, '<span class="text-orange-500 font-bold">false</span>') 
      .replace(/\btrue\b/g, '<span class="text-blue-500 font-bold">true</span>');
  };

  const highlightMarkdown = useCallback((content: string) => {
    return content.split(/^(```[^\n]*\n[\s\S]*?\n```)/gm).map((block) => {
      if (block.startsWith('```')) {
        const [firstLine, ...rest] = block.split('\n');
        const languageFromBlock = firstLine.slice(3).trim();
        const code = rest.slice(0, -1).join('\n');
        const language = languageFromBlock || detectLanguage(code);
        const langForPrism = language === 'html' ? 'markup' : language;

        const highlightedCode = Prism.highlight(
          code,
          Prism.languages[langForPrism] || Prism.languages.javascript,
          langForPrism
        );

        return `<div class="relative rounded-md overflow-hidden bg-gray-800 my-4">
          <div class="absolute top-3 right-3 text-xs text-gray-400">${language}</div>
          <pre class="p-6"><code class="language-${langForPrism}">${highlightedCode}</code></pre>
        </div>`;
      }
      return applyCustomStyling(block);
    }).join('');
  }, [detectLanguage]);

  useEffect(() => {
    const highlighted = highlightMarkdown(editorContent);
    setHighlightedEditor(highlighted);
  }, [editorContent, highlightMarkdown]);

  const renderEditor = useCallback(() => (
    <div className="relative grid">
      <textarea
        value={editorContent}
        onChange={(e) => {
          setEditorContent(e.target.value);
          onMarkdownChange(e.target.value);
        }}
        className="w-full h-full min-h-[400px] p-6 font-mono text-sm bg-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none absolute inset-0 text-transparent caret-gray-700"
        placeholder="Enter markdown content..."
        spellCheck={false}
      />
      <div 
        className="w-full h-full min-h-[400px] p-6 font-mono text-sm whitespace-pre-wrap break-words pointer-events-none"
        dangerouslySetInnerHTML={{ __html: highlightedEditor }}
      />
    </div>
  ), [editorContent, highlightedEditor, onMarkdownChange]);

  const removeMetadata = (content: string): string => {
    return content.replace(/^---[\s\S]+?---\n*/, '').trim();
  };

  const renderMarkdown = useCallback((content: string) => {
    const cleanedContent = removeMetadata(content);
    const sections = cleanedContent.split(/^# /m).filter(Boolean);

    return (
      <div className="space-y-6">
        {sections.map((section, sectionIndex) => {
          const [title, ...contentLines] = section.split('\n');
          const content = contentLines.join('\n');
          const formattedContent = highlightMarkdown(content);

          return (
            <div key={sectionIndex} className="space-y-4">
              {title && <h3 className="text-lg font-semibold mb-4">{title.trim()}</h3>}
              <div 
                className="prose prose-gray max-w-none"
                dangerouslySetInnerHTML={{ __html: formattedContent }}
              />
            </div>
          );
        })}
      </div>
    );
  }, [highlightMarkdown]);

  useEffect(() => {
    if (activeTab === 'preview') {
      Prism.highlightAll();
    }
  }, [activeTab, markdown]);

  return (
    <Card className={`${isFullScreen ? 'h-full' : ''}`}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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

        <TabsContent value="edit" className="min-h-[400px]">
          {renderEditor()}
        </TabsContent>

        <TabsContent value="preview" className="min-h-[400px]">
          <div className="p-6 prose prose-gray max-w-none">
            {renderMarkdown(markdown)}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default MarkdownPreview;
