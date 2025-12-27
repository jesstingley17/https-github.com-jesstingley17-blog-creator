
import { GoogleGenAI, Type } from "@google/genai";
import { ContentBrief, ContentOutline, SEOAnalysis, BacklinkOpportunity } from "./types";

const getAI = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const extractJson = (text: string) => {
  if (!text) return null;
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    const arrayMatch = text.match(/\[[\s\S]*\]/);
    if (arrayMatch) return JSON.parse(arrayMatch[0]);
    return JSON.parse(text);
  } catch (e) {
    console.error("JSON parse failed. Raw text:", text);
    return null;
  }
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

  async deepResearch(urlOrTopic: string): Promise<Partial<ContentBrief>> {
    await this.ensureApiKey();
    const ai = getAI();
    const prompt = `Perform deep SEO research for: "${urlOrTopic}".
    1. Identify the core topic.
    2. Find 3-5 top organic competitors for this topic/site.
    3. Suggest 3-5 high-authority URLs for potential backlink injection or citation.
    4. Extract 5 target keywords and 5 secondary keywords.
    Return as JSON.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              topic: { type: Type.STRING },
              competitorUrls: { type: Type.ARRAY, items: { type: Type.STRING } },
              backlinkUrls: { type: Type.ARRAY, items: { type: Type.STRING } },
              targetKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
              secondaryKeywords: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ['topic', 'competitorUrls', 'backlinkUrls', 'targetKeywords', 'secondaryKeywords']
          }
        }
      });
      return extractJson(response.text || '{}');
    } catch (e) {
      return { competitorUrls: [], backlinkUrls: [], targetKeywords: [], secondaryKeywords: [] };
    }
  },

  async discoverBacklinks(topic: string, keywords: string[]): Promise<BacklinkOpportunity[]> {
    await this.ensureApiKey();
    const ai = getAI();
    const prompt = `Act as an SEO link-building specialist. 
    Topic: "${topic}". 
    Keywords: ${keywords.join(', ')}. 
    Find 5-7 high-authority websites and specific pages that would be perfect for backlink outreach or content guest posting.
    Return as JSON.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                url: { type: Type.STRING },
                reason: { type: Type.STRING, description: 'Why this is a good backlink opportunity' },
                authority: { type: Type.STRING, enum: ['High', 'Medium', 'Emerging'] }
              },
              required: ['title', 'url', 'reason', 'authority']
            }
          }
        }
      });
      const data = extractJson(response.text || '[]');
      return (data || []).map((item: any) => ({
        ...item,
        id: Math.random().toString(36).substring(2, 11)
      }));
    } catch (e) {
      console.error("Backlink discovery failed:", e);
      return [];
    }
  },

  async refineTextWithContext(text: string, title: string, tone: string, author: any): Promise<string> {
    await this.ensureApiKey();
    const ai = getAI();
    const prompt = `Act as ${author.name} (${author.title}). 
    RE-SYNTHESIZE the following raw research/notes to fit perfectly into an article titled "${title}".
    Tone: ${tone}.
    Instruction: Rephrase sentences for maximum authority, improve flow, and naturally weave in professional insights.
    Raw Notes: "${text}".
    Output only the refined version in high-quality Markdown.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt
      });
      return response.text || text;
    } catch (e) {
      return text;
    }
  },

  async generateOutline(brief: ContentBrief): Promise<ContentOutline> {
    await this.ensureApiKey();
    const ai = getAI();
    const prompt = `Generate a high-authority article outline for: "${brief.topic}". 
    Target Keywords: ${brief.targetKeywords.join(', ')}.
    Author: ${brief.author.name}, ${brief.author.title}.
    Ensure 5-8 major sections. Plan for at least 2 detailed Markdown tables.`;

    try {
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
                    subheadings: { type: Type.ARRAY, items: { type: Type.STRING } }
                  }
                }
              }
            }
          }
        }
      });
      return extractJson(response.text || '{}');
    } catch (e) {
      return { title: brief.topic, sections: [] };
    }
  },

  async *streamContent(brief: ContentBrief, outline: ContentOutline) {
    try {
      await this.ensureApiKey();
      const ai = getAI();
      const prompt = `Write a comprehensive SEO article as ${brief.author.name} (${brief.author.title}).
      Title: ${outline.title}.
      Keywords: ${brief.targetKeywords.join(', ')}.
      Formatting: Use Markdown. YOU MUST INCLUDE AT LEAST TWO DETAILED DATA TABLES using | Header | syntax.
      Style: Authoritative, data-driven, and highly engaging.`;
      
      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-3-pro-preview',
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
      console.error("Streaming failed:", e);
    }
  },

  async generateArticleImage(prompt: string): Promise<string> {
    try {
      await this.ensureApiKey();
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts: [{ text: prompt }] },
        config: { imageConfig: { aspectRatio: "16:9", imageSize: "1K" } }
      });
      const parts = response?.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData?.data) return `data:image/png;base64,${part.inlineData.data}`;
      }
      throw new Error("No image data");
    } catch (e) { throw e; }
  },

  async analyzeSEO(text: string, keywords: string[]): Promise<SEOAnalysis> {
    try {
      await this.ensureApiKey();
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze SEO for: "${text.substring(0, 3000)}". Primary keywords: ${keywords.join(', ')}.`,
        config: { responseMimeType: 'application/json' }
      });
      const parsed = extractJson(response.text || '{}');
      return {
        score: parsed?.score || 50,
        readability: parsed?.readability || 'Standard',
        keywordDensity: {},
        suggestions: parsed?.suggestions || [],
        keywordSuggestions: parsed?.keywordSuggestions || []
      };
    } catch (e) { return { score: 0, readability: 'N/A', keywordDensity: {}, suggestions: [], keywordSuggestions: [] }; }
  },

  async generateTitleSuggestions(topic: string, keywords: string[]): Promise<string[]> {
    await this.ensureApiKey();
    const ai = getAI();
    const prompt = `Suggest 5 high-CTR titles for: ${topic}. Keywords: ${keywords.join(', ')}. JSON array only.`;
    const res = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    return extractJson(res.text || '[]') || [];
  },

  async optimizeContent(text: string, brief: ContentBrief, author: any): Promise<string> {
    await this.ensureApiKey();
    const ai = getAI();
    const prompt = `Act as ${author.name}. SEO OPTIMIZATION PASS. 
    Content: ${text}. 
    Keywords: ${brief.targetKeywords.join(', ')}.
    Task: Rephrase sentences for better authority, improve internal flow, ensure perfect Markdown table formatting, and maximize keyword density without stuffing.
    Return only the optimized Markdown.`;

    const res = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt
    });
    return res.text || text;
  },

  async suggestSchedule(articles: { id: string, title: string, topic: string }[]): Promise<any[]> {
    await this.ensureApiKey();
    const ai = getAI();
    const prompt = `Suggest an optimal social media posting schedule for these articles: ${JSON.stringify(articles)}. 
    Available platforms: LinkedIn, Twitter, Facebook, Blog.
    Return a JSON array of objects with 'articleId', 'date' (ISO format), and 'platform'.`;
    
    try {
      const res = await ai.models.generateContent({
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
              },
              required: ['articleId', 'date', 'platform']
            }
          }
        }
      });
      return extractJson(res.text || '[]') || [];
    } catch (e) {
      console.error("Schedule suggestion failed:", e);
      return [];
    }
  }
};
