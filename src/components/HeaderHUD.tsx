import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Wifi, 
  Volume2, 
  VolumeX, 
  Globe, 
  Menu, 
  ShieldCheck, 
  Bell, 
  Sparkles 
} from 'lucide-react';
import { JarvisSettings, SystemStatusData, JarvisState } from '../types';
import { playSciFiSound, stopSpeaking } from '../utils/audio';

interface HeaderHUDProps {
  status: SystemStatusData | null;
  settings: JarvisSettings;
  updateSettings: (partial: Partial<JarvisSettings>) => void;
  onToggleMobileMenu: () => void;
  jarvisState: JarvisState;
}

export const HeaderHUD: React.FC<HeaderHUDProps> = ({
  status,
  settings,
  updateSettings,
  onToggleMobileMenu,
  jarvisState,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleSound = () => {
    if (settings.soundEffectsEnabled) {
      updateSettings({ soundEffectsEnabled: false });
    } else {
      updateSettings({ soundEffectsEnabled: true });
      playSciFiSound('affirmative');
    }
  };

  const toggleSearch = () => {
    if (settings.soundEffectsEnabled) playSciFiSound('click');
    updateSettings({ searchGroundingEnabled: !settings.searchGroundingEnabled });
  };

  const toggleAutoSpeak = () => {
    if (settings.soundEffectsEnabled) playSciFiSound('click');
    if (settings.autoSpeakResponses) {
      stopSpeaking();
    }
    updateSettings({ autoSpeakResponses: !settings.autoSpeakResponses });
  };

  return (
    <header className="w-full bg-[#030712]/90 backdrop-blur-md border-b border-cyan-500/20 px-4 py-2.5 flex items-center justify-between sticky top-0 z-40 select-none">
      {/* Left: Branding & HUD Identifier */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 hover:text-cyan-200"
          title="Open Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-400/40 shadow-[0_0_12px_rgba(0,210,255,0.3)]">
            <Cpu className="w-4 h-4 text-cyan-300 animate-pulse" />
            <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-orbitron font-bold text-sm tracking-wider text-cyan-300">
                J.A.R.V.I.S.
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                MK-85
              </span>
            </div>
            <p className="text-[10px] font-mono text-cyan-400/60 hidden sm:block">
              INTELLIGENT HOLOGRAPHIC ENVIRONMENT
            </p>
          </div>
        </div>
      </div>

      {/* Center: System Telemetry & Live Clock */}
      <div className="hidden md:flex items-center gap-6 font-mono text-xs text-cyan-300/80">
        <div className="flex items-center gap-2">
          <Wifi className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-400">CORE STATUS:</span>
          <span className="text-emerald-400 font-semibold tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            ONLINE
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-slate-400">ENGINE:</span>
          <span className="text-sky-300 font-semibold">
            {settings.aiProvider === 'openai' ? 'GPT-4o-mini' : 'Gemini 3.8 Flash'}
            {settings.voiceProvider === 'elevenlabs' ? ' + ElevenLabs' : ' + WebSpeech'}
          </span>
        </div>

        <div className="px-2.5 py-1 rounded bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 font-bold tracking-widest">
          {currentTime || '00:00:00'}
        </div>
      </div>

      {/* Right: Quick Toggles (Audio, Search Grounding, Vocal Mute) */}
      <div className="flex items-center gap-2">
        {/* Google Search Grounding toggle */}
        <button
          onClick={toggleSearch}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all border ${
            settings.searchGroundingEnabled
              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(0,210,255,0.3)]'
              : 'bg-slate-900/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
          }`}
          title="Toggle Google Search Grounding"
        >
          <Globe className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Search Grounding</span>
          <span className="text-[10px] font-bold">
            {settings.searchGroundingEnabled ? 'ON' : 'OFF'}
          </span>
        </button>

        {/* Vocal Output toggle */}
        <button
          onClick={toggleAutoSpeak}
          className={`p-2 rounded-lg border transition-all ${
            settings.autoSpeakResponses
              ? 'bg-sky-500/20 border-sky-400 text-sky-200 shadow-[0_0_10px_rgba(14,165,233,0.3)]'
              : 'bg-slate-900/60 border-slate-700/60 text-slate-500 hover:text-slate-300'
          }`}
          title={settings.autoSpeakResponses ? 'Voice output active' : 'Voice output muted'}
        >
          {settings.autoSpeakResponses ? (
            <Volume2 className="w-4 h-4 text-sky-300" />
          ) : (
            <VolumeX className="w-4 h-4" />
          )}
        </button>

        {/* SFX sound effects toggle */}
        <button
          onClick={toggleSound}
          className={`p-2 rounded-lg border transition-all ${
            settings.soundEffectsEnabled
              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
              : 'bg-slate-900/60 border-slate-700/60 text-slate-500'
          }`}
          title={settings.soundEffectsEnabled ? 'Sound Effects Active' : 'Sound Effects Disabled'}
        >
          <Bell className="w-4 h-4" />
        </button>

        {/* Iron Man arc shield indicator */}
        <div className="hidden xl:flex items-center gap-1.5 pl-2 border-l border-cyan-500/20 text-xs font-mono text-cyan-400/70">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>SECURITY MK-85</span>
        </div>
      </div>
    </header>
  );
};
