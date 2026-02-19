
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  RefreshCw, 
  Download, 
  Sparkles, 
  Maximize2, 
  Copy, 
  Palette, 
  RotateCcw,
  X,
  Zap,
  Check,
  Dices,
  Settings,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { GradientState, ColorStop, GradientType, ExportSettings } from './types';
import { generateAIPalette } from './services/geminiService';
import { downloadGradient } from './utils/exportUtils';

const DEFAULT_STOPS: ColorStop[] = [
  { id: '1', color: '#10b981', position: 0 },
  { id: '2', color: '#3b82f6', position: 100 },
];

const App: React.FC = () => {
  const [gradient, setGradient] = useState<GradientState>({
    type: 'linear',
    angle: 180,
    stops: DEFAULT_STOPS,
  });
  const [isExporting, setIsExporting] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    width: 3840,
    height: 2160,
    format: 'svg',
    quality: 0.95,
  });
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [history, setHistory] = useState<GradientState[]>([]);

  const cssGradient = useMemo(() => {
    const sortedStops = [...gradient.stops].sort((a, b) => a.position - b.position);
    const stopsString = sortedStops.map(s => `${s.color} ${s.position}%`).join(', ');
    
    if (gradient.type === 'linear') {
      return `linear-gradient(${gradient.angle}deg, ${stopsString})`;
    }
    return `radial-gradient(circle at center, ${stopsString})`;
  }, [gradient]);

  const addStop = () => {
    if (gradient.stops.length >= 8) return;
    const newStop: ColorStop = {
      id: Math.random().toString(36).substr(2, 9),
      color: '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0'),
      position: Math.floor(Math.random() * 100),
    };
    setGradient(prev => ({ ...prev, stops: [...prev.stops, newStop] }));
  };

  const removeStop = (id: string) => {
    if (gradient.stops.length <= 2) return;
    setGradient(prev => ({ ...prev, stops: prev.stops.filter(s => s.id !== id) }));
  };

  const updateStop = (id: string, updates: Partial<ColorStop>) => {
    setGradient(prev => ({
      ...prev,
      stops: prev.stops.map(s => (s.id === id ? { ...s, ...updates } : s)),
    }));
  };

  const randomize = () => {
    setHistory(prev => [gradient, ...prev].slice(0, 20));
    const count = Math.floor(Math.random() * 3) + 2;
    const newStops = Array.from({ length: count }, (_, i) => ({
      id: Math.random().toString(36).substr(2, 9),
      color: '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0'),
      position: (i / (count - 1)) * 100,
    }));
    setGradient(prev => ({
      ...prev,
      angle: Math.floor(Math.random() * 360),
      stops: newStops,
    }));
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);
    const result = await generateAIPalette(aiPrompt);
    if (result) {
      setHistory(prev => [gradient, ...prev].slice(0, 20));
      const newStops = result.colors.map((color, i) => ({
        id: Math.random().toString(36).substr(2, 9),
        color,
        position: (i / (result.colors.length - 1)) * 100,
      }));
      setGradient(prev => ({ ...prev, stops: newStops }));
    }
    setIsAiLoading(false);
  };

  const copyCss = () => {
    navigator.clipboard.writeText(`background: ${cssGradient};`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const undo = () => {
    if (history.length === 0) return;
    const [last, ...rest] = history;
    setGradient(last);
    setHistory(rest);
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Full Screen Gradient - The Hero */}
      <div 
        className="absolute inset-0 transition-all duration-1000 cubic-bezier(0.4, 0, 0.2, 1)"
        style={{ background: cssGradient }}
      />
      
      {/* Subtle Hardware Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_center,#fff_0.5px,transparent_0.5px)] bg-[size:32px_32px]"></div>

      {/* Floating Sassy Header */}
      <div className="absolute top-10 left-10 flex items-center gap-5">
        <div className="skeuo-knob p-3 rounded-2xl">
          <img 
            src="https://api.screenshotone.com/v1/screenshot?url=https%3A%2F%2Fstorage.googleapis.com%2Fai-studio-images%2F6746973e-07a8-4e0d-85ca-8c764e43e215.png&access_key=dummy" 
            className="w-10 h-10 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]"
            alt="Gradish Carrot"
            onError={(e) => {
              // Fallback if the image URL is not directly accessible
              (e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/lucide-react/lucide/main/icons/carrot.svg';
            }}
          />
        </div>
        <div className="flex flex-col gap-0">
          <h1 className="text-4xl font-black text-white text-embossed tracking-tighter italic leading-none">GRADISH.</h1>
          <p className="text-[10px] font-bold text-black/60 uppercase tracking-[0.35em] bg-white/25 backdrop-blur-lg px-3 py-1 rounded-full w-max mt-1">
            Stay crunchy, blend gracefully
          </p>
        </div>
      </div>

      {/* Quick Action Top Right */}
      <div className="absolute top-10 right-10 flex gap-4">
        <button 
          onClick={copyCss}
          className="skeuo-button h-12 px-6 rounded-2xl flex items-center gap-3 text-xs font-black uppercase tracking-widest text-white"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          {copied ? 'SNAGGED IT' : 'STEAL CSS'}
        </button>
      </div>

      {/* The Floating Nav Control Panel */}
      <div className="floating-nav">
        <div className={`skeuo-raised p-4 rounded-[2.5rem] border border-white/10 flex flex-col gap-4 transition-all duration-500 ease-in-out ${isPanelOpen ? 'mb-4 translate-y-0' : 'translate-y-2'}`}>
          
          {/* Expanded Controls Area */}
          {isPanelOpen && (
            <div className="p-4 flex flex-col md:flex-row gap-8 animate-in slide-in-from-bottom-4 duration-300">
              
              {/* AI Brain */}
              <div className="w-full md:w-64 space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-engraved">Neuro-Link</label>
                <div className="skeuo-pressed rounded-2xl p-1 flex items-center pr-2">
                  <input 
                    type="text" 
                    placeholder="Describe your mood..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="bg-transparent border-none px-4 py-3 text-sm font-bold text-white focus:outline-none w-full"
                  />
                  <button 
                    onClick={handleAiGenerate}
                    disabled={isAiLoading}
                    className="skeuo-button p-2.5 rounded-xl disabled:opacity-50"
                  >
                    {isAiLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-indigo-400" />}
                  </button>
                </div>
              </div>

              {/* Angle & Type */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-engraved">Topography</label>
                <div className="flex gap-2">
                  {(['linear', 'radial'] as GradientType[]).map(t => (
                    <button 
                      key={t}
                      onClick={() => setGradient(prev => ({ ...prev, type: t }))}
                      className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${gradient.type === t ? 'skeuo-pressed text-white' : 'skeuo-button text-slate-400'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                {gradient.type === 'linear' && (
                  <div className="skeuo-pressed p-4 rounded-2xl flex items-center gap-4">
                    <input 
                      type="range" min="0" max="360" value={gradient.angle}
                      onChange={(e) => setGradient(prev => ({ ...prev, angle: parseInt(e.target.value) }))}
                      className="w-32 accent-indigo-500"
                    />
                    <span className="text-xs font-black font-mono text-indigo-400">{gradient.angle}°</span>
                  </div>
                )}
              </div>

              {/* Color Mixer */}
              <div className="flex-1 space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-engraved">The Palette</label>
                  <button onClick={addStop} className="skeuo-button p-1.5 rounded-lg text-slate-400 hover:text-white">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-4 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                  {gradient.stops.map(stop => (
                    <div key={stop.id} className="skeuo-raised p-2 rounded-2xl flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl skeuo-knob relative overflow-hidden">
                        <input 
                          type="color" value={stop.color} 
                          onChange={(e) => updateStop(stop.id, { color: e.target.value })}
                          className="absolute inset-0 scale-150 cursor-pointer"
                        />
                      </div>
                      <input 
                        type="range" min="0" max="100" value={stop.position}
                        onChange={(e) => updateStop(stop.id, { position: parseInt(e.target.value) })}
                        className="w-16 accent-slate-400"
                      />
                      <button onClick={() => removeStop(stop.id)} disabled={gradient.stops.length <= 2} className="text-rose-900/50 hover:text-rose-500 p-1 disabled:opacity-0">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* Persistent Action Bar */}
          <div className="flex items-center gap-3 md:gap-6 px-2">
            
            <button 
              onClick={() => setIsPanelOpen(!isPanelOpen)}
              className="skeuo-button h-14 w-14 rounded-full flex items-center justify-center shrink-0 group"
            >
              {isPanelOpen ? <ChevronDown className="w-5 h-5 text-indigo-400 group-hover:translate-y-0.5 transition-transform" /> : <ChevronUp className="w-5 h-5 text-indigo-400 group-hover:-translate-y-0.5 transition-transform" />}
            </button>

            <div className="w-px h-8 bg-white/5 hidden md:block" />

            <div className="flex items-center gap-3 flex-1">
              <button 
                onClick={randomize}
                className="skeuo-button h-14 px-6 rounded-[1.5rem] flex items-center gap-3 text-xs font-black uppercase tracking-[0.2em] text-white flex-1 md:flex-none justify-center"
              >
                <Dices className="w-4 h-4 text-indigo-400" />
                <span className="hidden md:inline">SURPRISE ME</span>
                <span className="md:hidden">CHAOS</span>
              </button>
              <button 
                onClick={undo}
                disabled={history.length === 0}
                className="skeuo-button h-14 px-5 rounded-[1.5rem] flex items-center justify-center disabled:opacity-20"
                title="Oops, I messed up"
              >
                <RotateCcw className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <button 
              onClick={() => setIsExporting(true)}
              className="skeuo-button h-14 px-8 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[1.5rem] flex items-center gap-3 text-xs font-black uppercase tracking-[0.3em] text-white shadow-lg hover:shadow-indigo-500/20"
            >
              <Download className="w-5 h-5" />
              <span className="hidden md:inline">EXPORT ARTWORK</span>
              <span className="md:hidden">SAVE</span>
            </button>
          </div>
        </div>
      </div>

      {/* Export System Overlay */}
      {isExporting && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setIsExporting(false)} />
          <div className="relative w-full max-w-lg skeuo-raised rounded-[3rem] p-10 border border-white/10 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h3 className="text-2xl font-black text-white text-embossed tracking-tight uppercase">THE GOOD STUFF</h3>
                <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.3em] mt-2">Pick your poison</p>
              </div>
              <button onClick={() => setIsExporting(false)} className="skeuo-button p-3 rounded-2xl text-slate-400">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-10">
              <div className="grid grid-cols-3 gap-4">
                {(['png', 'jpeg', 'svg'] as const).map(f => (
                  <button 
                    key={f} onClick={() => setExportSettings(prev => ({ ...prev, format: f }))}
                    className={`py-4 rounded-2xl font-black text-xs uppercase tracking-widest ${exportSettings.format === f ? 'skeuo-pressed text-indigo-400' : 'skeuo-button text-slate-400'}`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {exportSettings.format !== 'svg' && (
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-engraved">Chonky Width</label>
                    <div className="skeuo-pressed p-4 rounded-2xl">
                      <input 
                        type="number" value={exportSettings.width}
                        onChange={(e) => setExportSettings(prev => ({ ...prev, width: parseInt(e.target.value) }))}
                        className="bg-transparent text-white font-black w-full outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-engraved">Tall Height</label>
                    <div className="skeuo-pressed p-4 rounded-2xl">
                      <input 
                        type="number" value={exportSettings.height}
                        onChange={(e) => setExportSettings(prev => ({ ...prev, height: parseInt(e.target.value) }))}
                        className="bg-transparent text-white font-black w-full outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {exportSettings.format === 'svg' && (
                <div className="skeuo-pressed p-6 rounded-3xl border border-indigo-500/20">
                  <p className="text-xs font-black text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-indigo-400 fill-indigo-400" /> Vector Vibes
                  </p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase leading-relaxed tracking-wide">
                    Infinity zoom. Tiny file size. Maximum flex. Use this for web stuff or if you're fancy.
                  </p>
                </div>
              )}

              <button 
                onClick={async () => {
                  await downloadGradient(gradient, exportSettings);
                  setIsExporting(false);
                }}
                className="w-full skeuo-button py-6 bg-white text-slate-950 rounded-3xl font-black text-sm uppercase tracking-[0.4em] transition-all hover:translate-y-[-2px]"
              >
                SHIP IT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Little Sassy Footer */}
      <div className="absolute bottom-10 left-10 hidden lg:block">
        <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.5em]">
          Hand-crafted with vitamin A / v1.6 / Full Screen Flex
        </p>
      </div>
    </div>
  );
};

export default App;
