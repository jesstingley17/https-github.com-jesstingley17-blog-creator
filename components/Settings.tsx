
import React, { useState, useEffect } from 'react';
import { User, ShieldCheck, Save, Camera, Anchor, Wand2, Star } from 'lucide-react';
import { storageService } from '../storageService';
import { Author } from '../types';

const Settings: React.FC = () => {
  const [author, setAuthor] = useState<Author>(storageService.getAuthor());
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    storageService.saveAuthor(author);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-500 py-10">
      <header>
        <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-2 font-heading">Ship Settings</h1>
        <p className="text-pink-700 font-bold uppercase tracking-[0.2em] text-[10px]">Configure your captain's profile and vessel defaults.</p>
      </header>

      <div className="bg-white rounded-[48px] border-2 border-pink-100 shadow-xl p-12 space-y-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-pink-50/50 rounded-full blur-[100px] -mr-40 -mt-40 opacity-30" />
        
        <div className="flex items-center gap-6 border-b border-pink-50 pb-10">
          <div className="w-32 h-32 rounded-[40px] bg-pink-100 flex flex-col items-center justify-center border-4 border-white shadow-lg overflow-hidden relative group">
            {author.photoUrl ? (
              <img src={author.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-12 h-12 text-pink-300" />
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
              <Camera className="text-white w-6 h-6" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900 font-heading">Captain's Log Details</h3>
            <p className="text-slate-500 text-sm font-medium">These details appear on every synthesized Anchor Chart.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-pink-800 uppercase tracking-widest ml-2">Captain Name</label>
            <input 
              type="text" 
              value={author.name}
              onChange={e => setAuthor({...author, name: e.target.value})}
              className="w-full px-6 py-4 bg-pink-50/30 border-2 border-pink-100 rounded-3xl outline-none focus:border-pink-300 focus:bg-white transition-all font-bold text-slate-800"
              placeholder="e.g. Captain Sparkles"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-pink-800 uppercase tracking-widest ml-2">Vessel Title</label>
            <input 
              type="text" 
              value={author.title}
              onChange={e => setAuthor({...author, title: e.target.value})}
              className="w-full px-6 py-4 bg-pink-50/30 border-2 border-pink-100 rounded-3xl outline-none focus:border-pink-300 focus:bg-white transition-all font-bold text-slate-800"
              placeholder="e.g. Head of Chart Synthesis"
            />
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="text-[10px] font-black text-pink-800 uppercase tracking-widest ml-2">Manifesto (Bio)</label>
            <textarea 
              value={author.bio}
              onChange={e => setAuthor({...author, bio: e.target.value})}
              rows={4}
              className="w-full px-6 py-4 bg-pink-50/30 border-2 border-pink-100 rounded-3xl outline-none focus:border-pink-300 focus:bg-white transition-all font-bold text-slate-800 resize-none"
              placeholder="Describe your expertise..."
            />
          </div>
        </div>

        <div className="pt-8 border-t border-pink-50 flex items-center justify-between">
           <div className="flex items-center gap-3 text-pink-700">
             <ShieldCheck className="w-5 h-5" />
             <span className="text-[10px] font-black uppercase tracking-[0.2em]">Profile Secured</span>
           </div>
           <button 
            onClick={handleSave}
            className="px-12 py-5 girly-gradient text-white rounded-[24px] font-black text-xs uppercase tracking-[0.3em] flex items-center gap-4 transition-all shadow-xl shadow-pink-200 active:scale-95"
           >
             {saved ? <Star className="w-5 h-5 fill-white animate-spin" /> : <Save className="w-5 h-5" />}
             {saved ? 'Logs Updated' : 'Lock Settings'}
           </button>
        </div>
      </div>

      <div className="bg-slate-900 rounded-[48px] p-12 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-[80px] -mr-32 -mb-32" />
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
           <div className="w-20 h-20 bg-teal-500/20 rounded-3xl flex items-center justify-center shrink-0">
              <Wand2 className="w-10 h-10 text-teal-400" />
           </div>
           <div className="space-y-2">
              <h4 className="text-xl font-bold font-heading">Magical Defaults</h4>
              <p className="text-slate-400 text-sm leading-relaxed">Your author profile is automatically injected into the generation pipeline to ensure consistent brand authority across all nautical charts.</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
