import React, { useEffect, useState } from 'react';
import './citizenstyle.css';
import AIReportAgent from '../ai/AIReportAgent';
import AIFloatingTrigger from '../ai/AIFloatingTrigger';
import '../ai/voiceAgent.css';
import ExploreChallenges from './components/ExploreChallenges';

function App() {
  const [isVoiceAgentOpen, setIsVoiceAgentOpen] = useState(false);
  const [activePage, setActivePage] = useState('dashboard'); // 'dashboard' | 'explore'

  useEffect(() => {
    window.openAIVoiceReport = () => setIsVoiceAgentOpen(true);
    window.openExplorePage = () => {
      if (typeof window !== 'undefined' && typeof window.showJanSetuCivicLoader === 'function') {
        window.showJanSetuCivicLoader('Loading Explore Challenges...', { autoDismiss: false });
      }
      setActivePage('explore');
    };
    window.openExploreModal = () => {
      if (typeof window !== 'undefined' && typeof window.showJanSetuCivicLoader === 'function') {
        window.showJanSetuCivicLoader('Loading Explore Challenges...', { autoDismiss: false });
      }
      setActivePage('explore');
    };
    window.openDashboardPage = () => setActivePage('dashboard');
    window.toggleSidebarDrawer = () => {
      const sb = document.getElementById('citizenSidebar');
      if (sb) {
        if (window.innerWidth <= 768) {
          sb.classList.toggle('mobile-open');
        } else {
          sb.classList.toggle('collapsed');
        }
      }
    };
    const loadScript = (src) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = false;
      document.body.appendChild(script);
    };

    // Load scripts with cache buster so code fixes are picked up immediately across LAN
    const cb = `?v=${Date.now()}`;
    if (!window.showJanSetuCivicLoader) {
      loadScript('/others/js/jansetu-civic-loader.js' + cb);
    }
    loadScript('https://checkout.razorpay.com/v1/checkout.js');
    setTimeout(() => {
      loadScript('/citizen/translations.js' + cb);
      setTimeout(() => {
        loadScript('/citizen/citizen.js' + cb);
        setTimeout(() => loadScript('/citizen/citizenLogic.js' + cb), 200);
      }, 200);
    }, 200);
  }, []);

  return (
    <>
      

  <div className="app-layout">

    {/* Fixed Background Canvas Layer (Zero Lag / GPU Smooth) */}

    {/* Fixed Background Canvas with Indian Heritage & Flag Watermarks */}
    <div className="fixed-canvas-background">
      {/* Ashoka Chakra Watermark */}
      <svg style={{"position":"absolute","top":"40px","right":"60px","width":"340px","height":"340px","opacity":"0.045","pointerEvents":"none"}}
        viewBox="0 0 100 100" fill="none" stroke="#002D62">
        <circle cx="50" cy="50" r="45" stroke-width="2.5" />
        <circle cx="50" cy="50" r="10" stroke-width="2.5" />
        <circle cx="50" cy="50" r="3" fill="#002D62" />
        <g stroke-width="1.5">
          <line x1="50" y1="5" x2="50" y2="95" />
          <line x1="5" y1="50" x2="95" y2="50" />
          <line x1="18.18" y1="18.18" x2="81.82" y2="81.82" />
          <line x1="18.18" y1="81.82" x2="81.82" y2="18.18" />
          <line x1="32.7" y1="8.4" x2="67.3" y2="91.6" />
          <line x1="8.4" y1="32.7" x2="91.6" y2="67.3" />
          <line x1="67.3" y1="8.4" x2="32.7" y2="91.6" />
          <line x1="91.6" y1="32.7" x2="8.4" y2="67.3" />
          <line x1="41.3" y1="5.8" x2="58.7" y2="94.2" />
          <line x1="5.8" y1="41.3" x2="94.2" y2="58.7" />
          <line x1="58.7" y1="5.8" x2="41.3" y2="94.2" />
          <line x1="94.2" y1="41.3" x2="5.8" y2="58.7" />
        </g>
      </svg>

      {/* Indian Architectural Heritage Watermark Silhouette (Lal Qila / India Gate) */}
      <svg style={{"position":"absolute","bottom":"20px","left":"40px","width":"420px","height":"140px","opacity":"0.04","pointerEvents":"none"}}
        viewBox="0 0 300 100" fill="#002D62">
        <path
          d="M10 90 L10 50 L20 40 L30 50 L30 90 Z M40 90 L40 30 L55 15 L70 30 L70 90 Z M80 90 L80 40 L90 30 L100 40 L100 90 Z M110 90 L110 20 L130 5 L150 20 L150 90 Z M160 90 L160 40 L170 30 L180 40 L180 90 Z M190 90 L190 30 L205 15 L220 30 L220 90 Z M230 90 L230 50 L240 40 L250 50 L250 90 Z M120 90 A20 20 0 0 1 140 90 Z" />
      </svg>

      {/* Ashoka Lion Capital Emblem Watermark */}
      <svg style={{"position":"absolute","bottom":"100px","right":"80px","width":"180px","height":"180px","opacity":"0.035","pointerEvents":"none"}}
        viewBox="0 0 100 100" fill="#FF9933">
        <circle cx="50" cy="30" r="20" />
        <path d="M30 50 L70 50 L65 75 L35 75 Z M35 78 L65 78 L70 90 L30 90 Z" />
      </svg>
    </div>

    {/* ============================================================
       TRICOLOR THEMED SIDEBAR
       ============================================================ */}
    <aside className="sidebar" id="citizenSidebar">
      {/* Blurred Gateway of India Monument Background in Navbar */}
      <div className="sidebar-monument-bg"></div>
      {/* Royal Purple-Navy Glass Overlay */}
      <div className="sidebar-navy-scrim"></div>

      <div className="sidebar-tricolor-ribbon"></div>
      <div className="sidebar-brand-wrapper">
        <a href="/" className="sidebar-brand">
          <img src="/jansetu-logo.png" alt="JanSetu Logo" className="brand-icon-svg" style={{"width":"44px","height":"44px","borderRadius":"50%","objectFit":"cover","border":"1.5px solid rgba(255,255,255,0.7)","boxShadow":"0 2px 8px rgba(0,0,0,0.25)"}} onError={(e) => { e.target.src = '/citizen/jansetu-logo.png'; }} />
          <div className="brand-text-block">
            <span className="brand-title"><span className="brand-saffron">Jan</span><span className="brand-green">Setu</span></span>
            <span className="brand-tagline" data-i18n="brand_tagline">Your Voice, Real Change.</span>
          </div>
        </a>
        <button type="button" className="sidebar-collapse-btn" id="sidebarCollapseBtn" onClick={() => { toggleSidebarDrawer() }} title="Collapse navigation drawer">
          <svg viewBox="0 0 24 24">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </div>

      {/* Clean Navigation List with University-Panel Inspired Sections */}
      <nav className="sidebar-menu">
        <div className="sidebar-section-label">Citizen Services</div>
        <button
          className={`nav-item ${activePage === 'dashboard' ? 'active' : ''}`}
          onClick={() => {
            setActivePage('dashboard');
            const sb = document.getElementById('citizenSidebar');
            if (sb) sb.classList.remove('mobile-open');
            if (typeof navTo === 'function') navTo('dashboard');
          }}
        >
          <svg viewBox="0 0 24 24">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span data-i18n="sidebar_dashboard">Dashboard</span>
        </button>

        <button className="nav-item" onClick={() => { openAllReportsModal() }}>
          <svg viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          <span data-i18n="sidebar_my_reports">My Reports</span>
        </button>

        <button className="nav-item" id="navProblemChatBtn" onClick={() => { if (typeof window !== 'undefined' && window.openChatModal) window.openChatModal(); else if (typeof openChatModal === 'function') openChatModal(); }} style={{"position":"relative"}}>
          <svg viewBox="0 0 24 24">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span data-i18n="sidebar_problem_chat">Problem Chats</span>
          <span id="navChatUnreadDot" style={{"display":"none","width":"10px","height":"10px","backgroundColor":"#22C55E","borderRadius":"50%","marginLeft":"auto","boxShadow":"0 0 8px #22C55E"}} title="New Message"></span>
        </button>

        <button
          className={`nav-item ${activePage === 'explore' ? 'active' : ''}`}
          onClick={() => {
            if (activePage !== 'explore' && typeof window !== 'undefined' && typeof window.showJanSetuCivicLoader === 'function') {
              window.showJanSetuCivicLoader('Loading Explore Challenges...', { autoDismiss: false });
            }
            setActivePage('explore');
            const sb = document.getElementById('citizenSidebar');
            if (sb) sb.classList.remove('mobile-open');
          }}
        >
          <svg viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
          </svg>
          <span data-i18n="sidebar_explore">Explore Challenges</span>
        </button>

        <div className="sidebar-section-label" style={{"marginTop":"10px"}}>Account &amp; Settings</div>

        <button className="nav-item" onClick={() => { openProfileModal() }}>
          <svg viewBox="0 0 24 24">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span data-i18n="sidebar_profile">Profile</span>
        </button>

        <button className="nav-item" onClick={() => { openSettingsModal() }}>
          <svg viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <span data-i18n="sidebar_settings">Settings &amp; Preferences</span>
        </button>
      </nav>

      {/* Offline Draft Banner (Item 4) */}
      <div className="offline-draft-banner" id="offlineSidebarBanner">
        <div style={{"fontSize":"11px","fontWeight":"800","color":"#B45309"}} data-i18n="offline_title">📶 Offline Mode Active
        </div>
        <div style={{"fontSize":"10px","color":"#92400E","marginTop":"2px"}}>Drafts saved locally will sync when internet
          returns.</div>
        <button type="button" className="btn-sync-offline" onClick={() => { syncOfflineReports() }} data-i18n="btn_sync_now">Sync
          Now</button>
      </div>

      {/* Contribute Card: High-Contrast Heritage Card with Taj Mahal Background */}
      <div className="sidebar-contribute-card">
        <img src="/citizen/images/taj-mahal-bg.jpg" className="taj-mahal-card-bg" alt="Taj Mahal" onError={(e) => { e.currentTarget.src='images/taj-mahal-bg.jpg' }} />
        <div className="taj-mahal-card-scrim"></div>
        <div className="sidebar-card-content">
          <div className="sidebar-flag-badge"
            style={{"display":"inline-flex","alignItems":"center","gap":"6px","background":"rgba(255,153,51,0.28)","border":"1px solid rgba(255,153,51,0.6)","borderRadius":"12px","padding":"3px 10px","fontSize":"10.5px","fontWeight":"800","color":"#FFB066","marginBottom":"6px","backdropFilter":"blur(4px)"}}>
            <span style={{"fontSize":"12px"}}>🇮🇳</span><span data-i18n="sidebar_flag_badge">Public Grievance Redressal</span>
          </div>
          <div className="sidebar-card-title" data-i18n="contribute_title">📢 Report New Problem</div>
          <div className="sidebar-card-desc" data-i18n="contribute_desc">
            Directly notify district &amp; municipal authorities. Live tracking &amp; AI ground duplicate check.
          </div>
          <div className="sidebar-card-badges-row">
            <span className="sidebar-micro-pill">⚡ Fast Action</span>
            <span className="sidebar-micro-pill">📍 GPS Tagged</span>
          </div>
          <div className="sidebar-btn-group">
            <button type="button" className="btn-sidebar-report" onClick={() => { openReportModal(); }} title="Report a Problem Form">
              <span data-i18n="btn_report_problem">+ File Problem Report</span>
            </button>
            <button type="button" className="btn-sidebar-ai-voice" onClick={() => setIsVoiceAgentOpen(true)} title="Voice AI Report">
              <span>🎙️ Voice AI Se Report Karein</span>
            </button>
          </div>
        </div>
      </div>

      <div className="sidebar-tricolor-footer-ribbon"></div>
      <div className="sidebar-copyright">
        <div style={{"fontWeight":"700","color":"#E2E8F0","fontSize":"11.5px"}}>Government of Jharkhand</div>
        <div style={{"fontSize":"10px","color":"#94A3B8","marginTop":"2px"}}>Smart India Hackathon · PS2643</div>
        <div style={{"marginTop":"8px","paddingTop":"6px","borderTop":"1px solid rgba(255,255,255,0.1)","fontSize":"10.5px","color":"#CBD5E1","display":"flex","flexDirection":"column","gap":"2px"}}>
          <div style={{"display":"flex","alignItems":"center","gap":"5px","fontWeight":"700","color":"#E2E8F0","fontSize":"10px","textTransform":"uppercase","letterSpacing":"0.4px"}}>
            <span>✉️</span>
            <span>Contact Support:</span>
          </div>
          <a href="mailto:connectjansetu@gmail.com" style={{"color":"#FDBA74","textDecoration":"none","wordBreak":"break-all","fontWeight":"700","fontSize":"10.5px","transition":"color 0.2s ease"}} onMouseOver={(e) => e.currentTarget.style.color = '#FFFFFF'} onMouseOut={(e) => e.currentTarget.style.color = '#FDBA74'}>
            connectjansetu@gmail.com
          </a>
        </div>
      </div>
    </aside>
    {/* Mobile Drawer Overlay Backdrop */}
    <div
      className="sidebar-mobile-backdrop"
      onClick={() => {
        const sb = document.getElementById('citizenSidebar');
        if (sb) sb.classList.remove('mobile-open');
      }}
    ></div>

    <main className="main-viewport">

      {/* Top Panorama Banner with Full Aesthetic Indian Monuments & Abdul Kalam (Full Length) */}
      <header className={`top-panorama-wrapper ${activePage === 'explore' ? 'explore-header-minimal' : ''}`}>
        {activePage !== 'explore' && (
          <div className="panorama-monument-layer">
            <img src="/citizen/images/header.png" className="panorama-monument-photo" alt="Indian Monuments & APJ Abdul Kalam Banner"
              onError={(e) => { e.target.src = '/citizen/images/citizen-header-banner.png'; }} />
            <div className="panorama-monument-scrim"></div>
          </div>
        )}

        <div className="panorama-top-row">
          <div style={{"display":"flex","alignItems":"center","gap":"10px"}}>
            <button type="button" className="drawer-open-btn" id="drawerOpenBtn" onClick={() => { toggleSidebarDrawer() }} title="Toggle Navigation Drawer">
              <svg viewBox="0 0 24 24">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div className="gov-badge-tag" style={{"display":"inline-flex","alignItems":"center","gap":"8px"}}>
              <img src="/jansetu-logo.png" style={{"width":"22px","height":"22px","borderRadius":"50%","objectFit":"cover"}} alt="Logo" onError={(e) => { e.target.src = '/citizen/jansetu-logo.png'; }} />
              <span data-i18n="gov_tag">JanSetu · Government of Jharkhand</span>
            </div>
          </div>

          <div className="panorama-actions-right">
            {activePage !== 'explore' && (
              <>
                <div className="heritage-flag-pill"
                  style={{"display":"inline-flex","alignItems":"center","gap":"6px","background":"rgba(255,255,255,0.92)","border":"1px solid rgba(255,153,51,0.4)","borderRadius":"20px","padding":"3px 10px","fontSize":"11px","fontWeight":"800","color":"#002D62","boxShadow":"0 2px 6px rgba(255,153,51,0.15)"}}>
                  <span style={{"fontSize":"14px"}}>🇮🇳</span><span data-i18n="satyameva_tag">सत्यमेव जयते · झारखण्ड</span>
                </div>
                {/* 🌐 Language Switcher (हिन्दी / English / Hinglish) */}
                <div className="lang-switcher-pill">
                  <button type="button" className="lang-btn" id="langBtn_hi" onClick={() => { setLanguage('hi') }}>हिन्दी</button>
                  <button type="button" className="lang-btn" id="langBtn_en" onClick={() => { setLanguage('en') }}>English</button>
                  <button type="button" className="lang-btn active" id="langBtn_hinglish"
                    onClick={() => { setLanguage('hinglish') }}>Hinglish</button>
                </div>

                <div id="netStatusBadge"
                  style={{"fontSize":"11.5px","fontWeight":"700","color":"var(--india-green)","background":"rgba(255,255,255,0.92)","padding":"4px 10px","borderRadius":"20px","display":"flex","alignItems":"center","gap":"5px"}}>
                  <span style={{"width":"7px","height":"7px","borderRadius":"50%","background":"var(--india-green)"}}></span>
                  <span id="netStatusText">Online</span>
                </div>
              </>
            )}

            <button className="notif-bell-btn" onClick={() => { openNotificationsModal() }} title="Notifications">
              <svg viewBox="0 0 24 24">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span className="notif-pink-badge" id="topNotifCountBadge">2</span>
            </button>

            

            <div className="profile-pill" onClick={() => { openProfileModal() }}>
              <div className="profile-avatar-circle" id="userAvatarCircle">C</div>
              <div className="profile-text-meta">
                <span className="profile-name" id="userNameDisplay">Citizen</span>
                <span className="profile-role-tag" data-i18n="role_tag">Citizen · Jharkhand</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Quote Rotator Row (Auto-updates every 10 seconds in chosen language) - Dashboard only */}
        {activePage === 'dashboard' && (
          <div className="panorama-hero-row">
            <div className="hero-quote-container">
              <span className="hero-quote-mark-open">“</span>
              <div className="hero-quote-lines" id="heroQuoteLines">
                &#2310;&#2346;&#2325;&#2368; &#2310;&#2357;&#2366;&#2332;&#2364;, &#2310;&#2346;&#2325;&#2366;
                &#2309;&#2343;&#2367;&#2325;&#2368;&#2352;, <span className="highlight-green">&#2360;&#2361;&#2367;&#2340;
                  &#2361;&#2352; &#2360;&#2350;&#2360;&#2381;&#2351;&#2366;
                  &#2360;&#2369;&#2354;&#2332;&#2375;&#2327;&#2368;, &#2348;&#2338;&#2364;&#2375;&#2327;&#2366;
                  &#2361;&#2350;&#2366;&#2352;&#2366; &#2333;&#2366;&#2352;&#2326;&#2339;&#2381;&#2337;&#2308;</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button className="btn-report-hero" onClick={() => { openReportModal() }}>
                <svg viewBox="0 0 24 24">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span data-i18n="btn_report_hero">Report a Problem</span>
              </button>

              <button 
                type="button"
                className="btn-report-ai-hero"
                onClick={() => setIsVoiceAgentOpen(true)}
                style={{
                  background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 50%, #4f46e5 100%)',
                  color: '#ffffff',
                  border: '1px solid rgba(255,255,255,0.35)',
                  borderRadius: '12px',
                  padding: '11px 20px',
                  fontSize: '14.5px',
                  fontWeight: '700',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(37,99,235,0.35), 0 0 16px rgba(56,189,248,0.25)',
                  transition: 'all 0.25s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
                title="JanSetu Voice AI से बोलकर समस्या दर्ज करें"
              >
                <span style={{ fontSize: '18px' }}>🎙️</span>
                <span>AI Se Report Karein</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* DASHBOARD BODY CONTENT or EXPLORE CHALLENGES SOCIAL FEED */}
      {activePage === 'explore' ? (
        <ExploreChallenges onNavigateDashboard={() => setActivePage('dashboard')} />
      ) : (
        <div className="dashboard-content-body">

        {/* Action Required Banner (Item 7) */}
        <div className="action-required-banner" id="actionRequiredBanner" style={{"display":"none"}}>
          <div className="action-req-left">
            <span className="action-req-icon">⚠️</span>
            <div>
              <div className="action-req-title" data-i18n="action_req_title">Action Required: JanSetu requires more
                information</div>
              <div className="action-req-desc" id="actionReqText">Please provide landmark or fresh photo for the drinking
                water pipeline report.</div>
            </div>
          </div>
          <button className="btn-action-req" onClick={() => { openNeedInfoModal() }} data-i18n="btn_provide_info">Provide
            Information</button>
        </div>

        {/* 4 Stats Cards (Clean Single Language) */}
        <section className="stats-grid-row">
          <div className="stat-card-box">
            <div className="stat-icon-square saffron">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <div className="stat-card-info">
              <span className="stat-number-big" id="statTotal">12</span>
              <span className="stat-title-label" data-i18n="stat_reported">Problems Reported</span>
              <span className="stat-subtitle-small" data-i18n="stat_reported_sub">Total issues submitted</span>
            </div>
          </div>

          <div className="stat-card-box">
            <div className="stat-icon-square navy">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div className="stat-card-info">
              <span className="stat-number-big" id="statInProgress">3</span>
              <span className="stat-title-label" data-i18n="stat_working">Being Worked On</span>
              <span className="stat-subtitle-small" data-i18n="stat_working_sub">University taskforces</span>
            </div>
          </div>

          <div className="stat-card-box">
            <div className="stat-icon-square green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div className="stat-card-info">
              <span className="stat-number-big" id="statResolved">7</span>
              <span className="stat-title-label" data-i18n="stat_solved">Solved</span>
              <span className="stat-subtitle-small" data-i18n="stat_solved_sub">Ground resolution done</span>
            </div>
          </div>

          <div className="stat-card-box">
            <div className="stat-icon-square amber">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div className="stat-card-info">
              <span className="stat-number-big" id="statAwaiting">2</span>
              <span className="stat-title-label" data-i18n="stat_need_help">Need Your Help</span>
              <span className="stat-subtitle-small" data-i18n="stat_need_help_sub">Validation &amp; info needed</span>
            </div>
          </div>
        </section>

        {/* TWO-COLUMN BODY LAYOUT */}
        <div className="dashboard-two-col">

          {/* Left Column: Active Tracker & Recent Reports */}
          <div>

            {/* Active Tracker Hero Card */}
            <div className="section-header-row">
              <div style={{"display":"flex","alignItems":"center","gap":"10px"}}>
                <h3 className="section-header-title" data-i18n="section_active">Active Problem Progress Tracker</h3>
                <span id="activeTrackerCounterPill"
                  style={{"background":"#EFF6FF","color":"var(--navy)","fontSize":"11px","fontWeight":"800","padding":"2.5px 8px","borderRadius":"12px","border":"1px solid #BFDBFE"}}>1
                  of 1 Active</span>
              </div>
              <div style={{"display":"flex","alignItems":"center","gap":"8px"}}>
                <div className="recent-scroll-btns" id="trackerNavBtns" style={{"display":"inline-flex"}}>
                  <button type="button" className="scroll-arrow-btn" onClick={() => { prevActiveProblem(event) }}
                    title="Previous In-Progress Problem" aria-label="Previous">❮</button>
                  <button type="button" className="scroll-arrow-btn" onClick={() => { nextActiveProblem(event) }}
                    title="Next In-Progress Problem" aria-label="Next">❯</button>
                </div>
                <button type="button" className="btn-view-all-link"
                  onClick={() => { openAllReportsModal() }} data-i18n="btn_view_all">View All →</button>
              </div>
            </div>

            <div className="active-tracker-card" onClick={() => { openActiveReportDetail() }}>
              <div className="tracker-top-meta-row">
                <span className="tracker-report-id" id="activeReportId">Report ID: JH-2026-4819</span>
                <div style={{"display":"flex","alignItems":"center","gap":"8px","flexWrap":"wrap"}}>
                  <button type="button"
                    className="tracker-slip-btn"
                    id="trackerSlipBtn"
                    onClick={(event) => { event.stopPropagation(); const a = getCurrentlyTrackedReport(); if (a) openReportSlip(a.id); }}
                    title="Download Official Slip">
                    <span className="slip-icon">📄</span> <span>Slip</span>
                  </button>
                  <span id="activeTrackerDeleteAction"></span>
                  <span className="status-badge-in-progress" id="activeReportStatus">
                    <span className="tracker-pulse-dot"></span>
                    <span id="activeStatusLabelText">Being Worked On</span>
                  </span>
                </div>
              </div>

              <h4 className="tracker-title-large" id="activeReportTitle">
                Drinking Water Supply Broken — Piped Scheme Leakage in Village Namkum
              </h4>

              <div className="tracker-location-row" id="activeReportLoc">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>Namkum, Block Namkum, District Ranchi, Jharkhand</span>
              </div>

              {/* Detailed Grievance Description Card */}
              <div className="tracker-desc-box" id="activeReportDescBox"
                style={{"margin":"8px 0 12px 0","padding":"9px 13px","background":"#F8FAFC","border":"1.2px solid #E2E8F0","borderRadius":"10px","fontSize":"12.5px","color":"#334155","lineHeight":"1.5","display":"none"}}>
                <div style={{"fontWeight":"800","color":"#0F172A","fontSize":"10.5px","textTransform":"uppercase","letterSpacing":"0.5px","display":"flex","alignItems":"center","gap":"5px","marginBottom":"3px"}}>
                  <span>📝</span> <span>Grievance Description</span>
                </div>
                <div id="activeReportDesc" style={{"color":"#475569","fontWeight":"500","wordBreak":"break-word"}}>--</div>
              </div>

              {/* Official Admin Directive / Urgent Alert Container */}
              <div id="activeTrackerAdminMsg" style={{"display":"none"}}></div>

              {/* 5-Step Dynamic Timeline with Dates & Notes */}
              <div className="timeline-milestones-row">
                <div className="timeline-step-item">
                  <div className="timeline-dot-bubble" id="timelineStepSubmitted">1</div>
                  <div className="timeline-step-label" data-i18n="step_submitted">Submitted</div>
                  <div className="timeline-step-date" id="timelineDateSubmitted">--</div>
                  <div className="timeline-step-note" id="timelineNoteSubmitted">--</div>
                </div>
                <div className="timeline-connecting-line" id="timelineConn1"></div>
                <div className="timeline-step-item">
                  <div className="timeline-dot-bubble" id="timelineStepVerified">2</div>
                  <div className="timeline-step-label" data-i18n="step_verified">Admin Verified</div>
                  <div className="timeline-step-date" id="timelineDateVerified">--</div>
                  <div className="timeline-step-note" id="timelineNoteVerified">--</div>
                </div>
                <div className="timeline-connecting-line" id="timelineConn2"></div>
                <div className="timeline-step-item">
                  <div className="timeline-dot-bubble" id="timelineStepWorking">3</div>
                  <div className="timeline-step-label" data-i18n="step_working">Team Working</div>
                  <div className="timeline-step-date" id="timelineDateWorking">--</div>
                  <div className="timeline-step-note" id="timelineNoteWorking">--</div>
                </div>
                <div className="timeline-connecting-line" id="timelineConn3"></div>
                <div className="timeline-step-item">
                  <div className="timeline-dot-bubble" id="timelineStepResolution">4</div>
                  <div className="timeline-step-label" data-i18n="step_resolution">Implementation</div>
                  <div className="timeline-step-date" id="timelineDateResolution">--</div>
                  <div className="timeline-step-note" id="timelineNoteResolution">--</div>
                </div>
                <div className="timeline-connecting-line" id="timelineConn4"></div>
                <div className="timeline-step-item">
                  <div className="timeline-dot-bubble" id="timelineStepClosed">5</div>
                  <div className="timeline-step-label" data-i18n="step_closed">Closed</div>
                  <div className="timeline-step-date" id="timelineDateClosed">--</div>
                  <div className="timeline-step-note" id="timelineNoteClosed">--</div>
                </div>
              </div>

              {/* Estimated Resolution Time Line (Part 2.4) */}
              <div className="tracker-est-time-row" id="trackerEstTimeRow">
                <span className="tracker-est-time-icon">⏱️</span>
                <span id="trackerEstTimeText">Similar problems typically resolve in ~12 days. Yours was submitted recently.</span>
              </div>

              {/* Delivery-Tracking Style Live Update Message Feed (Part 2.2) */}
              <div className="tracker-live-feed-section" id="trackerLiveFeedSection"
                onClick={(e) => {
                  e.stopPropagation();
                  if (typeof window !== 'undefined' && typeof window.toggleLiveUpdatesExpansion === 'function') {
                    window.toggleLiveUpdatesExpansion();
                  }
                }}
                title="Click anywhere to expand or collapse updates">
                <div className="tracker-live-feed-header">
                  <div className="tracker-live-feed-title-wrap">
                    <span className="tracker-live-feed-icon">📬</span>
                    <span className="tracker-live-feed-title">Live Updates</span>
                    <span className="tracker-live-pulse-badge">
                      <span className="live-pulse-dot"></span> Live
                    </span>
                  </div>
                  <div className="tracker-live-feed-actions">
                    <span className="tracker-checking-updates-indicator" id="trackerCheckingUpdatesIndicator" style={{"display":"none"}}>
                      <span className="tracker-spin-sync">🔄</span> Checking...
                    </span>
                    <span className="tracker-feed-expand-badge" id="trackerFeedExpandBadge"></span>
                  </div>
                </div>

                <div className="tracker-live-feed-list" id="trackerLiveFeedList">
                  {/* Real-time pipeline update messages injected dynamically */}
                </div>
              </div>

              {/* Problem Solution Check Widget (Item 8) */}
              <div className="solution-check-box" id="solCheckBox" onClick={(e) => { e.stopPropagation(); }}>
                <div className="sol-check-title">
                  <span>🎯</span>
                  <span data-i18n="sol_check_title">Problem Solution Check</span>
                </div>
                <div className="sol-check-sub" data-i18n="sol_check_sub">
                  The authority and university team have reported the problem resolved. <strong>Has your problem been
                    solved?</strong>
                </div>
                <div className="sol-btn-group">
                  <button type="button" className="btn-sol-yes" onClick={() => { confirmResolutionSolved() }}
                    data-i18n="btn_sol_yes">🟢 Yes, Problem is Solved</button>
                  <button type="button" className="btn-sol-no" onClick={() => { openReopenModal() }} data-i18n="btn_sol_no">🔴 No,
                    Problem Still Persists</button>
                </div>
              </div>
            </div>

            {/* Recent Reports List Card (Clean Horizontal Scrollable Squares) */}
            <div className="section-header-row">
              <h3 className="section-header-title" data-i18n="section_recent">My Recent Reports</h3>
              <div style={{"display":"flex","alignItems":"center","gap":"8px"}}>
                <div className="recent-scroll-btns">
                  <button type="button" className="scroll-arrow-btn" onClick={() => { scrollRecentReports(-1) }} title="Scroll Left"
                    aria-label="Previous">❮</button>
                  <button type="button" className="scroll-arrow-btn" onClick={() => { scrollRecentReports(1) }} title="Scroll Right"
                    aria-label="Next">❯</button>
                </div>
                <button type="button" className="btn-view-all-link"
                  onClick={() => { openAllReportsModal() }} data-i18n="btn_view_all">View All Reports →</button>
              </div>
            </div>

            <div className="recent-reports-container-card">
              <div id="recentReportsContainerList" className="recent-reports-scroll-track">
                {/* Rendered dynamically as compact scrollable square divs */}
              </div>
            </div>

          </div>

          {/* Right Column Widgets */}
          <div className="right-widgets-column">

            {/* Community Impact Widget (Item 14) */}
            <div className="widget-panel-card">
              <div style={{"fontSize":"13.5px","fontWeight":"800","color":"var(--navy)"}} data-i18n="section_impact">My
                Community Impact</div>
              <div className="tricolor-ribbon-divider"></div>

              <div className="impact-metric-row">
                <div className="impact-label-with-icon">
                  <span>📋</span>
                  <span data-i18n="impact_reported">Problems Reported</span>
                </div>
                <span className="impact-value-number" id="impReported">0</span>
              </div>

              <div className="impact-metric-row">
                <div className="impact-label-with-icon">
                  <span>✅</span>
                  <span data-i18n="impact_solved">Problems Solved</span>
                </div>
                <span className="impact-value-number" id="impResolved">0</span>
              </div>

              <div className="impact-metric-row">
                <div className="impact-label-with-icon">
                  <span>🗳️</span>
                  <span data-i18n="impact_citizens">Total Reports Supported</span>
                </div>
                <span className="impact-value-number" id="impSupportedCount">0</span>
              </div>
            </div>

            {/* Nearby Challenges Widget (Item 10) */}
            <div className="widget-panel-card"
              style={{"background":"linear-gradient(180deg, #FFFDF9 0%, #FFFFFF 100%)","border":"1.5px solid #E2E8F0","boxShadow":"0 4px 12px rgba(15,23,42,0.04)"}}>
              <div style={{"display":"flex","justifyContent":"space-between","alignItems":"flex-start","gap":"6px","flexWrap":"nowrap"}}>
                <div style={{"flex":"1","minWidth":"0"}}>
                  <div style={{"fontSize":"13.5px","fontWeight":"800","color":"var(--navy)","lineHeight":"1.2"}} data-i18n="section_nearby">
                    Nearby Challenges</div>
                  <div style={{"fontSize":"10px","color":"#64748B","marginTop":"2px","whiteSpace":"nowrap","overflow":"hidden","textOverflow":"ellipsis"}} data-i18n="district_sublabel">
                    Grievances from your district only</div>
                </div>
                <div style={{"display":"flex","alignItems":"center","gap":"3px","flexShrink":"0","background":"#EFF6FF","border":"1.5px solid #93C5FD","borderRadius":"7px","padding":"2px 5px"}}>
                  <span style={{"fontSize":"10px","lineHeight":"1"}}>📍</span>
                  <select id="activeDistrictSelect" onChange={(e) => { setUserDistrict(e.target.value) }}
                    style={{"fontSize":"11px","fontWeight":"800","color":"#1E3A8A","background":"transparent","border":"none","padding":"1px 2px","cursor":"pointer","outline":"none","maxWidth":"100px"}}>
                    <option value="Ranchi">Ranchi</option>
                    <option value="Dhanbad">Dhanbad</option>
                    <option value="Bokaro">Bokaro</option>
                    <option value="East Singhbhum">East Singhbhum</option>
                    <option value="West Singhbhum">West Singhbhum</option>
                    <option value="Hazaribagh">Hazaribagh</option>
                    <option value="Deoghar">Deoghar</option>
                    <option value="Ramgarh">Ramgarh</option>
                    <option value="Giridih">Giridih</option>
                    <option value="Gumla">Gumla</option>
                    <option value="Simdega">Simdega</option>
                    <option value="Khunti">Khunti</option>
                    <option value="Palamu">Palamu</option>
                    <option value="Dumka">Dumka</option>
                    <option value="Latehar">Latehar</option>
                    <option value="Lohardaga">Lohardaga</option>
                    <option value="Jamtara">Jamtara</option>
                    <option value="Pakur">Pakur</option>
                    <option value="Sahibganj">Sahibganj</option>
                    <option value="Godda">Godda</option>
                    <option value="Garhwa">Garhwa</option>
                    <option value="Chatra">Chatra</option>
                    <option value="Koderma">Koderma</option>
                    <option value="Seraikela Kharsawan">Seraikela Kharsawan</option>
                  </select>
                </div>
              </div>
              <div className="tricolor-ribbon-divider"></div>

              <div style={{"display":"flex","flexDirection":"column","gap":"8px"}} id="nearbyMiniContainer">
                {/* Dynamically rendered */}
              </div>

              <button className="btn-explore-nearby" onClick={() => { setActivePage('explore'); }} data-i18n="btn_explore_all">
                Explore All Nearby Issues →
              </button>
            </div>

          </div>

        </div>

      </div>
      )}

    </main>
  </div>

  {/* ============================================================
     MODAL 1: REPORT A PROBLEM (6-STEP RURAL CITIZEN FLOW)
     ============================================================ */}
  <div className="modal-overlay" id="reportModal">
    <div className="modal-card-box report-modal-card">
      <div className="report-modal-tricolor-line"></div>
      <div className="modal-header-bar">
        <div className="modal-header-title" style={{"display":"flex","alignItems":"center","gap":"12px"}}>
          <img src="/jansetu-logo.png" style={{"width":"28px","height":"28px","borderRadius":"50%","objectFit":"cover","border":"1.5px solid rgba(0,45,98,0.2)","boxShadow":"0 2px 6px rgba(0,0,0,0.1)"}} alt="Logo" onError={(e) => { e.target.src = '/citizen/jansetu-logo.png'; }} />
          <div>
            <div style={{"fontSize":"15.5px","fontWeight":"900","color":"#0f172a","display":"flex","alignItems":"center","gap":"8px"}}>
              <span data-i18n="modal_report_title">Report a Community Problem</span>
              <span className="report-badge-pill">Citizen Redressal</span>
            </div>
            <div style={{"fontSize":"11px","color":"#64748B","fontWeight":"600"}}>Govt. of Jharkhand · Smart India Portal PS2643</div>
          </div>
        </div>
        <div style={{"display":"flex","alignItems":"center","gap":"10px"}}>
          <span id="reportModalStepCounter" className="report-step-counter-pill">Step 1 of 5 (20%)</span>
          <button className="modal-close-btn" onClick={() => { closeModal('reportModal') }} title="Close Modal">✕</button>
        </div>
      </div>

      <div className="modal-body-scroll">
        <div className="report-progress-track">
          <div className="report-progress-fill" id="reportProgressBarFill" style={{"width":"20%"}}></div>
        </div>

        <div className="step-bar">
          <span className="step-dot active" id="dotStep1">🏷️ <span data-i18n="flow_step1">1. Category</span></span>
          <span className="step-dot" id="dotStep2">📝 <span data-i18n="flow_step2">2. Problem</span></span>
          <span className="step-dot" id="dotStep3">📍 <span data-i18n="flow_step3">3. Location</span></span>
          <span className="step-dot" id="dotStep4">📸 <span data-i18n="flow_step4">4. Proof</span></span>
          <span className="step-dot" id="dotStep5">🤖 <span data-i18n="flow_step5">5. AI Check</span></span>
        </div>

        {/* STEP 1: CATEGORY */}
        <div id="stepSection1">
          <div className="form-group-field">
            <div style={{"display":"flex","justifyContent":"space-between","alignItems":"center","marginBottom":"4px"}}>
              <label className="form-label-text" data-i18n="label_step1" style={{"fontSize":"13px","fontWeight":"800","color":"#0f172a"}}>Step 1: Select Problem Category *</label>
              <span style={{"fontSize":"11px","fontWeight":"700","color":"#0284c7","background":"#E0F2FE","padding":"2px 8px","borderRadius":"8px"}}>Select 1 Domain</span>
            </div>
            <div className="category-chips-grid" id="categoryChipsContainer">
              {/* Populated via setLanguage */}
            </div>
            <input type="hidden" id="reportCategory" value="" />
          </div>

          <div className="modal-footer-nav" style={{"marginTop":"16px"}}>
            <button type="button" className="btn-modal-primary" onClick={() => { goToStep(2) }} data-i18n="btn_next_problem">
              Next: Problem Details →
            </button>
          </div>
        </div>

        {/* STEP 2: PROBLEM DETAILS (VOICE / TEXT) */}
        <div id="stepSection2" style={{"display":"none"}}>
          <div className="voice-record-banner">
            <div className="voice-left">
              <button type="button" className="voice-mic-btn" id="voiceMicBtn" onClick={() => { (window.toggleVoiceInput || toggleVoiceInput)() }}>🎙️</button>
              <div>
                <div style={{"fontSize":"14px","fontWeight":"800","color":"var(--gray-900)"}} id="voiceStatusText"
                  data-i18n="voice_heading">Speak to Report (Voice AI)</div>
                <div style={{"fontSize":"11.5px","color":"var(--gray-500)"}} data-i18n="voice_sub">Click mic and speak your problem naturally in Hindi or English</div>
              </div>
            </div>
            <span className="voice-ai-active-pill" data-i18n="voice_ai_active">🎙️ Voice AI Active</span>
          </div>

          <div className="voice-sample-chips" id="voiceSampleChipsContainer" style={{"display":"flex","gap":"6px","flexWrap":"wrap","marginTop":"8px"}}>
            <span style={{"fontSize":"10.5px","fontWeight":"700","color":"var(--gray-500)","alignSelf":"center"}} data-i18n="voice_examples_label">💡 Examples:</span>
            <button type="button" className="voice-chip-btn" onClick={() => { window.applyVoiceSample && window.applyVoiceSample('सड़क पर गहरा गड्ढा है और आवागमन बाधित है', 'सड़क व पुलिया मरम्मत', 'Urban Infrastructure') }} style={{"fontSize":"10.5px","padding":"3px 8px","borderRadius":"6px","border":"1px solid #cbd5e1","background":"#f8fafc","cursor":"pointer"}} data-i18n="voice_sample_1">🛣️ Road Pothole</button>
            <button type="button" className="voice-chip-btn" onClick={() => { window.applyVoiceSample && window.applyVoiceSample('पीने के पानी का मुख्य पाइप टूट गया है और गंदा पानी आ रहा है', 'पेयजल पाइपलाइन लीकेज', 'Water Management') }} style={{"fontSize":"10.5px","padding":"3px 8px","borderRadius":"6px","border":"1px solid #cbd5e1","background":"#f8fafc","cursor":"pointer"}} data-i18n="voice_sample_2">🚰 Water Pipe Leakage</button>
            <button type="button" className="voice-chip-btn" onClick={() => { window.applyVoiceSample && window.applyVoiceSample('गांव में बिजली का ट्रांसफॉर्मर खराब है और 3 दिन से बिजली नहीं है', 'ट्रांसफॉर्मर खराब / बिजली आपूर्ति', 'Energy & Technology') }} style={{"fontSize":"10.5px","padding":"3px 8px","borderRadius":"6px","border":"1px solid #cbd5e1","background":"#f8fafc","cursor":"pointer"}} data-i18n="voice_sample_3">⚡ Power Transformer</button>
          </div>

          <div className="form-group-field" style={{"marginTop":"14px"}}>
            <label className="form-label-text" data-i18n="label_problem_desc">Problem Description *</label>
            <textarea className="form-input-control" id="reportDescription" rows="4"
              placeholder="Describe the issue in detail (e.g. location, since when, how many people affected)..."
              onInput={(e) => {
                const el = document.getElementById('descCharCount');
                if (el) el.textContent = `${e.target.value.length} chars`;
              }}></textarea>
            <div style={{"display":"flex","justifyContent":"space-between","alignItems":"center","fontSize":"11px","color":"#64748B","marginTop":"3px"}}>
              <span>💡 Specific details jaise gali, chowk ya paas ka school/mandir likhein</span>
              <span id="descCharCount" style={{"fontWeight":"700","color":"#0284c7"}}>0 chars</span>
            </div>
          </div>

          <div className="form-group-field">
            <label className="form-label-text" data-i18n="label_problem_title">Problem Title</label>
            <input type="text" className="form-input-control" id="reportTitle"
              placeholder="Auto-generated by AI or type concise title here" />
          </div>

          <div className="form-group-field">
            <label className="form-label-text" data-i18n="label_urgency">Urgency / Priority Level *</label>
            <div className="priority-selector-grid">
              <label className="priority-card-label prio-normal">
                <input type="radio" name="priorityChoice" value="normal" defaultChecked />
                <div className="prio-card-body">
                  <span className="prio-icon">🛡️</span>
                  <div>
                    <div className="prio-title" data-i18n="prio_normal">Normal</div>
                    <div className="prio-sub">Standard priority issue</div>
                  </div>
                </div>
              </label>
              <label className="priority-card-label prio-high">
                <input type="radio" name="priorityChoice" value="high" />
                <div className="prio-card-body">
                  <span className="prio-icon">⚡</span>
                  <div>
                    <div className="prio-title" data-i18n="prio_high">High</div>
                    <div className="prio-sub">Affecting neighborhood</div>
                  </div>
                </div>
              </label>
              <label className="priority-card-label prio-urgent">
                <input type="radio" name="priorityChoice" value="urgent" />
                <div className="prio-card-body">
                  <span className="prio-icon">🚨</span>
                  <div>
                    <div className="prio-title" data-i18n="prio_urgent">Urgent</div>
                    <div className="prio-sub">Immediate hazard / danger</div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div className="modal-footer-nav" style={{"marginTop":"16px"}}>
            <button type="button" className="btn-modal-secondary" onClick={() => { goToStep(1) }} data-i18n="btn_back">← Back</button>
            <button type="button" className="btn-modal-primary" onClick={() => { goToStep(3) }} data-i18n="btn_next_location">Next: Location →</button>
          </div>
        </div>

        {/* STEP 3: RURAL LOCATION HIERARCHY */}
        <div id="stepSection3" style={{"display":"none"}}>
          <div style={{"display":"flex","justifyContent":"space-between","alignItems":"center","marginBottom":"10px","flexWrap":"wrap","gap":"8px"}}>
            <button type="button" className="btn-gps-autodetect" onClick={() => { autoDetectGpsLocation() }}>
              <span>📍</span>
              <span data-i18n="btn_use_gps">Auto-Detect GPS Location</span>
            </button>
            <span style={{"fontSize":"11.5px","color":"#64748B","fontWeight":"600"}}>
              📌 Accurate GPS speeds up inspection
            </span>
          </div>

          <div className="form-row-2col">
            <div className="form-group-field">
              <label className="form-label-text" data-i18n="label_state">State</label>
              <input type="text" className="form-input-control" id="reportState" defaultValue="Jharkhand"
                style={{"background":"#F8FAFC","fontWeight":"700"}} />
            </div>

            <div className="form-group-field">
              <label className="form-label-text" data-i18n="label_district">District *</label>
              <select className="form-input-control" id="reportDistrict">
                <option value="Ranchi" selected>Ranchi</option>
                <option value="Dhanbad">Dhanbad</option>
                <option value="Bokaro">Bokaro</option>
                <option value="Gumla">Gumla</option>
                <option value="Hazaribagh">Hazaribagh</option>
                <option value="Deoghar">Deoghar</option>
                <option value="East Singhbhum">East Singhbhum</option>
                <option value="West Singhbhum">West Singhbhum</option>
                <option value="Giridih">Giridih</option>
                <option value="Ramgarh">Ramgarh</option>
                <option value="Palamu">Palamu</option>
                <option value="Garhwa">Garhwa</option>
                <option value="Chatra">Chatra</option>
                <option value="Koderma">Koderma</option>
                <option value="Jamtara">Jamtara</option>
                <option value="Godda">Godda</option>
                <option value="Sahibganj">Sahibganj</option>
                <option value="Pakur">Pakur</option>
                <option value="Khunti">Khunti</option>
                <option value="Simdega">Simdega</option>
                <option value="Lohardaga">Lohardaga</option>
                <option value="Seraikela Kharsawan">Seraikela Kharsawan</option>
                <option value="Latehar">Latehar</option>
                <option value="Dumka">Dumka</option>
              </select>
            </div>
          </div>

          <div className="form-row-2col">
            <div className="form-group-field">
              <label className="form-label-text" data-i18n="label_block">Block / Tehsil</label>
              <input type="text" className="form-input-control" id="reportBlock" defaultValue=""
                placeholder="e.g. Namkum, Kanke, Ratu" />
            </div>

            <div className="form-group-field">
              <label className="form-label-text" data-i18n="label_panchayat">Panchayat / Ward</label>
              <input type="text" className="form-input-control" id="reportPanchayat" defaultValue=""
                placeholder="e.g. Tupudana Panchayat / Ward 12" />
            </div>
          </div>

          <div className="form-row-2col">
            <div className="form-group-field">
              <label className="form-label-text" data-i18n="label_village">Village / Tola / Colony</label>
              <input type="text" className="form-input-control" id="reportVillage" defaultValue=""
                placeholder="e.g. Rampur, Purana Tola" />
            </div>

            <div className="form-group-field">
              <label className="form-label-text" data-i18n="label_landmark">Landmark / Nearby Spot</label>
              <input type="text" className="form-input-control" id="reportLandmark" defaultValue=""
                placeholder="e.g. Near Shiv Mandir, School ke paas" />
            </div>
          </div>

          {/* Interactive Mini-Map Pinning Card */}
          <div className="minimap-section-card"
            style={{"margin":"12px 0","background":"#f8fafc","border":"1.5px solid var(--gray-200)","borderRadius":"14px","padding":"12px","boxShadow":"0 2px 8px rgba(0,0,0,0.04)"}}>
            <div style={{"display":"flex","justifyContent":"space-between","alignItems":"center","marginBottom":"8px"}}>
              <div
                style={{"fontSize":"13px","fontWeight":"800","color":"var(--navy)","display":"flex","alignItems":"center","gap":"6px"}}>
                <span>🗺️</span> <span data-i18n="map_pin_spot">Pin Exact Spot on Map</span>
              </div>
              <span id="mapCoordsPill"
                style={{"fontSize":"11px","fontWeight":"800","color":"#1e40af","background":"#dbeafe","padding":"3px 10px","borderRadius":"12px","border":"1px solid #bfdbfe"}}>
                📍 23.3441° N, 85.3096° E
              </span>
            </div>
            <div id="reportMiniMap"
              style={{"height":"190px","width":"100%","borderRadius":"10px","border":"1px solid #cbd5e1","zIndex":"1","overflow":"hidden"}}></div>
            <div style={{"display":"flex","justifyContent":"space-between","alignItems":"center","marginTop":"8px","flexWrap":"wrap","gap":"6px"}}>
              <span style={{"fontSize":"11px","color":"var(--gray-500)","fontWeight":"600"}}>💡 Tip: Click anywhere on map or drag marker to pinpoint exact issue spot.</span>
              <button type="button" className="btn-gps-autodetect" id="btnGpsAutodetect" onClick={() => { autoDetectGpsLocation() }}
                style={{"padding":"4px 12px","fontSize":"11px","background":"#EFF6FF","border":"1px solid #BFDBFE","color":"var(--navy)","borderRadius":"8px","fontWeight":"800","cursor":"pointer"}}>
                📍 Use Current GPS
              </button>
            </div>
          </div>

          <div className="modal-footer-nav" style={{"marginTop":"16px"}}>
            <button type="button" className="btn-modal-secondary" onClick={() => { goToStep(2) }} data-i18n="btn_back">← Back</button>
            <button type="button" className="btn-modal-primary" onClick={() => { goToStep(4) }} data-i18n="btn_next_proof">Next: Add Proof →</button>
          </div>
        </div>

        {/* STEP 4: MULTIMEDIA PROOF */}
        <div id="stepSection4" style={{"display":"none"}}>
          <div style={{"display":"flex","alignItems":"center","justifyContent":"space-between","marginBottom":"4px"}}>
            <label className="form-label-text" data-i18n="label_step4" style={{"marginBottom":"0","fontSize":"13px","fontWeight":"800","color":"#0f172a"}}>Step 4: Attach Proof — Photos or Video</label>
            <span style={{"fontSize":"11px","fontWeight":"800","color":"#DC2626","background":"#FEE2E2","border":"1px solid #FCA5A5","padding":"2px 8px","borderRadius":"6px"}}>
              * Mandatory / अनिवार्य
            </span>
          </div>
          <div style={{"fontSize":"11.5px","color":"#64748B","marginBottom":"10px"}}>
            Photo or Video proof is mandatory to verify and process the grievance on ground.
          </div>

          <div className="multimedia-select-grid" style={{"marginTop":"8px"}}>
            <label className="media-btn-tile media-camera-tile">
              <span className="media-tile-icon">📸</span>
              <span className="media-tile-label">Live Camera</span>
              <span className="media-tile-sub">Take Photo Now</span>
              <input type="file" id="mediaCameraInput" accept="image/*" capture="environment" style={{"display":"none"}}
                onChange={(e) => { (window.handleMediaSelect || handleMediaSelect)(e.target, 'photo') }} />
            </label>

            <label className="media-btn-tile">
              <span className="media-tile-icon">🖼️</span>
              <span className="media-tile-label" data-i18n="btn_add_photo">Photos (Gallery)</span>
              <span className="media-tile-sub">PNG, JPG, WEBP</span>
              <input type="file" id="mediaPhotoInput" multiple accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
                style={{"display":"none"}} onChange={(e) => { (window.handleMediaSelect || handleMediaSelect)(e.target, 'photo') }} />
            </label>

            <label className="media-btn-tile">
              <span className="media-tile-icon">🎥</span>
              <span className="media-tile-label" data-i18n="btn_add_video">Add Video</span>
              <span className="media-tile-sub">MP4, WebM (Max 30s)</span>
              <input type="file" id="mediaVideoInput" accept="video/mp4, video/webm, video/quicktime, video/ogg"
                style={{"display":"none"}} onChange={(e) => { (window.handleMediaSelect || handleMediaSelect)(e.target, 'video') }} />
            </label>

            <label className="media-btn-tile">
              <span className="media-tile-icon">📄</span>
              <span className="media-tile-label" data-i18n="btn_add_doc">Documents</span>
              <span className="media-tile-sub">PDF, Application</span>
              <input type="file" id="mediaDocInput" multiple accept=".pdf,.doc,.docx" style={{"display":"none"}}
                onChange={(e) => { (window.handleMediaSelect || handleMediaSelect)(e.target, 'document') }} />
            </label>
          </div>

          <div className="media-preview-row" id="mediaPreviewContainer"></div>

          <div className="modal-footer-nav" style={{"marginTop":"16px"}}>
            <button type="button" className="btn-modal-secondary" onClick={() => { goToStep(3) }} data-i18n="btn_back">← Back</button>
            <button type="button" className="btn-modal-primary" onClick={() => { runAICheckAndGoStep5() }}
              data-i18n="btn_next_ai">Next: JanSetu AI Check →</button>
          </div>
        </div>

        {/* STEP 5: AI CHECK & DEDUPLICATION */}
        <div id="stepSection5" style={{"display":"none"}}>

          <div className="duplicate-alert-card" id="duplicateNoticeBox" style={{"display":"none"}}>
            <div
              style={{"display":"flex","alignItems":"center","gap":"8px","fontSize":"14px","fontWeight":"800","color":"#92400E","marginBottom":"4px"}}>
              <span>⚠️</span>
              <span data-i18n="dup_notice_title">A similar problem has already been reported</span>
            </div>
            <p style={{"fontSize":"12px","color":"#B45309","lineHeight":"1.4","marginBottom":"10px"}}
              data-i18n="dup_notice_desc">
              A similar issue was found in your area. You can support the existing report to amplify urgency.
            </p>

            <div
              style={{"background":"#FFF","border":"1px solid #FDE68A","borderRadius":"10px","padding":"10px 12px","marginBottom":"12px"}}>
              <div style={{"fontSize":"13px","fontWeight":"800","color":"var(--gray-900)"}} id="dupItemTitle">Water Supply
                Pipe Damaged near Panchayat Bhawan</div>
              <div style={{"fontSize":"11px","color":"var(--gray-600)","marginTop":"2px"}} id="dupItemMeta">Report
                #JH-2026-20481 · 📍 1.2 km away · 👥 14 affected</div>
            </div>
          </div>

          <div className="ai-check-card">
            <div style={{"display":"flex","justifyContent":"space-between","alignItems":"center","marginBottom":"12px"}}>
              <span
                style={{"display":"inline-flex","alignItems":"center","gap":"6px","background":"linear-gradient(135deg, #002D62 0%, #1e3a8a 100%)","color":"#FFF","fontSize":"12px","fontWeight":"800","padding":"5px 14px","borderRadius":"20px","boxShadow":"0 2px 8px rgba(0,45,98,0.25)"}}>
                🤖 JanSetu AI Verification
              </span>
              <div style={{"display":"flex","alignItems":"center","gap":"8px"}}>
                <div className="ai-conf-meter-track">
                  <div className="ai-conf-meter-fill" id="aiConfMeterFill" style={{"width":"96%"}}></div>
                </div>
                <span
                  style={{"fontSize":"11.5px","fontWeight":"800","color":"var(--india-green)","background":"var(--india-green-light)","padding":"3px 10px","borderRadius":"12px"}}
                  id="aiConfScore">
                  96% Confidence
                </span>
              </div>
            </div>

            <div style={{"fontSize":"14px","fontWeight":"800","color":"var(--gray-900)","marginBottom":"12px"}}
              data-i18n="ai_understood">
              “We have understood your problem.”
            </div>

            <div
              style={{"background":"var(--white)","border":"1.5px solid #E2E8F0","borderRadius":"14px","padding":"14px 16px","display":"flex","flexDirection":"column","gap":"10px","marginBottom":"16px","boxShadow":"0 2px 8px rgba(0,0,0,0.03)"}}>
              <div style={{"display":"flex","justifyContent":"space-between","fontSize":"13px"}}>
                <span style={{"color":"var(--gray-500)","fontWeight":"600"}} data-i18n="label_category">Category:</span>
                <strong id="aiCardCategory">Water Management</strong>
              </div>
              <div id="aiCategorySuggestionBox" style={{"display":"none"}}></div>
              <div style={{"display":"flex","justifyContent":"space-between","fontSize":"13px"}}>
                <span style={{"color":"var(--gray-500)","fontWeight":"600"}} data-i18n="label_priority">Priority:</span>
                <strong style={{"color":"#ea580c"}} id="aiCardPriority">HIGH</strong>
              </div>
              <div style={{"display":"flex","justifyContent":"space-between","fontSize":"13px"}}>
                <span style={{"color":"var(--gray-500)","fontWeight":"600"}} data-i18n="label_loc">Location:</span>
                <strong id="aiCardLocation">Village Namkum, Namkum, Ranchi</strong>
              </div>
              <div style={{"display":"flex","justifyContent":"space-between","fontSize":"13px"}}>
                <span style={{"color":"var(--gray-500)","fontWeight":"600"}} data-i18n="label_similar_reports">Nearby
                  Reports:</span>
                <strong style={{"color":"#D97706"}} id="aiCardNearbyStatus">1 potential match found</strong>
              </div>
              <div id="aiCardPhotoRow"
                style={{"display":"none","alignItems":"center","justifyContent":"space-between","fontSize":"13px","borderTop":"1px dashed #e2e8f0","paddingTop":"8px"}}>
                <span style={{"color":"var(--gray-500)","fontWeight":"600"}}>Uploaded Proof:</span>
                <div style={{"display":"flex","alignItems":"center","gap":"8px"}}>
                  <img id="aiCardPhotoThumb" src=""
                    style={{"width":"34px","height":"34px","borderRadius":"6px","objectFit":"cover","border":"1px solid #d1d5db"}} />
                  <span id="aiCardPhotoName" style={{"fontSize":"11px","fontWeight":"700","color":"#166534"}}>Photo
                    Attached</span>
                </div>
              </div>
            </div>

            <div className="modal-footer-nav" id="step5FooterNav" style={{"display":"flex","justifyContent":"space-between","alignItems":"center","gap":"12px","marginTop":"16px"}}>
              {/* Left Button: Edit */}
              <button type="button" className="btn-modal-secondary" onClick={() => { goToStep(2) }} data-i18n="btn_edit" style={{"padding":"11px 20px","fontSize":"13px","fontWeight":"700"}}>
                ✎ Edit
              </button>

              {/* Right Side Buttons: Cancel (left of link), Link (rightmost), or Submit Problem (default) */}
              <div style={{"display":"flex","alignItems":"center","gap":"10px"}}>
                <button type="button" id="dupCancelBtn" className="btn-modal-secondary"
                  style={{"display":"none","background":"#FFFFFF","border":"1.5px solid #FCA5A5","color":"#DC2626","padding":"11px 18px","fontSize":"13px","fontWeight":"800","borderRadius":"10px","cursor":"pointer"}}
                  onClick={() => { cancelDeduplicationAndClose() }}
                  data-i18n="btn_dup_cancel">
                  ❌ Cancel
                </button>

                <button type="button" id="dupLinkBtn" className="btn-modal-primary"
                  style={{"display":"none","background":"#1D4ED8","color":"#FFFFFF","border":"none","padding":"11px 20px","fontSize":"13px","fontWeight":"800","borderRadius":"10px","cursor":"pointer","boxShadow":"0 4px 14px rgba(29, 78, 216, 0.3)"}}
                  onClick={() => { linkExistingDetectedReport() }}
                  data-i18n="btn_dup_link">
                  🔗 Link Problem
                </button>

                <button type="button" className="btn-modal-primary" id="finalSubmitBtn"
                  style={{"padding":"11px 22px","fontSize":"13px","fontWeight":"800","borderRadius":"10px"}}
                  onClick={() => {
                    if (typeof window !== 'undefined' && typeof window.submitRealProblem === 'function') {
                      window.submitRealProblem();
                    } else if (typeof submitRealProblem === 'function') {
                      submitRealProblem();
                    }
                  }}
                  data-i18n="btn_submit_confirm">
                  ✓ Submit Problem
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  </div>

  {/* ============================================================
     MODAL 2: PROBLEM DETAILS INSPECTOR
     ============================================================ */}
  {/* ============================================================
     MODAL 2: PROBLEM DETAILS INSPECTOR (IMAGE 3 EXACT REVAMP)
     ============================================================ */}
  <div className="modal-overlay" id="detailModal">
    <div className="modal-card-box detail-modal-custom">
      {/* Top Tricolor Accent Line */}
      <div className="profile-tricolor-bar"></div>

      {/* Header Bar */}
      <div className="detail-modal-header-clean">
        <div style={{"display":"flex","gap":"14px","alignItems":"flex-start","flex":"1","minWidth":"0"}}>
          <div className="detail-cat-square" id="detailCatSquare">🏥</div>
          <div style={{"flex":"1","minWidth":"0"}}>
            <h3 className="detail-title-h3" id="detailTitle">hospital</h3>
            <div className="detail-meta-chip-list">
              <span>Report ID: <strong id="detailId" style={{"color":"#1E40AF","fontWeight":"800"}}>JH-2026-625506</strong></span>
              <span>•</span>
              <span id="detailStatusBadge" className="detail-status-pill">🟢 Open • In Progress</span>
              <span>•</span>
              <span>📍 <span id="detailHeaderLoc">Ranchi, Jharkhand</span></span>
              <span>•</span>
              <span>📅 <span id="detailTimeAgo">Reported 1 day ago</span></span>
              <span>•</span>
              <span>📁 <span id="detailCategoryBadge">Healthcare</span></span>
            </div>
          </div>
        </div>

        {/* Right Header Controls: Submitter Support Card, Share, Close */}
        <div style={{"display":"flex","alignItems":"center","gap":"10px","flexShrink":"0"}}>
          <div className="detail-submitter-support-card" id="detailSubmitterSupportCard">
            <div style={{"fontSize":"11px","fontWeight":"800","color":"#B45309","display":"flex","alignItems":"center","justifyContent":"flex-end","gap":"4px"}}>
              👑 <span id="detailAuthorHeaderBadge">Primary Submitter</span>
            </div>
            <div style={{"fontSize":"11px","fontWeight":"700","color":"#1E293B","marginTop":"2px"}}>
              👥 <span id="detailSupportCountText">1 Citizen Support</span>
            </div>
          </div>

          <button type="button" className="btn-detail-share-clean" onClick={() => { shareCurrentReport() }} title="Share Grievance">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
            <span>Share</span>
          </button>

          <button type="button" className="modal-close-btn" onClick={() => { closeModal('detailModal') }}
            style={{"width":"30px","height":"30px","background":"#F1F5F9","border":"1px solid #CBD5E1","borderRadius":"50%","display":"flex","alignItems":"center","justifyContent":"center","cursor":"pointer","fontSize":"13px"}} title="Close">✕</button>
        </div>
      </div>

      {/* 5-Tab Navigation Bar */}
      <div className="detail-tabs-clean-row">
        <button type="button" className="detail-tab-pill active" id="detailTabBtn_overview" onClick={() => { switchDetailTab('overview') }}>📋 Overview</button>
        <button type="button" className="detail-tab-pill" id="detailTabBtn_progress" onClick={() => { switchDetailTab('progress') }}>📊 Progress</button>
        <button type="button" className="detail-tab-pill" id="detailTabBtn_verification" onClick={() => { switchDetailTab('verification') }}>🛡️ Verification</button>
        <button type="button" className="detail-tab-pill" id="detailTabBtn_evidence" onClick={() => { switchDetailTab('evidence') }}>🖼️ Evidence</button>
        <button type="button" className="detail-tab-pill" id="detailTabBtn_discussion" onClick={() => { switchDetailTab('discussion') }}>💬 Discussion</button>
      </div>

      {/* ============================================================
          TAB 1: OVERVIEW (2-COLUMN RESPONSIVE BODY)
          ============================================================ */}
      <div className="detail-tab-view active" id="tabView_overview">
        <div className="detail-2col-container">

          {/* LEFT COLUMN: Problem Statement, Stepper, 3 Stakeholder Cards */}
          <div style={{"display":"flex","flexDirection":"column","gap":"12px"}}>

            {/* 1. Problem Statement Card */}
            <div className="detail-white-box">
              <div className="detail-box-head">
                <span className="detail-box-title">
                  <span style={{"color":"#EA580C","fontSize":"16px"}}>📄</span>
                  <span style={{"fontSize":"14px","fontWeight":"800"}}>Problem Statement</span>
                </span>
              </div>
              <div id="detailDescription" className="detail-description-large">
                near hospital needs renovation
              </div>
            </div>

            {/* 2. Progress Timeline Card */}
            <div className="detail-white-box">
              <div className="detail-box-head">
                <span className="detail-box-title">
                  <span style={{"color":"#0284C7","fontSize":"16px"}}>📊</span>
                  <span style={{"fontSize":"14px","fontWeight":"800"}}>Progress Timeline</span>
                </span>
                <a href="javascript:void(0)" id="detailLinkFullHistory" onClick={() => { switchDetailTab('progress') }}
                  style={{"fontSize":"11.5px","fontWeight":"700","color":"#2563EB","textDecoration":"none","display":"inline-flex","alignItems":"center","gap":"4px"}}>
                  View Full History →
                </a>
              </div>

              {/* 5-Step Stepper with Animated Progress Flow Line & Bhuk-Bhak Current Node */}
              <div className="detail-stepper-track" id="detailModalStepperTrack">
                <div className="detail-stepper-track-progress" id="detailStepperProgressFill" style={{"width":"45%"}}></div>
                {/* Step 1: Submitted */}
                <div className="detail-step-node">
                  <div className="detail-step-circle done" id="dStepCirc1">✓</div>
                  <div style={{"fontSize":"11px","fontWeight":"800","color":"#0F172A"}}>Submitted</div>
                  <div style={{"fontSize":"9.5px","color":"#64748B","marginTop":"1px"}} id="dStepDate1">11 Sept 2026</div>
                  <div style={{"fontSize":"9px","color":"#94A3B8"}} id="dStepTime1">02:10 am</div>
                </div>
                {/* Step 2: Admin Verified */}
                <div className="detail-step-node">
                  <div className="detail-step-circle pending" id="dStepCirc2">⏳</div>
                  <div style={{"fontSize":"11px","fontWeight":"800","color":"#0F172A"}}>Admin Verified</div>
                  <div style={{"fontSize":"9.5px","color":"#64748B","marginTop":"1px"}} id="dStepDate2">11 Sept 2026</div>
                  <div style={{"fontSize":"9px","color":"#94A3B8"}} id="dStepTime2">02:13 am</div>
                </div>
                {/* Step 3: Team Working */}
                <div className="detail-step-node">
                  <div className="detail-step-circle pending" id="dStepCirc3">3</div>
                  <div style={{"fontSize":"11px","fontWeight":"800","color":"#0F172A"}}>Team Working</div>
                  <div style={{"fontSize":"9.5px","color":"#64748B","marginTop":"1px"}} id="dStepDate3">Pending</div>
                  <div style={{"fontSize":"9px","color":"#94A3B8"}} id="dStepTime3">--:--</div>
                </div>
                {/* Step 4: Implementation */}
                <div className="detail-step-node">
                  <div className="detail-step-circle pending" id="dStepCirc4">4</div>
                  <div style={{"fontSize":"11px","fontWeight":"800","color":"#0F172A"}}>Implementation</div>
                  <div style={{"fontSize":"9.5px","color":"#64748B","marginTop":"1px"}} id="dStepSub4">Awaiting Action</div>
                </div>
                {/* Step 5: Certified Closed */}
                <div className="detail-step-node">
                  <div className="detail-step-circle pending" id="dStepCirc5">5</div>
                  <div style={{"fontSize":"11px","fontWeight":"800","color":"#64748B"}}>Certified Closed</div>
                  <div style={{"fontSize":"9.5px","color":"#94A3B8","marginTop":"1px"}} id="dStepSub5">Final Step</div>
                </div>
              </div>
            </div>

            {/* 3. Three Stakeholder Action Cards Row (Enlarged, Clickable for Daily Action Logs) */}
            <div className="detail-stakeholder-row" id="detailStakeholderRow">
              {/* Card 1: Administrative Review */}
              <div className="stakeholder-card-clean" onClick={() => { openStakeholderDetails('admin') }} title="Click to view daily administrative audit history">
                <div style={{"display":"flex","alignItems":"center","gap":"10px"}}>
                  <span className="org-icon">🏛️</span>
                  <div>
                    <div className="org-title">Administrative Review</div>
                    <div style={{"fontSize":"10px","color":"#64748B","marginTop":"1px"}}>District Collectorate</div>
                  </div>
                </div>
                <div style={{"display":"flex","alignItems":"center","justifyContent":"space-between","marginTop":"6px"}}>
                  <span className="org-badge" style={{"background":"#FEF3C7","color":"#B45309","border":"1px solid #FDE68A"}} id="stakeholderBadgeAdmin">
                    ⏳ Verification Pending
                  </span>
                  <span style={{"color":"#2563EB","fontSize":"12px","fontWeight":"800"}}>View Log ›</span>
                </div>
              </div>

              {/* Card 2: University Taskforce */}
              <div className="stakeholder-card-clean" onClick={() => { openStakeholderDetails('university') }} title="Click to view university engineering team actions">
                <div style={{"display":"flex","alignItems":"center","gap":"10px"}}>
                  <span className="org-icon">🎓</span>
                  <div>
                    <div className="org-title">University Taskforce</div>
                    <div style={{"fontSize":"10px","color":"#64748B","marginTop":"1px"}}>Field Engineering Team</div>
                  </div>
                </div>
                <div style={{"display":"flex","alignItems":"center","justifyContent":"space-between","marginTop":"6px"}}>
                  <span className="org-badge" style={{"background":"#EFF6FF","color":"#1D4ED8","border":"1px solid #BFDBFE"}} id="stakeholderBadgeUniv">
                    🟡 Field Survey
                  </span>
                  <span style={{"color":"#2563EB","fontSize":"12px","fontWeight":"800"}}>View Log ›</span>
                </div>
              </div>

              {/* Card 3: Industry Partner Action */}
              <div className="stakeholder-card-clean" onClick={() => { openStakeholderDetails('industry') }} title="Click to view industry CSR and material dispatch history">
                <div style={{"display":"flex","alignItems":"center","gap":"10px"}}>
                  <span className="org-icon">🤝</span>
                  <div>
                    <div className="org-title">Industry Partner Action</div>
                    <div style={{"fontSize":"10px","color":"#64748B","marginTop":"1px"}}>CSR &amp; Resource Delivery</div>
                  </div>
                </div>
                <div style={{"display":"flex","alignItems":"center","justifyContent":"space-between","marginTop":"6px"}}>
                  <span className="org-badge" style={{"background":"#F0FDF4","color":"#15803D","border":"1px solid #BBF7D0"}} id="stakeholderBadgeInd">
                    Supplies In Progress
                  </span>
                  <span style={{"color":"#2563EB","fontSize":"12px","fontWeight":"800"}}>View Log ›</span>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Location Details, Before & After, Citizen Video Evidence */}
          <div style={{"display":"flex","flexDirection":"column","gap":"12px"}}>

            {/* 1. Location Details Card */}
            <div className="detail-white-box">
              <div className="detail-box-head">
                <span className="detail-box-title">
                  <span style={{"color":"#16A34A","fontSize":"16px"}}>📍</span>
                  <span style={{"fontSize":"14px","fontWeight":"800"}}>Location Details</span>
                </span>
                <button type="button" onClick={() => { if (window.gotoCurrentReportMap) window.gotoCurrentReportMap(); }}
                  style={{"background":"none","border":"none","color":"#2563EB","fontSize":"11.5px","fontWeight":"700","cursor":"pointer","display":"inline-flex","alignItems":"center","gap":"4px"}}>
                  <span>🗺️ Open in Maps ↗</span>
                </button>
              </div>
              <div style={{"fontSize":"12.5px","fontWeight":"700","color":"#0F172A","marginBottom":"6px"}} id="detailLocationText">
                Ranchi, Jharkhand
              </div>

              {/* 2x2 Grid */}
              <div className="detail-loc-grid-clean">
                <div className="detail-loc-cell">🏛️ State: <strong id="detailLocState">Jharkhand</strong></div>
                <div className="detail-loc-cell">🏢 District: <strong id="detailLocDistrict">Ranchi</strong></div>
                <div className="detail-loc-cell">📍 Tehsil/Block: <strong id="detailLocTehsil">Sadar Block</strong></div>
                <div className="detail-loc-cell">🏡 Area/Village: <strong id="detailLocVillage">Ranchi</strong></div>
              </div>

              {/* GPS Pill */}
              <div style={{"fontSize":"10.5px","fontWeight":"700","color":"#1E40AF","background":"#EFF6FF","border":"1px solid #BFDBFE","borderRadius":"6px","padding":"4px 8px","display":"inline-flex","alignItems":"center","gap":"4px","marginTop":"2px"}} id="detailGpsPill">
                🌐 GPS: 23.3441°N, 85.3096°E
              </div>
            </div>

            {/* 2. Single Consolidated Ground Evidence & Media Card */}
            <div className="detail-white-box" id="detailConsolidatedEvidenceBox">
              <div className="detail-box-head">
                <span className="detail-box-title">
                  <span style={{"color":"#16A34A","fontSize":"16px"}}>🖼️</span>
                  <span style={{"fontSize":"14px","fontWeight":"800"}} data-i18n="detail_evidence_card_title">Ground Evidence &amp; Media</span>
                </span>
                <span id="detailEvidenceCountBadge" style={{"fontSize":"11px","fontWeight":"800","color":"#1E40AF","background":"#EFF6FF","border":"1px solid #BFDBFE","padding":"3px 9px","borderRadius":"8px"}}>
                  0 Files Attached
                </span>
              </div>

              {/* Media Thumbnails Strip or Empty Notice */}
              <div id="detailMediaThumbContainer" style={{"marginTop":"8px","marginBottom":"12px"}}>
                {/* Dynamically populated thumbnail preview */}
              </div>

              {/* Prominent Evidence Button */}
              <button
                type="button"
                className="btn-view-evidence-prominent"
                id="btnOpenConsolidatedEvidence"
                onClick={() => { (window.openAllMediaEvidenceViewer || openAllMediaEvidenceViewer)() }}
              >
                <span>🔍</span> <span id="btnViewFullEvidenceText">View Full Grievance &amp; Evidence →</span>
              </button>
            </div>

          </div>

        </div>
      </div>

      {/* ============================================================
          TAB 2: PROGRESS (EXPANDED VERTICAL TIMELINE)
          ============================================================ */}
      <div className="detail-tab-view" id="tabView_progress">
        <div className="detail-white-box">
          <div className="detail-box-head">
            <span className="detail-box-title">
              <span style={{"color":"#0284C7","fontSize":"16px"}}>📊</span>
              <span style={{"fontSize":"15px","fontWeight":"800"}}>Comprehensive Action &amp; Progress History</span>
            </span>
          </div>
          <div id="tabProgressEventList" style={{"display":"flex","flexDirection":"column","gap":"4px"}}>
            {/* Populated dynamically in citizenLogic.js */}
          </div>
        </div>
      </div>

      {/* ============================================================
          TAB 3: VERIFICATION (ADMIN AUDIT & AUTHENTICITY)
          ============================================================ */}
      <div className="detail-tab-view" id="tabView_verification">
        <div className="verification-audit-box" id="tabVerificationContent">
          {/* Populated dynamically in citizenLogic.js */}
        </div>
      </div>

      {/* ============================================================
          TAB 4: EVIDENCE (HIGH-RES GALLERY & FIELD PROOFS)
          ============================================================ */}
      <div className="detail-tab-view" id="tabView_evidence">
        <div className="detail-white-box">
          <div className="detail-box-head">
            <span className="detail-box-title">
              <span style={{"color":"#16A34A","fontSize":"16px"}}>🖼️</span>
              <span style={{"fontSize":"15px","fontWeight":"800"}}>Ground Evidence &amp; Geotagged Media</span>
            </span>
          </div>
          <div className="evidence-gallery-grid" id="tabEvidenceGrid">
            {/* Populated dynamically */}
          </div>
        </div>
      </div>

      {/* ============================================================
          TAB 5: DISCUSSION (COMMUNITY CHAT INLINE)
          ============================================================ */}
      <div className="detail-tab-view" id="tabView_discussion">
        <div className="tab-discussion-box">
          <div className="detail-box-head">
            <span className="detail-box-title">
              <span style={{"color":"#7C3AED","fontSize":"16px"}}>💬</span>
              <span style={{"fontSize":"15px","fontWeight":"800"}}>Citizen &amp; Stakeholder Discussion</span>
            </span>
            <button type="button" className="btn-footer-chat-clean" onClick={() => { closeModal('detailModal'); const a = typeof currentlyInspectedId !== 'undefined' ? currentlyInspectedId : ''; if (a && window.openChatModal) window.openChatModal(a); }}>
              Open Full Chat Window ↗
            </button>
          </div>
          <div id="tabDiscussionContainer" style={{"minHeight":"200px","padding":"12px 0"}}>
            <p style={{"fontSize":"13px","color":"#64748B"}}>Join the discussion to collaborate with neighbors, local officers, and the student team working on this grievance.</p>
          </div>
        </div>
      </div>

      {/* ============================================================
          STAKEHOLDER DETAIL DRAWER / POP-UP OVERLAY
          ============================================================ */}
      <div className="stakeholder-detail-overlay" id="stakeholderDetailOverlay" style={{"display":"none"}}>
        <div className="stakeholder-detail-header">
          <div style={{"display":"flex","alignItems":"center","gap":"12px"}}>
            <span id="stkModalIcon" style={{"fontSize":"26px"}}>🏛️</span>
            <div>
              <h4 id="stkModalTitle" style={{"fontSize":"16px","fontWeight":"800","color":"#0F172A","margin":"0"}}>Administrative Action Log</h4>
              <div id="stkModalSub" style={{"fontSize":"12px","color":"#64748B","marginTop":"2px"}}>Day-by-day actions taken by this organization</div>
            </div>
          </div>
          <button type="button" onClick={() => { closeStakeholderDetails() }}
            style={{"background":"#F1F5F9","border":"1px solid #CBD5E1","borderRadius":"50%","width":"32px","height":"32px","cursor":"pointer","fontSize":"14px","display":"flex","alignItems":"center","justifyContent":"center"}}>✕</button>
        </div>
        <div id="stkModalTimelineBody" style={{"display":"flex","flexDirection":"column","gap":"10px"}}>
          {/* Day-by-day logs inserted dynamically */}
        </div>
      </div>

      {/* Clean Footer Bar */}
      <div className="detail-footer-bar-clean">
        <div style={{"display":"flex","alignItems":"center","gap":"8px"}}>
          <button type="button" className="btn-footer-slip-clean" id="btnDetailDownloadSlip" onClick={() => { if (window.handleDetailSlipClick) window.handleDetailSlipClick(); else if (window.openReportSlipFromDetail) window.openReportSlipFromDetail(); else if (window.openReportSlip) window.openReportSlip(currentlyInspectedId); }}>
            <span id="detailSlipIcon">📥</span> <span id="detailSlipText">Download Official Slip</span>
          </button>
          <div id="detailModalDeleteBtnSlot"></div>
          <div id="detailModalSupportBtnSlot"></div>
        </div>

        <div style={{"fontSize":"11px","color":"#64748B","fontWeight":"700","display":"flex","alignItems":"center","gap":"8px"}}>
          <span style={{"width":"24px","height":"2px","background":"#FF9933","display":"inline-block","borderRadius":"2px"}}></span>
          <span>Seva • Samadhan • Samriddh Bharat</span>
          <span style={{"width":"24px","height":"2px","background":"#138808","display":"inline-block","borderRadius":"2px"}}></span>
        </div>

        <div style={{"display":"flex","alignItems":"center","gap":"8px"}}>
          <button type="button" className="btn-footer-chat-clean" id="btnDetailChat" onClick={() => { closeModal('detailModal'); const a = typeof currentlyInspectedId !== 'undefined' ? currentlyInspectedId : ''; if (a && window.openChatModal) window.openChatModal(a); }}>
            <span>💬</span> <span>Problem Chat</span>
          </button>
          <button type="button" className="btn-footer-close-clean" onClick={() => { closeModal('detailModal') }}>
            Close
          </button>
        </div>
      </div>

    </div>
  </div>

  {/* ============================================================
     MODAL 3: FULLSCREEN IMAGE LIGHTBOX ZOOM
     ============================================================ */}
  <div className="lightbox-modal" id="imageZoomModal" onClick={() => { closeZoomModal() }}>
    <button className="lightbox-close-btn" onClick={() => { closeZoomModal() }}>✕</button>
    <img src="" className="lightbox-img-full" id="lightboxImg" onClick={() => { event.stopPropagation(); }} alt="Enlarged View" />
    <div className="lightbox-caption" id="lightboxCaption" onClick={() => { event.stopPropagation(); }}>Enlarged Photo</div>
  </div>

  {/* ============================================================
     MODAL: EVIDENCE GALLERY VIEWER (EXACT IMAGE 2 REPLICA)
     ============================================================ */}
  <div className="pdm-custom-gallery-overlay" id="galleryViewerModal" style={{"display":"none"}} onClick={() => { closeGalleryViewer() }}>
    <div className="pdm-custom-gallery-card" onClick={(e) => { e.stopPropagation(); }}>
      {/* Top Bar: Left Upper Corner Counter (1/2) & Right Upper Corner Close Button */}
      <div className="pdm-custom-gallery-top">
        <div className="pdm-custom-gallery-counter" id="galleryViewerCounter">1/1</div>
        <button type="button" className="pdm-custom-gallery-close" onClick={() => { closeGalleryViewer() }} title="Close (Esc)">✕</button>
      </div>

      {/* Middle Row: < Prev Button in Left of Image, Image with Black Outline, > Next Button in Right of Image */}
      <div className="pdm-custom-gallery-row">
        <button type="button" className="pdm-custom-nav-btn prev" id="galleryViewerPrevBtn" onClick={() => { prevGalleryViewerPhoto() }} title="Previous Photo (<)">
          ‹
        </button>

        <div className="pdm-custom-img-wrap">
          <img id="galleryViewerImg" src="" alt="Evidence" className="pdm-custom-img" />
          <video id="galleryViewerVideo" className="pdm-custom-img pdm-custom-video" controls style={{"display":"none","width":"100%","height":"100%","maxWidth":"100%","maxHeight":"100%","objectFit":"contain","borderRadius":"6px","background":"#000000","outline":"none"}} src=""></video>
        </div>

        <button type="button" className="pdm-custom-nav-btn next" id="galleryViewerNextBtn" onClick={() => { nextGalleryViewerPhoto() }} title="Next Photo (>)">
          ›
        </button>
      </div>

      {/* Bottom Details */}
      <div className="pdm-custom-gallery-footer" id="galleryViewerFooter">
        <span id="galleryViewerTitle" className="pdm-custom-gallery-title">Field Evidence</span>
        <span id="galleryViewerMeta" className="pdm-custom-gallery-meta">• Field Evidence · Citizen Upload</span>
      </div>
    </div>
  </div>

  {/* ============================================================
     OFFICIAL GRIEVANCE TRACKING SLIP MODAL (PRINT / DOWNLOAD)
     ============================================================ */}
  <div className="modal-overlay" id="reportSlipModal">
    <div className="modal-card-box" style={{"maxWidth":"820px","maxHeight":"94vh"}}>
      <div className="modal-header-bar"
        style={{"background":"linear-gradient(135deg, #002D62 0%, #001f44 100%)","color":"#fff","padding":"14px 22px"}}>
        <div style={{"display":"flex","alignItems":"center","gap":"10px"}}>
          <span style={{"fontSize":"20px"}}>📄</span>
          <div>
            <div style={{"fontSize":"15px","fontWeight":"800","color":"#fff"}}>Official Grievance Acknowledgment &amp; Status
              Slip</div>
            <div style={{"fontSize":"11px","color":"#93c5fd"}}>नागरिक शिकायत पावती पर्ची एवं प्रगति रिपोर्ट · Govt. of
              Jharkhand</div>
          </div>
        </div>
        <div style={{"display":"flex","alignItems":"center","gap":"10px"}}>
          <button type="button" className="btn-sol-yes" onClick={() => { printReportSlip() }}
            style={{"background":"#FF9933","color":"#000","fontWeight":"800","padding":"6px 14px","fontSize":"12px","borderRadius":"8px"}}>
            🖨️ Print / Save PDF
          </button>
          <button className="modal-close-btn" style={{"color":"#fff"}} onClick={() => { closeModal('reportSlipModal') }}>✕</button>
        </div>
      </div>

      <div className="modal-body-scroll" style={{"background":"#fdfbf7","padding":"22px"}}>
        {/* Printable Slip Paper Container */}
        <div className="slip-paper-sheet" id="slipPaperContent"
          style={{"background":"#ffffff","border":"2px solid #002D62","borderRadius":"12px","padding":"24px 26px","boxShadow":"0 4px 20px rgba(0,0,0,0.06)","position":"relative"}}>

          {/* Tricolor Header Strip */}
          <div
            style={{"height":"6px","width":"100%","background":"linear-gradient(to right, #FF9933 33.33%, #FFFFFF 33.33%, #FFFFFF 66.66%, #138808 66.66%)","borderRadius":"4px","marginBottom":"16px"}}>
          </div>

          {/* Official Header */}
          <div
            style={{"display":"flex","justifyContent":"space-between","alignItems":"center","borderBottom":"2px solid #002D62","paddingBottom":"14px","marginBottom":"16px"}}>
            <div style={{"display":"flex","alignItems":"center","gap":"14px"}}>
              <div style={{"fontSize":"38px","lineHeight":"1"}}>🇮🇳</div>
              <div>
                <div
                  style={{"fontSize":"16px","fontWeight":"900","color":"#002D62","letterSpacing":"0.5px","textTransform":"uppercase"}}>
                  GOVERNMENT OF JHARKHAND</div>
                <div style={{"fontSize":"12.5px","fontWeight":"800","color":"#EA580C"}}>Department of Higher, Technical
                  Education &amp; Societal Innovation</div>
                <div style={{"fontSize":"11px","color":"#4B5563","fontWeight":"600"}}>JanSetu National Societal
                  Problem-Solving Mission</div>
              </div>
            </div>
            <div style={{"textAlign":"right"}}>
              <div
                style={{"display":"inline-block","background":"#EFF6FF","border":"1.5px solid #BFDBFE","borderRadius":"8px","padding":"6px 12px","textAlign":"right"}}>
                <div style={{"fontSize":"10px","fontWeight":"800","color":"#1e40af","textTransform":"uppercase"}}>GRIEVANCE
                  TRACKING ID</div>
                <div style={{"fontSize":"15px","fontWeight":"900","color":"#002D62","fontFamily":"monospace"}}
                  id="slipGrievanceId">JH-2026-0000</div>
              </div>
              <div style={{"fontSize":"10.5px","color":"#6B7280","marginTop":"4px"}}>Generated: <strong
                  id="slipGeneratedDate">05 Sep 2026</strong></div>
            </div>
          </div>

          {/* Slip Watermark Title */}
          <div style={{"textAlign":"center","marginBottom":"16px"}}>
            <span
              style={{"fontSize":"12.5px","fontWeight":"900","color":"#002D62","background":"#fff7ed","border":"1px solid #fed7aa","padding":"4px 18px","borderRadius":"20px","textTransform":"uppercase","letterSpacing":"0.8px"}}
              data-i18n="slip_watermark_title">
              OFFICIAL GRIEVANCE ACKNOWLEDGMENT SLIP
            </span>
          </div>

          {/* Key Meta Grid */}
          <div
            style={{"display":"grid","gridTemplateColumns":"1.5fr 1fr","gap":"14px","background":"#f8fafc","border":"1px solid #e2e8f0","borderRadius":"10px","padding":"12px 16px","marginBottom":"16px"}}>
            <div>
              <div style={{"fontSize":"10.5px","color":"#64748b","fontWeight":"700","textTransform":"uppercase"}}>Grievance
                Title &amp; Category</div>
              <div style={{"fontSize":"14px","fontWeight":"800","color":"#0f172a","margin":"3px 0"}} id="slipTitle">Problem
                Title</div>
              <div style={{"display":"flex","gap":"8px","alignItems":"center","marginTop":"4px"}}>
                <span id="slipCategoryBadge"
                  style={{"fontSize":"11px","fontWeight":"800","color":"#002D62","background":"#dbeafe","padding":"2px 8px","borderRadius":"12px"}}>Water
                  Management</span>
                <span id="slipStatusBadge"
                  style={{"fontSize":"11px","fontWeight":"800","color":"#166534","background":"#dcfce7","padding":"2px 8px","borderRadius":"12px"}}>Being
                  Worked On</span>
              </div>
            </div>
            <div>
              <div style={{"fontSize":"10.5px","color":"#64748b","fontWeight":"700","textTransform":"uppercase"}}>Location
                &amp; Coordinates</div>
              <div style={{"fontSize":"12px","fontWeight":"800","color":"#0f172a","marginTop":"3px"}} id="slipLocation">Village
                Namkum, Ranchi</div>
              <div style={{"fontSize":"11px","color":"#1e40af","fontWeight":"700","marginTop":"2px"}} id="slipCoords">📍 Lat:
                23.3441° N, Lng: 85.3096° E</div>
            </div>
          </div>

          {/* Problem Description */}
          <div style={{"marginBottom":"16px"}}>
            <div
              style={{"fontSize":"11px","fontWeight":"800","color":"#334155","textTransform":"uppercase","marginBottom":"4px"}}>
              Problem Statement / Ground Issue:</div>
            <div
              style={{"fontSize":"12px","color":"#1e293b","background":"#ffffff","border":"1px solid #e2e8f0","borderRadius":"8px","padding":"8px 12px","lineHeight":"1.5"}}
              id="slipDescription">Detailed description of problem...</div>
          </div>

          {/* Kis Din Kya Hua: Complete Milestone Audit Track */}
          <div style={{"marginBottom":"16px"}}>
            <div
              style={{"fontSize":"11.5px","fontWeight":"800","color":"#002D62","textTransform":"uppercase","marginBottom":"6px","display":"flex","justifyContent":"space-between","alignItems":"center"}}>
              <span>📋 <span data-i18n="slip_audit_trail_title">Chronological Progress &amp; Audit Trail</span></span>
              <span style={{"fontSize":"10.5px","color":"#166534","fontWeight":"700"}}>Verified Timeline</span>
            </div>
            <table
              style={{"width":"100%","borderCollapse":"collapse","fontSize":"11px","border":"1px solid #cbd5e1","borderRadius":"8px","overflow":"hidden"}}
              id="slipTimelineTable">
              <thead>
                <tr style={{"background":"#f1f5f9","textAlign":"left","color":"#334155"}}>
                  <th style={{"padding":"7px 10px","borderBottom":"1px solid #cbd5e1"}}>Milestone / Stage</th>
                  <th style={{"padding":"7px 10px","borderBottom":"1px solid #cbd5e1"}}>Date &amp; Time</th>
                  <th style={{"padding":"7px 10px","borderBottom":"1px solid #cbd5e1"}}>Assigned Taskforce / Authority</th>
                  <th style={{"padding":"7px 10px","borderBottom":"1px solid #cbd5e1","textAlign":"right"}}>Status</th>
                </tr>
              </thead>
              <tbody id="slipTimelineRows">
                {/* Dynamically populated */}
              </tbody>
            </table>
          </div>

          {/* Photographic Ground Evidence (Images Sab) */}
          <div style={{"marginBottom":"16px"}}>
            <div
              style={{"fontSize":"11.5px","fontWeight":"800","color":"#002D62","textTransform":"uppercase","marginBottom":"6px"}}>
              📸 <span data-i18n="slip_photos_title">Photographic Ground Proofs</span>
            </div>
            <div style={{"display":"grid","gridTemplateColumns":"1fr 1fr","gap":"12px"}}>
              <div
                style={{"border":"1px solid #cbd5e1","borderRadius":"8px","padding":"8px","background":"#f8fafc","textAlign":"center"}}>
                <span style={{"fontSize":"10.5px","fontWeight":"800","color":"#b91c1c","display":"block","marginBottom":"4px"}}
                  data-i18n="slip_before_label">BEFORE: Ground Photo</span>
                <img id="slipBeforeImg" src="/images/water-tap.jpg"
                  style={{"width":"100%","height":"125px","objectFit":"cover","borderRadius":"6px","border":"1px solid #e2e8f0"}}
                  alt="Before Proof" />
              </div>
              <div
                style={{"border":"1px solid #cbd5e1","borderRadius":"8px","padding":"8px","background":"#f8fafc","textAlign":"center"}}>
                <span style={{"fontSize":"10.5px","fontWeight":"800","color":"#15803d","display":"block","marginBottom":"4px"}}
                  data-i18n="slip_after_label">AFTER: Resolution Photo</span>
                <img id="slipAfterImg" src="/images/water-tap.jpg"
                  style={{"width":"100%","height":"125px","objectFit":"cover","borderRadius":"6px","border":"1px solid #e2e8f0"}}
                  alt="After Proof" />
                <div id="slipAfterPendingNotice"
                  style={{"display":"none","height":"125px","borderRadius":"6px","background":"#fff","border":"1.5px dashed #cbd5e1","flexDirection":"column","alignItems":"center","justifyContent":"center","gap":"4px","padding":"8px"}}>
                  <span style={{"fontSize":"20px"}}>⏳</span>
                  <span style={{"fontSize":"11px","fontWeight":"800","color":"#475569"}}>Work in Progress</span>
                  <span style={{"fontSize":"9.5px","color":"#94a3b8"}}>Taskforce ground proof will appear upon
                    resolution</span>
                </div>
              </div>
            </div>
          </div>

          {/* Official Stamp & Legal Notice */}
          <div
            style={{"display":"flex","justifyContent":"space-between","alignItems":"flex-end","borderTop":"1px dashed #cbd5e1","paddingTop":"12px"}}>
            <div>
              <div style={{"fontSize":"10.5px","fontWeight":"700","color":"#475569"}}>Citizen Helpline:
                <strong>1800-JAN-SETU</strong></div>
              <div style={{"fontSize":"9.5px","color":"#94a3b8","marginTop":"2px"}}>Authenticated computer-generated document
                under JanSetu Municipal Governance.</div>
            </div>
            <div
              style={{"textAlign":"center","border":"1.5px solid #002D62","borderRadius":"8px","padding":"5px 12px","background":"#f0fdf4"}}>
              <div style={{"fontSize":"16px"}}>🏛️</div>
              <div style={{"fontSize":"9px","fontWeight":"800","color":"#002D62"}}>JANSETU MISSION SEAL</div>
              <div style={{"fontSize":"8px","color":"#166534","fontWeight":"700"}}>AUTHENTICATED DIGITAL RECORD</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>


  {/* ============================================================
  {/* ============================================================
     MODAL 5: ALL MY REPORTS (REDESIGNED PREMIUM V2 - REFERENCE MATCH)
     ============================================================ */}
  <div className="modal-overlay" id="allReportsModal">
    <div className="modal-card-box all-submitted-modal-box">
      {/* Header Bar */}
      <div className="all-rep-modal-header">
        <div className="all-rep-header-left">
          <div className="all-rep-header-icon">📋</div>
          <div className="all-rep-title-block">
            <h2 className="all-rep-main-title" data-i18n="modal_all_reports_title">All Submitted Reports</h2>
            <p className="all-rep-subtitle">Track and manage all the issues you have reported.</p>
          </div>
        </div>
        
        <div className="all-rep-header-right">
          <div className="all-rep-quote-pill">
            <span className="quote-leaf-icon">🌱</span>
            <div className="quote-text-wrap">
              <span className="quote-line1">"Your Reports Help Build</span>
              <span className="quote-line2">A Cleaner, Safer Jharkhand"</span>
            </div>
          </div>
          <button type="button" className="all-rep-close-btn" onClick={() => { closeModal('allReportsModal') }} title="Close">✕</button>
        </div>
      </div>

      {/* Filter Tabs & Live Search / Sort Row */}
      <div className="all-rep-toolbar-row">
        <div className="all-rep-tabs-group">
          <button type="button" id="tabAllRepAll" className="all-rep-filter-pill active" onClick={() => { filterAllReportsModal('all') }}>
            <span className="pill-icon">📋</span>
            <span>All Reports</span>
            <span className="pill-counter" id="countAllRepAll">(0)</span>
          </button>
          <button type="button" id="tabAllRepProg" className="all-rep-filter-pill in-prog" onClick={() => { filterAllReportsModal('in_progress') }}>
            <span className="pill-icon">⏳</span>
            <span>In Progress</span>
            <span className="pill-counter" id="countAllRepProg">(0)</span>
          </button>
          <button type="button" id="tabAllRepSolved" className="all-rep-filter-pill resolved" onClick={() => { filterAllReportsModal('solved') }}>
            <span className="pill-icon">✅</span>
            <span>Resolved</span>
            <span className="pill-counter" id="countAllRepSolved">(0)</span>
          </button>
        </div>

        <div className="all-rep-search-sort-group">
          <div className="all-rep-search-box">
            <span className="search-mag-icon">🔍</span>
            <input 
              type="text" 
              id="allRepSearchInput" 
              className="all-rep-search-control" 
              placeholder="Search your reports..." 
              onInput={(e) => { if (window.onAllReportsSearch) window.onAllReportsSearch(e.target.value); }} 
            />
          </div>

          <div className="all-rep-sort-box">
            <select 
              id="allRepSortSelect" 
              className="all-rep-sort-control" 
              onChange={(e) => { if (window.onAllReportsSortChange) window.onAllReportsSortChange(e.target.value); }}
            >
              <option value="latest">⇅ Latest First</option>
              <option value="oldest">⇅ Oldest First</option>
              <option value="status">⇅ By Status</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports Card List Container */}
      <div className="modal-body-scroll all-rep-scroll-body" id="allReportsModalList">
        {/* Populated dynamically via renderAllReportsModalList() */}
      </div>
    </div>
  </div>

  {/* ============================================================
     MODAL 6: ACTION REQUIRED (Need More Information)
     ============================================================ */}
  <div className="modal-overlay" id="needInfoModal">
    <div className="modal-card-box">
      <div className="modal-header-bar">
        <div className="modal-header-title">
          <span>⚠️</span>
          <span data-i18n="modal_need_info_title">Action Required: Provide Information</span>
        </div>
        <button className="modal-close-btn" onClick={() => { closeModal('needInfoModal') }}>✕</button>
      </div>
      <div className="modal-body-scroll">
        <div
          style={{"background":"#FEF3C7","border":"1px solid #FCD34D","borderRadius":"12px","padding":"14px","fontSize":"13px","color":"#92400E"}}>
          <strong data-i18n="authority_note_title">JanSetu Authority Note:</strong>
          <p id="needInfoQueryText" style={{"marginTop":"4px"}}>Please provide landmark or fresh photo for the drinking
            water pipeline report.</p>
        </div>

        <div className="form-group-field">
          <label className="form-label-text" data-i18n="label_add_landmark">📍 Add Landmark</label>
          <input type="text" className="form-input-control" id="infoLandmark"
            placeholder="e.g. Near Anganwadi Centre, Ward 4" />
        </div>

        <div className="form-group-field">
          <label className="form-label-text" data-i18n="label_explain_voice">🎤 Explain by Voice</label>
          <div style={{"display":"flex","gap":"8px"}}>
            <input type="text" className="form-input-control" id="infoVoiceText"
              placeholder="Voice transcript or extra details..." />
            <button type="button" className="btn-gps-autodetect" style={{"margin":"0","whiteSpace":"nowrap"}}
              onClick={() => { recordNeedInfoVoice() }}>🎙️ Record</button>
          </div>
        </div>

        <div className="form-group-field">
          <label className="form-label-text" data-i18n="label_fresh_photo">📷 Add Fresh Photo / Video Proof</label>
          <input type="file" id="infoProofFile" className="form-input-control"
            accept="image/png, image/jpeg, image/jpg, video/mp4, video/webm" />
        </div>

        <div className="modal-footer-nav">
          <button type="button" className="btn-modal-secondary" onClick={() => { closeModal('needInfoModal') }}
            data-i18n="btn_cancel">Cancel</button>
          <button type="button" className="btn-modal-primary" onClick={() => { submitNeedInfoResponse() }}
            data-i18n="btn_send_info">Send Information →</button>
        </div>
      </div>
    </div>
  </div>

  {/* ============================================================
     MODAL 7: REOPEN PROBLEM (FEEDBACK SYSTEM)
     ============================================================ */}
  <div className="modal-overlay" id="reopenModal">
    <div className="modal-card-box" style={{"maxWidth":"580px"}}>
      <div className="modal-header-bar" style={{"background":"#FEF2F2","borderBottom":"1.5px solid #FCA5A5"}}>
        <div>
          <div className="modal-header-title" style={{"color":"#991B1B"}}>
            <span>🔴</span>
            <span data-i18n="modal_reopen_title">Reopen Grievance</span>
          </div>
          <div style={{"fontSize":"11.5px","color":"#B91C1C","fontWeight":"700","marginTop":"2px"}}>
            Grievance ID: <span id="reopenReportTargetBadge"
              style={{"fontFamily":"monospace","fontSize":"12.5px","fontWeight":"900","color":"#7F1D1D"}}>JH-2026-4819</span>
          </div>
        </div>
        <button className="modal-close-btn" onClick={() => { closeModal('reopenModal') }}>✕</button>
      </div>

      <div className="modal-body-scroll" style={{"padding":"20px"}}>
        <div
          style={{"background":"#FFF7ED","border":"1px solid #FFEDD5","borderRadius":"10px","padding":"10px 14px","marginBottom":"16px"}}>
          <p style={{"fontSize":"12.5px","color":"#9A3412","lineHeight":"1.45","margin":"0"}}>
            <strong>Ground Reality Audit:</strong> If the ground problem is still not resolved or was marked solved
            incorrectly, please report the exact persisting spot and attach a fresh photo proof for university taskforce
            re-inspection.
          </p>
        </div>

        {/* Exact Persisting Location */}
        <div className="form-group-field" style={{"marginBottom":"14px"}}>
          <div style={{"display":"flex","justifyContent":"space-between","alignItems":"center","marginBottom":"5px"}}>
            <label className="form-label-text" style={{"marginBottom":"0","fontWeight":"800","color":"var(--navy)"}}
              data-i18n="label_reopen_location">
              📍 Exact Location of Persisting Problem *
            </label>
            <button type="button" onClick={() => { reopenDetectGps() }}
              style={{"padding":"3px 9px","fontSize":"10.5px","background":"#EFF6FF","border":"1px solid #BFDBFE","color":"var(--navy)","borderRadius":"6px","fontWeight":"700","cursor":"pointer"}}>
              📍 Auto-Detect GPS
            </button>
          </div>
          <input type="text" className="form-input-control" id="reopenLocationInput"
            placeholder="e.g. Near Old Well, Ward 3, Namkum, Ranchi" />
          <div id="reopenGpsPill"
            style={{"display":"none","fontSize":"11px","color":"#1e40af","fontWeight":"700","marginTop":"4px","background":"#dbeafe","padding":"2px 8px","borderRadius":"8px","width":"fit-content"}}>
            📍 GPS: 23.3441° N, 85.3096° E
          </div>
        </div>

        {/* Persisting Reason */}
        <div className="form-group-field" style={{"marginBottom":"14px"}}>
          <label className="form-label-text" style={{"fontWeight":"800","color":"var(--navy)"}} data-i18n="label_reopen_reason">
            Why does the problem still persist? *
          </label>
          <textarea className="form-input-control" id="reopenReasonInput" rows="3"
            placeholder="Tell the taskforce what is still broken or incomplete on the ground..."></textarea>
        </div>

        {/* Fresh Proof Photo with Instant Preview */}
        <div className="form-group-field" style={{"marginBottom":"14px"}}>
          <label className="form-label-text" style={{"fontWeight":"800","color":"var(--navy)"}} data-i18n="label_reopen_proof">
            📷 Fresh Ground Photo Proof *
          </label>
          <input type="file" id="reopenPhotoInput" className="form-input-control"
            accept="image/png, image/jpeg, image/jpg, image/webp" onChange={(e) => { handleReopenPhotoSelect(this) }} />
          <div id="reopenPhotoPreview"
            style={{"display":"none","marginTop":"10px","alignItems":"center","gap":"12px","padding":"10px","background":"#FEF2F2","border":"1.5px dashed #F87171","borderRadius":"10px"}}>
            <img id="reopenPhotoImg" src=""
              style={{"width":"58px","height":"58px","objectFit":"cover","borderRadius":"8px","border":"1px solid #E5E7EB","flexShrink":"0"}}
              alt="Reopen Photo" />
            <div>
              <div style={{"fontSize":"12px","fontWeight":"800","color":"#991B1B"}}>✓ Fresh ground proof attached</div>
              <div style={{"fontSize":"10.5px","color":"#6B7280","marginTop":"2px"}}>This photo will replace the solved status
                and notify taskforce engineers.</div>
            </div>
          </div>
        </div>

        <div className="modal-footer-nav" style={{"marginTop":"16px"}}>
          <button type="button" className="btn-modal-secondary" onClick={() => { closeModal('reopenModal') }}
            data-i18n="btn_cancel">Cancel</button>
          <button type="button" className="btn-modal-primary" style={{"background":"#DC2626"}} onClick={() => { submitReopenProblem() }}>
            🔴 Reopen Grievance &amp; Alert Taskforce
          </button>
        </div>
      </div>
    </div>
  </div>

  {/* ============================================================
     MODAL: DELETE GRIEVANCE CONFIRMATION (SECURITY VERIFICATION)
     ============================================================ */}
  <div className="modal-overlay" id="deleteConfirmModal">
    <div className="modal-card-box" style={{"maxWidth":"520px"}}>
      <div className="modal-header-bar" style={{"background":"#FEF2F2","borderBottom":"1.5px solid #FCA5A5"}}>
        <div className="modal-header-title" style={{"color":"#991B1B","display":"flex","alignItems":"center","gap":"8px"}}>
          <span>⚠️</span>
          <span data-i18n="modal_delete_title">Delete Grievance</span>
        </div>
        <button className="modal-close-btn" onClick={() => { closeModal('deleteConfirmModal') }}>✕</button>
      </div>

      <div className="modal-body-scroll" style={{"padding":"20px"}}>
        <div
          style={{"background":"#FEF2F2","border":"1.5px solid #FECACA","borderRadius":"12px","padding":"14px","marginBottom":"16px"}}>
          <div style={{"fontSize":"13px","fontWeight":"800","color":"#991B1B","display":"flex","alignItems":"center","gap":"6px"}}>
            <span>🚨</span> <span data-i18n="delete_warn_title">Permanent Deletion Confirmation</span>
          </div>
          <p style={{"fontSize":"12.5px","color":"#7F1D1D","marginTop":"6px","lineHeight":"1.5","marginBottom":"0"}}>
            <span data-i18n="delete_confirm_desc">Are you sure you want to permanently delete this grievance from
              JanSetu portal?</span>
            <br /><span style={{"marginTop":"6px","display":"inline-block"}}>Grievance ID: <strong
                id="deleteTargetReportIdBadge"
                style={{"fontFamily":"monospace","background":"#FEE2E2","padding":"2px 6px","borderRadius":"4px","color":"#991B1B"}}>JH-2026-4819</strong></span>
          </p>
        </div>

        <div
          style={{"fontSize":"11.5px","color":"#475569","marginBottom":"16px","background":"#F8FAFC","padding":"10px 12px","borderRadius":"8px","border":"1px solid #E2E8F0"}}
          data-i18n="delete_notice">
          ℹ️ <strong>Notice:</strong> Only unverified grievances can be deleted. Once an administrative work order is
          issued, grievances cannot be deleted under municipal audit regulations.
        </div>

        <div style={{"marginBottom":"16px"}}>
          <div style={{"display":"flex","justifyContent":"space-between","alignItems":"center","marginBottom":"6px"}}>
            <label htmlFor="deleteSecurityInput"
              style={{"fontSize":"12px","fontWeight":"800","color":"#991B1B"}}
              data-i18n="delete_security_label">
              To confirm deletion, please type DELETE below:
            </label>
            <button type="button"
              onClick={() => { const inp = document.getElementById('deleteSecurityInput'); if (inp) { inp.value = 'DELETE'; if (typeof window !== 'undefined' && window.onDeleteSecurityInputChange) window.onDeleteSecurityInputChange(); } }}
              style={{"background":"#FEE2E2","border":"1px solid #FCA5A5","color":"#991B1B","borderRadius":"6px","padding":"2px 8px","fontSize":"11px","fontWeight":"800","cursor":"pointer"}}>
              Click to Auto-Fill DELETE ⚡
            </button>
          </div>
          <input type="text" className="form-input-control" id="deleteSecurityInput" placeholder="DELETE"
            onInput={() => { if (typeof window !== 'undefined' && window.onDeleteSecurityInputChange) window.onDeleteSecurityInputChange(); }}
            onChange={() => { if (typeof window !== 'undefined' && window.onDeleteSecurityInputChange) window.onDeleteSecurityInputChange(); }}
            onKeyUp={() => { if (typeof window !== 'undefined' && window.onDeleteSecurityInputChange) window.onDeleteSecurityInputChange(); }}
            autoComplete="off"
            style={{"fontFamily":"monospace","fontWeight":"900","fontSize":"15px","textTransform":"uppercase","textAlign":"center","letterSpacing":"2px","border":"2px solid #FCA5A5","background":"#FFFFFF","color":"#991B1B","padding":"10px 12px","width":"100%","boxSizing":"border-box","borderRadius":"10px"}} />
        </div>

        <div className="modal-footer-nav" style={{"display":"flex","gap":"10px","justifyContent":"flex-end"}}>
          <button type="button" className="btn-modal-secondary" onClick={() => { if (typeof window !== 'undefined' && window.closeModal) window.closeModal('deleteConfirmModal'); else if (typeof closeModal === 'function') closeModal('deleteConfirmModal'); }}
            style={{"padding":"9px 18px","borderRadius":"10px","fontWeight":"700"}}>
            ✕ <span data-i18n="btn_cancel">Cancel</span>
          </button>
          <button type="button" id="btnExecuteDeleteReport" className="btn-modal-primary"
            style={{"background":"#DC2626","borderColor":"#B91C1C","opacity":"0.45","cursor":"not-allowed","pointerEvents":"none","padding":"10px 22px","borderRadius":"10px","fontWeight":"800","boxShadow":"0 3px 10px rgba(220,38,38,0.25)"}}
            onClick={() => { if (typeof window !== 'undefined' && window.executeReportDeletion) window.executeReportDeletion(); }}>
            🗑️ <span data-i18n="btn_confirm_delete">Permanently Delete Grievance</span>
          </button>
        </div>
      </div>
    </div>
  </div>

  {/* ============================================================
     MODAL 8: MY IMPACT, PROFILE & NOTIFICATIONS
     ============================================================ */}
  <div className="modal-overlay" id="impactModal">
    <div className="modal-card-box">
      <div className="modal-header-bar">
        <div className="modal-header-title" data-i18n="modal_impact_title">🌟 My Verified Impact</div>
        <button className="modal-close-btn" onClick={() => { closeModal('impactModal') }}>✕</button>
      </div>
      <div className="modal-body-scroll">
        <div className="impact-metric-row"><span data-i18n="impact_reported">Problems Reported</span><strong
            id="impactModalReported">12</strong></div>
        <div className="impact-metric-row"><span data-i18n="impact_solved">Problems Solved</span><strong
            id="impactModalResolved">7</strong></div>
        <div className="impact-metric-row"><span data-i18n="impact_citizens">Total Reports Supported</span><strong
            id="impactModalSupported">0 reports</strong></div>
        <button className="btn-modal-primary" style={{"marginTop":"14px"}} onClick={() => { closeModal('impactModal') }}
          data-i18n="btn_done">Done</button>
      </div>
    </div>
  </div>

  {/* ============================================================
     MODAL: CITIZEN CIVIC IDENTITY & SECURE PROFILE
     ============================================================ */}
  {/* ============================================================
     MODAL: CITIZEN CIVIC IDENTITY & SECURE PROFILE (IMAGE 2 REVAMP)
     ============================================================ */}
  <div className="modal-overlay" id="profileModal">
    <div className="modal-card-box profile-modal-revamp">
      {/* Indian National Flag Tricolor Top Bar */}
      <div className="profile-tricolor-bar"></div>

      {/* Top Right Civic Watermark Tag */}
      <div className="profile-watermark-tag">
        <div className="watermark-title">Citizens</div>
        <div className="watermark-sub">Build a Better Tomorrow</div>
        <div className="watermark-bar"></div>
      </div>

      {/* Close Button */}
      <button type="button" className="modal-close-btn" onClick={() => { closeModal('profileModal') }}
        style={{"position":"absolute","top":"12px","right":"14px","color":"#475569","background":"#F1F5F9","border":"1px solid #CBD5E1","borderRadius":"50%","width":"28px","height":"28px","display":"flex","alignItems":"center","justifyContent":"center","fontSize":"12px","cursor":"pointer","zIndex":"5"}} title="Close">✕</button>

      {/* Profile Hero Header */}
      <div className="profile-hero-section">
        <div style={{"display":"flex","alignItems":"center","gap":"14px"}}>
          <div className="profile-avatar-wrapper" id="profAvatarBig">
            R
            <div className="profile-avatar-check" id="profAvatarCheckBadge">✓</div>
          </div>
          <div>
            <div id="profVerifiedStatusBadge" style={{"display":"inline-flex","alignItems":"center","gap":"5px","background":"#ECFDF5","border":"1px solid #A7F3D0","padding":"2px 8px","borderRadius":"12px","fontSize":"10px","fontWeight":"800","color":"#059669","marginBottom":"3px"}}>
              <span>🛡️</span> <span id="profVerifiedBadgeText" data-i18n="profile_verified_badge">Verified Citizen</span>
            </div>
            <div style={{"fontSize":"19px","fontWeight":"800","color":"#0F172A","letterSpacing":"-0.2px","lineHeight":"1.2"}}
              id="profNameHeader">Rajesh Mahto</div>
            <div style={{"fontSize":"11px","color":"#475569","display":"flex","alignItems":"center","gap":"8px","marginTop":"3px","flexWrap":"wrap"}}>
              <span>🆔 <span data-i18n="profile_citizen_id_label">Citizen ID</span>: <strong id="profCitizenIdHeader" style={{"color":"#002D62","fontWeight":"800"}}>C4819</strong></span>
              <span>|</span>
              <span>📍 <span id="profCityDistrictHeader">Dhanbad, Jharkhand</span></span>
            </div>
            <div style={{"fontSize":"10px","color":"#94A3B8","marginTop":"2px"}}>
              Registered on JanSetu • Member since 2024
            </div>
          </div>
        </div>
        <button type="button" className="btn-profile-edit-clean" onClick={() => { openChangeNameModal() }}>
          ✏️ <span data-i18n="btn_edit_profile">Edit Profile</span>
        </button>
      </div>

      {/* Profile 4 Sections Body */}
      <div className="modal-body-scroll" style={{"padding":"16px 22px 10px","maxHeight":"520px","background":"#FFFFFF"}}>

        {/* 1. Personal Information */}
        <div className="profile-block-group">
          <div className="profile-block-head">
            <span className="profile-block-title">👤 <span data-i18n="prof_section_personal">Personal Information</span></span>
            <span className="profile-block-sub">Basic details used for your JanSetu account</span>
          </div>
          <div className="profile-row-item">
            <div style={{"display":"flex","alignItems":"center","gap":"12px"}}>
              <div className="profile-icon-box blue">👤</div>
              <div>
                <div style={{"fontSize":"9.5px","color":"#64748B","fontWeight":"700","textTransform":"uppercase"}}>Full Name</div>
                <div style={{"fontSize":"13px","fontWeight":"800","color":"#0F172A"}} id="profDisplayName">Rajesh Mahto</div>
              </div>
            </div>
            <button type="button" className="btn-profile-edit-clean" onClick={() => { openChangeNameModal() }}>
              ✏️ <span data-i18n="btn_change_name">Change Name</span>
            </button>
          </div>
        </div>

        {/* 2. Contact Information */}
        <div className="profile-block-group">
          <div className="profile-block-head">
            <span className="profile-block-title">✉️ <span data-i18n="prof_section_contact">Contact Information</span></span>
            <span className="profile-block-sub">Used for important updates and notifications</span>
          </div>

          {/* Email Row */}
          <div className="profile-row-item">
            <div style={{"display":"flex","alignItems":"center","gap":"12px"}}>
              <div className="profile-icon-box green">✉️</div>
              <div>
                <div style={{"fontSize":"9.5px","color":"#64748B","fontWeight":"700","textTransform":"uppercase"}}>Email Address</div>
                <div style={{"display":"flex","alignItems":"center","gap":"8px","marginTop":"1px"}}>
                  <span style={{"fontSize":"13px","fontWeight":"800","color":"#0F172A"}} id="profDisplayEmail">rajesh@gmail.com</span>
                  <span style={{"fontSize":"9.5px","fontWeight":"800","background":"#ECFDF5","color":"#059669","border":"1px solid #A7F3D0","padding":"1.5px 6px","borderRadius":"6px"}}>✓ Verified</span>
                </div>
              </div>
            </div>
            <button type="button" className="btn-profile-edit-clean" onClick={() => { openChangeEmailModal() }}>
              ✏️ <span data-i18n="btn_change_email">Change Email</span>
            </button>
          </div>

          {/* Mobile Row */}
          <div className="profile-row-item">
            <div style={{"display":"flex","alignItems":"center","gap":"12px"}}>
              <div className="profile-icon-box green">📞</div>
              <div>
                <div style={{"fontSize":"9.5px","color":"#64748B","fontWeight":"700","textTransform":"uppercase"}}>Mobile Number</div>
                <div style={{"display":"flex","alignItems":"center","gap":"8px","marginTop":"1px"}}>
                  <span style={{"fontSize":"13px","fontWeight":"800","color":"#0F172A"}} id="profDisplayPhone">+91 9431100003</span>
                  <span style={{"fontSize":"9.5px","fontWeight":"800","background":"#ECFDF5","color":"#059669","border":"1px solid #A7F3D0","padding":"1.5px 6px","borderRadius":"6px"}}>✓ OTP Verified</span>
                </div>
              </div>
            </div>
            <button type="button" className="btn-profile-edit-clean" onClick={() => { openChangeMobileModal() }}>
              ✏️ <span data-i18n="btn_change_mobile">Change Mobile</span>
            </button>
          </div>
        </div>

        {/* 3. Identity & Verification */}
        <div className="profile-block-group">
          <div className="profile-block-head">
            <span className="profile-block-title">🛡️ <span data-i18n="prof_section_identity">Identity &amp; Verification</span></span>
            <span className="profile-block-sub">Government verified identity</span>
          </div>

          {/* Dynamic Aadhaar Identity Block (Verified vs Unverified) */}
          <div id="profAadhaarDynamicBox">
            <div className="aadhaar-status-box-verified" id="profAadhaarVerifiedCard">
              <div style={{"display":"flex","alignItems":"center","gap":"12px"}}>
                <div style={{"width":"42px","height":"42px","display":"flex","alignItems":"center","justifyContent":"center","flexShrink":"0"}}>
                  <svg width="40" height="40" viewBox="0 0 100 100" fill="none">
                    <circle cx="50" cy="50" r="18" fill="#FF9933" />
                    <circle cx="50" cy="50" r="12" fill="#FFFFFF" />
                    <circle cx="50" cy="50" r="7" fill="#002D62" />
                    <path d="M50 8 L50 20 M50 80 L50 92 M8 50 L20 50 M80 50 L92 50 M20 20 L29 29 M71 71 L80 80 M20 80 L29 71 M71 29 L80 20" stroke="#FF9933" strokeWidth="4" strokeLinecap="round" />
                    <path d="M50 14 L50 19 M50 81 L50 86 M14 50 L19 50 M81 50 L86 50 M26 26 L30 30 M70 70 L74 74 M26 74 L30 70 M70 30 L74 26" stroke="#EA580C" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                </div>
                <div>
                  <div style={{"fontSize":"9.5px","color":"#475569","fontWeight":"700","textTransform":"uppercase"}}>Aadhaar Number</div>
                  <div style={{"fontFamily":"monospace","fontSize":"15px","fontWeight":"800","color":"#0F172A","letterSpacing":"1.5px"}} id="profDisplayAadhaar">XXXX-XXXX-4819</div>
                  <div style={{"fontSize":"9.5px","color":"#64748B","marginTop":"1px"}}>Unique Identification Authority of India (UIDAI)</div>
                </div>
              </div>
              <div style={{"textAlign":"right","flexShrink":"0"}}>
                <div style={{"fontSize":"11px","fontWeight":"800","color":"#059669","display":"flex","alignItems":"center","justifyContent":"flex-end","gap":"4px"}}>
                  ✓ <span>Verified &amp; Linked</span>
                </div>
                <div style={{"fontSize":"10px","fontWeight":"700","color":"#166534","marginTop":"2px"}}>
                  ✓ Biometric Active
                </div>
                <div style={{"fontSize":"9px","color":"#64748B","marginTop":"2px"}}>
                  Digital India UID
                </div>
              </div>
            </div>

            {/* Unverified State Card (Displayed when citizen has not verified Aadhaar) */}
            <div className="aadhaar-status-box-unverified" id="profAadhaarUnverifiedCard" style={{"display":"none"}}>
              <div style={{"display":"flex","alignItems":"center","gap":"12px"}}>
                <div style={{"width":"42px","height":"42px","display":"flex","alignItems":"center","justifyContent":"center","flexShrink":"0"}}>
                  <svg width="40" height="40" viewBox="0 0 100 100" fill="none">
                    <circle cx="50" cy="50" r="18" fill="#F59E0B" />
                    <circle cx="50" cy="50" r="12" fill="#FFFFFF" />
                    <circle cx="50" cy="50" r="7" fill="#64748B" />
                    <path d="M50 8 L50 20 M50 80 L50 92 M8 50 L20 50 M80 50 L92 50 M20 20 L29 29 M71 71 L80 80 M20 80 L29 71 M71 29 L80 20" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                </div>
                <div>
                  <div style={{"fontSize":"9.5px","color":"#92400E","fontWeight":"700","textTransform":"uppercase"}}>Aadhaar Identity</div>
                  <div style={{"fontFamily":"monospace","fontSize":"14px","fontWeight":"800","color":"#B45309"}} id="profDisplayAadhaarUnverified">Not Linked / Unverified</div>
                  <div style={{"fontSize":"9.5px","color":"#78350F","marginTop":"1px"}}>Unique Identification Authority of India (UIDAI)</div>
                </div>
              </div>
              <div style={{"display":"flex","flexDirection":"column","alignItems":"flex-end","gap":"6px","flexShrink":"0"}}>
                <span style={{"fontSize":"10px","fontWeight":"800","background":"#FEF3C7","color":"#92400E","border":"1px solid #FDE68A","padding":"2px 8px","borderRadius":"6px"}}>
                  ⚠️ Unverified
                </span>
                <button type="button" className="btn-verify-aadhaar-cta" onClick={() => { openVerifyAadhaarModal() }}>
                  🔐 <span>Verify &amp; Authenticate</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Security */}
        <div className="profile-block-group">
          <div className="profile-block-head">
            <span className="profile-block-title">🔒 <span data-i18n="prof_section_security">Security</span></span>
            <span className="profile-block-sub">Keep your account secure</span>
          </div>
          <div className="profile-row-item">
            <div style={{"display":"flex","alignItems":"center","gap":"12px"}}>
              <div className="profile-icon-box orange">🔒</div>
              <div>
                <div style={{"fontSize":"9.5px","color":"#64748B","fontWeight":"700","textTransform":"uppercase"}}>Password</div>
                <div style={{"fontSize":"13px","fontWeight":"800","color":"#0F172A","letterSpacing":"2px"}}>••••••••</div>
                <div style={{"fontSize":"9.5px","color":"#64748B","marginTop":"1px"}}>Master Password + Aadhaar Multi-Factor Protected</div>
              </div>
            </div>
            <button type="button" className="btn-profile-edit-clean" onClick={() => { openChangePasswordModal() }}>
              ✏️ <span data-i18n="btn_change_password">Change Password</span>
            </button>
          </div>
        </div>

      </div>

      {/* Footer Buttons */}
      <div style={{"padding":"12px 22px 14px","display":"flex","justifyContent":"space-between","alignItems":"center","borderTop":"1px solid #E2E8F0","background":"#FFFFFF"}}>
        <button type="button" onClick={() => { handleLogout() }}
          style={{"padding":"7px 16px","fontSize":"11.5px","fontWeight":"700","color":"#DC2626","background":"#FFFFFF","border":"1.5px solid #FECACA","borderRadius":"8px","cursor":"pointer","display":"inline-flex","alignItems":"center","gap":"6px"}}>
          🚪 <span data-i18n="btn_logout">Log Out</span>
        </button>

        <div style={{"display":"flex","alignItems":"center","gap":"8px"}}>
          {/* Subtle Simulation Toggle for Demo Testing */}
          <button type="button" onClick={() => { toggleAadhaarVerificationTest() }}
            style={{"fontSize":"10px","color":"#64748B","background":"none","border":"none","cursor":"pointer","textDecoration":"underline"}}>
            [Toggle Aadhaar Verification Demo]
          </button>
          <button type="button" onClick={() => { closeModal('profileModal') }}
            style={{"padding":"8px 22px","fontSize":"12px","fontWeight":"800","color":"#FFFFFF","background":"#002D62","border":"none","borderRadius":"8px","cursor":"pointer"}}>
            <span data-i18n="btn_close">Close</span>
          </button>
        </div>
      </div>

    </div>
  </div>

  {/* ============================================================
     AADHAAR VERIFICATION & BIOMETRIC AUTHENTICATION MODAL
     ============================================================ */}
  <div className="modal-overlay" id="verifyAadhaarModal" style={{"display":"none","zIndex":"10010"}}>
    <div className="modal-card-box" style={{"maxWidth":"460px","borderRadius":"18px","overflow":"hidden","boxShadow":"0 20px 60px rgba(0,45,98,0.25)"}}>
      <div className="profile-tricolor-bar"></div>
      <div style={{"background":"#002D62","color":"#FFFFFF","padding":"14px 18px","display":"flex","justifyContent":"space-between","alignItems":"center"}}>
        <div style={{"display":"flex","alignItems":"center","gap":"8px"}}>
          <span style={{"fontSize":"20px"}}>🔐</span>
          <div>
            <div style={{"fontSize":"14.5px","fontWeight":"800","color":"#FFFFFF"}}>Aadhaar Verification &amp; Authentication</div>
            <div style={{"fontSize":"10.5px","color":"#93C5FD"}}>UIDAI Official Digital Citizen Verification</div>
          </div>
        </div>
        <button type="button" className="modal-close-btn" onClick={() => { closeModal('verifyAadhaarModal') }} style={{"color":"#FFFFFF","background":"rgba(255,255,255,0.2)"}}>✕</button>
      </div>

      <div className="modal-body-scroll" style={{"padding":"18px 20px"}}>
        <div style={{"padding":"10px 12px","background":"#EFF6FF","border":"1px solid #BFDBFE","borderRadius":"8px","fontSize":"11.5px","color":"#1E40AF","marginBottom":"14px","lineHeight":"1.4"}}>
          To establish verified citizen credentials on JanSetu, please enter your 12-digit Aadhaar Number to receive a 6-digit UIDAI OTP.
        </div>

        <div className="form-group-field" style={{"marginBottom":"12px"}}>
          <label className="form-label-text" style={{"fontSize":"11.5px","fontWeight":"700","color":"#0F172A","display":"block","marginBottom":"4px"}}>
            12-Digit Aadhaar Number *
          </label>
          <div style={{"display":"flex","gap":"8px"}}>
            <input type="text" className="form-input-control" id="aadhaarVerifyInput"
              placeholder="e.g. 8492 3840 4819" maxLength="14"
              style={{"fontFamily":"monospace","letterSpacing":"1px","fontSize":"13px","fontWeight":"700","flex":"1"}} />
            <button type="button" id="btnSendAadhaarOtp" onClick={() => { sendAadhaarOtp() }}
              style={{"padding":"6px 12px","background":"#002D62","color":"#FFFFFF","border":"none","borderRadius":"8px","fontSize":"11px","fontWeight":"700","cursor":"pointer","whiteSpace":"nowrap"}}>
              Send OTP
            </button>
          </div>
          <div id="aadhaarOtpNotice" style={{"display":"none","fontSize":"11px","color":"#059669","fontWeight":"700","marginTop":"4px"}}>
            ✓ OTP sent to mobile linked with Aadhaar! (Demo code: 481900)
          </div>
        </div>

        <div className="form-group-field" id="aadhaarOtpGroup" style={{"display":"none","marginBottom":"14px"}}>
          <label className="form-label-text" style={{"fontSize":"11.5px","fontWeight":"700","color":"#0F172A","display":"block","marginBottom":"4px"}}>
            Enter 6-Digit UIDAI OTP *
          </label>
          <input type="text" className="form-input-control" id="aadhaarOtpInput"
            placeholder="e.g. 481900" maxLength="6"
            style={{"fontFamily":"monospace","letterSpacing":"3px","fontSize":"14px","fontWeight":"800","textAlign":"center"}} />
        </div>

        <div className="modal-footer-nav" style={{"marginTop":"16px","display":"flex","justifyContent":"flex-end","gap":"8px"}}>
          <button type="button" className="btn-modal-secondary" onClick={() => { closeModal('verifyAadhaarModal') }}
            style={{"padding":"7px 14px","fontSize":"11.5px","borderRadius":"8px"}}>Cancel</button>
          <button type="button" id="btnSubmitAadhaarAuth" onClick={() => { submitAadhaarAuthentication() }}
            style={{"padding":"7px 18px","background":"#16A34A","color":"#FFFFFF","border":"none","borderRadius":"8px","fontSize":"11.5px","fontWeight":"800","cursor":"pointer","boxShadow":"0 2px 6px rgba(22,163,74,0.3)"}}>
            ✓ Verify &amp; Authenticate →
          </button>
        </div>
      </div>
    </div>
  </div>

  {/* ============================================================
     MODAL: SETTINGS & PREFERENCES (LANGUAGE SWITCHER & CIVIC CONTROLS)
     ============================================================ */}
  <div className="modal-overlay" id="settingsModal">
    <div className="modal-card-box settings-modal-box">
      <div className="profile-tricolor-bar"></div>

      {/* Header Banner */}
      <div style={{"background":"linear-gradient(135deg, #002D62 0%, #091a36 100%)","color":"#FFFFFF","padding":"16px 20px","display":"flex","justifyContent":"space-between","alignItems":"center"}}>
        <div style={{"display":"flex","alignItems":"center","gap":"12px"}}>
          <div style={{"width":"38px","height":"38px","borderRadius":"10px","background":"rgba(255,255,255,0.14)","display":"flex","alignItems":"center","justifyContent":"center","fontSize":"19px"}}>
            ⚙️
          </div>
          <div>
            <div style={{"fontSize":"16px","fontWeight":"800","color":"#FFFFFF","letterSpacing":"0.2px"}} data-i18n="settings_title">Settings &amp; Preferences</div>
            <div style={{"fontSize":"11px","color":"#93c5fd","marginTop":"1px"}}>Manage your JanSetu language, civic account &amp; app preferences</div>
          </div>
        </div>
        <button type="button" className="modal-close-btn" onClick={() => { closeModal('settingsModal') }}
          style={{"color":"#FFFFFF","background":"rgba(255,255,255,0.15)","borderRadius":"50%","width":"28px","height":"28px","display":"flex","alignItems":"center","justifyContent":"center","border":"none","cursor":"pointer"}}>✕</button>
      </div>

      {/* Modal Body */}
      <div className="modal-body-scroll" style={{"padding":"18px 20px","maxHeight":"520px","display":"flex","flexDirection":"column","gap":"14px"}}>

        {/* 1. Language Preference Card (Direct Switcher) */}
        <div className="settings-group-card">
          <div className="settings-group-header">
            <span style={{"fontSize":"20px"}}>🌐</span>
            <div>
              <div className="settings-group-title" data-i18n="settings_lang_title">Portal Language Preference</div>
              <div className="settings-group-desc" data-i18n="settings_lang_sub">Choose your preferred language across JanSetu portal</div>
            </div>
          </div>
          <div className="settings-lang-grid">
            <div className="settings-lang-card" id="settingsLangCard_en" onClick={() => { selectSettingsLanguage('en') }}>
              <span style={{"fontSize":"22px"}}>🇬🇧</span>
              <div className="settings-lang-name">English</div>
              <div className="settings-lang-desc">Standard Portal</div>
              <div className="settings-lang-check">Active ✓</div>
            </div>
            <div className="settings-lang-card active" id="settingsLangCard_hinglish" onClick={() => { selectSettingsLanguage('hinglish') }}>
              <span style={{"fontSize":"22px"}}>💬</span>
              <div className="settings-lang-name">Hinglish</div>
              <div className="settings-lang-desc">Easy Conversational</div>
              <div className="settings-lang-check">Active ✓</div>
            </div>
          </div>
        </div>

        {/* 2. Citizen Civic Identity Summary & Profile Link */}
        <div className="settings-group-card">
          <div className="settings-group-header">
            <span style={{"fontSize":"20px"}}>👤</span>
            <div style={{"flex":"1"}}>
              <div className="settings-group-title" data-i18n="settings_profile_title">Citizen Civic Identity</div>
              <div className="settings-group-desc">Linked Aadhaar &amp; Residential Jurisdiction</div>
            </div>
            <button type="button" className="btn-profile-action" onClick={() => { closeModal('settingsModal'); openProfileModal(); }} style={{"padding":"5px 12px","fontSize":"11px"}}>
              ✏️ <span data-i18n="sidebar_profile">Profile</span>
            </button>
          </div>
          <div style={{"display":"flex","alignItems":"center","justifyContent":"space-between","marginTop":"12px","padding":"10px 14px","background":"#f8fafc","border":"1px solid #e2e8f0","borderRadius":"12px"}}>
            <div style={{"display":"flex","alignItems":"center","gap":"10px"}}>
              <div id="settingsAvatarCircle" style={{"width":"34px","height":"34px","borderRadius":"50%","background":"#002D62","color":"#FFFFFF","fontWeight":"800","fontSize":"14px","display":"flex","alignItems":"center","justifyContent":"center"}}>R</div>
              <div>
                <div id="settingsCitizenNameDisplay" style={{"fontSize":"13.5px","fontWeight":"800","color":"#0f172a"}}>Rajesh Mahto</div>
                <div style={{"fontSize":"11px","color":"#059669","fontWeight":"700","display":"flex","alignItems":"center","gap":"4px"}}>
                  <span>🛡️ Verified Citizen</span> • <span id="settingsDistrictDisplay" style={{"color":"#64748b"}}>Dhanbad, Jharkhand</span>
                </div>
              </div>
            </div>
            <button type="button" onClick={() => { closeModal('settingsModal'); openChangePasswordModal(); }} style={{"background":"#ffffff","border":"1px solid #cbd5e1","borderRadius":"8px","padding":"6px 12px","fontSize":"11px","fontWeight":"700","color":"#1e293b","cursor":"pointer","transition":"all 0.2s ease"}}>
              🔐 Change Password
            </button>
          </div>
        </div>

        {/* 3. Portal Preferences & Sync Controls */}
        <div className="settings-group-card">
          <div className="settings-group-header">
            <span style={{"fontSize":"20px"}}>⚡</span>
            <div>
              <div className="settings-group-title" data-i18n="settings_pref_title">Portal Preferences</div>
              <div className="settings-group-desc">Sound alerts, offline cache &amp; background refresh</div>
            </div>
          </div>
          <div style={{"marginTop":"12px","display":"flex","flexDirection":"column","gap":"10px"}}>
            <div style={{"display":"flex","alignItems":"center","justifyContent":"space-between","padding":"8px 12px","background":"#f8fafc","borderRadius":"10px"}}>
              <div>
                <div style={{"fontSize":"13px","fontWeight":"700","color":"#0f172a"}} data-i18n="settings_sound_label">Notification Sound Alert</div>
                <div style={{"fontSize":"10.5px","color":"#64748b"}}>Play chime when community upvotes or status updates arrive</div>
              </div>
              <label className="jansetu-switch">
                <input type="checkbox" id="settingSoundToggle" onChange={(e) => { toggleSoundSetting(this.checked) }} checked />
                <span className="slider"></span>
              </label>
            </div>
            <div style={{"display":"flex","alignItems":"center","justifyContent":"space-between","padding":"8px 12px","background":"#f8fafc","borderRadius":"10px"}}>
              <div>
                <div style={{"fontSize":"13px","fontWeight":"700","color":"#0f172a"}} data-i18n="settings_sync_label">Real-time Background Sync</div>
                <div style={{"fontSize":"10.5px","color":"#64748b"}}>Automatically sync community challenge reports every 30s</div>
              </div>
              <label className="jansetu-switch">
                <input type="checkbox" id="settingSyncToggle" onChange={(e) => { toggleSyncSetting(this.checked) }} checked />
                <span className="slider"></span>
              </label>
            </div>
          </div>
        </div>

        {/* 4. Account Action / Logout */}
        <button type="button" className="btn-settings-logout" onClick={() => { handleLogout() }}>
          <span>🚪</span> <span data-i18n="btn_logout_portal">Log Out of JanSetu</span>
        </button>

      </div>
    </div>
  </div>

  {/* ============================================================
     SUB-MODAL 1: CHANGE FULL NAME (REQUIRES OTP)
     ============================================================ */}
  <div className="modal-overlay" id="changeNameModal" style={{"display":"none","zIndex":"10005"}}>
    <div className="modal-card-box" style={{"maxWidth":"440px","borderRadius":"16px"}}>
      <div className="modal-header-bar"
        style={{"background":"linear-gradient(135deg, #1E3A8A, #1E40AF)","color":"#FFF","padding":"12px 16px"}}>
        <div className="modal-header-title" style={{"color":"#FFF","fontSize":"14.5px"}}>✏️ <span
            data-i18n="change_name_title">Change Full Name</span></div>
        <button className="modal-close-btn" onClick={() => { closeModal('changeNameModal') }} style={{"color":"#FFF"}}>✕</button>
      </div>
      <div className="modal-body-scroll" style={{"padding":"16px"}}>
        <div
          style={{"padding":"8px 12px","background":"#EFF6FF","border":"1px solid #BFDBFE","borderRadius":"8px","fontSize":"11px","color":"#1E40AF","marginBottom":"14px"}}
          data-i18n="change_name_notice">
          For security, JanSetu sends an OTP verification code to your registered contact before updating your name.
        </div>
        <div className="form-group-field">
          <label className="form-label-text" data-i18n="change_name_label">New Full Name *</label>
          <input type="text" className="form-input-control" id="newFullNameInput"
            data-i18n-placeholder="placeholder_full_name" placeholder="e.g. Rajesh Kumar Mahto" />
        </div>
        <div className="modal-footer-nav" style={{"marginTop":"14px"}}>
          <button type="button" className="btn-modal-secondary" onClick={() => { closeModal('changeNameModal') }}
            data-i18n="btn_cancel">Cancel</button>
          <button type="button" className="btn-modal-primary" onClick={() => { submitChangeNameRequest() }}
            data-i18n="btn_send_otp_continue">Send OTP &amp; Continue →</button>
        </div>
      </div>
    </div>
  </div>

  {/* ============================================================
     SUB-MODAL 2: CHANGE EMAIL ADDRESS (REQUIRES OTP)
     ============================================================ */}
  <div className="modal-overlay" id="changeEmailModal" style={{"display":"none","zIndex":"10005"}}>
    <div className="modal-card-box" style={{"maxWidth":"440px","borderRadius":"16px"}}>
      <div className="modal-header-bar"
        style={{"background":"linear-gradient(135deg, #1E3A8A, #1E40AF)","color":"#FFF","padding":"12px 16px"}}>
        <div className="modal-header-title" style={{"color":"#FFF","fontSize":"14.5px"}}>✉️ <span
            data-i18n="change_email_title">Change Email Address</span></div>
        <button className="modal-close-btn" onClick={() => { closeModal('changeEmailModal') }} style={{"color":"#FFF"}}>✕</button>
      </div>
      <div className="modal-body-scroll" style={{"padding":"16px"}}>
        <div
          style={{"padding":"8px 12px","background":"#EFF6FF","border":"1px solid #BFDBFE","borderRadius":"8px","fontSize":"11px","color":"#1E40AF","marginBottom":"14px"}}
          data-i18n="change_email_notice">
          A 6-digit JanSetu verification OTP code will be sent to verify your new email address.
        </div>
        <div className="form-group-field">
          <label className="form-label-text" data-i18n="change_email_label">New Email Address *</label>
          <input type="email" className="form-input-control" id="newEmailInput" data-i18n-placeholder="placeholder_email"
            placeholder="e.g. rajesh.new@gmail.com" />
        </div>
        <div className="modal-footer-nav" style={{"marginTop":"14px"}}>
          <button type="button" className="btn-modal-secondary" onClick={() => { closeModal('changeEmailModal') }}
            data-i18n="btn_cancel">Cancel</button>
          <button type="button" className="btn-modal-primary" onClick={() => { submitChangeEmailRequest() }}
            data-i18n="btn_send_otp_continue">Send OTP &amp; Continue →</button>
        </div>
      </div>
    </div>
  </div>

  {/* ============================================================
     SUB-MODAL 3: CHANGE MOBILE NUMBER (REQUIRES OTP)
     ============================================================ */}
  <div className="modal-overlay" id="changeMobileModal" style={{"display":"none","zIndex":"10005"}}>
    <div className="modal-card-box" style={{"maxWidth":"440px","borderRadius":"16px"}}>
      <div className="modal-header-bar"
        style={{"background":"linear-gradient(135deg, #1E3A8A, #1E40AF)","color":"#FFF","padding":"12px 16px"}}>
        <div className="modal-header-title" style={{"color":"#FFF","fontSize":"14.5px"}}>📱 <span
            data-i18n="change_mobile_title">Change Mobile Number</span></div>
        <button className="modal-close-btn" onClick={() => { closeModal('changeMobileModal') }} style={{"color":"#FFF"}}>✕</button>
      </div>
      <div className="modal-body-scroll" style={{"padding":"16px"}}>
        <div
          style={{"padding":"8px 12px","background":"#EFF6FF","border":"1px solid #BFDBFE","borderRadius":"8px","fontSize":"11px","color":"#1E40AF","marginBottom":"14px"}}
          data-i18n="change_mobile_notice">
          A 6-digit verification OTP code will be sent immediately via SMS to verify your new number.
        </div>
        <div className="form-group-field">
          <label className="form-label-text" data-i18n="change_mobile_label">New 10-Digit Mobile Number *</label>
          <input type="tel" className="form-input-control" id="newMobileInput" data-i18n-placeholder="placeholder_mobile"
            placeholder="94311XXXXX" maxlength="10" />
        </div>
        <div className="modal-footer-nav" style={{"marginTop":"14px"}}>
          <button type="button" className="btn-modal-secondary" onClick={() => { closeModal('changeMobileModal') }}
            data-i18n="btn_cancel">Cancel</button>
          <button type="button" className="btn-modal-primary" onClick={() => { submitChangeMobileRequest() }}
            data-i18n="btn_send_otp_continue">Send OTP &amp; Continue →</button>
        </div>
      </div>
    </div>
  </div>

  {/* ============================================================
     SUB-MODAL 4: UNIVERSAL JANSETU OTP VERIFICATION MODAL
     ============================================================ */}
  <div className="modal-overlay" id="profileOtpModal" style={{"display":"none","zIndex":"10010"}}>
    <div className="modal-card-box"
      style={{"maxWidth":"440px","borderRadius":"18px","overflow":"hidden","border":"1.5px solid #93C5FD","boxShadow":"0 20px 50px rgba(0, 45, 98, 0.3)"}}>
      <div
        style={{"background":"linear-gradient(135deg, #0F172A, #1E3A8A)","color":"#FFF","padding":"14px 18px","display":"flex","justifyContent":"space-between","alignItems":"center"}}>
        <div style={{"fontSize":"14.5px","fontWeight":"800","display":"flex","alignItems":"center","gap":"7px"}}>
          <span>🔐</span> <span data-i18n="otp_modal_title">JanSetu Security OTP Verification</span>
        </div>
        <button className="modal-close-btn" onClick={() => { closeModal('profileOtpModal') }} style={{"color":"#FFF"}}>✕</button>
      </div>

      <div className="modal-body-scroll" style={{"padding":"18px 20px","textAlign":"center"}}>
        <div style={{"fontSize":"12px","color":"#475569","lineHeight":"1.5","marginBottom":"10px"}} id="profileOtpSubNotice">
          Verification code sent to (<strong id="otpTargetDisplay" style={{"color":"#1E40AF"}}>+91 94311-00003</strong>).
        </div>

        {/* Demo OTP Alert Banner (User requested dummy OTP 123456) */}
        <div
          style={{"background":"#EFF6FF","border":"1.5px dashed #3B82F6","borderRadius":"10px","padding":"8px 12px","marginBottom":"16px","display":"flex","alignItems":"center","justifyContent":"space-between","width":"100%"}}>
          <div style={{"textAlign":"left"}}>
            <div style={{"fontSize":"10px","fontWeight":"700","color":"#1E40AF","textTransform":"uppercase"}}
              data-i18n="demo_otp_banner_title">Testing Verification Code (Demo OTP)</div>
            <div style={{"fontSize":"16px","fontWeight":"900","letterSpacing":"3px","color":"#1E3A8A"}}>123456</div>
          </div>
          <button type="button" onClick={() => { autoFillDemoOtp() }}
            style={{"padding":"4px 10px","fontSize":"10.5px","fontWeight":"700","background":"#1E40AF","color":"#FFF","border":"none","borderRadius":"6px","cursor":"pointer"}}>
            ⚡ <span data-i18n="btn_auto_fill">Auto-Fill</span>
          </button>
        </div>

        {/* 6-Digit OTP Inputs (Single horizontal flex row, flex-wrap: nowrap) */}
        <div className="otp-boxes-container">
          <input type="text" maxlength="1" className="otp-digit-box" id="otpBox1" oninput="handleOtpInput(this, 'otpBox2')"
            onkeydown="handleOtpBackspace(event, this, null)" />
          <input type="text" maxlength="1" className="otp-digit-box" id="otpBox2" oninput="handleOtpInput(this, 'otpBox3')"
            onkeydown="handleOtpBackspace(event, this, 'otpBox1')" />
          <input type="text" maxlength="1" className="otp-digit-box" id="otpBox3" oninput="handleOtpInput(this, 'otpBox4')"
            onkeydown="handleOtpBackspace(event, this, 'otpBox2')" />
          <input type="text" maxlength="1" className="otp-digit-box" id="otpBox4" oninput="handleOtpInput(this, 'otpBox5')"
            onkeydown="handleOtpBackspace(event, this, 'otpBox3')" />
          <input type="text" maxlength="1" className="otp-digit-box" id="otpBox5" oninput="handleOtpInput(this, 'otpBox6')"
            onkeydown="handleOtpBackspace(event, this, 'otpBox4')" />
          <input type="text" maxlength="1" className="otp-digit-box" id="otpBox6" oninput="handleOtpInput(this, null)"
            onkeydown="handleOtpBackspace(event, this, 'otpBox5')" />
        </div>

        <div style={{"fontSize":"11px","color":"#64748B","marginBottom":"16px"}}>
          <span data-i18n="otp_resend_label">Didn't receive code?</span> <button type="button"
            onClick={() => { resendProfileOtp() }}
            style={{"background":"none","border":"none","color":"#1E40AF","fontWeight":"800","cursor":"pointer","textDecoration":"underline"}}
            data-i18n="btn_resend_otp">Resend OTP</button>
        </div>

        <div className="modal-footer-nav" style={{"justifyContent":"center","gap":"10px"}}>
          <button type="button" className="btn-modal-secondary" onClick={() => { closeModal('profileOtpModal') }}
            data-i18n="btn_cancel">Cancel</button>
          <button type="button" className="btn-modal-primary" onClick={() => { verifyAndCommitProfileChange() }}
            style={{"minWidth":"140px"}}>
            ✓ <span data-i18n="btn_verify_commit">Verify &amp; Update</span>
          </button>
        </div>
      </div>
    </div>
  </div>

  {/* ============================================================
     SUB-MODAL 5: CHANGE PASSWORD (REQUIRES ORIGINAL PASS + AADHAAR)
     ============================================================ */}
  <div className="modal-overlay" id="changePasswordModal" style={{"display":"none","zIndex":"10005"}}>
    <div className="modal-card-box"
      style={{"maxWidth":"460px","borderRadius":"18px","overflow":"hidden","border":"1.5px solid #FCD34D"}}>
      <div
        style={{"background":"linear-gradient(135deg, #78350F, #92400E)","color":"#FFF","padding":"14px 18px","display":"flex","justifyContent":"space-between","alignItems":"center"}}>
        <div style={{"fontSize":"14.5px","fontWeight":"800","display":"flex","alignItems":"center","gap":"7px"}}>
          <span>🔐</span> <span data-i18n="change_password_title">Change Account Password</span>
        </div>
        <button className="modal-close-btn" onClick={() => { closeModal('changePasswordModal') }} style={{"color":"#FFF"}}>✕</button>
      </div>

      <div className="modal-body-scroll" style={{"padding":"16px 18px"}}>

        <div
          style={{"padding":"8px 12px","background":"#FFFBEB","border":"1px solid #FDE68A","borderRadius":"8px","fontSize":"11px","color":"#92400E","marginBottom":"14px","lineHeight":"1.4"}}
          data-i18n="change_password_notice">
          Security Protocol: To change your password, enter your Current Password and choose a new secure password.
        </div>

        <div className="form-group-field" style={{"marginBottom":"12px"}}>
          <label className="form-label-text" data-i18n="label_orig_password">1. Current / Original Password *</label>
          <div style={{"position":"relative"}}>
            <input type="password" className="form-input-control" id="origPasswordInput"
              data-i18n-placeholder="placeholder_orig_pass" placeholder="Enter current password (e.g. citizen123)"
              required />
            <button type="button" onClick={() => { togglePasswordVisibility('origPasswordInput') }}
              style={{"position":"absolute","right":"10px","top":"50%","transform":"translateY(-50%)","background":"none","border":"none","cursor":"pointer","fontSize":"14px"}}>👁️</button>
          </div>
        </div>

        <div className="form-group-field" style={{"marginBottom":"12px"}}>
          <label className="form-label-text" data-i18n="label_new_password">2. New Password *</label>
          <div style={{"position":"relative"}}>
            <input type="password" className="form-input-control" id="newPasswordInput"
              data-i18n-placeholder="placeholder_new_pass" placeholder="Minimum 6 characters" required />
            <button type="button" onClick={() => { togglePasswordVisibility('newPasswordInput') }}
              style={{"position":"absolute","right":"10px","top":"50%","transform":"translateY(-50%)","background":"none","border":"none","cursor":"pointer","fontSize":"14px"}}>👁️</button>
          </div>
        </div>

        <div className="form-group-field" style={{"marginBottom":"14px"}}>
          <label className="form-label-text" data-i18n="label_confirm_password">3. Confirm New Password *</label>
          <input type="password" className="form-input-control" id="confirmNewPasswordInput"
            data-i18n-placeholder="placeholder_confirm_pass" placeholder="Re-enter new password" required />
        </div>

        <div className="modal-footer-nav">
          <button type="button" className="btn-modal-secondary" onClick={() => { closeModal('changePasswordModal') }}
            data-i18n="btn_cancel">Cancel</button>
          <button type="button" className="btn-modal-primary" onClick={() => { submitChangePassword() }}
            style={{"background":"#D97706","borderColor":"#B45309"}} data-i18n="btn_update_password">
            Update Password →
          </button>
        </div>

      </div>
    </div>
  </div>

  {/* ============================================================
     MODAL: NOTIFICATIONS & CIVIC ACTIVITY LOG (CLEAN REVAMP)
     ============================================================ */}
  <div className="modal-overlay" id="notificationsModal">
    <div className="modal-card-box notifications-modal-revamp"
      style={{"maxWidth":"640px","borderRadius":"18px","overflow":"hidden","border":"1.5px solid #CBD5E1","boxShadow":"0 20px 48px rgba(0, 45, 98, 0.2)","padding":"0","background":"#FFFFFF"}}>

      {/* Top Tricolor Accent Line */}
      <div className="profile-tricolor-bar"></div>

      {/* Clean Civic Header */}
      <div className="notif-clean-head" style={{"padding":"16px 20px 12px","background":"#FFFFFF","borderBottom":"1px solid #F1F5F9","display":"flex","justifyContent":"space-between","alignItems":"flex-start"}}>
        <div>
          <div style={{"display":"inline-flex","alignItems":"center","gap":"5px","background":"#EFF6FF","border":"1px solid #BFDBFE","padding":"2px 8px","borderRadius":"12px","fontSize":"10px","fontWeight":"800","color":"#1E40AF","marginBottom":"4px"}}>
            <span>🇮🇳</span> <span data-i18n="notif_header_badge">Citizen Civic Audit &amp; Activity Log</span>
          </div>
          <div style={{"fontSize":"16px","fontWeight":"900","color":"#0F172A","display":"flex","alignItems":"center","gap":"8px"}}>
            <span>🔔</span> <span data-i18n="modal_notifications_title">Notifications &amp; Activity Log</span>
            <span id="notifModalTotalCountPill"
              style={{"fontSize":"10.5px","background":"#EF4444","color":"#FFF","padding":"1px 7px","borderRadius":"10px","fontWeight":"800"}}>0</span>
          </div>
          <div style={{"fontSize":"11px","color":"#64748B","marginTop":"2px","lineHeight":"1.35"}}
            data-i18n="notif_header_desc">
            Real-time track of reports, deletions, community supports, taskforce &amp; administrative actions.
          </div>
        </div>
        <button className="modal-close-btn" onClick={() => { closeModal('notificationsModal') }}
          style={{"background":"#F1F5F9","color":"#475569","border":"1px solid #CBD5E1","width":"28px","height":"28px","borderRadius":"50%","display":"flex","alignItems":"center","justifyContent":"center","fontSize":"12px","cursor":"pointer"}} title="Close">✕</button>
      </div>

      {/* Controls Bar: Category Filter Pills + Quick Date Filter & Date Picker */}
      <div
        style={{"background":"#F8FAFC","borderBottom":"1.5px solid #E2E8F0","padding":"8px 16px","display":"flex","flexDirection":"column","gap":"7px"}}>

        {/* Top Row: Category Filter Tabs */}
        <div style={{"display":"flex","alignItems":"center","justifyContent":"space-between","flexWrap":"wrap","gap":"6px"}}>
          <div style={{"display":"flex","gap":"5px","flexWrap":"wrap"}} id="notifTypeFilterGroup">
            <button type="button" className="lang-btn active" onClick={() => { setNotifTypeFilter('all') }} data-notif-type="all"
              style={{"fontSize":"10.5px","fontWeight":"750","padding":"3px 8px","borderRadius":"7px"}}>
              🌐 All
            </button>
            <button type="button" className="lang-btn" onClick={() => { setNotifTypeFilter('reports') }} data-notif-type="reports"
              style={{"fontSize":"10.5px","fontWeight":"750","padding":"3px 8px","borderRadius":"7px"}}>
              📋 Reports
            </button>
            <button type="button" className="lang-btn" onClick={() => { setNotifTypeFilter('supports') }} data-notif-type="supports"
              style={{"fontSize":"10.5px","fontWeight":"750","padding":"3px 8px","borderRadius":"7px"}}>
              👍 Supports
            </button>
            <button type="button" className="lang-btn" onClick={() => { setNotifTypeFilter('actions') }} data-notif-type="actions"
              style={{"fontSize":"10.5px","fontWeight":"750","padding":"3px 8px","borderRadius":"7px"}}>
              🏛️ Actions
            </button>
          </div>

          <div style={{"fontSize":"10px","color":"#64748B","fontWeight":"700"}} id="notifActiveFilterInfo">
            {/* Populated dynamically */}
          </div>
        </div>

        {/* Bottom Row: Date Filter Chips + Exact Date Picker */}
        <div
          style={{"display":"flex","alignItems":"center","justifyContent":"space-between","flexWrap":"wrap","gap":"6px","borderTop":"1px dashed #E2E8F0","paddingTop":"6px"}}>

          <div style={{"display":"flex","alignItems":"center","gap":"4px","flexWrap":"wrap"}} id="notifDateQuickGroup">
            <span style={{"fontSize":"10px","fontWeight":"800","color":"#64748B","textTransform":"uppercase"}}>📅 Date:</span>
            <button type="button" className="lang-btn active" onClick={() => { setNotifQuickDate('all') }} data-quick-date="all"
              style={{"fontSize":"10px","fontWeight":"750","padding":"2px 7px","borderRadius":"6px"}}>
              All
            </button>
            <button type="button" className="lang-btn" onClick={() => { setNotifQuickDate('today') }} data-quick-date="today"
              style={{"fontSize":"10px","fontWeight":"750","padding":"2px 7px","borderRadius":"6px"}}>
              Today
            </button>
            <button type="button" className="lang-btn" onClick={() => { setNotifQuickDate('yesterday') }} data-quick-date="yesterday"
              style={{"fontSize":"10px","fontWeight":"750","padding":"2px 7px","borderRadius":"6px"}}>
              Yesterday
            </button>
            <button type="button" className="lang-btn" onClick={() => { setNotifQuickDate('earlier') }} data-quick-date="earlier"
              style={{"fontSize":"10px","fontWeight":"750","padding":"2px 7px","borderRadius":"6px"}}>
              Earlier
            </button>
          </div>

          {/* Exact Date Picker Input */}
          <div style={{"display":"flex","alignItems":"center","gap":"4px"}}>
            <input type="date" id="notifDateFilterInput" onChange={(e) => { onNotifDateFilterChange(this.value) }}
              title="Pick exact date"
              style={{"fontSize":"10px","fontWeight":"700","padding":"2px 6px","border":"1.5px solid #CBD5E1","borderRadius":"6px","background":"#FFF","color":"#1E293B","outline":"none","height":"23px"}} />
            <button type="button" id="btnResetNotifDate" onClick={() => { resetNotifDateFilter() }}
              style={{"display":"none","fontSize":"10px","fontWeight":"750","background":"#FEF2F2","border":"1px solid #FECACA","color":"#DC2626","borderRadius":"6px","padding":"2px 6px","cursor":"pointer","height":"23px"}}
              title="Clear date filter">
              ✕ Reset
            </button>
          </div>

        </div>

      </div>

      {/* Scrollable Notifications Container */}
      <div className="modal-body-scroll"
        style={{"padding":"12px 16px","maxHeight":"480px","minHeight":"250px","background":"#FFFFFF"}}
        id="notificationsListContainer">
        {/* Dynamically generated notification items */}
      </div>

      {/* Modal Footer Actions */}
      <div
        style={{"background":"#F8FAFC","borderTop":"1.5px solid #E2E8F0","padding":"9px 16px","display":"flex","justifyContent":"space-between","alignItems":"center"}}>
        <button type="button" onClick={() => { clearAllCitizenNotifications() }}
          style={{"fontSize":"10.5px","fontWeight":"700","color":"#DC2626","background":"none","border":"none","cursor":"pointer","padding":"3px 6px"}}>
          🗑️ Clear History
        </button>
        <div style={{"display":"flex","gap":"7px"}}>
          <button type="button" onClick={() => { markAllNotificationsRead() }}
            style={{"fontSize":"10.5px","fontWeight":"700","color":"#059669","background":"#ECFDF5","border":"1px solid #A7F3D0","padding":"4px 10px","borderRadius":"7px","cursor":"pointer"}}>
            ✓ Mark All Read
          </button>
          <button type="button" className="btn-modal-secondary" onClick={() => { closeModal('notificationsModal') }}
            style={{"padding":"4px 12px","fontSize":"10.5px","fontWeight":"700","borderRadius":"7px"}}>
            Close
          </button>
        </div>
      </div>

    </div>
  </div>

  {/* ============================================================
     MODAL: TRIPARTITE PROBLEM CHAT HUB (Citizen, University Guide & Admin)
     Matching the Exact Official JanSetu Tripartite Mockup Design
     ============================================================ */}
  <div className="modal-overlay" id="problemChatModal">
    <div className="modal-card-box chat-hub-modal-card">
      {/* Sub-Header Bar */}
      <div className="chat-hub-header-bar">
        <div style={{"display":"flex","alignItems":"center","gap":"12px"}}>
          <div className="chat-hub-brand-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="#FFFFFF">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z" />
            </svg>
          </div>
          <div>
            <div className="chat-hub-header-title">Problem Grievance Chat Hub</div>
            <div className="chat-hub-header-sub">Direct communication between Citizen, University Guide &amp; Admin Authority</div>
          </div>
        </div>
        <div style={{"display":"flex","alignItems":"center","gap":"10px"}}>
          <button type="button" className="chat-help-btn" onClick={() => { alert('JanSetu Tripartite Support Desk:\n\nDirect support line for citizens, university taskforces, and administrative officers.\n\nEmail: connectjansetu@gmail.com\nToll-Free Civic Desk: 1800-JAN-SETU (9 AM - 6 PM)'); }}>
            <span style={{"fontSize":"14px","fontWeight":"800","color":"#2563EB"}}>?</span>
            <span>Need Help?</span>
          </button>
          <button type="button" className="modal-close-btn" onClick={() => { if (typeof window !== 'undefined' && window.closeModal) window.closeModal('problemChatModal'); else if (typeof closeModal === 'function') closeModal('problemChatModal'); }}>✕</button>
        </div>
      </div>

      {/* Split View Container */}
      <div className="chat-hub-split-body">
        {/* Left Column: Search, Status Tabs & Problem Channels */}
        <div id="chatProblemListSidebar" className="chat-hub-sidebar">
          {/* Search Row */}
          <div className="chat-sidebar-search-box">
            <div style={{"position":"relative","flex":"1"}}>
              <input type="text" id="chatSearchInput" placeholder="Search by ID, title, or keyword..."
                className="chat-sidebar-search-input" />
              <span className="chat-search-lens-icon">🔍</span>
            </div>
            <button type="button" className="chat-filter-btn" title="Filter problems" onClick={() => { const inp = document.getElementById('chatSearchInput'); if (inp) { inp.focus(); } }}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2">
                <line x1="4" y1="21" x2="4" y2="14" />
                <line x1="4" y1="10" x2="4" y2="3" />
                <line x1="12" y1="21" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12" y2="3" />
                <line x1="20" y1="21" x2="20" y2="16" />
                <line x1="20" y1="12" x2="20" y2="3" />
                <line x1="1" y1="14" x2="7" y2="14" />
                <line x1="9" y1="8" x2="15" y2="8" />
                <line x1="17" y1="16" x2="23" y2="16" />
              </svg>
            </button>
          </div>

          {/* Status Tabs Navigation */}
          <div className="chat-tabs-nav" id="chatStatusTabsContainer">
            <button type="button" className="chat-tab-pill active" id="chatTab_all" onClick={() => { window.setChatStatusFilter && window.setChatStatusFilter('all'); }}>
              All (<span id="chatCountAll">0</span>)
            </button>
            <button type="button" className="chat-tab-pill" id="chatTab_Submitted" onClick={() => { window.setChatStatusFilter && window.setChatStatusFilter('Submitted'); }}>
              Submitted (<span id="chatCountSubmitted">0</span>)
            </button>
            <button type="button" className="chat-tab-pill" id="chatTab_Review" onClick={() => { window.setChatStatusFilter && window.setChatStatusFilter('Being Worked On'); }}>
              Under Review (<span id="chatCountReview">0</span>)
            </button>
            <button type="button" className="chat-tab-pill" id="chatTab_Solved" onClick={() => { window.setChatStatusFilter && window.setChatStatusFilter('Solved'); }}>
              Resolved (<span id="chatCountResolved">0</span>)
            </button>
          </div>

          {/* Problem Channel Cards List */}
          <div id="chatProblemChannelList" className="chat-channels-scroll">
            {/* Populated dynamically via renderChatProblemChannels() */}
          </div>
        </div>

        {/* Right Column: Active Problem Chat Room */}
        <div id="chatRoomArea" className="chat-hub-room-area">
          {/* Room Top Header with Metadata, Title, and Participant Badges */}
          <div id="chatRoomHeader" className="chat-room-header-wrap">
            {/* Populated dynamically */}
          </div>

          {/* Messages Stream Container */}
          <div id="chatMessagesStream" className="chat-messages-stream-box">
            {/* Populated dynamically */}
          </div>

          {/* Quick Chip Suggestions */}
          <div id="chatQuickChipsContainer" className="chat-chips-scroll-row">
            {/* Suggestion buttons */}
          </div>

          {/* Message Input Form */}
          <div className="chat-input-bottom-panel">
            <form id="chatMessageForm" onSubmit={(e) => { e.preventDefault(); if (typeof window !== 'undefined' && window.sendProblemChatMessage) window.sendProblemChatMessage(); else if (typeof sendProblemChatMessage === 'function') sendProblemChatMessage(); }}
              className="chat-input-pill-wrapper">
              <button type="button" className="chat-attach-btn" title="Attach evidence photo/document" onClick={() => { document.getElementById('chatFileInput')?.click(); }}>
                📎
              </button>
              <input type="file" id="chatFileInput" style={{"display":"none"}} accept="image/*,.pdf" onChange={(e) => { window.handleChatFileUpload && window.handleChatFileUpload(e); }} />
              <input type="text" id="chatTextInput" placeholder="Type a message to University Taskforce &amp; Admin Authority..."
                className="chat-text-input-field" autoComplete="off" />
              <button type="button" className="chat-emoji-btn" title="Insert emoji" onClick={() => { const inp = document.getElementById('chatTextInput'); if (inp) { inp.value += ' 👍 '; inp.focus(); } }}>
                🙂
              </button>
              <button type="submit" id="btnSendChatMessage" className="chat-send-circular-btn" title="Send message">
                <span>➤</span>
              </button>
            </form>
            <div className="chat-footer-encryption-note">
              <span>🔒</span> <span>This chat is linked to the problem ID and will be saved for future reference.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  {/* Global JanSetu Civic Database Loader disabled on citizen page per user request */}
  <div id="jansetuGlobalLoader" className="jansetu-loader-backdrop" style={{ display: 'none' }}></div>


  {/* Global JanSetu Toast Notification (Smooth Popover) */}
  <div id="jansetuToast"></div>

  {/* JanSetu Voice AI Floating Trigger (Lower Right Corner) */}
  <AIFloatingTrigger onOpen={() => setIsVoiceAgentOpen(true)} />

  {/* JanSetu Real-Time Voice AI Agent Overlay & Phone Call UI */}
  <AIReportAgent
    isOpen={isVoiceAgentOpen}
    onClose={() => setIsVoiceAgentOpen(false)}
    onReportSubmitted={() => {
      if (typeof window.fetchCitizenProblems === 'function') {
        window.fetchCitizenProblems();
      }
    }}
  />

  {/* ============================================================
     I18N TRANSLATION SYSTEM & DYNAMIC QUOTE ROTATOR
     ============================================================ */}
  {/* Modular Translations & Civic Seed Data */}
  
  
  

    </>
  );
}

export default App;
