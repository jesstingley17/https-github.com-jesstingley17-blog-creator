
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
  Info,
  Flame,
  User,
  ExternalLink,
  FileText
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
  
  const [showShareModal, setShowShareModal] = useState(false);
  const [showForge, setShowForge] = useState(false);
  const [forgeInput, setForgeInput] = useState('');
  const [isForging, setIsForging] = useState(false);
  const [forgeLogs, setForgeLogs] = useState<string[]>([]);
  
  const [articleImages, setArticleImages] = useState<ArticleImage[]>([]);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiWorking, setIsAiWorking] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selection, setSelection] = useState({ start: 0, end: 0 });

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
          if (data.content || data.images?.length) setHasStarted(true);
        }
      } catch (e) {}
    };
    loadDraft();
  }, [brief?.id]);

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
        fullText += (chunk as any).text || '';
        setContent(fullText);
      }
      performAnalysis(fullText);
      
      const heroUrl = await geminiService.generateArticleImage(`Hero image for: ${localOutline.title}. Professional digital style.`);
      setArticleImages([{ id: Math.random().toString(36).substr(2, 9), url: heroUrl, prompt: localOutline.title, isHero: true }]);
    } catch (error) {} finally { setIsGenerating(false); }
  };

  const handleForgeRefinement = async () => {
    if (!forgeInput.trim()) return;
    setIsForging(true);
    setForgeLogs([]);
    addForgeLog('Initializing Forge...');
    addForgeLog('Aligning context with Title...');
    
    try {
      const refined = await geminiService.refineTextWithContext(forgeInput, localOutline.title, brief.tone, brief.author);
      addForgeLog('Synthesis Successful.');
      
      const newContent = content + "\n\n" + refined;
      setContent(newContent);
      
      setTimeout(() => {
        setShowForge(false);
        setForgeInput('');
        setIsForging(false);
        setViewMode('edit');
      }, 1000);
    } catch (e) {
      addForgeLog('Critical Fault.');
      setIsForging(false);
    }
  };

  const handleFullOptimization = async () => {
    if (!content || isOptimizing) return;
    setIsOptimizing(true);
    setOptimizationLogs([]);
    addOptLog('Benchmarking Semantic Authority...');
    addOptLog('Rephrasing sentences for flow...');
    addOptLog('Enhancing keyword density...');
    
    try {
      const optimized = await geminiService.optimizeContent(content, brief, brief.author);
      addOptLog('Optimization Sync Complete.');
      setContent(optimized);
      performAnalysis(optimized);
      setTimeout(() => setIsOptimizing(false), 2000);
    } catch (e) { setIsOptimizing(false); }
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
    <div className="flex h-[calc(100vh-120px)] gap-8 animate-in fade-in duration-500">
      <div className="flex-1 flex flex-col bg-white rounded-[40px] border border-gray-100 shadow-2xl overflow-hidden relative">
        <header className="px-8 py-5 border-b flex items-center justify-between bg-white sticky top-0 z-40">
          <div className="flex items-center gap-6">
            <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><ChevronLeft className="w-5 h-5 text-gray-400" /></button>
            <div className="flex flex-col">
              <h2 className="font-black text-gray-900 line-clamp-1 italic text-lg uppercase leading-tight tracking-tighter">{localOutline?.title}</h2>
              <p className="text-[10px] font-black uppercase text-indigo-600 tracking-widest italic">Node: {brief.author.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex bg-gray-100 p-1 rounded-2xl">
              <button onClick={() => setViewMode('preview')} className={`px-5 py-2 rounded-xl text-xs font-black uppercase ${viewMode === 'preview' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400'}`}>Preview</button>
              <button onClick={() => setViewMode('edit')} className={`px-5 py-2 rounded-xl text-xs font-black uppercase ${viewMode === 'edit' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400'}`}>Edit</button>
            </div>
            {hasStarted && (
              <button 
                onClick={handleFullOptimization}
                disabled={isOptimizing}
                className="px-6 py-3 bg-indigo-50 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-100 transition-all active:scale-95 border border-indigo-100"
              >
                {isOptimizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                Optimize SEO & Flow
              </button>
            )}
            <button 
              onClick={() => setShowForge(true)}
              className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-all active:scale-95"
            >
              <Flame className="w-4 h-4 text-orange-500" /> Open Forge
            </button>
            <button onClick={hasStarted ? () => {} : startGeneration} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg active:scale-95">
              {hasStarted ? <ArrowUpRight className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />} {hasStarted ? 'Deploy' : 'Synthesize'}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar relative bg-white">
          {!hasStarted ? (
            <div className="max-w-3xl mx-auto space-y-12 py-10">
               <div className="text-center space-y-4">
                 <h3 className="text-5xl font-black text-gray-900 italic uppercase">Hierarchy Confirmed</h3>
                 <p className="text-gray-400 text-lg">Cross-referencing global SEO nodes for authoritative synthesis.</p>
               </div>
               <div className="space-y-6">
                 {localOutline.sections?.map((s, i) => (
                   <div key={i} className="p-8 bg-gray-50 rounded-[40px] border border-gray-100 shadow-sm">
                     <h4 className="font-black text-gray-900 text-xl mb-4 italic tracking-tighter">{i+1}. {s.heading}</h4>
                     <ul className="grid grid-cols-2 gap-4">
                       {s.subheadings?.map((sub, j) => (
                         <li key={j} className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-indigo-200" /> {sub}
                         </li>
                       ))}
                     </ul>
                   </div>
                 ))}
               </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-10 pb-32">
              <div className="p-10 bg-slate-50 rounded-[48px] border border-gray-100 flex items-center gap-10 shadow-sm">
                <div className="w-24 h-24 rounded-[32px] bg-white shadow-xl flex items-center justify-center shrink-0 border-4 border-white overflow-hidden">
                  <User className="w-12 h-12 text-slate-100" />
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-black italic text-slate-900 uppercase tracking-tighter leading-none">{brief.author.name}</p>
                  <p className="font-black text-indigo-600 text-[10px] uppercase tracking-widest">{brief.author.title}</p>
                  <p className="text-slate-500 font-medium text-sm leading-relaxed max-w-lg italic line-clamp-2">{brief.author.bio}</p>
                </div>
              </div>

              {heroImage && <img src={heroImage.url} className="w-full h-[500px] object-cover rounded-[56px] shadow-2xl mb-12 ring-1 ring-gray-100" alt="Hero" />}
              
              {viewMode === 'preview' ? (
                <div className="markdown-body">
                  <ReactMarkdown>{content || "Connecting to discourse core..."}</ReactMarkdown>
                  {isGenerating && (
                    <div className="flex flex-col items-center gap-6 my-20 animate-pulse">
                      <Loader2 className="w-16 h-16 animate-spin text-indigo-400" />
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Streaming Neural Nodes...</p>
                    </div>
                  )}
                </div>
              ) : (
                <textarea 
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full min-h-[1200px] bg-transparent border-none outline-none font-mono text-xl resize-none leading-relaxed text-gray-800"
                  placeholder="Drafting Workspace Active..."
                />
              )}
            </div>
          )}
        </div>

        {isOptimizing && (
          <div className="absolute inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-8">
            <div className="bg-slate-900 w-full max-w-md rounded-[40px] p-10 space-y-6 shadow-2xl border border-slate-800 animate-in zoom-in-95 duration-500">
               <div className="flex items-center gap-4 text-white border-b border-slate-800 pb-6">
                 <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                 <div>
                   <h3 className="font-black text-lg uppercase italic tracking-tighter">SEO Optimization</h3>
                   <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Rephrasing & Flow pass</p>
                 </div>
               </div>
               <div className="space-y-2">
                 {optimizationLogs.map((log, i) => (
                   <p key={i} className={`font-mono text-[10px] ${i === optimizationLogs.length - 1 ? 'text-indigo-300' : 'text-slate-600'}`}>{log}</p>
                 ))}
               </div>
            </div>
          </div>
        )}
      </div>

      {showForge && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[60px] p-12 space-y-10 shadow-2xl relative border border-gray-100">
            <div className="flex justify-between items-center relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-orange-100 rounded-3xl flex items-center justify-center shadow-inner">
                  <Flame className="w-8 h-8 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-black text-3xl uppercase italic tracking-tighter text-slate-900 leading-none">The Refinement Forge</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Paste raw notes for AI re-synthesis</p>
                </div>
              </div>
              <button onClick={() => setShowForge(false)} className="p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors border"><X className="w-6 h-6 text-slate-400" /></button>
            </div>

            <textarea 
              autoFocus
              value={forgeInput}
              onChange={e => setForgeInput(e.target.value)}
              className="w-full h-64 p-8 bg-gray-50 border-2 border-dashed border-gray-200 focus:border-orange-500 focus:bg-white rounded-[40px] outline-none font-medium text-lg leading-relaxed shadow-inner resize-none transition-all"
              placeholder="Paste raw research nodes, competitor snippets, or draft paragraphs here..."
            />

            {isForging ? (
              <div className="bg-slate-900 rounded-[32px] p-8 space-y-4 border border-slate-800">
                <div className="flex items-center gap-4 border-b border-slate-800 pb-4 text-white">
                  <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest italic">Forging Content Node...</span>
                </div>
                <div className="space-y-1">
                  {forgeLogs.map((log, i) => (
                    <p key={i} className="font-mono text-[9px] text-slate-600">{log}</p>
                  ))}
                </div>
              </div>
            ) : (
              <button 
                onClick={handleForgeRefinement}
                disabled={!forgeInput.trim()}
                className="w-full py-6 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white rounded-[32px] font-black text-xl uppercase tracking-widest shadow-2xl shadow-orange-100 active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
              >
                REFINE & SYNC <ArrowRight className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ArticleEditor;
