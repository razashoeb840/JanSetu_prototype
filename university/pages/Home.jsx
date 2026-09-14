import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, Link } from 'react-router-dom';
import {
  FileText, Users, CheckCircle, Trophy, Clock,
  MapPin, Bookmark, Zap, ArrowRight, RotateCcw,
  AlertTriangle, Video, Calendar, X, GitFork, ShieldCheck,
  Building2, Star, Sparkles, ChevronRight, ChevronLeft, ExternalLink,
  BookOpen, Compass, Layers, Check, Plus, FolderGit2,
  Camera, CameraOff, Phone, Play, Printer, CheckCircle2, Eye, Shield,
  MessageSquare, Send, VideoOff
} from 'lucide-react';
import { toast } from '../utils/toast';

const TIMELINE_STEPS = ['Assigned', 'In Progress', 'Prototype', 'Submitted', 'Deployed'];

/* ────────────────────────────────────────────
   SUB-COMPONENTS
──────────────────────────────────────────── */

/* Indian Monuments SVG for hero */
function MonumentsSVG() {
  return (
    <svg viewBox="0 0 520 155" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ height: 148, width: 'auto' }}>
      {/* Taj Mahal */}
      <ellipse cx="260" cy="68" rx="38" ry="36" fill="#F5EED9" stroke="#D4C5A0" strokeWidth="1"/>
      <line x1="260" y1="32" x2="260" y2="16" stroke="#C8B560" strokeWidth="2.5"/>
      <circle cx="260" cy="14" r="4" fill="#C8B560"/>
      <rect x="236" y="85" width="48" height="50" rx="3" fill="#F0E8D0" stroke="#D4C5A0" strokeWidth="1"/>
      <path d="M236 95 Q260 80 284 95" fill="none" stroke="#D4C5A0" strokeWidth="1"/>
      <rect x="192" y="90" width="10" height="45" rx="2" fill="#F5EED9" stroke="#D4C5A0" strokeWidth="0.8"/>
      <ellipse cx="197" cy="88" rx="6" ry="7" fill="#F0E8D0" stroke="#D4C5A0" strokeWidth="0.8"/>
      <circle cx="197" cy="81" r="2.5" fill="#C8B560"/>
      <rect x="318" y="90" width="10" height="45" rx="2" fill="#F5EED9" stroke="#D4C5A0" strokeWidth="0.8"/>
      <ellipse cx="323" cy="88" rx="6" ry="7" fill="#F0E8D0" stroke="#D4C5A0" strokeWidth="0.8"/>
      <circle cx="323" cy="81" r="2.5" fill="#C8B560"/>
      <rect x="205" y="133" width="110" height="8" rx="2" fill="#E8DFCA" stroke="#D4C5A0" strokeWidth="0.8"/>
      <rect x="185" y="140" width="150" height="5" rx="1" fill="#DDD4BC"/>

      {/* Gateway of India */}
      <rect x="410" y="80" width="70" height="70" rx="2" fill="#F2EAD8" stroke="#C8B88A" strokeWidth="1"/>
      <path d="M425 148 L425 105 Q445 88 465 105 L465 148" fill="#E8F4FD" stroke="#C8B88A" strokeWidth="0.8"/>
      <ellipse cx="445" cy="78" rx="22" ry="16" fill="#F2EAD8" stroke="#C8B88A" strokeWidth="1"/>
      <circle cx="445" cy="63" r="4" fill="#C8A84B"/>
      <rect x="404" y="70" width="12" height="78" rx="2" fill="#EDE5D0" stroke="#C8B88A" strokeWidth="0.8"/>
      <rect x="474" y="70" width="12" height="78" rx="2" fill="#EDE5D0" stroke="#C8B88A" strokeWidth="0.8"/>
      <rect x="410" y="90" width="70" height="5" rx="1" fill="#DDD4BC" opacity="0.7"/>

      {/* Ground & subtle flag */}
      <line x1="10" y1="150" x2="510" y2="150" stroke="#D4C5A0" strokeWidth="1.5" opacity="0.6"/>
      <path d="M130 30 Q180 24 230 32 Q280 40 330 30 Q380 20 430 28" stroke="#FF9933" strokeWidth="1.5" fill="none" opacity="0.25"/>
      <path d="M130 36 Q180 30 230 38 Q280 46 330 36 Q380 26 430 34" stroke="white" strokeWidth="1.5" fill="none" opacity="0.2"/>
      <path d="M130 42 Q180 36 230 44 Q280 52 330 42 Q380 32 430 40" stroke="#138808" strokeWidth="1.5" fill="none" opacity="0.25"/>
    </svg>
  );
}

/* ────────────────────────────────────────────
   SUB-MODALS: FULLSCREEN GALLERY, CHAT, VIDEO & SLIP
──────────────────────────────────────────── */
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

function VideoPlayerModal({ videoTitle, videoUrl, onClose }) {
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
        background: '#0F172A', borderRadius: 16, width: '100%', maxWidth: 720,
        overflow: 'hidden', border: '1px solid rgba(255,255,255,0.15)',
        boxShadow: '0 25px 60px rgba(0,0,0,0.6)', position: 'relative', margin: 'auto'
      }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#FFFFFF', fontSize: 13, fontWeight: 700 }}>
            <Video size={16} color="#38BDF8" /> {videoTitle || 'Citizen Ground Video'}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ position: 'relative', background: '#020617', padding: videoUrl ? '0' : '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          {videoUrl ? (
            <div style={{ width: '100%', background: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <video
                src={videoUrl}
                controls
                autoPlay
                playsInline
                style={{ width: '100%', maxHeight: '480px', objectFit: 'contain', background: '#000' }}
              >
                Your browser does not support HTML5 video playback.
              </video>
            </div>
          ) : (
            <>
              <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'rgba(37,99,235,0.25)', border: '2px solid #3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <Play size={30} color="#60A5FA" style={{ marginLeft: 4 }} />
              </div>
              <div style={{ color: '#FFFFFF', fontSize: 15, fontWeight: 700 }}>No Video Uploaded</div>
              <div style={{ color: '#94A3B8', fontSize: 12, marginTop: 6, maxWidth: 380, lineHeight: 1.5 }}>
                No video file was submitted by the citizen for this civic issue.
              </div>
            </>
          )}
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
            <strong>{loc.village ? `${loc.village}, ${loc.block}, ${loc.district}, ${loc.state} - ${loc.pincode}` : (problem.location || 'Patna, Bihar')}</strong>
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <span style={{ color: '#64748B', fontSize: 10, display: 'block', fontWeight: 700 }}>COMPETENT DEPARTMENT</span>
            <strong>{problem.department || 'Department of Municipal Affairs & Infrastructure'}</strong>
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <span style={{ color: '#64748B', fontSize: 10, display: 'block', fontWeight: 700 }}>GRIEVANCE CLASSIFICATION & IMPACT</span>
            <span>{problem.category} • <strong style={{ color: problem.impact === 'High' ? '#DC2626' : '#D97706' }}>{problem.impact || 'High'} Priority</strong></span>
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

/* ────────────────────────────────────────────
   PROBLEM DETAIL MODAL (Rich Citizen Dossier)
──────────────────────────────────────────── */
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

  const catColorMap = {
    'Disaster Management': { color: '#C2410C', bg: '#FFF7ED', emoji: '🛡️' },
    'Healthcare': { color: '#15803D', bg: '#F0FDF4', emoji: '🏥' },
    'Infrastructure': { color: '#1D4ED8', bg: '#EFF6FF', emoji: '🏗️' },
    'Environmental Science': { color: '#166534', bg: '#ECFDF5', emoji: '🌿' },
    'Smart City': { color: '#4338CA', bg: '#EEF2FF', emoji: '🏙️' },
    'Education': { color: '#92400E', bg: '#FEF3C7', emoji: '📚' },
  };
  const cat = catColorMap[problem.category] || { color: '#2563EB', bg: '#EFF6FF', emoji: '💡' };
  const impactMap = { 'High': { color: '#DC2626', bg: '#FEE2E2' }, 'Medium': { color: '#D97706', bg: '#FEF3C7' }, 'Low': { color: '#16A34A', bg: '#DCFCE7' } };
  const impact = impactMap[problem.impact] || impactMap['High'];

  const loc = problem.fullLocation || {
    village: 'Ground Zero Ward',
    block: 'Central Block',
    district: (problem.location || '').split(',')[0]?.trim() || 'Patna',
    state: (problem.location || '').split(',')[1]?.trim() || 'Bihar',
    pincode: '800001',
    coordinates: { lat: 25.5941, lng: 85.1376 }
  };
  const challengeId = problem.challengeId || problem.reportId || `JH-2026-${problem.id || 1001}`;
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

    // 2. Primary beforeImage
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
          <button className="pdm-close-btn" onClick={onClose}>
            <X size={18} />
          </button>

          <div className="pdm-badges-row">
            <span className="pdm-report-id-pill" onClick={() => setShowSlip(true)} title="Click to view official receipt slip" style={{ cursor: 'pointer' }}>
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
          </div>

          <h2 className="pdm-title">{problem.title}</h2>

          <div className="pdm-stakeholder-banner">
            <div className="pdm-submitter-profile">
              <div className="pdm-submitter-avatar">
                {(problem.submitterContact?.name || 'C')[0]}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {problem.submitterContact?.name || 'Verified Citizen Submitter'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button type="button" onClick={() => setChatModal(true)} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', background: '#EFF6FF', border: '1.5px solid #BFDBFE',
                  borderRadius: 8, fontSize: 11.5, fontWeight: 700, color: '#1D4ED8', cursor: 'pointer'
                }}>
                <MessageSquare size={14} color="#2563EB" /> Chat with Submitter
              </button>
            </div>
          </div>

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

                <div className="pdm-gallery-actions">
                  {allEvidencePhotos.length > 0 && (
                    <button type="button" className="pdm-gallery-btn" onClick={() => { setGalleryIndex(0); setGalleryOpen(true); }}>
                      <Camera size={15} />
                      <span>View Ground Images ({allEvidencePhotos.length}) →</span>
                    </button>
                  )}

                  {citizenVideoUrl ? (
                    <button type="button" className="pdm-video-btn pdm-video-btn-active" onClick={() => setVideoPlayerOpen(true)} title="Play ground video footage submitted by citizen">
                      <Play size={15} fill="#FFFFFF" />
                      <span>Play Ground Video</span>
                    </button>
                  ) : (
                    <div className="pdm-video-btn pdm-video-btn-disabled" title="No video uploaded by submitter or citizen">
                      <VideoOff size={15} />
                      <span>No video uploaded by submitter or citizen</span>
                    </div>
                  )}
                </div>
              </div>

              {allEvidencePhotos.length > 0 ? (
                <div className="pdm-gallery-thumbs-grid">
                  {allEvidencePhotos.map((p, i) => (
                    <div key={i} className="pdm-gallery-thumb-card" onClick={() => { setGalleryIndex(i); setGalleryOpen(true); }} title={`Inspect Photo ${i + 1} in Full Screen`}>
                      <div className="pdm-gallery-img-wrapper">
                        <img src={p.url} alt={`Evidence ${i + 1}`} className="pdm-gallery-thumb-img" onError={(e) => { e.target.style.display = 'none'; }} />
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
                  <a href={mapsUrl} target="_blank" rel="noreferrer" className="pdm-maps-link">
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

          {/* Academic Brief (Clean Structured Cards - No Text Overlap) */}
          <div className="pdm-section">
            <div className="pdm-academic-box">
              <h4 style={{ fontSize: 12.5, fontWeight: 800, color: '#1E40AF', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <FileText size={16} /> University Curriculum & Project Fit
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
                  onClick={() => onFork && onFork(problem)}
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

/* ────────────────────────────────────────────
   PROBLEM CARD (In Grid with Photo & Backers)
──────────────────────────────────────────── */
function ProblemCard({ p, onDetailClick, onStartProject }) {
  const [bookmarked, setBookmarked] = useState(p.bookmarked || false);
  const beforeImg = (p.beforeImage && !p.beforeImage.startsWith('/images/')) ? p.beforeImage : null;
  const challengeId = p.challengeId || p.reportId || `JH-2026-${p.id || 1001}`;
  const loc = p.fullLocation || {
    village: 'Ground Zero Ward',
    district: (p.location || '').split(',')[0]?.trim() || 'Patna'
  };

  const handleBookmark = async (e) => {
    e.stopPropagation();
    setBookmarked(!bookmarked);
    try {
      await fetch(`/api/problems/${p._id || p.id}/bookmark`, { method: 'PATCH' });
    } catch (e) {}
  };

  return (
    <div
      className="problem-card"
      onClick={() => onDetailClick(p)}
      style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
    >
      <div className="problem-card-top">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className={`category-badge ${p.catClass || ''}`}>
            <span className="category-dot" />
            {p.category}
          </span>
          <span className="bp-report-id-tag">
            #{challengeId}
          </span>
        </div>
        <button className="bookmark-btn" onClick={handleBookmark}>
          <Bookmark style={{ fill: bookmarked ? '#94A3B8' : 'none' }} />
        </button>
      </div>

      {/* Visual Evidence Banner - Only real citizen upload or clean no-photo slate */}
      {beforeImg ? (
        <div className="bp-card-image-wrap" onClick={(e) => { e.stopPropagation(); onDetailClick(p); }}>
          <img
            src={beforeImg}
            alt={p.title}
            className="bp-card-image"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <div className="bp-card-image-overlay">
            <div className="bp-card-image-top">
              <span className="bp-evidence-badge">
                <Camera size={11} /> Ground Evidence Attached
              </span>
            </div>
            <div className="bp-card-image-bottom">
              <span className="bp-card-loc-chip">
                <MapPin size={11} color="#EF4444" /> {loc.village || loc.district || p.location}
              </span>
              <span className={`impact-badge impact-${p.impact?.toLowerCase().split(' ')[0]}`}>{p.impact || 'High'}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bp-card-image-wrap bp-card-no-photo-wrap" onClick={(e) => { e.stopPropagation(); onDetailClick(p); }} style={{ height: 68, background: 'linear-gradient(135deg, #F8FAFC 0%, #EEF2F6 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 8, border: '1px solid #E2E8F0', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 9.5, fontWeight: 700, color: '#64748B', background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '2px 7px', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <CameraOff size={10} /> No Ground Photo Uploaded
            </span>
            <span className={`impact-badge impact-${p.impact?.toLowerCase().split(' ')[0]}`}>{p.impact || 'High'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#64748B' }}>
            <MapPin size={11} color="#94A3B8" />
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {loc.village || loc.district || p.location || 'India'}
            </span>
          </div>
        </div>
      )}

      {/* Submitter & Backers Row */}
      <div className="bp-card-submitter-row" style={{ marginTop: 8 }}>
        <span className="bp-card-submitter-name">
          <CheckCircle2 size={12} color="#16A34A" /> {p.submitterContact?.name || 'Citizen Report'}
        </span>
        <span className="bp-card-backers-count">
          <Users size={12} /> {p.supportCount || 24} Verified Backers
        </span>
      </div>

      <div className="problem-title" style={{ marginTop: 6 }}>{p.title}</div>

      {/* Civic Department & Ground Video Pill */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, flexWrap: 'wrap', margin: '4px 0 8px' }}>
        {p.department ? (
          <div className="bp-card-dept-tag" style={{ margin: 0 }}>
            🏛️ {p.department}
          </div>
        ) : <div />}
        {p.videoUrl ? (
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

      <div className="problem-desc">{p.description || p.desc}</div>

      <div className="problem-footer" style={{ marginTop: 'auto' }}>
        <div className="problem-footer-icon">
          <FileText />
        </div>
        <div className="problem-footer-text">
          <div className="problem-footer-label">{p.academicBrief?.projectType || p.brief || 'Capstone Project'}</div>
          <div className="problem-footer-sub">{p.academicBrief?.duration || p.project || '6-8 Months'}</div>
        </div>
      </div>

      {/* Action Row */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginTop: 12, paddingTop: 10, borderTop: '1px solid #F1F5F9'
      }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onStartProject(p);
          }}
          style={{
            background: '#0F172A', color: '#FFFFFF', border: 'none',
            borderRadius: 8, padding: '7px 14px', fontSize: 11, fontWeight: 700,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
            boxShadow: '0 2px 6px rgba(15,23,42,0.2)'
          }}
        >
          Start Project
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDetailClick(p);
          }}
          style={{
            background: 'none', border: 'none', color: '#2563EB',
            fontSize: 11, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 4
          }}
        >
          View Full Dossier <ArrowRight style={{ width: 12, height: 12 }} />
        </button>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   PROJECT PROGRESS TIMELINE
──────────────────────────────────────────── */
function ProgressTimeline({ currentStep }) {
  return (
    <div className="progress-timeline">
      <div className="timeline-steps">
        {TIMELINE_STEPS.map((step, i) => {
          const isDone = i < currentStep;
          const isActive = i === currentStep;
          return (
            <div className="timeline-step" key={step}>
              {i > 0 && (
                <div className="timeline-line" style={{
                  position: 'absolute',
                  top: 4,
                  left: '-50%',
                  right: '50%',
                  height: 2,
                  background: i <= currentStep ? '#22C55E' : '#E2E8F0',
                  zIndex: 1,
                }} />
              )}
              <div
                className={`timeline-step-dot ${isDone ? 'done' : isActive ? 'active' : ''}`}
                style={{ position: 'relative', zIndex: 2 }}
              />
              <div className={`timeline-step-label ${isDone ? 'done' : isActive ? 'active' : ''}`}>
                {step}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   ACTIVE PROJECT CARD
──────────────────────────────────────────── */
function ProjectCard({ proj }) {
  const navigate = useNavigate();
  const displayAvatars = (proj.team || []).slice(0, 3);
  const remaining = (proj.teamSize || 4) - displayAvatars.length;

  const avatarColors = [
    'linear-gradient(135deg, #6366F1, #8B5CF6)',
    'linear-gradient(135deg, #EC4899, #F43F5E)',
    'linear-gradient(135deg, #14B8A6, #06B6D4)',
    'linear-gradient(135deg, #F97316, #EF4444)',
    'linear-gradient(135deg, #22C55E, #16A34A)',
  ];

  const status = proj.stage || proj.status || 'In Progress';
  const statusLower = status.toLowerCase();
  const statusBadgeClass = statusLower.includes('progress')
    ? 'status-inprogress'
    : statusLower.includes('deploy')
    ? 'status-deployed'
    : statusLower.includes('proto')
    ? 'status-prototype'
    : 'status-assigned';

  return (
    <div className="project-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/my-projects')}>
      <div className="project-card-body">
        <div className="project-card-top">
          <div
            className="project-thumbnail-icon"
            style={{ background: proj.imgBg || 'linear-gradient(135deg, #2563EB, #1D4ED8)' }}
          >
            <FolderGit2 size={20} color="#FFFFFF" />
          </div>

          <div className="project-meta">
            <div className="project-title-row">
              <div className="project-title">{proj.title}</div>
              <span className={`project-status-pill ${statusBadgeClass}`}>
                <span className="status-dot-mini" />
                {status}
              </span>
            </div>

            <div className="project-team-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div className="team-avatars">
                  {displayAvatars.map((init, i) => (
                    <div key={i} className="team-avatar" style={{ background: avatarColors[i % avatarColors.length] }}>
                      {typeof init === 'string' ? init.split(' ').map(w => w[0]).join('').slice(0, 2) : 'U'}
                    </div>
                  ))}
                  {remaining > 0 && (
                    <div className="team-count-badge">+{remaining}</div>
                  )}
                </div>
                <span className="team-label">Team ({proj.teamSize || 4})</span>
              </div>

              <div className="mentor-info">
                <div className="mentor-avatar"
                  style={{ background: 'linear-gradient(135deg, #F97316, #EF4444)' }}>
                  {proj.mentor?.initials || 'RM'}
                </div>
                <div>
                  <div className="mentor-name">{proj.mentor?.name || 'Dr. Rohan Mehta'}</div>
                  <div className="mentor-org">{proj.mentor?.org || 'IIT Delhi'}</div>
                </div>
                <button
                  className="video-btn"
                  title="Join Mentor Session"
                  onClick={(e) => {
                    e.stopPropagation();
                    toast('Joining secure mentor video room...', 'success');
                    window.open('https://meet.google.com/new', '_blank');
                  }}
                >
                  <Video />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ProgressTimeline currentStep={proj.progress || 1} />
    </div>
  );
}

/* ────────────────────────────────────────────
   HOME PAGE
──────────────────────────────────────────── */
export default function HomePage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalProblems: 0, studentTeams: 0, projectsInProgress: 0, projectsDeployed: 0, needAttention: 0 });
  const [problems, setProblems] = useState([]);
  const [activeProjects, setActiveProjects] = useState([]);
  const [deployedProjects, setDeployedProjects] = useState([]);
  const [discipline, setDiscipline] = useState('All Disciplines');
  const [difficulty, setDifficulty] = useState('All Levels');
  const [duration, setDuration] = useState('All Durations');
  const [detailModal, setDetailModal] = useState(null);

  const [user, setUser] = useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem('is_user') || localStorage.getItem('user') || '{}');
      return u && u.name ? u : { name: 'Dr. Rajesh Sharma', institution: 'IIT Delhi' };
    } catch (e) {
      return { name: 'Dr. Rajesh Sharma', institution: 'IIT Delhi' };
    }
  });

  const historyTrackRef = useRef(null);
  const scrollHistory = (direction) => {
    if (historyTrackRef.current) {
      historyTrackRef.current.scrollBy({ left: direction * 224, behavior: 'smooth' });
    }
  };

  useEffect(() => {
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
          setUser(prev => ({ ...prev, ...data }));
        }
      })
      .catch(() => {});

    const handleProfileUpdate = (e) => {
      if (e.detail?.name) {
        setUser(prev => ({ ...prev, ...e.detail }));
      }
    };
    window.addEventListener('profile-update', handleProfileUpdate);

    fetch('/api/dashboard/stats').then(r => r.json()).then(data => {
      if (!data.error) setStats(data);
    }).catch(() => {});

    fetch('/api/problems').then(r => r.json()).then(data => {
      const list = Array.isArray(data) ? data : (data && Array.isArray(data.data) ? data.data : []);
      if (list.length > 0) setProblems(list.slice(0, 3));
    }).catch(() => {});

    fetch('/api/projects?status=In Progress').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setActiveProjects(data.slice(0, 3));
    }).catch(() => {});

    fetch('/api/projects?status=Deployed').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setDeployedProjects(data);
    }).catch(() => {});

    return () => window.removeEventListener('profile-update', handleProfileUpdate);
  }, []);

  const resetFilters = () => {
    setDiscipline('All Disciplines');
    setDifficulty('All Levels');
    setDuration('All Durations');
    toast('Filters reset', 'info');
  };

  const handleStartProject = async (p) => {
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemId: p._id || p.id,
          title: p.title,
          category: p.category,
          location: p.location
        })
      });
      const data = await res.json();
      if (data.success) {
        toast('Project Initiated! Stage: Assigned in My Projects.', 'success');
        setDetailModal(null);
        navigate('/my-projects');
      } else {
        toast(data.error || 'Failed to start project', 'error');
      }
    } catch (err) {
      toast('Error starting project', 'error');
    }
  };

  const handleFork = async (p) => {
    try {
      const res = await fetch(`/api/problems/${p._id || p.id}/fork`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast('Solution Forked! Initialized in My Projects.', 'success');
        setDetailModal(null);
        navigate('/my-projects');
      }
    } catch (e) {}
  };

  const filteredProblems = problems.filter(p => {
    if (discipline !== 'All Disciplines' && p.academicBrief?.discipline !== discipline) return false;
    if (difficulty === 'Beginner' && p.impact !== 'Low') return false;
    if (difficulty === 'Intermediate' && p.impact !== 'Medium') return false;
    if (difficulty === 'Advanced' && p.impact !== 'High') return false;
    return true;
  });

  const statsData = [
    { icon: FileText, color: 'blue', value: stats.totalProblems ?? problems.length, label: 'Total Problems', sub: 'Explore Now →', subClass: 'link', path: '/browse-problems' },
    { icon: Users, color: 'orange', value: stats.studentTeams ?? activeProjects.length, label: 'Student Teams', sub: 'From your university', subClass: '', path: '/team-mentorship' },
    { icon: CheckCircle, color: 'green', value: stats.projectsInProgress ?? activeProjects.length, label: 'Projects in Progress', sub: 'Active this semester', subClass: '', path: '/my-projects' },
    { icon: Trophy, color: 'amber', value: stats.projectsDeployed ?? deployedProjects.length, label: 'Projects Deployed', sub: 'Creating real impact', subClass: '', path: '/resources' },
    { icon: Clock, color: 'red', value: stats.needAttention ?? 0, label: 'Need Attention', sub: 'Require your review', subClass: 'red-text', path: '/notifications' },
  ];

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  });

  return (
    <div className="animate-in" style={{ minHeight: '100%' }}>

      {/* ── Hero Banner ── */}
      <div className="hero-banner">
        <div className="hero-flag-wave">
          <div className="f-s" />
          <div className="f-w" />
          <div className="f-g" />
        </div>

        <div className="hero-monuments">
          <MonumentsSVG />
        </div>

        <div className="hero-top-right">
          <div className="hero-date-chip">
            <Calendar />
            {dateStr}
          </div>
        </div>

        <div className="hero-content">
          <div className="hero-frosted-card">
            <div className="hero-subbadge">
              <span className="hero-subbadge-dot" />
              <span>National Civic Innovation Hub • {user.institution || user.organization || 'IIT Delhi'} Portal</span>
            </div>
            <div className="hero-greeting">
              Namaste, {user.name || 'Professor'}! <span className="hero-namaste-emoji">🙏</span>
            </div>
            <div className="hero-quote">
              <span className="hero-quote-marks">"</span>
              युवा सोच, भारत की शक्ति – नवाचार से विकास की भक्ति।
              <span className="hero-quote-marks">"</span>
            </div>
          </div>
        </div>

        <button className="hero-explore-btn" onClick={() => navigate('/browse-problems')}>
          <span style={{ fontSize: 16 }}>+</span> Explore Problems
        </button>
      </div>

      {/* ── National Innovation Pulse Ticker ── */}
      <div className="live-pulse-ticker">
        <div className="pulse-left">
          <div className="pulse-dot-wrap">
            <div className="pulse-dot" />
          </div>
          <span className="pulse-title">National Innovation Pulse</span>
          <span className="pulse-live-badge">LIVE</span>
        </div>
        <div className="pulse-stats-group">
          <div className="pulse-stat-chip pulse-stat-blue">
            <strong>{stats.studentTeams || activeProjects.length || 0}</strong> <span>Active Student Teams</span>
          </div>
          <span className="pulse-stat-divider">•</span>
          <div className="pulse-stat-chip pulse-stat-purple">
            <strong>{stats.totalProblems || problems.length || 0}</strong> <span>Civic Problems</span>
          </div>
          <span className="pulse-stat-divider">•</span>
          <div className="pulse-stat-chip pulse-stat-amber">
            <strong>{stats.projectsDeployed || deployedProjects.length || 0}</strong> <span>Civic Solutions Deployed</span>
          </div>
          <span className="pulse-stat-divider">•</span>
          <div className="pulse-stat-chip pulse-stat-green">
            <strong className="pulse-stat-funds">₹65 Lakhs</strong> <span>Committed CSR Funds</span>
          </div>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="stats-row">
        {statsData.map((s) => (
          <div className="stat-card" key={s.label} style={{ cursor: 'pointer' }} onClick={() => navigate(s.path)}>
            <div className={`stat-icon ${s.color}`}>
              <s.icon />
            </div>
            <div className="stat-info">
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
              <div className={`stat-sub ${s.subClass}`}>{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Page Body ── */}
      <div className="page-body">

        {/* ─── LEFT COLUMN: Browse Problems ─── */}
        <div className="page-left">

          <div className="section-header">
            <div>
              <div className="section-title">Browse Problems</div>
              <div className="section-subtitle">
                Explore government and industry problem statements for student projects
              </div>
            </div>
            <Link to="/browse-problems" className="view-all-link">
              View All <ArrowRight />
            </Link>
          </div>

          {/* Filters */}
          <div className="filters-bar">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span className="filter-label">Discipline</span>
              <select className="filter-select" value={discipline} onChange={e => setDiscipline(e.target.value)}>
                <option>All Disciplines</option>
                <option>Computer Science</option>
                <option>Electronics & IoT</option>
                <option>Civil Engineering</option>
                <option>Environmental Science</option>
                <option>Healthcare</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span className="filter-label">Difficulty Level</span>
              <select className="filter-select" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                <option>All Levels</option>
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span className="filter-label">Project Duration</span>
              <select className="filter-select" value={duration} onChange={e => setDuration(e.target.value)}>
                <option>All Durations</option>
                <option>1-3 Months</option>
                <option>3-6 Months</option>
                <option>6+ Months</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span className="filter-label">&nbsp;</span>
              <button className="reset-filters-btn" onClick={resetFilters}>
                <RotateCcw style={{ width: 11, height: 11 }} />
                Reset Filters
              </button>
            </div>
          </div>

          {/* Problems grid - 3 Latest Recent Problems */}
          <div className="problems-grid">
            {filteredProblems.length > 0 ? filteredProblems.slice(0, 3).map((p) => (
              <ProblemCard
                key={p._id || p.id}
                p={p}
                onDetailClick={(prob) => navigate(`/browse-problems?problemId=${prob._id || prob.id || prob.challengeId}`)}
                onStartProject={handleStartProject}
              />
            )) : <div style={{ padding: 20, color: '#64748B' }}>No problems match current filters.</div>}
          </div>

          {/* ── My Recent Deployed History (Horizontal Citizen-style Card Carousel) ── */}
          <div className="home-history-section" style={{ marginTop: 28, marginBottom: 12 }}>
            <div className="section-header-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 className="section-header-title" style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.3px', margin: 0 }}>
                  My Recent Deployed History
                </h3>
                <span style={{ fontSize: 10.5, fontWeight: 800, background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC', padding: '2px 8px', borderRadius: 20 }}>
                  {deployedProjects.length} Live Civic Deployments
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="recent-scroll-btns">
                  <button type="button" className="scroll-arrow-btn" onClick={() => scrollHistory(-1)} title="Scroll Left" aria-label="Previous">❮</button>
                  <button type="button" className="scroll-arrow-btn" onClick={() => scrollHistory(1)} title="Scroll Right" aria-label="Next">❯</button>
                </div>
                <Link to="/my-projects?tab=history" className="btn-view-all-link" style={{ textDecoration: 'none' }}>
                  View All History →
                </Link>
              </div>
            </div>

            <div className="recent-reports-container-card">
              <div ref={historyTrackRef} className="recent-reports-scroll-track">
                {deployedProjects.length > 0 ? deployedProjects.map((dp) => (
                  <div
                    key={dp._id || dp.id}
                    className="report-square-card"
                    onClick={() => navigate(`/my-projects?tab=history&projectId=${dp._id || dp.id}`)}
                    title={dp.title}
                  >
                    <div className="square-thumb-wrapper">
                      <img
                        src={dp.image || '/university/flood_alert_success.jpg'}
                        className="square-thumb-img"
                        alt={dp.title}
                        onError={(e) => { e.target.src = '/university/flood_alert_success.jpg'; }}
                      />
                      <span className="square-status-badge status-solved">Deployed</span>
                    </div>
                    <div className="square-card-body">
                      <div className="square-card-title">{dp.title}</div>
                      <div className="square-card-loc">📍 {dp.loc || 'Jharkhand'}</div>
                      <div className="square-card-footer">
                        <span className="square-card-id">{dp.codeId || `JH-2026-DEPLOY-${String(dp._id || dp.id).slice(-3)}`}</span>
                        <span className="square-card-time">{dp.timeAgo || 'Deployed'}</span>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div style={{ padding: '16px', color: '#64748B', fontSize: 12 }}>
                    Loading deployed solutions...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ─── RIGHT COLUMN ─── */}
        <div className="page-right">

          {/* ── Faculty Quick Actions ── */}
          <div style={{ marginBottom: 20 }}>
            <div className="section-header" style={{ marginBottom: 10 }}>
              <div className="section-title" style={{ fontSize: 15 }}>Quick Actions</div>
            </div>
            <div className="quick-launch-grid">
              <div className="quick-launch-btn" onClick={() => navigate('/browse-problems')}>
                <div className="ql-icon-wrap" style={{ background: '#EFF6FF', color: '#2563EB' }}>
                  <Compass size={16} />
                </div>
                <div>
                  <div className="ql-label">Browse Problems</div>
                  <div className="ql-sub">124 Civic Tasks</div>
                </div>
              </div>
              <div className="quick-launch-btn" onClick={() => navigate('/team-mentorship')}>
                <div className="ql-icon-wrap" style={{ background: '#FEF3C7', color: '#D97706' }}>
                  <Users size={16} />
                </div>
                <div>
                  <div className="ql-label">Student Teams</div>
                  <div className="ql-sub">Manage & Mentor</div>
                </div>
              </div>
              <div className="quick-launch-btn" onClick={() => navigate('/my-projects')}>
                <div className="ql-icon-wrap" style={{ background: '#DCFCE7', color: '#16A34A' }}>
                  <Zap size={16} />
                </div>
                <div>
                  <div className="ql-label">Active Projects</div>
                  <div className="ql-sub">Verify Milestones</div>
                </div>
              </div>
              <div className="quick-launch-btn" onClick={() => navigate('/resources')}>
                <div className="ql-icon-wrap" style={{ background: '#F3E8FF', color: '#7E22CE' }}>
                  <Layers size={16} />
                </div>
                <div>
                  <div className="ql-label">Proven Solutions</div>
                  <div className="ql-sub">Battle-Tested</div>
                </div>
              </div>
            </div>
          </div>

          {/* My Active Projects */}
          <div style={{ marginBottom: 20 }}>
            <div className="section-header" style={{ marginBottom: 12 }}>
              <div className="section-title">My Active Projects</div>
              <Link to="/my-projects" className="view-all-link">
                View All <ArrowRight />
              </Link>
            </div>
            {activeProjects.length > 0 ? activeProjects.map((proj) => (
              <ProjectCard key={proj._id || proj.id} proj={proj} />
            )) : <div style={{ padding: '20px 0', color: '#64748B' }}>No active projects found.</div>}
          </div>
        </div>
      </div>

      {/* Problem Detail Modal Overlay (Card in front) */}
      {detailModal && (
        <ProblemDetailModal
          problem={detailModal}
          onClose={() => setDetailModal(null)}
          onStartProject={handleStartProject}
          onFork={handleFork}
        />
      )}


      {/* ── Footer Strip ── */}
      <div className="footer-strip">
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
