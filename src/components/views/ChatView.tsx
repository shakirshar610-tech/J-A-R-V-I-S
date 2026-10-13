import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Send, 
  Mic, 
  MicOff, 
  Square, 
  Trash2, 
  Copy, 
  Check, 
  Volume2, 
  VolumeX, 
  Globe, 
  ExternalLink, 
  Sparkles, 
  AlertCircle,
  RefreshCw,
  Cpu
} from 'lucide-react';
import { ChatMessage, JarvisSettings, JarvisState, MemoryItem } from '../../types';
import { 
  playSciFiSound, 
  speakText, 
  stopSpeaking, 
  createSpeechRecognizer, 
  requestMicrophonePermission, 
  unlockAudio 
} from '../../utils/audio';

interface ChatViewProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, isVoice?: boolean) => Promise<void>;
  onClearChat: () => void;
  isLoading: boolean;
  settings: JarvisSettings;
  updateSettings: (partial: Partial<JarvisSettings>) => void;
  memories: MemoryItem[];
  jarvisState: JarvisState;
  setJarvisState: (state: JarvisState) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  onSendMessage,
  onClearChat,
  isLoading,
  settings,
  updateSettings,
  memories,
  jarvisState,
  setJarvisState,
}) => {
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [isListeningInput, setIsListeningInput] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
      stopSpeaking();
    };
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const textToSend = input.trim();
    setInput('');
    if (settings.soundEffectsEnabled) playSciFiSound('click');
    await onSendMessage(textToSend, false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleInputVoice = async () => {
    if (isListeningInput) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListeningInput(false);
      setJarvisState('idle');
      if (settings.soundEffectsEnabled) playSciFiSound('click');
      return;
    }

    setSpeechError(null);
    unlockAudio();

    const recognizer = createSpeechRecognizer({
      onStart: () => {
        setIsListeningInput(true);
        setJarvisState('listening');
        if (settings.soundEffectsEnabled) playSciFiSound('beep');
      },
      onResult: (transcript, isFinal) => {
        setInput((prev) => {
          const prefix = prev ? prev + ' ' : '';
          return prefix + transcript;
        });
        if (isFinal) {
          setIsListeningInput(false);
          setJarvisState('idle');
          if (settings.soundEffectsEnabled) playSciFiSound('affirmative');
        }
      },
      onError: (err) => {
        setIsListeningInput(false);
        setJarvisState('error');
        setSpeechError(`Microphone notice: ${err}. Please ensure microphone permission is granted in browser.`);
      },
      onEnd: () => {
        setIsListeningInput(false);
        if (jarvisState === 'listening') {
          setJarvisState('idle');
        }
      },
    });

    if (!recognizer) {
      setSpeechError('Speech recognition is not supported in this browser. Please use Google Chrome or Edge.');
      return;
    }

    recognitionRef.current = recognizer;
    try {
      recognizer.start();
    } catch (e) {
      setSpeechError('Could not start microphone sensor.');
    }
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    if (settings.soundEffectsEnabled) playSciFiSound('click');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeakMessage = (id: string, text: string) => {
    if (speakingMsgId === id) {
      stopSpeaking();
      setSpeakingMsgId(null);
      setJarvisState('idle');
      return;
    }

    stopSpeaking();
    setSpeakingMsgId(id);
    setJarvisState('speaking');

    speakText(text, {
      rate: settings.speechRate,
      pitch: settings.speechPitch,
      voiceURI: settings.voiceURI,
      onStart: () => {
        setSpeakingMsgId(id);
        setJarvisState('speaking');
      },
      onEnd: () => {
        setSpeakingMsgId(null);
        setJarvisState('idle');
      },
      onError: () => {
        setSpeakingMsgId(null);
        setJarvisState('idle');
      },
    });
  };

  const suggestedPrompts = [
    'Help me plan my day and prioritize tasks.',
    'Explain how Google Search grounding enhances AI accuracy.',
    'Summarize latest quantum computing breakthroughs.',
    'Write a clean TypeScript utility for rate-limiting requests.',
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] max-w-5xl mx-auto">
      {/* Top Controls Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/60 border border-cyan-500/20 rounded-xl mb-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-300">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>SESSION PROTOCOL: ONLINE</span>
          </div>

          {memories.length > 0 && settings.memoryEnabled && (
            <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30">
              {memories.length} Memories Loaded
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Search Grounding Switch */}
          <button
            onClick={() => {
              if (settings.soundEffectsEnabled) playSciFiSound('click');
              updateSettings({ searchGroundingEnabled: !settings.searchGroundingEnabled });
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-all border ${
              settings.searchGroundingEnabled
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Live Web Grounding"
          >
            <Globe className="w-3 h-3 text-cyan-400" />
            <span className="hidden md:inline">Grounding:</span>
            <span>{settings.searchGroundingEnabled ? 'ON' : 'OFF'}</span>
          </button>

          {/* Clear Chat */}
          {messages.length > 0 && (
            <button
              onClick={() => {
                if (settings.soundEffectsEnabled) playSciFiSound('click');
                onClearChat();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
              title="Clear Conversation History"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-cyan-950/50 border border-cyan-400/40 flex items-center justify-center shadow-[0_0_25px_rgba(0,210,255,0.3)]">
              <Sparkles className="w-8 h-8 text-cyan-300 animate-pulse" />
            </div>
            <div className="space-y-2 max-w-md">
              <h2 className="text-xl font-orbitron font-bold text-cyan-200">
                J.A.R.V.I.S. Neural Core
              </h2>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                Awaiting your prompt, sir. You can speak or type your instructions. Live web search grounding is available to retrieve verified real-time data.
              </p>
            </div>

            {/* Suggested Prompts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-xl">
              {suggestedPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInput(prompt);
                    inputRef.current?.focus();
                    if (settings.soundEffectsEnabled) playSciFiSound('click');
                  }}
                  className="p-3 rounded-xl bg-slate-900/70 hover:bg-cyan-950/50 border border-cyan-500/20 hover:border-cyan-400/50 text-left text-xs font-mono text-cyan-200/90 transition-all flex items-start gap-2 shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                  <span>{prompt}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            const isSpeakingThis = speakingMsgId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-400/40 flex items-center justify-center text-cyan-300 font-orbitron text-xs font-bold shrink-0 mt-1 shadow-[0_0_10px_rgba(0,210,255,0.2)]">
                    J
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 transition-all ${
                    isUser
                      ? 'bg-gradient-to-r from-cyan-900/60 to-blue-900/70 border border-cyan-400/30 text-cyan-50 rounded-tr-sm'
                      : 'bg-slate-900/80 border border-cyan-500/20 text-slate-200 rounded-tl-sm backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.3)]'
                  }`}
                >
                  {/* Sender & Timestamp */}
                  <div className="flex items-center justify-between gap-4 mb-2 pb-1.5 border-b border-cyan-500/10 text-[10px] font-mono text-cyan-400/60">
                    <span className="font-semibold tracking-wider">
                      {isUser ? 'USER COMMAND' : 'J.A.R.V.I.S. INTELLIGENCE'}
                    </span>
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  {/* Message Content rendered with ReactMarkdown */}
                  <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-slate-950 prose-pre:border prose-pre:border-cyan-500/20 prose-code:text-cyan-300 prose-a:text-cyan-400 hover:prose-a:underline">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>

                  {/* Search Grounding Sources / Citations */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-cyan-500/15 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-cyan-400/70">
                        <Globe className="w-3 h-3 text-cyan-400" />
                        <span>VERIFIED GROUNDING SOURCES:</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.sources.map((source: { title: string; uri: string }, i: number) => (
                          <a
                            key={i}
                            href={source.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/30 text-cyan-300 hover:text-cyan-100 transition-colors"
                          >
                            <span className="truncate max-w-[180px]">{source.title}</span>
                            <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Bar (Copy, Speak) */}
                  {!isUser && (
                    <div className="mt-3 pt-2 border-t border-cyan-500/10 flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleSpeakMessage(msg.id, msg.content)}
                        className={`p-1.5 rounded-lg text-xs font-mono transition-colors flex items-center gap-1 ${
                          isSpeakingThis
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-400/40'
                            : 'text-slate-400 hover:text-cyan-300'
                        }`}
                        title={isSpeakingThis ? 'Stop Vocal Synthesis' : 'Read Out Loud'}
                      >
                        {isSpeakingThis ? (
                          <>
                            <Square className="w-3.5 h-3.5 text-sky-400 fill-current animate-pulse" />
                            <span className="text-[10px]">Stop</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5" />
                            <span className="text-[10px]">Speak</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => copyToClipboard(msg.id, msg.content)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
                        title="Copy Response"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-[10px] text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span className="text-[10px]">Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-lg bg-blue-950/80 border border-blue-400/40 flex items-center justify-center text-blue-300 font-orbitron text-xs font-bold shrink-0 mt-1">
                    U
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-3 justify-start items-center">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-400/40 flex items-center justify-center text-cyan-300 font-orbitron text-xs font-bold shrink-0">
              J
            </div>
            <div className="px-4 py-3 rounded-2xl bg-slate-900/80 border border-cyan-500/20 text-cyan-300 flex items-center gap-2 font-mono text-xs shadow-[0_0_15px_rgba(0,210,255,0.15)]">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
              <span>J.A.R.V.I.S. synthesizing response...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Speech Error Banner */}
      {speechError && (
        <div className="my-2 p-2 rounded-lg bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{speechError}</span>
          </div>
          <button
            onClick={() => setSpeechError(null)}
            className="text-rose-400 hover:text-rose-200 underline text-[11px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Bottom Input Area */}
      <div className="mt-3 relative">
        <div className="relative rounded-2xl bg-slate-900/90 border border-cyan-500/30 focus-within:border-cyan-400 focus-within:shadow-[0_0_20px_rgba(0,210,255,0.25)] transition-all overflow-hidden backdrop-blur-md">
          {/* Subtle glowing scan bar */}
          {isLoading && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />
          )}

          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isListeningInput
                ? 'Listening to vocal feed... (speak now)'
                : 'Transmit command or query to J.A.R.V.I.S. (Shift+Enter for newline)...'
            }
            rows={2}
            className="w-full bg-transparent p-3.5 pr-28 text-slate-100 placeholder:text-slate-500 text-sm font-sans focus:outline-none resize-none"
            disabled={isLoading}
          />

          {/* Right Input Buttons */}
          <div className="absolute right-2.5 bottom-2.5 flex items-center gap-1.5">
            {/* Microphone Button */}
            <button
              onClick={toggleInputVoice}
              disabled={isLoading}
              className={`p-2 rounded-xl transition-all ${
                isListeningInput
                  ? 'bg-rose-500 text-white animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.6)]'
                  : 'bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/30'
              }`}
              title={isListeningInput ? 'Stop Listening' : 'Voice Input (Speech-to-Text)'}
            >
              {isListeningInput ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="p-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 transition-all shadow-[0_0_12px_rgba(0,210,255,0.3)]"
              title="Transmit Command"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between px-2 pt-1.5 text-[10px] font-mono text-cyan-400/50">
          <span>POWERED BY GOOGLE GEMINI 3.8 FLASH</span>
          <span>ENTER TO SEND // VOICE COMM ENABLED</span>
        </div>
      </div>
    </div>
  );
};
