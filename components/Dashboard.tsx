
import React from 'react';
import { 
  FileText, 
  TrendingUp, 
  Users, 
  Clock,
  ChevronRight,
  MoreVertical,
  Plus
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AppRoute } from '../types';

const data = [
  { name: 'Mon', score: 40 },
  { name: 'Tue', score: 60 },
  { name: 'Wed', score: 45 },
  { name: 'Thu', score: 70 },
  { name: 'Fri', score: 85 },
  { name: 'Sat', score: 75 },
  { name: 'Sun', score: 90 },
];

interface DashboardProps {
  onNewContent: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNewContent }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content Overview</h1>
          <p className="text-gray-500 mt-1">Manage your SEO performance and generation pipeline.</p>
        </div>
        <button 
          onClick={onNewContent}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all shadow-lg shadow-indigo-200"
        >
          <Plus className="w-5 h-5" />
          Create New Article
        </button>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Articles', val: '24', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Avg SEO Score', val: '88/100', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Keyword Coverage', val: '92%', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Generation Time', val: '1.2m', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-start justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">{stat.label}</p>
              <h3 className="text-2xl font-bold mt-2">{stat.val}</h3>
            </div>
            <div className={`${stat.bg} p-3 rounded-xl`}>
              <stat.icon className={`${stat.color} w-6 h-6`} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Performance Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold mb-6">SEO Score Progression</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#4f46e5" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorScore)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold mb-6">Recent Content</h3>
          <div className="space-y-4">
            {[
              { title: 'The Future of AI in SEO', score: 94, status: 'Published' },
              { title: '10 Tips for Link Building', score: 82, status: 'Draft' },
              { title: 'Cloud Computing Guide', score: 76, status: 'Review' },
              { title: 'Eco-friendly Marketing', score: 88, status: 'Published' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.score > 90 ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <FileText className={`w-5 h-5 ${item.score > 90 ? 'text-green-600' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-gray-900 group-hover:text-indigo-600 transition-colors">{item.title}</h4>
                    <p className="text-xs text-gray-500">Score: {item.score}/100</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700">
            View All History
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
