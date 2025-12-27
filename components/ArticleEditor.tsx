
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Save, 
  Download, 
  ChevronLeft, 
  BarChart2, 
  Loader2, 
  Trophy, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  Plus, 
  Trash2, 
  GripVertical, 
  Play, 
  Pencil, 
  Image as ImageIcon, 
  Sparkles, 
  RefreshCw,
  Eye,
  Code,
  List,
  Type
} from 'lucide-react';
import { geminiService } from '../geminiService';
import { ContentBrief, ContentOutline, SEOAnalysis } from '../types';
import ImageGenerator from './ImageGenerator';

interface ArticleEditorProps {
  brief: ContentBrief;
  outline: ContentOutline;
  onBack: () => void;
}

const ArticleEditor: React.FC<ArticleEditorProps> = ({ brief, outline: initialOutline, onBack }) => {
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [analysis, setAnalysis] = useState<SEOAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [showScoreTooltip, setShowScoreTooltip] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'edit'>('preview');
  
  // Hero Image State
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null);

  // Outline Editing State
  const [localOutline, setLocalOutline] = useState<ContentOutline>(initialOutline);

  const startGeneration = async () => {
    setHasStarted(true);
    setIsGenerating(true);
    setViewMode('preview'); // Default to preview during generation
    let fullText = '';
    try {
      const stream = geminiService.streamContent(brief, localOutline);
      for await (const chunk of stream) {
        fullText += chunk.text || '';
        setContent(fullText);
      }
      await performAnalysis(fullText);
    } catch (error) {
      console.error("Stream failed", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const performAnalysis = async (textToAnalyze: string) => {
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
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const scoreColor = (score: number) => {
    if (score > 80) return 'text-green-600';
    if (score > 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBreakdown = () => {
    if (!analysis) return [];
    const score = analysis.score;
    return [
      { label: 'Keyword Synergy', val: Math.round(score * 0.95), weight: 30 },
      { label: 'Semantic Depth', val: Math.min(100, Math.round(score * 1.02)), weight: 40 },
      { label: 'Readability', val: analysis.readability === 'Professional' ? 95 : 85, weight: 20 },
      { label: 'Structure', val: 90, weight: 10 },
    ];
  };

  /**
   * Generates a high-quality, descriptive prompt for the hero image generator.
   * Utilizes article metadata to create a professional editorial aesthetic.
   */
  const generateOptimizedImagePrompt = (): string => {
    const title = localOutline.title;
    const topic = brief.topic;
    const keyThemes = brief.targetKeywords.slice(0, 3).join(', ');
    
    return `A professional, high-end editorial blog header image for an article titled "${title}". 
The scene should conceptually represent "${topic}" with subtle visual motifs of ${keyThemes}. 
Style: Clean minimalist aesthetic, cinematic soft lighting, shallow depth of field, 8k resolution, photorealistic textures, corporate-modern color palette, premium magazine quality.`;
  };

  // Outline helper functions
  const updateTitle = (val: string) => {
    setLocalOutline({ ...localOutline, title: val });
  };

  const updateSectionHeading = (index: number, val: string) => {
    const newSections = [...localOutline.sections];
    newSections[index].heading = val;
    setLocalOutline({ ...localOutline, sections: newSections });
  };

  const addSection = () => {
    setLocalOutline({
      ...localOutline,
      sections: [...localOutline.sections, { heading: 'New Section', subheadings: [], keyPoints: [] }]
    });
  };

  const removeSection = (index: number) => {
    const newSections = localOutline.sections.filter((_, i) => i !== index);
    setLocalOutline({ ...localOutline, sections: newSections });
  };

  const addSubheading = (sectionIdx: number) => {
    const newSections = [...localOutline.sections];
    newSections[sectionIdx].subheadings.push('New Subheading');
    setLocalOutline({ ...localOutline, sections: newSections });
  };

  const updateSubheading = (sectionIdx: number, subIdx: number, val: string) => {
    const newSections = [...localOutline.sections];
    newSections[sectionIdx].subheadings[subIdx] = val;
    setLocalOutline({ ...localOutline, sections: newSections });
  };

  const removeSubheading = (sectionIdx: number, subIdx: number) => {
    const newSections = [...localOutline.sections];
    newSections[sectionIdx].subheadings = newSections[sectionIdx].subheadings.filter((_, i) => i !== subIdx);
    setLocalOutline({ ...localOutline, sections: newSections });
  };

  const addKeyPoint = (sectionIdx: number) => {
    const newSections = [...localOutline.sections];
    newSections[sectionIdx].keyPoints.push('New Key Point');
    setLocalOutline({ ...localOutline, sections: newSections });
  };

  const updateKeyPoint = (sectionIdx: number, pointIdx: number, val: string) => {
    const newSections = [...localOutline.sections];
    newSections[sectionIdx].keyPoints[pointIdx] = val;
    setLocalOutline({ ...localOutline, sections: newSections });
  };

  const removeKeyPoint = (sectionIdx: number, pointIdx: number) => {
    const newSections = [...localOutline.sections];
    newSections[sectionIdx].keyPoints = newSections[sectionIdx].keyPoints.filter((_, i) => i !== pointIdx);
    setLocalOutline({ ...localOutline, sections: newSections });
  };

  // Dynamic optimized prompt based on current outline and brief
  const heroImagePrompt = generateOptimizedImagePrompt();

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
                  className="font-bold text-gray-900 border-none bg-transparent focus:ring-0 p-0 text-xl w-[400px]"
                  placeholder="Article Title..."
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
                <button 
                  onClick={handleDownload}
                  className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                  title="Download as Markdown"
                >
                  <Download className="w-5 h-5" />
                </button>
                <button className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all">
                  <Save className="w-4 h-4" /> Save Article
                </button>
              </>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {!hasStarted ? (
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Pencil className="w-5 h-5 text-indigo-500" /> Finalize Article Strategy
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">Refine the structure and assets before the AI starts writing.</p>
                </div>
                <button 
                  onClick={addSection}
                  className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add Section
                </button>
              </div>

              <div className="bg-gradient-to-br from-indigo-50/50 to-purple-50/50 rounded-2xl p-6 border border-indigo-100/50">
                 <ImageGenerator 
                    defaultPrompt={heroImagePrompt} 
                    initialImageUrl={heroImageUrl} 
                    onImageGenerated={setHeroImageUrl}
                 />
              </div>

              <div className="space-y-6">
                {localOutline.sections.map((section, sIdx) => (
                  <div key={sIdx} className="group bg-white border border-gray-100 rounded-2xl p-6 transition-all hover:border-indigo-100 hover:shadow-xl shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="mt-2 text-gray-300">
                        <GripVertical className="w-5 h-5" />
                      </div>
                      <div className="flex-1 space-y-6">
                        <div className="flex items-center gap-3">
                          <input 
                            type="text"
                            value={section.heading}
                            onChange={(e) => updateSectionHeading(sIdx, e.target.value)}
                            className="flex-1 bg-transparent border-none text-xl font-bold text-gray-800 focus:ring-0 p-0 placeholder:text-gray-300"
                            placeholder="Section Heading..."
                          />
                          <button 
                            onClick={() => removeSection(sIdx)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {/* Subheadings */}
                          <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                              <List className="w-3 h-3" /> Subheadings
                            </label>
                            <div className="space-y-2 pl-4 border-l-2 border-indigo-100">
                              {section.subheadings.map((sub, subIdx) => (
                                <div key={subIdx} className="flex items-center gap-2 group/sub">
                                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-300 shrink-0" />
                                  <input 
                                    type="text"
                                    value={sub}
                                    onChange={(e) => updateSubheading(sIdx, subIdx, e.target.value)}
                                    className="flex-1 bg-transparent border-none text-sm text-gray-600 focus:ring-0 p-0"
                                  />
                                  <button 
                                    onClick={() => removeSubheading(sIdx, subIdx)}
                                    className="opacity-0 group-hover/sub:opacity-100 p-1 text-gray-300 hover:text-red-400"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                              <button 
                                onClick={() => addSubheading(sIdx)}
                                className="text-[10px] font-bold text-indigo-400 hover:text-indigo-600 flex items-center gap-1 mt-2 uppercase tracking-wider"
                              >
                                <Plus className="w-3 h-3" /> Add Subheading
                              </button>
                            </div>
                          </div>

                          {/* Key Points */}
                          <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                              <Trophy className="w-3 h-3" /> SEO Context Points
                            </label>
                            <div className="space-y-2">
                              {section.keyPoints.map((point, pIdx) => (
                                <div key={pIdx} className="flex items-center gap-2 group/point bg-gray-50 rounded-lg px-2 py-1">
                                  <input 
                                    type="text"
                                    value={point}
                                    onChange={(e) => updateKeyPoint(sIdx, pIdx, e.target.value)}
                                    className="flex-1 bg-transparent border-none text-[11px] text-gray-500 focus:ring-0 p-0"
                                  />
                                  <button 
                                    onClick={() => removeKeyPoint(sIdx, pIdx)}
                                    className="opacity-0 group-hover/point:opacity-100 p-1 text-gray-300 hover:text-red-400"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                              <button 
                                onClick={() => addKeyPoint(sIdx)}
                                className="text-[10px] font-bold text-gray-400 hover:text-indigo-600 flex items-center gap-1 mt-1 uppercase tracking-wider"
                              >
                                <Plus className="w-3 h-3" /> Add Point
                              </button>
                            </div>
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
              {/* Show the Hero Image inside the actual content area */}
              {heroImageUrl && (
                <div className="rounded-3xl overflow-hidden shadow-2xl border border-gray-100 aspect-[21/9] relative group animate-in fade-in duration-700">
                  <img src={heroImageUrl} alt="Article Hero" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-8">
                    <h1 className="text-3xl font-black text-white drop-shadow-lg">{localOutline.title}</h1>
                  </div>
                </div>
              )}

              {isGenerating && (
                <div className="flex items-center gap-2 text-indigo-600 font-medium bg-indigo-50 px-4 py-2 rounded-lg w-fit animate-pulse sticky top-0 z-10 shadow-sm border border-indigo-100">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  AI is crafting your SEO content...
                </div>
              )}
              
              <div className="min-h-[500px]">
                {viewMode === 'preview' ? (
                  <div className="markdown-body animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <ReactMarkdown>
                      {content || "*Waiting for generation to begin...*"}
                    </ReactMarkdown>
                    {isGenerating && (
                       <span className="inline-block w-2 h-5 ml-1 bg-indigo-500 animate-pulse rounded-sm" />
                    )}
                  </div>
                ) : (
                  <textarea
                    className="w-full min-h-[500px] outline-none text-lg text-gray-700 leading-relaxed resize-none bg-transparent font-mono"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Raw Markdown content..."
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar Analysis & Assets */}
      <div className="w-96 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-1">
        {/* SEO Score Section */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-6 flex-shrink-0 relative">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-indigo-600" /> SEO Score
            </h3>
            <div className="flex items-center gap-2">
               {analyzing && <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />}
               <Info className="w-4 h-4 text-gray-300 cursor-help" />
            </div>
          </div>

          <div 
            className="relative w-32 h-32 mx-auto mb-6 cursor-pointer"
            onMouseEnter={() => setShowScoreTooltip(true)}
            onMouseLeave={() => setShowScoreTooltip(false)}
          >
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="58"
                stroke="currentColor"
                strokeWidth="12"
                fill="transparent"
                className="text-gray-100"
              />
              <circle
                cx="64"
                cy="64"
                r="58"
                stroke="currentColor"
                strokeWidth="12"
                fill="transparent"
                strokeDasharray={364}
                strokeDashoffset={364 - (364 * (analysis?.score || 0)) / 100}
                className={`${scoreColor(analysis?.score || 0)} transition-all duration-1000 ease-out`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className={`text-3xl font-black ${scoreColor(analysis?.score || 0)}`}>{analysis?.score || 0}</span>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Score</span>
            </div>

            {/* Tooltip Breakdown */}
            {showScoreTooltip && analysis && (
              <div className="absolute top-0 left-full ml-4 w-56 bg-white border border-gray-100 shadow-2xl rounded-2xl p-4 z-50 animate-in fade-in slide-in-from-left-2 duration-200">
                <div className="mb-3 border-b pb-2">
                  <p className="text-xs font-bold text-gray-900">Score Breakdown</p>
                  <p className="text-[10px] text-gray-400">Weighted Performance Metrics</p>
                </div>
                <div className="space-y-3">
                  {getScoreBreakdown().map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-[10px] font-medium">
                        <span className="text-gray-600">{item.label}</span>
                        <span className={scoreColor(item.val)}>{item.val}%</span>
                      </div>
                      <div className="h-1 bg-gray-50 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${scoreColor(item.val).replace('text-', 'bg-')} transition-all duration-500`}
                          style={{ width: `${item.val}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-2 border-t text-[9px] text-gray-400 italic">
                  Hover for real-time SEO intelligence.
                </div>
                <div className="absolute top-1/2 -left-2 -translate-y-1/2 w-4 h-4 bg-white border-l border-b border-gray-100 rotate-45" />
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Readability</span>
              <span className="font-bold text-gray-900">{analysis?.readability || 'Analyzing...'}</span>
            </div>
            <div className="space-y-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Keyword Density</span>
              {brief.targetKeywords.map((k, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600 truncate">{k}</span>
                    <span className="text-gray-400">{(analysis?.keywordDensity?.[k] || 0).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-500 h-full transition-all duration-1000"
                      style={{ width: `${Math.min((analysis?.keywordDensity?.[k] || 0) * 10, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Unified Image Generator in Sidebar */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-6 flex-shrink-0">
          <ImageGenerator 
            defaultPrompt={heroImagePrompt} 
            initialImageUrl={heroImageUrl} 
            onImageGenerated={setHeroImageUrl}
          />
        </div>

        {/* Suggestions Section */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-6">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" /> Suggestions
          </h3>
          <div className="space-y-3">
            {analysis?.suggestions.map((s, i) => (
              <div key={i} className="flex gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="mt-0.5">
                  {i % 2 === 0 ? <CheckCircle className="w-4 h-4 text-green-500" /> : <AlertCircle className="w-4 h-4 text-orange-500" />}
                </div>
                <p className="text-sm text-gray-700 leading-snug">{s}</p>
              </div>
            )) || (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 text-gray-200 animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-400">Analyzing content suggestions...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleEditor;
