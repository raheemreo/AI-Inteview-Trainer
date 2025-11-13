import { Type } from '@google/genai';
import type { Language, JobRole, ExperienceLevel, TranscriptMessage } from './types';
import { LanguageCode } from './types';

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: LanguageCode.EN, name: 'English', nativeName: 'English' },
  { code: LanguageCode.ML, name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: LanguageCode.HI, name: 'Hindi', nativeName: 'हिन्दी' },
  { code: LanguageCode.TA, name: 'Tamil', nativeName: 'தமிழ்' },
  { code: LanguageCode.TE, name: 'Telugu', nativeName: 'తెలుగు' },
  { code: LanguageCode.KN, name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
];

export const JOB_ROLES: { name: JobRole; description: string }[] = [
    { name: 'Software Engineer', description: 'Designs, develops, and maintains software systems.' },
    { name: 'Full Stack Developer', description: 'Works with both the front-end and back-end of a web application.' },
    { name: 'Front-End Developer', description: 'Builds the user-facing parts of websites and web applications.' },
    { name: 'Back-End Developer', description: 'Manages the server-side logic and database of a web application.' },
    { name: 'Junior Web Developer', description: 'Assists in building and maintaining websites and web applications.' },
    { name: 'Applications Developer', description: 'Creates and modifies software applications for specific platforms.' },
    { name: 'Data Scientist', description: 'Uses scientific methods and algorithms to extract knowledge from data.' },
    { name: 'Data Analyst', description: 'Interprets data and turns it into information to improve a business.' },
    { name: 'AI/ML Engineer', description: 'Builds and deploys artificial intelligence and machine learning models.' },
    { name: 'Cyber Security Analyst', description: 'Protects computer networks and systems from security breaches.' },
    { name: 'Cloud Engineer', description: 'Manages and maintains cloud-based infrastructure and systems.' },
    { name: 'QA Tester', description: 'Ensures software quality by identifying bugs and issues before release.' },
    { name: 'Product Manager', description: 'Defines the why, when, and what of the product for the engineering team.' },
    { name: 'Project Manager', description: 'Plans, executes, and closes projects to achieve specific goals.' },
    { name: 'UX Designer', description: 'Focuses on the user experience and interaction with a product.' },
    { name: 'Marketing Specialist', description: 'Creates and executes marketing campaigns to promote products.' },
    { name: 'Digital Marketing Specialist', description: 'Manages online marketing strategy, including SEO, SEM, and social media.' },
    { name: 'E-commerce Specialist', description: 'Manages online sales strategies and the operations of an online store.' },
];
export const EXPERIENCE_LEVELS: ExperienceLevel[] = ['Entry-Level', 'Mid-Career', 'Senior'];

export const getSystemPrompt = (language: string, role: JobRole, level: ExperienceLevel): string => `You are a world-class, professional, polite, and supportive HR Manager named Alex, conducting a mock job interview.
The interview is for a ${level} ${role} position.
The entire conversation must be exclusively in ${language}.

Your task is to conduct the interview in a turn-by-turn manner. For each turn, you will provide a JSON object containing your feedback on the user's previous answer and your next question.

Here is the process:
1.  For the very first turn, introduce yourself and ask the first interview question. The feedback and score will be null.
2.  The user will provide an answer to your question.
3.  You will analyze their answer and provide a score (0-10) and concise, constructive feedback (2-3 sentences).
4.  You will then provide the next logical interview question.
5.  You will respond with a single JSON object that strictly follows the required schema. Do not add any extra text or formatting.

Ask a total of 5-7 questions, mixing behavioral, technical (if applicable), and situational questions. Include personality and hypothetical scenario questions.
Maintain a supportive and encouraging tone. Do not break character.
`;

export const TURN_RESPONSE_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        score: {
            type: Type.INTEGER,
            description: "A score for the user's last answer, from 0 to 10. Can be null for the first question."
        },
        feedback: {
            type: Type.STRING,
            description: "Specific, constructive feedback on the user's last answer. Should be concise (2-3 sentences). Can be null for the first question."
        },
        nextQuestion: {
            type: Type.STRING,
            description: "The next interview question to ask the user."
        }
    },
    required: ["score", "feedback", "nextQuestion"]
};


export const FEEDBACK_RESPONSE_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        overallScore: {
            type: Type.INTEGER,
            description: "An overall score for the user's performance, from 0 to 100."
        },
        strengths: {
            type: Type.ARRAY,
            items: {
                type: Type.STRING,
                description: "A specific, positive aspect of the user's performance."
            },
            description: "A list of 2-4 key strengths the user demonstrated."
        },
        areasForImprovement: {
            type: Type.ARRAY,
            items: {
                type: Type.STRING,
                description: "A specific, constructive point of criticism for the user."
            },
            description: "A list of 2-4 key areas where the user can improve."
        },
        actionableTips: {
            type: Type.ARRAY,
            items: {
                type: Type.STRING,
                description: "A concrete, actionable tip for the user to implement."
            },
            description: "A list of 2-4 practical tips for the user to improve their interview skills."
        }
    },
    required: ["overallScore", "strengths", "areasForImprovement", "actionableTips"]
};

export const getFeedbackPrompt = (transcript: TranscriptMessage[], language: string, role: JobRole, level: ExperienceLevel): string => {
    const conversation = transcript.map(msg => `${msg.speaker === 'ai' ? 'Interviewer' : 'Candidate'}: ${msg.text}`).join('\n');

    return `You are an expert career coach providing feedback on a mock job interview.
The interview was for a ${level} ${role} position.
The entire feedback report must be in ${language}.

Analyze the following interview transcript:
---
${conversation}
---

Based on the transcript, provide a comprehensive, constructive, and encouraging feedback report.
Evaluate the candidate's performance on clarity, confidence, relevance of answers, and communication skills.
Generate a JSON object that strictly follows the provided schema. Do not add any extra text or formatting outside of the JSON object.
`;
};
