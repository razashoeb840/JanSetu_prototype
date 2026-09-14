/* ============================================================
   pan-india-heatmap.js — JanSetu Pan-India & District Geo-Heatmap
   Interactive Multi-State & District Civic Challenge Intelligence
   Empowers Admin Command & Industry CSR Discovery
   ============================================================ */

(function(window) {
  'use strict';

  // Comprehensive Indian States Geodata
  const INDIA_STATES_DATA = [
    {
      state: 'Jharkhand',
      lat: 23.6102,
      lng: 85.2799,
      zoom: 7.6,
      total: 1890,
      active: 1545,
      resolved: 345,
      urgent: 380,
      districts: [
        { name: 'Ranchi', lat: 23.3441, lng: 85.3096, challenges: 34, priority: 'high', categories: { 'Water Management': 14, 'Urban Infrastructure': 10, 'Sanitation & Environment': 6, 'Healthcare': 4 } },
        { name: 'Dhanbad', lat: 23.7957, lng: 86.4304, challenges: 28, priority: 'high', categories: { 'Sanitation & Environment': 12, 'Healthcare': 8, 'Water Management': 5, 'Energy & Technology': 3 } },
        { name: 'East Singhbhum', lat: 22.8046, lng: 86.2029, challenges: 26, priority: 'high', categories: { 'Water Management': 10, 'Urban Infrastructure': 8, 'Healthcare': 5, 'Education': 3 } },
        { name: 'Bokaro', lat: 23.6693, lng: 86.1511, challenges: 21, priority: 'medium', categories: { 'Energy & Technology': 8, 'Sanitation & Environment': 6, 'Healthcare': 4, 'Education': 3 } },
        { name: 'Hazaribagh', lat: 23.9960, lng: 85.3644, challenges: 18, priority: 'medium', categories: { 'Rural Livelihoods': 7, 'Water Management': 6, 'Agriculture': 3, 'Healthcare': 2 } },
        { name: 'Deoghar', lat: 24.4826, lng: 86.7000, challenges: 16, priority: 'medium', categories: { 'Healthcare': 6, 'Water Management': 5, 'Sanitation & Environment': 3, 'Education': 2 } },
        { name: 'Giridih', lat: 24.1856, lng: 86.3094, challenges: 15, priority: 'medium', categories: { 'Rural Livelihoods': 6, 'Education': 4, 'Water Management': 3, 'Healthcare': 2 } },
        { name: 'Palamu', lat: 24.0416, lng: 84.0722, challenges: 14, priority: 'high', categories: { 'Water Management': 7, 'Agriculture': 4, 'Rural Livelihoods': 2, 'Healthcare': 1 } },
        { name: 'Ramgarh', lat: 23.6275, lng: 85.5134, challenges: 12, priority: 'medium', categories: { 'Water Management': 5, 'Sanitation & Environment': 4, 'Healthcare': 3 } },
        { name: 'Dumka', lat: 24.2690, lng: 87.2470, challenges: 11, priority: 'medium', categories: { 'Healthcare': 4, 'Education': 4, 'Water Management': 3 } },
        { name: 'West Singhbhum', lat: 22.6049, lng: 85.6049, challenges: 11, priority: 'medium', categories: { 'Rural Livelihoods': 5, 'Healthcare': 3, 'Water Management': 3 } },
        { name: 'Sahebganj', lat: 25.2459, lng: 87.6744, challenges: 9, priority: 'low', categories: { 'Water Management': 4, 'Sanitation & Environment': 3, 'Agriculture': 2 } },
        { name: 'Godda', lat: 24.8284, lng: 87.2143, challenges: 8, priority: 'low', categories: { 'Agriculture': 4, 'Water Management': 2, 'Healthcare': 2 } },
        { name: 'Jamtara', lat: 23.9600, lng: 86.8016, challenges: 8, priority: 'low', categories: { 'Education': 4, 'Cyber Awareness': 2, 'Water Management': 2 } },
        { name: 'Koderma', lat: 24.4625, lng: 85.5909, challenges: 7, priority: 'low', categories: { 'Energy & Technology': 3, 'Healthcare': 2, 'Water Management': 2 } },
        { name: 'Gumla', lat: 23.0440, lng: 84.5420, challenges: 7, priority: 'low', categories: { 'Agriculture': 3, 'Rural Livelihoods': 2, 'Healthcare': 2 } },
        { name: 'Simdega', lat: 22.6186, lng: 84.5097, challenges: 6, priority: 'low', categories: { 'Healthcare': 3, 'Education': 2, 'Water Management': 1 } },
        { name: 'Lohardaga', lat: 23.4337, lng: 84.6800, challenges: 6, priority: 'low', categories: { 'Rural Livelihoods': 3, 'Water Management': 2, 'Healthcare': 1 } },
        { name: 'Latehar', lat: 23.7439, lng: 84.5034, challenges: 6, priority: 'low', categories: { 'Rural Livelihoods': 3, 'Water Management': 2, 'Education': 1 } },
        { name: 'Chatra', lat: 24.2032, lng: 84.8670, challenges: 5, priority: 'low', categories: { 'Water Management': 2, 'Agriculture': 2, 'Healthcare': 1 } },
        { name: 'Khunti', lat: 23.0722, lng: 85.2796, challenges: 5, priority: 'low', categories: { 'Agriculture': 3, 'Rural Livelihoods': 1, 'Healthcare': 1 } },
        { name: 'Seraikela Kharsawan', lat: 22.4988, lng: 85.9978, challenges: 5, priority: 'low', categories: { 'Urban Infrastructure': 2, 'Sanitation & Environment': 2, 'Water Management': 1 } },
        { name: 'Garhwa', lat: 24.1627, lng: 83.8055, challenges: 5, priority: 'low', categories: { 'Water Management': 3, 'Agriculture': 1, 'Healthcare': 1 } },
        { name: 'Pakur', lat: 24.6338, lng: 87.8488, challenges: 4, priority: 'low', categories: { 'Water Management': 2, 'Healthcare': 1, 'Education': 1 } }
      ]
    },
    {
      state: 'Maharashtra',
      lat: 19.7515,
      lng: 75.7139,
      zoom: 6.8,
      total: 2341,
      active: 1859,
      resolved: 482,
      urgent: 345,
      districts: [
        { name: 'Mumbai Urban', lat: 18.9220, lng: 72.8347, challenges: 42, priority: 'high', categories: { 'Urban Infrastructure': 18, 'Sanitation & Environment': 14, 'Water Management': 10 } },
        { name: 'Mumbai Suburban', lat: 19.0760, lng: 72.8777, challenges: 38, priority: 'high', categories: { 'Urban Infrastructure': 16, 'Water Management': 12, 'Healthcare': 10 } },
        { name: 'Pune', lat: 18.5204, lng: 73.8567, challenges: 32, priority: 'high', categories: { 'Urban Infrastructure': 14, 'Water Management': 10, 'Education': 8 } },
        { name: 'Nagpur', lat: 21.1458, lng: 79.0882, challenges: 24, priority: 'medium', categories: { 'Healthcare': 10, 'Agriculture': 8, 'Water Management': 6 } },
        { name: 'Nashik', lat: 19.9975, lng: 73.7898, challenges: 20, priority: 'medium', categories: { 'Agriculture': 11, 'Water Management': 6, 'Healthcare': 3 } },
        { name: 'Thane', lat: 19.2183, lng: 72.9781, challenges: 22, priority: 'medium', categories: { 'Urban Infrastructure': 10, 'Sanitation & Environment': 8, 'Water Management': 4 } },
        { name: 'Aurangabad', lat: 19.8762, lng: 75.3433, challenges: 18, priority: 'medium', categories: { 'Water Management': 9, 'Agriculture': 5, 'Healthcare': 4 } }
      ]
    },
    {
      state: 'Delhi',
      lat: 28.6139,
      lng: 77.2090,
      zoom: 10.5,
      total: 2105,
      active: 1715,
      resolved: 390,
      urgent: 412,
      districts: [
        { name: 'Central Delhi', lat: 28.6453, lng: 77.2183, challenges: 28, priority: 'high', categories: { 'Sanitation & Environment': 12, 'Urban Infrastructure': 10, 'Healthcare': 6 } },
        { name: 'South Delhi', lat: 28.5355, lng: 77.2410, challenges: 32, priority: 'high', categories: { 'Urban Infrastructure': 14, 'Water Management': 10, 'Sanitation & Environment': 8 } },
        { name: 'North Delhi', lat: 28.7180, lng: 77.1650, challenges: 24, priority: 'medium', categories: { 'Sanitation & Environment': 11, 'Water Management': 8, 'Education': 5 } },
        { name: 'East Delhi', lat: 28.6277, lng: 77.2783, challenges: 26, priority: 'high', categories: { 'Sanitation & Environment': 13, 'Urban Infrastructure': 8, 'Healthcare': 5 } },
        { name: 'West Delhi', lat: 28.6369, lng: 77.0945, challenges: 21, priority: 'medium', categories: { 'Water Management': 9, 'Urban Infrastructure': 8, 'Healthcare': 4 } }
      ]
    },
    {
      state: 'Karnataka',
      lat: 15.3173,
      lng: 75.7139,
      zoom: 6.8,
      total: 1245,
      active: 955,
      resolved: 290,
      urgent: 180,
      districts: [
        { name: 'Bengaluru Urban', lat: 12.9716, lng: 77.5946, challenges: 38, priority: 'high', categories: { 'Urban Infrastructure': 16, 'Water Management': 12, 'Energy & Technology': 10 } },
        { name: 'Mysuru', lat: 12.2958, lng: 76.6394, challenges: 20, priority: 'medium', categories: { 'Water Management': 8, 'Tourism & Heritage': 6, 'Sanitation & Environment': 6 } },
        { name: 'Hubballi-Dharwad', lat: 15.3647, lng: 75.1240, challenges: 18, priority: 'medium', categories: { 'Agriculture': 8, 'Water Management': 6, 'Healthcare': 4 } },
        { name: 'Mangaluru', lat: 12.9141, lng: 74.8560, challenges: 16, priority: 'medium', categories: { 'Sanitation & Environment': 8, 'Healthcare': 5, 'Water Management': 3 } }
      ]
    },
    {
      state: 'Uttar Pradesh',
      lat: 26.8467,
      lng: 80.9462,
      zoom: 6.8,
      total: 1450,
      active: 930,
      resolved: 520,
      urgent: 290,
      districts: [
        { name: 'Lucknow', lat: 26.8467, lng: 80.9462, challenges: 30, priority: 'high', categories: { 'Urban Infrastructure': 12, 'Healthcare': 10, 'Sanitation & Environment': 8 } },
        { name: 'Kanpur', lat: 26.4499, lng: 80.3319, challenges: 26, priority: 'high', categories: { 'Water Management': 11, 'Sanitation & Environment': 9, 'Healthcare': 6 } },
        { name: 'Varanasi', lat: 25.3176, lng: 82.9739, challenges: 24, priority: 'high', categories: { 'Water Management': 12, 'Sanitation & Environment': 7, 'Tourism & Heritage': 5 } },
        { name: 'Prayagraj', lat: 25.4358, lng: 81.8463, challenges: 20, priority: 'medium', categories: { 'Water Management': 9, 'Education': 6, 'Healthcare': 5 } },
        { name: 'Agra', lat: 27.1767, lng: 78.0081, challenges: 19, priority: 'medium', categories: { 'Water Management': 8, 'Sanitation & Environment': 7, 'Urban Infrastructure': 4 } }
      ]
    },
    {
      state: 'West Bengal',
      lat: 22.9868,
      lng: 87.8550,
      zoom: 7.2,
      total: 912,
      active: 732,
      resolved: 180,
      urgent: 140,
      districts: [
        { name: 'Kolkata', lat: 22.5726, lng: 88.3639, challenges: 35, priority: 'high', categories: { 'Sanitation & Environment': 15, 'Urban Infrastructure': 12, 'Healthcare': 8 } },
        { name: 'Howrah', lat: 22.5958, lng: 88.2636, challenges: 24, priority: 'high', categories: { 'Water Management': 11, 'Sanitation & Environment': 8, 'Urban Infrastructure': 5 } },
        { name: 'Asansol-Durgapur', lat: 23.6889, lng: 86.9661, challenges: 18, priority: 'medium', categories: { 'Energy & Technology': 7, 'Healthcare': 6, 'Water Management': 5 } },
        { name: 'Siliguri', lat: 26.7271, lng: 88.3953, challenges: 14, priority: 'medium', categories: { 'Rural Livelihoods': 6, 'Healthcare': 5, 'Education': 3 } }
      ]
    },
    {
      state: 'Gujarat',
      lat: 22.2587,
      lng: 71.1924,
      zoom: 7.0,
      total: 980,
      active: 770,
      resolved: 210,
      urgent: 160,
      districts: [
        { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714, challenges: 30, priority: 'high', categories: { 'Urban Infrastructure': 14, 'Water Management': 9, 'Healthcare': 7 } },
        { name: 'Surat', lat: 21.1702, lng: 72.8311, challenges: 25, priority: 'medium', categories: { 'Sanitation & Environment': 11, 'Water Management': 8, 'Healthcare': 6 } },
        { name: 'Vadodara', lat: 22.3072, lng: 73.1812, challenges: 18, priority: 'medium', categories: { 'Water Management': 8, 'Education': 6, 'Energy & Technology': 4 } }
      ]
    },
    {
      state: 'Bihar',
      lat: 25.0961,
      lng: 85.3131,
      zoom: 7.4,
      total: 460,
      active: 335,
      resolved: 125,
      urgent: 95,
      districts: [
        { name: 'Patna', lat: 25.5941, lng: 85.1376, challenges: 28, priority: 'high', categories: { 'Education': 11, 'Sanitation & Environment': 9, 'Healthcare': 8 } },
        { name: 'Gaya', lat: 24.7914, lng: 85.0002, challenges: 17, priority: 'medium', categories: { 'Water Management': 8, 'Rural Livelihoods': 5, 'Education': 4 } },
        { name: 'Muzaffarpur', lat: 26.1209, lng: 85.3647, challenges: 15, priority: 'medium', categories: { 'Agriculture': 7, 'Healthcare': 5, 'Water Management': 3 } }
      ]
    },
    {
      state: 'Tamil Nadu',
      lat: 11.1271,
      lng: 78.6569,
      zoom: 7.0,
      total: 654,
      active: 514,
      resolved: 140,
      urgent: 95,
      districts: [
        { name: 'Chennai', lat: 13.0827, lng: 80.2707, challenges: 28, priority: 'high', categories: { 'Water Management': 12, 'Urban Infrastructure': 10, 'Sanitation & Environment': 6 } },
        { name: 'Coimbatore', lat: 11.0168, lng: 76.9558, challenges: 18, priority: 'medium', categories: { 'Energy & Technology': 7, 'Water Management': 6, 'Healthcare': 5 } },
        { name: 'Madurai', lat: 9.9252, lng: 78.1198, challenges: 15, priority: 'medium', categories: { 'Agriculture': 6, 'Water Management': 5, 'Healthcare': 4 } }
      ]
    },
    {
      state: 'Rajasthan',
      lat: 27.0238,
      lng: 74.2179,
      zoom: 6.8,
      total: 580,
      active: 450,
      resolved: 130,
      urgent: 110,
      districts: [
        { name: 'Jaipur', lat: 26.9124, lng: 75.7873, challenges: 26, priority: 'high', categories: { 'Water Management': 13, 'Urban Infrastructure': 8, 'Tourism': 5 } },
        { name: 'Jodhpur', lat: 26.2389, lng: 73.0243, challenges: 19, priority: 'high', categories: { 'Water Management': 11, 'Rural Livelihoods': 5, 'Agriculture': 3 } },
        { name: 'Udaipur', lat: 24.5854, lng: 73.7125, challenges: 14, priority: 'medium', categories: { 'Water Management': 7, 'Education': 4, 'Healthcare': 3 } }
      ]
    },
    {
      state: 'Madhya Pradesh',
      lat: 22.9734,
      lng: 78.6569,
      zoom: 6.8,
      total: 490,
      active: 385,
      resolved: 105,
      urgent: 85,
      districts: [
        { name: 'Bhopal', lat: 23.2599, lng: 77.4126, challenges: 22, priority: 'medium', categories: { 'Urban Infrastructure': 9, 'Water Management': 7, 'Healthcare': 6 } },
        { name: 'Indore', lat: 22.7196, lng: 75.8577, challenges: 20, priority: 'medium', categories: { 'Sanitation & Environment': 8, 'Urban Infrastructure': 7, 'Healthcare': 5 } }
      ]
    },
    {
      state: 'Odisha',
      lat: 20.9517,
      lng: 85.0985,
      zoom: 7.2,
      total: 380,
      active: 285,
      resolved: 95,
      urgent: 60,
      districts: [
        { name: 'Bhubaneswar', lat: 20.2961, lng: 85.8189, challenges: 18, priority: 'medium', categories: { 'Urban Infrastructure': 8, 'Healthcare': 6, 'Water Management': 4 } },
        { name: 'Cuttack', lat: 20.4625, lng: 85.8830, challenges: 14, priority: 'medium', categories: { 'Water Management': 6, 'Sanitation & Environment': 5, 'Healthcare': 3 } }
      ]
    },
    {
      state: 'Punjab',
      lat: 31.1471,
      lng: 75.3412,
      zoom: 7.8,
      total: 340,
      active: 250,
      resolved: 90,
      urgent: 45,
      districts: [
        { name: 'Ludhiana', lat: 30.9010, lng: 75.8573, challenges: 16, priority: 'medium', categories: { 'Sanitation & Environment': 7, 'Agriculture': 5, 'Healthcare': 4 } },
        { name: 'Amritsar', lat: 31.6340, lng: 74.8723, challenges: 14, priority: 'medium', categories: { 'Urban Infrastructure': 6, 'Water Management': 5, 'Healthcare': 3 } }
      ]
    },
    {
      state: 'Kerala',
      lat: 10.8505,
      lng: 76.2711,
      zoom: 7.5,
      total: 290,
      active: 230,
      resolved: 60,
      urgent: 30,
      districts: [
        { name: 'Ernakulam (Kochi)', lat: 9.9816, lng: 76.2999, challenges: 16, priority: 'medium', categories: { 'Sanitation & Environment': 7, 'Healthcare': 5, 'Water Management': 4 } },
        { name: 'Thiruvananthapuram', lat: 8.5241, lng: 76.9366, challenges: 14, priority: 'low', categories: { 'Education': 6, 'Healthcare': 5, 'Urban Infrastructure': 3 } }
      ]
    },
    {
      state: 'Telangana',
      lat: 18.1124,
      lng: 79.0193,
      zoom: 7.2,
      total: 512,
      active: 402,
      resolved: 110,
      urgent: 75,
      districts: [
        { name: 'Hyderabad', lat: 17.3850, lng: 78.4867, challenges: 28, priority: 'high', categories: { 'Urban Infrastructure': 13, 'Water Management': 9, 'Energy & Technology': 6 } },
        { name: 'Warangal', lat: 17.9689, lng: 79.5941, challenges: 14, priority: 'medium', categories: { 'Agriculture': 6, 'Healthcare': 5, 'Water Management': 3 } }
      ]
    },
    {
      state: 'Assam',
      lat: 26.2006,
      lng: 92.9376,
      zoom: 7.2,
      total: 210,
      active: 155,
      resolved: 55,
      urgent: 40,
      districts: [
        { name: 'Guwahati (Kamrup)', lat: 26.1445, lng: 91.7362, challenges: 16, priority: 'medium', categories: { 'Water Management': 7, 'Sanitation & Environment': 5, 'Healthcare': 4 } }
      ]
    },
    {
      state: 'Haryana',
      lat: 29.0588,
      lng: 76.0856,
      zoom: 7.8,
      total: 195,
      active: 145,
      resolved: 50,
      urgent: 35,
      districts: [
        { name: 'Gurugram', lat: 28.4595, lng: 77.0266, challenges: 18, priority: 'medium', categories: { 'Urban Infrastructure': 9, 'Sanitation & Environment': 5, 'Water Management': 4 } }
      ]
    },
    {
      state: 'Uttarakhand',
      lat: 30.0668,
      lng: 79.0193,
      zoom: 7.8,
      total: 160,
      active: 120,
      resolved: 40,
      urgent: 25,
      districts: [
        { name: 'Dehradun', lat: 30.3165, lng: 78.0322, challenges: 14, priority: 'medium', categories: { 'Sanitation & Environment': 6, 'Water Management': 5, 'Healthcare': 3 } }
      ]
    },
    {
      state: 'Chhattisgarh',
      lat: 21.2787,
      lng: 81.8661,
      zoom: 7.2,
      total: 150,
      active: 110,
      resolved: 40,
      urgent: 25,
      districts: [
        { name: 'Raipur', lat: 21.2514, lng: 81.6296, challenges: 15, priority: 'medium', categories: { 'Urban Infrastructure': 6, 'Water Management': 5, 'Healthcare': 4 } }
      ]
    }
  ];

  
  function getChallengeMedia(p) {
    const photos = [];
    const videos = [];

    if (Array.isArray(p.attachments) && p.attachments.length > 0) {
      p.attachments.forEach(att => {
        const url = att.url || (att.filename ? '/uploads/challenges/' + att.filename : null);
        if (!url) return;
        const mime = (att.mimetype || '').toLowerCase();
        if (mime.startsWith('video/') || url.match(/\.(mp4|webm|mov|mkv)$/i)) {
          videos.push({ url, title: att.originalName || 'Citizen Field Video Evidence', isReal: true });
        } else {
          photos.push({ url, title: att.originalName || 'Citizen Ground Photo', isReal: true });
        }
      });
    }

    if (p.resolutionProof?.beforeImage && !photos.some(x => x.url === p.resolutionProof.beforeImage)) {
      photos.unshift({ url: p.resolutionProof.beforeImage, title: 'Initial Citizen Ground Photo', isReal: true });
    }
    if (p.coverImage && !photos.some(x => x.url === p.coverImage)) {
      photos.unshift({ url: p.coverImage, title: 'Citizen Ground Photo', isReal: true });
    }
    if (p.image && !photos.some(x => x.url === p.image)) {
      photos.unshift({ url: p.image, title: 'Citizen Ground Photo', isReal: true });
    }
    if (p.videoUrl && !videos.some(x => x.url === p.videoUrl)) {
      videos.unshift({ url: p.videoUrl, title: 'Citizen Field Video', isReal: true });
    }

    if (photos.length === 0) {
      const text = ((p.title || '') + ' ' + (p.category || '')).toLowerCase();
      let img = '/others/images/pothole-road.jpg';
      let label = 'Civic Infrastructure Ground Evidence';
      if (text.includes('water') || text.includes('leak') || text.includes('contamination') || text.includes('pipe')) {
        img = '/others/images/water-tap.jpg';
        label = 'Ground Evidence: Water supply & leakage';
      } else if (text.includes('garbage') || text.includes('waste') || text.includes('sanitation') || text.includes('drain')) {
        img = '/others/images/garbage-street.jpg';
        label = 'Ground Evidence: Municipal sanitation';
      } else if (text.includes('light') || text.includes('solar') || text.includes('electricity') || text.includes('power')) {
        img = '/others/images/street-light.jpg';
        label = 'Ground Evidence: Energy access & lighting';
      }
      photos.push({ url: img, title: label, isReal: false });
    }

    return { photos, videos };
  }

  class PanIndiaHeatmap {
    constructor(options) {
      this.containerId = options.containerId || 'india-heatmap';
      this.panelId = options.panelId || options.detailPanelId || 'districtDetailPanel';
      this.selectId = options.selectId || options.stateSelectId || 'stateFilterSelect';
      this.categorySelectId = options.categorySelectId || options.categoryFilterId || 'mapCategoryFilter';
      this.role = options.role || 'admin'; // 'admin' or 'industry'
      this.map = null;
      this.activeLayerGroup = null;
      this.currentState = 'ALL';
      this.currentCategory = '';
      this.liveChallenges = [];
      this.init();
    }

    async init() {
      const container = document.getElementById(this.containerId);
      if (!container) return;

      // Ensure explicit height
      if (!container.style.height && !container.offsetHeight) {
        container.style.height = '530px';
      }

      this.initLeafletMap();
      this.populateStateDropdown();
      this.setupEventListeners();
      await this.fetchLiveChallenges();
      this.render();
    }

    
    findNearestDistrict(lat, lng) {
      let closest = null;
      let minDist = Infinity;
      const stateCandidates = (this.currentState && this.currentState !== 'ALL')
        ? INDIA_STATES_DATA.filter(s => s.state.toLowerCase() === this.currentState.toLowerCase())
        : INDIA_STATES_DATA;

      stateCandidates.forEach(s => {
        (s.districts || []).forEach(d => {
          const dist = Math.hypot(d.lat - lat, d.lng - lng);
          if (dist < minDist) {
            minDist = dist;
            closest = { district: d, stateName: s.state };
          }
        });
      });

      return closest;
    }

    initLeafletMap() {
      if (this.map) {
        this.map.remove();
        this.map = null;
      }

      const container = document.getElementById(this.containerId);
      container.innerHTML = '';

      this.map = L.map(this.containerId, {
        center: [22.8, 80.5],
        zoom: 4.8,
        zoomControl: true,
        attributionControl: false,
        minZoom: 3.8,
        maxZoom: 16
      });

      this.baseLayers = {
        satellite: L.layerGroup([
          L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 19,
            attribution: '&copy; Esri, Maxar, Earthstar Geographics'
          }),
          L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 19,
            attribution: '&copy; Esri'
          })
        ]),
        voyager: L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          subdomains: 'abcd',
          maxZoom: 19,
          attribution: '&copy; CartoDB, OpenStreetMap'
        }),
        dark: L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          subdomains: 'abcd',
          maxZoom: 19,
          attribution: '&copy; CartoDB, OpenStreetMap'
        })
      };

      // Default to Realistic Satellite Hybrid
      this.currentBasemapMode = 'satellite';
      this.baseLayers.satellite.addTo(this.map);

      this.activeLayerGroup = L.layerGroup().addTo(this.map);

      // Inject modern Glass Telemetry HUD & Controls
      this.injectMapHUD(container);

      this.map.on('click', (e) => {
        const nearest = this.findNearestDistrict(e.latlng.lat, e.latlng.lng);
        if (nearest) {
          this.showDistrictDetail(nearest.district, nearest.stateName);
          L.popup()
            .setLatLng([nearest.district.lat, nearest.district.lng])
            .setContent(
              '<div style="font-family:\'Inter\',sans-serif;padding:6px;min-width:180px">' +
              '<div style="font-weight:900;font-size:14px;color:#0F172A">📍 ' + nearest.district.name + '</div>' +
              '<div style="font-size:11.5px;color:#64748B;margin-top:2px">' + nearest.stateName + ' · <b>' + nearest.district.challenges + '</b> reported issues</div>' +
              '<div style="margin-top:8px;font-size:11px;color:#002D62;font-weight:750;background:#EFF6FF;padding:4px 8px;border-radius:6px">' +
              'Showing ground problems &amp; photo/video evidence below ↓' +
              '</div></div>'
            )
            .openOn(this.map);
        }
      });


      // Invalidate size on resize
      setTimeout(() => {
        if (this.map) this.map.invalidateSize();
      }, 250);
    }

    switchBasemap(mode) {
      if (!this.baseLayers || !this.baseLayers[mode] || this.currentBasemapMode === mode) return;
      if (this.baseLayers[this.currentBasemapMode]) {
        this.map.removeLayer(this.baseLayers[this.currentBasemapMode]);
      }
      this.currentBasemapMode = mode;
      this.baseLayers[mode].addTo(this.map);
      if (this.activeLayerGroup) {
        this.activeLayerGroup.bringToFront();
      }
      const container = document.getElementById(this.containerId);
      if (container) {
        container.querySelectorAll('.map-mode-btn').forEach(btn => {
          btn.classList.toggle('active', btn.dataset.mode === mode);
        });
      }
    }

    injectMapHUD(container) {
      if (!container) return;
      const hud = document.createElement('div');
      hud.className = 'map-hud-overlay';
      hud.innerHTML = `
        <div class="map-hud-left">
          <div class="map-hud-live-tag">
            <span class="live-dot-pulse"></span>
            <span>LIVE SATELLITE RADAR</span>
          </div>
          <span class="map-hud-subtext">28 States &amp; UTs Real-Time GIS</span>
        </div>
        <div class="map-hud-right">
          <div class="map-hud-switcher">
            <button class="map-mode-btn active" data-mode="satellite" title="Photorealistic Satellite Hybrid">🛰️ Satellite</button>
            <button class="map-mode-btn" data-mode="voyager" title="Modern Clean Vector Map">🗺️ Vector</button>
            <button class="map-mode-btn" data-mode="dark" title="Dark Command Center">🌙 Dark</button>
          </div>
          <button class="map-hud-btn" id="${this.containerId}_radar_btn" title="Toggle Radar Scanning Beam">📡 Radar</button>
          <button class="map-hud-btn" id="${this.containerId}_reset_btn" title="Reset View to All-India">🎯 Pan-India</button>
        </div>
      `;

      const radar = document.createElement('div');
      radar.className = 'map-radar-sweep';
      radar.id = `${this.containerId}_radar_sweep`;

      container.appendChild(hud);
      container.appendChild(radar);

      hud.querySelectorAll('.map-mode-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const mode = btn.dataset.mode;
          this.switchBasemap(mode);
        });
      });

      const radarBtn = document.getElementById(`${this.containerId}_radar_btn`);
      if (radarBtn) {
        radarBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          radar.classList.toggle('active');
          radarBtn.classList.toggle('active');
        });
      }

      const resetBtn = document.getElementById(`${this.containerId}_reset_btn`);
      if (resetBtn) {
        resetBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.onStateChange('ALL');
          const sel = document.getElementById(this.selectId);
          if (sel) sel.value = 'ALL';
        });
      }
    }

    populateStateDropdown() {
      const sel = document.getElementById(this.selectId);
      if (!sel) return;

      const options = [
        '<option value="ALL" selected>🇮🇳 All India (Overview & State Clusters)</option>',
        '<option value="Jharkhand">Jharkhand (24 Districts Focus)</option>',
        ...INDIA_STATES_DATA.filter(s => s.state !== 'Jharkhand').map(s => `<option value="${s.state}">${s.state}</option>`)
      ];
      sel.innerHTML = options.join('');
      this.currentState = 'ALL';
    }

    setupEventListeners() {
      const stateSel = document.getElementById(this.selectId);
      if (stateSel) {
        stateSel.addEventListener('change', (e) => {
          this.onStateChange(e.target.value);
        });
      }

      const catSel = document.getElementById(this.categorySelectId);
      if (catSel) {
        catSel.addEventListener('change', (e) => {
          this.currentCategory = e.target.value;
          this.render();
        });
      }
    }

    async fetchLiveChallenges() {
      try {
        let list = [];
        const res = await fetch('/api/challenges?limit=100');
        if (res.ok) {
          const json = await res.json();
          if (json && Array.isArray(json.data)) {
            list = json.data;
          }
        }
        if (!list.length && window.API && typeof window.API.get === 'function') {
          const aRes = await window.API.get('/challenges', { limit: 100 });
          if (aRes && Array.isArray(aRes.data)) list = aRes.data;
        }
        this.liveChallenges = list;
        this.syncRealDistrictCounts();
      } catch (e) {
        console.warn('Live challenges sync note:', e);
      }
    }

    syncRealDistrictCounts() {
      if (!this.liveChallenges || !this.liveChallenges.length) return;

      // Reset realProblems on all districts
      INDIA_STATES_DATA.forEach(s => {
        (s.districts || []).forEach(d => {
          d.realProblems = [];
        });
      });

      this.liveChallenges.forEach(c => {
        const rawDist = (c.location?.district || c.location?.city || '').toLowerCase().trim();
        const rawState = (c.location?.state || '').toLowerCase().trim();

        INDIA_STATES_DATA.forEach(s => {
          const stateMatches = !rawState || s.state.toLowerCase() === rawState || rawState.includes(s.state.toLowerCase());
          if (stateMatches) {
            (s.districts || []).forEach(d => {
              const dName = d.name.toLowerCase();
              if (rawDist && (dName === rawDist || dName.includes(rawDist) || rawDist.includes(dName))) {
                d.realProblems.push(c);
              }
            });
          }
        });
      });

      // Update challenge counts and priorities where real problems exist
      INDIA_STATES_DATA.forEach(s => {
        let stateRealTotal = 0;
        (s.districts || []).forEach(d => {
          if (d.realProblems && d.realProblems.length > 0) {
            d.challenges = d.realProblems.length;
            stateRealTotal += d.challenges;

            const catCounts = {};
            d.realProblems.forEach(p => {
              const cat = p.category || 'General';
              catCounts[cat] = (catCounts[cat] || 0) + 1;
            });
            d.categories = catCounts;

            const hasUrgent = d.realProblems.some(p => p.priority === 'urgent' || p.priority === 'high');
            if (hasUrgent || d.challenges >= 3) {
              d.priority = 'high';
            } else if (d.challenges >= 2) {
              d.priority = 'medium';
            } else {
              d.priority = 'low';
            }
          }
        });
        if (stateRealTotal > 0) {
          s.total = Math.max(s.total, stateRealTotal);
        }
      });
    }

    onStateChange(stateName) {
      this.currentState = stateName;
      if (stateName === 'ALL') {
        this.map.flyTo([22.8, 80.5], 5, { duration: 1.2 });
      } else {
        const stateObj = INDIA_STATES_DATA.find(s => s.state.toLowerCase() === stateName.toLowerCase());
        if (stateObj) {
          this.map.flyTo([stateObj.lat, stateObj.lng], stateObj.zoom || 7.5, { duration: 1.1 });
        }
      }
      this.render();
    }

    render() {
      if (!this.map || !this.activeLayerGroup) return;
      this.activeLayerGroup.clearLayers();

      if (this.currentState === 'ALL') {
        this.renderAllIndiaStateClusters();
      } else {
        this.renderSpecificStateDistricts(this.currentState);
      }
    }

    renderAllIndiaStateClusters() {
      INDIA_STATES_DATA.forEach(s => {
        let count = s.total;
        if (this.currentCategory && s.categories && s.categories[this.currentCategory]) {
          count = s.categories[this.currentCategory];
        }

        const isHigh = count > 1000;
        const isMed = count > 500;
        const tierClass = isHigh ? 'beacon-critical' : (isMed ? 'beacon-warning' : 'beacon-info');
        const badgeGradient = isHigh
          ? 'linear-gradient(135deg, #FF453A 0%, #B91C1C 100%)'
          : (isMed ? 'linear-gradient(135deg, #F59E0B 0%, #B45309 100%)' : 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)');
        const glowColor = isHigh
          ? 'rgba(239, 68, 68, 0.65)'
          : (isMed ? 'rgba(245, 158, 11, 0.6)' : 'rgba(2, 132, 199, 0.6)');
        const pulseColor = isHigh
          ? 'rgba(239, 68, 68, 0.35)'
          : (isMed ? 'rgba(245, 158, 11, 0.3)' : 'rgba(2, 132, 199, 0.3)');
        const color = isHigh ? '#DC2626' : (isMed ? '#D97706' : '#2563EB');

        // Translucent ambient radial aura on map (feathered, non-intrusive)
        const radius = Math.min(Math.max(count * 50, 18000), 75000);
        const glow = L.circle([s.lat, s.lng], {
          radius: radius,
          color: color,
          fillColor: color,
          fillOpacity: 0.14,
          weight: 1,
          opacity: 0.35
        }).addTo(this.activeLayerGroup);

        // State Marker Icon with Realistic 3D Glass Beacon and State Label Chip
        const countText = count > 999 ? (count / 1000).toFixed(1) + 'k' : count;
        const iconHtml = `
          <div class="realistic-map-beacon ${tierClass}" id="beacon_${s.state.replace(/\s+/g, '_')}">
            <div class="beacon-pulse-ring" style="border-color:${pulseColor}; background:radial-gradient(circle, ${pulseColor} 0%, transparent 70%);"></div>
            <div class="beacon-orb" style="background:${badgeGradient}; box-shadow: 0 4px 14px ${glowColor}, 0 0 0 2px rgba(255,255,255,0.9), inset 0 1px 2px rgba(255,255,255,0.7)">
              <span class="beacon-count">${countText}</span>
            </div>
            <div class="beacon-label-chip">
              <span>${s.state}</span>
            </div>
          </div>
        `;

        const countMarker = L.marker([s.lat, s.lng], {
          icon: L.divIcon({ html: iconHtml, className: 'heat-count-icon', iconSize: [0, 0] })
        }).addTo(this.activeLayerGroup);

        const popupContent = `
          <div style="font-family:'Inter',sans-serif;padding:8px 6px;min-width:190px">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:4px">
              <div style="font-weight:900;font-size:15px;color:#F8FAFC">${s.state}</div>
              <span class="badge ${isHigh?'badge-danger':isMed?'badge-warning':'badge-blue'}" style="font-size:10.5px">${countText} Issues</span>
            </div>
            <div style="font-size:12px;color:#94A3B8;margin-top:2px">Civic Pipeline: <b style="color:#F1F5F9">${s.total.toLocaleString()}</b> challenges</div>
            <div style="font-size:11.5px;color:#34D399;font-weight:700;margin-top:2px">Active Resolutions: ${s.active}</div>
            <div style="margin-top:10px">
              <button onclick="window.panIndiaMapInstance?.onStateChange('${s.state}'); const el=document.getElementById('${this.selectId}'); if(el) el.value='${s.state}';" style="background:linear-gradient(135deg, #002D62 0%, #1E40AF 100%);color:white;border:1px solid rgba(255,255,255,0.25);padding:7px 12px;border-radius:8px;font-size:11.5px;font-weight:800;cursor:pointer;width:100%;box-shadow:0 4px 12px rgba(0,45,98,0.4)">
                🔍 Zoom to State Districts
              </button>
            </div>
          </div>
        `;

        glow.bindTooltip(`<b>${s.state}</b>: ${count} challenges`, { direction: 'top' });
        glow.bindPopup(popupContent);
        countMarker.bindPopup(popupContent);

        const onStateClick = () => {
          this.showStateSummaryDetail(s);
        };
        glow.on('click', onStateClick);
        countMarker.on('click', onStateClick);
      });
    }

    renderSpecificStateDistricts(stateName) {
      const stateObj = INDIA_STATES_DATA.find(s => s.state.toLowerCase() === stateName.toLowerCase());
      if (!stateObj) return;

      const districts = stateObj.districts || [];

      districts.forEach(d => {
        let count = d.challenges;
        if (this.currentCategory && d.categories && d.categories[this.currentCategory]) {
          count = d.categories[this.currentCategory];
        }

        const isHigh = d.priority === 'high';
        const isMed = d.priority === 'medium';
        const color = isHigh ? '#DC2626' : (isMed ? '#D97706' : '#059669');
        const badgeGradient = isHigh
          ? 'linear-gradient(135deg, #FF453A 0%, #B91C1C 100%)'
          : (isMed ? 'linear-gradient(135deg, #F59E0B 0%, #B45309 100%)' : 'linear-gradient(135deg, #10B981 0%, #047857 100%)');
        const glowColor = isHigh ? 'rgba(239, 68, 68, 0.6)' : (isMed ? 'rgba(245, 158, 11, 0.6)' : 'rgba(16, 185, 129, 0.6)');

        // Ambient district circle
        const radius = Math.max(count * 750, 3800);
        const glow = L.circle([d.lat, d.lng], {
          radius: radius,
          color: color,
          fillColor: color,
          fillOpacity: 0.15,
          weight: 1.5,
          opacity: 0.4
        }).addTo(this.activeLayerGroup);

        // District Pin Beacon Icon
        const iconHtml = `
          <div class="district-map-beacon">
            <div class="district-orb" style="background:${badgeGradient}; box-shadow:0 3px 10px ${glowColor}">
              ${count}
            </div>
            <div class="district-label-chip">
              ${d.name}
            </div>
          </div>
        `;

        const distMarker = L.marker([d.lat, d.lng], {
          icon: L.divIcon({ html: iconHtml, className: 'heat-count-icon', iconSize: [0, 0] })
        }).addTo(this.activeLayerGroup);

        glow.bindTooltip(`<b>${d.name}</b> (${stateObj.state})<br>${count} challenges<br>Priority: <b style="text-transform:uppercase">${d.priority}</b>`, { direction: 'top' });

        const onDistrictSelect = () => {
          this.showDistrictDetail(d, stateObj.state);
        };
        glow.on('click', onDistrictSelect);
        distMarker.on('click', onDistrictSelect);
      });

      // Default show first or highest district in panel
      if (districts.length > 0) {
        this.showDistrictDetail(districts[0], stateObj.state);
      }
    }

    showDistrictDetail(d, stateName) {
      const panel = document.getElementById(this.panelId);
      if (!panel) return;

      const color = d.priority === 'high' ? '#DC2626' : (d.priority === 'medium' ? '#D97706' : '#059669');
      const badgeClass = d.priority === 'high' ? 'badge-danger' : (d.priority === 'medium' ? 'badge-warning' : 'badge-green');

      const cats = d.categories || {
        'Water Management': Math.round(d.challenges * 0.4),
        'Healthcare': Math.round(d.challenges * 0.3),
        'Sanitation & Environment': Math.round(d.challenges * 0.2),
        'Agriculture': Math.max(1, Math.round(d.challenges * 0.1))
      };

      const breakdownHTML = Object.entries(cats).map(([cat, cnt]) => `
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
          <span style="font-size:12px;color:var(--gray-700);flex:1;font-weight:600">${cat}</span>
          <div style="width:90px;height:7px;background:var(--gray-100);border-radius:4px;overflow:hidden">
            <div style="height:100%;border-radius:4px;background:var(--primary);width:${Math.min((cnt/d.challenges)*100, 100)}%"></div>
          </div>
          <span style="font-size:12px;font-weight:800;color:var(--gray-900);width:24px;text-align:right">${cnt}</span>
        </div>
      `).join('');

      const actionBtn = this.role === 'admin'
        ? `<button onclick="showSection('challenges');" class="btn btn-primary btn-sm" style="width:100%;margin-top:14px;padding:9px;border-radius:8px;font-weight:800">View All Challenges in Command Queue</button>`
        : `<button onclick="showSection('explore');" class="btn btn-primary btn-sm" style="width:100%;margin-top:14px;padding:9px;border-radius:8px;font-weight:800">Explore &amp; Adopt Projects in ${d.name}</button>`;

      let realProblemsHTML = '';
      if (d.realProblems && d.realProblems.length > 0) {
        realProblemsHTML = `
          <div style="margin-top:16px;border-top:1px solid var(--gray-200);padding-top:14px">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
              <span style="font-size:11px;font-weight:800;color:var(--navy);text-transform:uppercase;letter-spacing:0.5px">
                Live Reported Problems (${d.realProblems.length})
              </span>
              <span style="font-size:10px;color:#059669;font-weight:800;background:rgba(5,150,105,0.12);padding:2px 7px;border-radius:10px">● Real DB Data</span>
            </div>
            <div style="max-height:220px;overflow-y:auto;padding-right:4px;display:flex;flex-direction:column;gap:8px">
              ${d.realProblems.map(p => {
                const pColor = p.priority === 'urgent' ? '#DC2626' : (p.priority === 'high' ? '#EA580C' : '#002D62');
                const statusBadge = p.status ? p.status.replace(/_/g, ' ') : 'submitted';
                const upvotes = p.upvotes || p.supportCount || 0;
                return `
                  <div style="background:white;border:1px solid rgba(0,45,98,0.12);border-radius:10px;padding:10px 12px;box-shadow:0 1px 4px rgba(0,0,0,0.03);transition:all 0.15s ease">
                    <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:4px">
                      <span style="font-size:10px;font-weight:800;color:#FF9933;background:#FFF7ED;padding:2px 6px;border-radius:6px;text-transform:uppercase">
                        ${p.category || 'Civic Issue'}
                      </span>
                      <span style="font-size:9.5px;font-weight:800;color:${pColor};text-transform:uppercase">
                        ● ${p.priority || 'medium'}
                      </span>
                    </div>
                    <div style="font-size:13px;font-weight:800;color:var(--gray-900);line-height:1.25;margin-bottom:6px">
                      ${p.title}
                    </div>
                    <!-- Photo and Video Thumbnails -->
                    <div style="display:flex;gap:8px;margin-bottom:8px;align-items:center">
                      <div style="position:relative;width:66px;height:48px;border-radius:6px;overflow:hidden;border:1px solid #CBD5E1;flex-shrink:0;cursor:pointer" onclick="window.openProblemEvidenceModal('${p._id}')">
                        <img src="${getChallengeMedia(p).photos[0]?.url || '/others/images/water-tap.jpg'}" style="width:100%;height:100%;object-fit:cover" alt="Evidence" onerror="this.src='/others/images/water-tap.jpg'" />
                        <span style="position:absolute;bottom:2px;right:2px;background:rgba(0,0,0,0.7);color:white;font-size:8px;font-weight:800;padding:1px 3px;border-radius:3px">📷 PHOTO</span>
                      </div>
                      <div style="position:relative;width:66px;height:48px;border-radius:6px;overflow:hidden;border:1px solid #CBD5E1;background:#0F172A;display:flex;align-items:center;justify-content:center;flex-shrink:0;cursor:pointer" onclick="window.openProblemEvidenceModal('${p._id}')">
                        <span style="font-size:14px">▶️</span>
                        <span style="position:absolute;bottom:2px;right:2px;background:rgba(220,38,38,0.85);color:white;font-size:8px;font-weight:800;padding:1px 3px;border-radius:3px">VIDEO</span>
                      </div>
                      <div style="flex:1;min-width:0;font-size:11px;color:var(--gray-600);line-height:1.25">
                        <div style="font-weight:700;color:#0F172A">Field Proof Available</div>
                        <div style="color:#059669;font-weight:600">✓ Photos &amp; Video Inspection</div>
                      </div>
                    </div>
                    ${p.description ? `<div style="font-size:11.5px;color:var(--gray-600);line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-bottom:8px">${p.description}</div>` : ''}
                    <div style="display:flex;align-items:center;justify-content:space-between;font-size:10.5px;color:var(--gray-500);border-top:1px solid #F1F5F9;padding-top:5px;margin-bottom:8px">
                      <span>Status: <b style="color:#002D62;text-transform:capitalize">${statusBadge}</b></span>
                      <span>👍 <b>${upvotes}</b> citizens</span>
                    </div>
                    <button class="btn btn-xs btn-outline-primary" onclick="window.openProblemEvidenceModal('${p._id}')" style="width:100%;display:flex;align-items:center;justify-content:center;gap:6px;font-weight:750;padding:5px 8px;border-radius:6px">
                      <span>👁️</span> View Full Problem &amp; Ground Evidence
                    </button>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `;
      } else {
        realProblemsHTML = `
          <div style="margin-top:14px;background:rgba(255,153,51,0.08);border:1px solid rgba(255,153,51,0.25);border-radius:10px;padding:10px 12px;text-align:center">
            <div style="font-size:12px;font-weight:700;color:#B45309">Ground Reports Active</div>
            <div style="font-size:10.5px;color:#92400E;margin-top:2px">Citizens in ${d.name} can submit civic reports via JanSetu Citizen Portal.</div>
          </div>
        `;
      }

      panel.innerHTML = `
        <div class="card-body" style="padding:22px">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:14px;gap:10px">
            <div>
              <div style="font-size:18px;font-weight:900;color:var(--gray-900);letter-spacing:-0.3px">${d.name}</div>
              <div style="font-size:12.5px;color:var(--gray-500);font-weight:600">District · ${stateName}</div>
            </div>
            <span class="badge ${badgeClass}" style="background:${color}15;color:${color};border:1px solid ${color}40;font-size:11.5px;font-weight:800;text-transform:uppercase">
              ● ${d.priority}
            </span>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:18px">
            <div style="background:var(--gray-50);border:1px solid var(--gray-200);border-radius:12px;padding:12px;text-align:center">
              <div style="font-size:26px;font-weight:900;color:${color};line-height:1.1">${d.challenges}</div>
              <div style="font-size:11px;color:var(--gray-500);font-weight:700;margin-top:4px">Reported Problems</div>
            </div>
            <div style="background:var(--gray-50);border:1px solid var(--gray-200);border-radius:12px;padding:12px;text-align:center">
              <div style="font-size:26px;font-weight:900;color:var(--navy);line-height:1.1">~${(d.challenges * 240).toLocaleString()}</div>
              <div style="font-size:11px;color:var(--gray-500);font-weight:700;margin-top:4px">Citizens Affected</div>
            </div>
          </div>

          <div style="font-size:11.5px;font-weight:800;color:var(--gray-400);letter-spacing:0.6px;text-transform:uppercase;margin-bottom:10px">Domain Breakdown</div>
          ${breakdownHTML}

          ${realProblemsHTML}

          ${actionBtn}
        </div>
      `;
    }

    showStateSummaryDetail(s) {
      const panel = document.getElementById(this.panelId);
      if (!panel) return;

      panel.innerHTML = `
        <div class="card-body" style="padding:22px">
          <div style="font-size:18px;font-weight:900;color:var(--gray-900);margin-bottom:4px">${s.state} Overview</div>
          <div style="font-size:12px;color:var(--gray-500);margin-bottom:14px">Pan-India Innovation Registry Data</div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">
            <div style="background:var(--gray-50);border:1px solid var(--gray-200);border-radius:12px;padding:12px;text-align:center">
              <div style="font-size:26px;font-weight:900;color:#002D62">${s.total.toLocaleString()}</div>
              <div style="font-size:11px;color:var(--gray-500);font-weight:700;margin-top:4px">Total Challenges</div>
            </div>
            <div style="background:var(--gray-50);border:1px solid var(--gray-200);border-radius:12px;padding:12px;text-align:center">
              <div style="font-size:26px;font-weight:900;color:#059669">${s.resolved}</div>
              <div style="font-size:11px;color:var(--gray-500);font-weight:700;margin-top:4px">Resolved Solutions</div>
            </div>
          </div>

          <button onclick="window.panIndiaMapInstance.onStateChange('${s.state}'); document.getElementById('${this.selectId}').value='${s.state}';" class="btn btn-primary btn-sm" style="width:100%;padding:9px">
            📍 Zoom into ${s.state} Districts
          </button>
        </div>
      `;
    }

    invalidateSize() {
      if (this.map) {
        setTimeout(() => {
          this.map.invalidateSize();
        }, 150);
      }
    }
  }

  window.PanIndiaHeatmap = PanIndiaHeatmap;


  window.openProblemEvidenceModal = async function(problemId) {
    let p = null;
    if (window.panIndiaMapInstance && window.panIndiaMapInstance.liveChallenges) {
      p = window.panIndiaMapInstance.liveChallenges.find(c => c._id === problemId);
    }
    if (!p && window.overviewMiniMapInstance && window.overviewMiniMapInstance.liveChallenges) {
      p = window.overviewMiniMapInstance.liveChallenges.find(c => c._id === problemId);
    }
    if (!p) {
      try {
        const res = await fetch('/api/challenges/' + problemId);
        if (res.ok) {
          const json = await res.json();
          p = json.data;
        }
      } catch(e) {}
    }
    if (!p) return;

    const media = getChallengeMedia(p);
    const pColor = p.priority === 'urgent' ? '#DC2626' : (p.priority === 'high' ? '#EA580C' : '#002D62');
    const district = p.location?.district || p.location?.city || 'Jharkhand';
    const state = p.location?.state || 'Jharkhand';
    const submitterName = p.submittedBy?.name || p.submitterContact?.name || 'Citizen Reporter';
    const isAssigned = p.assignedUniversity && ['assigned','in_progress','testing','resolved'].includes(p.status);
    const heiText = isAssigned ? (p.assignedUniversity.name || p.assignedUniversity.shortName) : 'Unassigned (Pending Review)';

    let modalEl = document.getElementById('problemEvidenceModal');
    if (!modalEl) {
      modalEl = document.createElement('div');
      modalEl.id = 'problemEvidenceModal';
      modalEl.style.cssText = 'position:fixed;inset:0;background:rgba(0,18,48,0.75);backdrop-filter:blur(6px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;opacity:0;pointer-events:none;transition:opacity 0.2s ease;';
      document.body.appendChild(modalEl);
    }

    modalEl.innerHTML = `
      <div style="background:#FFFFFF;border-radius:20px;max-width:860px;width:100%;max-height:92vh;overflow-y:auto;box-shadow:0 25px 60px rgba(0,0,0,0.4);border:1.5px solid rgba(0,45,98,0.15);position:relative">
        <div style="position:sticky;top:0;background:white;z-index:10;padding:18px 24px;border-bottom:1px solid #E2E8F0;display:flex;align-items:center;justify-content:space-between">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:11px;font-weight:800;color:#002D62;background:#EFF6FF;border:1px solid #DBEAFE;padding:3px 8px;border-radius:6px">${p.challengeId ? (p.challengeId.startsWith('#') ? p.challengeId : '#' + p.challengeId) : ('#JH-2026-' + (p._id || '').slice(-6).toUpperCase())}</span>
            <span style="font-size:11px;font-weight:800;color:#EA580C;background:#FFF7ED;border:1px solid #FED7AA;padding:3px 8px;border-radius:6px">${p.category||'Civic'}</span>
            <span style="font-size:11px;font-weight:800;color:${pColor};text-transform:uppercase">● ${p.priority||'medium'} priority</span>
          </div>
          <button onclick="window.closeProblemEvidenceModal()" style="background:none;border:none;font-size:22px;color:#64748B;cursor:pointer;line-height:1">✕</button>
        </div>

        <div style="padding:24px">
          <h2 style="font-size:20px;font-weight:850;color:#0F172A;line-height:1.3;margin-bottom:8px">${p.title}</h2>
          <div style="display:flex;align-items:center;gap:14px;font-size:12.5px;color:#64748B;margin-bottom:18px;flex-wrap:wrap">
            <span>📍 <b>${district}, ${state}</b></span>
            <span>👤 Reported by: <b>${submitterName}</b></span>
            <span>📅 ${new Date(p.createdAt || Date.now()).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</span>
            <span style="color:#059669;font-weight:750">● Status: ${(p.status||'submitted').replace(/_/g,' ').toUpperCase()}</span>
          </div>

          <p style="font-size:14px;color:#334155;line-height:1.65;margin-bottom:20px;background:#F8FAFC;padding:14px 18px;border-radius:12px;border:1px solid #E2E8F0">
            ${p.description || 'No description provided.'}
          </p>

          <!-- MEDIA GALLERY: PHOTOS & VIDEOS -->
          <div style="margin-bottom:22px">
            <div style="font-size:13px;font-weight:800;color:#002D62;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;display:flex;align-items:center;gap:8px">
              <span>📸</span> Verified Ground Evidence (Photos &amp; Video Proof)
            </div>

            <div style="display:grid;grid-template-columns: 1fr 1fr;gap:16px">
              <!-- Photos Column -->
              <div style="background:#F8FAFC;border:1.5px solid #E2E8F0;border-radius:14px;padding:14px;display:flex;flex-direction:column;gap:10px">
                <div style="font-size:12px;font-weight:750;color:#0F172A;display:flex;justify-content:space-between">
                  <span>Citizen Field Photos (${media.photos.length})</span>
                  <span style="color:#059669">✓ Geo-Stamped</span>
                </div>
                <div style="width:100%;height:180px;border-radius:10px;overflow:hidden;border:1px solid #CBD5E1;position:relative">
                  <img id="pihModalMainImg" src="${media.photos[0]?.url || '/others/images/water-tap.jpg'}" style="width:100%;height:100%;object-fit:cover" alt="Ground Proof" onerror="this.src='/others/images/water-tap.jpg'" />
                  <div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent, rgba(0,0,0,0.8));color:white;padding:6px 10px;font-size:11px;font-weight:600">
                    📍 Ground Capture · ${district}, ${state}
                  </div>
                </div>
                ${media.photos.length > 1 ? `
                  <div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:2px">
                    ${media.photos.map((ph, idx) => `
                      <img src="${ph.url}" alt="Thumb ${idx + 1}" style="width:48px;height:48px;border-radius:6px;object-fit:cover;border:1.5px solid #CBD5E1;cursor:pointer;flex-shrink:0" onclick="document.getElementById('pihModalMainImg').src='${ph.url}'" onerror="this.src='/others/images/water-tap.jpg'" />
                    `).join('')}
                  </div>
                ` : ''}
              </div>

              <!-- Video Column -->
              <div style="background:#F8FAFC;border:1.5px solid #E2E8F0;border-radius:14px;padding:14px;display:flex;flex-direction:column;gap:10px">
                <div style="font-size:12px;font-weight:750;color:#0F172A;display:flex;justify-content:space-between">
                  <span>Field Inspection Video</span>
                  ${media.videos.length > 0 ? `<span style="color:#DC2626;font-weight:800">● LIVE FOOTAGE</span>` : `<span style="color:#64748B;font-weight:600">Not Provided</span>`}
                </div>
                <div style="width:100%;height:${media.photos.length > 1 ? '236px' : '180px'};border-radius:10px;overflow:hidden;border:1px solid #CBD5E1;position:relative;background:${media.videos.length > 0 ? '#000000' : '#FFFFFF'};display:flex;align-items:center;justify-content:center">
                  ${media.videos.length > 0 ? `
                    <video src="${media.videos[0].url}" controls style="width:100%;height:100%;object-fit:contain"></video>
                    <div style="position:absolute;top:8px;left:8px;background:rgba(220,38,38,0.85);color:white;font-size:9.5px;font-weight:800;padding:2px 6px;border-radius:4px">
                      REC ● 1080p
                    </div>
                  ` : `
                    <div style="text-align:center;color:#64748B;padding:16px">
                      <div style="font-size:32px;margin-bottom:6px">📹</div>
                      <div style="font-size:12.5px;font-weight:750;color:#334155">No video uploaded by submitter or citizen</div>
                      <div style="font-size:10.5px;color:#94A3B8;margin-top:4px">Submitter provided geotagged photographs only.</div>
                    </div>
                  `}
                </div>
              </div>
            </div>
          </div>

          <!-- REAL DATA PIPELINE STATUS NOTE -->
          <div style="padding:14px 18px;background:${isAssigned?'#EFF6FF':'#FFFBEB'};border:1px solid ${isAssigned?'#BFDBFE':'#FCD34D'};border-radius:12px;margin-bottom:20px">
            <div style="font-size:11.5px;font-weight:800;color:${isAssigned?'#002D62':'#92400E'};text-transform:uppercase;margin-bottom:4px">
              Institutional Assignment Status
            </div>
            <div style="font-size:13px;color:${isAssigned?'#1E3A8A':'#78350F'};line-height:1.4">
              ${isAssigned ? `Assigned to: <b>${heiText}</b> for technological solution development.` : `<b>Pending Administrative Verification:</b> This citizen report has NOT been assigned to any university yet. University assignment occurs strictly after administrative validation.`}
            </div>
          </div>

          <!-- ACTION BUTTONS -->
          <div style="display:flex;gap:12px;justify-content:flex-end">
            <button onclick="window.closeProblemEvidenceModal()" class="btn btn-ghost" style="border:1px solid #CBD5E1;padding:8px 18px;border-radius:8px">Close</button>
            ${window.openChallengeAction ? `
              <button onclick="window.closeProblemEvidenceModal(); window.openChallengeAction('${p._id}');" class="btn btn-primary" style="padding:8px 20px;font-weight:800;border-radius:8px">
                🛠️ Open in Admin Command Center
              </button>
            ` : ''}
            ${window.openPartnerModal ? `
              <button onclick="window.closeProblemEvidenceModal(); window.openPartnerModal('${p._id}', '${(p.title||'').replace(/'/g, "\\'")}');" class="btn btn-primary" style="padding:8px 20px;font-weight:800;border-radius:8px">
                🤝 Express Interest &amp; CSR Support
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;

    modalEl.style.opacity = '1';
    modalEl.style.pointerEvents = 'auto';
  };

  window.closeProblemEvidenceModal = function() {
    const m = document.getElementById('problemEvidenceModal');
    if (m) {
      m.style.opacity = '0';
      m.style.pointerEvents = 'none';
    }
  };

})(window);
