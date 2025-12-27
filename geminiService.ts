
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { ContentBrief, ContentOutline, SEOAnalysis, ScheduledPost } from "./types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const geminiService = {
  async generateBriefDetails(topic: string, companyUrl?: string): Promise<Partial<ContentBrief>> {
    const ai = getAI();
    let systemPrompt = `Analyze the topic "${topic}" and provide SEO brief details.`;
    
    if (companyUrl) {
      systemPrompt += ` Also research the company at ${companyUrl} using Google Search. Identify their brand voice, primary services, and target demographic to ensure the generated content is perfectly aligned with their brand identity. Provide a 'brandContext' summary.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: systemPrompt,
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
            brandContext: { type: Type.STRING, description: "A summary of the brand's identity and voice found from their URL." }
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
    Audience: ${brief.audience}. 
    Tone: ${brief.tone}. 
    Primary Keywords: ${brief.targetKeywords.join(', ')}.
    ${brief.brandContext ? `Brand Identity Context: ${brief.brandContext}` : ''}
    ${brief.companyUrl ? `The content is for the company at: ${brief.companyUrl}` : ''}`;

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
    ${brief.brandContext ? `Maintain consistency with this brand voice: ${brief.brandContext}` : ''}
    ${brief.companyUrl ? `Mention or subtly align with company values from ${brief.companyUrl} where appropriate.` : ''}
    
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

  async suggestSchedule(articles: {id: string, title: string, topic: string}[]): Promise<Partial<ScheduledPost>[]> {
    const ai = getAI();
    const prompt = `Suggest a social media posting schedule for the following articles to maximize engagement.
    Articles: ${articles.map(a => `"${a.title}" (Topic: ${a.topic})`).join(', ')}
    
    Provide a list of scheduled dates (ISO strings starting from tomorrow) and suggested platforms for each article.`;

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
              platform: { type: Type.STRING, enum: ['LinkedIn', 'Twitter', 'Facebook', 'Blog'] },
              reason: { type: Type.STRING, description: 'AI reasoning for this specific slot' }
            }
          }
        }
      }
    });

    return JSON.parse(response.text);
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
