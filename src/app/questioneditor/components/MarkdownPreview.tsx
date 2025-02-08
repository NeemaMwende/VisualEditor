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

  // When markdown changes or the active tab becomes "preview", highlight all code blocks.
  useEffect(() => {
    if (activeTab === 'preview') {
      Prism.highlightAll();
    }
  }, [markdown, activeTab]);

  const renderMarkdown = (content: string) => {
    // Remove frontmatter if it exists.
    const cleanedContent = content.replace(/^---[\s\S]+?---/, '').trim();
    const sections = cleanedContent.split(/^# /m).filter(Boolean);

    return (
      <div className="space-y-4">
        {sections.map((section, index) => {
          const [title, ...contentLines] = section.split('\n');
          const content = contentLines.join('\n');

          const formattedContent = content.split('```').map((block, blockIndex) => {
            if (blockIndex % 2 === 1) {
              const [firstLine, ...rest] = block.split('\n');
              const language = firstLine.trim() || 'javascript';
              // Map "html" to "markup" as Prism expects.
              const langForClass = language.toLowerCase() === 'html' ? 'markup' : language;
              const codeContent = rest.join('\n').trim();

              return (
                <pre key={blockIndex} className="relative rounded-md overflow-hidden">
                  <div className="absolute right-2 top-2 text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
                    {language}
                  </div>
                  <code className={`language-${langForClass} block bg-gray-800 text-gray-100 p-4 overflow-x-auto`}>
                    {codeContent}
                  </code>
                </pre>
              );
            }
            return <p key={blockIndex} className="whitespace-pre-wrap">{block}</p>;
          });

          return (
            <div key={index} className="space-y-2">
              {title && <h3 className="text-lg font-semibold">{title.trim()}</h3>}
              <div className="prose prose-gray max-w-none">{formattedContent}</div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderEditor = () => (
    <div className="relative">
      <textarea
        value={markdown}
        onChange={(e) => onMarkdownChange(e.target.value)}
        className="w-full h-full min-h-[300px] p-4 font-mono text-sm bg-gray-50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Enter markdown content..."
      />
      <div className="absolute top-2 right-2 text-xs text-gray-400">Markdown</div>
    </div>
  );

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

        <TabsContent value="edit" className="min-h-[300px]">
          {renderEditor()}
        </TabsContent>

        <TabsContent value="preview" className="min-h-[300px]">
          <div className="p-4 prose prose-gray max-w-none">{renderMarkdown(markdown)}</div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default MarkdownPreview;
