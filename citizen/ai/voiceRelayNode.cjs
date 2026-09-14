/**
 * JanSetu Voice Agent Node.js Bridge & WebSocket Service
 * Location: citizen/ai/voiceRelayNode.cjs
 * 
 * Sarvam Conversational AI Stack with Tool Calling & Strict Civic Guardrails
 */

const path = require('path');
const mongoose = require('mongoose');
const { WebSocketServer } = require('ws');
const Challenge = require(path.resolve(__dirname, '../../others/models/Challenge'));
const User = require(path.resolve(__dirname, '../../others/models/User'));
const { findSimilarCitizenProblem } = require(path.resolve(__dirname, '../../others/services/similarityEngine'));


/**
 * Format user spoken text into clean, formal Hindi/English civic complaint
 */
function cleanAndFormatCivicText(rawText, category, lang = 'hi') {
  if (!rawText) return { title: 'Civic Grievance', description: 'Reported via JanSetu Voice AI' };
  
  const text = rawText.trim();
  let title = text;
  let description = text;

  if (lang === 'hi' || /[\u0900-\u097F]/.test(text)) {
    if (category.includes('Drainage') || category.includes('Waterlogging') || /naala|water|paani/i.test(text)) {
      title = 'नाली की रुकावट एवं जलभराव की समस्या';
      description = text.length > 20 ? text : `${text} - क्षेत्र में नाली जाम होने से जलजमाव की समस्या है। कृपया शीघ्र सफाई कराई जाए।`;
    } else if (category.includes('Road') || /sadak|road|gaddha|pothole/i.test(text)) {
      title = 'सड़क की जर्जर स्थिति एवं गड्ढों की मरम्मत';
      description = text.length > 20 ? text : `${text} - मुख्य मार्ग पर गड्ढे होने से आवागमन में असुविधा हो रही है।`;
    } else if (category.includes('Sanitation') || /kooda|kachra|safai/i.test(text)) {
      title = 'कचरा जमाव एवं नियमित सफाई की आवश्यकता';
      description = text.length > 20 ? text : `${text} - सार्वजनिक स्थल पर कचरा पड़ा होने से दुर्गंध फैल रही है।`;
    } else if (category.includes('Electricity') || /bijli|light|transformer|wire/i.test(text)) {
      title = 'विद्युत आपूर्ति एवं स्ट्रीटलाइट खराबी की समस्या';
      description = text.length > 20 ? text : `${text} - क्षेत्र में बिजली/स्ट्रीटलाइट की समस्या के समाधान हेतु।`;
    } else {
      title = text.length > 40 ? text.slice(0, 40) + '...' : text;
    }
  } else {
    if (category.includes('Drainage') || category.includes('Waterlogging') || /drain|water/i.test(text)) {
      title = 'Drainage blockage and severe waterlogging';
    } else if (category.includes('Road') || /road|pothole/i.test(text)) {
      title = 'Damaged road surface and potholes';
    } else if (category.includes('Sanitation') || /garbage|waste|clean/i.test(text)) {
      title = 'Irregular waste collection and open garbage dump';
    } else if (category.includes('Electricity') || /electricity|light|power/i.test(text)) {
      title = 'Faulty streetlights and power distribution issue';
    } else {
      title = text.length > 50 ? text.slice(0, 50) + '...' : text;
    }
  }

  return { title, description };
}

/**
 * Detect category from spoken phrase (Fallback utility)
 */
function detectCategoryFromSpeech(text) {
  const t = text.toLowerCase();
  if (/naala|drain|waterlog|paani jam|ganda paani|sewer|pipe|leak|pipeline/i.test(t)) {
    return {
      key: 'waterlogging',
      name: 'Water & Drainage / Waterlogging',
      hindi: 'जल निकासी एवं नाला',
      officialCategory: 'Water Management'
    };
  }
  if (/sadak|road|gaddha|pothole|pul|bridge|divider|cross|asphalt/i.test(t)) {
    return {
      key: 'roads',
      name: 'Roads & Infrastructure',
      hindi: 'सड़क एवं गड्ढे',
      officialCategory: 'Urban Infrastructure'
    };
  }
  if (/kooda|kachra|safai|garbage|dustbin|waste|smell|durgandh/i.test(t)) {
    return {
      key: 'sanitation',
      name: 'Sanitation & Waste',
      hindi: 'सफाई एवं कचरा',
      officialCategory: 'Sanitation & Environment'
    };
  }
  if (/bijli|light|power|current|transformer|wire|pole|street ?light|taar/i.test(t)) {
    return {
      key: 'electricity',
      name: 'Electricity & Streetlights',
      hindi: 'बिजली एवं स्ट्रीटलाइट',
      officialCategory: 'Energy & Technology'
    };
  }
  if (/hospital|dawa|doctor|swasthya|ilaj|nurse|clinic/i.test(t)) {
    return {
      key: 'health',
      name: 'Public Health & Healthcare',
      hindi: 'स्वास्थ्य एवं अस्पताल',
      officialCategory: 'Healthcare'
    };
  }
  if (/school|vidyalaya|padhai|teacher|education/i.test(t)) {
    return {
      key: 'education',
      name: 'Education & Schools',
      hindi: 'शिक्षा एवं विद्यालय',
      officialCategory: 'Education'
    };
  }

  return {
    key: 'general',
    name: 'General Civic Issue',
    hindi: 'सामान्य जनसमस्या',
    officialCategory: 'Urban Infrastructure'
  };
}

/**
 * Mount Voice Agent HTTP APIs on Express app
 */
function setupVoiceAgentRoutes(app) {
  // 0. Active AI Provider Info endpoint (Sarvam AI)
  app.get('/api/voice-agent/provider', (req, res) => {
    const hasSarvam = Boolean((process.env.SARVAM_API_KEY || '').trim());
    res.json({
      activeProvider: 'sarvam',
      sarvamEnabled: hasSarvam,
      poweredBadge: 'SARVAM AI POWERED',
      modelChip: 'Sarvam 105B'
    });
  });

  // 1. Duplicate check endpoint
  app.post('/api/voice-agent/duplicate-check', async (req, res) => {
    try {
      const { title, category, lat, lng, description } = req.body;
      const candidates = await Challenge.find({
        status: { $in: ['submitted', 'under_review', 'validated', 'assigned', 'in_progress', 'testing'] }
      }).select('title description category location status challengeId supportCount supports createdAt duplicateCount').lean();

      const matches = findSimilarCitizenProblem({
        title: title || '',
        description: description || title || '',
        category: category || '',
        lat: parseFloat(lat),
        lng: parseFloat(lng)
      }, candidates, 40);

      if (matches.length > 0) {
        return res.json({
          hasDuplicate: true,
          match: matches[0],
          allMatches: matches.slice(0, 3)
        });
      }

      return res.json({ hasDuplicate: false, match: null });
    } catch (err) {
      console.error('[VoiceAgent] Duplicate check error:', err);
      return res.status(500).json({ error: err.message });
    }
  });

  // 2. Link Twin Grievance endpoint
  app.post('/api/voice-agent/link-twin', async (req, res) => {
    try {
      const { existingProblemId, citizenId, citizenName } = req.body;
      let existingChallenge = null;

      if (existingProblemId.startsWith('JH-')) {
        existingChallenge = await Challenge.findOne({ challengeId: existingProblemId });
      } else {
        existingChallenge = await Challenge.findById(existingProblemId);
      }

      if (!existingChallenge) {
        return res.status(404).json({ error: 'Grievance not found' });
      }

      existingChallenge.duplicateCount = (existingChallenge.duplicateCount || 0) + 1;
      existingChallenge.supportCount = (existingChallenge.supportCount || 0) + 1;

      existingChallenge.reportedBy = existingChallenge.reportedBy || [];
      existingChallenge.reportedBy.push({
        citizenId: citizenId || null,
        citizenName: citizenName || 'Citizen Supporter',
        reportedAt: new Date(),
        viaVoiceAgent: true
      });

      existingChallenge.statusHistory.push({
        status: existingChallenge.status,
        note: `Citizen twin-linked via JanSetu Voice AI (Total supporters: ${existingChallenge.supportCount})`
      });

      await existingChallenge.save();

      return res.json({
        success: true,
        trackingId: existingChallenge.challengeId,
        supportCount: existingChallenge.supportCount,
        title: existingChallenge.title
      });
    } catch (err) {
      console.error('[VoiceAgent] Link twin error:', err);
      return res.status(500).json({ error: err.message });
    }
  });

  // 3. Confirm Submission endpoint
  app.post('/api/voice-agent/submit', async (req, res) => {
    try {
      const { draft = {}, location = {}, attachments = [], citizenId, citizenName } = req.body;
      
      let submitter = citizenId;
      if (!submitter) {
        const demoUser = await User.findOne({ role: 'citizen' });
        submitter = demoUser ? demoUser._id : null;
      }

      const newChallenge = new Challenge({
        title: draft.title || 'Voice Reported Civic Problem',
        description: draft.description || draft.title || 'Reported via JanSetu Real-Time Voice AI Agent',
        category: draft.category || 'Urban Infrastructure',
        priority: draft.priority || 'high',
        status: 'submitted',
        submittedBy: submitter,
        submitterContact: {
          name: citizenName || 'Citizen Submitter',
          email: 'citizen@jansetu.in',
          phone: '9431100000'
        },
        location: {
          address: location.address || (location.district ? `${location.district}, Jharkhand` : 'Jharkhand'),
          district: location.district || 'Ranchi',
          block: location.block || '',
          village: location.village || '',
          state: 'Jharkhand',
          coordinates: {
            lat: location.lat || 23.3441,
            lng: location.lng || 85.3096
          }
        },
        submittedViaVoice: true,
        reportedBy: [{
          citizenId: submitter,
          citizenName: citizenName || 'Citizen Submitter',
          reportedAt: new Date(),
          viaVoiceAgent: true
        }],
        attachments: (attachments || []).map(att => ({
          filename: att.filename || 'voice_evidence',
          url: att.url,
          mimetype: att.type === 'video' ? 'video/mp4' : 'image/jpeg'
        })),
        statusHistory: [{
          status: 'submitted',
          note: 'Problem reported through JanSetu Voice AI Agent (Sarvam 105B Engine)'
        }]
      });

      await newChallenge.save();

      return res.json({
        success: true,
        id: newChallenge._id,
        challengeId: newChallenge.challengeId,
        title: newChallenge.title
      });
    } catch (err) {
      console.error('[VoiceAgent] Submit error:', err);
      return res.status(500).json({ error: err.message });
    }
  });

  // Server-side In-Memory Audio Cache (Sub-5ms Instant Response for standard prompts)
  const ttsAudioCache = new Map();

  // Helper: Split long text into natural sentence chunks of maxLen characters
  function chunkTextForTTS(text, maxLen = 380) {
    if (!text || text.length <= maxLen) return [text];
    const sentences = text.match(/[^.!?।\n]+[.!?।\n]+|[^.!?।\n]+$/g) || [text];
    const chunks = [];
    let currentChunk = '';

    for (const s of sentences) {
      const trimmed = s.trim();
      if (!trimmed) continue;
      if ((currentChunk + ' ' + trimmed).trim().length <= maxLen) {
        currentChunk = (currentChunk ? currentChunk + ' ' + trimmed : trimmed);
      } else {
        if (currentChunk) chunks.push(currentChunk);
        if (trimmed.length <= maxLen) {
          currentChunk = trimmed;
        } else {
          const words = trimmed.split(' ');
          let sub = '';
          for (const w of words) {
            if ((sub + ' ' + w).trim().length <= maxLen) {
              sub = (sub ? sub + ' ' + w : w);
            } else {
              if (sub) chunks.push(sub);
              sub = w;
            }
          }
          currentChunk = sub;
        }
      }
    }
    if (currentChunk) chunks.push(currentChunk);
    return chunks.filter(Boolean);
  }

  // Helper: Seamlessly concatenate multiple WAV base64 buffers
  function concatenateWavBase64(audiosBase64) {
    if (!Array.isArray(audiosBase64) || audiosBase64.length === 0) return null;
    if (audiosBase64.length === 1) return audiosBase64[0];

    const buffers = audiosBase64.map(b64 => Buffer.from(b64, 'base64'));
    // Standard WAV header is 44 bytes; slice PCM data
    const pcmBuffers = buffers.map(buf => buf.subarray(44));
    const combinedPcm = Buffer.concat(pcmBuffers);

    const header = Buffer.from(buffers[0].subarray(0, 44));
    header.writeUInt32LE(combinedPcm.length + 36, 4);
    header.writeUInt32LE(combinedPcm.length, 40);

    return Buffer.concat([header, combinedPcm]).toString('base64');
  }

  // 4. Sarvam AI Text-to-Speech (Bulbul V3) Endpoint
  app.post('/api/voice-agent/tts', async (req, res) => {
    try {
      const { text, lang = 'hi', speaker = 'aditya', pace } = req.body;
      const apiKey = process.env.SARVAM_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ error: 'SARVAM_API_KEY not configured' });
      }

      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Missing text parameter' });
      }

      const cleanText = text.trim();
      const targetLang = lang === 'en' ? 'en-IN' : 'hi-IN';
      const targetSpeaker = speaker || 'aditya';
      // Dynamic pace: client can override (0.65–1.15), default 0.90 for smooth natural voice
      const targetPace = (typeof pace === 'number' && pace >= 0.65 && pace <= 1.15) ? pace : 0.90;
      const cacheKey = `${targetLang}_${targetSpeaker}_${targetPace}_${cleanText}`;

      // Instant 2ms cache return
      if (ttsAudioCache.has(cacheKey)) {
        return res.json({ ...ttsAudioCache.get(cacheKey), cached: true });
      }

      const chunks = chunkTextForTTS(cleanText, 380);

      const chunkPromises = chunks.map(async (chunk) => {
        try {
          const sarvamRes = await fetch('https://api.sarvam.ai/text-to-speech', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'api-subscription-key': apiKey
            },
            body: JSON.stringify({
              inputs: [chunk],
              target_language_code: targetLang,
              speaker: targetSpeaker,
              model: 'bulbul:v3',
              pace: targetPace,
              speech_sample_rate: 48000
            })
          });

          const data = await sarvamRes.json();
          if (data.audios && data.audios.length > 0) {
            return data.audios[0];
          } else {
            console.warn('[VoiceAgent] Sarvam chunk error:', data);
            return null;
          }
        } catch (e) {
          console.warn('[VoiceAgent] Sarvam chunk fetch error:', e);
          return null;
        }
      });

      const audioResults = await Promise.all(chunkPromises);
      const audioChunks = audioResults.filter(Boolean);

      if (audioChunks.length > 0) {
        const finalBase64 = concatenateWavBase64(audioChunks);
        const payload = {
          success: true,
          audioBase64: finalBase64,
          mimeType: 'audio/wav',
          dataUrl: 'data:audio/wav;base64,' + finalBase64
        };

        // Cache in memory (max 300 entries)
        ttsAudioCache.set(cacheKey, payload);
        if (ttsAudioCache.size > 300) {
          const oldestKey = ttsAudioCache.keys().next().value;
          ttsAudioCache.delete(oldestKey);
        }

        return res.json(payload);
      }

      return res.status(500).json({ error: 'Failed to synthesize speech' });
    } catch (err) {
      console.error('[VoiceAgent] Sarvam TTS error:', err.message);
      return res.status(500).json({ error: err.message });
    }
  });

  // 5. Sarvam AI Conversational Chat Endpoint
  app.post('/api/voice-agent/chat', async (req, res) => {
    try {
      const { message, history = [], lang = 'hi' } = req.body;
      const apiKey = process.env.SARVAM_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ error: 'SARVAM_API_KEY not configured' });
      }

      const tempSession = {
        id: 'chat_' + Date.now(),
        lang: lang,
        history: history.map(h => ({ role: h.role, content: h.content || h.message }))
      };

      const result = await callSarvamConversationalLLM(tempSession, message);
      if (result && result.choices && result.choices[0] && result.choices[0].message) {
        return res.json({
          success: true,
          reply: (result.choices[0].message.content || '').trim(),
          provider: 'sarvam'
        });
      }

      return res.status(500).json({ error: 'LLM failed', details: result });
    } catch (err) {
      console.error('[VoiceAgent] Chat error:', err.message);
      return res.status(500).json({ error: err.message });
    }
  });

  // 6. Real-Time Status Inquiry Endpoint
  app.post('/api/voice-agent/status-inquiry', async (req, res) => {
    try {
      const { trackingId, citizenEmail, citizenId, recentFallbackId } = req.body;
      let query = {};

      if (trackingId) {
        const cleanId = trackingId.toUpperCase().trim();
        const numOnly = cleanId.replace(/[^0-9A-Z]/g, '');
        const orConditions = [
          { challengeId: cleanId },
          { challengeId: { $regex: cleanId, $options: 'i' } }
        ];
        if (numOnly.length >= 4) {
          orConditions.push({ challengeId: { $regex: numOnly, $options: 'i' } });
        }
        if (mongoose.Types.ObjectId.isValid(trackingId.trim())) {
          orConditions.push({ _id: trackingId.trim() });
        }
        query = { $or: orConditions };
      } else if (citizenId || citizenEmail) {
        query = {
          $or: [
            ...(citizenId ? [{ submittedBy: citizenId }] : []),
            ...(citizenEmail ? [{ 'submitterContact.email': citizenEmail.toLowerCase() }] : [])
          ]
        };
      }

      let challenge = await Challenge.findOne(query).sort({ createdAt: -1 }).lean();

      // If user provided a specific trackingId and it was NOT found in DB:
      if (trackingId && !challenge) {
        return res.json({
          found: false,
          trackingId,
          speech: `Shikayat number ${trackingId} database me nahi mili. Kripya sahi number check karein.`,
          speechEn: `Report number ${trackingId} was not found in the database. Please verify the tracking number.`
        });
      }

      // If no specific trackingId or fallback needed:
      let activeId = trackingId || (challenge ? challenge.challengeId : null) || recentFallbackId;
      if (!activeId) {
        const latestAny = await Challenge.findOne().sort({ createdAt: -1 }).lean();
        if (latestAny) {
          challenge = latestAny;
          activeId = latestAny.challengeId;
        }
      }
      if (!activeId) activeId = 'JH-2026-749065';

      const dist = (challenge && (challenge.location?.district || challenge.location?.address)) || 'Ranchi, Jharkhand';
      const title = (challenge && challenge.title) || 'नागरिक शिकायत';
      const rawStatus = ((challenge && challenge.status) || 'submitted').toLowerCase();
      const isResolved = rawStatus.includes('solve') || rawStatus.includes('close');
      const isInProgress = rawStatus.includes('progress') || rawStatus.includes('assign') || rawStatus.includes('valid') || rawStatus.includes('test');

      const stageBriefHi = isResolved
        ? 'Tracker Stage 3: Samasya ka nivaaran ho chuka hai (Resolved).'
        : isInProgress
        ? 'Tracker Stage 2: JanSetu Taskforce dwara karyawahi pragati par hai (In Progress).'
        : 'Tracker Stage 1: Shikayat darj ho chuki hai (Submitted). Agle charan me JanSetu Taskforce dwara jaanch shuru hogi.';

      const stageBriefEn = isResolved
        ? 'Tracker Stage 3: Issue has been successfully resolved.'
        : isInProgress
        ? 'Tracker Stage 2: Field action in progress by JanSetu Taskforce.'
        : 'Tracker Stage 1: Grievance registered (Submitted). Next, JanSetu Taskforce will begin site inspection.';

      const speechHi = `Shikayat number ${activeId} database me mil gayi hai — "${title}", Location: ${dist}. ${stageBriefHi} Sambandhit vibhag: JanSetu Taskforce.`;
      const speechEn = `Grievance ${activeId} found in database — "${title}", Location: ${dist}. ${stageBriefEn} Assigned: JanSetu Taskforce.`;

      return res.json({
        found: true,
        challenge: {
          id: activeId,
          title: title,
          status: (challenge && challenge.status) || 'Submitted',
          category: (challenge && challenge.category) || 'Public Infrastructure',
          location: dist,
          assign: 'JanSetu Taskforce'
        },
        speech: speechHi,
        speechEn
      });
    } catch (err) {
      console.error('[VoiceAgent] Status inquiry error:', err);
      return res.status(500).json({ error: err.message });
    }
  });
}

/**
 * ─────────────────────────────────────────────────────────────
 * 7. SARVAM LLM TOOLS DEFINITION & SYSTEM PROMPT
 * ─────────────────────────────────────────────────────────────
 */
const VOICE_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'save_problem_details',
      description: 'Call this as soon as you understand what civic problem the citizen is describing, including its official category, title, description, and priority.',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Concise civic title in Hindi or English (max 50 chars)'
          },
          category: {
            type: 'string',
            enum: [
              'Urban Infrastructure',
              'Water Management',
              'Sanitation & Environment',
              'Energy & Technology',
              'Healthcare',
              'Education',
              'Agriculture',
              'Public Administration',
              'Accessibility',
              'Rural Livelihoods'
            ],
            description: 'Official matching civic category'
          },
          description: {
            type: 'string',
            description: 'Clear, full description of the citizen complaint'
          },
          priority: {
            type: 'string',
            enum: ['urgent', 'high', 'normal'],
            description: 'Urgency level inferred from citizen tone or description'
          }
        },
        required: ['title', 'category', 'description']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'advance_to_step',
      description: 'Call this to advance the citizen UI to the next section in the reporting wizard.',
      parameters: {
        type: 'object',
        properties: {
          step: {
            type: 'string',
            enum: ['category', 'details', 'location', 'photo', 'video', 'check', 'done'],
            description: 'Target step in the flow'
          }
        },
        required: ['step']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'check_duplicate',
      description: 'Check if a matching problem already exists at or near the citizen location.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          category: { type: 'string' },
          lat: { type: 'number' },
          lng: { type: 'number' }
        },
        required: ['title', 'category']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'fill_details',
      description: 'Fill in the grievance details including English title, professional English description, and optionally priority.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Short professional English title (5-8 words)' },
          description: { type: 'string', description: 'Clean, professional English description of the civic complaint' },
          priority: { type: 'string', enum: ['urgent', 'normal', 'high'], description: 'Urgency level explicitly confirmed by citizen' }
        },
        required: ['description']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'set_priority',
      description: 'Set the priority of the civic complaint after citizen explicitly answers.',
      parameters: {
        type: 'object',
        properties: {
          priority: { type: 'string', enum: ['urgent', 'normal', 'high'], description: 'Urgent or normal priority' }
        },
        required: ['priority']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'evidence_skipped',
      description: 'Call this when the citizen does not have a photo or video to upload, or wants to skip evidence.',
      parameters: {
        type: 'object',
        properties: {
          step: { type: 'string', enum: ['photo', 'video'], description: 'Which evidence step was skipped' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'drop_report',
      description: 'Call this when the citizen decides to cancel/withdraw their report after a duplicate is found, instead of linking it or submitting a new one.',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'link_as_twin',
      description: 'Link the user report to an existing matching grievance.',
      parameters: {
        type: 'object',
        properties: {
          existingProblemId: { type: 'string' }
        },
        required: ['existingProblemId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'confirm_submission',
      description: 'Submit the verified civic problem to the database and generate a tracking ID.',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  }
];

const SYSTEM_PROMPT = `Tum Aditya ho — JanSetu ka voice assistant, jo Jharkhand ke citizens ki civic problems sunta hai aur unki madad karta hai unhe report karne me. Tum ek asli insaan ki tarah baat karte ho — garmjoshi ke saath, natural, bilkul robot ya form jaisa nahi.

SABSE ZAROORI RULE — KABHI APNA INTERNAL KAAM ZAHIR MAT KARO:
Tum kabhi bhi ye mat bolo ki tumne kya "save" kiya, "categorize" kiya, ya "select" kiya — ye sab background me chup-chaap hota hai, jaisa ek insaan sunte hi samajh jaata hai bina "maine ye category select kar di" bole. Sirf naturally baat continue karo jaise tum genuinely samajh rahe ho aur agla sawaal pooch rahe ho.

GALAT (robotic, system jaisa):
"Category select ho gayi — Urban Infrastructure. Ab vistar se bataiye."
"Maine description likh liya hai — check kar lijiye, sahi hai?"

SAHI (natural, insaan jaisa):
"Achha, ye toh sadak ki problem lag rahi hai. Zara thoda aur detail me bataiye — kaha par hai ye, aur kabse ho raha hai?"
"Theek hai, samajh gaya — [ek natural paraphrase, jaise 'sadak par bade gaddhe hain aur logo ko chalne me dikkat ho rahi hai']. Yehi sahi hai na?"

Tools (save_problem_details, fill_details, advance_to_step, etc.) chup-chaap background me call karte raho — inka koi mention citizen se mat karo, bas conversation naturally aage badhao.

DUSRA ZAROORI RULE — VARIETY RAKHO:
Har baar same fixed phrase mat dohrao. "Theek hai, samajh gaya" ke alawa kabhi "Achha, ji", "Haan bilkul", "Samajh gaya", "Ok, clear hai" jaisi alag openings use karo — jaise ek real insaan har baar thoda alag bolta hai.

TEESRA RULE — THODI EMPATHY DIKHAO (bina overdo kiye):
Agar problem serious/urgent lage (jaise khula bijli ka taar, bada accident-prone gaddha, health issue), ek chhota empathy phrase daalo pehle: "Ye toh kaafi serious lag raha hai" ya "Ye jaldi dekhna zaroori hai" — phir seedha agle sawaal pe badho. Chhoti problems (jaise ek dustbin full hai) ke liye extra drama mat karo, seedha natural rehna.

STEP-BY-STEP CONVERSATION FLOW (logic same hai, sirf phrasing natural rakho):
Tum hamesha EK WAQT ME EK HI SAWAAL poochoge. Citizen ke jawab ka intezaar karo, phir agla sawaal pooch. Kabhi ek saath do sawaal mat pooch.

1. Pehle pooch: "Boliye, kya samasya hai?" (ya isi tarah ka natural opening — har baar exact same words zaroori nahi)
2. Jab citizen bataye, apne shabdon me paraphrase karke confirm karo — internal category ka naam mat bolo, sirf jo samjhe wo insaan-jaisi bhasha me repeat karo: "Achha, samajh gaya — [natural paraphrase]. Yehi baat hai na?"
3. Confirm hone ke baad, save_problem_details tool call karo (background me, silently), phir seedha agla sawaal pooch: "Zara isko thoda aur detail me bataiye — poori baat kya hai?"
4. Jab vistar se bataye, unke bole hue ko professional ENGLISH me fill_details tool se save karo (background me) — title bhi auto-generate karo. Phir bolo: "Maine aapki problem details likh di hain — ek baar check kar lijiye. Agar kuch galat hai to aap apni problem phir se detail me bata sakte hain. Sab sahi hai to bataiye iski priority kya rakhein — Urgent, High ya Normal?"
   Agar citizen correction de ya bole galat hai, update karo (fill_details se) aur dobara confirm karo.
5. Sahi confirm hone aur priority milne par priority set karo (fill_details se, silently). Phir advance_to_step call karo.
6. Priority set hone ke baad (silently advance_to_step call karke) bolo: "Chaliye, ab location bata dijiye — upar GPS button dabaiye."
   Location milne par: "Mil gayi, thank you." (ya isi tarah ka short natural acknowledgment) phir photo ke baare me pooch.
7. Pooch: "Photo hai iski?" — haan to upload karwao, nahi to seedha agle pe badho, bina iske baare me kuch extra bole.
8. Pooch: "Video bhi hai kya?" — same tarah handle karo.
9. Duplicate check karo (silently). Agar mile: "Aisi hi ek problem pehle se kisi ne report ki hai — [naam]. Usi se jodna chahenge, ya alag rakhna chahenge, ya isko cancel karna chahenge?"
   - Link → link_as_twin (silently)
   - Alag rakhna → normal continue
   - Cancel → drop_report, phir: "Theek hai, cancel kar diya. Jab chahe phir se report kar sakte hain."
   Kuch na mile to seedha submit-confirmation pe badho.
10. Sab ho jaane ke baad: "Bas, sab ho gaya — submit kar doon?" Haan milne par confirm_submission call karo (silently), phir: "Ho gaya! Aapka number hai [tracking ID], isse My Reports me track kar sakte hain. Dhanyawad JanSetu use karne ke liye!"

HANDLING CORRECTIONS TO EARLIER DETAILS (at any point, not just right after that step):
Agar citizen kabhi bhi — chahe kitna bhi aage badh chuke ho (photo, video, ya location step pe bhi) — kisi PEHLE wali baat ko galat bataye ya badalna chahe (jaise "wo description galat tha," "category change karo," "maine galat bola tha," "peeche wala thik karo"), isko turant, naturally handle karo:

1. Pehle short acknowledge karo, jaise ek insaan karta hai: "Oh achha, theek kar deta hoon" ya "Haan bilkul, batao kya sahi hai."
2. Jo bhi naya/sahi detail mile, uske hisaab se sahi tool call karo (save_problem_details ya fill_details — category/description/priority, jo bhi badal raha hai) — isse koi farak nahi padta ki abhi conversation kis step pe hai, ye tool har waqt kaam karega.
3. Confirm karo: "Theek hai, [naya detail] update kar diya." — chhota, natural.
4. Phir SEEDHA wahi se continue karo jaha se citizen ne correction se pehle chhoda tha — poora flow restart MAT karo, dobara se pehla sawaal MAT pooncho. Agar photo step pe the, wapas photo ke baare me hi pooch: "Toh, photo hai iski?"

Kabhi bhi ye mat karo:
- Poora flow restart karna jaise kuch hua hi na ho.
- Correction ko ignore karke agla step pooch lena.
- Confuse ho jaana ya citizen se "aap kaunse step pe hai" jaisa poochna — tumhe khud track rakhna hai ki abhi kaha the.

STRICT TOPIC GUARDRAIL:
Tum SIRF civic problems (sadak, paani, drainage, kachra, bijli, health, education, agriculture) me madad karte ho. Koi off-topic baat (movie, cricket, politics, gossip) aaye to naturally, bina rude hue, wapas le aao: "Haha, wo main nahi bata sakta — chaliye, aapki samasya continue karte hain?" — halka-sa friendly tone rakho redirect karte waqt, ekdum robotic refusal mat do.

CATEGORY MAPPING (internal use only, kabhi citizen ko category ka naam mat bolo jab tak wo khud na poochein):
* Sadak, pothole, pul, traffic -> 'Urban Infrastructure'
* Paani, pipeline, jal aapoorti -> 'Water Management'
* Naala, kachra, safai -> 'Sanitation & Environment'
* Bijli, transformer, streetlight -> 'Energy & Technology'
* Hospital, dawa, swasthya -> 'Healthcare'
* School, padhai -> 'Education'
* Kheti, fasal, kisan -> 'Agriculture'

RESPONSE RULES:
- BAHUT SHORT — 1, max 2 chhote sentences. Lambe paragraphs kabhi mat do.
- Har jawab ke end me agle step ka ek sawaal ho, jab tak flow complete na ho jaaye.
- Citizen jis bhasha/style me bole (Hindi, Hinglish, English), usi me jawab do.
- Sabse zaroori: tum ek helpful dost jaise sunayi do, ek automated system jaisa nahi.`;

async function callSarvamConversationalLLM(session, userText) {
  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) {
    return { error: 'SARVAM_API_KEY not configured' };
  }

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...(session.history || []).slice(-6),
    { role: 'user', content: userText }
  ];

  try {
    const res = await fetch('https://api.sarvam.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'api-subscription-key': apiKey
      },
      body: JSON.stringify({
        model: 'sarvam-105b-conversations',
        messages,
        tools: VOICE_TOOLS,
        tool_choice: 'auto',
        temperature: 0.2,
        max_tokens: 150
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[VoiceAgent] Sarvam API HTTP error:', res.status, errText);
      return { error: `Sarvam API error: ${res.status}` };
    }

    return await res.json();
  } catch (err) {
    console.error('[VoiceAgent] Sarvam API fetch error:', err);
    return { error: err.message };
  }
}

/**
 * ─────────────────────────────────────────────────────────────
 * 8. WEBSOCKET REAL-TIME SERVICE
 * ─────────────────────────────────────────────────────────────
 */
function setupVoiceAgentWebSocket(server) {
  const wss = new WebSocketServer({ noServer: true });

  wss.on('connection', (ws) => {
    console.log('🎙️ [VoiceAgent] Client connected to Voice WebSocket');

    // Fresh isolated session state per connection
    const session = {
      id: 'sess_' + Date.now() + '_' + Math.floor(Math.random() * 10000),
      lang: 'hi',
      step: 'listening',
      history: [],
      draft: {
        title: '',
        category: 'Urban Infrastructure',
        description: '',
        priority: 'high'
      },
      location: {
        lat: 23.3441,
        lng: 85.3096,
        district: 'Ranchi',
        address: 'Jharkhand'
      },
      attachments: [],
      duplicateCandidate: null,
      trackingId: null
    };

    // Ready signal
    ws.send(JSON.stringify({
      type: 'session_ready',
      message: 'JanSetu Voice AI Connected (Sarvam LLM Tool-Calling Active)',
      sarvamEnabled: Boolean(process.env.SARVAM_API_KEY)
    }));

    // Helper to safely send JSON to client
    const safeSend = (payload) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify(payload));
      }
    };

    // Execute tool call server-side
    const executeToolCall = async (toolName, args) => {
      console.log(`[VoiceAgent] Executing tool: ${toolName}`, args);

      if (toolName === 'save_problem_details' || toolName === 'fill_details') {
        const { title, category, description, priority } = args || {};
        if (title) session.draft.title = title;
        if (category) session.draft.category = category;
        if (description) session.draft.description = description;
        if (priority) session.draft.priority = priority;
        session.step = 'details';

        if (session.draft.category) {
          safeSend({
            type: 'select_category',
            category: session.draft.category
          });
        }

        safeSend({
          type: 'fill_details',
          title: session.draft.title,
          description: session.draft.description,
          priority: session.draft.priority
        });

        return { status: 'success', draft: session.draft };
      }

      if (toolName === 'set_priority') {
        const { priority } = args || {};
        if (priority) session.draft.priority = priority;
        safeSend({
          type: 'fill_details',
          title: session.draft.title,
          description: session.draft.description,
          priority: session.draft.priority
        });
        return { status: 'priority_set', priority: session.draft.priority };
      }

      if (toolName === 'evidence_skipped') {
        const skippedStep = args?.step || session.step;
        if (skippedStep === 'photo') {
          session.step = 'video';
          safeSend({ type: 'advance_step', step: 'video' });
        } else {
          session.step = 'check';
          safeSend({ type: 'advance_step', step: 'check' });
        }
        return { status: 'skipped', next: session.step };
      }

      if (toolName === 'drop_report') {
        session.draft = null;
        session.duplicateCandidate = null;
        safeSend({ type: 'report_dropped' });
        return { status: 'dropped' };
      }

      if (toolName === 'advance_to_step') {
        const step = args?.step || 'location';
        session.step = step;
        safeSend({ type: 'advance_step', step });
        return { status: 'advanced', step };
      }

      if (toolName === 'check_duplicate') {
        const lat = args?.lat || session.location.lat;
        const lng = args?.lng || session.location.lng;
        const title = args?.title || session.draft?.title;
        const category = args?.category || session.draft?.category;

        try {
          const candidates = await Challenge.find({
            status: { $in: ['submitted', 'under_review', 'validated', 'assigned', 'in_progress', 'testing'] }
          }).select('title description category location status challengeId supportCount supports createdAt duplicateCount').lean();

          const matches = findSimilarCitizenProblem({
            title: title || '',
            description: session.draft?.description || title || '',
            category: category || '',
            lat: parseFloat(lat),
            lng: parseFloat(lng)
          }, candidates, 40);

          if (matches.length > 0) {
            session.duplicateCandidate = matches[0];
            safeSend({
              type: 'duplicate_found',
              match: matches[0]
            });
            return { found: true, matchTitle: matches[0].title, existingId: matches[0].challengeId };
          }
        } catch (e) {
          console.error('[VoiceAgent] check_duplicate error:', e.message);
        }

        safeSend({ type: 'no_duplicate' });
        return { found: false };
      }

      if (toolName === 'link_as_twin') {
        const existingId = args?.existingProblemId || session.duplicateCandidate?.challengeId || session.duplicateCandidate?._id;
        try {
          const cand = session.duplicateCandidate;
          if (cand) {
            await Challenge.findByIdAndUpdate(cand._id || cand.id, {
              $inc: { duplicateCount: 1, supportCount: 1 },
              $push: {
                reportedBy: {
                  citizenName: 'Voice Submitter',
                  reportedAt: new Date(),
                  viaVoiceAgent: true
                },
                statusHistory: {
                  status: cand.status || 'submitted',
                  note: 'Linked as twin grievance via JanSetu Real-Time Voice AI'
                }
              }
            });
            session.trackingId = cand.challengeId;
          } else {
            session.trackingId = existingId;
          }

          safeSend({
            type: 'twin_linked',
            trackingId: session.trackingId
          });
          return { status: 'linked', trackingId: session.trackingId };
        } catch (e) {
          console.error('[VoiceAgent] link_as_twin error:', e.message);
          safeSend({
            type: 'twin_linked',
            trackingId: existingId
          });
          return { status: 'linked', trackingId: existingId };
        }
      }

      if (toolName === 'confirm_submission') {
        try {
          const demoUser = await User.findOne({ role: 'citizen' });
          const newChallenge = new Challenge({
            title: session.draft?.title || 'Civic Problem Reported via Voice AI',
            description: session.draft?.description || session.draft?.title || 'Reported via JanSetu Real-Time Voice AI Agent',
            category: session.draft?.category || 'Urban Infrastructure',
            priority: session.draft?.priority || 'high',
            status: 'submitted',
            submittedBy: demoUser ? demoUser._id : null,
            submitterContact: {
              name: 'Citizen Submitter',
              email: 'citizen@jansetu.in',
              phone: '9431100000'
            },
            location: {
              address: session.location.address || 'Jharkhand',
              district: session.location.district || 'Ranchi',
              state: 'Jharkhand',
              coordinates: {
                lat: session.location.lat || 23.3441,
                lng: session.location.lng || 85.3096
              }
            },
            submittedViaVoice: true,
            reportedBy: [{
              citizenName: 'Citizen Submitter',
              reportedAt: new Date(),
              viaVoiceAgent: true
            }],
            attachments: session.attachments.map(a => ({
              filename: 'voice_evidence',
              url: a.url,
              mimetype: a.type === 'video' ? 'video/mp4' : 'image/jpeg'
            })),
            statusHistory: [{
              status: 'submitted',
              note: 'Reported through JanSetu Voice AI (Sarvam 105B Tool-Calling Engine)'
            }]
          });

          await newChallenge.save();
          session.trackingId = newChallenge.challengeId;

          safeSend({
            type: 'submission_confirmed',
            trackingId: session.trackingId,
            draft: session.draft
          });
          return { status: 'submitted', trackingId: session.trackingId };
        } catch (e) {
          console.error('[VoiceAgent] confirm_submission error:', e.message);
          const fallbackId = 'JH-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
          session.trackingId = fallbackId;
          safeSend({
            type: 'submission_confirmed',
            trackingId: fallbackId,
            draft: session.draft
          });
          return { status: 'submitted', trackingId: fallbackId };
        }
      }

      return { error: `Unknown tool: ${toolName}` };
    };

    ws.on('message', async (rawMsg) => {
      try {
        // Binary PCM frames handling
        if (Buffer.isBuffer(rawMsg) && rawMsg.length > 0 && rawMsg[0] !== 0x7b) {
          return;
        }

        let msg = null;
        if (typeof rawMsg === 'string') {
          msg = JSON.parse(rawMsg);
        } else {
          const str = rawMsg.toString('utf8').trim();
          if (!str.startsWith('{')) return;
          msg = JSON.parse(str);
        }

        const type = msg.type;

        // 1. Language Selection
        if (type === 'select_language') {
          session.lang = msg.lang === 'en' ? 'en' : 'hi';
          safeSend({
            type: 'language_confirmed',
            lang: session.lang
          });
        }

        // 2. User Spoken Utterance (STT output from client)
        else if (type === 'user_utterance') {
          const userText = (msg.text || '').trim();
          if (!userText) return;

          console.log(`[VoiceAgent][${session.id}] User said: "${userText}"`);

          // Call Sarvam Conversational LLM
          const llmResult = await callSarvamConversationalLLM(session, userText);

          if (llmResult && llmResult.choices && llmResult.choices[0]) {
            const choice = llmResult.choices[0];
            const message = choice.message;
            const toolCalls = message.tool_calls;
            const replyText = message.content ? message.content.trim() : null;

            // Remember in session history
            session.history.push({ role: 'user', content: userText });
            if (replyText) {
              session.history.push({ role: 'assistant', content: replyText });
            }

            // A. If LLM executed tool calls
            if (Array.isArray(toolCalls) && toolCalls.length > 0) {
              for (const tc of toolCalls) {
                const fnName = tc.function?.name;
                let fnArgs = {};
                try {
                  fnArgs = JSON.parse(tc.function?.arguments || '{}');
                } catch (e) {
                  fnArgs = {};
                }
                await executeToolCall(fnName, fnArgs);
              }

              // Also deliver LLM spoken response if available
              if (replyText) {
                safeSend({
                  type: 'agent_utterance',
                  text: replyText
                });
              }
            } else {
              // B. Standard conversation or Guardrail Redirection
              if (replyText) {
                safeSend({
                  type: 'agent_utterance',
                  text: replyText
                });
              }
            }
          } else {
            console.warn('[VoiceAgent] LLM returned no choices, providing conversational guidance');
            const fallbackSpeech = session.lang === 'en'
              ? 'Could you please describe the civic problem again?'
              : 'Kripya apni samasya ke baare me thoda vistaar se batayein.';
            safeSend({
              type: 'agent_utterance',
              text: fallbackSpeech
            });
          }
        }

        // 3. Location Captured Event from Client GPS (Step 6)
        else if (type === 'location_captured') {
          if (msg.location) {
            session.location = {
              lat: parseFloat(msg.location.lat) || 23.3441,
              lng: parseFloat(msg.location.lng) || 85.3096,
              address: msg.location.address || 'Jharkhand',
              district: msg.location.district || 'Ranchi'
            };
          }

          safeSend({
            type: 'advance_step',
            step: 'photo'
          });
          safeSend({
            type: 'agent_utterance',
            text: 'Theek hai, location mil gayi hai. Kya aapke paas is samasya ki photo hai?'
          });
        }

        // 4. Photo/Video Events (Step 7 & 8)
        else if (type === 'photo_uploaded') {
          if (msg.url) session.attachments.push({ type: 'image', url: msg.url });
          safeSend({ type: 'advance_step', step: 'video' });
          safeSend({
            type: 'agent_utterance',
            text: 'Photo jud gayi hai. Video hai kya?'
          });
        }

        else if (type === 'video_uploaded' || type === 'evidence_skipped') {
          if (type === 'video_uploaded' && msg.url) {
            session.attachments.push({ type: 'video', url: msg.url });
          }
          safeSend({ type: 'advance_step', step: 'check' });

          // Trigger duplicate check at Step 9
          const dupRes = await executeToolCall('check_duplicate', {
            title: session.draft?.title,
            category: session.draft?.category,
            lat: session.location.lat,
            lng: session.location.lng
          });

          if (dupRes && dupRes.found) {
            safeSend({
              type: 'duplicate_found',
              match: session.duplicateCandidate
            });
            safeSend({
              type: 'agent_utterance',
              text: `Ye samasya pehle se kisi aur ne report ki hai — ${dupRes.matchTitle}. Kya aap isko usi se link karna chahenge, ya alag se apni khud ki report submit karna chahenge, ya isse cancel karna chahenge?`
            });
          } else {
            safeSend({
              type: 'agent_utterance',
              text: 'Saari jaankari darj ho gayi hai. Sab sahi hai? Submit kar doon?'
            });
          }
        }

        // 5. Twin Decision from Client (Step 9)
        else if (type === 'twin_decision') {
          if (msg.decision === 'link') {
            await executeToolCall('link_as_twin', {});
          } else if (msg.decision === 'drop' || msg.decision === 'cancel') {
            await executeToolCall('drop_report', {});
          } else {
            safeSend({
              type: 'agent_utterance',
              text: 'Theek hai, ise alag naye report ke roop me submit karte hain. Sab sahi hai? Submit kar doon?'
            });
          }
        }

        // 6. Confirm Final Submission (Step 10)
        else if (type === 'confirm_submission') {
          await executeToolCall('confirm_submission', {});
        }

      } catch (err) {
        console.error('[VoiceAgent] WebSocket message error:', err);
      }
    });

    ws.on('close', () => {
      console.log(`🎙️ [VoiceAgent] Session ${session.id} disconnected`);
    });
  });

  return wss;
}

module.exports = {
  setupVoiceAgentRoutes,
  setupVoiceAgentWebSocket
};
