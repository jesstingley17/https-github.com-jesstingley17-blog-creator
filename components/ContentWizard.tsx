
import React, { useState } from 'react';
import { 
  Search, 
  ArrowRight, 
  Loader2, 
  CheckCircle2, 
  Layout, 
  Target,
  Sparkles,
  RefreshCw,
  Globe,
  Binary,
  Link2,
  Users,
  UserPlus,
  Zap,
  MousePointer2,
  Database
} from 'lucide-react';
import { geminiService } from '../geminiService';
import { ContentBrief, ContentOutline } from '../types';

interface ContentWizardProps {
  onComplete: (brief: ContentBrief, outline: ContentOutline) => void;
}

const ContentWizard: React.FC<ContentWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState('');
  const [statusLogs, setStatusLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  
  const [brief, setBrief] = useState<Partial<ContentBrief>>({
    id: Math.random().toString(36).substring(2, 15),
    topic: '',
    competitorUrls: [],
    backlinkUrls: [],
    targetKeywords: [],
    secondaryKeywords: [],
    audience: 'Professional Audience',
    tone: 'Professional & Authoritative',
    length: 'medium',
    status: 'draft',
    author: {
      name: 'Author Name',
      title: 'Senior Strategist',
      bio: 'Professional content creator with expertise in SEO and high-value discourse.'
    },
    createdAt: Date.now()
  });

  const [outline, setOutline] = useState<ContentOutline | null>(null);

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    setStatusLogs(prev => [...prev.slice(-5), `[${timestamp}] ${msg}`]);
  };

  const handleDeepResearch = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setProgress(10);
    setStatusLogs([]);
    addLog(`Initializing research protocol for: ${topic}`);

    try {
      addLog('Scanning global discourse nodes...');
      setProgress(30);
      const research = await geminiService.deepResearch(topic);
      
      addLog(`Found ${research.competitorUrls?.length} competitors automatically.`);
      addLog(`Mapped ${research.backlinkUrls?.length} high-authority backlink nodes.`);
      setProgress(60);
      
      const newBrief = {
        ...brief,
        ...research,
        topic: topic
      } as ContentBrief;
      
      setBrief(newBrief);
      addLog('Drafting semantic hierarchy...');
      setProgress(85);
      
      const generatedOutline = await geminiService.generateOutline(newBrief);
      setOutline(generatedOutline);
      setProgress(100);
      addLog('Architecture complete. Ready for synthesis.');
      
      setTimeout(() => {
        setStep(2);
        setLoading(false);
      }, 1000);
    } catch (e) {
      addLog('CRITICAL: Research nodes unresponsive.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-700">
      <div className="bg-white rounded-[60px] border border-gray-100 shadow-[0_50px_100px_rgba(0,0,0,0.05)] p-16 min-h-[500px] flex flex-col justify-center relative overflow-hidden">
        
        {step === 1 && (
          <div className="space-y-12 animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center space-y-4">
              <h2 className="text-6xl font-black text-gray-900 tracking-tighter italic uppercase">Automated Intelligence</h2>
              <p className="text-gray-400 text-xl font-medium">Enter a URL or Topic. We'll find the competitors, keywords, and backlinks.</p>
            </div>

            <div className="space-y-6">
              <div className="relative group">
                <div className="absolute left-8 top-1/2 -translate-y-1/2 text-indigo-400 group-focus-within:text-indigo-600 transition-colors">
                  <Globe className="w-8 h-8" />
                </div>
                <input
                  type="text"
                  placeholder="Paste URL or type Topic here..."
                  className="w-full pl-24 pr-10 py-8 bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-[40px] outline-none text-2xl transition-all font-bold shadow-inner"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleDeepResearch()}
                />
              </div>

              {loading ? (
                <div className="bg-slate-900 rounded-[40px] p-10 space-y-6 animate-pulse">
                  <div className="flex items-center justify-between text-white">
                    <span className="font-black text-xs uppercase tracking-widest italic">Research in progress</span>
                    <span className="text-indigo-400 font-mono">{progress}%</span>
                  </div>
                  <div className="space-y-2">
                    {statusLogs.map((log, i) => (
                      <p key={i} className={`font-mono text-[11px] ${i === statusLogs.length - 1 ? 'text-indigo-300' : 'text-slate-600'}`}>{log}</p>
                    ))}
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleDeepResearch}
                  disabled={!topic.trim()}
                  className="w-full py-7 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-[40px] font-black text-xl flex items-center justify-center gap-6 shadow-2xl transition-all active:scale-95"
                >
                  <Sparkles className="w-8 h-8" /> START AI RESEARCH
                </button>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-10 animate-in slide-in-from-right-16 duration-700">
            <div className="flex items-center justify-between border-b border-gray-100 pb-8">
               <h2 className="text-4xl font-black text-gray-900 italic uppercase tracking-tighter">Strategy Node</h2>
               <button onClick={() => setStep(1)} className="p-4 bg-gray-50 rounded-2xl border text-gray-400"><RefreshCw className="w-5 h-5" /></button>
            </div>

            <div className="grid grid-cols-2 gap-12">
               <div className="space-y-8">
                  <div className="p-8 bg-indigo-50/30 rounded-[40px] border border-indigo-100 space-y-4">
                     <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Target Keywords</h3>
                     <div className="flex flex-wrap gap-2">
                        {brief.targetKeywords?.map((k, i) => <span key={i} className="px-3 py-1 bg-white border border-indigo-100 text-[10px] font-black uppercase text-indigo-600 rounded-lg">{k}</span>)}
                     </div>
                  </div>
                  <div className="p-8 bg-gray-50 rounded-[40px] border border-gray-100 space-y-4">
                     <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Competitors Mapped</h3>
                     <div className="space-y-2">
                        {brief.competitorUrls?.map((u, i) => <p key={i} className="text-[10px] font-bold text-slate-500 truncate">{u}</p>)}
                     </div>
                  </div>
               </div>

               <div className="space-y-8">
                  <div className="space-y-4">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Author Profile</label>
                     <div className="space-y-3">
                        <input className="w-full px-5 py-3 rounded-2xl border border-gray-100 font-bold text-sm" placeholder="Name" value={brief.author?.name} onChange={e => setBrief({...brief, author: {...brief.author!, name: e.target.value}})} />
                        <input className="w-full px-5 py-3 rounded-2xl border border-gray-100 font-bold text-sm" placeholder="Title" value={brief.author?.title} onChange={e => setBrief({...brief, author: {...brief.author!, title: e.target.value}})} />
                     </div>
                  </div>
                  <div className="p-8 bg-slate-900 rounded-[40px] text-white space-y-2">
                     <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest italic">Research Summary</p>
                     <p className="text-xs font-medium leading-relaxed opacity-70">AI has mapped ${brief.competitorUrls?.length} competitors and ${brief.backlinkUrls?.length} backlink nodes based on your input.</p>
                  </div>
               </div>
            </div>

            <button onClick={() => onComplete(brief as ContentBrief, outline!)} className="w-full py-8 bg-indigo-600 text-white rounded-[40px] font-black text-2xl flex items-center justify-center gap-6 shadow-2xl hover:scale-[1.02] active:scale-95 transition-all">
              SYNTHESIZE CONTENT <Zap className="w-8 h-8" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentWizard;
