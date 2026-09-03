// AI-powered keyword-based challenge classifier for Jharkhand societal challenges
// Uses TF-IDF-style weighted keyword matching across 10 thematic domains

const DOMAIN_KEYWORDS = {
  'Education': {
    keywords: ['school', 'education', 'student', 'teacher', 'classroom', 'literacy', 'dropout', 'learning', 'college', 'university', 'textbook', 'scholarship', 'midday meal', 'anganwadi', 'curriculum', 'exam', 'enrollment', 'girls education', 'digital learning', 'online education'],
    weight: 1.0
  },
  'Healthcare': {
    keywords: ['hospital', 'health', 'medical', 'disease', 'doctor', 'medicine', 'patient', 'clinic', 'malnutrition', 'maternal', 'infant', 'vaccination', 'malaria', 'tuberculosis', 'mental health', 'ambulance', 'primary health center', 'ayushman', 'nutrition', 'sanitation health'],
    weight: 1.0
  },
  'Agriculture': {
    keywords: ['agriculture', 'farming', 'farmer', 'crop', 'irrigation', 'soil', 'fertilizer', 'pesticide', 'harvest', 'kisan', 'drought', 'flood', 'seed', 'organic farming', 'msp', 'pm kisan', 'food security', 'storage', 'market price', 'agri'],
    weight: 1.0
  },
  'Water Management': {
    keywords: ['water', 'drinking water', 'borewell', 'handpump', 'pond', 'river', 'groundwater', 'fluoride', 'arsenic', 'water quality', 'jal jeevan', 'piped water', 'dam', 'watershed', 'rainwater', 'supply', 'shortage', 'contamination', 'well', 'reservoir'],
    weight: 1.0
  },
  'Sanitation & Environment': {
    keywords: ['sanitation', 'toilet', 'swachh', 'waste', 'garbage', 'pollution', 'environment', 'forest', 'biodiversity', 'plastic', 'sewage', 'drainage', 'landfill', 'open defecation', 'hygiene', 'cleanliness', 'air quality', 'water pollution', 'soil erosion', 'deforestation'],
    weight: 1.0
  },
  'Rural Livelihoods': {
    keywords: ['livelihood', 'employment', 'income', 'skill', 'training', 'self help group', 'MNREGA', 'wages', 'handicraft', 'tribal', 'artisan', 'cottage industry', 'microfinance', 'loan', 'poverty', 'migration', 'MSME', 'entrepreneurship', 'rural economy', 'van dhan'],
    weight: 1.0
  },
  'Accessibility': {
    keywords: ['disability', 'accessible', 'wheelchair', 'blind', 'deaf', 'specially abled', 'divyang', 'ramp', 'braille', 'assistive technology', 'sign language', 'barrier free', 'UDID', 'rehabilitation', 'inclusive', 'mobility aid', 'visual impairment', 'hearing impairment'],
    weight: 1.0
  },
  'Urban Infrastructure': {
    keywords: ['road', 'bridge', 'street light', 'urban', 'city', 'housing', 'slum', 'traffic', 'transport', 'bus', 'construction', 'building', 'smart city', 'parking', 'footpath', 'municipality', 'infrastructure', 'pothole', 'flood drain', 'metro'],
    weight: 1.0
  },
  'Public Administration': {
    keywords: ['government', 'service', 'certificate', 'ration', 'pension', 'corruption', 'bureaucracy', 'grievance', 'public service', 'portal', 'e-governance', 'BPL', 'aadhar', 'scheme', 'welfare', 'administration', 'official', 'delay', 'policy', 'RTI'],
    weight: 1.0
  },
  'Energy & Technology': {
    keywords: ['electricity', 'power', 'solar', 'energy', 'internet', 'connectivity', 'digital', 'mobile', '4G', 'broadband', 'technology', 'innovation', 'renewable', 'LED', 'smart', 'IoT', 'AI', 'drone', 'electrification', 'power cut'],
    weight: 1.0
  }
};

/**
 * Classify a challenge into a domain using keyword-based scoring
 * @param {string} title - Challenge title
 * @param {string} description - Challenge description
 * @returns {{ category: string, confidence: number, scores: Object }}
 */
const classifyChallenge = (title, description) => {
  const text = `${title} ${description}`.toLowerCase();
  const scores = {};

  for (const [domain, config] of Object.entries(DOMAIN_KEYWORDS)) {
    let score = 0;
    for (const keyword of config.keywords) {
      const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'g');
      const matches = text.match(regex);
      if (matches) {
        // Title matches are worth more
        const titleMatches = title.toLowerCase().match(regex);
        score += matches.length + (titleMatches ? titleMatches.length * 1.5 : 0);
      }
    }
    scores[domain] = score * config.weight;
  }

  const maxDomain = Object.entries(scores).reduce((a, b) => a[1] > b[1] ? a : b);
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const confidence = totalScore > 0 ? Math.min(maxDomain[1] / totalScore, 0.95) : 0.1;

  return {
    category: maxDomain[1] > 0 ? maxDomain[0] : 'Public Administration',
    confidence: parseFloat(confidence.toFixed(2)),
    scores
  };
};

/**
 * Auto-tag a challenge based on text analysis
 * @param {string} text 
 * @returns {string[]}
 */
const generateTags = (text) => {
  const allKeywords = Object.values(DOMAIN_KEYWORDS).flatMap(d => d.keywords);
  const lowerText = text.toLowerCase();
  return [...new Set(allKeywords.filter(kw => lowerText.includes(kw.toLowerCase())))].slice(0, 8);
};

/**
 * Suggest priority based on urgency keywords in text
 * @param {string} text 
 * @returns {'low'|'medium'|'high'|'urgent'}
 */
const suggestPriority = (text) => {
  const lowerText = text.toLowerCase();
  const urgentWords = ['urgent', 'emergency', 'critical', 'life threatening', 'dying', 'death', 'crisis', 'immediate'];
  const highWords = ['serious', 'severe', 'major', 'significant', 'important', 'hazardous'];
  const lowWords = ['minor', 'small', 'slight', 'trivial'];

  if (urgentWords.some(w => lowerText.includes(w))) return 'urgent';
  if (highWords.some(w => lowerText.includes(w))) return 'high';
  if (lowWords.some(w => lowerText.includes(w))) return 'low';
  return 'medium';
};

module.exports = { classifyChallenge, generateTags, suggestPriority };
