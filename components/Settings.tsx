
import React, { useState, useRef } from 'react';
import { User, ShieldCheck, Save, Camera, Anchor, Wand2, Star, Upload } from 'lucide-react';
import { storageService } from '../storageService';
import { Author } from '../types';

const Settings: React.FC = () => {
  const [author, setAuthor] = useState<Author>(storageService.getAuthor());
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    storageService.saveAuthor(author);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image too large. Please select a photo under 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAuthor({ ...author, photoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-500 py-10">
      <header>
        <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-2 font-heading italic uppercase">Ship Settings</h1>
        <p className="text-pink-700 font-bold uppercase tracking-[0.2em] text-[10px]">Configure your captain's profile and vessel defaults.</p>
      </header>

      <div className="bg-white rounded-[48px] border-2 border-pink-100 shadow-xl p-12 space-y-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-pink-50/50 rounded-full blur-[100px] -mr-40 -mt-40 opacity-30" />
        
        <div className="flex flex-col md:flex-row items-center gap-10 border-b border-pink-50 pb-12">
          <div className="relative group">
            <div className="w-40 h-40 rounded-[48px] bg-pink-100 flex flex-col items-center justify-center border-4 border-white shadow-2xl overflow-hidden relative">
              {author.photoUrl ? (
                <img src={author.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-16 h-16 text-pink-300" />
              )}
              <button 
                onClick={triggerUpload}
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center cursor-pointer text-white gap-2 backdrop-blur-[2px]"
              >
                <Camera className="w-8 h-8" />
                <span className="text-[9px] font-black uppercase tracking-widest">Change Photo</span>
              </button>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handlePhotoUpload} 
              className="hidden" 
              accept="image/*" 
            />
          </div>
          <div className="flex-1 space-y-2 text-center md:text-left">
            <h3 className="text-3xl font-black text-slate-900 font-heading italic uppercase tracking-tighter">Captain's Identity</h3>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Your details are injected into the AnchorChartPRO synthesis pipeline.</p>
            <div className="pt-2 flex flex-wrap justify-center md:justify-start gap-3">
              <span className="px-4 py-1.5 bg-pink-50 text-pink-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-pink-100">Validated Author</span>
              <span className="px-4 py-1.5 bg-teal-50 text-teal-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-teal-100">Core Identity</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-pink-800 uppercase tracking-widest ml-4">Full Display Name</label>
            <input 
              type="text" 
              value={author.name}
              onChange={e => setAuthor({...author, name: e.target.value})}
              className="w-full px-8 py-6 bg-pink-50/30 border-2 border-pink-100 rounded-[32px] outline-none focus:border-pink-500 focus:bg-white transition-all font-bold text-slate-800 text-lg shadow-inner"
              placeholder="e.g. Captain Sparkles"
            />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-pink-800 uppercase tracking-widest ml-4">Professional Title</label>
            <input 
              type="text" 
              value={author.title}
              onChange={e => setAuthor({...author, title: e.target.value})}
              className="w-full px-8 py-6 bg-pink-50/30 border-2 border-pink-100 rounded-[32px] outline-none focus:border-pink-500 focus:bg-white transition-all font-bold text-slate-800 text-lg shadow-inner"
              placeholder="e.g. Head of Charts"
            />
          </div>
          <div className="md:col-span-2 space-y-3">
            <label className="text-[10px] font-black text-pink-800 uppercase tracking-widest ml-4">Professional Manifesto (Bio)</label>
            <textarea 
              value={author.bio}
              onChange={e => setAuthor({...author, bio: e.target.value})}
              rows={4}
              className="w-full px-8 py-6 bg-pink-50/30 border-2 border-pink-100 rounded-[32px] outline-none focus:border-pink-500 focus:bg-white transition-all font-bold text-slate-800 text-lg resize-none shadow-inner leading-relaxed"
              placeholder="Describe your expertise in nautical synthesis..."
            />
          </div>
        </div>

        <div className="pt-10 border-t border-pink-50 flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="flex items-center gap-4 text-pink-700">
             <ShieldCheck className="w-6 h-6" />
             <div className="flex flex-col">
               <span className="text-[10px] font-black uppercase tracking-[0.2em] leading-none">Security Status</span>
               <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Local Identity Lock Active</span>
             </div>
           </div>
           <button 
            onClick={handleSave}
            className="w-full md:w-auto px-16 py-6 girly-gradient text-white rounded-[32px] font-black text-sm uppercase tracking-[0.3em] flex items-center justify-center gap-4 transition-all shadow-2xl shadow-pink-200 active:scale-95 hover:opacity-90"
           >
             {saved ? <Star className="w-5 h-5 fill-white animate-spin" /> : <Save className="w-5 h-5" />}
             {saved ? 'Settings Saved' : 'Commit Changes'}
           </button>
        </div>
      </div>

      <div className="bg-slate-900 rounded-[48px] p-12 text-white shadow-2xl relative overflow-hidden group">
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-[80px] -mr-32 -mb-32 transition-all group-hover:bg-teal-500/20" />
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10 text-center md:text-left">
           <div className="w-24 h-24 bg-teal-500/20 rounded-[32px] flex items-center justify-center shrink-0 border border-teal-500/30">
              <Wand2 className="w-12 h-12 text-teal-400" />
           </div>
           <div className="space-y-3">
              <h4 className="text-2xl font-bold font-heading italic uppercase tracking-tight">Personalized Synthesis</h4>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xl font-medium">Your author profile is automatically injected into the generation pipeline to ensure consistent brand authority across all anchorchartpro content. Every blog post will carry your unique voice.</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
