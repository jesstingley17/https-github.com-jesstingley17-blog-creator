
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
  Lock
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
    // Simulate a connection test
    await new Promise(r => setTimeout(r, 1500));
    
    const item: Integration = {
      id: Math.random().toString(36).substring(2, 11),
      name: newIntegration.name || 'New Integration',
      platform: newIntegration.platform as IntegrationPlatform,
      baseUrl: newIntegration.baseUrl || '',
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
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight italic">Deployment Manager</h1>
          <p className="text-gray-500 mt-1 font-medium">Connect external platforms to automate content publication.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center gap-3 transition-all shadow-xl shadow-indigo-100 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Add Site Integration
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {integrations.length === 0 ? (
          <div className="col-span-full py-24 text-center space-y-6 bg-white rounded-[48px] border border-dashed border-gray-200">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
              <Link2 className="w-10 h-10 text-gray-300" />
            </div>
            <div className="space-y-2">
              <h3 className="font-black text-gray-400 uppercase tracking-widest italic">No Integrations Active</h3>
              <p className="text-gray-300 text-sm max-w-xs mx-auto">Connect your WordPress, Ghost, or Webflow sites to start publishing directly from the editor.</p>
            </div>
          </div>
        ) : integrations.map((item) => (
          <div key={item.id} className="bg-white rounded-[40px] border border-gray-100 shadow-sm p-8 flex flex-col relative group transition-all hover:shadow-2xl hover:-translate-y-1">
            <div className="flex items-start justify-between mb-8">
              <div className={`p-4 rounded-2xl ${
                item.platform === IntegrationPlatform.WORDPRESS ? 'bg-blue-50 text-blue-600' :
                item.platform === IntegrationPlatform.GHOST ? 'bg-indigo-50 text-indigo-600' :
                'bg-purple-50 text-purple-600'
              }`}>
                <Database className="w-8 h-8" />
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-600 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest">Online</span>
              </div>
            </div>

            <div className="flex-1 space-y-2 mb-8">
              <h3 className="text-xl font-black text-gray-900 italic tracking-tighter">{item.name}</h3>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2">
                <Globe className="w-3 h-3" /> {new URL(item.baseUrl).hostname}
              </p>
            </div>

            <div className="flex items-center justify-between border-t pt-6">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">Type</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">{item.platform}</span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => removeIntegration(item.id)}
                  className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xl rounded-[56px] p-12 space-y-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />
            
            <div className="flex justify-between items-center relative z-10">
              <h3 className="font-black text-3xl uppercase italic tracking-tighter">New Integration</h3>
              <button onClick={() => setShowAddModal(false)} className="p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors"><X className="w-6 h-6" /></button>
            </div>

            <div className="space-y-6 relative z-10">
               <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Friendly Name</label>
                   <input 
                    type="text" 
                    placeholder="My Blog"
                    className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none font-bold text-gray-800 transition-all"
                    value={newIntegration.name}
                    onChange={e => setNewIntegration({...newIntegration, name: e.target.value})}
                   />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Platform</label>
                   <select 
                    className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none font-bold text-gray-800 transition-all appearance-none cursor-pointer"
                    value={newIntegration.platform}
                    onChange={e => setNewIntegration({...newIntegration, platform: e.target.value as IntegrationPlatform})}
                   >
                     {Object.values(IntegrationPlatform).map(p => <option key={p} value={p}>{p}</option>)}
                   </select>
                 </div>
               </div>

               <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Base URL</label>
                 <div className="relative">
                   <Globe className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                   <input 
                    type="url" 
                    placeholder="https://mysite.com"
                    className="w-full pl-14 pr-6 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none font-bold text-gray-800 transition-all"
                    value={newIntegration.baseUrl}
                    onChange={e => setNewIntegration({...newIntegration, baseUrl: e.target.value})}
                   />
                 </div>
               </div>

               <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">API Credentials</label>
                 <div className="relative">
                   <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                   <input 
                    type="password" 
                    placeholder="xoxb-api-token..."
                    className="w-full pl-14 pr-6 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none font-bold text-gray-800 transition-all"
                    value={newIntegration.apiKey}
                    onChange={e => setNewIntegration({...newIntegration, apiKey: e.target.value})}
                   />
                 </div>
               </div>

               <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                 <div className="flex items-center gap-2 text-green-600">
                   <ShieldCheck className="w-4 h-4" />
                   <span className="text-[10px] font-black uppercase tracking-widest">End-to-End Encrypted</span>
                 </div>
                 <button 
                  onClick={handleAdd}
                  disabled={!newIntegration.name || !newIntegration.baseUrl || testing}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-3xl font-black text-sm uppercase tracking-widest flex items-center gap-3 transition-all shadow-xl shadow-indigo-100 active:scale-95 disabled:opacity-50"
                 >
                   {testing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                   {testing ? 'Verifying...' : 'Establish Connection'}
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
