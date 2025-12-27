
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
  Trash2,
  Zap,
  Target,
  Cloud,
  Rocket,
  ShieldCheck,
  BrainCircuit,
  Terminal,
  Database,
  ArrowUpRight,
  Share2,
  Copy,
  Link,
  Type as FontType,
  Maximize2,
  Command,
  Plus,
  Image as ImageIcon,
  Star,
  Quote,
  LayoutTemplate,
  Info
} from 'lucide-react';
import { geminiService } from '../geminiService';
import { storageService } from '../storageService';
import { ContentBrief, ContentOutline, SEOAnalysis, ScheduledPost, GeneratedContent, Integration, ArticleImage, AppRoute, Citation } from '../types';
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
  const [citations, setCitations] = useState<Citation[]>([]);
  
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showTitleLab, setShowTitleLab] = useState(false);
  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([]);
  const [generatingTitles, setGeneratingTitles] = useState(false);
  
  const [copied, setCopied] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [deployingTo, setDeployingTo] = useState<string | null>(null);

  const [articleImages, setArticleImages] = useState<ArticleImage[]>([]);

  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiWorking, setIsAiWorking] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selection, setSelection] = useState({ start: 0, end: 0 });

  // Fix: Defined isSelectionActive to determine if the user has selected text in the editor
  const isSelectionActive = selection.start !== selection.end;

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
          if (data.analysis) setAnalysis(data.analysis);
          if (data.images) setArticleImages(data.images);
          if (data.citations) setCitations(data.citations);
          if (data.content || data.images?.length) setHasStarted(true);
          setLastSaved(data.updatedAt);
        }
      } catch (e) {}
    };
    loadDraft();

    const savedIntegrations = localStorage.getItem('zr_integrations');
    if (savedIntegrations) setIntegrations(JSON.parse(savedIntegrations));
  }, [brief?.id]);

  useEffect(() => {
    if (!content && !localOutline?.title && articleImages.length === 0) return;
    if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
    setSaveStatus('saving');
    autosaveTimerRef.current = window.setTimeout(async () => {
      const now = Date.now();
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
          updatedAt: now
        });
        setSaveStatus('saved');
        setLastSaved(now);
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (e) { setSaveStatus('idle'); }
    }, 2000);
    return () => { if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current); };
  }, [content, localOutline, analysis, articleImages, brief, citations]);

  const addOptLog = (msg: string) => {
    const ts = new Date().toISOString().split('T')[1].split('.')[0];
    setOptimizationLogs(prev => [...prev.slice(-3), `[${ts}] ${msg}`]);
  };

  const startGeneration = async () => {
    setHasStarted(true);
    setIsGenerating(true);
    setViewMode('preview');
    let fullText = '';
    try {
      const stream = geminiService.streamContent(brief, localOutline);
      for await (const chunk of stream) {
        fullText += (chunk as any).text || '';
        setContent(fullText);
      }
      await performAnalysis(fullText);
      
      // Multi-Asset Synthesis like a real blog
      const heroUrl = await geminiService.generateArticleImage(`High-end cinematic hero illustration for article: ${localOutline.title}. Modern digital art style.`);
      const assets: ArticleImage[] = [{ id: Math.random().toString(36).substr(2, 9), url: heroUrl, prompt: localOutline.title, isHero: true }];
      
      // Synthesize extra assets for sections if outline is long
      if (localOutline.sections.length > 3) {
        const extraUrl = await geminiService.generateArticleImage(`Detailed conceptual asset illustration for: ${localOutline.sections[2].heading}. Professional minimalist style.`);
        assets.push({ id: Math.random().toString(36).substr(2, 9), url: extraUrl, prompt: localOutline.sections[2].heading, isHero: false });
      }
      
      setArticleImages(assets);
      
    } catch (error) {} finally { setIsGenerating(false); }
  };

  const handleFetchTitles = async () => {
    setGeneratingTitles(true);
    try {
      const titles = await geminiService.generateTitleSuggestions(brief.topic, brief.targetKeywords);
      setTitleSuggestions(titles);
    } catch (e) {} finally { setGeneratingTitles(false); }
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
    setOptimizationLogs([]);
    addOptLog('Benchmarking Semantic Authority...');
    addOptLog('Verifying Table Markdown Syntax...');
    
    try {
      const optimized = await geminiService.optimizeContent(content, brief);
      addOptLog('Optimization Sync Complete.');
      setContent(optimized);
      await performAnalysis(optimized);
      setTimeout(() => setIsOptimizing(false), 2000);
    } catch (e) { setIsOptimizing(false); }
  };

  const handleAiWritingTask = async (task: string, input?: string) => {
    if (isAiWorking) return;
    setIsAiWorking(true);
    const targetText = input || content.substring(selection.start, selection.end) || '';
    try {
      const result = await geminiService.performWritingTask(task, targetText, localOutline.title);
      const newContent = selection.start !== selection.end 
        ? content.substring(0, selection.start) + result + content.substring(selection.end)
        : content.substring(0, selection.start) + "\n\n" + result + content.substring(selection.start);
      setContent(newContent);
      setAiAssistantOpen(false);
      setAiPrompt('');
    } catch (e) {} finally { setIsAiWorking(false); }
  };

  const handleAddImage = (img: ArticleImage) => {
    setArticleImages(prev => img.isHero ? [img, ...prev.map(i => ({ ...i, isHero: false }))] : [...prev, img]);
  };

  const getShareLink = () => {
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set('share', brief.id);
    return url.toString();
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getShareLink());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const heroImage = articleImages.find(img => img.isHero);

  return (
    <div className="flex h-[calc(100vh-120px)] gap-8 animate-in fade-in duration-500">
      <div className="flex-1 flex flex-col bg-white rounded-[40px] border border-gray-100 shadow-2xl overflow-hidden relative">
        <header className="px-8 py-5 border-b flex items-center justify-between bg-white sticky top-0 z-30">
          <div className="flex items-center gap-6">
            <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><ChevronLeft className="w-5 h-5 text-gray-400" /></button>
            <div className="flex flex-col">
              <h2 className="font-black text-gray-900 line-clamp-1 tracking-tight italic text-lg leading-tight uppercase">{localOutline?.title}</h2>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                   {saveStatus === 'saving' ? <Loader2 className="w-3 h-3 animate-spin text-indigo-400" /> : <Check className="w-3 h-3 text-green-500" />}
                   <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">{saveStatus === 'saving' ? 'Syncing...' : 'Secure Node'}</span>
                </div>
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
                <button onClick={() => setShowShareModal(true)} className="p-3 bg-gray-50 text-gray-500 hover:text-indigo-600 rounded-2xl transition-all border">
                  <Share2 className="w-5 h-5" />
                </button>
              </>
            )}
            <button onClick={hasStarted ? () => setShowScheduleModal(true) : startGeneration} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl text-sm font-black uppercase flex items-center gap-2 shadow-lg shadow-indigo-100 active:scale-95 transition-transform">
              {hasStarted ? <ArrowUpRight className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />} {hasStarted ? 'Deploy Node' : 'Initialize Synthesis'}
            </button>
          </div>
        </header>

        {hasStarted && (
          <div className="bg-slate-50 border-b px-12 py-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] flex items-center gap-2">
                <LayoutTemplate className="w-3 h-3" /> Title Lab
              </label>
              <button 
                onClick={() => { setShowTitleLab(!showTitleLab); if (!showTitleLab) handleFetchTitles(); }}
                className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline flex items-center gap-1"
              >
                {showTitleLab ? 'Close lab' : 'Generate SEO Variants'} <Sparkles className="w-3 h-3" />
              </button>
            </div>
            
            <input 
              value={localOutline.title}
              onChange={e => setLocalOutline({ ...localOutline, title: e.target.value })}
              className="w-full bg-white border border-gray-100 p-5 rounded-2xl font-black text-2xl italic tracking-tighter outline-none focus:border-indigo-600 transition-colors shadow-sm"
              placeholder="Paste or draft final article title..."
            />

            {showTitleLab && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 animate-in fade-in duration-300">
                {generatingTitles ? (
                  <div className="col-span-full py-4 flex items-center gap-3 text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Synthesizing variants...</span>
                  </div>
                ) : titleSuggestions.map((t, i) => (
                  <button 
                    key={i} 
                    onClick={() => { setLocalOutline({ ...localOutline, title: t }); setShowTitleLab(false); }}
                    className="p-3 bg-white border hover:border-indigo-600 rounded-xl text-left text-[11px] font-bold text-gray-600 hover:text-indigo-600 transition-all shadow-sm group"
                  >
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity mr-1">⚡</span> {t}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar relative bg-white">
          {!hasStarted ? (
            <div className="max-w-3xl mx-auto space-y-12 py-10">
               <div className="text-center space-y-4">
                 <h3 className="text-5xl font-black text-gray-900 italic uppercase">Neural Synthesis</h3>
                 <p className="text-gray-400 text-lg">Cross-referencing real-time discourse for authority content.</p>
               </div>
               <div className="space-y-6">
                 {localOutline.sections?.map((s, i) => (
                   <div key={i} className="p-8 bg-gray-50 rounded-[40px] border shadow-sm">
                     <h4 className="font-black text-gray-900 text-xl mb-4">{i+1}. {s.heading}</h4>
                     <ul className="grid grid-cols-2 gap-2 ml-4">
                       {s.subheadings?.map((sub, j) => (
                         <li key={j} className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-indigo-200" /> {sub}
                         </li>
                       ))}
                     </ul>
                   </div>
                 ))}
               </div>
            </div>
          ) : (
            <div className="max-w-5xl mx-auto space-y-8 pb-32">
              <div className="flex items-center gap-4 py-8 border-b border-gray-100">
                 <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
                    <div className="text-white font-black text-xs">{brief.author.name[0]}</div>
                 </div>
                 <div>
                    <p className="text-sm font-black text-gray-900 italic tracking-tight">{brief.author.name}</p>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{brief.author.title}</p>
                 </div>
              </div>

              {heroImage && <img src={heroImage.url} className="w-full h-[500px] object-cover rounded-[56px] shadow-2xl mb-12" alt="Hero" />}
              
              {viewMode === 'preview' ? (
                <div className="markdown-body">
                  <ReactMarkdown>{content || "Connecting to synthesis core..."}</ReactMarkdown>
                  {isGenerating && (
                    <div className="flex flex-col items-center gap-6 my-20">
                      <Loader2 className="w-12 h-12 animate-spin text-indigo-400" />
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Streaming discourse nodes...</p>
                    </div>
                  )}
                </div>
              ) : (
                <textarea 
                  ref={textareaRef}
                  value={content}
                  onSelect={() => setSelection({ start: textareaRef.current?.selectionStart || 0, end: textareaRef.current?.selectionEnd || 0 })}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full min-h-[1200px] bg-transparent border-none outline-none font-mono text-xl resize-none leading-relaxed text-gray-800"
                  placeholder="Drafting Workspace Active..."
                />
              )}
            </div>
          )}

          {viewMode === 'edit' && hasStarted && (
             <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-40">
               {aiAssistantOpen ? (
                 <div className="bg-slate-900 border border-slate-800 shadow-2xl rounded-[32px] p-2 flex items-center gap-2 w-[500px]">
                   <input 
                    autoFocus
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAiWritingTask(aiPrompt)}
                    placeholder={isSelectionActive ? "Command AI to edit selection..." : "Synthesize new section..."}
                    className="flex-1 bg-transparent border-none outline-none text-white text-sm py-3 px-4 font-bold"
                   />
                   <div className="flex gap-1 pr-2">
                      <button onClick={() => handleAiWritingTask(aiPrompt)} disabled={!aiPrompt || isAiWorking} className="bg-indigo-600 p-2 rounded-xl text-white">
                        {isAiWorking ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUpRight className="w-4 h-4" />}
                      </button>
                      <button onClick={() => setAiAssistantOpen(false)} className="p-2 text-slate-500"><X className="w-4 h-4" /></button>
                   </div>
                 </div>
               ) : (
                 <button onClick={() => setAiAssistantOpen(true)} className="bg-slate-900 text-white px-8 py-4 rounded-full font-black text-xs uppercase tracking-[0.2em] flex items-center gap-3 shadow-2xl transition-all hover:scale-105 active:scale-95 border border-slate-700">
                   <Sparkles className="w-4 h-4 text-indigo-400" /> Writing Assistant
                 </button>
               )}
             </div>
          )}
        </div>
      </div>

      <div className="w-96 flex flex-col gap-8 overflow-y-auto custom-scrollbar pr-4 pb-12">
        {isOptimizing && (
          <div className="bg-indigo-600 rounded-[40px] p-8 text-white space-y-4 animate-pulse">
            <h3 className="font-black text-sm uppercase tracking-widest flex items-center gap-2"><Rocket className="w-4 h-4" /> Optimization Active</h3>
            <div className="space-y-2 font-mono text-[10px]">
               {optimizationLogs.map((log, i) => <p key={i} className="opacity-70">{log}</p>)}
            </div>
          </div>
        )}

        <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl p-8 space-y-6">
          <h3 className="font-black text-gray-900 text-sm uppercase tracking-widest flex items-center gap-2"><Target className="w-4 h-4 text-indigo-600" /> SEO Lab</h3>
          <div className="text-center py-4">
            <div className="text-7xl font-black text-indigo-600 italic tracking-tighter">
              {analyzing ? <Loader2 className="w-12 h-12 animate-spin mx-auto text-indigo-100" /> : analysis?.score || 0}
            </div>
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mt-2">Semantic Index</p>
          </div>
          <button onClick={handleFullOptimization} disabled={isOptimizing || !content} className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all">
            <BrainCircuit className="w-5 h-5" /> RE-SYNTHESIZE NODES
          </button>
        </div>

        <div className="bg-slate-900 rounded-[40px] p-8 space-y-6">
           <h3 className="text-white font-black text-sm uppercase tracking-widest flex items-center gap-2"><Quote className="w-4 h-4 text-indigo-400" /> Bibliography</h3>
           <div className="space-y-3">
             {citations.length ? citations.map((c, i) => (
               <div key={i} className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
                 <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">[{c.id}]</span>
                 <p className="text-[11px] text-slate-400 font-bold leading-relaxed line-clamp-1">{c.title}</p>
                 <a href={c.url} target="_blank" className="text-[9px] text-indigo-300 hover:underline truncate block mt-1">{c.url}</a>
               </div>
             )) : (
               <div className="py-8 text-center space-y-3 border border-dashed border-slate-700 rounded-3xl">
                 <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Awaiting citations...</p>
               </div>
             )}
           </div>
        </div>

        <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl p-8 space-y-6">
           <h3 className="font-black text-gray-900 text-sm uppercase tracking-widest flex items-center gap-2"><ImageIcon className="w-4 h-4 text-purple-600" /> Visual Discourse</h3>
           <ImageGenerator 
              defaultPrompt={`Professional illustration for: ${localOutline?.title || brief?.topic}.`} 
              onImageGenerated={(url, prompt) => handleAddImage({ id: Math.random().toString(36).substr(2,9), url, prompt, isHero: articleImages.length === 0 })}
              topicContext={localOutline?.title || brief?.topic}
            />
            
            <div className="grid grid-cols-2 gap-3 pt-4 border-t">
              {articleImages.map(img => (
                <div key={img.id} className="relative aspect-square rounded-2xl overflow-hidden border bg-gray-50 group">
                   <img src={img.url} className="w-full h-full object-cover" />
                   {img.isHero && <div className="absolute top-2 right-2 bg-indigo-600 text-white p-1 rounded-md shadow-lg"><Star className="w-3 h-3" /></div>}
                </div>
              ))}
            </div>
        </div>
      </div>

      {showShareModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[56px] p-12 space-y-8 shadow-2xl relative overflow-hidden text-center">
            <h3 className="font-black text-3xl uppercase italic tracking-tighter">Share Node</h3>
            <div className="w-24 h-24 bg-indigo-100 rounded-[32px] flex items-center justify-center mx-auto mb-4">
              <Link className="w-12 h-12 text-indigo-600" />
            </div>
            <div className="bg-gray-50 p-4 rounded-3xl border flex items-center gap-3">
              <input readOnly value={getShareLink()} className="bg-transparent border-none outline-none text-xs font-mono text-gray-500 flex-1 truncate" />
              <button onClick={copyToClipboard} className={`p-3 rounded-2xl transition-all ${copied ? 'bg-green-500 text-white' : 'bg-white text-indigo-600 shadow-sm'}`}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <button onClick={() => setShowShareModal(false)} className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Close Access</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArticleEditor;
