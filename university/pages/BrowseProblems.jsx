import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Search, MapPin, Bookmark, BookmarkCheck, AlertTriangle,
  ChevronDown, RotateCcw, ArrowRight, X, ExternalLink, Video, VideoOff,
  GraduationCap, Info, Grid3X3, List, Map, MoreHorizontal,
  Filter, Flame, GitFork, Clock, Users, FileText, Zap,
  Calendar, CheckCircle2, Camera, CameraOff, Phone, Mail, Play, Printer,
  Check, Copy, Shield, Eye, CheckCircle,
  ChevronLeft, ChevronRight, MessageSquare, Send
} from 'lucide-react';
import { toast } from '../utils/toast';

/* ══════════════════════════════════════════
   CATEGORY CONFIG
   ══════════════════════════════════════════ */
const categories = {
  'Disaster Management': { color: '#C2410C', bg: '#FFF7ED', dotColor: '#EA580C', emoji: '🛡️' },
  'Healthcare': { color: '#15803D', bg: '#F0FDF4', dotColor: '#16A34A', emoji: '🏥' },
  'Infrastructure': { color: '#1D4ED8', bg: '#EFF6FF', dotColor: '#2563EB', emoji: '🏗️' },
  'Environmental Science': { color: '#166534', bg: '#ECFDF5', dotColor: '#059669', emoji: '🌿' },
  'Smart City': { color: '#4338CA', bg: '#EEF2FF', dotColor: '#4F46E5', emoji: '🏙️' },
  'Education': { color: '#92400E', bg: '#FEF3C7', dotColor: '#D97706', emoji: '📚' },
};

const impactColors = {
  'High': { bg: '#FEE2E2', color: '#DC2626' },
  'Medium': { bg: '#FEF3C7', color: '#D97706' },
  'Low': { bg: '#DCFCE7', color: '#16A34A' },
};

/* ══════════════════════════════════════════
   LIVE PROBLEMS DATA (Sourced dynamically from Database)
   ══════════════════════════════════════════ */
const mockProblems = [];

const disciplines = ['All Disciplines', 'Computer Science', 'Information Technology', 'Electronics & IoT', 'Data Science', 'Civil Engineering', 'Mechanical'];
const difficulties = ['All Levels', 'High Impact', 'Medium Impact', 'Low Impact'];
const durations = ['All Durations', '1-3 Months', '3-6 Months', '6-12 Months'];
const locations = ['All India', 'North India', 'South India', 'East India', 'West India'];
const allCategories = ['All', 'Disaster Management', 'Healthcare', 'Infrastructure', 'Environmental Science', 'Education', 'Smart City'];

/* ══════════════════════════════════════════
   URGENCY METER HELPER
   ══════════════════════════════════════════ */
function getUrgencyStyle(problem) {
  // Only for high-impact unassigned problems
  if (problem.impact !== 'High' || problem.daysUnassigned <= 0) return {};

  const days = problem.daysUnassigned;
  // Gradually redder border: 7 days = subtle, 14 = moderate, 30+ = intense
  let intensity = Math.min(days / 30, 1); // 0 to 1
  const r = Math.round(220 + intensity * 35); // 220 → 255
  const g = Math.round(200 - intensity * 170); // 200 → 30
  const b = Math.round(200 - intensity * 170);
  const borderColor = `rgb(${r}, ${g}, ${b})`;
  const shadowOpacity = 0.05 + intensity * 0.15;
  const shadowColor = `rgba(220, 38, 38, ${shadowOpacity})`;

  return {
    borderColor,
    boxShadow: `0 0 0 1px ${borderColor}, 0 4px 16px ${shadowColor}`,
  };
}

function getUrgencyLabel(days) {
  if (days >= 30) return { text: `🔴 ${days}d unassigned — Critical`, color: '#DC2626' };
  if (days >= 14) return { text: `🟠 ${days}d unassigned — Urgent`, color: '#EA580C' };
  if (days >= 7) return { text: `🟡 ${days}d unassigned`, color: '#D97706' };
  return null;
}

/* ══════════════════════════════════════════
   COLLABORATION RADAR SVG
   ══════════════════════════════════════════ */
/* ══════════════════════════════════════════
   COLLABORATION RADAR SVG
   ══════════════════════════════════════════ */
function CollaborationRadar({ twinnedWith = [] }) {
  const cx = 180, cy = 125;
  const radius = 85;

  const nodes = twinnedWith.map((t, i) => {
    // If only 1 node, place it at an intuitive angle rather than top edge
    const angle = twinnedWith.length === 1
      ? -Math.PI / 3.5
      : (Math.PI * 2 * i) / twinnedWith.length - Math.PI / 2;
    return {
      ...t,
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
      angle
    };
  });

  const statusColor = {
    'In Progress': '#06B6D4',
    'Prototype': '#F59E0B',
    'Assigned': '#3B82F6',
    'Deployed': '#10B981'
  };

  return (
    <div className="radar-box">
      <svg width="100%" height="250" viewBox="0 0 360 250" style={{ display: 'block', margin: '0 auto', overflow: 'visible' }}>
        <defs>
          <radialGradient id="radarMeshGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0284C7" stopOpacity="0.22" />
            <stop offset="60%" stopColor="#0369A1" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#0B132B" stopOpacity="0.0" />
          </radialGradient>

          <radialGradient id="sweepSectorGrad" cx="0%" cy="100%" r="100%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.35" />
            <stop offset="60%" stopColor="#0284C7" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#0B132B" stopOpacity="0.0" />
          </radialGradient>

          <filter id="radarNeonGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer subtle glow circle */}
        <circle cx={cx} cy={cy} r="115" fill="url(#radarMeshGrad)" />

        {/* Concentric Distance & Telemetry Rings */}
        <circle cx={cx} cy={cy} r="110" fill="none" stroke="rgba(56, 189, 248, 0.22)" strokeWidth="1" strokeDasharray="5 4" />
        <circle cx={cx} cy={cy} r="75" fill="none" stroke="rgba(56, 189, 248, 0.32)" strokeWidth="1" strokeDasharray="3 3" />
        <circle cx={cx} cy={cy} r="40" fill="none" stroke="rgba(56, 189, 248, 0.42)" strokeWidth="1" strokeDasharray="2 2" />

        {/* Cardinal Grid Crosshairs */}
        <line x1={cx - 118} y1={cy} x2={cx + 118} y2={cy} stroke="rgba(56, 189, 248, 0.16)" strokeWidth="1" />
        <line x1={cx} y1={cy - 118} x2={cx} y2={cy + 118} stroke="rgba(56, 189, 248, 0.16)" strokeWidth="1" />

        {/* Compass Angles & Telemetry Ticks */}
        <text x={cx} y={cy - 114} textAnchor="middle" fill="#38BDF8" fontSize="6.5" fontWeight="800" fontFamily="monospace">000° [NORTH COHORT]</text>
        <text x={cx + 114} y={cy + 3} textAnchor="start" fill="#38BDF8" fontSize="6.5" fontWeight="800" fontFamily="monospace">090°</text>
        <text x={cx} y={cy + 122} textAnchor="middle" fill="#38BDF8" fontSize="6.5" fontWeight="800" fontFamily="monospace">180° [SOUTH COHORT]</text>
        <text x={cx - 114} y={cy + 3} textAnchor="end" fill="#38BDF8" fontSize="6.5" fontWeight="800" fontFamily="monospace">270°</text>

        <text x={cx + 42} y={cy - 4} fill="rgba(148, 163, 184, 0.55)" fontSize="5.5" fontFamily="monospace">R1: Core</text>
        <text x={cx + 77} y={cy - 4} fill="rgba(148, 163, 184, 0.55)" fontSize="5.5" fontFamily="monospace">R2: Twinning</text>

        {/* Sweeping Radar Ray (Animated Group) */}
        <g className="radar-sweep-ray">
          <path
            d={`M ${cx} ${cy} L ${cx} ${cy - 110} A 110 110 0 0 1 ${cx + 75} ${cy - 80} Z`}
            fill="url(#sweepSectorGrad)"
          />
          <line
            x1={cx} y1={cy}
            x2={cx} y2={cy - 110}
            stroke="#38BDF8"
            strokeWidth="1.8"
            filter="url(#radarNeonGlow)"
          />
        </g>

        {/* Dynamic Flow Beams to Active Nodes */}
        {nodes.map((node, i) => (
          <g key={`beam-${i}`}>
            <line
              x1={cx} y1={cy}
              x2={node.x} y2={node.y}
              stroke={statusColor[node.status] || '#38BDF8'}
              strokeWidth="2"
              strokeDasharray="6 3"
              className="radar-flow-beam"
              opacity="0.9"
            />
            <line
              x1={cx} y1={cy}
              x2={node.x} y2={node.y}
              stroke={statusColor[node.status] || '#38BDF8'}
              strokeWidth="4"
              opacity="0.18"
            />
          </g>
        ))}

        {/* Inter-institution interconnects */}
        {nodes.length > 1 && nodes.map((node, i) => {
          const next = nodes[(i + 1) % nodes.length];
          return (
            <line
              key={`inter-${i}`}
              x1={node.x} y1={node.y}
              x2={next.x} y2={next.y}
              stroke="rgba(148, 163, 184, 0.35)"
              strokeWidth="1.2"
              strokeDasharray="4 4"
            />
          );
        })}

        {/* Central JanSetu Command Node */}
        <g>
          <circle cx={cx} cy={cy} r="28" fill="none" stroke="#FF9933" strokeWidth="1" strokeDasharray="4 2" opacity="0.4" />
          <circle cx={cx} cy={cy} r="22" fill="none" stroke="#38BDF8" strokeWidth="1.5" opacity="0.6" />
          <circle cx={cx} cy={cy} r="17" fill="#0B1F3A" stroke="#FF9933" strokeWidth="2.5" filter="url(#radarNeonGlow)" />
          
          <text x={cx} y={cy - 2} textAnchor="middle" fill="#FFFFFF" fontSize="6.8" fontWeight="900" letterSpacing="0.05em">Jan</text>
          <text x={cx} y={cy + 7} textAnchor="middle" fill="#FF9933" fontSize="6.8" fontWeight="900" letterSpacing="0.05em">Setu</text>
        </g>

        {/* Active Institutional Nodes */}
        {nodes.map((node, i) => {
          const col = statusColor[node.status] || '#38BDF8';
          const labelOffsetY = node.y < cy ? -34 : 12;
          const labelY = node.y + labelOffsetY;

          return (
            <g key={`node-${i}`}>
              <circle
                cx={node.x} cy={node.y} r="16"
                fill="none" stroke={col} strokeWidth="1.5"
                opacity="0.45" className="radar-node-pulse"
              />
              <circle
                cx={node.x} cy={node.y} r="11"
                fill="none" stroke={col} strokeWidth="1"
                opacity="0.8"
              />
              <circle
                cx={node.x} cy={node.y} r="7.5"
                fill={col} stroke="#FFFFFF" strokeWidth="1.5"
                filter="url(#radarNeonGlow)"
              />
              <circle cx={node.x} cy={node.y} r="2" fill="#FFFFFF" />

              {/* Crisp High-Contrast HUD Badge */}
              <rect
                x={node.x - 50}
                y={labelY}
                width="100"
                height="24"
                rx="6"
                fill="#071120"
                stroke={col}
                strokeWidth="1.3"
                filter="url(#radarNeonGlow)"
              />
              <text
                x={node.x}
                y={labelY + 11}
                textAnchor="middle"
                fill="#FFFFFF"
                fontSize="8.5"
                fontWeight="800"
              >
                {node.university}
              </text>
              <text
                x={node.x}
                y={labelY + 20}
                textAnchor="middle"
                fill="#38BDF8"
                fontSize="6.8"
                fontWeight="700"
              >
                📍 {node.region || 'India'}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ══════════════════════════════════════════
   TWINNING MODAL
   ══════════════════════════════════════════ */
function TwinningModal({ problem, onClose }) {
  if (!problem) return null;
  const twinnedList = problem.twinnedWith || [];
  const challengeId = (problem.challengeId || problem.reportId || (problem._id ? 'JH-2026-' + String(problem._id).slice(-6).toUpperCase() : `JH-2026-${problem.id || 1001}`)).replace(/^#/, '');

  const statusStyles = {
    'In Progress': { bg: 'rgba(6, 182, 212, 0.15)', border: 'rgba(6, 182, 212, 0.4)', color: '#22D3EE', label: '⚡ In Progress' },
    'Prototype': { bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.4)', color: '#FBBF24', label: '🧪 Stage 3: Prototype' },
    'Assigned': { bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.4)', color: '#60A5FA', label: '📋 Assigned' },
    'Deployed': { bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.4)', color: '#34D399', label: '🚀 Deployed Solution' },
  };

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const handleRequestTwinning = (univName) => {
    toast(`Academic Twinning Handshake dispatched to ${univName || 'Cohort Universities'}!`, 'success');
    onClose();
  };

  return createPortal(
    <div className="twinning-modal-overlay" onClick={onClose}>
      <div className="twinning-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Tricolor / Tech Accent Stripe */}
        <div className="twinning-accent-bar" />

        {/* Modal Header */}
        <div className="twinning-header">
          <div style={{ flex: 1 }}>
            <div className="twinning-badge-row">
              <span className="twinning-chip">
                <span className="twinning-live-dot" />
                Inter-University Twinning Radar
              </span>
              <span style={{
                background: 'rgba(56, 189, 248, 0.12)', color: '#38BDF8',
                border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: 6,
                padding: '3px 8px', fontSize: 10.5, fontWeight: 700, fontFamily: 'monospace'
              }}>
                #{challengeId}
              </span>
              <span style={{
                background: 'rgba(255, 255, 255, 0.08)', color: '#CBD5E1',
                borderRadius: 6, padding: '3px 8px', fontSize: 10.5, fontWeight: 600
              }}>
                {problem.category}
              </span>
            </div>

            <h3 className="twinning-title">
              {problem.title}
            </h3>
            <div className="twinning-subtitle">
              <span>National Academic Cohort</span>
              <span>•</span>
              <span style={{ color: '#38BDF8' }}>{twinnedList.length} Connected Institution{twinnedList.length > 1 ? 's' : ''} Working on Parallel Solutions</span>
            </div>
          </div>

          <button className="twinning-close-btn" onClick={onClose} title="Close Radar">
            <X size={16} />
          </button>
        </div>

        {/* Animated Radar Visualization */}
        <CollaborationRadar twinnedWith={twinnedList} />

        {/* Telemetry Status Bar */}
        <div className="radar-hud-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 6px #22C55E' }} />
            <span style={{ color: '#E2E8F0', fontWeight: 700 }}>LIVE RADAR LOCK</span>
          </div>
          <div>
            <span style={{ color: '#94A3B8' }}>Cohort:</span> <strong style={{ color: '#FFFFFF' }}>{twinnedList.length} Institution{twinnedList.length > 1 ? 's' : ''} in Range</strong>
          </div>
          <div style={{ color: '#38BDF8', fontWeight: 600 }}>
            🛰️ MoE Academic Accord 2026
          </div>
        </div>

        {/* Connected Teams List */}
        <div className="twinning-teams-section">
          <div className="twinning-section-heading">
            <span>Connected Institutional Innovation Teams</span>
            <span style={{ fontSize: 9.5, color: '#38BDF8', textTransform: 'none', fontWeight: 600 }}>
              Live Telemetry & Sync Ready
            </span>
          </div>

          {twinnedList.map((t, idx) => {
            const s = statusStyles[t.status] || {
              bg: 'rgba(56, 189, 248, 0.15)', border: 'rgba(56, 189, 248, 0.3)',
              color: '#38BDF8', label: t.status
            };
            const initials = t.university.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase();

            return (
              <div key={idx} className="twinning-team-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="twinning-team-avatar">
                    {initials}
                    <span style={{
                      position: 'absolute', bottom: -2, right: -2,
                      width: 14, height: 14, borderRadius: '50%', background: '#22C55E',
                      color: '#FFFFFF', fontSize: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '1.5px solid #0B132B', fontWeight: 900
                    }}>✓</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {t.university}
                      <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 500 }}>
                        ({t.region})
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>🏛️ Verified Innovation Cell</span>
                      <span>•</span>
                      <span style={{ color: '#34D399' }}>Shared Code & Datasets Ready</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  <span style={{
                    fontSize: 10.5, fontWeight: 800, padding: '3px 10px', borderRadius: 6,
                    background: s.bg, border: `1px solid ${s.border}`, color: s.color
                  }}>
                    {s.label}
                  </span>
                  <button
                    onClick={() => handleRequestTwinning(t.university)}
                    style={{
                      background: 'none', border: 'none', color: '#38BDF8',
                      fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3
                    }}
                  >
                    Sync Channel <ArrowRight size={11} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Twinning Value Proposition Strip */}
        <div className="twinning-value-grid">
          <div className="twinning-value-item">
            <strong>🔄 Zero Duplicate Effort</strong>
            <span>Adapt battle-tested schematics and save 3-4 months of core dev.</span>
          </div>
          <div className="twinning-value-item">
            <strong>🤝 Joint MoE NIRF Points</strong>
            <span>Earn Inter-State Collaborative Innovation Accreditation points.</span>
          </div>
          <div className="twinning-value-item">
            <strong>📊 Live Ground Telemetry</strong>
            <span>Cross-reference regional field IoT data from partner districts.</span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="twinning-footer">
          <div style={{ fontSize: 11, color: '#64748B', maxWidth: 220, lineHeight: 1.4 }}>
            🔒 Governed by JanSetu Inter-University Academic Twinning Accord 2026.
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={onClose}
              style={{
                padding: '9px 16px', borderRadius: 10, background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)', color: '#CBD5E1', fontSize: 12,
                fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s'
              }}
            >
              Close Radar
            </button>

            <button
              onClick={() => handleRequestTwinning(twinnedList[0]?.university)}
              style={{
                background: 'linear-gradient(135deg, #FF9933 0%, #EA580C 100%)',
                color: '#FFFFFF', border: 'none', borderRadius: 10,
                padding: '10px 20px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'Inter, sans-serif',
                boxShadow: '0 4px 16px rgba(234, 88, 12, 0.45)', transition: 'all 0.2s'
              }}
            >
              Request Academic Twinning <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ══════════════════════════════════════════
   SUB-MODALS: FULLSCREEN GALLERY, CHAT, VIDEO & SLIP
   ══════════════════════════════════════════ */
function FullscreenGalleryModal({ images = [], initialIndex = 0, caption, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const total = images.length || 1;
  const currentItem = images[currentIndex] || images[0] || { url: '', title: 'Ground Evidence' };
  const currentSrc = typeof currentItem === 'string' ? currentItem : (currentItem.url || '');

  const goPrev = (e) => {
    e?.stopPropagation();
    setCurrentIndex(prev => (prev - 1 + total) % total);
  };
  const goNext = (e) => {
    e?.stopPropagation();
    setCurrentIndex(prev => (prev + 1) % total);
  };

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose, total]);

  return createPortal(
    <div className="pdm-custom-gallery-overlay" onClick={onClose}>
      <div className="pdm-custom-gallery-card" onClick={e => e.stopPropagation()}>
        {/* Top Bar: Left Upper Corner Counter (1/3) & Right Upper Corner Close Button */}
        <div className="pdm-custom-gallery-top">
          <div className="pdm-custom-gallery-counter">
            {currentIndex + 1}/{total}
          </div>
          <button className="pdm-custom-gallery-close" onClick={onClose} title="Close (Esc)">
            <X size={18} />
          </button>
        </div>

        {/* Middle Row: < Prev Button in Left of Image, 400x300 Image with Black Outline, > Next Button in Right of Image */}
        <div className="pdm-custom-gallery-row">
          <button
            type="button"
            className="pdm-custom-nav-btn prev"
            onClick={goPrev}
            title="Previous Photo (<)"
            disabled={total <= 1}
          >
            <ChevronLeft size={22} />
          </button>

          <div className="pdm-custom-img-wrap">
            <img
              src={currentSrc}
              alt={`Evidence ${currentIndex + 1}`}
              className="pdm-custom-img"
              onError={(e) => { e.target.style.opacity = '0.5'; }}
            />
          </div>

          <button
            type="button"
            className="pdm-custom-nav-btn next"
            onClick={goNext}
            title="Next Photo (>)"
            disabled={total <= 1}
          >
            <ChevronRight size={22} />
          </button>
        </div>

        {/* Bottom Details */}
        <div className="pdm-custom-gallery-footer">
          <span className="pdm-custom-gallery-title">
            {typeof currentItem === 'object' && currentItem.title ? currentItem.title : (caption || 'Ground Field Evidence')}
          </span>
          {typeof currentItem === 'object' && currentItem.timestamp && (
            <span className="pdm-custom-gallery-meta">• {currentItem.timestamp}</span>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

function CitizenChatModal({ problem, onClose }) {
  const [messages, setMessages] = useState(problem.chatMessages || []);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);

  const problemId = problem._id || problem.id;
  const submitterName = problem.submitterContact?.name || 'Verified Citizen Submitter';

  const fetchChat = async () => {
    try {
      const res = await fetch(`/api/problems/${problemId}/chat`);
      const data = await res.json();
      if (data.success && Array.isArray(data.chatMessages)) {
        setMessages(data.chatMessages);
      }
    } catch (err) {
      console.error('Chat fetch error:', err);
    }
  };

  useEffect(() => {
    fetchChat();
    const interval = setInterval(fetchChat, 3500);
    return () => clearInterval(interval);
  }, [problemId]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!inputText.trim() || sending) return;
    const textToSend = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const res = await fetch(`/api/problems/${problemId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToSend,
          sender: 'University Innovation Team',
          senderRole: 'University R&D Cell'
        })
      });
      const data = await res.json();
      if (data.success) {
        setMessages(data.chatMessages || []);
        toast('Message sent! Citizen notified in portal.', 'success');
      } else {
        toast(data.error || 'Failed to send message', 'error');
      }
    } catch (err) {
      toast('Error sending message', 'error');
    } finally {
      setSending(false);
    }
  };

  return createPortal(
    <div className="citizen-chat-modal-overlay" onClick={onClose}>
      <div className="citizen-chat-card" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="citizen-chat-header">
          <div className="citizen-chat-header-info">
            <div className="citizen-chat-avatar">
              {(submitterName || 'C')[0]}
            </div>
            <div>
              <div className="citizen-chat-name">
                {submitterName}
                <span className="citizen-chat-online-pill">Verified Submitter</span>
              </div>
              <div className="citizen-chat-sub">
                Re: #{problem.challengeId || problem.id} • {problem.title?.slice(0, 42)}...
              </div>
            </div>
          </div>
          <button className="citizen-chat-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="citizen-chat-body">
          {messages.length === 0 ? (
            <div className="citizen-chat-empty">
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', color: '#2563EB' }}>
                <MessageSquare size={22} />
              </div>
              <div style={{ fontWeight: 700, color: '#1E293B', fontSize: 13.5 }}>Start Conversation with Citizen Submitter</div>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 4, lineHeight: 1.5 }}>
                Ask for additional field photos, telemetry specs, or clarify ground realities. The citizen will receive an instant high-priority notification in their app with 1-click reply capability.
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isUni = msg.isUniversity || msg.senderRole?.toLowerCase().includes('university');
              return (
                <div key={idx} className={`chat-bubble-row ${isUni ? 'university' : 'citizen'}`}>
                  <div className="chat-bubble">
                    <div className="chat-bubble-sender">
                      {msg.sender || (isUni ? 'University Innovation Cell' : submitterName)}
                    </div>
                    <div className="chat-bubble-text">{msg.text}</div>
                    <div className="chat-bubble-meta">
                      <span>{msg.time || new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {isUni && <Check size={12} style={{ color: '#93C5FD' }} />}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <form className="citizen-chat-footer" onSubmit={handleSend}>
          <input
            type="text"
            className="citizen-chat-input"
            placeholder="Type message or technical query to citizen..."
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            autoFocus
          />
          <button
            type="submit"
            className="citizen-chat-send-btn"
            disabled={!inputText.trim() || sending}
          >
            <Send size={15} />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
}

function VideoPlayerModal({ videoTitle, onClose }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return createPortal(
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 1000004,
      background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, overflowY: 'auto'
    }} onClick={onClose}>
      <div style={{
        background: '#0F172A', borderRadius: 16, width: '100%', maxWidth: 580,
        overflow: 'hidden', border: '1px solid rgba(255,255,255,0.15)',
        boxShadow: '0 25px 60px rgba(0,0,0,0.6)', position: 'relative', margin: 'auto'
      }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#FFFFFF', fontSize: 13, fontWeight: 700 }}>
            <Video size={16} color="#38BDF8" /> {videoTitle || 'Citizen Ground Video (0:45 min)'}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ position: 'relative', background: '#020617', height: 320, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
          <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'rgba(37,99,235,0.25)', border: '2px solid #3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
            <Play size={30} color="#60A5FA" style={{ marginLeft: 4 }} />
          </div>
          <div style={{ color: '#FFFFFF', fontSize: 15, fontWeight: 700 }}>Citizen Field Video & Audio Recording</div>
          <div style={{ color: '#94A3B8', fontSize: 12, marginTop: 6, maxWidth: 380, lineHeight: 1.5 }}>
            Recorded on ground by primary citizen submitter. 45-second verified audio-visual footage documenting civic risk, community impact, and urgent intervention requirement.
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
            <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.08)', color: '#CBD5E1', padding: '4px 10px', borderRadius: 6 }}>1080p 30fps</span>
            <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.08)', color: '#CBD5E1', padding: '4px 10px', borderRadius: 6 }}>Duration: 0:45s</span>
            <span style={{ fontSize: 11, background: 'rgba(34,197,94,0.15)', color: '#4ADE80', padding: '4px 10px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
              <CheckCircle2 size={12} /> GPS Audio Synced
            </span>
          </div>
        </div>
        <div style={{ padding: '12px 18px', background: '#0B1120', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#64748B' }}>Verified Submission via JanSetu Citizen App</span>
          <button onClick={onClose} style={{ background: '#2563EB', color: 'white', border: 'none', borderRadius: 6, padding: '6px 16px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
            Close Preview
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function OfficialSlipModal({ problem, onClose }) {
  if (!problem) return null;
  const slipId = problem.officialSlipId || `SLIP-${problem.challengeId || 'JH-2026-001'}`;
  const loc = problem.fullLocation || {};

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return createPortal(
    <div className="official-slip-overlay" onClick={onClose}>
      <div className="official-slip-card" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{
          position: 'absolute', top: 16, right: 16, background: '#F1F5F9',
          border: 'none', borderRadius: '50%', width: 32, height: 32,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B'
        }}>
          <X size={16} />
        </button>

        <div className="slip-header-emblem">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 24 }}>🏛️</span>
            <div>
              <div className="slip-emblem-text">GOVERNMENT OF INDIA & STATE CITIZEN GRIEVANCE PORTAL</div>
              <div style={{ fontSize: 9.5, color: '#64748B', fontWeight: 600 }}>National Societal Challenge Intake & Academic Allocation System</div>
            </div>
          </div>
          <div className="slip-title">Official Grievance Intake Certificate</div>
          <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#2563EB', fontWeight: 700, marginTop: 4 }}>
            DOCKET NO: {slipId}
          </div>
        </div>

        <div className="slip-grid">
          <div>
            <span style={{ color: '#64748B', fontSize: 10, display: 'block', fontWeight: 700 }}>REPORT IDENTIFIER</span>
            <strong>{problem.challengeId || problem.reportId || 'JH-2026-8802'}</strong>
          </div>
          <div>
            <span style={{ color: '#64748B', fontSize: 10, display: 'block', fontWeight: 700 }}>DATE OF FILING</span>
            <strong>08 September 2026 (Verified)</strong>
          </div>
          <div>
            <span style={{ color: '#64748B', fontSize: 10, display: 'block', fontWeight: 700 }}>CITIZEN SUBMITTER</span>
            <strong>{problem.submitterContact?.name || 'Sunil Kumar (Verified Citizen)'}</strong>
          </div>
          <div>
            <span style={{ color: '#64748B', fontSize: 10, display: 'block', fontWeight: 700 }}>COMMUNITY BACKERS</span>
            <strong style={{ color: '#16A34A' }}>{problem.supportCount || 24} Verified Residents</strong>
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <span style={{ color: '#64748B', fontSize: 10, display: 'block', fontWeight: 700 }}>EXACT ADMINISTRATIVE JURISDICTION</span>
            <strong>{loc.village ? `${loc.village}, ${loc.block}, ${loc.district}, ${loc.state} - ${loc.pincode}` : problem.location}</strong>
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <span style={{ color: '#64748B', fontSize: 10, display: 'block', fontWeight: 700 }}>COMPETENT DEPARTMENT</span>
            <strong>{problem.department || 'Department of Municipal Affairs & Infrastructure'}</strong>
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <span style={{ color: '#64748B', fontSize: 10, display: 'block', fontWeight: 700 }}>GRIEVANCE CLASSIFICATION & IMPACT</span>
            <span>{problem.category} • <strong style={{ color: problem.impact === 'High' ? '#DC2626' : '#D97706' }}>{problem.impact} Priority</strong></span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#F0FDF4', border: '1.5px dashed #86EFAC', borderRadius: 10, marginBottom: 16 }}>
          <div className="slip-stamp-badge">
            <CheckCircle2 size={16} /> Digital Verification Sealed
          </div>
          <div style={{ fontSize: 10.5, color: '#166534', textAlign: 'right' }}>
            Geo-Tagged GPS: {loc.coordinates ? `${loc.coordinates.lat?.toFixed(4)}° N, ${loc.coordinates.lng?.toFixed(4)}° E` : '22.5544° N, 85.8096° E'}<br />
            Tamper-Proof Audit Hash: 0x8F92...B31
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={() => { window.print(); }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 8, border: '1px solid #CBD5E1',
              background: '#FFFFFF', color: '#334155', fontSize: 12, fontWeight: 700, cursor: 'pointer'
            }}
          >
            <Printer size={14} /> Print Dossier Slip
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '8px 18px', borderRadius: 8, border: 'none',
              background: '#0F172A', color: '#FFFFFF', fontSize: 12, fontWeight: 700, cursor: 'pointer'
            }}
          >
            Close Receipt
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ══════════════════════════════════════════
   PROBLEM DETAIL MODAL (Rich Citizen Dossier)
   ══════════════════════════════════════════ */
function ProblemDetailModal({ problem, onClose, onStartProject, onFork, initialChatOpen = false }) {
  if (!problem) return null;
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [chatModal, setChatModal] = useState(initialChatOpen);
  const [videoModal, setVideoModal] = useState(false);
  const [showSlip, setShowSlip] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const cat = categories[problem.category] || categories['Smart City'];
  const impact = impactColors[problem.impact] || impactColors['Medium'];
  const loc = problem.fullLocation || {
    village: 'Ground Zero Ward',
    block: 'Central Block',
    district: (problem.location || '').split(',')[0]?.trim() || 'Ranchi',
    state: (problem.location || '').split(',')[1]?.trim() || 'Jharkhand',
    pincode: '834001',
    coordinates: { lat: 23.3441, lng: 85.3096 }
  };
  const beforeImg = (problem.beforeImage && !problem.beforeImage.startsWith('/images/')) ? problem.beforeImage : null;
  const challengeId = (problem.challengeId || problem.reportId || (problem._id ? 'JH-2026-' + String(problem._id).slice(-6).toUpperCase() : `JH-2026-${problem.id || 1001}`)).replace(/^#/, '');
  const [videoPlayerOpen, setVideoPlayerOpen] = useState(false);

  // Extract citizen video URL if available
  const citizenVideoUrl = useMemo(() => {
    if (problem.videoUrl && problem.videoUrl !== '#') return problem.videoUrl;
    if (Array.isArray(problem.attachments)) {
      const vAtt = problem.attachments.find(a => (a.mimetype && a.mimetype.startsWith('video/')) || /\.(mp4|webm|mov|ogg)$/i.test(a.url || a.filename || ''));
      if (vAtt && vAtt.url) return vAtt.url;
    }
    if (Array.isArray(problem.evidenceMedia)) {
      const vMed = problem.evidenceMedia.find(m => m.mediaType === 'video' && m.url && m.url !== '#');
      if (vMed && vMed.url) return vMed.url;
    }
    return null;
  }, [problem]);

  // Build evidence photos list for gallery — prioritizing real citizen photos without dummy duplicates
  const allEvidencePhotos = useMemo(() => {
    const list = [];
    const seenUrls = new Set();

    const addPhoto = (url, title, timestamp) => {
      if (!url || typeof url !== 'string' || url === '#' || url.length < 5) return;
      if (/\.(mp4|webm|mov|ogg)$/i.test(url)) return;
      if (seenUrls.has(url)) return;
      seenUrls.add(url);
      list.push({
        url,
        title: title || `Ground Evidence Photo ${list.length + 1} (Citizen Upload)`,
        timestamp: timestamp || 'Verified Field Telemetry'
      });
    };

    // 1. Citizen uploaded attachments
    if (Array.isArray(problem.attachments) && problem.attachments.length > 0) {
      problem.attachments.forEach((att, idx) => {
        if (att && att.url && !att.url.startsWith('/images/')) {
          const isVideo = (att.mimetype && att.mimetype.startsWith('video/')) || /\.(mp4|webm|mov|ogg)$/i.test(att.url);
          if (!isVideo) {
            addPhoto(att.url, att.originalName || `Citizen Evidence Photo ${idx + 1}`, 'Field Evidence · Citizen Upload');
          }
        }
      });
    }

    // 2. Primary beforeImage (strictly non-stock)
    if (problem.beforeImage && !problem.beforeImage.startsWith('/images/')) {
      addPhoto(problem.beforeImage, 'Citizen Field Evidence Photo (Primary)', 'Field Evidence · Geo-Tagged');
    }

    // 3. Evidence media array
    if (Array.isArray(problem.evidenceMedia)) {
      problem.evidenceMedia.forEach((m, idx) => {
        if (m && m.url && !m.url.startsWith('/images/') && m.mediaType !== 'video') {
          addPhoto(m.url, m.title || `Citizen Photo ${idx + 1}`, m.timestamp);
        }
      });
    }

    // 4. Fallback cover/image (only if not stock)
    if (problem.coverImage && !problem.coverImage.startsWith('/images/')) addPhoto(problem.coverImage, 'Citizen Cover Photo', 'Field Telemetry');
    if (problem.image && !problem.image.startsWith('/images/')) addPhoto(problem.image, 'Field Evidence Photo', 'Field Telemetry');

    return list;
  }, [problem]);

  const mapsUrl = loc.coordinates
    ? `https://www.google.com/maps/search/?api=1&query=${loc.coordinates.lat},${loc.coordinates.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(problem.location || 'India')}`;

  return createPortal(
    <>
      <div className="pdm-overlay" onClick={onClose}>
        <div className="pdm-container" onClick={e => e.stopPropagation()}>
          {/* Close Button */}
          <button className="pdm-close-btn" onClick={onClose}>
            <X size={18} />
          </button>

          {/* Header Badges */}
          <div className="pdm-badges-row">
            <span
              className="pdm-report-id-pill"
              onClick={() => setShowSlip(true)}
              title="Click to view official receipt slip"
              style={{ cursor: 'pointer' }}
            >
              <FileText size={12} /> #{challengeId}
            </span>
            <span className="pdm-verified-pill">
              <CheckCircle size={12} /> Verified Ground Grievance
            </span>
            <span style={{
              background: cat?.bg || '#EFF6FF',
              color: cat?.color || '#2563EB',
              padding: '4px 10px',
              borderRadius: 6,
              fontSize: 11.5,
              fontWeight: 700
            }}>
              {cat?.emoji} {problem.category}
            </span>
            <span style={{
              background: impact?.bg || '#FEF3C7',
              color: impact?.color || '#D97706',
              padding: '4px 10px',
              borderRadius: 6,
              fontSize: 11.5,
              fontWeight: 700
            }}>
              {problem.impact} Impact
            </span>
            <span style={{
              background: problem.status === 'Assigned' ? '#FEF3C7' : '#DCFCE7',
              color: problem.status === 'Assigned' ? '#D97706' : '#15803D',
              padding: '4px 10px',
              borderRadius: 6,
              fontSize: 11.5,
              fontWeight: 700
            }}>
              {problem.status || 'Open'}
            </span>
            <span style={{ fontSize: 11.5, color: '#94A3B8', marginLeft: 'auto', fontWeight: 500 }}>
              {problem.reportedAgo || 'Reported 1 day ago'}
            </span>
          </div>

          {/* Title */}
          <h2 className="pdm-title">{problem.title}</h2>

          {/* Submitter & Community Backing Strip */}
          <div className="pdm-stakeholder-banner">
            <div className="pdm-submitter-profile">
              <div className="pdm-submitter-avatar">
                {(problem.submitterContact?.name || 'C')[0]}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {problem.submitterContact?.name || 'Verified Citizen Submitter'}
                  <span style={{ fontSize: 10, background: '#DCFCE7', color: '#16A34A', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                    Primary Submitter
                  </span>
                </div>
                <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                  {problem.submitterContact?.email || 'Registered Citizen'} • {loc.village || loc.district || 'Ground Zero Resident'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="pdm-backers-badge">
                <Users size={14} />
                <span>{problem.supportCount || 24} Local Residents Backed</span>
              </div>
              <button
                type="button"
                onClick={() => setChatModal(true)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', background: '#EFF6FF', border: '1.5px solid #BFDBFE',
                  borderRadius: 8, fontSize: 11.5, fontWeight: 700, color: '#1D4ED8', cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(37,99,235,0.1)'
                }}
              >
                <MessageSquare size={14} color="#2563EB" /> Chat with Submitter
              </button>
            </div>
          </div>

          {/* Citizen Ground Statement & Grievance Description */}
          <div className="pdm-section">
            <div className="pdm-citizen-statement-card">
              <div className="pdm-statement-header">
                <div className="pdm-statement-badge">
                  <FileText size={15} color="#002D62" />
                  <span>CITIZEN GROUND PROBLEM STATEMENT &amp; FIELD REPORT</span>
                </div>
                <span className="pdm-statement-verified-tag">
                  <CheckCircle2 size={12} color="#16A34A" /> Direct Citizen Submission
                </span>
              </div>
              <div className="pdm-statement-quote-box">
                <div className="pdm-statement-quote-icon">“</div>
                <p className="pdm-statement-text">
                  {problem.description || problem.desc || 'Citizen reported critical ground obstruction and infrastructural deterioration requiring immediate engineering intervention.'}
                </p>
              </div>
              <div className="pdm-statement-footer">
                <div className="pdm-statement-meta-left">
                  <span>Submitter: <strong>{problem.submitterContact?.name || problem.submitterRole || 'Verified Citizen'}</strong></span>
                  {problem.submitterContact?.phone && (
                    <>
                      <span>•</span>
                      <span>Phone: <strong>{problem.submitterContact.phone}</strong></span>
                    </>
                  )}
                  <span>•</span>
                  <span>Impact: <strong style={{ color: impact.color }}>{problem.impact} Priority</strong></span>
                </div>
                <div className="pdm-statement-tags">
                  <span className="pdm-tag-danger">⚠️ Direct Civic Obstruction</span>
                  <span className="pdm-tag-warning">👥 {problem.supportCount || 24}+ Ward Residents Impacted</span>
                  <span className="pdm-tag-info">📍 Geotagged Field Evidence Available</span>
                </div>
              </div>
            </div>
          </div>

          {/* Ground Field Evidence Banner with Thumbnails & Permanent Video Action */}
          <div className="pdm-section">
            <div className="pdm-section-title">
              <Camera size={15} /> Ground Field Evidence &amp; Visual Inspection
            </div>
            <div className="pdm-gallery-card">
              <div className="pdm-gallery-card-top">
                <div className="pdm-gallery-info">
                  <div className="pdm-gallery-title">
                    Ground Field Evidence ({allEvidencePhotos.length} Geotagged Photos)
                  </div>
                  <div className="pdm-gallery-sub">
                    High-resolution ground photos submitted by citizen. Click on any photo to inspect in full-screen gallery.
                  </div>
                </div>

                {/* Permanent Action Buttons: View Images & Watch Video */}
                <div className="pdm-gallery-actions">
                  {allEvidencePhotos.length > 0 && (
                    <button
                      type="button"
                      className="pdm-gallery-btn"
                      onClick={() => { setGalleryIndex(0); setGalleryOpen(true); }}
                    >
                      <Camera size={15} />
                      <span>View Ground Images ({allEvidencePhotos.length}) →</span>
                    </button>
                  )}

                  {citizenVideoUrl ? (
                    <button
                      type="button"
                      className="pdm-video-btn pdm-video-btn-active"
                      onClick={() => setVideoPlayerOpen(true)}
                      title="Play ground video footage submitted by citizen"
                    >
                      <Play size={15} fill="#FFFFFF" />
                      <span>Play Ground Video</span>
                    </button>
                  ) : (
                    <div
                      className="pdm-video-btn pdm-video-btn-disabled"
                      title="No video uploaded by submitter or citizen"
                    >
                      <VideoOff size={15} />
                      <span>No video uploaded by submitter or citizen</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Photo Thumbnails Strip (Modern Grid Cards) */}
              {allEvidencePhotos.length > 0 ? (
                <div className="pdm-gallery-thumbs-grid">
                  {allEvidencePhotos.map((p, i) => (
                    <div
                      key={i}
                      className="pdm-gallery-thumb-card"
                      onClick={() => { setGalleryIndex(i); setGalleryOpen(true); }}
                      title={`Inspect Photo ${i + 1} in Full Screen`}
                    >
                      <div className="pdm-gallery-img-wrapper">
                        <img
                          src={p.url}
                          alt={`Evidence ${i + 1}`}
                          className="pdm-gallery-thumb-img"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <div className="pdm-gallery-zoom-badge">
                          <Eye size={12} />
                        </div>
                      </div>
                      <div className="pdm-gallery-thumb-label">
                        <span>Photo {i + 1}</span>
                        <span className="pdm-thumb-tag">Geo-Tagged</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '24px 16px', textAlign: 'center', background: '#F8FAFC', borderRadius: 8, border: '1px dashed #CBD5E1', color: '#64748B', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <CameraOff size={24} color="#94A3B8" />
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>No ground photo uploaded by citizen</div>
                  <div style={{ fontSize: 11.5, color: '#94A3B8' }}>The citizen reported this challenge without attaching camera evidence.</div>
                </div>
              )}
            </div>
          </div>

          {/* Exact Ground Location & Civic Jurisdiction (Clean Two-Column Grid) */}
          <div className="pdm-section">
            <div className="pdm-section-title">
              <MapPin size={15} /> Exact Ground Location &amp; Civic Jurisdiction
            </div>
            <div className="pdm-jur-grid">
              <div className="pdm-jur-card">
                <div className="pdm-jur-header">
                  <span className="pdm-jur-icon">📍</span>
                  <div>
                    <div className="pdm-jur-title">Administrative Jurisdiction</div>
                    <div className="pdm-jur-sub">Local Ward &amp; District Administration</div>
                  </div>
                </div>

                <div className="pdm-jur-data-row">
                  <div className="pdm-jur-data-label">Ward / Colony</div>
                  <div className="pdm-jur-data-val">{loc.village || loc.address || 'Chaibasa Ward Area'}</div>
                </div>
                <div className="pdm-jur-data-row">
                  <div className="pdm-jur-data-label">Block &amp; District</div>
                  <div className="pdm-jur-data-val">{loc.block || 'Local Block'}, {loc.district || 'Ranchi'}</div>
                </div>
                <div className="pdm-jur-data-row">
                  <div className="pdm-jur-data-label">State &amp; Pincode</div>
                  <div className="pdm-jur-data-val">{loc.state || 'Jharkhand'} - {loc.pincode || '834001'}</div>
                </div>
                <div className="pdm-jur-data-row">
                  <div className="pdm-jur-data-label">GPS Coordinates</div>
                  <div className="pdm-jur-data-val" style={{ fontFamily: 'monospace', color: '#2563EB', fontWeight: 800 }}>
                    {loc.coordinates ? `${loc.coordinates.lat?.toFixed(4)}° N, ${loc.coordinates.lng?.toFixed(4)}° E` : '23.3441° N, 85.3096° E'}
                  </div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="pdm-maps-link"
                  >
                    <ExternalLink size={12} /> Open Exact Spot in Google Maps
                  </a>
                </div>
              </div>

              <div className="pdm-jur-card">
                <div className="pdm-jur-header">
                  <span className="pdm-jur-icon">🏛️</span>
                  <div>
                    <div className="pdm-jur-title">Government Department &amp; Taskforce</div>
                    <div className="pdm-jur-sub">Responsible Nodal Agency</div>
                  </div>
                </div>

                <div className="pdm-jur-data-row">
                  <div className="pdm-jur-data-label">Nodal Department</div>
                  <div className="pdm-jur-data-val" style={{ color: '#1E40AF', fontWeight: 800 }}>
                    {problem.department || 'Department of Municipal Affairs & Infrastructure'}
                  </div>
                </div>
                <div className="pdm-jur-data-row">
                  <div className="pdm-jur-data-label">Assigned Cell / Taskforce</div>
                  <div className="pdm-jur-data-val">
                    {problem.authority || 'District Municipal Taskforce & HEI Innovation Lab'}
                  </div>
                </div>
                <div className="pdm-jur-data-row">
                  <div className="pdm-jur-data-label">Verification Status</div>
                  <div className="pdm-jur-data-val" style={{ color: '#16A34A', fontWeight: 800 }}>
                    ✓ Sealed by Municipal Field Officer
                  </div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <button
                    type="button"
                    onClick={() => setShowSlip(true)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '8px 14px', background: '#EFF6FF', border: '1.5px solid #BFDBFE',
                      borderRadius: 8, fontSize: 12, fontWeight: 700, color: '#1D4ED8', cursor: 'pointer'
                    }}
                  >
                    <Printer size={13} /> View Official Grievance Slip
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Video Player Modal */}
          {videoPlayerOpen && citizenVideoUrl && (
            <div
              style={{
                position: 'fixed', inset: 0, zIndex: 100000,
                background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
              }}
              onClick={() => setVideoPlayerOpen(false)}
            >
              <div
                style={{
                  background: '#0F172A', borderRadius: 16, overflow: 'hidden',
                  maxWidth: 720, width: '100%', boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
                onClick={e => e.stopPropagation()}
              >
                <div style={{
                  padding: '12px 18px', background: 'rgba(255,255,255,0.05)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  borderBottom: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <div style={{ color: 'white', fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>🎥</span> Citizen Ground Video Proof
                  </div>
                  <button
                    onClick={() => setVideoPlayerOpen(false)}
                    style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: 20, cursor: 'pointer' }}
                  >
                    ✕
                  </button>
                </div>
                <div style={{ padding: 16 }}>
                  <video
                    src={citizenVideoUrl}
                    controls
                    autoPlay
                    style={{ width: '100%', maxHeight: 420, borderRadius: 8, background: '#000' }}
                  />
                  <div style={{ marginTop: 10, fontSize: 12, color: '#94A3B8' }}>
                    📍 Geotagged ground video evidence attached by the citizen during challenge reporting.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Academic Brief (Clean Structured Cards - No Text Overlap) */}
          <div className="pdm-section">
            <div className="pdm-academic-box">
              <h4 style={{ fontSize: 12.5, fontWeight: 800, color: '#1E40AF', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <GraduationCap size={16} /> University Curriculum & Project Fit
              </h4>
              <div className="pdm-academic-grid">
                <div className="pdm-acad-card">
                  <span className="pdm-acad-label">PROJECT TYPE</span>
                  <strong className="pdm-acad-val">{problem.academicBrief?.projectType || 'Capstone Project'}</strong>
                </div>
                <div className="pdm-acad-card">
                  <span className="pdm-acad-label">ENGINEERING DISCIPLINE</span>
                  <strong className="pdm-acad-val">{problem.academicBrief?.discipline || 'Computer Science'}</strong>
                </div>
                <div className="pdm-acad-card">
                  <span className="pdm-acad-label">RECOMMENDED DURATION</span>
                  <strong className="pdm-acad-val">{problem.academicBrief?.duration || '6-8 Months'}</strong>
                </div>
                <div className="pdm-acad-card">
                  <span className="pdm-acad-label">SEMESTER FIT</span>
                  <strong className="pdm-acad-val">{problem.academicBrief?.semesterFit || 'Semester 7-8'}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pdm-footer">
            <button
              type="button"
              onClick={() => setShowSlip(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '9px 14px', borderRadius: 8, border: '1px solid #CBD5E1',
                background: '#FFFFFF', color: '#334155', fontSize: 12, fontWeight: 700, cursor: 'pointer'
              }}
            >
              <FileText size={14} /> Official Slip
            </button>

            <button
              type="button"
              onClick={() => setChatModal(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '9px 16px', borderRadius: 8, border: '1.5px solid #BFDBFE',
                background: '#EFF6FF', color: '#1D4ED8', fontSize: 12, fontWeight: 700, cursor: 'pointer'
              }}
            >
              <MessageSquare size={14} color="#2563EB" /> Chat with Submitter
            </button>

            <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
              {problem.forkable && (
                <button
                  type="button"
                  onClick={() => onFork(problem)}
                  style={{
                    padding: '9px 16px', borderRadius: 8, border: '1.5px solid #2563EB',
                    background: '#EFF6FF', color: '#2563EB', fontSize: 12.5, fontWeight: 700,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
                  }}
                >
                  <GitFork size={14} /> Fork Solution
                </button>
              )}

              <button
                type="button"
                onClick={() => onStartProject(problem)}
                style={{
                  padding: '10px 22px', borderRadius: 8, border: 'none',
                  background: '#0F172A', color: '#FFFFFF', fontSize: 12.5, fontWeight: 700,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                  boxShadow: '0 4px 14px rgba(15,23,42,0.25)'
                }}
              >
                Start a Project <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Multi-Image Gallery */}
      {galleryOpen && (
        <FullscreenGalleryModal
          images={allEvidencePhotos}
          initialIndex={galleryIndex}
          caption={`Ground Evidence Inspection • ${challengeId} • ${loc.village || loc.district || problem.location}`}
          onClose={() => setGalleryOpen(false)}
        />
      )}

      {/* Cross-Portal Citizen Chat Modal */}
      {chatModal && (
        <CitizenChatModal
          problem={problem}
          onClose={() => setChatModal(false)}
        />
      )}

      {/* Video Modal */}
      {videoModal && (
        <VideoPlayerModal
          videoTitle={`Citizen Ground Video • ${challengeId}`}
          onClose={() => setVideoModal(false)}
        />
      )}

      {/* Official Slip Modal */}
      {showSlip && (
        <OfficialSlipModal
          problem={problem}
          onClose={() => setShowSlip(false)}
        />
      )}
    </>,
    document.body
  );
}

/* ══════════════════════════════════════════
   PROBLEM CARD (Enhanced with Evidence & Citizen Details)
   ══════════════════════════════════════════ */
function ProblemCard({ problem, onTwinClick, onDetailClick, onFork, onStartProject }) {
  const [saved, setSaved] = useState(problem.bookmarked || false);
  const cat = categories[problem.category] || categories['Smart City'];
  const impact = impactColors[problem.impact] || impactColors['Medium'];
  const urgency = getUrgencyStyle(problem);
  const urgencyLabel = problem.daysUnassigned > 6 ? getUrgencyLabel(problem.daysUnassigned) : null;
  const challengeId = (problem.challengeId || problem.reportId || (problem._id ? 'JH-2026-' + String(problem._id).slice(-6).toUpperCase() : `JH-2026-${problem.id || 1001}`)).replace(/^#/, '');
  const beforeImg = (problem.beforeImage && !problem.beforeImage.startsWith('/images/')) ? problem.beforeImage : null;
  const loc = problem.fullLocation || {
    village: 'Ground Zero Ward',
    district: (problem.location || '').split(',')[0]?.trim() || 'Ranchi'
  };

  const handleBookmark = async (e) => {
    e.stopPropagation();
    setSaved(!saved);
    try {
      await fetch(`/api/problems/${problem._id || problem.id}/bookmark`, { method: 'PATCH' });
    } catch (e) {
      // ignore
    }
  };

  const avatarColors = [
    'linear-gradient(135deg, #6366F1, #8B5CF6)',
    'linear-gradient(135deg, #EC4899, #F43F5E)',
    'linear-gradient(135deg, #14B8A6, #06B6D4)',
    'linear-gradient(135deg, #F97316, #EF4444)',
  ];

  return (
    <div className="bp-card" style={urgency} onClick={() => onDetailClick(problem)}>
      {/* Urgency glow bar at top for critical items */}
      {problem.daysUnassigned >= 14 && problem.impact === 'High' && (
        <div className="bp-urgency-bar" />
      )}

      {/* Top Header: Category + Grievance ID + Bookmark */}
      <div className="bp-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span className="bp-category" style={{ background: cat.bg, color: cat.color }}>
            <span className="bp-cat-dot" style={{ background: cat.dotColor }} />
            {problem.category}
          </span>
          <span className="bp-report-id-tag">
            #{challengeId}
          </span>
        </div>
        <button className="bp-bookmark" onClick={handleBookmark} title={saved ? 'Remove Bookmark' : 'Bookmark Problem'}>
          {saved
            ? <BookmarkCheck style={{ width: 16, height: 16, color: '#2563EB' }} />
            : <Bookmark style={{ width: 16, height: 16 }} />
          }
        </button>
      </div>

      {/* Ground Evidence Banner - Only real citizen upload or clean no-photo slate */}
      {beforeImg ? (
        <div className="bp-card-image-wrap" onClick={(e) => { e.stopPropagation(); onDetailClick(problem); }}>
          <img
            src={beforeImg}
            alt={problem.title}
            className="bp-card-image"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <div className="bp-card-image-overlay">
            <div className="bp-card-image-top">
              <span className="bp-evidence-badge">
                <Camera size={11} /> Ground Evidence Attached
              </span>
              <span style={{ fontSize: 9.5, background: 'rgba(15,23,42,0.6)', color: '#F1F5F9', padding: '2px 6px', borderRadius: 4, backdropFilter: 'blur(4px)', fontWeight: 600 }}>
                {problem.evidenceMedia?.length || problem.photoCount || 1} {problem.photoCount === 1 ? 'File' : 'Files'}
              </span>
            </div>
            <div className="bp-card-image-bottom">
              <span className="bp-card-loc-chip">
                <MapPin size={11} color="#EF4444" /> {loc.village || loc.district || problem.location}
              </span>
              <span style={{ fontSize: 10, background: impact.bg, color: impact.color, padding: '2px 7px', borderRadius: 4, fontWeight: 700 }}>
                {problem.impact || 'High'} Impact
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bp-card-image-wrap bp-card-no-photo-wrap" onClick={(e) => { e.stopPropagation(); onDetailClick(problem); }} style={{ height: 68, background: 'linear-gradient(135deg, #F8FAFC 0%, #EEF2F6 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 8, border: '1px solid #E2E8F0', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 9.5, fontWeight: 700, color: '#64748B', background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '2px 7px', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <CameraOff size={10} /> No Ground Photo Uploaded
            </span>
            <span style={{ fontSize: 9.5, background: impact.bg, color: impact.color, padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
              {problem.impact || 'High'} Impact
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
            <span className="bp-card-loc-chip" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', color: '#475569', fontSize: 10 }}>
              <MapPin size={10} color="#EF4444" /> {loc.village || loc.district || problem.location}
            </span>
          </div>
        </div>
      )}

      {/* Twinning Banner */}
      {problem.twinnedWith && problem.twinnedWith.length > 0 && (
        <button className="bp-twin-banner" onClick={(e) => { e.stopPropagation(); onTwinClick(problem); }}>
          <AlertTriangle style={{ width: 13, height: 13, color: '#F59E0B', flexShrink: 0 }} />
          <span>Twinned with {problem.twinnedWith.length} {problem.twinnedWith.length === 1 ? 'region' : 'regions'} ({problem.twinnedWith.map(t => t.region).join(', ')})</span>
          <ArrowRight style={{ width: 12, height: 12, marginLeft: 'auto', color: '#D97706', flexShrink: 0 }} />
        </button>
      )}

      {/* Fork Solution Banner */}
      {problem.forkable && (
        <div className="bp-fork-banner">
          <div className="bp-fork-icon">
            <GitFork style={{ width: 14, height: 14 }} />
          </div>
          <div className="bp-fork-text">
            <span className="bp-fork-similarity">{problem.forkable.similarity}% similar</span> to {problem.forkable.university}'s deployed solution
          </div>
          <button className="bp-fork-btn" onClick={(e) => { e.stopPropagation(); onFork(problem); }}>
            <GitFork style={{ width: 12, height: 12 }} />
            Fork & Customize
          </button>
        </div>
      )}

      {/* Citizen Submitter & Supporters Strip */}
      {/* Citizen Submitter & Supporters Strip */}
      <div className="bp-card-submitter-row">
        <span className="bp-card-submitter-name">
          <CheckCircle2 size={12} color="#16A34A" /> {problem.submitterContact?.name || 'Citizen Report'}
        </span>
        <span className="bp-card-backers-count">
          <Users size={12} /> {(() => {
            const count = (problem.upvotes && Array.isArray(problem.upvotes)) 
              ? problem.upvotes.length 
              : (problem.supportCount !== undefined && problem.supportCount !== null ? problem.supportCount : 0);
            return `${count} ${count === 1 ? 'Verified Backer' : 'Verified Backers'}`;
          })()}
        </span>
      </div>

      {/* Assignment Badges if Assigned by Admin */}
      {(problem.universityAssigned || problem.industryAssigned) && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '4px 0 2px' }}>
          {problem.universityAssigned && (
            <span style={{ fontSize: 10, fontWeight: 800, color: '#1E40AF', background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '2px 7px', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              🎓 Assigned: {problem.universityAssigned} {problem.assignedUniversityUid ? `[${problem.assignedUniversityUid}]` : ''}
            </span>
          )}
          {problem.industryAssigned && (
            <span style={{ fontSize: 10, fontWeight: 800, color: '#047857', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '2px 7px', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              🏭 Industry: {problem.industryAssigned} {problem.assignedIndustryIid ? `[${problem.assignedIndustryIid}]` : ''}
            </span>
          )}
        </div>
      )}

      {/* Title */}
      <h3 className="bp-title">{problem.title}</h3>

      {/* Civic Department & Ground Video Pill */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, flexWrap: 'wrap', margin: '6px 0 8px' }}>
        <div className="bp-card-dept-tag" style={{ margin: 0 }}>
          🏛️ {problem.department || 'Department of Urban Development & Infrastructure'}
        </div>
        {problem.videoUrl ? (
          <span
            style={{ fontSize: 10, fontWeight: 800, color: '#DC2626', background: '#FEF2F2', border: '1px solid #FECACA', padding: '3px 8px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 4 }}
            title="Citizen ground footage available"
          >
            <Video size={11} /> Play Video
          </span>
        ) : (
          <span
            style={{ fontSize: 9.5, fontWeight: 700, color: '#64748B', background: '#F1F5F9', border: '1px solid #E2E8F0', padding: '3px 7px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 4 }}
            title="No video uploaded by submitter or citizen"
          >
            <VideoOff size={10} /> No video uploaded
          </span>
        )}
      </div>

      {/* Description Excerpt */}
      <p className="bp-desc">{problem.description}</p>

      {/* Urgency Label */}
      {urgencyLabel && (
        <div className="bp-urgency-label" style={{ color: urgencyLabel.color }}>
          {urgencyLabel.text}
        </div>
      )}

      {/* Academic Brief */}
      <div className="bp-brief">
        <GraduationCap style={{ width: 12, height: 12, color: '#3B82F6', flexShrink: 0 }} />
        <span className="bp-brief-type">{problem.academicBrief?.projectType || 'Capstone Project'}</span>
        <span style={{ color: '#CBD5E1' }}>·</span>
        <span className="bp-brief-disc">{problem.academicBrief?.discipline || 'Civil & Infrastructure Engineering'}</span>
        <span style={{ color: '#CBD5E1' }}>·</span>
        <span className="bp-brief-dur">{problem.academicBrief?.duration || '6-8 Months'}</span>
      </div>

      {/* Footer: Real Interested Status + Actions */}
      <div className="bp-footer" style={{ marginTop: 'auto' }}>
        <div className="bp-footer-left">
          {problem.interested > 0 ? (
            <>
              <div className="bp-footer-avatars">
                {Array.from({ length: Math.min(problem.interested, 3) }).map((_, i) => (
                  <div key={i} className="bp-footer-avatar" style={{ background: avatarColors[i % avatarColors.length] }}>
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
              </div>
              <span className="bp-interested">{problem.interested} {problem.interested === 1 ? 'interested team' : 'interested teams'}</span>
            </>
          ) : (
            <span style={{ fontSize: 10.5, fontWeight: 700, color: '#059669', background: '#ECFDF5', padding: '3px 8px', borderRadius: 6, border: '1px solid #A7F3D0' }}>
              ✨ Open for Solutions
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={(e) => { e.stopPropagation(); onStartProject(problem); }}
            style={{
              background: '#0F172A', color: '#FFFFFF', border: 'none',
              borderRadius: 8, padding: '7px 12px', fontSize: 11, fontWeight: 700,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
              boxShadow: '0 2px 6px rgba(15,23,42,0.2)'
            }}
          >
            Start Project
          </button>
          <button
            type="button"
            className="bp-view-details"
            onClick={(e) => {
              e.stopPropagation();
              onDetailClick(problem);
            }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 4,
              color: '#2563EB', fontWeight: 700, fontSize: 12, padding: 0
            }}
          >
            Dossier <ArrowRight style={{ width: 12, height: 12 }} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   BROWSE PROBLEMS PAGE
   ══════════════════════════════════════════ */
export default function BrowseProblems() {
  const navigate = useNavigate();
  const [problems, setProblems] = useState(mockProblems);
  const [discipline, setDiscipline] = useState('All Disciplines');
  const [difficulty, setDifficulty] = useState('All Levels');
  const [duration, setDuration] = useState('All Durations');
  const [location, setLocation] = useState('All India');
  const [activeCategory, setActiveCategory] = useState('All');
  const [collabOnly, setCollabOnly] = useState(false);
  const [forkOnly, setForkOnly] = useState(false);
  const [assignedOnly, setAssignedOnly] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('Latest');
  const [twinModal, setTwinModal] = useState(null);
  const [detailModal, setDetailModal] = useState(null);
  const [autoOpenChat, setAutoOpenChat] = useState(false);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch problems from API with authenticated identity scoping
  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.showJanSetuCivicLoader === 'function') {
      window.showJanSetuCivicLoader('University Innovation Cell: Loading Civic Challenges & Analytics Data...', { autoDismiss: false });
    }
    setLoading(true);

    let user = null;
    try { user = JSON.parse(localStorage.getItem('user') || localStorage.getItem('is_user')); } catch(e) {}
    const token = localStorage.getItem('token') || localStorage.getItem('is_token') || '';
    const univ = user?.institution || user?.organization || '';
    const uid = user?.uniqueId || user?.universityIdString || '';

    let url = '/api/problems';
    const params = [];
    if (univ) params.push(`institution=${encodeURIComponent(univ)}`);
    if (uid) params.push(`uid=${encodeURIComponent(uid)}`);
    if (params.length > 0) url += '?' + params.join('&');

    fetch(url, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    })
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : (data && Array.isArray(data.data) ? data.data : []);
        if (list.length > 0) setProblems(list);
      })
      .catch((err) => {
        console.error('Error fetching university problems:', err);
      })
      .finally(() => {
        setLoading(false);
        if (typeof window !== 'undefined' && typeof window.hideJanSetuCivicLoader === 'function') {
          window.hideJanSetuCivicLoader();
        }
      });
  }, []);

  // Check URL parameters for ?problemId=:id or ?openChat=:problemId
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const problemId = params.get('problemId') || params.get('openChat');
    if (problemId && problems.length > 0) {
      const target = problems.find(p => 
        String(p._id || p.id) === String(problemId) || 
        (p.challengeId && String(p.challengeId).toLowerCase() === String(problemId).toLowerCase())
      );
      if (target) {
        setDetailModal(target);
        if (params.get('openChat')) {
          setAutoOpenChat(true);
        }
      }
    }
  }, [problems]);

  const handleStartProject = async (prob) => {
    try {
      const probId = prob._id || prob.id;
      // Mark problem as claimed in backend
      fetch(`/api/problems/${probId}/claim`, { method: 'POST' }).catch(() => {});

      // Immediately remove from local problems list
      setProblems(prev => prev.filter(p => (p._id || p.id) !== probId));

      // Store problem in session for team formation
      try {
        sessionStorage.setItem('pendingProjectProblem', JSON.stringify(prob));
      } catch (e) {}

      toast('Problem claimed! Please assemble your student team to initialize project.', 'success');
      setDetailModal(null);

      // Redirect to Team section with problem prefilled
      navigate('/team-mentorship', { state: { startProjectProblem: prob } });
    } catch (e) {
      toast('Error claiming problem', 'error');
    }
  };

  const handleFork = async (prob) => {
    try {
      const res = await fetch(`/api/problems/${prob._id || prob.id}/fork`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast('Solution Forked! Initialized in My Projects.', 'success');
        setDetailModal(null);
        navigate('/my-projects');
      } else {
        toast(data.error || 'Failed to fork problem', 'error');
      }
    } catch (e) {
      toast('Error forking solution', 'error');
    }
  };

  const resetFilters = () => {
    setDiscipline('All Disciplines');
    setDifficulty('All Levels');
    setDuration('All Durations');
    setLocation('All India');
    setActiveCategory('All');
    setCollabOnly(false);
    setForkOnly(false);
    setAssignedOnly(false);
  };

  const filtered = useMemo(() => {
    let user = null;
    try { user = JSON.parse(localStorage.getItem('user') || localStorage.getItem('is_user')); } catch(e) {}
    const userUniv = (user?.institution || user?.organization || '').toLowerCase().trim();
    const userUid = (user?.uniqueId || user?.universityIdString || '').toLowerCase().trim();

    return problems.filter((p) => {
      const pUniv = (p.universityAssigned || '').toLowerCase().trim();
      const pUid = (p.assignedUniversityUid || '').toLowerCase().trim();
      const isAssignedToMe = Boolean(
        (userUniv && pUniv && (pUniv.includes(userUniv.split(' ')[0]) || userUniv.includes(pUniv.split(' ')[0]))) ||
        (userUid && pUid && pUid === userUid)
      );
      const isAssignedToOther = Boolean(pUniv && !isAssignedToMe);

      // Strict university assignment: NEVER show challenges assigned to another university!
      if (isAssignedToOther) return false;

      // Filter: Show only challenges assigned to my university
      if (assignedOnly && !isAssignedToMe) return false;

      const st = (p.status || '').toLowerCase();
      if (st === 'resolved' || st === 'rejected') return false;

      // In general feed, don't show other assigned problems; if assigned to me, always allow
      if (st === 'assigned' && !isAssignedToMe && !assignedOnly) return false;

      if (activeCategory !== 'All' && p.category !== activeCategory) return false;
      if (discipline !== 'All Disciplines' && p.academicBrief?.discipline !== discipline) return false;
      if (difficulty === 'High Impact' && p.impact !== 'High') return false;
      if (difficulty === 'Medium Impact' && p.impact !== 'Medium') return false;
      if (difficulty === 'Low Impact' && p.impact !== 'Low') return false;
      if (collabOnly && (!p.twinnedWith || p.twinnedWith.length === 0)) return false;
      if (forkOnly && !p.forkable) return false;
      return true;
    });
  }, [problems, activeCategory, discipline, difficulty, collabOnly, forkOnly, assignedOnly]);

  const hasFilters = discipline !== 'All Disciplines' || difficulty !== 'All Levels' || duration !== 'All Durations' || location !== 'All India' || activeCategory !== 'All' || collabOnly || forkOnly;

  return (
    <div className="animate-in" style={{ minHeight: '100%' }}>

      {/* ── Hero Section ── */}
      <div className="bp-hero">
        <div className="hero-flag-wave">
          <div className="f-s" />
          <div className="f-w" />
          <div className="f-g" />
        </div>

        {/* Breadcrumb */}
        <div className="bp-breadcrumb">
          Home &nbsp;›&nbsp; Browse Problems
        </div>

        <div className="bp-hero-content">
          <div className="bp-hero-left">
            <h1 className="bp-hero-title">
              Browse <span style={{ color: '#22C55E' }}>Problems</span>
            </h1>
            <p className="bp-hero-subtitle">
              Explore real-world problems from government and local communities. Guide student teams to build impactful solutions.
            </p>
          </div>

          <div className="bp-hero-right">
            {/* Quote */}
            <div className="bp-hero-quote">
              <span className="bp-hq-mark">"</span>
              <div>
                <span className="bp-hq-text">Innovation today<br />for a <strong style={{ color: '#22C55E' }}>better tomorrow.</strong>"</span>
                <div className="bp-hq-attr">— Viksit Bharat</div>
              </div>
            </div>

            {/* Mini stats */}
            <div className="bp-hero-stats">
              <div className="bp-hstat">
                <FileText style={{ width: 16, height: 16, color: '#2563EB' }} />
                <div>
                  <div className="bp-hstat-val">124</div>
                  <div className="bp-hstat-label">Total Problems</div>
                </div>
              </div>
              <div className="bp-hstat">
                <Users style={{ width: 16, height: 16, color: '#16A34A' }} />
                <div>
                  <div className="bp-hstat-val">32</div>
                  <div className="bp-hstat-label">Participating States</div>
                </div>
              </div>
              <div className="bp-hstat">
                <MapPin style={{ width: 16, height: 16, color: '#DC2626' }} />
                <div>
                  <div className="bp-hstat-val">18</div>
                  <div className="bp-hstat-label">Focus Areas</div>
                </div>
              </div>
              <div className="bp-hstat">
                <Users style={{ width: 16, height: 16, color: '#2563EB' }} />
                <div>
                  <div className="bp-hstat-val">560+</div>
                  <div className="bp-hstat-label">Student Teams</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Monument decorative element */}
        <div className="bp-hero-monument">
          <svg viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ height: 100, opacity: 0.25 }}>
            {/* India Gate */}
            <rect x="65" y="30" width="70" height="80" rx="2" fill="#C8B560" />
            <path d="M75 108 L75 65 Q100 45 125 65 L125 108" fill="#F0E8D0" stroke="#C8B560" strokeWidth="1" />
            <rect x="60" y="24" width="80" height="8" rx="2" fill="#DDD4BC" />
            <ellipse cx="100" cy="24" rx="10" ry="14" fill="#C8B560" />
            <line x1="100" y1="10" x2="100" y2="0" stroke="#C8B560" strokeWidth="2.5" />
          </svg>
        </div>

        {/* Indian flag strip at bottom */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, display: 'flex' }}>
          <div style={{ flex: 1, background: '#FF9933' }} />
          <div style={{ flex: 1, background: 'white' }} />
          <div style={{ flex: 1, background: '#138808' }} />
        </div>
      </div>

      {/* ── Filters Section ── */}
      <div className="bp-filters-section">
        {/* Row 1: Dropdowns */}
        <div className="bp-filter-row">
          <div className="bp-filter-group">
            <label className="bp-filter-label">Discipline</label>
            <select className="bp-filter-select" value={discipline} onChange={e => setDiscipline(e.target.value)}>
              {disciplines.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div className="bp-filter-group">
            <label className="bp-filter-label">Difficulty Level</label>
            <select className="bp-filter-select" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
              {difficulties.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div className="bp-filter-group">
            <label className="bp-filter-label">Project Duration</label>
            <select className="bp-filter-select" value={duration} onChange={e => setDuration(e.target.value)}>
              {durations.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div className="bp-filter-group">
            <label className="bp-filter-label">Location</label>
            <select className="bp-filter-select" value={location} onChange={e => setLocation(e.target.value)}>
              {locations.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div className="bp-filter-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button className="bp-reset-btn" onClick={resetFilters}>
              <RotateCcw style={{ width: 12, height: 12 }} />
              Reset Filters
            </button>
          </div>
        </div>

        {/* Row 2: Assigned Only + Collab toggle + Sort */}
        <div className="bp-filter-row2" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <label
            className="bp-collab-toggle"
            onClick={() => setAssignedOnly(!assignedOnly)}
            style={{
              background: assignedOnly ? '#EFF6FF' : '#FFFFFF',
              border: assignedOnly ? '1.5px solid #2563EB' : '1px solid #CBD5E1',
              padding: '6px 14px', borderRadius: 8, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8
            }}
          >
            <div className="bp-toggle-track" data-active={assignedOnly}>
              <div className="bp-toggle-thumb" />
            </div>
            <span style={{ fontWeight: assignedOnly ? 800 : 600, color: assignedOnly ? '#1D4ED8' : '#334155' }}>
              🎓 Assigned Exclusively to My University
            </span>
          </label>

          <label className="bp-collab-toggle" onClick={() => setCollabOnly(!collabOnly)}>
            <div className="bp-toggle-track" data-active={collabOnly}>
              <div className="bp-toggle-thumb" />
            </div>
            <span>Show only collaboration-ready problems</span>
          </label>
          <div className="bp-sort-area" style={{ marginLeft: 'auto' }}>
            <span className="bp-sort-label">Sort by: {sortBy}</span>
            <ChevronDown style={{ width: 12, height: 12, color: '#94A3B8' }} />
          </div>
        </div>
      </div>

      {/* ── Category Pills + Count + View Toggle ── */}
      <div className="bp-category-bar">
        <div className="bp-cat-pills">
          {allCategories.map(cat => {
            const isActive = activeCategory === cat;
            const catConfig = categories[cat];
            return (
              <button
                key={cat}
                className={`bp-cat-pill ${isActive ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
                style={isActive && catConfig ? { background: catConfig.bg, color: catConfig.color, borderColor: catConfig.dotColor } : {}}
              >
                {catConfig && <span className="bp-cat-dot" style={{ background: isActive ? catConfig.dotColor : '#94A3B8' }} />}
                {cat}
              </button>
            );
          })}
          <button className="bp-cat-pill more" onClick={() => setShowMoreFilters(!showMoreFilters)}>
            <MoreHorizontal style={{ width: 14, height: 14 }} /> {showMoreFilters ? 'Less Filters' : 'More Filters'}
          </button>
        </div>
      </div>

      {/* ── Expanded More Filters ── */}
      {showMoreFilters && (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', background: '#F8FAFC', padding: '12px 18px', borderRadius: 12, border: '1px solid #E2E8F0', marginBottom: 16 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Quick Filters:</span>
          <button
            onClick={() => setForkOnly(!forkOnly)}
            style={{
              padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              border: forkOnly ? '1.5px solid #2563EB' : '1px solid #CBD5E1',
              background: forkOnly ? '#EFF6FF' : '#FFFFFF',
              color: forkOnly ? '#2563EB' : '#475569'
            }}
          >
            ⭐ Only Forkable Deployed Solutions
          </button>
          <button
            onClick={() => setCollabOnly(!collabOnly)}
            style={{
              padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              border: collabOnly ? '1.5px solid #16A34A' : '1px solid #CBD5E1',
              background: collabOnly ? '#F0FDF4' : '#FFFFFF',
              color: collabOnly ? '#16A34A' : '#475569'
            }}
          >
            🔄 Only Twinned Problems
          </button>
        </div>
      )}

      {/* ── Results info + View toggle ── */}
      <div className="bp-results-bar">
        <p className="bp-result-count">Showing {filtered.length} of {problems.length} problems</p>
        <div className="bp-view-toggle">
          {[
            { mode: 'grid', icon: Grid3X3, label: 'Grid' },
            { mode: 'list', icon: List, label: 'List' },
            { mode: 'map', icon: Map, label: 'Map' },
          ].map(v => (
            <button
              key={v.mode}
              className={`bp-view-btn ${viewMode === v.mode ? 'active' : ''}`}
              onClick={() => setViewMode(v.mode)}
            >
              <v.icon style={{ width: 14, height: 14 }} /> {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Problem Cards Grid ── */}
      <div className="bp-grid">
        {filtered.map((p) => (
          <ProblemCard
            key={p._id || p.id}
            problem={p}
            onTwinClick={setTwinModal}
            onDetailClick={setDetailModal}
            onFork={handleFork}
            onStartProject={handleStartProject}
          />
        ))}
      </div>

      {!loading && filtered.length === 0 && (
        <div className="bp-empty">
          <Search style={{ width: 28, height: 28, color: '#CBD5E1' }} />
          <p style={{ fontWeight: 600, color: '#475569', marginTop: 12 }}>No problems match your filters</p>
          <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>Try adjusting your filter criteria</p>
          <button onClick={resetFilters} style={{ marginTop: 12, color: '#2563EB', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'Inter, sans-serif' }}>
            Reset all filters
          </button>
        </div>
      )}

      {/* Twinning Modal */}
      {twinModal && <TwinningModal problem={twinModal} onClose={() => setTwinModal(null)} />}

      {/* Problem Detail Modal (Stages 2 & 3) */}
      {detailModal && (
        <ProblemDetailModal
          problem={detailModal}
          onClose={() => { setDetailModal(null); setAutoOpenChat(false); }}
          onStartProject={handleStartProject}
          onFork={handleFork}
          initialChatOpen={autoOpenChat}
        />
      )}

      {/* Footer */}
      <div className="footer-strip" style={{ marginTop: 20 }}>
        <div className="footer-flag">
          <div className="f1" />
          <div className="f2" />
          <div className="f3" />
        </div>
        Proud to build a better India through innovation and collaboration.
      </div>
    </div>
  );
}
