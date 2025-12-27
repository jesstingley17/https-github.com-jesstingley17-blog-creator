
export interface Author {
  name: string;
  title: string;
  bio: string;
  photoUrl?: string;
}

export interface SavedPrompt {
  id: string;
  title: string;
  rawInput: string;
  optimizedPrompt: string;
  sourceUrl?: string;
  tags: string[];
  usageCount: number;
  createdAt: number;
}

export interface ContentBrief {
  id: string;
  topic: string;
  slug?: string;
  companyUrl?: string;
  brandContext?: string;
  competitorUrls: string[];
  backlinkUrls: string[];
  targetKeywords: string[];
  secondaryKeywords: string[];
  tags?: string[];
  audience: string;
  tone: string;
  length: 'short' | 'medium' | 'long';
  detailLevel: 'summary' | 'standard' | 'detailed';
  status: 'draft' | 'brief_ready' | 'outline_ready' | 'content_ready';
  author: Author;
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

export interface Citation {
  id: number;
  url: string;
  title: string;
  snippet?: string;
}

export interface BacklinkOpportunity {
  id: string;
  url: string;
  title: string;
  reason: string;
  authority: 'High' | 'Medium' | 'Emerging';
}

export interface ArticleImage {
  url: string;
  prompt: string;
  id: string;
  isHero: boolean;
}

export interface GeneratedContent {
  id: string;
  brief: ContentBrief;
  outline: ContentOutline;
  content: string;
  slug?: string;
  analysis: SEOAnalysis | null;
  heroImageUrl: string | null;
  images: ArticleImage[];
  citations: Citation[];
  backlinkOpportunities?: BacklinkOpportunity[];
  updatedAt: number;
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
  date: string;
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

export enum IntegrationPlatform {
  WORDPRESS = 'WordPress',
  GHOST = 'Ghost',
  WEBFLOW = 'Webflow',
  SHOPIFY = 'Shopify',
  SERPSTAT = 'Serpstat Backlinks API',
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
  INTEGRATIONS = 'integrations',
  SHARED = 'shared',
  PROMPTS = 'prompts'
}
