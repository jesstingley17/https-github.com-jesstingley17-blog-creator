
import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Save, 
  Download, 
  ChevronLeft, 
  BarChart2, 
  Loader2, 
  Trophy, 
  Plus, 
  Trash2, 
  Play, 
  Eye,
  Code,
  List,
  Type,
  BookOpen,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  Zap,
  Target,
  Layers,
  Search,
  ExternalLink,
  X,
  Calendar,
  Clock,
  Check,
  Globe,
  History as HistoryIcon,
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  Layout,
  Info,
  ShieldCheck,
  Tag as TagIcon,
  Quote,
  Terminal,
  Copy,
  GripVertical,
  Wand2,
  Sparkles,
  ArrowRight,
  Replace,
  Table as TableIcon,
  Share2,
  Image as ImageIcon,
  AlignLeft,
  Minimize2,
  TrendingUp,
  AlertCircle,
  FileText
} from 'lucide-react';
import { geminiService } from '../geminiService';
import { ContentBrief, ContentOutline, SEOAnalysis, ScheduledPost } from '../types';
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
  const [hasStarted, setHasStarted] = useState(false);
  const [analysis, setAnalysis] = useState<SEOAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'edit'>('preview');
  const [sources, setSources] = useState<{ uri: string; title: string }[]>([]);
  
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split('T')[0]);
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [schedulePlatform, setSchedulePlatform] = useState<ScheduledPost['platform']>('LinkedIn');
  const [isScheduled, setIsScheduled] = useState(false);

  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null);
  const [localOutline, setLocalOutline] = useState<ContentOutline>(initialOutline || { title: '', sections: [] });

  const [aiAssistantLoading, setAiAssistantLoading] = useState(false);
  const [aiAssistantOutput, setAiAssistantOutput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const autosaveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const draftKey = `zr_draft_${brief.id || brief.topic}`;
    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft) {
      try {
        const { 
          content: dContent, 
          outline: dOutline, 
          hasStarted: dHasStarted, 
          heroImageUrl: dHeroImageUrl 
        } = JSON.parse(savedDraft);
        if (dContent) setContent(dContent);
        if (dOutline) setLocalOutline(dOutline);
        if (dHasStarted) setHasStarted(dHasStarted);
        if (dHeroImageUrl) setHeroImageUrl(dHeroImageUrl);
        if (dContent) performAnalysis(dContent);
      } catch (e) {
        console.error("Failed to load draft", e);
      }
    }
  }, [brief.id, brief.topic]);

  useEffect(() => {
    if (!content && !localOutline.title) return;
    if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
    setSaveStatus('saving');
    autosaveTimerRef.current = window.setTimeout(() => {
      const draftKey = `zr_draft_${brief.id || brief.topic}`;
      const draftData = { content, outline: localOutline, hasStarted, heroImageUrl, timestamp: Date.now() };
      try {
        localStorage.setItem(draftKey, JSON.stringify(draftData));
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } catch (e) {
        console.error("Autosave failed", e);
        setSaveStatus('idle');
      }
    }, 5000);
    return () => {
      if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
    };
  }, [content, localOutline, hasStarted, heroImageUrl, brief.id, brief.topic]);

  const startGeneration = async () => {
    setHasStarted(true);
    setIsGenerating(true);
    setViewMode('preview');
    let fullText = '';
    const collectedSources = new Map<string, string>();
    
    try {
      const stream = geminiService.streamContent(brief, localOutline);
      for await (const chunk of stream) {
        fullText += chunk.text || '';
        setContent(fullText);
        
        const groundingChunks = (chunk as any).candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (groundingChunks) {
          groundingChunks.forEach((c: any) => {
            if (c.web?.uri) collectedSources.set(c.web.uri, c.web.title || c.web.uri);
          });
          setSources(Array.from(collectedSources.entries()).map(([uri, title]) => ({ uri, title })));
        }
      }
      await performAnalysis(fullText);
    } catch (error) {
      console.error("Stream failed", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const performAnalysis = async (textToAnalyze: string) => {
    if (!textToAnalyze || textToAnalyze.length < 50) return;
    setAnalyzing(true);
    try {
      const result = await geminiService.analyzeSEO(textToAnalyze, brief.targetKeywords);
      setAnalysis(result);
    } catch (error) {
      console.error(error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleScheduleConfirm = () => {
    if (onSchedule) {
      const post: ScheduledPost = {
        id: Math.random().toString(36).substring(2, 9),
        articleId: brief.id,
        title: localOutline.title,
        date: `${scheduleDate}T${scheduleTime}:00Z`,
        platform: schedulePlatform
      };
      onSchedule(post);
      setIsScheduled(true);
      setTimeout(() => {
        setShowScheduleModal(false);
        setIsScheduled(false);
      }, 1500);
    }
  };

  // Fix: Added handleAIAssistantTask to process rephrase and expand requests
  const handleAIAssistantTask = async (task: 'rephrase' | 'expand') => {
    const selection = window.getSelection()?.toString();
    const textToProcess = selection || content.slice(-1000) || 'Please help me write this section.';
    
    setAiAssistantLoading(true);
    setAiAssistantOutput('');
    try {
      const result = await geminiService.performWritingTask(task, textToProcess, content);
      setAiAssistantOutput(result);
    } catch (error) {
      console.error(error);
    } finally {
      setAiAssistantLoading(false);
    }
  };

  // Fix: Added handleVisualBlock to generate specific Markdown elements like tables
  const handleVisualBlock = async (type: 'table' | 'callout' | 'checklist') => {
    setAiAssistantLoading(true);
    setAiAssistantOutput('');
    try {
      const result = await geminiService.generateVisualBlock(type, content);
      setAiAssistantOutput(result);
    } catch (error) {
      console.error(error);
    } finally {
      setAiAssistantLoading(false);
    }
  };

  // Fix: Added applyAIAssistantResult to append AI generated content to the current draft
  const applyAIAssistantResult = () => {
    if (!aiAssistantOutput) return;
    setContent(prev => prev + '\n\n' + aiAssistantOutput);
    setAiAssistantOutput('');
    setViewMode('edit');
  };

  const scoreColor = (score: number) => {
    if (score > 80) return 'text-green-600';
    if (score > 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="flex h-[calc(100vh-120px)] gap-8 animate-in fade-in duration-500">
      <div className="flex-1 flex flex-col bg-white rounded-[40px] border border-gray-100 shadow-2xl overflow-hidden">
        <header className="px-8 py-5 border-b flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <ChevronLeft className="w-5 h-5 text-gray-400" />
            </button>
            <h2 className="font-black text-gray-900 line-clamp-1 tracking-tight italic">{localOutline.title || 'Draft Article'}</h2>
            {saveStatus !== 'idle' && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 rounded-full border border-indigo-100">
                <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">{saveStatus === 'saving' ? 'Syncing...' : 'Synced'}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            {hasStarted && (
              <div className="flex bg-gray-100 p-1.5 rounded-2xl">
                <button onClick={() => setViewMode('preview')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${viewMode === 'preview' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400'}`}>Preview</button>
                <button onClick={() => setViewMode('edit')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${viewMode === 'edit' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400'}`}>Edit</button>
              </div>
            )}
            {!hasStarted ? (
              <button onClick={startGeneration} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl text-sm font-black uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-indigo-100">
                <Play className="w-4 h-4 fill-white" /> Start Synthesis
              </button>
            ) : (
              <button onClick={() => setShowScheduleModal(true)} className="px-6 py-3 bg-indigo-50 text-indigo-600 rounded-2xl text-sm font-black uppercase tracking-widest flex items-center gap-2 border border-indigo-100 hover:bg-indigo-100 transition-colors">
                <Calendar className="w-4 h-4" /> Schedule Post
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
          {!hasStarted ? (
            <div className="max-w-3xl mx-auto space-y-12 py-10">
               <div className="text-center space-y-4">
                 <h3 className="text-5xl font-black text-gray-900 tracking-tighter">SYNTHESIS ENGINE</h3>
                 <p className="text-gray-400 text-lg max-w-lg mx-auto">Confirm your outline structure. We will cross-reference real-time data to build an authoritative draft.</p>
               </div>
               <div className="space-y-6">
                 {localOutline.sections.map((s, i) => (
                   <div key={i} className="p-8 bg-gray-50 rounded-[40px] border border-gray-100 group hover:border-indigo-300 hover:bg-white transition-all duration-500 shadow-sm">
                     <div className="flex items-center gap-4 mb-6">
                       <span className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-sm font-black shadow-lg shadow-indigo-100">{i+1}</span>
                       <h4 className="font-black text-gray-900 text-xl tracking-tight">{s.heading}</h4>
                     </div>
                     <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3 ml-14">
                       {s.subheadings.map((sub, j) => (
                         <li key={j} className="text-sm font-bold text-gray-400 flex items-center gap-3">
                           <div className="w-2 h-2 rounded-full bg-indigo-200" />
                           {sub}
                         </li>
                       ))}
                     </ul>
                   </div>
                 ))}
               </div>
               <div className="pt-12 flex justify-center">
                 <button onClick={startGeneration} className="bg-indigo-600 text-white px-16 py-6 rounded-[32px] font-black text-2xl flex items-center gap-4 shadow-[0_20px_50px_rgba(79,70,229,0.3)] hover:scale-105 active:scale-95 transition-all">
                   <Sparkles className="w-8 h-8" /> GENERATE DRAFT
                 </button>
               </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-8">
              {heroImageUrl && <img src={heroImageUrl} className="w-full h-[400px] object-cover rounded-[48px] shadow-2xl mb-12 border-8 border-white" />}
              {viewMode === 'preview' ? (
                <div className="markdown-body">
                  <ReactMarkdown>{content || "Connecting to intelligence stream..."}</ReactMarkdown>
                  {isGenerating && (
                    <div className="flex flex-col items-center gap-6 py-20 animate-pulse">
                      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm font-black text-indigo-400 uppercase tracking-[0.3em]">Synthesizing Nodes...</p>
                    </div>
                  )}
                  {sources.length > 0 && (
                    <div className="mt-20 pt-12 border-t border-dashed border-gray-200">
                       <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-8 flex items-center gap-2">
                         <Globe className="w-4 h-4" /> Information Foundations
                       </h3>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         {sources.map((s, i) => (
                           <a key={i} href={s.uri} target="_blank" rel="noopener noreferrer" className="p-6 bg-gray-50 rounded-3xl border border-gray-100 hover:border-indigo-400 hover:bg-white transition-all flex flex-col gap-2 group">
                             <span className="text-sm font-black text-gray-900 line-clamp-1 group-hover:text-indigo-600">{s.title}</span>
                             <span className="text-[11px] text-gray-400 font-bold truncate tracking-tight">{s.uri}</span>
                           </a>
                         ))}
                       </div>
                    </div>
                  )}
                </div>
              ) : (
                <textarea 
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full min-h-[1000px] bg-transparent border-none outline-none font-mono text-lg leading-relaxed custom-scrollbar placeholder:text-gray-200"
                  placeholder="The editor is live. Refine your draft using the intelligence hub on the right..."
                />
              )}
            </div>
          )}
        </div>
      </div>

      <div className="w-96 flex flex-col gap-8 overflow-y-auto custom-scrollbar pr-4">
        {/* Live SEO Score & Analysis */}
        <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl p-8 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-gray-900 text-sm uppercase tracking-widest flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-600" /> SEO Logic
            </h3>
            {analyzing && <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />}
          </div>
          
          <div className="relative flex items-center justify-center py-4">
            <div className={`text-7xl font-black ${scoreColor(analysis?.score || 0)} tracking-tighter tabular-nums`}>
              {analysis?.score || 0}
            </div>
            <div className="absolute -bottom-2 text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Optimization Index</div>
          </div>

          {/* Actionable Keyword Suggestions Section */}
          <div className="space-y-6 pt-4 border-t border-gray-50">
             <div className="flex items-center justify-between">
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Strategic Keywords</label>
               <TrendingUp className="w-4 h-4 text-indigo-400" />
             </div>
             
             <div className="space-y-4">
               {analysis?.keywordSuggestions && analysis.keywordSuggestions.length > 0 ? (
                 analysis.keywordSuggestions.map((ks, i) => (
                   <div key={i} className="group p-5 bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-300">
                     <div className="flex items-center justify-between mb-3">
                       <span className="text-xs font-black text-gray-900 flex items-center gap-2 uppercase">
                         <TagIcon className="w-3.5 h-3.5 text-indigo-600" /> {ks.keyword}
                       </span>
                       <span className={`text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-tighter ${
                         ks.action.toLowerCase().includes('add') ? 'bg-green-50 text-green-600 border border-green-100' : 
                         ks.action.toLowerCase().includes('optimize') ? 'bg-amber-50 text-amber-600 border border-amber-100' : 
                         'bg-indigo-50 text-indigo-600 border border-indigo-100'
                       }`}>
                         {ks.action}
                       </span>
                     </div>
                     <p className="text-[11px] text-gray-500 leading-relaxed font-medium">
                       {ks.explanation}
                     </p>
                   </div>
                 ))
               ) : (
                 <div className="text-center py-6 border-2 border-dashed border-gray-50 rounded-3xl">
                   <p className="text-[10px] font-bold text-gray-300 uppercase italic">Awaiting semantic deep-dive...</p>
                 </div>
               )}
            </div>
          </div>

          {analysis?.suggestions && analysis.suggestions.length > 0 && (
            <div className="space-y-3">
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Structural Quick Wins</label>
               {analysis.suggestions.slice(0, 3).map((s, i) => (
                 <div key={i} className="flex gap-3 text-[11px] text-gray-600 bg-gray-50 p-4 rounded-2xl border border-transparent hover:border-indigo-100 hover:bg-white transition-all">
                   <Zap className="w-4 h-4 text-amber-500 flex-shrink-0" />
                   <span className="font-medium">{s}</span>
                 </div>
               ))}
            </div>
          )}
        </div>

        {/* Intelligence Toolkit */}
        <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-black text-gray-900 text-sm uppercase tracking-widest flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-indigo-600" /> Intelligence
            </h3>
            {aiAssistantLoading && <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />}
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => handleAIAssistantTask('rephrase')} className="group flex flex-col items-center gap-3 p-5 bg-gray-50 rounded-3xl text-[10px] font-black text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-transparent hover:border-indigo-100">
              <Replace className="w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity" /> REPHRASE
            </button>
            <button onClick={() => handleAIAssistantTask('expand')} className="group flex flex-col items-center gap-3 p-5 bg-gray-50 rounded-3xl text-[10px] font-black text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-transparent hover:border-indigo-100">
              <ArrowRight className="w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity" /> EXPAND
            </button>
            <button onClick={() => handleVisualBlock('table')} className="col-span-2 group flex items-center justify-center gap-4 p-5 bg-indigo-600 rounded-3xl text-[11px] font-black text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all">
              <TableIcon className="w-5 h-5" /> CREATE COMPARISON TABLE
            </button>
          </div>

          {aiAssistantOutput && (
            <div className="mt-6 p-6 bg-indigo-50/50 rounded-[32px] border border-indigo-100 animate-in zoom-in-95">
              <div className="max-h-40 overflow-y-auto text-[11px] text-gray-700 italic mb-6 font-mono leading-relaxed bg-white/80 p-4 rounded-2xl border border-indigo-50">
                {aiAssistantOutput}
              </div>
              <div className="flex gap-3">
                <button onClick={applyAIAssistantResult} className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100">Apply Changes</button>
                <button onClick={() => setAiAssistantOutput('')} className="px-4 bg-white border border-gray-200 rounded-2xl text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </div>

        <ImageGenerator 
          defaultPrompt={`Cinematic, professional hero illustration for an article titled: ${localOutline.title}`} 
          initialImageUrl={heroImageUrl} 
          onImageGenerated={setHeroImageUrl}
          topicContext={localOutline.title}
        />
      </div>

      {/* Scheduling Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-[48px] shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95">
            <div className="px-10 py-8 bg-gray-50 border-b flex items-center justify-between">
               <h3 className="font-black text-gray-900 text-2xl tracking-tighter flex items-center gap-3 italic"><Calendar className="w-6 h-6 text-indigo-600" /> PLANNER</h3>
               <button onClick={() => setShowScheduleModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X className="w-6 h-6 text-gray-400" /></button>
            </div>
            <div className="p-10 space-y-8">
              {isScheduled ? (
                <div className="text-center py-12 space-y-4">
                   <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600 shadow-xl shadow-green-100"><Check className="w-10 h-10" /></div>
                   <h4 className="text-2xl font-black tracking-tight">Post Locked In</h4>
                   <p className="text-sm text-gray-400 font-medium">Article successfully synced to content calendar.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Distribution Node</label>
                    <div className="grid grid-cols-2 gap-3">
                      {['LinkedIn', 'Twitter', 'Facebook', 'Blog'].map(p => (
                        <button key={p} onClick={() => setSchedulePlatform(p as any)} className={`p-4 rounded-2xl border-2 text-xs font-black uppercase tracking-widest transition-all ${schedulePlatform === p ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-100 hover:bg-gray-50 text-gray-400'}`}>{p}</button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Publication Date</label>
                      <input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} className="w-full p-4 bg-gray-50 border rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-600" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Time (UTC)</label>
                      <input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} className="w-full p-4 bg-gray-50 border rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-600" />
                    </div>
                  </div>
                  <button onClick={handleScheduleConfirm} className="w-full py-5 bg-indigo-600 text-white rounded-[32px] font-black text-lg hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-100">CONFIRM SCHEDULE</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArticleEditor;
