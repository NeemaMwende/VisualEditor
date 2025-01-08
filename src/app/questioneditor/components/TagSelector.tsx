import React, { useState, useEffect } from 'react';
import { parseMarkdownContent } from '../../../utils/markdownUtils';
import { Check, X, ChevronDown } from 'lucide-react';

interface FileData {
  name: string;
  content: string;
  path: string;
}

interface TagSelectorProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  files: FileData[];
  className?: string;
}

const TagSelector: React.FC<TagSelectorProps> = ({ 
  selectedTags, 
  onTagsChange, 
  files,
  className = "" 
}) => {
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [newTag, setNewTag] = useState<string>('');
  const isFileMode = files.length > 0;

  useEffect(() => {
    if (isFileMode) {
      // Extract tags from all files
      const allTags = files.reduce<string[]>((tags, file) => {
        try {
          const parsedData = parseMarkdownContent(file.content);
          return [...tags, ...(parsedData.tags || [])];
        } catch (error) {
          console.error('Error parsing file:', file.name, error);
          return tags;
        }
      }, []);

      const uniqueTags = [...new Set(allTags)].sort();
      setAvailableTags(uniqueTags);
    } else {
      setAvailableTags([]);
    }
  }, [files]); 

  const filteredTags = availableTags.filter(tag =>
    tag.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleTag = (tag: string): void => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    onTagsChange(newTags);
  };

  const removeTag = (tagToRemove: string): void => {
    const newTags = selectedTags.filter(tag => tag !== tagToRemove);
    onTagsChange(newTags);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(event.target.value);
  };

  const handleNewTagChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setNewTag(event.target.value);
  };

  const handleNewTagSubmit = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter' && newTag.trim()) {
      const trimmedTag = newTag.trim();
      if (!selectedTags.includes(trimmedTag)) {
        onTagsChange([...selectedTags, trimmedTag]);
      }
      setNewTag('');
    }
  };

  const handleTagClick = (event: React.MouseEvent, tag: string): void => {
    event.stopPropagation();
    toggleTag(tag);
  };

  const handleTagRemove = (event: React.MouseEvent, tag: string): void => {
    event.stopPropagation();
    removeTag(tag);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex flex-wrap gap-2 min-h-[42px] p-2 border rounded-md bg-white">
        <div className="flex flex-wrap gap-2 flex-grow">
          {selectedTags.map(tag => (
            <span 
              key={tag} 
              className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm"
            >
              {tag}
              <button
                onClick={(e) => handleTagRemove(e, tag)}
                className="hover:text-blue-600"
                type="button"
                aria-label={`Remove ${tag} tag`}
              >
                <X size={14} />
              </button>
            </span>
          ))}
          
          {!isFileMode && (
            <input
              type="text"
              value={newTag}
              onChange={handleNewTagChange}
              onKeyDown={handleNewTagSubmit}
              placeholder="Enter tags here e.g. advanced-react"
              className="flex-grow outline-none border-none"
              aria-label="Enter new tag"
            />
          )}
        </div>
        
        {isFileMode && (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1 text-gray-500 hover:text-gray-700 ml-auto"
            type="button"
            aria-expanded={isOpen}
            aria-label="Toggle tag selection"
          >
            <ChevronDown size={20} />
          </button>
        )}
      </div>

      {isFileMode && isOpen && (
        <div 
          className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg"
          role="listbox"
          aria-label="Available tags"
        >
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search tags..."
            className="w-full p-2 border-b focus:outline-none"
            aria-label="Search tags"
          />
          
          <div className="max-h-48 overflow-y-auto">
            {filteredTags.length > 0 ? (
              filteredTags.map(tag => (
                <button
                  key={tag}
                  onClick={(e) => handleTagClick(e, tag)}
                  className="flex items-center justify-between w-full p-2 text-left hover:bg-gray-100"
                  role="option"
                  aria-selected={selectedTags.includes(tag)}
                  type="button"
                >
                  <span>{tag}</span>
                  {selectedTags.includes(tag) && <Check size={16} className="text-blue-600" />}
                </button>
              ))
            ) : (
              <div className="p-2 text-gray-500 text-center">
                No tags found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TagSelector;