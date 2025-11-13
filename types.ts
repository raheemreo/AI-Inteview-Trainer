export enum LanguageCode {
  EN = 'en-US',
  ML = 'ml-IN',
  HI = 'hi-IN',
  TA = 'ta-IN',
  TE = 'te-IN',
  KN = 'kn-IN',
}

export interface Language {
  code: LanguageCode;
  name: string;
  nativeName: string;
}

export type JobRole = 
  | 'Software Engineer' 
  | 'Marketing Specialist' 
  | 'Data Analyst' 
  | 'Product Manager' 
  | 'UX Designer' 
  | 'Project Manager'
  | 'Full Stack Developer'
  | 'Front-End Developer'
  | 'Back-End Developer'
  | 'Applications Developer'
  | 'Cyber Security Analyst'
  | 'Data Scientist'
  | 'AI/ML Engineer'
  | 'Digital Marketing Specialist'
  | 'E-commerce Specialist'
  | 'Cloud Engineer'
  | 'Junior Web Developer'
  | 'QA Tester';

export type ExperienceLevel = 'Entry-Level' | 'Mid-Career' | 'Senior';

export type InterviewState = 'welcome' | 'language-select' | 'role-select' | 'level-select' | 'in-progress' | 'feedback';

export interface TranscriptMessage {
  id: number;
  speaker: 'user' | 'ai';
  text: string;
}

export interface InterviewFeedback {
  overallScore: number;
  strengths: string[];
  areasForImprovement: string[];
  actionableTips: string[];
}