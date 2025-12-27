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
  // Add missing ImageIcon import
  Image as ImageIcon
} from 'lucide-react';
import { geminiService } from '../geminiService';
import { ContentBrief, ContentOutline, SEOAnalysis, ScheduledPost } from '../types';
import ImageGenerator from './ImageGenerator';

interface ArticleVersion {
  id: string;
  timestamp: number;
  content: string;
  outline: ContentOutline;
}

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
  const [showScoreTooltip, setShowScoreTooltip] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'edit'>('preview');
  const [sources, setSources] = useState<{ uri: string; title: string }[]>([]);
  const [showSourcesModal, setShowSourcesModal] = useState(false);
  const [showJsonLdModal, setShowJsonLdModal] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split('T')[0]);
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [schedulePlatform, setSchedulePlatform] = useState<ScheduledPost['platform']>('LinkedIn');
  const [isScheduled, setIsScheduled] = useState(false);

  // Social Post State
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [selectedSocialPlatform, setSelectedSocialPlatform] = useState<'Instagram' | 'Facebook' | 'LinkedIn'>('Instagram');
  const [socialCaption, setSocialCaption] = useState('');
  const [socialLoading, setSocialLoading] = useState(false);

  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null);
  const [localOutline, setLocalOutline] = useState<ContentOutline>(initialOutline || { title: '', sections: [] });

  // AI Assistant State
  const [aiAssistantLoading, setAiAssistantLoading] = useState(false);
  const [aiAssistantOutput, setAiAssistantOutput] = useState('');
  const [customInstruction, setCustomInstruction] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Autosave State
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
          heroImageUrl: dHeroImageUrl,
          tags: dTags 
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
        }
      }
      setSources(Array.from(collectedSources.entries()).map(([uri, title]) => ({ uri, title })));
      await performAnalysis(fullText);
    } catch (error) {
      console.error("Stream failed", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const performAnalysis = async (textToAnalyze: string) => {
    if (!textToAnalyze) return;
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

  const generateSocialPost = async (platform: 'Instagram' | 'Facebook' | 'LinkedIn') => {
    setSocialLoading(true);
    setSelectedSocialPlatform(platform);
    try {
      const caption = await geminiService.generateSocialCaption(platform, content);
      setSocialCaption(caption);
      setShowSocialModal(true);
    } catch (error) {
      console.error(error);
    } finally {
      setSocialLoading(false);
    }
  };

  const handleAIAssistantTask = async (task: 'rephrase' | 'expand' | 'summarize' | 'draft' | 'custom') => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    if (!selectedText && task !== 'draft' && task !== 'custom') return;
    setAiAssistantLoading(true);
    setAiAssistantOutput('');
    try {
      const result = await geminiService.performWritingTask(task, selectedText || "New Section", content, customInstruction);
      setAiAssistantOutput(result);
    } catch (e) {
      console.error(e);
    } finally {
      setAiAssistantLoading(false);
    }
  };

  const handleVisualBlock = async (type: 'table' | 'callout' | 'checklist') => {
    setAiAssistantLoading(true);
    try {
      const result = await geminiService.generateVisualBlock(type, content.substring(0, 1000));
      setAiAssistantOutput(result);
    } catch (e) {
      console.error(e);
    } finally {
      setAiAssistantLoading(false);
    }
  };

  const applyAIAssistantResult = () => {
    const textarea = textareaRef.current;
    if (!textarea || !aiAssistantOutput) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent = content.substring(0, start) + aiAssistantOutput + content.substring(end);
    setContent(newContent);
    setAiAssistantOutput('');
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

  const scoreColor = (score: number) => {
    if (score > 80) return 'text-green-600';
    if (score > 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="flex h-[calc(100vh-120px)] gap-8 animate-in fade-in duration-500">
      <div className="flex-1 flex flex-col bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
        <header className="px-6 py-4 border-b flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5 text-gray-500" />
            </button>
            <h2 className="font-bold text-gray-900 line-clamp-1">{localOutline.title || 'Draft Article'}</h2>
            {saveStatus !== 'idle' && (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-full border border-gray-100">
                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{saveStatus === 'saving' ? 'Saving...' : 'Saved'}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {hasStarted && (
              <div className="flex bg-gray-100 p-1 rounded-xl">
                <button onClick={() => setViewMode('preview')} className={`px-4 py-1.5 rounded-lg text-xs font-bold ${viewMode === 'preview' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400'}`}>Preview</button>
                <button onClick={() => setViewMode('edit')} className={`px-4 py-1.5 rounded-lg text-xs font-bold ${viewMode === 'edit' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400'}`}>Edit</button>
              </div>
            )}
            {!hasStarted ? (
              <button onClick={startGeneration} className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                <Play className="w-4 h-4" /> Start Generation
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={() => setShowScheduleModal(true)} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-bold flex items-center gap-2 border border-indigo-100">
                  <Calendar className="w-4 h-4" /> Schedule
                </button>
                <div className="h-6 w-px bg-gray-100 mx-1" />
                <button onClick={() => generateSocialPost('Instagram')} disabled={socialLoading} className="p-2 text-gray-400 hover:text-pink-600 transition-colors" title="Generate Instagram Post">
                  <Instagram className="w-5 h-5" />
                </button>
                <button onClick={() => generateSocialPost('Facebook')} disabled={socialLoading} className="p-2 text-gray-400 hover:text-blue-600 transition-colors" title="Generate Facebook Post">
                  <Facebook className="w-5 h-5" />
                </button>
                <button onClick={() => generateSocialPost('LinkedIn')} disabled={socialLoading} className="p-2 text-gray-400 hover:text-blue-800 transition-colors" title="Generate LinkedIn Post">
                  <Linkedin className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {!hasStarted ? (
            <div className="max-w-3xl mx-auto space-y-6">
               <h3 className="text-xl font-bold">Review Outline Before Launch</h3>
               {localOutline.sections.map((s, i) => (
                 <div key={i} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                   <h4 className="font-bold text-indigo-600">{s.heading}</h4>
                   <ul className="mt-2 text-sm text-gray-500 space-y-1">
                     {s.subheadings.map((sub, j) => <li key={j}>• {sub}</li>)}
                   </ul>
                 </div>
               ))}
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-6">
              {heroImageUrl && <img src={heroImageUrl} className="w-full h-64 object-cover rounded-3xl shadow-lg mb-8" />}
              {viewMode === 'preview' ? (
                <div className="markdown-body">
                  <ReactMarkdown>{content || "Awaiting AI stream..."}</ReactMarkdown>
                </div>
              ) : (
                <textarea 
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full min-h-[600px] bg-transparent border-none outline-none font-mono text-lg leading-relaxed custom-scrollbar"
                  placeholder="Drafting area..."
                />
              )}
            </div>
          )}
        </div>
      </div>

      <div className="w-96 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
        {/* AI Assistant Toolkit */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2"><Sparkles className="w-5 h-5 text-indigo-600" /> AI Toolkit</h3>
            {aiAssistantLoading && <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />}
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => handleAIAssistantTask('rephrase')} className="p-3 bg-gray-50 rounded-xl text-[10px] font-bold text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 border border-transparent hover:border-indigo-100 transition-all">REPHRASE</button>
              <button onClick={() => handleAIAssistantTask('expand')} className="p-3 bg-gray-50 rounded-xl text-[10px] font-bold text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 border border-transparent hover:border-indigo-100 transition-all">EXPAND</button>
            </div>

            <div className="pt-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Visual Elements</label>
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => handleVisualBlock('table')} className="flex flex-col items-center gap-1 p-2 bg-indigo-50 rounded-xl text-indigo-600 hover:bg-indigo-100 transition-all">
                  <TableIcon className="w-4 h-4" /> <span className="text-[8px] font-bold">TABLE</span>
                </button>
                <button onClick={() => handleVisualBlock('callout')} className="flex flex-col items-center gap-1 p-2 bg-indigo-50 rounded-xl text-indigo-600 hover:bg-indigo-100 transition-all">
                  <Quote className="w-4 h-4" /> <span className="text-[8px] font-bold">CALLOUT</span>
                </button>
                <button onClick={() => handleVisualBlock('checklist')} className="flex flex-col items-center gap-1 p-2 bg-indigo-50 rounded-xl text-indigo-600 hover:bg-indigo-100 transition-all">
                  <Check className="w-4 h-4" /> <span className="text-[8px] font-bold">LIST</span>
                </button>
              </div>
            </div>

            {aiAssistantOutput && (
              <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 animate-in zoom-in-95">
                <div className="max-h-32 overflow-y-auto text-[11px] text-gray-700 italic mb-4 font-mono leading-tight">
                  {aiAssistantOutput}
                </div>
                <div className="flex gap-2">
                  <button onClick={applyAIAssistantResult} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest">Apply</button>
                  <button onClick={() => setAiAssistantOutput('')} className="px-3 bg-white border rounded-lg text-gray-400"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SEO Analytics */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2"><BarChart2 className="w-5 h-5 text-indigo-600" /> SEO Health</h3>
            {analyzing && <Loader2 className="w-4 h-4 animate-spin" />}
          </div>
          <div className="text-center py-4">
            <span className={`text-5xl font-black ${scoreColor(analysis?.score || 0)}`}>{analysis?.score || 0}</span>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-2 font-bold">Optimization Score</p>
          </div>
          {analysis?.suggestions && (
            <div className="mt-4 space-y-2">
               {analysis.suggestions.slice(0, 3).map((s, i) => (
                 <div key={i} className="flex gap-2 text-[10px] text-gray-600 bg-gray-50 p-2 rounded-lg">
                   <Zap className="w-3 h-3 text-amber-500 flex-shrink-0" />
                   <span>{s}</span>
                 </div>
               ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-6">
          <ImageGenerator 
            defaultPrompt={`Hero image for: ${localOutline.title}`} 
            initialImageUrl={heroImageUrl} 
            onImageGenerated={setHeroImageUrl}
            topicContext={localOutline.title}
          />
        </div>
      </div>

      {/* Social Post Modal */}
      {showSocialModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 flex flex-col md:flex-row max-h-[90vh]">
             <div className="w-full md:w-1/2 bg-gray-50 border-r relative flex flex-col">
                <div className="p-6 border-b bg-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-xl ${selectedSocialPlatform === 'Instagram' ? 'bg-pink-100 text-pink-600' : selectedSocialPlatform === 'LinkedIn' ? 'bg-blue-100 text-blue-700' : 'bg-blue-50 text-blue-600'}`}>
                      {selectedSocialPlatform === 'Instagram' ? <Instagram className="w-4 h-4" /> : selectedSocialPlatform === 'LinkedIn' ? <Linkedin className="w-4 h-4" /> : <Facebook className="w-4 h-4" />}
                    </div>
                    <span className="font-bold text-gray-900">{selectedSocialPlatform} Preview</span>
                  </div>
                  <button onClick={() => setShowSocialModal(false)} className="md:hidden"><X className="w-5 h-5 text-gray-400" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center justify-center bg-gray-100/50">
                   <div className="bg-white rounded-2xl shadow-xl w-full max-w-[320px] overflow-hidden border">
                      <div className="p-3 flex items-center gap-2 border-b">
                         <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">M</div>
                         <span className="text-[11px] font-bold">My Workspace</span>
                      </div>
                      {heroImageUrl ? (
                        <img src={heroImageUrl} className="w-full aspect-square object-cover" />
                      ) : (
                        <div className="w-full aspect-square bg-gray-100 flex items-center justify-center"><ImageIcon className="w-10 h-10 text-gray-300" /></div>
                      )}
                      <div className="p-4 space-y-2">
                         <div className="flex gap-3 text-gray-700">
                           <Share2 className="w-4 h-4" />
                           <RotateCcw className="w-4 h-4" />
                         </div>
                         <p className="text-[11px] leading-relaxed text-gray-700 line-clamp-4 font-medium italic">
                           {socialCaption}
                         </p>
                      </div>
                   </div>
                </div>
             </div>
             <div className="flex-1 p-8 flex flex-col bg-white">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Platform Synthesis</h3>
                    <p className="text-sm text-gray-500">Condensing your article for high-impact social reach.</p>
                  </div>
                  <button onClick={() => setShowSocialModal(false)} className="hidden md:block p-2 hover:bg-gray-100 rounded-xl transition-colors"><X className="w-5 h-5 text-gray-400" /></button>
                </div>

                <div className="flex-1 flex flex-col gap-6">
                  <div className="flex gap-2 p-1 bg-gray-50 rounded-2xl border w-fit">
                    {(['Instagram', 'Facebook', 'LinkedIn'] as const).map(p => (
                      <button 
                        key={p} 
                        onClick={() => generateSocialPost(p)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedSocialPlatform === p ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>

                  <div className="flex-1 flex flex-col gap-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Optimized Caption</label>
                    <textarea 
                      value={socialCaption}
                      onChange={(e) => setSocialCaption(e.target.value)}
                      className="flex-1 w-full bg-gray-50 border rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none font-medium leading-relaxed"
                    />
                  </div>
                  
                  <div className="flex gap-3 pt-4 border-t">
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(socialCaption);
                      }}
                      className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-200 transition-all"
                    >
                      <Copy className="w-4 h-4" /> Copy Caption
                    </button>
                    <button 
                      onClick={() => {
                        setShowSocialModal(false);
                        setShowScheduleModal(true);
                      }}
                      className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
                    >
                      <Calendar className="w-4 h-4" /> Add to Planner
                    </button>
                  </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Polish Scheduling Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95">
            <div className="px-8 py-6 bg-gray-50 border-b flex items-center justify-between">
               <h3 className="font-bold text-gray-900 text-xl flex items-center gap-2"><Calendar className="w-5 h-5 text-indigo-600" /> Plan Distribution</h3>
               <button onClick={() => setShowScheduleModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-8 space-y-6">
              {isScheduled ? (
                <div className="text-center py-12">
                   <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600"><Check className="w-8 h-8" /></div>
                   <h4 className="text-lg font-bold">Successfully Added!</h4>
                   <p className="text-sm text-gray-500">Visible in Content Planner now.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select Platform</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['LinkedIn', 'Twitter', 'Facebook', 'Blog'].map(p => (
                        <button key={p} onClick={() => setSchedulePlatform(p as any)} className={`p-3 rounded-xl border-2 text-xs font-bold transition-all ${schedulePlatform === p ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-100 hover:bg-gray-50'}`}>{p}</button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400">DATE</label>
                      <input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} className="w-full p-3 bg-gray-50 border rounded-xl text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400">TIME</label>
                      <input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} className="w-full p-3 bg-gray-50 border rounded-xl text-sm" />
                    </div>
                  </div>
                  <button onClick={handleScheduleConfirm} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100">Confirm Schedule</button>
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