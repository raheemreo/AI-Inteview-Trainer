import React, { useState, useCallback } from 'react';
import WelcomeScreen from './WelcomeScreen';
import LanguageSelector from './LanguageSelector';
import RoleSelector from './RoleSelector';
import LevelSelector from './LevelSelector';
import InterviewScreen from './InterviewScreen';
import FeedbackScreen from './FeedbackScreen';
import type { InterviewState, LanguageCode, TranscriptMessage, JobRole, ExperienceLevel, InterviewFeedback } from '../types';

const App: React.FC = () => {
  const [interviewState, setInterviewState] = useState<InterviewState>('welcome');
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode | null>(null);
  const [selectedRole, setSelectedRole] = useState<JobRole | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<ExperienceLevel | null>(null);
  const [finalTranscript, setFinalTranscript] = useState<TranscriptMessage[]>([]);
  const [feedback, setFeedback] = useState<InterviewFeedback | null>(null);

  const handleGetStarted = useCallback(() => {
    setInterviewState('language-select');
  }, []);

  const handleLanguageSelect = useCallback((languageCode: LanguageCode) => {
    setSelectedLanguage(languageCode);
    setInterviewState('role-select');
  }, []);

  const handleRoleSelect = useCallback((role: JobRole) => {
    setSelectedRole(role);
    setInterviewState('level-select');
  }, []);
  
  const handleLevelSelect = useCallback((level: ExperienceLevel) => {
    setSelectedLevel(level);
    setInterviewState('in-progress');
  }, []);

  const handleInterviewEnd = useCallback((transcript: TranscriptMessage[], feedback: InterviewFeedback) => {
    setFinalTranscript(transcript);
    setFeedback(feedback);
    setInterviewState('feedback');
  }, []);

  const handleRestart = useCallback(() => {
    setSelectedLanguage(null);
    setSelectedRole(null);
    setSelectedLevel(null);
    setFinalTranscript([]);
    setFeedback(null);
    setInterviewState('welcome');
  }, []);

  const renderContent = () => {
    switch (interviewState) {
      case 'welcome':
        return <WelcomeScreen onGetStarted={handleGetStarted} />;
      case 'language-select':
        return <LanguageSelector onSelectLanguage={handleLanguageSelect} />;
      case 'role-select':
        return <RoleSelector onSelectRole={handleRoleSelect} />;
      case 'level-select':
        return <LevelSelector onSelectLevel={handleLevelSelect} />;
      case 'in-progress':
        if (!selectedLanguage || !selectedRole || !selectedLevel) {
            // Should not happen, but as a fallback
            setInterviewState('language-select');
            return null;
        }
        return <InterviewScreen language={selectedLanguage} role={selectedRole} level={selectedLevel} onInterviewEnd={handleInterviewEnd} onCancel={handleRestart} />;
      case 'feedback':
        if (!feedback) {
            // Should not happen, but as a fallback
            return (
                <div className="text-white">Error generating feedback. Please try again.</div>
            );
        }
        return <FeedbackScreen feedback={feedback} transcript={finalTranscript} onRestart={handleRestart} />;
      default:
        return <WelcomeScreen onGetStarted={handleGetStarted} />;
    }
  };

  return (
    <div className="bg-slate-900 min-h-screen flex flex-col items-center justify-center p-4 font-sans">
      {renderContent()}
    </div>
  );
};

export default App;