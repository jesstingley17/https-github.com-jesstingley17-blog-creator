
import React, { useState } from 'react';
import { 
  ArrowRight, 
  Loader2, 
  Sparkles, 
  RefreshCw, 
  Globe, 
  Zap,
  Info,
  Scale,
  FileText,
  Wand2,
  X,
  Check,
  Save,
  Link as LinkIcon,
  Heart,
  Star,
  Anchor,
  PenTool
} from 'lucide-react';
import { geminiService } from '../geminiService';
import { storageService } from '../storageService';
import { ContentBrief, ContentOutline, SavedPrompt } from '../types';

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
    detailLevel: 'standard',
    status: 'draft',
    author: {
      name: 'Anchor Admin',
      title: 'Head of Charts',
      bio: 'Professional magic user specializing in nautical authority synthesis.'
    },
    createdAt: Date.now()
  });

  const [outline, setOutline] = useState<ContentOutline | null>(null);

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    setStatusLogs(prev => [...prev.slice(-4), `[${timestamp}] ${msg}`]);
  };

  const handleDeepResearch = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setProgress(10);
    setStatusLogs([]);
    addLog(`Setting sail for: ${topic}`);

    try {
      addLog('Consulting the star charts...');
      setProgress(30);
      const research = await geminiService.deepResearch(topic);
      
      addLog(`Rivals spotted on horizon (${research.competitorUrls?.length || 0}).`);
      addLog(`Safe harbors found (${research.backlinkUrls?.length || 0}).`);
      setProgress(70);
      
      const newBrief = {
        ...brief,
        ...research,
        topic: topic
      } as ContentBrief;
      
      setBrief(newBrief);
      addLog('Drafting the anchor chart...');
      setProgress(90);
      
      const generatedOutline = await geminiService.generateOutline(newBrief);
      setOutline(generatedOutline);
      setProgress(100);
      addLog('The map is drawn.');
      
      setTimeout(() => {
        setStep(2);
        setLoading(false);
      }, 800);
    } catch (e) {
      addLog('Stormy weather. Try again!');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-700 py-10">
      <div className="bg-white rounded-[64px] border border-pink-50 shadow-2xl p-16 md:p-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-50/40 rounded-full blur-[100px] -mr-48 -mt-48 opacity-50" />
        
        {step === 1 && (
          <div className="space-y-12 animate-in zoom-in-95">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner relative">
                <Anchor className="w-10 h-10 text-pink-500" />
                <PenTool className="w-4 h-4 text-pink-300 absolute bottom-3 right-3" />
              </div>
              <h2 className="text-5xl font-black text-slate-800 tracking-tighter italic uppercase cursive leading-none">Anchor Research</h2>
              <p className="text-pink-300 font-bold uppercase tracking-[0.3em] text-[11px]">Chart your course through the digital ocean.</p>
            </div>

            <div className="space-y-8">
              <div className="relative group">
                <div className="absolute left-8 top-1/2 -translate-y-1/2 text-pink-200 group-focus-within:text-pink-500 transition-colors">
                  <Globe className="w-7 h-7" />
                </div>
                <input
                  type="text"
                  placeholder="Drop anchor on a topic..."
                  className="w-full pl-20 pr-10 py-8 bg-pink-50/30 border-4 border-transparent focus:border-pink-200 focus:bg-white rounded-[40px] outline-none text-xl transition-all font-black text-slate-700 placeholder:text-pink-100 italic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleDeepResearch()}
                />
              </div>

              {loading ? (
                <div className="bg-slate-900 rounded-[40px] p-10 space-y-6 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 h-full bg-teal-400/10 transition-all duration-1000" style={{ width: `${progress}%` }} />
                  <div className="flex items-center justify-between text-white relative z-10">
                    <div className="flex items-center gap-3">
                      <Anchor className="w-5 h-5 text-teal-400 animate-bounce" />
                      <span className="font-black text-xs uppercase tracking-[0.4em] text-teal-400">Navigating {progress}%</span>
                    </div>
                  </div>
                  <div className="space-y-2 relative z-10">
                    {statusLogs.map((log, i) => (
                      <p key={i} className={`font-mono text-[11px] font-bold ${i === statusLogs.length - 1 ? 'text-teal-300' : 'text-slate-600'}`}>{log}</p>
                    ))}
                  </div>
                </div>
              ) : (
                <button onClick={handleDeepResearch} disabled={!topic.trim()} className="w-full py-7 girly-gradient hover:opacity-90 disabled:opacity-50 text-white rounded-[32px] font-black text-lg flex items-center justify-center gap-4 shadow-2xl shadow-pink-100 transition-all active:scale-95 group">
                  <Star className="w-6 h-6 group-hover:rotate-45 transition-transform" /> Deploy Probe
                </button>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-12 animate-in slide-in-from-right-12 duration-700">
            <div className="flex items-center justify-between border-b border-pink-50 pb-8">
               <h2 className="text-3xl font-black text-slate-800 italic cursive">Ship's Manifesto</h2>
               <button onClick={() => setStep(1)} className="p-3 bg-pink-50 rounded-2xl border border-pink-100 text-pink-400 hover:text-pink-600 transition-all"><RefreshCw className="w-5 h-5" /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
               <div className="space-y-10">
                  <div className="p-8 bg-pink-50/50 rounded-[40px] border border-pink-100 space-y-8">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-[10px] font-black text-pink-300 uppercase tracking-widest">
                        <Scale className="w-4 h-4" /> Voyage Length
                      </div>
                      <div className="flex bg-white p-2 rounded-2xl border border-pink-100 shadow-sm">
                        {['short', 'medium', 'long'].map((val) => (
                          <button
                            key={val}
                            onClick={() => setBrief({ ...brief, length: val as any })}
                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                              brief.length === val ? 'bg-pink-600 text-white shadow-lg' : 'text-pink-200 hover:bg-pink-50'
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
               </div>

               <div className="space-y-8">
                  <div className="space-y-4">
                     <label className="text-[10px] font-black text-pink-300 uppercase tracking-[0.3em] ml-3">Anchor Captain</label>
                     <div className="space-y-3">
                        <input className="w-full px-8 py-5 rounded-[28px] border-2 border-pink-50 font-black text-sm bg-white focus:border-pink-300 transition-all outline-none" placeholder="Captain Name" value={brief.author?.name} onChange={e => setBrief({...brief, author: {...brief.author!, name: e.target.value}})} />
                        <input className="w-full px-8 py-5 rounded-[28px] border-2 border-pink-50 font-black text-sm bg-white focus:border-pink-300 transition-all outline-none" placeholder="Vessel Title" value={brief.author?.title} onChange={e => setBrief({...brief, author: {...brief.author!, title: e.target.value}})} />
                     </div>
                  </div>
               </div>
            </div>

            <button onClick={() => onComplete(brief as ContentBrief, outline!)} className="w-full py-8 girly-gradient text-white rounded-[32px] font-black text-xl flex items-center justify-center gap-4 shadow-2xl shadow-pink-100 hover:opacity-90 active:scale-95 transition-all group">
              Forging Authority <Sparkles className="w-7 h-7 group-hover:animate-spin" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentWizard;
