import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { ContentBrief, ContentOutline, SEOAnalysis, ScheduledPost } from "./types";

// Always initialize GoogleGenAI with process.env.API_KEY directly as a named parameter.
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const geminiService = {
  async ensureApiKey(): Promise<boolean> {
    // @ts-ignore
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      return true; // Proceed assuming selection success as per race condition guidelines
    }
    return true;
  },

  async generateBriefDetails(topic: string, companyUrl?: string): Promise<Partial<ContentBrief>> {
    await this.ensureApiKey();
    const ai = getAI();
    let prompt = `Analyze the topic "${topic}" and provide highly detailed SEO brief details.`;
    
    if (companyUrl) {
      prompt += ` Conduct deep research on the company at ${companyUrl} using Google Search. 
      Identify their core brand pillars, tone of voice (e.g., sophisticated, aggressive, helpful), target audience segments, and primary value propositions. 
      Ensure the suggested keywords and brand context are perfectly aligned with their existing market positioning. 
      Prioritize information from official company pages, press releases, and verified professional profiles.`;
    }

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
            brandContext: { type: Type.STRING, description: "A summary of the brand's identity and voice found from their URL." }
          },
          required: ['targetKeywords', 'secondaryKeywords', 'audience', 'tone']
        }
      }
    });

    try {
      return JSON.parse(response.text || '{}');
    } catch (e) {
      console.error("Failed to parse brief", e);
      return {};
    }
  },

  async generateOutline(brief: ContentBrief): Promise<ContentOutline> {
    await this.ensureApiKey();
    const ai = getAI();
    const prompt = `Create a detailed, high-converting SEO content outline for: "${brief.topic}". 
    Target Audience: ${brief.audience}. 
    Tone of Voice: ${brief.tone}. 
    Primary SEO Keywords: ${brief.targetKeywords.join(', ')}.
    ${brief.brandContext ? `Brand Guidelines: ${brief.brandContext}` : ''}
    ${brief.companyUrl ? `Align with the business goals of: ${brief.companyUrl}` : ''}
    
    Structure the outline to maximize user engagement and search engine visibility. Each section should have specific goals and semantic keyword targets.`;

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

    return JSON.parse(response.text || '{}');
  },

  async *streamContent(brief: ContentBrief, outline: ContentOutline) {
    await this.ensureApiKey();
    const ai = getAI();
    const prompt = `Act as a world-class SEO content strategist and editor. 
    Write an authoritative, comprehensive, and engaging long-form article based on this outline:
    Title: ${outline.title}
    Core Topic: ${brief.topic}
    Voice/Tone: ${brief.tone}
    Keywords: ${[...brief.targetKeywords, ...brief.secondaryKeywords].join(', ')}
    ${brief.brandContext ? `Brand Voice Constraints: ${brief.brandContext}` : ''}

    REQUIRED VISUAL ARCHITECTURE:
    1. USE COMPARISON TABLES: Include at least one Markdown table (e.g., Feature Comparisons, Pros vs. Cons, or Data Snapshots).
    2. KEY TAKEAWAY CALLOUTS: Use Markdown blockquotes (>) for "Pro-Tips" or "Strategic Insights."
    3. ACTIONABLE CHECKLISTS: Use bulleted lists for steps.
    4. HIERARCHY: Use clear H2 and H3 structures.
    
    Structure the article with clean, visually rich Markdown. Use search grounding for up-to-date facts.`;

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
      rephrase: `Rephrase the following text to be more professional and engaging: "${text}"`,
      expand: `Expand upon this idea with more detail and expert insights. Text: "${text}"`,
      summarize: `Summarize the following text concisely: "${text}"`,
      draft: `Draft a high-quality section for: "${text}". Context: "${context}"`,
      custom: `${customInstruction}. Context: "${context}". Target text: "${text}"`
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
      table: `Generate a professional Markdown comparison table based on this context: "${context}". Ensure it has at least 3 columns and 4 rows. Focus on comparing key features or data points.`,
      callout: `Generate a high-impact "Key Takeaway" callout in Markdown (using >) for this context: "${context}". Make it succinct and insightful.`,
      checklist: `Generate an actionable 5-step checklist in Markdown for this context: "${context}". Use bullet points with checkmarks if possible.`
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompts[type],
    });

    return response.text || '';
  },

  async generateSocialCaption(platform: 'Instagram' | 'Facebook' | 'LinkedIn', content: string): Promise<string> {
    await this.ensureApiKey();
    const ai = getAI();
    const platformGuides = {
      Instagram: "Use engaging visual language, include relevant emojis, and add a block of 5-10 strategic hashtags. Keep it concise and focused on a visual hook.",
      Facebook: "Write a friendly, shareable summary. Use a conversational tone and include a clear call to action (CTA). Emojis are welcome but keep it professional.",
      LinkedIn: "Focus on professional value, industry insights, and thought leadership. Use structured points or short paragraphs. Include 3-5 high-value professional hashtags."
    };

    const prompt = `Act as a social media manager. Condense the following article into a high-converting ${platform} post caption.
    Platform Guidelines: ${platformGuides[platform]}
    
    Article Content: ${content.substring(0, 4000)}
    
    Return only the caption text.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text?.trim() || '';
  },

  async analyzeSEO(text: string, keywords: string[]): Promise<SEOAnalysis> {
    await this.ensureApiKey();
    const ai = getAI();
    
    // Ensure keywords is never empty for schema generation
    const targetKeywords = keywords.length > 0 ? keywords : ['general'];

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Critically evaluate the following content for SEO excellence against target keywords: ${targetKeywords.join(', ')}. 
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
                properties: targetKeywords.reduce((acc, k) => ({...acc, [k]: {type: Type.NUMBER}}), {})
            },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            keywordSuggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  keyword: { type: Type.STRING },
                  action: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                },
                required: ['keyword', 'action', 'explanation']
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
      console.error("SEO Analysis Parse Failed", e);
      return {
        score: 0,
        readability: 'Unknown',
        keywordDensity: {},
        suggestions: ['Could not analyze content structure.'],
        keywordSuggestions: []
      };
    }
  },

  async refineImagePrompt(currentPrompt: string, contextTitle: string): Promise<string> {
    await this.ensureApiKey();
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Refine this image prompt: "${currentPrompt}" for an article titled "${contextTitle}". Make it descriptive for high-end AI generation.`,
    });
    return response.text?.trim() || currentPrompt;
  },

  async generateArticleImage(prompt: string): Promise<string> {
    await this.ensureApiKey();
    // Use gemini-3-pro-image-preview for high quality
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: prompt }]
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
  },

  // FIX: Added missing suggestSchedule method called in Planner.tsx
  async suggestSchedule(articles: { id: string; title: string; topic: string }[]): Promise<{ articleId: string; date: string; platform: string }[]> {
    await this.ensureApiKey();
    const ai = getAI();
    const prompt = `Given the following list of articles, suggest an optimal social media posting schedule for the next 30 days.
    Articles: ${JSON.stringify(articles)}
    
    Assign each article to a platform (LinkedIn, Twitter, Facebook, or Blog) and a specific date/time in the next month starting from today (${new Date().toISOString()}). 
    Balance the schedule to maintain consistent engagement. Return the result in the specified JSON format.`;

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
              date: { type: Type.STRING, description: "ISO 8601 format string" },
              platform: { type: Type.STRING, description: "The platform for the post: LinkedIn, Twitter, Facebook, or Blog." }
            },
            required: ['articleId', 'date', 'platform']
          }
        }
      }
    });

    try {
      return JSON.parse(response.text || '[]');
    } catch (e) {
      console.error("Failed to parse schedule suggestions", e);
      return [];
    }
  }
};