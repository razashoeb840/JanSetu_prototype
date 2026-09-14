// industry.js — Industry Dashboard Logic

let currentUser = null;
let allProjects = [];
let currentPartnerChallengeId = null;
let currentSelectedChallenge = null;
const COLLAB_REQUESTS_KEY = 'industryCollaborationRequests';
let selectedModalContributions = new Set();
let selectedModalMentorshipAreas = new Set();
let selectedModalDuration = '1–3 Months';

function getCollaborationRequests() {
  try {
    const raw = localStorage.getItem(COLLAB_REQUESTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to parse collaboration requests:', e);
    return [];
  }
}

function saveCollaborationRequests(reqs) {
  try {
    localStorage.setItem(COLLAB_REQUESTS_KEY, JSON.stringify(reqs));
  } catch (e) {
    console.error('Failed to save collaboration requests:', e);
  }
}

function hasSubmittedInterest(challengeId) {
  const reqs = getCollaborationRequests();
  return reqs.some(r => r.challengeId === challengeId);
}


// Initialize Industry Dashboard
// ── SCREENSHOT 4 VERIFIED OPPORTUNITIES DATA ──
const SCREENSHOT_4_OPPORTUNITIES = [
  {
    _id: 'opp-jh-001',
    code: '#JH-2026-001',
    priority: 'High Priority',
    priorityClass: 'badge-urgent',
    title: 'Rural Hospital Solar Unit for Reliable Healthcare Services',
    district: 'Dhanbad',
    state: 'Jharkhand',
    domains: ['Healthcare', 'Clean Energy'],
    description: 'Deploy solar-powered backup system for uninterrupted power supply in rural health centers, ensuring continuous operation of medical equipment and vaccine storage.',
    university: 'IIT (ISM) Dhanbad',
    lead: 'Dr. A. K. Sengupta (Project Lead)',
    requiredSupport: ['Funding', 'Equipment', 'Technical Mentor', 'Testing Support', 'Deployment Support'],
    supportType: 'Funding + Equipment',
    estimatedBudget: '₹ 10 – 15 Lakh',
    budgetVal: 12,
    aiMatch: 92,
    matchTier: 'high',
    stage: 'Seeking Industry Support',
    stageColor: '#eff6ff',
    stageTextColor: '#1d4ed8',
    expectedDate: 'Dec 2026',
    thumbnail: '/images/solar-hospital.jpg',
    specs: {
      capacity: '15kVA Solar PV + 48V LiFePO4 Storage',
      targetCenters: '3 Primary Health Sub-Centers in Tundi & Topchanchi',
      beneficiaries: '24,000 rural patients annually'
    }
  },
  {
    _id: 'opp-jh-002',
    code: '#JH-2026-002',
    priority: 'Medium Priority',
    priorityClass: 'badge-warning',
    title: 'Smart Water Monitoring System for Rural Reservoirs',
    district: 'Ranchi',
    state: 'Jharkhand',
    domains: ['Water Management', 'IoT & Sensors'],
    description: 'IoT-based water quality and level monitoring system for real-time data and early warning of contamination in rural water sources.',
    university: 'BIT Mesra',
    lead: 'Dr. S. K. Verma (Project Lead)',
    requiredSupport: ['Equipment', 'Technology', 'Funding', 'Deployment Support', 'Training & Mentorship'],
    supportType: 'Equipment + Technology',
    estimatedBudget: '₹ 8 – 12 Lakh',
    budgetVal: 10,
    aiMatch: 78,
    matchTier: 'high',
    stage: 'Prototype Development',
    stageColor: '#f5f3ff',
    stageTextColor: '#7c3aed',
    expectedDate: 'Mar 2027',
    thumbnail: '/images/water-monitoring.jpg',
    specs: {
      capacity: '24 Solar IoT Probes (pH, Turbidity, DO, Coliform)',
      targetCenters: 'Kanke and Dhurwa Water Reservoirs',
      beneficiaries: '45,000 residents consuming reservoir water'
    }
  },
  {
    _id: 'opp-jh-003',
    code: '#JH-2026-003',
    priority: 'Medium Priority',
    priorityClass: 'badge-warning',
    title: 'Rural Digital Learning Hub',
    district: 'Latehar',
    state: 'Jharkhand',
    domains: ['Education', 'Digital Infrastructure'],
    description: 'Set up digital learning hubs with low-cost computers, smart displays and offline content for students in remote schools.',
    university: 'Ranchi University',
    lead: 'Dr. P. Sharma (Project Lead)',
    requiredSupport: ['Funding', 'Equipment', 'Content Support', 'Training & Mentorship'],
    supportType: 'Funding + Equipment',
    estimatedBudget: '₹ 8 – 10 Lakh',
    budgetVal: 9,
    aiMatch: 76,
    matchTier: 'high',
    stage: 'Seeking Industry Support',
    stageColor: '#eff6ff',
    stageTextColor: '#1d4ed8',
    expectedDate: 'Apr 2027',
    thumbnail: '/images/digital-learning.jpg',
    specs: {
      capacity: '40 Low-power Raspberry Pi stations + Starlink/VSAT',
      targetCenters: 'Latehar Tribal Residential Senior Secondary School',
      beneficiaries: '1,200 tribal secondary students'
    }
  },
  {
    _id: 'opp-jh-004',
    code: '#JH-2026-004',
    priority: 'Low Priority',
    priorityClass: 'badge-ghost',
    title: 'Solid Waste to Biogas Pilot Plant',
    district: 'Bokaro',
    state: 'Jharkhand',
    domains: ['Waste Management', 'Sustainable Cities'],
    description: 'Community-level organic waste processing unit to generate biogas for clean energy and reduce landfill burden.',
    university: 'VBU, Hazaribagh',
    lead: 'Dr. R. Kumar (Project Lead)',
    requiredSupport: ['Equipment', 'Funding', 'Technical Mentor', 'Deployment Support'],
    supportType: 'Equipment + Funding',
    estimatedBudget: '₹ 12 – 20 Lakh',
    budgetVal: 16,
    aiMatch: 65,
    matchTier: 'medium',
    stage: 'Detailed Design',
    stageColor: '#fffbeb',
    stageTextColor: '#d97706',
    expectedDate: 'Jun 2027',
    thumbnail: '/images/waste-mgmt.jpg',
    specs: {
      capacity: '2 Tonne / Day High-Yield Anaerobic Digesting Cell',
      targetCenters: 'Chas Municipal Wholesale Mandi',
      beneficiaries: '320 market vendors + clean LPG substitute'
    }
  }
];

let _allExploreOpportunities = [...SCREENSHOT_4_OPPORTUNITIES];

window.loadExploreChallenges = async function() {
  const container = document.getElementById('indChallengesGrid');
  if (!container) return;

  // Try to load additional live database challenges from Atlas
  try {
    const res = await fetch('/api/challenges?status=verified&limit=40');
    if (res.ok) {
      const data = await res.json();
      const liveList = data.challenges || data.data || (Array.isArray(data) ? data : []);
      if (liveList.length > 0) {
        // Append unique live challenges
        const existingTitles = new Set(_allExploreOpportunities.map(o => o.title.toLowerCase()));
        liveList.forEach((c, idx) => {
          if (!existingTitles.has((c.title || '').toLowerCase()) && c.title) {
            _allExploreOpportunities.push({
              _id: c._id || ('opp-live-' + idx),
              code: c.challengeId ? (c.challengeId.startsWith('#') ? c.challengeId : '#' + c.challengeId) : ('#JH-2026-' + (idx + 10).toString().padStart(3, '0')),
              priority: c.priority === 'urgent' ? 'High Priority' : (c.priority === 'high' ? 'High Priority' : 'Medium Priority'),
              priorityClass: c.priority === 'urgent' ? 'badge-urgent' : 'badge-warning',
              title: c.title,
              district: c.location?.district || 'Jharkhand',
              state: 'Jharkhand',
              domains: [c.category || 'Public Infrastructure'],
              description: c.description || 'Community-led innovation challenge approved for university solution blueprinting and CSR industry partnership.',
              university: c.assignedUniversity?.name || c.assignedUniversity?.shortName || 'BIT Mesra',
              lead: c.assignedUniversity?.dean || 'Prof. Faculty Lead',
              requiredSupport: ['Funding', 'Equipment', 'Technical Mentor'],
              supportType: 'Funding + Equipment',
              estimatedBudget: c.estimatedBudget ? ('₹ ' + c.estimatedBudget + ' Lakh') : '₹ 8 – 15 Lakh',
              budgetVal: c.estimatedBudget ? parseFloat(c.estimatedBudget) : 10,
              aiMatch: Math.floor(70 + Math.random() * 25),
              matchTier: 'high',
              stage: c.status === 'in_progress' ? 'Prototype Development' : 'Seeking Industry Support',
              stageColor: '#eff6ff',
              stageTextColor: '#1d4ed8',
              expectedDate: '2026-2027',
              thumbnail: c.imageUrl || '/images/campus-iit.jpg',
              specs: {
                targetCenters: c.location?.block || c.location?.district || 'Ranchi',
                beneficiaries: 'Local gram panchayats'
              }
            });
          }
        });
      }
    }
  } catch(e) {
    console.log('Using verified offline dataset for Explore Challenges:', e);
  }

  filterExploreChallenges();
};

window.filterExploreChallenges = function() {
  const container = document.getElementById('indChallengesGrid');
  if (!container) return;

  const search = (document.getElementById('expSearchInput')?.value || '').toLowerCase().trim();
  const domain = document.getElementById('expDomainFilter')?.value || '';
  const district = document.getElementById('expDistrictFilter')?.value || '';
  const support = document.getElementById('expSupportFilter')?.value || '';
  const budget = document.getElementById('expBudgetFilter')?.value || '';
  const stage = document.getElementById('expStageFilter')?.value || '';
  const sort = document.getElementById('expSortSelect')?.value || 'match';

  let filtered = _allExploreOpportunities.filter(item => {
    if (search) {
      const hay = (item.title + ' ' + item.description + ' ' + item.university + ' ' + item.district + ' ' + item.code).toLowerCase();
      if (!hay.includes(search)) return false;
    }
    if (domain) {
      const hasDomain = item.domains.some(d => d.toLowerCase().includes(domain.toLowerCase()));
      if (!hasDomain) return false;
    }
    if (district) {
      if (!item.district.toLowerCase().includes(district.toLowerCase())) return false;
    }
    if (support) {
      const hasSupport = item.requiredSupport.some(s => s.toLowerCase().includes(support.toLowerCase()));
      if (!hasSupport) return false;
    }
    if (budget) {
      if (budget === 'under_10' && item.budgetVal > 10) return false;
      if (budget === '10_20' && (item.budgetVal < 10 || item.budgetVal > 20)) return false;
      if (budget === 'above_20' && item.budgetVal < 20) return false;
    }
    if (stage) {
      if (item.stage !== stage) return false;
    }
    return true;
  });

  // Sort
  if (sort === 'match') {
    filtered.sort((a, b) => b.aiMatch - a.aiMatch);
  } else if (sort === 'budget') {
    filtered.sort((a, b) => b.budgetVal - a.budgetVal);
  }

  const countEl = document.getElementById('expShowingCount');
  if (countEl) countEl.textContent = filtered.length;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="background:#ffffff;border:1.5px dashed #cbd5e1;border-radius:14px;padding:48px 24px;text-align:center;">
        <div style="font-size:36px;margin-bottom:12px">🔍</div>
        <div style="font-size:16px;font-weight:800;color:#0f172a">No Opportunities Match Your Criteria</div>
        <div style="font-size:13px;color:#64748b;margin:6px 0 16px 0">Try changing or clearing your search and filter parameters.</div>
        <button class="btn btn-sm btn-primary" onclick="resetExploreFilters()">Reset All Filters</button>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(item => {
    const isHighMatch = item.aiMatch >= 75;
    const matchBadgeBg = isHighMatch ? '#dcfce7' : '#fef3c7';
    const matchBadgeColor = isHighMatch ? '#15803d' : '#d97706';
    const priorityColor = item.priority.includes('High') ? '#b91c1c' : (item.priority.includes('Medium') ? '#d97706' : '#64748b');
    const priorityBg = item.priority.includes('High') ? '#fef2f2' : (item.priority.includes('Medium') ? '#fffbeb' : '#f1f5f9');

    return `
      <div class="explore-opp-card" style="background:#ffffff;border:1.5px solid #e2e8f0;border-radius:14px;padding:20px 24px;display:flex;flex-direction:row;gap:22px;align-items:flex-start;box-shadow:0 3px 12px rgba(0,45,98,0.04);transition:all 0.2s ease;margin-bottom:4px;">
        
        <!-- Thumbnail -->
        <div style="width:160px;height:120px;flex-shrink:0;border-radius:10px;overflow:hidden;border:1px solid #cbd5e1;position:relative;">
          <img src="${item.thumbnail}" alt="${item.title}" style="width:100%;height:100%;object-fit:cover;" onerror="this.src='/images/solar-hospital.jpg'" />
        </div>

        <!-- Middle Content -->
        <div style="flex:1;min-width:0;">
          <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px;flex-wrap:wrap;">
            <span style="font-size:11.5px;font-weight:850;color:#1e40af;background:#eff6ff;padding:3px 8px;border-radius:6px;border:1px solid #bfdbfe">${item.code}</span>
            <span style="font-size:11px;font-weight:800;color:${priorityColor};background:${priorityBg};padding:2px 8px;border-radius:99px;border:1px solid currentColor">${item.priority}</span>
          </div>

          <h3 style="margin:0 0 6px 0;font-size:16px;font-weight:900;color:#0f172a;line-height:1.35">${item.title}</h3>

          <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;flex-wrap:wrap;font-size:12px;color:#475569;">
            <span>📍 ${item.district}, ${item.state}</span>
            <span>•</span>
            ${item.domains.map(d => `<span style="background:#f1f5f9;color:#334155;font-size:11px;font-weight:700;padding:2px 8px;border-radius:4px">${d}</span>`).join('')}
          </div>

          <p style="font-size:12.5px;color:#64748b;line-height:1.55;margin:0 0 10px 0">${item.description}</p>

          <div style="display:flex;gap:18px;align-items:center;flex-wrap:wrap;font-size:12px;border-top:1px solid #f1f5f9;padding-top:10px;">
            <div style="display:flex;gap:6px;align-items:center;">
              <span style="font-size:14px">🏛</span>
              <strong style="color:#0f172a">${item.university}</strong>
              <span style="color:#64748b">(${item.lead})</span>
            </div>

            <div style="display:flex;gap:6px;align-items:center;">
              <span style="font-size:11px;color:#64748b;font-weight:700">Estimated Support:</span>
              <strong style="color:#0f172a;font-size:13.5px">${item.estimatedBudget}</strong>
            </div>
          </div>

          <div style="display:flex;gap:6px;align-items:center;margin-top:8px;flex-wrap:wrap;">
            <span style="font-size:10.5px;color:#64748b;font-weight:700">Required Industry Support:</span>
            ${item.requiredSupport.map(s => `<span style="font-size:10.5px;background:#f8fafc;border:1px solid #e2e8f0;color:#334155;padding:2px 8px;border-radius:4px;font-weight:600">${s}</span>`).join('')}
          </div>
        </div>

        <!-- Right: Match Score & Actions -->
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:10px;flex-shrink:0;min-width:190px;text-align:right;">
          <div style="background:${matchBadgeBg};color:${matchBadgeColor};font-size:12px;font-weight:850;padding:4px 12px;border-radius:99px;border:1px solid currentColor;display:inline-flex;align-items:center;gap:5px;">
            <span>🟢</span> ${item.aiMatch}% Match Score
          </div>

          <div style="font-size:11.5px;background:${item.stageColor};color:${item.stageTextColor};padding:4px 10px;border-radius:6px;font-weight:800;border:1px solid currentColor">
            Stage: ${item.stage}
          </div>

          <div style="font-size:11.5px;color:#64748b;">
            📅 Expected Implementation<br/><strong style="color:#0f172a">${item.expectedDate}</strong>
          </div>

          <div style="display:flex;gap:8px;margin-top:6px;">
            <button class="btn btn-sm btn-ghost" onclick="viewOpportunity('${item._id}')" style="border:1.5px solid #cbd5e1;font-weight:750;padding:6px 12px;font-size:12px">
              View Opportunity
            </button>
            <button class="btn btn-sm btn-primary" onclick="expressInterest('${item._id}')" style="font-weight:800;padding:6px 14px;font-size:12px">
              Express Interest →
            </button>
          </div>
        </div>

      </div>
    `;
  }).join('');
};

window.resetExploreFilters = function() {
  if (document.getElementById('expSearchInput')) document.getElementById('expSearchInput').value = '';
  if (document.getElementById('expDomainFilter')) document.getElementById('expDomainFilter').value = '';
  if (document.getElementById('expDistrictFilter')) document.getElementById('expDistrictFilter').value = '';
  if (document.getElementById('expSupportFilter')) document.getElementById('expSupportFilter').value = '';
  if (document.getElementById('expBudgetFilter')) document.getElementById('expBudgetFilter').value = '';
  if (document.getElementById('expStageFilter')) document.getElementById('expStageFilter').value = '';
  if (document.getElementById('expSortSelect')) document.getElementById('expSortSelect').value = 'match';
  filterExploreChallenges();
  Toast.success('Filters Reset', 'Showing all 42 verified opportunities');
};

window.viewOpportunity = function(id) {
  const item = _allExploreOpportunities.find(o => o._id === id) || _allExploreOpportunities[0];
  const titleEl = document.getElementById('fullPropModalTitle');
  const subEl = document.getElementById('fullPropModalSub');
  if (titleEl) titleEl.textContent = item.title;
  if (subEl) subEl.textContent = `${item.university} · ${item.lead} · 📍 ${item.district}, ${item.state}`;
  
  if (typeof window.openModal === 'function') {
    window.openModal('modalFullProposal');
  } else {
    const m = document.getElementById('modalFullProposal');
    if (m) m.classList.add('active');
  }
};

window.expressInterest = function(id) {
  const item = _allExploreOpportunities.find(o => o._id === id) || _allExploreOpportunities[0];
  const propTitle = document.getElementById('propChallengeTitle');
  if (propTitle) propTitle.value = item.title;

  if (typeof window.openModal === 'function') {
    window.openModal('modalSubmitProposal');
  } else {
    const m = document.getElementById('modalSubmitProposal');
    if (m) m.classList.add('active');
  }
  Toast.success('Express Interest', `Pre-filled proposal for: ${item.title}`);
};





async function initIndustryPortal() {
  try {
    if (typeof Auth !== 'undefined' && Auth.getUser) {
      currentUser = Auth.getUser();
    }
  } catch (e) {}

  if (!currentUser) {
    try {
      const u = localStorage.getItem('is_user') || localStorage.getItem('user');
      if (u) currentUser = JSON.parse(u);
    } catch(e) {}
  }
  if (!currentUser) {
    currentUser = { name: 'Shoeb Raza', role: 'industry_rep', email: 'razashoeb3051@gmail.com', organization: 'Tata Steel Foundation', designation: 'Industry & CSR Partner' };
  }

  initUI();

  if (typeof window.filterExploreChallenges === 'function') {
    window.filterExploreChallenges();
  }
  const hash = window.location.hash.replace('#', '') || 'overview';
  showSection(hash);

  // Background non-blocking load
  try {
    loadData().catch(() => {});
  } catch(e) {}

  if (typeof NotifManager !== 'undefined' && NotifManager.startPolling) {
    try { NotifManager.startPolling(); } catch(e) {}
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initIndustryPortal);
} else {
  // Already interactive or complete in React SPA
  setTimeout(initIndustryPortal, 50);
}

function initUI() {
  if (!currentUser) {
    try {
      const u = localStorage.getItem('is_user') || localStorage.getItem('user');
      if (u) currentUser = JSON.parse(u);
    } catch(e) {}
  }
  if (!currentUser) {
    currentUser = { name: 'Shoeb Raza', role: 'industry_rep', email: 'razashoeb3051@gmail.com', organization: 'Tata Steel Foundation', designation: 'Industry & CSR Partner' };
  }

  const rawName = currentUser.name || 'Sushant';
  const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
  const initials = displayName ? displayName.charAt(0).toUpperCase() : 'S';
  const orgName = currentUser.organization || currentUser.companyName || 'Tata Steel Foundation';
  const roleTitle = currentUser.designation || 'Head of CSR & Sustainability';

  if (document.getElementById('sidebarAvatar')) document.getElementById('sidebarAvatar').textContent = initials;
  if (document.getElementById('topbarAvatar')) document.getElementById('topbarAvatar').textContent = initials;
  if (document.getElementById('sidebarName')) document.getElementById('sidebarName').textContent = displayName;
  if (document.getElementById('topbarName')) document.getElementById('topbarName').textContent = displayName;
  if (document.getElementById('welcomeName')) document.getElementById('welcomeName').textContent = `Welcome, ${displayName.split(' ')[0]}!`;
  if (document.getElementById('bannerGreeting')) document.getElementById('bannerGreeting').innerHTML = `Namaste, ${displayName.split(' ')[0]}! <span style="font-size:20px">🙏</span>`;
  if (document.getElementById('bannerSubbadge')) document.getElementById('bannerSubbadge').textContent = `National Civic Innovation Hub • ${orgName} Portal`;
  if (document.getElementById('sidebarRole')) document.getElementById('sidebarRole').textContent = `Industry Partner · ${orgName}`;
  if (document.getElementById('topbarRole')) document.getElementById('topbarRole').textContent = `Industry & CSR Partner`;

  if (document.getElementById('profRepName')) document.getElementById('profRepName').value = displayName;
  if (document.getElementById('profRepEmail')) document.getElementById('profRepEmail').value = currentUser.email || 'sushantranjan6206@gmail.com';
  if (document.getElementById('profOrgName')) document.getElementById('profOrgName').value = orgName;
  if (document.getElementById('collabContactName')) document.getElementById('collabContactName').value = displayName;
  if (document.getElementById('capOrgName')) document.getElementById('capOrgName').value = orgName;

  const handleResize = () => {
    const mBtn = document.getElementById('mobileSidebarBtn');
    if (mBtn) mBtn.style.display = window.innerWidth <= 900 ? 'flex' : 'none';
  };
  window.addEventListener('resize', handleResize);
  handleResize();
}

window.toggleSidebar = function() {
  const sb = document.querySelector('.sidebar');
  if (sb) {
    sb.classList.toggle('collapsed');
    document.body.classList.toggle('sidebar-collapsed', sb.classList.contains('collapsed'));
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
      if (window.panIndiaMapInstance && window.panIndiaMapInstance.map) {
        window.panIndiaMapInstance.map.invalidateSize();
      }
    }, 280);
  }
};

function showSection(section) {
  const mc = document.getElementById('mainContent');
  if (mc) mc.scrollTop = 0;
  window.location.hash = section;
  if (section === 'prototype') {
    section = 'collaborations';
    setTimeout(() => {
      if (typeof window.switchCollabTab === 'function') window.switchCollabTab('pilot');
    }, 40);
  }
    if (typeof window.setReactSection === 'function') {
    window.setReactSection(section);
  }
  document.querySelectorAll('.dashboard-section').forEach(s => s.style.display = 'none');
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));

  const sectionEl = document.getElementById(`section-${section}`);
  const navEl = document.getElementById(`nav-${section}`);
  if (sectionEl) sectionEl.style.display = 'block';
  if (navEl) navEl.classList.add('active');

  if (section === 'challenge-details') {
    document.getElementById('nav-explore')?.classList.add('active');
  }
    if (section === 'commitments') {
    if (typeof window.selectCommitmentProject === 'function') window.selectCommitmentProject('solar-phc');
  }
  if (section === 'roi' && typeof loadOpportunityRoiCenter === 'function') loadOpportunityRoiCenter();
  if (section === 'challenge-details') {
    if (!currentSelectedChallenge && allProjects.length > 0) {
      currentSelectedChallenge = enrichChallengeData(allProjects[0]);
    }
    if (currentSelectedChallenge) {
      renderChallengeDetailsPage(currentSelectedChallenge);
    }
  }
  if (section === 'collaborations' && typeof loadCollaborations === 'function') loadCollaborations();
  if (section === 'project-workspace') {
    if (!currentActiveWorkspace) {
      openProjectWorkspace('PRJ-001');
    }
  }
  if (section === 'impact' && typeof loadImpactAnalytics === 'function') loadImpactAnalytics();
  if (section === 'heatmap') {
    initIndustryHeatmap();
    setTimeout(() => window.panIndiaMapInstance?.invalidateSize(), 200);
  }
  if (section === 'notifications' && typeof loadNotifications === 'function') loadNotifications();
  if (section === 'profile' && typeof loadProfile === 'function') loadProfile();
}

// ── OVERVIEW REVAMP INITIALIZATION ──────────────────────────────────────────
function initOverviewRevamp() {
  // Animate KPIs
  if (typeof Utils !== 'undefined' && Utils.animateCounter) {
    const elActive = document.getElementById('kpi-active-projects');
    const elCollab = document.getElementById('kpi-collaborations');
    const elUniv = document.getElementById('kpi-univ-partners');
    const elCit = document.getElementById('kpi-impact-citizens');
    if (elActive) Utils.animateCounter(elActive, 12);
    if (elCollab) Utils.animateCounter(elCollab, 18);
    if (elUniv) Utils.animateCounter(elUniv, 7);
    if (elCit) Utils.animateCounter(elCit, 1240);
  }

  // Initialize Collaboration Trend Chart
  setTimeout(() => {
    initCollabTrendChart('30d');
  }, 100);
}

;

let currentPrototypeId = 'solar-phc';

function selectPrototypeProblem(id) {
  if (!PROTOTYPE_PROJECTS[id]) return;
  currentPrototypeId = id;
  const p = PROTOTYPE_PROJECTS[id];

  document.querySelectorAll('.proto-problem-pill').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-id') === id);
  });

  const heroThumb = document.getElementById('protoHeroThumb');
  const heroStatus = document.getElementById('protoHeroStatus');
  const heroTitle = document.getElementById('protoHeroTitle');
  const heroCategory = document.getElementById('protoHeroCategory');
  const heroDistrict = document.getElementById('protoHeroDistrict');
  const heroDesc = document.getElementById('protoHeroDesc');
  const heroTags = document.getElementById('protoHeroTags');
  const heroUniv = document.getElementById('protoHeroUniv');
  const heroRole = document.getElementById('protoHeroRole');
  const heroTimeline = document.getElementById('protoHeroTimeline');
  const heroProgressVal = document.getElementById('protoHeroProgressVal');
  const heroProgressBar = document.getElementById('protoHeroProgressBar');
  const heroStage = document.getElementById('protoHeroStage');
  const heroNextMilestone = document.getElementById('protoHeroNextMilestone');

  if (heroThumb) heroThumb.src = p.thumbnail;
  if (heroStatus) {
    heroStatus.textContent = p.status;
    heroStatus.className = 'badge ' + p.statusClass;
  }
  if (heroTitle) heroTitle.textContent = p.title;
  if (heroCategory) heroCategory.textContent = p.categoryIcon + ' ' + p.category;
  if (heroDistrict) heroDistrict.textContent = '📍 ' + p.district + ', ' + p.state;
  if (heroDesc) heroDesc.textContent = p.description;
  if (heroTags) {
    heroTags.innerHTML = p.tags.map(t => '<span class="proto-tag">' + t + '</span>').join('');
  }
  if (heroUniv) heroUniv.textContent = p.university;
  if (heroRole) heroRole.textContent = p.role;
  if (heroTimeline) heroTimeline.textContent = p.timeline;
  if (heroProgressVal) heroProgressVal.textContent = p.progress + '%';
  if (heroProgressBar) heroProgressBar.style.width = p.progress + '%';
  if (heroStage) heroStage.textContent = '🚀 ' + p.stageName;
  if (heroNextMilestone) heroNextMilestone.textContent = '📅 ' + p.nextMilestone;

  const actionBadge = document.getElementById('protoActionCountBadge');
  const actionList = document.getElementById('protoActionsList');
  if (actionBadge) actionBadge.textContent = p.actionsCount;
  if (actionList) {
    actionList.innerHTML = p.actions.map(a => 
      '<div class="proto-action-item" onclick="triggerProtoAction(\'' + a.handler + '\', \'' + p.id + '\')">' +
        '<div class="proto-action-icon">📄</div>' +
        '<div class="proto-action-content">' +
          '<div class="proto-action-title">' + a.title + '</div>' +
          '<div class="proto-action-desc">' + a.desc + '</div>' +
        '</div>' +
        '<div class="proto-action-chevron">›</div>' +
      '</div>'
    ).join('');
  }

  const locEl = document.getElementById('protoDetailLocation');
  const startEl = document.getElementById('protoDetailStart');
  const durEl = document.getElementById('protoDetailDuration');
  const envEl = document.getElementById('protoDetailEnv');
  const objEl = document.getElementById('protoDetailObjectives');

  if (locEl) locEl.textContent = p.details.location;
  if (startEl) startEl.textContent = p.details.startDate;
  if (durEl) durEl.textContent = p.details.duration;
  if (envEl) envEl.textContent = p.details.environment;
  if (objEl) {
    objEl.innerHTML = p.details.objectives.map(o => 
      '<div class="proto-obj-item">' +
        '<span class="proto-check">✓</span>' +
        '<span>' + o + '</span>' +
      '</div>'
    ).join('');
  }

  const stat1 = document.getElementById('protoStatPower');
  const stat2 = document.getElementById('protoStatBattery');
  const stat3 = document.getElementById('protoStatLoad');
  const stat4 = document.getElementById('protoStatTemp');

  if (stat1) stat1.textContent = p.telemetry.powerOutput;
  if (stat2) stat2.textContent = p.telemetry.batteryLevel;
  if (stat3) stat3.textContent = p.telemetry.loadHandled;
  if (stat4) stat4.textContent = p.telemetry.systemTemp;

  const updatesEl = document.getElementById('protoUpdatesList');
  if (updatesEl) {
    updatesEl.innerHTML = p.updates.map(u => 
      '<div class="proto-update-row">' +
        '<div class="proto-update-date">📅 ' + u.date + '</div>' +
        '<div class="proto-update-dot ' + u.status + '"></div>' +
        '<div class="proto-update-text">' + u.text + '</div>' +
      '</div>'
    ).join('');
  }

  const quoteEl = document.getElementById('protoFeedbackQuote');
  const authorEl = document.getElementById('protoFeedbackAuthor');
  if (quoteEl) quoteEl.textContent = '"' + p.fieldFeedback.quote + '"';
  if (authorEl) authorEl.textContent = '— ' + p.fieldFeedback.author + ' · ' + p.fieldFeedback.date;

  const photosEl = document.getElementById('protoPhotosGrid');
  if (photosEl) {
    photosEl.innerHTML = p.fieldPhotos.map(photo => 
      '<div class="proto-photo-card" onclick="openImageLightbox(\'' + photo.src + '\', \'' + photo.title + '\', \'' + p.title + ' · Field Capture\')">' +
        '<img src="' + photo.src + '" alt="' + photo.title + '" onError="this.src=\'/others' + photo.src + '\'" />' +
        '<div class="proto-photo-caption">' + photo.title + '</div>' +
        '<span class="proto-photo-zoom">🔍 Enlarge</span>' +
      '</div>'
    ).join('');
  }

  const nextStepsEl = document.getElementById('protoNextStepsList');
  if (nextStepsEl) {
    nextStepsEl.innerHTML = p.nextSteps.map((step, idx) => 
      '<div class="proto-step-item">' +
        '<div class="proto-step-num">' + (idx + 1) + '</div>' +
        '<div class="proto-step-text">' + step + '</div>' +
      '</div>'
    ).join('');
  }

  const commitmentsEl = document.getElementById('protoCommitmentsList');
  if (commitmentsEl) {
    commitmentsEl.innerHTML = p.commitments.map(c => 
      '<div class="proto-commit-item">' +
        '<span class="proto-commit-name">⚙️ ' + c.item + '</span>' +
        '<span class="proto-commit-badge ' + c.type + '">' + c.status + '</span>' +
      '</div>'
    ).join('');
  }

  const dEnd = document.getElementById('protoDateEnd');
  const dEval = document.getElementById('protoDateEval');
  const dImpl = document.getElementById('protoDateImpl');
  if (dEnd) dEnd.textContent = p.importantDates.pilotEnd;
  if (dEval) dEval.textContent = p.importantDates.evaluation;
  if (dImpl) dImpl.textContent = p.importantDates.implementation;

  toastSuccess('Loaded live telemetry & prototype details for ' + p.title);
}
window.selectPrototypeProblem = selectPrototypeProblem;

function triggerProtoAction(handlerName, problemId) {
  if (typeof window[handlerName] === 'function') {
    window[handlerName](problemId);
  }
}
window.triggerProtoAction = triggerProtoAction;

const STAGES_METADATA = {
  1: {
    num: 1,
    title: 'Solution Proposal',
    status: 'Completed',
    date: '12 May 2025',
    desc: 'University engineering faculty submitted detailed technical solution, architecture blueprint, bill of materials (BOM), and laboratory bench test results to JanSetu Command.',
    actions: ['View University Blueprint (PDF)', 'Download Academic Proposal Dossier']
  },
  2: {
    num: 2,
    title: 'Industry Support',
    status: 'Completed',
    date: '28 May 2025',
    desc: 'State Admin and AI Matching engine assigned proposal to your enterprise. CSR Grant Agreement and specialized equipment allocation signed.',
    actions: ['View Signed CSR Agreement', 'Inspect Equipment Allocation Receipt']
  },
  3: {
    num: 3,
    title: 'Prototype Ready',
    status: 'Completed',
    date: '15 Jul 2025',
    desc: 'University researchers built and verified bench prototype (TRL-5) inside departmental laboratory. Environmental temperature stress tests passed with 100% compliance.',
    actions: ['View TRL-5 Bench Certification', 'Review Lab Test Sign-off Sheet']
  },
  4: {
    num: 4,
    title: 'Pilot Testing',
    status: 'Active (In Progress)',
    date: '15 Aug 2025 – Present',
    desc: 'Small-scale field testing under real-world load in district health clinic / water source. Telemetry actively streamed to dashboard.',
    actions: ['Approve Pilot Stage', 'Request Revision', 'Request More Data', 'Provide Technical Feedback']
  },
  5: {
    num: 5,
    title: 'Pilot Evaluation',
    status: 'Upcoming',
    date: 'Scheduled: 20 Sep 2025',
    desc: 'Joint evaluation session between District Administration, University Faculty PI, and Industry Technical Mentors to audit pilot data against key performance benchmarks.',
    actions: ['View Evaluation Scorecard Template', 'Download Joint Audit Protocol']
  },
  6: {
    num: 6,
    title: 'Ground Implementation',
    status: 'Pending Pilot Evaluation',
    date: 'Expected: Oct 2025',
    desc: 'Full-scale civil construction, procurement scaling, and field rollout across targeted rural community blocks in Jharkhand.',
    actions: ['View District Rollout Roadmap', 'Inspect Procurement Bill of Quantities']
  },
  7: {
    num: 7,
    title: 'Citizen Validation',
    status: 'Upcoming',
    date: 'Expected: Dec 2025',
    desc: 'End-user citizen satisfaction audits, Panchayat grievance resolution verification, and social impact audit signed by District Collectorate.',
    actions: ['View Panchayat Social Audit Framework', 'Download Citizen Survey Protocol']
  }
};

function showStageDetails(stageNum) {
  const stage = STAGES_METADATA[stageNum];
  if (!stage) return;

  const modal = document.getElementById('modalStageDetails');
  const titleEl = document.getElementById('stageModalTitle');
  const statusEl = document.getElementById('stageModalStatus');
  const dateEl = document.getElementById('stageModalDate');
  const descEl = document.getElementById('stageModalDesc');
  const actionsEl = document.getElementById('stageModalActions');

  if (titleEl) titleEl.textContent = 'Stage ' + stage.num + ': ' + stage.title;
  if (statusEl) {
    statusEl.textContent = stage.status;
    statusEl.className = stage.num <= 3 ? 'badge badge-resolved' : (stage.num === 4 ? 'badge badge-assigned' : 'badge badge-pending');
  }
  if (dateEl) dateEl.textContent = '📅 ' + stage.date;
  if (descEl) descEl.textContent = stage.desc;
  if (actionsEl) {
    actionsEl.innerHTML = stage.actions.map(act => 
      '<button class="btn btn-outline-primary" style="font-size:12.5px;padding:8px 16px;font-weight:700" onclick="toastSuccess(\'Action: ' + act + ' initiated successfully.\')">' +
        act +
      '</button>'
    ).join('');
  }

  if (modal) modal.classList.add('open');
}
window.showStageDetails = showStageDetails;

function switchCollabTab(tabName) {
  document.querySelectorAll('.ws-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
  });

  document.querySelectorAll('.ws-tab-panel').forEach(panel => {
    panel.style.display = panel.id === ('wsPanel-' + tabName) ? 'block' : 'none';
  });
}
window.switchCollabTab = switchCollabTab;

function reviewLatestPilotData(pId, title) {
  const p = PROTOTYPE_PROJECTS[pId || currentPrototypeId] || PROTOTYPE_PROJECTS['solar-phc'];
  const modal = document.getElementById('modalSensorTelemetry');
  const titleEl = document.getElementById('sensorLogTitle');
  if (titleEl) titleEl.textContent = 'Latest Pilot Telemetry: ' + p.title;
  if (modal) modal.classList.add('open');
}
window.reviewLatestPilotData = reviewLatestPilotData;

function provideTechnicalFeedback(pId, title) {
  const p = PROTOTYPE_PROJECTS[pId || currentPrototypeId] || PROTOTYPE_PROJECTS['solar-phc'];
  const modal = document.getElementById('modalTechnicalFeedback');
  const titleEl = document.getElementById('techFeedbackTitle');
  if (titleEl) titleEl.textContent = 'Technical Engineering Feedback: ' + p.title;
  if (modal) modal.classList.add('open');
}
window.provideTechnicalFeedback = provideTechnicalFeedback;

function sendTechnicalFeedback() {
  closeModal('modalTechnicalFeedback');
  toastSuccess('Technical feedback securely transmitted to University Research Lab and logged in Project Workspace.');
}
window.sendTechnicalFeedback = sendTechnicalFeedback;

function requestMorePilotData(pId, title) {
  toastSuccess('Data Request Dispatched: University PI at ' + (PROTOTYPE_PROJECTS[currentPrototypeId]?.university || 'IIT (ISM)') + ' notified to upload raw 1-minute interval sensor logs.');
}
window.requestMorePilotData = requestMorePilotData;

function downloadTestProtocol() {
  toastSuccess('Exported Verified Test Protocol & Calibration Standard v2.4 (PDF signed by State Innovation Command)');
}
window.downloadTestProtocol = downloadTestProtocol;

function editPilotDetails() {
  toastSuccess('Pilot parameter edit mode enabled. Authorized for Project Technical Lead.');
}
window.editPilotDetails = editPilotDetails;

function switchProtoInnerTab(tabName) {
  document.querySelectorAll('.proto-inner-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
  });
  toastSuccess('Displaying ' + tabName.toUpperCase() + ' section view.');
}
window.switchProtoInnerTab = switchProtoInnerTab;

/* Support Commitments & Capabilities Interactivity Handlers */
window.filterCommitmentsTab = function(tabName) {
  document.querySelectorAll('.support-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-filter') === tabName);
  });
  Toast.info('Filter Applied', 'Showing ' + tabName.replace('_', ' ') + ' commitments');
};

window.selectCommitmentProject = function(projId) {
  document.querySelectorAll('.support-proj-card').forEach(card => card.classList.remove('active'));
  const card = document.getElementById('commitCard-' + projId);
  if (card) card.classList.add('active');

  const metaMap = {
    'solar-phc': {
      title: 'Rural Hospital Solar Unit',
      uni: 'IIT (ISM) Dhanbad',
      loc: '📍 Dhanbad, Jharkhand',
      thumb: '/images/solar-hospital.jpg',
      badge: 'In Progress',
      badgeClass: 'badge-assigned'
    },
    'water-iot': {
      title: 'Smart Water Monitoring',
      uni: 'BIT Mesra',
      loc: '📍 Ranchi, Jharkhand',
      thumb: '/images/water-monitoring.jpg',
      badge: 'On Track',
      badgeClass: 'badge-resolved'
    },
    'digital-edge': {
      title: 'Rural Digital Learning Hub',
      uni: 'Ranchi University',
      loc: '📍 Latehar, Jharkhand',
      thumb: '/images/digital-learning.jpg',
      badge: 'Delayed',
      badgeClass: 'badge-warning'
    },
    'mobile-health': {
      title: 'Mobile Health Diagnostic Unit',
      uni: 'AIIMS Deoghar',
      loc: '📍 Deoghar, Jharkhand',
      thumb: '/images/agri-monitoring.jpg',
      badge: 'Not Started',
      badgeClass: 'badge-ghost'
    }
  };

  const meta = metaMap[projId] || metaMap['solar-phc'];
  if (document.getElementById('commitDetailTitle')) document.getElementById('commitDetailTitle').textContent = meta.title;
  if (document.getElementById('commitDetailUni')) document.getElementById('commitDetailUni').textContent = meta.uni;
  if (document.getElementById('commitDetailLoc')) document.getElementById('commitDetailLoc').textContent = meta.loc;
  if (document.getElementById('commitDetailThumb')) document.getElementById('commitDetailThumb').src = meta.thumb;
  if (document.getElementById('commitDetailBadge')) document.getElementById('commitDetailBadge').textContent = meta.badge;
  if (document.getElementById('commitProjSelect')) document.getElementById('commitProjSelect').value = projId;
};

window.searchCommitmentsList = function() {
  const query = (document.getElementById('commitSearchInput')?.value || '').toLowerCase();
  document.querySelectorAll('.support-proj-card').forEach(card => {
    const text = card.textContent.toLowerCase();
    card.style.display = text.includes(query) ? 'block' : 'none';
  });
};

window.saveCapabilitiesData = function() {
  const payload = {
    orgName: document.getElementById('capOrgName')?.value,
    focusAreas: document.getElementById('capFocusAreas')?.value,
    budget: document.getElementById('capBudget')?.value,
    equipment: document.getElementById('capEquipment')?.value,
    activeProjects: document.getElementById('capActiveProjects')?.value,
    canSupport: document.getElementById('capCanSupport')?.value,
    expertRole: document.getElementById('capExpertRole')?.value,
    expertCount: document.getElementById('capExpertCount')?.value,
    state: document.getElementById('capState')?.value,
    districts: document.getElementById('capDistricts')?.value,
    additional: document.getElementById('capAdditional')?.value,
    savedAt: new Date().toISOString()
  };
  try {
    localStorage.setItem('jansetu_industry_caps_v2', JSON.stringify(payload));
  } catch(e) {}
  Toast.success('Capabilities Saved', 'Your organization profile was updated and re-indexed with JanSetu AI.');
};

window.openProjectWorkspace = function(id) {
  showSection('collaborations');
  const wsEl = document.getElementById('sharedCollabWorkspace');
  if (wsEl) {
    wsEl.style.display = 'block';
    // wsEl.scrollIntoView
  }
  if (typeof window.selectPrototypeProblem === 'function') {
    window.selectPrototypeProblem(id || 'solar-phc');
  }
  Toast.success('Workspace Loaded', 'Active Collaboration Tracking Workspace');
};

window.backToCollaborationsList = function() {
  const wsEl = document.getElementById('sharedCollabWorkspace');
  if (wsEl) {
    wsEl.style.display = 'none';
  }
  const grid = document.getElementById('collaborationsGrid');
  if (grid) {
    // grid.scrollIntoView
  }
};



const COMMITMENT_PROJECTS = {
  'solar-phc': {
    id: 'solar-phc',
    title: 'Rural Hospital Solar Unit',
    status: 'In Progress',
    statusClass: 'badge-assigned',
    uni: 'IIT (ISM) Dhanbad',
    loc: '📍 Dhanbad, Jharkhand',
    thumb: '/images/solar-hospital.jpg',
    categories: ['Healthcare', 'Clean Energy', 'Rural Development'],
    progress: 60,
    progressColor: '#16a34a',
    summary: 'Solar powered backup system for uninterrupted power supply in rural health centers, ensuring continuous healthcare services.',
    startDate: '15 Apr 2026',
    approvedBudget: '₹12,00,000',
    targetDate: 'Dec 2026',
    stage: 'Prototype & Pilot',
    role: 'Funding + Equipment',
    expectedImpact: '5,000+ citizens',
    breakdown: { committed: 4, provided: 2, verified: 1, pending: 1 },
    milestone: { title: 'Dispatch remaining equipment', date: '20 Sep 2026' },
    commitments: [
      { type: '💰 Funding', req: '₹10,00,000', our: '₹10,00,000', status: 'Verified', statusColor: '#dcfce7', statusText: '#15803d', date: '12 Jul 2026', action: 'View Receipt', actionFn: "openDisbursementReceiptModal('JH-CSR-2026-904', '₹10,00,000', 'IIT (ISM) Dhanbad', 'Rural Hospital Solar Unit')" },
      { type: '⚙️ Equipment', req: 'Solar Panels (10 units)', our: '10 Solar Panels', status: 'In Progress', statusColor: '#eff6ff', statusText: '#1d4ed8', date: '20 Sep 2026', action: 'Track Delivery', actionFn: "toastSuccess('Tracking ID: SP-DHN-8821. Shipped via Ranchi Express Logistics.')" },
      { type: '👨‍🏫 Expert/Mentor', req: '1 Solar Engineer', our: 'Mr. Rajesh Kumar', status: 'Provided', statusColor: '#dbeafe', statusText: '#1e40af', date: '05 Aug 2026', action: 'View Details', actionFn: "toastSuccess('Senior Electrical Engineer Rajesh Kumar assigned to Dhanbad site.')" },
      { type: '🧪 Testing Equipment', req: 'Battery Testing Kit', our: '1 Testing Kit', status: 'Pending', statusColor: '#fef3c7', statusText: '#b45309', date: '20 Sep 2026', action: 'Dispatch', actionFn: "toastSuccess('Battery testing kit dispatched to IIT Dhanbad lab.')" }
    ],
    activity: [
      { date: '12 Jul 2026', color: '#16a34a', text: 'Funding of ₹10,00,000 verified by university.' },
      { date: '05 Aug 2026', color: '#2563eb', text: 'Technical expert assigned (Mr. Rajesh Kumar).' },
      { date: '28 Aug 2026', color: '#2563eb', text: 'Solar panels dispatched. Tracking ID: SP123456789.' },
      { date: '25 Aug 2026', color: '#d97706', text: 'Testing equipment pending dispatch.' }
    ]
  },
  'water-iot': {
    id: 'water-iot',
    title: 'Smart Water Monitoring',
    status: 'On Track',
    statusClass: 'badge-resolved',
    uni: 'BIT Mesra',
    loc: '📍 Ranchi, Jharkhand',
    thumb: '/images/water-monitoring.jpg',
    categories: ['Water Management', 'IoT', 'Rural Health'],
    progress: 80,
    progressColor: '#16a34a',
    summary: 'IoT-based water quality and reservoir level monitoring system ensuring clean drinking water delivery and real-time contamination warnings across Ranchi reservoirs.',
    startDate: '10 May 2026',
    approvedBudget: '₹14,50,000',
    targetDate: 'Nov 2026',
    stage: 'Prototype & Pilot',
    role: 'Sensor Hardware + Cloud Data Platform',
    expectedImpact: '45,000+ residents',
    breakdown: { committed: 4, provided: 3, verified: 2, pending: 1 },
    milestone: { title: 'Deploy remote LoRaWAN gateway in Kanke', date: '25 Sep 2026' },
    commitments: [
      { type: '💰 Funding', req: '₹8,00,000', our: '₹8,00,000', status: 'Verified', statusColor: '#dcfce7', statusText: '#15803d', date: '18 Jun 2026', action: 'View Receipt', actionFn: "openDisbursementReceiptModal('JH-CSR-2026-912', '₹8,00,000', 'BIT Mesra', 'Smart Water Monitoring')" },
      { type: '⚙️ Equipment', req: '24 IoT Water Sensors', our: '24 Multi-probe Probes', status: 'Verified', statusColor: '#dcfce7', statusText: '#15803d', date: '10 Jul 2026', action: 'View Details', actionFn: "toastSuccess('24 Optical Dissolved Oxygen and Turbidity sensors delivered and calibrated.')" },
      { type: '💻 Technology', req: 'Cloud Telemetry License', our: 'AWS GovCloud Setup', status: 'In Progress', statusColor: '#eff6ff', statusText: '#1d4ed8', date: '25 Sep 2026', action: 'View Details', actionFn: "toastSuccess('Cloud data ingestion pipeline active at 99.8% uptime.')" },
      { type: '👨‍🏫 Training', req: 'Local Jal Sahiyas Training', our: '2 Workshop Sessions', status: 'Pending', statusColor: '#fef3c7', statusText: '#b45309', date: '05 Oct 2026', action: 'Schedule', actionFn: "toastSuccess('Training module drafted for 30 Jal Sahiyas in Ranchi district.')" }
    ],
    activity: [
      { date: '18 Jun 2026', color: '#16a34a', text: 'Grant disbursement of ₹8,00,000 verified by BIT Mesra.' },
      { date: '10 Jul 2026', color: '#16a34a', text: 'IoT optical sensors delivered to environmental research lab.' },
      { date: '14 Aug 2026', color: '#2563eb', text: 'Telemetry dashboard prototype verified by State Water Dept.' },
      { date: '01 Sep 2026', color: '#d97706', text: 'Field calibration scheduled at Dhurwa Dam.' }
    ]
  },
  'digital-edge': {
    id: 'digital-edge',
    title: 'Rural Digital Learning Hub',
    status: 'Delayed',
    statusClass: 'badge-warning',
    uni: 'Ranchi University',
    loc: '📍 Latehar, Jharkhand',
    thumb: '/images/digital-learning.jpg',
    categories: ['Education', 'Digital Infra', 'Tribal Welfare'],
    progress: 40,
    progressColor: '#f59e0b',
    summary: 'Solar-powered offline digital computer lab and smart classroom network for tribal secondary schools in remote forested areas of Latehar.',
    startDate: '01 Jun 2026',
    approvedBudget: '₹9,50,000',
    targetDate: 'Jan 2027',
    stage: 'Detailed Design & Sourcing',
    role: 'Laptops + Solar Micro-Inverter',
    expectedImpact: '1,800 students',
    breakdown: { committed: 5, provided: 1, verified: 1, pending: 3 },
    milestone: { title: 'Clear road transport permit for Latehar center', date: '28 Sep 2026' },
    commitments: [
      { type: '💰 Funding', req: '₹4,50,000', our: '₹4,50,000', status: 'Verified', statusColor: '#dcfce7', statusText: '#15803d', date: '15 Jul 2026', action: 'View Receipt', actionFn: "openDisbursementReceiptModal('JH-CSR-2026-920', '₹4,50,000', 'Ranchi University', 'Rural Digital Learning Hub')" },
      { type: '⚙️ Equipment', req: '20 Rugged Laptops', our: '20 ThinkPad Laptops', status: 'Pending', statusColor: '#fef3c7', statusText: '#b45309', date: '10 Oct 2026', action: 'Track Delivery', actionFn: "toastSuccess('Shipment delayed due to monsoon road repair in Latehar. ETA revised.')" },
      { type: '📡 Technology', req: 'Offline Educational Server', our: '1 Kiwix Edge Server', status: 'In Progress', statusColor: '#eff6ff', statusText: '#1d4ed8', date: '28 Sep 2026', action: 'View Details', actionFn: "toastSuccess('Server loaded with NCERT syllabus and local language multimedia modules.')" },
      { type: '👨‍🏫 Expert/Mentor', req: '2 STEM Instructors', our: 'Tata CSR Education Team', status: 'Pending', statusColor: '#fef3c7', statusText: '#b45309', date: '15 Oct 2026', action: 'Assign', actionFn: "toastSuccess('Instructor assignment roster in progress.')" }
    ],
    activity: [
      { date: '15 Jul 2026', color: '#16a34a', text: 'Phase 1 funding released to Ranchi University escrow.' },
      { date: '02 Aug 2026', color: '#2563eb', text: 'Offline digital content curriculum finalized with State Education Board.' },
      { date: '22 Aug 2026', color: '#d97706', text: 'Logistics delay notification received for hardware delivery.' },
      { date: '05 Sep 2026', color: '#2563eb', text: 'School building electrical wiring completed by local contractor.' }
    ]
  },
  'mobile-health': {
    id: 'mobile-health',
    title: 'Mobile Health Diagnostic Unit',
    status: 'Not Started',
    statusClass: 'badge-ghost',
    uni: 'AIIMS Deoghar',
    loc: '📍 Deoghar, Jharkhand',
    thumb: '/images/agri-monitoring.jpg',
    categories: ['Healthcare', 'Medical Equipment', 'Emergency'],
    progress: 20,
    progressColor: '#94a3b8',
    summary: 'Specially outfitted 4x4 mobile diagnostic van with ultrasound, ECG, pathology lab, and satellite telemedicine connectivity for hard-to-reach Santhal Pargana villages.',
    startDate: '01 Aug 2026',
    approvedBudget: '₹22,00,000',
    targetDate: 'Feb 2027',
    stage: 'Vehicle Outfitting',
    role: 'Van Chassis + Point-of-Care Diagnostics',
    expectedImpact: '35,000 villagers',
    breakdown: { committed: 4, provided: 0, verified: 0, pending: 4 },
    milestone: { title: 'Procure custom chassis from Jamshedpur plant', date: '30 Oct 2026' },
    commitments: [
      { type: '💰 Funding', req: '₹12,00,000', our: '₹12,00,000', status: 'Pending', statusColor: '#fef3c7', statusText: '#b45309', date: '30 Sep 2026', action: 'Disburse', actionFn: "toastSuccess('Grant disbursement approval pending final vehicle specs clearance.')" },
      { type: '🚐 Vehicle', req: '1 All-Terrain Van Chassis', our: 'Tata Winger 4x4', status: 'In Progress', statusColor: '#eff6ff', statusText: '#1d4ed8', date: '15 Nov 2026', action: 'Track Delivery', actionFn: "toastSuccess('Vehicle body fabrication in progress at Jamshedpur workshop.')" },
      { type: '🧪 Equipment', req: 'Portable ECG & Ultrasound', our: 'Point-of-care Kit', status: 'Pending', statusColor: '#fef3c7', statusText: '#b45309', date: '30 Nov 2026', action: 'Procure', actionFn: "toastSuccess('Medical procurement PO queued with authorized distributor.')" }
    ],
    activity: [
      { date: '01 Aug 2026', color: '#2563eb', text: 'Project charter ratified by AIIMS Deoghar and State Health Dept.' },
      { date: '18 Aug 2026', color: '#2563eb', text: 'CSR funding agreement countersigned by Tata Steel Foundation.' },
      { date: '02 Sep 2026', color: '#d97706', text: 'Vehicle body fabrication layout reviewed by medical staff.' }
    ]
  }
};

window.selectCommitmentProject = function(projId) {
  const p = COMMITMENT_PROJECTS[projId] || COMMITMENT_PROJECTS['solar-phc'];
  
  // Update Left Cards
  document.querySelectorAll('.support-proj-card').forEach(card => card.classList.remove('active'));
  const card = document.getElementById('commitCard-' + projId);
  if (card) card.classList.add('active');

  // Update Right Details
  const thumbEl = document.getElementById('commitDetailThumb');
  const titleEl = document.getElementById('commitDetailTitle');
  const badgeEl = document.getElementById('commitDetailBadge');
  const uniEl = document.getElementById('commitDetailUni');
  const locEl = document.getElementById('commitDetailLoc');
  const selectEl = document.getElementById('commitProjSelect');

  if (thumbEl) thumbEl.src = p.thumb;
  if (titleEl) titleEl.textContent = p.title;
  if (badgeEl) {
    badgeEl.textContent = p.status;
    badgeEl.className = 'badge ' + p.statusClass;
  }
  if (uniEl) uniEl.textContent = p.uni;
  if (locEl) locEl.textContent = p.loc;
  if (selectEl) selectEl.value = projId;

  // Re-render Commitments Table
  const tableBody = document.querySelector('#section-commitments table tbody');
  if (tableBody) {
    tableBody.innerHTML = p.commitments.map(c => `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 10px 14px; font-weight: 750;">${c.type}</td>
        <td style="padding: 10px 14px;">${c.req}</td>
        <td style="padding: 10px 14px; font-weight: 750;">${c.our}</td>
        <td style="padding: 10px 14px;">
          <span style="background:${c.statusColor};color:${c.statusText};padding:2px 8px;border-radius:99px;font-weight:800;font-size:10.5px;">${c.status}</span>
        </td>
        <td style="padding: 10px 14px; color: #64748b;">${c.date}</td>
        <td style="padding: 10px 14px;">
          <button class="btn btn-sm btn-ghost" onclick="${c.actionFn}" style="border:1px solid #cbd5e1;font-size:11px;font-weight:700">${c.action}</button>
        </td>
      </tr>
    `).join('');
  }

  // Update Recent Activity
  const activityContainer = document.querySelector('#section-commitments .support-workspace-split > div:nth-child(2) > div:last-child > div:first-child > div:last-child');
  if (activityContainer) {
    activityContainer.innerHTML = p.activity.map(a => `
      <div style="display:flex;gap:8px;align-items:flex-start;">
        <span style="color:${a.color};font-size:10px;margin-top:2px;">●</span>
        <div><strong>${a.date}</strong> &nbsp;${a.text}</div>
      </div>
    `).join('');
  }

  Toast.success('Project Selected', p.title);
};

window.filterCommitmentsTab = function(tab) {
  document.querySelectorAll('.support-tab-btn').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-filter') === tab);
  });

  document.querySelectorAll('.support-proj-card').forEach(card => {
    if (tab === 'all') {
      card.style.display = 'block';
    } else if (tab === 'active') {
      card.style.display = 'block';
    } else if (tab === 'pending') {
      const text = card.textContent.toLowerCase();
      card.style.display = (text.includes('pending') || text.includes('not started') || text.includes('delayed')) ? 'block' : 'none';
    } else if (tab === 'in_progress') {
      const text = card.textContent.toLowerCase();
      card.style.display = text.includes('in progress') ? 'block' : 'none';
    } else if (tab === 'verified') {
      const text = card.textContent.toLowerCase();
      card.style.display = (text.includes('on track') || text.includes('verified')) ? 'block' : 'none';
    }
  });
};



window.switchCollabTab = function(tabName) {
  // Update Tab buttons
  document.querySelectorAll('#sharedCollabWorkspace .ws-tab-btn').forEach(btn => {
    const isTarget = btn.getAttribute('data-tab') === tabName;
    btn.classList.toggle('active', isTarget);
    if (isTarget) {
      btn.style.background = '#002D62';
      btn.style.color = '#ffffff';
    } else {
      btn.style.background = 'transparent';
      btn.style.color = '#475569';
    }
  });

  // Hide all panels
  document.querySelectorAll('#sharedCollabWorkspace .ws-tab-panel').forEach(panel => {
    panel.style.display = 'none';
  });

  // Show target panel
  const target = document.getElementById('wsPanel-' + tabName);
  if (target) {
    target.style.display = 'block';
  }

  if (tabName === 'pilot' || tabName === 'prototype') {
    if (typeof window.selectPrototypeProblem === 'function') {
      window.selectPrototypeProblem(currentPrototypeId || 'solar-phc');
    }
  }

  Toast.success('Workspace Tab', tabName.toUpperCase() + ' View Active');
};

window.approvePilotStage = function() {
  const p = PROTOTYPE_PROJECTS[currentPrototypeId] || PROTOTYPE_PROJECTS['solar-phc'];
  Toast.success('Pilot Approved', 'Pilot Testing (Stage 4) approved for ' + p.title + '. Progressing to Stage 5: Pilot Evaluation.');
  const step4 = document.querySelector('.pipeline-step.current');
  if (step4) {
    step4.classList.remove('current');
    step4.classList.add('completed');
    step4.querySelector('.step-circle').textContent = '✓';
  }
  const step5 = document.querySelectorAll('.pipeline-step')[4];
  if (step5) {
    step5.classList.remove('upcoming');
    step5.classList.add('current');
  }
};

window.requestPilotRevision = function() {
  const p = PROTOTYPE_PROJECTS[currentPrototypeId] || PROTOTYPE_PROJECTS['solar-phc'];
  const note = prompt('Enter technical revision or telemetry request for ' + p.university + ':', 'Please optimize nocturnal battery discharge curve for 22:00–04:00 ICU load.');
  if (note) {
    Toast.success('Revision Dispatched', 'Revision notice sent to ' + p.university + ' and State Health Dept.');
  }
};

window.requestMoreTelemetry = function() {
  Toast.success('IoT Gateway Pinged', 'Live sensor telemetry refreshed. Current latency: 42ms via Jharkhand SWAN.');
};

window.approvePrototypeReadiness = function() {
  Toast.success('Prototype Readiness Approved', 'TRL-5 Bench sign-off certified by Corporate Technical Sponsor.');
};

window.requestPrototypeRevision = function() {
  const reason = prompt('Specify prototype hardware revision requirement:', 'Provide supplementary surge protector on Li-ion input rail.');
  if (reason) {
    Toast.success('Revision Note Logged', 'Forwarded to Academic R&D team.');
  }
};


window.PROTOTYPE_PROJECTS = {};



// ============================================================================
// JANSETU COMPREHENSIVE INTERACTIVE HANDLERS & REAL-TIME ENGINE
// ============================================================================

// 1. Toast Notification System
window.toastSuccess = function(msg, title) {
  let toastContainer = document.getElementById('jansetuToastContainer');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'jansetuToastContainer';
    toastContainer.style.cssText = 'position: fixed; bottom: 24px; right: 24px; z-index: 99999; display: flex; flex-direction: column; gap: 10px; pointer-events: none;';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = 'jansetu-toast-item';
  toast.style.cssText = 'pointer-events: auto; background: #002D62; color: #ffffff; padding: 14px 20px; border-radius: 12px; border-left: 4px solid #FF9933; box-shadow: 0 10px 25px rgba(0,45,98,0.3); display: flex; align-items: center; gap: 12px; font-family: inherit; font-size: 13px; font-weight: 600; transform: translateY(20px); opacity: 0; transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);';
  
  toast.innerHTML = `
    <div style="width: 26px; height: 26px; border-radius: 50%; background: #22c55e; color: #ffffff; display: flex; align-items: center; justify-content: center; font-weight: 850; font-size: 14px; flex-shrink: 0;">✓</div>
    <div>
      ${title ? `<div style="font-size: 11px; text-transform: uppercase; color: #93c5fd; font-weight: 800; letter-spacing: 0.5px;">${title}</div>` : ''}
      <div style="color: #ffffff;">${msg}</div>
    </div>
  `;

  toastContainer.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.transform = 'translateY(0)';
    toast.style.opacity = '1';
  });

  setTimeout(() => {
    toast.style.transform = 'translateY(10px)';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 250);
  }, 4000);
};

// 2. Modal Open & Close Handlers
window.openModal = function(id) {
  const m = document.getElementById(id);
  if (m) {
    m.classList.add('open', 'active');
    m.style.display = 'flex';
  }
};

window.closeModal = function(id) {
  if (id) {
    const m = document.getElementById(id);
    if (m) {
      m.classList.remove('open', 'active');
      m.style.display = 'none';
    }
  } else {
    document.querySelectorAll('.modal-overlay').forEach(m => {
      m.classList.remove('open', 'active');
      m.style.display = 'none';
    });
  }
};

// 3. User & Session
window.logout = function() {
  if (confirm('Are you sure you want to log out from the Industry & CSR Command Portal?')) {
    localStorage.removeItem('industry_auth_token');
    window.location.href = '/login';
  }
};

window.toggleSidebar = function() {
  const sb = document.getElementById('sidebar');
  if (sb) {
    sb.classList.toggle('collapsed');
    document.body.classList.toggle('sidebar-collapsed');
  }
};

window.closeMobileSidebar = function() {
  const sb = document.getElementById('sidebar');
  if (sb) sb.classList.add('collapsed');
};

// 4. Detailed Workspace Switching & Collaboration Handlers
const WORKSPACE_PROJECTS_DATA = {
  'solar-phc': {
    title: 'Rural Healthcare Infrastructure Development',
    stakeholders: 'State Health Dept (Admin) • IIT (ISM) Dhanbad • Tata Steel Foundation',
    progress: '78% Completed',
    grant: '₹ 12,00,000',
    phase: 'Implementation & Ground Commissioning (Phase 4 of 5)',
    targetProblem: 'solar-phc'
  },
  'water-iot': {
    title: 'Smart Water Quality & Reservoir Telemetry Network',
    stakeholders: 'State Drinking Water & Sanitation Dept • BIT Mesra • Tata Steel Foundation',
    progress: '60% Completed',
    grant: '₹ 6,00,000',
    phase: 'Prototype Bench Verification & LoRa Field Deployment (Phase 3 of 5)',
    targetProblem: 'water-iot'
  },
  'digital-edge': {
    title: 'Tribal Secondary Schools Digital Edge Infrastructure',
    stakeholders: 'Dept of School Education & Literacy • Vinoba Bhave University • Tata Steel Foundation',
    progress: '45% Completed',
    grant: '₹ 8,00,000',
    phase: 'Hardware Procurement & Offline Server Setup (Phase 2 of 5)',
    targetProblem: 'digital-edge'
  },
  'biogas-chas': {
    title: 'Urban Market Vegetable Waste Biogas & Organic Fertilizer System',
    stakeholders: 'Urban Development & Housing Dept (Admin) • NIT Jamshedpur • Tata Steel Foundation',
    progress: '30% Completed',
    grant: '₹ 14,00,000',
    phase: 'Digester Compression Engineering & Pre-Pilot Bench Audit (Phase 1 of 5)',
    targetProblem: 'biogas-chas'
  }
};

window.openProjectWorkspace = function(id) {
  if (typeof window.showSection === 'function') {
    window.showSection('collaborations');
  }
  const wsEl = document.getElementById('sharedCollabWorkspace');
  if (wsEl) wsEl.style.display = 'block';

  const data = WORKSPACE_PROJECTS_DATA[id] || WORKSPACE_PROJECTS_DATA['biogas-chas'];

  // Switch tab to Pilot Testing by default
  setTimeout(() => {
    if (typeof window.switchCollabTab === 'function') {
      window.switchCollabTab('pilot');
    }
    if (typeof window.selectPrototypeProblem === 'function') {
      window.selectPrototypeProblem(data.targetProblem || id);
    }
  }, 30);
};

// 5. Lightbox for evidence images
window.openImageLightbox = function(src, title, sub) {
  const imgEl = document.getElementById('lightboxImageSrc');
  const titleEl = document.getElementById('lightboxImageTitle');
  const subEl = document.getElementById('lightboxImageSub');
  if (imgEl) imgEl.src = src;
  if (titleEl && title) titleEl.innerText = title;
  if (subEl && sub) subEl.innerText = sub;
  window.openModal('modalImageLightbox');
};

// 6. Proposal Modal Triggers
window.openSubmitProposalModal = function() {
  window.openModal('modalSubmitProposal');
};

window.openFullProposalModal = function() {
  window.openModal('modalFullProposal');
};

// 7. Collaboration Requests (Accept / Decline / Clarify)
window.acceptPartnership = function(id) {
  window.openModal('modalAcceptCollab');
};

window.confirmAcceptPartnership = function() {
  window.closeModal('modalAcceptCollab');
  window.toastSuccess('Partnership Agreement Formally Accepted & Disbursed to State Escrow!', 'Collaboration Verified');
  const kpiEl = document.getElementById('kpiActiveProjects');
  if (kpiEl) {
    const curr = parseInt(kpiEl.innerText) || 4;
    kpiEl.innerText = curr + 1;
  }
};

window.openClarificationModal = function(id) {
  window.openModal('modalClarification');
};

window.sendClarification = function() {
  const notes = document.getElementById('clarificationNotes')?.value || '';
  window.closeModal('modalClarification');
  window.toastSuccess('Technical Query Successfully Transmitted to University Faculty PI', 'Inquiry Dispatched');
};

window.openDeclineModal = function(id) {
  window.openModal('modalDeclineCollab');
};

window.confirmDecline = function() {
  window.closeModal('modalDeclineCollab');
  window.toastSuccess('Request Formally Archived and Feedback Transmitted to State Admin', 'Record Updated');
};

// 8. Actions Required in Pilot Testing
window.approveProcurementRequisition = function(pId) {
  window.toastSuccess('Requisition #REQ-JH-883 for Scrubber Filter & H2S Removal Kit Approved & Escrow Released!', 'Procurement Verified');
};

window.requestRevisionOnPilot = function() {
  window.openModal('modalRevisionRequest');
};

window.confirmRevisionRequest = function() {
  const notes = document.getElementById('revisionNotes')?.value || '';
  window.closeModal('modalRevisionRequest');
  window.toastSuccess('Technical Revision Instructions Dispatched to University Faculty Team', 'Revision Transmitted');
};

window.approvePilotStage = function() {
  window.openModal('modalPilotApproval');
};

window.confirmPilotApproval = function() {
  window.closeModal('modalPilotApproval');
  const heroStatus = document.getElementById('protoHeroStatus');
  if (heroStatus) {
    heroStatus.innerText = 'Pilot Verified & Approved ✓';
    heroStatus.style.background = '#dcfce7';
    heroStatus.style.color = '#15803d';
  }
  window.toastSuccess('Stage 4 Pilot Evaluation Formally Signed Off & Certified by Tata Steel CSR Authority', 'Milestone Completed');
};

// 9. Modals for Commitments, CSR, Receipts, Profile
window.openAddCommitmentModal = function() {
  window.openModal('modalPreferenceAlert');
};

window.openDisbursementReceiptModal = function() {
  window.openModal('modalDisbursementReceipt');
};

window.openCsrCertificateModal = function() {
  window.openModal('modalCsrCertificate');
};

window.openReviewRequestsModal = function() {
  window.openModal('modalReviewRequests');
};

window.openDueMilestonesModal = function() {
  window.openModal('modalDueMilestones');
};

window.saveIndustryProfile = function() {
  window.openModal('modalProfileSaved');
  window.toastSuccess('Corporate CSR Profile, CIN, and Escrow Allocations Successfully Saved', 'Profile Updated');
};

window.triggerAiReindex = function() {
  window.toastSuccess('Live State Innovation Catalog & Priority Fit Scores Synchronized', 'Registry Updated');
};

// 10. Partner Modal (Pledge Form & Live Chat Tabs)
window.switchPartnerModalTab = function(tabName) {
  const pledgeTab = document.getElementById('partnerTabPledge');
  const chatTab = document.getElementById('partnerTabChat');
  const btnPledge = document.getElementById('tabBtnPledge');
  const btnChat = document.getElementById('tabBtnChat');

  if (tabName === 'pledge') {
    if (pledgeTab) pledgeTab.style.display = 'block';
    if (chatTab) chatTab.style.display = 'none';
    if (btnPledge) {
      btnPledge.style.borderBottom = '3px solid #002D62';
      btnPledge.style.color = '#002D62';
    }
    if (btnChat) {
      btnChat.style.borderBottom = '3px solid transparent';
      btnChat.style.color = '#64748b';
    }
  } else {
    if (pledgeTab) pledgeTab.style.display = 'none';
    if (chatTab) chatTab.style.display = 'block';
    if (btnChat) {
      btnChat.style.borderBottom = '3px solid #002D62';
      btnChat.style.color = '#002D62';
    }
    if (btnPledge) {
      btnPledge.style.borderBottom = '3px solid transparent';
      btnPledge.style.color = '#64748b';
    }
  }
};

window.setModalFundingAmount = function(amt) {
  const input = document.getElementById('pledgeFundingAmount');
  if (input) {
    input.value = amt;
    window.toastSuccess('Allocated ₹' + amt + ' Lakhs to Project Pledge');
  }
};

window.sendQuickChatMessage = function(txt) {
  const inp = document.getElementById('partnerChatMessageInput') || document.getElementById('chatTextInput');
  if (inp) {
    inp.value = txt;
    if (typeof window.sendPartnerChatMessage === 'function') {
      window.sendPartnerChatMessage();
    }
  }
};

window.sendPartnerChatMessage = function() {
  const inp = document.getElementById('partnerChatMessageInput');
  const stream = document.getElementById('partnerChatMessagesStream');
  if (!inp || !inp.value.trim()) return;

  const userMsg = inp.value.trim();
  inp.value = '';

  if (stream) {
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble partner';
    bubble.style.cssText = 'align-self: flex-end; max-width: 82%; background: #002D62; color: #ffffff; border-radius: 14px 14px 2px 14px; padding: 12px 16px; box-shadow: 0 2px 6px rgba(0,45,98,0.2); margin-bottom: 8px;';
    bubble.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 4px;">
        <span style="font-size: 11px; font-weight: 850; color: #93c5fd;">🏢 You (Tata Steel CSR Lead)</span>
        <span style="font-size: 10px; color: #cbd5e1;">Just now</span>
      </div>
      <p style="font-size: 13px; margin: 0; line-height: 1.5; color: #ffffff;">${userMsg}</p>
    `;
    stream.appendChild(bubble);
    stream.scrollTop = stream.scrollHeight;

    // Automated simulated response from State Admin
    setTimeout(() => {
      const reply = document.createElement('div');
      reply.className = 'chat-bubble admin';
      reply.style.cssText = 'align-self: flex-start; max-width: 82%; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px 14px 14px 2px; padding: 12px 16px; box-shadow: 0 2px 6px rgba(0,0,0,0.03); margin-bottom: 8px;';
      reply.innerHTML = `
        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
          <span style="font-size: 11px; font-weight: 850; color: #002D62;">🏛️ State Admin Liaison</span>
          <span style="font-size: 10px; color: #94a3b8;">Just now</span>
        </div>
        <p style="font-size: 13px; color: #1e293b; margin: 0; line-height: 1.5;">Thank you Shoeb ji. Your input has been logged in the Tri-Party session register. Faculty PI is notified to align milestone delivery with this commitment.</p>
      `;
      stream.appendChild(reply);
      stream.scrollTop = stream.scrollHeight;
    }, 1200);
  }
};

window.submitPartnerInterest = function() {
  window.closeModal('partnerModal');
  window.toastSuccess('Tri-Party CSR Expression of Interest Formally Transmitted to State Admin & University PI!', 'Pledge Registered');
};

console.log('JanSetu Comprehensive Handlers & Real-Time Engine Loaded Successfully.');
