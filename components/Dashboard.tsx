
import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  ChevronRight, 
  Plus, 
  Layout, 
  Loader2, 
  Heart, 
  Star, 
  Sparkles, 
  Anchor 
} from 'lucide-react';
import { ArticleMetadata } from '../types';
import { storageService } from '../storageService';

interface DashboardProps {
  onNewContent: () => void;
  onSelectArticle?: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNewContent, onSelectArticle }) => {
  const [registry, setRegistry] = useState<ArticleMetadata[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRegistry = async () => {
      setLoading(true);
      try {
        const data = await storageService.getRegistry();
        setRegistry(data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadRegistry();
  }, []);

  const stats = [
    { label: 'Articles Drafted', val: registry.length.toString(), icon: Anchor, color: 'text-pink-700', bg: 'bg-pink-100' },
    { label: 'Quality Rating', val: registry.length ? `${Math.round(registry.reduce((acc, curr) => acc + (curr.score || 0), 0) / registry.length)}%` : '0%', icon: Star, color: 'text-pink-600', bg: 'bg-pink-50' },
    { label: 'Magic Sparks', val: '48', icon: Sparkles, color: 'text-teal-600', bg: 'bg-teal-50' },
    { label: 'System Health', val: 'Excellent', icon: Heart, color: 'text-pink-500', bg: 'bg-pink-100/50' },
  ];

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-2 font-heading uppercase italic">Content Hub</h1>
          <p className="text-[#be185d] font-bold uppercase tracking-[0.2em] text-[10px]">Your professional synthesis control center.</p>
        </div>
        <button 
          onClick={onNewContent}
          className="girly-gradient hover:opacity-90 text-white px-10 py-5 rounded-[28px] font-black text-xs uppercase tracking-[0.2em] flex items-center gap-4 transition-all shadow-2xl shadow-pink-200 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          New Content
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-[40px] border-2 border-pink-50 shadow-sm flex items-start justify-between relative overflow-hidden group hover:scale-[1.02] transition-transform">
            <div className="relative z-10">
              <p className="text-pink-400 text-[9px] font-black uppercase tracking-[0.3em]">{stat.label}</p>
              <h3 className="text-3xl font-bold mt-3 tracking-tighter text-slate-900 font-heading">{stat.val}</h3>
            </div>
            <div className={`${stat.bg} p-4 rounded-3xl relative z-10 border border-pink-50`}>
              <stat.icon className={`${stat.color} w-6 h-6 transition-transform group-hover:scale-110`} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 bg-white p-12 rounded-[56px] border-2 border-pink-100 shadow-sm flex flex-col justify-center items-center min-h-[450px] relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none" />
          <div className="text-center space-y-6 relative z-10">
            <div className="w-24 h-24 bg-pink-50 rounded-full flex items-center justify-center mx-auto shadow-inner border border-pink-100">
              <Anchor className="w-12 h-12 text-pink-400" />
            </div>
            <h3 className="font-bold text-slate-900 uppercase text-2xl tracking-tight font-heading">Steady Authority</h3>
            <p className="text-slate-500 text-sm max-w-xs mx-auto font-medium leading-relaxed italic">Your professional synthesis pipeline is ready to deploy.</p>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[56px] border-2 border-pink-100 shadow-sm flex flex-col">
          <h3 className="text-xs font-black text-[#be185d] uppercase tracking-widest mb-10 flex items-center gap-3 font-heading">
            <Layout className="w-4 h-4 text-pink-500" /> Recent Articles
          </h3>
          <div className="space-y-6 flex-1 max-h-[500px] overflow-y-auto custom-scrollbar pr-4">
            {loading ? (
              <div className="flex flex-col items-center gap-6 py-24">
                <Loader2 className="w-10 h-10 text-pink-300 animate-spin" />
                <p className="text-[10px] font-black text-pink-300 uppercase tracking-[0.4em]">Loading Registry...</p>
              </div>
            ) : registry.length > 0 ? registry.slice(0, 10).map((item) => (
              <div 
                key={item.id} 
                onClick={() => onSelectArticle?.(item.id)}
                className="flex items-center justify-between p-5 rounded-[32px] hover:bg-pink-50 border-2 border-transparent hover:border-pink-100 transition-all cursor-pointer group shadow-sm hover:shadow-md"
              >
                <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-[22px] flex items-center justify-center shadow-sm transition-all group-hover:scale-110 ${(item.score || 0) > 80 ? 'bg-emerald-50 text-emerald-600' : 'bg-pink-50 text-[#be185d]'}`}>
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800 line-clamp-1 transition-colors group-hover:text-[#be185d] tracking-tight">{item.title}</h4>
                    <p className="text-[9px] text-pink-400 font-black uppercase tracking-[0.2em] mt-1">Quality: {item.score || 0}%</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-pink-300 group-hover:text-[#be185d] transition-all group-hover:translate-x-1" />
              </div>
            )) : (
              <div className="text-center py-24 border-4 border-dashed border-pink-50 rounded-[40px]">
                <p className="text-xs font-black text-pink-200 uppercase tracking-[0.4em]">No Articles Yet</p>
              </div>
            )}
          </div>
          <button onClick={() => window.location.hash = '#history'} className="w-full mt-10 py-5 text-[10px] font-black text-[#be185d] hover:text-[#9d174d] uppercase tracking-[0.3em] bg-pink-50 rounded-2xl transition-all border border-pink-100">
            View All Archives
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
