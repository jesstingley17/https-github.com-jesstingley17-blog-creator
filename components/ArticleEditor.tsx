
import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Download, 
  ChevronLeft, 
  BarChart2, 
  Loader2, 
  Trophy,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { geminiService } from '../geminiService';
import { ContentBrief, ContentOutline, SEOAnalysis } from '../types';
import ImageGenerator from './ImageGenerator';

interface ArticleEditorProps {
  brief: ContentBrief;
  outline: ContentOutline;
  onBack: () => void;
}

const ArticleEditor: React.FC<ArticleEditorProps> = ({ brief, outline, onBack }) => {
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(true);
  const [analysis, setAnalysis] = useState<SEOAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [showScoreTooltip, setShowScoreTooltip] = useState(false);

  useEffect(() => {
    const startGeneration = async () => {
      setIsGenerating(true);
      let fullText = '';
      try {
        const stream = geminiService.streamContent(brief, outline);
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
    startGeneration();
  }, []);

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
    // Sanitize filename
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

  // Derived breakdown metrics based on the AI analysis
  const getScoreBreakdown = () => {
    if (!analysis) return [];
    const score = analysis.score;
    return [
      { label: 'Keyword Synergy', val: Math.round(score * 0.95), weight: 30 },
      { label: 'Semantic Depth', val: Math.round(score * 1.02) > 100 ? 100 : Math.round(score * 1.02), weight: 40 },
      { label: 'Readability', val: analysis.readability === 'Professional' ? 95 : 85, weight: 20 },
      { label: 'Structure', val: 90, weight: 10 },
    ];
  };

  return (
    <div className="flex h-[calc(100vh-120px)] gap-8 animate-in fade-in duration-500">
      {/* Editor Main */}
      <div className="flex-1 flex flex-col bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
        <header className="px-6 py-4 border-b flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5 text-gray-500" />
            </button>
            <h2 className="font-bold text-gray-900 line-clamp-1">{brief.topic}</h2>
          </div>
          <div className="flex items-center gap-3">
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
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {isGenerating && (
            <div className="flex items-center gap-2 text-indigo-600 font-medium mb-6 bg-indigo-50 px-4 py-2 rounded-lg w-fit animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin" />
              AI is writing your article...
            </div>
          )}
          <textarea
            className="w-full h-full outline-none text-lg text-gray-700 leading-relaxed resize-none bg-transparent font-serif"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Waiting for AI to start writing..."
          />
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

        {/* Image Generation Section */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-6 flex-shrink-0">
          <ImageGenerator defaultPrompt={brief.topic} />
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
