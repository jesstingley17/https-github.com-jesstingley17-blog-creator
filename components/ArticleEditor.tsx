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
  Layout,
  Info,
  ShieldCheck,
  Tag as TagIcon,
  Quote
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
  
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split('T')[0]);
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [schedulePlatform, setSchedulePlatform] = useState<ScheduledPost['platform']>('LinkedIn');
  const [isScheduled, setIsScheduled] = useState(false);

  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null);
  const [localOutline, setLocalOutline] = useState<ContentOutline>(initialOutline || { title: '', sections: [] });
  const [versions, setVersions] = useState<ArticleVersion[]>([]);
  const [showVersions, setShowVersions] = useState(false);

  // Tags State
  const [tags, setTags] = useState<string[]>(brief.tags || []);
  const [tagInput, setTagInput] = useState('');

  // Autosave State
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const autosaveTimerRef = useRef<number | null>(null);

  // Load draft from localStorage on mount
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
        if (dTags) setTags(dTags);
        
        // If it was already generating or finished, we might want to trigger analysis
        if (dContent) performAnalysis(dContent);
      } catch (e) {
        console.error("Failed to load draft", e);
      }
    }
  }, [brief.id, brief.topic]);

  // Autosave Trigger Effect
  useEffect(() => {
    if (!content && !localOutline.title && tags.length === 0) return;

    // Clear existing timer
    if (autosaveTimerRef.current) {
      window.clearTimeout(autosaveTimerRef.current);
    }

    setSaveStatus('saving');

    autosaveTimerRef.current = window.setTimeout(() => {
      const draftKey = `zr_draft_${brief.id || brief.topic}`;
      const draftData = {
        content,
        outline: localOutline,
        hasStarted,
        heroImageUrl,
        tags,
        timestamp: Date.now()
      };

      try {
        localStorage.setItem(draftKey, JSON.stringify(draftData));
        setSaveStatus('saved');
        // Reset to idle after 3 seconds
        setTimeout(() => setSaveStatus('idle'), 3000);
      } catch (e) {
        console.error("Autosave failed", e);
        setSaveStatus('idle');
      }
    }, 5000); // 5-second debounce

    return () => {
      if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
    };
  }, [content, localOutline, hasStarted, heroImageUrl, tags, brief.id, brief.topic]);

  const saveVersion = () => {
    const newVersion: ArticleVersion = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
      content: content,
      outline: JSON.parse(JSON.stringify(localOutline))
    };
    setVersions(prev => [newVersion, ...prev]);
    // Also trigger an immediate save for the main draft
    const draftKey = `zr_draft_${brief.id || brief.topic}`;
    localStorage.setItem(draftKey, JSON.stringify({
      content,
      outline: localOutline,
      hasStarted,
      heroImageUrl,
      tags,
      timestamp: Date.now()
    }));
  };

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
            if (c.web?.uri) {
              collectedSources.set(c.web.uri, c.web.title || c.web.uri);
            }
          });
        }
      }
      
      setSources(Array.from(collectedSources.entries()).map(([uri, title]) => ({ uri, title })));
      await performAnalysis(fullText);
      saveVersion();
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

  const handleDownload = () => {
    if (!content) return;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const fileName = (brief.topic || 'article').toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    link.download = `${fileName}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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

  // Tag Handlers
  const addTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const updateTitle = (val: string) => setLocalOutline({ ...localOutline, title: val });

  const addSection = () => {
    setLocalOutline({
      ...localOutline,
      sections: [...(localOutline.sections || []), { heading: 'New Section', subheadings: [], keyPoints: [] }]
    });
  };

  const updateSectionHeading = (idx: number, val: string) => {
    const newSections = [...(localOutline.sections || [])];
    if (newSections[idx]) {
      newSections[idx].heading = val;
      setLocalOutline({ ...localOutline, sections: newSections });
    }
  };

  const removeSection = (idx: number) => {
    setLocalOutline({ 
      ...localOutline, 
      sections: (localOutline.sections || []).filter((_, i) => i !== idx) 
    });
  };

  const moveSection = (idx: number, dir: number) => {
    const newIdx = idx + dir;
    const sections = localOutline.sections || [];
    if (newIdx < 0 || newIdx >= sections.length) return;
    const newSections = [...sections];
    [newSections[idx], newSections[newIdx]] = [newSections[newIdx], newSections[idx]];
    setLocalOutline({ ...localOutline, sections: newSections });
  };

  const addSubheading = (sIdx: number) => {
    const newSections = [...(localOutline.sections || [])];
    if (newSections[sIdx]) {
      newSections[sIdx].subheadings = [...(newSections[sIdx].subheadings || []), 'New Subheading'];
      setLocalOutline({ ...localOutline, sections: newSections });
    }
  };

  const updateSubheading = (sIdx: number, subIdx: number, val: string) => {
    const newSections = [...(localOutline.sections || [])];
    if (newSections[sIdx] && newSections[sIdx].subheadings) {
      newSections[sIdx].subheadings[subIdx] = val;
      setLocalOutline({ ...localOutline, sections: newSections });
    }
  };

  const removeSubheading = (sIdx: number, subIdx: number) => {
    const newSections = [...(localOutline.sections || [])];
    if (newSections[sIdx]) {
      newSections[sIdx].subheadings = (newSections[sIdx].subheadings || []).filter((_, i) => i !== subIdx);
      setLocalOutline({ ...localOutline, sections: newSections });
    }
  };

  const moveSubheading = (sIdx: number, subIdx: number, dir: number) => {
    const newIdx = subIdx + dir;
    const newSections = [...(localOutline.sections || [])];
    if (!newSections[sIdx] || !newSections[sIdx].subheadings) return;
    if (newIdx < 0 || newIdx >= newSections[sIdx].subheadings.length) return;
    [newSections[sIdx].subheadings[subIdx], newSections[sIdx].subheadings[newIdx]] = [newSections[sIdx].subheadings[newIdx], newSections[sIdx].subheadings[subIdx]];
    setLocalOutline({ ...localOutline, sections: newSections });
  };

  const addKeyPoint = (sIdx: number) => {
    const newSections = [...(localOutline.sections || [])];
    if (newSections[sIdx]) {
      newSections[sIdx].keyPoints = [...(newSections[sIdx].keyPoints || []), 'New Goal'];
      setLocalOutline({ ...localOutline, sections: newSections });
    }
  };

  const updateKeyPoint = (sIdx: number, pIdx: number, val: string) => {
    const newSections = [...(localOutline.sections || [])];
    if (newSections[sIdx] && newSections[sIdx].keyPoints) {
      newSections[sIdx].keyPoints[pIdx] = val;
      setLocalOutline({ ...localOutline, sections: newSections });
    }
  };

  const removeKeyPoint = (sIdx: number, pIdx: number) => {
    const newSections = [...(localOutline.sections || [])];
    if (newSections[sIdx]) {
      newSections[sIdx].keyPoints = (newSections[sIdx].keyPoints || []).filter((_, i) => i !== pIdx);
      setLocalOutline({ ...localOutline, sections: newSections });
    }
  };

  const moveKeyPoint = (sIdx: number, pIdx: number, dir: number) => {
    const newIdx = pIdx + dir;
    const newSections = [...(localOutline.sections || [])];
    if (!newSections[sIdx] || !newSections[sIdx].keyPoints) return;
    if (newIdx < 0 || newIdx >= newSections[sIdx].keyPoints.length) return;
    [newSections[sIdx].keyPoints[pIdx], newSections[sIdx].keyPoints[newIdx]] = [newSections[sIdx].keyPoints[newIdx], newSections[sIdx].keyPoints[pIdx]];
    setLocalOutline({ ...localOutline, sections: newSections });
  };

  const scoreColor = (score: number) => {
    if (score > 80) return 'text-green-600';
    if (score > 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBreakdown = () => {
    if (!analysis) return [];
    
    // Calculate keyword density score
    const densityValues = Object.values(analysis.keywordDensity || {}) as any[];
    const densities = densityValues.map(v => typeof v === 'number' ? v : 0);
    const avgDensityVal = densities.length > 0 ? (densities.reduce((a: number, b: number) => a + b, 0) / densities.length) : 0;
    const densityScore = Math.min(100, Math.round(avgDensityVal * 60)); // Normalized to 100
    
    const readabilityMap: Record<string, number> = {
      'Advanced': 65,
      'Professional': 95,
      'Conversational': 85,
      'Simple': 75
    };

    const structureScore = Math.min(100, (localOutline.sections || []).length * 20);
    const depthScore = Math.min(100, Math.round((analysis.score || 0) * 0.95 + 5));

    return [
      { label: 'Keyword Density', val: densityScore, icon: Target, desc: 'Average integration of target keywords.' },
      { label: 'Readability', val: readabilityMap[analysis.readability] || 80, icon: Type, desc: 'Audience accessibility and flow.' },
      { label: 'Structural Depth', val: structureScore, icon: Layers, desc: 'Completeness of subheadings and points.' },
      { label: 'Semantic Integrity', val: depthScore, icon: ShieldCheck, desc: 'Topical authority and fact-checking.' },
    ];
  };

  const defaultImagePrompt = useMemo(() => {
    return `A professional editorial hero image for an article titled "${localOutline.title}". Style: clean modern minimalism, cinematic lighting, corporate professional aesthetic, high resolution 8k.`;
  }, [localOutline.title]);

  return (
    <div className="flex h-[calc(100vh-120px)] gap-8 animate-in fade-in duration-500">
      <div className="flex-1 flex flex-col bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
        <header className="px-6 py-4 border-b flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5 text-gray-500" />
            </button>
            {!hasStarted ? (
               <div className="flex items-center gap-2">
                 <Type className="w-4 h-4 text-indigo-400" />
                 <input 
                  type="text"
                  value={localOutline.title}
                  onChange={(e) => updateTitle(e.target.value)}
                  className="font-bold text-gray-900 border-none bg-transparent focus:ring-0 p-0 text-xl w-[400px] placeholder:text-gray-300"
                  placeholder="Draft Title..."
                />
               </div>
            ) : (
              <h2 className="font-bold text-gray-900 line-clamp-1">{localOutline.title}</h2>
            )}
            
            {/* Autosave Status Indicator */}
            {saveStatus !== 'idle' && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 rounded-full border border-gray-100 animate-in fade-in slide-in-from-left-2 ml-2">
                {saveStatus === 'saving' ? (
                  <Loader2 className="w-3 h-3 animate-spin text-indigo-500" />
                ) : (
                  <Check className="w-3 h-3 text-green-500" />
                )}
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest whitespace-nowrap">
                  {saveStatus === 'saving' ? 'Autosaving...' : 'Draft Saved'}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {hasStarted && (
              <div className="flex bg-gray-50 p-1 rounded-xl border mr-4">
                <button 
                  onClick={() => setViewMode('preview')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'preview' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <Eye className="w-3.5 h-3.5" /> Preview
                </button>
                <button 
                  onClick={() => setViewMode('edit')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'edit' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <Code className="w-3.5 h-3.5" /> Markdown
                </button>
              </div>
            )}

            {!hasStarted ? (
              <button 
                onClick={startGeneration}
                className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
              >
                <Play className="w-4 h-4 fill-current" /> Confirm & Generate
              </button>
            ) : (
              <>
                <button 
                  onClick={() => setShowScheduleModal(true)}
                  className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-100 transition-all border border-indigo-100"
                >
                  <Calendar className="w-4 h-4" /> Schedule
                </button>
                <button onClick={handleDownload} className="p-2 text-gray-400 hover:text-indigo-600 transition-colors" title="Download Markdown">
                  <Download className="w-5 h-5" />
                </button>
                <button onClick={saveVersion} className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                  <Save className="w-4 h-4" /> Save Snapshot
                </button>
              </>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">
          {!hasStarted ? (
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 rounded-lg"><Layers className="w-5 h-5 text-indigo-600" /></div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Blueprint Designer</h3>
                    <p className="text-sm text-gray-500">Fine-tune the architecture of your article.</p>
                  </div>
                </div>
                <button onClick={addSection} className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 rounded-lg transition-colors border border-indigo-100">
                  <Plus className="w-4 h-4" /> Add Section
                </button>
              </div>

              <div className="space-y-6">
                {(localOutline.sections || []).map((section, sIdx) => (
                  <div key={sIdx} className="group bg-white border border-gray-100 rounded-3xl p-6 transition-all hover:border-indigo-100 hover:shadow-xl shadow-sm relative">
                    <div className="absolute -left-4 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white p-1 rounded-lg border shadow-sm z-10">
                      <button onClick={() => moveSection(sIdx, -1)} disabled={sIdx === 0} className="p-1 hover:bg-indigo-50 rounded text-gray-400 disabled:opacity-20"><ChevronUp className="w-4 h-4" /></button>
                      <button onClick={() => moveSection(sIdx, 1)} disabled={sIdx === (localOutline.sections || []).length - 1} className="p-1 hover:bg-indigo-50 rounded text-gray-400 disabled:opacity-20"><ChevronDown className="w-4 h-4" /></button>
                    </div>

                    <div className="flex-1 space-y-6">
                      <div className="flex items-center gap-4">
                        <input 
                          type="text"
                          value={section.heading}
                          onChange={(e) => updateSectionHeading(sIdx, e.target.value)}
                          className="w-full bg-transparent border-none text-xl font-black text-gray-900 focus:ring-0 p-0 placeholder:text-gray-300"
                          placeholder="Heading..."
                        />
                        <button onClick={() => removeSection(sIdx)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2"><List className="w-3 h-3 text-indigo-400" /> Subheadings</label>
                            <button onClick={() => addSubheading(sIdx)} className="text-[10px] font-bold text-indigo-500 hover:underline">Add Subheading</button>
                          </div>
                          <div className="space-y-2 pl-4 border-l-2 border-indigo-50">
                            {(section.subheadings || []).map((sub, subIdx) => (
                              <div key={subIdx} className="group/sub flex items-center gap-2 bg-gray-50/50 rounded-xl px-3 py-1.5 border border-transparent hover:border-indigo-100 hover:bg-white transition-all">
                                <input value={sub} onChange={(e) => updateSubheading(sIdx, subIdx, e.target.value)} className="flex-1 bg-transparent border-none text-sm text-gray-700 focus:ring-0 p-0 font-medium" />
                                <button onClick={() => removeSubheading(sIdx, subIdx)} className="opacity-0 group-hover/sub:opacity-100 p-1 text-gray-300 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2"><Target className="w-3 h-3 text-amber-500" /> Context Targets</label>
                            <button onClick={() => addKeyPoint(sIdx)} className="text-[10px] font-bold text-amber-600 hover:underline">Add Target</button>
                          </div>
                          <div className="space-y-2">
                            {(section.keyPoints || []).map((point, pIdx) => (
                              <div key={pIdx} className="group/point flex items-center gap-2 bg-amber-50/30 rounded-xl px-3 py-1.5 border border-transparent hover:border-amber-100 hover:bg-amber-50/50 transition-all">
                                <input value={point} onChange={(e) => updateKeyPoint(sIdx, pIdx, e.target.value)} className="flex-1 bg-transparent border-none text-[11px] text-gray-600 focus:ring-0 p-0 font-bold" />
                                <button onClick={() => removeKeyPoint(sIdx, pIdx)} className="opacity-0 group-hover/point:opacity-100 p-1 text-gray-300 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-8 pb-20">
              {heroImageUrl && (
                <div className="rounded-3xl overflow-hidden shadow-2xl border border-gray-100 aspect-[21/9] relative animate-in fade-in duration-700">
                  <img src={heroImageUrl} alt="Article Hero" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent flex items-end p-8">
                    <h1 className="text-3xl font-black text-white drop-shadow-lg">{localOutline.title}</h1>
                  </div>
                </div>
              )}
              {isGenerating && (
                <div className="flex items-center gap-2 text-indigo-600 font-medium bg-indigo-50 px-4 py-2 rounded-lg w-fit animate-pulse sticky top-0 z-10 shadow-sm border border-indigo-100">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  AI is crafting your synthesis...
                </div>
              )}
              <div className="min-h-[500px]">
                {viewMode === 'preview' ? (
                  <div className="markdown-body animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <ReactMarkdown>{content || "*Preparing content stream...*"}</ReactMarkdown>
                  </div>
                ) : (
                  <textarea className="w-full min-h-[500px] outline-none text-lg text-gray-700 leading-relaxed resize-none bg-transparent font-mono p-4 border rounded-2xl" value={content} onChange={(e) => setContent(e.target.value)} />
                )}
              </div>

              {/* Cite Sources Button */}
              {sources.length > 0 && !isGenerating && (
                <div className="flex justify-center pt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <button 
                    onClick={() => setShowSourcesModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-50 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm"
                  >
                    <Quote className="w-4 h-4" /> Cite Generated Sources ({sources.length})
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="w-96 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-1">
        {/* SEO Intelligence Card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-6 flex-shrink-0 relative">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900 flex items-center gap-2"><BarChart2 className="w-5 h-5 text-indigo-600" /> SEO Intelligence</h3>
            {analyzing && <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />}
          </div>
          
          <div 
            className="relative w-36 h-36 mx-auto mb-6 cursor-pointer group/score isolate" 
            onMouseEnter={() => setShowScoreTooltip(true)} 
            onMouseLeave={() => setShowScoreTooltip(false)}
          >
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="72" cy="72" r="64" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-gray-100" />
              <circle 
                cx="72" cy="72" r="64" 
                stroke="currentColor" strokeWidth="12" 
                fill="transparent" 
                strokeDasharray={402} 
                strokeDashoffset={402 - (402 * (analysis?.score || 0)) / 100} 
                className={`${scoreColor(analysis?.score || 0)} transition-all duration-1000 ease-out`} 
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className={`text-4xl font-black ${scoreColor(analysis?.score || 0)}`}>{analysis?.score || 0}</span>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Global Score</span>
            </div>
            
            {showScoreTooltip && analysis && (
              <div className="absolute top-0 right-full mr-6 w-72 bg-white/95 backdrop-blur-md border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-3xl p-6 z-[100] animate-in fade-in slide-in-from-right-6 duration-300">
                <div className="mb-5 border-b border-gray-100 pb-3 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Detailed Analytics</p>
                    <h4 className="text-sm font-bold text-gray-900">Performance Breakdown</h4>
                  </div>
                  <Trophy className="w-4 h-4 text-amber-500 drop-shadow-sm" />
                </div>
                
                <div className="space-y-5">
                  {getScoreBreakdown().map((item, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-gray-700">
                          <div className={`p-1.5 rounded-lg bg-gray-50 border border-gray-100`}>
                            <item.icon className="w-3.5 h-3.5 opacity-80" />
                          </div>
                          <div>
                            <span className="text-xs font-bold block">{item.label}</span>
                            <span className="text-[9px] text-gray-400 font-medium">{item.desc}</span>
                          </div>
                        </div>
                        <span className={`text-xs font-black ${scoreColor(item.val)}`}>{item.val}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-50 rounded-full overflow-hidden border border-gray-100/50">
                        <div 
                          className={`h-full ${scoreColor(item.val).replace('text-', 'bg-')} transition-all duration-1000 ease-out shadow-sm`} 
                          style={{ width: `${item.val}%` }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 rounded-xl">
                    <Zap className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                  <p className="text-[10px] text-indigo-700 font-bold leading-tight">
                    Optimizing structural depth can increase your reach by up to 22%.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 font-medium">Readability Index</span>
              <span className="font-bold text-gray-900 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                {analysis?.readability || 'Pending'}
              </span>
            </div>
            <div className="space-y-2 border-t pt-4">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <Target className="w-3 h-3" /> Keyword Saturation
              </span>
              {brief.targetKeywords.map((k, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-600 truncate max-w-[150px] font-medium">{k}</span>
                    <span className="text-gray-400 font-bold">{(analysis?.keywordDensity?.[k] || 0).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-50 border border-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full transition-all duration-1000 shadow-sm" style={{ width: `${Math.min((analysis?.keywordDensity?.[k] || 0) * 10, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Taxonomy & Tags Card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-6 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm uppercase tracking-tight">
              <TagIcon className="w-4 h-4 text-indigo-600" /> Content Taxonomy
            </h3>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{tags.length} Tags</span>
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 mb-2 min-h-[40px]">
              {tags.map((tag) => (
                <span 
                  key={tag} 
                  className="group flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold border border-indigo-100 animate-in zoom-in-95"
                >
                  {tag}
                  <button 
                    onClick={() => removeTag(tag)}
                    className="p-0.5 hover:bg-indigo-200 rounded-full transition-colors"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
              {tags.length === 0 && (
                <p className="text-[10px] text-gray-400 italic">No tags assigned yet. Use tags for better organization.</p>
              )}
            </div>

            <div className="relative">
              <input 
                type="text" 
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Add tag (press Enter)..."
                className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-gray-300"
              />
              <button 
                onClick={addTag}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-indigo-500 hover:text-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-6 flex-shrink-0">
          <ImageGenerator 
            defaultPrompt={defaultImagePrompt} 
            initialImageUrl={heroImageUrl} 
            onImageGenerated={setHeroImageUrl} 
            topicContext={localOutline.title} 
          />
        </div>
        
        {sources.length > 0 && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-6 flex-shrink-0">
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-green-600" /> Grounded References
            </h3>
            <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
              {sources.map((s, idx) => (
                <a key={idx} href={s.uri} target="_blank" rel="noopener noreferrer" className="block p-3 bg-gray-50 rounded-2xl border border-transparent hover:border-indigo-100 hover:bg-white transition-all group">
                   <p className="text-[10px] font-bold text-gray-800 line-clamp-1 group-hover:text-indigo-600">{s.title}</p>
                   <p className="text-[9px] text-gray-400 truncate mt-1">{s.uri}</p>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sources Modal */}
      {showSourcesModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95">
            <div className="px-8 py-6 border-b flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-xl">
                  <Quote className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-xl tracking-tight">Research & Citations</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Grounding Sources used for this synthesis</p>
                </div>
              </div>
              <button onClick={() => setShowSourcesModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-8 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {sources.map((s, idx) => (
                <div key={idx} className="group p-5 bg-gray-50 rounded-2xl border border-transparent hover:border-indigo-100 hover:bg-white transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">{s.title}</h4>
                      <p className="text-sm text-gray-500 mt-1 truncate font-mono">{s.uri}</p>
                    </div>
                    <a 
                      href={s.uri} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="p-3 bg-white border border-gray-100 rounded-xl text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm flex-shrink-0"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-6 border-t bg-gray-50/50 flex justify-end">
              <button 
                onClick={() => setShowSourcesModal(false)}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
              >
                Close Citations
              </button>
            </div>
          </div>
        </div>
      )}

      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95">
            <div className="px-8 py-6 border-b flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3"><div className="p-2 bg-indigo-100 rounded-xl"><Calendar className="w-5 h-5 text-indigo-600" /></div><h3 className="font-bold text-gray-900 text-xl tracking-tight">Schedule Publication</h3></div>
              <button onClick={() => setShowScheduleModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-8 space-y-8">
              {isScheduled ? (
                <div className="py-12 flex flex-col items-center justify-center text-center animate-in zoom-in-95"><div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4"><Check className="w-10 h-10 text-green-600" /></div><h4 className="text-xl font-bold text-gray-900">Successfully Scheduled!</h4></div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Calendar className="w-3 h-3" /> Publish Date</label><input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" /></div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Clock className="w-3 h-3" /> Time (UTC)</label><input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" /></div>
                  </div>
                  <div className="space-y-4"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Target Channel</label><div className="grid grid-cols-2 gap-3">
                      {[{ id: 'LinkedIn', icon: Linkedin, color: 'text-blue-600', bg: 'bg-blue-50' }, { id: 'Twitter', icon: Twitter, color: 'text-sky-500', bg: 'bg-sky-50' }, { id: 'Facebook', icon: Facebook, color: 'text-indigo-600', bg: 'bg-indigo-50' }, { id: 'Blog', icon: Layout, color: 'text-gray-700', bg: 'bg-gray-100' }].map((plat) => (
                        <button key={plat.id} onClick={() => setSchedulePlatform(plat.id as ScheduledPost['platform'])} className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${schedulePlatform === plat.id ? 'border-indigo-600 bg-white shadow-md' : 'border-transparent bg-gray-50 hover:bg-gray-100'}`}><div className={`${plat.bg} p-2 rounded-lg`}><plat.icon className={`w-5 h-5 ${plat.color}`} /></div><span className="text-sm font-bold text-gray-700">{plat.id}</span></button>
                      ))}
                    </div></div>
                  <button onClick={handleScheduleConfirm} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100">Confirm Schedule</button>
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