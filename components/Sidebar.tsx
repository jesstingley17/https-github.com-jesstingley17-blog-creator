
import React from 'react';
import { 
  LayoutDashboard, 
  FilePlus2, 
  History, 
  Settings, 
  BarChart3,
  Sparkles,
  CalendarDays,
  Link2,
  Bookmark,
  Heart,
  Anchor,
  PenTool
} from 'lucide-react';
import { AppRoute } from '../types';
import { isSupabaseConfigured } from '../supabase';

interface SidebarProps {
  currentRoute: AppRoute;
  setRoute: (route: AppRoute) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentRoute, setRoute }) => {
  const navItems = [
    { id: AppRoute.DASHBOARD, label: 'Anchor Hub', icon: LayoutDashboard },
    { id: AppRoute.CREATE, label: 'New Chart', icon: FilePlus2 },
    { id: AppRoute.PROMPTS, label: 'Magic Stencils', icon: Bookmark },
    { id: AppRoute.PLANNER, label: 'Content Voyage', icon: CalendarDays },
    { id: AppRoute.HISTORY, label: 'Archived Logs', icon: History },
    { id: AppRoute.INTEGRATIONS, label: 'Vessel Links', icon: Link2 },
  ];

  return (
    <div className="w-64 bg-white border-r border-pink-100 h-screen flex flex-col fixed left-0 top-0 z-50 girly-shadow">
      <div className="p-8 flex items-center gap-3">
        <div className="anchor-gradient p-2.5 rounded-2xl shadow-lg rotate-3 relative overflow-hidden group">
          <Anchor className="text-white w-6 h-6 relative z-10 group-hover:scale-110 transition-transform" />
          <div className="absolute -bottom-1 -right-1 opacity-40">
            <PenTool className="w-3 h-3 text-white" />
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-bold tracking-tighter text-[#be185d] leading-none uppercase font-heading">
            AnchorChart
          </span>
          <span className="text-[10px] tracking-[0.3em] font-black text-teal-600 uppercase">PRO</span>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-6">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentRoute === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setRoute(item.id)}
              className={`w-full flex items-center gap-3 px-5 py-4 rounded-[20px] transition-all group ${
                isActive 
                  ? 'bg-pink-50 text-pink-700 shadow-sm border border-pink-100' 
                  : 'text-pink-300 hover:bg-pink-50/50 hover:text-pink-500'
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-pink-600 fill-pink-100' : ''}`} />
              <span className="font-bold text-xs uppercase tracking-widest">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-6 space-y-6">
        <div className="px-5 py-4 rounded-[24px] bg-teal-50 border border-teal-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className={`w-3 h-3 ${isSupabaseConfigured ? 'text-teal-600 fill-teal-600' : 'text-teal-300'}`} />
            <span className="text-[9px] font-black uppercase tracking-widest text-teal-700">
              {isSupabaseConfigured ? 'Hull Secured' : 'Local Drafts'}
            </span>
          </div>
          <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
        </div>
        
        <div className="space-y-1">
          <button 
            onClick={() => setRoute(AppRoute.STATS)}
            className={`w-full flex items-center gap-4 px-5 py-3 transition-all ${currentRoute === AppRoute.STATS ? 'text-pink-700 bg-pink-50 rounded-2xl' : 'text-pink-400 hover:text-pink-600'}`}
          >
            <BarChart3 className="w-4 h-4" />
            <span className="font-bold text-[10px] uppercase tracking-[0.2em]">Voyage Stats</span>
          </button>
          <button 
            onClick={() => setRoute(AppRoute.SETTINGS)}
            className={`w-full flex items-center gap-4 px-5 py-3 transition-all ${currentRoute === AppRoute.SETTINGS ? 'text-pink-700 bg-pink-50 rounded-2xl' : 'text-pink-400 hover:text-pink-600'}`}
          >
            <Settings className="w-4 h-4" />
            <span className="font-bold text-[10px] uppercase tracking-[0.2em]">Ship Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
