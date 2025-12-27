
import { supabase, isSupabaseConfigured } from './supabase';
import { GeneratedContent, ArticleMetadata, SavedPrompt, Author } from './types';

const REGISTRY_KEY = 'zr_registry';
const ARTICLE_PREFIX = 'zr_article_';
const PROMPT_LIBRARY_KEY = 'zr_prompt_library';
const AUTHOR_KEY = 'zr_author_settings';

export const storageService = {
  // --- Author Settings ---
  saveAuthor(author: Author): void {
    localStorage.setItem(AUTHOR_KEY, JSON.stringify(author));
  },

  getAuthor(): Author {
    const saved = localStorage.getItem(AUTHOR_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse author", e);
      }
    }
    return {
      name: 'Anchor Admin',
      title: 'Head of Charts',
      bio: 'Professional magic user specializing in nautical authority synthesis.'
    };
  },

  // --- Article Storage ---
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
  },

  // --- Prompt Library Storage ---
  async savePrompt(prompt: SavedPrompt): Promise<void> {
    try {
      const existing = await this.getPrompts();
      const filtered = existing.filter(p => p.id !== prompt.id);
      const updated = [prompt, ...filtered];
      localStorage.setItem(PROMPT_LIBRARY_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save prompt:", e);
    }
  },

  async getPrompts(): Promise<SavedPrompt[]> {
    try {
      const raw = localStorage.getItem(PROMPT_LIBRARY_KEY) || '[]';
      return JSON.parse(raw);
    } catch (e) {
      console.error("Failed to load prompts:", e);
      return [];
    }
  },

  async deletePrompt(id: string): Promise<void> {
    try {
      const existing = await this.getPrompts();
      const updated = existing.filter(p => p.id !== id);
      localStorage.setItem(PROMPT_LIBRARY_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to delete prompt:", e);
    }
  }
};
