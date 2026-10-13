import { SystemStatusData, MemoryItem, TaskItem } from '../types';

export interface ChatApiPayload {
  messages: Array<{ role: 'user' | 'assistant' | 'model'; text: string }>;
  enableSearch?: boolean;
  memories?: MemoryItem[];
  userPersona?: string;
  provider?: 'gemini' | 'openai';
}

export interface ChatApiResponse {
  reply: string;
  sources?: Array<{ title: string; uri: string }>;
  model: string;
  provider?: string;
  searchGroundingUsed?: boolean;
}

export async function fetchSystemStatus(): Promise<SystemStatusData> {
  try {
    const res = await fetch('/api/status');
    if (!res.ok) {
      throw new Error(`Status check returned ${res.status}`);
    }
    return await res.json();
  } catch (error: any) {
    return {
      status: 'DEGRADED',
      systemName: 'J.A.R.V.I.S. Core (Offline Fallback)',
      hasApiKey: false,
      model: 'gemini-3.8-flash',
      freeTierCompatible: true,
      capabilities: ['Local Storage Mode', 'Speech Synthesis', 'Local Scheduler'],
      timestamp: new Date().toISOString(),
    };
  }
}

export async function sendChatMessage(payload: ChatApiPayload): Promise<ChatApiResponse> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to receive transmission from J.A.R.V.I.S. core.');
  }

  return data;
}

export async function sendVisionAnalysis(params: {
  prompt: string;
  imageBase64: string;
  mimeType: string;
}): Promise<{ analysis: string; model: string }> {
  const res = await fetch('/api/vision', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Optical diagnostics processing failed.');
  }

  return data;
}

export async function parseNaturalLanguageTask(text: string): Promise<Partial<TaskItem>> {
  try {
    const res = await fetch('/api/parse-task', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        currentDate: new Date().toISOString().split('T')[0],
      }),
    });

    if (!res.ok) throw new Error('NLP extraction returned status ' + res.status);
    const data = await res.json();
    return data.task || { title: text };
  } catch (err) {
    console.warn('NLP parsing fallback:', err);
    return {
      title: text,
      priority: 'medium',
      category: 'Personal',
      dueDate: new Date().toISOString().split('T')[0],
      dueTime: '12:00',
    };
  }
}

// Diagnostics: Test Gemini Neural Engine
export async function testGeminiAi(): Promise<{ status: string; reply?: string; latencyMs?: number; error?: string }> {
  try {
    const res = await fetch('/api/test-ai');
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        status: 'ERROR',
        error: data.error || `Server responded with status ${res.status}`,
        latencyMs: data.latencyMs,
      };
    }
    return data;
  } catch (err: any) {
    return {
      status: 'ERROR',
      error: err.message || 'Failed to connect to /api/test-ai endpoint.',
      latencyMs: 0,
    };
  }
}

// Diagnostics: Test Google Search Grounding with Live Web Citations
export async function testSearchGrounding(): Promise<{
  status: string;
  reply?: string;
  sources?: any[];
  hasGoogleSearchKey?: boolean;
  latencyMs?: number;
  error?: string;
}> {
  try {
    const res = await fetch('/api/test-search');
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        status: 'ERROR',
        error: data.error || `Search test endpoint returned ${res.status}`,
        latencyMs: data.latencyMs,
      };
    }
    return data;
  } catch (err: any) {
    return {
      status: 'ERROR',
      error: err.message || 'Failed to connect to /api/test-search endpoint.',
      latencyMs: 0,
    };
  }
}

// Diagnostics: Test ElevenLabs Neural Vocal Engine
export async function testElevenLabsVoice(): Promise<{
  status: string;
  reply?: string;
  audioBase64?: string;
  latencyMs?: number;
  error?: string;
}> {
  try {
    const res = await fetch('/api/elevenlabs/test');
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        status: 'ERROR',
        error: data.error || `ElevenLabs returned status ${res.status}`,
        latencyMs: data.latencyMs,
      };
    }
    return data;
  } catch (err: any) {
    return {
      status: 'ERROR',
      error: err.message || 'Failed to connect to ElevenLabs test endpoint.',
      latencyMs: 0,
    };
  }
}

// Diagnostics: Test OpenAI GPT-4o-mini & Whisper Bridge
export async function testOpenAiBridge(): Promise<{
  status: string;
  reply?: string;
  latencyMs?: number;
  error?: string;
}> {
  try {
    const res = await fetch('/api/openai/test');
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        status: 'ERROR',
        error: data.error || `OpenAI bridge returned status ${res.status}`,
        latencyMs: data.latencyMs,
      };
    }
    return data;
  } catch (err: any) {
    return {
      status: 'ERROR',
      error: err.message || 'Failed to connect to OpenAI test endpoint.',
      latencyMs: 0,
    };
  }
}

// Audio Transcription fallback using OpenAI Whisper or Gemini
export async function transcribeAudio(
  audioBase64: string,
  mimeType: string = 'audio/webm'
): Promise<{ transcript: string; provider?: string }> {
  const res = await fetch('/api/transcribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ audioBase64, mimeType }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Audio transcription failed.');
  }

  return data;
}
