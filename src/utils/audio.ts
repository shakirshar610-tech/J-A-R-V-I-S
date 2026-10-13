// Audio Utility using Web Audio API for zero-latency, asset-free sci-fi sound effects
// and ElevenLabs Neural Vocal Synthesis + Browser SpeechSynthesis + Gemini TTS fallback
// and OpenAI Whisper + Gemini MediaRecorder Audio Transcription

let audioCtx: AudioContext | null = null;
let activeUtterance: SpeechSynthesisUtterance | null = null;
let activeAudioElement: HTMLAudioElement | null = null;

// Ensure audio context is unlocked
export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// User-gesture unblock for Web Audio and SpeechSynthesis
export function unlockAudio() {
  try {
    getAudioContext();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    }
  } catch (_) {}
}

export function playSciFiSound(type: 'click' | 'affirmative' | 'alert' | 'scan' | 'boot' | 'beep') {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.04);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.start(now);
      osc.stop(now + 0.04);
    } else if (type === 'beep') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'affirmative') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.08); // A5
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.setValueAtTime(0.12, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'alert') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.linearRampToValueAtTime(220, now + 0.2);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'scan') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(1400, now + 0.18);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'boot') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(660, now + 0.4);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    }
  } catch (err) {
    // Audio context interaction fallback
  }
}

// Browser Speech Synthesis Helpers
export function getAvailableVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return resolve([]);
    }
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      return resolve(voices);
    }
    window.speechSynthesis.onvoiceschanged = () => {
      resolve(window.speechSynthesis.getVoices());
    };
    setTimeout(() => {
      resolve(window.speechSynthesis.getVoices());
    }, 500);
  });
}

// Clean markdown tags and unpronounceable characters so speech reads naturally
export function stripMarkdownForSpeech(text: string): string {
  if (!text) return '';
  return text
    .replace(/```[\s\S]*?```/g, ' code omitted ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/(?:https?:\/\/|www\.)[^\s]+/gi, '')
    .replace(/[#*_~>]/g, '')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/---+/g, '')
    .replace(/[\{\}\[\]\<\>\(\)]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Dedicated Speech Test method using SpeechSynthesisUtterance("Hello, I am JARVIS.")
export function testSpeechSynthesis(
  phrase: string = 'Hello, I am JARVIS.',
  callbacks?: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (errMessage: string) => void;
  }
): { success: boolean; error?: string } {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    const err = 'SpeechSynthesis API is not supported in this browser.';
    callbacks?.onError?.(err);
    return { success: false, error: err };
  }

  try {
    unlockAudio();
    window.speechSynthesis.cancel();
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    const utterance = new SpeechSynthesisUtterance(phrase);
    activeUtterance = utterance;
    (window as any).__jarvis_test_utterance = utterance;

    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      const britishVoice = voices.find(
        (v) =>
          v.lang.startsWith('en-GB') ||
          v.name.toLowerCase().includes('daniel') ||
          v.name.toLowerCase().includes('george') ||
          v.name.toLowerCase().includes('oliver') ||
          v.name.toLowerCase().includes('british') ||
          v.name.toLowerCase().includes('natural')
      );
      if (britishVoice) {
        utterance.voice = britishVoice;
      }
    }

    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      callbacks?.onStart?.();
    };

    utterance.onend = () => {
      activeUtterance = null;
      callbacks?.onEnd?.();
    };

    utterance.onerror = (e) => {
      activeUtterance = null;
      callbacks?.onError?.(e.error || 'Speech synthesis error');
    };

    window.speechSynthesis.speak(utterance);
    return { success: true };
  } catch (err: any) {
    callbacks?.onError?.(err.message || 'Speech execution failed');
    return { success: false, error: err.message };
  }
}

// ElevenLabs Audio Player
async function playElevenLabsAudio(
  cleanText: string,
  options: {
    voiceId?: string;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: any) => void;
  }
): Promise<boolean> {
  try {
    const res = await fetch('/api/elevenlabs/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: cleanText.slice(0, 500),
        voiceId: options.voiceId || 'JBFqnCBsd6RMkjVDRZzb',
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      console.warn('ElevenLabs TTS returned status:', res.status, errJson.error);
      return false; // Triggers fallback to Web Speech
    }

    const data = await res.json();
    if (!data.audioBase64) {
      return false;
    }

    const audioUrl = `data:${data.mimeType || 'audio/mpeg'};base64,${data.audioBase64}`;
    const audio = new Audio(audioUrl);
    activeAudioElement = audio;

    return new Promise((resolve) => {
      audio.onplay = () => options.onStart?.();
      audio.onended = () => {
        activeAudioElement = null;
        options.onEnd?.();
        resolve(true);
      };
      audio.onerror = () => {
        activeAudioElement = null;
        resolve(false);
      };

      audio.play().catch(() => {
        activeAudioElement = null;
        resolve(false);
      });
    });
  } catch (err) {
    console.warn('ElevenLabs fetch exception:', err);
    return false;
  }
}

// Fallback to Web Speech API
function speakWithWebSpeech(
  cleanText: string,
  options: {
    rate?: number;
    pitch?: number;
    voiceURI?: string;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: any) => void;
  }
) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    speakWithGeminiFallback(cleanText, options);
    return;
  }

  try {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    activeUtterance = utterance;
    (window as any).__jarvis_active_utterance = utterance;

    utterance.rate = options.rate ?? 1.0;
    utterance.pitch = options.pitch ?? 1.0;

    const voices = window.speechSynthesis.getVoices();
    if (options.voiceURI && voices && voices.length > 0) {
      const match = voices.find((v) => v.voiceURI === options.voiceURI);
      if (match) utterance.voice = match;
    } else if (voices && voices.length > 0) {
      const jarvisVoice = voices.find(
        (v) =>
          v.lang.startsWith('en-GB') ||
          v.name.toLowerCase().includes('daniel') ||
          v.name.toLowerCase().includes('george') ||
          v.name.toLowerCase().includes('oliver') ||
          v.name.toLowerCase().includes('british') ||
          v.name.toLowerCase().includes('natural')
      );
      if (jarvisVoice) utterance.voice = jarvisVoice;
    }

    utterance.onstart = () => {
      options.onStart?.();
    };

    utterance.onend = () => {
      activeUtterance = null;
      options.onEnd?.();
    };

    utterance.onerror = (e) => {
      activeUtterance = null;
      if (e.error !== 'canceled' && e.error !== 'interrupted') {
        console.warn('SpeechSynthesis error, routing to Gemini fallback:', e.error);
        speakWithGeminiFallback(cleanText, options);
      } else {
        options.onEnd?.();
      }
    };

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    speakWithGeminiFallback(cleanText, options);
  }
}

// Fallback to server Gemini Neural TTS
async function speakWithGeminiFallback(
  cleanText: string,
  options: { onStart?: () => void; onEnd?: () => void; onError?: (err: any) => void }
) {
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: cleanText.slice(0, 400), voiceName: 'Fenrir', preferElevenLabs: false }),
    });

    if (!res.ok) throw new Error('TTS server response: ' + res.status);
    const data = await res.json();
    if (!data.audioBase64) throw new Error('No audio payload in TTS response.');

    const audioUrl = `data:audio/wav;base64,${data.audioBase64}`;
    const audio = new Audio(audioUrl);
    activeAudioElement = audio;

    audio.onplay = () => options.onStart?.();
    audio.onended = () => {
      activeAudioElement = null;
      options.onEnd?.();
    };
    audio.onerror = (e) => {
      activeAudioElement = null;
      options.onError?.(e);
      options.onEnd?.();
    };

    await audio.play();
  } catch (fallbackErr: any) {
    console.warn('Gemini TTS fallback notice:', fallbackErr.message);
    options.onError?.(fallbackErr);
    options.onEnd?.();
  }
}

// Unified Voice Output Controller
// Automatically uses ElevenLabs for high-quality British synthesis,
// falling back seamlessly to native Web Speech API if quota expires or fails!
export async function speakText(
  text: string,
  options: {
    rate?: number;
    pitch?: number;
    voiceURI?: string;
    voiceProvider?: 'elevenlabs' | 'webspeech' | 'gemini';
    voiceId?: string;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: any) => void;
  } = {}
) {
  if (typeof window === 'undefined') return;

  stopSpeaking();
  unlockAudio();

  const clean = stripMarkdownForSpeech(text);
  if (!clean) {
    options.onEnd?.();
    return;
  }

  // If user explicitly chose webspeech, skip ElevenLabs
  if (options.voiceProvider === 'webspeech') {
    speakWithWebSpeech(clean, options);
    return;
  }

  // 1. Try ElevenLabs Primary Synthesis
  const elevenSuccess = await playElevenLabsAudio(clean, {
    voiceId: options.voiceId,
    onStart: options.onStart,
    onEnd: options.onEnd,
    onError: options.onError,
  });

  // 2. If ElevenLabs succeeded, we are done
  if (elevenSuccess) return;

  // 3. Fall back seamlessly to native Web Speech API
  console.log('[JARVIS Voice] ElevenLabs unavailable or quota reached; falling back to Web Speech API.');
  speakWithWebSpeech(clean, options);
}

export function stopSpeaking() {
  if (typeof window !== 'undefined') {
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (_) {}
    }
  }
  if (activeAudioElement) {
    try {
      activeAudioElement.pause();
      activeAudioElement.currentTime = 0;
      activeAudioElement = null;
    } catch (_) {}
  }
  activeUtterance = null;
}

// Real Microphone Test & Permission check:
// Requests audio permission, reports actual track labels and settings,
// and stops all microphone tracks when finished.
export interface MicTestResult {
  granted: boolean;
  trackLabel?: string;
  sampleRate?: number;
  channelCount?: number;
  error?: string;
  rawError?: string;
  actionRequired?: string;
  timestamp: string;
}

export async function testMicrophonePermission(): Promise<MicTestResult> {
  const timestamp = new Date().toLocaleTimeString();

  if (typeof window === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return {
      granted: false,
      error: 'Microphone API (navigator.mediaDevices.getUserMedia) is not supported or context is insecure (requires HTTPS / localhost).',
      actionRequired: 'Ensure you are browsing over HTTPS or localhost, and use Chrome, Edge, or Firefox.',
      timestamp,
    };
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const tracks = stream.getTracks();
    const firstTrack = tracks[0];
    const settings = firstTrack ? firstTrack.getSettings() : {};
    const trackLabel = firstTrack?.label || 'Microphone Hardware Stream';

    // Stop all tracks immediately as required
    tracks.forEach((track) => track.stop());

    return {
      granted: true,
      trackLabel,
      sampleRate: settings.sampleRate,
      channelCount: settings.channelCount,
      timestamp,
    };
  } catch (err: any) {
    const errName = err.name || 'UnknownError';
    let userFriendlyError = err.message || 'Microphone access failed.';
    let actionRequired = 'Check browser settings.';

    if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
      userFriendlyError = 'Microphone permission was denied by the browser.';
      actionRequired =
        'Click the padlock or site settings icon in your browser address bar -> Permissions -> Allow Microphone -> Refresh the page.';
    } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
      userFriendlyError = 'No audio input hardware (microphone) detected on your computer.';
      actionRequired = 'Plug in a headset or microphone and verify it is enabled in your OS sound settings.';
    } else if (errName === 'NotReadableError' || errName === 'TrackStartError') {
      userFriendlyError = 'Microphone is already occupied or locked by another app (e.g. Zoom, Teams).';
      actionRequired = 'Close other applications using the microphone and try again.';
    } else if (errName === 'SecurityError') {
      userFriendlyError = 'Microphone access is restricted by iframe policy or browser security sandbox.';
      actionRequired = 'Open the app in a standalone tab or allow microphone permissions in the frame.';
    }

    return {
      granted: false,
      error: userFriendlyError,
      rawError: `${errName}: ${err.message}`,
      actionRequired,
      timestamp,
    };
  }
}

export async function requestMicrophonePermission(): Promise<{ granted: boolean; error?: string }> {
  const res = await testMicrophonePermission();
  return {
    granted: res.granted,
    error: res.error,
  };
}

// Browser SpeechRecognition Support Diagnostic
export interface SpeechRecognitionSupportInfo {
  supported: boolean;
  engine: 'webkitSpeechRecognition' | 'SpeechRecognition' | 'none';
  browserHint: string;
  hasMediaRecorder: boolean;
  limitationExplanation?: string;
}

export function checkSpeechRecognitionSupport(): SpeechRecognitionSupportInfo {
  if (typeof window === 'undefined') {
    return {
      supported: false,
      engine: 'none',
      browserHint: 'SSR',
      hasMediaRecorder: false,
      limitationExplanation: 'Running in non-browser environment.',
    };
  }

  const hasWebkit = 'webkitSpeechRecognition' in window;
  const hasStandard = 'SpeechRecognition' in window;
  const supported = hasWebkit || hasStandard;
  const engine = hasStandard ? 'SpeechRecognition' : hasWebkit ? 'webkitSpeechRecognition' : 'none';
  const hasMediaRecorder = typeof MediaRecorder !== 'undefined';

  const ua = navigator.userAgent.toLowerCase();
  let browserHint = 'Chrome / Chromium';
  if (ua.includes('firefox')) browserHint = 'Firefox';
  else if (ua.includes('edg/')) browserHint = 'Edge';
  else if (ua.includes('safari') && !ua.includes('chrome')) browserHint = 'Safari';
  else if (ua.includes('brave')) browserHint = 'Brave';

  let limitationExplanation = undefined;
  if (!supported) {
    limitationExplanation = `Native SpeechRecognition is not supported in ${browserHint}. Chrome, Edge, and Opera support native SpeechRecognition out of the box. For ${browserHint}, you can use the built-in OpenAI Whisper / Gemini Audio Recorder or the Text-Input fallback below.`;
  }

  return {
    supported,
    engine,
    browserHint,
    hasMediaRecorder,
    limitationExplanation,
  };
}

// Browser Speech Recognition Factory
export function createSpeechRecognizer(callbacks: {
  onResult: (transcript: string, isFinal: boolean) => void;
  onError: (error: string) => void;
  onEnd: () => void;
  onStart?: () => void;
}) {
  if (typeof window === 'undefined') return null;

  const SpeechRecognitionClass =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognitionClass) {
    return null;
  }

  try {
    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      callbacks.onStart?.();
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        callbacks.onResult(finalTranscript.trim(), true);
      } else if (interimTranscript) {
        callbacks.onResult(interimTranscript.trim(), false);
      }
    };

    recognition.onerror = (event: any) => {
      callbacks.onError(event.error || 'Speech recognition error');
    };

    recognition.onend = () => {
      callbacks.onEnd();
    };

    return recognition;
  } catch (err) {
    return null;
  }
}

// MediaRecorder Audio Capture & OpenAI Whisper / Gemini Transcription Helper
// Automatically invokes Whisper API when browser microphone stream access fails inside sandboxed iframes
export class AudioRecorderTranscriber {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;

  async start(): Promise<boolean> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioChunks = [];
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      this.mediaRecorder = new MediaRecorder(this.stream, { mimeType });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(250);
      return true;
    } catch (err) {
      console.warn('MediaRecorder start error:', err);
      return false;
    }
  }

  async stopAndTranscribe(): Promise<string> {
    const res = await this.stopAndTranscribeWithDetails();
    return res.transcript;
  }

  async stopAndTranscribeWithDetails(): Promise<{ transcript: string; provider?: string }> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        return resolve({ transcript: '' });
      }

      this.mediaRecorder.onstop = async () => {
        try {
          const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
          const audioBlob = new Blob(this.audioChunks, { type: mimeType });

          if (this.stream) {
            this.stream.getTracks().forEach((track) => track.stop());
            this.stream = null;
          }

          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            try {
              const base64Audio = (reader.result as string).split(',')[1];
              const res = await fetch('/api/transcribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ audioBase64: base64Audio, mimeType }),
              });
              if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || `Transcription error status: ${res.status}`);
              }
              const data = await res.json();
              resolve({
                transcript: data.transcript || '',
                provider: data.provider || 'whisper',
              });
            } catch (postErr) {
              reject(postErr);
            }
          };
        } catch (err) {
          reject(err);
        }
      };

      this.mediaRecorder.stop();
    });
  }

  cancel() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch (_) {}
    }
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
  }
}
