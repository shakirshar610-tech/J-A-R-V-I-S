import React, { useState, useEffect } from 'react';
import { 
  Mic, 
  Volume2, 
  Cpu, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Square, 
  ShieldCheck, 
  ShieldAlert, 
  Sparkles, 
  Radio, 
  VolumeX, 
  Info 
} from 'lucide-react';
import { testGeminiAi } from '../services/api';
import { AudioRecorderTranscriber, unlockAudio } from '../utils/audio';

interface DiagnosticDeckProps {
  onMicTestSuccess?: () => void;
}

export const DiagnosticDeck: React.FC<DiagnosticDeckProps> = ({ onMicTestSuccess }) => {
  // Test 1: Microphone state
  const [micTesting, setMicTesting] = useState(false);
  const [micResult, setMicResult] = useState<{
    status: 'idle' | 'success' | 'error';
    message: string;
    permissionState?: string;
    deviceName?: string;
    speechRecognitionSupported: boolean;
  }>({
    status: 'idle',
    message: 'Click "Test Microphone" to request permission and verify acoustic hardware.',
    speechRecognitionSupported: false,
  });

  // Test 2: Speech Synthesis state
  const [speechTesting, setSpeechTesting] = useState(false);
  const [speechResult, setSpeechResult] = useState<{
    status: 'idle' | 'speaking' | 'success' | 'error';
    message: string;
    voicesCount?: number;
    activeVoice?: string;
  }>({
    status: 'idle',
    message: 'Click "Test Speech Output" to test browser vocal synthesis.',
  });

  // Test 3: AI Backend Connection state
  const [aiTesting, setAiTesting] = useState(false);
  const [aiResult, setAiResult] = useState<{
    status: 'idle' | 'success' | 'error';
    message: string;
    model?: string;
    latencyMs?: number;
    hasApiKey?: boolean;
    replyText?: string;
  }>({
    status: 'idle',
    message: 'Click "Test AI Connection" to verify server-side Gemini 3.8 Flash intelligence.',
  });

  // Test 4: Gemini Audio Recorder fallback state
  const [recorderTesting, setRecorderTesting] = useState(false);
  const [recorderResult, setRecorderResult] = useState<{
    status: 'idle' | 'recording' | 'transcribing' | 'success' | 'error';
    message: string;
    transcript?: string;
  }>({
    status: 'idle',
    message: 'Test Gemini 3.5 audio transcription (MediaRecorder fallback).',
  });

  const recorderRef = React.useRef<AudioRecorderTranscriber | null>(null);

  // Initial check on mount
  useEffect(() => {
    const hasSpeechRec = typeof window !== 'undefined' && Boolean(
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    );
    setMicResult((prev) => ({
      ...prev,
      speechRecognitionSupported: hasSpeechRec,
    }));
  }, []);

  // =========================================================================
  // 1. MICROPHONE TEST BUTTON
  // =========================================================================
  const runMicrophoneTest = async () => {
    setMicTesting(true);
    setMicResult((prev) => ({ ...prev, status: 'idle', message: 'Requesting microphone access...' }));

    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicTesting(false);
      setMicResult({
        status: 'error',
        message: 'navigator.mediaDevices.getUserMedia is NOT supported in this browser environment.',
        speechRecognitionSupported: false,
      });
      return;
    }

    try {
      // Query permission status if available
      let permissionState = 'unknown';
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const perm = await navigator.permissions.query({ name: 'microphone' as any });
          permissionState = perm.state;
        } catch (_) {}
      }

      // Request actual microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioTracks = stream.getAudioTracks();

      if (audioTracks.length === 0) {
        throw new Error('Audio stream acquired but contained 0 audio tracks.');
      }

      const firstTrack = audioTracks[0];
      const deviceLabel = firstTrack.label || 'Default Audio Input Device';

      // CRITICAL: Stop all microphone tracks immediately when finished
      audioTracks.forEach((track) => {
        track.stop();
      });

      const hasSpeechRec = typeof window !== 'undefined' && Boolean(
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      );

      setMicResult({
        status: 'success',
        message: `Microphone access GRANTED. Device: "${deviceLabel}". All tracks cleanly closed.`,
        permissionState: permissionState !== 'unknown' ? permissionState : 'granted',
        deviceName: deviceLabel,
        speechRecognitionSupported: hasSpeechRec,
      });

      onMicTestSuccess?.();
    } catch (err: any) {
      console.error('Microphone Test Error:', err);
      let errMsg = err.message || 'Microphone request failed.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errMsg = 'Permission Denied: Browser blocked microphone. Click the lock/camera icon in your address bar to Allow microphone access.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errMsg = 'No microphone hardware found on this system.';
      }

      setMicResult({
        status: 'error',
        message: errMsg,
        permissionState: 'denied',
        speechRecognitionSupported: typeof window !== 'undefined' && Boolean(
          (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        ),
      });
    } finally {
      setMicTesting(false);
    }
  };

  // =========================================================================
  // 2. SPEECH SYNTHESIS TEST BUTTON
  // =========================================================================
  const runSpeechTest = () => {
    setSpeechTesting(true);
    unlockAudio();

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setSpeechTesting(false);
      setSpeechResult({
        status: 'error',
        message: 'window.speechSynthesis is NOT supported in this browser.',
      });
      return;
    }

    try {
      window.speechSynthesis.cancel();
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const voices = window.speechSynthesis.getVoices();
      const testUtterance = new SpeechSynthesisUtterance('Hello, I am JARVIS.');

      // Try selecting British or natural voice if available
      const jarvisVoice = voices.find(
        (v) =>
          v.lang.startsWith('en-GB') ||
          v.name.toLowerCase().includes('daniel') ||
          v.name.toLowerCase().includes('george') ||
          v.name.toLowerCase().includes('natural')
      );
      if (jarvisVoice) {
        testUtterance.voice = jarvisVoice;
      }

      testUtterance.onstart = () => {
        setSpeechResult({
          status: 'speaking',
          message: 'Speaking: "Hello, I am JARVIS."',
          voicesCount: voices.length,
          activeVoice: testUtterance.voice ? `${testUtterance.voice.name} (${testUtterance.voice.lang})` : 'Default System Voice',
        });
      };

      testUtterance.onend = () => {
        setSpeechTesting(false);
        setSpeechResult({
          status: 'success',
          message: 'Speech synthesis completed successfully without errors.',
          voicesCount: voices.length,
          activeVoice: testUtterance.voice ? `${testUtterance.voice.name} (${testUtterance.voice.lang})` : 'Default System Voice',
        });
      };

      testUtterance.onerror = (e) => {
        setSpeechTesting(false);
        console.warn('Speech Test Error:', e);
        setSpeechResult({
          status: 'error',
          message: `SpeechSynthesis error: "${e.error}". If muted, check system audio volume or try the Neural Audio fallback.`,
          voicesCount: voices.length,
        });
      };

      window.speechSynthesis.speak(testUtterance);
    } catch (err: any) {
      setSpeechTesting(false);
      setSpeechResult({
        status: 'error',
        message: `Exception during speech synthesis: ${err.message}`,
      });
    }
  };

  // =========================================================================
  // 3. AI CONNECTION TEST BUTTON
  // =========================================================================
  const runAiTest = async () => {
    setAiTesting(true);
    setAiResult((prev) => ({ ...prev, status: 'idle', message: 'Calling secure backend /api/test-ai...' }));

    try {
      const res = await testGeminiAi();
      setAiResult({
        status: 'success',
        message: `AI Core online. Latency: ${res.latencyMs}ms. Response received successfully.`,
        model: 'gemini-3.8-flash',
        latencyMs: res.latencyMs,
        hasApiKey: true,
        replyText: res.reply,
      });
    } catch (err: any) {
      console.error('AI Test Failure:', err);
      setAiResult({
        status: 'error',
        message: `AI Backend Failure: ${err.message}`,
        hasApiKey: false,
      });
    } finally {
      setAiTesting(false);
    }
  };

  // =========================================================================
  // 4. FALLBACK: GEMINI AUDIO RECORDER TEST
  // =========================================================================
  const toggleRecorderTest = async () => {
    if (recorderTesting) {
      // Stop and transcribe
      setRecorderResult((prev) => ({ ...prev, status: 'transcribing', message: 'Transcribing recorded audio with Gemini 3.5...' }));
      try {
        if (!recorderRef.current) return;
        const text = await recorderRef.current.stopAndTranscribe();
        setRecorderTesting(false);
        setRecorderResult({
          status: 'success',
          message: `Gemini Transcription Success: "${text || '(No speech detected)'}"`,
          transcript: text,
        });
      } catch (err: any) {
        setRecorderTesting(false);
        setRecorderResult({
          status: 'error',
          message: `Transcription error: ${err.message}`,
        });
      }
    } else {
      // Start recording
      setRecorderResult((prev) => ({ ...prev, status: 'recording', message: 'Recording audio from microphone... Speak now, then click Stop.' }));
      try {
        const recorder = new AudioRecorderTranscriber();
        recorderRef.current = recorder;
        const started = await recorder.start();
        if (started) {
          setRecorderTesting(true);
        } else {
          setRecorderResult({
            status: 'error',
            message: 'Could not start MediaRecorder. Please ensure microphone access is granted.',
          });
        }
      } catch (err: any) {
        setRecorderResult({
          status: 'error',
          message: 'Recorder error: ' + err.message,
        });
      }
    }
  };

  return (
    <div className="rounded-2xl bg-[#070e22]/95 border-2 border-cyan-400/50 p-5 space-y-5 shadow-[0_0_30px_rgba(0,210,255,0.25)] select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-cyan-500/20">
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
          <h2 className="font-orbitron font-bold text-sm text-cyan-200 tracking-wider">
            SYSTEM ROOT-CAUSE DIAGNOSTICS & VERIFICATION CENTER
          </h2>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
          ZERO-COST PROTOCOL TESTER
        </span>
      </div>

      {/* Grid of 3 Independent Diagnostic Tests */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* ================================================================= */}
        {/* TEST 1: MICROPHONE TEST */}
        {/* ================================================================= */}
        <div className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition-all ${
          micResult.status === 'success'
            ? 'bg-emerald-950/30 border-emerald-500/40'
            : micResult.status === 'error'
            ? 'bg-rose-950/30 border-rose-500/40'
            : 'bg-slate-900/70 border-cyan-500/20'
        }`}>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-orbitron font-bold text-xs text-cyan-300 flex items-center gap-1.5">
                <Mic className="w-4 h-4 text-cyan-400" />
                <span>1. MICROPHONE SENSOR</span>
              </span>
              {micResult.status === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : micResult.status === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-400" />
              ) : null}
            </div>

            <p className="text-[11px] font-mono text-slate-300 leading-relaxed min-h-[48px]">
              {micResult.message}
            </p>

            {/* Technical details badge */}
            <div className="pt-1 text-[10px] font-mono text-slate-400 space-y-0.5">
              <div>Permission: <span className={micResult.permissionState === 'granted' ? 'text-emerald-300 font-bold' : 'text-amber-300'}>{micResult.permissionState || 'untested'}</span></div>
              <div>Web Speech API: <span className={micResult.speechRecognitionSupported ? 'text-emerald-300' : 'text-amber-400'}>{micResult.speechRecognitionSupported ? 'Available in Window' : 'Not Supported'}</span></div>
            </div>
          </div>

          <button
            onClick={runMicrophoneTest}
            disabled={micTesting}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 text-slate-950 font-bold text-xs font-mono flex items-center justify-center gap-2 shadow-[0_0_12px_rgba(0,210,255,0.3)] transition-all cursor-pointer"
          >
            {micTesting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Requesting Mic...</span>
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5" />
                <span>Test Microphone Permission</span>
              </>
            )}
          </button>
        </div>

        {/* ================================================================= */}
        {/* TEST 2: SPEECH OUTPUT TEST */}
        {/* ================================================================= */}
        <div className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition-all ${
          speechResult.status === 'success' || speechResult.status === 'speaking'
            ? 'bg-emerald-950/30 border-emerald-500/40'
            : speechResult.status === 'error'
            ? 'bg-rose-950/30 border-rose-500/40'
            : 'bg-slate-900/70 border-cyan-500/20'
        }`}>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-orbitron font-bold text-xs text-sky-300 flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-sky-400" />
                <span>2. SPEECH SYNTHESIS</span>
              </span>
              {speechResult.status === 'speaking' ? (
                <Radio className="w-4 h-4 text-sky-400 animate-ping" />
              ) : speechResult.status === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : speechResult.status === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-400" />
              ) : null}
            </div>

            <p className="text-[11px] font-mono text-slate-300 leading-relaxed min-h-[48px]">
              {speechResult.message}
            </p>

            <div className="pt-1 text-[10px] font-mono text-slate-400 space-y-0.5">
              <div>Detected Voices: <span className="text-cyan-300 font-bold">{speechResult.voicesCount ?? 'Querying...'}</span></div>
              <div className="truncate">Voice: <span className="text-slate-200">{speechResult.activeVoice || 'Auto'}</span></div>
            </div>
          </div>

          <button
            onClick={runSpeechTest}
            disabled={speechTesting}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 disabled:opacity-40 text-slate-950 font-bold text-xs font-mono flex items-center justify-center gap-2 shadow-[0_0_12px_rgba(14,165,233,0.3)] transition-all cursor-pointer"
          >
            {speechTesting ? (
              <>
                <Volume2 className="w-3.5 h-3.5 animate-bounce" />
                <span>Speaking Now...</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5" />
                <span>Test Speech Output</span>
              </>
            )}
          </button>
        </div>

        {/* ================================================================= */}
        {/* TEST 3: AI CONNECTION TEST */}
        {/* ================================================================= */}
        <div className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition-all ${
          aiResult.status === 'success'
            ? 'bg-emerald-950/30 border-emerald-500/40'
            : aiResult.status === 'error'
            ? 'bg-rose-950/30 border-rose-500/40'
            : 'bg-slate-900/70 border-cyan-500/20'
        }`}>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-orbitron font-bold text-xs text-indigo-300 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-indigo-400" />
                <span>3. GEMINI AI CORE</span>
              </span>
              {aiResult.status === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : aiResult.status === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-400" />
              ) : null}
            </div>

            <p className="text-[11px] font-mono text-slate-300 leading-relaxed min-h-[48px]">
              {aiResult.replyText ? `"${aiResult.replyText}"` : aiResult.message}
            </p>

            <div className="pt-1 text-[10px] font-mono text-slate-400 space-y-0.5">
              <div>Model: <span className="text-indigo-300 font-bold">gemini-3.8-flash</span></div>
              <div>Server Key Status: <span className={aiResult.hasApiKey ? 'text-emerald-400 font-bold' : 'text-amber-400'}>{aiResult.hasApiKey ? 'Attached in Server' : 'Untested'}</span></div>
            </div>
          </div>

          <button
            onClick={runAiTest}
            disabled={aiTesting}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-400 hover:to-sky-400 disabled:opacity-40 text-slate-950 font-bold text-xs font-mono flex items-center justify-center gap-2 shadow-[0_0_12px_rgba(99,102,241,0.3)] transition-all cursor-pointer"
          >
            {aiTesting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Contacting AI Core...</span>
              </>
            ) : (
              <>
                <Cpu className="w-3.5 h-3.5" />
                <span>Test AI Connection</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 4. SPEECH RECOGNITION IFRAME LIMITATION & SUPPORTED ALTERNATIVE */}
      {/* ================================================================= */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-700 space-y-2.5 text-xs font-mono">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-cyan-300 font-bold">
            <Info className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>BROWSER SPEECH RECOGNITION COMPATIBILITY & BACKUP SENSOR</span>
          </div>
          <span className="text-[10px] text-slate-400">
            Fallback Protocol
          </span>
        </div>

        <p className="text-slate-300 font-sans leading-relaxed text-[11px]">
          In Google Chrome, the proprietary <code className="text-cyan-300">webkitSpeechRecognition</code> requires external Google Speech network connectivity, which browsers often restrict inside embedded iframes. If SpeechRecognition does not hear your voice, click <strong>Test Gemini Audio Transcription</strong> below: it captures audio via standard <code className="text-emerald-300">MediaRecorder</code> and transcribes it directly with Gemini 3.5 at zero cost.
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          <div className="text-[11px] text-slate-300 flex-1">
            {recorderResult.status === 'recording' ? (
              <span className="text-rose-400 font-bold flex items-center gap-1.5 animate-pulse">
                <Radio className="w-3.5 h-3.5" />
                Recording audio snippet... Speak into your mic, then click Stop!
              </span>
            ) : recorderResult.status === 'transcribing' ? (
              <span className="text-cyan-300 flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Transcribing audio with Gemini 3.5...
              </span>
            ) : recorderResult.transcript ? (
              <span className="text-emerald-300">
                Transcribed: <strong>"{recorderResult.transcript}"</strong>
              </span>
            ) : (
              <span className="text-slate-400">
                {recorderResult.message}
              </span>
            )}
          </div>

          <button
            onClick={toggleRecorderTest}
            className={`px-4 py-2 rounded-xl font-bold text-xs font-mono flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 ${
              recorderTesting
                ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.5)]'
                : 'bg-cyan-950 hover:bg-cyan-900 border border-cyan-400/40 text-cyan-200'
            }`}
          >
            {recorderTesting ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop & Transcribe</span>
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5 text-cyan-400" />
                <span>Test Gemini Transcriber</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
