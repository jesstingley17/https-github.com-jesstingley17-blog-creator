import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { ContentBrief, ContentOutline, SEOAnalysis, ScheduledPost } from "./types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const geminiService = {
  async generateBriefDetails(topic: string, companyUrl?: string): Promise<Partial<ContentBrief>> {
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
      return JSON.parse(response.text);
    } catch (e) {
      console.error("Failed to parse brief", e);
      return {};
    }
  },

  async generateOutline(brief: ContentBrief): Promise<ContentOutline> {
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

    return JSON.parse(response.text);
  },

  async *streamContent(brief: ContentBrief, outline: ContentOutline) {
    const ai = getAI();
    const prompt = `Act as a world-class SEO content strategist and editor. 
    Write an authoritative, comprehensive, and engaging long-form article based on this outline:
    Title: ${outline.title}
    Core Topic: ${brief.topic}
    Voice/Tone: ${brief.tone}
    Keywords: ${[...brief.targetKeywords, ...brief.secondaryKeywords].join(', ')}
    ${brief.brandContext ? `Brand Voice Constraints: ${brief.brandContext}` : ''}

    REQUIRED VISUAL ARCHITECTURE:
    1. USE COMPARISON TABLES: Include at least one Markdown table (e.g., Feature Comparisons, Pros vs. Cons, or Data Snapshots) to make complex info scannable.
    2. KEY TAKEAWAY CALLOUTS: Use Markdown blockquotes (>) for "Pro-Tips," "Key Takeaways," or "Strategic Insights."
    3. ACTIONABLE CHECKLISTS: Use bulleted lists for steps or checklists.
    4. HIERARCHY: Use clear H2 and H3 structures.
    
    REQUIRED SEARCH & GROUNDING STRATEGY:
    1. Use Google Search to verify all technical claims, statistics, and current market trends.
    2. PRIORITIZE AUTHORITATIVE SOURCES: Favor .gov, .edu, industry-leading publications.
    3. DATA INTEGRITY: Ensure every "fact" or "stat" is grounded in search results.
    
    Structure the article with clean, visually rich Markdown. Include expert-level depth and a compelling narrative flow.`;

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
    const ai = getAI();
    const prompts = {
      rephrase: `Rephrase the following text to be more professional, engaging, and SEO-friendly while maintaining the original meaning: "${text}"`,
      expand: `Expand upon this idea with more detail, context, and expert-level insights. Use research if needed. Text: "${text}"`,
      summarize: `Summarize the following text into a concise, high-impact paragraph: "${text}"`,
      draft: `Draft a complete, high-quality section based on this heading: "${text}". Context of the article: "${context}"`,
      custom: `${customInstruction}. Context: "${context}". Target text: "${text}"`
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompts[task],
      config: {
        tools: (task === 'expand' || task === 'draft') ? [{ googleSearch: {} }] : undefined,
      }
    });

    return response.text || '';
  },

  async suggestSchedule(articles: {id: string, title: string, topic: string}[]): Promise<Partial<ScheduledPost>[]> {
    const ai = getAI();
    const prompt = `Analyze these articles and suggest an optimized cross-platform social media distribution schedule.
    Articles: ${articles.map(a => `"${a.title}" (Topic: ${a.topic})`).join(', ')}
    
    Consider current social media trends and peak engagement times for the respective niches.`;

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
              reason: { type: Type.STRING }
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
      contents: `Critically evaluate the following content for SEO excellence against target keywords: ${keywords.join(', ')}. 
      
      Analysis Criteria:
      - Semantic relevance and topical depth.
      - Keyword integration (avoiding stuffing, ensuring natural flow).
      - Readability and structure (E-E-A-T principles).
      
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
          }
        }
      }
    });

    return JSON.parse(response.text);
  },

  async refineImagePrompt(currentPrompt: string, contextTitle: string): Promise<string> {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a world-class prompt engineer for AI image generators. 
      Take this basic user input: "${currentPrompt}" 
      And this article title for context: "${contextTitle}"
      
      Rewrite it into a detailed, high-quality editorial prompt that includes:
      - Specific artistic style (minimalist, cinematic, 3D render, or professional photography)
      - Lighting descriptions (soft volumetric lighting, golden hour, studio light)
      - Composition (wide shot, shallow depth of field)
      - High-end textures and 8k resolution keywords.
      
      Return ONLY the refined prompt text. No quotes, no explanation.`,
    });
    return response.text?.trim() || currentPrompt;
  },

  async generateArticleImage(prompt: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
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
  }
};