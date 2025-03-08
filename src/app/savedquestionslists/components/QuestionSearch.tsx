"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';

interface QuestionSearchProps {
  onSearch: (searchTerm: string) => void;
  placeholder?: string;
}

const QuestionSearch: React.FC<QuestionSearchProps> = ({ 
  onSearch, 
  placeholder = "Search questions..." 
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('q') || '';
  
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [debouncedTerm, setDebouncedTerm] = useState(initialSearch);

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

  return (
    <div className="relative w-full max-w-md">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <Search className="w-4 h-4 text-gray-400" />
      </div>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder={placeholder}
        className="w-full py-2 pl-10 pr-4 text-sm text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      {searchTerm && (
        <button
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
          onClick={() => setSearchTerm('')}
        >
          <span className="text-xs font-medium">✕</span>
        </button>
      )}
    </div>
  );
};

export default QuestionSearch;