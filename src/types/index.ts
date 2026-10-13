export type JarvisState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error';

export type NavTab = 
  | 'dashboard' 
  | 'chat' 
  | 'voice' 
  | 'memory' 
  | 'tasks' 
  | 'vision' 
  | 'desktop' 
  | 'smarthome' 
  | 'settings';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  sources?: Array<{ title: string; uri: string }>;
  isVoice?: boolean;
  provider?: string;
  searchGroundingUsed?: boolean;
}

export interface MemoryItem {
  id: string;
  content: string;
  category: 'Preference' | 'Fact' | 'Work' | 'Health' | 'Personal' | 'Other';
  createdAt: string;
  updatedAt?: string;
}

export interface TaskItem {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string; // YYYY-MM-DD
  dueTime?: string; // HH:MM
  priority: 'low' | 'medium' | 'high';
  category: 'Work' | 'Personal' | 'Health' | 'Project' | 'Routine';
  notes?: string;
  createdAt: string;
}

export interface SmartDevice {
  id: string;
  name: string;
  type: 'light' | 'thermostat' | 'security' | 'power' | 'audio';
  room: string;
  status: boolean;
  value?: number;
  unit?: string;
  color?: string;
  isSimulated: boolean;
}

export interface ConnectedServiceInfo {
  connected: boolean;
  label: string;
  category?: string;
}

export interface SystemStatusData {
  status: 'ONLINE' | 'OFFLINE' | 'DEGRADED';
  systemName: string;
  hasApiKey: boolean;
  hasElevenLabs?: boolean;
  hasGoogleSearch?: boolean;
  hasOpenAI?: boolean;
  model: string;
  freeTierCompatible: boolean;
  capabilities: string[];
  connectedServices?: {
    gemini?: ConnectedServiceInfo;
    elevenlabs?: ConnectedServiceInfo;
    googleSearch?: ConnectedServiceInfo;
    openai?: ConnectedServiceInfo;
  };
  timestamp: string;
}

export interface JarvisSettings {
  speechRate: number; // 0.8 - 1.5
  speechPitch: number; // 0.8 - 1.2
  voiceURI?: string;
  soundEffectsEnabled: boolean;
  autoSpeakResponses: boolean;
  memoryEnabled: boolean;
  searchGroundingEnabled: boolean;
  customPersonaDirective: string;
  themeColor: 'cyan' | 'blue' | 'amber' | 'emerald';
  voiceProvider: 'elevenlabs' | 'webspeech' | 'gemini';
  aiProvider: 'gemini' | 'openai';
  elevenLabsVoiceId?: string;
}
