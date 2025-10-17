import React from 'react';
import type { Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface FooterProps {
  language: Language;
}

export const Footer: React.FC<FooterProps> = ({ language }) => {
  return (
    <footer className="bg-white border-t mt-auto">
      <div className="container mx-auto px-4 py-6 text-center text-gray-500">
        <p>{TRANSLATIONS[language].poweredBy}</p>
        <a 
          href="mailto:help.recipeai@gmail.com"
          className="text-orange-600 hover:text-orange-700 hover:underline"
        >
          {TRANSLATIONS[language].contactUs}
        </a>
      </div>
    </footer>
  );
};