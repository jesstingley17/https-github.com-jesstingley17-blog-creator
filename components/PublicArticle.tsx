
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Sparkles, 
  Loader2, 
  Calendar, 
  ShieldCheck,
  BrainCircuit,
  Quote,
  ExternalLink
} from 'lucide-react';
import { storageService } from '../storageService';
import { GeneratedContent } from '../types';

interface PublicArticleProps {
  shareId: string;
  onExit: () => void;
}

const PublicArticle: React.FC<PublicArticleProps> = ({ shareId, onExit }) => {
  const [data, setData] = useState<GeneratedContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const article = await storageService.getArticle(shareId);
        setData(article);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [shareId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-4 border-indigo-50 flex items-center justify-center">
            <BrainCircuit className="w-10 h-10 text-indigo-600 animate-pulse" />
          </div>
          <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600 italic">Synthesizing Preview...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-12 text-center">
        <div className="bg-white p-12 rounded-[56px] shadow-2xl border border-gray-100 max-w-md space-y-6">
          <h2 className="text-3xl font-black text-gray-900 tracking-tight italic">Link Expired</h2>
          <button onClick={onExit} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-indigo-100">Return to Hub</button>
        </div>
      </div>
    );
  }

  const heroImage = data.images?.find(img => img.isHero) || { url: data.heroImageUrl };

  return (
    <div className="min-h-screen bg-white selection:bg-indigo-100 selection:text-indigo-900">
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-xl z-50 border-b border-gray-50 px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 p-2 rounded-xl">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-lg italic tracking-tighter text-gray-900 uppercase">ZR SYNTHESIS</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-full border border-green-100">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Verified Content Node</span>
            </div>
            <button onClick={onExit} className="text-gray-400 hover:text-indigo-600 transition-colors font-black text-[10px] uppercase tracking-widest">Dashboard Access</button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-8 pt-32 pb-32">
        <header className="space-y-12 mb-20 text-center md:text-left">
          <div className="space-y-6">
             <div className="flex flex-wrap justify-center md:justify-start gap-4">
               {data.brief.targetKeywords.slice(0, 3).map((k, i) => (
                 <span key={i} className="text-[10px] font-black uppercase tracking-widest px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full">{k}</span>
               ))}
             </div>
             <h1 className="text-5xl md:text-7xl font-black text-gray-900 italic tracking-tighter leading-[1.1]">{data.outline.title}</h1>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-8 border-y border-gray-50 py-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center shadow-lg">
                <BrainCircuit className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-gray-900">ZR Intelligence Agent</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Autonomous Synthesis</p>
              </div>
            </div>
            <div className="hidden md:block w-px h-8 bg-gray-100" />
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-300" />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{new Date(data.updatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <div className="flex-1" />
            <button onClick={() => window.print()} className="flex items-center gap-2 px-6 py-3 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest">
              Archive content
            </button>
          </div>
        </header>

        {heroImage?.url && (
          <div className="mb-20 group relative">
            <img 
              src={heroImage.url} 
              className="w-full h-[600px] object-cover rounded-[56px] shadow-2xl transition-transform duration-1000 group-hover:scale-[1.01]" 
              alt="Article Hero" 
            />
            <div className="absolute inset-0 rounded-[56px] ring-1 ring-inset ring-black/10" />
          </div>
        )}

        <div className="markdown-body text-xl">
          <ReactMarkdown>{data.content}</ReactMarkdown>
        </div>

        {/* Citations Footer */}
        {data.citations && data.citations.length > 0 && (
          <div className="mt-32 pt-20 border-t-4 border-slate-900 space-y-12">
            <div className="flex items-center gap-4">
              <Quote className="w-8 h-8 text-indigo-600" />
              <h3 className="text-3xl font-black text-gray-900 italic uppercase tracking-tighter">Sources & References</h3>
            </div>
            <div className="grid grid-cols-1 gap-6">
              {data.citations.map((c) => (
                <div key={c.id} className="group p-8 bg-gray-50 rounded-[32px] border border-transparent hover:border-indigo-100 transition-all flex items-start gap-6">
                  <span className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center font-black text-indigo-600 text-lg shadow-sm">
                    {c.id}
                  </span>
                  <div className="flex-1 space-y-2">
                    <h4 className="font-black text-gray-900 text-xl italic tracking-tight">{c.title}</h4>
                    <p className="text-gray-500 text-sm font-medium line-clamp-2">{c.snippet}</p>
                    <a href={c.url} target="_blank" className="flex items-center gap-2 text-indigo-600 font-bold text-xs hover:underline pt-2">
                      Access Source Node <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <footer className="mt-40 pt-20 border-t border-gray-100 text-center space-y-8">
           <div className="w-20 h-20 bg-indigo-600 rounded-[32px] flex items-center justify-center mx-auto shadow-2xl shadow-indigo-100">
             <Sparkles className="w-10 h-10 text-white" />
           </div>
           <div className="space-y-4">
             <h3 className="text-3xl font-black text-gray-900 italic tracking-tighter uppercase leading-none">Build Your Semantic Authority</h3>
             <p className="text-gray-400 max-w-lg mx-auto font-medium">Synthesized via ZR Discourse Engine. Optimized for semantic search and authority.</p>
           </div>
           <button onClick={onExit} className="px-12 py-5 bg-slate-900 text-white rounded-[24px] font-black uppercase tracking-[0.2em] text-xs hover:bg-slate-800 transition-all active:scale-95">Explore Hub</button>
        </footer>
      </main>
    </div>
  );
};

export default PublicArticle;
