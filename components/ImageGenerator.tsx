
import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, Image as ImageIcon, Download, RefreshCw, AlertTriangle, Key, RotateCcw } from 'lucide-react';
import { geminiService } from '../geminiService';

interface ImageGeneratorProps {
  defaultPrompt: string;
  initialImageUrl?: string | null;
  onImageGenerated?: (url: string) => void;
}

const ImageGenerator: React.FC<ImageGeneratorProps> = ({ defaultPrompt, initialImageUrl, onImageGenerated }) => {
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [generating, setGenerating] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(initialImageUrl || null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialImageUrl !== undefined) {
      setImageUrl(initialImageUrl);
    }
  }, [initialImageUrl]);

  useEffect(() => {
    setPrompt(defaultPrompt);
  }, [defaultPrompt]);

  const handleGenerate = async () => {
    // Check for API key and open dialog if necessary as per instructions
    // @ts-ignore
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      // Proceed directly after triggering key selection
    }

    setGenerating(true);
    setError(null);
    try {
      const url = await geminiService.generateArticleImage(prompt);
      setImageUrl(url);
      if (onImageGenerated) {
        onImageGenerated(url);
      }
    } catch (e: any) {
      if (e.message?.includes("Requested entity was not found")) {
        setError("API Key configuration error. Please re-select your key.");
        // @ts-ignore
        await window.aistudio.openSelectKey();
      } else {
        setError("Failed to generate image. Try a more descriptive prompt.");
      }
    } finally {
      setGenerating(false);
    }
  };

  const resetPrompt = () => {
    setPrompt(defaultPrompt);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm uppercase tracking-tight">
          <ImageIcon className="w-4 h-4 text-purple-600" /> Visual Assets
        </h3>
        <a 
          href="https://ai.google.dev/gemini-api/docs/billing" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-[10px] text-gray-400 hover:text-indigo-600 flex items-center gap-1 uppercase tracking-widest font-bold transition-colors"
        >
          <Key className="w-3 h-3" /> Billing Info
        </a>
      </div>

      {/* Prompt Customization Area */}
      <div className="space-y-2 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
        <div className="flex items-center justify-between mb-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Generation Prompt</label>
          <button 
            onClick={resetPrompt}
            className="text-[10px] text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-bold transition-colors"
            title="Reset to suggested prompt"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>
        
        <div className="space-y-3">
          <textarea
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500 min-h-[100px] transition-all resize-none shadow-sm placeholder:text-gray-300"
            placeholder="Describe the aesthetic, style, and subject in detail..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          
          <button
            onClick={handleGenerate}
            disabled={generating || !prompt}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-indigo-100 active:scale-[0.98]"
          >
            {generating ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Crafting Image...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> {imageUrl ? 'Regenerate Artwork' : 'Generate Hero Image'}</>
            )}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 rounded-xl border border-red-100 flex items-center gap-2 animate-in slide-in-from-top-1">
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-xs text-red-600 leading-tight font-medium">{error}</p>
        </div>
      )}

      {/* Result Display Area */}
      {imageUrl ? (
        <div className="space-y-3 animate-in fade-in zoom-in-95 duration-500">
          <div className="group relative rounded-2xl overflow-hidden border border-gray-100 shadow-xl aspect-video bg-gray-50">
            <img src={imageUrl} alt="Generated SEO Asset" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            
            {/* Overlay Actions */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
              <button 
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = imageUrl;
                  link.download = 'article-hero-asset.png';
                  link.click();
                }}
                className="p-3 bg-white rounded-full text-gray-900 hover:scale-110 active:scale-95 transition-all shadow-xl"
                title="Download PNG"
              >
                <Download className="w-5 h-5" />
              </button>
              <button 
                onClick={handleGenerate}
                className="p-3 bg-white rounded-full text-gray-900 hover:scale-110 active:scale-95 transition-all shadow-xl"
                title="Regenerate using current prompt"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="flex items-center justify-between px-2">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Gemini 3 Pro Image</span>
              <span className="text-[9px] text-gray-400">1024 × 576 • PNG</span>
            </div>
            <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-100 uppercase tracking-widest">High Quality</span>
          </div>
        </div>
      ) : !generating && (
        <div className="border-2 border-dashed border-gray-100 rounded-2xl h-44 flex flex-col items-center justify-center text-gray-300 gap-4 bg-gray-50/30">
          <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center">
            <ImageIcon className="w-7 h-7 opacity-20" />
          </div>
          <div className="text-center px-8">
            <h4 className="text-xs font-bold text-gray-400 mb-1">Visual Storytelling</h4>
            <p className="text-[10px] text-gray-400/80 leading-relaxed max-w-[200px]">Customize your prompt and generate professional hero images for your SEO content.</p>
          </div>
        </div>
      )}

      {/* Generation Status (Skeleton) */}
      {generating && (
        <div className="space-y-4">
          <div className="bg-gray-100 rounded-2xl aspect-video w-full flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
            <div className="relative z-10 flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
              <div className="h-1 w-24 bg-indigo-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 animate-progress" />
              </div>
            </div>
          </div>
          <div className="space-y-1 text-center">
            <p className="text-[11px] text-indigo-600 font-black tracking-widest uppercase animate-pulse">
              {["Visualizing scene...", "Applying lighting...", "Refining textures...", "Polishing assets..."][Math.floor(Date.now() / 1500) % 4]}
            </p>
            <p className="text-[10px] text-gray-400">Using Gemini 3 Pro Vision for pixel-perfect results</p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes progress {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
        .animate-shimmer { animation: shimmer 2s infinite linear; }
        .animate-progress { animation: progress 3s infinite ease-in-out; }
      `}</style>
    </div>
  );
};

export default ImageGenerator;
