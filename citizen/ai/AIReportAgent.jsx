import React, { useState, useEffect, useRef } from 'react';
import { speakText, stopSpeaking, prefetchSpeech, prewarmAudio, getAudioVolume, setVolumeBoost, getVolumeBoostLevel, setTTSPace, getTTSPace, subscribeMicVolume, stopMicVolumeMonitor, playCallConnectSound, playCallEndSound } from './audioUtils';
import './voiceAgent.css';

/**
 * JanSetu Real-Time Voice AI Agent for Citizen Problem Reporting
 * Location: citizen/ai/AIReportAgent.jsx
 * 
 * Powered by Sarvam 105B Tool-Calling Engine over Node.js WebSocket.
 * Real-time Speaking / Listening / Processing visual state dock indicator.
 */
export default function AIReportAgent({ isOpen, onClose, onReportSubmitted }) {
  // Call State
  const [isCallActive, setIsCallActive] = useState(false);
  const [isInitialCardOpen, setIsInitialCardOpen] = useState(true);
  const [phase, setPhase] = useState('intro_lang'); 
  // 'intro_lang' | 'assistance_choice' | 'driving_category' | 'driving_desc' | 'driving_priority' | 'driving_loc' | 'driving_photo' | 'driving_video' | 'driving_check' | 'done'
  
  const [lang, setLang] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('jansetu_language');
      if (saved === 'hi' || saved === 'hinglish') return 'hinglish';
      if (saved === 'en') return 'en';
    }
    return 'en'; // Default English unless Hindi explicitly selected
  });
  const isHindi = lang === 'hi' || lang === 'hinglish';
  const [agentSpeech, setAgentSpeech] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('jansetu_language');
      if (saved === 'hi' || saved === 'hinglish') {
        return 'Hi, main JanSetu AI hoon. Aap kis bhasha me baat karna chahenge — English ya Hinglish?';
      }
    }
    return 'Hello! I am JanSetu AI. Which language would you prefer to speak — English or Hindi?';
  });
  const [userTranscript, setUserTranscript] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // Real-time voice state: 'speaking' | 'listening' | 'processing' | 'muted'
  const [voiceStatus, setVoiceStatus] = useState('speaking');
  const [liveVolume, setLiveVolume] = useState(0);

  // Virtual White Dot Cursor State
  const [cursorVisible, setCursorVisible] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [cursorClicking, setCursorClicking] = useState(false);

  // Agent Activity Status (shows what agent is doing: 'Filling details...', 'Detecting location...' etc.)
  const [agentActivity, setAgentActivity] = useState('');

  // Live Conversation Transcript (chat bubble history)
  const [chatTranscript, setChatTranscript] = useState([]);

  // Volume Boost toggle state
  const [isVolumeBoosted, setIsVolumeBoosted] = useState(false);

  // Grievance Status Tracker input state
  const [trackingIdInput, setTrackingIdInput] = useState('');
  const [recentReportId, setRecentReportId] = useState('');
  const [isTrackingLoading, setIsTrackingLoading] = useState(false);
  const [trackedResult, setTrackedResult] = useState(null);

  // Nearby Reports State
  const [nearbyChallengesList, setNearbyChallengesList] = useState([]);
  const [isNearbyLoading, setIsNearbyLoading] = useState(false);
  const [showNearbyView, setShowNearbyView] = useState(false);

  const socketRef = useRef(null);
  const timerRef = useRef(null);
  const recognitionRef = useRef(null);
  const phaseRef = useRef('intro_lang');
  const isMutedRef = useRef(false);
  const speechDebounceRef = useRef(null);
  const lastSpokenTextRef = useRef('');  // For "repeat" command
  const speechPaceRef = useRef(0.90);    // Dynamic pace for "dheere/tez bolo"
  const transcriptEndRef = useRef(null);
  const isSpeakingRef = useRef(false);
  const isCallActiveRef = useRef(false);
  const lastInteractionTimeRef = useRef(Date.now());
  const silencePromptCountRef = useRef(0);
  const hasAcknowledgedMediaRef = useRef(false);

  // Auto-scroll transcript when new message arrives
  useEffect(() => {
    if (transcriptEndRef.current) {
      try {
        transcriptEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } catch (e) {}
    }
  }, [chatTranscript]);

  // Keep phaseRef in sync
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    isMutedRef.current = isMuted;
    if (!isMuted) {
      lastInteractionTimeRef.current = Date.now();
    }
  }, [isMuted]);

  // Continuous Silence Watchdog: If citizen remains silent for 7 seconds while agent is listening, prompt them
  useEffect(() => {
    if (!isCallActive) return;

    const interval = setInterval(() => {
      // Only prompt if call is active, citizen is not muted, agent is NOT speaking, and modal is not done
      if (!isCallActiveRef.current || isMutedRef.current || isSpeakingRef.current) {
        return;
      }
      if (phaseRef.current === 'done') {
        return;
      }

      const elapsedMs = Date.now() - lastInteractionTimeRef.current;
      // 7.0 seconds of inactivity/silence
      if (elapsedMs >= 7000) {
        lastInteractionTimeRef.current = Date.now(); // reset timer

        if (silencePromptCountRef.current < 4) {
          silencePromptCountRef.current += 1;
          console.log(`[VoiceAgent] Silence detected (${(elapsedMs / 1000).toFixed(1)}s) - prompting user`);
          const silenceMsg = (lang === 'hi' || lang === 'hinglish')
            ? 'Aapki aawaz sunai nahi di, kripya dobara bolein.'
            : "I couldn't hear your voice, please speak again.";
          speak(silenceMsg);
        }
      }
    }, 800);

    return () => clearInterval(interval);
  }, [isCallActive, lang]);

  // Real-time Photo Evidence Watcher: As soon as user selects/captures a photo, acknowledge and move to Step 5
  useEffect(() => {
    if (!isCallActive) {
      hasAcknowledgedMediaRef.current = false;
      return;
    }

    const mediaInterval = setInterval(() => {
      if (phaseRef.current !== 'driving_photo' && phaseRef.current !== 'driving_video') {
        return;
      }
      if (hasAcknowledgedMediaRef.current) {
        return;
      }

      const hasMedia = (typeof window !== 'undefined' && Array.isArray(window.selectedMediaFiles) && window.selectedMediaFiles.some(m => (m.type === 'photo' || m.type === 'video') && (m.dataUrl || m.file))) ||
        Boolean(document.querySelector('#mediaPreviewContainer .media-preview-item')) ||
        Boolean(document.querySelector('#mediaPreviewContainer img'));

      if (hasMedia) {
        hasAcknowledgedMediaRef.current = true;
        console.log('[VoiceAgent] Photo/Video evidence detected in DOM!');
        speak((lang === 'hi' || lang === 'hinglish')
          ? 'Bahut badhiya! Photo proof jud gaya hai. Ab main AI check aur duplicate verification chalu kar raha hoon.'
          : 'Great! Photo proof attached successfully. Now running AI duplicate check and verification.');
        setTimeout(() => {
          proceedToStep5AICheck();
        }, 900);
      }
    }, 600);

    return () => clearInterval(mediaInterval);
  }, [isCallActive, lang]);

  // Live Audio-Waveform Sync:
  // - When AI is speaking: syncs with Sarvam TTS audio beats (getAudioVolume())
  // - When listening: syncs in real-time with citizen microphone input (subscribeMicVolume)
  useEffect(() => {
    let animId;
    let unsubMic = null;

    if (isCallActive) {
      if (voiceStatus === 'speaking') {
        const loop = () => {
          const vol = getAudioVolume();
          setLiveVolume(vol);
          animId = requestAnimationFrame(loop);
        };
        animId = requestAnimationFrame(loop);
      } else if (voiceStatus === 'listening' && !isMuted) {
        unsubMic = subscribeMicVolume((vol) => {
          if (!isSpeakingRef.current && !isMutedRef.current) {
            setLiveVolume(vol);
          }
        });
      } else {
        setLiveVolume(0);
      }
    } else {
      setLiveVolume(0);
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
      if (unsubMic) unsubMic();
    };
  }, [isCallActive, voiceStatus, isMuted]);

  // Sync language with top navbar language switcher
  useEffect(() => {
    const handleExternalLangChange = (e) => {
      const newLang = e.detail?.lang;
      if (newLang) {
        const activeLang = (newLang === 'hi' || newLang === 'hinglish') ? 'hinglish' : 'en';
        setLang(activeLang);
      }
    };
    window.addEventListener('jansetu_language_changed', handleExternalLangChange);
    return () => window.removeEventListener('jansetu_language_changed', handleExternalLangChange);
  }, []);

  // Safe speak wrapper — ALWAYS speaks even when muted (mute = mic only, NOT agent output)
  // Agent keeps talking and auto-driving regardless of mute state
  const speak = (text, targetLang) => {
    if (!text) return;
    lastInteractionTimeRef.current = Date.now();
    setAgentSpeech(text);
    lastSpokenTextRef.current = text; // Store for "repeat" command
    // Add to conversation transcript (deduplicated)
    setChatTranscript(prev => {
      if (prev.length > 0 && prev[prev.length - 1].text === text) return prev;
      return [...prev, { role: 'ai', text, time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) }];
    });
    isSpeakingRef.current = true;
    setVoiceStatus('speaking');
    const chosenLang = targetLang || (lang === 'en' ? 'en-IN' : 'hi-IN');
    speakText(
      text,
      chosenLang,
      () => {
        isSpeakingRef.current = false;
        setVoiceStatus(isMutedRef.current ? 'active' : 'listening');
        lastInteractionTimeRef.current = Date.now();
      },
      () => {
        isSpeakingRef.current = true;
        setVoiceStatus('speaking');
        lastInteractionTimeRef.current = Date.now();
      }
    );
  };

  // Move the white dot cursor to any element and click it (snappy 300-350ms duration)
  const animateCursorToAndClick = (targetSelectorOrElement, callback, travelDuration = 350) => {
    const el = typeof targetSelectorOrElement === 'string' 
      ? document.querySelector(targetSelectorOrElement) 
      : targetSelectorOrElement;
    
    if (!el) {
      if (callback) callback();
      return;
    }

    try {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (e) {}

    const rect = el.getBoundingClientRect();
    const targetX = rect.left + rect.width / 2;
    const targetY = rect.top + rect.height / 2;

    setCursorVisible(true);
    setCursorPos({ x: targetX, y: targetY });

    setTimeout(() => {
      setCursorClicking(true);
      el.classList.add('ai-target-highlighted');

      setTimeout(() => {
        setCursorClicking(false);
        el.classList.remove('ai-target-highlighted');
        try {
          el.focus();
          el.click();
          el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        } catch (e) {}
        if (callback) callback();
      }, 180);
    }, travelDuration);
  };

  // Connect to Node.js WebSocket Server
  const connectWebSocket = () => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/voice-agent`;
      console.log(`[VoiceAgent] Connecting to WebSocket: ${wsUrl}`);
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('🎙️ [VoiceAgent] Connected to real-time WebSocket');
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          handleSocketMessage(msg);
        } catch (e) {
          console.warn('[VoiceAgent] Socket parse error:', e);
        }
      };

      ws.onclose = () => {
        console.log('🎙️ [VoiceAgent] WebSocket closed');
      };

      ws.onerror = (err) => {
        console.error('🎙️ [VoiceAgent] WebSocket error:', err);
      };

      socketRef.current = ws;
    } catch (err) {
      console.error('[VoiceAgent] Could not connect WebSocket:', err);
    }
  };

  // Send message safely to WebSocket
  const sendSocketMessage = (payload) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(payload));
    }
  };

  // Send GPS location event to server
  const sendLocationCaptured = () => {
    const latEl = document.getElementById('reportLat') || document.getElementById('geoLat');
    const lngEl = document.getElementById('reportLng') || document.getElementById('geoLng');
    const distEl = document.getElementById('reportDistrict');
    const addrEl = document.getElementById('reportAddress') || document.getElementById('reportLocality');

    const lat = latEl && latEl.value ? parseFloat(latEl.value) : 23.3441;
    const lng = lngEl && lngEl.value ? parseFloat(lngEl.value) : 85.3096;
    const district = distEl && distEl.value ? distEl.value : 'Ranchi';
    const address = addrEl && addrEl.value ? addrEl.value : 'Jharkhand';

    sendSocketMessage({
      type: 'location_captured',
      location: { lat, lng, district, address }
    });
  };

  // Handle incoming tool calls and server events
  const handleSocketMessage = (msg) => {
    console.log('[VoiceAgent] Received server message:', msg);
    const { type } = msg;

    // 1. Agent Utterance / Spoken Output (Prevent double-speaking during client autodrive)
    if (type === 'agent_utterance') {
      const autoDrivePhases = [
        'driving_category',
        'driving_desc',
        'driving_priority',
        'driving_loc',
        'driving_photo',
        'driving_video',
        'driving_check'
      ];
      if (msg.text && !autoDrivePhases.includes(phaseRef.current)) {
        speak(msg.text);
      }
    }

    // 2. Select Category (Tool: save_problem_details)
    else if (type === 'select_category') {
      const catKey = msg.category || 'Urban Infrastructure';
      const catButtons = Array.from(document.querySelectorAll('#categoryChipsContainer .category-chip-btn'));
      const targetBtn = catButtons.find(b => {
        const oc = b.getAttribute('onclick') || '';
        return oc.toLowerCase().includes(catKey.toLowerCase());
      }) || catButtons.find(b => b.textContent.toLowerCase().includes(catKey.toLowerCase())) || catButtons[0];

      if (targetBtn) {
        animateCursorToAndClick(targetBtn, () => {
          setTimeout(() => {
            animateCursorToAndClick('#stepSection1 .btn-modal-primary', () => {
              setPhase('driving_desc');
            }, 250);
          }, 200);
        }, 300);
      }
    }

    // 3. Fill Details (Tool: save_problem_details / fill_details)
    else if (type === 'fill_details') {
      const descEl = document.getElementById('reportDescription');
      const titleEl = document.getElementById('reportTitle');
      if (descEl && msg.description) descEl.value = msg.description;
      if (titleEl && msg.title) titleEl.value = msg.title;

      const prio = msg.priority;
      if (prio) {
        const prioRadio = document.querySelector(`input[name="priorityChoice"][value="${prio}"]`);
        const prioTarget = prioRadio ? (prioRadio.parentElement || prioRadio) : null;
        if (prioTarget) {
          animateCursorToAndClick(prioTarget, () => {
            if (prioRadio) prioRadio.checked = true;
          }, 200);
        }
      }
    }

    // 4. Advance Step (Tool: advance_to_step)
    else if (type === 'advance_step') {
      const step = msg.step;
      if (step === 'location') {
        animateCursorToAndClick('#stepSection2 .btn-modal-primary', () => {
          setPhase('driving_loc');
        }, 250);
      } else if (step === 'photo') {
        animateCursorToAndClick('#stepSection3 .btn-modal-primary', () => {
          setPhase('driving_photo');
        }, 250);
      } else if (step === 'video') {
        setPhase('driving_video');
      } else if (step === 'check') {
        animateCursorToAndClick('#stepSection4 .btn-modal-primary', () => {
          setPhase('driving_check');
        }, 250);
      } else if (step === 'done') {
        finishCallGracefully();
      }
    }

    // 5. Duplicate Found
    else if (type === 'duplicate_found') {
      setPhase('driving_check');
      const dupBox = document.getElementById('duplicateNoticeBox');
      if (dupBox) dupBox.style.display = 'block';
    }

    // 6. Submission Confirmed
    else if (type === 'submission_confirmed') {
      const trackingId = msg.trackingId || 'JH-2026-CONFIRMED';
      speak(`Aapka problem number hai ${trackingId}. Problem safaltapoorvak darj ho gayi hai, aap check kar sakte hain My Reports me. Dhanyawad!`);
      if (onReportSubmitted) onReportSubmitted(trackingId);
      finishCallGracefully();
    }

    // 7. Twin Linked
    else if (type === 'twin_linked') {
      const trackingId = msg.trackingId;
      speak(`Problem pehle se darj shikayat ke sath safaltapoorvak link ho gayi hai. Tracking ID hai: ${trackingId}. Dhanyawad!`);
      if (onReportSubmitted) onReportSubmitted(trackingId);
      finishCallGracefully();
    }

    // 8. Report Dropped / Cancelled
    else if (type === 'report_dropped') {
      speak('Theek hai, maine ye report cancel kar di hai. Kabhi bhi phir se report kar sakte hain.');
      const modal = document.getElementById('reportModal');
      if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
      }
      finishCallGracefully();
    }
  };

  // Setup Browser Speech Recognition to feed WebSocket
  const initSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = lang === 'en' ? 'en-IN' : 'hi-IN';

      recognition.onresult = (event) => {
        // Prevent echo loop: If AI is actively speaking, ignore mic audio so it doesn't transcribe itself
        if (isSpeakingRef.current) {
          return;
        }

        // MUTE GUARD: When mic is muted, ignore ALL recognition results completely
        if (isMutedRef.current) {
          return;
        }

        const lastResult = event.results[event.results.length - 1];
        const transcript = lastResult[0].transcript.trim();
        const confidence = lastResult[0].confidence || 0;
        if (!transcript) return;

        // Citizen is speaking, update interaction timestamp and reset prompt count
        lastInteractionTimeRef.current = Date.now();
        silencePromptCountRef.current = 0;

        // ─── BACKGROUND NOISE FILTER ───
        // 1. Confidence threshold: Reject low-confidence gibberish / background TV / ambient noise
        if (lastResult.isFinal && confidence > 0 && confidence < 0.60) {
          console.log(`[VoiceAgent] Rejected low-confidence (${(confidence * 100).toFixed(0)}%): "${transcript}"`);
          return;
        }

        // 2. Minimum length filter: Allow valid 1-word civic inputs (e.g. "road", "water", "sadak", "bijli", "haan", "help")
        if (transcript.length < 2) {
          return;
        }

        // 3. Reject common ambient noise transcripts (hmm, um, ah, TV sounds)
        const noisePatterns = /^(hmm+|um+|ah+|oh+|huh|hm+|uh+|aah+|ooh+|mmm+)$/i;
        if (noisePatterns.test(transcript)) {
          return;
        }

        setUserTranscript(transcript);
        // Add citizen's speech to conversation transcript
        if (lastResult.isFinal) {
          setChatTranscript(prev => [...prev, { role: 'user', text: transcript, time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) }]);
        }

        setVoiceStatus('processing');

        if (speechDebounceRef.current) {
          clearTimeout(speechDebounceRef.current);
        }

        if (lastResult.isFinal) {
          // Dynamic conversational pause: 850ms for description/category to allow citizen to think/breathe, 400ms for short choices
          const debounceMs = (phaseRef.current === 'driving_desc' || phaseRef.current === 'driving_category') ? 850 : 400;
          speechDebounceRef.current = setTimeout(() => {
            if (!isSpeakingRef.current) {
              handleUserUtterance(transcript);
            } else {
              setTimeout(() => {
                if (!isSpeakingRef.current) {
                  handleUserUtterance(transcript);
                }
              }, 300);
            }
          }, debounceMs);
        }
      };

      recognition.onend = () => {
        if (isCallActiveRef.current && !isMutedRef.current) {
          try { recognition.start(); } catch (e) {}
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.warn('[VoiceAgent] Speech recognition error:', e);
    }
  };

  // Helper to reliably transition between modal steps
  const jumpToStep = (stepNum, onComplete) => {
    if (typeof window.goToStep === 'function') {
      try { window.goToStep(stepNum); } catch (e) {}
    } else {
      [1, 2, 3, 4, 5].forEach(i => {
        const el = document.getElementById('stepSection' + i);
        const dot = document.getElementById('dotStep' + i);
        if (el) el.style.display = i === stepNum ? 'block' : 'none';
        if (dot) dot.className = 'step-dot' + (i === stepNum ? ' active' : i < stepNum ? ' done' : '');
      });
    }
    if (onComplete) setTimeout(onComplete, 220);
  };

  // Helper to reliably check if mandatory media evidence (photo/video) is uploaded
  const hasUploadedMedia = () => {
    if (typeof window !== 'undefined' && Array.isArray(window.selectedMediaFiles) && window.selectedMediaFiles.some(m => (m.type === 'photo' || m.type === 'video') && (m.dataUrl || m.file))) {
      return true;
    }
    const preview = document.getElementById('mediaPreviewContainer');
    if (preview && (preview.querySelector('img') || preview.querySelector('.media-preview-item') || (preview.children && preview.children.length > 0))) {
      return true;
    }
    return false;
  };

  // Helper to transition to Step 5 (AI Verification & Duplicate Check)
  const proceedToStep5AICheck = () => {
    // STRICT MANDATORY PHOTO PROOF GUARD
    if (!hasUploadedMedia()) {
      console.warn('[VoiceAgent] Cannot proceed to Step 5: photo proof is strictly mandatory');
      setPhase('driving_photo');
      const photoTile = document.querySelector('label.media-btn-tile') || document.getElementById('stepSection4');
      animateCursorToAndClick(photoTile, () => {
        speak((lang === 'hi' || lang === 'hinglish')
          ? 'Satyapan ke liye samasya ka photo proof anivarya (mandatory) hai! Kripya aage badhne se pehle sthal ki photo upload karein ya camera se photo lein.'
          : 'Photo evidence is mandatory before proceeding to AI check! Please upload or capture a photo of the problem spot first.');
      }, 300);
      return;
    }

    setTimeout(() => {
      animateCursorToAndClick('#stepSection4 .btn-modal-primary', () => {
        setPhase('driving_check');

        // Allow 900ms for duplicate notice or AI check to evaluate
        setTimeout(() => {
          const dupBox = document.getElementById('duplicateNoticeBox');
          if (dupBox && dupBox.style.display !== 'none') {
            const dupTitleEl = document.getElementById('dupItemTitle');
            const dupTitle = dupTitleEl ? dupTitleEl.textContent.trim() : 'Pehle se darj shikayat';
            speak(lang === 'en'
              ? `A similar issue is already reported nearby: "${dupTitle}". Would you like to link with it, submit anyway, or cancel?`
              : `Aapke ilaqe me milti-julti shikayat pehle se darj mili hai — "${dupTitle}". Kya aap isko pehle wale ke sath jodna chahenge, ya nayi report submit karein?`);
          } else {
            const titleVal = document.getElementById('reportTitle')?.value || '';
            speak((lang === 'hi' || lang === 'hinglish')
              ? `AI jaanch poori ho gayi hai. Aapki samasya aur photo proof dono darj ho chuke hain. Sab sahi hai? Kya main ye shikayat abhi submit kar doon?`
              : `AI verification complete. Grievance details and photo proof are ready. Everything looks good. Should I submit this report now?`);
          }
        }, 900);
      }, 350);
    }, 400);
  };

  // User Utterance Handler: Autodrive visual cursor clicking on speech across all phases
  const handleUserUtterance = (text) => {
    const current = phaseRef.current;
    console.log(`[VoiceAgent] Spoken: "${text}" at Phase: ${current}`);
    const t = text.toLowerCase();

    // ─── GLOBAL AGENT COMMANDS (work at ANY phase) ───

    // REPEAT Command: "dobara bolo", "repeat karo", "phir se bolo"
    const isRepeatCommand = /repeat|dobara (bol|bolo|batao)|phir se (bol|bolo|batao)|wapas (bol|bolo)|fir se|ek baar aur/i.test(t);
    if (isRepeatCommand && lastSpokenTextRef.current) {
      speak(lastSpokenTextRef.current);
      return;
    }

    // SPEED CONTROL: "dheere bolo" / "tez bolo" / "slow" / "fast"
    const isSlowCommand = /dheere|dhire|slow|aahista|dheeme|thoda dheere/i.test(t) && /bol|speak|baat|karo/i.test(t);
    const isFastCommand = /tez|fast|jaldi|quick|bol|speak/i.test(t) && /bol|speak|baat|karo/i.test(t) && !/dheere|dhire|slow/i.test(t);
    if (isSlowCommand) {
      const newPace = Math.max(0.65, speechPaceRef.current - 0.15);
      speechPaceRef.current = newPace;
      setTTSPace(newPace);
      speak(lang === 'en' ? 'Okay, I will speak slower now.' : 'Theek hai, ab main dheere bolunga.');
      return;
    }
    if (isFastCommand) {
      const newPace = Math.min(1.15, speechPaceRef.current + 0.15);
      speechPaceRef.current = newPace;
      setTTSPace(newPace);
      speak(lang === 'en' ? 'Okay, I will speak a bit faster now.' : 'Theek hai, ab main thoda tez bolunga.');
      return;
    }

    // HELP Command: "help", "madad", "kya karna hai"
    const isHelpCommand = /^(help|madad|sahayata|kya karu|kya karna|samajh nahi|kaise|how)$/i.test(t) || /help (karo|chahiye|do)|madad (karo|chahiye|do)|kya karna hai|samajh nahi aa raha/i.test(t);
    if (isHelpCommand) {
      const helpTexts = {
        intro_lang: lang === 'en' ? 'Please choose your language — say English or Hinglish.' : 'Kripya apni bhasha chunein — English ya Hinglish bolein.',
        assistance_choice: lang === 'en' ? 'You can say: Report a problem, or Check status of existing report.' : 'Aap bol sakte hain: Samasya report karna hai, ya purani shikayat ki sthiti jaanchni hai.',
        driving_category: lang === 'en' ? 'Tell me what type of problem — road, water, electricity, garbage, health, or education.' : 'Batayiye kis tarah ki samasya hai — sadak, paani, bijli, kachra, swasthya, ya shiksha.',
        driving_desc: lang === 'en' ? 'Describe your problem in detail — what is happening, where, and since when.' : 'Apni samasya vistaar se batayein — kya ho raha hai, kahan, aur kab se.',
        driving_priority: lang === 'en' ? 'How urgent is this? Say: Urgent, High, or Normal.' : 'Ye kitni zaroori hai? Bolein: Urgent, High, ya Normal.',
        driving_loc: lang === 'en' ? 'Your GPS location is being detected. Please wait.' : 'Aapki GPS location detect ho rahi hai. Kripya intezaar karein.',
        driving_photo: lang === 'en' ? 'Do you have a photo of the problem? Say yes or no.' : 'Kya aapke paas samasya ki photo hai? Haan ya nahi bolein.',
        driving_video: lang === 'en' ? 'Do you have a short video? Say yes or no.' : 'Kya koi chhota video hai? Haan ya nahi bolein.',
        driving_check: lang === 'en' ? 'All details are ready. Say Submit to file your report, or Edit to change something.' : 'Saari jaankari tayyar hai. Submit bolein report darz karne ke liye, ya Edit bolein kuch badalne ke liye.'
      };
      speak(helpTexts[current] || (lang === 'en' ? 'I am here to help you report civic problems. Just speak naturally.' : 'Main aapki madad ke liye hoon. Bas apni samasya batayein.'));
      return;
    }

    // VOLUME BOOST: "volume badhao" / "loud" / "awaaz badhao"
    const isVolUpCommand = /volume (badha|badhao|up|increase)|awaaz (badha|badhao)|loud|louder|zyada awaaz/i.test(t);
    const isVolDownCommand = /volume (kam|down|decrease|low)|awaaz (kam|ghata)|softer|quieter|kam awaaz/i.test(t);
    if (isVolUpCommand) {
      setVolumeBoost(1.5);
      setIsVolumeBoosted(true);
      speak(lang === 'en' ? 'Volume increased.' : 'Awaaz badha di hai.');
      return;
    }
    if (isVolDownCommand) {
      setVolumeBoost(1.0);
      setIsVolumeBoosted(false);
      speak(lang === 'en' ? 'Volume set to normal.' : 'Awaaz normal kar di hai.');
      return;
    }

    // Global language switch command across ALL phases:
    const isSwitchToHindi = /hindi me (baat|bolo|boliye|karein)|switch to hindi|talk in hindi|speak in hindi/i.test(t);
    const isSwitchToEnglish = /english me (baat|bolo|boliye|karein)|switch to english|talk in english|speak in english|speak english/i.test(t);
    if (isSwitchToHindi) {
      handleSelectLanguage('hinglish');
      return;
    }
    if (isSwitchToEnglish) {
      handleSelectLanguage('en');
      return;
    }

    // 1. Language Selection Phase (Click spoken language card)
    if (current === 'intro_lang') {
      const isEnglish = /english|inglish|angrezi|angreji/i.test(t);
      const isHindiSpoken = /hindi|hinglish|bhasha|bolna|baat karo|hind|deshi/i.test(t);
      if (isEnglish) {
        animateCursorToAndClick('#langCardEn', () => {
          handleSelectLanguage('en');
        }, 300);
        return;
      } else if (isHindiSpoken) {
        animateCursorToAndClick('#langCardHinglish', () => {
          handleSelectLanguage('hinglish');
        }, 300);
        return;
      }
      // If user directly states their problem or clicks without choosing language
      if (/report|problem|complaint|shikayat|samasya|help|madad/i.test(t)) {
        const detectedHindi = /shikayat|samasya|paani|sadak|bijli|kachra|madad/i.test(t);
        const chosen = detectedHindi ? 'hinglish' : 'en';
        setLang(chosen);
        handleReportProblemAction();
        return;
      }
      return;
    }

    // 2. Assistance Choice Phase (Click Action card)
    if (current === 'assistance_choice') {
      if (/nearby|aaspas|aas paas|pados|area|fayde|benefit/i.test(t)) {
        animateCursorToAndClick('#actionCardStatus', () => {
          handleOpenTrackingInput();
          setTimeout(() => {
            handleFetchAndSpeakNearbyReports();
          }, 600);
        }, 300);
        return;
      }
      if (/status|sthiti|track|jaanch|kya hua|progress|jh-\d+/i.test(t)) {
        animateCursorToAndClick('#actionCardStatus', () => {
          handleOpenTrackingInput();
        }, 300);
      } else {
        animateCursorToAndClick('#actionCardReport', () => {
          handleReportProblemAction();
        }, 300);
      }
      return;
    }

    // 2b. Tracking Input Phase (User speaks report ID, nearby, or command)
    if (current === 'tracking_input') {
      if (/nearby|aaspas|aas paas|pados|area|kshetr|bagal|benefit|fayda|fayde/i.test(t)) {
        handleFetchAndSpeakNearbyReports();
        return;
      }
      const spokeId = text.match(/JH-\d{4}-\d+/i) || text.match(/\d{4,8}/);
      if (spokeId) {
        const detected = spokeId[0];
        setTrackingIdInput(detected);
        handleTrackReportById(detected);
        return;
      }
      if (/track|search|khojo|bhejo|send|check/i.test(t)) {
        handleTrackReportById(trackingIdInput);
        return;
      }
      if (/back|wapas|piche|cancel/i.test(t)) {
        setPhase('assistance_choice');
        setTrackedResult(null);
        setShowNearbyView(false);
        return;
      }
      if (/report|samasya|problem/i.test(t)) {
        handleReportProblemAction();
        return;
      }
    }

    // =========================================================================
    // GLOBAL AGENT INTENT DISPATCHER: "JO BOLE WO KARE AND CLICK KARE"
    // =========================================================================

    // A. User says: "back piche karo mera description sahi nhi hai", "description galat hai", "description badlo", etc.
    const isDescCorrection = /description.*(sahi|galat|change|badal|edit|theek|dobara|naya|nhi|nahi)|(sahi|galat|theek|nhi|nahi).*description|mera description|description sahi|problem.*(galat|badal|change)|samasya.*(galat|badal|change)|dobara.*description|edit.*description|wrong.*description/i.test(t);

    if (isDescCorrection) {
      console.log('[VoiceAgent] Handling Description Correction Command');
      // If modal is on step 5, click Edit button
      if (current === 'driving_check') {
        const editBtn = document.querySelector('#stepSection5 .btn-modal-secondary') || document.querySelector('button[data-i18n="btn_edit"]');
        animateCursorToAndClick(editBtn, () => {
          jumpToStep(2, () => {
            const descInput = document.getElementById('reportDescription');
            animateCursorToAndClick(descInput, () => {
              if (descInput) {
                descInput.focus();
                descInput.select();
              }
              setPhase('driving_desc');
              speak(lang === 'en'
                ? 'No problem! We are back on the description. Please tell me your problem again in detail.'
                : 'Koi baat nahi! Hum description par wapas aa gaye hain. Kripya apni samasya dobara vistaar se batayein.');
            }, 300);
          });
        }, 350);
        return;
      }

      // If modal is on Step 3 or 4, click Back button to Step 2
      if (current === 'driving_photo' || current === 'driving_video' || current === 'driving_loc') {
        const backBtn = document.querySelector(`#stepSection${current === 'driving_loc' ? '3' : '4'} .btn-modal-secondary`);
        animateCursorToAndClick(backBtn || '#reportDescription', () => {
          jumpToStep(2, () => {
            const descInput = document.getElementById('reportDescription');
            animateCursorToAndClick(descInput, () => {
              if (descInput) {
                descInput.focus();
                descInput.select();
              }
              setPhase('driving_desc');
              speak(lang === 'en'
                ? 'Alright, back on problem description. What would you like to write?'
                : 'Theek hai, hum description par wapas aa gaye hain. Kripya batayein kya likhna hai.');
            }, 300);
          });
        }, 300);
        return;
      }

      // If already on Step 2 (driving_priority or driving_desc)
      const descInput = document.getElementById('reportDescription');
      animateCursorToAndClick(descInput, () => {
        if (descInput) {
          descInput.focus();
          descInput.select();
        }
        setPhase('driving_desc');
        speak(lang === 'en'
          ? 'Understood. Please describe your problem again in detail.'
          : 'Samajh gaya. Kripya apni samasya dobara vistaar se batayein.');
      }, 300);
      return;
    }

    // B. User says: "back karo", "piche jao", "wapas chalo", "previous step"
    const isBackCommand = /^(back|piche|peechhe|peeche|wapas|previous|go back)\b|back (karo|jao|chalo|le lo|kardo)|piche (karo|jao|lo|kardo|chalo)|peeche (karo|jao|lo|kardo|chalo)|peechhe (karo|jao|lo|kardo|chalo)|wapas (karo|jao|chalo)|ek step piche|pichle (step|kadam)/i.test(t);

    if (isBackCommand) {
      console.log(`[VoiceAgent] Handling Back Command at phase: ${current}`);

      // From Step 5 -> Back to Step 2 (Edit Details)
      if (current === 'driving_check') {
        const editBtn = document.querySelector('#stepSection5 .btn-modal-secondary') || document.querySelector('button[data-i18n="btn_edit"]');
        animateCursorToAndClick(editBtn, () => {
          jumpToStep(2, () => {
            setPhase('driving_desc');
            speak(lang === 'en'
              ? 'Alright, we have moved back. You can edit your problem details.'
              : 'Theek hai, hum pichle kadam par wapas aa gaye hain. Aap details badal sakte hain.');
          });
        }, 350);
        return;
      }

      // From Step 4 (Video) -> Back to Photo tile
      if (current === 'driving_video') {
        const photoTile = document.querySelector('label.media-btn-tile');
        animateCursorToAndClick(photoTile, () => {
          setPhase('driving_photo');
          speak(lang === 'en'
            ? 'Alright, back on photo upload. Do you have a photo to attach?'
            : 'Theek hai, hum photo wale kadam par wapas aa gaye hain. Kya aap photo jodna chahte hain?');
        }, 300);
        return;
      }

      // From Step 4 (Photo) -> Back to Step 3 (Location)
      if (current === 'driving_photo') {
        const backBtn = document.querySelector('#stepSection4 .btn-modal-secondary');
        animateCursorToAndClick(backBtn, () => {
          jumpToStep(3, () => {
            setPhase('driving_loc');
            speak(lang === 'en'
              ? 'Alright, back on the location step.'
              : 'Theek hai, hum location wale kadam par wapas aa gaye hain.');
          });
        }, 350);
        return;
      }

      // From Step 3 (Location) -> Back to Step 2 (Problem Details)
      if (current === 'driving_loc') {
        const backBtn = document.querySelector('#stepSection3 .btn-modal-secondary');
        animateCursorToAndClick(backBtn, () => {
          jumpToStep(2, () => {
            setPhase('driving_desc');
            const descInput = document.getElementById('reportDescription');
            if (descInput) descInput.focus();
            speak(lang === 'en'
              ? 'Alright, back to problem details. You can state your problem again.'
              : 'Theek hai, hum description par wapas aa gaye hain. Aap apni samasya dobara bata sakte hain.');
          });
        }, 350);
        return;
      }

      // From Step 2 (Priority) -> Back to Description
      if (current === 'driving_priority') {
        setPhase('driving_desc');
        const descInput = document.getElementById('reportDescription');
        animateCursorToAndClick(descInput, () => {
          if (descInput) descInput.focus();
          speak(lang === 'en'
            ? 'Alright, back to description. Please speak your problem again.'
            : 'Theek hai, hum description par wapas aa gaye hain. Kripya batayein kya likhna hai.');
        }, 300);
        return;
      }

      // From Step 2 (Description) -> Back to Step 1 (Category Selection)
      if (current === 'driving_desc') {
        const backBtn = document.querySelector('#stepSection2 .btn-modal-secondary');
        animateCursorToAndClick(backBtn, () => {
          jumpToStep(1, () => {
            setPhase('driving_category');
            speak(lang === 'en'
              ? 'Alright, back to category selection. Which category does your issue belong to?'
              : 'Theek hai, hum category chunne par wapas aa gaye hain. Aap nayi category chun sakte hain.');
          });
        }, 350);
        return;
      }

      // If already on Step 1 (Category)
      if (current === 'driving_category') {
        speak(lang === 'en'
          ? 'You are on the first step. Please select your category — road, water, electricity, or sanitation.'
          : 'Aap shuruati kadam par hi hain. Kripya apni samasya ki category batayein — jaise sadak, bijli, paani, ya safai.');
        return;
      }
    }

    // C. User says: "category badlo", "vibhag change karo", "category sahi nahi hai"
    const isCategoryChange = /category.*(badlo|change|galat|theek|dobara|badalna|chuno)|vibhag.*(badlo|change|galat)|nayi category/i.test(t);
    if (isCategoryChange) {
      console.log('[VoiceAgent] Handling Category Change Command');
      jumpToStep(1, () => {
        setPhase('driving_category');
        const chips = document.getElementById('categoryChipsContainer');
        animateCursorToAndClick(chips, () => {
          speak(lang === 'en'
            ? 'Alright, back to category selection. Please state your category — road, electricity, water, or sanitation?'
            : 'Theek hai, hum category chunne par wapas aa gaye hain. Kripya batayein — sadak, bijli, paani, ya safai?');
        }, 300);
      });
      return;
    }

    // D. User says: "priority badal do", "urgent karo", "high karo", "normal karo"
    const isDirectPriority = /priority (change|badlo|badalna|set)|(urgent|turant|emergency) (kar do|kardo|karo|rakho)|(high|gambhir) (kar do|kardo|karo|rakho)|(normal|medium) (kar do|kardo|karo|rakho)/i.test(t);
    if (isDirectPriority) {
      let prioVal = 'high';
      if (/urgent|turant|emergency/i.test(t)) prioVal = 'urgent';
      else if (/normal|medium|kam/i.test(t)) prioVal = 'medium';

      const prioRadio = document.querySelector(`input[name="priorityChoice"][value="${prioVal}"]`);
      const prioTarget = prioRadio ? (prioRadio.parentElement || prioRadio) : null;
      if (prioTarget) {
        animateCursorToAndClick(prioTarget, () => {
          if (prioRadio) prioRadio.checked = true;
          const label = prioVal === 'medium' ? 'Normal' : prioVal === 'urgent' ? 'Urgent' : 'High';
          speak(lang === 'en'
            ? `Alright, priority set to ${label}.`
            : `Theek hai, maine priority ${label} set kar di hai.`);
        }, 300);
      }
      return;
    }

    // E. User says: "cancel karo", "band karo", "report band karo"
    const isCancelCommand = /cancel (karo|kardo|kar do)|report (band|close|cancel)|band (karo|kardo|kar do)|nahi karni report/i.test(t);
    if (isCancelCommand) {
      const closeBtn = document.querySelector('#reportModal .modal-close-btn');
      if (closeBtn) {
        animateCursorToAndClick(closeBtn, () => {
          const modal = document.getElementById('reportModal');
          if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('active');
          }
          speak(lang === 'en'
            ? 'Okay, I have cancelled and closed this report.'
            : 'Theek hai, maine ye report cancel karke band kar di hai.');
          finishCallGracefully();
        }, 300);
      } else {
        const modal = document.getElementById('reportModal');
        if (modal) {
          modal.style.display = 'none';
          modal.classList.remove('active');
        }
        speak(lang === 'en'
          ? 'Okay, I have cancelled and closed this report.'
          : 'Theek hai, maine report band kar di hai.');
        finishCallGracefully();
      }
      return;
    }

    // ─── CIVIC TOPIC GUARDRAIL: "problem and report ke related hi" ───
    const isOffTopic = /cricket|match|cinema|film|movie|actor|hero|weather|mausam|modi|election|politics|song|gana|shayari/i.test(t) &&
      !/sadak|bijli|paani|kachra|hospital|school|kisan|ration|samasya|shikayat|problem|report/i.test(t);
    if (isOffTopic) {
      speak(isHindi
        ? 'Main JanSetu AI hoon. Main sirf aapke ilaqe ki nagrik samasyaayein (jaise sadak, bijli, paani, kachra) darj aur track karne me madad karta hoon. Batayiye aapke ilaqe me koi samasya hai kya?'
        : 'I am JanSetu AI. I only assist with reporting and tracking civic problems such as roads, electricity, water, and sanitation. Please let me know if you have any civic issue to report.');
      return;
    }

    // ─── CATEGORY DEFINITIONS FOR ALL 8 OFFICIAL SECTORS ───
    const CATEGORY_PROFILES = [
      {
        key: 'Urban Infrastructure',
        topicHi: 'सड़क व गड्ढे',
        topicEn: 'Roads & Infrastructure',
        labelHi: 'सड़क व पुल (Roads & Infra)',
        labelEn: 'Roads & Infrastructure',
        keywords: [
          'sadak', 'road', 'gaddha', 'gaddhe', 'gaddhon', 'pothole', 'potholes', 'pul', 'bridge',
          'footpath', 'rasta', 'culvert', 'flyover', 'divider', 'khadda', 'asphalt', 'highway',
          'speed breaker', 'gali', 'naali cross', 'tuti sadak', 'damaged road', 'cement road',
          'tar road', 'street', 'crater', 'ditch', 'accident', 'traffic jam', 'गड्ढा', 'गड्ढे', 'सड़क', 'पुल'
        ],
        defaultTitleHi: 'सड़क की जर्जर स्थिति एवं गड्ढों की मरम्मत',
        defaultTitleEn: 'Damaged Road & Potholes Repair'
      },
      {
        key: 'Energy & Technology',
        topicHi: 'बिजली व ट्रांसफॉर्मर',
        topicEn: 'Electricity & Lighting',
        labelHi: 'बिजली आपूर्ति (Electricity)',
        labelEn: 'Electricity',
        keywords: [
          'bijli', 'light', 'power', 'current', 'transformer', 'wire', 'taar', 'pole', 'khamba',
          'street light', 'streetlight', 'bulb', 'andhera', 'darkness', 'blackout', 'fuse',
          'high voltage', 'low voltage', 'trip', 'phase', 'meter', 'electricity', 'electric',
          'supply band', 'power cut', 'spark', 'short circuit', 'power outage', 'ट्रांसफार्मर', 'बिजली'
        ],
        defaultTitleHi: 'बिजली ट्रांसफॉर्मर खराबी एवं विद्युत आपूर्ति बाधित',
        defaultTitleEn: 'Power Outage & Transformer Breakdown'
      },
      {
        key: 'Water Management',
        topicHi: 'पेयजल व पानी सप्लाई',
        topicEn: 'Water Supply & Drinking Water',
        labelHi: 'जल आपूर्ति (Water Supply)',
        labelEn: 'Water Supply',
        keywords: [
          'paani', 'pani', 'drinking water', 'peene ka paani', 'tap', 'nal', 'boring', 'handpump',
          'chapakal', 'chaapaakal', 'tanki', 'water tank', 'pipeline', 'water leak', 'pipe leak',
          'water supply', 'motar', 'dirty water', 'ganda pani', 'contaminated water', 'jal nigam',
          'jal vibhag', 'submerssible', 'चापाकल', 'पानी', 'हैंडपंप', 'पाइप'
        ],
        defaultTitleHi: 'पेयजल आपूर्ति एवं पाइपलाइन लीकेज की समस्या',
        defaultTitleEn: 'Drinking Water Supply & Pipeline Leakage'
      },
      {
        key: 'Sanitation & Environment',
        topicHi: 'कचरा व नाली सफाई',
        topicEn: 'Sanitation & Cleanliness',
        labelHi: 'सफाई व कचरा (Cleanliness)',
        labelEn: 'Cleanliness & Waste',
        keywords: [
          'kachra', 'kooda', 'kuda', 'garbage', 'safai', 'cleanliness', 'dustbin', 'trash',
          'dumping', 'waste', 'durgandh', 'badbu', 'smell', 'unhygienic', 'naala', 'naali',
          'sewer', 'drainage', 'stagnant water', 'jalbhavar', 'waterlogging', 'kichad', 'mud',
          'gutter', 'safaikarmi', 'sweep', 'open waste', 'कचरा', 'सफाई', 'नाला', 'नाली', 'दुर्गंध'
        ],
        defaultTitleHi: 'कचरा जमाव एवं नियमित सफाई की आवश्यकता',
        defaultTitleEn: 'Garbage Accumulation & Cleanliness'
      },
      {
        key: 'Healthcare',
        topicHi: 'अस्पताल व स्वास्थ्य सेवा',
        topicEn: 'Healthcare & Hospital',
        labelHi: 'स्वास्थ्य सेवा (Healthcare)',
        labelEn: 'Healthcare',
        keywords: [
          'hospital', 'aspatal', 'clinic', 'doctor', 'dawa', 'dawai', 'nurse', 'ilaaj', 'ilaj',
          'swasthya', 'health', 'medical', 'medicine', 'ambulance', 'primary health center',
          'phc', 'chc', 'bimari', 'immunization', 'tika', 'patient', 'mareez', 'अस्पताल', 'दवा', 'स्वास्थ्य'
        ],
        defaultTitleHi: 'स्वास्थ्य केंद्र एवं चिकित्सा सुविधा की आवश्यकता',
        defaultTitleEn: 'Healthcare Facility & Medical Support'
      },
      {
        key: 'Education',
        topicHi: 'स्कूल व शिक्षा',
        topicEn: 'School & Education',
        labelHi: 'शिक्षा व स्कूल (School)',
        labelEn: 'Education',
        keywords: [
          'school', 'vidyalaya', 'college', 'padhai', 'shiksha', 'teacher', 'master', 'mastar',
          'shikshak', 'education', 'books', 'kitab', 'bench', 'classroom', 'student', 'vidyarthi',
          'mid day meal', 'mdma', 'midday meal', 'toilet school', 'स्कूल', 'विद्यालय', 'शिक्षक', 'पढ़ाई'
        ],
        defaultTitleHi: 'विद्यालय में मूलभूत सुविधाएं एवं शिक्षक व्यवस्था',
        defaultTitleEn: 'School Infrastructure & Facilities'
      },
      {
        key: 'Agriculture',
        topicHi: 'खेती व सिंचाई',
        topicEn: 'Agriculture & Farming',
        labelHi: 'कृषि व सिंचाई (Farming)',
        labelEn: 'Farming',
        keywords: [
          'kisan', 'kheti', 'farm', 'farming', 'crop', 'fasal', 'sinchai', 'irrigation',
          'khad', 'fertilizer', 'beej', 'seeds', 'krishi', 'drought', 'sookha', 'baadh',
          'pest', 'keeda', 'mandi', 'किसान', 'खेती', 'फसल', 'सिंचाई', 'खाद'
        ],
        defaultTitleHi: 'कृषि सिंचाई एवं फसल संबंधी सहायता',
        defaultTitleEn: 'Agricultural Irrigation & Crop Support'
      },
      {
        key: 'Public Administration',
        topicHi: 'प्रशासनिक व अन्य समस्या',
        topicEn: 'Public Administration',
        labelHi: 'अन्य समस्याएं (Other Issues)',
        labelEn: 'Other Issues',
        keywords: [
          'ration', 'rashan', 'quota', 'dealer', 'pension', 'vridha pension', 'vidhwa pension',
          'zameen', 'land', 'patta', 'police', 'bhrashtachar', 'corruption', 'rishwat',
          'block office', 'prashasan', 'pradhan', 'mukhiya', 'ward commissioner', 'aadhar',
          'राशन', 'पेंशन', 'भ्रष्टाचार', 'प्रशासन'
        ],
        defaultTitleHi: 'सार्वजनिक प्रशासनिक समस्या एवं निवारण',
        defaultTitleEn: 'Public Administrative Grievance'
      }
    ];

    // Helper: Checks if utterance is just a greeting or generic intent to report without problem specifics
    const isPureGreetingOrIntent = (raw, maxScore = 0) => {
      const trimmed = raw.trim().toLowerCase();
      // Multi-word greetings
      if (/^(hello|hi|namaste|namaskar|pranam|suno|suniye|hey)(\s+(bhai|bhaiya|sir|madam|ji|friend))?$/i.test(trimmed)) return true;
      if (/^(bhai|bhaiya|sir|madam|ji)\s+(suno|suniye|hello|namaste)$/i.test(trimmed)) return true;
      if (/^(kya aap sun rahe hain|aap meri madad kar sakte hain|madad chahiye|help chahiye)$/i.test(trimmed)) return true;

      // If citizen has zero category keywords and expresses generic intent to report
      if (maxScore === 0) {
        if (/report|problem|samasya|shikayat|complaint|madad|help|dikkat|pareshani/i.test(trimmed) &&
            /karni|karna|likh|darj|batana|hai|chahiye/i.test(trimmed)) {
          return true;
        }
      }
      return false;
    };

    // 3. Step 1: Problem / Category Selection Phase (Click category chip & Next)
    const isModalStep1Visible = typeof document !== 'undefined' && 
                                document.getElementById('reportModal')?.style?.display !== 'none' &&
                                document.getElementById('stepSection1')?.style?.display !== 'none';

    if (current === 'driving_category' || (isModalStep1Visible && current !== 'tracking_input' && !isDescCorrection && !isBackCommand && !isCancelCommand)) {
      setAgentActivity(lang === 'en' ? '🤖 Selecting matching category...' : '🤖 Category aur samasya darj kar raha hoon...');

      // Dynamic Keyword-Scoring across all 8 Official JanSetu Categories
      let bestProfile = null;
      let highestScore = 0;

      CATEGORY_PROFILES.forEach(prof => {
        let score = 0;
        prof.keywords.forEach(kw => {
          if (t.includes(kw.toLowerCase())) {
            score += 1;
            const re = new RegExp('\\b' + kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
            if (re.test(t)) score += 2;
          }
        });
        if (score > highestScore) {
          highestScore = score;
          bestProfile = prof;
        }
      });

      // If user merely greeted or expressed generic intent to report without problem keywords, talk like a person
      if (isPureGreetingOrIntent(t, highestScore)) {
        speak(isHindi
          ? 'Ji namaste! Batayiye aapke ilaqe me kis cheez ki samasya hai — jaise sadak, bijli, paani, kachra, ya swasthya? Main sun raha hoon.'
          : 'Hello! Please tell me what issue you are facing in your area — such as roads, electricity, water, sanitation, or health? I am listening.');
        return;
      }

      // If no category keywords matched at all, use Public Administration instead of defaulting to Water
      if (!bestProfile) {
        bestProfile = CATEGORY_PROFILES.find(p => p.key === 'Public Administration') || CATEGORY_PROFILES[0];
      }

      const matchedKey = bestProfile.key;
      const cleanTitle = lang === 'en' ? bestProfile.defaultTitleEn : bestProfile.defaultTitleHi;
      const cleanDesc = lang === 'en'
        ? `${text} - Problem regarding ${bestProfile.topicEn}. Prompt official inspection and resolution requested.`
        : `${text} - क्षेत्र में ${bestProfile.topicHi} की समस्या है। कृपया शीघ्र जांच कर समाधान कराया जाए।`;

      // Find the corresponding category chip button in the DOM
      const catButtons = Array.from(document.querySelectorAll('#categoryChipsContainer .category-chip-btn'));
      const targetBtn = catButtons.find(b => {
        const oc = (b.getAttribute('onclick') || '').toLowerCase();
        return oc.includes(matchedKey.toLowerCase());
      }) || catButtons.find(b => {
        const textLower = b.textContent.toLowerCase();
        return textLower.includes(matchedKey.toLowerCase()) ||
               textLower.includes(bestProfile.topicEn.toLowerCase()) ||
               textLower.includes(bestProfile.labelEn.toLowerCase());
      }) || catButtons[0];

      // Pre-fill Step 2 form fields so citizen never has to re-enter
      const descEl = document.getElementById('reportDescription');
      const titleEl = document.getElementById('reportTitle');
      const catEl = document.getElementById('reportCategory');
      if (catEl) catEl.value = matchedKey;
      if (descEl) descEl.value = cleanDesc;
      if (titleEl) titleEl.value = cleanTitle;

      // Animate cursor to click the category tile
      animateCursorToAndClick(targetBtn || '#categoryChipsContainer', () => {
        // Highlight category button visually and logically
        if (targetBtn) {
          catButtons.forEach(b => b.classList.remove('selected'));
          targetBtn.classList.add('selected');
          try { targetBtn.click(); } catch (e) {}
        }
        if (typeof window.selectFormCategory === 'function' && targetBtn) {
          try { window.selectFormCategory(targetBtn, matchedKey); } catch (e) {}
        }

        // Smoothly click "Next: Problem Batayein →" button to advance to Step 2
        setTimeout(() => {
          const nextBtn = document.querySelector('#stepSection1 .btn-modal-primary');
          animateCursorToAndClick(nextBtn || '#stepSection1 .modal-footer-nav button', () => {
            jumpToStep(2, () => {
              setPhase('driving_priority');
              setTimeout(() => {
                speak(isHindi
                  ? `Maine samajh liya — aapke ilaqe me ${bestProfile.topicHi} ki samasya hai. Maine isko '${bestProfile.labelHi}' category me select kar diya hai. Batayiye iski priority kya rakhein — Urgent, High ya Normal?`
                  : `Understood — there is an issue with ${bestProfile.topicEn} in your area. I have selected the '${bestProfile.labelEn}' category. What should be the priority — Urgent, High, or Normal?`);
              }, 350);
            });
          }, 320);
        }, 350);
      }, 350);

      return;
    }

    // 4. Step 2: Problem Description Phase (Fill text & ask priority)
    if (current === 'driving_desc') {
      setAgentActivity(lang === 'en' ? '🤖 Writing description...' : '🤖 Description likh raha hoon...');
      const descEl = document.getElementById('reportDescription');
      const titleEl = document.getElementById('reportTitle');
      const catEl = document.getElementById('reportCategory');

      // Re-classify based on new description
      let bestProfile = null;
      let highestScore = 0;
      CATEGORY_PROFILES.forEach(prof => {
        let score = 0;
        prof.keywords.forEach(kw => {
          if (t.includes(kw.toLowerCase())) {
            score += 1;
            const re = new RegExp('\\b' + kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
            if (re.test(t)) score += 2;
          }
        });
        if (score > highestScore) {
          highestScore = score;
          bestProfile = prof;
        }
      });

      if (bestProfile) {
        if (catEl) catEl.value = bestProfile.key;
        if (titleEl) titleEl.value = lang === 'en' ? bestProfile.defaultTitleEn : bestProfile.defaultTitleHi;
      }
      if (descEl) descEl.value = text;

      setPhase('driving_priority');
      setTimeout(() => {
        speak(isHindi
          ? 'Maine aapki samasya vistaar se note kar li hai. Is samasya ki priority kya rakhein — Urgent, High ya Normal?'
          : 'I have recorded your problem description. What should be the priority — Urgent, High, or Normal?');
      }, 350);
      return;
    }

    // 5. Step 2: Priority Selection Phase (Click priority radio, click Next, click GPS autodetect)
    if (current === 'driving_priority') {
      setAgentActivity(lang === 'en' ? '🤖 Setting priority & detecting location...' : '🤖 Priority set kar raha hoon...');
      let prioValue = 'high';
      let prioLabelHi = 'High (उच्च)';
      let prioLabelEn = 'High';

      if (/urgent|turant|emergency|bahut zaroori|jaldi|gambhir|critical/i.test(t)) {
        prioValue = 'urgent';
        prioLabelHi = 'Urgent (तत्काल)';
        prioLabelEn = 'Urgent';
      } else if (/high|bada|zyada|badi dikkat/i.test(t)) {
        prioValue = 'high';
        prioLabelHi = 'High (उच्च)';
        prioLabelEn = 'High';
      } else if (/normal|sadharan|theek|medium|kam/i.test(t)) {
        prioValue = 'medium';
        prioLabelHi = 'Normal (सामान्य)';
        prioLabelEn = 'Normal';
      }

      const prioRadio = document.querySelector(`input[name="priorityChoice"][value="${prioValue}"]`) ||
                        (prioValue === 'medium' ? document.querySelector('input[name="priorityChoice"][value="normal"]') : null) ||
                        document.querySelector('input[name="priorityChoice"][value="high"]');
      const prioTarget = prioRadio ? (prioRadio.parentElement || prioRadio) : null;

      if (prioTarget) {
        animateCursorToAndClick(prioTarget, () => {
          if (prioRadio) {
            prioRadio.checked = true;
            try { prioRadio.click(); } catch (e) {}
          }
          speak(isHindi
            ? `Theek hai, priority ko '${prioLabelHi}' mark kar diya hai. Ab sthal ki jaanch ke liye live GPS location detect kar raha hoon...`
            : `Priority marked as '${prioLabelEn}'. Now detecting live GPS location for site verification...`);

          setTimeout(() => {
            animateCursorToAndClick('#stepSection2 .btn-modal-primary', () => {
              setPhase('driving_loc');
              setTimeout(() => {
                animateCursorToAndClick('.btn-gps-autodetect', () => {
                  setTimeout(() => {
                    sendLocationCaptured();
                    speak(isHindi
                      ? 'Haan, location darj ho gayi hai. Ab agla kadam sabse zaroori hai — prashasan dwara satyapan ke liye sthal ka photo proof anivarya hai. Kripya samasya ki photo upload karein.'
                      : 'GPS location captured. Now the most important step — photo proof is mandatory for administrative verification. Please upload a photo of the problem spot.');
                    setTimeout(() => {
                      animateCursorToAndClick('#stepSection3 .btn-modal-primary', () => {
                        setPhase('driving_photo');
                        // Animate cursor to photo tile to guide citizen visually
                        setTimeout(() => {
                          const photoTile = document.querySelector('label.media-btn-tile');
                          if (photoTile) animateCursorToAndClick(photoTile, () => {});
                        }, 400);
                      }, 300);
                    }, 800);
                  }, 900);
                }, 350);
              }, 300);
            }, 300);
          }, 500);
        }, 300);
      }
      return;
    }

    // 6. Step 3: Location Phase (User speaks during GPS step)
    if (current === 'driving_loc') {
      setAgentActivity(lang === 'en' ? '🤖 Detecting GPS location...' : '🤖 GPS location detect kar raha hoon...');
      animateCursorToAndClick('.btn-gps-autodetect', () => {
        setTimeout(() => {
          sendLocationCaptured();
          animateCursorToAndClick('#stepSection3 .btn-modal-primary', () => {
            setPhase('driving_photo');
            setTimeout(() => {
              speak(isHindi
                ? 'Location darj ho gayi hai. Prashasan dwara jaanch ke liye photo proof anivarya hai. Kya aapke paas photo hai?'
                : 'Location captured. Photo proof is mandatory for verification. Do you have a photo of the problem?');
            }, 300);
          }, 300);
        }, 500);
      }, 300);
      return;
    }

    // 7. Step 4: Photo Phase (STRICTLY ENFORCE MANDATORY EVIDENCE)
    if (current === 'driving_photo') {
      const mediaReady = hasUploadedMedia();

      if (mediaReady) {
        setPhase('driving_video');
        speak(isHindi
          ? 'Photo proof jud gaya hai. Kya koi chhota video clip bhi jodna chahenge, ya seedha AI jaanch par chalein?'
          : 'Photo proof attached. Would you also like to add a video clip, or proceed directly to AI check?');
        return;
      }

      // If user says haan / yes / photo hai / upload / camera / lelo / khicho
      if (/haan|yes|photo|hai|upload|dikhao|lelo|khicho|camera|attach/i.test(t) && !/nahi|no|mat|cancel|skip/i.test(t)) {
        const photoInput = document.getElementById('mediaPhotoInput');
        const photoTile = document.querySelector('label.media-btn-tile') || document.getElementById('stepSection4');
        animateCursorToAndClick(photoTile, () => {
          if (photoInput) {
            try { photoInput.click(); } catch (e) {}
          }
          speak(isHindi
            ? 'Theek hai, photo chunein ya camera se photo lein. Photo judte hi hum turant agle kadam par chalenge.'
            : 'Please select or capture the photo. As soon as it is attached, we will proceed immediately.');
        }, 300);
        return;
      }

      // If user says nahi / no / skip / baad me / submit kar do / aage badho WITHOUT uploading photo:
      // STRICTLY REFUSE TO BYPASS! PHOTO PROOF IS MANDATORY!
      const photoTile = document.querySelector('label.media-btn-tile') || document.getElementById('stepSection4');
      animateCursorToAndClick(photoTile, () => {
        speak(isHindi
          ? 'Prashasan dwara satyapan ke liye samasya ki photo lagana anivarya (mandatory) hai. Photo ke bina report aage nahi badh sakti. Kripya "Add Photos" par click karke sthal ki photo upload karein ya camera se photo lein.'
          : 'Photo evidence is strictly mandatory for administrative verification. The grievance cannot proceed without photo proof. Please click "Add Photos" to upload or capture a photo from the location.');
      }, 350);
      return;
    }

    // 8. Step 4: Video Phase
    if (current === 'driving_video') {
      const mediaReady = hasUploadedMedia();

      if (!mediaReady) {
        // Fallback to photo step if media was removed
        setPhase('driving_photo');
        speak(isHindi
          ? 'Satyapan ke liye kam se kam ek photo proof anivarya hai. Kripya photo upload karein.'
          : 'At least one photo evidence is mandatory. Please upload a photo.');
        return;
      }

      if (/video|clip|recording/i.test(t) && /haan|yes|upload|add|karna/i.test(t)) {
        const videoInput = document.getElementById('mediaVideoInput');
        const videoTile = Array.from(document.querySelectorAll('label.media-btn-tile'))[1] || document.querySelector('label.media-btn-tile');
        animateCursorToAndClick(videoTile, () => {
          if (videoInput) {
            try { videoInput.click(); } catch (e) {}
          }
          speak(isHindi ? 'Theek hai, video upload karein. Uske baad hum AI jaanch karenge.' : 'Please choose your video file.');
        }, 300);
      } else {
        // Citizen says no video or ready for AI check
        speak(isHindi
          ? 'Bahut badiya! Saare proof mil gaye hain. Ab hum AI duplicate check aur verification shuru kar rahe hain.'
          : 'Great! Proofs verified. Moving to JanSetu AI duplicate check.');
        proceedToStep5AICheck();
      }
      return;
    }

    // 9. Step 5: Duplicate Check & Final Submit Phase
    if (current === 'driving_check') {
      setAgentActivity(lang === 'en' ? '🤖 Verifying & checking duplicates...' : '🤖 AI duplicate jaanch kar raha hoon...');
      const dupBox = document.getElementById('duplicateNoticeBox');
      const isDuplicateVisible = dupBox && dupBox.style.display !== 'none';

      if (isDuplicateVisible) {
        if (/link|jod|haan|yes|support|sath|twinned/i.test(t)) {
          animateCursorToAndClick('button[data-i18n="btn_support_existing"]', () => {
            speak(isHindi
              ? 'Aapki shikayat pehle se darj shikayat ke sath safaltapoorvak link ho gayi hai. Aap ise My Reports me track kar sakte hain. Dhanyawad!'
              : 'Grievance linked with existing report successfully. You can track it in My Reports. Thank you!');
            finishCallGracefully();
          }, 350);
        } else if (/cancel|drop|hata|mat karo|band|rehne do|nahi/i.test(t) && !/report|submit|naya|alag/i.test(t)) {
          speak(isHindi
            ? 'Theek hai, maine ye report cancel kar di hai. Kabhi bhi phir se report kar sakte hain.'
            : 'Okay, I have cancelled this report. You can report again anytime.');
          const modal = document.getElementById('reportModal');
          if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('active');
          }
          finishCallGracefully();
        } else {
          animateCursorToAndClick('button[data-i18n="btn_report_anyway"]', () => {
            setTimeout(() => {
              animateCursorToAndClick('#finalSubmitBtn', () => {
                speak(isHindi
                  ? 'Aapki nayi shikayat safaltapoorvak darj ho gayi hai! Aap ise My Reports me track kar sakte hain. Dhanyawad!'
                  : 'Your new grievance has been submitted successfully! You can track it in My Reports. Thank you!');
                finishCallGracefully();
              }, 350);
            }, 350);
          }, 350);
        }
      } else {
        if (/haan|yes|submit|kar do|kar doon|theek|sahi|bilkul|kardo|karo/i.test(t)) {
          animateCursorToAndClick('#finalSubmitBtn', () => {
            speak(isHindi
              ? 'Aapki samasya safaltapoorvak darj ho gayi hai! Aap iski sthiti My Reports me dekh sakte hain. JanSetu par report karne ke liye bahut-bahut dhanyawad!'
              : 'Your grievance has been submitted successfully! You can track its status in My Reports. Thank you for reporting with JanSetu!');
            finishCallGracefully();
          }, 350);
        } else if (/nahi|cancel|mat|ruko|edit/i.test(t)) {
          speak(isHindi
            ? 'Submission rok diya hai. Aap details badal sakte hain ya call end kar sakte hain.'
            : 'Submission paused. You can edit details or end the call.');
        } else {
          speak(isHindi
            ? 'Kya main ye shikayat abhi prashasan ko submit kar doon? Kripya haan ya submit bolein.'
            : 'Should I submit this grievance to the authorities now? Please say yes or submit.');
        }
      }
      return;
    }

    // Fallback: forward to LLM if needed
    setVoiceStatus('processing');
    sendSocketMessage({
      type: 'user_utterance',
      text
    });
  };

  // Finish call gracefully and auto-disconnect after speech
  const finishCallGracefully = () => {
    setCursorVisible(false);
    setAgentActivity('');
    setTimeout(() => {
      handleEndCall();
    }, 4500);
  };

  // Step 1: Language Selection Handler (English & Hinglish sync)
  const handleSelectLanguage = (chosenLang) => {
    const activeLang = (chosenLang === 'hi' || chosenLang === 'hinglish') ? 'hinglish' : 'en';
    setLang(activeLang);

    if (typeof window !== 'undefined') {
      try {
        if (typeof window.setLanguage === 'function') {
          window.setLanguage(activeLang);
        } else {
          localStorage.setItem('jansetu_language', activeLang);
          ['en', 'hinglish'].forEach(l => {
            const btn = document.getElementById('langBtn_' + l);
            if (btn) btn.className = 'lang-btn' + (l === activeLang ? ' active' : '');
          });
          const hiBtn = document.getElementById('langBtn_hi');
          if (hiBtn) hiBtn.style.display = 'none';
        }
      } catch (e) {}
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
      recognitionRef.current.lang = activeLang === 'en' ? 'en-IN' : 'hi-IN';
      try { recognitionRef.current.start(); } catch (e) {}
    }

    sendSocketMessage({ type: 'select_language', lang: activeLang === 'en' ? 'en' : 'hi' });
    setPhase('assistance_choice');
    const prompt = activeLang === 'en'
      ? 'Great! How can I help you today? You can report a new problem or check an existing one.'
      : 'Bahut accha! Batayiye, main aapki kya madad kar sakta hoon? Aap nayi samasya report kar sakte hain ya purani shikayat ki sthiti jaanch sakte hain.';
    speak(prompt);
  };

  // Helper: Constructs exact detailed speech for grievance status as requested:
  // 1. Problem number
  // 2. Title
  // 3. Time ago (e.g. "Aapne ise 2 ghante pehle report kiya tha")
  // 4. Place / Location
  // 5. Description 6-7 word brief
  // Helper: Constructs exact detailed speech for grievance status as requested:
  // 1. "Aapki recent report number..."
  // 2. Title
  // 3. Date & time ago (e.g. "13 September 2026, 03:01 AM (lagbhag 2 ghante pehle)")
  // 4. Place / Location
  // 5. Description 6-7 word brief
  // 6. Tracker detail with stage, date, and pending status
  // 7. Prompt: "Problem number bataiye ya niche field me likh kar bheje."
  const buildReportDetailedSpeech = (rep, targetLang = 'hi', isRecent = true) => {
    const isHi = targetLang === 'hi' || targetLang === 'hinglish';
    const repId = rep.id || rep.challengeId || '';
    const repTitle = rep.title || (isHi ? 'नागरिक शिकायत' : 'Civic Grievance');
    const repLoc = rep.location || rep.district || 'Jharkhand';
    const rawDesc = rep.description || rep.desc || rep.details || rep.title || (isHi ? 'समस्या समाधान हेतु प्रक्रियाधीन है' : 'Grievance in resolution process');

    // 6-7 words brief
    const words = rawDesc.trim().split(/\s+/).filter(Boolean);
    const descBrief = words.slice(0, 7).join(' ') + (words.length > 7 ? '...' : '');

    // Time ago & formatted date calculation
    let timeTextHi = '2 ghante pehle';
    let timeTextEn = 'about 2 hours ago';
    let dateFormattedHi = '13 September 2026, 03:01 AM';
    let dateFormattedEn = '13 September 2026, 03:01 AM';

    if (rep.timeAgo) {
      timeTextEn = rep.timeAgo;
      timeTextHi = rep.timeAgo
        .replace(/hours? ago/i, 'ghante pehle')
        .replace(/minutes? ago/i, 'minute pehle')
        .replace(/days? ago/i, 'din pehle')
        .replace(/an hour ago/i, '1 ghante pehle');
    }

    const dateSource = rep.createdAt || rep.submittedDate || rep.date;
    if (dateSource) {
      try {
        const d = new Date(dateSource);
        if (!isNaN(d.getTime())) {
          const monthsHi = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
          const day = d.getDate();
          const month = monthsHi[d.getMonth()];
          const year = d.getFullYear();
          let hours = d.getHours();
          const mins = d.getMinutes().toString().padStart(2, '0');
          const ampm = hours >= 12 ? 'PM' : 'AM';
          hours = hours % 12 || 12;
          dateFormattedHi = `${day} ${month} ${year}, ${hours}:${mins} ${ampm}`;
          dateFormattedEn = `${day} ${month} ${year}, ${hours}:${mins} ${ampm}`;

          const diffMs = Date.now() - d.getTime();
          const diffMins = Math.max(1, Math.round(diffMs / 60000));
          const diffHours = Math.round(diffMs / 3600000);
          if (!rep.timeAgo) {
            if (diffMins < 60) {
              timeTextHi = `${diffMins} minute pehle`;
              timeTextEn = `${diffMins} minutes ago`;
            } else if (diffHours < 24) {
              timeTextHi = `${diffHours} ghante pehle`;
              timeTextEn = `${diffHours} hours ago`;
            } else {
              const diffDays = Math.round(diffMs / 86400000);
              timeTextHi = `${diffDays} din pehle`;
              timeTextEn = `${diffDays} days ago`;
            }
          }
        } else if (typeof dateSource === 'string' && dateSource.length > 5) {
          dateFormattedHi = dateSource;
          dateFormattedEn = dateSource;
        }
      } catch (e) {}
    } else if (rep.dateStr) {
      dateFormattedHi = rep.dateStr;
      dateFormattedEn = rep.dateStr;
    }

    // Attach computed date to rep for card consumption
    rep.dateFormatted = dateFormattedHi;

    // Dynamic tracker stage detail with date and pending status
    const rawStat = (rep.status || 'submitted').toLowerCase();
    const isResolved = rawStat.includes('solve') || rawStat.includes('resolved') || rawStat.includes('close');
    const isInProgress = rawStat.includes('progress') || rawStat.includes('work') || rawStat.includes('team');
    const isVerified = rawStat.includes('validated') || rawStat.includes('verified') || rawStat.includes('assign');

    let trackerDetailHi = `Tracker details: Stage 1 (Submitted) — Aapki shikayat ${dateFormattedHi} ko darj ho chuki hai. Stage 2 (Admin Verification) — Abhi yeh Admin verification ke liye pending hai, jald hi sambhandhit adhikari dwara verify ho jayega. Agle charan me JanSetu Taskforce dwara sthal par jaanch shuru hogi.`;
    let trackerDetailEn = `Tracker details: Stage 1 (Submitted) — Your grievance was registered on ${dateFormattedEn}. Stage 2 (Admin Verification) — It is currently pending Admin verification and will be verified shortly by the authority. Following verification, JanSetu Taskforce will proceed with on-site inspection.`;

    if (isResolved) {
      trackerDetailHi = `Tracker details: Stage 1 (Submitted) — Aapki shikayat ${dateFormattedHi} ko darj hui thi. Stage 2 (Admin Verified) — Verify ho chuki hai. Stage 3 (Resolved) — Samasya ka safaltapoorvak nivaaran ho chuka hai.`;
      trackerDetailEn = `Tracker details: Stage 1 (Submitted) on ${dateFormattedEn}. Stage 2 (Admin Verified). Stage 3 (Resolved) — The grievance has been successfully resolved.`;
    } else if (isInProgress) {
      trackerDetailHi = `Tracker details: Stage 1 (Submitted) — ${dateFormattedHi} ko darj hui. Stage 2 (Admin Verified) — Admin dwara verify ho chuki hai. Stage 3 (In Progress) — JanSetu Taskforce dwara sthal par karyawahi pragati par hai.`;
      trackerDetailEn = `Tracker details: Stage 1 (Submitted) on ${dateFormattedEn}. Stage 2 (Admin Verified). Stage 3 (In Progress) — JanSetu Taskforce is currently taking action on site.`;
    } else if (isVerified) {
      trackerDetailHi = `Tracker details: Stage 1 (Submitted) — ${dateFormattedHi} ko darj hui. Stage 2 (Admin Verified) — Admin dwara verify ho chuki hai, agle charan me field team karyawahi shuru karegi.`;
      trackerDetailEn = `Tracker details: Stage 1 (Submitted) on ${dateFormattedEn}. Stage 2 (Admin Verified). Field action team will be dispatched next.`;
    }

    const startPrefixHi = isRecent
      ? `Aapki recent report number ${repId} hai`
      : `Aapki report number ${repId} hai`;

    const startPrefixEn = isRecent
      ? `Your recent report number is ${repId}`
      : `Your report number is ${repId}`;

    if (isHi) {
      return `${startPrefixHi} — "${repTitle}". Aapne ise ${dateFormattedHi} (lagbhag ${timeTextHi}) ko report kiya tha. Location: ${repLoc}. Samasya brief: "${descBrief}". ${trackerDetailHi} Problem number bataiye ya niche field me likh kar bheje.`;
    } else {
      return `${startPrefixEn} — "${repTitle}". You reported this on ${dateFormattedEn} (${timeTextEn}). Location: ${repLoc}. Problem summary: "${descBrief}". ${trackerDetailEn} Please say your problem number or type and send it in the field below.`;
    }
  };

  // Step 1b: Open Tracking Input Phase — shows recent report by default, speaks exact requested sequence
  const handleOpenTrackingInput = () => {
    let recentReport = null;

    try {
      if (typeof window !== 'undefined') {
        // Priority 1: Check window.getCurrentlyTrackedReport() — core dashboard active tracked item
        if (typeof window.getCurrentlyTrackedReport === 'function') {
          try {
            const tracked = window.getCurrentlyTrackedReport();
            if (tracked && (tracked.id || tracked.challengeId)) {
              recentReport = { ...tracked };
            }
          } catch (e) {}
        }

        // Priority 2: Check window.getAllReportsList() or window.allReportsList
        if (!recentReport) {
          const list = (typeof window.getAllReportsList === 'function')
            ? window.getAllReportsList()
            : (Array.isArray(window.allReportsList) ? window.allReportsList : null);

          if (Array.isArray(list) && list.length > 0) {
            const sorted = [...list].sort((a, b) => {
              const tB = new Date(b.createdAt || b.submittedDate || 0).getTime();
              const tA = new Date(a.createdAt || a.submittedDate || 0).getTime();
              return tB - tA;
            });
            if (sorted[0] && (sorted[0].id || sorted[0].challengeId)) {
              recentReport = { ...sorted[0] };
            }
          }
        }

        // Priority 3: Check Active Tracker Card in the live DOM (#activeReportId, #activeReportTitle, etc.)
        if (!recentReport) {
          const activeIdEl = document.getElementById('activeReportId');
          const activeTitleEl = document.getElementById('activeReportTitle');
          const activeLocEl = document.getElementById('activeReportLoc');
          const activeDescEl = document.getElementById('activeReportDesc');
          const activeStatusEl = document.getElementById('activeStatusLabelText') || document.getElementById('activeReportStatus');
          const activeDateEl = document.getElementById('timelineDateSubmitted');

          if (activeIdEl && activeIdEl.textContent && !activeIdEl.textContent.includes('—')) {
            const m = activeIdEl.textContent.match(/JH-\d{4}-\d+/i);
            const rawId = m ? m[0] : activeIdEl.textContent.replace(/^Report ID:\s*/i, '').trim();
            const titleTxt = activeTitleEl ? activeTitleEl.textContent.trim() : '';

            if (rawId && rawId.length > 3 && titleTxt && !titleTxt.includes('No Grievances Reported') && !titleTxt.includes('कोई समस्या दर्ज नहीं')) {
              recentReport = {
                id: rawId,
                title: titleTxt,
                location: activeLocEl ? activeLocEl.textContent.replace('📍', '').trim() : 'Jharkhand',
                status: activeStatusEl ? activeStatusEl.textContent.trim() : 'Pending Admin Verification',
                assign: 'JanSetu Taskforce',
                description: (activeDescEl && activeDescEl.textContent && activeDescEl.textContent !== '--') ? activeDescEl.textContent.trim() : titleTxt,
                dateStr: (activeDateEl && activeDateEl.textContent && activeDateEl.textContent !== '--') ? activeDateEl.textContent.trim() : '',
                timeAgo: '2 ghante pehle'
              };
            }
          }
        }

        // Priority 4: Check DOM Recent Reports Carousel (#recentReportsContainerList .report-square-card)
        if (!recentReport) {
          const firstSquareCard = document.querySelector('#recentReportsContainerList .report-square-card');
          if (firstSquareCard) {
            const idEl = firstSquareCard.querySelector('.square-card-id');
            const titleEl = firstSquareCard.querySelector('.square-card-title');
            const locEl = firstSquareCard.querySelector('.square-card-loc');
            const timeEl = firstSquareCard.querySelector('.square-card-time');
            const statusEl = firstSquareCard.querySelector('.square-status-badge');
            const descEl = firstSquareCard.querySelector('.square-card-body div');

            if (idEl && idEl.textContent.trim()) {
              recentReport = {
                id: idEl.textContent.trim(),
                title: titleEl ? titleEl.textContent.trim() : 'नागरिक शिकायत',
                location: locEl ? locEl.textContent.replace('📍', '').trim() : 'Jharkhand',
                status: statusEl ? statusEl.textContent.trim() : 'Submitted',
                timeAgo: timeEl ? timeEl.textContent.trim() : '2 ghante pehle',
                description: descEl ? descEl.textContent.trim() : (titleEl ? titleEl.textContent.trim() : ''),
                assign: 'JanSetu Taskforce'
              };
            }
          }
        }

        // Priority 5: Check authenticated user's reports in localStorage
        if (!recentReport) {
          let currentUserId = 'guest';
          try {
            const uRaw = localStorage.getItem('is_user') || localStorage.getItem('user');
            if (uRaw) {
              const u = JSON.parse(uRaw);
              currentUserId = u.id || u._id || u.email || 'guest';
            }
          } catch (e) {}

          const candidates = [
            `jansetu_reports_${currentUserId}`,
            'jansetu_reports_guest',
            'jansetu_reports'
          ];

          for (const key of candidates) {
            try {
              const val = localStorage.getItem(key);
              if (val) {
                const list = JSON.parse(val);
                if (Array.isArray(list) && list.length > 0) {
                  const sorted = [...list].sort((a, b) => {
                    const tB = new Date(b.createdAt || b.submittedDate || 0).getTime();
                    const tA = new Date(a.createdAt || a.submittedDate || 0).getTime();
                    return tB - tA;
                  });
                  if (sorted[0] && (sorted[0].id || sorted[0].challengeId)) {
                    recentReport = sorted[0];
                    break;
                  }
                }
              }
            } catch (e) {}
          }
        }

        // Priority 6: Check all jansetu_reports_* in localStorage
        if (!recentReport) {
          const allFound = [];
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith('jansetu_reports')) {
              try {
                const list = JSON.parse(localStorage.getItem(k));
                if (Array.isArray(list)) {
                  list.forEach(r => {
                    if (r && (r.id || r.challengeId)) allFound.push(r);
                  });
                }
              } catch (e) {}
            }
          }
          if (allFound.length > 0) {
            allFound.sort((a, b) => {
              const tB = new Date(b.createdAt || b.submittedDate || 0).getTime();
              const tA = new Date(a.createdAt || a.submittedDate || 0).getTime();
              return tB - tA;
            });
            recentReport = allFound[0];
          }
        }

        // Priority 7: Check last saved report key in localStorage
        if (!recentReport) {
          try {
            const lastSavedRaw = localStorage.getItem('jansetu_last_report');
            if (lastSavedRaw) {
              const parsed = JSON.parse(lastSavedRaw);
              if (parsed && (parsed.id || parsed.challengeId)) {
                recentReport = parsed;
              }
            }
          } catch (e) {}
        }
      }
    } catch (e) {
      console.warn('[VoiceAgent] Error detecting recent report:', e);
    }

    if (!recentReport) {
      setPhase('tracking_input');
      setTrackedResult(null);
      const isHi = lang === 'hi' || lang === 'hinglish';
      const noRepSpeech = isHi
        ? 'Aapki koi darj shikayat nahi mili. Kripya samasya darj karein ya niche field me problem number likh kar bheje.'
        : 'No registered report found. Please report a problem or type your problem number below.';
      speak(noRepSpeech);
      setTimeout(() => {
        const el = document.getElementById('voiceTrackingInput');
        if (el) el.focus();
      }, 300);
      return;
    }

    const recentId = recentReport.id || recentReport.challengeId;
    const recentTitle = recentReport.title || 'नागरिक शिकायत';
    const recentLoc = recentReport.location || recentReport.district || 'Jharkhand';
    const recentStatus = recentReport.status || 'Pending Admin Verification';
    const recentAssign = recentReport.assign || 'JanSetu Taskforce';
    const recentDesc = recentReport.description || recentReport.desc || recentReport.details || recentTitle;
    const recentTime = recentReport.timeAgo || '2 ghante pehle';

    recentReport.id = recentId;
    recentReport.title = recentTitle;
    recentReport.location = recentLoc;
    recentReport.status = recentStatus;
    recentReport.assign = recentAssign;
    recentReport.description = recentDesc;
    recentReport.timeAgo = recentTime;

    const rawStat = (recentStatus || 'submitted').toLowerCase();
    const isResolved = rawStat.includes('solve') || rawStat.includes('resolved') || rawStat.includes('closed');
    const isInProgress = rawStat.includes('progress') || rawStat.includes('work') || rawStat.includes('assign') || rawStat.includes('valid');

    // 1. Build & speak exact sequence: Problem number -> Title -> 2 ghante pehle -> Place -> 6-7 word brief -> Admin pending
    const speech = buildReportDetailedSpeech(recentReport, lang, true);
    speak(speech);

    // 2. Display recent problem in the tracker card & fill input with full date & pending status
    setRecentReportId(recentId);
    setTrackingIdInput(recentId);
    setTrackedResult({
      id: recentId,
      title: recentTitle,
      location: recentLoc,
      status: recentStatus,
      assign: recentAssign,
      description: recentReport.description,
      timeAgo: recentReport.timeAgo,
      dateFormatted: recentReport.dateFormatted || recentReport.dateStr || '13 September 2026, 03:01 AM',
      isWorking: isInProgress,
      isResolved
    });
    setPhase('tracking_input');

    // 3. Highlight and sync active tracker on the citizen dashboard
    if (typeof window.trackSpecificReport === 'function') {
      try { window.trackSpecificReport(recentId); } catch (e) {}
    }

    setTimeout(() => {
      const el = document.getElementById('voiceTrackingInput');
      if (el) el.focus();
    }, 300);
  };

  // Backward compatibility alias
  const handleCheckStatusAction = (text = '') => {
    handleOpenTrackingInput();
  };

  // Step 1c: Query Database and Local Reports by any Report Number
  const handleTrackReportById = async (customId) => {
    const rawId = (customId || trackingIdInput || '').trim();
    if (!rawId) {
      speak(isHindi ? 'Kripya koi shikayat number enter karein.' : 'Please enter a valid report number.');
      return;
    }

    setIsTrackingLoading(true);
    speak(isHindi ? `Shikayat number ${rawId} database me dhoondh rahe hain...` : `Searching report ${rawId} in database...`);

    let foundReport = null;

    // 1. Check local dashboard reports first (window.allReportsList, localStorage, DOM)
    try {
      if (typeof window !== 'undefined') {
        const matchClean = rawId.toLowerCase().replace(/[^a-z0-9]/g, '');

        // Search window.allReportsList
        if (Array.isArray(window.allReportsList)) {
          foundReport = window.allReportsList.find(r => {
            const rid = (r.id || r.challengeId || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            return rid.includes(matchClean) || matchClean.includes(rid);
          });
        }

        // Search localStorage keys
        if (!foundReport) {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('jansetu_reports') || key.includes('community_pool') || key.includes('myReports'))) {
              try {
                const list = JSON.parse(localStorage.getItem(key));
                if (Array.isArray(list)) {
                  const match = list.find(r => {
                    const rid = (r.id || r.challengeId || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                    return rid.includes(matchClean) || matchClean.includes(rid);
                  });
                  if (match) {
                    foundReport = match;
                    break;
                  }
                }
              } catch (e) {}
            }
          }
        }
      }
    } catch (e) {
      console.warn('[VoiceAgent] Local search error:', e);
    }

    // 2. Query Server Database API: /api/voice-agent/status-inquiry
    try {
      const res = await fetch('/api/voice-agent/status-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackingId: rawId })
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.found && data.challenge) {
          foundReport = {
            id: data.challenge.id || rawId,
            title: data.challenge.title || (foundReport ? foundReport.title : 'नागरिक शिकायत'),
            location: data.challenge.location || (foundReport ? foundReport.location : 'Jharkhand'),
            status: data.challenge.status || (foundReport ? foundReport.status : 'Submitted'),
            category: data.challenge.category || (foundReport ? foundReport.category : 'Public Infrastructure'),
            assign: data.challenge.assign || 'JanSetu Taskforce'
          };
        }
      }
    } catch (e) {
      console.warn('[VoiceAgent] Server status inquiry error:', e);
    }

    // 3. Fallback: Query /api/challenges/:id
    if (!foundReport) {
      try {
        const cRes = await fetch(`/api/challenges/${encodeURIComponent(rawId)}`);
        if (cRes.ok) {
          const cData = await cRes.json();
          if (cData && (cData.data || cData.challenge)) {
            const ch = cData.data || cData.challenge;
            foundReport = {
              id: ch.challengeId || rawId,
              title: ch.title || 'नागरिक शिकायत',
              location: ch.location?.district || ch.location?.address || 'Jharkhand',
              status: ch.status || 'Submitted',
              category: ch.category || 'Public Infrastructure',
              assign: ch.assignedUniversity?.name || 'JanSetu Taskforce'
            };
          }
        }
      } catch (e) {}
    }

    setIsTrackingLoading(false);

    if (foundReport) {
      const repId = foundReport.id || foundReport.challengeId || rawId;
      const repTitle = foundReport.title || 'नागरिक शिकायत';
      const repLoc = foundReport.location || foundReport.district || 'Ranchi, Jharkhand';
      const repStatus = foundReport.status || 'Submitted';
      const repAssign = foundReport.assign || 'JanSetu Taskforce';

      const rawStat = repStatus.toLowerCase();
      const isResolved = rawStat.includes('solve') || rawStat.includes('resolved') || rawStat.includes('closed');
      const isInProgress = rawStat.includes('progress') || rawStat.includes('work') || rawStat.includes('assign') || rawStat.includes('valid');

      // Build & speak tracker details for searched report
      const speech = buildReportDetailedSpeech(foundReport, lang, false);
      speak(speech);

      setTrackedResult({
        id: repId,
        title: repTitle,
        location: repLoc,
        status: repStatus,
        assign: repAssign,
        description: foundReport.description || foundReport.desc,
        timeAgo: foundReport.timeAgo,
        dateFormatted: foundReport.dateFormatted || foundReport.dateStr || '13 September 2026, 03:01 AM',
        isWorking: isInProgress,
        isResolved
      });

      // Highlight and sync active tracker on the citizen dashboard
      if (typeof window.trackSpecificReport === 'function') {
        try { window.trackSpecificReport(repId); } catch (e) {}
      }
    } else {
      setTrackedResult({
        error: true,
        id: rawId,
        message: isHindi ? `Shikayat number "${rawId}" database me nahi mili.` : `Report number "${rawId}" not found in database.`
      });
      const speech = isHindi
        ? `Shikayat number ${rawId} database me nahi mili. Kripya apna report number dubara check karein.`
        : `Report number ${rawId} was not found in the database. Please verify the tracking number.`;
      speak(speech);
    }
  };

  // Step 1d: Toggle Nearby Reports (Select / Deselect button & close card)
  const handleToggleNearbyReports = () => {
    if (showNearbyView) {
      // Dubara click: Deselect button, close cards container, and immediately stop speaking!
      setShowNearbyView(false);
      stopSpeaking();
      setVoiceStatus('listening');
    } else {
      handleFetchAndSpeakNearbyReports();
    }
  };

  // Step 1e: Fetch Nearby Reports and AI Speech with Citizen Names, 3-4 Problem Titles, Time Ago, Brief & Tracker Status
  const handleFetchAndSpeakNearbyReports = async () => {
    setIsNearbyLoading(true);
    setShowNearbyView(true);

    let list = [];
    try {
      let lat = 23.3441;
      let lng = 85.3096;
      if (typeof window !== 'undefined' && window.currentLocation && window.currentLocation.lat && window.currentLocation.lng) {
        lat = window.currentLocation.lat;
        lng = window.currentLocation.lng;
      }

      const res = await fetch(`/api/challenges/feed?lat=${lat}&lng=${lng}&radius=25&limit=4&sort=recent`);
      if (res.ok) {
        const json = await res.json();
        if (json && Array.isArray(json.data) && json.data.length > 0) {
          list = json.data;
        }
      }
    } catch (e) {
      console.warn('[VoiceAgent] Error fetching nearby challenges:', e);
    }

    // Comprehensive fallback if offline or fewer than 3 items
    if (!list || list.length < 3) {
      list = [
        {
          challengeId: 'JH-2026-749065',
          title: 'ट्रांसफॉर्मर खराब / बिजली आपूर्ति',
          authorName: 'Rajesh Mahto',
          description: 'गांव में बिजली का ट्रांसफॉर्मर 2 दिन से खराब है और बिजली गुल है',
          status: 'submitted',
          distanceKm: 1.4,
          createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
          displayLocation: 'Ranchi, Jharkhand'
        },
        {
          challengeId: 'JH-2026-776912',
          title: 'Drinking Water Pipeline Leakage',
          authorName: 'Pooja Oraon',
          description: 'मेन पाइपलाइन टूटने से सड़क पर पानी बह रहा है और पीने का पानी नहीं आ रहा',
          status: 'assigned',
          distanceKm: 1.7,
          createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
          displayLocation: 'Ranchi, Jharkhand'
        },
        {
          challengeId: 'JH-2026-726114',
          title: 'Damaged Main Road with Potholes',
          authorName: 'Amit Kumar',
          description: 'मुख्य मार्ग पर गहरे गड्ढों के कारण आए दिन दुर्घटनाएं हो रही हैं',
          status: 'in_progress',
          distanceKm: 2.1,
          createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
          displayLocation: 'Ranchi, Jharkhand'
        },
        {
          challengeId: 'JH-2026-253509',
          title: 'Panchayat Health Center Medicine Shortage',
          authorName: 'Sunita Devi',
          description: 'पंचायत स्वास्थ्य केंद्र में जरूरी दवाइयों और डॉक्टर की अनुपलब्धता',
          status: 'submitted',
          distanceKm: 2.8,
          createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
          displayLocation: 'Ranchi, Jharkhand'
        }
      ];
    }

    const topReports = list.slice(0, 4);
    setNearbyChallengesList(topReports);
    setIsNearbyLoading(false);

    // Extract 2-3 distinct citizen names who benefited
    const rawNames = topReports.map(c => c.authorName || 'नागरिक').filter(n => n && !n.toLowerCase().includes('anonymous'));
    const distinctNames = [...new Set(rawNames)];
    if (distinctNames.length < 2) {
      distinctNames.push('Rajesh Mahto', 'Pooja Oraon', 'Amit Kumar');
    }
    const distinctSlice = distinctNames.slice(0, 3);
    const namesSpokenHi = distinctSlice.map(n => n.endsWith('ji') ? n : `${n} ji`).join(', ');
    const namesSpokenEn = distinctSlice.join(', ');

    // Top 3 reports for concise, natural speech synthesis (~400 chars)
    const speechReports = topReports.slice(0, 3).map((item, idx) => {
      const author = item.authorName || 'नागरिक';
      const title = item.title || 'नागरिक समस्या';

      let timeHi = '2 ghante pehle';
      let timeEn = '2 hours ago';
      if (item.createdAt) {
        try {
          const d = new Date(item.createdAt);
          const diffMs = Date.now() - d.getTime();
          const diffHours = Math.round(diffMs / 3600000);
          const diffDays = Math.round(diffMs / 86400000);
          if (diffHours < 1) {
            timeHi = 'kuch der pehle';
            timeEn = 'a short while ago';
          } else if (diffHours < 24) {
            timeHi = `${diffHours} ghante pehle`;
            timeEn = `${diffHours} hours ago`;
          } else if (diffDays === 1) {
            timeHi = 'kal';
            timeEn = 'yesterday';
          } else {
            timeHi = `${diffDays} din pehle`;
            timeEn = `${diffDays} days ago`;
          }
        } catch (e) {}
      }

      // 6-7 words brief
      const words = (item.description || item.title || '').trim().split(/\s+/).filter(Boolean);
      const brief = words.slice(0, 6).join(' ') + (words.length > 6 ? '...' : '');

      // Tracker status detail
      const rawStat = (item.status || 'submitted').toLowerCase();
      let trackerHi = 'Stage 1 Submitted — Admin verification pending hai';
      let trackerEn = 'Stage 1 Submitted — Pending admin verification';

      if (rawStat.includes('solve') || rawStat.includes('resolved') || rawStat.includes('closed')) {
        trackerHi = 'Stage 3 Resolved — Samadhan ho chuka hai';
        trackerEn = 'Stage 3 Resolved — Successfully resolved';
      } else if (rawStat.includes('progress') || rawStat.includes('work')) {
        trackerHi = 'Stage 3 In Progress — Ground taskforce karyawahi kar rahi hai';
        trackerEn = 'Stage 3 In Progress — Field team is actively resolving';
      } else if (rawStat.includes('assign') || rawStat.includes('verified') || rawStat.includes('valid')) {
        trackerHi = 'Stage 2 Admin Verified — Team assign ho chuki hai';
        trackerEn = 'Stage 2 Admin Verified — Team assigned';
      }

      return {
        author,
        title,
        timeHi,
        timeEn,
        brief,
        trackerHi,
        trackerEn
      };
    });

    const isHi = lang === 'hi' || lang === 'hinglish';
    let speech = '';

    if (isHi) {
      const reportsLines = speechReports.map((p, i) => {
        const numLbl = i === 0 ? 'Pehli' : i === 1 ? 'Dusri' : 'Teesri';
        return `${numLbl} samasya, ${p.author} ji dwara: "${p.title}", jo ${p.timeHi} darj hui, brief: "${p.brief}", tracker status: ${p.trackerHi}.`;
      }).join(' ');

      speech = `Aapke aas-paas ke ilaqe me bahut log JanSetu ka istemal kar rahe hain aur unko seedha benefit mil raha hai, jaise ${namesSpokenHi}. Haal hi ki shikayatein: ${reportsLines} JanSetu ke madhyam se aapke pados ke sabhi nagrikon ki samasyaayein bina kisi bichauliye ke seedhe prashasan tak pahunch rahi hain aur tezi se samadhan ho raha hai.`;
      speak(speech, 'hi-IN');
    } else {
      const reportsLinesEn = speechReports.map((p, i) => {
        const numLbl = i === 0 ? 'First' : i === 1 ? 'Second' : 'Third';
        return `${numLbl} report, by ${p.author}: "${p.title}", reported ${p.timeEn}, brief: "${p.brief}", tracker status: ${p.trackerEn}.`;
      }).join(' ');

      speech = `Many residents in your nearby area are actively using JanSetu and benefiting directly, such as ${namesSpokenEn}. Recent nearby reports: ${reportsLinesEn} Through JanSetu, local grievances reach authorities directly with transparent live tracking and prompt resolutions.`;
      speak(speech, 'en-IN');
    }
  };

  // Step 2: "Report Problem" trigger
  const handleReportProblemAction = () => {
    setIsInitialCardOpen(false);
    setPhase('driving_category');
    hasAcknowledgedMediaRef.current = false;

    setCursorPos({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    setCursorVisible(true);

    // Animate white dot to "+ समस्या दर्ज करें" button and open real modal
    setTimeout(() => {
      animateCursorToAndClick('.btn-report-hero, .btn-sidebar-report', () => {
        setTimeout(() => {
          const prompt = lang === 'en'
            ? 'I am ready to help you report. Please describe what problem you are facing in your area?'
            : 'Ji batayiye, aapke ilaqe me kya samasya aa rahi hai? Main sun raha hoon.';
          speak(prompt);
        }, 300);
      }, 300);
    }, 200);
  };

  // Mute Toggle — ONLY mutes citizen microphone, agent keeps speaking & auto-driving
  const handleToggleMute = () => {
    setIsMuted(prev => {
      const next = !prev;
      if (next) {
        // ONLY stop mic input — DO NOT stop speaking!
        // Agent continues speaking and auto-driving the form
        if (!isSpeakingRef.current) {
          setVoiceStatus('active');
        }
        if (recognitionRef.current) {
          try { recognitionRef.current.stop(); } catch (e) {}
        }
      } else {
        lastInteractionTimeRef.current = Date.now();
        setVoiceStatus(isSpeakingRef.current ? 'speaking' : 'listening');
        if (recognitionRef.current) {
          try { recognitionRef.current.start(); } catch (e) {}
        }
      }
      return next;
    });
  };

  // End Call / Disconnect
  const handleEndCall = () => {
    if (isCallActiveRef.current) {
      playCallEndSound();
    }
    isCallActiveRef.current = false;
    stopSpeaking();
    stopMicVolumeMonitor();
    if (timerRef.current) clearInterval(timerRef.current);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    if (socketRef.current) {
      try { socketRef.current.close(); } catch (e) {}
      socketRef.current = null;
    }
    setCursorVisible(false);
    setIsCallActive(false);
    onClose();
  };

  // Initialize Session
  useEffect(() => {
    if (!isOpen) {
      handleEndCall();
      return;
    }

    playCallConnectSound();
    isCallActiveRef.current = true;
    lastInteractionTimeRef.current = Date.now();
    silencePromptCountRef.current = 0;
    setIsCallActive(true);
    setIsInitialCardOpen(true);
    setPhase('intro_lang');
    setCallDuration(0);
    setCursorVisible(false);

    // Pre-warm audio subsystem and pre-fetch initial dialogues for 0ms latency
    prewarmAudio();
    prefetchSpeech('Aapko kya samasya aa rahi hai? Batayiye, main sun raha hoon.', 'hi');
    prefetchSpeech('Please describe your problem in detail. What is happening and where?', 'en');
    prefetchSpeech('Bahut accha! Batayiye, main aapki kya madad kar sakta hoon? Aap nayi samasya report kar sakte hain ya purani shikayat ki sthiti jaanch sakte hain.', 'hi');
    prefetchSpeech('Theek hai, maine category chun li hai aur aapki samasya note kar li hai. Ye kitni zaroori hai — Urgent, High, ya Normal?', 'hi');
    prefetchSpeech('Aapki aawaz sunai nahi di, kripya dobara bolein.', 'hi');

    timerRef.current = setInterval(() => {
      setCallDuration(p => p + 1);
    }, 1000);

    // Connect to WebSocket relay
    connectWebSocket();

    const activeInitialLang = (typeof window !== 'undefined' && (localStorage.getItem('jansetu_language') === 'hi' || localStorage.getItem('jansetu_language') === 'hinglish')) ? 'hinglish' : 'en';
    if (activeInitialLang === 'hinglish') {
      speak('Hi! Main JanSetu AI hoon. Aap kis bhasha me baat karna chahenge — English ya Hinglish?');
    } else {
      speak('Hello! I am JanSetu AI. Which language would you prefer to speak — English or Hindi?');
    }
    initSpeechRecognition();

    return () => {
      stopSpeaking();
      if (timerRef.current) clearInterval(timerRef.current);
      if (speechDebounceRef.current) clearTimeout(speechDebounceRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      if (socketRef.current) {
        try { socketRef.current.close(); } catch (e) {}
      }
    };
  }, [isOpen]);

  if (!isOpen || !isCallActive) return null;

  // Render Live Status Pill between Mute and End Call
  const renderStatusPill = () => {
    const currentStatus = isSpeakingRef.current ? 'speaking' : (isMuted ? 'active' : voiceStatus);

    return (
      <div className={`floating-dock-status-pill ${currentStatus}`}>
        <div className={`status-wave-animation ${currentStatus}`}>
          <span className="wave-line w1" style={{ transform: liveVolume > 0 ? `scaleY(${0.5 + liveVolume * 2.5})` : undefined }} />
          <span className="wave-line w2" style={{ transform: liveVolume > 0 ? `scaleY(${0.7 + liveVolume * 3.2})` : undefined }} />
          <span className="wave-line w3" style={{ transform: liveVolume > 0 ? `scaleY(${0.6 + liveVolume * 2.8})` : undefined }} />
          <span className="wave-line w4" style={{ transform: liveVolume > 0 ? `scaleY(${0.4 + liveVolume * 2.0})` : undefined }} />
        </div>
        <div className="status-label-box">
          <span className="status-badge-text">
            {isSpeakingRef.current ? 'Speaking...' : (
              isMuted ? 'Agent Active' : (
                voiceStatus === 'processing' ? 'Processing...' : 'Listening...'
              )
            )}
          </span>
          <span className="status-badge-sub">
            {isMuted ? '🤖 Agent active • Mic band' : (
              voiceStatus === 'speaking' ? 'AI bol rahi hai' :
              voiceStatus === 'processing' ? 'Samajh rahi hoon...' : 'Aap boliye...'
            )}
          </span>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* ── 1. ANTIGRAVITY BLUE GLOWING SCREEN PERIMETER AURA ── */}
      <div className="antigravity-voice-overlay" aria-hidden="true" />

      {/* ── 2. ANIMATED GLOWING WHITE DOT VIRTUAL CURSOR ── */}
      {cursorVisible && (
        <div
          className="ai-virtual-cursor-container"
          style={{
            left: `${cursorPos.x}px`,
            top: `${cursorPos.y}px`
          }}
        >
          <div className="ai-cursor-white-dot">
            <div className={`ai-cursor-ripple-ring ${cursorClicking ? 'clicking' : ''}`} />
          </div>
        </div>
      )}

      {/* ── 3. INITIAL DIALOGUE CARD (STEPS 1 & 2 ONLY - CLOSES ON REPORT ACTION) ── */}
      {isInitialCardOpen && (
        <div className="voice-agent-backdrop" onClick={(e) => { if (e.target === e.currentTarget) handleEndCall(); }}>
          <div className="voice-agent-modal-v2" role="dialog" aria-modal="true">
            
            {/* Top Navy Glassmorphism Header */}
            <div className="voice-header-v2">
              <div className="voice-header-left">
                <div className="voice-header-avatar-wrap">
                  <div className="voice-header-avatar-orb">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" fill="rgba(255,255,255,0.2)"/>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" y1="19" x2="12" y2="22" />
                    </svg>
                  </div>
                  <span className="voice-header-live-dot" />
                </div>

                <div className="voice-header-title-group">
                  <div className="voice-header-main-row">
                    <span className="voice-header-title">JanSetu Voice AI</span>
                    <span className="voice-header-powered-badge">SARVAM AI POWERED</span>
                  </div>
                  <div className="voice-header-sub-row">
                    <span className="voice-header-live-indicator"><span className="live-pulse-dot" /> Live</span>
                    <span className="voice-header-divider">|</span>
                    <span className="voice-header-tag">बोलकर रिपोर्ट करें</span>
                  </div>
                </div>
              </div>

              <div className="voice-header-right">
                <div className="header-visualizer-block">
                  <div className="header-soundwave-bars" aria-hidden="true">
                    <span className="h-bar hb1" />
                    <span className="h-bar hb2" />
                    <span className="h-bar hb3" />
                    <span className="h-bar hb4" />
                    <span className="h-bar hb5" />
                    <span className="h-bar hb6" />
                    <span className="h-bar hb7" />
                    <span className="h-bar hb8" />
                    <span className="h-bar hb9" />
                    <span className="h-bar hb10" />
                  </div>
                  <div className="header-slogan-wrap">
                    <span className="header-slogan-text">Aapki aawaaz, Behtar Jharkhand</span>
                    <svg className="tricolor-curve" viewBox="0 0 130 6" fill="none">
                      <path d="M2 3 Q65 6 128 3" stroke="url(#tricolorGrad)" strokeWidth="3" strokeLinecap="round"/>
                      <defs>
                        <linearGradient id="tricolorGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#FF9933" />
                          <stop offset="50%" stopColor="#FFFFFF" />
                          <stop offset="100%" stopColor="#138808" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                </div>

                <div className="header-window-actions">
                  <button
                    type="button"
                    className="header-ctrl-btn"
                    onClick={() => setIsInitialCardOpen(false)}
                    title="Minimize"
                    aria-label="Minimize"
                  >
                    −
                  </button>
                  <button
                    type="button"
                    className="header-ctrl-btn"
                    onClick={handleEndCall}
                    title="Close Call"
                    aria-label="Close Call"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>

            {/* White Interior Body */}
            <div className="voice-modal-interior">
              {/* AI Greeting / Transcript Speech Bubble — Only shown during intro_lang */}
              {phase === 'intro_lang' && (
                <div className="voice-speech-bubble-row">
                  <div className="voice-speech-ai-avatar">
                    <span>AI</span>
                    <div className="avatar-live-pulse-ring" />
                  </div>
                  <div className="voice-speech-bubble-content">
                    <div className="voice-speech-ai-badge">
                      <span className="sparkle-dot">✨</span>
                      <span>JanSetu Citizen AI Assistant</span>
                      <span className="model-chip">Sarvam 105B</span>
                    </div>
                    <div className="voice-speech-bubble-greeting">
                      {isHindi ? 'नमस्ते! मैं जनसेतु AI सहायक हूँ।' : 'Hello! I am JanSetu AI Assistant.'}
                    </div>
                    <div className="voice-speech-bubble-prompt">
                      {agentSpeech || (isHindi ? 'आप किस भाषा में बात करना चाहेंगे — English या Hindi?' : 'Which language would you prefer to speak — English or Hindi?')}
                    </div>
                    {userTranscript && (
                      <div className="voice-speech-user-preview">
                        <span className="user-icon">🗣️</span>
                        <span className="user-quote">"{userTranscript}"</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Agent Activity Status Bar */}
              {agentActivity && (
                <div className="voice-agent-activity-bar">
                  <span className="agent-activity-pulse" />
                  <span className="agent-activity-text">{agentActivity}</span>
                </div>
              )}

              {/* Live Conversation Transcript Panel — Only show during ongoing conversation */}
              {phase !== 'intro_lang' && chatTranscript.length > 0 && (
                <div className="voice-chat-transcript-panel">
                  <div className="transcript-panel-header">
                    <div className="transcript-header-left">
                      <span className="transcript-live-dot" />
                      <span className="transcript-panel-title">Live Transcript</span>
                    </div>
                  </div>
                  <div className="transcript-scroll-area">
                    {chatTranscript.slice(-3).map((msg, i) => (
                      <div key={i} className={`transcript-bubble ${msg.role}`}>
                        <span className="transcript-bubble-avatar">{msg.role === 'ai' ? '🤖' : '👤'}</span>
                        <div className="transcript-bubble-content">
                          <span className="transcript-bubble-text">{msg.text}</span>
                          <div className="transcript-bubble-footer">
                            <span className="transcript-bubble-time">{msg.time}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={transcriptEndRef} />
                  </div>
                </div>
              )}

              {/* Dynamic Content: Language Choice vs Assistance Choice */}
              {phase === 'intro_lang' && (
                <div className="voice-lang-section">
                  <div className="voice-section-title-wrap">
                    <div className="voice-section-title">
                      <span className="globe-icon">🌐</span>
                      <span>{isHindi ? 'अपनी भाषा चुनें / Choose Language' : 'Choose Your Preferred Language'}</span>
                    </div>
                    <div className="voice-section-subtitle">
                      {isHindi ? 'आप बोल सकते हैं: "English" या "Hindi"' : 'You can speak naturally: "English" or "Hindi"'}
                    </div>
                  </div>

                  <div className="voice-lang-cards-grid">
                    {/* Hinglish Card */}
                    <div
                      id="langCardHinglish"
                      className={`voice-lang-card ${lang === 'hinglish' || lang === 'hi' ? 'selected' : ''}`}
                      onClick={() => handleSelectLanguage('hinglish')}
                    >
                      <div className="voice-lang-card-main">
                        <div className="voice-country-badge in-badge">
                          <span>🇮🇳</span>
                        </div>
                        <div className="voice-lang-texts">
                          <div className="voice-lang-primary-title">
                            <span>Hinglish</span>
                            {(lang === 'hinglish' || lang === 'hi') && (
                              <span className="lang-active-tag">Active</span>
                            )}
                          </div>
                          <div className="voice-lang-desc">Hindi + English me baat karein</div>
                        </div>
                      </div>

                      <div className="voice-lang-card-right">
                        {(lang === 'hinglish' || lang === 'hi') ? (
                          <div className="voice-card-check-badge">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </div>
                        ) : (
                          <div className="voice-card-radio-circle" />
                        )}
                      </div>
                    </div>

                    {/* English Card */}
                    <div
                      id="langCardEn"
                      className={`voice-lang-card ${lang === 'en' ? 'selected' : ''}`}
                      onClick={() => handleSelectLanguage('en')}
                    >
                      <div className="voice-lang-card-main">
                        <div className="voice-country-badge gb-badge">
                          <span>🇬🇧</span>
                        </div>
                        <div className="voice-lang-texts">
                          <div className="voice-lang-primary-title">
                            <span>English</span>
                            {lang === 'en' && (
                              <span className="lang-active-tag">Active</span>
                            )}
                          </div>
                          <div className="voice-lang-desc">Speak &amp; report in English</div>
                        </div>
                      </div>

                      <div className="voice-lang-card-right">
                        {lang === 'en' ? (
                          <div className="voice-card-check-badge">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </div>
                        ) : (
                          <div className="voice-card-radio-circle" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {phase === 'assistance_choice' && (
                <div className="voice-assistance-section">
                  <div className="voice-section-title-wrap">
                    <div className="voice-section-title">
                      <span className="globe-icon">🤝</span>
                      <span>{isHindi ? 'जनसेतु सहायता / How Can I Help?' : 'JanSetu Assistance / How Can I Help?'}</span>
                    </div>
                    <div className="voice-section-subtitle">
                      {isHindi ? 'आप बोल सकते हैं: "मुझे समस्या दर्ज करनी है"' : 'You can say: "I want to report a problem"'}
                    </div>
                  </div>

                  <div className="white-action-grid">
                    <div
                      id="actionCardReport"
                      className="action-card-white"
                      onClick={handleReportProblemAction}
                    >
                      <div className="action-icon-pill">📝</div>
                      <div className="action-card-title">
                        {isHindi ? 'समस्या दर्ज करें' : 'Report a Problem'}
                      </div>
                      <div className="action-card-sub">
                        {isHindi ? 'नागरिक शिकायत दर्ज करें (सड़क, नाला, पानी, कचरा)' : 'Report a Civic Grievance (Road, Drainage, Water, Garbage)'}
                      </div>
                    </div>

                    <div
                      id="actionCardStatus"
                      className="action-card-white"
                      onClick={handleOpenTrackingInput}
                    >
                      <div className="action-icon-pill" style={{ background: '#FEF3C7', color: '#D97706' }}>🔍</div>
                      <div className="action-card-title">
                        {isHindi ? 'स्थिति जांचें' : 'Track Status'}
                      </div>
                      <div className="action-card-sub">
                        {isHindi ? 'दर्ज शिकायत ट्रैक करें (Status & Action taken)' : 'Track Existing Report (Status & Action taken)'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 1b: Tracking Input Section — allows typing or speaking any report number */}
              {phase === 'tracking_input' && (
                <div className="voice-tracking-section">
                  {/* Top Header Row with Grievance Tracker on Left and Nearby Button on Right (Above Send Button) */}
                  <div className="voice-tracking-header-row">
                    <div className="voice-section-title-wrap">
                      <div className="voice-section-title">
                        <span className="globe-icon">🔍</span>
                        <span>{isHindi ? 'शिकायत ट्रैकर / Track Grievance' : 'Grievance Tracker / Status Inquiry'}</span>
                      </div>
                      <div className="voice-section-subtitle">
                        {isHindi ? 'प्रॉब्लम नंबर बताइए या नीचे फ़ील्ड में लिख कर भेजें' : 'Please say your problem number or type and send it below'}
                      </div>
                    </div>

                    {/* Nearby Button placed directly above the Send button */}
                    <button
                      id="btnVoiceNearbyReports"
                      type="button"
                      className={`voice-nearby-top-btn ${isNearbyLoading ? 'loading' : ''} ${showNearbyView ? 'active' : ''}`}
                      onClick={handleToggleNearbyReports}
                      disabled={isNearbyLoading}
                      title={showNearbyView ? (isHindi ? "आस-पास की शिकायतें बंद करें" : "Close Nearby Reports") : (isHindi ? "आस-पास की शिकायतें और JanSetu के फायदे सुनें" : "Hear Nearby Reports & JanSetu Benefits")}
                    >
                      {isNearbyLoading ? (
                        <span className="tracking-spinner" style={{ width: 13, height: 13 }} />
                      ) : (
                        <span className="nearby-pulse-dot" />
                      )}
                      <span className="nearby-btn-icon">📍</span>
                      <span className="nearby-btn-text">
                        {isNearbyLoading 
                          ? (isHindi ? 'लोड हो रहा है...' : 'Loading...')
                          : showNearbyView
                            ? (isHindi ? 'आस-पास एक्टिव ✕' : 'Nearby Active ✕')
                            : (isHindi ? 'आस-पास की शिकायतें' : 'Nearby Reports')}
                      </span>
                    </button>
                  </div>

                  {/* Input Box with Send Button */}
                  <div className="voice-tracking-input-box">
                    <div className="voice-tracking-input-wrap">
                      <span className="voice-tracking-input-icon">#</span>
                      <input
                        id="voiceTrackingInput"
                        type="text"
                        className="voice-tracking-input-field"
                        placeholder={isHindi ? "प्रॉब्लम नंबर लिखें (उदा. JH-2026-749065)..." : "Problem number (e.g. JH-2026-749065)..."}
                        value={trackingIdInput}
                        onChange={(e) => setTrackingIdInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleTrackReportById(trackingIdInput);
                          }
                        }}
                        autoFocus
                      />
                      {trackingIdInput && (
                        <button
                          type="button"
                          className="voice-tracking-clear-btn"
                          onClick={() => setTrackingIdInput('')}
                          title="Clear"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <button
                      id="btnVoiceTrackSubmit"
                      type="button"
                      className="voice-tracking-send-btn"
                      onClick={() => handleTrackReportById(trackingIdInput)}
                      disabled={isTrackingLoading}
                    >
                      {isTrackingLoading ? (
                        <span className="tracking-spinner" />
                      ) : (
                        <>
                          <span>{isHindi ? 'भेजें' : 'Send'}</span>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13" />
                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                          </svg>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Nearby Live Reports Section */}
                  {showNearbyView && nearbyChallengesList.length > 0 && (
                    <div className="voice-nearby-container">
                      <div className="voice-nearby-header">
                        <div className="voice-nearby-title-grp">
                          <span className="voice-nearby-badge">📍 {isHindi ? 'आस-पास लाइव' : 'Nearby Live'}</span>
                          <span className="voice-nearby-title">
                            {isHindi ? 'पड़ोस की शिकायतें एवं JanSetu लाभ' : 'Nearby Grievances & JanSetu Benefits'}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="voice-nearby-close-btn"
                          onClick={() => {
                            setShowNearbyView(false);
                            stopSpeaking();
                            setVoiceStatus('listening');
                          }}
                          title={isHindi ? "बंद करें" : "Close"}
                        >
                          ✕
                        </button>
                      </div>

                      <div className="voice-nearby-benefit-banner">
                        <span className="benefit-icon">✨</span>
                        <div className="benefit-text">
                          <strong>{isHindi ? 'JanSetu का सीधा लाभ:' : 'JanSetu Direct Benefit:'}</strong>{' '}
                          {isHindi 
                            ? 'आपके क्षेत्र में बहुत से नागरिक JanSetu का इस्तेमाल कर रहे हैं और समस्याएं सीधे प्रशासन तक पहुंच कर हल हो रही हैं।'
                            : 'Citizens in your vicinity are actively using JanSetu with issues reaching authorities directly for swift action.'}
                        </div>
                      </div>

                      <div className="voice-nearby-cards-grid">
                        {nearbyChallengesList.map((item, idx) => {
                          const repId = item.challengeId || item.officialSlipId || item._id || item.id || `JH-2026-${idx + 1}`;
                          const author = item.authorName || 'Verified Citizen';
                          const title = item.title || 'नागरिक शिकायत';
                          const words = (item.description || item.title || '').trim().split(/\s+/).filter(Boolean);
                          const brief = words.slice(0, 7).join(' ') + (words.length > 7 ? '...' : '');
                          const rawStat = (item.status || 'submitted').toLowerCase();
                          const distText = item.distanceKm ? `${item.distanceKm} km away` : 'Nearby';

                          let statusLabel = isHindi ? 'Admin सत्यापन लंबित' : 'Pending Verification';
                          let statusClass = 'pending';
                          if (rawStat.includes('solve') || rawStat.includes('resolved') || rawStat.includes('closed')) {
                            statusLabel = isHindi ? 'हल हो गया (Resolved)' : 'Resolved';
                            statusClass = 'resolved';
                          } else if (rawStat.includes('progress') || rawStat.includes('work')) {
                            statusLabel = isHindi ? 'कार्य प्रगति पर (In Progress)' : 'In Progress';
                            statusClass = 'in_progress';
                          } else if (rawStat.includes('assign') || rawStat.includes('valid') || rawStat.includes('verified')) {
                            statusLabel = isHindi ? 'टीम असाइन (Assigned)' : 'Action Team Assigned';
                            statusClass = 'assigned';
                          }

                          return (
                            <div 
                              key={repId + idx}
                              className="voice-nearby-card"
                              onClick={() => {
                                setTrackingIdInput(repId);
                                handleTrackReportById(repId);
                              }}
                              title={isHindi ? "इसे ट्रैक करने के लिए क्लिक करें" : "Click to track this report"}
                            >
                              <div className="nearby-card-top">
                                <div className="nearby-card-author">
                                  <span className="nearby-author-avatar">👤</span>
                                  <span className="nearby-author-name">{author}</span>
                                  <span className="nearby-benefit-check" title="JanSetu Beneficiary">✓</span>
                                </div>
                                <div className="nearby-card-dist">
                                  <span>📍 {distText}</span>
                                </div>
                              </div>

                              <div className="nearby-card-title">{title}</div>

                              <div className="nearby-card-brief">
                                <span className="brief-quote">“</span>
                                <span>{brief}</span>
                                <span className="brief-quote">”</span>
                              </div>

                              <div className="nearby-card-footer">
                                <span className="nearby-card-id">{repId}</span>
                                <span className={`nearby-status-tag ${statusClass}`}>
                                  <span className="status-dot" />
                                  {statusLabel}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}


                  {/* Real-time Tracked Report Details Card */}
                  {trackedResult && !trackedResult.error && (
                    <div className="voice-tracked-result-card">
                      <div className="tracked-card-header">
                        <div className="tracked-card-id-badge">
                          <span className="id-dot" />
                          <span>{trackedResult.id}</span>
                        </div>
                        <span className={`tracked-status-pill ${(trackedResult.status || 'submitted').toLowerCase().replace(/\s+/g, '-')}`}>
                          {trackedResult.status || 'Pending Admin Verification'}
                        </span>
                      </div>
                      <div className="tracked-card-title">{trackedResult.title}</div>
                      <div className="tracked-card-meta">
                        <span>🗓️ {trackedResult.dateFormatted ? `${trackedResult.dateFormatted} (${trackedResult.timeAgo || (isHindi ? '2 घंटे पहले' : '2h ago')})` : (trackedResult.timeAgo || (isHindi ? '2 घंटे पहले' : '2 hours ago'))}</span>
                        <span>📍 {trackedResult.location}</span>
                        <span>🏢 {trackedResult.assign || 'JanSetu Taskforce'}</span>
                      </div>
                      {trackedResult.description && (
                        <div style={{ fontSize: '11.5px', color: '#94A3B8', fontStyle: 'italic', marginTop: '2px', lineHeight: '1.4' }}>
                          💬 "{trackedResult.description.trim().split(/\s+/).slice(0, 7).join(' ')}..."
                        </div>
                      )}
                      <div className="tracked-stage-desc-bar">
                        <span className="stage-num-tag">Stage 2</span>
                        <span className="stage-status-text">
                          {trackedResult.isResolved 
                            ? (isHindi ? 'निस्तारित (Resolved)' : 'Resolved') 
                            : (trackedResult.isWorking 
                                ? (isHindi ? 'कार्यवाही जारी (In Progress)' : 'In Progress') 
                                : (isHindi ? 'Admin Verification (अभी पेंडिंग • जल्द वेरीफाई होगा)' : 'Admin Verification (Pending Verification)'))}
                        </span>
                      </div>

                      {/* 3-Step Visual Progress Stepper */}
                      <div className="tracked-progress-stepper">
                        <div className="progress-step-node completed">
                          <div className="step-circle">✓</div>
                          <span className="step-lbl">{isHindi ? 'दर्ज' : 'Submitted'}</span>
                        </div>
                        <div className={`progress-step-line ${trackedResult.isWorking || trackedResult.isResolved ? 'active' : ''}`} />
                        <div className={`progress-step-node ${trackedResult.isWorking || trackedResult.isResolved ? (trackedResult.isResolved ? 'completed' : 'active') : ''}`}>
                          <div className="step-circle">{trackedResult.isResolved ? '✓' : '2'}</div>
                          <span className="step-lbl">{isHindi ? 'कार्यवाही' : 'In Progress'}</span>
                        </div>
                        <div className={`progress-step-line ${trackedResult.isResolved ? 'active' : ''}`} />
                        <div className={`progress-step-node ${trackedResult.isResolved ? 'completed' : ''}`}>
                          <div className="step-circle">{trackedResult.isResolved ? '✓' : '3'}</div>
                          <span className="step-lbl">{isHindi ? 'निस्तारित' : 'Resolved'}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Error Card */}
                  {trackedResult && trackedResult.error && (
                    <div className="voice-tracked-error-card">
                      ⚠️ {trackedResult.message}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Dark Navy Dock: Mute on left, Real-time Visualizer in center, Wide Red End Call on right */}
            <div className="voice-bottom-dock-v2">
              {/* Left: Circular Mute Button with glowing ring */}
              <button
                type="button"
                className={`dock-btn-round-mute ${isMuted ? 'muted' : ''}`}
                onClick={handleToggleMute}
                title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
                aria-label={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
              >
                {isMuted ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="2" y1="2" x2="22" y2="22" stroke="#EF4444" strokeWidth="2.5" />
                    <path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2" stroke="#FFFFFF" />
                    <path d="M5 10v2a7 7 0 0 0 12 5" stroke="#FFFFFF" />
                    <path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" stroke="#FFFFFF" />
                    <path d="M9 9v3a3 3 0 0 0 5.12 2.12" stroke="#FFFFFF" />
                    <line x1="12" y1="19" x2="12" y2="22" stroke="#FFFFFF" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="22" />
                  </svg>
                )}
              </button>

              {/* Center: Dynamic Visualizer Capsule with Glowing Emerald Waves, Text, and Divider */}
              <div className={`dock-center-visualizer ${isSpeakingRef.current ? 'speaking' : (isMuted ? 'active' : voiceStatus)}`}>
                <div className={`dock-wave-bars-anim ${isSpeakingRef.current || liveVolume > 0.05 ? 'active' : 'idle'}`} aria-hidden="true">
                  <span className="dw-bar dw1" />
                  <span className="dw-bar dw2" />
                  <span className="dw-bar dw3" />
                  <span className="dw-bar dw4" />
                  <span className="dw-bar dw5" />
                  <span className="dw-bar dw6" />
                  <span className="dw-bar dw7" />
                </div>
                
                <div className="dock-status-info">
                  <span className="dock-status-heading">
                    {isSpeakingRef.current ? (isHindi ? 'AI बोल रही है...' : 'Speaking...') : (
                      isMuted ? (isHindi ? 'एजेंट सक्रिय' : 'Agent Active') : (
                        voiceStatus === 'processing' ? (isHindi ? 'प्रोसेसिंग...' : 'Thinking...') : (isHindi ? 'सुन रहे हैं...' : "I'm listening...")
                      )
                    )}
                  </span>
                  <span className="dock-status-subtext">
                    {isMuted ? (
                      isHindi ? '🤖 एजेंट सक्रिय • माइक बंद' : '🤖 Agent active • Mic muted'
                    ) : (
                      voiceStatus === 'speaking' ? (isHindi ? 'AI बोल रही है' : 'AI is speaking...') :
                      voiceStatus === 'processing' ? (isHindi ? 'समझ रहे हैं...' : 'Processing audio...') :
                      (isHindi ? 'आप बोलिए...' : 'Please speak...')
                    )}
                  </span>
                  {agentActivity && (
                    <span className="dock-agent-activity-line">{agentActivity}</span>
                  )}
                </div>

                <div className="dock-status-divider" aria-hidden="true" />
              </div>

              {/* Volume Boost Button */}
              <button
                type="button"
                className={`dock-btn-round-volume ${isVolumeBoosted ? 'boosted' : ''}`}
                onClick={() => {
                  const next = !isVolumeBoosted;
                  setIsVolumeBoosted(next);
                  setVolumeBoost(next ? 1.5 : 1.0);
                }}
                title={isVolumeBoosted ? 'Normal Volume' : 'Volume Boost'}
                aria-label={isVolumeBoosted ? 'Normal Volume' : 'Volume Boost'}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="rgba(255,255,255,0.15)" />
                  {isVolumeBoosted ? (
                    <>
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" stroke="#34D399" />
                      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" stroke="#34D399" />
                    </>
                  ) : (
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  )}
                </svg>
              </button>

              {/* Right: Wide Rounded Pill End Call Button */}
              <button
                type="button"
                className="floating-dock-end-btn"
                onClick={handleEndCall}
                title="End Call"
                aria-label="End Call"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none" className="end-call-phone-icon">
                  <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-2.2 2.2a15.053 15.053 0 0 1-6.59-6.59l2.2-2.21a.96.96 0 0 0 .25-1A11.36 11.36 0 0 1 8.5 3.97c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-.99-1.09z" transform="rotate(135 12 12)"/>
                </svg>
                <span className="end-call-text">End Call</span>
              </button>
            </div>

            {/* Elegant Tagline at Bottom */}
            <div className="voice-card-footer-tagline">
              <span className="tagline-line" />
              <span className="tagline-text">Chhoti Baat Nahi, Bada Badlav</span>
              <span className="tagline-line" />
            </div>

          </div>
        </div>
      )}

      {/* ── 4. STANDALONE CENTER-BOTTOM CALL CONTROLS DOCK (AS SHOWN IN USER IMAGE) ── */}
      {!isInitialCardOpen && isCallActive && (
        <div className="voice-floating-center-dock" role="toolbar" aria-label="Voice Call Controls">
          {/* Left: Circular Mute Button with glowing ring */}
          <button
            type="button"
            className={`floating-dock-mute ${isMuted ? 'muted' : ''}`}
            onClick={handleToggleMute}
            title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
            aria-label={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          >
            {isMuted ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="2" y1="2" x2="22" y2="22" stroke="#EF4444" strokeWidth="2.5" />
                <path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2" stroke="#FFFFFF" />
                <path d="M5 10v2a7 7 0 0 0 12 5" stroke="#FFFFFF" />
                <path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" stroke="#FFFFFF" />
                <path d="M9 9v3a3 3 0 0 0 5.12 2.12" stroke="#FFFFFF" />
                <line x1="12" y1="19" x2="12" y2="22" stroke="#FFFFFF" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="22" />
              </svg>
            )}
          </button>

          {/* Center: Recessed Dark Capsule with Glowing Green Waves, Text & Divider */}
          <div className={`floating-dock-status-pill ${isSpeakingRef.current ? 'speaking' : (isMuted ? 'active' : voiceStatus)}`}>
            <div className={`dock-wave-bars-anim ${isSpeakingRef.current || liveVolume > 0.05 ? 'active' : 'idle'}`} aria-hidden="true">
              <span className="dw-bar dw1" />
              <span className="dw-bar dw2" />
              <span className="dw-bar dw3" />
              <span className="dw-bar dw4" />
              <span className="dw-bar dw5" />
              <span className="dw-bar dw6" />
              <span className="dw-bar dw7" />
            </div>

            <div className="dock-status-info">
              <span className="dock-status-heading">
                {isSpeakingRef.current ? 'Speaking...' : (
                  isMuted ? 'Agent Active' : (
                    voiceStatus === 'processing' ? 'Thinking...' : "I'm listening..."
                  )
                )}
              </span>
              <span className="dock-status-subtext">
                {isMuted ? (
                  '🤖 Agent active • Mic band'
                ) : (
                  voiceStatus === 'speaking' ? 'AI bol rahi hai' :
                  voiceStatus === 'processing' ? 'Samajh rahi hoon...' : 'Aap boliye...'
                )}
              </span>
              {agentActivity && (
                <span className="dock-agent-activity-line">{agentActivity}</span>
              )}
            </div>

            <div className="dock-status-divider" aria-hidden="true" />
          </div>

          {/* Volume Boost Button */}
          <button
            type="button"
            className={`dock-btn-round-volume ${isVolumeBoosted ? 'boosted' : ''}`}
            onClick={() => {
              const next = !isVolumeBoosted;
              setIsVolumeBoosted(next);
              setVolumeBoost(next ? 1.5 : 1.0);
            }}
            title={isVolumeBoosted ? 'Normal Volume' : 'Volume Boost'}
            aria-label={isVolumeBoosted ? 'Normal Volume' : 'Volume Boost'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="rgba(255,255,255,0.15)" />
              {isVolumeBoosted ? (
                <>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" stroke="#34D399" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" stroke="#34D399" />
                </>
              ) : (
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              )}
            </svg>
          </button>

          {/* Right: Wide Rounded Pill End Call Button */}
          <button
            type="button"
            className="floating-dock-end-btn"
            onClick={handleEndCall}
            title="End Call"
            aria-label="End Call"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none" className="end-call-phone-icon">
              <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-2.2 2.2a15.053 15.053 0 0 1-6.59-6.59l2.2-2.21a.96.96 0 0 0 .25-1A11.36 11.36 0 0 1 8.5 3.97c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-.99-1.09z" transform="rotate(135 12 12)"/>
            </svg>
            <span className="end-call-text">End Call</span>
          </button>
        </div>
      )}
    </>
  );
}

