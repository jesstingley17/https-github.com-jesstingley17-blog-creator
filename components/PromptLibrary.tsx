
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Trash2, 
  Copy, 
  Check, 
  Clock, 
  Bookmark, 
  Zap, 
  Tag, 
  ArrowRight,
  Link as LinkIcon,
  ExternalLink,
  Loader2,
  FileText
} from 'lucide-react';
import { storageService } from '../storageService';
import { SavedPrompt } from '../types';

interface PromptLibraryProps {
  onUsePrompt?: (text: string) => void;
}

const PromptLibrary: React.FC<PromptLibraryProps> = ({ onUsePrompt }) => {
  const [prompts, setPrompts] = useState<SavedPrompt[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [copyingId, setCopyingId] = useState<string | null>(null);

  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    setLoading(true);
    const data = await storageService.getPrompts();
    setPrompts(data || []);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    await storageService.deletePrompt(id);
    loadPrompts();
  };

  const handleCopy = (prompt: SavedPrompt) => {
    navigator.clipboard.writeText(prompt.optimizedPrompt);
    setCopyingId(prompt.id);
    setTimeout(() => setCopyingId(null), 2000);
  };

  const filtered = prompts.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) || 
    p.optimizedPrompt.toLowerCase().includes(search.toLowerCase()) ||
    p.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-500 max-w-7xl mx-auto pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-slate-100 pb-12">
        <div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">Intelligence Library</h1>
          <p className="text-slate-400 mt-3 font-bold uppercase tracking-[0.2em] text-[10px]">A persistent registry of high-authority strategic prompts.</p>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
          <input 
            type="text" 
            placeholder="FILTER NODES..." 
            className="w-full pl-16 pr-8 py-5 bg-white border border-slate-100 rounded-[32px] outline-none focus:ring-4 focus:ring-indigo-50 shadow-xl font-black text-xs uppercase tracking-widest placeholder:text-slate-200"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 gap-6">
          <Loader2 className="w-16 h-16 animate-spin text-indigo-100" />
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">De-Serializing Intelligence...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-32 text-center space-y-8 bg-white rounded-[64px] border-4 border-dashed border-slate-50">
          <div className="w-24 h-24 bg-slate-50 rounded-[32px] flex items-center justify-center mx-auto">
            <Bookmark className="w-10 h-10 text-slate-200" />
          </div>
          <div className="space-y-2">
            <h3 className="font-black text-slate-300 uppercase tracking-[0.3em] italic">Archive Empty</h3>
            <p className="text-slate-200 text-xs font-bold uppercase tracking-widest">Generate and refine a brief to begin persistence.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {filtered.map(prompt => (
            <div key={prompt.id} className="bg-white rounded-[56px] border border-slate-100 shadow-2xl hover:shadow-indigo-100/50 transition-all group flex flex-col relative overflow-hidden">
               {/* 1. TITLE AREA */}
               <div className="p-10 pb-6 flex justify-between items-start">
                 <div className="space-y-3">
                   <div className="flex items-center gap-3">
                     <FileText className="w-5 h-5 text-indigo-600" />
                     <h3 className="font-black text-3xl text-slate-900 italic tracking-tighter uppercase leading-none">{prompt.title}</h3>
                   </div>
                   <div className="flex gap-2">
                     {prompt.tags.map(tag => (
                       <span key={tag} className="text-[9px] font-black uppercase text-indigo-500 px-3 py-1.5 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center gap-1.5 tracking-widest">
                         <Tag className="w-2.5 h-2.5" /> {tag}
                       </span>
                     ))}
                   </div>
                 </div>
                 <button onClick={() => handleDelete(prompt.id)} className="p-4 bg-slate-50 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-[24px] transition-all opacity-0 group-hover:opacity-100"><Trash2 className="w-6 h-6" /></button>
               </div>

               {/* 2. CONTENT BOX (Optimized Prompt) */}
               <div className="px-10 flex-1">
                 <div className="p-8 bg-slate-950 rounded-[48px] border-4 border-slate-900 shadow-inner group-hover:border-indigo-600 transition-all relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-10">
                      <Zap className="w-16 h-16 text-indigo-500 rotate-12" />
                    </div>
                    <p className="text-[9px] font-black text-indigo-400 mb-4 uppercase tracking-[0.4em] opacity-60">Synthesis Instruction Node</p>
                    <p className="text-base font-bold text-white leading-relaxed italic pr-12">"{prompt.optimizedPrompt}"</p>
                 </div>
               </div>

               {/* 3. URL / CITATION AREA */}
               <div className="p-10 pt-8 space-y-6">
                 <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 flex items-center justify-between hover:bg-white hover:border-indigo-100 transition-all cursor-default">
                   <div className="flex items-center gap-5">
                     <div className="p-3 bg-white rounded-2xl shadow-sm">
                       <LinkIcon className="w-4 h-4 text-indigo-400" />
                     </div>
                     <div className="overflow-hidden">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] leading-none mb-1.5">Authority Reference</p>
                        <p className="text-xs font-black text-slate-600 truncate max-w-[220px] md:max-w-[400px]">
                          {prompt.sourceUrl || "NO SOURCE DEFINED"}
                        </p>
                     </div>
                   </div>
                   {prompt.sourceUrl && (
                     <a href={prompt.sourceUrl} target="_blank" className="p-3 bg-white hover:bg-indigo-600 hover:text-white text-slate-300 rounded-2xl shadow-sm transition-all">
                       <ExternalLink className="w-5 h-5" />
                     </a>
                   )}
                 </div>

                 <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                   <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-slate-200" />
                      <span className="text-[10px] font-black uppercase text-slate-200 tracking-[0.2em]">{new Date(prompt.createdAt).toLocaleDateString()}</span>
                   </div>
                   <div className="flex gap-3">
                      <button 
                        onClick={() => handleCopy(prompt)} 
                        className={`px-6 py-4 rounded-2xl border border-slate-100 transition-all active:scale-90 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] ${copyingId === prompt.id ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-white text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100'}`}
                      >
                        {copyingId === prompt.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copyingId === prompt.id ? 'Copied' : 'Clone Node'}
                      </button>
                      {onUsePrompt && (
                        <button 
                          onClick={() => onUsePrompt(prompt.optimizedPrompt)}
                          className="px-10 py-4 bg-indigo-600 text-white rounded-[24px] shadow-2xl shadow-indigo-100 hover:bg-indigo-700 hover:scale-[1.02] transition-all active:scale-95 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em]"
                        >
                          Deploy Strategy <ArrowRight className="w-4 h-4" />
                        </button>
                      )}
                   </div>
                 </div>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PromptLibrary;
