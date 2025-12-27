
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ContentWizard from './components/ContentWizard';
import ArticleEditor from './components/ArticleEditor';
import Planner from './components/Planner';
import Integrations from './components/Integrations';
import PublicArticle from './components/PublicArticle';
import PromptLibrary from './components/PromptLibrary';
import Settings from './components/Settings';
import Stats from './components/Stats';
import { storageService } from './storageService';
import { AppRoute, ContentBrief, ContentOutline, ScheduledPost } from './types';
import { Key, Sparkles, ShieldCheck, Loader2, Anchor } from 'lucide-react';

const App: React.FC = () => {
  const [currentRoute, setRoute] = useState<AppRoute>(AppRoute.DASHBOARD);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [activeWorkflow, setActiveWorkflow] = useState<{ brief: ContentBrief; outline: ContentOutline } | null>(null);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [shareId, setShareId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sId = params.get('share');
    if (sId) {
      setShareId(sId);
      setRoute(AppRoute.SHARED);
    }

    const checkKey = async () => {
      try {
        const apiKey = (window as any).process?.env?.API_KEY || '';
        if (apiKey) {
          setHasApiKey(true);
          return;
        }
        // @ts-ignore
        if (typeof window.aistudio !== 'undefined') {
          // @ts-ignore
          const selected = await window.aistudio.hasSelectedApiKey();
          setHasApiKey(selected);
        } else {
          setHasApiKey(true);
        }
      } catch (e) {
        setHasApiKey(true);
      }
    };
    checkKey();
  }, []);

  const handleSelectArticle = async (id: string) => {
    try {
      const data = await storageService.getArticle(id);
      if (data && data.brief && data.outline) {
        setActiveWorkflow({ brief: data.brief, outline: data.outline });
        setRoute(AppRoute.EDITOR);
      }
    } catch (e) {
      console.error("Failed to select article", e);
    }
  };

  const handleOpenKeySelector = async () => {
    try {
      // @ts-ignore
      if (typeof window.aistudio !== 'undefined') {
        // @ts-ignore
        await window.aistudio.openSelectKey();
      }
      setHasApiKey(true);
    } catch (e) {
      console.error(e);
    }
  };

  if (currentRoute === AppRoute.SHARED && shareId) {
    return <PublicArticle shareId={shareId} onExit={() => setRoute(AppRoute.DASHBOARD)} />;
  }

  if (hasApiKey === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fff1f2] p-6">
        <div className="max-w-md w-full bg-white rounded-[48px] p-12 text-center shadow-2xl border-2 border-pink-100 space-y-8 animate-in zoom-in-95">
          <div className="w-24 h-24 bg-pink-100 rounded-[32px] flex items-center justify-center mx-auto">
             <Key className="w-12 h-12 text-[#be185d]" />
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">Captain's Key Needed</h2>
            <p className="text-slate-500 font-medium leading-relaxed">Please select an API key to initialize the AnchorPRO synthesis systems.</p>
          </div>
          <button 
            onClick={handleOpenKeySelector}
            className="w-full py-6 girly-gradient text-white rounded-[24px] font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-pink-200 flex items-center justify-center gap-4 transition-all hover:scale-[1.02] active:scale-95"
          >
            <Sparkles className="w-5 h-5" /> Select API Key
          </button>
          <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="block text-[10px] font-black text-pink-400 uppercase tracking-widest hover:text-[#be185d]">Billing Documentation</a>
        </div>
      </div>
    );
  }

  if (hasApiKey === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fff1f2]">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <Loader2 className="w-16 h-16 animate-spin text-[#be185d]" />
            <Anchor className="w-6 h-6 text-pink-300 absolute inset-0 m-auto" />
          </div>
          <p className="text-[10px] font-black text-[#be185d] uppercase tracking-[0.5em] animate-pulse">Scanning Horizon...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#fff1f2]">
      <Sidebar currentRoute={currentRoute} setRoute={setRoute} />
      
      <main className="flex-1 min-w-0 relative h-full flex flex-col pl-64 overflow-hidden">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-12 lg:p-16">
          <div className="max-w-[1400px] mx-auto w-full">
            {currentRoute === AppRoute.DASHBOARD && (
              <Dashboard 
                onNewContent={() => setRoute(AppRoute.CREATE)} 
                onSelectArticle={handleSelectArticle}
              />
            )}
            {currentRoute === AppRoute.CREATE && (
              <ContentWizard 
                onComplete={(brief, outline) => {
                  setActiveWorkflow({ brief, outline });
                  setRoute(AppRoute.EDITOR);
                }} 
              />
            )}
            {currentRoute === AppRoute.EDITOR && activeWorkflow && (
              <ArticleEditor 
                brief={activeWorkflow.brief} 
                outline={activeWorkflow.outline}
                onBack={() => setRoute(AppRoute.DASHBOARD)}
                onNavigate={(route) => setRoute(route)}
              />
            )}
            {currentRoute === AppRoute.PLANNER && (
              <Planner 
                scheduledPosts={scheduledPosts} 
                setScheduledPosts={setScheduledPosts} 
              />
            )}
            {currentRoute === AppRoute.INTEGRATIONS && <Integrations />}
            {currentRoute === AppRoute.PROMPTS && (
              <PromptLibrary 
                onUsePrompt={(text) => {
                  // Logic to use prompt in creation
                  setRoute(AppRoute.CREATE);
                }} 
              />
            )}
            {currentRoute === AppRoute.SETTINGS && <Settings />}
            {currentRoute === AppRoute.STATS && <Stats />}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
