
export interface ContentBrief {
  id: string;
  topic: string;
  companyUrl?: string;
  brandContext?: string;
  targetKeywords: string[];
  secondaryKeywords: string[];
  audience: string;
  tone: string;
  length: 'short' | 'medium' | 'long';
  status: 'draft' | 'brief_ready' | 'outline_ready' | 'content_ready';
  createdAt: number;
}

export interface ContentOutline {
  title: string;
  sections: {
    heading: string;
    subheadings: string[];
    keyPoints: string[];
  }[];
}

export interface KeywordSuggestion {
  keyword: string;
  action: string;
  explanation: string;
}

export interface SEOAnalysis {
  score: number;
  readability: string;
  keywordDensity: Record<string, number>;
  suggestions: string[];
  keywordSuggestions: KeywordSuggestion[];
}

export interface ScheduledPost {
  id: string;
  articleId: string;
  title: string;
  date: string; // ISO format
  platform: 'LinkedIn' | 'Twitter' | 'Facebook' | 'Blog';
}

export interface GeneratedContent {
  id: string;
  briefId: string;
  title: string;
  body: string;
  analysis: SEOAnalysis;
  sources?: { uri: string; title: string }[];
  scheduledDate?: string;
}

export enum AppRoute {
  DASHBOARD = 'dashboard',
  CREATE = 'create',
  EDITOR = 'editor',
  HISTORY = 'history',
  PLANNER = 'planner'
}
