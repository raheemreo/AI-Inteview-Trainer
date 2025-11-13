import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import type { LanguageCode, JobRole, ExperienceLevel, InterviewFeedback, TranscriptMessage } from '../types';
import { getSystemPrompt, SUPPORTED_LANGUAGES, getFeedbackPrompt, FEEDBACK_RESPONSE_SCHEMA, TURN_RESPONSE_SCHEMA } from '../constants';
import { MicrophoneIcon, LoadingSpinner, SoundWaveIcon } from './icons';

interface InterviewScreenProps {
  language: LanguageCode;
  role: JobRole;
  level: ExperienceLevel;
  onInterviewEnd: (transcript: TranscriptMessage[], feedback: InterviewFeedback) => void;
  onCancel: () => void;
}

interface Turn {
    id: number;
    question: string;
    answer?: string;
    feedback?: string;
    score?: number;
}

type InterviewStatus = 'starting' | 'ai_speaking' | 'waiting_for_user' | 'recording' | 'processing_answer' | 'finished';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = "gemini-2.5-flash";

const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 1000;

// Helper function to handle API calls with retry logic for rate limiting
async function generateContentWithRetry(request: any) {
    let attempt = 0;
    while (attempt < MAX_RETRIES) {
        try {
            const response = await ai.models.generateContent(request);
            return response;
        } catch (error) {
            const errorString = String(error);
            // Check for 429 Resource Exhausted error, which indicates rate limiting
            if (errorString.includes('429') || errorString.includes('RESOURCE_EXHAUSTED')) {
                attempt++;
                if (attempt >= MAX_RETRIES) {
                    console.error("Max retries reached for rate-limited request. Failing.", error);
                    throw error; // Rethrow after max retries
                }
                // Use exponential backoff for delay
                const delay = INITIAL_DELAY_MS * Math.pow(2, attempt - 1);
                console.warn(`Rate limit error detected. Retrying in ${delay}ms... (Attempt ${attempt}/${MAX_RETRIES})`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                // For other non-retryable errors, throw immediately
                console.error("Non-retryable API error:", error);
                throw error;
            }
        }
    }
    // This line should not be reachable, but is a fallback
    throw new Error('generateContentWithRetry failed after all attempts.');
}


// Helper functions for audio decoding
function decode(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}


const InterviewScreen: React.FC<InterviewScreenProps> = ({ language, role, level, onInterviewEnd, onCancel }) => {
    const [status, setStatus] = useState<InterviewStatus>('starting');
    const [turns, setTurns] = useState<Turn[]>([]);
    const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
    const [finalAnswer, setFinalAnswer] = useState<string | null>(null);

    const transcriptEndRef = useRef<HTMLDivElement>(null);
    const conversationHistoryRef = useRef<any[]>([]);
    const recognitionRef = useRef<any | null>(null);
    
    // Refs for audio visualization
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animationFrameIdRef = useRef<number | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const languageName = SUPPORTED_LANGUAGES.find(lang => lang.code === language)?.name || 'English';

    const stopMicrophoneVisualization = useCallback(() => {
        if (animationFrameIdRef.current) {
            cancelAnimationFrame(animationFrameIdRef.current);
            animationFrameIdRef.current = null;
        }
        if (canvasRef.current) {
            const canvasCtx = canvasRef.current.getContext('2d');
            canvasCtx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
        streamRef.current?.getTracks().forEach(track => track.stop());
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
             audioContextRef.current.close().catch(console.error);
        }
        streamRef.current = null;
        audioContextRef.current = null;
        analyserRef.current = null;
    }, []);

    // Effect to initialize SpeechRecognition and set event handlers
    useEffect(() => {
        const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognitionAPI) {
            console.error("Speech Recognition API is not supported in this browser.");
            // Optionally, set an error state to inform the user
            return;
        }

        const recognition = new SpeechRecognitionAPI();
        recognitionRef.current = recognition;
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = language;

        let transcript = '';
        recognition.onresult = (event: any) => {
            transcript = event.results[0][0].transcript;
        };

        recognition.onend = () => {
            stopMicrophoneVisualization();
            if (transcript) {
                setFinalAnswer(transcript); // Trigger submission via useEffect
            } else {
                setStatus('waiting_for_user');
            }
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            stopMicrophoneVisualization();
            setStatus('waiting_for_user');
        };

        // Cleanup on unmount
        return () => {
            if (recognitionRef.current) {
                 recognitionRef.current.abort();
            }
        };
    }, [language, stopMicrophoneVisualization]);


    const speakText = useCallback(async (text: string) => {
        if (!text) return;
        setStatus('ai_speaking');
        try {
            const response = await generateContentWithRetry({
                model: "gemini-2.5-flash-preview-tts",
                contents: [{ parts: [{ text }] }],
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: { voiceName: 'Kore' },
                        },
                    },
                },
            });
            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
                const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                const audioBuffer = await decodeAudioData(
                    decode(base64Audio),
                    outputAudioContext,
                    24000,
                    1,
                );
                const source = outputAudioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputAudioContext.destination);
                source.start();
                source.onended = () => {
                    setStatus('waiting_for_user');
                    outputAudioContext.close();
                };
            } else {
                setStatus('waiting_for_user');
            }
        } catch (error) {
            console.error("Error generating speech:", error);
            setStatus('waiting_for_user');
        }
    }, []);

    const startInterview = useCallback(async () => {
        setStatus('processing_answer');
        const systemInstruction = getSystemPrompt(languageName, role, level);

        try {
            const response = await generateContentWithRetry({
                model,
                contents: [{ role: 'user', parts: [{ text: "Start the interview." }] }],
                config: {
                    systemInstruction,
                    responseMimeType: "application/json",
                    responseSchema: TURN_RESPONSE_SCHEMA,
                },
            });
            const turnData = JSON.parse(response.text);
            const firstQuestion = turnData.nextQuestion;
            setTurns([{ id: Date.now(), question: firstQuestion }]);
            conversationHistoryRef.current = [
                { role: 'user', parts: [{ text: "Start the interview." }] },
                { role: 'model', parts: [{ text: JSON.stringify(turnData) }] }
            ];
            await speakText(firstQuestion);
        } catch (error) {
            console.error("Error starting interview:", error);
            setStatus('finished');
        }
    }, [languageName, role, level, speakText]);

    const handleAnswerSubmit = useCallback(async (answer: string) => {
        if (!answer.trim()) {
            setStatus('waiting_for_user');
            return;
        }
    
        setStatus('processing_answer');
    
        const currentTurnId = turns[turns.length - 1].id;
        setTurns(prev => prev.map(t => t.id === currentTurnId ? { ...t, answer } : t));
    
        const updatedHistory = [...conversationHistoryRef.current, { role: 'user', parts: [{ text: answer }] }];
    
        try {
            const response = await generateContentWithRetry({
                model,
                contents: updatedHistory,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: TURN_RESPONSE_SCHEMA,
                },
            });
    
            const turnData = JSON.parse(response.text);
    
            setTurns(prevTurns => {
                const lastTurnIndex = prevTurns.length - 1;
                const updatedLastTurn = { ...prevTurns[lastTurnIndex], feedback: turnData.feedback, score: turnData.score };
    
                if (turnData.nextQuestion) {
                    return [...prevTurns.slice(0, lastTurnIndex), updatedLastTurn, { id: Date.now(), question: turnData.nextQuestion }];
                }
                return [...prevTurns.slice(0, lastTurnIndex), updatedLastTurn];
            });
    
            conversationHistoryRef.current = [...updatedHistory, { role: 'model', parts: [{ text: JSON.stringify(turnData) }] }];
            
            if (turnData.nextQuestion) {
                await speakText(turnData.nextQuestion);
            } else {
                setStatus('finished');
            }
    
        } catch (error) {
            console.error("Error processing answer:", error);
            setStatus('waiting_for_user');
        } finally {
            setFinalAnswer(null); // Reset trigger
        }
    }, [turns, speakText]);

    // Effect to trigger submission when a final answer is transcribed
    useEffect(() => {
        if (finalAnswer) {
            handleAnswerSubmit(finalAnswer);
        }
    }, [finalAnswer, handleAnswerSubmit]);

    // Effect to start the interview on mount
    useEffect(() => {
        startInterview();
    }, [startInterview]);
    
    const handleToggleRecording = async () => {
        const recognition = recognitionRef.current;
        if (!recognition) return;

        if (status === 'recording') {
            recognition.stop();
        } else if (status === 'waiting_for_user') {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                streamRef.current = stream;

                const context = new (window.AudioContext || (window as any).webkitAudioContext)();
                audioContextRef.current = context;

                const source = context.createMediaStreamSource(stream);
                const analyser = context.createAnalyser();
                analyser.fftSize = 2048; // A good value for a smooth waveform
                source.connect(analyser);
                analyserRef.current = analyser;

                const visualize = () => {
                    if (!analyserRef.current || !canvasRef.current) return;
                    const canvas = canvasRef.current;
                    const canvasCtx = canvas.getContext('2d');
                    if (!canvasCtx) return;

                    const analyser = analyserRef.current;
                    const bufferLength = analyser.fftSize;
                    const dataArray = new Uint8Array(bufferLength);
                    analyser.getByteTimeDomainData(dataArray);

                    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
                    
                    const gradient = canvasCtx.createLinearGradient(0, 0, canvas.width, 0);
                    gradient.addColorStop(0, '#60A5FA'); // blue-400
                    gradient.addColorStop(0.5, '#3B82F6'); // blue-500
                    gradient.addColorStop(1, '#2563EB'); // blue-600

                    canvasCtx.lineWidth = 2.5;
                    canvasCtx.strokeStyle = gradient;
                    canvasCtx.lineCap = 'round';
                    canvasCtx.lineJoin = 'round';

                    canvasCtx.beginPath();

                    const sliceWidth = canvas.width * 1.0 / bufferLength;
                    let x = 0;

                    for (let i = 0; i < bufferLength; i++) {
                        // Normalize and scale the waveform
                        const v = (dataArray[i] / 128.0) - 1.0;
                        const y = canvas.height / 2 + v * (canvas.height / 2.2);

                        if (i === 0) {
                            canvasCtx.moveTo(x, y);
                        } else {
                            canvasCtx.lineTo(x, y);
                        }
                        x += sliceWidth;
                    }

                    canvasCtx.stroke();
                    animationFrameIdRef.current = requestAnimationFrame(visualize);
                };
                visualize();

                setStatus('recording');
                recognition.start();

            } catch (err) {
                console.error("Error accessing microphone:", err);
                alert("Could not access the microphone. Please check your browser permissions.");
            }
        }
    };


    const handleEndInterview = async () => {
        setIsGeneratingFeedback(true);
        setStatus('finished');
        
        const finalTranscript = turns.reduce((acc, turn) => {
            acc.push({ id: turn.id, speaker: 'ai', text: turn.question });
            if (turn.answer) {
                 acc.push({ id: turn.id + 1, speaker: 'user', text: turn.answer });
            }
            return acc;
        }, [] as TranscriptMessage[]);

        try {
            const prompt = getFeedbackPrompt(finalTranscript, languageName, role, level);
            const response = await generateContentWithRetry({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: FEEDBACK_RESPONSE_SCHEMA,
                },
            });

            const feedbackJson = JSON.parse(response.text);
            onInterviewEnd(finalTranscript, feedbackJson);
        } catch (error) {
            console.error("Error generating feedback:", error);
            const fallbackFeedback: InterviewFeedback = {
                overallScore: 0,
                strengths: ["Could not generate feedback."],
                areasForImprovement: ["There was an error analyzing the transcript."],
                actionableTips: ["Please try another interview."],
            };
            onInterviewEnd(finalTranscript, fallbackFeedback);
        } finally {
            setIsGeneratingFeedback(false);
        }
    };
    
     useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [turns]);

    return (
        <div className="w-full max-w-4xl h-[90vh] flex flex-col bg-slate-800 rounded-2xl shadow-2xl p-4 md:p-6 text-white">
            <div className="flex-grow overflow-y-auto pr-2 space-y-6 mb-4">
                {turns.map((turn, index) => (
                    <div key={turn.id}>
                        <div className="flex justify-start">
                            <div className="p-3 rounded-lg bg-slate-700 max-w-lg">
                                <p className="text-xs font-bold text-slate-300 mb-1 flex items-center">
                                    Alex (Interviewer)
                                    {status === 'ai_speaking' && index === turns.length - 1 && (
                                        <SoundWaveIcon className="w-4 h-4 text-blue-400 ml-2" />
                                    )}
                                </p>
                                <p className="text-white">{turn.question}</p>
                            </div>
                        </div>

                        {turn.answer && (
                            <div className="flex justify-end mt-4">
                                <div className="p-3 rounded-lg bg-blue-600 max-w-lg">
                                    <p className="text-xs font-bold text-slate-200 mb-1 text-right">You</p>
                                    <p className="text-white">{turn.answer}</p>
                                </div>
                            </div>
                        )}
                        
                        {turn.feedback && (
                             <div className="mt-4 border-l-4 border-yellow-500 bg-slate-700/50 p-4 rounded-r-lg">
                                <p className="font-bold text-yellow-400">Feedback (Score: {turn.score}/10)</p>
                                <p className="text-slate-300 mt-1">{turn.feedback}</p>
                             </div>
                        )}
                    </div>
                ))}
                 <div ref={transcriptEndRef} />
            </div>

            <div className="flex-shrink-0 pt-4 border-t border-slate-700">
                {status === 'starting' || status === 'processing_answer' || status === 'ai_speaking' ? (
                     <div className="flex items-center justify-center space-x-3 h-28">
                        {status === 'ai_speaking' ? <SoundWaveIcon className="w-8 h-8 text-blue-400" /> : <LoadingSpinner className="w-8 h-8 text-slate-400" />}
                        <span className="text-slate-400 text-lg">
                            {status === 'starting' && 'Starting interview...'}
                            {status === 'processing_answer' && 'AI is analyzing...'}
                            {status === 'ai_speaking' && 'Alex is speaking...'}
                        </span>
                     </div>
                ) : !isGeneratingFeedback && status !== 'finished' ? (
                    <div className="flex flex-col items-center justify-center h-28">
                        {status === 'recording' ? (
                            <div className="w-full h-20 flex justify-center items-center">
                                <canvas ref={canvasRef} width="300" height="60" className="w-full max-w-xs"></canvas>
                            </div>
                        ) : (
                            <p className="text-slate-400 mb-4">Click the microphone to record your answer</p>
                        )}
                         <button
                            onClick={handleToggleRecording}
                            disabled={status !== 'waiting_for_user' && status !== 'recording'}
                            className={`p-4 rounded-full transition-colors duration-200 ${status === 'recording' ? 'bg-red-500 animate-pulse' : 'bg-blue-600 hover:bg-blue-700'} disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-600`}
                            title={status === 'recording' ? "Stop Recording" : "Record Answer"}
                         >
                            <MicrophoneIcon className="w-8 h-8 text-white" />
                         </button>
                    </div>
                ) : null}

                 <div className="mt-4 flex items-center justify-center space-x-4">
                    <button
                        onClick={onCancel}
                        disabled={isGeneratingFeedback}
                        className="bg-slate-600 hover:bg-slate-700 text-white font-bold py-2 px-6 rounded-full transition-colors duration-300 disabled:bg-slate-500 disabled:cursor-not-allowed"
                    >
                        Cancel Interview
                    </button>
                    <button
                        onClick={handleEndInterview}
                        disabled={status === 'starting' || status === 'recording' || status === 'ai_speaking' || isGeneratingFeedback}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-full transition-colors duration-300 disabled:bg-slate-600 disabled:cursor-not-allowed"
                    >
                        {isGeneratingFeedback ? 'Generating Report...' : 'End Interview & Get Report'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InterviewScreen;