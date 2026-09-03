/* =============================================
   HEATMAP-COMPONENT.JS
   Live India Activity Heatmap Component
   ============================================= */

(function(window) {
  'use strict';

  // Major Indian cities and hotspots data
  const INDIA_HEAT_POINTS = [
    // Delhi NCR (High Density)
    [28.6139, 77.2090, 1.0], [28.7041, 77.1025, 0.95], [28.5355, 77.3910, 0.9], [28.4595, 77.0266, 0.9], [28.6692, 77.4538, 0.85],
    // Maharashtra (High Density - Mumbai, Pune, Nagpur, Nashik)
    [19.0760, 72.8777, 1.0], [19.2183, 72.9781, 0.95], [18.5204, 73.8567, 0.92], [19.9975, 73.7898, 0.8], [21.1458, 79.0882, 0.85], [19.8762, 75.3433, 0.75],
    // Uttar Pradesh (High Density - Lucknow, Kanpur, Agra, Varanasi, Prayagraj)
    [26.8467, 80.9462, 0.95], [26.4499, 80.3319, 0.9], [25.3176, 82.9739, 0.88], [27.1767, 78.0081, 0.8], [25.4358, 81.8463, 0.82],
    // Jharkhand (High Density - Ranchi, Dhanbad, Jamshedpur, Bokaro, Hazaribagh)
    [23.3441, 85.3096, 0.98], [23.7957, 86.4304, 0.92], [22.8046, 86.2029, 0.9], [23.6693, 86.1511, 0.85], [23.9961, 85.3613, 0.8],
    // Bihar (Patna, Gaya, Muzaffarpur)
    [25.5941, 85.1376, 0.9], [24.7914, 85.0002, 0.8], [26.1209, 85.3647, 0.75],
    // Karnataka (Bengaluru, Mysuru, Belagavi, Hubli)
    [12.9716, 77.5946, 0.92], [13.0827, 77.5877, 0.85], [12.2958, 76.6394, 0.75], [15.8497, 74.4977, 0.7], [15.3647, 75.1240, 0.68],
    // West Bengal (Kolkata, Howrah, Siliguri)
    [22.5726, 88.3639, 0.92], [22.5958, 88.2636, 0.85], [26.7271, 88.3953, 0.7],
    // Gujarat (Ahmedabad, Surat, Vadodara, Rajkot)
    [23.0225, 72.5714, 0.9], [21.1702, 72.8311, 0.85], [22.3072, 73.1812, 0.78], [22.3039, 70.8022, 0.72],
    // Telangana & Andhra (Hyderabad, Warangal, Visakhapatnam, Vijayawada)
    [17.3850, 78.4867, 0.9], [17.9689, 79.5941, 0.75], [17.6868, 83.2185, 0.8], [16.5062, 80.6480, 0.75],
    // Tamil Nadu (Chennai, Coimbatore, Madurai, Trichy)
    [13.0827, 80.2707, 0.88], [11.0168, 76.9558, 0.8], [9.9252, 78.1198, 0.75], [10.7905, 78.7047, 0.7],
    // Rajasthan (Jaipur, Jodhpur, Udaipur, Kota)
    [26.9124, 75.7873, 0.85], [26.2389, 73.0243, 0.75], [24.5854, 73.7125, 0.7], [25.2138, 75.8648, 0.72],
    // Madhya Pradesh (Bhopal, Indore, Gwalior, Jabalpur)
    [23.2599, 77.4126, 0.85], [22.7196, 75.8577, 0.82], [26.2183, 78.1828, 0.72], [23.1815, 79.9864, 0.7],
    // Odisha (Bhubaneswar, Cuttack, Rourkela)
    [20.2961, 85.8189, 0.82], [20.4625, 85.8830, 0.78], [22.2604, 84.8536, 0.75],
    // Punjab & Haryana (Chandigarh, Ludhiana, Amritsar)
    [30.7333, 76.7794, 0.8], [30.9010, 75.8573, 0.75], [31.6340, 74.8723, 0.72],
    // Assam (Guwahati, Dibrugarh)
    [26.1445, 91.7362, 0.75], [27.4728, 94.9120, 0.65],
    // Kerala (Kochi, Thiruvananthapuram, Kozhikode)
    [9.9312, 76.2673, 0.75], [8.5241, 76.9366, 0.7], [11.2588, 75.7804, 0.68],
    // Jammu & Kashmir & HP
    [34.0837, 74.7973, 0.65], [31.1048, 77.1734, 0.6]
  ];

  // State stats matching image
  const STATE_STATS = {
    'Maharashtra': { active: 2341, pending: 482, resolved: 5921, lat: 19.7515, lng: 75.7139 },
    'Delhi': { active: 2105, pending: 390, resolved: 4890, lat: 28.6139, lng: 77.2090 },
    'Jharkhand': { active: 1890, pending: 345, resolved: 3210, lat: 23.6102, lng: 85.2799 },
    'Uttar Pradesh': { active: 1450, pending: 520, resolved: 4120, lat: 26.8467, lng: 80.9462 },
    'Karnataka': { active: 1245, pending: 290, resolved: 3870, lat: 15.3173, lng: 75.7139 },
    'Gujarat': { active: 980, pending: 210, resolved: 2940, lat: 22.2587, lng: 71.1924 },
    'West Bengal': { active: 912, pending: 180, resolved: 2450, lat: 22.9868, lng: 87.8550 },
    'Tamil Nadu': { active: 654, pending: 140, resolved: 3100, lat: 11.1271, lng: 78.6569 },
    'Rajasthan': { active: 580, pending: 130, resolved: 1820, lat: 27.0238, lng: 74.2179 },
    'Telangana': { active: 512, pending: 110, resolved: 1950, lat: 18.1124, lng: 79.0193 },
    'Madhya Pradesh': { active: 490, pending: 105, resolved: 1420, lat: 22.9734, lng: 78.6569 },
    'Bihar': { active: 460, pending: 125, resolved: 1150, lat: 25.0961, lng: 85.3131 },
    'Odisha': { active: 380, pending: 95, resolved: 1210, lat: 20.9517, lng: 85.0985 },
    'Kerala': { active: 290, pending: 60, resolved: 1890, lat: 10.8505, lng: 76.2711 },
    'Assam': { active: 210, pending: 55, resolved: 780, lat: 26.2006, lng: 92.9376 }
  };

  function createHeatmap(containerId, options = {}) {
    const el = document.getElementById(containerId);
    if (!el || typeof L === 'undefined') return null;

    const isMini = options.isMini || false;
    const center = options.center || [22.8, 80.5];
    const zoom = options.zoom || (isMini ? 3.6 : 4.6);

    const map = L.map(containerId, {
      center: center,
      zoom: zoom,
      zoomSnap: 0.2,
      zoomControl: !isMini,
      attributionControl: false,
      scrollWheelZoom: !isMini,
      dragging: !isMini,
      doubleClickZoom: !isMini
    });

    // Clean light tile layer (no watermarks, no API key required)
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 16,
      attribution: '© Esri, HERE, Garmin, OpenStreetMap'
    }).addTo(map);


    // Heat Layer with exact continuous color gradient
    if (typeof L.heatLayer === 'function') {
      L.heatLayer(INDIA_HEAT_POINTS, {
        radius: isMini ? 22 : 36,
        blur: isMini ? 16 : 24,
        maxZoom: 17,
        max: 1.0,
        minOpacity: 0.25,
        gradient: {
          0.15: '#06b6d4', // Cyan (very low)
          0.35: '#22c55e', // Green (low)
          0.60: '#eab308', // Yellow (medium)
          0.80: '#f97316', // Orange (med-high)
          1.00: '#dc2626'  // Red (high 2000+)
        }
      }).addTo(map);
    }

    // State Marker Nodes with Tooltips and Popup Card
    Object.entries(STATE_STATS).forEach(([stateName, data]) => {
      const color = data.active >= 2000 ? '#dc2626' : data.active >= 500 ? '#f59e0b' : '#16a34a';

      const marker = L.circleMarker([data.lat, data.lng], {
        radius: isMini ? 4.5 : 6,
        fillColor: '#ffffff',
        color: color,
        weight: 2.5,
        opacity: 1,
        fillOpacity: 1
      }).addTo(map);

      // Popup matching reference image
      const popupHtml = `
        <div class="state-popup-card" style="min-width:180px;font-family:'Inter',sans-serif;padding:4px">
          <div style="font-size:14px;font-weight:800;color:#0f172a;margin-bottom:8px;border-bottom:1px solid #f1f5f9;padding-bottom:4px">${stateName}</div>
          <div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:12px">
            <span style="color:#64748b">Active Cases</span>
            <span style="font-weight:700;color:#dc2626">${data.active.toLocaleString()}</span>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:12px">
            <span style="color:#64748b">Pending</span>
            <span style="font-weight:700;color:#f59e0b">${data.pending.toLocaleString()}</span>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:12px">
            <span style="color:#64748b">Resolved</span>
            <span style="font-weight:700;color:#16a34a">${data.resolved.toLocaleString()}</span>
          </div>
          <a href="/map?state=${encodeURIComponent(stateName)}" style="display:block;font-size:11px;font-weight:700;color:#1a56db;text-decoration:none;text-align:right">View State Reports →</a>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        closeButton: false,
        className: 'state-custom-popup'
      });

      if (!isMini) {
        marker.on('mouseover', function() { this.openPopup(); });
      }
    });

    return map;
  }

  window.IndiaHeatmap = {
    create: createHeatmap,
    POINTS: INDIA_HEAT_POINTS,
    STATS: STATE_STATS
  };

})(window);
