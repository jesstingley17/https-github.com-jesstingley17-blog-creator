import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { ContentBrief, ContentOutline, SEOAnalysis, ScheduledPost } from "./types";

/**
 * Factory to get a fresh AI instance with the current injected API key.
 * Strictly follows SDK guidelines to instantiate right before usage.
 */
const getAI = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const geminiService = {
  async ensureApiKey(): Promise<boolean> {
    // If we have an API key in the environment (Production/Vercel), we're good to go.
    if (process.env.API_KEY) return true;

    // Fallback for AI Studio interactive environment
    // @ts-ignore
    if (typeof window.aistudio !== 'undefined') {
      // @ts-ignore
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        // @ts-ignore
        await window.aistudio.openSelectKey();
        return true; // Proceed assuming selection success per race condition guidelines
      }
    }
    return true;
  },

  async generateBriefDetails(topic: string, companyUrl?: string): Promise<Partial<ContentBrief>> {
    await this.ensureApiKey();
    const ai = getAI();
    let prompt = `Act as an elite SEO Content Strategist. Analyze the topic "${topic}" and provide a deep semantic brief.`;
    
    if (companyUrl) {
      prompt += ` Conduct deep intelligence gathering on the brand at ${companyUrl} using Google Search. 
      Identify brand pillars, tone, audience segments, and value propositions. 
      Align all suggestions with their existing market positioning.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // High-reasoning model for strategy
      contents: prompt,
      config: {
        tools: companyUrl ? [{ googleSearch: {} }] : undefined,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            targetKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            secondaryKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            audience: { type: Type.STRING },
            tone: { type: Type.STRING },
            brandContext: { type: Type.STRING, description: "Deep summary of brand identity." }
          },
          required: ['targetKeywords', 'secondaryKeywords', 'audience', 'tone']
        }
      }
    });

    try {
      return JSON.parse(response.text || '{}');
    } catch (e) {
      console.error("Brief parsing error:", e);
      return {};
    }
  },

  async generateOutline(brief: ContentBrief): Promise<ContentOutline> {
    await this.ensureApiKey();
    const ai = getAI();
    const prompt = `Construct a detailed SEO-optimized hierarchical outline for: "${brief.topic}". 
    Target Audience: ${brief.audience}. 
    Tone: ${brief.tone}. 
    Core Keywords: ${brief.targetKeywords.join(', ')}.
    ${brief.brandContext ? `Brand Guardrails: ${brief.brandContext}` : ''}
    ${brief.companyUrl ? `Strategic Goal: Align with ${brief.companyUrl}` : ''}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            sections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  heading: { type: Type.STRING },
                  subheadings: { type: Type.ARRAY, items: { type: Type.STRING } },
                  keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              }
            }
          }
        }
      }
    });

    return JSON.parse(response.text || '{}');
  },

  async *streamContent(brief: ContentBrief, outline: ContentOutline) {
    await this.ensureApiKey();
    const ai = getAI();
    const prompt = `Write a world-class authoritative article. 
    Title: ${outline.title}
    Topic: ${brief.topic}
    Tone: ${brief.tone}
    Keywords: ${[...brief.targetKeywords, ...brief.secondaryKeywords].join(', ')}

    Requirements:
    1. Visual Hierarchy: Use clean H2/H3 Markdown.
    2. Data Viz: Include at least one Markdown comparison table.
    3. Strategic Insights: Use blockquotes (>) for 'Pro Tips'.
    4. Practicality: Use bulleted checklists.
    
    Cross-reference current facts using Google Search.`;

    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.7,
      }
    });

    for await (const chunk of responseStream) {
      yield chunk;
    }
  },

  async performWritingTask(task: 'rephrase' | 'expand' | 'summarize' | 'draft' | 'custom', text: string, context: string, customInstruction?: string): Promise<string> {
    await this.ensureApiKey();
    const ai = getAI();
    const prompts = {
      rephrase: `Politely rephrase this for high-end professional readability: "${text}"`,
      expand: `Elaborate with expert detail and nuance: "${text}"`,
      summarize: `Summarize for an executive briefing: "${text}"`,
      draft: `Synthesize a new section for topic "${text}" given context: "${context}"`,
      custom: `${customInstruction}. Context: "${context}". Target: "${text}"`
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompts[task],
    });

    return response.text || '';
  },

  async generateVisualBlock(type: 'table' | 'callout' | 'checklist', context: string): Promise<string> {
    await this.ensureApiKey();
    const ai = getAI();
    const prompts = {
      table: `Generate a high-contrast Markdown comparison table based on: "${context}". At least 3 columns.`,
      callout: `Create a profound Markdown blockquote (>) insight for: "${context}".`,
      checklist: `Generate a 5-step strategic checklist in Markdown for: "${context}".`
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompts[type],
    });

    return response.text || '';
  },

  async analyzeSEO(text: string, keywords: string[]): Promise<SEOAnalysis> {
    await this.ensureApiKey();
    const ai = getAI();
    const targetKeywords = keywords.length > 0 ? keywords : ['core topic'];

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Critically analyze this content for SEO excellence using keywords: ${targetKeywords.join(', ')}. Content: ${text.substring(0, 8000)}`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            readability: { type: Type.STRING },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            keywordSuggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  keyword: { type: Type.STRING },
                  action: { type: Type.STRING, description: "e.g., 'ADD', 'OPTIMIZE', 'LIMIT'" },
                  explanation: { type: Type.STRING, description: "Explain why this keyword improves search intent or semantic depth." }
                }
              }
            }
          },
          required: ['score', 'readability', 'suggestions', 'keywordSuggestions']
        }
      }
    });

    try {
      return JSON.parse(response.text || '{}');
    } catch (e) {
      return { score: 0, readability: 'Inconclusive', keywordDensity: {}, suggestions: [], keywordSuggestions: [] };
    }
  },

  async generateArticleImage(prompt: string): Promise<string> {
    await this.ensureApiKey();
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts: [{ text: prompt }] },
      config: { imageConfig: { aspectRatio: "16:9", imageSize: "1K" } }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("Asset generation failed");
  },

  async refineImagePrompt(currentPrompt: string, context: string): Promise<string> {
    await this.ensureApiKey();
    const ai = getAI();
    const prompt = `Refine this visual generation prompt to be more cinematic and professional. 
    Topic: "${context}"
    Current: "${currentPrompt}"
    Return ONLY the refined prompt.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text?.trim() || currentPrompt;
  },

  async suggestSchedule(articles: { id: string; title: string; topic: string }[]): Promise<{ articleId: string; date: string; platform: string }[]> {
    await this.ensureApiKey();
    const ai = getAI();
    const prompt = `Balance a 30-day distribution schedule for: ${JSON.stringify(articles)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              articleId: { type: Type.STRING },
              date: { type: Type.STRING },
              platform: { type: Type.STRING }
            }
          }
        }
      }
    });

    return JSON.parse(response.text || '[]');
  }
};