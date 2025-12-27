
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
  Binary,
  Link2,
  Users
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
  const [competitorInput, setCompetitorInput] = useState('');
  const [backlinkInput, setBacklinkInput] = useState('');
  const [statusLogs, setStatusLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  
  const [brief, setBrief] = useState<Partial<ContentBrief>>({
    id: Math.random().toString(36).substring(2, 15),
    topic: '',
    companyUrl: '',
    competitorUrls: [],
    backlinkUrls: [],
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
      'Mapping competitor footprints...',
      'Synthesizing backlink relevance...',
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
      
      const competitors = competitorInput.split(',').map(s => s.trim()).filter(s => !!s);
      const backlinks = backlinkInput.split(',').map(s => s.trim()).filter(s => !!s);

      setTimeout(() => {
        setBrief(prev => ({ 
          ...prev, 
          topic, 
          companyUrl,
          competitorUrls: competitors,
          backlinkUrls: backlinks,
          ...details,
        }));
        setStep(2);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error(error);
      clearInterval(interval);
      addLog('CRITICAL ERROR: Analysis sequence interrupted.');
      setLoading(false);
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
              <h2 className="text-6xl font-black text-gray-900 tracking-tighter italic uppercase">Source Discovery</h2>
              <p className="text-gray-400 text-xl leading-relaxed">Map your discourse vector with competitive benchmarking.</p>
            </div>
            
            <div className="space-y-6 text-left">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.4em] ml-1">Topic node</label>
                <input
                  type="text"
                  placeholder="e.g. Cognitive Load Theory in Interface Design"
                  className="w-full px-10 py-6 bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-[32px] outline-none text-xl transition-all font-bold shadow-inner"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.4em] ml-1 flex items-center gap-2">
                      Competitors <Users className="w-3 h-3" />
                    </label>
                    <input
                      type="text"
                      placeholder="comma separated URLs"
                      className="w-full px-8 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-[24px] outline-none text-sm transition-all font-bold"
                      value={competitorInput}
                      onChange={(e) => setCompetitorInput(e.target.value)}
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.4em] ml-1 flex items-center gap-2">
                      Backlinks <Link2 className="w-3 h-3" />
                    </label>
                    <input
                      type="text"
                      placeholder="URLs to link back to"
                      className="w-full px-8 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-[24px] outline-none text-sm transition-all font-bold"
                      value={backlinkInput}
                      onChange={(e) => setBacklinkInput(e.target.value)}
                    />
                 </div>
              </div>

              {loading ? (
                <div className="bg-gray-900 rounded-[40px] p-10 space-y-6 border border-gray-800 animate-in zoom-in-95">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20">
                          <Binary className="w-5 h-5 text-indigo-400 animate-pulse" />
                       </div>
                       <span className="text-white font-black text-xs uppercase tracking-widest italic">Intelligence synthesis</span>
                    </div>
                    <span className="text-indigo-400 font-mono text-lg">{progress}%</span>
                  </div>
                  <div className="space-y-2 font-mono text-[11px] text-left">
                    {statusLogs.map((log, i) => (
                      <p key={i} className={`${i === statusLogs.length - 1 ? 'text-indigo-300' : 'text-gray-600'}`}>
                        > {log}
                      </p>
                    ))}
                  </div>
                </div>
              ) : (
                <button
                  disabled={!topic.trim() || loading}
                  onClick={handleInitialAnalysis}
                  className="w-full py-7 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-100 text-white rounded-[40px] font-black text-xl flex items-center justify-center gap-6 transition-all shadow-xl mt-4 active:scale-95"
                >
                  <Sparkles className="w-8 h-8" /> START INTELLIGENCE GATHERING
                </button>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-10 animate-in fade-in zoom-in-95 duration-700">
            <div className="flex items-center justify-between border-b pb-6">
              <h2 className="text-3xl font-black text-gray-900 tracking-tight italic uppercase">Semantic Brief</h2>
              <button onClick={() => setStep(1)} className="p-3 bg-gray-50 rounded-2xl text-gray-400 hover:text-indigo-600 transition-all border">
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-12">
              <div className="space-y-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">Primary keywords</label>
                  <div className="flex flex-wrap gap-2">
                    {brief.targetKeywords?.map((k, i) => (
                      <span key={i} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">{k}</span>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">Strategy summary</label>
                  <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800">
                    <p className="text-slate-400 text-sm italic font-medium">Competitors: {brief.competitorUrls?.length || 0} nodes mapped</p>
                    <p className="text-slate-400 text-sm italic font-medium mt-1">Backlinks: {brief.backlinkUrls?.length || 0} injection points</p>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">Audience vector</label>
                  <input className="w-full px-6 py-4 bg-gray-50 border rounded-2xl font-black text-gray-800" value={brief.audience || ''} onChange={e => setBrief({...brief, audience: e.target.value})} />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">Synthesis tone</label>
                  <select className="w-full px-6 py-4 bg-gray-50 border rounded-2xl font-black text-gray-800 appearance-none" value={brief.tone || ''} onChange={e => setBrief({...brief, tone: e.target.value})}>
                    <option>Professional & Authoritative</option>
                    <option>Futuristic & Bold</option>
                    <option>Technical & Academic</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-8 flex justify-end">
              <button onClick={generateOutline} disabled={loading} className="bg-indigo-600 text-white px-10 py-5 rounded-[32px] font-black text-lg flex items-center gap-4 shadow-xl hover:scale-105 transition-all">
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>MAP STRUCTURAL HIERARCHY <ArrowRight className="w-6 h-6" /></>}
              </button>
            </div>
          </div>
        )}

        {step === 3 && outline && (
          <div className="space-y-10 animate-in slide-in-from-right-16 duration-700">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight italic uppercase border-b pb-6">Structural Architecture</h2>
            <div className="bg-gray-50 rounded-[40px] p-10 border space-y-8 max-h-[500px] overflow-y-auto custom-scrollbar">
              <h3 className="text-3xl font-black text-indigo-700 italic tracking-tighter">{outline.title}</h3>
              {outline.sections?.map((section, idx) => (
                <div key={idx} className="bg-white p-8 rounded-3xl border shadow-sm">
                  <h4 className="font-black text-gray-900 text-xl tracking-tighter italic mb-4">{idx + 1}. {section.heading}</h4>
                  <ul className="space-y-2 ml-8">
                    {section.subheadings?.map((sub, sIdx) => (
                      <li key={sIdx} className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-indigo-100" /> {sub}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="pt-8 flex justify-between items-center">
              <button onClick={() => setStep(2)} className="text-gray-300 font-black uppercase text-[10px] tracking-widest">Back</button>
              <button onClick={() => onComplete(brief as ContentBrief, outline)} className="bg-indigo-600 text-white px-12 py-6 rounded-[32px] font-black text-xl flex items-center gap-6 shadow-xl hover:scale-105 active:scale-95 transition-all">
                INITIALIZE SYNTHESIS <Sparkles className="w-7 h-7" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentWizard;
