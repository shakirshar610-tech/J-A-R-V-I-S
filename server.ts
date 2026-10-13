import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Body parser with support for image & audio uploads (up to 30MB)
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Environment Variable Handles (stored securely in process.env)
const geminiApiKey = process.env.GEMINI_API_KEY || '';
const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY || '';
const googleSearchApiKey = process.env.GOOGLE_SEARCH_API_KEY || '';
const openAiApiKey = process.env.OPENAI_API_KEY || '';

// Initialize Google GenAI SDK (Server-Side only)
const ai = new GoogleGenAI({
  apiKey: geminiApiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// JARVIS Core System Persona
const DEFAULT_JARVIS_PERSONA = `You are J.A.R.V.I.S. (Just A Rather Very Intelligent System), an advanced AI assistant created by Tony Shakir hussain. Your purpose is to assist the user with high precision, extreme efficiency, and a sophisticated, slightly witty British-but-professional demeanor.

Core Behavioral Guidelines:
1. Conciseness & Clarity: Keep verbal responses brief and punchy (1 to 3 sentences maximum for conversational speech, unless detailed code or technical explanations are explicitly requested).
2. Persona: Address the user respectfully (e.g., "Sir," "Boss"), maintain absolute composure, and speak with calm technical authority.
3. No Fluff: Eliminate unnecessary pleasantries, repetitive greetings, or filler phrases. Get straight to the point.
4. Tool Utilization: When real-time data, current facts, or web lookups are needed, leverage search grounding immediately. Never fabricate information, URLs, or live statistics.
5. Output Cleanliness: Keep responses clean, concise, and structured. Avoid cluttering verbal speech with unpronounceable markdown tags or raw URLs.`;

// Helper to determine if a prompt requires live real-time web facts
function requiresRealtimeSearch(query: string): boolean {
  if (!query) return false;
  const realtimeRegex = /\b(current|today|now|latest|recent|news|weather|price|stock|update|score|who won|election|release date|when is|what is happening|live|status of|temperature|forecast|exchange rate)\b/i;
  return realtimeRegex.test(query);
}

// API: System Status & Multi-Service Verification
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ONLINE',
    systemName: 'J.A.R.V.I.S. Core MK-85',
    hasApiKey: Boolean(geminiApiKey && geminiApiKey.length > 0),
    hasElevenLabs: Boolean(elevenLabsApiKey && elevenLabsApiKey.length > 0),
    hasGoogleSearch: Boolean(googleSearchApiKey && googleSearchApiKey.length > 0),
    hasOpenAI: Boolean(openAiApiKey && openAiApiKey.length > 0),
    model: 'gemini-3.8-flash & gpt-4o-mini',
    freeTierCompatible: true,
    connectedServices: {
      gemini: {
        connected: Boolean(geminiApiKey && geminiApiKey.length > 0),
        label: 'Google Gemini 3.8 Flash',
        category: 'Reasoning & Vision',
      },
      elevenlabs: {
        connected: Boolean(elevenLabsApiKey && elevenLabsApiKey.length > 0),
        label: 'ElevenLabs Neural Speech',
        category: 'Vocal Synthesis',
      },
      googleSearch: {
        connected: Boolean(googleSearchApiKey && googleSearchApiKey.length > 0),
        label: 'Google Search API Grounding',
        category: 'Live Intelligence',
      },
      openai: {
        connected: Boolean(openAiApiKey && openAiApiKey.length > 0),
        label: 'OpenAI GPT & Whisper STT',
        category: 'Language & Dictation',
      },
    },
    capabilities: [
      'ElevenLabs Neural British Vocal Synthesis',
      'OpenAI Whisper High-Precision Dictation Fallback',
      'OpenAI GPT-4o-mini Cognitive Engine',
      'Google Search Live Web Grounding',
      'Gemini 3.8 Flash Multimodal Diagnostics',
      'Native Web Speech API Instant Fallback',
      'Intelligent Task & Schedule Extraction',
      'Persistent Memory Core MK-85',
    ],
    timestamp: new Date().toISOString(),
  });
});

// Helper to parse and humanize GenAI SDK errors
function formatGeminiError(err: any): string {
  if (!err) return 'Unknown error communicating with Gemini API.';
  let rawMsg = err.message || String(err);
  try {
    const parsed = typeof rawMsg === 'string' && rawMsg.trim().startsWith('{') ? JSON.parse(rawMsg.trim()) : null;
    if (parsed && parsed.error) {
      const code = parsed.error.code ? ` (Code ${parsed.error.code} ${parsed.error.status || ''})` : '';
      let advice = '';
      if (parsed.error.code === 403 || parsed.error.status === 'PERMISSION_DENIED') {
        advice = ' Action required: GEMINI_API_KEY has been denied access.';
      } else if (parsed.error.code === 429 || parsed.error.status === 'RESOURCE_EXHAUSTED') {
        advice = ' Rate limit/quota reached on Gemini API. Please retry shortly.';
      }
      return `${parsed.error.message || 'API error'}${code}.${advice}`;
    }
  } catch (_) {}
  return rawMsg;
}

// ==========================================
// ELEVENLABS TTS INTEGRATION & TEST
// ==========================================

// British voice IDs in ElevenLabs:
// 'JBFqnCBsd6RMkjVDRZzb': George (Warm, authoritative British male)
// 'ErXwobaYiN019PkySvjV': Antoni
// 'onwK4e9ZLuTAKqWW03F9': Daniel (Classy British)
const DEFAULT_ELEVENLABS_VOICE_ID = 'JBFqnCBsd6RMkjVDRZzb';

app.post('/api/elevenlabs/tts', async (req, res) => {
  const startTime = Date.now();
  const { text, voiceId = DEFAULT_ELEVENLABS_VOICE_ID } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text prompt is required.' });
  }

  if (!elevenLabsApiKey) {
    return res.status(503).json({
      error: 'ELEVENLABS_API_KEY is not configured in the server environment.',
      fallbackToWebSpeech: true,
    });
  }

  try {
    const safeText = text.slice(0, 500);
    const elevenRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': elevenLabsApiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text: safeText,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.55,
          similarity_boost: 0.8,
          style: 0.25,
          use_speaker_boost: true,
        },
      }),
    });

    if (!elevenRes.ok) {
      const errText = await elevenRes.text().catch(() => '');
      let parsedErr = errText;
      try {
        const errJson = JSON.parse(errText);
        parsedErr = errJson.detail?.message || errJson.message || errText;
      } catch (_) {}
      console.warn(`ElevenLabs TTS response status ${elevenRes.status}:`, parsedErr);

      // Return clean fallback instruction so client immediately switches to Web Speech API
      return res.status(elevenRes.status >= 500 ? 502 : elevenRes.status).json({
        error: `ElevenLabs quota/status notice (${elevenRes.status}): ${parsedErr}`,
        fallbackToWebSpeech: true,
        latencyMs: Date.now() - startTime,
      });
    }

    const audioArrayBuffer = await elevenRes.arrayBuffer();
    const audioBase64 = Buffer.from(audioArrayBuffer).toString('base64');

    res.json({
      status: 'OK',
      audioBase64,
      mimeType: 'audio/mpeg',
      provider: 'elevenlabs',
      latencyMs: Date.now() - startTime,
    });
  } catch (err: any) {
    console.warn('ElevenLabs TTS synthesis exception:', err.message);
    res.status(500).json({
      error: err.message || 'ElevenLabs synthesis failed.',
      fallbackToWebSpeech: true,
      latencyMs: Date.now() - startTime,
    });
  }
});

// Dedicated ElevenLabs connection test endpoint
app.get('/api/elevenlabs/test', async (req, res) => {
  const startTime = Date.now();
  if (!elevenLabsApiKey) {
    return res.status(503).json({
      status: 'ERROR',
      error: 'ELEVENLABS_API_KEY is not configured in process.env.',
      latencyMs: Date.now() - startTime,
    });
  }

  try {
    const testPhrase = 'Greetings. J.A.R.V.I.S. neural vocal pipeline initialized via ElevenLabs.';
    const elevenRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${DEFAULT_ELEVENLABS_VOICE_ID}`, {
      method: 'POST',
      headers: {
        'xi-api-key': elevenLabsApiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text: testPhrase,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8,
        },
      }),
    });

    if (!elevenRes.ok) {
      const errText = await elevenRes.text().catch(() => '');
      return res.status(elevenRes.status).json({
        status: 'ERROR',
        error: `ElevenLabs API error (${elevenRes.status}): ${errText}`,
        latencyMs: Date.now() - startTime,
      });
    }

    const audioArrayBuffer = await elevenRes.arrayBuffer();
    const audioBase64 = Buffer.from(audioArrayBuffer).toString('base64');

    res.json({
      status: 'OK',
      reply: 'ElevenLabs vocal synthesis operational.',
      audioBase64,
      latencyMs: Date.now() - startTime,
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'ERROR',
      error: err.message || 'Connection to ElevenLabs failed.',
      latencyMs: Date.now() - startTime,
    });
  }
});

// ==========================================
// GOOGLE SEARCH API INTEGRATION & TEST
// ==========================================

// Query Google Search API / Grounding
async function queryExternalSearch(query: string): Promise<Array<{ title: string; uri: string; snippet?: string }>> {
  if (!googleSearchApiKey) return [];
  try {
    // Attempt Custom Search API if search key provided
    const url = `https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(googleSearchApiKey)}&q=${encodeURIComponent(query)}&num=3`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (data.items && Array.isArray(data.items)) {
        return data.items.map((item: any) => ({
          title: item.title || 'Web Search Result',
          uri: item.link || '',
          snippet: item.snippet || '',
        }));
      }
    }
  } catch (err) {
    // If Custom Search format fails or requires cx engine, silently proceed to Gemini Search Grounding
  }
  return [];
}

// API: Test Google Search Grounding Endpoint
app.get('/api/test-search', async (req, res) => {
  const startTime = Date.now();
  try {
    const testQuery = 'Current operational status and latest discoveries of the James Webb Space Telescope';
    
    // Check external search API key first
    const externalSources = await queryExternalSearch(testQuery);

    // Call Gemini with Google Search tool
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: testQuery,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const latency = Date.now() - startTime;
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const geminiSources = groundingChunks
      .map((c: any) => (c.web ? { title: c.web.title, uri: c.web.uri } : null))
      .filter(Boolean);

    const mergedSources = [...geminiSources, ...externalSources].filter(
      (v: any, idx: number, arr: any[]) => Boolean(v && v.uri) && arr.findIndex((t: any) => t && t.uri === v.uri) === idx
    );

    res.json({
      status: 'OK',
      reply: response.text?.trim() || '',
      sources: mergedSources,
      hasGoogleSearchKey: Boolean(googleSearchApiKey),
      latencyMs: latency,
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'ERROR',
      error: err.message || 'Google Search Grounding test failed.',
      latencyMs: Date.now() - startTime,
    });
  }
});

// ==========================================
// OPENAI MODEL & WHISPER INTEGRATION
// ==========================================

// Dedicated OpenAI Model Chat Endpoint
app.post('/api/openai/chat', async (req, res) => {
  const startTime = Date.now();
  const { messages, userPersona, memories = [] } = req.body;

  if (!openAiApiKey) {
    return res.status(503).json({
      error: 'OPENAI_API_KEY is not configured in the server environment.',
    });
  }

  try {
    let memoryPrompt = '';
    if (memories && memories.length > 0) {
      memoryPrompt = `\n\n[USER PERSONAL MEMORY & CONTEXT]:\n${memories
        .map((m: any, i: number) => `${i + 1}. [${m.category || 'General'}] ${m.content}`)
        .join('\n')}`;
    }

    const systemMessage = `${DEFAULT_JARVIS_PERSONA}${userPersona ? `\n\nUser Directive: ${userPersona}` : ''}${memoryPrompt}`;

    const formattedMessages = [
      { role: 'system', content: systemMessage },
      ...(messages || []).map((m: any) => ({
        role: m.role === 'assistant' || m.role === 'model' ? 'assistant' : 'user',
        content: m.text || m.content || '',
      })),
    ];

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openAiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: formattedMessages,
        temperature: 0.7,
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text().catch(() => '');
      return res.status(openaiRes.status).json({
        error: `OpenAI API error (${openaiRes.status}): ${errText}`,
      });
    }

    const data = await openaiRes.json();
    const reply = data.choices?.[0]?.message?.content || 'Transmission concluded.';

    res.json({
      reply,
      model: 'gpt-4o-mini',
      provider: 'openai',
      latencyMs: Date.now() - startTime,
    });
  } catch (err: any) {
    console.error('OpenAI chat error:', err);
    res.status(500).json({ error: err.message || 'OpenAI chat completion failed.' });
  }
});

// Dedicated OpenAI Connection Test
app.get('/api/openai/test', async (req, res) => {
  const startTime = Date.now();
  if (!openAiApiKey) {
    return res.status(503).json({
      status: 'ERROR',
      error: 'OPENAI_API_KEY is not configured in process.env.',
      latencyMs: Date.now() - startTime,
    });
  }

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openAiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: 'Respond with a 1-sentence confirmation that the J.A.R.V.I.S. OpenAI GPT bridge is operational.',
          },
        ],
        max_tokens: 60,
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text().catch(() => '');
      return res.status(openaiRes.status).json({
        status: 'ERROR',
        error: `OpenAI API returned status ${openaiRes.status}: ${errText}`,
        latencyMs: Date.now() - startTime,
      });
    }

    const data = await openaiRes.json();
    res.json({
      status: 'OK',
      reply: data.choices?.[0]?.message?.content?.trim() || 'OpenAI GPT-4o-mini bridge active.',
      model: 'gpt-4o-mini',
      latencyMs: Date.now() - startTime,
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'ERROR',
      error: err.message || 'OpenAI test failed.',
      latencyMs: Date.now() - startTime,
    });
  }
});

// ==========================================
// GEMINI NEURAL CORE & TEST
// ==========================================

// API: Test Gemini AI Endpoint
app.get('/api/test-ai', async (req, res) => {
  const startTime = Date.now();
  if (!geminiApiKey) {
    return res.status(500).json({
      status: 'ERROR',
      error: 'GEMINI_API_KEY is not configured in the server environment. Please set GEMINI_API_KEY in Secrets or .env.',
      latencyMs: Date.now() - startTime,
    });
  }
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: 'Respond with a 1-sentence confirmation that the J.A.R.V.I.S. neural core is operational.',
    });
    const latency = Date.now() - startTime;
    res.json({
      status: 'OK',
      reply: response.text?.trim() || 'Core responsive.',
      model: 'gemini-3.8-flash',
      latencyMs: latency,
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'ERROR',
      error: formatGeminiError(err),
      latencyMs: Date.now() - startTime,
    });
  }
});

// ==========================================
// UNIFIED AI CHAT (Gemini with Google Search Grounding & OpenAI fallback)
// ==========================================

app.post('/api/chat', async (req, res) => {
  try {
    const { messages, enableSearch = false, memories = [], userPersona, provider = 'gemini' } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    const lastMessageObj = messages[messages.length - 1];
    const lastUserText = lastMessageObj ? (lastMessageObj.text || lastMessageObj.content || '') : '';
    
    // Auto-detect if real-time web facts are queried
    const searchNeeded = enableSearch || requiresRealtimeSearch(lastUserText);

    // Route to OpenAI if requested or if Gemini key is missing and OpenAI key exists
    if (provider === 'openai' || (!geminiApiKey && openAiApiKey)) {
      if (!openAiApiKey) {
        return res.status(500).json({ error: 'OPENAI_API_KEY is not configured.' });
      }

      let memoryPrompt = '';
      if (memories && memories.length > 0) {
        memoryPrompt = `\n\n[USER PERSONAL MEMORY & CONTEXT]:\n${memories
          .map((m: any, i: number) => `${i + 1}. [${m.category || 'General'}] ${m.content}`)
          .join('\n')}`;
      }

      const systemMessage = `${DEFAULT_JARVIS_PERSONA}${userPersona ? `\n\nUser Directive: ${userPersona}` : ''}${memoryPrompt}`;
      const openAiMessages = [
        { role: 'system', content: systemMessage },
        ...messages.map((m: any) => ({
          role: m.role === 'assistant' || m.role === 'model' ? 'assistant' : 'user',
          content: m.text || m.content || '',
        })),
      ];

      const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openAiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: openAiMessages,
          temperature: 0.7,
        }),
      });

      if (!openaiRes.ok) {
        const errText = await openaiRes.text().catch(() => '');
        throw new Error(`OpenAI API error: ${errText}`);
      }

      const data = await openaiRes.json();
      return res.json({
        reply: data.choices?.[0]?.message?.content || 'Response completed.',
        model: 'gpt-4o-mini',
        provider: 'openai',
        searchGroundingUsed: false,
      });
    }

    if (!geminiApiKey) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured in the server environment. Please ensure it is present in Secrets or .env.',
      });
    }

    // Build memory context string
    let memoryPrompt = '';
    if (memories && memories.length > 0) {
      memoryPrompt = `\n\n[USER PERSONAL MEMORY & CONTEXT]:\nThe user has saved the following personal facts, preferences, and notes:\n${memories
        .map((m: any, i: number) => `${i + 1}. [${m.category || 'General'}] ${m.content}`)
        .join('\n')}\nUse these memories thoughtfully when relevant to personalize your assistance.`;
    }

    const systemInstruction = `${DEFAULT_JARVIS_PERSONA}${userPersona ? `\n\nUser Custom Directive: ${userPersona}` : ''}${memoryPrompt}`;

    const contents: any[] = [];
    for (const msg of messages) {
      contents.push({
        role: msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.text || msg.content || '' }],
      });
    }

    const config: any = {
      systemInstruction,
      temperature: 0.7,
    };

    if (searchNeeded) {
      config.tools = [{ googleSearch: {} }];
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config,
    });

    const replyText = response.text || 'I apologize, but I was unable to generate a response at this moment.';

    // Extract search citations / grounding chunks if available
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const searchSources = groundingChunks
      .map((chunk: any) => {
        if (chunk.web) {
          return {
            title: chunk.web.title || 'Web Reference',
            uri: chunk.web.uri,
          };
        }
        return null;
      })
      .filter(Boolean);

    res.json({
      reply: replyText,
      sources: searchSources,
      model: 'gemini-3.8-flash',
      provider: 'gemini',
      searchGroundingUsed: searchNeeded && searchSources.length > 0,
    });
  } catch (error: any) {
    console.error('Chat generation error:', error);
    res.status(500).json({
      error: formatGeminiError(error),
    });
  }
});

// ==========================================
// MULTIMODAL VISION ANALYSIS
// ==========================================
app.post('/api/vision', async (req, res) => {
  try {
    const { prompt = 'Analyze this image in detail and describe what you observe.', imageBase64, mimeType = 'image/jpeg' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Image data is required for vision processing.' });
    }

    if (!geminiApiKey) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured. Please ensure your API key is attached in Secrets.',
      });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');

    const imagePart = {
      inlineData: {
        mimeType: mimeType || 'image/jpeg',
        data: cleanBase64,
      },
    };

    const textPart = {
      text: `${DEFAULT_JARVIS_PERSONA}\n\nPlease analyze the provided imagery thoroughly. User Query: ${prompt}`,
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts: [imagePart, textPart] },
    });

    res.json({
      analysis: response.text || 'No optical diagnostics could be extracted.',
      model: 'gemini-3.8-flash',
    });
  } catch (error: any) {
    console.error('Vision analysis error:', error);
    res.status(500).json({
      error: error.message || 'Vision analysis failed.',
    });
  }
});

// ==========================================
// INTELLIGENT TASK & SCHEDULE NLP PARSER
// ==========================================
app.post('/api/parse-task', async (req, res) => {
  try {
    const { text, currentDate } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text prompt is required.' });
    }

    const todayStr = currentDate || new Date().toISOString().split('T')[0];

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `You are JARVIS's temporal schedule parser.
Current Reference Date: ${todayStr}.
Extract reminder and task details from this user command: "${text}".
Return a JSON object conforming strictly to this format:
{
  "title": "Clean, concise task name",
  "dueDate": "YYYY-MM-DD (or empty string if not specified)",
  "dueTime": "HH:MM (24-hour format or empty string)",
  "priority": "low" | "medium" | "high",
  "category": "Work" | "Personal" | "Health" | "Project" | "Routine",
  "notes": "Any extra details or contextual reminders"
}`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            dueDate: { type: Type.STRING },
            dueTime: { type: Type.STRING },
            priority: { type: Type.STRING },
            category: { type: Type.STRING },
            notes: { type: Type.STRING },
          },
          required: ['title', 'priority', 'category'],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    res.json({ task: parsed });
  } catch (error: any) {
    console.warn('Smart task parsing fallback:', error.message);
    res.json({
      task: {
        title: req.body.text || 'New Scheduled Task',
        dueDate: new Date().toISOString().split('T')[0],
        dueTime: '12:00',
        priority: 'medium',
        category: 'Personal',
        notes: '',
      },
    });
  }
});

// ==========================================
// UNIFIED TTS ENDPOINT (ElevenLabs primary, Gemini secondary fallback)
// ==========================================
app.post('/api/tts', async (req, res) => {
  const { text, voiceName = 'Fenrir', voiceId = DEFAULT_ELEVENLABS_VOICE_ID, preferElevenLabs = true } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Text prompt is required.' });
  }

  // 1. If preferElevenLabs and key is present, attempt ElevenLabs
  if (preferElevenLabs && elevenLabsApiKey) {
    try {
      const safeText = text.slice(0, 500);
      const elevenRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'xi-api-key': elevenLabsApiKey,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text: safeText,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.55,
            similarity_boost: 0.8,
          },
        }),
      });

      if (elevenRes.ok) {
        const audioArrayBuffer = await elevenRes.arrayBuffer();
        const audioBase64 = Buffer.from(audioArrayBuffer).toString('base64');
        return res.json({
          audioBase64,
          mimeType: 'audio/mpeg',
          provider: 'elevenlabs',
        });
      }
      console.warn(`ElevenLabs TTS HTTP ${elevenRes.status}, falling back to neural/web speech.`);
    } catch (elevenErr: any) {
      console.warn('ElevenLabs TTS failed, falling back:', elevenErr.message);
    }
  }

  // 2. Fallback to Gemini Free-Tier Neural TTS
  if (geminiApiKey) {
    try {
      const safeText = text.slice(0, 450);
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: safeText,
                speechMetadata: {
                  style: 'Clear, polite, articulate, British-accented professional assistant',
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voiceName || 'Fenrir' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        return res.json({
          audioBase64: base64Audio,
          mimeType: 'audio/wav',
          provider: 'gemini-tts',
        });
      }
    } catch (geminiTtsErr: any) {
      console.warn('Gemini TTS error:', geminiTtsErr.message);
    }
  }

  // 3. Advise client to use browser Native SpeechSynthesis
  return res.status(200).json({
    fallbackToWebSpeech: true,
    notice: 'Using native browser Web Speech API for zero latency.',
  });
});

// ==========================================
// AUDIO TRANSCRIPTION (OpenAI Whisper Primary, Gemini Secondary)
// Used when browser microphone stream access fails inside sandboxed iframe containers
// ==========================================
app.post('/api/transcribe', async (req, res) => {
  try {
    const { audioBase64, mimeType = 'audio/webm' } = req.body;
    if (!audioBase64) {
      return res.status(400).json({ error: 'Audio data is required.' });
    }

    const cleanBase64 = audioBase64.replace(/^data:audio\/[a-zA-Z0-9+]+;base64,/, '');
    const audioBuffer = Buffer.from(cleanBase64, 'base64');

    // 1. OPENAI WHISPER TRANSCRIPTION INTEGRATION
    if (openAiApiKey) {
      try {
        const fileExt = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('wav') ? 'wav' : 'webm';
        const blob = new Blob([audioBuffer], { type: mimeType });
        const formData = new FormData();
        formData.append('file', blob, `recording.${fileExt}`);
        formData.append('model', 'whisper-1');
        formData.append('language', 'en');
        formData.append('prompt', 'J.A.R.V.I.S., Tony Shakir hussain, Stark Industries, voice command');

        const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${openAiApiKey}`,
          },
          body: formData,
        });

        if (whisperRes.ok) {
          const whisperData = await whisperRes.json();
          if (whisperData.text && whisperData.text.trim()) {
            return res.json({
              transcript: whisperData.text.trim(),
              provider: 'openai-whisper',
            });
          }
        } else {
          const errText = await whisperRes.text().catch(() => '');
          console.warn(`OpenAI Whisper responded ${whisperRes.status}:`, errText);
        }
      } catch (whisperErr: any) {
        console.warn('OpenAI Whisper transcription exception, routing to Gemini fallback:', whisperErr.message);
      }
    }

    // 2. GEMINI AUDIO TRANSCRIPTION FALLBACK
    if (geminiApiKey) {
      let transcript = '';
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.5-transcribe',
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: mimeType || 'audio/webm',
                  data: cleanBase64,
                },
              },
              { text: 'Transcribe the spoken words in this audio into English text. Output ONLY the verbatim spoken transcription, nothing else.' },
            ],
          },
        });
        transcript = response.text?.trim() || '';
      } catch (modelErr: any) {
        console.warn('gemini-3.5-transcribe fallback to gemini-3.8-flash:', modelErr.message);
        const fallbackResponse = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: mimeType || 'audio/webm',
                  data: cleanBase64,
                },
              },
              { text: 'Transcribe the spoken words in this audio into English text. Output ONLY the verbatim spoken transcription, nothing else.' },
            ],
          },
        });
        transcript = fallbackResponse.text?.trim() || '';
      }

      return res.json({ transcript, provider: 'gemini' });
    }

    return res.status(500).json({ error: 'Neither OpenAI Whisper nor Gemini API key is configured for transcription.' });
  } catch (error: any) {
    console.error('Transcription error:', error);
    res.status(500).json({ error: error.message || 'Transcription failed.' });
  }
});

// Express & Vite Middleware Mounting
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`[JARVIS Core MK-85] Operational on http://0.0.0.0:${port}`);
    console.log(`[Services] Gemini: ${Boolean(geminiApiKey)} | ElevenLabs: ${Boolean(elevenLabsApiKey)} | GoogleSearch: ${Boolean(googleSearchApiKey)} | OpenAI: ${Boolean(openAiApiKey)}`);
  });
}

startServer().catch((err) => {
  console.error('[JARVIS Core] Server initialization failure:', err);
  process.exit(1);
});
