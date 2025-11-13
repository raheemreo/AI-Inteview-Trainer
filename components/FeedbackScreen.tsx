import React, { useState } from 'react';
import type { InterviewFeedback, TranscriptMessage } from '../types';

interface FeedbackScreenProps {
  feedback: InterviewFeedback;
  transcript: TranscriptMessage[];
  onRestart: () => void;
}

const FeedbackCard: React.FC<{ title: string; items: string[]; icon: string; color: string }> = ({ title, items, icon, color }) => (
    <div className="bg-slate-800 p-6 rounded-lg">
        <h3 className={`text-xl font-bold mb-4 flex items-center ${color}`}>
            <span className="mr-3 text-2xl">{icon}</span>
            {title}
        </h3>
        <ul className="space-y-2 list-inside">
            {items.map((item, index) => (
                <li key={index} className="text-slate-300 flex">
                    <span className="mr-2 text-green-400">✓</span>
                    <span>{item}</span>
                </li>
            ))}
        </ul>
    </div>
);


const FeedbackScreen: React.FC<FeedbackScreenProps> = ({ feedback, transcript, onRestart }) => {
    const [isTranscriptVisible, setIsTranscriptVisible] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-400';
        if (score >= 60) return 'text-yellow-400';
        return 'text-red-400';
    };

    const handleSave = () => {
        try {
            const report = {
                id: `report-${Date.now()}`,
                feedback,
                transcript,
                savedAt: new Date().toISOString(),
            };

            const existingReportsRaw = localStorage.getItem('ai-interview-reports');
            const existingReports = existingReportsRaw ? JSON.parse(existingReportsRaw) : [];
            
            existingReports.unshift(report);

            localStorage.setItem('ai-interview-reports', JSON.stringify(existingReports));
            setIsSaved(true);
        } catch (error) {
            console.error("Failed to save report to localStorage:", error);
            alert("Could not save the report. Your browser's storage might be full.");
        }
    };


  return (
    <div className="text-white w-full max-w-4xl mx-auto p-4 md:p-8 flex flex-col items-center">
        <h1 className="text-3xl font-bold text-center mb-4 text-slate-100">Interview Feedback Report</h1>
        <p className="text-center text-slate-300 mb-8">Here's a detailed breakdown of your performance.</p>

        <div className="w-full bg-slate-900/50 p-6 rounded-2xl border border-slate-700 mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
                <h2 className="text-2xl font-bold text-slate-100">Overall Score</h2>
                <p className="text-slate-400">A measure of your performance across all areas.</p>
            </div>
            <div className={`text-6xl font-bold ${getScoreColor(feedback.overallScore)}`}>
                {feedback.overallScore}<span className="text-4xl text-slate-400">/100</span>
            </div>
        </div>

        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
             <FeedbackCard title="What Went Well" items={feedback.strengths} icon="👍" color="text-green-400" />
             <FeedbackCard title="Areas for Improvement" items={feedback.areasForImprovement} icon="👎" color="text-red-400" />
        </div>
        
        <div className="w-full bg-slate-800 p-6 rounded-lg mb-8">
            <h3 className="text-xl font-bold mb-4 flex items-center text-blue-400">
                 <span className="mr-3 text-2xl">💡</span>
                Actionable Tips
            </h3>
            <ul className="space-y-2 list-inside">
                {feedback.actionableTips.map((tip, index) => (
                    <li key={index} className="text-slate-300 flex">
                        <span className="mr-2 text-blue-400">→</span>
                        <span>{tip}</span>
                    </li>
                ))}
            </ul>
        </div>
        
        <div className="w-full mb-8">
            <button
                onClick={() => setIsTranscriptVisible(!isTranscriptVisible)}
                className="w-full text-left p-4 bg-slate-800 hover:bg-slate-700 rounded-lg font-semibold text-slate-200 transition-colors"
            >
                {isTranscriptVisible ? 'Hide' : 'Show'} Full Interview Transcript
            </button>
            {isTranscriptVisible && (
                <div className="w-full bg-slate-800 rounded-b-lg p-6 mt-1 space-y-4 max-h-[40vh] overflow-y-auto">
                    {transcript.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`p-3 rounded-lg max-w-md ${msg.speaker === 'user' ? 'bg-blue-600' : 'bg-slate-700'}`}>
                                <p className="text-sm font-bold capitalize text-slate-300 mb-1">{msg.speaker === 'ai' ? 'Alex (Interviewer)' : 'You'}</p>
                                <p className="text-white">{msg.text}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
            <button
                onClick={handleSave}
                disabled={isSaved}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-full transition-colors duration-300 disabled:bg-green-800 disabled:cursor-not-allowed w-full sm:w-auto"
            >
                {isSaved ? '✓ Saved' : 'Save Report'}
            </button>
            <button
                onClick={onRestart}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full transition-colors duration-300 w-full sm:w-auto"
            >
                Start New Interview
            </button>
        </div>
    </div>
  );
};

export default FeedbackScreen;
