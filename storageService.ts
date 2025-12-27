
import { supabase, isSupabaseConfigured } from './supabase';
import { GeneratedContent, ArticleMetadata, ArticleImage } from './types';

const REGISTRY_KEY = 'zr_registry';
const ARTICLE_PREFIX = 'zr_article_';

export const storageService = {
  async upsertArticle(article: GeneratedContent): Promise<void> {
    const metadata: ArticleMetadata = {
      id: article.id,
      title: article.outline?.title || article.brief?.topic || 'Untitled',
      topic: article.brief?.topic || 'N/A',
      score: article.analysis?.score || 0,
      status: 'Draft',
      updatedAt: article.updatedAt
    };

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('articles')
          .upsert({
            id: article.id,
            brief: article.brief,
            outline: article.outline,
            content: article.content,
            analysis: article.analysis,
            hero_image_url: article.heroImageUrl || article.images?.find(img => img.isHero)?.url || null,
            images: article.images,
            citations: article.citations,
            updated_at: new Date(article.updatedAt).toISOString()
          });
        
        if (error) throw error;
      } catch (e) {
        console.error("Supabase sync failed:", e);
      }
    }

    localStorage.setItem(`${ARTICLE_PREFIX}${article.id}`, JSON.stringify(article));
    
    try {
      const registryRaw = localStorage.getItem(REGISTRY_KEY) || '[]';
      const registry: ArticleMetadata[] = JSON.parse(registryRaw);
      const filtered = registry.filter(a => a.id !== article.id);
      localStorage.setItem(REGISTRY_KEY, JSON.stringify([metadata, ...filtered].slice(0, 50)));
    } catch (e) {
      console.error("Registry update failed:", e);
    }
  },

  async getArticle(id: string): Promise<GeneratedContent | null> {
    const local = localStorage.getItem(`${ARTICLE_PREFIX}${id}`);
    if (local) {
      try {
        const parsed = JSON.parse(local);
        // Ensure mandatory arrays exist for legacy drafts
        if (!parsed.images) parsed.images = [];
        if (!parsed.citations) parsed.citations = [];
        return parsed as GeneratedContent;
      } catch (e) {
        console.error("Failed to parse local article:", e);
      }
    }

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('articles')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        if (data) {
          // Added citations property mapping from Supabase result
          const article: GeneratedContent = {
            id: data.id,
            brief: data.brief,
            outline: data.outline,
            content: data.content,
            analysis: data.analysis,
            heroImageUrl: data.hero_image_url,
            images: data.images || [],
            citations: data.citations || [],
            updatedAt: new Date(data.updated_at).getTime()
          };
          localStorage.setItem(`${ARTICLE_PREFIX}${id}`, JSON.stringify(article));
          return article;
        }
      } catch (e) {
        console.error("Supabase fetch failed:", e);
      }
    }

    return null;
  },

  async getRegistry(): Promise<ArticleMetadata[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('articles')
          .select('id, outline, brief, analysis, updated_at')
          .order('updated_at', { ascending: false })
          .limit(50);
        
        if (error) throw error;
        if (data) {
          const registry: ArticleMetadata[] = data.map(d => ({
            id: d.id,
            title: d.outline?.title || d.brief?.topic || 'Untitled',
            topic: d.brief?.topic || 'N/A',
            score: d.analysis?.score || 0,
            status: 'Draft',
            updatedAt: new Date(d.updated_at).getTime()
          }));
          localStorage.setItem(REGISTRY_KEY, JSON.stringify(registry));
          return registry;
        }
      } catch (e) {
        console.error("Supabase registry fetch failed:", e);
      }
    }

    try {
      const localRaw = localStorage.getItem(REGISTRY_KEY) || '[]';
      return JSON.parse(localRaw);
    } catch (e) {
      console.error("Registry load failed:", e);
      return [];
    }
  }
};
