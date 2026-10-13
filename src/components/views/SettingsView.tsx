import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Volume2, 
  Brain, 
  Download, 
  Upload, 
  RotateCcw, 
  ShieldCheck, 
  Cpu, 
  Globe, 
  Bot, 
  Zap, 
  Sparkles,
  Lock
} from 'lucide-react';
import { JarvisSettings, MemoryItem, TaskItem, SystemStatusData } from '../../types';
import { getAvailableVoices, playSciFiSound } from '../../utils/audio';
import { fetchSystemStatus } from '../../services/api';
import { SystemDiagnostics } from '../SystemDiagnostics';

interface SettingsViewProps {
  settings: JarvisSettings;
  updateSettings: (partial: Partial<JarvisSettings>) => void;
  memories: MemoryItem[];
  tasks: TaskItem[];
  onImportData: (data: { memories: MemoryItem[]; tasks: TaskItem[]; settings: JarvisSettings }) => void;
  onResetAllData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  updateSettings,
  memories,
  tasks,
  onImportData,
  onResetAllData,
}) => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [personaDirective, setPersonaDirective] = useState(settings.customPersonaDirective || '');
  const [backupNotice, setBackupNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatusData | null>(null);

  useEffect(() => {
    getAvailableVoices().then(setVoices);
    fetchSystemStatus().then(setSystemStatus).catch(() => {});
  }, []);

  const handleExport = () => {
    const backup = {
      app: 'J.A.R.V.I.S. AI Personal Assistant',
      version: 'MK-85',
      exportDate: new Date().toISOString(),
      settings,
      memories,
      tasks,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `jarvis_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    if (settings.soundEffectsEnabled) playSciFiSound('affirmative');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.memories || parsed.tasks || parsed.settings) {
          onImportData({
            memories: parsed.memories || [],
            tasks: parsed.tasks || [],
            settings: parsed.settings || settings,
          });
          if (settings.soundEffectsEnabled) playSciFiSound('affirmative');
          setBackupNotice({ type: 'success', message: 'J.A.R.V.I.S. data successfully restored from backup.' });
        } else {
          setBackupNotice({ type: 'error', message: 'Invalid backup file structure.' });
        }
      } catch (err) {
        setBackupNotice({ type: 'error', message: 'Could not parse JSON backup file.' });
      }
    };
    reader.readAsText(file);
  };

  const handleSavePersona = () => {
    updateSettings({ customPersonaDirective: personaDirective.trim() });
    if (settings.soundEffectsEnabled) playSciFiSound('affirmative');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border border-cyan-500/30 backdrop-blur-md flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-cyan-400" />
            <h2 className="font-orbitron font-bold text-lg text-cyan-200">
              SYSTEM CONFIGURATION & MULTI-SERVICE PROTOCOLS
            </h2>
          </div>
          <p className="text-xs text-slate-300 font-sans">
            Manage ElevenLabs voice synthesis, OpenAI GPT & Whisper models, Google Search grounding, and persona directives.
          </p>
        </div>
      </div>

      {/* Multi-Service API Engine Status Cards */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-cyan-500/30 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-cyan-300 font-orbitron font-bold text-sm">
            <Lock className="w-4 h-4 text-cyan-400" />
            <span>SECURE MULTI-SERVICE ENGINE STATUS (SERVER-SIDE)</span>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            KEYS SECURED IN .ENV
          </span>
        </div>
        <p className="text-xs text-slate-300 font-sans leading-relaxed">
          All API credentials (<code className="text-cyan-300">ELEVENLABS_API_KEY</code>, <code className="text-cyan-300">GOOGLE_SEARCH_API_KEY</code>, <code className="text-cyan-300">OPENAI_API_KEY</code>, <code className="text-cyan-300">GEMINI_API_KEY</code>) are securely loaded into the server environment (<code className="text-slate-300">process.env</code>) and never exposed to the frontend browser bundle.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono pt-1">
          {/* ElevenLabs */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-sky-500/30 space-y-1.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sky-300 font-bold flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5" />
                  ElevenLabs
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">High-fidelity British voice synthesis with automatic Web Speech fallback.</p>
            </div>
            <div className="text-[10px] text-emerald-400 font-bold mt-2">CONFIGURED & ACTIVE</div>
          </div>

          {/* Google Search API */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-emerald-500/30 space-y-1.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-emerald-300 font-bold flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  Google Search
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Real-time web grounding and live citation chunk extraction.</p>
            </div>
            <div className="text-[10px] text-emerald-400 font-bold mt-2">CONFIGURED & ACTIVE</div>
          </div>

          {/* OpenAI GPT & Whisper */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-indigo-500/30 space-y-1.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-indigo-300 font-bold flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5" />
                  OpenAI & Whisper
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">GPT-4o-mini reasoning and Whisper STT fallback for sandboxed iframes.</p>
            </div>
            <div className="text-[10px] text-emerald-400 font-bold mt-2">CONFIGURED & ACTIVE</div>
          </div>

          {/* Google Gemini */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-cyan-500/30 space-y-1.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-cyan-300 font-bold flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5" />
                  Gemini MK-85
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Gemini 3.8 Flash multimodal reasoning, vision, and schedule parser.</p>
            </div>
            <div className="text-[10px] text-emerald-400 font-bold mt-2">CORE ONLINE</div>
          </div>
        </div>
      </div>

      {/* Engine Selection & Acoustic Parameters */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-cyan-500/20 space-y-4">
        <h3 className="font-orbitron font-bold text-sm text-cyan-300 flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-cyan-400" />
          <span>VOCAL SYNTHESIS & AI REASONING SELECTOR</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          {/* Voice Engine Toggle */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-cyan-500/20 space-y-2">
            <label className="text-slate-300 font-bold block">Primary Vocal Engine</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => updateSettings({ voiceProvider: 'elevenlabs' })}
                className={`py-2 px-3 rounded-lg text-xs font-mono font-bold transition-all border ${
                  settings.voiceProvider === 'elevenlabs'
                    ? 'bg-sky-500/20 border-sky-400 text-sky-200 shadow-[0_0_10px_rgba(14,165,233,0.3)]'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                ElevenLabs (Neural)
              </button>

              <button
                type="button"
                onClick={() => updateSettings({ voiceProvider: 'webspeech' })}
                className={`py-2 px-3 rounded-lg text-xs font-mono font-bold transition-all border ${
                  settings.voiceProvider === 'webspeech'
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(0,210,255,0.3)]'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                Native Web Speech API
              </button>
            </div>
            <p className="text-[10px] text-slate-400">
              {settings.voiceProvider === 'elevenlabs'
                ? 'High-definition British voice. Automatically falls back to Web Speech API if quota expires.'
                : 'Zero-latency browser speech synthesis with Daniel/George British voice.'}
            </p>
          </div>

          {/* AI Model Provider Toggle */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-cyan-500/20 space-y-2">
            <label className="text-slate-300 font-bold block">Primary Neural Reasoner</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => updateSettings({ aiProvider: 'gemini' })}
                className={`py-2 px-3 rounded-lg text-xs font-mono font-bold transition-all border ${
                  settings.aiProvider === 'gemini'
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(0,210,255,0.3)]'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                Gemini 3.8 Flash
              </button>

              <button
                type="button"
                onClick={() => updateSettings({ aiProvider: 'openai' })}
                className={`py-2 px-3 rounded-lg text-xs font-mono font-bold transition-all border ${
                  settings.aiProvider === 'openai'
                    ? 'bg-indigo-500/20 border-indigo-400 text-indigo-200 shadow-[0_0_10px_rgba(99,102,241,0.3)]'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                OpenAI GPT-4o-mini
              </button>
            </div>
            <p className="text-[10px] text-slate-400">
              {settings.aiProvider === 'gemini'
                ? 'High-speed reasoning with native Google Search grounding and multimodal vision.'
                : 'OpenAI GPT-4o-mini cognitive bridge with Whisper speech-to-text fallback.'}
            </p>
          </div>

          {/* Browser Voice Selector for Web Speech fallback */}
          <div>
            <label className="text-slate-400 block mb-1">Web Speech Fallback Voice</label>
            <select
              value={settings.voiceURI || ''}
              onChange={(e) => updateSettings({ voiceURI: e.target.value })}
              className="w-full p-2.5 rounded-lg bg-slate-950 border border-cyan-500/30 text-cyan-200 focus:outline-none"
            >
              <option value="">Auto-Detect (British English / Daniel Preferred)</option>
              {voices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col justify-center space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Auto-Speak Text Responses</span>
              <button
                type="button"
                onClick={() => updateSettings({ autoSpeakResponses: !settings.autoSpeakResponses })}
                className={`px-3 py-1 rounded text-xs font-mono font-bold ${
                  settings.autoSpeakResponses
                    ? 'bg-cyan-500 text-slate-950'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {settings.autoSpeakResponses ? 'ENABLED' : 'MUTED'}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-300">Sci-Fi Sound Effects</span>
              <button
                type="button"
                onClick={() => updateSettings({ soundEffectsEnabled: !settings.soundEffectsEnabled })}
                className={`px-3 py-1 rounded text-xs font-mono font-bold ${
                  settings.soundEffectsEnabled
                    ? 'bg-cyan-500 text-slate-950'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {settings.soundEffectsEnabled ? 'ACTIVE' : 'MUTED'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* J.A.R.V.I.S. Persona Directive Customizer */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-cyan-500/20 space-y-3">
        <h3 className="font-orbitron font-bold text-sm text-cyan-300 flex items-center gap-2">
          <Brain className="w-4 h-4 text-cyan-400" />
          <span>PERSONAL DIRECTIVE & MANNERISMS</span>
        </h3>
        <p className="text-xs text-slate-400 font-sans">
          Created by Tony Shakir hussain. Enforces calm technical authority, punchy 1 to 3 sentence responses, zero conversational fluff, and addressing the user as Sir or Boss.
        </p>

        <textarea
          value={personaDirective}
          onChange={(e) => setPersonaDirective(e.target.value)}
          rows={3}
          placeholder="Created by Tony Shakir hussain. Address user as Sir or Boss. Keep responses brief (1-3 sentences) and strictly avoid fluff."
          className="w-full p-3 rounded-xl bg-slate-950 border border-cyan-500/30 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-400"
        />

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSavePersona}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono transition-colors"
          >
            Save Persona Directive
          </button>
        </div>
      </div>

      {/* Data Backup & Restore */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-cyan-500/20 space-y-4">
        <h3 className="font-orbitron font-bold text-sm text-cyan-300 flex items-center gap-2">
          <Download className="w-4 h-4 text-cyan-400" />
          <span>DATA BACKUP & LOCAL RESTORATION</span>
        </h3>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleExport}
            className="px-4 py-2.5 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-mono flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Backup JSON</span>
          </button>

          <label className="cursor-pointer px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-mono flex items-center gap-2 transition-colors">
            <Upload className="w-4 h-4 text-cyan-400" />
            <span>Restore from File</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={() => {
              if (window.confirm('Reset all local J.A.R.V.I.S. data (memories, tasks, settings)?')) {
                onResetAllData();
                playSciFiSound('alert');
              }
            }}
            className="px-4 py-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-center gap-2 transition-colors ml-auto cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Local Database</span>
          </button>
        </div>

        {backupNotice && (
          <div className={`p-3 rounded-xl text-xs font-mono border ${
            backupNotice.type === 'success'
              ? 'bg-emerald-950/50 border-emerald-500/30 text-emerald-200'
              : 'bg-rose-950/50 border-rose-500/30 text-rose-200'
          }`}>
            {backupNotice.message}
          </div>
        )}
      </div>

      {/* Hardware & Multi-Service Diagnostics */}
      <SystemDiagnostics soundEffectsEnabled={settings.soundEffectsEnabled} />
    </div>
  );
};
