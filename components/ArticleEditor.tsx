
import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  ChevronLeft, 
  Loader2, 
  X,
  Check,
  Zap,
  Target,
  Image as ImageIcon,
  Database,
  Code,
  Copy,
  Type,
  Link2,
  RefreshCw,
  Sparkles,
  Heart,
  Star,
  PenTool,
  Anchor
} from 'lucide-react';
import { geminiService } from '../geminiService';
import { storageService } from '../storageService';
import { ContentBrief, ContentOutline, SEOAnalysis, ArticleImage, AppRoute, Citation, BacklinkOpportunity } from '../types';
import ImageGenerator from './ImageGenerator';

interface ArticleEditorProps {
  brief: ContentBrief;
  outline: ContentOutline;
  onBack: () => void;
  onNavigate?: (route: AppRoute) => void;
}

const ArticleEditor: React.FC<ArticleEditorProps> = ({ brief: initialBrief, outline: initialOutline, onBack, onNavigate }) => {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState(initialOutline?.title || '');
  const [slug, setSlug] = useState(initialBrief?.slug || '');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [analysis, setAnalysis] = useState<SEOAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'edit'>('preview');
  
  const [articleImages, setArticleImages] = useState<ArticleImage[]>([]);
  const [backlinkOps, setBacklinkOps] = useState<BacklinkOpportunity[]>([]);
  const [citations, setCitations] = useState<Citation[]>([]);

  const [structuredData, setStructuredData] = useState<string | null>(null);
  const [isGeneratingSchema, setIsGeneratingSchema] = useState(false);
  const [showSchemaModal, setShowSchemaModal] = useState(false);
  const [copiedSchema, setCopiedSchema] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [localBrief, setLocalBrief] = useState<ContentBrief>(initialBrief);
  const [localOutline, setLocalOutline] = useState<ContentOutline>(initialOutline);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    const loadDraft = async () => {
      if (!initialBrief?.id) return;
      try {
        const data = await storageService.getArticle(initialBrief.id);
        if (data) {
          if (data.content) setContent(data.content);
          if (data.outline) {
            setLocalOutline(data.outline);
            setTitle(data.outline.title);
          }
          if (data.brief) setLocalBrief(data.brief);
          if (data.slug) setSlug(data.slug);
          if (data.analysis) setAnalysis(data.analysis);
          if (data.images) setArticleImages(data.images);
          if (data.backlinkOpportunities) setBacklinkOps(data.backlinkOpportunities);
          if (data.content || data.images?.length) setHasStarted(true);
        }
      } catch (e) {}
    };
    loadDraft();
  }, [initialBrief?.id]);

  useEffect(() => {
    if (!hasStarted) return;
    const saveArticle = async () => {
      setSaveStatus('saving');
      try {
        await storageService.upsertArticle({
          id: localBrief.id,
          brief: { ...localBrief, slug },
          outline: { ...localOutline, title },
          content,
          slug,
          analysis,
          heroImageUrl: articleImages.find(img => img.isHero)?.url || null,
          images: articleImages,
          citations,
          backlinkOpportunities: backlinkOps,
          updatedAt: Date.now()
        });
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (e) {
        setSaveStatus('idle');
      }
    };
    const timer = setTimeout(saveArticle, 3000);
    return () => clearTimeout(timer);
  }, [content, title, slug, localOutline, localBrief, analysis, articleImages, backlinkOps, citations]);

  const startGeneration = async () => {
    setHasStarted(true);
    setIsGenerating(true);
    setViewMode('preview');
    let fullText = '';
    try {
      if (!slug) {
        const generatedSlug = await geminiService.generateSlug(title);
        setSlug(generatedSlug);
      }
      const stream = geminiService.streamContent(localBrief, { ...localOutline, title });
      for await (const chunk of stream) {
        const c = chunk as any;
        fullText += c.text || '';
        setContent(fullText);
      }
      performAnalysis(fullText);
      const heroImagePrompt = `Professional nautical aesthetic banner for: "${title}". Soft professional lighting, artistic, high-end 8k resolution.`;
      const heroUrl = await geminiService.generateArticleImage(heroImagePrompt);
      setArticleImages([{ id: Math.random().toString(36).substr(2, 9), url: heroUrl, prompt: heroImagePrompt, isHero: true }]);
    } catch (error) {} finally { setIsGenerating(false); }
  };

  const regenerateSlug = async () => {
    try {
      const s = await geminiService.generateSlug(title);
      setSlug(s);
    } catch (e) {}
  };

  const performAnalysis = async (text: string) => {
    setAnalyzing(true);
    try {
      const result = await geminiService.analyzeSEO(text, localBrief.targetKeywords || []);
      setAnalysis(result);
    } catch (e) {} finally { setAnalyzing(false); }
  };

  return (
    <div className="flex h-[calc(100vh-100px)] gap-6 overflow-hidden">
      {/* Main Generator Interface */}
      <div className="flex-1 flex flex-col bg-white rounded-[40px] border border-pink-100 shadow-xl overflow-hidden relative">
        <header className="px-10 py-6 border-b border-pink-50 flex items-center justify-between bg-white/95 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center gap-6">
            <button onClick={onBack} className="p-3 bg-pink-50 hover:bg-pink-100 rounded-2xl transition-all group">
              <ChevronLeft className="w-5 h-5 text-pink-600 group-hover:text-pink-800" />
            </button>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <Anchor className="w-3 h-3 text-pink-600" />
                <span className="text-[10px] font-black text-pink-500 uppercase tracking-widest leading-none">Anchor Chart Forge</span>
              </div>
              <h2 className="font-bold text-slate-900 text-lg tracking-tight mt-1 font-heading">
                {title || 'Untethered Synthesis'}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex bg-pink-50 p-1.5 rounded-[22px]">
              <button onClick={() => setViewMode('preview')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'preview' ? 'bg-white shadow-sm text-pink-700' : 'text-pink-400 hover:text-pink-600'}`}>Preview</button>
              <button onClick={() => setViewMode('edit')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'edit' ? 'bg-white shadow-sm text-pink-700' : 'text-pink-400 hover:text-pink-600'}`}>Edit</button>
            </div>
            <button 
              onClick={hasStarted ? () => {} : startGeneration} 
              disabled={isGenerating}
              className={`px-10 py-3.5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center gap-3 transition-all shadow-xl active:scale-95 ${
                isGenerating ? 'bg-pink-100 text-pink-400' : hasStarted ? 'bg-emerald-100 text-emerald-800' : 'girly-gradient text-white shadow-pink-200'
              }`}
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : hasStarted ? <Check className="w-4 h-4" /> : <Zap className="w-4 h-4 fill-current" />}
              <span>{isGenerating ? 'Synthesizing' : hasStarted ? 'Vessel Locked' : 'Forge Chart'}</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-12 md:p-24 custom-scrollbar bg-white scroll-smooth h-full">
          <div className="max-w-4xl mx-auto space-y-16 pb-32">
            
            {/* THE URL BOX */}
            <div className="space-y-4">
              <label className="text-[10px] font-black text-pink-700 uppercase tracking-[0.3em] ml-2 flex items-center gap-2 font-heading">
                <Link2 className="w-4 h-4" /> Chart Anchor Slug
              </label>
              <div className="group relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-8 pointer-events-none">
                  <span className="text-pink-400 font-bold text-sm">anchor.pro /</span>
                </div>
                <input 
                  type="text" 
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full bg-pink-50/30 border-2 border-pink-100 focus:border-pink-300 focus:bg-white rounded-[32px] pl-[124px] pr-16 py-6 font-mono text-base text-pink-900 outline-none transition-all shadow-sm focus:shadow-lg focus:shadow-pink-100"
                  placeholder="how-to-engineer-content"
                />
                <button 
                  onClick={regenerateSlug}
                  className="absolute right-6 top-1/2 -translate-y-1/2 p-2.5 bg-white border border-pink-100 rounded-xl text-pink-600 hover:bg-pink-50 transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* THE TITLE BOX */}
            <div className="space-y-4">
              <label className="text-[10px] font-black text-pink-700 uppercase tracking-[0.3em] ml-2 flex items-center gap-2 font-heading">
                <Type className="w-4 h-4" /> Chart Headline
              </label>
              <input 
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-transparent border-none focus:ring-0 text-5xl md:text-6xl font-black text-slate-900 tracking-tighter outline-none leading-[1.1] font-heading placeholder:text-pink-100"
                placeholder="The Ultimate Chart Title..."
              />
            </div>

            {/* THE CONTENT BOX */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-pink-700 uppercase tracking-[0.3em] ml-2 flex items-center gap-2 font-heading">
                  <PenTool className="w-4 h-4" /> Content Body (Markdown)
                </label>
              </div>
              
              <div className={`rounded-[48px] overflow-hidden transition-all ${viewMode === 'edit' ? 'bg-pink-50/20 border-2 border-pink-100' : ''}`}>
                {viewMode === 'preview' ? (
                  <div className="markdown-body min-h-[600px] p-6">
                    {content ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-40 gap-8">
                        <div className="relative">
                          <Loader2 className="w-20 h-20 animate-spin text-pink-200" />
                          <Anchor className="w-8 h-8 text-pink-500 absolute inset-0 m-auto" />
                        </div>
                        <p className="text-[12px] font-bold text-pink-400 uppercase tracking-[0.5em]">Synthesizing Chart Nodes...</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <textarea 
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full min-h-[1200px] bg-white border-none outline-none font-mono text-lg resize-none p-16 leading-relaxed text-slate-900"
                    placeholder="Drop your thoughts here..."
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebars */}
      <div className="w-80 flex-shrink-0 flex flex-col gap-6 overflow-y-auto custom-scrollbar pb-12 pr-1 h-full">
        <div className="bg-white rounded-[40px] border border-pink-100 shadow-sm p-8 space-y-8">
          <h3 className="font-black text-pink-700 text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 font-heading">
            <Target className="w-4 h-4" /> Authority Matrix
          </h3>
          <div className="text-center py-12 girly-gradient rounded-[48px] relative overflow-hidden shadow-2xl">
            <div className="text-8xl font-black text-white tracking-tighter relative z-10 drop-shadow-md font-heading">
              {analyzing ? <Loader2 className="w-12 h-12 animate-spin mx-auto opacity-50" /> : (analysis?.score || 0)}
            </div>
            <p className="text-[11px] font-black text-pink-100 uppercase tracking-[0.4em] mt-4 relative z-10">Trust Factor</p>
          </div>
          
          <div className="space-y-4">
            <button className="w-full py-5 bg-slate-900 hover:bg-black text-white rounded-[24px] font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 group">
              <Zap className="w-4 h-4 text-pink-400 group-hover:rotate-12 transition-transform" />
              Polish & Perfect
            </button>
            <button onClick={() => setShowSchemaModal(true)} className="w-full py-4 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-[24px] font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all border border-teal-100">
              <Database className="w-4 h-4" /> Vessel Metadata
            </button>
          </div>
        </div>

        <div className="bg-white rounded-[40px] border border-pink-100 shadow-sm p-8 space-y-8">
           <h3 className="font-black text-pink-700 text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 font-heading">
             <ImageIcon className="w-4 h-4" /> Aesthetic Assets
           </h3>
           <ImageGenerator 
              defaultPrompt={`High-end professional photography, clean background, high resolution.`} 
              onImageGenerated={(url, prompt) => setArticleImages(prev => [...prev, { id: Math.random().toString(36).substr(2,9), url, prompt, isHero: false }])}
              topicContext={title}
            />
            <div className="grid grid-cols-2 gap-4">
              {articleImages.map(img => (
                <div key={img.id} className="aspect-square rounded-[30px] overflow-hidden border-2 border-pink-50 bg-pink-50 group hover:ring-4 hover:ring-pink-400 transition-all cursor-pointer">
                   <img src={img.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Asset" />
                </div>
              ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleEditor;
