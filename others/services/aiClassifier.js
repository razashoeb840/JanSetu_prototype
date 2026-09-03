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
 * Classify text into one of the 10 domains with confidence scoring
 */
const classifyChallenge = (title = '', description = '') => {
  const text = (title + ' ' + description).toLowerCase();
  const scores = {};

  for (const [domain, config] of Object.entries(DOMAIN_KEYWORDS)) {
    let score = 0;
    for (const keyword of config.keywords) {
      const lowerKw = keyword.toLowerCase();
      if (text.includes(lowerKw)) {
        const inTitle = title.toLowerCase().includes(lowerKw);
        score += inTitle ? 2.5 : 1.0;
      }
    }
    scores[domain] = score * config.weight;
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
      if (lowerText.includes(kw.toLowerCase()) && !tags.includes(kw) && kw.length > 3) {
        tags.push(kw);
      }
    }
  }
  return tags.slice(0, 6);
};

/**
 * Suggest priority (low, medium, high, urgent) based on urgency triggers
 */
const suggestPriority = (text = '') => {
  const lowerText = text.toLowerCase();
  const urgentWords = [
    'urgent', 'emergency', 'critical', 'life threatening', 'dying', 'death', 'crisis',
    'khatarnak', 'turant', 'jaan', 'hazard', 'bleeding', 'accident'
  ];
  const highWords = [
    'serious', 'severe', 'major', 'significant', 'hazardous', 'no water', '3 din se',
    'chapakal band', 'paani nahi', 'broken', 'kharab', 'problem', 'pareshan', 'band hai'
  ];
  const lowWords = ['minor', 'small', 'slight', 'trivial', 'dheere', 'chota'];

  if (urgentWords.some(w => lowerText.includes(w))) return 'urgent';
  if (highWords.some(w => lowerText.includes(w))) return 'high';
  if (lowWords.some(w => lowerText.includes(w))) return 'low';
  return 'medium';
};

/**
 * Voice Parser for rural speech: "Hamare gaon mein teen din se paani nahi aa raha"
 */
const parseVoiceTranscript = (transcript = '') => {
  const clean = transcript.trim();
  if (!clean) {
    return {
      title: 'Gramin Samasya Report',
      description: '',
      category: 'Water Management',
      priority: 'high',
      tags: ['water']
    };
  }

  const classification = classifyChallenge(clean, clean);
  const priority = suggestPriority(clean);

  let title = clean;
  if (clean.length > 80) {
    title = clean.substring(0, 75).trim() + '...';
  }

  const lower = clean.toLowerCase();
  if (lower.includes('paani') || lower.includes('pani') || lower.includes('water')) {
    title = 'पेयजल संकट: ' + (clean.length > 50 ? clean.substring(0, 45) + '...' : clean);
  } else if (lower.includes('sadak') || lower.includes('road') || lower.includes('gaddha')) {
    title = 'सड़क व पुलिया समस्या: ' + (clean.length > 50 ? clean.substring(0, 45) + '...' : clean);
  } else if (lower.includes('bijli') || lower.includes('light') || lower.includes('current')) {
    title = 'बिजली आपूर्ति बाधित: ' + (clean.length > 50 ? clean.substring(0, 45) + '...' : clean);
  }

  return {
    title,
    description: clean,
    category: classification.category,
    confidence: classification.confidence,
    priority: priority || 'high',
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
 * Duplicate Problem Detection
 */
const findSimilarChallenges = (newReport, candidateList = []) => {
  const newCat = newReport.category || classifyChallenge(newReport.title || '', newReport.description || '').category;
  const newText = ((newReport.title || '') + ' ' + (newReport.description || '')).toLowerCase();
  const newDist = (newReport.location && newReport.location.district ? newReport.location.district : '').toLowerCase();
  const newBlock = (newReport.location && newReport.location.block ? newReport.location.block : '').toLowerCase();
  const newVillage = (newReport.location && newReport.location.village ? newReport.location.village : '').toLowerCase();
  const newCoords = newReport.location && newReport.location.coordinates ? newReport.location.coordinates : null;

  const matches = [];

  for (const cand of candidateList) {
    let score = 0;
    const candCat = cand.category;
    const candText = ((cand.title || '') + ' ' + (cand.description || '')).toLowerCase();
    const candLoc = cand.location || {};
    const candDist = (candLoc.district || '').toLowerCase();
    const candBlock = (candLoc.block || '').toLowerCase();
    const candVillage = (candLoc.village || '').toLowerCase();

    if (newCat && candCat && newCat.toLowerCase() === candCat.toLowerCase()) {
      score += 40;
    }

    if (newDist && candDist && newDist === candDist) {
      score += 20;
    }
    if (newBlock && candBlock && newBlock === candBlock) {
      score += 20;
    }
    if (newVillage && candVillage && newVillage === candVillage) {
      score += 25;
    }

    let distanceKm = null;
    if (newCoords && newCoords.lat && newCoords.lng && candLoc.coordinates && candLoc.coordinates.lat && candLoc.coordinates.lng) {
      distanceKm = calculateDistanceKm(
        newCoords.lat, newCoords.lng,
        candLoc.coordinates.lat, candLoc.coordinates.lng
      );
      if (distanceKm !== null) {
        if (distanceKm <= 2.0) score += 35;
        else if (distanceKm <= 5.0) score += 20;
        else if (distanceKm <= 15.0) score += 10;
      }
    }

    const keywords = generateTags(newText);
    let commonKwCount = 0;
    for (const kw of keywords) {
      if (candText.includes(kw.toLowerCase())) commonKwCount++;
    }
    if (keywords.length > 0) {
      score += Math.min(30, (commonKwCount / keywords.length) * 35);
    }

    if (score >= 45) {
      matches.push({
        id: cand._id,
        challengeId: cand.challengeId || ('JH-' + cand._id.toString().slice(-6).toUpperCase()),
        title: cand.title,
        category: cand.category,
        status: cand.status,
        district: candLoc.district || 'Jharkhand',
        block: candLoc.block || '',
        village: candLoc.village || '',
        supportCount: cand.supportCount || (cand.supports ? cand.supports.length : 0),
        distanceKm: distanceKm !== null ? distanceKm : (candBlock === newBlock ? 1.2 : 4.5),
        similarityScore: Math.min(98, Math.round(score)),
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
