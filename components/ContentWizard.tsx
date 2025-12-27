
import React, { useState } from 'react';
import { 
  Loader2, 
  Sparkles, 
  RefreshCw, 
  Type, 
  PenTool, 
  Link2, 
  Wand2,
  Anchor,
  Check,
  Star
} from 'lucide-react';
import { geminiService } from '../geminiService';
import { storageService } from '../storageService';
import { ContentBrief, ContentOutline } from '../types';

interface ContentWizardProps {
  onComplete: (brief: ContentBrief, outline: ContentOutline) => void;
}

const ContentWizard: React.FC<ContentWizardProps> = ({ onComplete }) => {
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState('');
  const [content, setContent] = useState('');
  const [slug, setSlug] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAiGenerate = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    try {
      // Step 1: Generate optimized brief and outline from topic
      const research = await geminiService.deepResearch(topic);
      const tempBrief: ContentBrief = {
        id: Math.random().toString(36).substring(2, 15),
        topic: topic,
        competitorUrls: research.competitorUrls || [],
        backlinkUrls: research.backlinkUrls || [],
        targetKeywords: research.targetKeywords || [],
        secondaryKeywords: research.secondaryKeywords || [],
        audience: 'Professional Audience',
        tone: 'Professional & Authoritative',
        length: 'medium',
        detailLevel: 'standard',
        status: 'draft',
        author: storageService.getAuthor(),
        createdAt: Date.now()
      };

      const generatedOutline = await geminiService.generateOutline(tempBrief);
      
      // Step 2: Auto-generate slug
      const generatedSlug = await geminiService.generateSlug(generatedOutline.title || topic);
      setSlug(generatedSlug);

      // Step 3: Stream content generation
      let fullText = '';
      const stream = geminiService.streamContent(tempBrief, generatedOutline);
      for await (const chunk of stream) {
        const c = chunk as any;
        fullText += c.text || '';
        setContent(fullText);
      }

      // Finalize and move to editor
      onComplete(tempBrief, generatedOutline);
    } catch (e) {
      console.error("Generation failed", e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleManualCreate = () => {
    const brief: ContentBrief = {
      id: Math.random().toString(36).substring(2, 15),
      topic: topic || 'New Chart',
      competitorUrls: [],
      backlinkUrls: [],
      targetKeywords: [],
      secondaryKeywords: [],
      audience: 'General',
      tone: 'Professional',
      length: 'medium',
      detailLevel: 'standard',
      status: 'draft',
      author: storageService.getAuthor(),
      createdAt: Date.now()
    };
    const outline: ContentOutline = {
      title: topic || 'Untitled Chart',
      sections: []
    };
    onComplete(brief, outline);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-700 py-10 pb-32">
      <header className="text-center space-y-4">
        <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner relative">
          <Anchor className="w-10 h-10 text-[#be185d]" />
          <Star className="w-4 h-4 text-pink-300 absolute bottom-3 right-3 animate-pulse" />
        </div>
        <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase font-heading leading-none">New Anchor Chart</h1>
        <p className="text-pink-700 font-bold uppercase tracking-[0.3em] text-[11px]">Follow the 4 steps to synthesize your professional content.</p>
      </header>

      <div className="bg-white rounded-[64px] border-2 border-pink-100 shadow-2xl p-16 md:p-24 space-y-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-50/20 rounded-full blur-[100px] -mr-48 -mt-48 opacity-50" />

        {/* 1. TITLE */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 ml-2">
            <div className="w-10 h-10 rounded-2xl bg-pink-50 flex items-center justify-center">
              <Type className="w-5 h-5 text-[#be185d]" />
            </div>
            <label className="text-sm font-black text-pink-900 uppercase tracking-[0.2em] font-heading">1. Main Topic or Title</label>
          </div>
          <input
            type="text"
            placeholder="What should we anchor today?..."
            className="w-full px-10 py-8 bg-pink-50/30 border-2 border-pink-100 focus:border-[#be185d] focus:bg-white rounded-[32px] outline-none text-2xl font-bold text-slate-800 transition-all placeholder:text-pink-200"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
        </div>

        {/* 2. CONTENT BOX */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 ml-2">
            <div className="w-10 h-10 rounded-2xl bg-pink-50 flex items-center justify-center">
              <PenTool className="w-5 h-5 text-[#be185d]" />
            </div>
            <label className="text-sm font-black text-pink-900 uppercase tracking-[0.2em] font-heading">2. Content Preview</label>
          </div>
          <div className="relative group">
            <textarea
              placeholder="Content will be synthesized here, or type your own notes..."
              className="w-full min-h-[300px] px-10 py-10 bg-pink-50/10 border-2 border-pink-100 focus:border-[#be185d] focus:bg-white rounded-[48px] outline-none text-lg font-medium text-slate-700 transition-all placeholder:text-pink-100 resize-none shadow-inner"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            {isGenerating && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-sm rounded-[48px] flex flex-col items-center justify-center gap-6 animate-in fade-in">
                <Loader2 className="w-12 h-12 animate-spin text-[#be185d]" />
                <p className="text-[10px] font-black text-[#be185d] uppercase tracking-[0.4em]">Synthesizing Nodes...</p>
              </div>
            )}
          </div>
        </div>

        {/* 3. URL */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 ml-2">
            <div className="w-10 h-10 rounded-2xl bg-pink-50 flex items-center justify-center">
              <Link2 className="w-5 h-5 text-[#be185d]" />
            </div>
            <label className="text-sm font-black text-pink-900 uppercase tracking-[0.2em] font-heading">3. Anchor URL</label>
          </div>
          <div className="relative">
            <div className="absolute left-8 top-1/2 -translate-y-1/2 text-pink-300 font-bold">anchor.pro /</div>
            <input
              type="text"
              placeholder="url-slug-here"
              className="w-full pl-[130px] pr-10 py-7 bg-pink-50/30 border-2 border-pink-100 focus:border-[#be185d] focus:bg-white rounded-[32px] outline-none text-lg font-bold text-[#be185d] transition-all"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
          </div>
        </div>

        {/* 4. GENERATE BUTTON */}
        <div className="pt-8 flex flex-col gap-6">
          <button
            onClick={handleAiGenerate}
            disabled={isGenerating || !topic.trim()}
            className={`w-full py-10 rounded-[40px] font-black text-xl uppercase tracking-[0.3em] flex items-center justify-center gap-6 transition-all shadow-2xl active:scale-95 group font-heading ${
              isGenerating ? 'bg-pink-100 text-pink-400' : 'girly-gradient text-white shadow-pink-200 hover:opacity-95'
            }`}
          >
            {isGenerating ? <Loader2 className="w-8 h-8 animate-spin" /> : <Wand2 className="w-8 h-8 group-hover:rotate-12 transition-transform" />}
            <span>{isGenerating ? 'Synthesis in Progress...' : '4. AI Generates All'}</span>
          </button>
          
          <div className="flex items-center gap-6 justify-center">
            <div className="h-px flex-1 bg-pink-50" />
            <button 
              onClick={handleManualCreate}
              className="text-[10px] font-black text-pink-300 uppercase tracking-[0.3em] hover:text-[#be185d] transition-colors"
            >
              Skip to Manual Editor
            </button>
            <div className="h-px flex-1 bg-pink-50" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentWizard;
