
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Trash2, 
  Copy, 
  Check, 
  Clock, 
  Wand2, 
  Plus, 
  X, 
  Loader2,
  Bookmark,
  Zap,
  Tag,
  ArrowRight
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map(prompt => (
            <div key={prompt.id} className="bg-white rounded-[40px] border border-gray-100 p-8 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all group flex flex-col h-full relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                  <Zap className="w-24 h-24 text-indigo-600 rotate-12" />
               </div>
               
               <div className="flex justify-between items-start mb-6">
                 <div className="space-y-1">
                   <h3 className="font-black text-xl text-slate-900 italic tracking-tighter line-clamp-1">{prompt.title}</h3>
                   <div className="flex gap-2">
                     {prompt.tags.map(tag => (
                       <span key={tag} className="text-[8px] font-black uppercase text-indigo-500 px-2 py-0.5 bg-indigo-50 rounded-md border border-indigo-100 flex items-center gap-1">
                         <Tag className="w-2 h-2" /> {tag}
                       </span>
                     ))}
                   </div>
                 </div>
                 <button onClick={() => handleDelete(prompt.id)} className="p-2 text-slate-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
               </div>

               <div className="flex-1 mb-8">
                 <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 max-h-40 overflow-y-auto custom-scrollbar">
                    <p className="text-xs font-bold text-slate-600 leading-relaxed italic line-clamp-4">"{prompt.optimizedPrompt}"</p>
                 </div>
               </div>

               <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                 <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-slate-300" />
                    <span className="text-[9px] font-black uppercase text-slate-300 tracking-widest">{new Date(prompt.createdAt).toLocaleDateString()}</span>
                 </div>
                 <div className="flex gap-2">
                    <button 
                      onClick={() => handleCopy(prompt)} 
                      className={`p-3 rounded-xl border border-slate-100 transition-all active:scale-90 ${copyingId === prompt.id ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-white text-slate-400 hover:text-indigo-600'}`}
                    >
                      {copyingId === prompt.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                    {onUsePrompt && (
                      <button 
                        onClick={() => onUsePrompt(prompt.optimizedPrompt)}
                        className="p-3 bg-slate-900 text-white rounded-xl shadow-lg shadow-slate-100 hover:bg-indigo-600 transition-all active:scale-95 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                      >
                        Deploy <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
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
