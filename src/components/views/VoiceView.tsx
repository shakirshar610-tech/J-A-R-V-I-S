import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Square, 
  Settings2, 
  AlertTriangle, 
  Sparkles, 
  RefreshCw, 
  Send, 
  Radio, 
  ShieldCheck, 
  CheckCircle 
} from 'lucide-react';
import { JarvisOrb } from '../JarvisOrb';
import { SystemDiagnostics } from '../SystemDiagnostics';
import { JarvisState, JarvisSettings } from '../../types';
import { 
  createSpeechRecognizer, 
  speakText, 
  stopSpeaking, 
  getAvailableVoices, 
  playSciFiSound,
  testMicrophonePermission,
  AudioRecorderTranscriber
} from '../../utils/audio';

interface VoiceViewProps {
  jarvisState: JarvisState;
  setJarvisState: (state: JarvisState) => void;
  onVoiceCommand: (transcript: string) => Promise<string>;
  settings: JarvisSettings;
  updateSettings: (partial: Partial<JarvisSettings>) => void;
}

export const VoiceView: React.FC<VoiceViewProps> = ({
  jarvisState,
  setJarvisState,
  onVoiceCommand,
  settings,
  updateSettings,
}) => {
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [lastResponse, setLastResponse] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isRecordingGemini, setIsRecordingGemini] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [micPermissionGranted, setMicPermissionGranted] = useState<boolean | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [textFallback, setTextFallback] = useState('');
  const [showConfig, setShowConfig] = useState(false);

  const recognizerRef = useRef<any>(null);
  const recorderRef = useRef<AudioRecorderTranscriber | null>(null);

  useEffect(() => {
    getAvailableVoices().then((v) => {
      setVoices(v);
    });

    return () => {
      if (recognizerRef.current) {
        try {
          recognizerRef.current.stop();
        } catch (_) {}
      }
      if (recorderRef.current) {
        recorderRef.current.cancel();
      }
      stopSpeaking();
    };
  }, []);

  const handleGrantMicPermission = async () => {
    setErrorMessage(null);
    const res = await testMicrophonePermission();
    if (res.granted) {
      setMicPermissionGranted(true);
      if (settings.soundEffectsEnabled) playSciFiSound('affirmative');
    } else {
      setMicPermissionGranted(false);
      setErrorMessage(res.error || 'Microphone permission denied.');
      if (settings.soundEffectsEnabled) playSciFiSound('alert');
    }
  };

  const startListening = async () => {
    setErrorMessage(null);
    setInterimText('');
    stopSpeaking();

    // 1. Try browser Web Speech Recognition directly
    const recognizer = createSpeechRecognizer({
      onStart: () => {
        setIsListening(true);
        setJarvisState('listening');
        if (settings.soundEffectsEnabled) playSciFiSound('beep');
      },
      onResult: async (text, isFinal) => {
        if (isFinal) {
          setTranscript(text);
          setInterimText('');
          setIsListening(false);
          setJarvisState('thinking');
          if (settings.soundEffectsEnabled) playSciFiSound('affirmative');

          try {
            const aiReply = await onVoiceCommand(text);
            setLastResponse(aiReply);
            setJarvisState('speaking');

            if (settings.autoSpeakResponses) {
              speakText(aiReply, {
                rate: settings.speechRate,
                pitch: settings.speechPitch,
                voiceURI: settings.voiceURI,
                onStart: () => setJarvisState('speaking'),
                onEnd: () => setJarvisState('idle'),
                onError: () => setJarvisState('idle'),
              });
            } else {
              setJarvisState('idle');
            }
          } catch (err: any) {
            setErrorMessage(err.message || 'Processing voice command failed.');
            setJarvisState('error');
          }
        } else {
          setInterimText(text);
        }
      },
      onError: (err) => {
        setIsListening(false);
        // If Web Speech fails (e.g. not-allowed or network), offer Gemini MediaRecorder fallback
        console.warn('SpeechRecognition notice:', err);
        if (err.includes('not-allowed') || err.includes('permission')) {
          setErrorMessage('Microphone access was blocked. Please grant access in your browser address bar.');
          setJarvisState('error');
        } else {
          // Switch automatically to Gemini Audio Recorder
          startGeminiRecorderFallback();
        }
      },
      onEnd: () => {
        setIsListening(false);
        if (jarvisState === 'listening') {
          setJarvisState('idle');
        }
      },
    });

    if (!recognizer) {
      // Browser doesn't support Web Speech API, use Gemini Audio Recorder
      startGeminiRecorderFallback();
      return;
    }

    recognizerRef.current = recognizer;
    try {
      recognizer.start();
    } catch (e: any) {
      startGeminiRecorderFallback();
    }
  };

  // Gemini MediaRecorder Fallback
  const startGeminiRecorderFallback = async () => {
    try {
      const recorder = new AudioRecorderTranscriber();
      recorderRef.current = recorder;
      const started = await recorder.start();
      if (!started) {
        setErrorMessage('Could not initialize audio recorder.');
        setJarvisState('error');
        return;
      }

      setIsRecordingGemini(true);
      setIsListening(true);
      setJarvisState('listening');
      if (settings.soundEffectsEnabled) playSciFiSound('beep');
    } catch (err: any) {
      setErrorMessage('Audio recording failed: ' + err.message);
      setJarvisState('error');
    }
  };

  const stopGeminiRecorderFallback = async () => {
    if (!recorderRef.current) return;
    setIsRecordingGemini(false);
    setIsListening(false);
    setJarvisState('thinking');
    if (settings.soundEffectsEnabled) playSciFiSound('scan');

    try {
      const text = await recorderRef.current.stopAndTranscribe();
      if (text) {
        setTranscript(text);
        const aiReply = await onVoiceCommand(text);
        setLastResponse(aiReply);
        setJarvisState('speaking');

        if (settings.autoSpeakResponses) {
          speakText(aiReply, {
            rate: settings.speechRate,
            pitch: settings.speechPitch,
            voiceURI: settings.voiceURI,
            onStart: () => setJarvisState('speaking'),
            onEnd: () => setJarvisState('idle'),
            onError: () => setJarvisState('idle'),
          });
        } else {
          setJarvisState('idle');
        }
      } else {
        setErrorMessage('No voice detected. Please speak louder into your microphone.');
        setJarvisState('idle');
      }
    } catch (err: any) {
      setErrorMessage('Transcription error: ' + err.message);
      setJarvisState('error');
    }
  };

  const stopListening = () => {
    if (isRecordingGemini) {
      stopGeminiRecorderFallback();
      return;
    }
    if (recognizerRef.current) {
      try {
        recognizerRef.current.stop();
      } catch (_) {}
    }
    setIsListening(false);
    setJarvisState('idle');
    if (settings.soundEffectsEnabled) playSciFiSound('click');
  };

  const handleStopAll = () => {
    if (isRecordingGemini && recorderRef.current) {
      recorderRef.current.cancel();
      setIsRecordingGemini(false);
    }
    stopListening();
    stopSpeaking();
    setJarvisState('idle');
  };

  const handleFallbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textFallback.trim()) return;

    const inputQuery = textFallback.trim();
    setTextFallback('');
    setTranscript(inputQuery);
    setJarvisState('thinking');

    try {
      const aiReply = await onVoiceCommand(inputQuery);
      setLastResponse(aiReply);
      setJarvisState('speaking');

      if (settings.autoSpeakResponses) {
        speakText(aiReply, {
          rate: settings.speechRate,
          pitch: settings.speechPitch,
          voiceURI: settings.voiceURI,
          onStart: () => setJarvisState('speaking'),
          onEnd: () => setJarvisState('idle'),
          onError: () => setJarvisState('idle'),
        });
      } else {
        setJarvisState('idle');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Processing query failed.');
      setJarvisState('error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Holographic Voice HUD */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/60 border border-cyan-500/20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <div>
            <h2 className="font-orbitron font-bold text-sm text-cyan-300">
              ACOUSTIC COMM LINK // J.A.R.V.I.S.
            </h2>
            <p className="text-[11px] font-mono text-cyan-400/60">
              Web Speech & Gemini 3.5 Transcribe Neural Fallback
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-cyan-950/50 border border-cyan-500/20 text-cyan-300 transition-colors"
            title="Acoustic Voice Settings"
          >
            <Settings2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleStopAll}
            className="px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 font-mono text-xs flex items-center gap-1.5 transition-colors"
            title="Stop Speech & Listening"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Mute / Stop</span>
          </button>
        </div>
      </div>

      {/* Permission Troubleshooting Bar */}
      {micPermissionGranted === false && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-rose-200">Microphone Permission Blocked</span>
              <p className="text-slate-300 text-[11px] font-sans">
                Please click the button to the right or check your browser's address bar (camera/microphone icon) to allow audio input.
              </p>
            </div>
          </div>
          <button
            onClick={handleGrantMicPermission}
            className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold shrink-0 transition-colors shadow-sm"
          >
            Grant Microphone Permission
          </button>
        </div>
      )}

      {/* Voice Settings Panel (Collapsible) */}
      {showConfig && (
        <div className="p-4 rounded-xl bg-slate-900/90 border border-cyan-500/30 space-y-4">
          <h3 className="font-orbitron text-xs font-semibold text-cyan-300">
            VOCAL SYNTHESIS PARAMETERS
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div>
              <label className="text-slate-400 block mb-1">Voice Selection</label>
              <select
                value={settings.voiceURI || ''}
                onChange={(e) => updateSettings({ voiceURI: e.target.value })}
                className="w-full p-2 rounded-lg bg-slate-950 border border-cyan-500/30 text-cyan-200 focus:outline-none"
              >
                <option value="">Default (Auto British / Natural)</option>
                {voices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-400">Speech Rate</span>
                <span className="text-cyan-300">{settings.speechRate.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.7"
                max="1.5"
                step="0.1"
                value={settings.speechRate}
                onChange={(e) => updateSettings({ speechRate: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-400">Speech Pitch</span>
                <span className="text-cyan-300">{settings.speechPitch.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0.7"
                max="1.3"
                step="0.1"
                value={settings.speechPitch}
                onChange={(e) => updateSettings({ speechPitch: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400"
              />
            </div>
          </div>
        </div>
      )}

      {/* Central Orb Display */}
      <div className="relative p-10 rounded-2xl bg-gradient-to-b from-[#0a1128]/90 via-[#030712] to-[#030712] border border-cyan-500/30 flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 hex-pattern opacity-25 pointer-events-none" />

        <JarvisOrb
          state={jarvisState}
          size="hero"
          onClick={isListening ? stopListening : startListening}
        />

        {/* Big Mic Button */}
        <div className="mt-8 flex items-center gap-4">
          <button
            onClick={isListening ? stopListening : startListening}
            className={`px-8 py-3.5 rounded-2xl font-orbitron font-bold text-sm tracking-wider flex items-center gap-3 transition-all ${
              isListening
                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-[0_0_25px_rgba(244,63,94,0.7)] animate-pulse'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-[0_0_25px_rgba(0,210,255,0.5)]'
            }`}
          >
            {isListening ? (
              <>
                <MicOff className="w-5 h-5" />
                <span>{isRecordingGemini ? 'STOP & TRANSCRIBE' : 'HALT LISTENING'}</span>
              </>
            ) : (
              <>
                <Mic className="w-5 h-5" />
                <span>SPEAK TO J.A.R.V.I.S.</span>
              </>
            )}
          </button>
        </div>

        {/* Live Audio Visualizer Wave Bars */}
        <div className="mt-6 flex items-center gap-1.5 h-8">
          {[40, 70, 95, 60, 85, 100, 75, 45, 90, 65, 80, 50].map((h, i) => (
            <div
              key={i}
              className={`w-1 rounded-full transition-all duration-150 ${
                jarvisState === 'speaking' || jarvisState === 'listening'
                  ? 'bg-cyan-400 shadow-[0_0_8px_#00e5ff]'
                  : 'bg-cyan-900/40'
              }`}
              style={{
                height:
                  jarvisState === 'speaking' || jarvisState === 'listening'
                    ? `${Math.max(12, Math.round(h * Math.random()))}px`
                    : '6px',
              }}
            />
          ))}
        </div>
      </div>

      {/* Real-time Transcription & Response HUD */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono">
        {/* User Vocal Transmission */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-cyan-500/20 space-y-2">
          <div className="flex items-center justify-between text-xs text-cyan-400/80">
            <span className="font-semibold">INPUT ACOUSTIC FEED</span>
            {isListening && (
              <span className="flex items-center gap-1 text-cyan-300 text-[10px]">
                <Radio className="w-3 h-3 animate-ping" />
                {isRecordingGemini ? 'RECORDING VIA MEDIA SENSOR...' : 'RECEIVING LIVE...'}
              </span>
            )}
          </div>
          <div className="p-3 min-h-[90px] rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-200">
            {interimText ? (
              <span className="text-cyan-300 italic">{interimText}...</span>
            ) : transcript ? (
              <span>"{transcript}"</span>
            ) : (
              <span className="text-slate-500">
                Click "Speak to J.A.R.V.I.S." and say something like "What are today's scheduled tasks?"
              </span>
            )}
          </div>
        </div>

        {/* J.A.R.V.I.S. Synthesized Output */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-cyan-500/20 space-y-2">
          <div className="flex items-center justify-between text-xs text-sky-400/80">
            <span className="font-semibold">SYNTHESIZED VOCAL RESPONSE</span>
            {jarvisState === 'speaking' && (
              <span className="flex items-center gap-1 text-sky-300 text-[10px]">
                <Volume2 className="w-3 h-3 animate-bounce" />
                SPEAKING...
              </span>
            )}
          </div>
          <div className="p-3 min-h-[90px] rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-sky-100 overflow-y-auto max-h-36">
            {lastResponse ? (
              <p className="leading-relaxed">{lastResponse}</p>
            ) : (
              <span className="text-slate-500">
                Awaiting your voice command. J.A.R.V.I.S. will synthesize verbal replies automatically.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Error / Permission Notification */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-200 text-xs font-mono flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold">AUDIO SENSOR NOTICE:</div>
            <p>{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Clearly Labeled Text-Input Fallback */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-cyan-300">
          <span className="font-bold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            DIRECT TEXT-INPUT DIRECTIVE FALLBACK (100% RELIABLE)
          </span>
          <span className="text-[11px] text-slate-400">Available across all browsers</span>
        </div>
        <form
          onSubmit={handleFallbackSubmit}
          className="p-3 rounded-xl bg-slate-900/60 border border-cyan-500/20 flex items-center gap-2"
        >
          <input
            type="text"
            value={textFallback}
            onChange={(e) => setTextFallback(e.target.value)}
            placeholder="Type your command here (e.g. 'Plan my day' or 'Search newest AI models')..."
            className="flex-1 bg-slate-950 px-3 py-2 rounded-lg text-xs font-mono text-slate-200 border border-cyan-500/30 focus:outline-none focus:border-cyan-400"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Transmit Directive</span>
          </button>
        </form>
      </div>

      {/* Embedded Hardware Diagnostics Suite */}
      <SystemDiagnostics soundEffectsEnabled={settings.soundEffectsEnabled} />
    </div>
  );
};
