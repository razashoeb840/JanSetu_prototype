// AI-powered challenge classifier & deduplication engine for Jharkhand societal challenges (JanSetu)
// Supports English, Hindi, and Hinglish keyword and semantic pattern matching

const DOMAIN_KEYWORDS = {
  'Water Management': {
    label: 'Water Management (जल आपूर्ति एवं प्रबंधन)',
    icon: '💧',
    keywords: [
      'water', 'drinking water', 'borewell', 'handpump', 'chapakal', 'chapakal kharab', 'pani', 'paani',
      'jal', 'nal', 'nal jal', 'groundwater', 'fluoride', 'arsenic', 'water quality', 'jal jeevan',
      'piped water', 'dam', 'watershed', 'rainwater', 'supply', 'shortage', 'contamination', 'well',
      'reservoir', 'tanker', 'badbu', 'peene ka pani', 'sukha', 'drought'
    ],
    weight: 1.2
  },
  'Urban Infrastructure': {
    label: 'Roads & Infrastructure (सड़क एवं निर्माण)',
    icon: '🛣️',
    keywords: [
      'road', 'sadak', 'rasta', 'gaddha', 'pothole', 'bridge', 'pul', 'pulia', 'street light', 'light',
      'urban', 'city', 'housing', 'slum', 'traffic', 'transport', 'bus', 'construction', 'building',
      'smart city', 'parking', 'footpath', 'municipality', 'infrastructure', 'keechad', 'khasta halat'
    ],
    weight: 1.1
  },
  'Healthcare': {
    label: 'Healthcare & Medicine (स्वास्थ्य एवं चिकित्सा)',
    icon: '🏥',
    keywords: [
      'hospital', 'health', 'medical', 'disease', 'doctor', 'medicine', 'patient', 'clinic', 'malnutrition',
      'maternal', 'infant', 'vaccination', 'malaria', 'tuberculosis', 'mental health', 'ambulance',
      'primary health center', 'phc', 'chc', 'ayushman', 'nutrition', 'dawa', 'dawai', 'bimari',
      'swasthya', 'ilaj', 'mariz', 'chikitsa', 'sarkari aspatal'
    ],
    weight: 1.1
  },
  'Agriculture': {
    label: 'Agriculture & Farming (कृषि एवं किसान)',
    icon: '🌾',
    keywords: [
      'agriculture', 'farming', 'farmer', 'crop', 'irrigation', 'soil', 'fertilizer', 'pesticide',
      'harvest', 'kisan', 'drought', 'flood', 'seed', 'organic farming', 'msp', 'pm kisan', 'food security',
      'storage', 'market price', 'agri', 'kheti', 'fasal', 'beej', 'sinchai', 'anaj', 'khad', 'keeda'
    ],
    weight: 1.1
  },
  'Sanitation & Environment': {
    label: 'Sanitation & Environment (सफाई एवं स्वच्छता)',
    icon: '♻️',
    keywords: [
      'sanitation', 'toilet', 'swachh', 'waste', 'garbage', 'pollution', 'environment', 'forest',
      'biodiversity', 'plastic', 'sewage', 'drainage', 'landfill', 'open defecation', 'hygiene',
      'cleanliness', 'air quality', 'water pollution', 'soil erosion', 'deforestation', 'kachra',
      'gandagi', 'safai', 'nali', 'shauchalaya', 'badbu'
    ],
    weight: 1.1
  },
  'Energy & Technology': {
    label: 'Electricity & Energy (बिजली एवं ऊर्जा)',
    icon: '⚡',
    keywords: [
      'electricity', 'power', 'solar', 'energy', 'internet', 'connectivity', 'digital', 'mobile',
      '4g', '5g', 'broadband', 'technology', 'innovation', 'renewable', 'led', 'electrification',
      'power cut', 'bijli', 'current', 'transformer', 'line', 'tar kata', 'blackout', 'andhera'
    ],
    weight: 1.1
  },
  'Education': {
    label: 'Education & Schools (शिक्षा एवं विद्यालय)',
    icon: '📚',
    keywords: [
      'school', 'education', 'student', 'teacher', 'classroom', 'literacy', 'dropout', 'learning',
      'college', 'university', 'textbook', 'scholarship', 'midday meal', 'anganwadi', 'curriculum',
      'exam', 'enrollment', 'girls education', 'digital learning', 'padhai', 'shiksha', 'vidyalaya',
      'guruji', 'master', 'kitab'
    ],
    weight: 1.0
  },
  'Rural Livelihoods': {
    label: 'Rural Livelihoods & Jobs (रोजगार एवं आजीविका)',
    icon: '💼',
    keywords: [
      'livelihood', 'employment', 'income', 'skill', 'training', 'self help group', 'mnrega', 'mgnrega',
      'wages', 'handicraft', 'tribal', 'artisan', 'cottage industry', 'microfinance', 'loan', 'poverty',
      'migration', 'msme', 'entrepreneurship', 'van dhan', 'rojgar', 'kam', 'vetan', 'samuh'
    ],
    weight: 1.0
  },
  'Accessibility': {
    label: 'Accessibility (दिव्यांग एवं सुगम्यता)',
    icon: '♿',
    keywords: [
      'disability', 'accessible', 'wheelchair', 'blind', 'deaf', 'specially abled', 'divyang', 'ramp',
      'braille', 'assistive technology', 'sign language', 'barrier free', 'udid', 'rehabilitation',
      'inclusive', 'mobility aid', 'viklang', 'sahayata'
    ],
    weight: 1.0
  },
  'Public Administration': {
    label: 'Public Administration (प्रशासन एवं जनसेवा)',
    icon: '🏛️',
    keywords: [
      'government', 'service', 'certificate', 'ration', 'pension', 'corruption', 'bureaucracy',
      'grievance', 'portal', 'e-governance', 'bpl', 'aadhar', 'scheme', 'welfare', 'administration',
      'official', 'delay', 'policy', 'rti', 'sarkari', 'babu', 'rishwat', 'prashasan', 'adhikari'
    ],
    weight: 1.0
  }
};

/**
 * Robust word boundary matcher for keywords (handles English words, Hindi transliteration, and Devanagari)
 */
const matchesKeyword = (keyword, targetText) => {
  if (!keyword || !targetText) return false;
  const kw = keyword.toLowerCase().trim();
  const text = targetText.toLowerCase();

  // If keyword contains space or non-ASCII (Devanagari)
  if (kw.includes(' ') || /[\u0900-\u097F]/.test(kw)) {
    return text.includes(kw);
  }

  // Exact word boundary matching for ASCII keywords to avoid substring false positives (e.g. 'dam' in 'madam')
  const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(?:^|[^a-zA-Z0-9])${escaped}(?:$|[^a-zA-Z0-9])`, 'i');
  return re.test(text);
};

/**
 * Classify text into one of the 10 domains with confidence scoring & compound sentence disambiguation
 */
const classifyChallenge = (title = '', description = '') => {
  const fullText = (title + ' ' + description).toLowerCase();
  const scores = {};

  for (const [domain, config] of Object.entries(DOMAIN_KEYWORDS)) {
    let score = 0;
    for (const keyword of config.keywords) {
      if (matchesKeyword(keyword, fullText)) {
        const inTitle = matchesKeyword(keyword, title.toLowerCase());
        score += inTitle ? 2.5 : 1.2;
      }
    }
    scores[domain] = score * config.weight;
  }

  // ─── COMPOUND CONTEXT DISAMBIGUATION ───
  // 1. Water on road / waterlogged streets -> Urban Infrastructure / Sanitation (NOT Water Management)
  if ((fullText.includes('sadak') || fullText.includes('road') || fullText.includes('gaddha') || fullText.includes('street')) &&
      (fullText.includes('paani') || fullText.includes('pani') || fullText.includes('water') || fullText.includes('naala') || fullText.includes('drain') || fullText.includes('waterlogging'))) {
    scores['Urban Infrastructure'] = (scores['Urban Infrastructure'] || 0) + 5.0;
    scores['Water Management'] = Math.max(0, (scores['Water Management'] || 0) - 4.0);
  }

  // 2. Water for crops / irrigation / drought -> Agriculture (NOT Drinking Water)
  if ((fullText.includes('khet') || fullText.includes('kheti') || fullText.includes('kisan') || fullText.includes('fasal') || fullText.includes('crop')) &&
      (fullText.includes('paani') || fullText.includes('pani') || fullText.includes('sinchai') || fullText.includes('irrigation') || fullText.includes('sukha'))) {
    scores['Agriculture'] = (scores['Agriculture'] || 0) + 5.0;
    scores['Water Management'] = Math.max(0, (scores['Water Management'] || 0) - 3.5);
  }

  // 3. Hospital / Clinic / Doctor / Medicine -> Healthcare
  if (fullText.includes('hospital') || fullText.includes('aspatal') || fullText.includes('doctor') || fullText.includes('dawa') || fullText.includes('ilaaj') || fullText.includes('swasthya')) {
    scores['Healthcare'] = (scores['Healthcare'] || 0) + 4.5;
  }

  // 4. Garbage / Trash / Drainage overflow -> Sanitation & Environment
  if (fullText.includes('kachra') || fullText.includes('kooda') || fullText.includes('garbage') || fullText.includes('safai') || fullText.includes('gandagi') || fullText.includes('durgandh') || fullText.includes('naali')) {
    scores['Sanitation & Environment'] = (scores['Sanitation & Environment'] || 0) + 4.0;
  }

  // 5. Electricity / Transformer / Wire / Power -> Energy & Technology
  if (fullText.includes('bijli') || fullText.includes('light') || fullText.includes('current') || fullText.includes('transformer') || fullText.includes('power cut') || fullText.includes('blackout') || fullText.includes('khamba')) {
    scores['Energy & Technology'] = (scores['Energy & Technology'] || 0) + 4.5;
  }

  let maxDomain = 'Urban Infrastructure';
  let maxScore = -1;
  for (const [domain, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      maxDomain = domain;
    }
  }

  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const confidence = totalScore > 0 ? Math.min(maxScore / (totalScore * 0.75), 0.96) : 0.45;

  return {
    category: maxScore > 0 ? maxDomain : 'Public Administration',
    confidence: parseFloat(confidence.toFixed(2)),
    scores
  };
};

/**
 * Suggest tags from text
 */
const generateTags = (text = '') => {
  const lowerText = text.toLowerCase();
  const tags = [];
  for (const config of Object.values(DOMAIN_KEYWORDS)) {
    for (const kw of config.keywords) {
      if (matchesKeyword(kw, lowerText) && !tags.includes(kw) && kw.length > 3) {
        tags.push(kw);
      }
    }
  }
  return tags.slice(0, 6);
};

/**
 * Suggest priority (normal, high, urgent) based on urgency triggers
 */
const suggestPriority = (text = '') => {
  const lowerText = text.toLowerCase();
  const urgentWords = [
    'urgent', 'emergency', 'critical', 'life threatening', 'dying', 'death', 'crisis',
    'khatarnak', 'turant', 'jaan', 'hazard', 'bleeding', 'accident', 'spark', 'current lag'
  ];
  const highWords = [
    'serious', 'severe', 'major', 'significant', 'hazardous', 'no water', 'broken',
    'kharab', 'problem', 'pareshan', 'band hai', 'chapakal band', 'paani nahi', 'andhera'
  ];
  const lowWords = ['minor', 'small', 'slight', 'trivial', 'chota', 'normal'];

  if (urgentWords.some(w => matchesKeyword(w, lowerText))) return 'urgent';
  if (highWords.some(w => matchesKeyword(w, lowerText))) return 'high';
  if (lowWords.some(w => matchesKeyword(w, lowerText))) return 'normal';
  return 'medium';
};

/**
 * Voice Parser for rural speech: Generates natural, clean, context-accurate titles & descriptions
 */
const parseVoiceTranscript = (transcript = '') => {
  const clean = transcript.trim();
  if (!clean) {
    return {
      title: 'नागरिक समस्या रिपोर्ट',
      description: '',
      category: 'Urban Infrastructure',
      priority: 'medium',
      tags: ['civic']
    };
  }

  const classification = classifyChallenge(clean, clean);
  const priority = suggestPriority(clean);

  // Clean conversational filler words from title
  const cleanedTitle = clean
    .replace(/^(namaste|hello|hi|suno|suniye|arre|dekho|ek problem hai|mera naam|madad chahiye|likho|report karo)\s*,?\s*/i, '')
    .trim();

  // Natural Title Generation without hardcoded false overrides
  let title = cleanedTitle || clean;
  if (title.length > 60) {
    // Truncate at sensible word boundary
    const words = title.split(/\s+/);
    title = words.slice(0, 8).join(' ') + '...';
  }

  // Capitalize first character
  if (title.length > 0) {
    title = title.charAt(0).toUpperCase() + title.slice(1);
  }

  return {
    title,
    description: clean,
    category: classification.category,
    confidence: classification.confidence,
    priority: priority === 'normal' ? 'medium' : (priority || 'medium'),
    tags: generateTags(clean)
  };
};

/**
 * Haversine formula to calculate approximate distance in KM
 */
const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
};

/**
 * Semantic Problem Civic Concept Clusters for Meaning Matching
 * Captures what the citizen is expressing regardless of phrasing or sentence structure
 */
const CIVIC_TOPIC_CLUSTERS = {
  road: ['road', 'sadak', 'street', 'rasta', 'highway', 'lane', 'path', 'सड़क', 'रोड', 'रास्ता'],
  water: ['water', 'paani', 'pani', 'pipe', 'tap', 'nal', 'पानी', 'जल', 'नल', 'पाइप'],
  electricity: ['bijli', 'power', 'electricity', 'light', 'current', 'transformer', 'बिजली', 'लाइट', 'करंट'],
  sanitation: ['garbage', 'kachra', 'trash', 'dustbin', 'safai', 'कचरा', 'कूड़ा', 'सफाई'],
  health: ['hospital', 'doctor', 'clinic', 'davai', 'अस्पताल', 'डॉक्टर', 'दवाई']
};

const SPECIFIC_DEFECT_CLUSTERS = {
  potholes_road_damage: [
    'gaddha', 'gaddhe', 'gaddhon', 'pothole', 'potholes', 'crater', 'broken road', 'tuta', 'tuti',
    'damage', 'damaged', 'pit', 'ditch', 'gadhe', 'accident', 'गड्ढा', 'गड्ढे', 'गड्ढों', 'टूटी',
    'टूटा', 'गड्ढो', 'क्षतिग्रस्त', 'दुर्घटना'
  ],
  road_waterlogging_mud: [
    'waterlogging', 'jalbhavar', 'kichad', 'mud', 'stagnant water', 'water on road', 'कीचड़', 'जलभराव'
  ],
  water_pipe_leakage: [
    'leak', 'leakage', 'phat gaya', 'burst', 'pipe burst', 'pipeline leak', 'water waste',
    'पाइप फटा', 'लीकेज', 'पाइप लीकेज'
  ],
  water_shortage_chapakal: [
    'no water', 'pani nahi', 'paani nahi', 'chapakal band', 'handpump kharab', 'peene ka paani',
    'supply band', 'dry tap', 'chaapaakal', 'चापाकल खराब', 'पानी नहीं', 'हैंडपंप खराब'
  ],
  street_light_outage: [
    'street light', 'light nahi', 'light band', 'andhera', 'darkness', 'bulb', 'pole light',
    'स्ट्रीट लाइट', 'लाइट बंद', 'अंधेरा'
  ],
  electricity_transformer_hazard: [
    'transformer', 'voltage', 'spark', 'current', 'wire tuta', 'hanging wire', 'short circuit',
    'ट्रांसफार्मर', 'हाई वोल्टेज', 'करंट', 'तार टूटा'
  ],
  garbage_waste_dump: [
    'garbage', 'kachra', 'trash', 'dustbin', 'safai nahi', 'kuda', 'dumping', 'badbu', 'smell',
    'कचरा', 'कूड़ा', 'कूड़ेदान', 'सफाई नहीं', 'दुर्गंध'
  ],
  sewage_overflow_drain: [
    'drain overflow', 'naali overflow', 'gutter', 'naala jaam', 'sewer', 'naali band', 'dirty water',
    'नाली जाम', 'सीवर', 'गंदा पानी'
  ]
};

const CIVIC_STOPWORDS = new Set([
  'hai', 'hain', 'ka', 'ki', 'ke', 'ko', 'se', 'me', 'mein', 'par', 'tha', 'thi', 'the',
  'aur', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'from', 'a', 'an', 'the',
  'is', 'are', 'was', 'were', 'it', 'this', 'that', 'there', 'here', 'very', 'bahut', 'bhi',
  'kuch', 'hoga', 'raha', 'rahi', 'rahe', 'karna', 'karo', 'problem', 'samasya', 'issue',
  'complaint', 'please', 'help', 'kripya', 'area', 'near', 'pass', 'road', 'sadak', 'street',
  'rasta', 'water', 'paani', 'pani', 'bijli', 'light'
]);

function extractInformativeTokens(text = '') {
  return text
    .toLowerCase()
    .replace(/[^\w\s\u0900-\u097F]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !CIVIC_STOPWORDS.has(w));
}

function computeSemanticOverlap(textA = '', textB = '') {
  const cleanA = textA.toLowerCase();
  const cleanB = textB.toLowerCase();
  if (!cleanA.trim() || !cleanB.trim()) return 0;

  // 1. Check shared specific defect clusters (the real problem, not just the generic location)
  let defectMatches = 0;
  for (const words of Object.values(SPECIFIC_DEFECT_CLUSTERS)) {
    const hasA = words.some(w => cleanA.includes(w));
    const hasB = words.some(w => cleanB.includes(w));
    if (hasA && hasB) {
      defectMatches++;
    }
  }

  // 2. Token overlap ratio on specific informative words
  const tokensA = extractInformativeTokens(cleanA);
  const tokensB = extractInformativeTokens(cleanB);
  let jaccard = 0;
  if (tokensA.length > 0 && tokensB.length > 0) {
    const setB = new Set(tokensB);
    const common = tokensA.filter(t => setB.has(t));
    jaccard = common.length / Math.max(tokensA.length, tokensB.length);
  }

  // If there are no matching problem defects and no significant token overlap, description does NOT match!
  if (defectMatches === 0 && jaccard < 0.25) {
    return 0;
  }

  let score = 0;
  if (defectMatches > 0) {
    score += Math.min(38, defectMatches * 35);
  }
  score += Math.min(12, Math.round(jaccard * 25));

  return Math.min(45, score);
}

/**
 * Duplicate Problem Detection with strict 70+ Score Threshold
 * Enforces that BOTH Title AND Description must match (heading alone NEVER triggers duplicate)
 */
const findSimilarChallenges = (newReport, candidateList = []) => {
  const newTitle = (newReport.title || '').trim();
  const newDesc = (newReport.description || newReport.desc || '').trim();
  const newCat = (newReport.category || classifyChallenge(newTitle, newDesc).category || '').toLowerCase();
  
  const extractDist = (obj) => {
    if (!obj) return '';
    if (typeof obj.district === 'string') return obj.district.toLowerCase();
    if (obj.location && typeof obj.location.district === 'string') return obj.location.district.toLowerCase();
    if (typeof obj.location === 'string') return obj.location.toLowerCase();
    return '';
  };
  const newDist = extractDist(newReport);
  const newBlock = (newReport.location && newReport.location.block ? newReport.location.block : (newReport.block || '')).toLowerCase();
  const newVillage = (newReport.location && newReport.location.village ? newReport.location.village : (newReport.village || '')).toLowerCase();
  const newCoords = newReport.location && newReport.location.coordinates ? newReport.location.coordinates : (newReport.coords || null);

  const matches = [];

  for (const cand of candidateList) {
    const candTitle = (cand.title || '').trim();
    const candDesc = (cand.description || cand.desc || '').trim();
    const candCat = (cand.category || '').toLowerCase();
    const candLoc = cand.location || {};
    const candDist = extractDist(cand);
    const candBlock = (candLoc.block || cand.block || '').toLowerCase();
    const candVillage = (candLoc.village || cand.village || '').toLowerCase();

    // 1. Description Semantic Intent Match (up to 45 points)
    // CRITICAL: Matches the actual problem details, not just sentence structure
    const descScore = computeSemanticOverlap(newDesc, candDesc);

    // GATEKEEPER 1: If description does NOT match (score < 25), it CANNOT be a duplicate!
    // A matching heading alone will NEVER flag a duplicate!
    if (descScore < 25) {
      continue;
    }

    // 2. Title Match (up to 35 points)
    let titleScore = 0;
    const cleanNewTitle = newTitle.toLowerCase().replace(/[^\w\s\u0900-\u097F]/g, ' ').trim();
    const cleanCandTitle = candTitle.toLowerCase().replace(/[^\w\s\u0900-\u097F]/g, ' ').trim();

    if (cleanNewTitle && cleanCandTitle) {
      if (cleanNewTitle === cleanCandTitle) {
        titleScore = 35;
      } else if (cleanNewTitle.includes(cleanCandTitle) || cleanCandTitle.includes(cleanNewTitle)) {
        titleScore = 32;
      } else {
        const titleTokensA = extractInformativeTokens(cleanNewTitle);
        const titleTokensB = extractInformativeTokens(cleanCandTitle);
        let tokenRatio = 0;
        if (titleTokensA.length > 0 && titleTokensB.length > 0) {
          const common = titleTokensA.filter(t => titleTokensB.includes(t));
          tokenRatio = common.length / Math.max(titleTokensA.length, titleTokensB.length);
        }

        let topicMatch = false;
        for (const words of Object.values(CIVIC_TOPIC_CLUSTERS)) {
          const hasA = words.some(w => cleanNewTitle.includes(w));
          const hasB = words.some(w => cleanCandTitle.includes(w));
          if (hasA && hasB) {
            topicMatch = true;
            break;
          }
        }
        if (topicMatch) {
          titleScore = Math.max(26, Math.round(tokenRatio * 30) + 20);
        } else if (tokenRatio > 0) {
          titleScore = Math.round(tokenRatio * 25);
        }
      }
    }

    // GATEKEEPER 2: Title must also be relevant (score >= 15)
    if (titleScore < 15) {
      continue;
    }

    // 3. Category Match (up to 10 points)
    let catScore = 0;
    if (newCat && candCat) {
      if (newCat === candCat || newCat.includes(candCat) || candCat.includes(newCat)) {
        catScore = 10;
      }
    }

    // 4. Location Proximity (up to 10 points)
    let locScore = 0;
    let distanceKm = null;
    if (newCoords && newCoords.lat && newCoords.lng && candLoc.coordinates && candLoc.coordinates.lat && candLoc.coordinates.lng) {
      distanceKm = calculateDistanceKm(
        newCoords.lat, newCoords.lng,
        candLoc.coordinates.lat, candLoc.coordinates.lng
      );
      if (distanceKm !== null) {
        if (distanceKm <= 2.0) locScore = 10;
        else if (distanceKm <= 5.0) locScore = 7;
        else if (distanceKm <= 15.0) locScore = 4;
      }
    } else {
      if (newVillage && candVillage && newVillage === candVillage) locScore = 10;
      else if (newBlock && candBlock && newBlock === candBlock) locScore = 7;
      else if (newDist && candDist && (newDist === candDist || newDist.includes(candDist) || candDist.includes(newDist))) locScore = 10;
      else locScore = 5;
    }

    // Total composite similarity score (0 - 100)
    const compositeScore = Math.min(99, Math.round(titleScore + descScore + catScore + locScore));

    // STRICT THRESHOLD: Duplicate is detected ONLY if score is 70+
    if (compositeScore >= 70) {
      matches.push({
        id: cand._id || cand.id,
        challengeId: cand.challengeId || cand.id || ('JH-' + (cand._id ? cand._id.toString().slice(-6).toUpperCase() : '625506')),
        title: cand.title,
        description: cand.description || cand.desc,
        category: cand.category,
        status: cand.status,
        district: candDist || 'Jharkhand',
        block: candLoc.block || cand.block || '',
        village: candLoc.village || cand.village || '',
        supportCount: cand.supportCount || cand.supports || (cand.supports && cand.supports.length) || 1,
        distanceKm: distanceKm !== null ? distanceKm : (candBlock === newBlock ? 1.2 : 2.5),
        similarityScore: compositeScore,
        matchScore: compositeScore,
        createdAt: cand.createdAt
      });
    }
  }

  matches.sort((a, b) => b.similarityScore - a.similarityScore);
  return matches.slice(0, 3);
};

module.exports = {
  DOMAIN_KEYWORDS,
  classifyChallenge,
  generateTags,
  suggestPriority,
  parseVoiceTranscript,
  findSimilarChallenges,
  calculateDistanceKm
};
