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
  Info
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
      
      const heroUrl = await geminiService.generateArticleImage(`Hero image for ${localOutline.title}. Professional studio style.`);
      setArticleImages([{ id: Math.random().toString(36).substr(2, 9), url: heroUrl, prompt: localOutline.title, isHero: true }]);
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
    addOptLog('Optimizing keyword density...');
    
    try {
      const optimized = await geminiService.optimizeContent(content, brief, brief.author);
      setContent(optimized);
      performAnalysis(optimized);
      setTimeout(() => setIsOptimizing(false), 1500);
    } catch (e) { setIsOptimizing(false); }
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
    <div className="flex h-[calc(100vh-64px)] gap-6 animate-in fade-in duration-500 overflow-hidden pr-4">
      <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative">
        <header className="px-6 py-4 border-b flex items-center justify-between bg-white/50 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><ChevronLeft className="w-5 h-5 text-slate-500" /></button>
            <div className="flex flex-col">
              <h2 className="font-bold text-slate-900 line-clamp-1 text-base leading-tight">{localOutline?.title}</h2>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase text-indigo-600 tracking-wider">By {brief.author.name}</span>
                {saveStatus !== 'idle' && (
                  <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                    {saveStatus === 'saving' ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Check className="w-2.5 h-2.5 text-emerald-500" />}
                    {saveStatus === 'saving' ? 'Saving...' : 'Saved'}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button onClick={() => setViewMode('preview')} className={`px-4 py-1.5 rounded-lg text-xs font-bold ${viewMode === 'preview' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>Preview</button>
              <button onClick={() => setViewMode('edit')} className={`px-4 py-1.5 rounded-lg text-xs font-bold ${viewMode === 'edit' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>Editor</button>
            </div>
            {hasStarted && (
              <button onClick={handleFullOptimization} disabled={isOptimizing} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-indigo-100 disabled:opacity-50 transition-all">
                {isOptimizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />} Optimize
              </button>
            )}
            <button onClick={() => setShowForge(true)} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-800 transition-all">
              <Flame className="w-3.5 h-3.5 text-orange-400" /> Forge
            </button>
            <button onClick={hasStarted ? () => {} : startGeneration} className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm hover:bg-indigo-700 transition-all">
              {hasStarted ? <ArrowUpRight className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />} {hasStarted ? 'Export' : 'Generate'}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar bg-white">
          {!hasStarted ? (
            <div className="max-w-2xl mx-auto space-y-8 py-10">
               <div className="text-center space-y-2">
                 <h3 className="text-3xl font-bold text-slate-900">Research Complete</h3>
                 <p className="text-slate-500">Ready to synthesize the full article based on your strategy.</p>
               </div>
               <div className="grid gap-4">
                 {localOutline.sections?.map((s, i) => (
                   <div key={i} className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                     <h4 className="font-bold text-slate-900 text-base mb-2">{i+1}. {s.heading}</h4>
                     <div className="flex flex-wrap gap-2">
                       {s.subheadings?.map((sub, j) => (
                         <span key={j} className="text-[10px] px-2 py-1 bg-white border border-slate-100 rounded-md text-slate-500 font-medium">{sub}</span>
                       ))}
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-12 pb-32">
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center gap-6 shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0 border border-slate-200 overflow-hidden relative">
                  {brief.author.photoUrl ? (
                    <img src={brief.author.photoUrl} alt={brief.author.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-slate-200" />
                  )}
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900 leading-tight">{brief.author.name}</p>
                  <p className="font-bold text-indigo-600 text-[10px] uppercase tracking-wider mb-1">{brief.author.title}</p>
                  <p className="text-slate-500 text-xs line-clamp-2 max-w-md">{brief.author.bio}</p>
                </div>
              </div>

              {heroImage && <img src={heroImage.url} className="w-full h-auto aspect-video object-cover rounded-3xl shadow-md ring-1 ring-slate-100" alt="Hero" />}
              
              {viewMode === 'preview' ? (
                <div className="markdown-body">
                  <ReactMarkdown>{content || "Awaiting neural synthesis..."}</ReactMarkdown>
                  {isGenerating && (
                    <div className="flex flex-col items-center gap-4 my-12 animate-pulse">
                      <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Streaming content nodes...</p>
                    </div>
                  )}
                </div>
              ) : (
                <textarea 
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full min-h-[800px] bg-transparent border-none outline-none font-mono text-sm resize-none leading-relaxed text-slate-800 placeholder:text-slate-300"
                  placeholder="Drafting workspace..."
                />
              )}

              {hasStarted && (
                <div className="pt-12 border-t border-slate-100">
                  <button onClick={() => setShowSourcesInline(!showSourcesInline)} className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-all shadow-sm active:scale-95">
                    <Link2 className={`w-4 h-4 ${showSourcesInline ? 'text-indigo-600' : ''}`} />
                    {showSourcesInline ? 'Hide Bibliography' : `Cite Sources (${citations.length})`}
                  </button>

                  {showSourcesInline && (
                    <div className="mt-6 animate-in slide-in-from-top-4 duration-300 space-y-3">
                      {citations.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {citations.map((c) => (
                            <div key={c.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white transition-all group">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[9px] font-bold text-indigo-500 uppercase">Ref [{c.id}]</span>
                                <a href={c.url} target="_blank" rel="noopener noreferrer" className="p-2 bg-white rounded-lg border border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity"><ExternalLink className="w-3 h-3" /></a>
                              </div>
                              <h4 className="font-bold text-slate-800 text-sm line-clamp-2 leading-snug">{c.title}</h4>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                           <p className="text-xs font-medium text-slate-400 italic">No referenced sources found for this pass.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {isOptimizing && (
          <div className="absolute inset-0 z-50 bg-slate-900/10 backdrop-blur-[2px] flex items-center justify-center p-6">
            <div className="bg-white w-full max-w-xs rounded-2xl p-6 space-y-4 shadow-2xl border border-slate-200 animate-in zoom-in-95">
               <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                 <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                 <h3 className="font-bold text-sm text-slate-900">Optimizing SEO</h3>
               </div>
               <div className="space-y-1">
                 {optimizationLogs.map((log, i) => (
                   <p key={i} className={`font-mono text-[9px] ${i === optimizationLogs.length - 1 ? 'text-indigo-600' : 'text-slate-400'}`}>{log}</p>
                 ))}
               </div>
            </div>
          </div>
        )}
      </div>

      <div className="w-80 flex flex-col gap-6 overflow-y-auto custom-scrollbar pb-10">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2"><Target className="w-3.5 h-3.5 text-indigo-600" /> SEO Laboratory</h3>
          <div className="text-center py-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="text-6xl font-black text-indigo-600 tracking-tight">
              {analyzing ? <Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-200" /> : analysis?.score || 0}
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">Semantic Index</p>
          </div>
          <button onClick={handleFullOptimization} disabled={isOptimizing || !content} className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95">
            <Zap className="w-4 h-4 text-indigo-400" /> Run Optimizer
          </button>
        </div>

        <div className="bg-slate-900 rounded-2xl p-6 space-y-4 shadow-sm relative overflow-hidden">
           <div className="flex items-center justify-between relative z-10">
              <h3 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2"><Globe className="w-3.5 h-3.5 text-indigo-400" /> Backlink Forge</h3>
              <span className="text-[9px] font-bold text-slate-500 uppercase">{backlinkOps.length} Ops</span>
           </div>
           
           <div className="space-y-2 relative z-10 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
             {backlinkOps.length > 0 ? backlinkOps.map((op) => (
               <div key={op.id} className="bg-white/5 p-3 rounded-xl border border-white/5 hover:border-indigo-500/50 transition-colors animate-in slide-in-from-right-2">
                 <div className="flex items-center justify-between mb-1">
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                      op.authority === 'High' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'
                    }`}>{op.authority}</span>
                    <a href={op.url} target="_blank" className="text-indigo-400 hover:text-indigo-300"><ExternalLink className="w-3 h-3" /></a>
                 </div>
                 <p className="text-[11px] font-bold text-slate-200 line-clamp-1">{op.title}</p>
                 <p className="text-[9px] text-slate-500 font-medium mt-1 leading-tight">{op.reason}</p>
               </div>
             )) : (
               <div className="py-8 text-center border border-dashed border-slate-800 rounded-xl">
                 <p className="text-[10px] text-slate-600 font-medium italic">Click to discover nodes...</p>
               </div>
             )}
           </div>

           <button onClick={handleDiscoverBacklinks} disabled={isDiscoveringBacklinks || !hasStarted} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50">
             {isDiscoveringBacklinks ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
             Find Backlinks
           </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
           <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2"><ImageIcon className="w-3.5 h-3.5 text-indigo-600" /> Asset Synthesis</h3>
           <ImageGenerator 
              defaultPrompt={`Studio professional photo for ${localOutline?.title || brief?.topic}.`} 
              onImageGenerated={(url, prompt) => handleAddImage({ id: Math.random().toString(36).substr(2,9), url, prompt, isHero: articleImages.length === 0 })}
              topicContext={localOutline?.title || brief?.topic}
            />
            
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-50">
              {articleImages.map(img => (
                <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden border border-slate-100 bg-slate-50 group hover:ring-2 hover:ring-indigo-600 transition-all cursor-pointer">
                   <img src={img.url} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="Asset" />
                   {img.isHero && <div className="absolute top-1.5 right-1.5 bg-indigo-600 text-white p-1 rounded-md shadow-sm"><Star className="w-2.5 h-2.5" /></div>}
                </div>
              ))}
            </div>
        </div>
      </div>

      {showForge && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xl rounded-3xl p-8 space-y-6 shadow-2xl relative border border-slate-100">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Flame className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-slate-900">Refinement Forge</h3>
                  <p className="text-xs text-slate-400">Re-synthesize raw content into your article.</p>
                </div>
              </div>
              <button onClick={() => setShowForge(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <textarea autoFocus value={forgeInput} onChange={e => setForgeInput(e.target.value)} className="w-full h-48 p-5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl outline-none text-sm leading-relaxed transition-all resize-none" placeholder="Paste research notes, competitor text, or raw snippets..." />

            {isForging ? (
              <div className="bg-slate-900 rounded-2xl p-5 space-y-3 border border-slate-800">
                <div className="flex items-center gap-3 text-white">
                  <Loader2 className="w-4 h-4 animate-spin text-orange-400" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Processing Synthesis...</span>
                </div>
                <div className="space-y-1">
                  {forgeLogs.map((log, i) => (
                    <p key={i} className="font-mono text-[9px] text-slate-500">{log}</p>
                  ))}
                </div>
              </div>
            ) : (
              <button onClick={handleForgeRefinement} disabled={!forgeInput.trim()} className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-sm uppercase tracking-wider shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                Sync to Article <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ArticleEditor;