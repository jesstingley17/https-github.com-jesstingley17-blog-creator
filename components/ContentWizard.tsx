
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
  Info,
  Binary
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
  const [companyUrl, setCompanyUrl] = useState('');
  const [statusLogs, setStatusLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  
  const [brief, setBrief] = useState<Partial<ContentBrief>>({
    id: Math.random().toString(36).substring(2, 15),
    topic: '',
    companyUrl: '',
    brandContext: '',
    targetKeywords: [],
    secondaryKeywords: [],
    audience: 'Professional Stakeholders',
    tone: 'Authoritative & Strategic',
    length: 'medium',
    status: 'draft',
    createdAt: Date.now()
  });

  const [outline, setOutline] = useState<ContentOutline | null>(null);

  const addLog = (msg: string) => {
    setStatusLogs(prev => [...prev.slice(-4), msg]);
  };

  const handleInitialAnalysis = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setProgress(5);
    setStatusLogs(['Initializing intelligence core...', 'Connecting to semantic web...']);
    
    const logs = [
      'Analyzing topic clusters...',
      'Crawling competitor blueprints...',
      'Synthesizing brand resonance...',
      'Mapping semantic networks...',
      'Finalizing strategic brief...'
    ];
    
    let logIdx = 0;
    const interval = setInterval(() => {
      if (logIdx < logs.length) {
        addLog(logs[logIdx]);
        setProgress(prev => Math.min(prev + 18, 95));
        logIdx++;
      }
    }, 1200);

    try {
      const details = await geminiService.generateBriefDetails(topic, companyUrl);
      clearInterval(interval);
      setProgress(100);
      setTimeout(() => {
        setBrief(prev => ({ 
          ...prev, 
          topic, 
          companyUrl, 
          ...details,
          targetKeywords: details.targetKeywords || [topic],
          secondaryKeywords: details.secondaryKeywords || []
        }));
        setStep(2);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error(error);
      clearInterval(interval);
      addLog('CRITICAL ERROR: Analysis sequence interrupted.');
      setLoading(false);
      setProgress(0);
    }
  };

  const generateOutline = async () => {
    setLoading(true);
    try {
      const generatedOutline = await geminiService.generateOutline(brief as ContentBrief);
      setOutline(generatedOutline);
      setStep(3);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { num: 1, label: 'Research', icon: Search },
    { num: 2, label: 'Strategy', icon: Target },
    { num: 3, label: 'Structure', icon: Layout },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in slide-in-from-bottom-8 duration-700">
      <div className="flex items-center justify-between px-16">
        {steps.map((s, i) => (
          <React.Fragment key={s.num}>
            <div className="flex flex-col items-center gap-4 relative z-10">
              <div className={`w-14 h-14 rounded-[22px] flex items-center justify-center transition-all duration-700 ${
                step >= s.num ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-200 scale-110' : 'bg-white border border-gray-100 text-gray-300'
              }`}>
                {step > s.num ? <CheckCircle2 className="w-7 h-7" /> : <s.icon className="w-7 h-7" />}
              </div>
              <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${step >= s.num ? 'text-indigo-600' : 'text-gray-300'}`}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="flex-1 px-6 mb-10">
                <div className={`h-1.5 rounded-full transition-all duration-1000 ${step > s.num ? 'bg-indigo-600' : 'bg-gray-100'}`} />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="bg-white rounded-[60px] border border-gray-100 shadow-[0_50px_100px_rgba(0,0,0,0.05)] p-16 min-h-[650px] flex flex-col relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-50/30 rounded-full blur-[120px] -mr-64 -mt-64 pointer-events-none" />
        
        {step === 1 && (
          <div className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full text-center space-y-12 relative z-10 animate-in fade-in duration-500">
            <div className="space-y-6">
              <h2 className="text-6xl font-black text-gray-900 tracking-tighter italic">SOURCE DISCOVERY</h2>
              <p className="text-gray-400 text-xl leading-relaxed">Define your semantic vector. We will extract intelligence from the competitive landscape to build your foundation.</p>
            </div>
            
            <div className="space-y-8 text-left">
              <div className="space-y-3">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.4em] ml-1">PRIMARY DISCOURSE TOPIC</label>
                <input
                  type="text"
                  placeholder="e.g. Cognitive Load Theory in Interface Design"
                  className="w-full px-10 py-6 bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-[32px] outline-none text-2xl transition-all font-bold shadow-inner placeholder:text-gray-200"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.4em] ml-1 flex items-center gap-2">
                  CONTEXT URL <Info className="w-4 h-4 text-indigo-200" />
                </label>
                <div className="relative">
                  <Globe className="absolute left-8 top-1/2 -translate-y-1/2 w-7 h-7 text-gray-300 pointer-events-none" />
                  <input
                    type="url"
                    placeholder="https://brand.identity"
                    className="w-full pl-20 pr-10 py-6 bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-[32px] outline-none text-2xl transition-all font-bold shadow-inner placeholder:text-gray-200"
                    value={companyUrl}
                    onChange={(e) => setCompanyUrl(e.target.value)}
                  />
                </div>
              </div>

              {loading ? (
                <div className="bg-gray-900 rounded-[40px] p-10 space-y-8 shadow-2xl border border-gray-800 animate-in zoom-in-95 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gray-800">
                    <div className="h-full bg-indigo-500 transition-all duration-700 ease-out" style={{ width: `${progress}%` }} />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20">
                          <Binary className="w-6 h-6 text-indigo-400 animate-pulse" />
                       </div>
                       <div>
                         <p className="text-white font-black text-sm uppercase tracking-widest italic">Intelligence Core</p>
                         <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">Synthesis active</p>
                       </div>
                    </div>
                    <span className="text-indigo-400 font-mono text-xl tabular-nums">{progress}%</span>
                  </div>

                  <div className="space-y-3 font-mono text-sm leading-tight border-t border-gray-800 pt-6">
                    {statusLogs.map((log, i) => (
                      <p key={i} className={`${i === statusLogs.length - 1 ? 'text-indigo-300' : 'text-gray-600'} flex gap-3 animate-in slide-in-from-left-2`}>
                        <span className="text-gray-800">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
                        <span>{i === statusLogs.length - 1 ? '> ' : '  '}{log}</span>
                      </p>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 pt-4">
                    <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                       <div className="h-full bg-indigo-600 animate-pulse" style={{ width: '40%' }} />
                    </div>
                    <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                  </div>
                </div>
              ) : (
                <button
                  disabled={!topic.trim() || loading}
                  onClick={handleInitialAnalysis}
                  className="w-full py-8 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-100 text-white rounded-[40px] font-black text-2xl flex items-center justify-center gap-6 transition-all shadow-[0_30px_60px_rgba(79,70,229,0.3)] mt-4 group/btn active:scale-95"
                >
                  <Sparkles className="w-10 h-10 group-hover/btn:rotate-12 transition-transform" /> START INTELLIGENCE GATHERING
                </button>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-12 animate-in fade-in zoom-in-95 duration-700">
            <div className="flex items-center justify-between border-b pb-8">
              <div>
                <h2 className="text-4xl font-black text-gray-900 tracking-tight italic">SEMANTIC BRIEF</h2>
                <p className="text-gray-400 text-lg mt-1 font-medium">Strategic alignment based on discovered discourse patterns.</p>
              </div>
              <button onClick={() => setStep(1)} className="p-4 bg-gray-50 rounded-3xl text-gray-400 hover:text-indigo-600 transition-all hover:bg-white border hover:border-indigo-100">
                <RefreshCw className="w-7 h-7" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
              <div className="space-y-10">
                <div className="space-y-5">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.4em] block">PRIMARY SEMANTIC TARGETS</label>
                  <div className="flex flex-wrap gap-3">
                    {brief.targetKeywords?.length ? brief.targetKeywords.map((k, i) => (
                      <span key={i} className="px-6 py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-100">{k}</span>
                    )) : <span className="text-gray-300 italic text-xs font-bold">No keywords identified</span>}
                  </div>
                </div>

                <div className="space-y-5">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.4em] block">SECONDARY NODES</label>
                  <div className="flex flex-wrap gap-3">
                    {brief.secondaryKeywords?.length ? brief.secondaryKeywords.map((k, i) => (
                      <span key={i} className="px-6 py-4 bg-white border border-gray-200 text-gray-500 rounded-2xl text-xs font-bold uppercase tracking-widest hover:border-indigo-400 transition-colors">{k}</span>
                    )) : <span className="text-gray-300 italic text-xs font-bold">No secondary nodes found</span>}
                  </div>
                </div>
              </div>

              <div className="space-y-10">
                <div className="space-y-5">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.4em] block">DISCOURSE AUDIENCE</label>
                  <input 
                    className="w-full px-8 py-5 bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-3xl outline-none font-black text-gray-800 text-lg transition-all shadow-inner"
                    value={brief.audience || ''}
                    onChange={(e) => setBrief({...brief, audience: e.target.value})}
                  />
                </div>

                <div className="space-y-5">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.4em] block">CONTENT RESONANCE TONE</label>
                  <select 
                    className="w-full px-8 py-5 bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-3xl outline-none font-black text-gray-800 text-lg transition-all shadow-inner appearance-none cursor-pointer"
                    value={brief.tone || 'Professional'}
                    onChange={(e) => setBrief({...brief, tone: e.target.value})}
                  >
                    <option>Professional & Authoritative</option>
                    <option>Futuristic & Bold</option>
                    <option>Technical & Academic</option>
                    <option>Conversational & Human</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-12 flex justify-end">
              <button 
                onClick={generateOutline}
                disabled={loading}
                className="bg-indigo-600 text-white px-12 py-6 rounded-[32px] font-black text-xl flex items-center gap-4 shadow-[0_20px_50px_rgba(79,70,229,0.3)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : <>MAP STRUCTURAL HIERARCHY <ArrowRight className="w-8 h-8" /></>}
              </button>
            </div>
          </div>
        )}

        {step === 3 && outline && (
          <div className="space-y-12 animate-in slide-in-from-right-16 duration-700">
            <div className="flex items-center justify-between border-b pb-8">
              <div>
                <h2 className="text-4xl font-black text-gray-900 tracking-tight italic">STRUCTURAL ARCHITECTURE</h2>
                <p className="text-gray-400 text-lg mt-1 font-medium">Hierarchical mapping complete. Finalize information flow.</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-[50px] p-12 border-2 border-indigo-50 space-y-10 max-h-[550px] overflow-y-auto custom-scrollbar shadow-inner">
              <h3 className="text-4xl font-black text-indigo-700 leading-tight italic tracking-tighter">{outline.title}</h3>
              <div className="grid grid-cols-1 gap-8">
                {outline.sections?.map((section, idx) => (
                  <div key={idx} className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm relative group hover:shadow-2xl transition-all duration-500">
                    <div className="flex items-center gap-6 mb-8">
                      <span className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-lg font-black shadow-xl shadow-indigo-100">{idx + 1}</span>
                      <h4 className="font-black text-gray-900 text-2xl tracking-tighter italic">{section.heading}</h4>
                    </div>
                    <ul className="space-y-4 ml-16">
                      {section.subheadings?.map((sub, sIdx) => (
                        <li key={sIdx} className="text-sm font-black text-gray-400 flex items-center gap-4 uppercase tracking-widest">
                          <div className="w-3 h-3 rounded-full bg-indigo-100 group-hover:bg-indigo-500 transition-colors" />
                          {sub}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-12 flex justify-between items-center">
              <button onClick={() => setStep(2)} className="text-gray-300 font-black uppercase tracking-[0.3em] text-[11px] hover:text-indigo-600 transition-colors">Return to Brief</button>
              <button 
                onClick={() => onComplete(brief as ContentBrief, outline)}
                className="bg-indigo-600 text-white px-16 py-7 rounded-[40px] font-black text-2xl flex items-center gap-6 shadow-[0_30px_70px_rgba(79,70,229,0.3)] hover:scale-105 active:scale-95 transition-all"
              >
                INITIALIZE SYNTHESIS <Sparkles className="w-8 h-8" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentWizard;
