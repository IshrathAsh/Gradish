
import React, { useState, useCallback, useMemo, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  RefreshCw, 
  Download, 
  Sparkles, 
  RotateCcw,
  X,
  Dices,
  Joystick,
  Gamepad2,
  Layers,
  Check,
  Eye,
  EyeOff
} from 'lucide-react';
import { GradientState, ColorStop, ExportSettings } from './types';
import { generateAIPalette } from './services/geminiService';
import { downloadGradient } from './utils/exportUtils';

const DEFAULT_STOPS: ColorStop[] = [
  { id: '1', color: '#ffcc00', position: 0 },
  { id: '2', color: '#ff0066', position: 100 },
];

const App: React.FC = () => {
  const [gradient, setGradient] = useState<GradientState>({
    type: 'linear',
    angle: 145,
    stops: DEFAULT_STOPS,
  });
  const [isExporting, setIsExporting] = useState(false);
  const [isConsoleHidden, setIsConsoleHidden] = useState(false);
  const [copied, setCopied] = useState(false);
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    width: 1920,
    height: 1080,
    format: 'png',
    quality: 0.9,
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
      position: Math.round((i / (count - 1)) * 100),
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
        position: Math.round((i / (result.colors.length - 1)) * 100),
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

  const knobRef = useRef<HTMLDivElement>(null);
  const isDraggingKnob = useRef(false);

  const startDragging = (e: React.MouseEvent | React.TouchEvent) => {
    isDraggingKnob.current = true;
    document.addEventListener('mousemove', handleDragging);
    document.addEventListener('mouseup', stopDragging);
    document.addEventListener('touchmove', handleDragging as any);
    document.addEventListener('touchend', stopDragging);
  };

  const stopDragging = () => {
    isDraggingKnob.current = false;
    document.removeEventListener('mousemove', handleDragging);
    document.removeEventListener('mouseup', stopDragging);
    document.removeEventListener('touchmove', handleDragging as any);
    document.removeEventListener('touchend', stopDragging);
  };

  const handleDragging = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDraggingKnob.current || !knobRef.current) return;
    const rect = knobRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const angle = Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI) + 90;
    const normalizedAngle = (angle + 360) % 360;
    setGradient(prev => ({ ...prev, angle: Math.round(normalizedAngle), type: 'linear' }));
  }, []);

  const toggleType = (e: React.MouseEvent) => {
    e.stopPropagation();
    setGradient(prev => ({ ...prev, type: prev.type === 'linear' ? 'radial' : 'linear' }));
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black flex flex-col items-center">
      <div className="absolute inset-0 transition-all duration-700 ease-in-out" style={{ background: cssGradient }} />

      {/* MINI HANDHELD LOGO CONSOLE */}
      <div className={`absolute top-6 left-6 z-10 pointer-events-none transition-all duration-500 ${isConsoleHidden ? 'opacity-20 scale-90 translate-x-[-10px]' : 'opacity-100'}`}>
        <div className="console-chassis w-max p-1.5 rounded-xl flex items-center shadow-2xl border-2 border-white/5">
          {/* Mini Screen Area */}
          <div className="skeuo-pressed-well px-3 py-1.5 rounded-lg flex flex-col items-start border-2 border-black/40">
             <h1 className="text-3xl font-funny text-white leading-none tracking-tight text-embossed">Gradish!</h1>
             <div className="flex items-center gap-2 mt-1">
                <p className="text-[7px] font-bold text-indigo-300/60 uppercase tracking-[0.2em] leading-none">
                  nom nom your colours
                </p>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse"></div>
             </div>
          </div>
        </div>
      </div>

      {/* REVEAL HANDLE */}
      <button 
        onClick={() => setIsConsoleHidden(false)}
        className={`fixed bottom-0 z-[60] bg-[#2a2d3e] px-10 py-4 rounded-t-3xl border-t-2 border-x-2 border-[#454a66] shadow-[0_-5px_25px_rgba(0,0,0,0.6)] transition-all duration-500 hover:py-6 flex flex-col items-center gap-1 group ${isConsoleHidden ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}
      >
        <Eye className="w-6 h-6 text-orange-400 animate-pulse group-hover:scale-110 transition-transform" />
        <span className="engraved-label text-[7px] text-orange-400/50 uppercase font-black">Open Lab</span>
      </button>

      {/* MAIN CONSOLE CONTAINER */}
      <div 
        className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-700 cubic-bezier(0.34, 1.56, 0.64, 1) ${isConsoleHidden ? 'translate-y-[120%] opacity-0 scale-90' : 'translate-y-0 opacity-100 scale-100'}`}
      >
        <div className="console-chassis h-full w-max max-w-[95vw] px-6 py-4 flex flex-col items-center relative transition-all duration-500">
          
          {/* Status Bar */}
          <div className="flex justify-between items-center mb-3 px-2 w-full">
            <div className="flex gap-4 items-center">
               <span className="engraved-label text-[9px]">SESSION: I/O_01</span>
               <div className="w-px h-3 bg-white/10" />
               <div className="flex gap-1.5 items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] animate-pulse"></div>
                  <span className="engraved-label text-emerald-400/80 text-[9px]">ACTIVE</span>
               </div>
            </div>

            <div className="flex gap-4 items-center">
              <span className="engraved-label text-[9px]">V_2.5_LAB</span>
            </div>
          </div>

          {/* MAIN CONTENT ROW - MIDDLE ALIGNED & TRULY RESPONSIVE */}
          <div className="flex justify-center flex-row gap-5 items-center w-full min-h-[160px]">
            
            {/* AI Prompt Section - Centered content */}
            <div className="w-40 flex flex-col gap-3 shrink-0">
              <div className="skeuo-pressed-well p-2.5 rounded-2xl h-24 flex flex-col shrink-0">
                <span className="engraved-label text-[8px] mb-1 opacity-50 uppercase">PROMPT</span>
                <textarea 
                  placeholder="Vibe..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="w-full bg-transparent border-none resize-none text-[12px] font-bold text-indigo-300 placeholder:text-indigo-900/40 focus:outline-none flex-1 no-scrollbar leading-tight"
                />
              </div>
              <button onClick={handleAiGenerate} disabled={isAiLoading} className="skeuo-game-button h-8 rounded-xl flex items-center justify-center gap-2 shrink-0">
                {isAiLoading ? <RefreshCw className="w-3.5 h-3.5 text-white animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-white" />}
                <span className="font-funny text-[10px] text-white uppercase">Sync</span>
              </button>
            </div>

            {/* Mixer Section - Shrinks/Grows based on modules */}
            <div className="flex-initial bg-white/5 rounded-3xl p-2 border border-white/5 flex gap-4 items-center overflow-hidden transition-all duration-500">
              {/* Knob Controller */}
              <div className="flex flex-col items-center justify-center gap-1 shrink-0 bg-black/20 rounded-2xl px-4 py-4">
                <div ref={knobRef} onMouseDown={startDragging} onTouchStart={startDragging} className="knob-container scale-[0.85]">
                    <div className="knob-body" style={{ transform: `rotate(${gradient.type === 'linear' ? gradient.angle : 0}deg)` }}>
                        {gradient.type === 'linear' && <div className="knob-indicator"></div>}
                        <button onClick={toggleType} className="knob-center hover:scale-105 active:scale-95 transition-transform shadow-2xl">
                            {gradient.type === 'linear' ? <Joystick className="w-4 h-4 text-indigo-400" /> : <Gamepad2 className="w-4 h-4 text-orange-400" />}
                        </button>
                    </div>
                </div>
                <div className="text-center mt-1">
                   <span className="engraved-label text-[7px] block text-orange-500/80 uppercase tracking-tighter leading-none">{gradient.type}</span>
                   <span className="font-mono text-[10px] font-black text-white">{gradient.type === 'linear' ? `${gradient.angle}°` : 'RAD'}</span>
                </div>
              </div>

              {/* Dynamic Color Track - Horizontal scroll only if it hits screen limits */}
              <div className="flex-1 flex flex-col min-w-0">
                <div className="flex justify-between items-center px-1 mb-1">
                  <span className="engraved-label text-[8px] opacity-60 uppercase">MIXER</span>
                  <span className="engraved-label text-[7px]">{gradient.stops.length} MODS</span>
                </div>
                <div className="skeuo-pressed-well p-2 rounded-2xl flex flex-row gap-3 items-center justify-start border border-black/40 shadow-inner overflow-x-auto color-track-well pb-3 scroll-smooth">
                  {gradient.stops.map(stop => (
                    <div key={stop.id} className="skeuo-raised-plastic p-2 rounded-xl shrink-0 flex flex-col items-center justify-between w-14 h-32 relative group transition-all duration-300">
                      <div className="w-9 h-9 rounded-full color-bubble border-2 border-black/80 relative overflow-hidden shrink-0 shadow-lg">
                        <input 
                          type="color" 
                          value={stop.color} 
                          onChange={(e) => updateStop(stop.id, { color: e.target.value })} 
                          className="absolute inset-0 scale-[10] cursor-pointer" 
                        />
                      </div>

                      <div className="flex-1 flex flex-col items-center justify-center gap-1 w-full my-1.5">
                        <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          value={stop.position} 
                          onChange={(e) => updateStop(stop.id, { position: parseInt(e.target.value) })} 
                          className="vertical-slider h-12" 
                          style={{ appearance: 'slider-vertical' } as any}
                        />
                        <span className="font-mono text-[8px] text-white/50 font-bold">{stop.position}%</span>
                      </div>

                      <button 
                        onClick={() => removeStop(stop.id)} 
                        disabled={gradient.stops.length <= 2} 
                        className="text-white/10 hover:text-red-500 disabled:opacity-0 transition-colors p-0.5"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  {/* Add Slot Button */}
                  {gradient.stops.length < 8 && (
                    <button 
                      onClick={addStop} 
                      className="skeuo-raised-plastic h-32 rounded-xl shrink-0 flex flex-col items-center justify-center gap-1 w-14 border-dashed border-2 border-white/10 hover:border-orange-500/40 hover:bg-white/5 transition-all group"
                    >
                      <Plus className="w-5 h-5 text-white/30 group-hover:text-orange-400 group-hover:scale-125 transition-transform" />
                      <span className="engraved-label text-[6px] text-white/20 uppercase tracking-tight group-hover:text-white/40">Inject</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Actions Section - Centered content */}
            <div className="w-32 flex flex-col gap-3 shrink-0">
               <div className="flex gap-2 shrink-0 h-14">
                  <button onClick={randomize} className="skeuo-game-button flex-1 rounded-2xl flex flex-col items-center justify-center gap-1 group">
                    <Dices className="w-4 h-4 text-white group-hover:rotate-45 transition-transform" />
                    <span className="font-funny text-[9px] text-white uppercase leading-none">Spice</span>
                  </button>
                  <button onClick={undo} disabled={history.length === 0} className="skeuo-secondary-button w-10 rounded-2xl flex items-center justify-center disabled:opacity-20 active:scale-95">
                    <RotateCcw className="w-3.5 h-3.5 text-white" />
                  </button>
               </div>
               <button onClick={() => setIsExporting(true)} className="skeuo-game-button h-10 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] shrink-0" style={{ backgroundImage: 'linear-gradient(180deg, #34d399 0%, #065f46 100%)', boxShadow: '0 3px 0 #064e3b, 0 6px 10px rgba(0,0,0,0.5)', borderColor: '#6ee7b7' }}>
                <Download className="w-4 h-4 text-white" />
                <span className="font-funny text-[12px] text-white uppercase tracking-tight">Export</span>
              </button>
            </div>
          </div>

          {/* FOOTER BAR */}
          <div className="flex items-center justify-between px-2 mt-4 h-6 border-t border-white/5 pt-2 w-full">
            {/* Left: Branding */}
            <span className="engraved-label opacity-40 text-[8px]">@2026 Gradish labs</span>

            {/* Middle: Hide Console Toggle - Centered as requested */}
            <button 
              onClick={() => setIsConsoleHidden(true)}
              className="flex items-center gap-2 px-4 h-full bg-black/20 hover:bg-black/40 rounded-full border border-white/5 transition-all group"
            >
              <EyeOff className="w-3 h-3 text-orange-500 group-hover:scale-110 transition-transform" />
              <span className="engraved-label text-[8px] opacity-40 group-hover:opacity-100 transition-opacity">Hide Lab</span>
            </button>

            {/* Right: Source Copy Button - Moved to right as requested */}
            <button onClick={copyCss} className="flex items-center gap-2 px-3 h-full bg-black/50 rounded-full text-[8px] font-black text-indigo-400 hover:text-white transition-all uppercase tracking-[0.1em] border border-white/5">
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Layers className="w-3 h-3" />}
              {copied ? 'Copied' : 'Source'}
            </button>
          </div>
        </div>
      </div>

      {isExporting && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setIsExporting(false)} />
          <div className="relative w-full max-w-md skeuo-raised-plastic p-8 rounded-[3.5rem] border-4 border-indigo-900/50 animate-in zoom-in-95 duration-200">
             <div className="flex justify-between items-center mb-6">
               <h3 className="text-2xl font-funny text-white uppercase tracking-tight">Shipping Depot</h3>
               <button onClick={() => setIsExporting(false)} className="skeuo-secondary-button p-2 rounded-xl active:scale-90"><X className="w-5 h-5 text-white" /></button>
             </div>
             <div className="space-y-6">
                <div className="flex gap-2">
                  {(['png', 'jpeg', 'svg'] as const).map(f => (
                    <button key={f} onClick={() => setExportSettings(prev => ({ ...prev, format: f }))} className={`flex-1 py-3 rounded-xl font-black uppercase text-[11px] transition-all ${exportSettings.format === f ? 'skeuo-pressed-well text-orange-400 border-orange-500/30' : 'skeuo-secondary-button text-white/60'}`}>{f}</button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="skeuo-pressed-well p-3 rounded-xl">
                    <label className="engraved-label block mb-1 text-[9px]">OUTPUT_WIDE</label>
                    <input type="number" value={exportSettings.width} onChange={(e) => setExportSettings(prev => ({ ...prev, width: parseInt(e.target.value) }))} className="bg-transparent text-white font-black w-full outline-none font-mono text-lg" />
                  </div>
                  <div className="skeuo-pressed-well p-3 rounded-xl">
                    <label className="engraved-label block mb-1 text-[9px]">OUTPUT_TALL</label>
                    <input type="number" value={exportSettings.height} onChange={(e) => setExportSettings(prev => ({ ...prev, height: parseInt(e.target.value) }))} className="bg-transparent text-white font-black w-full outline-none font-mono text-lg" />
                  </div>
                </div>
                <button onClick={async () => { await downloadGradient(gradient, exportSettings); setIsExporting(false); }} className="w-full skeuo-game-button py-5 rounded-2xl font-funny text-xl text-white uppercase shadow-2xl hover:brightness-110 active:scale-[0.97]">Deliver</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
