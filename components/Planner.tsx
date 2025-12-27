
import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Calendar, 
  Linkedin, 
  Twitter, 
  Facebook, 
  Layout, 
  Plus, 
  Loader2,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { geminiService } from '../geminiService';
import { ScheduledPost } from '../types';

const PLATFORM_ICONS: Record<string, any> = {
  LinkedIn: Linkedin,
  Twitter: Twitter,
  Facebook: Facebook,
  Blog: Layout
};

interface PlannerProps {
  scheduledPosts: ScheduledPost[];
  setScheduledPosts: React.Dispatch<React.SetStateAction<ScheduledPost[]>>;
}

const Planner: React.FC<PlannerProps> = ({ scheduledPosts, setScheduledPosts }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [scheduling, setScheduling] = useState(false);

  // Mock list of generated articles that are available for scheduling
  const availableArticles = [
    { id: 'a2', title: '10 SEO Tips for 2024', topic: 'SEO' },
    { id: 'a3', title: 'Cloud Computing 101', topic: 'Tech' },
    { id: 'a4', title: 'Sustainable Marketing', topic: 'Environment' },
  ];

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));

  const handleAISuggest = async () => {
    setScheduling(true);
    try {
      const suggestions = await geminiService.suggestSchedule(availableArticles);
      const newPosts: ScheduledPost[] = suggestions.map((s, i) => ({
        id: Math.random().toString(36).substring(2, 9),
        articleId: s.articleId || availableArticles[i]?.id || 'unknown',
        title: availableArticles.find(a => a.id === s.articleId)?.title || availableArticles[i]?.title || 'Untitled Article',
        date: s.date || new Date().toISOString(),
        platform: (s.platform as any) || 'LinkedIn'
      }));
      setScheduledPosts([...scheduledPosts, ...newPosts]);
    } catch (error) {
      console.error(error);
    } finally {
      setScheduling(false);
    }
  };

  const deletePost = (id: string) => {
    setScheduledPosts(prev => prev.filter(p => p.id !== id));
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  const getPostsForDay = (day: number) => {
    return scheduledPosts.filter(p => {
      const d = new Date(p.date);
      return d.getDate() === day && d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content Planner</h1>
          <p className="text-gray-500 mt-1">Schedule your generated articles across social platforms.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={handleAISuggest}
            disabled={scheduling}
            className="bg-white border border-indigo-100 text-indigo-600 px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-50 transition-all shadow-sm disabled:opacity-50"
          >
            {scheduling ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            AI Schedule Optimizer
          </button>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-100">
            <Plus className="w-5 h-5" />
            Add Custom Post
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Layout className="w-5 h-5 text-indigo-600" /> Backlog
            </h3>
            <div className="space-y-3">
              {availableArticles.map((article) => (
                <div key={article.id} className="group p-3 bg-gray-50 rounded-xl border border-transparent hover:border-indigo-100 hover:bg-white transition-all cursor-move">
                  <p className="text-sm font-bold text-gray-800 line-clamp-2">{article.title}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{article.topic}</span>
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-600">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-6 rounded-3xl text-white shadow-xl">
            <h4 className="font-bold flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4" /> Pro Tip
            </h4>
            <p className="text-xs text-indigo-50 leading-relaxed">
              Our AI suggests optimal posting times based on your brand context and topic volatility. Use the optimizer for a 15% increase in engagement.
            </p>
          </div>
        </div>

        <div className="lg:col-span-3 bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
          <div className="p-6 border-b flex items-center justify-between bg-gray-50/50">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-gray-900">{monthName} {year}</h2>
              <div className="flex bg-white border rounded-lg overflow-hidden shadow-sm">
                <button onClick={prevMonth} className="p-2 hover:bg-gray-50"><ChevronLeft className="w-4 h-4" /></button>
                <div className="w-px bg-gray-100" />
                <button onClick={nextMonth} className="p-2 hover:bg-gray-50"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 text-sm font-bold text-indigo-600 bg-indigo-50 rounded-lg">Month</button>
              <button className="px-4 py-2 text-sm font-bold text-gray-400 hover:bg-gray-50 rounded-lg">Week</button>
            </div>
          </div>

          <div className="grid grid-cols-7 border-b">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(dayName => (
              <div key={dayName} className="py-3 text-center text-[10px] font-black uppercase tracking-widest text-gray-400 border-r last:border-0">{dayName}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 auto-rows-[140px]">
            {calendarDays.map((day, idx) => {
              const posts = day ? getPostsForDay(day) : [];
              const today = new Date();
              const isToday = !!day && day === today.getDate() && currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();
              
              return (
                <div key={idx} className={`border-r border-b p-2 last:border-r-0 relative group transition-colors ${day ? 'hover:bg-indigo-50/20' : 'bg-gray-50/30'}`}>
                  {day && (
                    <>
                      <span className={`text-xs font-bold ${isToday ? 'bg-indigo-600 text-white w-6 h-6 flex items-center justify-center rounded-full' : 'text-gray-400'}`}>
                        {day}
                      </span>
                      <div className="mt-2 space-y-1">
                        {posts.map(post => {
                          const Icon = PLATFORM_ICONS[post.platform] || Layout;
                          return (
                            <div key={post.id} className="bg-white border border-gray-100 rounded-lg p-1.5 shadow-sm relative group/post animate-in zoom-in-95">
                              <div className="flex items-center gap-1.5 mb-1">
                                <Icon className="w-3 h-3 text-indigo-500" />
                                <span className="text-[9px] font-bold text-gray-500 uppercase truncate">{post.platform}</span>
                              </div>
                              <p className="text-[10px] font-bold text-gray-800 line-clamp-2 leading-tight">{post.title}</p>
                              <button 
                                onClick={() => deletePost(post.id)}
                                className="absolute -top-1 -right-1 bg-white p-1 rounded-full shadow-md text-red-500 opacity-0 group-hover/post:opacity-100 transition-opacity hover:bg-red-50"
                              >
                                <Trash2 className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                      <button className="absolute bottom-2 right-2 p-1 text-gray-300 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Planner;
