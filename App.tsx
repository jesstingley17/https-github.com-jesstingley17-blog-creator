
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ContentWizard from './components/ContentWizard';
import ArticleEditor from './components/ArticleEditor';
import Planner from './components/Planner';
import { AppRoute, ContentBrief, ContentOutline, ScheduledPost } from './types';
import { Search, Bell, UserCircle } from 'lucide-react';

const App: React.FC = () => {
  const [currentRoute, setRoute] = useState<AppRoute>(AppRoute.DASHBOARD);
  const [activeWorkflow, setActiveWorkflow] = useState<{
    brief: ContentBrief;
    outline: ContentOutline;
  } | null>(null);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([
    { id: '1', articleId: 'a1', title: 'The Future of AI in Education', date: new Date().toISOString(), platform: 'LinkedIn' },
  ]);

  const startNewContent = () => {
    setRoute(AppRoute.CREATE);
  };

  const handleWizardComplete = (brief: ContentBrief, outline: ContentOutline) => {
    setActiveWorkflow({ brief, outline });
    setRoute(AppRoute.EDITOR);
  };

  const handleSchedulePost = (post: ScheduledPost) => {
    setScheduledPosts(prev => [...prev, post]);
    // Optionally redirect to planner after scheduling
    // setRoute(AppRoute.PLANNER);
  };

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
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="bg-gray-100 p-6 rounded-full">
              <Search className="w-12 h-12 text-gray-300" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">No History Yet</h2>
            <p className="text-gray-500">You haven't generated any articles yet. Let's create your first piece of content!</p>
            <button 
              onClick={startNewContent}
              className="bg-indigo-600 text-white px-6 py-2 rounded-xl"
            >
              Start Generating
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
        {/* Top Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b flex items-center justify-between px-8 sticky top-0 z-20">
          <div className="flex items-center gap-4 bg-gray-50 px-4 py-2 rounded-xl w-96 border border-gray-100">
            <Search className="w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search content or topics..." 
              className="bg-transparent border-none outline-none text-sm w-full"
            />
          </div>
          
          <div className="flex items-center gap-6">
            <button className="relative p-2 text-gray-500 hover:text-indigo-600 transition-colors">
              <Bell className="w-6 h-6" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
            <div className="h-8 w-px bg-gray-200" />
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">Senior Content Strategist</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Enterprise Plan</p>
              </div>
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                <UserCircle className="w-6 h-6 text-indigo-600" />
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
