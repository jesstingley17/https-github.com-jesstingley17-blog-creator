
import { GoogleGenAI, Type } from "@google/genai";
import { ContentBrief, ContentOutline, SEOAnalysis } from "./types";

const getAI = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
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

  async generateBriefDetails(topic: string, companyUrl?: string): Promise<Partial<ContentBrief>> {
    await this.ensureApiKey();
    const ai = getAI();
    let prompt = `Analyze the topic "${topic}" for a high-authority SEO article.`;
    if (companyUrl) prompt += ` Tailor content to the brand at ${companyUrl}.`;
    prompt += ` Provide SEO strategy details including target keywords and brand resonance.`;

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
              brandContext: { type: Type.STRING }
            },
            required: ['targetKeywords', 'secondaryKeywords', 'audience', 'tone']
          }
        }
      });

      const parsed = extractJson(response.text || '{}');
      return {
        targetKeywords: parsed?.targetKeywords || [topic],
        secondaryKeywords: parsed?.secondaryKeywords || [],
        audience: parsed?.audience || 'General Audience',
        tone: parsed?.tone || 'Professional',
        brandContext: parsed?.brandContext || ''
      };
    } catch (e) {
      console.error("Brief generation failed:", e);
      return { targetKeywords: [topic], secondaryKeywords: [], audience: 'General', tone: 'Professional' };
    }
  },

  async generateTitleSuggestions(topic: string, keywords: string[]): Promise<string[]> {
    await this.ensureApiKey();
    const ai = getAI();
    const prompt = `Generate 5 high-CTR, SEO-optimized headlines for an article about "${topic}". 
    Primary Keywords: ${keywords.join(', ')}. 
    Return as a simple JSON array of strings. Ensure titles are authoritative and modern.`;

    try {
      const res = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });
      return extractJson(res.text || '[]') || [];
    } catch (e) {
      return [`Mastering ${topic}: A Comprehensive Guide`];
    }
  },

  async generateOutline(brief: ContentBrief): Promise<ContentOutline> {
    await this.ensureApiKey();
    const ai = getAI();
    const prompt = `Act as a senior SEO editor. Generate a comprehensive, high-authority article outline for: "${brief.topic}". 
    Target Keywords: ${brief.targetKeywords.join(', ')}.
    Audience: ${brief.audience}.
    Tone: ${brief.tone}.
    Benchmarking against competitors: ${brief.competitorUrls.join(', ') || 'N/A'}.
    Ensure 5-8 major sections with detailed subheadings.`;

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
                  },
                  required: ['heading', 'subheadings']
                }
              }
            },
            required: ['title', 'sections']
          }
        }
      });

      const parsed = extractJson(response.text || '{}');
      return {
        title: parsed.title || brief.topic,
        sections: parsed.sections || []
      };
    } catch (e) {
      return { title: brief.topic, sections: [] };
    }
  },

  async *streamContent(brief: ContentBrief, outline: ContentOutline) {
    try {
      await this.ensureApiKey();
      const ai = getAI();
      const prompt = `Write a professional, long-form SEO-optimized article based on this outline: ${JSON.stringify(outline)}. 
      Keywords: ${brief.targetKeywords.join(', ')}. 
      Tone: ${brief.tone}.
      
      CRITICAL SEO INSTRUCTIONS:
      1. NATURAL LINK INJECTION: You must naturally weave in the following backlink URLs as anchor text where relevant: ${brief.backlinkUrls.join(', ') || 'None provided'}.
      2. IN-TEXT CITATIONS: Use [number] notation to cite facts or data based on real-world sources you find.
      3. CITATION MAPPING: At the very end of the article, provide a section titled "Sources & References" listing the full title and URL of each numbered citation used.
      
      Use Markdown formatting (H1, H2, lists, bold text). Include tables where relevant.`;
      
      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-3-pro-preview', // Pro for better reasoning on links/citations
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

  async performWritingTask(task: string, text: string, context: string): Promise<string> {
    try {
      await this.ensureApiKey();
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Task: ${task}. Target Text: "${text}". Content context: "${context}". Return improved text only.`,
      });
      return response.text?.trim() || text;
    } catch (e) { return text; }
  },

  async optimizeContent(text: string, brief: ContentBrief): Promise<string> {
    try {
      await this.ensureApiKey();
      const ai = getAI();
      const prompt = `Optimize for SEO. Keywords: ${brief.targetKeywords.join(', ')}. Backlinks to ensure are present: ${brief.backlinkUrls.join(', ')}. 
      Ensure citations [number] are consistent.
      Content: ${text}`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt
      });
      return response.text || text;
    } catch (e) { return text; }
  },

  async analyzeSEO(text: string, keywords: string[]): Promise<SEOAnalysis> {
    try {
      await this.ensureApiKey();
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze SEO for: "${text.substring(0, 3000)}". Primary keywords: ${keywords.join(', ')}.`,
        config: { 
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.INTEGER },
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
    } catch (e) { return { score: 0, readability: 'N/A', keywordDensity: {}, suggestions: [], keywordSuggestions: [] }; }
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

  async suggestSchedule(articles: any[]) {
    try {
      await this.ensureApiKey();
      const ai = getAI();
      const res = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Suggest schedule for: ${JSON.stringify(articles)}`,
        config: { responseMimeType: 'application/json' }
      });
      return extractJson(res.text || '[]') || [];
    } catch (e) { return []; }
  }
};
