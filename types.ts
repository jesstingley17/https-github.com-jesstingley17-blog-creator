
export interface ContentBrief {
  id: string;
  topic: string;
  companyUrl?: string;
  brandContext?: string;
  targetKeywords: string[];
  secondaryKeywords: string[];
  tags?: string[];
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

export interface ArticleMetadata {
  id: string;
  title: string;
  topic: string;
  score: number;
  status: 'Draft' | 'Published' | 'Review';
  updatedAt: number;
}

export interface GeneratedContent {
  id: string;
  brief: ContentBrief;
  outline: ContentOutline;
  content: string;
  analysis: SEOAnalysis | null;
  heroImageUrl: string | null;
  updatedAt: number;
}

export enum IntegrationPlatform {
  WORDPRESS = 'WordPress',
  GHOST = 'Ghost',
  WEBFLOW = 'Webflow',
  SHOPIFY = 'Shopify',
  CUSTOM = 'Custom Webhook'
}

export interface Integration {
  id: string;
  name: string;
  platform: IntegrationPlatform;
  baseUrl: string;
  apiKey: string;
  status: 'connected' | 'error' | 'inactive';
  lastSync?: number;
}

export enum AppRoute {
  DASHBOARD = 'dashboard',
  CREATE = 'create',
  EDITOR = 'editor',
  HISTORY = 'history',
  PLANNER = 'planner',
  INTEGRATIONS = 'integrations'
}
