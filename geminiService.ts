
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { ContentBrief, ContentOutline, SEOAnalysis, ScheduledPost } from "./types";

/**
 * Factory to get a fresh AI instance with the current injected API key.
 * Strictly follows SDK guidelines to instantiate right before usage.
 */
const getAI = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * Utility to clean AI response text of markdown artifacts before parsing.
 */
const cleanJsonString = (text: string) => {
  return text.replace(/```json/g, '').replace(/```/g, '').trim();
};

export const geminiService = {
  async ensureApiKey(): Promise<boolean> {
    if (process.env.API_KEY) return true;
    // @ts-ignore
    if (typeof window.aistudio !== 'undefined') {
      // @ts-ignore
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        // @ts-ignore
        await window.aistudio.openSelectKey();
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

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview', 
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

      return JSON.parse(cleanJsonString(response.text || '{}'));
    } catch (e) {
      console.error("Brief generation error:", e);
      return {
        targetKeywords: [topic],
        secondaryKeywords: [],
        audience: 'General Audience',
        tone: 'Professional'
      };
    }
  },

  async generateOutline(brief: ContentBrief): Promise<ContentOutline> {
    await this.ensureApiKey();
    const ai = getAI();
    const prompt = `Construct a detailed SEO-optimized hierarchical outline for: "${brief.topic}". 
    Target Audience: ${brief.audience}. 
    Tone: ${brief.tone}. 
    Core Keywords: ${brief.targetKeywords.join(', ')}.
    ${brief.brandContext ? `Brand Guardrails: ${brief.brandContext}` : ''}`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
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
            },
            required: ['title', 'sections']
          }
        }
      });

      const parsed = JSON.parse(cleanJsonString(response.text || '{}'));
      return {
        title: parsed.title || brief.topic,
        sections: parsed.sections || []
      };
    } catch (e) {
      console.error("Outline generation error:", e);
      return {
        title: brief.topic,
        sections: [{ heading: 'Introduction', subheadings: [], keyPoints: [] }]
      };
    }
  },

  async *streamContent(brief: ContentBrief, outline: ContentOutline) {
    await this.ensureApiKey();
    const ai = getAI();
    const prompt = `Write a world-class authoritative article. 
    Title: ${outline.title}
    Topic: ${brief.topic}
    Tone: ${brief.tone}
    Keywords: ${[...(brief.targetKeywords || []), ...(brief.secondaryKeywords || [])].join(', ')}

    Requirements:
    1. Visual Hierarchy: Use clean H2/H3 Markdown.
    2. Data Viz: Include at least one Markdown comparison table.
    3. Strategic Insights: Use blockquotes (>) for 'Pro Tips'.
    4. Practicality: Use bulleted checklists.
    
    Cross-reference current facts using Google Search.`;

    try {
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
    } catch (e) {
      console.error("Content stream error:", e);
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
    const targetKeywords = keywords?.length > 0 ? keywords : ['core topic'];

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
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
                    action: { type: Type.STRING },
                    explanation: { type: Type.STRING }
                  }
                }
              }
            },
            required: ['score', 'readability', 'suggestions', 'keywordSuggestions']
          }
        }
      });

      const parsed = JSON.parse(cleanJsonString(response.text || '{}'));
      return {
        score: parsed.score || 0,
        readability: parsed.readability || 'Unknown',
        keywordDensity: {},
        suggestions: parsed.suggestions || [],
        keywordSuggestions: parsed.keywordSuggestions || []
      };
    } catch (e) {
      console.error("SEO Analysis error:", e);
      return { score: 0, readability: 'Error', keywordDensity: {}, suggestions: [], keywordSuggestions: [] };
    }
  },

  // Added suggestSchedule method to handle AI-powered content scheduling
  async suggestSchedule(articles: { id: string, title: string, topic: string }[]): Promise<{ articleId: string, date: string, platform: string }[]> {
    await this.ensureApiKey();
    const ai = getAI();
    const prompt = `Suggest an optimized social media posting schedule for these articles: ${JSON.stringify(articles)}. 
    Suggest a date within the next 14 days and a distribution platform (LinkedIn, Twitter, Facebook, or Blog) for each article. 
    Aim for high engagement by spacing them out logically.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                articleId: { type: Type.STRING },
                date: { type: Type.STRING, description: 'ISO format date string' },
                platform: { type: Type.STRING, description: 'One of: LinkedIn, Twitter, Facebook, Blog' }
              },
              required: ['articleId', 'date', 'platform']
            }
          }
        }
      });

      return JSON.parse(cleanJsonString(response.text || '[]'));
    } catch (e) {
      console.error("Schedule suggestion error:", e);
      return [];
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

    if (response?.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
      }
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
  }
};
