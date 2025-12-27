
import { GoogleGenAI, Type } from "@google/genai";
import { ContentBrief, ContentOutline, SEOAnalysis, BacklinkOpportunity, SavedPrompt } from "./types";

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

  async optimizeStrategicPrompt(rawInput: string): Promise<Partial<SavedPrompt>> {
    await this.ensureApiKey();
    const ai = getAI();
    const prompt = `Act as a Meta-Prompt Engineer. 
    Task: Take the following raw user input for a content topic and re-synthesize it into a highly effective, structured, and summarized AI prompt.
    Input: "${rawInput}"
    Requirements:
    1. Remove conversational noise.
    2. Identify core technical keywords.
    3. Format as a clean, actionable instruction for high-quality content.
    Return a JSON object with 'title', 'optimizedPrompt', 'sourceUrl', and 'tags'.`;

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
              optimizedPrompt: { type: Type.STRING },
              sourceUrl: { type: Type.STRING },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ['title', 'optimizedPrompt', 'tags']
          }
        }
      });
      return extractJson(response.text || '{}');
    } catch (e) {
      return { title: "Optimized Topic", optimizedPrompt: rawInput, tags: ["General"] };
    }
  },

  async generateSlug(title: string): Promise<string> {
    await this.ensureApiKey();
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a clean, SEO-friendly URL slug for this title: "${title}". Return only the slug string. No spaces, lowercase only, hyphens for spaces. Example: "how-to-engineer-content".`
    });
    return response.text?.trim().replace(/[^a-z0-9-]/gi, '').toLowerCase() || title.toLowerCase().replace(/\s+/g, '-');
  },

  async deepResearch(urlOrTopic: string): Promise<Partial<ContentBrief>> {
    await this.ensureApiKey();
    const ai = getAI();
    const prompt = `Perform deep web research for: "${urlOrTopic}".
    Identify 3-5 top organic competitors or related high-authority sources.
    Extract 5 target keywords and 5 secondary keywords.
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
    const prompt = `Act as a link discovery engine. Topic: "${topic}". Keywords: ${keywords.join(', ')}. Find 5-7 HIGH-AUTHORITY websites across the web. Return as JSON.`;

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
                reason: { type: Type.STRING },
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
      return [];
    }
  },

  async generateOutline(brief: ContentBrief): Promise<ContentOutline> {
    await this.ensureApiKey();
    const ai = getAI();
    const prompt = `Generate a high-authority content outline for: "${brief.topic}". Use Google Search to find current industry sub-topics. Return as JSON.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
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
      const lengthMap = { short: "600 words", medium: "1200 words", long: "2500 words" };

      const prompt = `Task: Synthesize a high-authority content piece.
      Title: ${outline.title}.
      Keywords: ${brief.targetKeywords.join(', ')}.
      Tone: ${brief.tone}.
      Target Length: ${lengthMap[brief.length]}.
      Detail Level: ${brief.detailLevel}.

      CRITICAL INSTRUCTIONS:
      1. USE GOOGLE SEARCH to pull specific, real-time data, statistics, and authoritative facts from the entire internet.
      2. Write with professional authority and neutral objectivity.
      3. Use detailed Markdown including lists, bolding, and headers.
      4. MANDATORY: Include at least one complex GFM table (| Column 1 | Column 2 |) for data comparison or feature breakdown.
      5. Output ONLY the Markdown content. Do not include introductory conversational filler.`;
      
      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          temperature: 0.6,
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
  },

  async analyzeSEO(text: string, keywords: string[]): Promise<SEOAnalysis> {
    await this.ensureApiKey();
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze content performance for: "${text.substring(0, 4000)}". Primary keywords: ${keywords.join(', ')}. Return a JSON score and suggestions.`,
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
          }
        }
      }
    });
    const parsed = extractJson(response.text || '{}');
    return {
      score: parsed?.score || 50,
      readability: parsed?.readability || 'Standard',
      keywordDensity: {},
      suggestions: parsed?.suggestions || [],
      keywordSuggestions: parsed?.keywordSuggestions || []
    };
  },

  // Added suggestSchedule method to handle social media content planning
  async suggestSchedule(articles: { id: string; title: string; topic: string }[]): Promise<{ articleId: string; date: string; platform: string }[]> {
    await this.ensureApiKey();
    const ai = getAI();
    const prompt = `Act as a social media strategist. Given this list of articles, suggest an optimal posting schedule for next week.
    Articles: ${JSON.stringify(articles)}
    Return a JSON array of objects with 'articleId', 'date' (ISO string), and 'platform' (LinkedIn, Twitter, Facebook, or Blog).`;

    try {
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
                platform: { type: Type.STRING, enum: ['LinkedIn', 'Twitter', 'Facebook', 'Blog'] }
              },
              required: ['articleId', 'date', 'platform']
            }
          }
        }
      });
      return extractJson(response.text || '[]');
    } catch (e) {
      console.error("Schedule suggestion failed", e);
      return [];
    }
  },

  async optimizeContent(text: string, brief: ContentBrief): Promise<string> {
    await this.ensureApiKey();
    const ai = getAI();
    const prompt = `Rewrite and optimize the following content for technical authority. Keywords: ${brief.targetKeywords.join(', ')}. Use Google Search for fact-checking. Output only Markdown. Content: "${text}".`;
    const res = await ai.models.generateContent({ 
      model: 'gemini-3-pro-preview', 
      contents: prompt,
      config: { tools: [{ googleSearch: {} }] }
    });
    return res.text || text;
  }
};
