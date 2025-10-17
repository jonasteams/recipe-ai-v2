import React, { useState } from 'react';
import type { Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface SearchBarProps {
  onSearch: (searchTerm: string) => void;
  language: Language;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, language }) => {
  const [term, setTerm] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (term.trim()) {
      onSearch(term.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8 max-w-2xl mx-auto">
      <div className="relative">
        <input
          type="search"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder={TRANSLATIONS[language].searchPlaceholder}
          className="w-full p-4 pr-32 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-shadow"
        />
        <button
          type="submit"
          className="absolute top-1/2 -translate-y-1/2 right-2 bg-orange-500 text-white font-semibold py-2 px-6 rounded-full hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors"
        >
          {TRANSLATIONS[language].searchButton}
        </button>
      </div>
    </form>
  );
};