/**
 * JanSetu Voice Agent — Google Gemini Conversational AI Handler
 * Location: citizen/ai/geminiVoiceRelay.cjs
 * 
 * Provides Google Gemini 1.5 Flash / 2.0 Flash integration with tool calling
 * and strict civic reporting guardrails, identical to Sarvam prompt specs.
 */

const GEMINI_SYSTEM_PROMPT = `Tum JanSetu AI ho — ek helpful voice assistant (Aditya) jo Jharkhand ke citizens ko civic problems report karne aur unka status track karne me madad karta hai. Hamesha English ya Hinglish me hi baat karo, jaisa citizen bole waisa hi. Tu Aditya persona me baat kar — "main samajh gaya", "main aapki madad karunga".

IMPORTANT FLOW RULES — STEP BY STEP:
Tu hamesha EK WAQT ME EK HI SAWAAL poochega. Citizen ke jawab ka intezaar kar, phir AGLA sawaal pooch. Kabhi bhi ek hi baar me saari jaankari mat pooch.
Har step apna alag conversational turn hoga aur citizen ke response ka wait karega. Kabhi bhi do steps ya do sawaal ek saath mat pooch.
Agar tu ek se zyada sawaal ek saath poochta hai, ye galat hai — hamesha ek hi sawaal pooch aur ruk ja.

STEP-BY-STEP CONVERSATION FLOW:
1. Pehle citizen se pooch: "Aapko kya samasya aa rahi hai? Batayiye."
2. Jab citizen samasya bataye, confirm kar: "Theek hai, main samajh gaya. [summary]. Kya ye sahi hai?"
3. Confirm hone ke baad, save_problem_details tool call kar sahi category ke saath, phir bol:
   "Category select ho gayi — [category name]. Ab thoda vistar se bataiye, poori samasya kya hai?"
4. Jab citizen vistar se bataye, unke bole hue baat ko saaf, professional ENGLISH me
   likh kar fill_details tool call kar (description field me) — chahe citizen Hindi/Hinglish
   me bole, description hamesha English me store hona chahiye. Title bhi isi call me
   auto-generate karke bhar de (chhota, 5-8 shabdon ka). Ye karne ke baad bol:
   "Maine description likh liya hai — [title]. Check kar lijiye, sahi hai?"
   Agar citizen "nahi" bole ya correction de, description update kar aur dobara confirm kar —
   is confirmation ko skip mat kar.
5. Confirm hone ke baad hi pooch: "Ye kitni urgent hai — urgent hai ya normal?"
   Jab citizen jawab de, tabhi priority set kar aur fill_details (ya ek chhota
   set_priority tool, agar priority ko details se alag call karna chahte ho) call kar.
   Priority KABHI khud se guess mat kar summary se — hamesha explicitly pooch.
6. Priority set hone ke baad advance_to_step("location") call kar aur bol:
   "Ab location ke liye, upar daayi taraf GPS button dabaiye."
   Jab location_captured event mile, bol: "Theek hai, location mil gayi hai." phir
   advance_to_step("photo") call kar.
7. Pooch: "Kya aapke paas is samasya ki photo hai?"
   - Agar haan: advance_to_step ke through photo-upload UI khulwa, upload hone ka wait kar.
   - Agar nahi: samjhao ki prashasan dwara verification ke liye photo proof anivarya hai.
8. Pooch: "Video hai kya?" — same photo/video guidance.
9. check_duplicate tool call kar. Agar similar problem mile:
   "Ye samasya pehle se kisi aur ne report ki hai — [existing problem ka naam]. Kya aap
   isko usi se link karna chahenge, ya alag se apni khud ki report submit karna chahenge,
   ya isse cancel karna chahenge?"
   Teen alag jawab handle kar:
   - Link chahiye → link_as_twin tool call kar.
   - Alag/naya rakhna hai → normal confirm_submission flow continue kar (twin mat karo).
   - Cancel/drop chahiye → drop_report tool call kar, aur bol:
     "Theek hai, maine ye report cancel kar di hai. Kabhi bhi phir se report kar sakte hain."
   Agar koi similar problem nahi mila, seedha confirm_submission step pe badh.
10. Sab kuch ho jaane ke baad pooch: "Sab sahi hai? Submit kar doon?"
    Sirf explicit haan milne par confirm_submission tool call kar. Submission ke baad:
    "Aapka problem number hai [tracking ID]. Aap ise My Reports me track kar sakte hain.
    JanSetu istemal karne ke liye dhanyawad!"

STRICT TOPIC GUARDRAIL:
Tu SIRF civic problems (sadak, tooti sadak/potholes, paani/nal/pipeline, drainage/naali, kachra/safai, bijli/transformer/streetlight, health/hospital, education/school, agriculture/kisan) report karne aur unka status batane me madad karta hai.
Agar citizen kisi aur topic pe baat kare — movie, cinema, cricket, match score, weather, politics, gossip, general chit-chat, ya kuch bhi jo civic complaint se related nahi hai — to politely mana kar aur wapas topic pe le aa. Example: "Main sirf civic problems me madad kar sakta hoon — aap koi samasya report karna chahte hain kya?" Kabhi bhi off-topic sawal ka seedha jawab mat de.

CATEGORY MAPPING:
* Sadak, asphalt, divider, pothole, pul, traffic signal -> 'Urban Infrastructure'
* Paani, pipeline, nal, contaminated water, jal aapoorti -> 'Water Management'
* Naala, drainage jam, kachra, gandagi, dustbin, safai -> 'Sanitation & Environment'
* Bijli, transformer, current, taar, streetlight -> 'Energy & Technology'
* Hospital, dawa, doctor, swasthya, clinic -> 'Healthcare'
* School, padhai, vidyalaya, shikshak -> 'Education'
* Kheti, fasal, kisan, sinchai -> 'Agriculture'
* Ration, pension, zameen, administrative issue -> 'Public Administration'

RESPONSE RULES:
- Hamesha BAHUT SHORT jawab de — 1 ya MAXIMUM 2 chhote sentences. Lambe paragraphs KABHI mat de.
- Har jawab ke end me AGLE STEP ka EK SAWAAL zaroor pooch.
- English me baat ho rahi ho to English me, Hinglish me ho rahi ho to friendly Hinglish me bol.
- Natural aur friendly reh, jaise ek helpful assistant (Aditya).`;

const GEMINI_FUNCTION_DECLARATIONS = [
  {
    name: 'save_problem_details',
    description: 'Call this as soon as you understand what civic problem the citizen is describing, including its official category, title, description, and priority.',
    parameters: {
      type: 'OBJECT',
      properties: {
        title: {
          type: 'STRING',
          description: 'Concise civic title in Hindi or English (max 50 chars)'
        },
        category: {
          type: 'STRING',
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
          type: 'STRING',
          description: 'Clear, full description of the citizen complaint'
        },
        priority: {
          type: 'STRING',
          enum: ['urgent', 'high', 'normal'],
          description: 'Urgency level inferred from citizen tone or description'
        }
      },
      required: ['title', 'category', 'description']
    }
  },
  {
    name: 'advance_to_step',
    description: 'Call this to advance the citizen UI to the next section in the reporting wizard.',
    parameters: {
      type: 'OBJECT',
      properties: {
        step: {
          type: 'STRING',
          enum: ['category', 'details', 'location', 'photo', 'video', 'check', 'done'],
          description: 'Target step in the flow'
        }
      },
      required: ['step']
    }
  },
  {
    name: 'check_duplicate',
    description: 'Check if a matching problem already exists at or near the citizen location.',
    parameters: {
      type: 'OBJECT',
      properties: {
        title: { type: 'STRING' },
        category: { type: 'STRING' },
        lat: { type: 'NUMBER' },
        lng: { type: 'NUMBER' }
      },
      required: ['title', 'category']
    }
  },
  {
    name: 'fill_details',
    description: 'Fill in the grievance details including English title, professional English description, and optionally priority.',
    parameters: {
      type: 'OBJECT',
      properties: {
        title: { type: 'STRING', description: 'Short professional English title (5-8 words)' },
        description: { type: 'STRING', description: 'Clean, professional English description of the civic complaint' },
        priority: { type: 'STRING', enum: ['urgent', 'normal', 'high'], description: 'Urgency level explicitly confirmed by citizen' }
      },
      required: ['description']
    }
  },
  {
    name: 'set_priority',
    description: 'Set the priority of the civic complaint after citizen explicitly answers.',
    parameters: {
      type: 'OBJECT',
      properties: {
        priority: { type: 'STRING', enum: ['urgent', 'normal', 'high'], description: 'Urgent or normal priority' }
      },
      required: ['priority']
    }
  },
  {
    name: 'evidence_skipped',
    description: 'Call this when the citizen does not have a photo or video to upload, or wants to skip evidence.',
    parameters: {
      type: 'OBJECT',
      properties: {
        step: { type: 'STRING', enum: ['photo', 'video'], description: 'Which evidence step was skipped' }
      }
    }
  },
  {
    name: 'drop_report',
    description: 'Call this when the citizen decides to cancel/withdraw their report after a duplicate is found.',
    parameters: {
      type: 'OBJECT',
      properties: {}
    }
  },
  {
    name: 'link_as_twin',
    description: 'Link the user report to an existing matching grievance.',
    parameters: {
      type: 'OBJECT',
      properties: {
        existingProblemId: { type: 'STRING' }
      },
      required: ['existingProblemId']
    }
  },
  {
    name: 'confirm_submission',
    description: 'Submit the verified civic problem to the database and generate a tracking ID.',
    parameters: {
      type: 'OBJECT',
      properties: {}
    }
  }
];

/**
 * Check if Gemini API is configured in environment
 */
function isGeminiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
}

/**
 * Call Google Gemini Conversational API with identical tool calling and system prompt
 * @param {Object} session - Voice agent active session object
 * @param {string} userText - Citizen transcribed speech input
 * @returns {Promise<Object>} Standardized OpenAI-like choices structure
 */
async function callGeminiConversationalLLM(session, userText) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return { error: 'GEMINI_API_KEY not configured in environment' };
  }

  // Model fallback chain: gemini-1.5-flash -> gemini-2.0-flash -> gemini-1.5-pro
  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  // Format conversational history for Gemini ('user' and 'model' roles)
  const contents = [];
  (session.history || []).slice(-6).forEach(h => {
    if (h.content) {
      contents.push({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }]
      });
    }
  });

  // Append latest user message
  contents.push({
    role: 'user',
    parts: [{ text: userText }]
  });

  const requestBody = {
    systemInstruction: {
      parts: [{ text: GEMINI_SYSTEM_PROMPT }]
    },
    contents,
    tools: [
      {
        functionDeclarations: GEMINI_FUNCTION_DECLARATIONS
      }
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 250
    }
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[GeminiVoiceAgent] API HTTP error:', res.status, errText);
      return { error: `Gemini API error ${res.status}: ${errText}` };
    }

    const data = await res.json();
    if (!data.candidates || data.candidates.length === 0) {
      return { error: 'Gemini returned no candidates' };
    }

    const candidate = data.candidates[0];
    const parts = candidate.content?.parts || [];

    let replyText = '';
    const toolCalls = [];

    for (const part of parts) {
      if (part.text) {
        const t = part.text.trim();
        if (t) {
          replyText += (replyText ? ' ' : '') + t;
        }
      }
      if (part.functionCall) {
        toolCalls.push({
          id: 'call_gemini_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
          type: 'function',
          function: {
            name: part.functionCall.name,
            arguments: JSON.stringify(part.functionCall.args || {})
          }
        });
      }
    }

    return {
      choices: [
        {
          message: {
            role: 'assistant',
            content: replyText || null,
            tool_calls: toolCalls.length > 0 ? toolCalls : null
          }
        }
      ],
      provider: 'gemini'
    };
  } catch (err) {
    console.error('[GeminiVoiceAgent] Network/execution error:', err);
    return { error: err.message };
  }
}

module.exports = {
  callGeminiConversationalLLM,
  isGeminiConfigured,
  GEMINI_SYSTEM_PROMPT,
  GEMINI_FUNCTION_DECLARATIONS
};
