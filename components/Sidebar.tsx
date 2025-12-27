
import React from 'react';
import { 
  LayoutDashboard, 
  FilePlus2, 
  History, 
  Settings, 
  BarChart3,
  Sparkles,
  CalendarDays,
  Cloud,
  CloudOff,
  Link2
} from 'lucide-react';
import { AppRoute } from '../types';
import { isSupabaseConfigured } from '../supabase';

interface SidebarProps {
  currentRoute: AppRoute;
  setRoute: (route: AppRoute) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentRoute, setRoute }) => {
  const navItems = [
    { id: AppRoute.DASHBOARD, label: 'Overview', icon: LayoutDashboard },
    { id: AppRoute.CREATE, label: 'New Content', icon: FilePlus2 },
    { id: AppRoute.PLANNER, label: 'Content Planner', icon: CalendarDays },
    { id: AppRoute.HISTORY, label: 'History', icon: History },
    { id: AppRoute.INTEGRATIONS, label: 'Integrations', icon: Link2 },
  ];

  return (
    <div className="w-64 bg-white border-r h-screen flex flex-col fixed left-0 top-0">
      <div className="p-6 flex items-center gap-2">
        <div className="bg-indigo-600 p-2 rounded-lg">
          <Sparkles className="text-white w-6 h-6" />
        </div>
        <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          ZR Content Creator
        </span>
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentRoute === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setRoute(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive 
                  ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t space-y-4">
        <div className="px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isSupabaseConfigured ? (
              <Cloud className="w-4 h-4 text-green-500" />
            ) : (
              <CloudOff className="w-4 h-4 text-amber-500" />
            )}
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
              {isSupabaseConfigured ? 'Cloud Sync On' : 'Local Only'}
            </span>
          </div>
          {isSupabaseConfigured && <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
        </div>
        
        <div className="space-y-1">
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-gray-50 rounded-xl transition-all">
            <BarChart3 className="w-5 h-5" />
            <span className="font-medium">Analytics</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-gray-50 rounded-xl transition-all">
            <Settings className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
