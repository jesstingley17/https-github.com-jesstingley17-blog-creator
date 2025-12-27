
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
    Task: Take the following raw user input for a content generation topic and re-synthesize it into a highly effective, structured, and summarized AI prompt.
    Input: "${rawInput}"
    Requirements:
    1. Remove conversational noise.
    2. Identify core technical keywords (e.g., related to engineers/engineering if applicable).
    3. Format as a clean, actionable instruction for a high-quality article.
    4. Detect if a reference URL or author page is mentioned and extract it.
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

  async deepResearch(urlOrTopic: string): Promise<Partial<ContentBrief>> {
    await this.ensureApiKey();
    const ai = getAI();
    const prompt = `Perform deep SEO research for: "${urlOrTopic}".
    Identify 3-5 top organic competitors and high-authority URLs for potential backlink injection.
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
    const prompt = `Act as an SEO link discovery engine. 
    Topic: "${topic}". Keywords: ${keywords.join(', ')}. 
    Find 5-7 HIGH-AUTHORITY websites or technical resources related to this topic.
    Return a list of specific URLs and why they are valuable.
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
    const prompt = `Generate a high-authority article outline for: "${brief.topic}". 
    Focus on creating a technical, informative structure suitable for a ${brief.detailLevel} ${brief.length} length article.
    Target Keywords: ${brief.targetKeywords.join(', ')}.
    Include 5-8 major sections. Return as JSON.`;

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
      const lengthMap = { short: "600 words", medium: "1200 words", long: "2500 words" };

      const prompt = `Write a comprehensive, authoritative SEO article based on the following strategy.
      Title: ${outline.title}.
      Keywords: ${brief.targetKeywords.join(', ')}.
      Tone: ${brief.tone}.
      Length: ${lengthMap[brief.length]}.
      Focus: ${brief.detailLevel}.

      INSTRUCTIONS:
      1. Write in a neutral, professional third-person voice. 
      2. Ground every claim in data verified via search.
      3. Use detailed Markdown formatting for all elements.
      4. CRITICAL: Include at least one complex data comparison table. 
         YOU MUST use proper GitHub Flavored Markdown (GFM) pipe syntax. 
         Example: 
         | Feature | Details | Performance |
         | :--- | :--- | :--- |
         | Metric A | Value 1 | High |
         | Metric B | Value 2 | Medium |
      5. Do not adopt a specific persona; focus on high-quality technical synthesis.`;
      
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
      contents: `Analyze SEO for: "${text.substring(0, 4000)}". Primary keywords: ${keywords.join(', ')}. Return a JSON score (0-100) and specific technical suggestions.`,
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

  async optimizeContent(text: string, brief: ContentBrief): Promise<string> {
    await this.ensureApiKey();
    const ai = getAI();
    const prompt = `Rewrite and optimize the following article for SEO and technical accuracy.
    Keywords to amplify: ${brief.targetKeywords.join(', ')}.
    Content: "${text}".
    Task: Improve flow, fix technical inconsistencies, and ensure proper Markdown structure. 
    IMPORTANT: If there are data comparisons, ensure they are formatted as GFM tables with pipe syntax (| Header |). 
    Output only the refined Markdown.`;

    const res = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt
    });
    return res.text || text;
  },

  async generateStructuredData(title: string, content: string, author: { name: string; title: string }): Promise<string> {
    await this.ensureApiKey();
    const ai = getAI();
    const prompt = `Generate a valid JSON-LD script for an Article schema based on the following article metadata.
    Title: "${title}"
    Author Name: "${author.name}"
    Author Job Title: "${author.title}"
    Brief Content Summary: "${content.substring(0, 500)}..."
    
    Ensure it includes:
    - @context: "https://schema.org"
    - @type: "Article"
    - headline
    - author (with name and jobTitle)
    - datePublished (use ISO current date)
    - description (brief summary)
    - articleBody (summary or key points)
    
    Return only the valid JSON object inside a script tag formatted as raw text.`;

    const res = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return res.text || "{}";
  },

  async suggestSchedule(articles: any[]): Promise<any[]> {
    await this.ensureApiKey();
    const ai = getAI();
    const prompt = `Suggest social media schedule for: ${JSON.stringify(articles)}. JSON array only.`;
    const res = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    return extractJson(res.text || '[]') || [];
  }
};
