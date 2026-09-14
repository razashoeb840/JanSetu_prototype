import { useState, useRef, useEffect, Component } from 'react';
import { createPortal } from 'react-dom';
import { Routes, Route, NavLink, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Compass, FolderKanban, Users, BookOpen,
  Layers, Bell, UserCircle, Search, ChevronDown, Settings,
  LogOut, User, X, RotateCcw, Video, CheckCircle, ShieldAlert
} from 'lucide-react';

import HomePage from './pages/Home';
import BrowseProblems from './pages/BrowseProblems';
import MyProjects from './pages/MyProjects';
import TeamMentorship from './pages/TeamMentorship';
import Resources from './pages/Resources';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import sidebarMonumentImg from './assets/sidebar-monument.jpg';


/* ── Sidebar nav items ── */
const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/browse-problems', icon: Compass, label: 'Browse Problems' },
  { path: '/team-mentorship', icon: Users, label: 'Team' },
  { path: '/my-projects', icon: FolderKanban, label: 'My Projects' },
  { path: '/resources', icon: Layers, label: 'Resources' },
];

/* ── Click outside hook ── */
function useClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (e) => {
      if (!ref.current || ref.current.contains(e.target)) return;
      handler();
    };
    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, [ref, handler]);
}

/* ══════════════════════════════════════════
   SIDEBAR COMPONENT
   ══════════════════════════════════════════ */
function Sidebar({ unreadCount = 0, isOpen = false, onClose = () => {} }) {
  const location = useLocation();

  return (
    <aside className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div className="sidebar-logo-icon">
            <img
              src="/jansetu-logo.png"
              alt="JanSetu Logo"
              className="sidebar-brand-img"
              onError={(e) => { e.target.src = '/university/jansetu-logo.png'; }}
            />
          </div>
          {/* Mobile close button inside drawer */}
          <button
            type="button"
            className="sidebar-mobile-close-btn"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>
        <div className="sidebar-brand-name">
          <span className="sidebar-brand-text-jan">Jan</span><span className="sidebar-brand-text-setu">Setu</span>
        </div>
        <div className="sidebar-brand-tagline">University Portal</div>
      </div>

      {/* Section label */}
      <div className="sidebar-section-label">University Panel</div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path));

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
            >
              <item.icon />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        {/* Notifications with dynamic badge */}
        <NavLink to="/notifications" onClick={onClose} className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
          <Bell style={{ width: 16, height: 16, color: 'rgba(255,255,255,0.35)' }} />
          <span>Notifications</span>
          {unreadCount > 0 && <span className="sidebar-badge">{unreadCount}</span>}
        </NavLink>

        {/* Profile */}
        <NavLink to="/profile" onClick={onClose} className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
          <UserCircle style={{ width: 16, height: 16, color: 'rgba(255,255,255,0.35)' }} />
          <span>Profile</span>
        </NavLink>
      </nav>

      {/* Motivational quote */}
      <div className="sidebar-quote-block">
        <div className="quote-mark">"</div>
        <p>Ideas.<br />Innovation.<br />Impact.<br />Building a <span>"Better India Together."</span></p>
      </div>

      {/* Bottom: Indian innovation monument artwork + flag strip */}
      <div className="sidebar-bottom" style={{ height: 105, position: 'relative', overflow: 'hidden' }}>
        <img
          src={sidebarMonumentImg}
          alt="Viksit Bharat Innovation"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center 38%',
            opacity: 0.92,
            filter: 'brightness(1.05) contrast(1.08)',
            display: 'block'
          }}
          onError={(e) => {
            e.target.src = '/university/sidebar-monument.jpg';
          }}
        />
        {/* Soft atmospheric gradient overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(13, 21, 39, 0.7) 0%, rgba(11, 17, 32, 0.1) 45%, rgba(11, 17, 32, 0.8) 100%)',
            pointerEvents: 'none'
          }}
        />
        <div className="sidebar-india-strip" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, display: 'flex', zIndex: 2 }}>
          <div className="s" style={{ flex: 1, background: '#FF9933' }} />
          <div className="w" style={{ flex: 1, background: '#FFFFFF' }} />
          <div className="g" style={{ flex: 1, background: '#138808' }} />
        </div>
      </div>
    </aside>
  );
}

/* ══════════════════════════════════════════
   LOGOUT CONFIRMATION MODAL
   Rendered into document.body via Portal
   ══════════════════════════════════════════ */
function LogoutModal({ isOpen, onClose, onConfirm, user }) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="logout-modal-overlay animate-fade-in"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(15, 23, 42, 0.72)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        boxSizing: 'border-box'
      }}
    >
      <div
        className="logout-modal-card animate-scale-up"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 440,
          background: '#FFFFFF',
          borderRadius: 20,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(226, 232, 240, 0.8)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Tricolor top strip */}
        <div style={{ height: 4, display: 'flex', width: '100%' }}>
          <div style={{ flex: 1, background: '#FF9933' }} />
          <div style={{ flex: 1, background: '#FFFFFF', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }} />
          <div style={{ flex: 1, background: '#138808' }} />
        </div>

        <div style={{ padding: '24px 28px 22px' }}>
          {/* Header icon + close */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: '#FEE2E2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#DC2626',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.15)'
            }}>
              <LogOut style={{ width: 24, height: 24 }} />
            </div>
            <button
              onClick={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                border: 'none',
                background: '#F1F5F9',
                color: '#64748B',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#E2E8F0'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#F1F5F9'; }}
            >
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>

          <h3 style={{ fontSize: 19, fontWeight: 800, color: '#0F172A', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
            Sign Out of JanSetu?
          </h3>
          <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 16px', lineHeight: 1.5 }}>
            Are you sure you want to end your active institutional session? All session cache and security tokens will be cleared.
          </p>

          {/* User pill preview */}
          <div style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: 12,
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 22
          }}>
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '2px solid #2563EB' }} />
            ) : (
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', color: 'white', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                {user?.initials || 'RM'}
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>{user?.name || 'Faculty Representative'}</span>
                {(user?.uniqueId || user?.universityIdString) && (
                  <span style={{ fontSize: 10, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', padding: '1px 6px', borderRadius: 4, fontWeight: 800 }}>
                    {user?.uniqueId || user?.universityIdString}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11.5, color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.institution || 'IIT Delhi'} · {user?.role || 'Faculty'}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '11px 18px',
                borderRadius: 10,
                border: '1.5px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#334155',
                fontSize: 13.5,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              style={{
                flex: 1.2,
                padding: '11px 18px',
                borderRadius: 10,
                border: 'none',
                background: 'linear-gradient(135deg, #DC2626, #B91C1C)',
                color: '#FFFFFF',
                fontSize: 13.5,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(220, 38, 38, 0.45)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(220, 38, 38, 0.35)'; }}
            >
              <LogOut style={{ width: 15, height: 15 }} /> Yes, Log Out
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ══════════════════════════════════════════
   TOP HEADER COMPONENT
   ══════════════════════════════════════════ */
function TopHeader({ notifications = [], unreadCount = 0, onToggleMobileNav, isMobileNavOpen = false }) {
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'en');
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('is_user') || localStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        const initials = u.name ? u.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase() : 'U';
        return {
          name: u.name || 'University Representative',
          initials,
          institution: u.institution || u.organization || 'University',
          role: u.designation || 'Faculty',
          uniqueId: u.universityIdString || u.uniqueId || 'U1001',
          universityIdString: u.universityIdString || u.uniqueId || 'U1001',
          email: u.email || '',
          phone: u.phone || '',
          ...u
        };
      }
    } catch (e) {}
    return { name: 'Dr. Rohan Mehta', initials: 'RM', institution: 'IIT Delhi', role: 'Faculty', uniqueId: 'U1001' };
  });

  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const navigate = useNavigate();

  useClickOutside(notifRef, () => setShowNotifs(false));
  useClickOutside(profileRef, () => setShowProfile(false));

  useEffect(() => {
    const loadUserData = () => {
      const token = localStorage.getItem('is_token') || localStorage.getItem('token') || '';
      let emailParam = '';
      try {
        const u = JSON.parse(localStorage.getItem('is_user') || localStorage.getItem('user') || '{}');
        if (u.email) emailParam = `?email=${encodeURIComponent(u.email)}`;
      } catch (e) {}

      fetch(`/api/user${emailParam}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'x-user-email': user.email || ''
        }
      })
        .then(res => res.json())
        .then(data => {
          if (data?.name) {
            const savedAvatar = localStorage.getItem('jan_user_avatar');
            const initials = data.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
            setUser(prev => ({
              ...prev,
              ...data,
              initials,
              uniqueId: data.uniqueId || data.universityIdString || prev.uniqueId,
              universityIdString: data.universityIdString || data.uniqueId || prev.uniqueId,
              ...(savedAvatar ? { avatarUrl: savedAvatar } : {})
            }));
          }
        })
        .catch(() => {});
    };
    loadUserData();

    const handleProfileUpdate = (e) => {
      if (e.detail) {
        setUser(prev => ({ ...prev, ...e.detail }));
      }
    };
    window.addEventListener('profile-update', handleProfileUpdate);
    return () => window.removeEventListener('profile-update', handleProfileUpdate);
  }, []);

  const handleMarkAllReadInHeader = async (e) => {
    e.stopPropagation();
    try {
      await fetch('/api/university-notifications/read-all', { method: 'PATCH' });
    } catch (err) {}
    const updated = notifications.map(n => ({ ...n, unread: false }));
    window.dispatchEvent(new CustomEvent('notifications-update', { detail: updated }));
  };

  const executeLogout = () => {
    try {
      localStorage.removeItem('is_token');
      localStorage.removeItem('token');
      localStorage.removeItem('is_user');
      localStorage.removeItem('user');
      localStorage.removeItem('user_role');
      localStorage.removeItem('token_expiry');
      localStorage.removeItem('jan_user_profile');
      localStorage.removeItem('jan_user_avatar');
      localStorage.removeItem('jan_user_skills');
      sessionStorage.clear();
    } catch (err) {
      console.warn('Logout cleanup error:', err);
    }

    try {
      document.cookie.split(";").forEach((c) => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
    } catch (err) {}

    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { message: 'Signed out successfully. Redirecting...', type: 'info' }
    }));

    setTimeout(() => {
      window.location.replace('/login.html?logout=true');
    }, 300);
  };

  return (
    <header className="top-header">
      {/* Mobile 2-line menu button matching ChatGPT mobile app */}
      <button
        type="button"
        className={`mobile-menu-toggle-btn ${isMobileNavOpen ? 'is-active' : ''}`}
        onClick={onToggleMobileNav}
        aria-label="Toggle navigation menu"
        title="Toggle Menu"
      >
        <div className="menu-icon-2lines">
          <span className="line line-top" />
          <span className="line line-bottom" />
        </div>
      </button>

      {/* Brand logo/badge visible only on small screens */}
      <div className="mobile-header-brand">
        <span className="m-brand-jan">Jan</span><span className="m-brand-setu">Setu</span>
        <span className="m-brand-badge">Univ</span>
      </div>

      {/* Search */}
      <div className="header-search">
        <Search />
        <input type="text" placeholder="Search problems, projects, mentors, resources..." />
      </div>

      <div className="header-spacer" />

      {/* Language toggle */}
      <div className="lang-toggle">
        <button 
          className={`lang-btn ${lang === 'en' ? 'active' : 'inactive'}`} 
          onClick={() => { setLang('en'); localStorage.setItem('lang', 'en'); window.dispatchEvent(new Event('storage')); }}
        >English</button>
        <button 
          className={`lang-btn ${lang === 'hi' ? 'active' : 'inactive'}`} 
          onClick={() => { setLang('hi'); localStorage.setItem('lang', 'hi'); window.dispatchEvent(new Event('storage')); }}
        >हिंदी</button>
      </div>

      {/* Bell */}
      <div className="relative" ref={notifRef} style={{ position: 'relative' }}>
        <button
          className="header-bell"
          onClick={() => { setShowNotifs(!showNotifs); setShowProfile(false); }}
          title="Notifications"
        >
          <Bell style={{ width: 18, height: 18 }} />
          {unreadCount > 0 && <span className="header-bell-badge">{unreadCount}</span>}
        </button>

        {showNotifs && (
          <div className="notifs-dropdown animate-in">
            <div className="notifs-dropdown-header">
              <span className="notifs-dropdown-title">
                Recent Notifications
                {unreadCount > 0 && <span className="notifs-dropdown-badge">{unreadCount} new</span>}
              </span>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllReadInHeader}
                  className="notifs-dropdown-markall"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="notifs-dropdown-list">
              {notifications.length === 0 ? (
                <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94A3B8', fontSize: 13, background: '#FFFFFF' }}>
                  <Bell style={{ width: 28, height: 28, color: '#CBD5E1', margin: '0 auto 8px', display: 'block' }} />
                  No notifications right now
                </div>
              ) : (
                notifications.slice(0, 5).map(n => (
                  <NavLink
                    to="/notifications"
                    key={n._id || n.id}
                    onClick={() => setShowNotifs(false)}
                    className={`notifs-dropdown-item ${n.unread ? 'unread' : ''}`}
                  >
                    {n.unread ? (
                      <div className="notifs-dropdown-dot" />
                    ) : (
                      <div style={{ width: 8, height: 8, flexShrink: 0 }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className="notifs-dropdown-item-title">{n.title || n.text}</p>
                      <p className="notifs-dropdown-item-time">
                        {n.time || (n.createdAt ? new Date(n.createdAt).toLocaleDateString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Recent')}
                      </p>
                    </div>
                  </NavLink>
                ))
              )}
            </div>
            <div className="notifs-dropdown-footer">
              <NavLink
                to="/notifications"
                onClick={() => setShowNotifs(false)}
              >
                Open Notifications Page →
              </NavLink>
            </div>
          </div>
        )}
      </div>

      {/* Profile */}
      <div style={{ position: 'relative', marginLeft: 'auto' }} ref={profileRef}>
        <div
          className="header-profile"
          onClick={() => { setShowProfile(!showProfile); setShowNotifs(false); }}
        >
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="Avatar" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid #2563EB', flexShrink: 0 }} />
          ) : (
            <div className="header-avatar-fallback">{user.initials || 'RM'}</div>
          )}
          <div className="header-profile-info">
            <div className="header-profile-name" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>{user.name}</span>
              {(user.uniqueId || user.universityIdString) && (
                <span style={{ fontSize: 10, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', fontWeight: 800, padding: '1px 5px', borderRadius: 4 }}>
                  {user.uniqueId || user.universityIdString}
                </span>
              )}
            </div>
            <div className="header-profile-sub">{user.institution}</div>
          </div>
          <ChevronDown style={{ width: 14, height: 14, color: '#94A3B8', marginLeft: 4 }} />
        </div>

        {showProfile && (
          <div className="profile-dropdown animate-in">
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #F1F5F9' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <p style={{ fontWeight: 700, fontSize: 13, color: '#1E293B', margin: 0 }}>{user.name}</p>
                <span style={{ fontSize: 10, fontWeight: 800, background: '#2563EB', color: '#FFF', padding: '2px 6px', borderRadius: 4, letterSpacing: '0.04em' }}>
                  {user.uniqueId || user.universityIdString || 'U1001'}
                </span>
              </div>
              <p style={{ fontSize: 11, color: '#64748B', margin: '2px 0 0' }}>{user.institution}</p>
              {user.email && <p style={{ fontSize: 10.5, color: '#94A3B8', margin: '2px 0 0' }}>{user.email}</p>}
            </div>
            <div style={{ padding: '6px 0' }}>
              <button 
                onClick={() => {
                  setShowProfile(false);
                  navigate('/profile?tab=contributions');
                  window.dispatchEvent(new CustomEvent('switch-profile-tab', { detail: { tab: 'contributions' } }));
                }}
                className="profile-dropdown-btn"
                style={{ width: '100%', padding: '9px 16px', display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#334155', fontFamily: 'Inter, sans-serif' }}
              >
                <User style={{ width: 14, height: 14, color: '#64748B' }} /> View Profile
              </button>
              <button 
                onClick={() => {
                  setShowProfile(false);
                  navigate('/profile?tab=settings');
                  window.dispatchEvent(new CustomEvent('switch-profile-tab', { detail: { tab: 'settings' } }));
                }}
                className="profile-dropdown-btn"
                style={{ width: '100%', padding: '9px 16px', display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#334155', fontFamily: 'Inter, sans-serif' }}
              >
                <Settings style={{ width: 14, height: 14, color: '#2563EB' }} /> Settings
              </button>
            </div>
            <div style={{ borderTop: '1px solid #F1F5F9', padding: '6px 0' }}>
              <button 
                onClick={() => {
                  setShowProfile(false);
                  setShowLogoutModal(true);
                }}
                className="profile-dropdown-btn-danger"
                style={{ width: '100%', padding: '9px 16px', display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#DC2626', fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
              >
                <LogOut style={{ width: 14, height: 14 }} /> Log Out
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Logout confirmation modal */}
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={executeLogout}
        user={user}
      />
    </header>
  );
}

/* ══════════════════════════════════════════
   TOAST COMPONENT
   ══════════════════════════════════════════ */
function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleToast = (e) => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, ...e.detail }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 3000);
    };
    window.addEventListener('show-toast', handleToast);
    return () => window.removeEventListener('show-toast', handleToast);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20, zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 10
    }}>
      {toasts.map(t => (
        <div key={t.id} className="animate-in" style={{
          background: t.type === 'error' ? '#EF4444' : '#10B981',
          color: 'white', padding: '12px 20px', borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontSize: 14,
          fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8
        }}>
          {t.type === 'error' ? <X style={{ width: 16, height: 16 }} /> : <CheckCircle style={{ width: 16, height: 16 }} />}
          {t.message}
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════
   ERROR BOUNDARY
   Prevents one bad component from blanking the entire page.
   ══════════════════════════════════════════ */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('JanSetu University app crashed:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: 40, textAlign: 'center', fontFamily: 'Inter, sans-serif',
          maxWidth: 480, margin: '80px auto', background: '#FEF2F2',
          border: '1px solid #FECACA', borderRadius: 16
        }}>
          <h2 style={{ color: '#B91C1C', fontSize: 18, marginBottom: 8 }}>Something went wrong</h2>
          <p style={{ color: '#7F1D1D', fontSize: 13, marginBottom: 16 }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/university/'; }}
            style={{ background: '#DC2626', color: 'white', border: 'none', padding: '8px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
          >
            Go back home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ══════════════════════════════════════════
   MAIN APP
   ══════════════════════════════════════════ */
export default function App() {
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Auto-close mobile drawer on route navigation
  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileNavOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileNavOpen]);

  // Close on ESC key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') setIsMobileNavOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const fetchUniversityNotifications = () => {
    fetch('/api/university-notifications')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setNotifications(data);
          setUnreadCount(data.filter(n => n.unread).length);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchUniversityNotifications();

    const handleNotifUpdate = (e) => {
      if (e.detail && Array.isArray(e.detail)) {
        setNotifications(e.detail);
        setUnreadCount(e.detail.filter(n => n.unread).length);
      } else {
        fetchUniversityNotifications();
      }
    };

    window.addEventListener('notifications-update', handleNotifUpdate);
    const interval = setInterval(fetchUniversityNotifications, 10000);

    return () => {
      window.removeEventListener('notifications-update', handleNotifUpdate);
      clearInterval(interval);
    };
  }, []);

  return (
    <ErrorBoundary>
      <div className="app-layout">
        {/* Backdrop for mobile drawer */}
        <div
          className={`sidebar-backdrop ${isMobileNavOpen ? 'visible' : ''}`}
          onClick={() => setIsMobileNavOpen(false)}
          aria-hidden="true"
        />

        <Sidebar
          unreadCount={unreadCount}
          isOpen={isMobileNavOpen}
          onClose={() => setIsMobileNavOpen(false)}
        />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, width: '100%' }}>
          <TopHeader
            notifications={notifications}
            unreadCount={unreadCount}
            onToggleMobileNav={() => setIsMobileNavOpen(prev => !prev)}
            isMobileNavOpen={isMobileNavOpen}
          />
          <main className="main-content">
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/browse-problems" element={<BrowseProblems />} />
                <Route path="/my-projects" element={<MyProjects />} />
                <Route path="/team-mentorship" element={<TeamMentorship />} />
                <Route path="/resources" element={<Resources />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Profile defaultTab="settings" />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </ErrorBoundary>
          </main>
        </div>
        <ToastContainer />
      </div>
    </ErrorBoundary>
  );
}
