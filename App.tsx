import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ContentWizard from './components/ContentWizard';
import ArticleEditor from './components/ArticleEditor';
import Planner from './components/Planner';
import { AppRoute, ContentBrief, ContentOutline, ScheduledPost } from './types';
import { Search, UserCircle, Key, Sparkles, ShieldCheck, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [currentRoute, setRoute] = useState<AppRoute>(AppRoute.DASHBOARD);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [activeWorkflow, setActiveWorkflow] = useState<{
    brief: ContentBrief;
    outline: ContentOutline;
  } | null>(null);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([
    { id: '1', articleId: 'a1', title: 'The Future of AI in Education', date: new Date().toISOString(), platform: 'LinkedIn' },
  ]);

  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    // Priority 1: Check if we have an environment variable (Vercel/Production)
    if (process.env.API_KEY) {
      setHasApiKey(true);
      return;
    }

    // Priority 2: Fallback for AI Studio selection
    // @ts-ignore
    if (typeof window.aistudio !== 'undefined') {
      // @ts-ignore
      const selected = await window.aistudio.hasSelectedApiKey();
      setHasApiKey(selected);
    } else {
      // Final fallback: assume standard production setup
      setHasApiKey(true);
    }
  };

  const handleOpenKeySelector = async () => {
    // @ts-ignore
    await window.aistudio.openSelectKey();
    setHasApiKey(true); // Proceed assuming success per guidelines
  };

  const startNewContent = () => {
    setRoute(AppRoute.CREATE);
  };

  const handleWizardComplete = (brief: ContentBrief, outline: ContentOutline) => {
    setActiveWorkflow({ brief, outline });
    setRoute(AppRoute.EDITOR);
  };

  const handleSchedulePost = (post: ScheduledPost) => {
    setScheduledPosts(prev => [...prev, post]);
  };

  // While checking, show a clean, high-end loading state
  if (hasApiKey === null) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 font-sans">
        <div className="flex flex-col items-center gap-6 animate-pulse">
           <div className="w-16 h-16 bg-indigo-600 rounded-[22px] flex items-center justify-center shadow-2xl shadow-indigo-100">
             <Sparkles className="w-8 h-8 text-white" />
           </div>
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">Initializing Core...</p>
        </div>
      </div>
    );
  }

  if (hasApiKey === false) {
    return (
      <div className="min-h-screen bg-indigo-600 flex items-center justify-center p-6 font-sans">
        <div className="bg-white rounded-[40px] shadow-2xl p-12 max-w-xl w-full text-center space-y-8 animate-in zoom-in-95 duration-500">
          <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Key className="w-12 h-12 text-indigo-600" />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">Connect to Google AI</h1>
            <p className="text-gray-500 text-lg leading-relaxed">
              To access advanced Gemini 3 features and high-resolution image generation, please select a paid Google Cloud project.
            </p>
          </div>
          <div className="space-y-4">
            <button 
              onClick={handleOpenKeySelector}
              className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black text-xl shadow-2xl shadow-indigo-200 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <Sparkles className="w-6 h-6" /> Select Project API Key
            </button>
            <a 
              href="https://ai.google.dev/gemini-api/docs/billing" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block text-gray-400 hover:text-indigo-600 text-sm font-bold uppercase tracking-widest transition-colors"
            >
              Billing Documentation
            </a>
          </div>
          <div className="pt-8 border-t flex items-center justify-center gap-2 text-gray-400">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-xs font-bold tracking-widest uppercase">Secured by Gemini Cloud</span>
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (currentRoute) {
      case AppRoute.DASHBOARD:
        return <Dashboard onNewContent={startNewContent} />;
      case AppRoute.CREATE:
        return <ContentWizard onComplete={handleWizardComplete} />;
      case AppRoute.PLANNER:
        return <Planner scheduledPosts={scheduledPosts} setScheduledPosts={setScheduledPosts} />;
      case AppRoute.EDITOR:
        return activeWorkflow ? (
          <ArticleEditor 
            brief={activeWorkflow.brief} 
            outline={activeWorkflow.outline} 
            onBack={() => setRoute(AppRoute.DASHBOARD)}
            onSchedule={handleSchedulePost}
          />
        ) : <Dashboard onNewContent={startNewContent} />;
      case AppRoute.HISTORY:
        return (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-20">
            <div className="bg-gray-100 p-8 rounded-full">
              <Search className="w-16 h-16 text-gray-300" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Archive Empty</h2>
            <p className="text-gray-500 max-w-sm">Start your synthesis journey. Your generated articles will appear here for management.</p>
            <button 
              onClick={startNewContent}
              className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold mt-4"
            >
              New Generation
            </button>
          </div>
        );
      default:
        return <Dashboard onNewContent={startNewContent} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-900">
      <Sidebar currentRoute={currentRoute} setRoute={setRoute} />
      
      <main className="pl-64 min-h-screen">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b flex items-center justify-between px-8 sticky top-0 z-20">
          <div className="flex items-center gap-4 bg-gray-50 px-4 py-2 rounded-xl w-96 border border-gray-100">
            <Search className="w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Query content pool..." 
              className="bg-transparent border-none outline-none text-sm w-full font-medium"
            />
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 py-1.5 px-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                <UserCircle className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-black text-gray-900 uppercase tracking-tight">Active Node</p>
                <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest">Workspace 01</p>
              </div>
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;