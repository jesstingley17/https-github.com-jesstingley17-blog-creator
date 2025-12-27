
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
  Sparkles,
  Search,
  Zap
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
  const [researchComplete, setResearchComplete] = useState(false);

  const handleAiGenerate = async () => {
    if (!topic.trim()) {
      alert("Please enter a Title first so the AI knows what to write!");
      return;
    }
    
    setIsGenerating(true);
    setProgress(5);
    try {
      // 1. URL Research & Slug Generation
      setProgress(15);
      const generatedSlug = await geminiService.generateSlug(topic);
      setSlug(generatedSlug);
      
      // 2. Deep SEO Research
      setProgress(40);
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

      // 3. Structure synthesis
      setProgress(65);
      const generatedOutline = await geminiService.generateOutline(tempBrief);
      
      // 4. Content Forging
      setProgress(85);
      let fullText = '';
      const stream = geminiService.streamContent(tempBrief, generatedOutline);
      for await (const chunk of stream) {
        const c = chunk as any;
        fullText += c.text || '';
        setContent(fullText);
      }
      
      setProgress(100);
      setResearchComplete(true);
    } catch (e) {
      console.error("Generation failed", e);
      setProgress(0);
      alert("Synthesis interrupted. Please check your connection or API key.");
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
        <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase font-heading leading-none italic">New Content</h1>
        <p className="text-pink-700 font-bold uppercase tracking-[0.3em] text-[11px]">Follow the 4 steps to synthesize professional articles.</p>
      </header>

      <div className="bg-white rounded-[64px] border-2 border-pink-100 shadow-2xl p-16 md:p-20 space-y-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-pink-50/50 rounded-full blur-[100px] -mr-48 -mt-48 opacity-50" />

        {/* STEP 1: TITLE */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 ml-2">
            <div className="w-10 h-10 rounded-2xl bg-pink-50 flex items-center justify-center border border-pink-100">
              <Type className="w-5 h-5 text-[#be185d]" />
            </div>
            <label className="text-sm font-black text-slate-800 uppercase tracking-[0.2em] font-heading">Step 1: Main Title</label>
          </div>
          <input
            type="text"
            placeholder="Enter your article headline or topic..."
            className="w-full px-10 py-8 bg-pink-50/30 border-2 border-pink-100 focus:border-[#be185d] focus:bg-white rounded-[32px] outline-none text-2xl font-bold text-slate-900 transition-all placeholder:text-pink-200 shadow-inner"
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
          <div className="relative group">
            <textarea
              placeholder="Content will be forged here automatically..."
              className="w-full min-h-[500px] px-10 py-10 bg-pink-50/10 border-2 border-pink-100 focus:border-[#be185d] focus:bg-white rounded-[48px] outline-none text-lg font-medium text-slate-800 transition-all placeholder:text-pink-100 resize-none shadow-inner leading-relaxed"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            {isGenerating && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-white/60 backdrop-blur-[4px] rounded-[48px] z-10 transition-all">
                <div className="relative">
                  <Loader2 className="w-20 h-20 animate-spin text-[#be185d]" />
                  <Sparkles className="w-8 h-8 text-pink-400 absolute inset-0 m-auto animate-pulse" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-black text-[#be185d] uppercase tracking-[0.5em] mb-2">Synthesizing {progress}%</p>
                  <p className="text-[9px] font-bold text-pink-400 uppercase tracking-widest italic animate-bounce">
                    {progress < 30 ? "Initializing Research..." : 
                     progress < 60 ? "Deep SEO Analysis..." : 
                     progress < 90 ? "Drafting Content..." : "Polishing Article..."}
                  </p>
                </div>
              </div>
            )}
            {!isGenerating && !content && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-40">
                 <Zap className="w-16 h-16 text-pink-100 mb-4" />
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-pink-200">Awaiting Digital Forge</p>
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
            <label className="text-sm font-black text-slate-800 uppercase tracking-[0.2em] font-heading">Step 3: Article URL Synthesis</label>
          </div>
          <div className="relative group">
            <div className="absolute left-10 top-1/2 -translate-y-1/2 text-pink-400 font-bold text-lg font-heading">anchorchartpro /</div>
            <input
              type="text"
              placeholder="optimized-article-url"
              className="w-full pl-[220px] pr-10 py-8 bg-pink-50/30 border-2 border-pink-100 focus:border-[#be185d] focus:bg-white rounded-[32px] outline-none text-xl font-bold text-[#be185d] transition-all shadow-inner"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
          </div>
        </div>

        {/* STEP 4: GENERATE BUTTON */}
        <div className="pt-8 space-y-8">
          <button
            onClick={handleAiGenerate}
            disabled={isGenerating || !topic.trim()}
            className={`w-full py-12 rounded-[48px] font-black text-3xl uppercase tracking-[0.4em] flex items-center justify-center gap-8 transition-all shadow-2xl active:scale-95 group font-heading ${
              isGenerating ? 'bg-pink-100 text-pink-400' : 'girly-gradient text-white shadow-pink-200 hover:opacity-95'
            }`}
          >
            {isGenerating ? <Loader2 className="w-12 h-12 animate-spin" /> : <Wand2 className="w-12 h-12 group-hover:rotate-[20deg] transition-transform" />}
            <span>{isGenerating ? 'Forging...' : 'Step 4: AI Generates All'}</span>
          </button>
          
          <div className="flex items-center gap-10 justify-center">
            <div className="h-px flex-1 bg-pink-100" />
            <button 
              onClick={finalizeContent}
              disabled={!content || isGenerating}
              className={`px-16 py-6 rounded-[24px] font-black text-xs uppercase tracking-[0.4em] flex items-center gap-4 transition-all shadow-lg ${
                content ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-2 border-emerald-200 active:scale-95' : 'bg-slate-50 text-slate-300 border-2 border-slate-100 pointer-events-none'
              }`}
            >
              <Check className="w-5 h-5" /> {content ? 'Lock & Continue' : 'Awaiting Content'}
            </button>
            <div className="h-px flex-1 bg-pink-100" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentWizard;
