// Wake Word & Audio Pipeline: Command Extraction, Auto-restart, and Text Sanitization

export function cleanTextForSpeech(text: string, maxChars = 500): string {
  if (!text) return '';

  let cleaned = text
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, ' [code omitted] ')
    // Remove inline code
    .replace(/`([^`]+)`/g, '$1')
    // Remove Markdown links, keep link text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove bare URLs (http://, https://, www.)
    .replace(/(?:https?:\/\/|www\.)[^\s]+/gi, '')
    // Remove markdown headers, bold, italics, strikethrough, blockquotes
    .replace(/[#*_~>]/g, '')
    // Remove bullet points and dashes
    .replace(/^[-*+]\s+/gm, '')
    // Collapse multi-spaces and newlines
    .replace(/\s+/g, ' ')
    .trim();

  // Enforce maxChars limit for spoken responses to keep speech snappy
  if (cleaned.length > maxChars) {
    // Truncate at sentence boundary if possible
    const periodIndex = cleaned.lastIndexOf('.', maxChars);
    if (periodIndex > maxChars * 0.6) {
      cleaned = cleaned.substring(0, periodIndex + 1);
    } else {
      cleaned = cleaned.substring(0, maxChars) + '...';
    }
  }

  return cleaned;
}

export interface WakeWordResult {
  detected: boolean;
  command: string;
}

export function extractWakeWordCommand(transcript: string): WakeWordResult {
  if (!transcript) return { detected: false, command: '' };

  const normalized = transcript.trim();
  // Regex to match "JARVIS", "HEY JARVIS", "OKAY JARVIS", "HI JARVIS"
  const wakeWordRegex = /(?:hey\s+|ok\s+|okay\s+|hi\s+)?jarvis[\s,.:;!?-]*/i;
  const match = normalized.match(wakeWordRegex);

  if (!match) {
    return { detected: false, command: '' };
  }

  const matchIndex = match.index || 0;
  const matchLength = match[0].length;
  const command = normalized.substring(matchIndex + matchLength).trim();

  return {
    detected: true,
    command,
  };
}

export class WakeWordEngine {
  private recognition: any = null;
  private isEnabled: boolean = false;
  private onCommandCallback: (command: string) => void;
  private onWakeWordDetectedCallback: () => void;
  private onStatusChangeCallback: (status: 'idle' | 'listening' | 'error') => void;
  private restartTimeout: any = null;

  constructor(callbacks: {
    onCommand: (command: string) => void;
    onWakeWordDetected: () => void;
    onStatusChange: (status: 'idle' | 'listening' | 'error') => void;
  }) {
    this.onCommandCallback = callbacks.onCommand;
    this.onWakeWordDetectedCallback = callbacks.onWakeWordDetected;
    this.onStatusChangeCallback = callbacks.onStatusChange;
  }

  public start() {
    this.isEnabled = true;
    this.initRecognition();
  }

  public pause() {
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch (_) {}
    }
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }
  }

  public resume() {
    if (this.isEnabled) {
      this.initRecognition();
    }
  }

  public stop() {
    this.isEnabled = false;
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch (_) {}
      this.recognition = null;
    }
    this.onStatusChangeCallback('idle');
  }

  private initRecognition() {
    if (typeof window === 'undefined') return;

    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      this.onStatusChangeCallback('error');
      return;
    }

    try {
      if (this.recognition) {
        try {
          this.recognition.abort();
        } catch (_) {}
      }

      this.recognition = new SpeechRecognitionClass();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onstart = () => {
        this.onStatusChangeCallback('listening');
      };

      this.recognition.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          const transcript = res[0]?.transcript || '';

          const extraction = extractWakeWordCommand(transcript);

          if (extraction.detected) {
            this.onWakeWordDetectedCallback();

            if (res.isFinal) {
              const command = extraction.command.trim();
              this.onCommandCallback(command || 'Hello JARVIS');
              // Briefly restart recognition to clear buffer
              this.recognition.abort();
            }
          }
        }
      };

      this.recognition.onerror = (e: any) => {
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          console.warn('[WakeWord Engine]: Microphone permission denied or service blocked.');
          this.isEnabled = false;
          this.onStatusChangeCallback('error');
          return;
        }
        if (e.error !== 'no-speech' && e.error !== 'aborted') {
          console.warn('[WakeWord Engine Notice]:', e.error);
        }
      };

      this.recognition.onend = () => {
        // Auto-restart loop if still enabled and not error
        if (this.isEnabled) {
          this.restartTimeout = setTimeout(() => {
            this.initRecognition();
          }, 600);
        } else {
          this.onStatusChangeCallback('idle');
        }
      };

      this.recognition.start();
    } catch (err) {
      console.warn('Wake word initialization retry...', err);
      if (this.isEnabled) {
        this.restartTimeout = setTimeout(() => this.initRecognition(), 1000);
      }
    }
  }
}
