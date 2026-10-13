import React, { useState } from 'react';
import { 
  Power, 
  Mic, 
  MicOff, 
  Square, 
  Radio, 
  Sparkles, 
  CheckCircle, 
  AlertCircle, 
  Globe, 
  RefreshCw, 
  Volume2, 
  Layers, 
  Cpu, 
  CheckSquare, 
  Brain, 
  ArrowRight, 
  MessageSquare,
  Zap
} from 'lucide-react';
import { HolographicFace } from '../HolographicFace';
import { JarvisOrb } from '../JarvisOrb';
import { SystemDiagnostics } from '../SystemDiagnostics';
import { JarvisState, NavTab, TaskItem, MemoryItem, SystemStatusData, JarvisSettings } from '../../types';
import { playSciFiSound, speakText, stopSpeaking } from '../../utils/audio';

interface DashboardViewProps {
  jarvisState: JarvisState;
  isActive: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  isWakeWordListening: boolean;
  onTogglePower: () => void;
  onToggleWakeWord: () => void;
  onStartManualVoice: () => void;
  onStopAll: () => void;
  onNavigate: (tab: NavTab) => void;
  onQuickPrompt: (prompt: string) => void;
  tasks: TaskItem[];
  memories: MemoryItem[];
  status: SystemStatusData | null;
  settings: JarvisSettings;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  jarvisState,
  isActive,
  isListening,
  isSpeaking,
  isWakeWordListening,
  onTogglePower,
  onToggleWakeWord,
  onStartManualVoice,
  onStopAll,
  onNavigate,
  onQuickPrompt,
  tasks,
  memories,
  status,
  settings,
}) => {
  const [faceMode, setFaceMode] = useState<'hologram-face' | 'classic-orb'>('hologram-face');
  const pendingTasks = tasks.filter((t) => !t.completed).slice(0, 3);
  const recentMemories = memories.slice(0, 3);

  const quickPrompts = [
    { label: 'Say: "JARVIS, plan my day"', query: 'Plan my day and highlight priority objectives.' },
    { label: 'Say: "JARVIS, search latest tech"', query: 'Search the web for the latest artificial intelligence breakthroughs today.' },
    { label: 'Say: "JARVIS, diagnostic check"', query: 'Run a full system status diagnostic and confirm ready modules.' },
    { label: 'Say: "JARVIS, summarize tasks"', query: 'Summarize my pending tasks and upcoming deadlines.' },
  ];

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-950/40 via-blue-950/20 to-slate-900/60 border border-cyan-500/25 p-5 backdrop-blur-md">
        <div className="absolute inset-0 hologram-grid opacity-30 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>MARK LXXXV // HOLOGRAPHIC INTERFACE</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-orbitron font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-sky-100 to-blue-400">
              J.A.R.V.I.S. Autonomous Control Deck
            </h1>
            <p className="text-xs text-slate-300 font-sans max-w-lg">
              Say <strong className="text-cyan-300">"JARVIS [command]"</strong> or use the manual controls below. Fast 1-3 sentence answers, real-time Google search grounding, and holographic face animations.
            </p>
          </div>

          {/* Quick Nav Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onNavigate('chat')}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs font-mono transition-all shadow-[0_0_15px_rgba(0,210,255,0.4)] flex items-center gap-2"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>AI Chat</span>
            </button>
            <button
              onClick={() => onNavigate('voice')}
              className="px-3.5 py-2 rounded-xl bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-400/40 text-cyan-200 text-xs font-mono transition-all flex items-center gap-1.5"
            >
              <Mic className="w-3.5 h-3.5 text-cyan-400" />
              <span>Voice Deck</span>
            </button>
          </div>
        </div>
      </div>

      {/* Central Visual Hologram Card (Face or Orb) */}
      <div className="relative rounded-2xl bg-gradient-to-b from-[#0a1128]/90 via-[#030712] to-[#030712] border border-cyan-500/30 p-6 flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 hex-pattern opacity-25 pointer-events-none" />

        {/* View Switcher: Holographic Face vs Classic Orb */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-1 p-1 rounded-xl bg-slate-900/80 border border-cyan-500/20 text-[10px] font-mono">
          <button
            onClick={() => {
              setFaceMode('hologram-face');
              if (settings.soundEffectsEnabled) playSciFiSound('click');
            }}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              faceMode === 'hologram-face'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-cyan-300'
            }`}
          >
            Holographic Face
          </button>
          <button
            onClick={() => {
              setFaceMode('classic-orb');
              if (settings.soundEffectsEnabled) playSciFiSound('click');
            }}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              faceMode === 'classic-orb'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-cyan-300'
            }`}
          >
            Reactor Orb
          </button>
        </div>

        {/* Visual Component Render */}
        <div className="my-2">
          {faceMode === 'hologram-face' ? (
            <HolographicFace
              isActive={isActive}
              isListening={isListening}
              isSpeaking={isSpeaking}
              isWakeWordListening={isWakeWordListening}
              onFaceClick={onStartManualVoice}
            />
          ) : (
            <JarvisOrb
              state={jarvisState}
              size="hero"
              onClick={onStartManualVoice}
            />
          )}
        </div>

        {/* ======================================================== */}
        {/* MANUAL CONTROLS: Power, Wake Word, Voice, Stop */}
        {/* ======================================================== */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3 z-10">
          {/* 1. POWER BUTTON */}
          <button
            onClick={onTogglePower}
            className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold flex items-center gap-2 transition-all border ${
              isActive
                ? 'bg-emerald-950/80 hover:bg-emerald-900 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-400'
            }`}
            title="Toggle System Power (Active / Standby)"
          >
            <Power className="w-4 h-4 text-emerald-400" />
            <span>POWER: {isActive ? 'ACTIVE' : 'STANDBY'}</span>
          </button>

          {/* 2. WAKE WORD TOGGLE ("JARVIS") */}
          <button
            onClick={onToggleWakeWord}
            disabled={!isActive}
            className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold flex items-center gap-2 transition-all border ${
              !isActive
                ? 'opacity-40 cursor-not-allowed bg-slate-900 border-slate-800 text-slate-500'
                : isWakeWordListening
                ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-[0_0_20px_rgba(0,210,255,0.5)] animate-pulse'
                : 'bg-cyan-950/70 hover:bg-cyan-900 border-cyan-500/40 text-cyan-300'
            }`}
            title="Toggle Always-Listening for 'JARVIS'"
          >
            <Radio className="w-4 h-4" />
            <span>WAKE WORD: {isWakeWordListening ? 'ARMED ("JARVIS")' : 'MUTED'}</span>
          </button>

          {/* 3. MANUAL PUSH-TO-TALK */}
          <button
            onClick={onStartManualVoice}
            disabled={!isActive}
            className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold flex items-center gap-2 transition-all border ${
              !isActive
                ? 'opacity-40 cursor-not-allowed bg-slate-900 border-slate-800 text-slate-500'
                : isListening
                ? 'bg-rose-500 text-white border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.6)] animate-pulse'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 border-transparent shadow-[0_0_15px_rgba(0,210,255,0.3)]'
            }`}
            title="Push to Talk"
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            <span>{isListening ? 'LISTENING NOW...' : 'VOICE COMMAND'}</span>
          </button>

          {/* 4. STOP / HALT BUTTON */}
          <button
            onClick={onStopAll}
            className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-rose-950/70 border border-slate-700 hover:border-rose-500/50 text-slate-300 hover:text-rose-200 font-mono text-xs flex items-center gap-1.5 transition-colors"
            title="Stop speech & reset audio stream"
          >
            <Square className="w-3.5 h-3.5 fill-current text-rose-400" />
            <span>HALT / RESET</span>
          </button>
        </div>

        {/* Suggested Voice Commands */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 max-w-3xl">
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => onQuickPrompt(p.query)}
              className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-cyan-950/60 border border-cyan-500/25 hover:border-cyan-400/60 text-xs font-mono text-cyan-300 transition-all shadow-sm flex items-center gap-1.5"
            >
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ======================================================== */}
      {/* HARDWARE DIAGNOSTICS & SYSTEM VERIFICATION SUITE */}
      {/* ======================================================== */}
      <SystemDiagnostics soundEffectsEnabled={settings.soundEffectsEnabled} />

      {/* Two Column Section: Upcoming Tasks & Memory Bank Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Upcoming Tasks */}
        <div className="rounded-xl bg-slate-900/50 border border-cyan-500/20 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-cyan-400" />
              <h3 className="font-orbitron font-semibold text-sm text-cyan-300">
                ACTIVE OBJECTIVES ({tasks.filter(t => !t.completed).length})
              </h3>
            </div>
            <button
              onClick={() => onNavigate('tasks')}
              className="text-xs font-mono text-cyan-400 hover:text-cyan-200 flex items-center gap-1"
            >
              <span>Manage Tasks</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {pendingTasks.length === 0 ? (
            <div className="p-6 rounded-lg bg-slate-950/40 border border-slate-800 text-center text-xs font-mono text-slate-400">
              No pending tasks. Say "JARVIS, remind me to..." to schedule an objective.
            </div>
          ) : (
            <div className="space-y-2">
              {pendingTasks.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-lg bg-slate-950/60 border border-cyan-500/15 flex items-center justify-between"
                >
                  <div>
                    <div className="text-sm font-medium text-slate-200">{t.title}</div>
                    <div className="text-[11px] font-mono text-cyan-400/60 flex items-center gap-2 mt-0.5">
                      <span>{t.dueDate || 'Today'}</span>
                      {t.dueTime && <span>• {t.dueTime}</span>}
                      <span>• [{t.priority.toUpperCase()}]</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                    {t.category}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Personal Memory Bank */}
        <div className="rounded-xl bg-slate-900/50 border border-cyan-500/20 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-indigo-400" />
              <h3 className="font-orbitron font-semibold text-sm text-indigo-300">
                RECALLED PREFERENCES ({memories.length})
              </h3>
            </div>
            <button
              onClick={() => onNavigate('memory')}
              className="text-xs font-mono text-indigo-400 hover:text-indigo-200 flex items-center gap-1"
            >
              <span>Manage Memories</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {recentMemories.length === 0 ? (
            <div className="p-6 rounded-lg bg-slate-950/40 border border-slate-800 text-center text-xs font-mono text-slate-400">
              No user memories stored yet. Record personal facts in the Memory Bank.
            </div>
          ) : (
            <div className="space-y-2">
              {recentMemories.map((m) => (
                <div
                  key={m.id}
                  className="p-3 rounded-lg bg-slate-950/60 border border-indigo-500/15 flex items-center justify-between"
                >
                  <div className="text-sm text-slate-200 line-clamp-1">{m.content}</div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-500/30 shrink-0 ml-2">
                    {m.category}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
