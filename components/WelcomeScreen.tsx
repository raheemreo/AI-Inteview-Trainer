
import React, { useState } from 'react';
import HelpModal from './HelpModal';

interface WelcomeScreenProps {
  onGetStarted: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onGetStarted }) => {
  const [isHelpVisible, setIsHelpVisible] = useState(false);

  return (
    <>
      <div className="text-center text-white flex flex-col items-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-slate-100">Welcome to the AI Interview Trainer</h1>
        <p className="text-lg md:text-xl text-slate-300 max-w-2xl mb-8">
          Practice mock interviews in English, Malayalam, Hindi, Tamil, Telugu, and Kannada with our professional AI coach. Get instant, supportive feedback to ace your next job interview.
        </p>
        <button
          onClick={onGetStarted}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full transition-transform duration-300 transform hover:scale-105"
        >
          Get Started
        </button>
        <button
          onClick={() => setIsHelpVisible(true)}
          className="mt-6 text-slate-400 hover:text-blue-400 transition-colors"
        >
          How does this work? (Help & FAQ)
        </button>
      </div>

      {isHelpVisible && <HelpModal onClose={() => setIsHelpVisible(false)} />}
    </>
  );
};

export default WelcomeScreen;
