
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
  Database
} from 'lucide-react';
import { geminiService } from '../geminiService';
import { serpstatService } from '../serpstatService';
import { storageService } from '../storageService';
import { ContentBrief, ContentOutline, SEOAnalysis, ScheduledPost, ArticleImage, AppRoute, Citation, BacklinkOpportunity, IntegrationPlatform } from '../types';
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
      }
      performAnalysis(fullText);
      const heroImagePrompt = `A high-resolution technical photography for article: "${localOutline.title}". Modern and professional aesthetic.`;
      const heroUrl = await geminiService.generateArticleImage(heroImagePrompt);
      setArticleImages([{ id: Math.random().toString(36).substr(2, 9), url: heroUrl, prompt: heroImagePrompt, isHero: true }]);
    } catch (error) {} finally { setIsGenerating(false); }
  };

  const handleFullOptimization = async () => {
    if (!content || isOptimizing) return;
    setIsOptimizing(true);
    setOptimizationLogs([]);
    addOptLog('Analyzing technical depth...');
    try {
      const optimized = await geminiService.optimizeContent(content, brief);
      setContent(optimized);
      addOptLog('Calculating SEO scores...');
      await performAnalysis(optimized);
      addOptLog('Refinement complete.');
    } catch (e) { console.error(e); } finally {
      setTimeout(() => setIsOptimizing(false), 2000);
    }
  };

  const handleDiscoverBacklinks = async () => {
    setIsDiscoveringBacklinks(true);
    try {
      // Check for Serpstat integration
      const integrationsRaw = localStorage.getItem('zr_integrations') || '[]';
      const integrations = JSON.parse(integrationsRaw);
      const serpstatInt = integrations.find((i: any) => i.platform === IntegrationPlatform.SERPSTAT);

      if (serpstatInt) {
        const ops = await serpstatService.getBacklinks(brief.companyUrl || brief.topic, serpstatInt);
        setBacklinkOps(ops);
      } else {
        const ops = await geminiService.discoverBacklinks(localOutline.title, brief.targetKeywords);
        setBacklinkOps(ops);
      }
    } catch (e) { console.error(e); } finally {
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
    <div className="flex h-[calc(100vh-100px)] gap-6 overflow-hidden">
      {/* Main Content Area - Scrollable */}
      <div className="flex-1 flex flex-col bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative">
        <header className="px-6 py-4 border-b flex items-center justify-between bg-white/95 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><ChevronLeft className="w-5 h-5 text-slate-500" /></button>
            <div className="flex flex-col">
              <h2 className="font-bold text-slate-900 line-clamp-1 text-sm md:text-base leading-tight">{localOutline?.title}</h2>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase text-indigo-600 tracking-wider">Project Node: {brief.id}</span>
                {saveStatus !== 'idle' && (
                  <span className="text-[9px] text-slate-300 font-bold uppercase flex items-center gap-1">
                    {saveStatus === 'saving' ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Check className="w-2.5 h-2.5 text-emerald-500" />}
                    {saveStatus === 'saving' ? 'Syncing' : 'Archived'}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button onClick={() => setViewMode('preview')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'preview' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>Preview</button>
              <button onClick={() => setViewMode('edit')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'edit' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>Edit</button>
            </div>
            <button onClick={hasStarted ? () => {} : startGeneration} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all">
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : hasStarted ? <Check className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{hasStarted ? 'Live' : 'Generate'}</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-12 md:p-16 custom-scrollbar bg-white scroll-smooth h-full">
          {!hasStarted ? (
            <div className="max-w-3xl mx-auto space-y-10 py-10">
               <div className="text-center space-y-4">
                 <h3 className="text-5xl font-black text-slate-900 tracking-tighter italic uppercase">Strategy Locked</h3>
                 <p className="text-slate-500 font-medium">Ready to synthesize technical content about engineers and relevant industrial standards.</p>
               </div>
               <div className="grid gap-4">
                 {localOutline.sections?.map((s, i) => (
                   <div key={i} className="p-8 bg-slate-50 rounded-3xl border border-slate-100 flex gap-8">
                     <span className="text-4xl font-black text-indigo-100 leading-none">{String(i+1).padStart(2, '0')}</span>
                     <div>
                       <h4 className="font-bold text-slate-900 text-lg mb-2">{s.heading}</h4>
                       <div className="flex flex-wrap gap-2">
                         {s.subheadings?.map((sub, j) => (
                           <span key={j} className="text-[9px] px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-500 font-black uppercase tracking-widest">{sub}</span>
                         ))}
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-12 pb-32">
              <div className="p-8 bg-indigo-50/50 rounded-3xl border border-indigo-100 flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center border border-indigo-200 shrink-0">
                  <User className="w-8 h-8 text-indigo-300" />
                </div>
                <div>
                  <h3 className="font-black text-indigo-900 uppercase italic">Research Metadata</h3>
                  <p className="text-xs text-indigo-600 font-bold uppercase tracking-widest">{brief.author.name} • {brief.author.title}</p>
                </div>
              </div>

              {heroImage && <img src={heroImage.url} className="w-full h-auto max-h-[600px] object-cover rounded-[48px] shadow-2xl ring-1 ring-slate-100" alt="Hero" />}
              
              <div className="px-2">
                {viewMode === 'preview' ? (
                  <div className="markdown-body">
                    <ReactMarkdown>{content || "Neural engine ready..."}</ReactMarkdown>
                    {isGenerating && (
                      <div className="flex flex-col items-center gap-5 my-20">
                        <Loader2 className="w-12 h-12 animate-spin text-indigo-300" />
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Processing Data Nodes...</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <textarea 
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full min-h-[1200px] bg-transparent border-none outline-none font-mono text-base resize-none leading-relaxed text-slate-800 placeholder:text-slate-100"
                    placeholder="Enter technical content pass..."
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar Area - Scrollable */}
      <div className="w-80 flex-shrink-0 flex flex-col gap-6 overflow-y-auto custom-scrollbar pb-12 pr-1 h-full">
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-8 space-y-8">
          <h3 className="font-black text-slate-900 text-[10px] uppercase tracking-[0.2em] flex items-center gap-3"><Target className="w-4 h-4 text-indigo-600" /> SEO Synthesis</h3>
          <div className="text-center py-10 bg-slate-950 rounded-[40px] relative overflow-hidden">
            <div className="text-8xl font-black text-white tracking-tighter italic">
              {analyzing ? <Loader2 className="w-16 h-16 animate-spin mx-auto text-indigo-500/20" /> : (analysis?.score || 0)}
            </div>
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mt-4">Authority Rating</p>
          </div>
          
          <button 
            onClick={handleFullOptimization} 
            disabled={isOptimizing || !content} 
            className="w-full py-5 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-2xl transition-all active:scale-95 disabled:opacity-50"
          >
            {isOptimizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-indigo-400" />}
            {isOptimizing ? 'Optimizing' : 'Re-Optimize Pass'}
          </button>
          
          {optimizationLogs.length > 0 && (
            <div className="space-y-1 pt-4 border-t border-slate-50">
              {optimizationLogs.map((log, i) => (
                <p key={i} className="text-[8px] font-mono text-slate-400 pl-2 leading-tight uppercase font-bold tracking-widest">{log}</p>
              ))}
            </div>
          )}
        </div>

        <div className="bg-slate-900 rounded-[40px] p-8 space-y-8 shadow-2xl relative overflow-hidden">
           <div className="flex items-center justify-between">
              <h3 className="text-white font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-3"><Database className="w-4 h-4 text-indigo-400" /> Backlink Intelligence</h3>
              <span className="text-[10px] font-black text-slate-700 uppercase">{backlinkOps.length} Node</span>
           </div>
           
           <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
             {backlinkOps.length > 0 ? backlinkOps.map((op) => (
               <div key={op.id} className="bg-white/5 p-5 rounded-3xl border border-white/5 hover:border-indigo-500/30 transition-all group">
                 <div className="flex items-center justify-between mb-3">
                    <span className={`text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-widest ${
                      op.authority === 'High' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}>{op.authority} Domain</span>
                    <a href={op.url} target="_blank" className="text-indigo-400 hover:text-white transition-colors"><ExternalLink className="w-4 h-4" /></a>
                 </div>
                 <p className="text-xs font-black text-white line-clamp-2 italic leading-relaxed">"{op.title}"</p>
                 <p className="text-[10px] text-slate-500 font-bold mt-2 uppercase tracking-tight">{op.reason}</p>
               </div>
             )) : (
               <div className="py-20 text-center border-4 border-dashed border-white/5 rounded-[40px]">
                 <p className="text-[10px] text-slate-700 font-black uppercase tracking-[0.2em] italic">Idle</p>
               </div>
             )}
           </div>

           <button onClick={handleDiscoverBacklinks} disabled={isDiscoveringBacklinks || !hasStarted} className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50">
             {isDiscoveringBacklinks ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
             Map Link Topology
           </button>
        </div>

        <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm p-8 space-y-8">
           <h3 className="font-black text-slate-900 text-[10px] uppercase tracking-[0.2em] flex items-center gap-3"><ImageIcon className="w-4 h-4 text-indigo-600" /> Digital Assets</h3>
           <ImageGenerator 
              defaultPrompt={`Technical architectural photography of engineering equipment, high contrast, clean.`} 
              onImageGenerated={(url, prompt) => handleAddImage({ id: Math.random().toString(36).substr(2,9), url, prompt, isHero: articleImages.length === 0 })}
              topicContext={localOutline?.title}
            />
            <div className="grid grid-cols-2 gap-4">
              {articleImages.map(img => (
                <div key={img.id} className="aspect-square rounded-[24px] overflow-hidden border border-slate-100 bg-slate-50 group hover:ring-4 hover:ring-indigo-600 transition-all cursor-pointer">
                   <img src={img.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt="Asset" />
                </div>
              ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleEditor;
