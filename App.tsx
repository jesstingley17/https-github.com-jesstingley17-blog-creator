
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ContentWizard from './components/ContentWizard';
import ArticleEditor from './components/ArticleEditor';
import Planner from './components/Planner';
import { AppRoute, ContentBrief, ContentOutline, ScheduledPost, GeneratedContent, ArticleMetadata } from './types';
import { Search, UserCircle, Key, Sparkles, ShieldCheck, FileText, ChevronRight, Clock } from 'lucide-react';

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
    if (process.env.API_KEY) {
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
  };

  const handleOpenKeySelector = async () => {
    // @ts-ignore
    await window.aistudio.openSelectKey();
    setHasApiKey(true);
  };

  const startNewContent = () => {
    setActiveWorkflow(null);
    setRoute(AppRoute.CREATE);
  };

  const handleWizardComplete = (brief: ContentBrief, outline: ContentOutline) => {
    setActiveWorkflow({ brief, outline });
    setRoute(AppRoute.EDITOR);
  };

  const handleSelectArticle = (id: string) => {
    const raw = localStorage.getItem(`zr_article_${id}`);
    if (raw) {
      try {
        const data: GeneratedContent = JSON.parse(raw);
        setActiveWorkflow({ brief: data.brief, outline: data.outline });
        setRoute(AppRoute.EDITOR);
      } catch (e) {
        console.error("Failed to restore article", e);
      }
    }
  };

  const handleSchedulePost = (post: ScheduledPost) => {
    setScheduledPosts(prev => [...prev, post]);
  };

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
            <p className="text-gray-500 text-lg leading-relaxed font-medium">
              To access advanced Gemini features and high-resolution image generation, please select a paid Google Cloud project.
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

  const HistoryPage = () => {
    const [history, setHistory] = useState<ArticleMetadata[]>([]);
    useEffect(() => {
      const raw = localStorage.getItem('zr_registry');
      if (raw) setHistory(JSON.parse(raw));
    }, []);

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
        <header>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight italic">Repository Archive</h1>
          <p className="text-gray-500 mt-1 font-medium">Manage and refine your existing semantic intelligence nodes.</p>
        </header>

        <div className="grid grid-cols-1 gap-4">
          {history.length > 0 ? history.map(item => (
            <div 
              key={item.id}
              onClick={() => handleSelectArticle(item.id)}
              className="bg-white p-6 rounded-[32px] border border-gray-100 hover:border-indigo-200 shadow-sm hover:shadow-xl transition-all group cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${item.score > 80 ? 'bg-green-50 text-green-600' : 'bg-indigo-50 text-indigo-600'}`}>
                  <FileText className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-gray-900 tracking-tight italic group-hover:text-indigo-600 transition-colors">{item.title}</h3>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-50 px-2 py-0.5 rounded-lg">{item.topic}</span>
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      <Clock className="w-3 h-3" /> Updated {new Date(item.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-right">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">SEO Score</p>
                  <p className={`text-2xl font-black italic tracking-tighter ${item.score > 80 ? 'text-green-600' : 'text-amber-600'}`}>{item.score}</p>
                </div>
                <ChevronRight className="w-6 h-6 text-gray-200 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          )) : (
            <div className="text-center py-40">
              <div className="bg-gray-100 p-8 rounded-full inline-block mb-6">
                <FileText className="w-16 h-16 text-gray-300" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight italic">No records found.</h2>
              <p className="text-gray-400 max-w-sm mx-auto font-medium mt-2">Generate your first article to begin building your content repository.</p>
              <button onClick={startNewContent} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest mt-8 shadow-xl shadow-indigo-100 active:scale-95 transition-all">Start Generation</button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (currentRoute) {
      case AppRoute.DASHBOARD:
        return <Dashboard onNewContent={startNewContent} onSelectArticle={handleSelectArticle} />;
      case AppRoute.CREATE:
        return <ContentWizard onComplete={handleWizardComplete} />;
      case AppRoute.PLANNER:
        return <Planner scheduledPosts={scheduledPosts} setScheduledPosts={setScheduledPosts} />;
      case AppRoute.HISTORY:
        return <HistoryPage />;
      case AppRoute.EDITOR:
        return activeWorkflow ? (
          <ArticleEditor 
            brief={activeWorkflow.brief} 
            outline={activeWorkflow.outline} 
            onBack={() => setRoute(AppRoute.DASHBOARD)}
            onSchedule={handleSchedulePost}
          />
        ) : <Dashboard onNewContent={startNewContent} onSelectArticle={handleSelectArticle} />;
      default:
        return <Dashboard onNewContent={startNewContent} onSelectArticle={handleSelectArticle} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-900">
      <Sidebar currentRoute={currentRoute} setRoute={setRoute} />
      
      <main className="pl-64 min-h-screen">
        <header className="h-24 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-10 sticky top-0 z-20">
          <div className="flex items-center gap-4 bg-gray-50 px-6 py-3 rounded-2xl w-[500px] border border-gray-100 focus-within:ring-2 focus-within:ring-indigo-600/20 focus-within:border-indigo-600 transition-all">
            <Search className="w-5 h-5 text-gray-300" />
            <input 
              type="text" 
              placeholder="Query semantic intelligence pool..." 
              className="bg-transparent border-none outline-none text-sm w-full font-bold placeholder:text-gray-200"
            />
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 py-2 px-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
                <UserCircle className="w-6 h-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest leading-none mb-1">Active Core</p>
                <p className="text-[11px] text-indigo-600 font-black uppercase tracking-[0.2em] leading-none">Intelligence 01</p>
              </div>
            </div>
          </div>
        </header>

        <div className="p-10 max-w-[1400px] mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
