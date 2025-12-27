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
        
        // Extract citations from the stream if provided
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
    const textarea = textareaRef.current;
    let selectedText = '';
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      selectedText = content.substring(start, end);
    }

    const contextForAI = selectedText || content.substring(0, 2000);
    setAiAssistantLoading(true);
    setAiAssistantOutput('');
    try {
      const result = await geminiService.generateVisualBlock(type, contextForAI);
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
    performAnalysis(newContent);
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
            <div className="max-w-3xl mx-auto space-y-8 py-10">
               <div className="text-center space-y-4">
                 <h3 className="text-3xl font-black text-gray-900 tracking-tight">Ready to Synthesize?</h3>
                 <p className="text-gray-500">Review your structure. Clicking "Start Generation" will use real-time research to draft your complete article.</p>
               </div>
               <div className="space-y-4">
                 {localOutline.sections.map((s, i) => (
                   <div key={i} className="p-6 bg-gray-50 rounded-[32px] border border-gray-100 group hover:border-indigo-200 transition-all">
                     <div className="flex items-center gap-3 mb-4">
                       <span className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">{i+1}</span>
                       <h4 className="font-bold text-gray-900 text-lg">{s.heading}</h4>
                     </div>
                     <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 ml-11">
                       {s.subheadings.map((sub, j) => (
                         <li key={j} className="text-sm text-gray-500 flex items-center gap-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-indigo-200" />
                           {sub}
                         </li>
                       ))}
                     </ul>
                   </div>
                 ))}
               </div>
               <div className="pt-8 flex justify-center">
                 <button onClick={startGeneration} className="bg-indigo-600 text-white px-10 py-5 rounded-3xl font-black text-xl flex items-center gap-3 shadow-2xl shadow-indigo-200 hover:scale-105 active:scale-95 transition-all">
                   <Sparkles className="w-6 h-6" /> GENERATE COMPLETE DRAFT
                 </button>
               </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-6">
              {heroImageUrl && <img src={heroImageUrl} className="w-full h-80 object-cover rounded-3xl shadow-lg mb-8" />}
              {viewMode === 'preview' ? (
                <div className="markdown-body">
                  <ReactMarkdown>{content || "Awaiting intelligence stream..."}</ReactMarkdown>
                  {isGenerating && (
                    <div className="flex flex-col items-center gap-4 py-12">
                      <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                      <p className="text-sm font-black text-gray-400 uppercase tracking-widest animate-pulse">Drafting Content...</p>
                    </div>
                  )}
                  {sources.length > 0 && (
                    <div className="mt-16 pt-8 border-t">
                       <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                         <Search className="w-4 h-4" /> Research Foundations
                       </h3>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {sources.map((s, i) => (
                           <a key={i} href={s.uri} target="_blank" rel="noopener noreferrer" className="p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-indigo-200 transition-all flex flex-col gap-1">
                             <span className="text-xs font-bold text-indigo-600 line-clamp-1">{s.title}</span>
                             <span className="text-[10px] text-gray-400 truncate">{s.uri}</span>
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
                  className="w-full min-h-[800px] bg-transparent border-none outline-none font-mono text-lg leading-relaxed custom-scrollbar"
                  placeholder="The editor is yours. Use the AI toolkit to refine specific sections..."
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
            <h3 className="font-bold text-gray-900 flex items-center gap-2"><Sparkles className="w-5 h-5 text-indigo-600" /> Intelligence Hub</h3>
            {aiAssistantLoading && <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />}
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => handleAIAssistantTask('rephrase')} className="group flex flex-col items-center gap-2 p-3 bg-gray-50 rounded-xl text-[10px] font-bold text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 border border-transparent hover:border-indigo-100 transition-all">
                <Replace className="w-4 h-4 group-hover:scale-110 transition-transform" /> REPHRASE
              </button>
              <button onClick={() => handleAIAssistantTask('expand')} className="group flex flex-col items-center gap-2 p-3 bg-gray-50 rounded-xl text-[10px] font-bold text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 border border-transparent hover:border-indigo-100 transition-all">
                <ArrowRight className="w-4 h-4 group-hover:scale-110 transition-transform" /> EXPAND
              </button>
              <button onClick={() => handleAIAssistantTask('summarize')} className="group flex flex-col items-center gap-2 p-3 bg-gray-50 rounded-xl text-[10px] font-bold text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 border border-transparent hover:border-indigo-100 transition-all">
                <Minimize2 className="w-4 h-4 group-hover:scale-110 transition-transform" /> SUMMARIZE
              </button>
              <button onClick={() => handleVisualBlock('table')} className="group flex flex-col items-center gap-2 p-3 bg-indigo-600 rounded-xl text-[10px] font-bold text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all">
                <TableIcon className="w-4 h-4 group-hover:scale-110 transition-transform" /> COMPARE
              </button>
            </div>

            <div className="pt-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Visual Enhancements</label>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => handleVisualBlock('callout')} className="flex items-center justify-center gap-2 p-3 bg-gray-50 rounded-xl text-[10px] font-bold text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all">
                  <Quote className="w-3.5 h-3.5" /> CALLOUT
                </button>
                <button onClick={() => handleVisualBlock('checklist')} className="flex items-center justify-center gap-2 p-3 bg-gray-50 rounded-xl text-[10px] font-bold text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all">
                  <Check className="w-3.5 h-3.5" /> CHECKLIST
                </button>
              </div>
            </div>

            {aiAssistantOutput && (
              <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 animate-in zoom-in-95">
                <div className="max-h-32 overflow-y-auto text-[11px] text-gray-700 italic mb-4 font-mono leading-tight bg-white p-2 rounded-lg border">
                  {aiAssistantOutput}
                </div>
                <div className="flex gap-2">
                  <button onClick={applyAIAssistantResult} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest">Apply to Draft</button>
                  <button onClick={() => setAiAssistantOutput('')} className="px-3 bg-white border rounded-lg text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SEO Diagnostic Sidebar */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2"><BarChart2 className="w-5 h-5 text-indigo-600" /> SEO Pulse</h3>
            <button 
              onClick={() => performAnalysis(content)} 
              disabled={analyzing}
              className="text-[9px] font-black text-indigo-600 uppercase hover:underline"
            >
              {analyzing ? 'Analyzing...' : 'Refresh Score'}
            </button>
          </div>
          
          <div className="text-center py-4">
            <span className={`text-6xl font-black ${scoreColor(analysis?.score || 0)} transition-all duration-1000`}>
              {analysis?.score || 0}
            </span>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-2 font-bold">Optimization Rank</p>
          </div>

          <div className="mt-6 space-y-4">
            {analysis?.suggestions && analysis.suggestions.length > 0 && (
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Strategic Fixes</label>
                 {analysis.suggestions.slice(0, 3).map((s, i) => (
                   <div key={i} className="flex gap-2 text-[10px] text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-transparent hover:border-indigo-100 transition-all">
                     <Zap className="w-3 h-3 text-amber-500 flex-shrink-0" />
                     <span>{s}</span>
                   </div>
                 ))}
              </div>
            )}

            {analysis?.keywordSuggestions && analysis.keywordSuggestions.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-gray-50">
                 <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Semantic Opportunities</label>
                 {analysis.keywordSuggestions.slice(0, 3).map((ks, i) => (
                   <div key={i} className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow group">
                     <div className="flex items-center justify-between mb-1">
                       <span className="text-[11px] font-bold text-gray-900 flex items-center gap-1.5">
                         <TagIcon className="w-3 h-3 text-indigo-500" /> {ks.keyword}
                       </span>
                       <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${ks.action.toLowerCase() === 'add' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                         {ks.action}
                       </span>
                     </div>
                     <p className="text-[10px] text-gray-400 leading-snug">
                       {ks.explanation}
                     </p>
                   </div>
                 ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-6">
          <ImageGenerator 
            defaultPrompt={`Professional hero illustration for: ${localOutline.title}`} 
            initialImageUrl={heroImageUrl} 
            onImageGenerated={setHeroImageUrl}
            topicContext={localOutline.title}
          />
        </div>
      </div>

      {/* Social Synthesis Modal */}
      {showSocialModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 flex flex-col md:flex-row max-h-[90vh]">
             <div className="w-full md:w-1/2 bg-gray-100 border-r relative flex flex-col">
                <div className="p-6 border-b bg-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-xl ${selectedSocialPlatform === 'Instagram' ? 'bg-pink-100 text-pink-600' : selectedSocialPlatform === 'LinkedIn' ? 'bg-blue-100 text-blue-700' : 'bg-blue-50 text-blue-600'}`}>
                      {selectedSocialPlatform === 'Instagram' ? <Instagram className="w-4 h-4" /> : selectedSocialPlatform === 'LinkedIn' ? <Linkedin className="w-4 h-4" /> : <Facebook className="w-4 h-4" />}
                    </div>
                    <span className="font-bold text-gray-900">{selectedSocialPlatform}</span>
                  </div>
                  <button onClick={() => setShowSocialModal(false)} className="md:hidden"><X className="w-5 h-5 text-gray-400" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center justify-center">
                   <div className="bg-white rounded-2xl shadow-xl w-full max-w-[320px] overflow-hidden border">
                      <div className="p-3 flex items-center gap-2 border-b">
                         <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-[10px]">MY</div>
                         <span className="text-[10px] font-bold">My Workspace</span>
                      </div>
                      {heroImageUrl ? (
                        <img src={heroImageUrl} className="w-full aspect-square object-cover" />
                      ) : (
                        <div className="w-full aspect-square bg-gray-50 flex items-center justify-center"><FileText className="w-10 h-10 text-gray-200" /></div>
                      )}
                      <div className="p-4 space-y-2">
                         <p className="text-[11px] leading-relaxed text-gray-700 line-clamp-6 font-medium">
                           {socialCaption}
                         </p>
                      </div>
                   </div>
                </div>
             </div>
             <div className="flex-1 p-8 flex flex-col bg-white">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight uppercase italic">Synthesis</h3>
                    <p className="text-xs text-gray-400">Article-to-social condensation engine.</p>
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
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Post Body</label>
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
                      <Copy className="w-4 h-4" /> Copy
                    </button>
                    <button 
                      onClick={() => {
                        setShowSocialModal(false);
                        setShowScheduleModal(true);
                      }}
                      className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
                    >
                      <Calendar className="w-4 h-4" /> Schedule
                    </button>
                  </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Scheduling Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95">
            <div className="px-8 py-6 bg-gray-50 border-b flex items-center justify-between">
               <h3 className="font-bold text-gray-900 text-xl flex items-center gap-2"><Calendar className="w-5 h-5 text-indigo-600" /> Content Planner</h3>
               <button onClick={() => setShowScheduleModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-8 space-y-6">
              {isScheduled ? (
                <div className="text-center py-12">
                   <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600"><Check className="w-8 h-8" /></div>
                   <h4 className="text-lg font-bold">Scheduled Successfully</h4>
                   <p className="text-sm text-gray-500">Redirecting to planner...</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Platform</label>
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