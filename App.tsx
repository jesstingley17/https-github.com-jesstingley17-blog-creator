
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ContentWizard from './components/ContentWizard';
import ArticleEditor from './components/ArticleEditor';
import Planner from './components/Planner';
import Integrations from './components/Integrations';
import PublicArticle from './components/PublicArticle';
import PromptLibrary from './components/PromptLibrary';
import { storageService } from './storageService';
import { AppRoute, ContentBrief, ContentOutline, ScheduledPost } from './types';
import { Key, Sparkles, ShieldCheck, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [currentRoute, setRoute] = useState<AppRoute>(AppRoute.DASHBOARD);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [activeWorkflow, setActiveWorkflow] = useState<{ brief: ContentBrief; outline: ContentOutline } | null>(null);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [shareId, setShareId] = useState<string | null>(null);

  // Check for existing API key or handle selection logic
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
        console.error("Key check failed", e);
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
      // Assume success to avoid race conditions with hasSelectedApiKey
      setHasApiKey(true);
    } catch (e) {
      console.error(e);
    }
  };

  if (currentRoute === AppRoute.SHARED && shareId) {
    return <PublicArticle shareId={shareId} onExit={() => setRoute(AppRoute.DASHBOARD)} />;
  }

  if (hasApiKey === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Initializing Environment</p>
        </div>
      </div>
    );
  }

  if (hasApiKey === false) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="bg-white rounded-[40px] shadow-2xl p-12 max-w-xl w-full text-center space-y-8">
          <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto">
            <Key className="w-10 h-10 text-indigo-600" />
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">API Access Required</h1>
            <p className="text-slate-500 font-medium">Please select a project with Gemini API enabled to continue using the content suite.</p>
          </div>
          <button 
            onClick={handleOpenKeySelector}
            className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xl shadow-xl shadow-indigo-200 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <Sparkles className="w-6 h-6" /> Select API Key
          </button>
          <div className="pt-4 flex items-center justify-center gap-2 text-slate-300">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[10px] font-black tracking-widest uppercase">Encryption Active</span>
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (currentRoute) {
      case AppRoute.DASHBOARD:
        return <Dashboard onNewContent={() => setRoute(AppRoute.CREATE)} onSelectArticle={handleSelectArticle} />;
      case AppRoute.CREATE:
        return <ContentWizard onComplete={(brief, outline) => {
          setActiveWorkflow({ brief, outline });
          setRoute(AppRoute.EDITOR);
        }} />;
      case AppRoute.EDITOR:
        return activeWorkflow ? (
          <ArticleEditor 
            brief={activeWorkflow.brief} 
            outline={activeWorkflow.outline} 
            onBack={() => setRoute(AppRoute.DASHBOARD)} 
            onNavigate={setRoute}
          />
        ) : <Dashboard onNewContent={() => setRoute(AppRoute.CREATE)} />;
      case AppRoute.PLANNER:
        return <Planner scheduledPosts={scheduledPosts} setScheduledPosts={setScheduledPosts} />;
      case AppRoute.INTEGRATIONS:
        return <Integrations />;
      case AppRoute.PROMPTS:
        return <PromptLibrary onUsePrompt={(text) => {
          setRoute(AppRoute.CREATE);
          // Small delay to let ContentWizard mount
          setTimeout(() => {
            const input = document.querySelector('input[placeholder*="Enter topic"]') as HTMLInputElement;
            if (input) {
              input.value = text;
              // Trigger a react state update by dispatching an event
              const event = new Event('input', { bubbles: true });
              input.dispatchEvent(event);
            }
          }, 100);
        }} />;
      case AppRoute.HISTORY:
        return <Dashboard onNewContent={() => setRoute(AppRoute.CREATE)} onSelectArticle={handleSelectArticle} />;
      default:
        return <Dashboard onNewContent={() => setRoute(AppRoute.CREATE)} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      <Sidebar currentRoute={currentRoute} setRoute={setRoute} />
      <main className="flex-1 ml-64 p-8 h-screen overflow-y-auto custom-scrollbar">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
