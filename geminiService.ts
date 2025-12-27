
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { ContentBrief, ContentOutline, SEOAnalysis } from "./types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const geminiService = {
  async generateBriefDetails(topic: string): Promise<Partial<ContentBrief>> {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze the topic "${topic}" and provide SEO brief details including target keywords, secondary keywords, audience, and suggested tone.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            targetKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            secondaryKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            audience: { type: Type.STRING },
            tone: { type: Type.STRING }
          },
          required: ['targetKeywords', 'secondaryKeywords', 'audience', 'tone']
        }
      }
    });

    try {
      return JSON.parse(response.text);
    } catch (e) {
      console.error("Failed to parse brief", e);
      return {};
    }
  },

  async generateOutline(brief: ContentBrief): Promise<ContentOutline> {
    const ai = getAI();
    const prompt = `Create a detailed SEO content outline for the topic: "${brief.topic}". 
    Audience: ${brief.audience}. Tone: ${brief.tone}. 
    Primary Keywords: ${brief.targetKeywords.join(', ')}.`;

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
          }
        }
      }
    });

    return JSON.parse(response.text);
  },

  async *streamContent(brief: ContentBrief, outline: ContentOutline) {
    const ai = getAI();
    const prompt = `Write a high-quality, long-form SEO article based on this outline:
    Title: ${outline.title}
    Topic: ${brief.topic}
    Tone: ${brief.tone}
    Keywords to include: ${[...brief.targetKeywords, ...brief.secondaryKeywords].join(', ')}
    
    Structure the article with Markdown. Make it engaging and authoritative.`;

    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    for await (const chunk of responseStream) {
      yield chunk;
    }
  },

  async analyzeSEO(text: string, keywords: string[]): Promise<SEOAnalysis> {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze the following content for SEO performance against keywords: ${keywords.join(', ')}. 
      Provide a score (0-100), readability level, keyword density analysis, and improvement suggestions.
      
      Content: ${text.substring(0, 5000)}`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            readability: { type: Type.STRING },
            keywordDensity: { 
                type: Type.OBJECT,
                properties: keywords.reduce((acc, k) => ({...acc, [k]: {type: Type.NUMBER}}), {})
            },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    return JSON.parse(response.text);
  },

  async generateArticleImage(prompt: string): Promise<string> {
    // Create new instance right before use to ensure updated API key from dialog if necessary
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: `A professional, high-quality editorial blog header image for: ${prompt}. Cinematic lighting, minimalist aesthetic, 4k resolution.` }]
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
          imageSize: "1K"
        }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data returned from model");
  }
};
