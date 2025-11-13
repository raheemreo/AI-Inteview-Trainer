
import React from 'react';
import { EXPERIENCE_LEVELS } from '../constants';
import type { ExperienceLevel } from '../types';

interface LevelSelectorProps {
  onSelectLevel: (level: ExperienceLevel) => void;
}

const LevelSelector: React.FC<LevelSelectorProps> = ({ onSelectLevel }) => {
  return (
    <div className="w-full max-w-4xl text-white">
      <h2 className="text-3xl font-bold text-center mb-2 text-slate-100">Select Experience Level</h2>
      <p className="text-center text-slate-300 mb-8">Choose the career level for your mock interview.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {EXPERIENCE_LEVELS.map((level) => (
          <button
            key={level}
            onClick={() => onSelectLevel(level)}
            className="bg-slate-800 p-6 rounded-lg text-center hover:bg-slate-700 border border-slate-700 hover:border-blue-500 transition-all duration-300 transform hover:-translate-y-1"
          >
            <p className="text-2xl font-semibold text-slate-100">{level}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default LevelSelector;
