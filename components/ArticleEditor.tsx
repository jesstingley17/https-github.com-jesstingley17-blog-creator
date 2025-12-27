
import React, { useState, useEffect, useMemo } from 'react';
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
  History as HistoryIcon
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
  
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null);
  const [localOutline, setLocalOutline] = useState<ContentOutline>(initialOutline);
  const [versions, setVersions] = useState<ArticleVersion[]>([]);
  const [showVersions, setShowVersions] = useState(false);

  const saveVersion = () => {
    const newVersion: ArticleVersion = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
      content: content,
      outline: JSON.parse(JSON.stringify(localOutline))
    };
    setVersions(prev => [newVersion, ...prev]);
  };

  const restoreVersion = (version: ArticleVersion) => {
    if (confirm("Restore this version? Unsaved changes will be lost.")) {
      setContent(version.content);
      setLocalOutline(JSON.parse(JSON.stringify(version.outline)));
      performAnalysis(version.content);
    }
  };

  const startGeneration = async () => {
    setHasStarted(true);
    setIsGenerating(true);
    setViewMode('preview');
    setSources([]);
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
    const fileName = brief.topic.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    link.download = `${fileName || 'article'}.md`;
    document.body.appendChild(link);
    link.href = url;
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // --- Outline Mutation Logic ---
  const updateTitle = (val: string) => setLocalOutline({ ...localOutline, title: val });

  const addSection = () => {
    setLocalOutline({
      ...localOutline,
      sections: [...localOutline.sections, { heading: 'New Section', subheadings: [], keyPoints: [] }]
    });
  };

  const updateSectionHeading = (idx: number, val: string) => {
    const newSections = [...localOutline.sections];
    newSections[idx].heading = val;
    setLocalOutline({ ...localOutline, sections: newSections });
  };

  const removeSection = (idx: number) => {
    setLocalOutline({ ...localOutline, sections: localOutline.sections.filter((_, i) => i !== idx) });
  };

  const moveSection = (idx: number, dir: number) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= localOutline.sections.length) return;
    const newSections = [...localOutline.sections];
    [newSections[idx], newSections[newIdx]] = [newSections[newIdx], newSections[idx]];
    setLocalOutline({ ...localOutline, sections: newSections });
  };

  const addSubheading = (sIdx: number) => {
    const newSections = [...localOutline.sections];
    newSections[sIdx].subheadings.push('New Subheading');
    setLocalOutline({ ...localOutline, sections: newSections });
  };

  const updateSubheading = (sIdx: number, subIdx: number, val: string) => {
    const newSections = [...localOutline.sections];
    newSections[sIdx].subheadings[subIdx] = val;
    setLocalOutline({ ...localOutline, sections: newSections });
  };

  const removeSubheading = (sIdx: number, subIdx: number) => {
    const newSections = [...localOutline.sections];
    newSections[sIdx].subheadings = newSections[sIdx].subheadings.filter((_, i) => i !== subIdx);
    setLocalOutline({ ...localOutline, sections: newSections });
  };

  const moveSubheading = (sIdx: number, subIdx: number, dir: number) => {
    const newIdx = subIdx + dir;
    if (newIdx < 0 || newIdx >= localOutline.sections[sIdx].subheadings.length) return;
    const newSections = [...localOutline.sections];
    [newSections[sIdx].subheadings[subIdx], newSections[sIdx].subheadings[newIdx]] = [newSections[sIdx].subheadings[newIdx], newSections[sIdx].subheadings[subIdx]];
    setLocalOutline({ ...localOutline, sections: newSections });
  };

  const addKeyPoint = (sIdx: number) => {
    const newSections = [...localOutline.sections];
    newSections[sIdx].keyPoints.push('New Key Point');
    setLocalOutline({ ...localOutline, sections: newSections });
  };

  const updateKeyPoint = (sIdx: number, pIdx: number, val: string) => {
    const newSections = [...localOutline.sections];
    newSections[sIdx].keyPoints[pIdx] = val;
    setLocalOutline({ ...localOutline, sections: newSections });
  };

  const removeKeyPoint = (sIdx: number, pIdx: number) => {
    const newSections = [...localOutline.sections];
    newSections[sIdx].keyPoints = newSections[sIdx].keyPoints.filter((_, i) => i !== pIdx);
    setLocalOutline({ ...localOutline, sections: newSections });
  };

  const moveKeyPoint = (sIdx: number, pIdx: number, dir: number) => {
    const newIdx = pIdx + dir;
    if (newIdx < 0 || newIdx >= localOutline.sections[sIdx].keyPoints.length) return;
    const newSections = [...localOutline.sections];
    [newSections[sIdx].keyPoints[pIdx], newSections[sIdx].keyPoints[newIdx]] = [newSections[sIdx].keyPoints[newIdx], newSections[sIdx].keyPoints[pIdx]];
    setLocalOutline({ ...localOutline, sections: newSections });
  };

  const scoreColor = (score: number) => {
    if (score > 80) return 'text-green-600';
    if (score > 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Fix: Explicitly cast Object.values to number[] and ensure analysis.score is treated as number to avoid arithmetic operation errors
  const getScoreBreakdown = () => {
    if (!analysis) return [];
    
    const densities = Object.values(analysis.keywordDensity) as number[];
    const avgDensity = densities.length > 0 ? (densities.reduce((a: number, b: number) => a + b, 0) / densities.length) * 40 : 0;
    
    const readabilityMap: Record<string, number> = {
      'Advanced': 65,
      'Professional': 95,
      'Conversational': 85,
      'Simple': 75
    };

    return [
      { label: 'Keyword Density', val: Math.min(100, Math.round(avgDensity)), icon: Target },
      { label: 'Readability', val: readabilityMap[analysis.readability] || 80, icon: Type },
      { label: 'Structure', val: localOutline.sections.length > 4 ? 95 : 75, icon: Layers },
      { label: 'Semantic Depth', val: Math.min(100, Math.round((analysis.score || 0) * 1.05)), icon: Search },
    ];
  };

  const defaultImagePrompt = useMemo(() => {
    return `A professional editorial hero image for an article titled "${localOutline.title}". Style: clean modern minimalism, cinematic lighting, corporate professional aesthetic, high resolution 8k.`;
  }, [localOutline.title]);

  return (
    <div className="flex h-[calc(100vh-120px)] gap-8 animate-in fade-in duration-500">
      {/* Editor Main */}
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
                <Play className="w-4 h-4 fill-current" /> Confirm & Generate Content
              </button>
            ) : (
              <>
                {sources.length > 0 && (
                  <button 
                    onClick={() => setShowSourcesModal(true)}
                    className="p-2 text-indigo-500 hover:text-indigo-700 transition-colors flex items-center gap-2 text-sm font-bold bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100"
                    title="View citations"
                  >
                    <BookOpen className="w-4 h-4" /> Cite Sources
                  </button>
                )}
                <button 
                  onClick={handleDownload}
                  className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                  title="Download as Markdown"
                >
                  <Download className="w-5 h-5" />
                </button>
                <button 
                  onClick={saveVersion}
                  className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all"
                >
                  <Save className="w-4 h-4" /> Save Article
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
                  <div className="p-2 bg-indigo-50 rounded-lg">
                    <Layers className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Blueprint Designer</h3>
                    <p className="text-sm text-gray-500">Fine-tune the architecture of your article.</p>
                  </div>
                </div>
                <button 
                  onClick={addSection}
                  className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 rounded-lg transition-colors border border-indigo-100"
                >
                  <Plus className="w-4 h-4" /> Add Section
                </button>
              </div>

              <div className="space-y-6">
                {localOutline.sections.map((section, sIdx) => (
                  <div key={sIdx} className="group bg-white border border-gray-100 rounded-3xl p-6 transition-all hover:border-indigo-100 hover:shadow-xl shadow-sm relative">
                    <div className="absolute -left-4 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white p-1 rounded-lg border shadow-sm z-10">
                      <button onClick={() => moveSection(sIdx, -1)} disabled={sIdx === 0} className="p-1 hover:bg-indigo-50 rounded text-gray-400 disabled:opacity-20"><ChevronUp className="w-4 h-4" /></button>
                      <button onClick={() => moveSection(sIdx, 1)} disabled={sIdx === localOutline.sections.length - 1} className="p-1 hover:bg-indigo-50 rounded text-gray-400 disabled:opacity-20"><ChevronDown className="w-4 h-4" /></button>
                    </div>

                    <div className="flex-1 space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <input 
                            type="text"
                            value={section.heading}
                            onChange={(e) => updateSectionHeading(sIdx, e.target.value)}
                            className="w-full bg-transparent border-none text-xl font-black text-gray-900 focus:ring-0 p-0 placeholder:text-gray-300"
                            placeholder="Heading..."
                          />
                        </div>
                        <button 
                          onClick={() => removeSection(sIdx)}
                          className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                              <List className="w-3 h-3 text-indigo-400" /> Subheadings
                            </label>
                            <button onClick={() => addSubheading(sIdx)} className="text-[10px] font-bold text-indigo-500 hover:underline">Add Subheading</button>
                          </div>
                          <div className="space-y-2 pl-4 border-l-2 border-indigo-50">
                            {section.subheadings.map((sub, subIdx) => (
                              <div key={subIdx} className="group/sub flex items-center gap-2 bg-gray-50/50 rounded-xl px-3 py-1.5 border border-transparent hover:border-indigo-100 hover:bg-white transition-all">
                                <div className="flex flex-col opacity-0 group-hover/sub:opacity-100">
                                  <button onClick={() => moveSubheading(sIdx, subIdx, -1)} disabled={subIdx === 0} className="text-gray-300 hover:text-indigo-500 disabled:opacity-10"><ChevronUp className="w-3 h-3" /></button>
                                  <button onClick={() => moveSubheading(sIdx, subIdx, 1)} disabled={subIdx === section.subheadings.length - 1} className="text-gray-300 hover:text-indigo-500 disabled:opacity-10"><ChevronDown className="w-3 h-3" /></button>
                                </div>
                                <input 
                                  value={sub}
                                  onChange={(e) => updateSubheading(sIdx, subIdx, e.target.value)}
                                  className="flex-1 bg-transparent border-none text-sm text-gray-700 focus:ring-0 p-0 font-medium"
                                />
                                <button onClick={() => removeSubheading(sIdx, subIdx)} className="opacity-0 group-hover/sub:opacity-100 p-1 text-gray-300 hover:text-red-400 transition-opacity"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                              <Target className="w-3 h-3 text-amber-500" /> Context Targets
                            </label>
                            <button onClick={() => addKeyPoint(sIdx)} className="text-[10px] font-bold text-amber-600 hover:underline">Add Target</button>
                          </div>
                          <div className="space-y-2">
                            {section.keyPoints.map((point, pIdx) => (
                              <div key={pIdx} className="group/point flex items-center gap-2 bg-amber-50/30 rounded-xl px-3 py-1.5 border border-transparent hover:border-amber-100 hover:bg-amber-50/50 transition-all">
                                <div className="flex flex-col opacity-0 group-hover/point:opacity-100">
                                  <button onClick={() => moveKeyPoint(sIdx, pIdx, -1)} disabled={pIdx === 0} className="text-gray-300 hover:text-amber-500 disabled:opacity-10"><ChevronUp className="w-3 h-3" /></button>
                                  <button onClick={() => moveKeyPoint(sIdx, pIdx, 1)} disabled={pIdx === section.keyPoints.length - 1} className="text-gray-300 hover:text-amber-500 disabled:opacity-10"><ChevronDown className="w-3 h-3" /></button>
                                </div>
                                <input 
                                  value={point}
                                  onChange={(e) => updateKeyPoint(sIdx, pIdx, e.target.value)}
                                  className="flex-1 bg-transparent border-none text-[11px] text-gray-600 focus:ring-0 p-0 font-bold"
                                />
                                <button onClick={() => removeKeyPoint(sIdx, pIdx)} className="opacity-0 group-hover/point:opacity-100 p-1 text-gray-300 hover:text-red-400 transition-opacity"><Trash2 className="w-3.5 h-3.5" /></button>
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
                    {isGenerating && <span className="inline-block w-2 h-5 ml-1 bg-indigo-500 animate-pulse rounded-sm" />}
                  </div>
                ) : (
                  <textarea
                    className="w-full min-h-[500px] outline-none text-lg text-gray-700 leading-relaxed resize-none bg-transparent font-mono p-4 border rounded-2xl"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar Analysis & Assets */}
      <div className="w-96 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-1">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-6 flex-shrink-0 relative">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-indigo-600" /> SEO Intelligence
            </h3>
            {analyzing && <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />}
          </div>

          <div 
            className="relative w-32 h-32 mx-auto mb-6 cursor-pointer group/score"
            onMouseEnter={() => setShowScoreTooltip(true)}
            onMouseLeave={() => setShowScoreTooltip(false)}
          >
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-gray-100" />
              <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={364} strokeDashoffset={364 - (364 * (analysis?.score || 0)) / 100} className={`${scoreColor(analysis?.score || 0)} transition-all duration-1000 ease-out`} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className={`text-3xl font-black ${scoreColor(analysis?.score || 0)}`}>{analysis?.score || 0}</span>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Score</span>
            </div>

            {showScoreTooltip && analysis && (
              <div className="absolute top-0 right-full mr-4 w-64 bg-white border border-gray-100 shadow-2xl rounded-2xl p-5 z-50 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="mb-4 border-b pb-2 flex items-center justify-between">
                  <p className="text-xs font-black text-gray-900 uppercase tracking-widest">Score Breakdown</p>
                  <Trophy className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <div className="space-y-4">
                  {getScoreBreakdown().map((item, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between items-center text-[11px] font-bold">
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <item.icon className="w-3 h-3 opacity-60" />
                          <span>{item.label}</span>
                        </div>
                        <span className={scoreColor(item.val)}>{item.val}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                        <div 
                          className={`h-full ${scoreColor(item.val).replace('text-', 'bg-')} transition-all duration-700 ease-out`} 
                          style={{ width: `${item.val}%` }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 font-medium">Readability</span>
              <span className="font-bold text-gray-900">{analysis?.readability || 'Not Measured'}</span>
            </div>
            <div className="space-y-2 border-t pt-4">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Target Keyword Load</span>
              {brief.targetKeywords.map((k, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-600 truncate max-w-[150px] font-medium">{k}</span>
                    <span className="text-gray-400 font-bold">{(analysis?.keywordDensity?.[k] || 0).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full transition-all duration-1000" style={{ width: `${Math.min((analysis?.keywordDensity?.[k] || 0) * 10, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>

            {analysis?.keywordSuggestions && analysis.keywordSuggestions.length > 0 && (
              <div className="border-t pt-4 space-y-4">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Zap className="w-3 h-3 text-amber-500" /> SEO Actions
                </h4>
                <div className="space-y-3">
                  {analysis.keywordSuggestions.map((suggestion, idx) => (
                    <div key={idx} className="bg-gray-50 border border-gray-100 rounded-2xl p-3 space-y-2 hover:border-indigo-100 transition-all">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-gray-800">{suggestion.keyword}</span>
                        <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded uppercase tracking-tighter border border-indigo-100">{suggestion.action}</span>
                      </div>
                      <p className="text-[10px] text-gray-500 leading-relaxed font-medium">{suggestion.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {hasStarted && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden flex-shrink-0 transition-all duration-300">
             <button onClick={() => setShowVersions(!showVersions)} className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
               <h3 className="font-bold text-gray-900 flex items-center gap-2"><HistoryIcon className="w-5 h-5 text-indigo-500" /> Version History</h3>
               <span className="bg-indigo-100 text-indigo-600 text-[10px] font-black px-2 py-0.5 rounded-full">{versions.length} Points</span>
             </button>
             {showVersions && (
               <div className="px-6 pb-6 space-y-3">
                 {versions.map((v) => (
                   <div key={v.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl group hover:bg-indigo-50 transition-all cursor-pointer" onClick={() => restoreVersion(v)}>
                     <span className="text-[11px] font-bold text-gray-500 group-hover:text-indigo-600">{new Date(v.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                     <RotateCcw className="w-3.5 h-3.5 text-gray-300 group-hover:text-indigo-600" />
                   </div>
                 ))}
               </div>
             )}
          </div>
        )}

        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-6 flex-shrink-0">
          <ImageGenerator 
            defaultPrompt={defaultImagePrompt} 
            initialImageUrl={heroImageUrl} 
            onImageGenerated={setHeroImageUrl}
            topicContext={localOutline.title}
          />
        </div>
      </div>

      {/* Citations Modal */}
      {showSourcesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 border-b flex items-center justify-between bg-gray-50/50">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" /> Synthesis Sources
              </h3>
              <button onClick={() => setShowSourcesModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {sources.map((source, idx) => (
                <a key={idx} href={source.uri} target="_blank" rel="noopener noreferrer" className="block p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-indigo-200 hover:bg-white transition-all group">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">{source.title}</h4>
                      <p className="text-[10px] text-gray-400 font-mono truncate max-w-[400px]">{source.uri}</p>
                    </div>
                    <Search className="w-4 h-4 text-gray-300 group-hover:text-indigo-400" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArticleEditor;
