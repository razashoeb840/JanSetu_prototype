/* =============================================
   MAP.JS — India Heatmap Controller
   InnovateSphere India Platform
   ============================================= */

(function() {
  'use strict';

  let map = null;
  let heatLayer = null;
  let markersLayer = null;
  let mapData = [];
  let currentMetric = 'total';
  let currentCategory = '';
  let selectedState = null;

  // Discrete, precise geographic coordinates for major Indian clusters
  const CITY_HOTSPOTS = [
    // Delhi / NCR
    { name: 'Delhi NCR', lat: 28.6139, lng: 77.2090, intensity: 0.85, state: 'Delhi' },
    // Maharashtra
    { name: 'Mumbai', lat: 19.0760, lng: 72.8777, intensity: 0.82, state: 'Maharashtra' },
    { name: 'Pune', lat: 18.5204, lng: 73.8567, intensity: 0.65, state: 'Maharashtra' },
    { name: 'Nagpur', lat: 21.1458, lng: 79.0882, intensity: 0.55, state: 'Maharashtra' },
    // Jharkhand
    { name: 'Ranchi', lat: 23.3441, lng: 85.3096, intensity: 0.80, state: 'Jharkhand' },
    { name: 'Dhanbad', lat: 23.7957, lng: 86.4304, intensity: 0.65, state: 'Jharkhand' },
    { name: 'Jamshedpur', lat: 22.8046, lng: 86.2029, intensity: 0.60, state: 'Jharkhand' },
    // Uttar Pradesh
    { name: 'Lucknow', lat: 26.8467, lng: 80.9462, intensity: 0.75, state: 'Uttar Pradesh' },
    { name: 'Kanpur', lat: 26.4499, lng: 80.3319, intensity: 0.65, state: 'Uttar Pradesh' },
    { name: 'Varanasi', lat: 25.3176, lng: 82.9739, intensity: 0.60, state: 'Uttar Pradesh' },
    // Karnataka
    { name: 'Bengaluru', lat: 12.9716, lng: 77.5946, intensity: 0.78, state: 'Karnataka' },
    { name: 'Mysuru', lat: 12.2958, lng: 76.6394, intensity: 0.45, state: 'Karnataka' },
    // West Bengal
    { name: 'Kolkata', lat: 22.5726, lng: 88.3639, intensity: 0.72, state: 'West Bengal' },
    // Gujarat
    { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714, intensity: 0.70, state: 'Gujarat' },
    { name: 'Surat', lat: 21.1702, lng: 72.8311, intensity: 0.55, state: 'Gujarat' },
    // Telangana & AP
    { name: 'Hyderabad', lat: 17.3850, lng: 78.4867, intensity: 0.68, state: 'Telangana' },
    { name: 'Visakhapatnam', lat: 17.6868, lng: 83.2185, intensity: 0.50, state: 'Andhra Pradesh' },
    // Tamil Nadu
    { name: 'Chennai', lat: 13.0827, lng: 80.2707, intensity: 0.65, state: 'Tamil Nadu' },
    { name: 'Coimbatore', lat: 11.0168, lng: 76.9558, intensity: 0.45, state: 'Tamil Nadu' },
    // Rajasthan
    { name: 'Jaipur', lat: 26.9124, lng: 75.7873, intensity: 0.62, state: 'Rajasthan' },
    // Madhya Pradesh
    { name: 'Bhopal', lat: 23.2599, lng: 77.4126, intensity: 0.58, state: 'Madhya Pradesh' },
    { name: 'Indore', lat: 22.7196, lng: 75.8577, intensity: 0.55, state: 'Madhya Pradesh' },
    // Bihar
    { name: 'Patna', lat: 25.5941, lng: 85.1376, intensity: 0.65, state: 'Bihar' },
    // Odisha
    { name: 'Bhubaneswar', lat: 20.2961, lng: 85.8189, intensity: 0.55, state: 'Odisha' },
    // Punjab & Haryana
    { name: 'Chandigarh', lat: 30.7333, lng: 76.7794, intensity: 0.55, state: 'Punjab' },
    // Assam
    { name: 'Guwahati', lat: 26.1445, lng: 91.7362, intensity: 0.50, state: 'Assam' },
    // Kerala
    { name: 'Kochi', lat: 9.9312, lng: 76.2673, intensity: 0.45, state: 'Kerala' }
  ];

  // Comprehensive state statistics
  const ALL_STATES_DATA = [
    { state: 'Maharashtra', total: 2341, active: 1859, resolved: 482, urgent: 345, resolutionRate: 21, lat: 19.7515, lng: 75.7139, categories: { 'Water Management': 780, 'Urban Infrastructure': 650, 'Healthcare': 510, 'Agriculture': 401 } },
    { state: 'Delhi', total: 2105, active: 1715, resolved: 390, urgent: 412, resolutionRate: 19, lat: 28.6139, lng: 77.2090, categories: { 'Sanitation & Environment': 820, 'Urban Infrastructure': 690, 'Education': 395, 'Healthcare': 200 } },
    { state: 'Jharkhand', total: 1890, active: 1545, resolved: 345, urgent: 380, resolutionRate: 18, lat: 23.6102, lng: 85.2799, categories: { 'Rural Livelihoods': 680, 'Water Management': 590, 'Education': 380, 'Healthcare': 240 } },
    { state: 'Uttar Pradesh', total: 1450, active: 930, resolved: 520, urgent: 290, resolutionRate: 36, lat: 26.8467, lng: 80.9462, categories: { 'Agriculture': 510, 'Water Management': 420, 'Healthcare': 310, 'Education': 210 } },
    { state: 'Karnataka', total: 1245, active: 955, resolved: 290, urgent: 180, resolutionRate: 23, lat: 15.3173, lng: 75.7139, categories: { 'Urban Infrastructure': 490, 'Energy & Technology': 380, 'Water Management': 225, 'Education': 150 } },
    { state: 'Gujarat', total: 980, active: 770, resolved: 210, urgent: 160, resolutionRate: 21, lat: 22.2587, lng: 71.1924, categories: { 'Water Management': 380, 'Agriculture': 310, 'Energy & Technology': 180, 'Healthcare': 110 } },
    { state: 'West Bengal', total: 912, active: 732, resolved: 180, urgent: 140, resolutionRate: 20, lat: 22.9868, lng: 87.8550, categories: { 'Sanitation & Environment': 350, 'Education': 280, 'Rural Livelihoods': 182, 'Healthcare': 100 } },
    { state: 'Tamil Nadu', total: 654, active: 514, resolved: 140, urgent: 95, resolutionRate: 21, lat: 11.1271, lng: 78.6569, categories: { 'Water Management': 250, 'Agriculture': 210, 'Healthcare': 114, 'Urban Infrastructure': 80 } },
    { state: 'Rajasthan', total: 580, active: 450, resolved: 130, urgent: 110, resolutionRate: 22, lat: 27.0238, lng: 74.2179, categories: { 'Water Management': 290, 'Rural Livelihoods': 150, 'Agriculture': 90, 'Education': 50 } },
    { state: 'Telangana', total: 512, active: 402, resolved: 110, urgent: 75, resolutionRate: 21, lat: 18.1124, lng: 79.0193, categories: { 'Urban Infrastructure': 210, 'Energy & Technology': 160, 'Healthcare': 92, 'Water Management': 50 } },
    { state: 'Madhya Pradesh', total: 490, active: 385, resolved: 105, urgent: 85, resolutionRate: 21, lat: 22.9734, lng: 78.6569, categories: { 'Agriculture': 210, 'Rural Livelihoods': 140, 'Water Management': 90, 'Healthcare': 50 } },
    { state: 'Bihar', total: 460, active: 335, resolved: 125, urgent: 95, resolutionRate: 27, lat: 25.0961, lng: 85.3131, categories: { 'Education': 180, 'Rural Livelihoods': 140, 'Healthcare': 90, 'Water Management': 50 } },
    { state: 'Odisha', total: 380, active: 285, resolved: 95, urgent: 60, resolutionRate: 25, lat: 20.9517, lng: 85.0985, categories: { 'Rural Livelihoods': 150, 'Sanitation & Environment': 110, 'Agriculture': 70, 'Healthcare': 50 } },
    { state: 'Punjab', total: 340, active: 250, resolved: 90, urgent: 45, resolutionRate: 26, lat: 31.1471, lng: 75.3412, categories: { 'Agriculture': 160, 'Sanitation & Environment': 90, 'Healthcare': 50, 'Water Management': 40 } },
    { state: 'Kerala', total: 290, active: 230, resolved: 60, urgent: 30, resolutionRate: 21, lat: 10.8505, lng: 76.2711, categories: { 'Healthcare': 120, 'Sanitation & Environment': 90, 'Education': 50, 'Urban Infrastructure': 30 } },
    { state: 'Assam', total: 210, active: 155, resolved: 55, urgent: 40, resolutionRate: 26, lat: 26.2006, lng: 92.9376, categories: { 'Rural Livelihoods': 90, 'Water Management': 60, 'Healthcare': 40, 'Education': 20 } },
    { state: 'Haryana', total: 195, active: 145, resolved: 50, urgent: 35, resolutionRate: 26, lat: 29.0588, lng: 76.0856, categories: { 'Agriculture': 80, 'Urban Infrastructure': 60, 'Water Management': 35, 'Healthcare': 20 } },
    { state: 'Uttarakhand', total: 160, active: 120, resolved: 40, urgent: 25, resolutionRate: 25, lat: 30.0668, lng: 79.0193, categories: { 'Sanitation & Environment': 70, 'Rural Livelihoods': 50, 'Healthcare': 25, 'Education': 15 } },
    { state: 'Chhattisgarh', total: 150, active: 110, resolved: 40, urgent: 25, resolutionRate: 27, lat: 21.2787, lng: 81.8661, categories: { 'Rural Livelihoods': 60, 'Water Management': 45, 'Healthcare': 30, 'Agriculture': 15 } }
  ];

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    mapData = ALL_STATES_DATA;
    initMap();
    setupFilters();
    renderStateRankings();
    updateOverviewStats();
    tryFetchApiData();
  }

  // ---- INIT LEAFLET MAP ----
  function initMap() {
    map = L.map('india-map', {
      center: [22.8, 80.5],
      zoom: 4.8,
      zoomControl: true,
      attributionControl: false,
      minZoom: 3.5,
      maxZoom: 10
    });

    // Clean Esri World Light Gray Base (Zero Watermarks, Crisp Cartography)
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 16,
      attribution: '© Esri, HERE, Garmin, OpenStreetMap'
    }).addTo(map);

    markersLayer = L.layerGroup().addTo(map);

    renderHeatmap();
    renderStateMarkers();
  }

  // ---- RENDER HEATMAP (Subtle, calibrated glowing nodes) ----
  function renderHeatmap() {
    if (heatLayer) map.removeLayer(heatLayer);

    const heatPoints = CITY_HOTSPOTS.map(pt => {
      let weight = pt.intensity;
      if (currentCategory) {
        // Boost if matching category state
        const stateObj = mapData.find(s => s.state === pt.state);
        if (stateObj && stateObj.categories && stateObj.categories[currentCategory]) {
          weight *= 1.2;
        } else {
          weight *= 0.6;
        }
      }
      return [pt.lat, pt.lng, weight];
    });

    if (typeof L.heatLayer === 'function') {
      heatLayer = L.heatLayer(heatPoints, {
        radius: 26,
        blur: 18,
        maxZoom: 12,
        max: 1.0,
        minOpacity: 0.2,
        gradient: {
          0.2: '#06b6d4',  // Cyan (Very low)
          0.4: '#22c55e',  // Green (Low)
          0.6: '#eab308',  // Yellow (Medium)
          0.8: '#f97316',  // Orange (High)
          1.0: '#dc2626'   // Red (Critical)
        }
      }).addTo(map);
    }
  }

  // ---- RENDER STATE MARKERS ----
  function renderStateMarkers() {
    markersLayer.clearLayers();

    mapData.forEach((s, idx) => {
      const val = s[currentMetric] || s.total;
      const color = val >= 1000 ? '#dc2626' : val >= 400 ? '#f59e0b' : '#16a34a';

      const circle = L.circleMarker([s.lat, s.lng], {
        radius: Math.max(5, Math.min(12, Math.sqrt(val) * 0.25)),
        fillColor: color,
        color: '#ffffff',
        weight: 1.5,
        opacity: 0.9,
        fillOpacity: 0.75
      });

      circle.bindTooltip(`<strong>${s.state}</strong><br/>${currentMetric.toUpperCase()}: ${val.toLocaleString()}`, {
        direction: 'top',
        className: 'leaflet-tooltip'
      });

      circle.on('click', () => {
        selectState(s.state);
      });

      circle.addTo(markersLayer);
    });
  }

  // ---- STATE SELECTION & DETAIL PANEL ----
  function selectState(stateName) {
    selectedState = stateName;
    const stateObj = mapData.find(s => s.state === stateName);
    if (!stateObj) return;

    // Highlight left ranking item
    document.querySelectorAll('.state-rank-item').forEach(el => {
      el.classList.toggle('active', el.dataset.state === stateName);
    });

    // Populate right detail panel
    const placeholder = document.getElementById('detail-placeholder');
    const content = document.getElementById('state-detail-content');

    if (placeholder) placeholder.style.display = 'none';
    if (content) content.style.display = 'flex';

    document.getElementById('detail-state-name').textContent = stateObj.state;
    const rankIndex = mapData.findIndex(s => s.state === stateName) + 1;
    document.getElementById('detail-rank').textContent = `#${rankIndex}`;

    document.getElementById('d-total').textContent = stateObj.total.toLocaleString();
    document.getElementById('d-active').textContent = stateObj.active.toLocaleString();
    document.getElementById('d-resolved').textContent = stateObj.resolved.toLocaleString();
    document.getElementById('d-urgent').textContent = (stateObj.urgent || 0).toLocaleString();

    document.getElementById('d-rate').textContent = `${stateObj.resolutionRate}%`;
    document.getElementById('d-rate-bar').style.width = `${stateObj.resolutionRate}%`;

    // Render category bars
    const catContainer = document.getElementById('category-bars');
    if (catContainer && stateObj.categories) {
      catContainer.innerHTML = Object.entries(stateObj.categories).map(([cat, cnt]) => `
        <div class="category-bar-row">
          <span class="category-bar-label" title="${cat}">${cat}</span>
          <div class="category-bar-bg">
            <div class="category-bar-fill" style="width:${Math.min(100, (cnt / stateObj.total) * 100)}%"></div>
          </div>
          <span class="category-bar-count">${cnt}</span>
        </div>
      `).join('');
    }

    const feedBtn = document.getElementById('btn-view-state-feed');
    if (feedBtn) {
      feedBtn.href = `/dashboard/citizen.html#explore?state=${encodeURIComponent(stateObj.state)}`;
    }

    // Pan map smoothly to selected state
    if (map && stateObj.lat && stateObj.lng) {
      map.flyTo([stateObj.lat, stateObj.lng], 6, { duration: 1.0 });
    }
  }

  // ---- STATE RANKINGS LIST (Left Sidebar) ----
  function renderStateRankings() {
    const list = document.getElementById('state-list');
    const countEl = document.getElementById('sidebar-count');
    if (!list) return;

    const sorted = [...mapData].sort((a, b) => (b[currentMetric] || b.total) - (a[currentMetric] || a.total));
    const maxVal = sorted[0] ? (sorted[0][currentMetric] || sorted[0].total) : 100;

    if (countEl) countEl.textContent = `${sorted.length} States / UTs`;

    list.innerHTML = sorted.map((s, idx) => {
      const val = s[currentMetric] || s.total;
      const pct = Math.max(5, (val / maxVal) * 100);
      const isSelected = s.state === selectedState;

      return `
        <div class="state-rank-item ${isSelected ? 'active' : ''}" data-state="${s.state}" onclick="window.selectStateMap('${s.state}')">
          <span class="rank-num">${idx + 1}</span>
          <div class="state-rank-info">
            <div class="state-rank-name">${s.state}</div>
            <div class="state-rank-bar-wrap">
              <div class="state-rank-bar" style="width:${pct}%"></div>
            </div>
          </div>
          <span class="state-rank-count">${val.toLocaleString()}</span>
        </div>
      `;
    }).join('');
  }

  window.selectStateMap = selectState;

  // ---- OVERVIEW STATS (Center Top Overlay) ----
  function updateOverviewStats(summary) {
    const total = summary?.totalChallenges || mapData.reduce((acc, s) => acc + s.total, 0);
    const active = summary?.activeChallenges || mapData.reduce((acc, s) => acc + s.active, 0);
    const resolved = summary?.resolvedChallenges || mapData.reduce((acc, s) => acc + s.resolved, 0);
    const states = summary?.activeStates || mapData.length;

    const elTot = document.getElementById('ov-total');
    const elAct = document.getElementById('ov-active');
    const elRes = document.getElementById('ov-resolved');
    const elSt = document.getElementById('ov-states');

    if (elTot) elTot.textContent = total.toLocaleString();
    if (elAct) elAct.textContent = active.toLocaleString();
    if (elRes) elRes.textContent = resolved.toLocaleString();
    if (elSt) elSt.textContent = states.toString();
  }

  // ---- SETUP FILTERS ----
  function setupFilters() {
    const catSelect = document.getElementById('map-category');
    const metricBtns = document.querySelectorAll('.metric-btn[data-metric]');
    const resetBtn = document.getElementById('btn-reset-map');

    catSelect?.addEventListener('change', (e) => {
      currentCategory = e.target.value;
      renderHeatmap();
      renderStateMarkers();
      renderStateRankings();
    });

    metricBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        metricBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentMetric = btn.dataset.metric;
        renderStateMarkers();
        renderStateRankings();
      });
    });

    resetBtn?.addEventListener('click', () => {
      if (catSelect) catSelect.value = '';
      currentCategory = '';
      currentMetric = 'total';
      metricBtns.forEach(b => b.classList.toggle('active', b.dataset.metric === 'total'));
      if (map) map.flyTo([22.8, 80.5], 4.8, { duration: 1.0 });
      selectedState = null;
      document.getElementById('detail-placeholder').style.display = 'flex';
      document.getElementById('state-detail-content').style.display = 'none';
      renderHeatmap();
      renderStateMarkers();
      renderStateRankings();
    });
  }

  // ---- TRY FETCH LIVE API DATA ----
  async function tryFetchApiData() {
    try {
      const res = await fetch('/api/challenges/map-data');
      const data = await res.json();
      if (data.success && data.data && data.data.length) {
        mapData = data.data;
        updateOverviewStats(data.summary);
        renderStateRankings();
        renderStateMarkers();
        renderHeatmap();
      }
    } catch(e) {
      // Keep rich synthetic defaults
    }
  }

})();
