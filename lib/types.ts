export interface ParsedResume {
  rawText: string;
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  summary?: string;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: string[];
  certifications: string[];
  sections: string[];
}

export interface ExperienceItem {
  title?: string;
  company?: string;
  duration?: string;
  bullets: string[];
}

export interface EducationItem {
  degree?: string;
  institution?: string;
  year?: string;
  gpa?: string;
}

export interface ATSScore {
  score: number;
  hasEmail: boolean;
  hasPhone: boolean;
  hasLinkedIn: boolean;
  noTables: boolean;
  noImages: boolean;
  standardSections: boolean;
  cleanFormatting: boolean;
  issues: string[];
  suggestions: string[];
}

export interface ContentScore {
  score: number;
  actionVerbScore: number;
  quantificationScore: number;
  accomplishmentScore: number;
  redundancyScore: number;
  issues: string[];
  suggestions: string[];
}

export interface KeywordScore {
  score: number;
  foundKeywords: string[];
  missingKeywords: string[];
  keywordDensity: number;
  issues: string[];
  suggestions: string[];
}

export interface FormatScore {
  score: number;
  lengthScore: number;
  sectionScore: number;
  consistencyScore: number;
  issues: string[];
  suggestions: string[];
}

export interface SkillCategory {
  technical: string[];
  soft: string[];
  tools: string[];
  languages: string[];
}

export interface JobMatchResult {
  matchPercentage: number;
  technicalMatch: number;
  softSkillMatch: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  transferableSkills: string[];
  suggestions: string[];
}

export interface AnalysisResult {
  parsed: ParsedResume;
  atsScore: ATSScore;
  contentScore: ContentScore;
  keywordScore: KeywordScore;
  formatScore: FormatScore;
  overallScore: number;
  skills: SkillCategory;
  jobMatch?: JobMatchResult;
  industry?: string;
  experienceLevel?: string;
  aiSuggestions?: string[];
  interviewQuestions?: string[];
  coverLetter?: string;
}
