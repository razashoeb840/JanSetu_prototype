
import React, { useEffect } from 'react';
import './adminstyle.css';

function App() {
  const showSection = (section) => {
    window.location.hash = section;
    if (typeof window.showSection === 'function') {
      try {
        window.showSection(section);
        return;
      } catch (err) {
        console.warn('Error invoking window.showSection:', err);
      }
    }
    // Fallback UI tab switch if admin.js is not yet attached
    document.querySelectorAll('.dashboard-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(l => l.classList.remove('active'));
    const sectionEl = document.getElementById('section-' + section);
    const navEl = document.getElementById('nav-' + section);
    if (sectionEl) sectionEl.classList.add('active');
    if (navEl) navEl.classList.add('active');
  };

  const toggleSidebar = () => {
    if (typeof window.toggleSidebar === 'function') {
      try {
        window.toggleSidebar();
        return;
      } catch (err) {
        console.warn('Error invoking window.toggleSidebar:', err);
      }
    }
    const sb = document.querySelector('.sidebar');
    if (sb) {
      if (window.innerWidth <= 1024) {
        sb.classList.toggle('mobile-open');
        document.body.classList.toggle('sidebar-mobile-open', sb.classList.contains('mobile-open'));
      } else {
        sb.classList.toggle('collapsed');
        document.body.classList.toggle('sidebar-collapsed', sb.classList.contains('collapsed'));
      }
    }
  };

  useEffect(() => {
    // Dynamically load scripts in strict order after component mounts
    const loadScript = (src, cb) => {
      const existing = document.querySelector(`script[data-src="${src}"]`);
      if (existing) {
        if (cb) cb();
        return;
      }
      const script = document.createElement('script');
      script.src = `${src}?v=${Date.now()}`;
      script.setAttribute('data-src', src);
      script.async = false;
      if (cb) script.onload = cb;
      document.body.appendChild(script);
    };

    loadScript('/js/utils.js', () => {
      loadScript('/admin/jansetu-civic-loader.js', () => {
        loadScript('/js/pan-india-heatmap.js', () => {
          loadScript('/admin/admin.js', () => {
            if (typeof window.initAdmin === 'function') {
              window.initAdmin();
            }
          });
        });
      });
    });
  }, []);

  return (
    <>
      
  {/* Modern Command Background Ambient Canvas */}
  <div className="fixed-canvas-bg"></div>

  <div className="app-layout">
    {/* ROYAL NAVY SIDEBAR WITH MONUMENT WATERMARK (CITIZEN.HTML SYSTEM) */}
    <aside className="sidebar" id="sidebar">
    <div className="sidebar-monument-bg"></div>
    <div className="sidebar-navy-scrim"></div>
    <div className="sidebar-tricolor-ribbon"></div>

    <div className="sidebar-brand-wrapper">
      <a className="sidebar-brand" href="#overview" onClick={() => { showSection('overview') }}>
        <img
          src="/jansetu-logo.png"
          alt="JanSetu Logo"
          className="brand-icon-svg"
          style={{"width":"42px","height":"42px","borderRadius":"50%","objectFit":"cover","border":"2px solid rgba(255,255,255,0.7)","boxShadow":"0 2px 8px rgba(0,0,0,0.3)","flexShrink":0}}
          onError={(e) => { e.target.src = '/admin/jansetu-logo.png'; }}
        />
        <div className="brand-text-block">
          <span className="brand-title"><span className="brand-saffron">Jan</span><span className="brand-green">Setu</span></span>
          <span className="brand-tagline">ADMIN PORTAL</span>
        </div>
      </a>
      <button type="button" className="sidebar-collapse-btn" id="sidebarCollapseBtn" onClick={() => { toggleSidebar() }} title="Toggle Navigation Drawer">
        <svg viewBox="0 0 24 24">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
    </div>

    <div className="admin-pill">
      <div className="admin-pill-dot"></div>
      <div className="admin-pill-text">🛡️ Admin Portal</div>
      <div className="admin-pill-name" id="sidebarName">Dr. Admin</div>
    </div>

    <nav className="sidebar-menu">
      <div className="nav-section-label">Command Center</div>
      <button className="nav-item active" id="nav-overview" onClick={() => { showSection('overview') }}>
        <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        <span>Dashboard</span>
      </button>

      <div className="nav-section-label">Challenge Operations</div>
      <button className="nav-item" id="nav-challenges" onClick={() => { showSection('challenges'); if (window.filterChallengesByTab) window.filterChallengesByTab(''); }}>
        <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        <span>Challenges</span>
        <span className="nav-badge" id="pendingCountBadge" style={{"display":"none"}}>0</span>
      </button>
      <button className="nav-item" id="nav-proposals" onClick={() => { showSection('proposals') }}>
        <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
        <span>Solution Proposals</span>
        <span className="nav-badge" id="proposalsNavBadge" style={{"display":"none"}}>0</span>
        <span className="notif-dot-pulse" id="proposalsNotifDot" style={{"display":"none","width":"8px","height":"8px","borderRadius":"50%","background":"#ef4444","boxShadow":"0 0 8px #ef4444","marginLeft":"auto","flexShrink":0}}></span>
      </button>
      <button className="nav-item" id="nav-aimatching" onClick={() => { showSection('aimatching') }}>
        <svg viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
        <span>AI Matching</span>
      </button>
      <button className="nav-item" id="nav-sla" onClick={() => { showSection('sla') }}>
        <svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        <span>Overdue / Escalated</span>
        <span className="nav-badge red" id="overdueNavBadge" style={{"display":"none"}}>0</span>
      </button>

      <div className="nav-section-label">Network & Partners</div>
      <button className="nav-item" id="nav-users" onClick={() => { showSection('users') }}>
        <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
        <span>Citizens</span>
      </button>
      <button className="nav-item" id="nav-universities" onClick={() => { showSection('universities') }}>
        <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
        <span>Universities</span>
      </button>
      <button className="nav-item" id="nav-industry" onClick={() => { showSection('industry') }}>
        <svg viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>
        <span>Industry / CSR</span>
      </button>

      <div className="nav-section-label">Intelligence</div>
      <button className="nav-item" id="nav-heatmap" onClick={() => { showSection('heatmap') }}>
        <svg viewBox="0 0 24 24"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
        <span>District Heatmap</span>
      </button>

      <div className="nav-section-label">Governance</div>
      <button className="nav-item" id="nav-notifications" onClick={() => { showSection('notifications') }}>
        <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
        <span>Notifications</span>
        <span className="nav-badge" id="notifNavBadge" style={{"display":"none"}}>0</span>
      </button>
      <button className="nav-item" id="nav-activity" onClick={() => { showSection('activity') }}>
        <svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
        <span>Activity Log</span>
      </button>
    </nav>

    <div className="sidebar-footer">
      <div className="sidebar-user">
        <div className="sidebar-avatar" id="sidebarAvatar">A</div>
        <div>
          <div className="sidebar-uname" id="sidebarNameFull">Administrator</div>
          <div className="sidebar-urole">State Admin · Jharkhand</div>
        </div>
      </div>
      <button className="btn-logout" onClick={() => { logout() }}>
        <svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        <span>Logout</span>
      </button>
    </div>
  </aside>

  {/* Mobile Sidebar Backdrop Overlay */}
  <div className="sidebar-backdrop" id="sidebarBackdrop" onClick={() => { if (window.toggleSidebar) window.toggleSidebar(); }}></div>

  {/* Floating Drawer Reopen Tab (Always visible if drawer is collapsed) */}
  <button type="button" className="drawer-floating-toggle" id="drawerFloatingToggle" onClick={() => { toggleSidebar() }} title="Expand Navigation Drawer">
    <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6" /></svg>
  </button>

  {/* MAIN VIEWPORT */}
  <div className="main-viewport">

    {/* NEXT-GEN ENTERPRISE COMMAND TOPBAR */}
    <header className="command-topbar">
      <div className="topbar-left">
        <button type="button" className="drawer-open-btn" onClick={() => { toggleSidebar() }} title="Toggle Navigation Drawer">
          <svg viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
        </button>

        <div className="topbar-brand-badge" onClick={() => { showSection('overview'); }} style={{"cursor":"pointer","display":"flex","alignItems":"center","gap":"4px","padding":"4px 10px","borderRadius":"8px","background":"#F8FAFC","border":"1px solid #E2E8F0"}}>
          <span style={{"fontSize":"14px"}}>🇮🇳</span>
          <span className="brand-saffron" style={{"fontWeight":"900","fontSize":"16px"}}>Jan</span><span className="brand-green" style={{"fontWeight":"900","fontSize":"16px"}}>Setu</span>
          <span style={{"fontSize":"10px","fontWeight":"800","background":"#E0F2FE","color":"#0284C7","padding":"1px 6px","borderRadius":"999px","marginLeft":"2px"}}>ADMIN</span>
        </div>

        <div className="breadcrumb-box">
          <span className="breadcrumb-path" id="pageBreadcrumb">Command Center</span>
          <span className="breadcrumb-slash">/</span>
          <span className="breadcrumb-current" id="pageTitle">Dashboard</span>
        </div>

        <div className="live-status-pill">
          <span className="live-status-dot"></span>
          <span className="live-status-text">LIVE ENGINE</span>
        </div>
      </div>

      <div className="topbar-right">
        <button className="notif-bell-btn" onClick={() => { showSection('notifications') }} title="Notifications">
          <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
          <span className="notif-pink-badge" id="topbarNotifDot" style={{"display":"none"}}>0</span>
        </button>

        <div className="profile-pill" onClick={() => { showSection('overview') }}>
          <div className="profile-avatar-circle" id="topbarAvatar">A</div>
          <div className="profile-text-meta">
            <span className="profile-name" id="topbarName">Admin</span>
            <span className="profile-role-tag">Super Admin</span>
          </div>
        </div>
      </div>
    </header>

    <div className="page-content">
      {/* DASHBOARD (FORMERLY OVERVIEW) */}
      <div id="section-overview" className="dashboard-section active">
        {/* ROW 1: 6 KPI CARDS (100% REAL MONGODB DATABASE METRICS) */}
        <div className="dsh-kpis-grid">
          {/* 1. Total Reports */}
          <div className="dsh-kpi-card" onClick={() => { showSection('challenges'); if(window.filterChallengesByTab) window.filterChallengesByTab('all'); }} style={{"cursor":"pointer"}}>
            <div className="dsh-kpi-top">
              <div className="dsh-kpi-icon-sq blue">&#128196;</div>
              <span className="dsh-kpi-watermark">&#128196;</span>
            </div>
            <div>
              <div className="dsh-kpi-lbl">Total Reports</div>
              <div className="dsh-kpi-val" id="dshTotalReports">70</div>
              <div className="dsh-kpi-trend up" id="dshTotalReportsTrend">&#8593; 70 Real Synced</div>
            </div>
          </div>

          {/* 2. Pending Verification */}
          <div className="dsh-kpi-card" onClick={() => { showSection('challenges'); if(window.filterChallengesByTab) window.filterChallengesByTab('pending'); }} style={{"cursor":"pointer"}}>
            <div className="dsh-kpi-top">
              <div className="dsh-kpi-icon-sq orange">&#9201;</div>
              <span className="dsh-kpi-watermark">&#9201;</span>
            </div>
            <div>
              <div className="dsh-kpi-lbl">Pending Verification</div>
              <div className="dsh-kpi-val" id="dshPendingVerification">13</div>
              <div className="dsh-kpi-trend down" id="dshPendingVerificationTrend">&#9888; Requires Triage</div>
            </div>
          </div>

          {/* 3. Active Projects */}
          <div className="dsh-kpi-card" onClick={() => { showSection('challenges'); if(window.filterChallengesByTab) window.filterChallengesByTab('assigned'); }} style={{"cursor":"pointer"}}>
            <div className="dsh-kpi-top">
              <div className="dsh-kpi-icon-sq green">&#9881;</div>
              <span className="dsh-kpi-watermark">&#9881;</span>
            </div>
            <div>
              <div className="dsh-kpi-lbl">Active Projects</div>
              <div className="dsh-kpi-val" id="dshActiveProjects">42</div>
              <div className="dsh-kpi-trend up" id="dshActiveProjectsTrend">&#8593; 42 Under R&D</div>
            </div>
          </div>

          {/* 4. University Assigned */}
          <div className="dsh-kpi-card" onClick={() => { showSection('universities'); }} style={{"cursor":"pointer"}}>
            <div className="dsh-kpi-top">
              <div className="dsh-kpi-icon-sq purple">&#127891;</div>
              <span className="dsh-kpi-watermark">&#127891;</span>
            </div>
            <div>
              <div className="dsh-kpi-lbl">University Assigned</div>
              <div className="dsh-kpi-val" id="dshUnivAssigned">21</div>
              <div className="dsh-kpi-trend up" id="dshUnivAssignedTrend">&#8593; 8 Universities</div>
            </div>
          </div>

          {/* 5. Industry / CSR Partners */}
          <div className="dsh-kpi-card" onClick={() => { showSection('industry'); }} style={{"cursor":"pointer"}}>
            <div className="dsh-kpi-top">
              <div className="dsh-kpi-icon-sq coral">&#127970;</div>
              <span className="dsh-kpi-watermark">&#127970;</span>
            </div>
            <div>
              <div className="dsh-kpi-lbl">Industry / CSR Partners</div>
              <div className="dsh-kpi-val" id="dshIndustryPartners">6</div>
              <div className="dsh-kpi-trend up" id="dshIndustryPartnersTrend">&#8593; 6 CSR Partners</div>
            </div>
          </div>

          {/* 6. Resolved */}
          <div className="dsh-kpi-card" onClick={() => { showSection('challenges'); if(window.filterChallengesByTab) window.filterChallengesByTab('resolved'); }} style={{"cursor":"pointer"}}>
            <div className="dsh-kpi-top">
              <div className="dsh-kpi-icon-sq green">&#9989;</div>
              <span className="dsh-kpi-watermark">&#9989;</span>
            </div>
            <div>
              <div className="dsh-kpi-lbl">Resolved</div>
              <div className="dsh-kpi-val" id="dshResolved">15</div>
              <div className="dsh-kpi-trend up" id="dshResolvedTrend">&#8593; 21.4% Resolved</div>
            </div>
          </div>
        </div>

        {/* ROW 2: 3 LIVE INTERACTIVE MID PANELS (REPLACING STATIC CHARTS WITH ACTIONABLE GOVERNANCE HUBS) */}
        <div className="dsh-mid-grid">
          {/* Panel 1: Live Citizen Incident Radar */}
          <div className="dsh-panel live-radar-panel">
            <div className="dsh-panel-header">
              <div className="dsh-panel-title">
                <span className="dsh-icon-sq-sm red">&#128680;</span>
                <span>Live Citizen Incident Radar</span>
                <span className="live-radar-tag"><span className="radar-pulse-dot"></span> LIVE FEED</span>
              </div>
              <div className="dsh-pill-tabs" id="radarFilterTabs">
                <button className="dsh-pill-btn active" id="radarTabAll" onClick={() => { if(window.filterIncidentRadar) window.filterIncidentRadar('all'); }}>All</button>
                <button className="dsh-pill-btn" id="radarTabPending" onClick={() => { if(window.filterIncidentRadar) window.filterIncidentRadar('pending'); }}>Needs Review</button>
                <button className="dsh-pill-btn" id="radarTabUrgent" onClick={() => { if(window.filterIncidentRadar) window.filterIncidentRadar('urgent'); }}>Urgent</button>
              </div>
            </div>
            <div className="radar-feed-wrap" id="dshIncidentRadarList">
              <div className="radar-feed-item low" onClick={() => { if(window.openChallengeAction) window.openChallengeAction('6aa6dd7d4403e99e76314153'); }}>
                <div className="radar-item-main">
                  <div className="radar-item-header">
                    <span className="radar-item-id">JH-2026-314153</span>
                    <span className="radar-item-priority low">Low</span>
                  </div>
                  <div className="radar-item-title" title="Poor access to quality education in rural areas of North Delhi - Urgent Innovation Needed">Poor access to quality education in rural areas of North Delhi</div>
                  <div className="radar-item-meta">
                    <span>📍 North Delhi</span><span>·</span><span>Rural Livelihoods</span><span>·</span><span style={{"color":"#94A3B8"}}>Just now</span>
                  </div>
                </div>
                <button className="btn-radar-triage" onClick={(e) => { e.stopPropagation(); if(window.openChallengeAction) window.openChallengeAction('6aa6dd7d4403e99e76314153'); }}>
                  <span>⚡ Triage</span>
                </button>
              </div>

              <div className="radar-feed-item high" onClick={() => { if(window.openChallengeAction) window.openChallengeAction('6aa6dd7c4403e99e76314120'); }}>
                <div className="radar-item-main">
                  <div className="radar-item-header">
                    <span className="radar-item-id">JH-2026-314120</span>
                    <span className="radar-item-priority high">High</span>
                  </div>
                  <div className="radar-item-title" title="No Solar Energy Access for Off-Grid Villages in Latehar District">No Solar Energy Access for Off-Grid Villages in Latehar District</div>
                  <div className="radar-item-meta">
                    <span>📍 Latehar</span><span>·</span><span>Energy & Technology</span><span>·</span><span style={{"color":"#94A3B8"}}>1h ago</span>
                  </div>
                </div>
                <button className="btn-radar-triage" onClick={(e) => { e.stopPropagation(); if(window.openChallengeAction) window.openChallengeAction('6aa6dd7c4403e99e76314120'); }}>
                  <span>⚡ Triage</span>
                </button>
              </div>

              <div className="radar-feed-item high" onClick={() => { if(window.openChallengeAction) window.openChallengeAction('6aa6dd7c4403e99e7631411d'); }}>
                <div className="radar-item-main">
                  <div className="radar-item-header">
                    <span className="radar-item-id">JH-2026-31411D</span>
                    <span className="radar-item-priority high">High</span>
                  </div>
                  <div className="radar-item-title" title="Bureaucratic Delays in Issuance of Certificates Harassing Citizens">Bureaucratic Delays in Issuance of Certificates Harassing Citizens</div>
                  <div className="radar-item-meta">
                    <span>📍 Hazaribagh</span><span>·</span><span>Public Administration</span><span>·</span><span style={{"color":"#94A3B8"}}>2h ago</span>
                  </div>
                </div>
                <button className="btn-radar-triage" onClick={(e) => { e.stopPropagation(); if(window.openChallengeAction) window.openChallengeAction('6aa6dd7c4403e99e7631411d'); }}>
                  <span>⚡ Triage</span>
                </button>
              </div>

              <div className="radar-feed-item medium" onClick={() => { if(window.openChallengeAction) window.openChallengeAction('6aa6dd7c4403e99e7631411a'); }}>
                <div className="radar-item-main">
                  <div className="radar-item-header">
                    <span className="radar-item-id">JH-2026-31411A</span>
                    <span className="radar-item-priority medium">Medium</span>
                  </div>
                  <div className="radar-item-title" title="Smart Waste Management System Required for Ranchi Smart City">Smart Waste Management System Required for Ranchi Smart City</div>
                  <div className="radar-item-meta">
                    <span>📍 Ranchi</span><span>·</span><span>Urban Infrastructure</span><span>·</span><span style={{"color":"#94A3B8"}}>3h ago</span>
                  </div>
                </div>
                <button className="btn-radar-triage" onClick={(e) => { e.stopPropagation(); if(window.openChallengeAction) window.openChallengeAction('6aa6dd7c4403e99e7631411a'); }}>
                  <span>⚡ Triage</span>
                </button>
              </div>

              <div className="radar-feed-item high" onClick={() => { if(window.openChallengeAction) window.openChallengeAction('6aa6dd7c4403e99e76314114'); }}>
                <div className="radar-item-main">
                  <div className="radar-item-header">
                    <span className="radar-item-id">JH-2026-314114</span>
                    <span className="radar-item-priority high">High</span>
                  </div>
                  <div className="radar-item-title" title="Forest-Dependent Communities Losing Livelihoods as Forest Depletes">Forest-Dependent Communities Losing Livelihoods as Forest Depletes</div>
                  <div className="radar-item-meta">
                    <span>📍 West Singhbhum</span><span>·</span><span>Rural Livelihoods</span><span>·</span><span style={{"color":"#94A3B8"}}>4h ago</span>
                  </div>
                </div>
                <button className="btn-radar-triage" onClick={(e) => { e.stopPropagation(); if(window.openChallengeAction) window.openChallengeAction('6aa6dd7c4403e99e76314114'); }}>
                  <span>⚡ Triage</span>
                </button>
              </div>
            </div>
          </div>

          {/* Panel 2: District Civic Severity & SLA Escalation Index */}
          <div className="dsh-panel district-sla-panel">
            <div className="dsh-panel-header">
              <div className="dsh-panel-title">
                <span className="dsh-icon-sq-sm purple">&#127963;</span>
                <span>District Severity & SLA Index</span>
              </div>
              <button className="dsh-btn-link" onClick={() => { showSection('heatmap'); }}>Heatmap &rarr;</button>
            </div>
            <div className="district-sla-body" id="dshDistrictSeverityList">
              <div className="district-sla-row" onClick={() => { showSection('challenges'); }}>
                <div className="district-name-badge">
                  <span>📍 Ranchi</span><span className="district-count-pill">16</span>
                </div>
                <div className="district-bar-wrap">
                  <div className="district-bar-track">
                    <div className="district-bar-urgent" style={{"width":"25%"}}></div>
                    <div className="district-bar-high" style={{"width":"30%"}}></div>
                    <div className="district-bar-resolved" style={{"width":"20%"}}></div>
                    <div className="district-bar-active" style={{"width":"25%"}}></div>
                  </div>
                </div>
                <span className="sla-tag action">⚡ 4 Urgent</span>
              </div>

              <div className="district-sla-row" onClick={() => { showSection('challenges'); }}>
                <div className="district-name-badge">
                  <span>📍 Dhanbad</span><span className="district-count-pill">12</span>
                </div>
                <div className="district-bar-wrap">
                  <div className="district-bar-track">
                    <div className="district-bar-urgent" style={{"width":"20%"}}></div>
                    <div className="district-bar-high" style={{"width":"35%"}}></div>
                    <div className="district-bar-resolved" style={{"width":"25%"}}></div>
                    <div className="district-bar-active" style={{"width":"20%"}}></div>
                  </div>
                </div>
                <span className="sla-tag moderate">⚠️ High SLA</span>
              </div>

              <div className="district-sla-row" onClick={() => { showSection('challenges'); }}>
                <div className="district-name-badge">
                  <span>📍 Jamshedpur</span><span className="district-count-pill">10</span>
                </div>
                <div className="district-bar-wrap">
                  <div className="district-bar-track">
                    <div className="district-bar-high" style={{"width":"30%"}}></div>
                    <div className="district-bar-resolved" style={{"width":"40%"}}></div>
                    <div className="district-bar-active" style={{"width":"30%"}}></div>
                  </div>
                </div>
                <span className="sla-tag ok">🛡️ On Track</span>
              </div>

              <div className="district-sla-row" onClick={() => { showSection('challenges'); }}>
                <div className="district-name-badge">
                  <span>📍 Hazaribagh</span><span className="district-count-pill">8</span>
                </div>
                <div className="district-bar-wrap">
                  <div className="district-bar-track">
                    <div className="district-bar-urgent" style={{"width":"25%"}}></div>
                    <div className="district-bar-high" style={{"width":"35%"}}></div>
                    <div className="district-bar-resolved" style={{"width":"20%"}}></div>
                    <div className="district-bar-active" style={{"width":"20%"}}></div>
                  </div>
                </div>
                <span className="sla-tag action">⚡ 2 Urgent</span>
              </div>

              <div className="district-sla-row" onClick={() => { showSection('challenges'); }}>
                <div className="district-name-badge">
                  <span>📍 Bokaro</span><span className="district-count-pill">8</span>
                </div>
                <div className="district-bar-wrap">
                  <div className="district-bar-track">
                    <div className="district-bar-high" style={{"width":"40%"}}></div>
                    <div className="district-bar-resolved" style={{"width":"30%"}}></div>
                    <div className="district-bar-active" style={{"width":"30%"}}></div>
                  </div>
                </div>
                <span className="sla-tag ok">🛡️ On Track</span>
              </div>

              <div className="district-sla-row" onClick={() => { showSection('challenges'); }}>
                <div className="district-name-badge">
                  <span>📍 Dumka</span><span className="district-count-pill">7</span>
                </div>
                <div className="district-bar-wrap">
                  <div className="district-bar-track">
                    <div className="district-bar-high" style={{"width":"25%"}}></div>
                    <div className="district-bar-resolved" style={{"width":"45%"}}></div>
                    <div className="district-bar-active" style={{"width":"30%"}}></div>
                  </div>
                </div>
                <span className="sla-tag ok">🛡️ On Track</span>
              </div>
            </div>
            <div className="district-sla-footer">
              <div className="sla-stat-chip">
                <span className="sla-chip-val" id="dshResolutionRate">21.4%</span>
                <span className="sla-chip-lbl">State Resolution Rate</span>
              </div>
              <div className="sla-stat-chip">
                <span className="sla-chip-val" id="dshActiveRndCount">42</span>
                <span className="sla-chip-lbl">Active R&D Projects</span>
              </div>
            </div>
          </div>

          {/* Panel 3: Quick Actions 2x2 Grid with Real Live Badges */}
          <div className="dsh-panel">
            <div className="dsh-panel-header">
              <div className="dsh-panel-title">
                <span style={{"color":"#F59E0B","fontSize":"16px"}}>&#9889;</span>
                <span>Quick Actions</span>
              </div>
              <span className="dsh-badge-live-ai">&#9889; 1-Click Triage</span>
            </div>
            <div className="dsh-actions-grid">
              <div className="dsh-action-card" onClick={() => { showSection('challenges'); if (window.filterChallengesByTab) window.filterChallengesByTab('pending'); }}>
                <div className="dsh-action-icon" style={{"background":"#FEF2F2","color":"#DC2626"}}>&#128196;</div>
                <div style={{"flex":"1","minWidth":"0"}}>
                  <div style={{"display":"flex","alignItems":"center","justifyContent":"space-between"}}>
                    <div className="dsh-action-title">Review Pending</div>
                    <span className="dsh-action-pill-count red" id="dshQuickPendingCount">13</span>
                  </div>
                  <div className="dsh-action-sub">Triage citizen issues</div>
                </div>
              </div>

              <div className="dsh-action-card" onClick={() => { showSection('aimatching'); }}>
                <div className="dsh-action-icon" style={{"background":"#F3E8FF","color":"#8B5CF6"}}>&#10024;</div>
                <div style={{"flex":"1","minWidth":"0"}}>
                  <div style={{"display":"flex","alignItems":"center","justifyContent":"space-between"}}>
                    <div className="dsh-action-title">AI Matching</div>
                    <span className="dsh-action-pill-count purple">Smart</span>
                  </div>
                  <div className="dsh-action-sub">Find optimal matches</div>
                </div>
              </div>

              <div className="dsh-action-card" onClick={() => { showSection('challenges'); if (window.filterChallengesByTab) window.filterChallengesByTab('assigned'); }}>
                <div className="dsh-action-icon" style={{"background":"#EFF6FF","color":"#2563EB"}}>&#127891;</div>
                <div style={{"flex":"1","minWidth":"0"}}>
                  <div style={{"display":"flex","alignItems":"center","justifyContent":"space-between"}}>
                    <div className="dsh-action-title">Assign University</div>
                    <span className="dsh-action-pill-count blue" id="dshQuickUnivCount">8 Univs</span>
                  </div>
                  <div className="dsh-action-sub">Allocate to R&D cells</div>
                </div>
              </div>

              <div className="dsh-action-card" onClick={() => { showSection('industry'); }}>
                <div className="dsh-action-icon" style={{"background":"#FFF7ED","color":"#EA580C"}}>&#127970;</div>
                <div style={{"flex":"1","minWidth":"0"}}>
                  <div style={{"display":"flex","alignItems":"center","justifyContent":"space-between"}}>
                    <div className="dsh-action-title">Assign Industry</div>
                    <span className="dsh-action-pill-count orange" id="dshQuickIndCount">6 CSR</span>
                  </div>
                  <div className="dsh-action-sub">Connect funding & CSR</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ROW 3: 3 REAL DATA TABLES (RECENT PROBLEMS, TOP UNIVERSITIES, CSR CONTRIBUTION) */}
        <div className="dsh-tables-grid">
          {/* Table 1: Recent Problems */}
          <div className="dsh-panel">
            <div className="dsh-panel-header">
              <div className="dsh-panel-title">
                <span className="dsh-icon-sq-sm blue">&#128203;</span>
                <span>Recent Citizen Problems</span>
              </div>
              <button className="dsh-btn-link" onClick={() => { showSection('challenges'); }}>View All &rarr;</button>
            </div>
            <div className="dsh-table-wrap">
              <table className="dsh-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Location</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody id="dshRecentProblemsBody">
                  <tr onClick={() => { if(window.openChallengeAction) window.openChallengeAction('6aa6dd7d4403e99e76314153'); }} style={{"cursor":"pointer"}}>
                    <td className="dsh-cell-id">JH-2026-314153</td>
                    <td className="dsh-cell-title">Poor access to quality education in rural areas...</td>
                    <td>North Delhi</td>
                    <td>Rural Livelihoods</td>
                    <td><span className="dsh-tag pending">Pending</span></td>
                    <td style={{"color":"#64748B"}}>Just now</td>
                  </tr>
                  <tr onClick={() => { if(window.openChallengeAction) window.openChallengeAction('6aa6dd7c4403e99e76314120'); }} style={{"cursor":"pointer"}}>
                    <td className="dsh-cell-id">JH-2026-314120</td>
                    <td className="dsh-cell-title">No Solar Energy Access for Off-Grid Villages...</td>
                    <td>Latehar</td>
                    <td>Energy & Tech</td>
                    <td><span className="dsh-tag working">Working</span></td>
                    <td style={{"color":"#64748B"}}>1h ago</td>
                  </tr>
                  <tr onClick={() => { if(window.openChallengeAction) window.openChallengeAction('6aa6dd7c4403e99e7631411d'); }} style={{"cursor":"pointer"}}>
                    <td className="dsh-cell-id">JH-2026-31411D</td>
                    <td className="dsh-cell-title">Bureaucratic Delays in Issuance of Certificates...</td>
                    <td>Hazaribagh</td>
                    <td>Public Admin</td>
                    <td><span className="dsh-tag review">Under Review</span></td>
                    <td style={{"color":"#64748B"}}>2h ago</td>
                  </tr>
                  <tr onClick={() => { if(window.openChallengeAction) window.openChallengeAction('6aa6dd7c4403e99e7631411a'); }} style={{"cursor":"pointer"}}>
                    <td className="dsh-cell-id">JH-2026-31411A</td>
                    <td className="dsh-cell-title">Smart Waste Management System Required for Ranchi...</td>
                    <td>Ranchi</td>
                    <td>Urban Infra</td>
                    <td><span className="dsh-tag working">Working</span></td>
                    <td style={{"color":"#64748B"}}>3h ago</td>
                  </tr>
                  <tr onClick={() => { if(window.openChallengeAction) window.openChallengeAction('6aa6dd7c4403e99e76314114'); }} style={{"cursor":"pointer"}}>
                    <td className="dsh-cell-id">JH-2026-314114</td>
                    <td className="dsh-cell-title">Forest-Dependent Communities Losing Livelihoods...</td>
                    <td>West Singhbhum</td>
                    <td>Environment</td>
                    <td><span className="dsh-tag verified">Verified</span></td>
                    <td style={{"color":"#64748B"}}>4h ago</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 2: Top Performing Universities */}
          <div className="dsh-panel">
            <div className="dsh-panel-header">
              <div className="dsh-panel-title">
                <span className="dsh-icon-sq-sm purple">&#127891;</span>
                <span>Top Performing Universities</span>
              </div>
              <button className="dsh-btn-link" onClick={() => { showSection('universities'); }}>View All &rarr;</button>
            </div>
            <div className="dsh-table-wrap">
              <table className="dsh-table">
                <thead>
                  <tr>
                    <th style={{"width":"18px","textAlign":"center"}}>#</th>
                    <th>University</th>
                    <th style={{"textAlign":"center"}}>Assigned</th>
                    <th style={{"textAlign":"center"}}>Completed</th>
                    <th>Progress</th>
                    <th style={{"textAlign":"center"}}>Success Rate</th>
                  </tr>
                </thead>
                <tbody id="dshUnivLeaderboardBody">
                  <tr onClick={() => { showSection('universities'); }} style={{"cursor":"pointer"}}>
                    <td style={{"fontWeight":"700","color":"#64748B","textAlign":"center"}}>1</td>
                    <td style={{"fontWeight":"650","color":"#0F172A"}}>IIT (ISM) Dhanbad</td>
                    <td style={{"textAlign":"center"}}>20</td>
                    <td style={{"textAlign":"center"}}>16</td>
                    <td>
                      <div className="dsh-progress-bar-wrap">
                        <div className="dsh-progress-track"><div className="dsh-progress-fill" style={{"width":"80%"}}></div></div>
                        <span style={{"fontSize":"11px","fontWeight":"700","color":"#059669"}}>80%</span>
                      </div>
                    </td>
                    <td style={{"fontWeight":"700","color":"#059669","textAlign":"center"}}>94%</td>
                  </tr>
                  <tr onClick={() => { showSection('universities'); }} style={{"cursor":"pointer"}}>
                    <td style={{"fontWeight":"700","color":"#64748B","textAlign":"center"}}>2</td>
                    <td style={{"fontWeight":"650","color":"#0F172A"}}>BIT Mesra</td>
                    <td style={{"textAlign":"center"}}>19</td>
                    <td style={{"textAlign":"center"}}>14</td>
                    <td>
                      <div className="dsh-progress-bar-wrap">
                        <div className="dsh-progress-track"><div className="dsh-progress-fill" style={{"width":"74%"}}></div></div>
                        <span style={{"fontSize":"11px","fontWeight":"700","color":"#059669"}}>74%</span>
                      </div>
                    </td>
                    <td style={{"fontWeight":"700","color":"#059669","textAlign":"center"}}>91%</td>
                  </tr>
                  <tr onClick={() => { showSection('universities'); }} style={{"cursor":"pointer"}}>
                    <td style={{"fontWeight":"700","color":"#64748B","textAlign":"center"}}>3</td>
                    <td style={{"fontWeight":"650","color":"#0F172A"}}>BAU Ranchi</td>
                    <td style={{"textAlign":"center"}}>18</td>
                    <td style={{"textAlign":"center"}}>12</td>
                    <td>
                      <div className="dsh-progress-bar-wrap">
                        <div className="dsh-progress-track"><div className="dsh-progress-fill" style={{"width":"67%"}}></div></div>
                        <span style={{"fontSize":"11px","fontWeight":"700","color":"#059669"}}>67%</span>
                      </div>
                    </td>
                    <td style={{"fontWeight":"700","color":"#059669","textAlign":"center"}}>78%</td>
                  </tr>
                  <tr onClick={() => { showSection('universities'); }} style={{"cursor":"pointer"}}>
                    <td style={{"fontWeight":"700","color":"#64748B","textAlign":"center"}}>4</td>
                    <td style={{"fontWeight":"650","color":"#0F172A"}}>NIT Jamshedpur</td>
                    <td style={{"textAlign":"center"}}>15</td>
                    <td style={{"textAlign":"center"}}>12</td>
                    <td>
                      <div className="dsh-progress-bar-wrap">
                        <div className="dsh-progress-track"><div className="dsh-progress-fill" style={{"width":"80%"}}></div></div>
                        <span style={{"fontSize":"11px","fontWeight":"700","color":"#059669"}}>80%</span>
                      </div>
                    </td>
                    <td style={{"fontWeight":"700","color":"#059669","textAlign":"center"}}>87%</td>
                  </tr>
                  <tr onClick={() => { showSection('universities'); }} style={{"cursor":"pointer"}}>
                    <td style={{"fontWeight":"700","color":"#64748B","textAlign":"center"}}>5</td>
                    <td style={{"fontWeight":"650","color":"#0F172A"}}>Ranchi University</td>
                    <td style={{"textAlign":"center"}}>14</td>
                    <td style={{"textAlign":"center"}}>10</td>
                    <td>
                      <div className="dsh-progress-bar-wrap">
                        <div className="dsh-progress-track"><div className="dsh-progress-fill" style={{"width":"71%"}}></div></div>
                        <span style={{"fontSize":"11px","fontWeight":"700","color":"#059669"}}>71%</span>
                      </div>
                    </td>
                    <td style={{"fontWeight":"700","color":"#059669","textAlign":"center"}}>82%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 3: Industry / CSR Contribution */}
          <div className="dsh-panel">
            <div className="dsh-panel-header">
              <div className="dsh-panel-title">
                <span className="dsh-icon-sq-sm orange">&#127970;</span>
                <span>Industry & CSR Contribution</span>
              </div>
              <button className="dsh-btn-link" onClick={() => { showSection('industry'); }}>View All &rarr;</button>
            </div>
            <div className="dsh-table-wrap">
              <table className="dsh-table">
                <thead>
                  <tr>
                    <th>Partner</th>
                    <th style={{"textAlign":"center"}}>Funding / Support</th>
                    <th style={{"textAlign":"center"}}>Projects Supported</th>
                    <th style={{"textAlign":"center"}}>Sector</th>
                  </tr>
                </thead>
                <tbody id="dshIndustryLeaderboardBody">
                  <tr onClick={() => { showSection('industry'); }} style={{"cursor":"pointer"}}>
                    <td style={{"fontWeight":"650","color":"#0F172A"}}>Tata Steel Foundation</td>
                    <td style={{"fontWeight":"750","color":"#002D62","textAlign":"center"}}>₹50 L</td>
                    <td style={{"fontWeight":"700","color":"#334155","textAlign":"center"}}>17</td>
                    <td style={{"textAlign":"center"}}><span className="dsh-tag verified" style={{"fontSize":"10px"}}>CSR & Innovation</span></td>
                  </tr>
                  <tr onClick={() => { showSection('industry'); }} style={{"cursor":"pointer"}}>
                    <td style={{"fontWeight":"650","color":"#0F172A"}}>Apex Engineering & Testing Labs</td>
                    <td style={{"fontWeight":"750","color":"#002D62","textAlign":"center"}}>₹35 L</td>
                    <td style={{"fontWeight":"700","color":"#334155","textAlign":"center"}}>8</td>
                    <td style={{"textAlign":"center"}}><span className="dsh-tag verified" style={{"fontSize":"10px"}}>Urban Infra</span></td>
                  </tr>
                  <tr onClick={() => { showSection('industry'); }} style={{"cursor":"pointer"}}>
                    <td style={{"fontWeight":"650","color":"#0F172A"}}>Jharkhand Medical Supplies Corp</td>
                    <td style={{"fontWeight":"750","color":"#002D62","textAlign":"center"}}>₹25 L</td>
                    <td style={{"fontWeight":"700","color":"#334155","textAlign":"center"}}>4</td>
                    <td style={{"textAlign":"center"}}><span className="dsh-tag verified" style={{"fontSize":"10px"}}>Healthcare</span></td>
                  </tr>
                  <tr onClick={() => { showSection('industry'); }} style={{"cursor":"pointer"}}>
                    <td style={{"fontWeight":"650","color":"#0F172A"}}>CSIR - NEERI Innovation Wing</td>
                    <td style={{"fontWeight":"750","color":"#002D62","textAlign":"center"}}>₹15 L</td>
                    <td style={{"fontWeight":"700","color":"#334155","textAlign":"center"}}>7</td>
                    <td style={{"textAlign":"center"}}><span className="dsh-tag verified" style={{"fontSize":"10px"}}>Environment</span></td>
                  </tr>
                  <tr onClick={() => { showSection('industry'); }} style={{"cursor":"pointer"}}>
                    <td style={{"fontWeight":"650","color":"#0F172A"}}>Jharkhand Startup Hub</td>
                    <td style={{"fontWeight":"750","color":"#002D62","textAlign":"center"}}>₹10 L</td>
                    <td style={{"fontWeight":"700","color":"#334155","textAlign":"center"}}>9</td>
                    <td style={{"textAlign":"center"}}><span className="dsh-tag verified" style={{"fontSize":"10px"}}>Startup Support</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ROW 4: FOOTER QUOTE & TRICOLOR BANNER */}
        <div className="dsh-footer-bar">
          <div className="dsh-footer-quote">
            <span className="dsh-footer-quote-mark">&ldquo;</span>
            <span>Collective innovation for a stronger, inclusive and developed Jharkhand.</span>
          </div>
          <div className="dsh-footer-right">
            <div className="dsh-tricolor-wave"></div>
            <div className="dsh-footer-tags">People &nbsp;|&nbsp; Innovation &nbsp;|&nbsp; Impact</div>
          </div>
        </div>
      </div>
      {/* CHALLENGES */}
      <div id="section-challenges" className="dashboard-section">
        <div className="section-header">
          <div>
            <div className="section-title">Challenges</div>
            <div className="section-subtitle">Review, validate, assign and monitor challenges</div>
          </div>
          <div style={{"display":"flex","alignItems":"center","gap":"10px"}}>
            <div className="view-toggle-pills">
              <button type="button" id="chViewCardsBtn" className="view-toggle-pill active" onClick={() => { if (window.setChallengeViewMode) window.setChallengeViewMode('cards'); }} title="Card Grid View">
                <span>▦</span> Cards
              </button>
              <button type="button" id="chViewTableBtn" className="view-toggle-pill" onClick={() => { if (window.setChallengeViewMode) window.setChallengeViewMode('table'); }} title="Table View">
                <span>▤</span> Table
              </button>
            </div>
            <button onClick={() => { if (window.exportChallenges) window.exportChallenges(); }} className="btn btn-ghost btn-sm">&#11015; Export CSV</button>
          </div>
        </div>
        <div className="filter-bar">
          <div className="search-wrap">
            <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" className="search-input" placeholder="Search challenges..." id="adminChallengeSearch" onInput={() => { if (window.debounceLoadChallenges) window.debounceLoadChallenges(); }} />
          </div>

          <div className="status-tab-group" id="adminChallengeStatusTabs">
            <button
              type="button"
              className="status-tab-btn active"
              data-status=""
              onClick={() => { if (window.filterChallengesByTab) window.filterChallengesByTab(''); }}
            >
              All
            </button>
            <button
              type="button"
              className="status-tab-btn"
              data-status="pending"
              onClick={() => { if (window.filterChallengesByTab) window.filterChallengesByTab('pending'); }}
            >
              Pending
            </button>
            <button
              type="button"
              className="status-tab-btn"
              data-status="assigned"
              onClick={() => { if (window.filterChallengesByTab) window.filterChallengesByTab('assigned'); }}
            >
              Assigned
            </button>
            <button
              type="button"
              className="status-tab-btn"
              data-status="resolved"
              onClick={() => { if (window.filterChallengesByTab) window.filterChallengesByTab('resolved'); }}
            >
              Resolved
            </button>
          </div>
        </div>

        {/* MODERN CHALLENGES CARDS GRID (DEFAULT) */}
        <div id="challengesCardsContainer" className="challenges-cards-grid">
          <div style={{"textAlign":"center","padding":"50px","gridColumn":"1/-1"}}><div className="spinner" style={{"margin":"0 auto"}}></div></div>
        </div>

        {/* COMPACT TABLE VIEW (TOGGLEABLE) */}
        <div className="table-container" id="challengesTableContainer" style={{"display":"none"}}>
          <table className="table" id="challengesTable">
            <thead><tr><th>ID / Title</th><th>Category</th><th>Priority</th><th>Status</th><th>District</th><th>Submitter</th><th>Assigned To</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody id="challengesTableBody"><tr><td colspan="9" style={{"textAlign":"center","padding":"40px"}}><div className="spinner" style={{"margin":"0 auto"}}></div></td></tr></tbody>
          </table>
        </div>
        <div id="adminChallengesPagination" style={{"marginTop":"16px","display":"flex","gap":"6px","justifyContent":"center"}}></div>
      </div>
      {/* SOLUTION PROPOSALS & INDUSTRY MATCHING */}
      <div id="section-proposals" className="dashboard-section">
        <div className="section-header">
          <div>
            <div className="section-title">Solution Proposals & Industry Matching</div>
            <div className="section-subtitle">Review university project proposals, verify funding & documents, and match approved proposals with eligible industry partners</div>
          </div>
          <div>
            <button onClick={() => { if (window.loadAdminProposals) window.loadAdminProposals(); }} className="btn btn-ghost btn-sm">&#8635; Refresh</button>
          </div>
        </div>

        {/* Proposals List View */}
        <div id="proposalsListView">
          <div className="filter-bar">
            <div className="search-wrap">
              <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" className="search-input" placeholder="Search proposals by problem, university, or submitter..." id="proposalSearchInput" onInput={() => { if (window.filterProposalsList) window.filterProposalsList(); }} />
            </div>
            <select className="filter-select" id="proposalStatusFilter" onChange={() => { if (window.filterProposalsList) window.filterProposalsList(); }}>
              <option value="all">All Statuses</option>
              <option value="submitted">Submitted (Pending Review)</option>
              <option value="approved">Approved</option>
              <option value="changes_requested">Changes Requested</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="table-container">
            <table className="table" id="proposalsTable">
              <thead>
                <tr>
                  <th>Problem / Project</th>
                  <th>University</th>
                  <th>Submitted By</th>
                  <th>Funding Ask</th>
                  <th>Required Support</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="proposalsTableBody">
                <tr><td colSpan="8" style={{"textAlign":"center","padding":"40px"}}><div className="spinner" style={{"margin":"0 auto"}}></div></td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Proposal Detail View (renders the exact Detail Card from specification) */}
        <div id="proposalDetailView" style={{"display":"none"}}>
          <div id="proposalDetailCardContent"></div>
        </div>
      </div>
      {/* PENDING VALIDATION */}
      <div id="section-pending" className="dashboard-section">
        <div className="section-header"><div><div className="section-title">Pending Validation</div><div className="section-subtitle">New challenges awaiting admin review and AI quality analysis</div></div></div>
        <div className="table-container">
          <table className="table"><thead><tr><th>ID / Title</th><th>Category</th><th>Priority</th><th>District</th><th>Quality Score</th><th>Submitted</th><th>Actions</th></tr></thead>
          <tbody id="pendingTableBody"><tr><td colspan="7" style={{"textAlign":"center","padding":"40px"}}><div className="spinner" style={{"margin":"0 auto"}}></div></td></tr></tbody></table>
        </div>
      </div>
      {/* AI MATCHING CENTER */}
      <div id="section-aimatching" className="dashboard-section">
        <div className="section-header" style={{"display":"flex","alignItems":"center","justifyContent":"space-between","flexWrap":"wrap","gap":"14px"}}>
          <div>
            <div className="section-title" style={{"display":"flex","alignItems":"center","gap":"10px"}}>
              <span>&#9889; AI Matching Center</span>
              <span className="badge badge-green" style={{"fontSize":"11px","fontWeight":"800","padding":"3px 10px"}}>LIVE NEURAL ENGINE</span>
            </div>
            <div className="section-subtitle">Real-time AI-powered matching between civic problems, universities, and industry CSR partners across Jharkhand</div>
          </div>
          <div style={{"display":"flex","alignItems":"center","gap":"10px"}}>
            <button type="button" className="btn btn-batch-optimizer" onClick={() => window.openAIBatchOptimizerModal && window.openAIBatchOptimizerModal()} style={{"display":"inline-flex","alignItems":"center","gap":"8px","padding":"10px 18px","borderRadius":"10px"}}>
              <span>&#9889;</span>
              <span>Batch AI Optimizer</span>
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => window.loadAIMatchingSection && window.loadAIMatchingSection()} title="Re-sync data" style={{"fontWeight":"700"}}>
              &#8635; Refresh
            </button>
          </div>
        </div>

        {/* Top AI Telemetry Strip */}
        <div className="aimatch-telemetry-strip">
          <div className="aimatch-telemetry-card">
            <div className="aimatch-telemetry-icon" style={{"background":"#eff6ff","color":"#1e40af"}}>&#127891;</div>
            <div>
              <div className="aimatch-telemetry-val">12</div>
              <div className="aimatch-telemetry-lbl">Active Jharkhand R&amp;D Labs</div>
            </div>
          </div>
          <div className="aimatch-telemetry-card">
            <div className="aimatch-telemetry-icon" style={{"background":"#f0fdf4","color":"#16a34a"}}>&#127970;</div>
            <div>
              <div className="aimatch-telemetry-val">&#8377;4.20 Cr</div>
              <div className="aimatch-telemetry-lbl">Committed CSR Capital</div>
            </div>
          </div>
          <div className="aimatch-telemetry-card">
            <div className="aimatch-telemetry-icon" style={{"background":"#fefce8","color":"#ca8a04"}}>&#9889;</div>
            <div>
              <div className="aimatch-telemetry-val">94.8%</div>
              <div className="aimatch-telemetry-lbl">Avg. Match Accuracy</div>
            </div>
          </div>
          <div className="aimatch-telemetry-card">
            <div className="aimatch-telemetry-icon" style={{"background":"#faf5ff","color":"#7e22ce"}}>&#9201;</div>
            <div>
              <div className="aimatch-telemetry-val">42 Days</div>
              <div className="aimatch-telemetry-lbl">Avg. Problem Turnaround</div>
            </div>
          </div>
        </div>

        {/* Main 2-Column Command Grid */}
        <div className="grid-2" style={{"alignItems":"start","gap":"24px"}}>
          <div>
            <div className="card" style={{"marginBottom":"16px","borderRadius":"18px","border":"1px solid #e2e8f0","boxShadow":"0 4px 16px rgba(0,45,98,0.05)"}}>
              <div className="card-body" id="aiMatchingChallengeList" style={{"padding":"20px"}}>
                <div className="skeleton" style={{"height":"80px","marginBottom":"10px"}}></div>
                <div className="skeleton" style={{"height":"80px","marginBottom":"10px"}}></div>
                <div className="skeleton" style={{"height":"80px"}}></div>
              </div>
            </div>
          </div>
          <div id="aiMatchingPanel">
            <div style={{"padding":"60px 30px","textAlign":"center","background":"white","borderRadius":"20px","border":"1px solid #e2e8f0","boxShadow":"0 4px 16px rgba(0,45,98,0.05)"}}>
              <div className="spinner" style={{"margin":"0 auto 16px"}}></div>
              <div style={{"fontSize":"16px","fontWeight":"800","color":"#0f172a","marginBottom":"6px"}}>Connecting to JanSetu AI Engine...</div>
              <div style={{"fontSize":"13px","color":"#64748b"}}>Analyzing domain capabilities and real-time partner performance</div>
            </div>
          </div>
        </div>
      </div>
      {/* ASSIGNED */}
      <div id="section-assigned" className="dashboard-section">
        <div className="section-header"><div><div className="section-title">Assigned Challenges</div><div className="section-subtitle">Active challenges assigned to universities</div></div></div>
        <div className="table-container"><table className="table"><thead><tr><th>ID / Title</th><th>Category</th><th>University</th><th>Status</th><th>Deadline</th><th>Days Left</th><th>Actions</th></tr></thead>
        <tbody id="assignedTableBody"><tr><td colspan="7" style={{"textAlign":"center","padding":"40px"}}><div className="spinner" style={{"margin":"0 auto"}}></div></td></tr></tbody></table></div>
      </div>
      {/* SLA */}
      <div id="section-sla" className="dashboard-section">
        <div className="section-header"><div><div className="section-title">&#9888; SLA Monitoring</div><div className="section-subtitle">Overdue and escalated challenges requiring immediate action</div></div></div>
        <div className="metrics-grid" style={{"gridTemplateColumns":"repeat(3,1fr)"}} id="slaMetrics">
          <div className="skeleton" style={{"height":"100px"}}></div><div className="skeleton" style={{"height":"100px"}}></div><div className="skeleton" style={{"height":"100px"}}></div>
        </div>
        <div className="card">
          <div className="card-header"><div><div className="card-title">Overdue Challenges</div><div className="card-subtitle">Requires immediate action</div></div></div>
          <div id="slaList"><div className="skeleton" style={{"height":"70px","margin":"16px 22px 8px"}}></div><div className="skeleton" style={{"height":"70px","margin":"0 22px 16px"}}></div></div>
        </div>
      </div>
      {/* RESOLVED */}
      <div id="section-resolved" className="dashboard-section">
        <div className="section-header"><div><div className="section-title">&#9989; Resolved Challenges</div><div className="section-subtitle">Successfully completed challenges</div></div></div>
        <div className="table-container"><table className="table"><thead><tr><th>ID / Title</th><th>Category</th><th>University</th><th>Resolved On</th><th>Impact Score</th><th>Actions</th></tr></thead>
        <tbody id="resolvedTableBody"><tr><td colspan="6" style={{"textAlign":"center","padding":"40px"}}><div className="spinner" style={{"margin":"0 auto"}}></div></td></tr></tbody></table></div>
      </div>
      {/* CITIZENS */}
      <div id="section-users" className="dashboard-section">
        <div className="section-header"><div><div className="section-title">Citizens</div><div className="section-subtitle">Manage platform users and their permissions</div></div></div>
        <div className="filter-bar">
          <div className="search-wrap"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><input type="text" className="search-input" placeholder="Search users..." id="userSearch" oninput="debounceLoadUsers()" /></div>
          <select className="filter-select" id="userRoleFilter" onChange={(e) => { loadUsers() }}><option value="">All Roles</option><option value="citizen">Citizen</option><option value="university_rep">University Rep</option><option value="industry_rep">Industry Rep</option><option value="admin">Admin</option></select>
        </div>
        <div className="table-container"><table className="table"><thead><tr><th>User</th><th>Role</th><th>Email</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
        <tbody id="usersTableBody"><tr><td colspan="6" style={{"textAlign":"center","padding":"40px"}}><div className="spinner" style={{"margin":"0 auto"}}></div></td></tr></tbody></table></div>
        <div id="usersPagination" style={{"marginTop":"16px","display":"flex","gap":"6px","justifyContent":"center"}}></div>
      </div>
      {/* UNIVERSITIES */}
      <div id="section-universities" className="dashboard-section">
        <div className="section-header"><div><div className="section-title">Universities</div><div className="section-subtitle">Partner universities — capacity, expertise and performance data</div></div></div>
        <div className="grid-auto" id="univGrid"><div className="skeleton" style={{"height":"320px"}}></div><div className="skeleton" style={{"height":"320px"}}></div><div className="skeleton" style={{"height":"320px"}}></div></div>
      </div>
      {/* INDUSTRY */}
      <div id="section-industry" className="dashboard-section">
        <div className="section-header"><div><div className="section-title">Industry / CSR Partners</div><div className="section-subtitle">Industry collaborators — CSR budget, capabilities and availability</div></div></div>
        <div className="grid-auto" id="industryGrid"><div className="skeleton" style={{"height":"320px"}}></div><div className="skeleton" style={{"height":"320px"}}></div></div>
      </div>
      {/* PAN-INDIA & DISTRICT HEATMAP */}
      <div id="section-heatmap" className="dashboard-section">
        <div className="section-header">
          <div>
            <div className="section-title">🗺️ Pan-India & District Civic Heatmap</div>
            <div className="section-subtitle">Select any Indian state from the dropdown to zoom in and analyze district-level challenges, density & priority hotspots.</div>
          </div>
          <div className="heatmap-legend">
            <div className="hm-legend-item"><div className="hm-dot" style={{"background":"#DC2626"}}></div>High Priority</div>
            <div className="hm-legend-item"><div className="hm-dot" style={{"background":"#D97706"}}></div>Medium</div>
            <div className="hm-legend-item"><div className="hm-dot" style={{"background":"#059669"}}></div>Low / Resolved</div>
          </div>
        </div>

        <div className="heatmap-toolbar">
          <div style={{"display":"flex","alignItems":"center","gap":"8px"}}>
            <span style={{"fontSize":"13px","fontWeight":"800","color":"var(--navy)","whiteSpace":"nowrap"}}>📍 Select State:</span>
            <select id="adminStateSelect" className="form-control" style={{"minWidth":"260px","fontWeight":"750"}}>
              <option value="ALL" selected>🇮🇳 All India (Overview & State Clusters)</option>
              <option value="Jharkhand">Jharkhand (24 Districts Focus)</option>
            </select>
          </div>

          <div style={{"display":"flex","alignItems":"center","gap":"8px"}}>
            <span style={{"fontSize":"13px","fontWeight":"800","color":"var(--gray-600)","whiteSpace":"nowrap"}}>Domain:</span>
            <select id="adminMapCategoryFilter" className="form-control" style={{"minWidth":"180px","fontWeight":"600"}}>
              <option value="">All Categories</option>
              <option>Water Management</option>
              <option>Healthcare</option>
              <option>Agriculture</option>
              <option>Education</option>
              <option>Sanitation & Environment</option>
              <option>Rural Livelihoods</option>
              <option>Urban Infrastructure</option>
              <option>Energy & Technology</option>
            </select>
          </div>

          <div style={{"marginLeft":"auto","display":"flex","gap":"8px","alignItems":"center"}}>
            <span className="badge badge-navy" style={{"fontSize":"11px"}}>28 States & UTs</span>
            <span className="badge badge-green" style={{"fontSize":"11px"}}>Real-Time Sync</span>
          </div>
        </div>

        <div className="grid-2" style={{"alignItems":"start"}}>
          <div id="jharkhand-heatmap"></div>
          <div className="card" id="districtDetailPanel">
            <div className="card-body" style={{"textAlign":"center","padding":"40px"}}>
              <div style={{"fontSize":"40px","marginBottom":"10px"}}>🗺️</div>
              <div style={{"fontSize":"15px","fontWeight":"800","color":"var(--gray-900)"}}>Select a State or Click a District</div>
              <div style={{"fontSize":"13px","color":"var(--gray-400)","marginTop":"4px"}}>Click any cluster on the map or select from the dropdown to view real-time civic intelligence.</div>
            </div>
          </div>
        </div>
      </div>
      {/* NOTIFICATIONS */}
      <div id="section-notifications" className="dashboard-section">
        <div className="section-header"><div><div className="section-title">&#128276; Notifications Center</div><div className="section-subtitle">Platform alerts and broadcast messaging</div></div></div>
        <div className="grid-2" style={{"alignItems":"start"}}>
          <div>
            <div className="card" style={{"marginBottom":"20px"}}>
              <div className="card-header"><div><div className="card-title">Pending Actions</div><div className="card-subtitle" id="notifCountLabel">Loading...</div></div></div>
              <div id="notificationsList"><div className="skeleton" style={{"height":"60px","margin":"16px 22px 8px"}}></div><div className="skeleton" style={{"height":"60px","margin":"0 22px 16px"}}></div></div>
            </div>
          </div>
          <div className="card">
            <div className="card-header"><div><div className="card-title">&#128227; Send Broadcast</div><div className="card-subtitle">Notify specific user groups</div></div></div>
            <div className="card-body">
              <div className="broadcast-form">
                <div className="form-group">
                  <div className="form-label">Audience</div>
                  <div className="br-radio-group">
                    <div className="br-radio"><input type="radio" name="audience" id="aud-all" value="all" checked /><label htmlFor="aud-all">All Users</label></div>
                    <div className="br-radio"><input type="radio" name="audience" id="aud-citizens" value="citizen" /><label htmlFor="aud-citizens">Citizens</label></div>
                    <div className="br-radio"><input type="radio" name="audience" id="aud-univ" value="university_rep" /><label htmlFor="aud-univ">Universities</label></div>
                    <div className="br-radio"><input type="radio" name="audience" id="aud-ind" value="industry_rep" /><label htmlFor="aud-ind">Industry</label></div>
                  </div>
                </div>
                <div className="form-group"><label className="form-label" htmlFor="broadcastTitle">Title</label><input type="text" className="form-control" id="broadcastTitle" placeholder="Notification title..." /></div>
                <div className="form-group"><label className="form-label" htmlFor="broadcastMsg">Message</label><textarea className="broadcast-ta" id="broadcastMsg" placeholder="Type your broadcast message here..."></textarea></div>
                <button onClick={() => { sendBroadcast() }} className="btn btn-primary" style={{"width":"100%"}}>&#10148; Send Notification</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* ACTIVITY LOG */}
      <div id="section-activity" className="dashboard-section">
        <div className="section-header"><div><div className="section-title">Activity / Audit Log</div><div className="section-subtitle">All platform events, admin decisions, and system actions</div></div></div>
        <div className="card">
          <div id="activityLogList"><div className="skeleton" style={{"height":"60px","margin":"16px 22px 8px"}}></div><div className="skeleton" style={{"height":"60px","margin":"0 22px 8px"}}></div><div className="skeleton" style={{"height":"60px","margin":"0 22px 16px"}}></div></div>
        </div>
      </div>
    </div>
  </div>
</div>
{/* CHALLENGE DETAIL MODAL */}
<div className="modal-overlay" id="challengeActionModal">
  <div className="modal modal-lg">
    <div className="modal-header"><div><div className="modal-title" id="caTitle">Challenge Details</div><div className="modal-subtitle" id="caSubtitle"></div></div><button className="modal-close" onClick={() => { closeModal('challengeActionModal') }}>&#10005;</button></div>
    <div className="modal-body" id="caBody"><div style={{"textAlign":"center","padding":"40px"}}><div className="spinner" style={{"margin":"0 auto"}}></div></div></div>
    <div className="modal-footer" id="caFooter"></div>
  </div>
</div>
{/* AI ASSIGN MODAL */}
<div className="modal-overlay" id="assignModal">
  <div className="modal modal-sm">
    <div className="modal-header"><div><div className="modal-title">&#129302; AI-Assisted Assignment</div><div className="modal-subtitle" id="assignModalSubtitle">AI recommends the best match</div></div><button className="modal-close" onClick={() => { closeModal('assignModal') }}>&#10005;</button></div>
    <div className="modal-body" id="assignModalBody"><div style={{"textAlign":"center","padding":"30px"}}><div className="spinner" style={{"margin":"0 auto"}}></div></div></div>
    <div className="modal-footer" id="assignModalFooter"><button onClick={() => { closeModal('assignModal') }} className="btn btn-ghost">Cancel</button></div>
  </div>
</div>
{/* ASSIGN INDUSTRY MODAL */}
<div className="modal-overlay" id="assignIndustryModal">
  <div className="modal modal-sm">
    <div className="modal-header"><div><div className="modal-title">&#127970; Assign Industry Partner</div></div><button className="modal-close" onClick={() => { closeModal('assignIndustryModal') }}>&#10005;</button></div>
    <div className="modal-body">
      <div className="form-group"><label className="form-label">Select Industry Partner *</label><select className="form-control" id="assignIndSelect"><option value="">-- Choose Partner --</option></select></div>
      <div className="form-group"><label className="form-label">Role</label><select className="form-control" id="assignIndRole"><option value="funder">Funder</option><option value="mentor">Mentor</option><option value="co_developer">Co-Developer</option><option value="pilot_partner">Pilot Partner</option></select></div>
      <div className="form-group"><label className="form-label">Notes</label><textarea className="form-control" id="assignIndNotes" rows="3" placeholder="Any special instructions..."></textarea></div>
    </div>
    <div className="modal-footer"><button onClick={() => { closeModal('assignIndustryModal') }} className="btn btn-ghost">Cancel</button><button onClick={() => { confirmAssignIndustry() }} className="btn btn-primary" id="assignIndConfirmBtn">Assign</button></div>
  </div>
</div>
<div id="adminToast" style={{"display":"none","position":"fixed","bottom":"24px","left":"50%","transform":"translateX(-50%)","background":"#0f172a","color":"white","padding":"10px 22px","borderRadius":"30px","fontSize":"13px","fontWeight":"700","zIndex":"9999","boxShadow":"0 10px 30px rgba(0,0,0,0.3)","alignItems":"center","gap":"8px","pointerEvents":"none","border":"1px solid rgba(255,255,255,0.15)"}}></div>
    </>
  );
}

export default App;
