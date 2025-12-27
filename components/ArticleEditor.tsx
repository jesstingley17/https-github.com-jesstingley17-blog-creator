
import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  ChevronLeft, 
  Loader2, 
  X,
  Check,
  Zap,
  Target,
  Image as ImageIcon,
  Database,
  Code,
  Copy,
  Type,
  Link2,
  RefreshCw,
  Sparkles,
  Star,
  PenTool,
  Anchor,
  Globe,
  Settings,
  Wand2,
  BookmarkPlus,
  ArrowRight,
  Save
} from 'lucide-react';
import { geminiService } from '../geminiService';
import { storageService } from '../storageService';
import { ContentBrief, ContentOutline, SEOAnalysis, ArticleImage, AppRoute, SavedPrompt } from '../types';
import ImageGenerator from './ImageGenerator';

interface ArticleEditorProps {
  brief: ContentBrief;
  outline: ContentOutline;
  onBack: () => void;
  onNavigate?: (route: AppRoute) => void;
}

const ArticleEditor: React.FC<ArticleEditorProps> = ({ brief: initialBrief, outline: initialOutline, onBack, onNavigate }) => {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState(initialOutline?.title || '');
  const [slug, setSlug] = useState(initialBrief?.slug || '');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [analysis, setAnalysis] = useState<SEOAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'edit'>('preview');
  
  const [articleImages, setArticleImages] = useState<ArticleImage[]>([]);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Prompt Optimization States
  const [isOptimizingPrompt, setIsOptimizingPrompt] = useState(false);
  const [optimizedPrompt, setOptimizedPrompt] = useState<Partial<SavedPrompt> | null>(null);
  const [promptSaved, setPromptSaved] = useState(false);

  useEffect(() => {
    const loadDraft = async () => {
      if (!initialBrief?.id) return;
      try {
        const data = await storageService.getArticle(initialBrief.id);
        if (data) {
          if (data.content) setContent(data.content);
          if (data.outline) setTitle(data.outline.title);
          if (data.slug) setSlug(data.slug);
          if (data.analysis) setAnalysis(data.analysis);
          if (data.images) setArticleImages(data.images);
          if (data.content) setHasStarted(true);
        }
      } catch (e) {}
    };
    loadDraft();
  }, [initialBrief?.id]);

  useEffect(() => {
    if (!hasStarted) return;
    const saveArticle = async () => {
      setSaveStatus('saving');
      try {
        await storageService.upsertArticle({
          id: initialBrief.id,
          brief: { ...initialBrief, slug },
          outline: { ...initialOutline, title },
          content,
          slug,
          analysis,
          heroImageUrl: articleImages.find(img => img.isHero)?.url || null,
          images: articleImages,
          citations: [],
          updatedAt: Date.now()
        });
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (e) { setSaveStatus('idle'); }
    };
    const timer = setTimeout(saveArticle, 3000);
    return () => clearTimeout(timer);
  }, [content, title, slug, articleImages, analysis]);

  const startGeneration = async () => {
    setHasStarted(true);
    setIsGenerating(true);
    setViewMode('preview');
    let fullText = '';
    try {
      if (!slug) {
        const generatedSlug = await geminiService.generateSlug(title);
        setSlug(generatedSlug);
      }
      const stream = geminiService.streamContent(initialBrief, { ...initialOutline, title });
      for await (const chunk of stream) {
        const c = chunk as any;
        fullText += c.text || '';
        setContent(fullText);
      }
      performAnalysis(fullText);
    } catch (error) {} finally { setIsGenerating(false); }
  };

  const performAnalysis = async (text: string) => {
    setAnalyzing(true);
    try {
      const result = await geminiService.analyzeSEO(text, initialBrief.targetKeywords || []);
      setAnalysis(result);
    } catch (e) {} finally { setAnalyzing(false); }
  };

  const handleOptimizePrompt = async () => {
    setIsOptimizingPrompt(true);
    setPromptSaved(false);
    try {
      const result = await geminiService.optimizeStrategicPrompt(title || initialBrief.topic);
      setOptimizedPrompt(result);
    } catch (e) {
      console.error("Prompt optimization failed", e);
    } finally {
      setIsOptimizingPrompt(false);
    }
  };

  const handleSaveOptimizedPrompt = async () => {
    if (!optimizedPrompt) return;
    const stencil: SavedPrompt = {
      id: Math.random().toString(36).substr(2, 9),
      title: optimizedPrompt.title || title,
      rawInput: title,
      optimizedPrompt: optimizedPrompt.optimizedPrompt || '',
      sourceUrl: slug ? `https://anchorchartpro/${slug}` : undefined,
      tags: optimizedPrompt.tags || ['Optimized'],
      usageCount: 1,
      createdAt: Date.now()
    };
    await storageService.savePrompt(stencil);
    setPromptSaved(true);
  };

  return (
    <div className="flex h-[calc(100vh-100px)] gap-10 overflow-hidden max-w-[1600px] mx-auto">
      {/* 1. Main Content Generator Interface */}
      <div className="flex-1 flex flex-col bg-white rounded-[48px] border-2 border-pink-100 shadow-2xl overflow-hidden relative">
        <header className="px-12 py-8 border-b border-pink-50 flex items-center justify-between bg-white sticky top-0 z-40">
          <div className="flex items-center gap-8">
            <button onClick={onBack} className="p-4 bg-pink-50 hover:bg-pink-100 rounded-3xl transition-all group">
              <ChevronLeft className="w-6 h-6 text-pink-700 group-hover:scale-110" />
            </button>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <Anchor className="w-4 h-4 text-pink-700" />
                <span className="text-[11px] font-black text-pink-500 uppercase tracking-widest font-heading">Content Synthesis</span>
              </div>
              <h2 className="font-bold text-slate-900 text-xl tracking-tight mt-1 font-heading">
                {title || 'Untitled Creation'}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex bg-pink-50 p-1.5 rounded-[22px] border border-pink-100">
              <button onClick={() => setViewMode('preview')} className={`px-8 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all ${viewMode === 'preview' ? 'bg-white shadow-md text-pink-700' : 'text-pink-400 hover:text-pink-600'}`}>Preview</button>
              <button onClick={() => setViewMode('edit')} className={`px-8 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all ${viewMode === 'edit' ? 'bg-white shadow-md text-pink-700' : 'text-pink-400 hover:text-pink-600'}`}>Edit</button>
            </div>
            {saveStatus === 'saving' && <Loader2 className="w-5 h-5 animate-spin text-pink-300" />}
            {saveStatus === 'saved' && <Check className="w-5 h-5 text-emerald-500" />}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-16 md:p-24 custom-scrollbar bg-white scroll-smooth h-full">
          <div className="max-w-4xl mx-auto space-y-20 pb-32">
            
            {/* STEP 1: TITLE */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 ml-2">
                <Type className="w-5 h-5 text-pink-700" />
                <label className="text-xs font-black text-pink-800 uppercase tracking-[0.2em] font-heading">1. Main Headline</label>
              </div>
              <input 
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-transparent border-none focus:ring-0 text-6xl font-black text-slate-900 tracking-tighter outline-none leading-tight font-heading placeholder:text-pink-100"
                placeholder="The Magic of Content..."
              />
            </div>

            {/* STEP 2: CONTENT BOX */}
            <div className="space-y-6">
              <div className="flex items-center justify-between ml-2">
                <div className="flex items-center gap-3">
                  <PenTool className="w-5 h-5 text-pink-700" />
                  <label className="text-xs font-black text-pink-800 uppercase tracking-[0.2em] font-heading">2. Content Forge</label>
                </div>
                {viewMode === 'edit' && <span className="text-[10px] bg-slate-100 px-3 py-1 rounded-full font-bold text-slate-400">Manual Override Active</span>}
              </div>
              
              <div className={`rounded-[40px] transition-all min-h-[800px] ${viewMode === 'edit' ? 'bg-pink-50/20 border-2 border-pink-100 shadow-inner' : ''}`}>
                {viewMode === 'preview' ? (
                  <div className="markdown-body p-8">
                    {content ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-60 gap-10">
                        <div className="relative group">
                          <div className="absolute inset-0 bg-pink-200 blur-3xl rounded-full opacity-30 group-hover:opacity-50 transition-opacity" />
                          <Loader2 className="w-24 h-24 animate-spin text-pink-100 relative z-10" />
                          <Anchor className="w-10 h-10 text-pink-400 absolute inset-0 m-auto" />
                        </div>
                        <div className="text-center space-y-2">
                          <p className="text-sm font-black text-pink-300 uppercase tracking-[0.5em] font-heading">Forge Empty</p>
                          <p className="text-xs font-medium text-pink-200 italic uppercase tracking-widest">Awaiting digital synthesis</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <textarea 
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full min-h-[800px] bg-white border-none outline-none font-mono text-lg resize-none p-16 leading-relaxed text-slate-800 shadow-xl rounded-[40px]"
                    placeholder="Drop your thoughts or hit generate..."
                  />
                )}
              </div>
            </div>

            {/* STEP 3: URL */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 ml-2">
                <Link2 className="w-5 h-5 text-pink-700" />
                <label className="text-xs font-black text-pink-800 uppercase tracking-[0.2em] font-heading">3. Content URL Slug</label>
              </div>
              <div className="group relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-10 pointer-events-none">
                  <span className="text-pink-400 font-bold text-base font-heading">anchorchartpro /</span>
                </div>
                <input 
                  type="text" 
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full bg-pink-50/30 border-2 border-pink-100 focus:border-pink-300 focus:bg-white rounded-[32px] pl-[150px] pr-16 py-8 font-medium text-lg text-pink-900 outline-none transition-all shadow-sm focus:shadow-xl focus:shadow-pink-100"
                  placeholder="how-to-engineer-content"
                />
                <button 
                  onClick={async () => setSlug(await geminiService.generateSlug(title))}
                  className="absolute right-6 top-1/2 -translate-y-1/2 p-4 bg-white border border-pink-100 rounded-2xl text-pink-600 hover:bg-pink-50 transition-all shadow-sm"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* STEP 4: AI GENERATE BUTTON */}
            <div className="pt-10">
              <button 
                onClick={startGeneration} 
                disabled={isGenerating}
                className={`w-full py-10 rounded-[40px] font-black text-xl uppercase tracking-[0.3em] flex items-center justify-center gap-6 transition-all shadow-2xl active:scale-95 group font-heading ${
                  isGenerating ? 'bg-pink-100 text-pink-400' : 'girly-gradient text-white shadow-pink-200 hover:opacity-90'
                }`}
              >
                {isGenerating ? <Loader2 className="w-8 h-8 animate-spin" /> : <Wand2 className="w-8 h-8 group-hover:rotate-45 transition-transform" />}
                <span>{isGenerating ? 'Synthesizing...' : '4. AI Generates All'}</span>
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* 2. Sidebars (Analysis & Assets & Prompt Optimizer) */}
      <div className="w-96 flex-shrink-0 flex flex-col gap-10 overflow-y-auto custom-scrollbar pb-12 pr-1 h-full">
        {/* Matrix Score */}
        <div className="bg-white rounded-[48px] border-2 border-pink-100 shadow-xl p-10 space-y-10">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-pink-800 text-xs uppercase tracking-[0.2em] flex items-center gap-3 font-heading">
              <Target className="w-5 h-5 text-pink-700" /> Matrix Score
            </h3>
            <Settings className="w-4 h-4 text-pink-200 hover:text-pink-400 cursor-pointer" />
          </div>
          <div className="text-center py-16 girly-gradient rounded-[56px] relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
            <div className="text-9xl font-black text-white tracking-tighter relative z-10 font-heading drop-shadow-xl">
              {analyzing ? <Loader2 className="w-16 h-16 animate-spin mx-auto opacity-50" /> : (analysis?.score || 0)}
            </div>
            <p className="text-xs font-black text-pink-100 uppercase tracking-[0.5em] mt-6 relative z-10 italic">Trust Efficiency</p>
          </div>
          
          <div className="space-y-4 pt-4">
             <div className="p-6 bg-pink-50/50 rounded-3xl border border-pink-100">
                <p className="text-[11px] font-black text-pink-700 uppercase tracking-widest mb-3">Core Suggestions</p>
                <div className="space-y-3">
                   {analysis?.suggestions.slice(0, 3).map((s, i) => (
                     <div key={i} className="flex gap-2 items-start text-[11px] text-slate-600 font-medium">
                        <Star className="w-3 h-3 text-pink-400 shrink-0 mt-0.5" />
                        <span>{s}</span>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        </div>

        {/* Prompt Saver / Optimizer */}
        <div className="bg-slate-900 rounded-[48px] shadow-xl p-10 space-y-8 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-pink-600/10 rounded-full blur-3xl -mr-16 -mt-16" />
           <h3 className="font-black text-pink-100 text-xs uppercase tracking-[0.2em] flex items-center gap-3 font-heading relative z-10">
             <BookmarkPlus className="w-5 h-5 text-pink-500" /> Stencil Optimizer
           </h3>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
             Summarize and refine this topic into a persistent Magic Stencil for future high-authority generation.
           </p>

           {!optimizedPrompt ? (
             <button 
               onClick={handleOptimizePrompt}
               disabled={isOptimizingPrompt}
               className="w-full py-5 bg-slate-800 hover:bg-slate-700 text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all border border-slate-700"
             >
               {isOptimizingPrompt ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-pink-500" />}
               {isOptimizingPrompt ? 'Optimizing...' : 'Refine Topic Prompt'}
             </button>
           ) : (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
               <div className="p-6 bg-slate-800 rounded-3xl border border-pink-900/30 space-y-3">
                 <p className="text-[9px] font-black text-pink-400 uppercase tracking-[0.4em]">Optimized Stencil</p>
                 <p className="text-[11px] text-slate-300 font-medium italic leading-relaxed line-clamp-4">
                   "{optimizedPrompt.optimizedPrompt}"
                 </p>
               </div>
               <button 
                 onClick={handleSaveOptimizedPrompt}
                 disabled={promptSaved}
                 className={`w-full py-5 rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all ${
                   promptSaved ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'girly-gradient text-white shadow-lg'
                 }`}
               >
                 {promptSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                 {promptSaved ? 'Stencil Saved' : 'Save as Magic Stencil'}
               </button>
             </div>
           )}
        </div>

        {/* Digital Assets */}
        <div className="bg-white rounded-[48px] border-2 border-pink-100 shadow-xl p-10 space-y-10">
           <h3 className="font-black text-pink-800 text-xs uppercase tracking-[0.2em] flex items-center gap-3 font-heading">
             <ImageIcon className="w-5 h-5 text-pink-700" /> Digital Assets
           </h3>
           <ImageGenerator 
              defaultPrompt={`High-end professional photography, clean aesthetic background, soft lighting, 8k resolution.`} 
              onImageGenerated={(url, prompt) => setArticleImages(prev => [...prev, { id: Math.random().toString(36).substr(2,9), url, prompt, isHero: false }])}
              topicContext={title}
            />
            <div className="grid grid-cols-2 gap-5">
              {articleImages.map(img => (
                <div key={img.id} className="aspect-square rounded-[36px] overflow-hidden border-4 border-pink-50 bg-pink-50 group hover:ring-8 hover:ring-pink-400 transition-all cursor-pointer shadow-lg">
                   <img src={img.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt="Asset" />
                </div>
              ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleEditor;
