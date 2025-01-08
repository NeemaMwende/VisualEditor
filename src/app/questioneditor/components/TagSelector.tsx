import React, { useState, useEffect } from 'react';
import { parseMarkdownContent } from '../../../utils/markdownUtils';
import { Check, X, ChevronDown, Plus } from 'lucide-react';

interface FileData {
  name: string;
  content: string;
  path: string;
}

interface TagSelectorProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  files: FileData[];
  //className?: string;
}

const TagSelector: React.FC<TagSelectorProps> = ({ 
  selectedTags, 
  onTagsChange, 
  files,
  //className = "" 
}) => {
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [allUsedTags, setAllUsedTags] = useState<string[]>([]);
  
  useEffect(() => {
    const fileTags = files.reduce<string[]>((tags, file) => {
      try {
        const parsedData = parseMarkdownContent(file.content);
        return [...tags, ...(parsedData.tags || [])];
      } catch (error) {
        console.error('Error parsing file:', file.name, error);
        return tags;
      }
    }, []);

    const storedTags = JSON.parse(localStorage.getItem('usedTags') || '[]');
    
    const uniqueTags = [...new Set([...fileTags, ...storedTags])].sort();
    setAvailableTags(uniqueTags);
    setAllUsedTags(uniqueTags);
  }, [files]);

  const filteredTags = availableTags.filter(tag =>
    tag.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleTag = (tag: string): void => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    onTagsChange(newTags);
    setIsOpen(false);

    const updatedUsedTags = [...new Set([...allUsedTags, tag])];
    setAllUsedTags(updatedUsedTags);
    localStorage.setItem('usedTags', JSON.stringify(updatedUsedTags));
  };

  const removeTag = (tagToRemove: string): void => {
    const newTags = selectedTags.filter(tag => tag !== tagToRemove);
    onTagsChange(newTags);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(event.target.value);
  };

  const handleNewTagSubmit = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter' && searchTerm.trim()) {
      const trimmedTag = searchTerm.trim();
      if (!selectedTags.includes(trimmedTag)) {
        toggleTag(trimmedTag);
        setSearchTerm('');
      }
    }
  };

  return (
    <div className="relative w-full">
      <div className="flex flex-col gap-2">

        <div className="flex flex-wrap gap-2 min-h-[42px] p-2 border rounded-md bg-white shadow-sm hover:border-blue-400 transition-colors">
          {selectedTags.map(tag => (
            <span 
              key={tag} 
              className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium animate-fadeIn"
            >
              {tag}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(tag);
                }}
                className="hover:text-blue-600 transition-colors"
                type="button"
                aria-label={`Remove ${tag} tag`}
              >
                <X size={14} />
              </button>
            </span>
          ))}
          
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1 text-gray-500 hover:text-gray-700 ml-auto transition-colors"
            type="button"
            aria-expanded={isOpen}
            aria-label="Toggle tag selection"
          >
            <ChevronDown 
              size={20} 
              className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        {/* Dropdown for tag selection */}
        {isOpen && (
          <div 
            className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg animate-slideDown"
            role="listbox"
            aria-label="Available tags"
          >
            <div className="p-2 border-b">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onKeyDown={handleNewTagSubmit}
                  placeholder="Search or create new tag..."
                  className="w-full p-2 pr-8 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                  aria-label="Search tags"
                />
                {searchTerm && !filteredTags.includes(searchTerm) && (
                  <button
                    onClick={() => toggleTag(searchTerm)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-600 hover:text-blue-800"
                    type="button"
                  >
                    <Plus size={20} />
                  </button>
                )}
              </div>
            </div>
            
            <div className="max-h-48 overflow-y-auto">
              {filteredTags.length > 0 ? (
                filteredTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className="flex items-center justify-between w-full p-3 text-left hover:bg-gray-50 transition-colors"
                    role="option"
                    aria-selected={selectedTags.includes(tag)}
                    type="button"
                  >
                    <span>{tag}</span>
                    {selectedTags.includes(tag) && (
                      <Check size={16} className="text-blue-600" />
                    )}
                  </button>
                ))
              ) : (
                <div className="p-4 text-gray-500 text-center">
                  {searchTerm ? 'Press Enter to create new tag' : 'No tags available'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TagSelector;