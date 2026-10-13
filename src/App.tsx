import React, { useState, useEffect, useRef } from 'react';
import { 
  NavTab, 
  JarvisState, 
  ChatMessage, 
  MemoryItem, 
  TaskItem, 
  JarvisSettings, 
  SystemStatusData 
} from './types';
import { fetchSystemStatus, sendChatMessage } from './services/api';
import { 
  playSciFiSound, 
  speakText, 
  stopSpeaking, 
  createSpeechRecognizer, 
  requestMicrophonePermission, 
  unlockAudio 
} from './utils/audio';
import { WakeWordEngine, cleanTextForSpeech } from './utils/wakeWord';

import { AlertTriangle, X, CheckCircle2 } from 'lucide-react';
import { HeaderHUD } from './components/HeaderHUD';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/views/DashboardView';
import { ChatView } from './components/views/ChatView';
import { VoiceView } from './components/views/VoiceView';
import { MemoryView } from './components/views/MemoryView';
import { TasksView } from './components/views/TasksView';
import { VisionView } from './components/views/VisionView';
import { DesktopView } from './components/views/DesktopView';
import { SmartHomeView } from './components/views/SmartHomeView';
import { SettingsView } from './components/views/SettingsView';

const STORAGE_KEY_SETTINGS = 'jarvis_settings_v1';
const STORAGE_KEY_MESSAGES = 'jarvis_messages_v1';
const STORAGE_KEY_MEMORIES = 'jarvis_memories_v1';
const STORAGE_KEY_TASKS = 'jarvis_tasks_v1';

const DEFAULT_SETTINGS: JarvisSettings = {
  speechRate: 1.0,
  speechPitch: 1.0,
  voiceURI: '',
  soundEffectsEnabled: true,
  autoSpeakResponses: true,
  memoryEnabled: true,
  searchGroundingEnabled: true,
  customPersonaDirective: 'Created by Tony Shakir hussain. Address the user respectfully as Sir or Boss with technical authority and composed wit. Eliminate fluff and keep speech responses punchy and brief (1 to 3 sentences maximum).',
  themeColor: 'cyan',
  voiceProvider: 'elevenlabs',
  aiProvider: 'gemini',
};

const INITIAL_MEMORIES: MemoryItem[] = [
  {
    id: 'mem-1',
    content: 'User prefers concise, direct responses (1-3 sentences) with zero unnecessary padding.',
    category: 'Preference',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'mem-2',
    content: 'User operates the J.A.R.V.I.S. autonomous assistant via wake word and voice commands.',
    category: 'Work',
    createdAt: new Date().toISOString(),
  },
];

const INITIAL_TASKS: TaskItem[] = [
  {
    id: 'task-1',
    title: 'Verify Wake Word Recognition ("JARVIS")',
    completed: true,
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '10:00',
    priority: 'high',
    category: 'Project',
    notes: 'Acoustic trigger online',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-2',
    title: 'Test Google Search Grounding & Holographic Face',
    completed: false,
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '15:30',
    priority: 'medium',
    category: 'Work',
    notes: 'Verify eyes and mouth visual spectrum',
    createdAt: new Date().toISOString(),
  },
];

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [jarvisState, setJarvisState] = useState<JarvisState>('idle');
  const [status, setStatus] = useState<SystemStatusData | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Core States as requested
  const [isActive, setIsActive] = useState<boolean>(true);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isWakeWordListening, setIsWakeWordListening] = useState<boolean>(false);
  const [systemNotice, setSystemNotice] = useState<{ type: 'error' | 'warning' | 'info'; title: string; message: string; fix?: string } | null>(null);

  const wakeWordEngineRef = useRef<WakeWordEngine | null>(null);
  const manualRecognizerRef = useRef<any>(null);

  // Settings
  const [settings, setSettings] = useState<JarvisSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch (_) {
      return DEFAULT_SETTINGS;
    }
  });

  // Chat Messages
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MESSAGES);
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return [
      {
        id: 'msg-init',
        role: 'assistant',
        content:
          "Systems online, sir. J.A.R.V.I.S. operational under the protocols of Tony Shakir hussain. Neural core calibrated for high-precision, concise assistance. Standing by for your directive.",
        timestamp: new Date().toISOString(),
      },
    ];
  });

  // Memories
  const [memories, setMemories] = useState<MemoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MEMORIES);
      return saved ? JSON.parse(saved) : INITIAL_MEMORIES;
    } catch (_) {
      return INITIAL_MEMORIES;
    }
  });

  // Tasks
  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TASKS);
      return saved ? JSON.parse(saved) : INITIAL_TASKS;
    } catch (_) {
      return INITIAL_TASKS;
    }
  });

  // Synchronize to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (_) {}
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages));
    } catch (_) {}
  }, [messages]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MEMORIES, JSON.stringify(memories));
    } catch (_) {}
  }, [memories]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
    } catch (_) {}
  }, [tasks]);

  // Initial backend health check & boot chime
  useEffect(() => {
    fetchSystemStatus().then((s) => {
      setStatus(s);
      if (settings.soundEffectsEnabled) {
        playSciFiSound('boot');
      }
    });
  }, []);

  const updateSettings = (partial: Partial<JarvisSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  // Chat handling
  const handleSendMessage = async (userText: string, isVoice = false): Promise<string> => {
    if (!isActive) return '';

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: userText,
      timestamp: new Date().toISOString(),
      isVoice,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsChatLoading(true);
    setJarvisState('thinking');

    try {
      const contextMessages = [...messages.slice(-8), userMsg].map((m) => ({
        role: m.role as any,
        text: m.content,
      }));

      const res = await sendChatMessage({
        messages: contextMessages,
        enableSearch: settings.searchGroundingEnabled,
        memories: settings.memoryEnabled ? memories : [],
        userPersona: settings.customPersonaDirective,
        provider: settings.aiProvider,
      });

      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: res.reply,
        timestamp: new Date().toISOString(),
        sources: res.sources,
        provider: res.provider,
        searchGroundingUsed: res.searchGroundingUsed,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      if (settings.soundEffectsEnabled) {
        playSciFiSound('affirmative');
      }

      // Voice pipeline with text sanitization
      if (settings.autoSpeakResponses) {
        // Pause wake word engine while speaking so JARVIS does not trigger itself
        if (wakeWordEngineRef.current) {
          wakeWordEngineRef.current.pause();
        }

        setIsSpeaking(true);
        setJarvisState('speaking');

        // Sanitize speech text: strip markdown, URLs, limit to 500 chars
        const sanitized = cleanTextForSpeech(res.reply, 500);

        speakText(sanitized, {
          rate: settings.speechRate,
          pitch: settings.speechPitch,
          voiceURI: settings.voiceURI,
          voiceProvider: settings.voiceProvider,
          voiceId: settings.elevenLabsVoiceId,
          onStart: () => {
            setIsSpeaking(true);
            setJarvisState('speaking');
          },
          onEnd: () => {
            setIsSpeaking(false);
            setJarvisState('idle');
            // Resume wake word engine after speaking completes
            if (wakeWordEngineRef.current && isWakeWordListening) {
              wakeWordEngineRef.current.resume();
            }
          },
          onError: () => {
            setIsSpeaking(false);
            setJarvisState('idle');
            if (wakeWordEngineRef.current && isWakeWordListening) {
              wakeWordEngineRef.current.resume();
            }
          },
        });
      } else {
        setJarvisState('idle');
      }

      return res.reply;
    } catch (err: any) {
      console.error('Chat transmission error:', err);
      const errorMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: `**SYSTEM NOTICE:** ${err.message || 'Transmission failed.'}`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
      setJarvisState('error');
      if (settings.soundEffectsEnabled) playSciFiSound('alert');
      setTimeout(() => setJarvisState('idle'), 3000);
      return '';
    } finally {
      setIsChatLoading(false);
    }
  };

  // Dedicated Voice Handler
  const handleVoiceCommand = async (transcript: string): Promise<string> => {
    return await handleSendMessage(transcript, true);
  };

  // Wake Word Engine Setup & Lifecycle
  useEffect(() => {
    if (isWakeWordListening && isActive) {
      if (!wakeWordEngineRef.current) {
        wakeWordEngineRef.current = new WakeWordEngine({
          onWakeWordDetected: () => {
            if (settings.soundEffectsEnabled) playSciFiSound('beep');
            setIsListening(true);
            setJarvisState('listening');
          },
          onCommand: (command) => {
            setIsListening(false);
            handleSendMessage(command, true);
          },
          onStatusChange: (engineStatus) => {
            if (engineStatus === 'error') {
              console.warn('Wake word engine reported error state.');
            }
          },
        });
      }
      wakeWordEngineRef.current.start();
    } else {
      if (wakeWordEngineRef.current) {
        wakeWordEngineRef.current.stop();
        wakeWordEngineRef.current = null;
      }
    }

    return () => {
      if (wakeWordEngineRef.current) {
        wakeWordEngineRef.current.stop();
        wakeWordEngineRef.current = null;
      }
    };
  }, [isWakeWordListening, isActive, settings.soundEffectsEnabled]);

  // Controls Handlers
  const handleTogglePower = () => {
    const next = !isActive;
    setIsActive(next);
    if (!next) {
      stopSpeaking();
      setIsSpeaking(false);
      setIsListening(false);
      setIsWakeWordListening(false);
      setJarvisState('idle');
      if (settings.soundEffectsEnabled) playSciFiSound('click');
    } else {
      if (settings.soundEffectsEnabled) playSciFiSound('boot');
    }
  };

  const handleToggleWakeWord = async () => {
    if (!isActive) return;
    const next = !isWakeWordListening;
    if (next) {
      unlockAudio();
      const perm = await requestMicrophonePermission();
      if (!perm.granted) {
        setSystemNotice({
          type: 'error',
          title: 'Wake Word Sensor Blocked',
          message: perm.error || 'Microphone access is required for acoustic wake word detection ("JARVIS").',
          fix: 'Click the padlock or site settings icon in your browser address bar -> Permissions -> Allow Microphone -> Refresh.',
        });
        return;
      }
    }
    setIsWakeWordListening(next);
    if (settings.soundEffectsEnabled) playSciFiSound(next ? 'affirmative' : 'click');
  };

  const handleStartManualVoice = async () => {
    if (!isActive) return;
    if (isListening) {
      if (manualRecognizerRef.current) {
        manualRecognizerRef.current.stop();
      }
      setIsListening(false);
      setJarvisState('idle');
      return;
    }

    stopSpeaking();
    setIsSpeaking(false);
    unlockAudio();

    const recognizer = createSpeechRecognizer({
      onStart: () => {
        setIsListening(true);
        setJarvisState('listening');
        if (settings.soundEffectsEnabled) playSciFiSound('beep');
      },
      onResult: (text, isFinal) => {
        if (isFinal) {
          setIsListening(false);
          setJarvisState('idle');
          handleSendMessage(text, true);
        }
      },
      onError: (err) => {
        console.warn('Manual voice recognition error:', err);
        setIsListening(false);
        setJarvisState('error');
        if (err.includes('not-allowed') || err.includes('permission')) {
          setSystemNotice({
            type: 'error',
            title: 'Microphone Permission Denied',
            message: 'Browser has blocked microphone access for this origin.',
            fix: 'Click the padlock or tune icon in the browser address bar, set Microphone to Allow, and refresh the page.',
          });
        }
        setTimeout(() => setJarvisState('idle'), 2500);
      },
      onEnd: () => {
        setIsListening(false);
        if (jarvisState === 'listening') {
          setJarvisState('idle');
        }
      },
    });

    if (recognizer) {
      manualRecognizerRef.current = recognizer;
      try {
        recognizer.start();
      } catch (err) {
        console.warn('Could not start recognition:', err);
      }
    } else {
      setSystemNotice({
        type: 'warning',
        title: 'Native Web Speech API Unavailable',
        message: 'SpeechRecognition is not natively supported in this browser engine (Firefox/Safari/Brave).',
        fix: 'Use Google Chrome / Microsoft Edge for native Web Speech, or navigate to the Voice tab where the Gemini Audio Recorder and Text Input fallback are ready.',
      });
    }
  };

  const handleStopAll = () => {
    stopSpeaking();
    setIsSpeaking(false);
    setIsListening(false);
    if (manualRecognizerRef.current) {
      try {
        manualRecognizerRef.current.stop();
      } catch (_) {}
    }
    setJarvisState('idle');
    if (settings.soundEffectsEnabled) playSciFiSound('click');
  };

  const handleQuickPrompt = (prompt: string) => {
    setCurrentTab('chat');
    handleSendMessage(prompt, false);
  };

  // Memory operations
  const handleAddMemory = (memory: Omit<MemoryItem, 'id' | 'createdAt'>) => {
    const newMem: MemoryItem = {
      ...memory,
      id: `mem-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setMemories((prev) => [newMem, ...prev]);
  };

  const handleUpdateMemory = (id: string, content: string, category: MemoryItem['category']) => {
    setMemories((prev) =>
      prev.map((m) => (m.id === id ? { ...m, content, category, updatedAt: new Date().toISOString() } : m))
    );
  };

  const handleDeleteMemory = (id: string) => {
    setMemories((prev) => prev.filter((m) => m.id !== id));
  };

  const handleClearAllMemories = () => {
    setMemories([]);
  };

  // Task operations
  const handleAddTask = (task: Omit<TaskItem, 'id' | 'createdAt'>) => {
    const newTask: TaskItem = {
      ...task,
      id: `task-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [newTask, ...prev]);
  };

  const handleToggleTaskComplete = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  // Backup / Reset
  const handleImportData = (data: { memories: MemoryItem[]; tasks: TaskItem[]; settings: JarvisSettings }) => {
    if (data.memories) setMemories(data.memories);
    if (data.tasks) setTasks(data.tasks);
    if (data.settings) setSettings(data.settings);
  };

  const handleResetAllData = () => {
    setMemories(INITIAL_MEMORIES);
    setTasks(INITIAL_TASKS);
    setSettings(DEFAULT_SETTINGS);
    setMessages([
      {
        id: 'msg-reset',
        role: 'assistant',
        content: 'System reset complete, sir. Baseline memory banks and schedules recalibrated.',
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col font-sans scanline">
      {/* Top HUD Header */}
      <HeaderHUD
        status={status}
        settings={settings}
        updateSettings={updateSettings}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        jarvisState={jarvisState}
      />

      {/* System Diagnostic & Protocol Notification Banner */}
      {systemNotice && (
        <div className={`px-4 py-3 flex items-center justify-between text-xs font-mono border-b ${
          systemNotice.type === 'error'
            ? 'bg-rose-950/80 border-rose-500/40 text-rose-200'
            : systemNotice.type === 'warning'
            ? 'bg-amber-950/80 border-amber-500/40 text-amber-200'
            : 'bg-cyan-950/80 border-cyan-500/40 text-cyan-200'
        }`}>
          <div className="flex items-start gap-2.5 max-w-4xl">
            {systemNotice.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            ) : systemNotice.type === 'warning' ? (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-0.5">
              <span className="font-bold tracking-wider">{systemNotice.title}:</span>
              <span className="ml-1.5 opacity-90">{systemNotice.message}</span>
              {systemNotice.fix && (
                <div className="text-[11px] font-sans opacity-80 mt-0.5">
                  <strong>Resolution:</strong> {systemNotice.fix}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => setSystemNotice(null)}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer ml-3 shrink-0"
            title="Dismiss Notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Layout: Sidebar + Viewport */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          soundEnabled={settings.soundEffectsEnabled}
          tasksCount={tasks.filter((t) => !t.completed).length}
          memoryCount={memories.length}
        />

        {/* Viewport Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gradient-to-b from-[#030712] via-[#050b1d] to-[#030712]">
          {currentTab === 'dashboard' && (
            <DashboardView
              jarvisState={jarvisState}
              isActive={isActive}
              isListening={isListening}
              isSpeaking={isSpeaking}
              isWakeWordListening={isWakeWordListening}
              onTogglePower={handleTogglePower}
              onToggleWakeWord={handleToggleWakeWord}
              onStartManualVoice={handleStartManualVoice}
              onStopAll={handleStopAll}
              onNavigate={setCurrentTab}
              onQuickPrompt={handleQuickPrompt}
              tasks={tasks}
              memories={memories}
              status={status}
              settings={settings}
            />
          )}

          {currentTab === 'chat' && (
            <ChatView
              messages={messages}
              onSendMessage={async (t, v) => {
                await handleSendMessage(t, v);
              }}
              onClearChat={() => setMessages([])}
              isLoading={isChatLoading}
              settings={settings}
              updateSettings={updateSettings}
              memories={memories}
              jarvisState={jarvisState}
              setJarvisState={setJarvisState}
            />
          )}

          {currentTab === 'voice' && (
            <VoiceView
              jarvisState={jarvisState}
              setJarvisState={setJarvisState}
              onVoiceCommand={handleVoiceCommand}
              settings={settings}
              updateSettings={updateSettings}
            />
          )}

          {currentTab === 'memory' && (
            <MemoryView
              memories={memories}
              onAddMemory={handleAddMemory}
              onUpdateMemory={handleUpdateMemory}
              onDeleteMemory={handleDeleteMemory}
              onClearAllMemories={handleClearAllMemories}
              settings={settings}
              updateSettings={updateSettings}
            />
          )}

          {currentTab === 'tasks' && (
            <TasksView
              tasks={tasks}
              onAddTask={handleAddTask}
              onToggleComplete={handleToggleTaskComplete}
              onDeleteTask={handleDeleteTask}
              settings={settings}
            />
          )}

          {currentTab === 'vision' && <VisionView settings={settings} />}

          {currentTab === 'desktop' && <DesktopView settings={settings} />}

          {currentTab === 'smarthome' && <SmartHomeView settings={settings} />}

          {currentTab === 'settings' && (
            <SettingsView
              settings={settings}
              updateSettings={updateSettings}
              memories={memories}
              tasks={tasks}
              onImportData={handleImportData}
              onResetAllData={handleResetAllData}
            />
          )}
        </main>
      </div>
    </div>
  );
}
