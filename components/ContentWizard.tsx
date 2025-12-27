
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
  FileText
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
    detailLevel: 'standard',
    status: 'draft',
    author: {
      name: 'Content Expert',
      title: 'Senior Strategist',
      bio: 'Professional writer with expertise in industry analysis and digital growth.'
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
    addLog(`Protocol initiated for: ${topic}`);

    try {
      addLog('Scanning digital discourse...');
      setProgress(30);
      const research = await geminiService.deepResearch(topic);
      
      addLog(`Competitor nodes mapped (${research.competitorUrls?.length || 0}).`);
      addLog(`Authority links identified (${research.backlinkUrls?.length || 0}).`);
      setProgress(70);
      
      const newBrief = {
        ...brief,
        ...research,
        topic: topic
      } as ContentBrief;
      
      setBrief(newBrief);
      addLog('Generating semantic structure...');
      setProgress(90);
      
      const generatedOutline = await geminiService.generateOutline(newBrief);
      setOutline(generatedOutline);
      setProgress(100);
      addLog('Strategy node finalized.');
      
      setTimeout(() => {
        setStep(2);
        setLoading(false);
      }, 600);
    } catch (e) {
      addLog('Protocol error. Check connection.');
      setLoading(false);
    }
  };

  const lengthOptions: { value: ContentBrief['length']; label: string }[] = [
    { value: 'short', label: 'Short' },
    { value: 'medium', label: 'Medium' },
    { value: 'long', label: 'Long' }
  ];

  const detailOptions: { value: ContentBrief['detailLevel']; label: string }[] = [
    { value: 'summary', label: 'Summary' },
    { value: 'standard', label: 'Standard' },
    { value: 'detailed', label: 'Very Detailed' }
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500 py-6">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-10 md:p-14 relative overflow-hidden">
        
        {step === 1 && (
          <div className="space-y-10 animate-in fade-in zoom-in-95">
            <div className="text-center space-y-3">
              <h2 className="text-4xl font-bold text-slate-900 tracking-tight italic uppercase">Deep Research</h2>
              <p className="text-slate-500 font-medium">Automate competitor mapping, keyword analysis, and link discovery.</p>
            </div>

            <div className="space-y-6">
              <div className="relative group">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                  <Globe className="w-6 h-6" />
                </div>
                <input
                  type="text"
                  placeholder="Enter topic or website URL..."
                  className="w-full pl-16 pr-6 py-5 bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none text-lg transition-all font-bold placeholder:text-slate-300"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleDeepResearch()}
                />
              </div>

              {loading ? (
                <div className="bg-slate-900 rounded-2xl p-6 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between text-white">
                    <span className="font-bold text-[10px] uppercase tracking-widest text-indigo-400">In Progress</span>
                    <span className="text-indigo-400 font-mono text-xs">{progress}%</span>
                  </div>
                  <div className="space-y-1">
                    {statusLogs.map((log, i) => (
                      <p key={i} className={`font-mono text-[10px] ${i === statusLogs.length - 1 ? 'text-indigo-300' : 'text-slate-600'}`}>{log}</p>
                    ))}
                  </div>
                </div>
              ) : (
                <button onClick={handleDeepResearch} disabled={!topic.trim()} className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl font-bold text-base flex items-center justify-center gap-3 shadow-md transition-all active:scale-95">
                  <Sparkles className="w-5 h-5" /> Start Research
                </button>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
            <div className="flex items-center justify-between border-b border-slate-100 pb-6">
               <h2 className="text-2xl font-bold text-slate-900 italic">Strategy Node</h2>
               <button onClick={() => setStep(1)} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-400 hover:text-indigo-600 transition-all"><RefreshCw className="w-4 h-4" /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {/* Column 1: Config & Keywords */}
               <div className="space-y-6">
                  {/* Content Configuration */}
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-5">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <Scale className="w-3 h-3" /> Content Length
                      </div>
                      <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                        {lengthOptions.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => setBrief({ ...brief, length: opt.value })}
                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                              brief.length === opt.value ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <FileText className="w-3 h-3" /> Detail Level
                      </div>
                      <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                        {detailOptions.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => setBrief({ ...brief, detailLevel: opt.value })}
                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                              brief.detailLevel === opt.value ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-indigo-50/30 rounded-2xl border border-indigo-100 space-y-3">
                     <h3 className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Target Keywords</h3>
                     <div className="flex flex-wrap gap-1.5">
                        {brief.targetKeywords?.map((k, i) => <span key={i} className="px-2.5 py-1 bg-white border border-indigo-100 text-[9px] font-bold uppercase text-indigo-600 rounded-md">{k}</span>)}
                     </div>
                  </div>
               </div>

               {/* Column 2: Author & Research */}
               <div className="space-y-6">
                  <div className="space-y-3">
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Author Identity</label>
                     <div className="space-y-2">
                        <input className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-sm bg-slate-50 focus:bg-white focus:border-indigo-500 transition-all outline-none" placeholder="Name" value={brief.author?.name} onChange={e => setBrief({...brief, author: {...brief.author!, name: e.target.value}})} />
                        <input className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-sm bg-slate-50 focus:bg-white focus:border-indigo-500 transition-all outline-none" placeholder="Title" value={brief.author?.title} onChange={e => setBrief({...brief, author: {...brief.author!, title: e.target.value}})} />
                     </div>
                  </div>
                  <div className="p-6 bg-slate-900 rounded-2xl text-white space-y-2 border border-slate-800">
                     <div className="flex items-center gap-2 mb-1">
                        <Info className="w-3 h-3 text-indigo-400" />
                        <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest italic">Research Digest</p>
                     </div>
                     <p className="text-xs font-medium leading-relaxed opacity-70">
                       Research identifies high semantic volume for "{brief.topic}". Adhering to {brief.length} length and {brief.detailLevel} detail will optimize authority signals.
                     </p>
                  </div>
               </div>
            </div>

            <button onClick={() => onComplete(brief as ContentBrief, outline!)} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-3 shadow-lg hover:bg-indigo-700 active:scale-95 transition-all">
              Synthesize Authority Content <Zap className="w-6 h-6 fill-current" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentWizard;
