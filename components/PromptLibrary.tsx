
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
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight italic uppercase">Prompt Library</h1>
          <p className="text-gray-500 mt-1 font-medium">Your repository of high-performance strategic instructions.</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <input 
            type="text" 
            placeholder="Search intent nodes..." 
            className="w-full pl-12 pr-6 py-4 bg-white border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 shadow-sm font-bold text-xs"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-200" />
          <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Indexing Intelligence...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-24 text-center space-y-6 bg-white rounded-[48px] border border-dashed border-gray-200">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
            <Bookmark className="w-10 h-10 text-gray-300" />
          </div>
          <div className="space-y-2">
            <h3 className="font-black text-gray-400 uppercase tracking-widest italic">Library Empty</h3>
            <p className="text-gray-300 text-sm max-w-xs mx-auto">Refine a topic in the Creation Wizard to save your first optimized prompt.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filtered.map(prompt => (
            <div key={prompt.id} className="bg-white rounded-[40px] border border-gray-100 shadow-sm hover:shadow-2xl transition-all group flex flex-col relative overflow-hidden">
               {/* Header Section: Title and Actions */}
               <div className="p-8 pb-4 flex justify-between items-start">
                 <div className="space-y-1.5">
                   <div className="flex items-center gap-2">
                     <FileText className="w-4 h-4 text-indigo-600" />
                     <h3 className="font-black text-2xl text-slate-900 italic tracking-tighter line-clamp-1">{prompt.title}</h3>
                   </div>
                   <div className="flex gap-2">
                     {prompt.tags.map(tag => (
                       <span key={tag} className="text-[8px] font-black uppercase text-indigo-500 px-2 py-0.5 bg-indigo-50 rounded-md border border-indigo-100 flex items-center gap-1">
                         <Tag className="w-2 h-2" /> {tag}
                       </span>
                     ))}
                   </div>
                 </div>
                 <button onClick={() => handleDelete(prompt.id)} className="p-2 text-slate-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 className="w-5 h-5" /></button>
               </div>

               {/* Content Box Section: Optimized Prompt Text */}
               <div className="px-8 flex-1">
                 <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800 shadow-inner group-hover:ring-2 group-hover:ring-indigo-500/50 transition-all">
                    <p className="text-xs font-mono text-indigo-300 mb-2 uppercase tracking-widest opacity-40 font-black">Strategic Content Box</p>
                    <p className="text-sm font-bold text-white leading-relaxed italic">"{prompt.optimizedPrompt}"</p>
                 </div>
               </div>

               {/* URL Section: Citations and References */}
               <div className="p-8 pt-6 space-y-4">
                 <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group/url">
                   <div className="flex items-center gap-3">
                     <div className="p-2 bg-white rounded-lg shadow-sm">
                       <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
                     </div>
                     <div className="overflow-hidden">
                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Source Citation</p>
                        <p className="text-[10px] font-bold text-slate-600 truncate max-w-[200px] md:max-w-[300px]">
                          {prompt.sourceUrl || "No author page cited."}
                        </p>
                     </div>
                   </div>
                   {prompt.sourceUrl && (
                     <a href={prompt.sourceUrl} target="_blank" className="p-2 hover:bg-white hover:text-indigo-600 text-slate-300 rounded-lg transition-all">
                       <ExternalLink className="w-4 h-4" />
                     </a>
                   )}
                 </div>

                 <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                   <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3 text-slate-300" />
                      <span className="text-[9px] font-black uppercase text-slate-300 tracking-widest">{new Date(prompt.createdAt).toLocaleDateString()}</span>
                   </div>
                   <div className="flex gap-2">
                      <button 
                        onClick={() => handleCopy(prompt)} 
                        className={`px-4 py-2.5 rounded-xl border border-slate-100 transition-all active:scale-90 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest ${copyingId === prompt.id ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-white text-slate-400 hover:text-indigo-600'}`}
                      >
                        {copyingId === prompt.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copyingId === prompt.id ? 'Copied' : 'Copy Node'}
                      </button>
                      {onUsePrompt && (
                        <button 
                          onClick={() => onUsePrompt(prompt.optimizedPrompt)}
                          className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                        >
                          Deploy Strategy <ArrowRight className="w-3.5 h-3.5" />
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
