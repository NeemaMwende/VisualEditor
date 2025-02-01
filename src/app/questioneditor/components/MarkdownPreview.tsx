import React from 'react';
import { Card } from '@/components/ui/card';
import { TabsList, TabsTrigger, TabsContent, Tabs } from '@/components/ui/tabs';
import { Eye, Edit } from 'lucide-react';

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
  const renderMarkdown = (content: string) => {
    const cleanedContent = content.replace(/^---[\s\S]+?---/, "").trim();
    const sections = cleanedContent.split(/^# /m).filter(Boolean);

    return (
      <div className="space-y-4">
        {sections.map((section, index) => {
          const [title, ...contentLines] = section.split('\n');
          const content = contentLines.join('\n');

          // Handle code blocks
          const formattedContent = content.split('```').map((block, blockIndex) => {
            if (blockIndex % 2 === 1) {
              const codeContent = block.replace(/^(javascript|html|\w+)?\n/, '').trim();
              
              return (
                <pre key={blockIndex} className="bg-gray-800 text-gray-100 p-4 rounded-md overflow-x-auto">
                  <code className="text-sm">{codeContent}</code>
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

  return (
    <Card className={`${isFullScreen ? 'h-full' : ''}`}>
      <Tabs defaultValue="edit" className="w-full">
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
          <textarea
            value={markdown}
            onChange={(e) => onMarkdownChange(e.target.value)}
            className="w-full h-full min-h-[300px] p-4 font-mono text-sm bg-gray-50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter markdown content..."
          />
        </TabsContent>

        <TabsContent value="preview" className="min-h-[300px]">
          <div className="p-4 prose prose-gray max-w-none">
            {renderMarkdown(markdown)}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default MarkdownPreview;