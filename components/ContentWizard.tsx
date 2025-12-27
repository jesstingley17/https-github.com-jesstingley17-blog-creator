
import React, { useState } from 'react';
import { 
  Loader2, 
  Type, 
  PenTool, 
  Link2, 
  Wand2,
  Check,
  Star,
  FilePlus2,
  Sparkles
} from 'lucide-react';
import { geminiService } from '../geminiService';
import { storageService } from '../storageService';
import { ContentBrief, ContentOutline } from '../types';

interface ContentWizardProps {
  onComplete: (brief: ContentBrief, outline: ContentOutline) => void;
}

const ContentWizard: React.FC<ContentWizardProps> = ({ onComplete }) => {
  const [topic, setTopic] = useState('');
  const [content, setContent] = useState('');
  const [slug, setSlug] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleAiGenerate = async () => {
    if (!topic.trim()) {
      alert("Please enter a Title first so the AI knows what to write!");
      return;
    }
    
    setIsGenerating(true);
    setProgress(10);
    try {
      // 1. Generate Slug first for the URL field
      setProgress(30);
      const generatedSlug = await geminiService.generateSlug(topic);
      setSlug(generatedSlug);

      // 2. Prepare context for content generation
      setProgress(50);
      const research = await geminiService.deepResearch(topic);
      const tempBrief: ContentBrief = {
        id: Math.random().toString(36).substring(2, 15),
        topic: topic,
        competitorUrls: research.competitorUrls || [],
        backlinkUrls: research.backlinkUrls || [],
        targetKeywords: research.targetKeywords || [],
        secondaryKeywords: research.secondaryKeywords || [],
        audience: 'Professional',
        tone: 'Authoritative',
        length: 'medium',
        detailLevel: 'standard',
        status: 'draft',
        author: storageService.getAuthor(),
        createdAt: Date.now()
      };

      const generatedOutline = await geminiService.generateOutline(tempBrief);
      setProgress(70);
      
      // 3. Stream content into the Content Box (Step 2)
      let fullText = '';
      const stream = geminiService.streamContent(tempBrief, generatedOutline);
      for await (const chunk of stream) {
        const c = chunk as any;
        fullText += c.text || '';
        setContent(fullText);
      }
      
      setProgress(100);
      // Success - let the user see the result before they manually click "Save & Continue"
    } catch (e) {
      console.error("Generation failed", e);
      setProgress(0);
    } finally {
      setIsGenerating(false);
    }
  };

  const finalizeContent = () => {
    const brief: ContentBrief = {
      id: Math.random().toString(36).substring(2, 15),
      topic: topic || 'New Content',
      slug: slug,
      competitorUrls: [],
      backlinkUrls: [],
      targetKeywords: [],
      secondaryKeywords: [],
      audience: 'General',
      tone: 'Professional',
      length: 'medium',
      detailLevel: 'standard',
      status: 'content_ready',
      author: storageService.getAuthor(),
      createdAt: Date.now()
    };
    const outline: ContentOutline = {
      title: topic || 'Untitled Article',
      sections: []
    };
    onComplete(brief, outline);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-700 py-10 pb-32">
      <header className="text-center space-y-4">
        <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner relative">
          <FilePlus2 className="w-10 h-10 text-[#be185d]" />
          <Star className="w-4 h-4 text-pink-400 absolute bottom-3 right-3 animate-pulse" />
        </div>
        <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase font-heading leading-none">New Content</h1>
        <p className="text-pink-700 font-bold uppercase tracking-[0.3em] text-[11px]">Follow the 4 steps to generate professional articles.</p>
      </header>

      <div className="bg-white rounded-[64px] border-2 border-pink-100 shadow-2xl p-16 md:p-20 space-y-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-pink-50/50 rounded-full blur-[100px] -mr-48 -mt-48 opacity-50" />

        {/* STEP 1: TITLE */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 ml-2">
            <div className="w-10 h-10 rounded-2xl bg-pink-50 flex items-center justify-center border border-pink-100">
              <Type className="w-5 h-5 text-[#be185d]" />
            </div>
            <label className="text-sm font-black text-slate-800 uppercase tracking-[0.2em] font-heading">Step 1: Title</label>
          </div>
          <input
            type="text"
            placeholder="Enter your article title or topic..."
            className="w-full px-10 py-8 bg-pink-50/30 border-2 border-pink-100 focus:border-[#be185d] focus:bg-white rounded-[32px] outline-none text-2xl font-bold text-slate-900 transition-all placeholder:text-pink-200"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
        </div>

        {/* STEP 2: CONTENT BOX */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 ml-2">
            <div className="w-10 h-10 rounded-2xl bg-pink-50 flex items-center justify-center border border-pink-100">
              <PenTool className="w-5 h-5 text-[#be185d]" />
            </div>
            <label className="text-sm font-black text-slate-800 uppercase tracking-[0.2em] font-heading">Step 2: Content Box</label>
          </div>
          <div className="relative">
            <textarea
              placeholder="Content will appear here during generation, or you can type manually..."
              className="w-full min-h-[400px] px-10 py-10 bg-pink-50/10 border-2 border-pink-100 focus:border-[#be185d] focus:bg-white rounded-[48px] outline-none text-lg font-medium text-slate-800 transition-all placeholder:text-pink-100 resize-none shadow-inner leading-relaxed"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            {isGenerating && !content && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white/40 backdrop-blur-[2px] rounded-[48px]">
                <Loader2 className="w-10 h-10 animate-spin text-[#be185d]" />
                <p className="text-[10px] font-black text-[#be185d] uppercase tracking-[0.4em]">Synthesizing {progress}%</p>
              </div>
            )}
          </div>
        </div>

        {/* STEP 3: URL */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 ml-2">
            <div className="w-10 h-10 rounded-2xl bg-pink-50 flex items-center justify-center border border-pink-100">
              <Link2 className="w-5 h-5 text-[#be185d]" />
            </div>
            <label className="text-sm font-black text-slate-800 uppercase tracking-[0.2em] font-heading">Step 3: Blog URL</label>
          </div>
          <div className="relative group">
            <div className="absolute left-10 top-1/2 -translate-y-1/2 text-pink-400 font-bold text-lg font-heading">anchorchartpro /</div>
            <input
              type="text"
              placeholder="your-blog-url-slug"
              className="w-full pl-[210px] pr-10 py-8 bg-pink-50/30 border-2 border-pink-100 focus:border-[#be185d] focus:bg-white rounded-[32px] outline-none text-xl font-bold text-[#be185d] transition-all"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
          </div>
        </div>

        {/* STEP 4: GENERATE BUTTON */}
        <div className="pt-8 space-y-6">
          <button
            onClick={handleAiGenerate}
            disabled={isGenerating || !topic.trim()}
            className={`w-full py-10 rounded-[40px] font-black text-2xl uppercase tracking-[0.3em] flex items-center justify-center gap-6 transition-all shadow-2xl active:scale-95 group font-heading ${
              isGenerating ? 'bg-pink-100 text-pink-400' : 'girly-gradient text-white shadow-pink-200 hover:opacity-95'
            }`}
          >
            {isGenerating ? <Loader2 className="w-10 h-10 animate-spin" /> : <Wand2 className="w-10 h-10 group-hover:rotate-12 transition-transform" />}
            <span>{isGenerating ? 'Generating...' : 'Step 4: AI Generates All'}</span>
          </button>
          
          <div className="flex items-center gap-8 justify-center">
            <div className="h-px flex-1 bg-pink-100" />
            <button 
              onClick={finalizeContent}
              disabled={!content || isGenerating}
              className={`px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] flex items-center gap-3 transition-all ${
                content ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200' : 'text-slate-300 pointer-events-none'
              }`}
            >
              <Check className="w-5 h-5" /> {content ? 'Lock Content' : 'Waiting for Draft'}
            </button>
            <div className="h-px flex-1 bg-pink-100" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentWizard;
