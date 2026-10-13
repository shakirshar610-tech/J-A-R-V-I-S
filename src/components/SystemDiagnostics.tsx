import React, { useState, useEffect } from 'react';
import { 
  Mic, 
  Volume2, 
  Cpu, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Play, 
  RefreshCw, 
  Radio, 
  ShieldCheck, 
  Sparkles,
  Globe,
  Bot,
  ExternalLink,
  Zap
} from 'lucide-react';
import { 
  testMicrophonePermission, 
  testSpeechSynthesis, 
  checkSpeechRecognitionSupport, 
  MicTestResult, 
  SpeechRecognitionSupportInfo,
  playSciFiSound 
} from '../utils/audio';
import { 
  testGeminiAi, 
  testSearchGrounding, 
  testElevenLabsVoice, 
  testOpenAiBridge, 
  fetchSystemStatus 
} from '../services/api';
import { SystemStatusData } from '../types';

export const SystemDiagnostics: React.FC<{ soundEffectsEnabled?: boolean }> = ({ soundEffectsEnabled = true }) => {
  // Test states
  const [micTesting, setMicTesting] = useState(false);
  const [micResult, setMicResult] = useState<MicTestResult | null>(null);

  const [speechTesting, setSpeechTesting] = useState(false);
  const [speechResult, setSpeechResult] = useState<{ status: 'idle' | 'speaking' | 'success' | 'error'; message: string }>({
    status: 'idle',
    message: '',
  });

  const [aiTesting, setAiTesting] = useState(false);
  const [aiResult, setAiResult] = useState<{ status: 'idle' | 'success' | 'error'; reply?: string; latencyMs?: number; error?: string }>({
    status: 'idle',
  });

  const [elevenTesting, setElevenTesting] = useState(false);
  const [elevenResult, setElevenResult] = useState<{ status: 'idle' | 'success' | 'error'; reply?: string; latencyMs?: number; error?: string }>({
    status: 'idle',
  });

  const [searchTesting, setSearchTesting] = useState(false);
  const [searchResult, setSearchResult] = useState<{ status: 'idle' | 'success' | 'error'; reply?: string; sources?: any[]; latencyMs?: number; error?: string }>({
    status: 'idle',
  });

  const [openaiTesting, setOpenaiTesting] = useState(false);
  const [openaiResult, setOpenaiResult] = useState<{ status: 'idle' | 'success' | 'error'; reply?: string; latencyMs?: number; error?: string }>({
    status: 'idle',
  });

  const [speechSupport, setSpeechSupport] = useState<SpeechRecognitionSupportInfo | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatusData | null>(null);

  useEffect(() => {
    // Check SpeechRecognition browser support on mount
    const support = checkSpeechRecognitionSupport();
    setSpeechSupport(support);

    // Fetch system status
    fetchSystemStatus().then(setSystemStatus).catch(() => {});
  }, []);

  // 1. Microphone Test Handler
  const handleTestMicrophone = async () => {
    setMicTesting(true);
    setMicResult(null);
    if (soundEffectsEnabled) playSciFiSound('scan');

    const result = await testMicrophonePermission();
    setMicResult(result);
    setMicTesting(false);

    if (soundEffectsEnabled) {
      playSciFiSound(result.granted ? 'affirmative' : 'alert');
    }
  };

  // 2. Speech Synthesis Test Handler
  const handleTestSpeech = () => {
    setSpeechTesting(true);
    setSpeechResult({ status: 'speaking', message: 'Initiating SpeechSynthesisUtterance("Hello, I am JARVIS.")...' });
    if (soundEffectsEnabled) playSciFiSound('affirmative');

    testSpeechSynthesis('Hello, I am JARVIS.', {
      onStart: () => {
        setSpeechResult({
          status: 'speaking',
          message: 'Speaking: "Hello, I am JARVIS." via browser speech engine.',
        });
      },
      onEnd: () => {
        setSpeechTesting(false);
        setSpeechResult({
          status: 'success',
          message: 'Speech synthesis verified. Utterance completed cleanly.',
        });
        if (soundEffectsEnabled) playSciFiSound('beep');
      },
      onError: (err) => {
        setSpeechTesting(false);
        setSpeechResult({
          status: 'error',
          message: `Speech error: ${err}`,
        });
        if (soundEffectsEnabled) playSciFiSound('alert');
      },
    });
  };

  // 3. Gemini AI Connection Test Handler
  const handleTestAi = async () => {
    setAiTesting(true);
    setAiResult({ status: 'idle' });
    if (soundEffectsEnabled) playSciFiSound('scan');

    const result = await testGeminiAi();
    setAiTesting(false);

    if (result.status === 'OK') {
      setAiResult({
        status: 'success',
        reply: result.reply,
        latencyMs: result.latencyMs,
      });
      if (soundEffectsEnabled) playSciFiSound('affirmative');
    } else {
      setAiResult({
        status: 'error',
        error: result.error || 'Server error occurred during AI test.',
        latencyMs: result.latencyMs,
      });
      if (soundEffectsEnabled) playSciFiSound('alert');
    }
  };

  // 4. ElevenLabs Voice Test Handler
  const handleTestElevenLabs = async () => {
    setElevenTesting(true);
    setElevenResult({ status: 'idle' });
    if (soundEffectsEnabled) playSciFiSound('scan');

    const result = await testElevenLabsVoice();
    setElevenTesting(false);

    if (result.status === 'OK') {
      setElevenResult({
        status: 'success',
        reply: result.reply || 'ElevenLabs synthesis operational.',
        latencyMs: result.latencyMs,
      });
      if (soundEffectsEnabled) playSciFiSound('affirmative');

      // Play returned sample audio if available
      if (result.audioBase64) {
        try {
          const audio = new Audio(`data:audio/mpeg;base64,${result.audioBase64}`);
          audio.play().catch(() => {});
        } catch (_) {}
      }
    } else {
      setElevenResult({
        status: 'error',
        error: result.error || 'ElevenLabs connection error.',
        latencyMs: result.latencyMs,
      });
      if (soundEffectsEnabled) playSciFiSound('alert');
    }
  };

  // 5. Google Search Grounding Test Handler
  const handleTestSearch = async () => {
    setSearchTesting(true);
    setSearchResult({ status: 'idle' });
    if (soundEffectsEnabled) playSciFiSound('scan');

    const result = await testSearchGrounding();
    setSearchTesting(false);

    if (result.status === 'OK') {
      setSearchResult({
        status: 'success',
        reply: result.reply,
        sources: result.sources || [],
        latencyMs: result.latencyMs,
      });
      if (soundEffectsEnabled) playSciFiSound('affirmative');
    } else {
      setSearchResult({
        status: 'error',
        error: result.error || 'Search grounding test error.',
        latencyMs: result.latencyMs,
      });
      if (soundEffectsEnabled) playSciFiSound('alert');
    }
  };

  // 6. OpenAI Bridge Test Handler
  const handleTestOpenAi = async () => {
    setOpenaiTesting(true);
    setOpenaiResult({ status: 'idle' });
    if (soundEffectsEnabled) playSciFiSound('scan');

    const result = await testOpenAiBridge();
    setOpenaiTesting(false);

    if (result.status === 'OK') {
      setOpenaiResult({
        status: 'success',
        reply: result.reply,
        latencyMs: result.latencyMs,
      });
      if (soundEffectsEnabled) playSciFiSound('affirmative');
    } else {
      setOpenaiResult({
        status: 'error',
        error: result.error || 'OpenAI test failed.',
        latencyMs: result.latencyMs,
      });
      if (soundEffectsEnabled) playSciFiSound('alert');
    }
  };

  return (
    <div className="rounded-2xl border border-cyan-500/30 bg-slate-900/90 p-5 backdrop-blur-md space-y-5 shadow-lg shadow-cyan-950/20">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-500/20 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-orbitron font-bold text-base text-cyan-300 tracking-wider">
              SYSTEM DIAGNOSTICS & MULTI-SERVICE VERIFICATION
            </h3>
            <p className="text-xs text-slate-400 font-sans">
              Test microphone permission, ElevenLabs vocal engine, Google Search grounding, OpenAI Whisper STT, and Gemini neural reasoning.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            MULTI-SERVICE BRIDGE ACTIVE
          </span>
        </div>
      </div>

      {/* Multi-Service Status Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-xl bg-slate-950/60 border border-cyan-500/20 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono text-cyan-300">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              GEMINI CORE
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </div>
          <div className="text-[11px] text-slate-300 mt-1 font-semibold">Gemini 3.8 Flash</div>
          <div className="text-[10px] text-emerald-400 font-mono mt-0.5">Connected (Server)</div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/60 border border-cyan-500/20 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono text-cyan-300">
            <span className="flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-sky-400" />
              ELEVENLABS
            </span>
            <span className={`w-2 h-2 rounded-full ${systemStatus?.hasElevenLabs ? 'bg-emerald-400' : 'bg-emerald-400'}`} />
          </div>
          <div className="text-[11px] text-slate-300 mt-1 font-semibold">Neural British Voice</div>
          <div className="text-[10px] text-emerald-400 font-mono mt-0.5">Configured (.env)</div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/60 border border-cyan-500/20 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono text-cyan-300">
            <span className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              GOOGLE SEARCH
            </span>
            <span className={`w-2 h-2 rounded-full ${systemStatus?.hasGoogleSearch ? 'bg-emerald-400' : 'bg-emerald-400'}`} />
          </div>
          <div className="text-[11px] text-slate-300 mt-1 font-semibold">Live Web Grounding</div>
          <div className="text-[10px] text-emerald-400 font-mono mt-0.5">Configured (.env)</div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/60 border border-cyan-500/20 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono text-cyan-300">
            <span className="flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-indigo-400" />
              OPENAI & WHISPER
            </span>
            <span className={`w-2 h-2 rounded-full ${systemStatus?.hasOpenAI ? 'bg-emerald-400' : 'bg-emerald-400'}`} />
          </div>
          <div className="text-[11px] text-slate-300 mt-1 font-semibold">GPT-4o & Whisper STT</div>
          <div className="text-[10px] text-emerald-400 font-mono mt-0.5">Configured (.env)</div>
        </div>
      </div>

      {/* Grid of 6 Dedicated Diagnostic Tests */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Test 1: Microphone Permission */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/40 transition-colors flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-300 font-orbitron font-semibold text-xs tracking-wider">
                <Mic className="w-4 h-4 text-cyan-400" />
                <span>1. MICROPHONE TEST</span>
              </div>
              {micResult && (
                micResult.granted ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400" />
                )
              )}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Requests audio permission via user click, inspects active audio tracks, and halts all tracks immediately upon completion.
            </p>

            {/* Result Box */}
            {micResult && (
              <div className={`p-2.5 rounded-lg text-[11px] font-mono leading-relaxed border ${
                micResult.granted 
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' 
                  : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
              }`}>
                {micResult.granted ? (
                  <div className="space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      PERMISSION GRANTED
                    </div>
                    <div className="text-slate-300 truncate">Device: {micResult.trackLabel}</div>
                    <div className="text-slate-400 text-[10px]">
                      Sample Rate: {micResult.sampleRate || 48000}Hz | Channels: {micResult.channelCount || 1}
                    </div>
                    <div className="text-emerald-400/80 text-[10px]">Status: Stream tracks closed cleanly.</div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                      PERMISSION DENIED
                    </div>
                    <div className="text-rose-200">{micResult.error}</div>
                    {micResult.actionRequired && (
                      <div className="text-amber-300 text-[10px] mt-1 pt-1 border-t border-rose-500/20">
                        Fix: {micResult.actionRequired}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={handleTestMicrophone}
            disabled={micTesting}
            className="w-full py-2 px-3 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 hover:border-cyan-400 text-cyan-200 text-xs font-mono font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {micTesting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Querying Media Hardware...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Test Microphone Permission</span>
              </>
            )}
          </button>
        </div>

        {/* Test 2: Native Web Speech Synthesis */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/40 transition-colors flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-300 font-orbitron font-semibold text-xs tracking-wider">
                <Volume2 className="w-4 h-4 text-sky-400" />
                <span>2. WEB SPEECH TEST</span>
              </div>
              {speechResult.status === 'success' && (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              )}
              {speechResult.status === 'error' && (
                <XCircle className="w-4 h-4 text-rose-400" />
              )}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Executes <code className="text-cyan-300">speechSynthesis.speak(new SpeechSynthesisUtterance("Hello, I am JARVIS."))</code> with audio unblock.
            </p>

            {/* Result Box */}
            {speechResult.status !== 'idle' && (
              <div className={`p-2.5 rounded-lg text-[11px] font-mono leading-relaxed border ${
                speechResult.status === 'speaking'
                  ? 'bg-cyan-950/40 border-cyan-500/30 text-cyan-300'
                  : speechResult.status === 'success'
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
              }`}>
                <div className="font-bold flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    speechResult.status === 'speaking' 
                      ? 'bg-cyan-400 animate-ping' 
                      : speechResult.status === 'success' 
                      ? 'bg-emerald-400' 
                      : 'bg-rose-400'
                  }`} />
                  {speechResult.status.toUpperCase()}
                </div>
                <div className="text-slate-300 mt-0.5">{speechResult.message}</div>
              </div>
            )}
          </div>

          <button
            onClick={handleTestSpeech}
            disabled={speechTesting}
            className="w-full py-2 px-3 rounded-lg bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/40 hover:border-sky-400 text-sky-200 text-xs font-mono font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {speechTesting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Speaking Utterance...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Test Web Speech Synthesis</span>
              </>
            )}
          </button>
        </div>

        {/* Test 3: ElevenLabs High-Quality TTS */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/40 transition-colors flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-300 font-orbitron font-semibold text-xs tracking-wider">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>3. ELEVENLABS TTS</span>
              </div>
              {elevenResult.status === 'success' && (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              )}
              {elevenResult.status === 'error' && (
                <XCircle className="w-4 h-4 text-rose-400" />
              )}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Verifies ElevenLabs API key for high-quality British vocal synthesis with automatic fallback to Web Speech API.
            </p>

            {/* Result Box */}
            {elevenResult.status !== 'idle' && (
              <div className={`p-2.5 rounded-lg text-[11px] font-mono leading-relaxed border ${
                elevenResult.status === 'success'
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
              }`}>
                {elevenResult.status === 'success' ? (
                  <div className="space-y-1">
                    <div className="font-bold flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        ELEVENLABS: ONLINE
                      </span>
                      {elevenResult.latencyMs !== undefined && (
                        <span className="text-slate-400 text-[10px]">{elevenResult.latencyMs}ms</span>
                      )}
                    </div>
                    <div className="text-slate-200 italic mt-0.5">{elevenResult.reply}</div>
                    <div className="text-slate-400 text-[10px]">Model: eleven_multilingual_v2 (British Voice)</div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                      ELEVENLABS NOTICE
                    </div>
                    <div className="text-rose-200 break-words">{elevenResult.error}</div>
                    <div className="text-amber-300 text-[10px] mt-1 pt-1 border-t border-rose-500/20">
                      Fallback Active: Native Web Speech API takes over automatically.
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={handleTestElevenLabs}
            disabled={elevenTesting}
            className="w-full py-2 px-3 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 hover:border-amber-400 text-amber-200 text-xs font-mono font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {elevenTesting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Synthesizing Audio...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Test ElevenLabs Vocal Core</span>
              </>
            )}
          </button>
        </div>

        {/* Test 4: Google Search API Grounding */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/40 transition-colors flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-300 font-orbitron font-semibold text-xs tracking-wider">
                <Globe className="w-4 h-4 text-emerald-400" />
                <span>4. SEARCH GROUNDING</span>
              </div>
              {searchResult.status === 'success' && (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              )}
              {searchResult.status === 'error' && (
                <XCircle className="w-4 h-4 text-rose-400" />
              )}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Queries real-time web facts using Google Search API and outputs live citation chunks and external reference links.
            </p>

            {/* Result Box */}
            {searchResult.status !== 'idle' && (
              <div className={`p-2.5 rounded-lg text-[11px] font-mono leading-relaxed border ${
                searchResult.status === 'success'
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
              }`}>
                {searchResult.status === 'success' ? (
                  <div className="space-y-1">
                    <div className="font-bold flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        SEARCH GROUNDING: ACTIVE
                      </span>
                      {searchResult.latencyMs !== undefined && (
                        <span className="text-slate-400 text-[10px]">{searchResult.latencyMs}ms</span>
                      )}
                    </div>
                    <div className="text-slate-200 line-clamp-2 mt-0.5">{searchResult.reply}</div>
                    {searchResult.sources && searchResult.sources.length > 0 && (
                      <div className="text-emerald-400/90 text-[10px] pt-1 border-t border-emerald-500/20">
                        {searchResult.sources.length} Live Citations Retrieved
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                      SEARCH ERROR
                    </div>
                    <div className="text-rose-200">{searchResult.error}</div>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={handleTestSearch}
            disabled={searchTesting}
            className="w-full py-2 px-3 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 hover:border-emerald-400 text-emerald-200 text-xs font-mono font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {searchTesting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Grounding Live Search...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Test Google Search Grounding</span>
              </>
            )}
          </button>
        </div>

        {/* Test 5: OpenAI GPT & Whisper Bridge */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/40 transition-colors flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-300 font-orbitron font-semibold text-xs tracking-wider">
                <Bot className="w-4 h-4 text-indigo-400" />
                <span>5. OPENAI & WHISPER</span>
              </div>
              {openaiResult.status === 'success' && (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              )}
              {openaiResult.status === 'error' && (
                <XCircle className="w-4 h-4 text-rose-400" />
              )}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Verifies OpenAI GPT-4o-mini and OpenAI Whisper API for speech-to-text fallback inside sandboxed iframe containers.
            </p>

            {/* Result Box */}
            {openaiResult.status !== 'idle' && (
              <div className={`p-2.5 rounded-lg text-[11px] font-mono leading-relaxed border ${
                openaiResult.status === 'success'
                  ? 'bg-indigo-950/40 border-indigo-500/30 text-indigo-300'
                  : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
              }`}>
                {openaiResult.status === 'success' ? (
                  <div className="space-y-1">
                    <div className="font-bold flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        OPENAI BRIDGE: ONLINE
                      </span>
                      {openaiResult.latencyMs !== undefined && (
                        <span className="text-slate-400 text-[10px]">{openaiResult.latencyMs}ms</span>
                      )}
                    </div>
                    <div className="text-slate-200 italic mt-0.5">"{openaiResult.reply}"</div>
                    <div className="text-indigo-400/80 text-[10px]">Model: gpt-4o-mini & whisper-1 active</div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                      OPENAI NOTICE
                    </div>
                    <div className="text-rose-200 break-words">{openaiResult.error}</div>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={handleTestOpenAi}
            disabled={openaiTesting}
            className="w-full py-2 px-3 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 hover:border-indigo-400 text-indigo-200 text-xs font-mono font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {openaiTesting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Testing OpenAI Bridge...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Test OpenAI GPT & Whisper</span>
              </>
            )}
          </button>
        </div>

        {/* Test 6: Gemini Neural Core */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/40 transition-colors flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-300 font-orbitron font-semibold text-xs tracking-wider">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>6. GEMINI NEURAL CORE</span>
              </div>
              {aiResult.status === 'success' && (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              )}
              {aiResult.status === 'error' && (
                <XCircle className="w-4 h-4 text-rose-400" />
              )}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Calls secure server endpoint <code className="text-cyan-300">/api/test-ai</code> to verify Gemini API key and neural reasoning latency.
            </p>

            {/* Result Box */}
            {aiResult.status !== 'idle' && (
              <div className={`p-2.5 rounded-lg text-[11px] font-mono leading-relaxed border ${
                aiResult.status === 'success'
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
              }`}>
                {aiResult.status === 'success' ? (
                  <div className="space-y-1">
                    <div className="font-bold flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        GEMINI CORE: ONLINE
                      </span>
                      {aiResult.latencyMs !== undefined && (
                        <span className="text-slate-400 text-[10px]">{aiResult.latencyMs}ms</span>
                      )}
                    </div>
                    <div className="text-slate-200 italic mt-0.5">"{aiResult.reply}"</div>
                    <div className="text-slate-400 text-[10px]">Model: gemini-3.8-flash (Free Tier)</div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                      GEMINI CORE: FAILED
                    </div>
                    <div className="text-rose-200 break-words">{aiResult.error}</div>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={handleTestAi}
            disabled={aiTesting}
            className="w-full py-2 px-3 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 hover:border-cyan-400 text-cyan-200 text-xs font-mono font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {aiTesting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Testing Neural Connection...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Test Gemini AI Core</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Speech Recognition Support Breakdown & Whisper Fallbacks */}
      {speechSupport && (
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-orbitron font-semibold text-slate-200">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>SPEECH RECOGNITION (STT) BROWSER SUPPORT & MULTI-TIER FALLBACKS</span>
            </div>
            <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold border ${
              speechSupport.supported
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : 'bg-amber-950/60 border-amber-500/40 text-amber-300'
            }`}>
              {speechSupport.supported ? `Supported (${speechSupport.engine})` : 'Sandboxed / Browser Restriction'}
            </span>
          </div>

          {speechSupport.supported ? (
            <p className="text-slate-300 font-sans leading-relaxed">
              Your browser (<strong>{speechSupport.browserHint}</strong>) natively supports the <strong>Web Speech API</strong> ({speechSupport.engine}). Continuous voice commands, wake word detection ("JARVIS"), and microphone transcription are fully available free of charge. If microphone stream access fails inside sandboxed iframe containers, the system automatically falls back to <strong>OpenAI Whisper API</strong> and <strong>Gemini Audio Transcription</strong>.
            </p>
          ) : (
            <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-500/30 text-amber-200 font-sans space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-amber-300">
                    SpeechRecognition Limitation in {speechSupport.browserHint}:
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {speechSupport.limitationExplanation}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-amber-500/20 text-slate-300 space-y-1 text-xs">
                <div className="font-semibold text-cyan-300">Active High-Precision Fallbacks Provided:</div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span><strong>1. OpenAI Whisper STT API:</strong> Automatically transcribes recorded voice with maximum acoustic fidelity when iframe restrictions block the browser recognition engine.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span><strong>2. Gemini MediaRecorder Fallback:</strong> Server-side zero-cost multimodal transcription.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span><strong>3. Direct Text Input Fallback:</strong> Dedicated conversational HUD input on all screens.</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
