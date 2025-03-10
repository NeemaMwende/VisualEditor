"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { DashboardQuestion } from '@/app/components/Interfaces';

interface QuestionSearchProps {
  onSearch: (searchTerm: string) => void;
  placeholder?: string;
  questions?: DashboardQuestion[];
  onQuestionSelect?: (questionId: string) => void;
}

const QuestionSearch: React.FC<QuestionSearchProps> = ({ 
  onSearch, 
  placeholder = "Search questions...",
  questions = [],
  onQuestionSelect
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('q') || '';
  
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [debouncedTerm, setDebouncedTerm] = useState(initialSearch);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  // Update URL when search changes
  const updateSearchParams = useCallback((term: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (term) {
      params.set('q', term);
    } else {
      params.delete('q');
    }
    
    const newPath = window.location.pathname + (params.toString() ? `?${params.toString()}` : '');
    router.push(newPath, { scroll: false });
  }, [searchParams, router]);

  // Handle input change with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
      updateSearchParams(searchTerm);
    }, 300); 

    return () => clearTimeout(timer);
  }, [searchTerm, updateSearchParams]);

  useEffect(() => {
    onSearch(debouncedTerm);
  }, [debouncedTerm, onSearch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter and get matching questions
  const getMatchingQuestions = () => {
    if (!searchTerm.trim() || !questions.length) return [];
    
    const term = searchTerm.toLowerCase().trim();
    return questions
      .filter(question => 
        question.title.toLowerCase().includes(term) || 
        question.question.toLowerCase().includes(term) ||
        question.tags.some(tag => tag.toLowerCase().includes(term)) ||
        question.answers.some(answer => answer.text.toLowerCase().includes(term))
      )
      .slice(0, 10); 
  };

  // Highlight matching text
  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text;
    
    const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === searchTerm.toLowerCase() 
        ? <mark key={i} className="bg-yellow-200 not-italic">{part}</mark> 
        : part
    );
  };

  // Get content snippet with context
  const getContentSnippet = (text: string, searchTerm: string, maxLength = 100) => {
    if (!text || !searchTerm.trim()) return text;
    
    const term = searchTerm.toLowerCase();
    const index = text.toLowerCase().indexOf(term);
    
    if (index === -1) return text.slice(0, maxLength) + '...';
    
    const start = Math.max(0, index - 40);
    const end = Math.min(text.length, index + term.length + 60);
    
    return (start > 0 ? '...' : '') + 
           text.slice(start, end) + 
           (end < text.length ? '...' : '');
  };

  const matchingQuestions = getMatchingQuestions();

  return (
    <div className="relative w-full" ref={searchRef}>
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <Search className="w-4 h-4 text-gray-400" />
      </div>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setIsDropdownOpen(Boolean(e.target.value));
        }}
        onFocus={() => {
          if (searchTerm) setIsDropdownOpen(true);
        }}
        placeholder={placeholder}
        className="w-full py-2 pl-10 pr-4 text-sm text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      {searchTerm && (
        <button
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
          onClick={() => {
            setSearchTerm('');
            setIsDropdownOpen(false);
          }}
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Search Results Dropdown */}
      {isDropdownOpen && searchTerm && matchingQuestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-y-auto">
          <div className="px-3 py-2 text-xs font-semibold text-gray-500 border-b">
            {matchingQuestions.length} matching question{matchingQuestions.length !== 1 ? 's' : ''}
          </div>
          <ul>
            {matchingQuestions.map((question) => (
              <li 
                key={question.id} 
                className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b"
                onClick={() => {
                  if (onQuestionSelect) {
                    onQuestionSelect(question.id);
                  }
                  setIsDropdownOpen(false);
                }}
              >
                <div className="font-medium text-sm mb-1">
                  {highlightText(question.title, searchTerm)}
                </div>
                <div className="text-xs text-gray-600 mb-1">
                  <span className="font-semibold">Question: </span>
                  <span className="italic">
                    {highlightText(getContentSnippet(question.question, searchTerm), searchTerm)}
                  </span>
                </div>
                {question.answers.some(answer => answer.text.toLowerCase().includes(searchTerm.toLowerCase())) && (
                  <div className="text-xs text-gray-600">
                    <span className="font-semibold">Answer: </span>
                    <span className="italic">
                      {highlightText(
                        getContentSnippet(
                          question.answers.find(answer => 
                            answer.text.toLowerCase().includes(searchTerm.toLowerCase())
                          )?.text || "", 
                          searchTerm
                        ),
                        searchTerm
                      )}
                    </span>
                  </div>
                )}
                <div className="mt-1 flex flex-wrap gap-1">
                  {question.tags.filter(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())).map((tag, idx) => (
                    <span key={idx} className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                      {highlightText(tag, searchTerm)}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default QuestionSearch;