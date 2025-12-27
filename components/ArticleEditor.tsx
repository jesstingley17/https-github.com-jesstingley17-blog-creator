
import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  ChevronLeft, 
  Loader2, 
  Play, 
  X,
  Check,
  Globe,
  ArrowRight,
  Zap,
  Target,
  BrainCircuit,
  ArrowUpRight,
  Plus,
  Image as ImageIcon,
  Star,
  Quote,
  Flame,
  User,
  ExternalLink,
  Link2,
  Search,
  Info,
  Camera
} from 'lucide-react';
import { geminiService } from '../geminiService';
import { storageService } from '../storageService';
import { ContentBrief, ContentOutline, SEOAnalysis, ScheduledPost, ArticleImage, AppRoute, Citation, BacklinkOpportunity } from '../types';
import ImageGenerator from './ImageGenerator';

interface ArticleEditorProps {
  brief: ContentBrief;
  outline: ContentOutline;
  onBack: () => void;
  onNavigate?: (route: AppRoute) => void;
  onSchedule?: (post: ScheduledPost) => void;
}

const ArticleEditor: React.FC<ArticleEditorProps> = ({ brief, outline: initialOutline, onBack, onNavigate, onSchedule }) => {
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationLogs, setOptimizationLogs] = useState<string[]>([]);
  const [hasStarted, setHasStarted] = useState(false);
  const [analysis, setAnalysis] = useState<SEOAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'edit'>('preview');
  
  const [showForge, setShowForge] = useState(false);
  const [forgeInput, setForgeInput] = useState('');
  const [isForging, setIsForging] = useState(false);
  const [forgeLogs, setForgeLogs] = useState<string[]>([]);
  
  const [articleImages, setArticleImages] = useState<ArticleImage[]>([]);
  const [backlinkOps, setBacklinkOps] = useState<BacklinkOpportunity[]>([]);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [showSourcesInline, setShowSourcesInline] = useState(false);
  const [isDiscoveringBacklinks, setIsDiscoveringBacklinks] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [localOutline, setLocalOutline] = useState<ContentOutline>(() => {
    return initialOutline && Array.isArray(initialOutline?.sections) 
      ? initialOutline 
      : { title: brief?.topic || 'Untitled', sections: [] };
  });

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    const loadDraft = async () => {
      if (!brief?.id) return;
      try {
        const data = await storageService.getArticle(brief.id);
        if (data) {
          if (data.content) setContent(data.content);
          if (data.outline?.sections) setLocalOutline(data.outline);
          if (data.analysis) setAnalysis(data.analysis);
          if (data.images) setArticleImages(data.images);
          if (data.citations) setCitations(data.citations);
          if (data.backlinkOpportunities) setBacklinkOps(data.backlinkOpportunities);
          if (data.content || data.images?.length) setHasStarted(true);
        }
      } catch (e) {}
    };
    loadDraft();
  }, [brief?.id]);

  useEffect(() => {
    if (!hasStarted) return;
    
    const saveArticle = async () => {
      setSaveStatus('saving');
      try {
        await storageService.upsertArticle({
          id: brief.id,
          brief,
          outline: localOutline,
          content,
          analysis,
          heroImageUrl: articleImages.find(img => img.isHero)?.url || null,
          images: articleImages,
          citations,
          backlinkOpportunities: backlinkOps,
          updatedAt: Date.now()
        });
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (e) {
        setSaveStatus('idle');
      }
    };

    const timer = setTimeout(saveArticle, 3000);
    return () => clearTimeout(timer);
  }, [content, localOutline, analysis, articleImages, backlinkOps, citations]);

  const addOptLog = (msg: string) => {
    const ts = new Date().toLocaleTimeString('en-US', { hour12: false });
    setOptimizationLogs(prev => [...prev.slice(-4), `[${ts}] ${msg}`]);
  };

  const addForgeLog = (msg: string) => {
    const ts = new Date().toLocaleTimeString('en-US', { hour12: false });
    setForgeLogs(prev => [...prev.slice(-4), `[${ts}] ${msg}`]);
  };

  const startGeneration = async () => {
    setHasStarted(true);
    setIsGenerating(true);
    setViewMode('preview');
    let fullText = '';
    try {
      const stream = geminiService.streamContent(brief, localOutline);
      for await (const chunk of stream) {
        const c = chunk as any;
        fullText += c.text || '';
        setContent(fullText);

        const metadata = c.candidates?.[0]?.groundingMetadata;
        if (metadata?.groundingChunks) {
          const newSources: Citation[] = metadata.groundingChunks
            .filter((gc: any) => gc.web)
            .map((gc: any, idx: number) => ({
              id: citations.length + idx + 1,
              url: gc.web.uri,
              title: gc.web.title || 'Referenced Source'
            }));

          if (newSources.length > 0) {
            setCitations(prev => {
              const existingUrls = new Set(prev.map(p => p.url));
              const uniqueNew = newSources.filter(ns => !existingUrls.has(ns.url));
              return [...prev, ...uniqueNew];
            });
          }
        }
      }
      performAnalysis(fullText);
      
      const styleFocus = brief.tone.toLowerCase().includes('professional') || brief.tone.toLowerCase().includes('authoritative')
        ? "high-end corporate studio photography, sophisticated lighting, clean and modern aesthetic"
        : "vibrant and dynamic digital art, creative composition, dramatic lighting and rich colors";

      const heroImagePrompt = `A stunning, high-resolution hero image for a professional article.
      Title: "${localOutline.title}"
      Topic: ${brief.topic}
      Tone: ${brief.tone}
      Visual Style: ${styleFocus}. 
      The image should be photorealistic, conceptually strong, and perfectly frame the core message of the article.`;

      const heroUrl = await geminiService.generateArticleImage(heroImagePrompt);
      setArticleImages([{ id: Math.random().toString(36).substr(2, 9), url: heroUrl, prompt: heroImagePrompt, isHero: true }]);
    } catch (error) {} finally { setIsGenerating(false); }
  };

  const handleForgeRefinement = async () => {
    if (!forgeInput.trim()) return;
    setIsForging(true);
    setForgeLogs([]);
    addForgeLog('Initializing Forge...');
    addForgeLog('Processing synthesis nodes...');
    
    try {
      const refined = await geminiService.refineTextWithContext(forgeInput, localOutline.title, brief.tone, brief.author);
      addForgeLog('Refinement successful.');
      setContent(prev => prev + "\n\n" + refined);
      setTimeout(() => {
        setShowForge(false);
        setForgeInput('');
        setIsForging(false);
        setViewMode('edit');
      }, 800);
    } catch (e) {
      addForgeLog('Process error.');
      setIsForging(false);
    }
  };

  const handleFullOptimization = async () => {
    if (!content || isOptimizing) return;
    setIsOptimizing(true);
    setOptimizationLogs([]);
    addOptLog('Analyzing semantic structure...');
    addOptLog('Optimizing keyword distribution...');
    
    try {
      const optimized = await geminiService.optimizeContent(content, brief, brief.author);
      setContent(optimized);
      addOptLog('Calculating new SEO scores...');
      await performAnalysis(optimized);
      addOptLog('Optimization complete.');
      setTimeout(() => setIsOptimizing(false), 2000);
    } catch (e) { 
      console.error(e);
      setIsOptimizing(false); 
    }
  };

  const handleDiscoverBacklinks = async () => {
    setIsDiscoveringBacklinks(true);
    try {
      const ops = await geminiService.discoverBacklinks(localOutline.title, brief.targetKeywords);
      setBacklinkOps(ops);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDiscoveringBacklinks(false);
    }
  };

  const performAnalysis = async (text: string) => {
    setAnalyzing(true);
    try {
      const result = await geminiService.analyzeSEO(text, brief.targetKeywords || []);
      setAnalysis(result);
    } catch (e) {} finally { setAnalyzing(false); }
  };

  const handleAddImage = (img: ArticleImage) => {
    setArticleImages(prev => [...prev, img]);
  };

  const heroImage = articleImages.find(img => img.isHero);

  return (
    <div className="flex h-screen gap-6 overflow-hidden">
      {/* Main Content Area - Scrollable */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative">
        <header className="px-6 py-4 border-b flex items-center justify-between bg-white/90 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><ChevronLeft className="w-5 h-5 text-slate-500" /></button>
            <div className="flex flex-col">
              <h2 className="font-bold text-slate-900 line-clamp-1 text-sm md:text-base leading-tight">{localOutline?.title}</h2>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase text-indigo-600 tracking-wider whitespace-nowrap">As: {brief.author.name}</span>
                {saveStatus !== 'idle' && (
                  <span className="text-[10px] text-slate-300 font-medium flex items-center gap-1">
                    {saveStatus === 'saving' ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Check className="w-2.5 h-2.5 text-emerald-500" />}
                    {saveStatus === 'saving' ? 'Syncing...' : 'Saved'}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex bg-slate-100 p-1 rounded-xl mr-2">
              <button onClick={() => setViewMode('preview')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'preview' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>Preview</button>
              <button onClick={() => setViewMode('edit')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'edit' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>Editor</button>
            </div>
            <button onClick={() => setShowForge(true)} className="p-2 md:px-4 md:py-2 bg-slate-100 md:bg-slate-900 text-slate-600 md:text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-200 md:hover:bg-slate-800 transition-all">
              <Flame className="w-3.5 h-3.5 text-orange-400" /> <span className="hidden md:inline">Forge</span>
            </button>
            <button onClick={hasStarted ? () => {} : startGeneration} className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm hover:bg-indigo-700 transition-all">
              {hasStarted ? <ArrowUpRight className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />} <span>{hasStarted ? 'Deploy' : 'Synthesize'}</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 md:p-12 lg:p-16 custom-scrollbar bg-white scroll-smooth">
          {!hasStarted ? (
            <div className="max-w-3xl mx-auto space-y-10 py-10">
               <div className="text-center space-y-3">
                 <h3 className="text-4xl font-bold text-slate-900 tracking-tight italic">Strategy Mapped</h3>
                 <p className="text-slate-500 max-w-lg mx-auto">Ready to generate content grounded in your expertise and verified by search intelligence.</p>
               </div>
               <div className="grid gap-4">
                 {localOutline.sections?.map((s, i) => (
                   <div key={i} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex gap-6">
                     <span className="text-2xl font-black text-indigo-100 leading-none">{String(i+1).padStart(2, '0')}</span>
                     <div>
                       <h4 className="font-bold text-slate-900 text-base mb-2">{s.heading}</h4>
                       <div className="flex flex-wrap gap-2">
                         {s.subheadings?.map((sub, j) => (
                           <span key={j} className="text-[10px] px-2.5 py-1.5 bg-white border border-slate-100 rounded-lg text-slate-400 font-bold uppercase tracking-wider">{sub}</span>
                         ))}
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-12 pb-32">
              {/* Author Perspective Card */}
              <div className="p-8 bg-slate-50/50 rounded-3xl border border-slate-100 flex flex-col md:flex-row items-center md:items-start gap-8 shadow-sm">
                <div className="w-20 h-20 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0 border border-slate-200 overflow-hidden relative ring-4 ring-white group cursor-default">
                  {brief.author.photoUrl ? (
                    <img src={brief.author.photoUrl} alt={brief.author.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-slate-100 gap-1">
                      <User className="w-8 h-8 text-indigo-200" />
                      <div className="text-[7px] font-black text-indigo-300 uppercase tracking-widest">Author</div>
                    </div>
                  )}
                </div>
                <div className="text-center md:text-left space-y-2">
                  <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
                    <p className="text-xl font-bold text-slate-900 leading-tight">Written by {brief.author.name}</p>
                    <span className="hidden md:inline text-slate-300">•</span>
                    <p className="font-bold text-indigo-600 text-[10px] uppercase tracking-widest">{brief.author.title}</p>
                  </div>
                  <p className="text-slate-500 text-sm leading-relaxed max-w-2xl italic">"{brief.author.bio}"</p>
                </div>
              </div>

              {heroImage && <img src={heroImage.url} className="w-full h-auto max-h-[500px] object-cover rounded-3xl shadow-xl ring-1 ring-slate-100" alt="Hero" />}
              
              <div className="px-2">
                {viewMode === 'preview' ? (
                  <div className="markdown-body">
                    <ReactMarkdown>{content || "Awaiting neural synthesis..."}</ReactMarkdown>
                    {isGenerating && (
                      <div className="flex flex-col items-center gap-5 my-20 animate-pulse">
                        <Loader2 className="w-10 h-10 animate-spin text-indigo-300" />
                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em]">Synthesizing Authority Nodes...</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <textarea 
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full min-h-[1000px] bg-transparent border-none outline-none font-mono text-sm md:text-base resize-none leading-relaxed text-slate-800 placeholder:text-slate-200"
                    placeholder="Refining the synthesis node..."
                  />
                )}
              </div>

              {hasStarted && (
                <div className="pt-16 border-t border-slate-100">
                  <button onClick={() => setShowSourcesInline(!showSourcesInline)} className="flex items-center gap-3 px-8 py-4 bg-slate-50 text-slate-600 rounded-2xl text-xs font-bold hover:bg-slate-100 hover:text-indigo-600 transition-all shadow-sm active:scale-95">
                    <Link2 className={`w-4 h-4 transition-transform duration-300 ${showSourcesInline ? 'text-indigo-600 rotate-45' : ''}`} />
                    {showSourcesInline ? 'Hide Bibliography' : `View Citations & Sources (${citations.length})`}
                  </button>

                  {showSourcesInline && (
                    <div className="mt-8 animate-in slide-in-from-top-4 duration-500 grid grid-cols-1 md:grid-cols-2 gap-6">
                      {citations.length > 0 ? citations.map((c) => (
                        <div key={c.id} className="p-6 bg-white rounded-[32px] border border-slate-100 hover:border-indigo-100 transition-all group shadow-sm">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[9px] font-bold text-indigo-500 uppercase px-2 py-1 bg-indigo-50 rounded-lg">Source Node {c.id}</span>
                            <a href={c.url} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-slate-50 rounded-xl text-slate-300 hover:text-indigo-600 transition-all"><ExternalLink className="w-4 h-4" /></a>
                          </div>
                          <h4 className="font-bold text-slate-900 text-base line-clamp-2 leading-tight">{c.title}</h4>
                        </div>
                      )) : (
                        <div className="col-span-full p-16 text-center bg-slate-50/50 rounded-[40px] border-2 border-dashed border-slate-100">
                           <p className="text-xs font-bold text-slate-300 uppercase tracking-widest italic">No citations indexed for this pass.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar - Scrollable independently */}
      <div className="w-80 flex-shrink-0 flex flex-col gap-6 overflow-y-auto custom-scrollbar pb-12 pr-1">
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-6 space-y-6">
          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-widest flex items-center gap-2"><Target className="w-4 h-4 text-indigo-600" /> SEO Analysis</h3>
          <div className="text-center py-6 bg-slate-50 rounded-[24px] border border-slate-100 relative overflow-hidden">
            {isOptimizing && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-4">
                 <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
                 <p className="text-[8px] font-black text-indigo-600 uppercase tracking-widest text-center">Re-Calculating Logic...</p>
              </div>
            )}
            <div className="text-7xl font-black text-indigo-600 tracking-tighter">
              {analyzing ? <Loader2 className="w-12 h-12 animate-spin mx-auto text-indigo-100" /> : (analysis?.score || 0)}
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Authority Score</p>
          </div>
          
          <button 
            onClick={handleFullOptimization} 
            disabled={isOptimizing || !content} 
            className={`w-full py-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-3 shadow-lg transition-all active:scale-95 ${
              isOptimizing ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
          >
            {isOptimizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-indigo-400" />}
            {isOptimizing ? 'Synthesizing...' : 'Re-Optimize SEO'}
          </button>
          
          {optimizationLogs.length > 0 && (
            <div className="space-y-1 mt-4">
              {optimizationLogs.map((log, i) => (
                <p key={i} className="text-[8px] font-mono text-slate-400 border-l border-slate-100 pl-2 leading-tight">{log}</p>
              ))}
            </div>
          )}
        </div>

        <div className="bg-slate-950 rounded-[32px] p-6 space-y-6 shadow-xl relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
             <Globe className="w-24 h-24 text-indigo-400 rotate-12" />
           </div>
           
           <div className="flex items-center justify-between relative z-10">
              <h3 className="text-white font-bold text-xs uppercase tracking-widest flex items-center gap-2"><Globe className="w-4 h-4 text-indigo-400" /> Backlink Forge</h3>
              <span className="text-[10px] font-bold text-slate-600 uppercase">{backlinkOps.length} Active</span>
           </div>
           
           <div className="space-y-3 relative z-10 max-h-[350px] overflow-y-auto custom-scrollbar pr-1">
             {backlinkOps.length > 0 ? backlinkOps.map((op) => (
               <div key={op.id} className="bg-white/5 p-4 rounded-2xl border border-white/5 hover:border-indigo-500/50 transition-colors">
                 <div className="flex items-center justify-between mb-2">
                    <span className={`text-[8px] font-bold px-2 py-0.5 rounded-md ${
                      op.authority === 'High' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}>{op.authority} Authority</span>
                    <a href={op.url} target="_blank" className="text-indigo-400 hover:text-indigo-300"><ExternalLink className="w-3.5 h-3.5" /></a>
                 </div>
                 <p className="text-xs font-bold text-slate-100 line-clamp-1">{op.title}</p>
                 <p className="text-[10px] text-slate-500 font-medium mt-1 leading-snug">{op.reason}</p>
               </div>
             )) : (
               <div className="py-12 text-center border-2 border-dashed border-white/5 rounded-[24px]">
                 <p className="text-[10px] text-slate-700 font-bold uppercase tracking-widest italic">Awaiting discovery...</p>
               </div>
             )}
           </div>

           <button onClick={handleDiscoverBacklinks} disabled={isDiscoveringBacklinks || !hasStarted} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-indigo-950">
             {isDiscoveringBacklinks ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
             Find Link Nodes
           </button>
        </div>

        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-6 space-y-6">
           <h3 className="font-bold text-slate-900 text-xs uppercase tracking-widest flex items-center gap-2"><ImageIcon className="w-4 h-4 text-indigo-600" /> Image Synthesis</h3>
           <ImageGenerator 
              defaultPrompt={`Studio professional photo for ${localOutline?.title || brief?.topic}. Style: high-end photography, authoritative lighting.`} 
              onImageGenerated={(url, prompt) => handleAddImage({ id: Math.random().toString(36).substr(2,9), url, prompt, isHero: articleImages.length === 0 })}
              topicContext={localOutline?.title || brief?.topic}
            />
            
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-50">
              {articleImages.map(img => (
                <div key={img.id} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 group hover:ring-2 hover:ring-indigo-600 transition-all cursor-pointer">
                   <img src={img.url} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="Asset" />
                   {img.isHero && <div className="absolute top-2 right-2 bg-indigo-600 text-white p-1.5 rounded-lg shadow-md"><Star className="w-3 h-3" /></div>}
                </div>
              ))}
            </div>
        </div>
      </div>

      {showForge && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[40px] p-10 space-y-8 shadow-2xl relative border border-slate-100">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
                  <Flame className="w-7 h-7 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-bold text-2xl text-slate-900 italic tracking-tighter">Content Refinement Forge</h3>
                  <p className="text-xs text-slate-400 font-medium">Re-synthesize external data into your authoritative voice.</p>
                </div>
              </div>
              <button onClick={() => setShowForge(false)} className="p-3 hover:bg-slate-100 rounded-2xl transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
            </div>

            <textarea autoFocus value={forgeInput} onChange={e => setForgeInput(e.target.value)} className="w-full h-64 p-6 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-3xl outline-none text-base leading-relaxed transition-all resize-none font-medium text-slate-700" placeholder="Paste research, raw notes, or competitor insights to re-write as yourself..." />

            {isForging ? (
              <div className="bg-slate-900 rounded-3xl p-6 space-y-4 border border-slate-800">
                <div className="flex items-center gap-4 text-white">
                  <Loader2 className="w-5 h-5 animate-spin text-orange-400" />
                  <span className="text-[10px] font-bold uppercase tracking-widest italic">Adopting Author Perspective...</span>
                </div>
                <div className="space-y-1">
                  {forgeLogs.map((log, i) => (
                    <p key={i} className="font-mono text-[9px] text-slate-600">{log}</p>
                  ))}
                </div>
              </div>
            ) : (
              <button onClick={handleForgeRefinement} disabled={!forgeInput.trim()} className="w-full py-5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-base uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                Sync to Article <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ArticleEditor;
