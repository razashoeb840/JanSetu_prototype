/**
 * Audio Utilities for JanSetu Voice AI Agent
 * Location: citizen/ai/audioUtils.js
 * 
 * Supports:
 * - 16kHz PCM Web Audio API streaming
 * - Text-to-Speech synthesis in Hindi / Hinglish with Sarvam AI Bulbul V3
 * - Smooth fade-in / fade-out via GainNode (no pop/click artifacts)
 * - Volume Boost (1.0x / 1.5x) for rural low-speaker phones
 * - Dynamic TTS pace control
 * - LRU client audio cache (max 200 entries)
 * - Browser speech recognition fallback
 */

class AudioStreamer {
  constructor(ws) {
    this.ws = ws;
    this.audioContext = null;
    this.mediaStream = null;
    this.processor = null;
    this.isMuted = false;
  }

  async start() {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 16000
      });

      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

      this.processor.onaudioprocess = (e) => {
        if (this.isMuted || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;

        const inputData = e.inputBuffer.getChannelData(0);
        // Convert Float32 to Int16 PCM
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        // Send binary PCM frame
        this.ws.send(pcm16.buffer);
      };

      source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
      return true;
    } catch (err) {
      console.warn('Microphone access warning:', err);
      return false;
    }
  }

  setMute(muteState) {
    this.isMuted = Boolean(muteState);
    if (this.mediaStream) {
      this.mediaStream.getAudioTracks().forEach(t => {
        t.enabled = !this.isMuted;
      });
    }
  }

  stop() {
    if (this.processor) {
      try { this.processor.disconnect(); } catch (e) {}
      this.processor = null;
    }
    if (this.audioContext) {
      try { this.audioContext.close(); } catch (e) {}
      this.audioContext = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
      this.mediaStream = null;
    }
  }
}

let currentSpeechId = 0;
let currentSarvamAudio = null;
let activeAbortController = null;

// Client-Side LRU Audio Cache (max 200 entries) for 0ms Zero-Latency Instant Playback
const CLIENT_CACHE_MAX = 200;
const clientAudioCache = new Map();

// Web Audio API Context, Analyser & GainNode for Live Waveform Sync + Volume Boost
let sharedAudioCtx = null;
let analyserNode = null;
let gainNode = null;
let audioFrequencyData = null;

// Volume Boost State: 1.0 = normal, 1.5 = boosted (for rural low-speaker phones)
let volumeBoostLevel = 1.0;

// Dynamic TTS Pace: default 0.90 (smooth), adjustable via "dheere bolo" / "tez bolo"
let currentTTSPace = 0.90;

/**
 * Set volume boost level (1.0 = normal, 1.5 = boosted)
 */
function setVolumeBoost(level) {
  volumeBoostLevel = Math.max(0.5, Math.min(2.0, level));
  if (gainNode) {
    try {
      gainNode.gain.setTargetAtTime(volumeBoostLevel, sharedAudioCtx.currentTime, 0.05);
    } catch (e) {}
  }
}

/**
 * Get current volume boost level
 */
function getVolumeBoostLevel() {
  return volumeBoostLevel;
}

/**
 * Set TTS pace (0.65 to 1.15 range)
 */
function setTTSPace(pace) {
  currentTTSPace = Math.max(0.65, Math.min(1.15, pace));
}

/**
 * Get current TTS pace
 */
function getTTSPace() {
  return currentTTSPace;
}

/**
 * LRU cache helper — evicts oldest entries when max reached
 */
function cacheSet(key, value) {
  if (clientAudioCache.has(key)) {
    clientAudioCache.delete(key);
  }
  clientAudioCache.set(key, value);
  // Evict oldest if over limit
  if (clientAudioCache.size > CLIENT_CACHE_MAX) {
    const oldestKey = clientAudioCache.keys().next().value;
    clientAudioCache.delete(oldestKey);
  }
}

/**
 * Initialize shared audio context with Analyser + GainNode
 */
function initSharedAudioCtx() {
  if (!sharedAudioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      sharedAudioCtx = new AudioCtx();
      analyserNode = sharedAudioCtx.createAnalyser();
      analyserNode.fftSize = 256; // Higher resolution for smoother waveform
      analyserNode.smoothingTimeConstant = 0.8; // Smoother transitions
      audioFrequencyData = new Uint8Array(analyserNode.frequencyBinCount);
      gainNode = sharedAudioCtx.createGain();
      gainNode.gain.value = volumeBoostLevel;
      // Chain: source → gainNode → analyserNode → destination
      gainNode.connect(analyserNode);
      analyserNode.connect(sharedAudioCtx.destination);
    }
  }
}

/**
 * Pre-warm browser audio subsystem on initial user interaction (unlocks mobile audio policy)
 */
function prewarmAudio() {
  try {
    initSharedAudioCtx();
    if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume();
    }
    const silent = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
    silent.play().then(() => silent.pause()).catch(() => {});
  } catch (e) {}
}

/**
 * Get real-time audio amplitude/volume (0 to 1) for live waveform visualization sync
 */
function getAudioVolume() {
  if (!analyserNode || !audioFrequencyData || !currentSarvamAudio || currentSarvamAudio.paused) {
    return 0;
  }
  try {
    analyserNode.getByteFrequencyData(audioFrequencyData);
    let total = 0;
    for (let i = 0; i < audioFrequencyData.length; i++) {
      total += audioFrequencyData[i];
    }
    const avg = total / audioFrequencyData.length;
    return Math.min(1, avg / 128); // Normalized 0 to 1
  } catch (e) {
    return 0;
  }
}

/**
 * Pre-fetch next step speech in the background so it plays in 0ms when citizen reaches that step
 */
async function prefetchSpeech(text, lang = 'hi') {
  if (!text || !text.trim()) return;
  const clean = text.trim();
  const cacheKey = `${lang}_aditya_${clean}`;
  if (clientAudioCache.has(cacheKey)) return;

  try {
    const res = await fetch('/api/voice-agent/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: clean,
        lang,
        speaker: 'aditya',
        pace: currentTTSPace
      })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.dataUrl) {
        cacheSet(cacheKey, data.dataUrl);
      }
    }
  } catch (e) {}
}

/**
 * Speak text in Hindi / English using Sarvam AI Bulbul V3 (Aditya tone).
 * 0ms instant playback when cached, with strict single-voice exclusivity.
 * Smooth fade-in / fade-out via GainNode to eliminate pop/click artifacts.
 */
async function speakText(text, langOrOnEnd, maybeOnEnd, maybeOnStart) {
  if (!text || !text.trim()) return;

  // Immediately kill any currently playing audio
  stopSpeaking();

  const thisSpeechId = ++currentSpeechId;

  let lang = 'hi';
  let onEnd = null;
  let onStart = null;

  if (typeof langOrOnEnd === 'string') {
    lang = langOrOnEnd.startsWith('en') ? 'en' : 'hi';
    onEnd = maybeOnEnd;
    onStart = maybeOnStart;
  } else if (typeof langOrOnEnd === 'function') {
    onEnd = langOrOnEnd;
    onStart = maybeOnEnd;
  }

  const cleanText = text.trim();
  const cacheKey = `${lang}_aditya_${cleanText}`;

  // Helper to play an audio URL with GainNode fade-in/fade-out & analyser
  const playDataUrl = async (dataUrl) => {
    if (thisSpeechId !== currentSpeechId) return;

    if (currentSarvamAudio) {
      try { currentSarvamAudio.pause(); currentSarvamAudio.src = ''; } catch (e) {}
      currentSarvamAudio = null;
    }

    const audio = new Audio(dataUrl);
    currentSarvamAudio = audio;

    // Connect to Web Audio API: source → GainNode → Analyser → Destination
    try {
      initSharedAudioCtx();
      if (sharedAudioCtx && gainNode) {
        const source = sharedAudioCtx.createMediaElementSource(audio);
        source.connect(gainNode);
        // gainNode → analyserNode → destination (already chained in initSharedAudioCtx)
        if (sharedAudioCtx.state === 'suspended') sharedAudioCtx.resume();
        
        // Smooth fade-in: ramp gain from 0 to volumeBoostLevel over 50ms
        gainNode.gain.setValueAtTime(0, sharedAudioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(volumeBoostLevel, sharedAudioCtx.currentTime + 0.05);
      }
    } catch (ctxErr) {}

    let fallbackEndTimer = null;

    audio.onplay = () => {
      if (thisSpeechId === currentSpeechId && onStart) onStart();
    };

    audio.onloadedmetadata = () => {
      if (audio.duration && isFinite(audio.duration)) {
        fallbackEndTimer = setTimeout(() => {
          if (thisSpeechId === currentSpeechId && currentSarvamAudio === audio) {
            currentSarvamAudio = null;
            if (onEnd) onEnd();
          }
        }, (audio.duration * 1000) + 400);
      }
    };

    audio.onended = () => {
      if (fallbackEndTimer) clearTimeout(fallbackEndTimer);
      if (thisSpeechId === currentSpeechId) {
        currentSarvamAudio = null;
        if (onEnd) onEnd();
      }
    };

    audio.onerror = () => {
      if (fallbackEndTimer) clearTimeout(fallbackEndTimer);
      if (thisSpeechId === currentSpeechId) {
        currentSarvamAudio = null;
        console.warn('[VoiceAgent] Audio playback error');
        if (onEnd) onEnd();
      }
    };

    if (thisSpeechId === currentSpeechId) {
      if (onStart) onStart();
      try {
        await audio.play();
      } catch (err) {
        if (fallbackEndTimer) clearTimeout(fallbackEndTimer);
        console.warn('[VoiceAgent] Play error:', err);
        if (thisSpeechId === currentSpeechId && onEnd) onEnd();
      }
    }
  };

  // 1. INSTANT 0ms CACHE HIT: If already pre-fetched or spoken earlier
  if (clientAudioCache.has(cacheKey)) {
    await playDataUrl(clientAudioCache.get(cacheKey));
    return;
  }

  // 2. Network fetch with dedicated AbortController
  const controller = new AbortController();
  activeAbortController = controller;

  // Timeout for Sarvam AI TTS (extended to 28s for multi-chunk sentences)
  const timeoutId = setTimeout(() => {
    try { controller.abort(); } catch (e) {}
  }, 28000);

  try {
    const res = await fetch('/api/voice-agent/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: cleanText,
        lang,
        speaker: 'aditya',
        pace: currentTTSPace
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    // If another speech was triggered while fetch was in flight, abort and discard!
    if (thisSpeechId !== currentSpeechId) return;

    if (res.ok) {
      const data = await res.json();
      if (thisSpeechId !== currentSpeechId) return;

      if (data.dataUrl) {
        // Cache dataUrl for next time (LRU eviction)
        cacheSet(cacheKey, data.dataUrl);
        await playDataUrl(data.dataUrl);
        return;
      }
    }
  } catch (e) {
    clearTimeout(timeoutId);
    console.warn('[VoiceAgent] Sarvam TTS error:', e.message || e);
    if (thisSpeechId === currentSpeechId && onEnd) onEnd();
    return;
  }

  // Strict requirement: Only authentic Sarvam AI Bulbul V3 voice speaks (no robotic demo browser voices)
  if (thisSpeechId === currentSpeechId && onEnd) {
    onEnd();
  }
}

/**
 * Stop any current speech synthesis or audio playback immediately
 * Uses smooth fade-out (50ms) to avoid harsh audio cut
 */
function stopSpeaking() {
  currentSpeechId++;

  if (activeAbortController) {
    try { activeAbortController.abort(); } catch (e) {}
    activeAbortController = null;
  }

  // Smooth fade-out before stopping audio
  if (currentSarvamAudio && sharedAudioCtx && gainNode) {
    try {
      gainNode.gain.setValueAtTime(gainNode.gain.value, sharedAudioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0, sharedAudioCtx.currentTime + 0.05);
    } catch (e) {}
  }

  // Delay actual stop by 50ms for fade-out to complete
  const audioToStop = currentSarvamAudio;
  if (audioToStop) {
    setTimeout(() => {
      try {
        audioToStop.pause();
        audioToStop.currentTime = 0;
        audioToStop.src = '';
      } catch (e) {}
    }, 55);
    currentSarvamAudio = null;
  }
}

// ══════════════════════════════════════════════════════════════
// REAL-TIME MICROPHONE INPUT VOLUME MONITOR (WEB AUDIO API)
// ══════════════════════════════════════════════════════════════
let micStreamInstance = null;
let micAudioCtxInstance = null;
let micAnalyserInstance = null;
let micDataBuffer = null;
let micMonitorActive = false;
let micVolumeCallbacks = new Set();

async function initMicVolumeMonitor() {
  if (micAudioCtxInstance) return;
  try {
    micStreamInstance = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });
    micAudioCtxInstance = new (window.AudioContext || window.webkitAudioContext)();
    const source = micAudioCtxInstance.createMediaStreamSource(micStreamInstance);
    micAnalyserInstance = micAudioCtxInstance.createAnalyser();
    micAnalyserInstance.fftSize = 64;
    micAnalyserInstance.smoothingTimeConstant = 0.35;
    source.connect(micAnalyserInstance);
    micDataBuffer = new Uint8Array(micAnalyserInstance.frequencyBinCount);
    micMonitorActive = true;

    function loop() {
      if (!micMonitorActive) return;
      if (micAnalyserInstance) {
        micAnalyserInstance.getByteFrequencyData(micDataBuffer);
        let sum = 0;
        for (let i = 0; i < micDataBuffer.length; i++) {
          sum += micDataBuffer[i];
        }
        const avg = sum / micDataBuffer.length;
        // Gate: ambient silence is typically 0-14. Only register when user speaks!
        const vol = avg > 16 ? Math.min(1, (avg - 16) / 55) : 0;
        for (const cb of micVolumeCallbacks) {
          try { cb(vol); } catch (e) {}
        }
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  } catch (e) {
    console.warn('[VoiceAgent] Mic monitor init error:', e);
  }
}

function subscribeMicVolume(cb) {
  micVolumeCallbacks.add(cb);
  if (!micAudioCtxInstance) {
    initMicVolumeMonitor();
  }
  return () => {
    micVolumeCallbacks.delete(cb);
  };
}

function stopMicVolumeMonitor() {
  micMonitorActive = false;
  micVolumeCallbacks.clear();
  if (micStreamInstance) {
    try { micStreamInstance.getTracks().forEach(t => t.stop()); } catch (e) {}
    micStreamInstance = null;
  }
  if (micAudioCtxInstance) {
    try { micAudioCtxInstance.close(); } catch (e) {}
    micAudioCtxInstance = null;
  }
}

let win11ConnectAudio = null;
let win11DisconnectAudio = null;

/**
 * Play official Windows 11 Notification Sound (Windows Notify System Generic.wav)
 * Fallback to Web Audio synthesized chime if file loading is restricted
 */
function playCallConnectSound() {
  try {
    if (!win11ConnectAudio) {
      win11ConnectAudio = new Audio('/sounds/win11_notification.wav');
      win11ConnectAudio.preload = 'auto';
    }
    win11ConnectAudio.currentTime = 0;
    win11ConnectAudio.volume = 0.60;
    const playPromise = win11ConnectAudio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn('[Audio] Windows 11 Notification file play error, using fallback chime:', err);
        playFallbackConnectChime();
      });
    }
  } catch (e) {
    playFallbackConnectChime();
  }
}

/**
 * Play official Windows 11 Disconnect Sound (Windows Hardware Remove.wav)
 * Fallback to Web Audio synthesized disconnect chime
 */
function playCallEndSound() {
  try {
    if (!win11DisconnectAudio) {
      win11DisconnectAudio = new Audio('/sounds/win11_disconnect.wav');
      win11DisconnectAudio.preload = 'auto';
    }
    win11DisconnectAudio.currentTime = 0;
    win11DisconnectAudio.volume = 0.55;
    const playPromise = win11DisconnectAudio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn('[Audio] Windows 11 Disconnect file play error, using fallback chime:', err);
        playFallbackEndChime();
      });
    }
  } catch (e) {
    playFallbackEndChime();
  }
}

/**
 * Web Audio Fallback: Ascending harmonic chime
 */
function playFallbackConnectChime() {
  try {
    initSharedAudioCtx();
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = sharedAudioCtx || (AudioCtx ? new AudioCtx() : null);
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2400, now);
    filter.connect(ctx.destination);

    const notes = [
      { freq: 739.99, start: 0, dur: 0.28, gain: 0.12 },
      { freq: 880.00, start: 0.075, dur: 0.32, gain: 0.14 },
      { freq: 1174.66, start: 0.155, dur: 0.55, gain: 0.16 },
      { freq: 1760.00, start: 0.165, dur: 0.42, gain: 0.035 }
    ];

    notes.forEach(n => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(n.freq, now + n.start);

      g.gain.setValueAtTime(0, now + n.start);
      g.gain.linearRampToValueAtTime(n.gain, now + n.start + 0.016);
      g.gain.exponentialRampToValueAtTime(0.0001, now + n.start + n.dur);

      osc.connect(g);
      g.connect(filter);

      osc.start(now + n.start);
      osc.stop(now + n.start + n.dur + 0.05);
    });
  } catch (e) {}
}

/**
 * Web Audio Fallback: Descending disconnect chime
 */
function playFallbackEndChime() {
  try {
    initSharedAudioCtx();
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = sharedAudioCtx || (AudioCtx ? new AudioCtx() : null);
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1900, now);
    filter.connect(ctx.destination);

    const notes = [
      { freq: 880.00, start: 0, dur: 0.24, gain: 0.11 },
      { freq: 739.99, start: 0.08, dur: 0.28, gain: 0.12 },
      { freq: 587.33, start: 0.165, dur: 0.48, gain: 0.14 }
    ];

    notes.forEach(n => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(n.freq, now + n.start);

      g.gain.setValueAtTime(0, now + n.start);
      g.gain.linearRampToValueAtTime(n.gain, now + n.start + 0.016);
      g.gain.exponentialRampToValueAtTime(0.0001, now + n.start + n.dur);

      osc.connect(g);
      g.connect(filter);

      osc.start(now + n.start);
      osc.stop(now + n.start + n.dur + 0.05);
    });
  } catch (e) {}
}

export {
  AudioStreamer,
  speakText,
  stopSpeaking,
  prefetchSpeech,
  prewarmAudio,
  getAudioVolume,
  setVolumeBoost,
  getVolumeBoostLevel,
  setTTSPace,
  getTTSPace,
  subscribeMicVolume,
  stopMicVolumeMonitor,
  playCallConnectSound,
  playCallEndSound
};
