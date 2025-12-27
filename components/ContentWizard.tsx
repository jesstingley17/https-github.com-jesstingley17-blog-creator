
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ArrowRight, 
  Loader2, 
  CheckCircle2, 
  Layout, 
  Type as FontIcon, 
  Target,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { geminiService } from '../geminiService';
import { ContentBrief, ContentOutline } from '../types';

interface ContentWizardProps {
  onComplete: (brief: ContentBrief, outline: ContentOutline) => void;
}

const ContentWizard: React.FC<ContentWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState('');
  
  const [brief, setBrief] = useState<Partial<ContentBrief>>({
    topic: '',
    targetKeywords: [],
    secondaryKeywords: [],
    audience: 'General Readers',
    tone: 'Professional & Authoritative',
    length: 'medium'
  });

  const [outline, setOutline] = useState<ContentOutline | null>(null);

  const handleInitialAnalysis = async () => {
    if (!topic) return;
    setLoading(true);
    try {
      const details = await geminiService.generateBriefDetails(topic);
      setBrief({ ...brief, topic, ...details });
      setStep(2);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const generateOutline = async () => {
    setLoading(true);
    try {
      const generatedOutline = await geminiService.generateOutline(brief as ContentBrief);
      setOutline(generatedOutline);
      setStep(3);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { num: 1, label: 'Topic Search', icon: Search },
    { num: 2, label: 'SEO Brief', icon: Target },
    { num: 3, label: 'Outline Review', icon: Layout },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      {/* Stepper */}
      <div className="flex items-center justify-between px-4">
        {steps.map((s, i) => (
          <React.Fragment key={s.num}>
            <div className="flex flex-col items-center gap-2 relative">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                step >= s.num ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-gray-100 text-gray-400'
              }`}>
                {step > s.num ? <CheckCircle2 className="w-6 h-6" /> : <s.icon className="w-5 h-5" />}
              </div>
              <span className={`text-xs font-semibold ${step >= s.num ? 'text-indigo-600' : 'text-gray-400'}`}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-4 mb-6 transition-colors ${step > s.num ? 'bg-indigo-600' : 'bg-gray-100'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-8 min-h-[500px] flex flex-col">
        {step === 1 && (
          <div className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full text-center space-y-8">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold text-gray-900">What are we writing about today?</h2>
              <p className="text-gray-500">Enter a topic or target keyword, and we'll research the best SEO strategy.</p>
            </div>
            
            <div className="relative group">
              <input
                type="text"
                placeholder="e.g. Benefits of Sustainable Living in Urban Areas"
                className="w-full px-6 py-5 bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none text-lg transition-all pr-36 shadow-inner"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleInitialAnalysis()}
              />
              <button
                disabled={!topic || loading}
                onClick={handleInitialAnalysis}
                className="absolute right-3 top-3 bottom-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white px-6 rounded-xl font-medium flex items-center gap-2 transition-all"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-5 h-5" /> Analyze</>}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              {['Market Trends 2024', 'Remote Work Culture', 'Healthy Meal Prep', 'Digital Transformation'].map((t) => (
                <button 
                  key={t}
                  onClick={() => setTopic(t)}
                  className="text-left px-4 py-3 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 text-gray-600 text-sm transition-all"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">SEO Content Brief</h2>
                <p className="text-gray-500">We've generated an SEO profile for your topic.</p>
              </div>
              <button 
                onClick={() => setStep(1)}
                className="text-sm text-gray-500 hover:text-indigo-600 flex items-center gap-1"
              >
                <RefreshCw className="w-4 h-4" /> Start Over
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2 uppercase tracking-wider">Primary Keywords</label>
                  <div className="flex flex-wrap gap-2">
                    {brief.targetKeywords?.map((k, i) => (
                      <span key={i} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium border border-indigo-100">{k}</span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2 uppercase tracking-wider">Secondary Keywords</label>
                  <div className="flex flex-wrap gap-2">
                    {brief.secondaryKeywords?.map((k, i) => (
                      <span key={i} className="px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg text-sm font-medium border border-gray-100">{k}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2 uppercase tracking-wider">Target Audience</label>
                  <input 
                    className="w-full px-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={brief.audience}
                    onChange={(e) => setBrief({...brief, audience: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2 uppercase tracking-wider">Voice & Tone</label>
                  <select 
                    className="w-full px-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={brief.tone}
                    onChange={(e) => setBrief({...brief, tone: e.target.value})}
                  >
                    <option>Professional & Authoritative</option>
                    <option>Conversational & Friendly</option>
                    <option>Technical & In-depth</option>
                    <option>Inspirational & Bold</option>
                    <option>Humorous</option>
                    <option>Empathetic</option>
                    <option>Formal</option>
                    <option>Casual</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t flex justify-end">
              <button 
                onClick={generateOutline}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-200"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Next: Review Outline <ArrowRight className="w-5 h-5" /></>}
              </button>
            </div>
          </div>
        )}

        {step === 3 && outline && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Article Structure</h2>
              <p className="text-gray-500">Review the AI-generated structure before starting the writing process.</p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 space-y-6 max-h-[400px] overflow-y-auto custom-scrollbar">
              <h3 className="text-xl font-bold text-indigo-700">{outline.title}</h3>
              {outline.sections.map((section, idx) => (
                <div key={idx} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                  <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs">{idx + 1}</span>
                    {section.heading}
                  </h4>
                  <ul className="space-y-2 ml-8">
                    {section.subheadings.map((sub, sIdx) => (
                      <li key={sIdx} className="text-sm text-gray-600 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                        {sub}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 pt-4 border-t border-dashed flex flex-wrap gap-2">
                    {section.keyPoints.map((point, pIdx) => (
                      <span key={pIdx} className="text-[10px] uppercase font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded">
                        {point}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-8 border-t flex justify-between">
              <button 
                onClick={() => setStep(2)}
                className="text-gray-500 font-medium hover:text-gray-700"
              >
                Back to Brief
              </button>
              <button 
                onClick={() => onComplete(brief as ContentBrief, outline)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-200"
              >
                Generate Final Article <Sparkles className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentWizard;
