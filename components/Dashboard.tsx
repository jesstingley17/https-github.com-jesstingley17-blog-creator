
import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  TrendingUp, 
  Users, 
  Clock,
  ChevronRight,
  Plus,
  Zap,
  Layout,
  // Added Loader2 to fix the missing import error
  Loader2
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArticleMetadata, AppRoute } from '../types';
import { storageService } from '../storageService';

interface DashboardProps {
  onNewContent: () => void;
  onSelectArticle?: (id: string) => void;
}

const data = [
  { name: 'Mon', score: 40 },
  { name: 'Tue', score: 60 },
  { name: 'Wed', score: 45 },
  { name: 'Thu', score: 70 },
  { name: 'Fri', score: 85 },
  { name: 'Sat', score: 75 },
  { name: 'Sun', score: 90 },
];

const Dashboard: React.FC<DashboardProps> = ({ onNewContent, onSelectArticle }) => {
  const [registry, setRegistry] = useState<ArticleMetadata[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRegistry = async () => {
      setLoading(true);
      const data = await storageService.getRegistry();
      setRegistry(data);
      setLoading(false);
    };
    loadRegistry();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight italic">Content Hub</h1>
          <p className="text-gray-500 mt-1 font-medium">Performance analytics and synthesis pipeline control.</p>
        </div>
        <button 
          onClick={onNewContent}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center gap-3 transition-all shadow-xl shadow-indigo-100 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Create New Article
        </button>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Articles', val: registry.length.toString(), icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Avg SEO Score', val: registry.length ? `${Math.round(registry.reduce((acc, curr) => acc + curr.score, 0) / registry.length)}/100` : '0/100', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Keyword Nodes', val: '42', icon: Zap, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Uptime', val: '99.9%', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-start justify-between">
            <div>
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">{stat.label}</p>
              <h3 className="text-2xl font-black mt-2 tracking-tight italic">{stat.val}</h3>
            </div>
            <div className={`${stat.bg} p-3 rounded-2xl shadow-sm`}>
              <stat.icon className={`${stat.color} w-6 h-6`} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[48px] border border-gray-100 shadow-sm">
          <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-8 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-600" /> Progression Map
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 800, fontSize: '12px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#4f46e5" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorScore)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[48px] border border-gray-100 shadow-sm relative">
          <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-8 flex items-center gap-2">
            <Layout className="w-4 h-4 text-indigo-600" /> Active Drafts
          </h3>
          <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
            {loading ? (
              <div className="flex flex-col items-center gap-4 py-20">
                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Fetching Cloud Nodes...</p>
              </div>
            ) : registry.length > 0 ? registry.map((item, i) => (
              <div 
                key={item.id} 
                onClick={() => onSelectArticle?.(item.id)}
                className="flex items-center justify-between p-4 rounded-3xl hover:bg-indigo-50/50 border border-transparent hover:border-indigo-100 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${item.score > 80 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-gray-900 line-clamp-1 group-hover:text-indigo-600 transition-colors tracking-tight italic">{item.title}</h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Score: {item.score}/100</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-600 transition-all group-hover:translate-x-1" />
              </div>
            )) : (
              <div className="text-center py-20">
                <p className="text-xs font-black text-gray-300 uppercase tracking-widest italic">Registry empty.</p>
              </div>
            )}
          </div>
          <button onClick={() => window.location.hash = '#history'} className="w-full mt-6 py-3 text-xs font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-widest border border-indigo-50 rounded-2xl transition-colors">
            View Repository Archive
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
