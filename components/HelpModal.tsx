
import React from 'react';
import { CloseIcon } from './icons';

interface HelpModalProps {
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-slate-800 text-white w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl p-6 md:p-8 relative flex flex-col"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
          aria-label="Close help"
        >
          <CloseIcon className="w-6 h-6" />
        </button>
        <h2 className="text-3xl font-bold mb-6 text-slate-100">Help & FAQ</h2>
        <div className="overflow-y-auto pr-4 space-y-6">
          <section>
            <h3 className="text-xl font-semibold mb-2 text-blue-400">How It Works</h3>
            <p className="text-slate-300">
              Our AI Interview Trainer guides you through a realistic mock interview in a few simple steps:
            </p>
            <ol className="list-decimal list-inside space-y-2 mt-2 text-slate-300">
              <li><strong>Select Language:</strong> Choose the language for your interview.</li>
              <li><strong>Select Role & Level:</strong> Pick the job role and your experience level to get relevant questions.</li>
              <li><strong>Allow Microphone:</strong> Grant browser permission for your microphone so the AI can hear you.</li>
              <li><strong>Start Interviewing:</strong> The AI will ask you questions one by one. After each answer, it provides brief feedback and asks the next question.</li>
              <li><strong>Get Detailed Feedback:</strong> When you end the interview, you'll receive a comprehensive report with an overall score, strengths, areas for improvement, and actionable tips.</li>
            </ol>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-2 text-blue-400">Microphone Permissions</h3>
            <p className="text-slate-300 mb-2">
              If your microphone isn't working or you accidentally denied permission, you can fix it in your browser settings.
            </p>
            <p className="text-slate-400">
              Look for the <strong>lock icon (🔒)</strong> in your browser's address bar next to the website URL. Click it, find the Microphone setting, and change it to "Allow". You may need to refresh the page afterward.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-2 text-blue-400">Troubleshooting</h3>
            <ul className="space-y-3 text-slate-300">
              <li>
                <strong>The AI isn't responding:</strong> This could be a temporary connection issue. Try waiting a few seconds. If the problem persists, check your internet connection and try restarting the interview.
              </li>
              <li>
                <strong>"Connection Error" message:</strong> This usually means there was a problem connecting to the AI service. Please check your internet connection and ensure no firewalls are blocking the site. Sometimes, this can also indicate an issue with the API key.
              </li>
               <li>
                <strong>I can't hear the AI:</strong> Make sure your device's volume is turned up and not muted. Also, check that the correct audio output device is selected in your system settings.
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
