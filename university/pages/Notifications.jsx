import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Bell, Check, MoreVertical, Settings, Mail, Star, AtSign,
  ShieldAlert, ShieldCheck, UserCheck, Users, AlertTriangle,
  MessageCircle, GitMerge, Trophy, Award, FileText, Calendar,
  Sparkles, Database, Zap, TrendingUp, Clock, ChevronRight,
  Filter, CheckCircle2, UserPlus, BookOpen, ExternalLink,
  X, Volume2, Trash2, Eye, EyeOff
} from 'lucide-react';
import { toast } from '../utils/toast';


/* ══════════════════════════════════════════════════════════
   ICON HELPER COMPONENT
   ══════════════════════════════════════════════════════════ */
function NotificationIcon({ type, color, size = 18 }) {
  const iconProps = { size, color };
  switch (type) {
    case 'user-check':
      return <UserCheck {...iconProps} />;
    case 'sprout':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 20h10" />
          <path d="M10 20c5.5-2.5.8-6.4 3-10" />
          <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4.1 5.5.8z" />
          <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z" />
        </svg>
      );
    case 'users':
      return <Users {...iconProps} />;
    case 'alert-triangle':
      return <AlertTriangle {...iconProps} />;
    case 'message-circle':
      return <MessageCircle {...iconProps} />;
    case 'git-merge':
      return <GitMerge {...iconProps} />;
    case 'trophy':
      return <Trophy {...iconProps} />;
    case 'shield-check':
      return <ShieldCheck {...iconProps} />;
    case 'award':
      return <Award {...iconProps} />;
    case 'file-text':
      return <FileText {...iconProps} />;
    case 'calendar':
      return <Calendar {...iconProps} />;
    case 'user-plus':
      return <UserPlus {...iconProps} />;
    case 'sparkles':
      return <Sparkles {...iconProps} />;
    case 'database':
      return <Database {...iconProps} />;
    case 'check-circle-2':
      return <CheckCircle2 {...iconProps} />;
    case 'book-open':
      return <BookOpen {...iconProps} />;
    case 'clock':
      return <Clock {...iconProps} />;
    case 'network':
      return <GitMerge {...iconProps} />;
    case 'server':
      return <Zap {...iconProps} />;
    case 'zap':
      return <Zap {...iconProps} />;
    case 'trending-up':
      return <TrendingUp {...iconProps} />;
    default:
      return <Bell {...iconProps} />;
  }
}

/* ══════════════════════════════════════════════════════════
   MAIN NOTIFICATIONS COMPONENT
   ══════════════════════════════════════════════════════════ */
export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'mentor', 'problem', 'team', 'deadline', 'system', 'new-problem-request'
  const [quickFilter, setQuickFilter] = useState(null); // 'unread', 'mentions', 'priority' or null
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const [declineReason, setDeclineReason] = useState('');
  const [showDeclineReason, setShowDeclineReason] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Settings states
  const [settings, setSettings] = useState({
    email: true,
    browser: true,
    projects: true,
    mentors: true,
    team: true,
    deadlines: true,
    system: true,
    weeklyDigest: false
  });

  const fetchNotifications = () => {
    fetch('/api/university-notifications')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const mapped = data.map(item => ({
            ...item,
            id: item._id || item.id,
            title: item.title || item.text || 'Notification',
            subtitle: item.subtitle || (item.previewSnapshot?.description ? item.previewSnapshot.description.slice(0, 90) + '...' : 'Notification update'),
            timeGroup: item.timeGroup || 'Today',
            category: item.category || 'system',
            unread: Boolean(item.unread),
            time: item.time || (item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Recent')
          }));
          setNotifications(mapped);
        }
      })
      .catch((err) => {
        console.error('Error fetching university notifications:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Fetch real notifications on mount and listen to updates
  useEffect(() => {
    fetchNotifications();

    const handleExternalUpdate = (e) => {
      if (e.detail && Array.isArray(e.detail)) {
        setNotifications(e.detail);
      } else {
        fetchNotifications();
      }
    };
    window.addEventListener('notifications-update', handleExternalUpdate);
    return () => window.removeEventListener('notifications-update', handleExternalUpdate);
  }, []);

  // Close kebab menu on outside click
  useEffect(() => {
    const handleOutside = () => setActiveMenuId(null);
    window.addEventListener('click', handleOutside);
    return () => window.removeEventListener('click', handleOutside);
  }, []);

  // Calculate dynamic counts
  const totalCount = notifications.length;
  const mentorCount = notifications.filter(n => n.category === 'mentor').length;
  const problemCount = notifications.filter(n => n.category === 'problem').length;
  const newProblemCount = notifications.filter(n => n.category === 'new-problem-request').length;
  const teamCount = notifications.filter(n => n.category === 'team').length;
  const deadlineCount = notifications.filter(n => n.category === 'deadline').length;
  const systemCount = notifications.filter(n => n.category === 'system').length;

  const unreadCount = notifications.filter(n => n.unread).length;
  const mentionCount = notifications.filter(n => n.isMention).length;
  const priorityCount = notifications.filter(n => n.isHighPriority).length;

  // Stage 1 Accept Problem
  const handleAcceptProblem = async (notifId) => {
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/problems/review/${notifId}/accept`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast('Problem Accepted! Published to Browse Problems and citizen notified.', 'success');
        const updated = notifications.map(n => n.id === notifId ? {
          ...n,
          reviewed: true,
          reviewDecision: 'accepted',
          unread: false,
          subtitle: 'Accepted & published to Browse Problems.'
        } : n);
        setNotifications(updated);
        window.dispatchEvent(new CustomEvent('notifications-update', { detail: updated }));
        if (selectedNotif && selectedNotif.id === notifId) {
          setSelectedNotif(prev => ({
            ...prev,
            reviewed: true,
            reviewDecision: 'accepted',
            subtitle: 'Accepted & published to Browse Problems.'
          }));
        }
      } else {
        toast(data.error || 'Failed to accept problem', 'error');
      }
    } catch (e) {
      toast('Error accepting problem', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Stage 1 Decline Problem
  const handleDeclineProblem = async (notifId) => {
    setIsProcessing(true);
    try {
      const reason = declineReason.trim() || 'Scope does not align with ongoing department priorities.';
      const res = await fetch(`/api/problems/review/${notifId}/decline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      const data = await res.json();
      if (data.success) {
        toast('Problem Declined. Submitter informed.', 'info');
        const updated = notifications.map(n => n.id === notifId ? {
          ...n,
          reviewed: true,
          reviewDecision: 'declined',
          unread: false,
          subtitle: `Declined: ${reason}.`
        } : n);
        setNotifications(updated);
        window.dispatchEvent(new CustomEvent('notifications-update', { detail: updated }));
        if (selectedNotif && selectedNotif.id === notifId) {
          setSelectedNotif(prev => ({
            ...prev,
            reviewed: true,
            reviewDecision: 'declined',
            subtitle: `Declined: ${reason}.`
          }));
        }
        setShowDeclineReason(false);
        setDeclineReason('');
      } else {
        toast(data.error || 'Failed to decline problem', 'error');
      }
    } catch (e) {
      toast('Error declining problem', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/university-notifications/read-all', { method: 'PATCH' });
    } catch (e) {
      // Offline fallback
    }
    const updated = notifications.map(n => ({ ...n, unread: false }));
    setNotifications(updated);
    window.dispatchEvent(new CustomEvent('notifications-update', { detail: updated }));
    toast('All notifications marked as read', 'success');
  };

  // Toggle single read status
  const handleToggleRead = async (id, e) => {
    e?.stopPropagation();
    try {
      await fetch(`/api/university-notifications/${id}/toggle-read`, { method: 'PATCH' });
    } catch (e) {}
    const updated = notifications.map(n => n.id === id ? { ...n, unread: !n.unread } : n);
    setNotifications(updated);
    window.dispatchEvent(new CustomEvent('notifications-update', { detail: updated }));
    setActiveMenuId(null);
  };

  // Delete notification
  const handleDelete = async (id, e) => {
    e?.stopPropagation();
    try {
      await fetch(`/api/university-notifications/${id}`, { method: 'DELETE' });
    } catch (e) {}
    const updated = notifications.filter(n => n.id !== id);
    setNotifications(updated);
    window.dispatchEvent(new CustomEvent('notifications-update', { detail: updated }));
    toast('Notification removed', 'success');
    setActiveMenuId(null);
  };

  // Select notification to view details (and mark read if unread)
  const handleSelectNotif = async (notif) => {
    setSelectedNotif(notif);
    if (notif.unread) {
      try {
        await fetch(`/api/university-notifications/${notif.id}/toggle-read`, { method: 'PATCH' });
      } catch (e) {}
      const updated = notifications.map(n => n.id === notif.id ? { ...n, unread: false } : n);
      setNotifications(updated);
      window.dispatchEvent(new CustomEvent('notifications-update', { detail: updated }));
    }
  };

  // Toggle setting
  const toggleSetting = (key, label) => {
    setSettings(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      toast(`${label} ${updated[key] ? 'enabled' : 'disabled'}`, 'success');
      return updated;
    });
  };

  // Filtered notifications
  const filteredNotifications = notifications.filter(n => {
    // Category tab filter
    if (activeTab !== 'all') {
      if (activeTab === 'problem') {
        if (n.category !== 'problem' && n.category !== 'new-problem-request') return false;
      } else if (n.category !== activeTab) {
        return false;
      }
    }

    // Quick filter
    if (quickFilter === 'unread' && !n.unread) return false;
    if (quickFilter === 'mentions' && !n.isMention) return false;
    if (quickFilter === 'priority' && !n.isHighPriority) return false;

    return true;
  });

  // Group notifications by timeGroup
  const groups = ['Today', 'Yesterday', 'This Week', 'Earlier'];
  const groupedNotifications = groups.map(grp => ({
    name: grp,
    items: filteredNotifications.filter(n => (n.timeGroup || 'Today') === grp)
  })).filter(g => g.items.length > 0);

  const knownGroups = new Set(groups);
  const otherItems = filteredNotifications.filter(n => !knownGroups.has(n.timeGroup || 'Today'));
  if (otherItems.length > 0) {
    groupedNotifications.push({ name: 'Recent', items: otherItems });
  }

  return (
    <div className="notifications-page" style={{ padding: '24px 32px 60px', maxWidth: 1400, margin: '0 auto' }}>
      {/* ── Breadcrumb ── */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748B', marginBottom: 12 }}>
        <Link to="/" style={{ color: '#64748B', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#0F172A'} onMouseLeave={e => e.target.style.color = '#64748B'}>
          Home
        </Link>
        <span style={{ color: '#CBD5E1' }}>›</span>
        <span style={{ color: '#0F172A', fontWeight: 600 }}>Notifications</span>
      </nav>

      {/* ── Top Hero Banner matching mockup ── */}
      <div style={{
        position: 'relative',
        background: '#FFFFFF',
        borderRadius: 16,
        border: '1px solid #E2E8F0',
        padding: '24px 28px',
        marginBottom: 20,
        boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
        overflow: 'hidden',
        minHeight: 120,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Left: Title & Subtitle */}
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 520 }}>
          <h1 style={{
            fontSize: 28,
            fontWeight: 800,
            color: '#0F172A',
            letterSpacing: '-0.02em',
            margin: 0,
            lineHeight: 1.2
          }}>
            Notifications
          </h1>
          <p style={{
            fontSize: 13.5,
            color: '#64748B',
            marginTop: 6,
            marginBottom: 0,
            lineHeight: 1.5
          }}>
            Stay updated with project progress, mentor activity, opportunities and more.
          </p>
        </div>

        {/* Center / Right: Monuments Panorama Graphic */}
        <div style={{
          position: 'absolute',
          right: 220,
          top: 0,
          bottom: 0,
          width: 500,
          backgroundImage: 'url(/university/backgrounds/notifications/banner.jpg)',
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.88,
          pointerEvents: 'none',
          maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)'
        }} />

        {/* Right: Inspirational Quote & Viksit Bharat strip */}
        <div style={{
          position: 'relative',
          zIndex: 2,
          textAlign: 'right',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          paddingLeft: 20
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4 }}>
            <span style={{ color: '#16A34A', fontSize: 24, fontWeight: 700, lineHeight: 1, fontFamily: 'serif' }}>“</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', fontStyle: 'italic', letterSpacing: '-0.01em' }}>
              Small updates<br />create big changes.
            </span>
            <span style={{ color: '#16A34A', fontSize: 24, fontWeight: 700, lineHeight: 1, fontFamily: 'serif' }}>”</span>
          </div>
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 44, height: 3, display: 'flex', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ flex: 1, background: '#FF9933' }} />
              <div style={{ flex: 1, background: '#E2E8F0' }} />
              <div style={{ flex: 1, background: '#138808' }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', letterSpacing: '0.02em' }}>
              Viksit Bharat
            </span>
          </div>
        </div>
      </div>

      {/* ── Category Pill Tabs Bar ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24
      }}>
        {/* Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* All */}
          <button
            onClick={() => { setActiveTab('all'); setQuickFilter(null); }}
            style={{
              padding: '8px 18px',
              borderRadius: 24,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'all' && !quickFilter ? '1px solid #0F172A' : '1px solid #E2E8F0',
              background: activeTab === 'all' && !quickFilter ? '#0F172A' : '#FFFFFF',
              color: activeTab === 'all' && !quickFilter ? '#FFFFFF' : '#475569',
              boxShadow: activeTab === 'all' && !quickFilter ? '0 2px 6px rgba(15,23,42,0.2)' : 'none',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            All <span style={{ opacity: activeTab === 'all' && !quickFilter ? 0.9 : 0.6, fontSize: 12 }}>({totalCount})</span>
          </button>

          {/* Mentor Updates */}
          <button
            onClick={() => { setActiveTab('mentor'); setQuickFilter(null); }}
            style={{
              padding: '8px 16px',
              borderRadius: 24,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'mentor' ? '1.5px solid #2563EB' : '1px solid #DBEAFE',
              background: activeTab === 'mentor' ? '#DBEAFE' : '#EFF6FF',
              color: '#1D4ED8',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <UserCheck size={15} color="#2563EB" />
            Mentor Updates <span style={{ fontSize: 12, opacity: 0.8 }}>({mentorCount})</span>
          </button>

          {/* Problem Matches */}
          <button
            onClick={() => { setActiveTab('problem'); setQuickFilter(null); }}
            style={{
              padding: '8px 16px',
              borderRadius: 24,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'problem' ? '1.5px solid #16A34A' : '1px solid #DCFCE7',
              background: activeTab === 'problem' ? '#DCFCE7' : '#F0FDF4',
              color: '#15803D',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <NotificationIcon type="sprout" color="#16A34A" size={15} />
            Problem Matches <span style={{ fontSize: 12, opacity: 0.8 }}>({problemCount})</span>
          </button>

          {/* Team Activity */}
          <button
            onClick={() => { setActiveTab('team'); setQuickFilter(null); }}
            style={{
              padding: '8px 16px',
              borderRadius: 24,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'team' ? '1.5px solid #9333EA' : '1px solid #F3E8FF',
              background: activeTab === 'team' ? '#F3E8FF' : '#FAF5FF',
              color: '#7E22CE',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Users size={15} color="#9333EA" />
            Team Activity <span style={{ fontSize: 12, opacity: 0.8 }}>({teamCount})</span>
          </button>

          {/* Deadlines */}
          <button
            onClick={() => { setActiveTab('deadline'); setQuickFilter(null); }}
            style={{
              padding: '8px 16px',
              borderRadius: 24,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'deadline' ? '1.5px solid #EA580C' : '1px solid #FFEDD5',
              background: activeTab === 'deadline' ? '#FFEDD5' : '#FFF7ED',
              color: '#C2410C',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <AlertTriangle size={15} color="#EA580C" />
            Deadlines <span style={{ fontSize: 12, opacity: 0.8 }}>({deadlineCount})</span>
          </button>

          {/* System */}
          <button
            onClick={() => { setActiveTab('system'); setQuickFilter(null); }}
            style={{
              padding: '8px 16px',
              borderRadius: 24,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'system' ? '1.5px solid #7C3AED' : '1px solid #EDE9FE',
              background: activeTab === 'system' ? '#EDE9FE' : '#F5F3FF',
              color: '#6D28D9',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Sparkles size={15} color="#7C3AED" />
            System <span style={{ fontSize: 12, opacity: 0.8 }}>({systemCount})</span>
          </button>
        </div>

        {/* Mark all as read button */}
        <button
          onClick={handleMarkAllRead}
          style={{
            padding: '8px 18px',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            border: '1.5px solid #BFDBFE',
            background: '#EFF6FF',
            color: '#2563EB',
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            boxShadow: '0 1px 3px rgba(37,99,235,0.08)',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#DBEAFE';
            e.currentTarget.style.borderColor = '#93C5FD';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = '#EFF6FF';
            e.currentTarget.style.borderColor = '#BFDBFE';
          }}
        >
          <Check size={16} strokeWidth={2.5} color="#2563EB" />
          Mark all as read
        </button>
      </div>

      {/* ── Two Column Layout ── */}
      <div className="notif-grid" style={{
        display: 'grid',
        gap: 28,
        alignItems: 'start'
      }}>
        {/* ── Left Column: Notification Groups ── */}
        <div>
          {loading ? (
            <div style={{
              background: '#FFFFFF',
              borderRadius: 16,
              border: '1px solid #E2E8F0',
              padding: '48px 24px',
              textAlign: 'center',
              color: '#64748B'
            }}>
              <Bell size={32} color="#3B82F6" className="pulse-dot" style={{ marginBottom: 12 }} />
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1E293B', marginBottom: 4 }}>
                Loading notifications...
              </h3>
            </div>
          ) : totalCount === 0 ? (
            <div style={{
              background: '#FFFFFF',
              borderRadius: 16,
              border: '1px dashed #CBD5E1',
              padding: '48px 24px',
              textAlign: 'center',
              color: '#64748B'
            }}>
              <CheckCircle2 size={40} color="#16A34A" style={{ marginBottom: 12 }} />
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1E293B', marginBottom: 4 }}>
                All caught up!
              </h3>
              <p style={{ fontSize: 13, color: '#94A3B8' }}>
                You have no notifications at this time. New updates and problems will appear here.
              </p>
            </div>
          ) : groupedNotifications.length === 0 ? (
            <div style={{
              background: '#FFFFFF',
              borderRadius: 16,
              border: '1px dashed #CBD5E1',
              padding: '48px 24px',
              textAlign: 'center',
              color: '#64748B'
            }}>
              <Bell size={38} color="#94A3B8" style={{ marginBottom: 12 }} />
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1E293B', marginBottom: 4 }}>
                No notifications found
              </h3>
              <p style={{ fontSize: 13, color: '#94A3B8' }}>
                There are no notifications matching the selected filter.
              </p>
              <button
                onClick={() => { setActiveTab('all'); setQuickFilter(null); }}
                style={{
                  marginTop: 14,
                  padding: '7px 16px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  background: '#0F172A',
                  color: '#FFFFFF',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            groupedNotifications.map((group) => (
              <div key={group.name} style={{ marginBottom: 28 }}>
                {/* Group Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1E293B', margin: 0 }}>
                    {group.name}
                  </h2>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#94A3B8' }}>
                    ({group.items.length})
                  </span>
                </div>

                {/* Timeline list */}
                <div style={{ position: 'relative', paddingLeft: 22 }}>
                  {/* Vertical timeline connector track */}
                  <div style={{
                    position: 'absolute',
                    left: 7,
                    top: 18,
                    bottom: 18,
                    width: 2,
                    background: '#E2E8F0'
                  }} />

                  {/* Notification cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {group.items.map((notif) => {
                      const isUnread = notif.unread;
                      return (
                        <div
                          key={notif.id}
                          style={{
                            position: 'relative',
                            background: '#FFFFFF',
                            borderRadius: 14,
                            border: isUnread ? '1px solid #DBEAFE' : '1px solid #F1F5F9',
                            padding: '14px 18px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 14,
                            boxShadow: isUnread
                              ? '0 2px 8px rgba(37,99,235,0.04)'
                              : '0 1px 3px rgba(0,0,0,0.02)',
                            transition: 'all 0.2s',
                            cursor: 'pointer'
                          }}
                          onClick={() => handleSelectNotif(notif)}
                          onMouseEnter={e => {
                            e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.06)';
                            e.currentTarget.style.borderColor = '#CBD5E1';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.boxShadow = isUnread
                              ? '0 2px 8px rgba(37,99,235,0.04)'
                              : '0 1px 3px rgba(0,0,0,0.02)';
                            e.currentTarget.style.borderColor = isUnread ? '#DBEAFE' : '#F1F5F9';
                          }}
                        >
                          {/* Timeline node dot */}
                          <div style={{
                            position: 'absolute',
                            left: -22,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            background: notif.dotColor || '#3B82F6',
                            border: '2px solid #FFFFFF',
                            boxShadow: '0 0 0 2px rgba(59,130,246,0.2)',
                            zIndex: 2
                          }} />

                          {/* Icon Circle */}
                          <div style={{
                            width: 42,
                            height: 42,
                            borderRadius: '50%',
                            background: notif.iconBg || '#EFF6FF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <NotificationIcon
                              type={notif.iconType}
                              color={notif.iconColor || '#3B82F6'}
                              size={19}
                            />
                          </div>

                          {/* Content */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: 14,
                              fontWeight: 700,
                              color: '#0F172A',
                              lineHeight: 1.35,
                              marginBottom: 2
                            }}>
                              {notif.title}
                            </div>
                            <div style={{
                              fontSize: 12.5,
                              color: '#64748B',
                              lineHeight: 1.4,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {notif.subtitle}
                            </div>
                          </div>

                          {/* Right: Timestamp */}
                          <div style={{
                            fontSize: 12,
                            fontWeight: 500,
                            color: '#94A3B8',
                            whiteSpace: 'nowrap',
                            textAlign: 'right',
                            minWidth: 80
                          }}>
                            {notif.time}
                          </div>

                          {/* Action Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (notif.actionUrl && notif.actionUrl.startsWith('/')) {
                                navigate(notif.actionUrl);
                              } else {
                                setSelectedNotif(notif);
                              }
                            }}
                            style={{
                              background: '#EFF6FF',
                              border: '1px solid #BFDBFE',
                              color: '#2563EB',
                              fontSize: 12,
                              fontWeight: 600,
                              padding: '6px 14px',
                              borderRadius: 8,
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                              transition: 'all 0.15s'
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = '#DBEAFE';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = '#EFF6FF';
                            }}
                          >
                            {notif.actionText || 'View'}
                          </button>

                          {/* Kebab menu toggle */}
                          <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(activeMenuId === notif.id ? null : notif.id);
                              }}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 4,
                                borderRadius: 6,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#94A3B8'
                              }}
                              onMouseEnter={e => e.currentTarget.style.color = '#334155'}
                              onMouseLeave={e => e.currentTarget.style.color = '#94A3B8'}
                            >
                              <MoreVertical size={16} />
                            </button>

                            {/* Dropdown Menu */}
                            {activeMenuId === notif.id && (
                              <div style={{
                                position: 'absolute',
                                right: 0,
                                top: 28,
                                background: '#FFFFFF',
                                borderRadius: 10,
                                border: '1px solid #E2E8F0',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                                zIndex: 50,
                                width: 180,
                                padding: '6px 0',
                                animation: 'fadeIn 0.15s ease'
                              }}>
                                <button
                                  onClick={(e) => handleToggleRead(notif.id, e)}
                                  style={{
                                    width: '100%',
                                    padding: '8px 14px',
                                    border: 'none',
                                    background: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    fontSize: 12.5,
                                    color: '#334155',
                                    cursor: 'pointer',
                                    textAlign: 'left'
                                  }}
                                  onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                >
                                  {notif.unread ? <EyeOff size={14} color="#64748B" /> : <Eye size={14} color="#64748B" />}
                                  {notif.unread ? 'Mark as read' : 'Mark as unread'}
                                </button>
                                <button
                                  onClick={() => { setSelectedNotif(notif); setActiveMenuId(null); }}
                                  style={{
                                    width: '100%',
                                    padding: '8px 14px',
                                    border: 'none',
                                    background: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    fontSize: 12.5,
                                    color: '#334155',
                                    cursor: 'pointer',
                                    textAlign: 'left'
                                  }}
                                  onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                >
                                  <ExternalLink size={14} color="#64748B" />
                                  View details
                                </button>
                                <div style={{ height: 1, background: '#F1F5F9', margin: '4px 0' }} />
                                <button
                                  onClick={(e) => handleDelete(notif.id, e)}
                                  style={{
                                    width: '100%',
                                    padding: '8px 14px',
                                    border: 'none',
                                    background: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    fontSize: 12.5,
                                    color: '#EF4444',
                                    cursor: 'pointer',
                                    textAlign: 'left'
                                  }}
                                  onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
                                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                >
                                  <Trash2 size={14} color="#EF4444" />
                                  Remove
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ── Right Column: Sidebar Settings & Quick Filters ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* 1. Notification Settings Card */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: 16,
            border: '1px solid #E2E8F0',
            padding: '20px 22px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 16 }}>
              <Settings size={18} color="#0F172A" />
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: 0 }}>
                Notification Settings
              </h3>
            </div>

            {/* Toggle Rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { key: 'email', label: 'Email Notifications', icon: Mail },
                { key: 'browser', label: 'Browser Notifications', icon: Bell },
                { key: 'projects', label: 'Project Updates', icon: FileText },
                { key: 'mentors', label: 'Mentor Messages', icon: UserCheck },
                { key: 'team', label: 'Team Activity', icon: Users },
                { key: 'deadlines', label: 'Deadline Reminders', icon: AlertTriangle },
                { key: 'system', label: 'System Announcements', icon: Volume2 }
              ].map(({ key, label, icon: Icon }) => (
                <div
                  key={key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: 13,
                    color: '#334155',
                    fontWeight: 500
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <Icon size={15} color="#64748B" />
                    <span>{label}</span>
                  </div>

                  {/* Toggle Switch */}
                  <div
                    onClick={() => toggleSetting(key, label)}
                    style={{
                      width: 38,
                      height: 22,
                      borderRadius: 12,
                      background: settings[key] ? '#16A34A' : '#CBD5E1',
                      padding: 2,
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: '#FFFFFF',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      transform: settings[key] ? 'translateX(16px)' : 'translateX(0)',
                      transition: 'transform 0.2s'
                    }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Weekly Digest Section */}
            <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid #F1F5F9' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <Mail size={15} color="#64748B" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>
                    Weekly Digest
                  </span>
                </div>

                {/* Weekly Digest Toggle */}
                <div
                  onClick={() => toggleSetting('weeklyDigest', 'Weekly Digest')}
                  style={{
                    width: 38,
                    height: 22,
                    borderRadius: 12,
                    background: settings.weeklyDigest ? '#16A34A' : '#E2E8F0',
                    padding: 2,
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <div style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: '#FFFFFF',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    transform: settings.weeklyDigest ? 'translateX(16px)' : 'translateX(0)',
                    transition: 'transform 0.2s'
                  }} />
                </div>
              </div>

              <p style={{ fontSize: 12, color: '#64748B', marginTop: 6, lineHeight: 1.4 }}>
                Get a single weekly summary instead of individual alerts.
              </p>

              {/* Sunday callout info box */}
              <div style={{
                background: '#F0F7FF',
                border: '1px solid #DBEAFE',
                borderRadius: 8,
                padding: '9px 12px',
                marginTop: 10,
                fontSize: 12,
                color: '#1E40AF',
                fontWeight: 500,
                lineHeight: 1.4
              }}>
                You'll receive a summary every Sunday at 10:00 AM.
              </div>
            </div>
          </div>

          {/* 2. Quick Filters Card */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: 16,
            border: '1px solid #E2E8F0',
            padding: '20px 22px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 16 }}>
              <Filter size={18} color="#2563EB" />
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: 0 }}>
                Quick Filters
              </h3>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Unread */}
              <div
                onClick={() => setQuickFilter(quickFilter === 'unread' ? null : 'unread')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderRadius: 10,
                  cursor: 'pointer',
                  background: quickFilter === 'unread' ? '#FEF2F2' : 'transparent',
                  border: quickFilter === 'unread' ? '1px solid #FECACA' : '1px solid transparent',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={e => {
                  if (quickFilter !== 'unread') e.currentTarget.style.background = '#F8FAFC';
                }}
                onMouseLeave={e => {
                  if (quickFilter !== 'unread') e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <Star size={15} color="#EAB308" fill="#EAB308" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>Unread</span>
                </div>
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#EF4444',
                  background: '#FEE2E2',
                  padding: '2px 8px',
                  borderRadius: 12
                }}>
                  {unreadCount}
                </span>
              </div>

              {/* Mentions */}
              <div
                onClick={() => setQuickFilter(quickFilter === 'mentions' ? null : 'mentions')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderRadius: 10,
                  cursor: 'pointer',
                  background: quickFilter === 'mentions' ? '#EFF6FF' : 'transparent',
                  border: quickFilter === 'mentions' ? '1px solid #BFDBFE' : '1px solid transparent',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={e => {
                  if (quickFilter !== 'mentions') e.currentTarget.style.background = '#F8FAFC';
                }}
                onMouseLeave={e => {
                  if (quickFilter !== 'mentions') e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <AtSign size={15} color="#2563EB" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>Mentions ( @ )</span>
                </div>
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#2563EB',
                  background: '#DBEAFE',
                  padding: '2px 8px',
                  borderRadius: 12
                }}>
                  {mentionCount}
                </span>
              </div>

              {/* High Priority */}
              <div
                onClick={() => setQuickFilter(quickFilter === 'priority' ? null : 'priority')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderRadius: 10,
                  cursor: 'pointer',
                  background: quickFilter === 'priority' ? '#FEF2F2' : 'transparent',
                  border: quickFilter === 'priority' ? '1px solid #FECACA' : '1px solid transparent',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={e => {
                  if (quickFilter !== 'priority') e.currentTarget.style.background = '#F8FAFC';
                }}
                onMouseLeave={e => {
                  if (quickFilter !== 'priority') e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <ShieldAlert size={15} color="#DC2626" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>High Priority</span>
                </div>
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#DC2626',
                  background: '#FEE2E2',
                  padding: '2px 8px',
                  borderRadius: 12
                }}>
                  {priorityCount}
                </span>
              </div>
            </div>
          </div>

          {/* 3. Inspirational Indian Heritage Graphic Card */}
          <div style={{
            position: 'relative',
            borderRadius: 16,
            overflow: 'hidden',
            border: '1px solid #E2E8F0',
            height: 240,
            background: '#F8FAFC',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            padding: '22px 20px'
          }}>
            {/* Background Graphic */}
            <div style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: 'url(/university/backgrounds/notifications/card.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center 40%',
              opacity: 0.95
            }} />

            {/* Gradient Overlay for Text Readability */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to bottom, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.4) 40%, rgba(255,255,255,0) 100%)'
            }} />

            {/* Foreground Content */}
            <div style={{ position: 'relative', zIndex: 2 }}>
              <h4 style={{
                fontSize: 18,
                fontWeight: 800,
                color: '#0F172A',
                letterSpacing: '-0.02em',
                margin: 0,
                lineHeight: 1.2
              }}>
                Together for<br />a Brighter India
              </h4>

              {/* Tricolor underline */}
              <div style={{
                width: 60,
                height: 3.5,
                display: 'flex',
                borderRadius: 2,
                overflow: 'hidden',
                marginTop: 8
              }}>
                <div style={{ flex: 1, background: '#FF9933' }} />
                <div style={{ flex: 1, background: '#FFFFFF' }} />
                <div style={{ flex: 1, background: '#138808' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Notification Detail / Review Modal ── */}
      {selectedNotif && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.55)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          padding: 20
        }}
        onClick={() => { setSelectedNotif(null); setShowDeclineReason(false); }}
        >
          <div style={{
            background: '#FFFFFF',
            borderRadius: 20,
            maxWidth: selectedNotif.category === 'new-problem-request' || selectedNotif.previewSnapshot ? 640 : 480,
            width: '100%',
            padding: 28,
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            position: 'relative',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}
          onClick={e => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => { setSelectedNotif(null); setShowDeclineReason(false); }}
              style={{
                position: 'absolute',
                top: 18,
                right: 18,
                background: '#F1F5F9',
                border: 'none',
                borderRadius: '50%',
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748B'
              }}
            >
              <X size={16} />
            </button>

            {/* STAGE 1 REVIEW & DECIDE MODAL VIEW */}
            {(selectedNotif.category === 'new-problem-request' || selectedNotif.previewSnapshot) ? (
              <div>
                {/* Badge Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <span style={{
                    background: '#FFEDD5',
                    color: '#C2410C',
                    padding: '4px 10px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Stage 1: Admin Assignment Review
                  </span>
                  {selectedNotif.reviewed && (
                    <span style={{
                      background: selectedNotif.reviewDecision === 'accepted' ? '#DCFCE7' : '#FEE2E2',
                      color: selectedNotif.reviewDecision === 'accepted' ? '#15803D' : '#DC2626',
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 700
                    }}>
                      {selectedNotif.reviewDecision === 'accepted' ? '✓ Accepted & Published' : '✕ Declined'}
                    </span>
                  )}
                </div>

                {/* Problem Title */}
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', lineHeight: 1.3, marginBottom: 12 }}>
                  {selectedNotif.previewSnapshot?.title || selectedNotif.title}
                </h2>

                {/* Submitter & Location Snapshot */}
                <div style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: 12,
                  padding: '12px 16px',
                  marginBottom: 16,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: 12,
                  fontSize: 12.5
                }}>
                  <div>
                    <span style={{ color: '#94A3B8', fontWeight: 600 }}>Category: </span>
                    <strong style={{ color: '#0F172A' }}>{selectedNotif.previewSnapshot?.category || 'Disaster Management'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#94A3B8', fontWeight: 600 }}>Location: </span>
                    <strong style={{ color: '#0F172A' }}>{selectedNotif.previewSnapshot?.location || 'Patna, Bihar'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#94A3B8', fontWeight: 600 }}>Priority / Impact: </span>
                    <strong style={{ color: '#DC2626' }}>{selectedNotif.previewSnapshot?.priority?.toUpperCase() || 'HIGH'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#94A3B8', fontWeight: 600 }}>Submitter: </span>
                    <strong style={{ color: '#0F172A' }}>{selectedNotif.previewSnapshot?.submitterContact?.name || 'Citizen Submitter'}</strong>
                  </div>
                </div>

                {/* Full Description */}
                <div style={{ marginBottom: 18 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 6 }}>
                    Citizen Submission Description
                  </h4>
                  <p style={{
                    fontSize: 13.5,
                    color: '#1E293B',
                    lineHeight: 1.6,
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: 10,
                    padding: '12px 14px',
                    margin: 0
                  }}>
                    {selectedNotif.previewSnapshot?.description || selectedNotif.text || selectedNotif.subtitle}
                  </p>
                </div>

                {/* Computed Academic Brief Heuristics (Stage 1 Computed Fields) */}
                <div style={{
                  background: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  borderRadius: 12,
                  padding: '14px 16px',
                  marginBottom: 20
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <Sparkles size={16} color="#2563EB" />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#1D4ED8', textTransform: 'uppercase' }}>
                      Auto-Inferred Academic Brief (Computed on Accept)
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 12, color: '#1E40AF', fontWeight: 600 }}>
                    <span style={{ background: '#DBEAFE', padding: '3px 10px', borderRadius: 20 }}>
                      🎓 Capstone Project (Sem 7-8)
                    </span>
                    <span style={{ background: '#DBEAFE', padding: '3px 10px', borderRadius: 20 }}>
                      ⚡ Electronics & IoT / Computer Science
                    </span>
                    <span style={{ background: '#DBEAFE', padding: '3px 10px', borderRadius: 20 }}>
                      ⏱️ 6-8 Months Duration
                    </span>
                    <span style={{ background: '#DCFCE7', color: '#15803D', padding: '3px 10px', borderRadius: 20 }}>
                      🔄 Auto-Twinning & Fork Check Enabled
                    </span>
                  </div>
                </div>

                {/* Review Action Controls */}
                {!selectedNotif.reviewed ? (
                  <div>
                    {showDeclineReason ? (
                      <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: 14, marginBottom: 14 }}>
                        <label style={{ fontSize: 12, fontWeight: 700, color: '#991B1B', display: 'block', marginBottom: 6 }}>
                          Reason for declining this citizen submission:
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Beyond current semester lab equipment scope..."
                          value={declineReason}
                          onChange={e => setDeclineReason(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #FCA5A5',
                            borderRadius: 8,
                            fontSize: 13,
                            marginBottom: 10,
                            outline: 'none'
                          }}
                        />
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => setShowDeclineReason(false)}
                            style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#FFFFFF', cursor: 'pointer', fontSize: 12 }}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleDeclineProblem(selectedNotif.id)}
                            disabled={isProcessing}
                            style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: '#DC2626', color: '#FFFFFF', fontWeight: 600, cursor: 'pointer', fontSize: 12 }}
                          >
                            {isProcessing ? 'Declining...' : 'Confirm Decline'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => setShowDeclineReason(true)}
                          disabled={isProcessing}
                          style={{
                            padding: '10px 18px',
                            borderRadius: 10,
                            border: '1.5px solid #FCA5A5',
                            background: '#FFF5F5',
                            color: '#DC2626',
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          ✕ Decline Submission
                        </button>
                        <button
                          onClick={() => handleAcceptProblem(selectedNotif.id)}
                          disabled={isProcessing}
                          style={{
                            padding: '10px 24px',
                            borderRadius: 10,
                            border: 'none',
                            background: '#16A34A',
                            color: '#FFFFFF',
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            boxShadow: '0 4px 12px rgba(22,163,74,0.3)',
                            transition: 'all 0.2s'
                          }}
                        >
                          <CheckCircle2 size={16} />
                          {isProcessing ? 'Accepting...' : 'Accept Problem Statement'}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: '#64748B', fontWeight: 500 }}>
                      {selectedNotif.reviewDecision === 'accepted' ? 'Live in Browse Problems repository' : 'Declined'}
                    </span>
                    <button
                      onClick={() => { setSelectedNotif(null); navigate('/browse-problems'); }}
                      style={{
                        padding: '9px 18px',
                        borderRadius: 10,
                        border: 'none',
                        background: '#2563EB',
                        color: '#FFFFFF',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Go to Browse Problems →
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* STANDARD NOTIFICATION VIEW */
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: selectedNotif.iconBg || '#EFF6FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <NotificationIcon type={selectedNotif.iconType} color={selectedNotif.iconColor} size={22} />
                  </div>
                  <div>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: selectedNotif.iconColor || '#2563EB',
                      letterSpacing: '0.05em'
                    }}>
                      {selectedNotif.category} update
                    </span>
                    <p style={{ fontSize: 12, color: '#94A3B8', margin: '2px 0 0' }}>
                      {selectedNotif.time}
                    </p>
                  </div>
                </div>

                <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0F172A', lineHeight: 1.3, marginBottom: 10 }}>
                  {selectedNotif.title}
                </h3>
                <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, marginBottom: 24 }}>
                  {selectedNotif.subtitle}
                </p>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setSelectedNotif(null)}
                    style={{
                      padding: '9px 18px',
                      borderRadius: 10,
                      border: '1px solid #E2E8F0',
                      background: '#FFFFFF',
                      color: '#475569',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      const url = selectedNotif.actionUrl;
                      setSelectedNotif(null);
                      if (url && url.startsWith('/')) {
                        navigate(url);
                      }
                    }}
                    style={{
                      padding: '9px 20px',
                      borderRadius: 10,
                      border: 'none',
                      background: '#2563EB',
                      color: '#FFFFFF',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    {selectedNotif.actionText || 'Proceed'}
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

