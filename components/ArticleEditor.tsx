
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
  Cloud
} from 'lucide-react';
import { geminiService } from '../geminiService';
import { storageService } from '../storageService';
import { ContentBrief, ContentOutline, SEOAnalysis, ScheduledPost, GeneratedContent } from '../types';
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
  
  const [localOutline, setLocalOutline] = useState<ContentOutline>(() => {
    return initialOutline && Array.isArray(initialOutline?.sections) 
      ? initialOutline 
      : { title: brief?.topic || 'Untitled', sections: [] };
  });

  const [aiAssistantLoading, setAiAssistantLoading] = useState(false);
  const [aiAssistantOutput, setAiAssistantOutput] = useState('');
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

  const handleAIAssistantTask = async (task: 'rephrase' | 'expand') => {
    setAiAssistantLoading(true);
    try {
      const res = await geminiService.performWritingTask(task, content.slice(-500), content);
      setAiAssistantOutput(res);
    } catch (e) {} finally { setAiAssistantLoading(false); }
  };

  return (
    <div className="flex h-[calc(100vh-120px)] gap-8 animate-in fade-in duration-500">
      <div className="flex-1 flex flex-col bg-white rounded-[40px] border border-gray-100 shadow-2xl overflow-hidden">
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
              <div className="flex bg-gray-100 p-1.5 rounded-2xl">
                <button onClick={() => setViewMode('preview')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase ${viewMode === 'preview' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400'}`}>Preview</button>
                <button onClick={() => setViewMode('edit')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase ${viewMode === 'edit' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400'}`}>Edit</button>
              </div>
            )}
            <button onClick={hasStarted ? () => setShowScheduleModal(true) : startGeneration} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl text-sm font-black uppercase flex items-center gap-2">
              {hasStarted ? <Calendar className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />} {hasStarted ? 'Schedule' : 'Start Synthesis'}
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
                  {isGenerating && <Loader2 className="w-12 h-12 animate-spin mx-auto my-20 text-indigo-400" />}
                </div>
              ) : (
                <textarea 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full min-h-[800px] bg-transparent border-none outline-none font-mono text-lg"
                />
              )}
            </div>
          )}
        </div>
      </div>

      <div className="w-96 flex flex-col gap-8 overflow-y-auto custom-scrollbar pr-4">
        <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl p-8 space-y-8">
          <h3 className="font-black text-gray-900 text-sm uppercase tracking-widest flex items-center gap-2"><Target className="w-4 h-4" /> SEO</h3>
          <div className="text-center py-4">
            <div className="text-7xl font-black text-indigo-600 italic tracking-tighter">{analysis?.score || 0}</div>
            <div className="text-[10px] font-black text-gray-300 uppercase">Optimization Index</div>
          </div>
        </div>

        <ImageGenerator 
          defaultPrompt={`Professional hero for: ${localOutline?.title || brief?.topic || 'Article'}`} 
          initialImageUrl={heroImageUrl} 
          onImageGenerated={setHeroImageUrl}
          topicContext={localOutline?.title || brief?.topic}
        />
      </div>

      {showScheduleModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[48px] p-10 space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="font-black text-2xl uppercase">Planner</h3>
              <button onClick={() => setShowScheduleModal(false)}><X className="w-6 h-6" /></button>
            </div>
            {isScheduled ? <div className="text-center font-black">Confirmed</div> : (
              <button onClick={() => setIsScheduled(true)} className="w-full py-5 bg-indigo-600 text-white rounded-[32px] font-black">CONFIRM</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ArticleEditor;
