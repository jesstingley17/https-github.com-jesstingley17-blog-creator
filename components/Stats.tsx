
import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Anchor, Star, Sparkles, FileText, Loader2, Heart } from 'lucide-react';
import { storageService } from '../storageService';
import { ArticleMetadata } from '../types';

const Stats: React.FC = () => {
  const [registry, setRegistry] = useState<ArticleMetadata[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await storageService.getRegistry();
      setRegistry(data);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-6">
        <Loader2 className="w-12 h-12 text-pink-300 animate-spin" />
        <p className="text-[10px] font-black text-pink-300 uppercase tracking-[0.4em]">Calculating Coordinates...</p>
      </div>
    );
  }

  const avgScore = registry.length > 0 
    ? Math.round(registry.reduce((acc, curr) => acc + curr.score, 0) / registry.length) 
    : 0;

  return (
    <div className="space-y-12 animate-in fade-in duration-500 py-10">
      <header>
        <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-2 font-heading">Voyage Stats</h1>
        <p className="text-pink-700 font-bold uppercase tracking-[0.2em] text-[10px]">Your performance analytics across the digital realm.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-10 rounded-[48px] border-2 border-pink-100 shadow-lg text-center space-y-4">
           <div className="w-16 h-16 bg-pink-50 rounded-3xl flex items-center justify-center mx-auto">
              <Anchor className="w-8 h-8 text-pink-700" />
           </div>
           <div>
              <p className="text-[10px] font-black text-pink-400 uppercase tracking-widest">Total Charts</p>
              <h3 className="text-5xl font-black text-slate-900 font-heading">{registry.length}</h3>
           </div>
        </div>

        <div className="bg-white p-10 rounded-[48px] border-2 border-pink-100 shadow-lg text-center space-y-4">
           <div className="w-16 h-16 bg-pink-50 rounded-3xl flex items-center justify-center mx-auto">
              <Star className="w-8 h-8 text-pink-600" />
           </div>
           <div>
              <p className="text-[10px] font-black text-pink-400 uppercase tracking-widest">Avg. Matrix Score</p>
              <h3 className="text-5xl font-black text-slate-900 font-heading">{avgScore}%</h3>
           </div>
        </div>

        <div className="bg-white p-10 rounded-[48px] border-2 border-pink-100 shadow-lg text-center space-y-4">
           <div className="w-16 h-16 bg-teal-50 rounded-3xl flex items-center justify-center mx-auto">
              <Sparkles className="w-8 h-8 text-teal-600" />
           </div>
           <div>
              <p className="text-[10px] font-black text-teal-400 uppercase tracking-widest">Digital Impact</p>
              <h3 className="text-5xl font-black text-slate-900 font-heading">High</h3>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-[56px] border-2 border-pink-100 shadow-xl p-12 overflow-hidden relative">
         <div className="absolute inset-0 bg-pink-50/20 opacity-50" />
         <div className="relative z-10 space-y-10">
            <h3 className="text-2xl font-bold text-slate-900 font-heading flex items-center gap-4">
               <TrendingUp className="text-pink-700 w-8 h-8" /> Authority Growth
            </h3>
            
            <div className="h-64 flex items-end gap-3 pb-8 border-b border-pink-100">
               {registry.slice(0, 15).reverse().map((item, i) => (
                 <div key={i} className="flex-1 group relative">
                    <div 
                      className="w-full bg-pink-600 rounded-t-xl transition-all group-hover:bg-pink-800"
                      style={{ height: `${item.score}%` }}
                    />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.score}%
                    </div>
                 </div>
               ))}
               {registry.length === 0 && (
                 <div className="w-full h-full flex items-center justify-center text-pink-200 uppercase font-black text-xs tracking-widest italic">No Data Points Recorded</div>
               )}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
               <div className="space-y-1">
                  <p className="text-[10px] font-black text-pink-400 uppercase">Retention</p>
                  <p className="text-xl font-bold text-slate-900">92.4%</p>
               </div>
               <div className="space-y-1">
                  <p className="text-[10px] font-black text-pink-400 uppercase">Reach</p>
                  <p className="text-xl font-bold text-slate-900">4.2k</p>
               </div>
               <div className="space-y-1">
                  <p className="text-[10px] font-black text-pink-400 uppercase">Growth</p>
                  <p className="text-xl font-bold text-emerald-600">+12%</p>
               </div>
               <div className="space-y-1">
                  <p className="text-[10px] font-black text-pink-400 uppercase">Status</p>
                  <p className="text-xl font-bold text-slate-900">Steady</p>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Stats;
