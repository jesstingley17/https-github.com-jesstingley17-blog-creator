
import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  ChevronLeft, 
  Loader2, 
  Play, 
  X,
  Calendar,
  Check,
  Globe,
  Wand2,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Table as TableIcon,
  Trash2,
  Tag as TagIcon,
  Zap,
  Target,
  TrendingUp,
  Clock,
  Cloud,
  Rocket,
  ShieldCheck,
  BrainCircuit,
  Terminal,
  Database,
  ArrowUpRight,
  Share2,
  Copy,
  Link
} from 'lucide-react';
import { geminiService } from '../geminiService';
import { storageService } from '../storageService';
import { ContentBrief, ContentOutline, SEOAnalysis, ScheduledPost, GeneratedContent, Integration } from '../types';
import ImageGenerator from './ImageGenerator';

interface ArticleEditorProps {
  brief: ContentBrief;
  outline: ContentOutline;
  onBack: () => void;
  onSchedule?: (post: ScheduledPost) => void;
}

const ArticleEditor: React.FC<ArticleEditorProps> = ({ brief, outline: initialOutline, onBack, onSchedule }) => {
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationLogs, setOptimizationLogs] = useState<string[]>([]);
  const [hasStarted, setHasStarted] = useState(false);
  const [analysis, setAnalysis] = useState<SEOAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'edit'>('preview');
  const [sources, setSources] = useState<{ uri: string; title: string }[]>([]);
  
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [deployingTo, setDeployingTo] = useState<string | null>(null);

  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null);
  
  const [localOutline, setLocalOutline] = useState<ContentOutline>(() => {
    return initialOutline && Array.isArray(initialOutline?.sections) 
      ? initialOutline 
      : { title: brief?.topic || 'Untitled', sections: [] };
  });

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const autosaveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const loadDraft = async () => {
      if (!brief?.id) return;
      try {
        const data = await storageService.getArticle(brief.id);
        if (data) {
          if (data.content) setContent(data.content);
          if (data.outline?.sections) setLocalOutline(data.outline);
          if (data.heroImageUrl) setHeroImageUrl(data.heroImageUrl);
          if (data.analysis) setAnalysis(data.analysis);
          if (data.content) setHasStarted(true);
          setLastSaved(data.updatedAt);
        }
      } catch (e) {}
    };
    loadDraft();

    const savedIntegrations = localStorage.getItem('zr_integrations');
    if (savedIntegrations) setIntegrations(JSON.parse(savedIntegrations));
  }, [brief?.id]);

  useEffect(() => {
    if (!content && !localOutline?.title) return;
    if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
    setSaveStatus('saving');
    autosaveTimerRef.current = window.setTimeout(async () => {
      const now = Date.now();
      try {
        await storageService.upsertArticle({
          id: brief.id, brief, outline: localOutline, content, analysis, heroImageUrl, updatedAt: now
        });
        setSaveStatus('saved');
        setLastSaved(now);
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (e) { setSaveStatus('idle'); }
    }, 2000);
    return () => { if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current); };
  }, [content, localOutline, analysis, heroImageUrl, brief]);

  const startGeneration = async () => {
    setHasStarted(true);
    setIsGenerating(true);
    setViewMode('preview');
    let fullText = '';
    const collectedSources = new Map<string, string>();
    try {
      const stream = geminiService.streamContent(brief, localOutline);
      for await (const chunk of stream) {
        fullText += (chunk as any).text || '';
        setContent(fullText);
        const grounding = (chunk as any).candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (Array.isArray(grounding)) {
          grounding.forEach((c: any) => { if (c.web?.uri) collectedSources.set(c.web.uri, c.web.title || c.web.uri); });
          setSources(Array.from(collectedSources.entries()).map(([uri, title]) => ({ uri, title })));
        }
      }
      await performAnalysis(fullText);
    } catch (error) {} finally { setIsGenerating(false); }
  };

  const performAnalysis = async (text: string) => {
    if (!text || text.length < 50) return;
    setAnalyzing(true);
    try {
      const result = await geminiService.analyzeSEO(text, brief.targetKeywords || []);
      setAnalysis(result);
    } catch (e) {} finally { setAnalyzing(false); }
  };

  const handleFullOptimization = async () => {
    if (!content || isOptimizing) return;
    setIsOptimizing(true);
    setOptimizationLogs(['Initializing Optimization Core...', 'Accessing Semantic Network...']);
    
    const logPool = [
      'Injecting LSI Keywords...',
      'Adjusting Readability Indices...',
      'Restructuring Heading Hierarchy...',
      'Optimizing Meta Description Nodes...',
      'Synchronizing with E-E-A-T Framework...',
      'Synthesizing Semantic Authority...'
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i < logPool.length) {
        setOptimizationLogs(prev => [...prev.slice(-3), logPool[i]]);
        i++;
      }
    }, 1500);

    try {
      const optimized = await geminiService.optimizeContent(content, brief);
      clearInterval(interval);
      setOptimizationLogs(prev => [...prev, 'Optimization Success! Boosting Score...']);
      setContent(optimized);
      await performAnalysis(optimized);
      setTimeout(() => {
        setIsOptimizing(false);
        setOptimizationLogs([]);
      }, 2000);
    } catch (e) {
      clearInterval(interval);
      setIsOptimizing(false);
      setOptimizationLogs(['Critical Error: Optimization sequence interrupted.']);
    }
  };

  const handleDeploy = async (integrationId: string) => {
    setDeployingTo(integrationId);
    // Simulate real deployment
    await new Promise(r => setTimeout(r, 2000));
    setIsScheduled(true);
    setDeployingTo(null);
  };

  const getShareLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('share', brief.id);
    return url.toString();
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getShareLink());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-[calc(100vh-120px)] gap-8 animate-in fade-in duration-500">
      <div className="flex-1 flex flex-col bg-white rounded-[40px] border border-gray-100 shadow-2xl overflow-hidden relative">
        {isOptimizing && (
          <div className="absolute inset-0 z-50 bg-slate-900/90 backdrop-blur-xl flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in-95 duration-500">
             <div className="relative mb-12">
               <div className="w-32 h-32 rounded-full border-4 border-indigo-500/20 flex items-center justify-center">
                 <Rocket className="w-16 h-16 text-indigo-400 animate-bounce" />
               </div>
               <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
             </div>
             
             <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-4">Optimizing Everything</h2>
             <p className="text-slate-400 text-lg max-w-md mb-12">Our AI is restructuring your content for maximum semantic authority and SEO dominance.</p>
             
             <div className="w-full max-w-lg bg-slate-950 rounded-[32px] p-8 border border-slate-800 shadow-2xl space-y-4">
               <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                 <div className="flex items-center gap-2">
                   <Terminal className="w-4 h-4 text-green-500" />
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Lab Console</span>
                 </div>
                 <div className="flex gap-1.5">
                   <div className="w-2 h-2 rounded-full bg-slate-800" />
                   <div className="w-2 h-2 rounded-full bg-slate-800" />
                   <div className="w-2 h-2 rounded-full bg-slate-800" />
                 </div>
               </div>
               <div className="space-y-3 font-mono text-sm leading-tight text-left">
                 {optimizationLogs.map((log, i) => (
                   <p key={i} className={`${i === optimizationLogs.length - 1 ? 'text-indigo-400' : 'text-slate-600'} flex gap-3 animate-in slide-in-from-left-2`}>
                     <span className="text-slate-800">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
                     <span>{i === optimizationLogs.length - 1 ? '> ' : '  '}{log}</span>
                   </p>
                 ))}
               </div>
             </div>
          </div>
        )}

        <header className="px-8 py-5 border-b flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-6">
            <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><ChevronLeft className="w-5 h-5 text-gray-400" /></button>
            <div className="flex flex-col">
              <h2 className="font-black text-gray-900 line-clamp-1 tracking-tight italic text-lg leading-tight">{localOutline?.title || brief?.topic || 'Draft'}</h2>
              <div className="flex items-center gap-3">
                {saveStatus !== 'idle' && (
                  <div className="flex items-center gap-1.5">
                    {saveStatus === 'saving' ? <Loader2 className="w-3 h-3 animate-spin text-indigo-400" /> : <Check className="w-3 h-3 text-green-500" />}
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">{saveStatus === 'saving' ? 'Syncing...' : 'Synced'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {hasStarted && (
              <>
                <div className="flex bg-gray-100 p-1.5 rounded-2xl">
                  <button onClick={() => setViewMode('preview')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase ${viewMode === 'preview' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400'}`}>Preview</button>
                  <button onClick={() => setViewMode('edit')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase ${viewMode === 'edit' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400'}`}>Edit</button>
                </div>
                <button onClick={() => setShowShareModal(true)} className="p-3 bg-gray-50 text-gray-500 hover:text-indigo-600 rounded-2xl transition-all active:scale-95 border border-transparent hover:border-indigo-100">
                  <Share2 className="w-5 h-5" />
                </button>
              </>
            )}
            <button onClick={hasStarted ? () => setShowScheduleModal(true) : startGeneration} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl text-sm font-black uppercase flex items-center gap-2 transition-transform active:scale-95 shadow-lg shadow-indigo-100">
              {hasStarted ? <ArrowUpRight className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />} {hasStarted ? 'Deploy' : 'Start Synthesis'}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
          {!hasStarted ? (
            <div className="max-w-3xl mx-auto space-y-12 py-10">
               <div className="text-center space-y-4">
                 <h3 className="text-5xl font-black text-gray-900 italic uppercase">Synthesis</h3>
                 <p className="text-gray-400 text-lg">Cross-referencing real-time nodes for authoritative content.</p>
               </div>
               <div className="space-y-6">
                 {(localOutline?.sections || []).map((s, i) => (
                   <div key={i} className="p-8 bg-gray-50 rounded-[40px] border border-gray-100 shadow-sm">
                     <div className="flex items-center gap-4 mb-6">
                       <span className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black">{i+1}</span>
                       <h4 className="font-black text-gray-900 text-xl">{s?.heading || 'Section'}</h4>
                     </div>
                     <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3 ml-14">
                       {(s?.subheadings || []).map((sub, j) => (
                         <li key={j} className="text-sm font-bold text-gray-400 flex items-center gap-3">
                           <div className="w-2 h-2 rounded-full bg-indigo-200" /> {sub}
                         </li>
                       ))}
                     </ul>
                   </div>
                 ))}
               </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-8">
              {heroImageUrl && <img src={heroImageUrl} className="w-full h-[400px] object-cover rounded-[48px] shadow-2xl mb-12" alt="Hero" />}
              {viewMode === 'preview' ? (
                <div className="markdown-body">
                  <ReactMarkdown>{content || "Connecting..."}</ReactMarkdown>
                  {isGenerating && (
                    <div className="flex flex-col items-center gap-6 my-20">
                      <Loader2 className="w-12 h-12 animate-spin text-indigo-400" />
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Streaming Neural Nodes...</p>
                    </div>
                  )}
                </div>
              ) : (
                <textarea 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full min-h-[800px] bg-transparent border-none outline-none font-mono text-lg resize-none"
                  placeholder="Drafting workspace active..."
                />
              )}
            </div>
          )}
        </div>
      </div>

      <div className="w-96 flex flex-col gap-8 overflow-y-auto custom-scrollbar pr-4 pb-12">
        <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl p-8 space-y-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
            <ShieldCheck className="w-10 h-10 text-indigo-600" />
          </div>
          <h3 className="font-black text-gray-900 text-sm uppercase tracking-widest flex items-center gap-2"><Target className="w-4 h-4 text-indigo-600" /> SEO Lab</h3>
          
          <div className="text-center py-4 space-y-2">
            <div className="text-7xl font-black text-indigo-600 italic tracking-tighter animate-in zoom-in duration-500">
              {analyzing ? <Loader2 className="w-16 h-16 animate-spin mx-auto text-indigo-200" /> : analysis?.score || 0}
            </div>
            <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Optimization Index</div>
          </div>

          <div className="space-y-4">
             <div className="flex items-center justify-between text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">
               <span>Readability</span>
               <span className="text-indigo-600">{analysis?.readability || 'Analyzing...'}</span>
             </div>
             <div className="h-2 bg-gray-50 rounded-full overflow-hidden">
               <div className="h-full bg-indigo-600 transition-all duration-1000" style={{ width: `${analysis?.score || 0}%` }} />
             </div>
          </div>

          <button 
            disabled={!content || analyzing || isOptimizing}
            onClick={handleFullOptimization}
            className="w-full py-5 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_auto] hover:bg-right transition-all text-white rounded-[24px] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-indigo-100 hover:scale-[1.02] active:scale-95 disabled:opacity-50"
          >
            <BrainCircuit className="w-5 h-5" />
            Optimize Everything
          </button>
        </div>

        <div className="bg-slate-900 rounded-[40px] p-8 space-y-6">
           <h3 className="text-white font-black text-sm uppercase tracking-widest flex items-center gap-2"><Sparkles className="w-4 h-4 text-indigo-400" /> Recommendations</h3>
           <div className="space-y-3">
             {analysis?.suggestions?.length ? analysis.suggestions.slice(0, 3).map((s, i) => (
               <div key={i} className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 flex items-start gap-3">
                 <div className="w-5 h-5 bg-indigo-500/10 rounded flex items-center justify-center mt-0.5">
                   <Zap className="w-3 h-3 text-indigo-400" />
                 </div>
                 <p className="text-xs text-slate-400 font-medium leading-relaxed">{s}</p>
               </div>
             )) : (
               <div className="py-10 text-center space-y-3">
                 <Cloud className="w-8 h-8 text-slate-700 mx-auto" />
                 <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Awaiting Semantic Data</p>
               </div>
             )}
           </div>
        </div>

        <ImageGenerator 
          defaultPrompt={`Professional hero for: ${localOutline?.title || brief?.topic || 'Article'}`} 
          initialImageUrl={heroImageUrl} 
          onImageGenerated={setHeroImageUrl}
          topicContext={localOutline?.title || brief?.topic}
        />
      </div>

      {showShareModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[56px] p-12 space-y-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />
            
            <div className="flex justify-between items-center relative z-10">
              <h3 className="font-black text-3xl uppercase italic tracking-tighter">Share Node</h3>
              <button onClick={() => setShowShareModal(false)} className="p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors"><X className="w-6 h-6" /></button>
            </div>

            <div className="space-y-8 relative z-10 text-center">
              <div className="w-20 h-20 bg-indigo-100 rounded-[32px] flex items-center justify-center mx-auto">
                <Link className="w-10 h-10 text-indigo-600" />
              </div>
              <div className="space-y-2">
                <p className="text-gray-900 font-black uppercase text-sm tracking-widest italic">Global Synthesis Link</p>
                <p className="text-gray-400 text-sm font-medium">Generate a unique access vector for this content.</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100 flex items-center gap-3">
                <input 
                  readOnly 
                  value={getShareLink()} 
                  className="bg-transparent border-none outline-none text-xs font-mono text-gray-500 flex-1 truncate"
                />
                <button 
                  onClick={copyToClipboard}
                  className={`p-3 rounded-2xl transition-all ${copied ? 'bg-green-500 text-white' : 'bg-white text-indigo-600 shadow-sm'}`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <button className="py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-colors">LinkedIn Node</button>
                 <button className="py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-colors">Twitter Node</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showScheduleModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[56px] p-12 space-y-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />
            
            <div className="flex justify-between items-center relative z-10">
              <h3 className="font-black text-3xl uppercase italic tracking-tighter">Publisher</h3>
              <button onClick={() => setShowScheduleModal(false)} className="p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors"><X className="w-6 h-6" /></button>
            </div>

            <div className="space-y-8 relative z-10">
               {isScheduled ? (
                 <div className="bg-green-50 p-12 rounded-[48px] border border-green-100 flex flex-col items-center gap-6 animate-in zoom-in-95 duration-500">
                   <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-100">
                     <Check className="w-10 h-10 text-white" />
                   </div>
                   <div className="text-center space-y-2">
                     <p className="text-green-800 font-black text-xl uppercase tracking-widest italic">Live Status Confirmed</p>
                     <p className="text-green-600 font-bold text-sm">Your article has been synthesized and deployed successfully.</p>
                   </div>
                   <button onClick={() => setShowScheduleModal(false)} className="mt-4 px-8 py-3 bg-white text-green-600 rounded-2xl font-black text-xs uppercase tracking-widest border border-green-200">Close Manager</button>
                 </div>
               ) : (
                 <div className="space-y-6">
                    <div className="text-center py-6">
                      <Globe className="w-16 h-16 text-indigo-100 mx-auto mb-4" />
                      <p className="text-gray-400 font-bold">Select an active integration node to finalize deployment.</p>
                    </div>

                    <div className="space-y-3">
                      {integrations.length === 0 ? (
                        <div className="p-8 bg-gray-50 border-2 border-dashed border-gray-200 rounded-[32px] text-center space-y-4">
                          <p className="text-gray-400 text-sm font-bold italic">No integration nodes detected.</p>
                          <a href="#integrations" onClick={() => setShowScheduleModal(false)} className="text-indigo-600 font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2">
                            Configure Integrations <ArrowRight className="w-3 h-3" />
                          </a>
                        </div>
                      ) : (
                        integrations.map(int => (
                          <button 
                            key={int.id} 
                            disabled={deployingTo !== null}
                            onClick={() => handleDeploy(int.id)}
                            className="w-full flex items-center justify-between p-6 bg-white border border-gray-100 rounded-[32px] hover:border-indigo-600 hover:shadow-xl transition-all group"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                                <Database className="w-6 h-6 text-indigo-600 group-hover:text-white" />
                              </div>
                              <div className="text-left">
                                <p className="font-black text-gray-900 italic tracking-tighter">{int.name}</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{int.platform}</p>
                              </div>
                            </div>
                            {deployingTo === int.id ? (
                              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                            ) : (
                              <ArrowRight className="w-6 h-6 text-gray-200 group-hover:text-indigo-600 transition-all group-hover:translate-x-1" />
                            )}
                          </button>
                        ))
                      )}
                    </div>

                    <div className="pt-8 border-t border-gray-100 text-center">
                       <button className="text-[10px] font-black uppercase tracking-widest text-gray-300 hover:text-indigo-600 transition-colors">Manual Archive Instead</button>
                    </div>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArticleEditor;
