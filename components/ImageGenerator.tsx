
import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, Image as ImageIcon, Download, RefreshCw, AlertTriangle, Key, RotateCcw, Wand2, Palmtree, Monitor, Camera, Boxes } from 'lucide-react';
import { geminiService } from '../geminiService';

interface ImageGeneratorProps {
  defaultPrompt: string;
  initialImageUrl?: string | null;
  onImageGenerated?: (url: string, prompt: string) => void;
  topicContext?: string;
}

const STYLES = [
  { label: 'Cinematic', icon: Camera, keywords: 'cinematic lighting, dramatic shadows, highly detailed' },
  { label: 'Minimal', icon: Monitor, keywords: 'minimalist, clean lines, high contrast, studio background' },
  { label: '3D Render', icon: Boxes, keywords: '3D isometric render, blender cycles, toycore, soft lighting' },
  { label: 'Ethereal', icon: Palmtree, keywords: 'soft pastel colors, dreamy atmosphere, glowing elements' },
];

const ImageGenerator: React.FC<ImageGeneratorProps> = ({ defaultPrompt, initialImageUrl, onImageGenerated, topicContext }) => {
  const [prompt, setPrompt] = useState(defaultPrompt || '');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (defaultPrompt && !prompt) setPrompt(defaultPrompt);
  }, [defaultPrompt]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setError(null);
    try {
      const finalPrompt = prompt + (topicContext ? `. Context: ${topicContext}` : '');
      const url = await geminiService.generateArticleImage(finalPrompt);
      if (onImageGenerated) onImageGenerated(url, prompt);
    } catch (e: any) {
      setError("Failed to generate asset. Verify your connection and API key.");
    } finally { setGenerating(false); }
  };

  const applyStyle = (keywords: string) => {
    if (prompt.includes(keywords)) return;
    setPrompt(prev => prev.trim() + ', ' + keywords);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3 bg-gray-50/50 p-4 rounded-3xl border border-gray-100">
        <textarea
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px] font-medium text-gray-700 leading-relaxed"
          placeholder="Describe the asset you want to synthesize..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        
        <div className="flex flex-wrap gap-2">
          {STYLES.map((style) => (
            <button 
              key={style.label} 
              onClick={() => applyStyle(style.keywords)} 
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-100 rounded-xl text-[9px] font-black uppercase tracking-widest text-gray-500 hover:border-indigo-200 hover:text-indigo-600 transition-all shadow-sm"
            >
              <style.icon className="w-3 h-3" /> {style.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-500 rounded-xl text-[10px] font-bold flex items-center gap-2 border border-red-100">
            <AlertTriangle className="w-3 h-3" /> {error}
          </div>
        )}

        <button 
          onClick={handleGenerate} 
          disabled={generating || !prompt.trim()} 
          className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-gray-100 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-slate-100"
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-indigo-400" />}
          Synthesize Asset
        </button>
      </div>
    </div>
  );
};

export default ImageGenerator;
