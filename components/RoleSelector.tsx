import React from 'react';
import { JOB_ROLES } from '../constants';
import type { JobRole } from '../types';

interface RoleSelectorProps {
  onSelectRole: (role: JobRole) => void;
}

const RoleSelector: React.FC<RoleSelectorProps> = ({ onSelectRole }) => {
  return (
    <div className="w-full max-w-5xl text-white">
      <h2 className="text-3xl font-bold text-center mb-2 text-slate-100">Select Job Role</h2>
      <p className="text-center text-slate-300 mb-8">Choose the role you want to practice for.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {JOB_ROLES.map((role) => (
          <button
            key={role.name}
            onClick={() => onSelectRole(role.name)}
            className="bg-slate-800 p-6 rounded-lg text-left hover:bg-slate-700 border border-slate-700 hover:border-blue-500 transition-all duration-300 transform hover:-translate-y-1"
          >
            <p className="text-xl font-semibold text-slate-100">{role.name}</p>
            <p className="text-sm text-slate-400 mt-2">{role.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default RoleSelector;