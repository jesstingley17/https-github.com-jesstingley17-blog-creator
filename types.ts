
export interface ContentBrief {
  id: string;
  topic: string;
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

export interface SEOAnalysis {
  score: number;
  readability: string;
  keywordDensity: Record<string, number>;
  suggestions: string[];
}

export interface GeneratedContent {
  id: string;
  briefId: string;
  title: string;
  body: string;
  analysis: SEOAnalysis;
  sources?: { uri: string; title: string }[];
}

export enum AppRoute {
  DASHBOARD = 'dashboard',
  CREATE = 'create',
  EDITOR = 'editor',
  HISTORY = 'history'
}
