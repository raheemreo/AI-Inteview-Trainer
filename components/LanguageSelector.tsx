import React, { useState } from 'react';
import { SUPPORTED_LANGUAGES } from '../constants';
import type { LanguageCode } from '../types';

interface LanguageSelectorProps {
  onSelectLanguage: (languageCode: LanguageCode) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ onSelectLanguage }) => {
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode | ''>('');

  const handleContinue = () => {
    if (selectedLanguage) {
      onSelectLanguage(selectedLanguage);
    }
  };

  return (
    <div className="w-full max-w-md text-white text-center">
      <h2 className="text-3xl font-bold mb-2 text-slate-100">Select Interview Language</h2>
      <p className="text-slate-300 mb-8">Choose the language you want to practice your interview in.</p>
      <div className="flex flex-col items-center gap-6">
        <select
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value as LanguageCode)}
          className="w-full bg-slate-800 border border-slate-700 text-white p-3 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-lg"
        >
          <option value="" disabled>Select a language...</option>
          {SUPPORTED_LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name} ({lang.nativeName})
            </option>
          ))}
        </select>
        <button
          onClick={handleContinue}
          disabled={!selectedLanguage}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 disabled:bg-slate-600 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default LanguageSelector;