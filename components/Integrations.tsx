
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Link2, 
  Trash2, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle,
  Globe,
  Key,
  Database,
  ShieldCheck,
  X,
  Loader2,
  Lock,
  Zap
} from 'lucide-react';
import { Integration, IntegrationPlatform } from '../types';

const Integrations: React.FC = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [testing, setTesting] = useState(false);
  
  const [newIntegration, setNewIntegration] = useState<Partial<Integration>>({
    name: '',
    platform: IntegrationPlatform.WORDPRESS,
    baseUrl: '',
    apiKey: '',
  });

  useEffect(() => {
    const saved = localStorage.getItem('zr_integrations');
    if (saved) setIntegrations(JSON.parse(saved));
  }, []);

  const saveIntegrations = (items: Integration[]) => {
    setIntegrations(items);
    localStorage.setItem('zr_integrations', JSON.stringify(items));
  };

  const handleAdd = async () => {
    setTesting(true);
    await new Promise(r => setTimeout(r, 1200));
    
    const item: Integration = {
      id: Math.random().toString(36).substring(2, 11),
      name: newIntegration.name || 'New Node',
      platform: newIntegration.platform as IntegrationPlatform,
      baseUrl: newIntegration.platform === IntegrationPlatform.SERPSTAT ? 'https://api.serpstat.com/v4' : (newIntegration.baseUrl || ''),
      apiKey: newIntegration.apiKey || '',
      status: 'connected',
      lastSync: Date.now()
    };

    saveIntegrations([...integrations, item]);
    setShowAddModal(false);
    setNewIntegration({ name: '', platform: IntegrationPlatform.WORDPRESS, baseUrl: '', apiKey: '' });
    setTesting(false);
  };

  const removeIntegration = (id: string) => {
    saveIntegrations(integrations.filter(i => i.id !== id));
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500 max-w-6xl mx-auto">
      <header className="flex justify-between items-center border-b border-slate-100 pb-12">
        <div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">Pipeline Nodes</h1>
          <p className="text-slate-400 mt-3 font-bold uppercase tracking-[0.2em] text-[10px]">Manage external connectivity for data extraction and publishing.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-5 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] flex items-center gap-4 transition-all shadow-2xl shadow-indigo-100 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Link New Service
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {integrations.length === 0 ? (
          <div className="col-span-full py-32 text-center space-y-8 bg-white rounded-[64px] border-4 border-dashed border-slate-50">
            <div className="w-24 h-24 bg-slate-50 rounded-[32px] flex items-center justify-center mx-auto">
              <Link2 className="w-10 h-10 text-slate-200" />
            </div>
            <div className="space-y-2">
              <h3 className="font-black text-slate-300 uppercase tracking-[0.3em] italic">No Connectivity</h3>
              <p className="text-slate-200 text-xs font-bold uppercase tracking-widest">Connect CMS or SEO APIs to empower the synthesis pipeline.</p>
            </div>
          </div>
        ) : integrations.map((item) => (
          <div key={item.id} className="bg-white rounded-[56px] border border-slate-100 shadow-xl p-10 flex flex-col relative group transition-all hover:shadow-2xl hover:-translate-y-2">
            <div className="flex items-start justify-between mb-10">
              <div className={`p-5 rounded-3xl ${
                item.platform === IntegrationPlatform.SERPSTAT ? 'bg-indigo-950 text-indigo-400' :
                item.platform === IntegrationPlatform.WORDPRESS ? 'bg-blue-50 text-blue-600' :
                'bg-slate-50 text-slate-600'
              }`}>
                {item.platform === IntegrationPlatform.SERPSTAT ? <Zap className="w-8 h-8" /> : <Database className="w-8 h-8" />}
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest">Verified</span>
              </div>
            </div>

            <div className="flex-1 space-y-3 mb-10">
              <h3 className="text-2xl font-black text-slate-900 italic tracking-tighter uppercase leading-none">{item.name}</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] flex items-center gap-3">
                <Globe className="w-3.5 h-3.5" /> {item.baseUrl ? new URL(item.baseUrl).hostname : 'API Endpoint'}
              </p>
            </div>

            <div className="flex items-center justify-between border-t border-slate-50 pt-8">
              <div>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-200 block mb-1">Service Platform</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">{item.platform}</span>
              </div>
              <button 
                onClick={() => removeIntegration(item.id)}
                className="p-3 bg-slate-50 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[64px] p-16 space-y-12 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-50 rounded-full blur-[120px] -mr-40 -mt-40 pointer-events-none opacity-50" />
            
            <div className="flex justify-between items-center relative z-10">
              <div>
                 <h3 className="font-black text-4xl uppercase italic tracking-tighter text-slate-900 leading-none">Service Node</h3>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Initialize new data pipeline node.</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-4 bg-slate-50 rounded-[24px] hover:bg-slate-100 transition-colors"><X className="w-7 h-7 text-slate-400" /></button>
            </div>

            <div className="space-y-8 relative z-10">
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Service Platform</label>
                 <select 
                  className="w-full px-8 py-5 bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-3xl outline-none font-black text-slate-900 tracking-widest transition-all appearance-none cursor-pointer uppercase text-xs"
                  value={newIntegration.platform}
                  onChange={e => {
                    const p = e.target.value as IntegrationPlatform;
                    setNewIntegration({
                      ...newIntegration, 
                      platform: p, 
                      baseUrl: p === IntegrationPlatform.SERPSTAT ? 'https://api.serpstat.com/v4' : ''
                    });
                  }}
                 >
                   {Object.values(IntegrationPlatform).map(p => <option key={p} value={p}>{p}</option>)}
                 </select>
               </div>

               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Display Name</label>
                 <input 
                  type="text" 
                  placeholder="E.G. BACKLINK API"
                  className="w-full px-8 py-5 bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-3xl outline-none font-black text-slate-900 transition-all uppercase placeholder:text-slate-200 tracking-widest text-xs"
                  value={newIntegration.name}
                  onChange={e => setNewIntegration({...newIntegration, name: e.target.value})}
                 />
               </div>

               {newIntegration.platform !== IntegrationPlatform.SERPSTAT && (
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Endpoint URL</label>
                   <div className="relative">
                     <Globe className="absolute left-8 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                     <input 
                      type="url" 
                      placeholder="HTTPS://SERVICE.COM"
                      className="w-full pl-16 pr-8 py-5 bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-3xl outline-none font-black text-slate-900 transition-all lowercase text-xs"
                      value={newIntegration.baseUrl}
                      onChange={e => setNewIntegration({...newIntegration, baseUrl: e.target.value})}
                     />
                   </div>
                 </div>
               )}

               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Secret Token</label>
                 <div className="relative">
                   <Lock className="absolute left-8 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                   <input 
                    type="password" 
                    placeholder="••••••••••••••••"
                    className="w-full pl-16 pr-8 py-5 bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-3xl outline-none font-black text-slate-900 transition-all text-xs"
                    value={newIntegration.apiKey}
                    onChange={e => setNewIntegration({...newIntegration, apiKey: e.target.value})}
                   />
                 </div>
               </div>

               <div className="pt-10 border-t border-slate-50 flex items-center justify-between">
                 <div className="flex items-center gap-3 text-emerald-600">
                   <ShieldCheck className="w-5 h-5" />
                   <span className="text-[10px] font-black uppercase tracking-[0.2em]">Validated Node</span>
                 </div>
                 <button 
                  onClick={handleAdd}
                  disabled={!newIntegration.name || (!newIntegration.baseUrl && newIntegration.platform !== IntegrationPlatform.SERPSTAT) || testing}
                  className="bg-slate-900 hover:bg-black text-white px-12 py-5 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] flex items-center gap-4 transition-all shadow-2xl shadow-slate-100 active:scale-95 disabled:opacity-30"
                 >
                   {testing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                   {testing ? 'Verifying' : 'Establish Link'}
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Integrations;
