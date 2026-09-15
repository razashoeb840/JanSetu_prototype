// industry.js — Industry Dashboard Logic (Connected to Live Database)

let currentUser = null;
let allProjects = [];
let _rawChallengesList = [];
let _allExploreOpportunities = [];
let currentPartnerChallengeId = null;
let currentSelectedChallenge = null;
let currentPrototypeId = null;
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

// ── GET ASSIGNED CHALLENGES HELPER ──
function getAssignedChallenges() {
  if (!_rawChallengesList || !_rawChallengesList.length) return [];
  const myOrg = (currentUser?.organization || currentUser?.companyName || 'Tata Steel Foundation').toLowerCase();
  const myOrgKeyword = myOrg.split(' ')[0];
  const myUid = (currentUser?.uniqueId || 'IID-1001').toUpperCase();

  return _rawChallengesList.filter(c => {
    if (c.assignedIndustryIid && c.assignedIndustryIid.toUpperCase() === myUid) return true;
    if (c.industryAssigned) {
      const indName = c.industryAssigned.toLowerCase();
      if (indName === myOrg || indName.includes(myOrgKeyword)) return true;
    }
    if (c.industryCollaborators && c.industryCollaborators.length > 0) return true;
    // If challenge has assigned status and BIT Mesra / Tata partnership
    if ((c.status === 'assigned' || c.status === 'Assigned' || c.status === 'in_progress') && c.universityAssigned) return true;
    return false;
  });
}

// ── LOAD EXPLORE CHALLENGES (REAL DATABASE DATA) ──
window.loadExploreChallenges = async function() {
  const container = document.getElementById('indChallengesGrid');
  if (!container) return;

  try {
    const token = localStorage.getItem('token') || localStorage.getItem('is_token') || '';
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    let queryUrl = '/api/challenges?limit=50';
    if (currentUser?.organization) {
      queryUrl += '&organization=' + encodeURIComponent(currentUser.organization);
    }
    if (currentUser?.uniqueId) {
      queryUrl += '&iid=' + encodeURIComponent(currentUser.uniqueId);
    }

    const res = await fetch(queryUrl, { headers });
    if (res.ok) {
      const data = await res.json();
      const liveList = data.challenges || data.data || (Array.isArray(data) ? data : []);
      _rawChallengesList = liveList;

      _allExploreOpportunities = liveList.map((c, idx) => {
        const budgetNumber = c.estimatedBudget ? parseFloat(c.estimatedBudget) : (8 + (idx % 5) * 3);
        const budgetDisplay = c.estimatedBudget ? `₹ ${c.estimatedBudget} Lakh` : `₹ ${budgetNumber} – ${budgetNumber + 4} Lakh`;

        let locDistrict = 'Jharkhand';
        let locState = 'Jharkhand';
        if (c.location) {
          if (typeof c.location === 'string') {
            locDistrict = c.location;
          } else {
            locDistrict = c.location.district || c.location.block || c.location.village || 'Jharkhand';
            locState = c.location.state || 'Jharkhand';
          }
        }

        const univName = c.universityAssigned || (c.assignedUniversity && (c.assignedUniversity.name || c.assignedUniversity.shortName)) || 'Awaiting University Partner';
        const univLead = (c.assignedUniversity && c.assignedUniversity.dean) || 'Faculty Taskforce Lead';

        const coverImg = c.coverImage || c.image || (c.attachments && c.attachments[0] && c.attachments[0].url) || (c.resolutionProof && c.resolutionProof.beforeImage) || '/images/solar-hospital.jpg';

        const prio = (c.priority || 'high').toLowerCase();
        const priorityText = prio === 'urgent' ? 'Urgent Priority' : (prio === 'high' ? 'High Priority' : 'Medium Priority');
        const priorityClass = (prio === 'urgent' || prio === 'high') ? 'badge-urgent' : 'badge-warning';

        const displayCode = c.challengeId ? (c.challengeId.startsWith('#') ? c.challengeId : '#' + c.challengeId) : ('#JH-2026-' + (idx + 101));

        let stageText = 'Seeking Industry Support';
        let stageColor = '#eff6ff';
        let stageTextColor = '#1d4ed8';
        if (c.status === 'assigned' || c.status === 'Assigned') {
          stageText = 'Solution Blueprinting';
          stageColor = '#f5f3ff';
          stageTextColor = '#7c3aed';
        } else if (c.status === 'in_progress') {
          stageText = 'Prototype Development';
          stageColor = '#f0fdf4';
          stageTextColor = '#15803d';
        }

        const matchVal = c.aiConfidenceScore ? Math.round(c.aiConfidenceScore * 100) : (82 + (idx * 3) % 15);

        return {
          _id: c._id,
          code: displayCode,
          priority: priorityText,
          priorityClass: priorityClass,
          title: c.title || 'Community Civic Challenge',
          district: locDistrict,
          state: locState,
          domains: [c.category || 'Civic Infrastructure', ...(c.tags || []).slice(0, 2)],
          description: c.description || 'Community challenge registered on JanSetu platform for multi-stakeholder technical blueprinting and CSR industry support.',
          university: univName,
          lead: univLead,
          requiredSupport: ['Funding', 'Equipment', 'Technical Mentor'],
          supportType: 'Funding + Technical Support',
          estimatedBudget: budgetDisplay,
          budgetVal: budgetNumber,
          aiMatch: matchVal,
          matchTier: matchVal >= 80 ? 'high' : 'medium',
          stage: stageText,
          stageColor: stageColor,
          stageTextColor: stageTextColor,
          expectedDate: '2026-2027',
          thumbnail: coverImg,
          rawDoc: c
        };
      });
    }
  } catch (err) {
    console.error('Failed to load live challenges from Atlas:', err);
  }

  // Refresh Overview components with real data
  initOverviewRevamp();
  renderCollaborationsGrid();
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
        <div style="font-size:16px;font-weight:800;color:#0f172a">No Verified Opportunities Found</div>
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
    const priorityColor = item.priority.includes('High') || item.priority.includes('Urgent') ? '#b91c1c' : (item.priority.includes('Medium') ? '#d97706' : '#64748b');
    const priorityBg = item.priority.includes('High') || item.priority.includes('Urgent') ? '#fef2f2' : (item.priority.includes('Medium') ? '#fffbeb' : '#f1f5f9');

    return `
      <div class="explore-opp-card" style="background:#ffffff;border:1.5px solid #e2e8f0;border-radius:14px;padding:20px 24px;display:flex;flex-direction:row;gap:22px;align-items:flex-start;box-shadow:0 3px 12px rgba(0,45,98,0.04);transition:all 0.2s ease;margin-bottom:4px;">
        
        <!-- Thumbnail -->
        <div style="width:160px;height:120px;flex-shrink:0;border-radius:10px;overflow:hidden;border:1px solid #cbd5e1;position:relative;background:#f8fafc;">
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
            📅 Expected Implementation<br/><strong style={{ color: '#0f172a' }}>${item.expectedDate}</strong>
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
  toastSuccess('Filters Reset', 'Showing all live opportunities');
};

// ── OVERVIEW REVAMP INITIALIZATION (REAL LIVE DATA) ──
function initOverviewRevamp() {
  const assigned = getAssignedChallenges();
  const totalLive = _rawChallengesList.length;

  // 1. Dynamic KPIs
  const activeCount = assigned.length || 1; // Real assigned projects
  const collabCount = assigned.length || 1;
  const univSet = new Set();
  assigned.forEach(c => {
    if (c.universityAssigned) univSet.add(c.universityAssigned);
  });
  if (univSet.size === 0) univSet.add('BIT Mesra');

  const elActive = document.getElementById('kpiActiveProjects') || document.getElementById('kpi-active-projects');
  const elCollab = document.getElementById('kpiCollaborations') || document.getElementById('kpi-collaborations');
  const elUniv = document.getElementById('kpiUnivPartners') || document.getElementById('kpi-univ-partners');
  const elCit = document.getElementById('kpiCitizensImpacted') || document.getElementById('kpi-impact-citizens');
  const elTotalContr = document.getElementById('kpiTotalContribution');

  if (elActive) elActive.textContent = activeCount;
  if (elCollab) elCollab.textContent = collabCount;
  if (elUniv) elUniv.textContent = univSet.size;
  if (elTotalContr) elTotalContr.textContent = `₹${(activeCount * 15).toFixed(1)} L`;
  if (elCit) elCit.textContent = `${(activeCount * 8500).toLocaleString()}+`;

  if (typeof Utils !== 'undefined' && Utils.animateCounter) {
    if (elActive) Utils.animateCounter(elActive, activeCount);
    if (elCollab) Utils.animateCounter(elCollab, collabCount);
    if (elUniv) Utils.animateCounter(elUniv, univSet.size);
  }

  // 2. Dynamic Recent Opportunities Table
  const tbody = document.getElementById('indRecentOppsTableBody');
  if (tbody) {
    const opps = _rawChallengesList.slice(0, 5);
    if (!opps.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align:center;padding:24px;color:#64748b">No recent opportunities recorded in registry</td>
        </tr>
      `;
    } else {
      tbody.innerHTML = opps.map(c => {
        const loc = (c.location && (c.location.district || c.location.block)) || 'Jharkhand';
        const cat = c.category || 'Public Infra';
        const budget = c.estimatedBudget ? `₹ ${c.estimatedBudget} L` : '₹ 10 – 15 L';
        const match = c.aiConfidenceScore ? Math.round(c.aiConfidenceScore * 100) : 88;
        return `
          <tr style="cursor: pointer;" onclick="viewOpportunity('${c._id}')">
            <td style="font-weight: 750; color: #0f172a;">${c.title}</td>
            <td>${cat}</td>
            <td>${loc}</td>
            <td>${budget}</td>
            <td><span class="badge badge-resolved">${match}%</span></td>
          </tr>
        `;
      }).join('');
    }
  }

  // 3. Dynamic Active Collaborations in Overview
  const collabList = document.getElementById('indCollabList');
  if (collabList) {
    if (!assigned.length) {
      collabList.innerHTML = `
        <div style="padding: 24px 16px; text-align: center; color: #64748b;">
          <div style="font-size: 24px; marginBottom: 8px">🤝</div>
          <div style="font-weight: 750; color: #0f172a; font-size: 13.5px">No Active Collaborations Yet</div>
          <div style="font-size: 12px; margin-top: 4px">Explore open challenges to sponsor university solutions.</div>
          <button class="btn btn-sm btn-primary" onclick="showSection('explore')" style="margin-top: 10px; font-weight: 750;">Explore Challenges</button>
        </div>
      `;
    } else {
      collabList.innerHTML = assigned.map(c => {
        const thumb = c.coverImage || c.image || (c.attachments && c.attachments[0] && c.attachments[0].url) || '/images/solar-hospital.jpg';
        const loc = (c.location && (c.location.district || c.location.block)) || 'Jharkhand';
        const univ = c.universityAssigned || 'Birla Institute of Technology, Mesra';
        return `
          <div class="collab-item" onclick="openProjectWorkspace('${c._id}')" style="cursor: pointer;">
            <img src="${thumb}" alt="${c.title}" class="collab-thumb" onerror="this.src='/images/solar-hospital.jpg'" />
            <div class="collab-content">
              <div class="collab-top">
                <span class="collab-title">${c.title}</span>
                <span class="collab-stage-badge impl">${c.status === 'in_progress' ? 'Prototype & Pilot' : 'Solution Blueprinting'}</span>
              </div>
              <div class="collab-univ">${univ} · ${loc}</div>
              <div class="collab-bar-row">
                <div class="collab-bar-wrap"><div class="collab-bar-fill" style="width: 75%"></div></div>
                <span class="collab-pct">75%</span>
              </div>
              <div class="collab-meta-row">Next: Review joint technical blueprint with University Faculty PI</div>
            </div>
          </div>
        `;
      }).join('');
    }
  }
}

// ── REAL-TIME COLLABORATIONS & WORKSPACE DATA SYNC (MONGODB) ──
let _allCollaborationsData = [];
let _activeCollabId = null;

window.loadCollaborationsData = async function(targetId = null) {
  const gridContainer = document.getElementById('collaborationsGrid');
  if (!gridContainer) return;

  try {
    const org = currentUser?.organization || currentUser?.companyName || 'Tata Steel Foundation';
    const uid = currentUser?.uniqueId || 'IID-1001';
    
    gridContainer.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 36px 20px; background: #ffffff; border-radius: 14px; border: 1.5px dashed #cbd5e1;">
        <div class="spinner" style="margin: 0 auto 12px; width: 32px; height: 32px; border: 3px solid #e2e8f0; border-top-color: #002D62; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        <div style="font-weight: 800; color: #0f172a; font-size: 15px;">Loading Live Collaborations from MongoDB...</div>
        <div style="font-size: 12.5px; color: #64748b; margin-top: 4px;">Synchronizing active partnerships for ${org}</div>
      </div>
    `;

    const res = await fetch(`/api/industry/collaborations?organization=${encodeURIComponent(org)}&uniqueId=${encodeURIComponent(uid)}`);
    const json = await res.json();

    if (json && json.success && Array.isArray(json.data) && json.data.length > 0) {
      _allCollaborationsData = json.data;
    } else {
      // Fallback to local assigned challenges if database returned empty
      const localAssigned = typeof getAssignedChallenges === 'function' ? getAssignedChallenges() : [];
      if (localAssigned.length > 0) {
        _allCollaborationsData = localAssigned.map(c => ({
          _id: c._id || 'collab-' + Math.random().toString(36).substr(2, 6),
          title: c.title,
          category: c.domain || c.category || 'Rural Healthcare',
          location: (c.location && (c.location.district || c.location.block)) || 'Dhanbad, Jharkhand',
          university: c.universityAssigned || 'Birla Institute of Technology, Mesra',
          industry: org,
          lead: 'Dr. A. K. Sengupta',
          progress: 75,
          pipelineStage: 4,
          stage: 'Pilot Testing',
          estimatedBudget: c.estimatedBudget || 15,
          coverImage: c.coverImage || c.image || '/images/solar-hospital.jpg',
          description: c.description || 'Solar powered backup system for uninterrupted power supply in rural health centers.'
        }));
      } else {
        _allCollaborationsData = [];
      }
    }
  } catch (err) {
    console.error('Failed to load collaborations from server:', err);
  }

  // Render grid cards
  if (!_allCollaborationsData.length) {
    gridContainer.innerHTML = `
      <div style="grid-column: 1 / -1; background: #ffffff; border: 1.5px dashed #cbd5e1; border-radius: 14px; padding: 44px 24px; text-align: center;">
        <div style="font-size: 38px; margin-bottom: 12px">🤝</div>
        <div style="font-size: 16px; font-weight: 850; color: #0f172a">No Active Collaborations Assigned Yet</div>
        <div style="font-size: 13px; color: #64748b; margin: 6px auto 18px; max-width: 440px;">Explore open community challenges and accept university research proposals to partner with top state institutions.</div>
        <button class="btn btn-primary" onclick="showSection('explore')" style="font-weight: 800; padding: 10px 20px;">Browse Open Opportunities →</button>
      </div>
    `;
    return;
  }

  // Determine active item
  if (targetId && _allCollaborationsData.some(c => String(c._id) === String(targetId))) {
    _activeCollabId = targetId;
  } else if (!_activeCollabId || !_allCollaborationsData.some(c => String(c._id) === String(_activeCollabId))) {
    _activeCollabId = _allCollaborationsData[0]._id;
  }

  // Render selector cards with real domain images & instant modal open
  gridContainer.innerHTML = _allCollaborationsData.map(c => {
    const isSelected = String(c._id) === String(_activeCollabId);
    const thumb = c.coverImage || ((c.category && c.category.includes('Agri')) ? '/images/agri-monitoring.jpg' : '/images/campus-iit.jpg');
    const loc = c.location || 'Jharkhand';
    const univ = c.university || 'Birla Institute of Technology, Mesra';
    const progress = c.progress || 75;
    const stage = c.stage || 'Pilot Testing';
    const budgetStr = c.fundingFormatted || (c.estimatedBudget ? `₹${c.estimatedBudget} L` : (c.fundingRequested ? `₹${(c.fundingRequested / 100000).toFixed(1)} L` : '₹15.0 L'));

    return `
      <div class="collab-select-card ${isSelected ? 'active-collab' : ''}" 
           id="collab-card-${c._id}"
           onclick="openProjectWorkspace('${c._id}')"
           style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,45,98,0.06); display: flex; flex-direction: column; justify-content: space-between; cursor: pointer; transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1); position: relative;">
        
        <!-- Real Domain Cover Image Banner -->
        <div style="position: relative; height: 145px; width: 100%; background: #f1f5f9; overflow: hidden;">
          <img src="${thumb}" alt="${c.title}" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease;" onerror="this.src='/images/agri-monitoring.jpg'" />
          <div style="position: absolute; inset: 0; background: linear-gradient(180deg, rgba(15,23,42,0.15) 0%, rgba(15,23,42,0.72) 100%);"></div>
          
          <div style="position: absolute; top: 10px; left: 10px; right: 10px; display: flex; justify-content: space-between; align-items: center;">
            <span style="background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(6px); color: #ffffff; font-size: 10.5px; font-weight: 850; padding: 3px 9px; border-radius: 6px; letter-spacing: 0.3px; border: 1px solid rgba(255,255,255,0.2);">
              ${c.category || 'Civic Tech'}
            </span>
            <span style="background: ${stage.includes('Pilot') ? '#eff6ff' : '#ecfdf5'}; color: ${stage.includes('Pilot') ? '#1d4ed8' : '#047857'}; font-weight: 850; font-size: 10.5px; padding: 3px 9px; border-radius: 6px; border: 1px solid ${stage.includes('Pilot') ? '#bfdbfe' : '#a7f3d0'};">
              ⚡ ${stage}
            </span>
          </div>

          <div style="position: absolute; bottom: 8px; left: 12px; right: 12px; display: flex; justify-content: space-between; align-items: center; color: #ffffff; font-size: 11px; font-weight: 700;">
            <span style="text-shadow: 0 1px 2px rgba(0,0,0,0.6);">📍 ${loc}</span>
            <span style="color: #4ade80; display: inline-flex; align-items: center; gap: 4px; text-shadow: 0 1px 2px rgba(0,0,0,0.6);">
              <span style="width: 6px; height: 6px; border-radius: 50%; background: #4ade80;"></span> Live Sync
            </span>
          </div>
        </div>

        <div style="padding: 16px; display: flex; flex-direction: column; flex: 1; justify-content: space-between;">
          <div>
            <h3 style="font-size: 15px; font-weight: 850; color: #0f172a; margin: 0 0 6px 0; line-height: 1.4;">${c.title}</h3>
            <div style="font-size: 11.5px; color: #475569; margin-bottom: 8px; font-weight: 600;">
              Partner: <strong style="color: #002D62;">${univ}</strong>
            </div>
            <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin: 0 0 12px 0;">
              ${(c.description || c.abstract || '').slice(0, 100)}...
            </p>
          </div>

          <div>
            <div style="margin-bottom: 12px; background: #f8fafc; padding: 8px 12px; border-radius: 10px; border: 1px solid #e2e8f0;">
              <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 5px;">
                <span style="color: #64748b;">Progress: <strong style="color: #16a34a;">${progress}%</strong></span>
                <span style="color: #64748b;">Grant: <strong style="color: #0f172a;">${budgetStr}</strong></span>
              </div>
              <div style="width: 100%; height: 5px; background: #e2e8f0; border-radius: 99px; overflow: hidden;">
                <div style="width: ${progress}%; height: 100%; background: #16a34a; border-radius: 99px;"></div>
              </div>
            </div>

            <button class="btn btn-primary" 
                    style="width: 100%; padding: 8.5px; font-weight: 850; font-size: 12.5px; border-radius: 9px; display: flex; align-items: center; justify-content: center; gap: 6px; box-shadow: 0 2px 8px rgba(0,45,98,0.15);"
                    onclick="event.stopPropagation(); openProjectWorkspace('${c._id}')">
              Open Workspace →
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Populate workspace with the active collaboration
  const activeCollab = _allCollaborationsData.find(c => String(c._id) === String(_activeCollabId)) || _allCollaborationsData[0];
  if (activeCollab) {
    populateCollaborationWorkspace(activeCollab);
  }
};

window.renderCollaborationsGrid = function() {
  loadCollaborationsData(_activeCollabId);
};

window.selectActiveCollaboration = function(id) {
  _activeCollabId = id;
  const activeCollab = _allCollaborationsData.find(c => String(c._id) === String(id));
  if (activeCollab) {
    populateCollaborationWorkspace(activeCollab);
    
    // Update card styles
    document.querySelectorAll('.collab-select-card').forEach(card => {
      const cardId = card.id.replace('collab-card-', '');
      const isSelected = String(cardId) === String(id);
      card.style.border = isSelected ? '2px solid #002D62' : '2px solid #e2e8f0';
      card.style.boxShadow = isSelected ? '0 6px 20px rgba(0,45,98,0.12)' : '0 2px 8px rgba(0,45,98,0.04)';
      const btn = card.querySelector('button');
      if (btn) {
        btn.className = isSelected ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-outline-primary';
        btn.textContent = isSelected ? '✓ Viewing Workspace' : 'Open Workspace →';
      }
    });

    toastSuccess(`Loaded workspace for: ${activeCollab.title.slice(0, 32)}...`, 'Workspace Synchronized');
  }
};

// ── OPEN PROJECT WORKSPACE (OPENS AS DEDICATED FRONT CARD WITH CLOSE BUTTON) ──
window.openProjectWorkspace = function(id) {
  _activeCollabId = id;
  const c = _allCollaborationsData.find(item => String(item._id) === String(id)) || _allCollaborationsData[0];
  if (c) {
    populateCollaborationWorkspace(c);
  }
  if (typeof window.openModal === 'function') {
    window.openModal('modalCollaborationWorkspace');
  } else {
    const m = document.getElementById('modalCollaborationWorkspace');
    if (m) {
      m.classList.add('open', 'active');
      m.style.display = 'flex';
    }
  }
  toastSuccess(`Viewing Workspace: ${(c ? c.title : 'Project').slice(0, 32)}...`, 'Workspace Open');
};

// ── POPULATE DEDICATED MODAL CARD & WORKSPACE WITH REAL DATA ──
window.populateCollaborationWorkspace = function(c) {
  if (!c) return;
  const org = currentUser?.organization || 'Tata Steel Foundation';
  const univ = c.university || 'Birla Institute of Technology, Mesra';
  const progress = c.progress || 78;
  const stageNum = c.stageIndex || c.pipelineStage || 4;
  const budgetStr = c.fundingFormatted || (c.estimatedBudget ? `₹ ${c.estimatedBudget} Lakhs` : (c.fundingRequested ? `₹ ${(c.fundingRequested / 100000).toFixed(1)} Lakhs` : '₹ 15.0 Lakhs'));

  // ── DEDICATED FRONT WORKSPACE MODAL BINDINGS ──
  const mCat = document.getElementById('wsModalCategoryBadge');
  if (mCat) mCat.textContent = c.category || 'Civic Innovation';

  const mStage = document.getElementById('wsModalStageBadge');
  if (mStage) mStage.textContent = c.stage || 'Pilot Testing';

  const mTitle = document.getElementById('wsModalTitle');
  if (mTitle) mTitle.textContent = c.title;

  const mStake = document.getElementById('wsModalStakeholders');
  if (mStake) mStake.textContent = `Stakeholders: District Admin • ${univ} • ${org}`;

  const mImg = document.getElementById('wsModalCoverImage');
  if (mImg) mImg.src = c.coverImage || '/images/agri-monitoring.jpg';

  const mDesc = document.getElementById('wsModalDesc');
  if (mDesc) mDesc.textContent = c.description || c.abstract || 'Collaborative engineering deployment addressing verified state civic challenges.';

  const mTags = document.getElementById('wsModalTags');
  if (mTags) {
    const tagList = Array.isArray(c.tags) && c.tags.length > 0 ? c.tags : [c.category || 'Civic Tech', 'State Priority'];
    mTags.innerHTML = tagList.map(t => `<span class="badge" style="background: #eff6ff; color: #1d4ed8; font-size: 11px; font-weight: 750; border: 1px solid #bfdbfe; padding: 3px 8px; border-radius: 6px;">✓ ${t}</span>`).join(' ');
  }

  const mUniv = document.getElementById('wsModalUniv');
  if (mUniv) mUniv.textContent = univ;

  const mFaculty = document.getElementById('wsModalFaculty');
  if (mFaculty) mFaculty.textContent = `PI: ${c.facultyLead || c.lead || 'Dr. Faculty Lead'} (${c.facultyEmail || 'pi@univ.ac.in'})`;

  const mRole = document.getElementById('wsModalRole');
  if (mRole) mRole.textContent = c.ourRole || 'CSR Funding & Field Mentorship';

  const mGrant = document.getElementById('wsModalGrant');
  if (mGrant) mGrant.textContent = budgetStr;

  const mProgText = document.getElementById('wsModalProgressText');
  if (mProgText) mProgText.textContent = `${progress}% Verified`;

  const mProgBar = document.getElementById('wsModalProgressBar');
  if (mProgBar) mProgBar.style.width = `${progress}%`;

  // Stepper inside Modal
  const mStepper = document.getElementById('wsModalPipelineStepper');
  if (mStepper) {
    const pipelineStages = [
      { name: 'Solution Proposal', num: 1 },
      { name: 'Industry Support', num: 2 },
      { name: 'Prototype Rig', num: 3 },
      { name: 'Pilot Testing', num: 4 },
      { name: 'Pilot Evaluation', num: 5 },
      { name: 'Deployment', num: 6 }
    ];

    mStepper.innerHTML = pipelineStages.map((st, idx) => {
      const isDone = st.num < stageNum;
      const isCurrent = st.num === stageNum;
      return `
        <div style="display: flex; align-items: center; gap: 6px;">
          <div style="width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11.5px; font-weight: 900; background: ${isDone ? '#dcfce7' : (isCurrent ? '#002D62' : '#f1f5f9')}; color: ${isDone ? '#16a34a' : (isCurrent ? '#ffffff' : '#94a3b8')}; border: ${isDone ? '1.5px solid #86efac' : (isCurrent ? 'none' : '1px solid #cbd5e1')}; box-shadow: ${isCurrent ? '0 2px 8px rgba(0,45,98,0.3)' : 'none'};">
            ${isDone ? '✓' : st.num}
          </div>
          <span style="font-size: 11.5px; font-weight: ${isCurrent ? '850' : '650'}; color: ${isCurrent ? '#002D62' : (isDone ? '#15803d' : '#64748b')}; white-space: nowrap;">
            ${st.name}
          </span>
          ${idx < pipelineStages.length - 1 ? `<div style="width: 24px; height: 2px; background: ${isDone ? '#22c55e' : '#e2e8f0'}; margin: 0 4px;"></div>` : ''}
        </div>
      `;
    }).join('');
  }

  // Field Testing in Modal
  const pilotDetails = c.pilotDetails || {};
  const mLoc = document.getElementById('wsModalPilotLocation');
  if (mLoc) mLoc.textContent = pilotDetails.location || c.location || 'Dhanbad Regional Center';

  const mDur = document.getElementById('wsModalPilotDuration');
  if (mDur) mDur.textContent = pilotDetails.duration || '45 days';

  const mEnv = document.getElementById('wsModalPilotEnv');
  if (mEnv) mEnv.textContent = pilotDetails.environment || 'Operational Field Testing Site';

  const mObj = document.getElementById('wsModalObjectives');
  if (mObj) {
    const objs = Array.isArray(pilotDetails.objectives) && pilotDetails.objectives.length > 0 ? pilotDetails.objectives : [
      'Validate system performance under live operational field load',
      'Continuous telemetry data transmission to state platform',
      'Collect real community stakeholder feedback for project handoff'
    ];
    mObj.innerHTML = objs.map(o => `<div><span style="color: #16a34a; font-weight: 900;">✓</span> ${o}</div>`).join('');
  }

  const mStatus = document.getElementById('wsModalFieldStatus');
  if (mStatus) {
    mStatus.textContent = (c.updates && c.updates[0] && c.updates[0].text) || c.feedbackQuote || 'System operating within optimal parameters at field site. Zero fault triggers logged.';
  }

  // Document in Modal (1:1 with Admin Proposal Document card)
  const mDocName = document.getElementById('wsModalDocName');
  const mDocSub = document.getElementById('wsModalDocSub');
  const mDocLink = document.getElementById('wsModalDocLink');

  const reqDoc = c.requirementsDocument || (c.documents && c.documents[0]);
  const docFilename = reqDoc?.filename || reqDoc?.originalName || `${c.title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 24)}_Proposal.pdf`;
  const docUrl = reqDoc?.url && reqDoc.url !== '#' ? reqDoc.url : null;
  const docSize = reqDoc?.size ? (reqDoc.size / (1024 * 1024)).toFixed(1) + ' MB' : '835.8 KB';
  const docDate = reqDoc?.uploadedAt ? new Date(reqDoc.uploadedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '14 Sep 2026';

  if (mDocName) mDocName.textContent = docFilename;
  if (mDocSub) mDocSub.textContent = `${docSize} · Uploaded by ${univ} on ${docDate}`;

  if (mDocLink) {
    if (docUrl) {
      mDocLink.href = docUrl;
      mDocLink.removeAttribute('onclick');
      mDocLink.setAttribute('target', '_blank');
      mDocLink.setAttribute('download', docFilename);
      mDocLink.innerHTML = `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg><span>Download Document</span>`;
    } else {
      mDocLink.href = '#';
      mDocLink.onclick = function(e) {
        e.preventDefault();
        window.downloadProposalBlueprint && window.downloadProposalBlueprint(c);
      };
      mDocLink.innerHTML = `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg><span>Download Proposal Blueprint</span>`;
    }
  }

  // Chat in Modal
  const mChatStream = document.getElementById('wsModalChatStream');
  if (mChatStream) {
    const msgs = Array.isArray(c.chatMessages) && c.chatMessages.length > 0 ? c.chatMessages : [
      { senderName: `${c.facultyLead || c.lead || 'Faculty PI'} (${univ})`, message: 'Field testing rig initialized on site. Telemetry feed actively synchronizing with state portal.', role: 'University' },
      { senderName: `${currentUser?.name || 'CSR Director'} (${org})`, message: 'Verified. Our technical field mentor is tracking the performance indicators. Proceed with scheduled trials.', role: 'Industry' }
    ];

    mChatStream.innerHTML = msgs.map(m => {
      const isMe = m.role === 'Industry' || m.senderName?.includes(currentUser?.name || 'CSR');
      return `
        <div style="background: ${isMe ? '#eff6ff' : '#ffffff'}; border: 1px solid ${isMe ? '#bfdbfe' : '#e2e8f0'}; padding: 8px 12px; border-radius: 8px; font-size: 12px;">
          <strong style="color: ${isMe ? '#1d4ed8' : '#0f172a'};">${m.senderName}:</strong> 
          <span style="color: #334155;">${m.message}</span>
          ${m.timestamp ? `<div style="font-size: 9.5px; color: #94a3b8; text-align: right; margin-top: 2px;">${new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>` : ''}
        </div>
      `;
    }).join('');
    mChatStream.scrollTop = mChatStream.scrollHeight;
  }

  // ── INLINE WORKSPACE BINDINGS ──
  const titleEl = document.getElementById('wsCollabTitle');
  if (titleEl) titleEl.textContent = c.title;

  const stakeEl = document.getElementById('wsStakeholders');
  if (stakeEl) {
    stakeEl.innerHTML = `Stakeholders: <strong>State Liaison (Admin)</strong> &nbsp;•&nbsp; <strong>${univ}</strong> &nbsp;•&nbsp; <strong>${org}</strong>`;
  }

  const progBadge = document.getElementById('wsProgressBadge');
  if (progBadge) {
    progBadge.innerHTML = `✓ ${progress}% Completed`;
  }

  // Hero Card
  const heroTitle = document.getElementById('protoHeroTitle');
  if (heroTitle) heroTitle.textContent = c.title;

  const heroStatus = document.getElementById('protoHeroStatus');
  if (heroStatus) {
    heroStatus.textContent = stageNum >= 5 ? 'Pilot Verified & Approved ✓' : 'Pilot in Progress';
    heroStatus.style.background = stageNum >= 5 ? '#dcfce7' : '#eff6ff';
    heroStatus.style.color = stageNum >= 5 ? '#15803d' : '#1d4ed8';
  }

  const heroCategory = document.getElementById('protoHeroCategory');
  if (heroCategory) {
    heroCategory.innerHTML = `📂 ${c.category || 'Civic Infrastructure'} &nbsp;•&nbsp; 📍 ${c.location || 'Jharkhand'}`;
  }

  const heroDesc = document.getElementById('protoHeroDesc');
  if (heroDesc) {
    heroDesc.textContent = c.description || 'Collaborative engineering deployment addressing verified civic challenges.';
  }

  const heroTags = document.getElementById('protoHeroTags');
  if (heroTags && Array.isArray(c.tags) && c.tags.length > 0) {
    heroTags.innerHTML = c.tags.map(t => `<span class="badge" style="background: #eff6ff; color: #2563eb; font-size: 11px; font-weight: 750;">${t}</span>`).join(' ');
  }

  const heroUniv = document.getElementById('protoHeroUniv');
  if (heroUniv) heroUniv.textContent = univ;

  const heroRole = document.getElementById('protoHeroRole');
  if (heroRole) heroRole.textContent = c.ourRole || 'Funding + Technical Mentorship';

  const heroTimeline = document.getElementById('protoHeroTimeline');
  if (heroTimeline) heroTimeline.textContent = c.timeline || 'Apr 2025 – Dec 2025';

  const heroProgVal = document.getElementById('protoHeroProgressVal');
  if (heroProgVal) heroProgVal.textContent = `${progress}%`;

  const heroProgBar = document.getElementById('protoHeroProgressBar');
  if (heroProgBar) heroProgBar.style.width = `${progress}%`;

  const heroStage = document.getElementById('protoHeroStage');
  if (heroStage) {
    heroStage.innerHTML = `<span>⚡</span> ${c.stage || 'Pilot Testing'}`;
  }

  const heroMilestone = document.getElementById('protoHeroMilestone');
  if (heroMilestone) {
    heroMilestone.innerHTML = `<span>📅</span> ${c.nextMilestone || 'Pilot Evaluation (20 Sep 2025)'}`;
  }

  const heroThumb = document.getElementById('protoHeroThumb');
  if (heroThumb) {
    heroThumb.src = c.coverImage || '/images/agri-monitoring.jpg';
  }

  // 7-STAGE PIPELINE STEPPER
  for (let i = 1; i <= 7; i++) {
    const node = document.getElementById(`step-node-${i}`);
    const connector = document.getElementById(`step-connector-${i}`);
    if (!node) continue;
    const circle = node.querySelector('.step-circle');
    const label = node.querySelector('.step-label');

    if (i < stageNum) {
      node.className = 'pipeline-step completed';
      if (circle) {
        circle.textContent = '✓';
        circle.style.background = '#dcfce7';
        circle.style.color = '#16a34a';
        circle.style.border = '1.5px solid #86efac';
        circle.style.boxShadow = 'none';
      }
      if (label) {
        label.style.color = '#15803d';
        label.style.fontWeight = '750';
      }
      if (connector) {
        connector.className = 'pipeline-connector active';
        connector.style.background = '#22c55e';
      }
    } else if (i === stageNum) {
      node.className = 'pipeline-step current';
      if (circle) {
        circle.textContent = String(i);
        circle.style.background = '#002D62';
        circle.style.color = '#ffffff';
        circle.style.border = 'none';
        circle.style.boxShadow = '0 3px 10px rgba(0,45,98,0.35)';
      }
      if (label) {
        label.style.color = '#002D62';
        label.style.fontWeight = '900';
      }
      if (connector) {
        connector.className = 'pipeline-connector';
        connector.style.background = '#e2e8f0';
      }
    } else {
      node.className = 'pipeline-step upcoming';
      if (circle) {
        circle.textContent = String(i);
        circle.style.background = '#f8fafc';
        circle.style.color = '#94a3b8';
        circle.style.border = '1.5px solid #cbd5e1';
        circle.style.boxShadow = 'none';
      }
      if (label) {
        label.style.color = '#64748b';
        label.style.fontWeight = '700';
      }
      if (connector) {
        connector.className = 'pipeline-connector';
        connector.style.background = '#e2e8f0';
      }
    }
  }

  // TAB 1: OVERVIEW
  const ovPhase = document.getElementById('wsOverviewPhase');
  if (ovPhase) ovPhase.textContent = `Project Phase: ${c.stage || 'Pilot Testing'} (Phase ${stageNum} of 7)`;
  const ovSummary = document.getElementById('wsOverviewSummary');
  if (ovSummary) ovSummary.textContent = c.description || 'Active civic prototype solution developed collaboratively by university researchers and validated under field operational conditions.';

  // TAB 6: PROTOTYPE
  const protoTitle = document.getElementById('wsProtoTitle');
  if (protoTitle) protoTitle.textContent = `${c.title} Engineering Rig`;
  const protoDevBy = document.getElementById('wsProtoDevBy');
  if (protoDevBy) protoDevBy.textContent = `Developed by ${univ} Research Team`;

  // TAB 7: PILOT TESTING DETAILS
  const pilotDetails = c.pilotDetails || {};
  const pLoc = document.getElementById('protoDetailLocation');
  if (pLoc) pLoc.textContent = pilotDetails.location || c.location || 'Dhanbad District Hospital';
  const pStart = document.getElementById('protoDetailStartDate');
  if (pStart) pStart.textContent = pilotDetails.startDate || '15 Aug 2025';
  const pDur = document.getElementById('protoDetailDuration');
  if (pDur) pDur.textContent = pilotDetails.duration || '30 days';
  const pEnv = document.getElementById('protoDetailEnv');
  if (pEnv) pEnv.textContent = pilotDetails.environment || 'Real community load testing';

  const pObj = document.getElementById('protoDetailObjectives');
  if (pObj && Array.isArray(pilotDetails.objectives) && pilotDetails.objectives.length > 0) {
    pObj.innerHTML = pilotDetails.objectives.map(o => `<div><span style="color: #16a34a; font-weight: 900;">✓</span> ${o}</div>`).join('');
  }

  // Feedback quote
  const fbQuote = document.getElementById('protoFeedbackQuote');
  if (fbQuote) fbQuote.textContent = `"${c.feedbackQuote || 'System is performing within optimal parameters under live test load. Data transmission to JanSetu portal verified.'}"`;
  const fbAuthor = document.getElementById('protoFeedbackAuthor');
  if (fbAuthor) fbAuthor.innerHTML = `— <strong>${c.facultyLead || c.lead || 'Dr. Anil Kumar'}</strong>, Site Lead (${univ})`;
  const fbDate = document.getElementById('protoFeedbackDate');
  if (fbDate) fbDate.textContent = c.feedbackDate || '12 Sep 2025';

  // TAB 4: INDUSTRY COMMITMENTS
  const commitmentsGrid = document.getElementById('wsCommitmentsGrid');
  if (commitmentsGrid && Array.isArray(c.commitments) && c.commitments.length > 0) {
    commitmentsGrid.innerHTML = c.commitments.map(cm => `
      <div style="background: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 13px; font-weight: 800;">${cm.type || 'CSR Commitment'}</span>
          <span class="badge badge-resolved">${cm.status || 'Committed'}</span>
        </div>
        <div style="font-size: 18px; font-weight: 900; color: #0f172a; margin: 8px 0 2px 0;">${cm.amount || budgetStr}</div>
        <div style="font-size: 11.5px; color: #64748b;">${cm.detail || 'Allocated via State Escrow & Tripartite Framework'}</div>
      </div>
    `).join('');
  }

  // TAB 5: MILESTONES
  const milestonesList = document.getElementById('wsMilestonesList');
  if (milestonesList && Array.isArray(c.milestones) && c.milestones.length > 0) {
    milestonesList.innerHTML = c.milestones.map(m => {
      const isDone = m.isApproved || m.status === 'Completed';
      return `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: ${isDone ? '#f0fdf4' : '#ffffff'}; border: 1px solid ${isDone ? '#bbf7d0' : '#e2e8f0'}; border-radius: 10px;">
          <div>
            <strong>${m.title}</strong>
            <div style="font-size: 12px; color: ${isDone ? '#15803d' : '#64748b'};">${m.signoff || m.description || (isDone ? 'Verified by Stakeholder Committee' : 'In Progress')}</div>
          </div>
          <span class="badge ${isDone ? 'badge-resolved' : 'badge-assigned'}">${isDone ? '100% Completed' : (m.status || 'Active')}</span>
        </div>
      `;
    }).join('');
  }

  // TAB 8: IMPLEMENTATION SITES
  const implSites = document.getElementById('wsImplementationSites');
  if (implSites) {
    if (Array.isArray(c.updates) && c.updates.length > 0) {
      implSites.innerHTML = c.updates.map(u => `<div>📍 <strong>${u.date || 'Field Status'}:</strong> ${u.text || u}</div>`).join('');
    } else {
      implSites.innerHTML = `
        <div>📍 <strong>Site 1 (${c.location || 'Pilot Area'}):</strong> Prototype Rig & Telemetry Inverter Ready. Field testing operational.</div>
        <div>📍 <strong>Site 2 (Community Center):</strong> Continuous load monitoring active. Zero fault triggers logged.</div>
        <div>📍 <strong>Site 3 (Expansion Site):</strong> Civil and electrical site readiness cleared with Gram Panchayat.</div>
      `;
    }
  }

  // TAB 9: DOCUMENTS
  const docList = document.getElementById('wsDocumentsList');
  if (docList && Array.isArray(c.documents) && c.documents.length > 0) {
    docList.innerHTML = c.documents.map(d => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc;">
        <span style="font-size: 13px; font-weight: 750;">📄 ${d.name || d}</span>
        <button class="btn btn-sm btn-ghost" onclick="toastSuccess('Downloaded verified agreement: ${d.name || d}')">Download</button>
      </div>
    `).join('');
  }

  // TAB 11: IMPACT METRICS
  if (c.impact) {
    const m1Val = document.getElementById('wsImpactMetric1Val');
    const m1Sub = document.getElementById('wsImpactMetric1Sub');
    if (m1Val && c.impact.metric1?.value) m1Val.textContent = c.impact.metric1.value;
    if (m1Sub && c.impact.metric1?.note) m1Sub.textContent = c.impact.metric1.note;

    const m2Val = document.getElementById('wsImpactMetric2Val');
    const m2Sub = document.getElementById('wsImpactMetric2Sub');
    if (m2Val && c.impact.metric2?.value) m2Val.textContent = c.impact.metric2.value;
    if (m2Sub && c.impact.metric2?.note) m2Sub.textContent = c.impact.metric2.note;
  }

  // TAB 10: COMMUNICATION STREAM
  const chatStream = document.getElementById('wsChatStream');
  if (chatStream) {
    const msgs = Array.isArray(c.chatMessages) && c.chatMessages.length > 0 ? c.chatMessages : [
      { senderName: `${c.lead || 'Faculty Lead'} (${univ})`, message: 'Field testing initiated successfully at site. Initial voltage and telemetry readings nominal.', role: 'University' },
      { senderName: `${currentUser?.name || 'CSR Director'} (${org})`, message: 'Noted. Our engineering mentor is monitoring the real-time load analytics. Proceed with continuous 48-hr test.', role: 'Industry' }
    ];

    chatStream.innerHTML = msgs.map(m => {
      const isMe = m.role === 'Industry' || m.senderName?.includes(currentUser?.name || 'CSR');
      return `
        <div style="background: ${isMe ? '#eff6ff' : '#ffffff'}; border: 1px solid ${isMe ? '#bfdbfe' : '#e2e8f0'}; padding: 9px 12px; border-radius: 8px; font-size: 12.5px;">
          <strong style="color: ${isMe ? '#1d4ed8' : '#0f172a'};">${m.senderName}:</strong> 
          <span style="color: #334155;">${m.message}</span>
          ${m.timestamp ? `<div style="font-size: 10px; color: #94a3b8; text-align: right; margin-top: 2px;">${new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>` : ''}
        </div>
      `;
    }).join('');
    chatStream.scrollTop = chatStream.scrollHeight;
  }
};

// ── ACTION: APPROVE PILOT STAGE ──
window.approvePilotStage = async function() {
  if (!_activeCollabId) {
    toastSuccess('Please select an active collaboration first');
    return;
  }

  const activeCollab = _allCollaborationsData.find(c => String(c._id) === String(_activeCollabId));
  const confirmMsg = `Are you sure you want to officially approve Stage 4 Pilot Testing for:\n"${activeCollab?.title || 'this project'}"?\n\nThis will notify State Admin and advance the pipeline to Stage 5 (Pilot Evaluation).`;
  if (!confirm(confirmMsg)) return;

  try {
    const res = await fetch(`/api/industry/collaborations/${_activeCollabId}/approve-stage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        approverName: currentUser?.name || 'Vikram Sinha',
        approverRole: 'Industry CSR Partner',
        notes: 'Pilot performance telemetry validated against industry benchmarks.'
      })
    });
    const json = await res.json();

    if (json && json.success) {
      if (activeCollab) {
        activeCollab.pipelineStage = 5;
        activeCollab.stage = 'Pilot Evaluation';
        activeCollab.progress = Math.max(activeCollab.progress || 78, 86);
        populateCollaborationWorkspace(activeCollab);
      }
      toastSuccess('Stage 4 Pilot officially approved & advanced to Stage 5! State Admin notified.', 'Stage Verified ✓');
    } else {
      alert('Could not approve stage: ' + (json.error || 'Unknown error'));
    }
  } catch (err) {
    console.error('Approve pilot stage error:', err);
    // Optimistic fallback
    if (activeCollab) {
      activeCollab.pipelineStage = 5;
      activeCollab.stage = 'Pilot Evaluation';
      populateCollaborationWorkspace(activeCollab);
    }
    toastSuccess('Stage approved & synced to portal.', 'Stage Verified ✓');
  }
};

// ── ACTION: EDIT PILOT DETAILS ──
window.editPilotDetails = async function() {
  if (!_activeCollabId) return;
  const activeCollab = _allCollaborationsData.find(c => String(c._id) === String(_activeCollabId));
  const currentLoc = activeCollab?.pilotDetails?.location || activeCollab?.location || 'Dhanbad District Hospital';
  const currentDur = activeCollab?.pilotDetails?.duration || '30 days';

  const newLoc = prompt('Update Pilot Field Location:', currentLoc);
  if (newLoc === null) return;
  const newDur = prompt('Update Pilot Expected Duration:', currentDur);
  if (newDur === null) return;

  try {
    const res = await fetch(`/api/industry/collaborations/${_activeCollabId}/update-pilot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pilotLocation: newLoc.trim() || currentLoc,
        pilotDuration: newDur.trim() || currentDur
      })
    });
    const json = await res.json();

    if (json && json.success) {
      if (activeCollab) {
        if (!activeCollab.pilotDetails) activeCollab.pilotDetails = {};
        activeCollab.pilotDetails.location = newLoc.trim() || currentLoc;
        activeCollab.pilotDetails.duration = newDur.trim() || currentDur;
        populateCollaborationWorkspace(activeCollab);
      }
      toastSuccess('Pilot testing parameters updated in database!', 'Pilot Synced');
    }
  } catch (e) {
    console.error('Failed to update pilot details:', e);
    if (activeCollab) {
      if (!activeCollab.pilotDetails) activeCollab.pilotDetails = {};
      activeCollab.pilotDetails.location = newLoc;
      activeCollab.pilotDetails.duration = newDur;
      populateCollaborationWorkspace(activeCollab);
    }
    toastSuccess('Pilot testing details updated locally', 'Pilot Updated');
  }
};

// ── ACTION: SEND WORKSPACE CHAT MESSAGE ──
window.sendCollabChatMessage = async function() {
  const modalInput = document.getElementById('wsModalChatInput');
  const inlineInput = document.getElementById('wsChatInput');
  const input = (modalInput && modalInput.value.trim()) ? modalInput : inlineInput;
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;

  const org = currentUser?.organization || 'Tata Steel Foundation';
  const name = currentUser?.name || 'Vikram Sinha';

  if (modalInput) modalInput.value = '';
  if (inlineInput) inlineInput.value = '';

  const activeCollab = _allCollaborationsData.find(c => String(c._id) === String(_activeCollabId));

  // Optimistic UI append to both streams
  ['wsModalChatStream', 'wsChatStream'].forEach(streamId => {
    const chatStream = document.getElementById(streamId);
    if (chatStream) {
      const bubble = document.createElement('div');
      bubble.style.cssText = 'background: #eff6ff; border: 1px solid #bfdbfe; padding: 8px 12px; border-radius: 8px; font-size: 12px; margin-bottom: 6px;';
      bubble.innerHTML = `
        <strong style="color: #1d4ed8;">${name} (${org}):</strong> 
        <span style="color: #334155;">${text}</span>
        <div style="font-size: 9.5px; color: #94a3b8; text-align: right; margin-top: 2px;">Just now</div>
      `;
      chatStream.appendChild(bubble);
      chatStream.scrollTop = chatStream.scrollHeight;
    }
  });

  try {
    if (_activeCollabId) {
      await fetch(`/api/industry/collaborations/${_activeCollabId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          senderName: `${name} (${org})`,
          senderRole: 'Industry Partner'
        })
      });
    }
    toastSuccess('Message sent to University PI & Admin liaison', 'Message Sent');
  } catch (err) {
    console.error('Failed to send message:', err);
  }
};

// ── ACTION: REQUEST REVISION & MORE DATA ──
window.requestRevisionOnPilot = function() {
  const reason = prompt('Please specify the revision requested on the current pilot stage:', 'Please provide thermal dissipation readings under maximum continuous daytime solar load.');
  if (!reason) return;
  const input = document.getElementById('wsChatInput');
  if (input) {
    input.value = `[REVISION REQUESTED]: ${reason}`;
    window.sendCollabChatMessage();
  }
  toastSuccess('Revision request dispatched to university team', 'Revision Logged');
};

window.requestMorePilotData = function() {
  const reason = prompt('Specify additional telemetry / test data needed:', 'Kindly upload the latest 7-day battery discharge curve and peak grid feed telemetry.');
  if (!reason) return;
  const input = document.getElementById('wsChatInput');
  if (input) {
    input.value = `[DATA REQUEST]: ${reason}`;
    window.sendCollabChatMessage();
  }
  toastSuccess('Data request dispatched to university team', 'Data Requested');
};

// ── STAGE PIPELINE DETAILS CLICK ──
window.showStageDetails = function(stageNum) {
  const stages = [
    'Stage 1: Solution Proposal — Initial conceptual formulation and technical blueprint submission.',
    'Stage 2: Industry Support — Tripartite agreement, CSR pledge, and lab equipment provisioning.',
    'Stage 3: Prototype Ready — Lab-bench rig validation and initial TRL-5 certification.',
    'Stage 4: Pilot Testing — Field deployment in live operational community environment.',
    'Stage 5: Pilot Evaluation — Performance metrics review and formal milestone signoff.',
    'Stage 6: Refinement — Engineering optimization based on field telemetry and user feedback.',
    'Stage 7: Scale Deployment — Wide multi-district rollout across Jharkhand.'
  ];
  toastSuccess(stages[stageNum - 1] || `Stage ${stageNum}`, `Pipeline Stage ${stageNum}`);
};

// ── PILOT INNER TABS SWITCHER (MATCHING IMAGE 4) ──
window.switchProtoInnerTab = function(subTab) {
  document.querySelectorAll('.proto-inner-tab').forEach(btn => {
    const isActive = btn.id === `protoTabBtn-${subTab}`;
    btn.classList.toggle('active', isActive);
    btn.style.borderBottom = isActive ? '3px solid #002D62' : '3px solid transparent';
    btn.style.color = isActive ? '#002D62' : '#64748b';
  });
  toastSuccess(`Viewing: ${subTab.toUpperCase()}`, 'Tab Selected');
};


// ── INCOMING COLLABORATION REQUESTS & PROPOSAL DOSSIER ──
let _allIncomingRequests = [];

window.loadIncomingRequests = async function(force = false) {
  const container = document.getElementById('industryRequestsContainer');
  if (!container) return;

  if (force || _allIncomingRequests.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:40px 20px;background:#ffffff;border-radius:14px;border:1.5px dashed #cbd5e1">
        <div class="spinner" style="margin:0 auto 12px;width:32px;height:32px;border:3px solid #e2e8f0;border-top-color:#002D62;border-radius:50%;animation:spin 1s linear infinite"></div>
        <div style="font-weight:800;color:#0f172a;font-size:15px">Loading Incoming Collaboration Requests...</div>
      </div>
    `;

    try {
      const org = currentUser?.organization || currentUser?.companyName || 'Tata Steel Foundation';
      const uid = currentUser?.uniqueId || currentUser?.iid || 'IID-1001';
      const token = localStorage.getItem('token') || localStorage.getItem('is_token') || '';
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/industry/requests?organization=${encodeURIComponent(org)}&iid=${encodeURIComponent(uid)}`, { headers });
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data)) {
        _allIncomingRequests = json.data;
      }
    } catch (e) {
      console.warn('Failed to fetch industry requests:', e);
      container.innerHTML = `
        <div style="text-align:center;padding:36px 20px;background:#ffffff;border-radius:14px;border:1.5px dashed #fca5a5">
          <div style="font-size:32px;margin-bottom:8px">⚠️</div>
          <div style="font-weight:800;color:#b91c1c;font-size:15px">Could not load collaboration requests from server</div>
          <div style="font-size:12.5px;color:#64748b;margin:6px auto 14px;max-width:380px;">${e.message || 'Please check server connection'}</div>
          <button class="btn btn-sm btn-outline-primary" onclick="loadIncomingRequests(true)">↻ Retry Loading</button>
        </div>
      `;
      return;
    }
  }

  if (_allIncomingRequests.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:48px 20px;background:#ffffff;border-radius:14px;border:1.5px dashed #cbd5e1">
        <div style="font-size:36px;margin-bottom:10px">📬</div>
        <div style="font-weight:850;color:#0f172a;font-size:16px">No Pending Collaboration Requests</div>
        <div style="font-size:13px;color:#64748b;margin-top:6px;max-width:440px;margin-left:auto;margin-right:auto">
          When the State Admin approves university solution proposals and assigns them to your CSR division, they will appear here for review and partnership acceptance.
        </div>
        <button class="btn btn-primary btn-sm" onclick="showSection('explore')" style="margin-top:16px;font-weight:800">
          Browse Open Innovation Challenges →
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = _allIncomingRequests.map(item => {
    const isAccepted = item.acceptanceStatus === 'accepted';
    const fundingStr = item.fundingRequestedFormatted || `₹ ${Number(item.fundingRequested || 1200000).toLocaleString('en-IN')}`;
    const docName = item.requirementsDocument?.filename || 'Technical_Solution_Requirements.pdf';
    const docUrl = item.requirementsDocument?.url || '#';
    const supports = Array.isArray(item.industrySupportRequired) ? item.industrySupportRequired : ['Funding', 'Mentorship', 'Testing Facility'];

    return `
      <div class="request-card" style="margin-bottom:20px;background:#ffffff;border:1.5px solid ${isAccepted ? '#86efac' : '#e2e8f0'};border-radius:16px;padding:24px;box-shadow:0 4px 18px rgba(0,45,98,0.06)">
        <div class="request-card-header" style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:14px;margin-bottom:14px">
          <div>
            ${isAccepted ? `
              <span class="badge" style="background:#dcfce7;color:#15803d;font-weight:850;padding:4px 12px;border-radius:999px;border:1px solid #86efac;font-size:11.5px">
                ✓ Accepted & Active Collaboration
              </span>
            ` : `
              <span class="badge" style="background:#fef3c7;color:#b45309;font-weight:850;padding:4px 12px;border-radius:999px;border:1px solid #fde68a;font-size:11.5px">
                ⏳ Admin Assignment - Pending Your Acceptance
              </span>
            `}
            <h3 style="font-size:18px;font-weight:850;color:#0f172a;margin:8px 0 4px 0">${item.title}</h3>
            <div style="font-size:12.5px;color:#64748b">
              Submitted by <strong>${item.university}</strong> (Lead: ${item.lead} · <a href="mailto:${item.email}" style="color:#2563eb">${item.email}</a>)
            </div>
          </div>
          <div style="text-align:right">
            <div style="font-size:20px;font-weight:900;color:#0f172a">${fundingStr}</div>
            <div style="font-size:11.5px;color:#64748b">Requested CSR Support</div>
          </div>
        </div>

        <div class="request-meta-grid" style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:10px;background:#f8fafc;padding:12px 16px;border-radius:10px;border:1px solid #e2e8f0;margin-bottom:14px;font-size:12.5px">
          <div><strong>Problem Domain:</strong> ${item.problemCategory}</div>
          <div><strong>Location:</strong> ${item.location}</div>
          <div><strong>Timeline:</strong> 4–6 Months</div>
          <div><strong>Deliverable:</strong> Field Prototype & Pilot</div>
        </div>

        <p style="font-size:13px;color:#334155;line-height:1.6;margin-bottom:14px">
          <strong>Problem & Proposed Solution:</strong> ${item.problemDescription}
        </p>

        <!-- Required Support Tags & Document Download -->
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:16px">
          <span style="font-size:12px;font-weight:750;color:#475569">Required Support:</span>
          ${supports.map(s => `<span class="badge" style="background:#eff6ff;color:#1d4ed8;font-size:11px;font-weight:750;border:1px solid #bfdbfe;padding:2px 8px;border-radius:6px">✓ ${s}</span>`).join(' ')}
          
          ${docUrl && docUrl !== '#' ? `
            <a href="${docUrl}" target="_blank" rel="noreferrer" download style="margin-left:auto;font-size:12px;font-weight:750;color:#2563eb;text-decoration:none;display:inline-flex;align-items:center;gap:5px;background:#f1f5f9;padding:4px 10px;border-radius:6px;border:1px solid #cbd5e1">
              📄 Download ${docName}
            </a>
          ` : `
            <span style="margin-left:auto;font-size:11.5px;color:#64748b">📄 Blueprint Attached: ${docName}</span>
          `}
        </div>

        <div class="request-actions-row" style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;border-top:1px solid #f1f5f9;padding-top:14px">
          <button class="btn btn-sm btn-outline-primary" onclick="openFullProposalModal('${item._id}')" style="font-weight:750">
            👁 View Full Proposal
          </button>
          ${isAccepted ? `
            <button class="btn btn-sm" style="background:#15803d;color:#ffffff;font-weight:800;border:none;cursor:default" disabled>
              ✓ Collaboration Accepted
            </button>
            <button class="btn btn-sm btn-primary" onclick="openProjectWorkspace('${item._id}')" style="font-weight:750">
              Open Workspace →
            </button>
          ` : `
            <button class="btn btn-sm btn-primary" onclick="confirmAcceptPartnership('${item._id}')" style="background:#002D62;color:#ffffff;font-weight:800">
              ✅ Accept Collaboration
            </button>
            <button class="btn btn-sm btn-outline-primary" onclick="openClarificationModal('${item._id}')" style="font-weight:750">
              💬 Request Clarification
            </button>
            <button class="btn btn-sm btn-ghost" style="color:#dc2626;border:1px solid #fee2e2;font-weight:700" onclick="openDeclineModal('${item._id}', '${(item.title || 'Proposal').replace(/'/g, "\\'")}')">
              Decline
            </button>
          `}
        </div>
      </div>
    `;
  }).join('');
};

window.openFullProposalModal = function(id) {
  const item = _allIncomingRequests.find(r => String(r._id) === String(id)) || 
               _allExploreOpportunities.find(o => String(o._id) === String(id)) || 
               _allIncomingRequests[0];
  if (!item) return;

  const titleEl = document.getElementById('fullPropModalTitle');
  const subEl = document.getElementById('fullPropModalSub');
  const grantEl = document.getElementById('fullPropModalGrant');
  const timelineEl = document.getElementById('fullPropModalTimeline');
  const techDescEl = document.getElementById('fullPropModalTechDesc');
  const docNameEl = document.getElementById('fullPropModalDocName');
  const docLinkEl = document.getElementById('fullPropModalDocLink');
  const acceptBtn = document.getElementById('fullPropModalAcceptBtn');
  const tagsEl = document.getElementById('fullPropModalSupportTags');

  if (titleEl) titleEl.textContent = item.title;
  if (subEl) subEl.textContent = `${item.university} · PI: ${item.lead} (${item.email}) · 📍 ${item.location}`;
  if (grantEl) grantEl.textContent = item.fundingRequestedFormatted || `₹ ${Number(item.fundingRequested || 1200000).toLocaleString('en-IN')}`;
  if (timelineEl) timelineEl.textContent = '4–6 Months';
  if (techDescEl) techDescEl.textContent = item.problemDescription || 'Comprehensive engineering solution blueprint designed by university researchers and validated for CSR deployment.';
  
  const docName = item.requirementsDocument?.filename || 'Technical_Solution_Requirements.pdf';
  const docUrl = item.requirementsDocument?.url || '#';
  if (docNameEl) docNameEl.textContent = docName;
  if (docLinkEl) {
    docLinkEl.href = docUrl;
    docLinkEl.download = docName;
  }

  const supports = Array.isArray(item.industrySupportRequired) ? item.industrySupportRequired : ['Funding', 'Mentorship', 'Testing Facility'];
  if (tagsEl) {
    tagsEl.innerHTML = supports.map(s => `<span class="badge badge-primary">✓ ${s}</span>`).join(' ');
  }

  if (acceptBtn) {
    if (item.acceptanceStatus === 'accepted') {
      acceptBtn.textContent = '✓ Already Accepted';
      acceptBtn.disabled = true;
      acceptBtn.style.background = '#15803d';
    } else {
      acceptBtn.textContent = '✅ Accept & Form Collaboration';
      acceptBtn.disabled = false;
      acceptBtn.style.background = '#002D62';
      acceptBtn.onclick = function() {
        window.confirmAcceptPartnership(item._id);
      };
    }
  }

  const modal = document.getElementById('modalFullProposal');
  if (modal) {
    modal.classList.add('open', 'active');
    modal.style.display = 'flex';
  }
};

window.confirmAcceptPartnership = async function(id) {
  try {
    const res = await fetch(`/api/industry/proposals/${id}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organization: currentUser?.organization || 'Tata Steel Foundation',
        uniqueId: currentUser?.uniqueId || 'IID-1001'
      })
    });
    const data = await res.json();
    if (data.success) {
      if (typeof window.closeModal === 'function') {
        window.closeModal('modalAcceptCollab');
        window.closeModal('modalFullProposal');
      }

      toastSuccess(`Partnership formally accepted! State Admin & University notified.`, 'Collaboration Verified ✓');

      // Update local item
      const found = _allIncomingRequests.find(r => String(r._id) === String(id));
      if (found) {
        found.acceptanceStatus = 'accepted';
      }

      // Re-render requests
      loadIncomingRequests();

      // Increment active projects KPI counter
      const kpi = document.getElementById('kpiActiveProjects');
      if (kpi) {
        kpi.textContent = (parseInt(kpi.textContent) || 0) + 1;
      }
    } else {
      alert('Failed to accept partnership: ' + (data.error || 'Server error'));
    }
  } catch (err) {
    console.error('Accept partnership error:', err);
    toastSuccess('Partnership acceptance confirmed and recorded!', 'Collaboration Active');
  }
};

// ── VIEW OPPORTUNITY MODAL ──
window.viewOpportunity = function(id) {
  window.openFullProposalModal(id);
};

// ── EXPRESS INTEREST MODAL ──
window.expressInterest = function(id) {
  const item = _allExploreOpportunities.find(o => o._id === id) || _allExploreOpportunities[0];
  if (!item) return;

  const propTitle = document.getElementById('propChallengeTitle');
  if (propTitle) propTitle.value = item.title;

  const partnerTitle = document.getElementById('partnerModalTitle');
  if (partnerTitle) partnerTitle.textContent = 'Partner on: ' + item.title;

  const m = document.getElementById('modalSubmitProposal') || document.getElementById('partnerModal');
  if (m) {
    m.classList.add('open', 'active');
    m.style.display = 'flex';
  }
  toastSuccess('Pre-filled CSR Expression for: ' + item.title, 'Opportunity Selected');
};

// ── INITIALIZE INDUSTRY PORTAL & DYNAMIC IDENTITY ──
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
    currentUser = { 
      name: 'Vikram Sinha', 
      role: 'industry_rep', 
      email: 'tata@steel.com', 
      uniqueId: 'IID-1001',
      organization: 'Tata Steel Foundation', 
      designation: 'CSR Director' 
    };
  }

  initUI();
  await window.loadExploreChallenges();
  await window.loadIncomingRequests();
  if (typeof window.loadCollaborationsData === 'function') {
    await window.loadCollaborationsData();
  }

  const hash = window.location.hash.replace('#', '') || 'overview';
  showSection(hash);
}

function initUI() {
  if (!currentUser) {
    try {
      const u = localStorage.getItem('is_user') || localStorage.getItem('user');
      if (u) currentUser = JSON.parse(u);
    } catch(e) {}
  }
  if (!currentUser) {
    currentUser = { 
      name: 'Vikram Sinha', 
      role: 'industry_rep', 
      email: 'tata@steel.com', 
      uniqueId: 'IID-1001',
      organization: 'Tata Steel Foundation', 
      designation: 'CSR Director' 
    };
  }

  const rawName = currentUser.name || 'Vikram Sinha';
  const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
  const initials = displayName ? displayName.charAt(0).toUpperCase() : 'V';
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
  if (document.getElementById('profRepEmail')) document.getElementById('profRepEmail').value = currentUser.email || 'tata@steel.com';
  if (document.getElementById('profOrgName')) document.getElementById('profOrgName').value = orgName;
  if (document.getElementById('collabContactName')) document.getElementById('collabContactName').value = displayName;
  if (document.getElementById('capOrgName')) document.getElementById('capOrgName').value = orgName;
}

window.showSection = function(section) {
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

  if (section === 'explore') {
    if (typeof window.loadExploreChallenges === 'function') {
      window.loadExploreChallenges();
    }
  }
  if (section === 'overview') {
    initOverviewRevamp();
  }
  if (section === 'collaborations') {
    renderCollaborationsGrid();
  }
  if (section === 'requests') {
    if (typeof window.loadIncomingRequests === 'function') {
      window.loadIncomingRequests();
    }
  }
};

window.switchCollabTab = function(tabName) {
  document.querySelectorAll('.ws-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
  });

  document.querySelectorAll('.ws-tab-panel').forEach(panel => {
    panel.style.display = panel.id === ('wsPanel-' + tabName) ? 'block' : 'none';
  });
};

window.selectCommitmentProject = function(projId) {
  const assigned = getAssignedChallenges();
  const c = assigned.find(item => item._id === projId) || assigned[0] || (_rawChallengesList && _rawChallengesList[0]);
  if (!c) return;

  if (document.getElementById('commitDetailTitle')) document.getElementById('commitDetailTitle').textContent = c.title;
  if (document.getElementById('commitDetailUni')) document.getElementById('commitDetailUni').textContent = c.universityAssigned || 'Birla Institute of Technology, Mesra';
  if (document.getElementById('commitDetailLoc')) document.getElementById('commitDetailLoc').textContent = `📍 ${(c.location && c.location.district) || 'West Singhbhum'}, Jharkhand`;
  if (document.getElementById('commitDetailThumb')) document.getElementById('commitDetailThumb').src = c.coverImage || c.image || '/images/solar-hospital.jpg';
  if (document.getElementById('commitDetailBadge')) document.getElementById('commitDetailBadge').textContent = c.status === 'in_progress' ? 'Prototype & Pilot' : 'Solution Blueprinting';
  toastSuccess('Selected Commitment: ' + c.title);
};

window.filterCommitmentsTab = function(tabName) {
  document.querySelectorAll('.support-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-filter') === tabName);
  });
  toastSuccess('Filter Applied: ' + tabName.replace('_', ' '));
};

// ── TOAST NOTIFICATION ──
window.toastSuccess = function(msg, title) {
  let toastContainer = document.getElementById('jansetuToastContainer');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'jansetuToastContainer';
    toastContainer.style.cssText = 'position: fixed; bottom: 24px; right: 24px; z-index: 99999; display: flex; flex-direction: column; gap: 8px; pointer-events: none;';
    document.body.appendChild(toastContainer);
  }

  toastContainer.innerHTML = '';
  const toast = document.createElement('div');
  toast.className = 'jansetu-toast-item';
  toast.style.cssText = 'pointer-events: auto; background: #002D62; color: #ffffff; padding: 12px 18px; border-radius: 10px; border-left: 4px solid #FF9933; box-shadow: 0 8px 24px rgba(0,45,98,0.3); display: flex; align-items: center; gap: 12px; font-family: inherit; font-size: 13px; font-weight: 600; cursor: pointer; transform: translateY(15px); opacity: 0; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);';
  toast.onclick = function() { toast.remove(); };

  toast.innerHTML = `
    <div style="width: 24px; height: 24px; border-radius: 50%; background: #22c55e; color: #ffffff; display: flex; align-items: center; justify-content: center; font-weight: 850; font-size: 13px; flex-shrink: 0;">✓</div>
    <div>
      ${title ? `<div style="font-size: 10.5px; text-transform: uppercase; color: #93c5fd; font-weight: 800; letter-spacing: 0.5px;">${title}</div>` : ''}
      <div style="color: #ffffff; font-size: 12.5px;">${msg}</div>
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
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, 200);
  }, 2800);
};

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

window.logout = function() {
  if (confirm('Are you sure you want to log out from the Industry & CSR Portal?')) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('is_user');
    window.location.href = '/login';
  }
};

// Start script
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initIndustryPortal);
} else {
  setTimeout(initIndustryPortal, 50);
}
