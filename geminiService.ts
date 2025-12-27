
import { GoogleGenAI, Type } from "@google/genai";
import { ContentBrief, ContentOutline, SEOAnalysis } from "./types";

const getAI = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
};

const extractJson = (text: string) => {
  if (!text) return null;
  try {
    // Attempt to find JSON block if model wrapped it in markdown
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
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
    prompt += ` Provide SEO strategy details.`;

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

  async generateOutline(brief: ContentBrief): Promise<ContentOutline> {
    await this.ensureApiKey();
    const ai = getAI();
    const prompt = `Act as a senior SEO editor. Generate a comprehensive, high-authority article outline for: "${brief.topic}". 
    Target Keywords: ${brief.targetKeywords.join(', ')}.
    Audience: ${brief.audience}.
    Tone: ${brief.tone}.
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
      if (!parsed || !parsed.sections || parsed.sections.length === 0) {
        throw new Error("Invalid outline structure returned");
      }

      return {
        title: parsed.title || brief.topic,
        sections: parsed.sections.map((s: any) => ({
          heading: s.heading || 'Untitled Section',
          subheadings: Array.isArray(s.subheadings) ? s.subheadings : [],
          keyPoints: []
        }))
      };
    } catch (e) {
      console.error("Outline generation failed, using fallback:", e);
      return { 
        title: brief.topic, 
        sections: [
          { heading: 'Introduction: Understanding ' + brief.topic, subheadings: ['Overview', 'Current Trends', 'Why it Matters'], keyPoints: [] },
          { heading: 'Key Strategies & Implementation', subheadings: ['Core Principles', 'Step-by-Step Guide'], keyPoints: [] },
          { heading: 'Advanced Optimization Techniques', subheadings: ['SEO Best Practices', 'Maximizing Performance'], keyPoints: [] },
          { heading: 'Conclusion & Future Outlook', subheadings: ['Summary of Key Takeaways', 'Next Steps'], keyPoints: [] }
        ] 
      };
    }
  },

  async *streamContent(brief: ContentBrief, outline: ContentOutline) {
    try {
      await this.ensureApiKey();
      const ai = getAI();
      const prompt = `Write a professional, long-form SEO-optimized article based on this outline: ${JSON.stringify(outline)}. 
      Keywords to include: ${brief.targetKeywords.join(', ')}. 
      Tone: ${brief.tone}.
      Audience: ${brief.audience}.
      Use Markdown formatting (H1, H2, lists, bold text). Include tables where relevant.`;
      
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
      console.error("Streaming failed:", e);
    }
  },

  async performWritingTask(task: string, text: string, context: string): Promise<string> {
    try {
      await this.ensureApiKey();
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Task: ${task}. Target Text: "${text}". Content context: "${context}". Return the improved text only with no introduction or conclusion. Keep Markdown if present.`,
      });
      return response.text?.trim() || text;
    } catch (e) { return text; }
  },

  async optimizeContent(text: string, brief: ContentBrief): Promise<string> {
    try {
      await this.ensureApiKey();
      const ai = getAI();
      const prompt = `Optimize the following article for SEO, readability, and engagement. 
      Primary Keywords to naturally integrate: ${brief.targetKeywords.join(', ')}.
      Target Audience: ${brief.audience}.
      Target Tone: ${brief.tone}.
      Improve sentence structure, inject semantic depth, and ensure high E-E-A-T.
      Keep Markdown formatting intact.
      Article Content:
      ${text}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          temperature: 0.6,
        }
      });
      return response.text || text;
    } catch (e) {
      console.error("Optimization failed:", e);
      return text;
    }
  },

  async analyzeSEO(text: string, keywords: string[]): Promise<SEOAnalysis> {
    try {
      await this.ensureApiKey();
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze SEO for article: "${text.substring(0, 3000)}". Primary keywords: ${keywords.join(', ')}.`,
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
    } catch (e) {
      return { score: 0, readability: 'N/A', keywordDensity: {}, suggestions: [], keywordSuggestions: [] };
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
      throw new Error("No image data found in response");
    } catch (e) {
      console.error("Image generation error:", e);
      throw e;
    }
  },

  async suggestSchedule(articles: any[]) {
    try {
      await this.ensureApiKey();
      const ai = getAI();
      const res = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Create an optimized social media schedule for these articles: ${JSON.stringify(articles)}.`,
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
      const parsed = extractJson(res.text || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) { return []; }
  }
};
