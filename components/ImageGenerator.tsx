
import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, Image as ImageIcon, Download, RefreshCw, AlertTriangle, Key, RotateCcw, Wand2, Palmtree, Monitor, Camera, Boxes } from 'lucide-react';
import { geminiService } from '../geminiService';

interface ImageGeneratorProps {
  defaultPrompt: string;
  initialImageUrl?: string | null;
  onImageGenerated?: (url: string) => void;
  topicContext?: string;
}

const STYLES = [
  { label: 'Cinematic', icon: Camera, keywords: 'cinematic lighting, dramatic shadows' },
  { label: 'Minimal', icon: Monitor, keywords: 'minimalist, clean lines' },
  { label: '3D Render', icon: Boxes, keywords: '3D isometric render' },
  { label: 'Ethereal', icon: Palmtree, keywords: 'soft pastel colors, dreamy' },
];

const ImageGenerator: React.FC<ImageGeneratorProps> = ({ defaultPrompt, initialImageUrl, onImageGenerated, topicContext }) => {
  const [prompt, setPrompt] = useState(defaultPrompt || '');
  const [generating, setGenerating] = useState(false);
  const [refining, setRefining] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(initialImageUrl || null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setImageUrl(initialImageUrl || null); }, [initialImageUrl]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const url = await geminiService.generateArticleImage(prompt);
      setImageUrl(url);
      if (onImageGenerated) onImageGenerated(url);
    } catch (e: any) {
      setError("Failed to generate. Check your API key.");
    } finally { setGenerating(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm uppercase"><ImageIcon className="w-4 h-4 text-purple-600" /> Visuals</h3>
      </div>
      <div className="space-y-3 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
        <textarea
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500 min-h-[100px]"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          {STYLES.map((style) => (
            <button key={style.label} onClick={() => setPrompt(prev => prev + ', ' + style.keywords)} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-gray-100 rounded-lg text-[10px] font-bold text-gray-500">
              <style.icon className="w-3 h-3" /> {style.label}
            </button>
          ))}
        </div>
        <button onClick={handleGenerate} disabled={generating} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2">
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} {imageUrl ? 'Regenerate' : 'Generate'}
        </button>
      </div>
      {imageUrl && <img src={imageUrl} className="w-full rounded-2xl shadow-xl" alt="AI Asset" />}
    </div>
  );
};

export default ImageGenerator;
