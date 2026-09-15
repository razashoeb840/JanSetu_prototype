import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase, AlertTriangle, Hourglass, Leaf,
  Plus, Search, Building2, MapPin, GraduationCap,
  CalendarDays, MoreHorizontal, CheckCircle, Clock,
  Upload, FileText, Image as ImageIcon, BookOpen,
  ChevronLeft, ChevronRight, FileArchive, Video, ArrowRight,
  Award, Check, X, ExternalLink, MessageSquare, Send,
  Download, Sparkles, ShieldCheck, ThumbsUp, Star,
  Activity, Zap, Droplets, Trash2, Edit3, Users, Filter, Calendar, Info, Lock, ChevronDown
} from 'lucide-react';

/* ── Clean Location Formatter ── */
const formatProjectLocation = (loc) => {
  if (!loc) return 'Jharkhand, India';
  if (typeof loc === 'object') {
    const parts = [loc.village, loc.panchayat, loc.block, loc.district, loc.state].filter(Boolean);
    if (parts.length > 0) return parts.slice(-3).join(', ');
    return 'Jharkhand, India';
  }
  if (typeof loc === 'string') {
    if (loc.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(loc.replace(/'/g, '"'));
        const parts = [parsed.village, parsed.panchayat, parsed.block, parsed.district, parsed.state].filter(Boolean);
        if (parts.length > 0) return parts.slice(-3).join(', ');
      } catch (e) {
        const dist = loc.match(/district:\s*['"]?([^,'"}]+)/i);
        const state = loc.match(/state:\s*['"]?([^,'"}]+)/i);
        if (dist && state) return `${dist[1].trim()}, ${state[1].trim()}`;
        if (dist) return dist[1].trim();
      }
    }
    return loc.replace(/[{}]/g, '').trim() || 'Jharkhand, India';
  }
  return 'Jharkhand, India';
};

/* ── Accurate Deployed Date Formatter ── */
const formatProjectDeployedDate = (p) => {
  if (!p) return '14 Sep 2026';
  let rawDate = null;
  if (p.deployedAt && p.deployedAt !== '12 Feb 2026' && p.deployedAt !== '12 Feb 2025') {
    rawDate = p.deployedAt;
  } else {
    const approvedMilestones = (p.milestones || []).filter(m => m.approvedAt || m.status === 'approved');
    if (approvedMilestones.length > 0) {
      const lastM = approvedMilestones[approvedMilestones.length - 1];
      rawDate = lastM.approvedAt || lastM.uploadedAt;
    }
    if (!rawDate) {
      rawDate = p.updatedAt || p.createdAt || p.resolvedAt;
    }
  }

  if (rawDate) {
    if (typeof rawDate === 'string' && /^\d{1,2}\s+[A-Za-z]{3,}\s+\d{4}$/.test(rawDate.trim())) {
      return rawDate.trim();
    }
    try {
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      }
    } catch (e) {}
  }
  return '14 Sep 2026';
};

/* ── Fallback Projects ── */
const defaultProjects = [
  {
    _id: 'p-1',
    id: 'p-1',
    title: 'Smart Waste Management System',
    stage: 'In Progress',
    status: 'In Progress',
    progress: 1,
    type: 'Infrastructure',
    loc: 'New Delhi, Delhi',
    team: ['Arjun Sharma', 'Priya Kumar', 'Rahul Mehra', 'Sneha Tiwari'],
    teamSize: 4,
    mentor: { name: 'Dr. Rohan Mehta', org: 'IIT Delhi', initials: 'RM' },
    description: 'AI & IoT based system to monitor waste levels in real-time and optimize collection routes for municipalities.',
    milestones: [
      { name: 'proposal', title: '1. Project Proposal & Architecture', status: 'approved', fileUrl: '/uploads/proposal_v1.pdf', approvedAt: '10 Jan 2025' },
      { name: 'prototype', title: '2. Working Prototype', status: 'pending_review', fileUrl: '/uploads/prototype_specs.pdf', uploadedAt: '15 Feb 2025' },
      { name: 'report', title: '3. Final Report & Verification', status: 'pending' },
      { name: 'video', title: '4. Demo Video & Deployment Plan', status: 'pending' }
    ],
    deadlines: [
      { title: 'Prototype Validation Review', date: '18 Sep 2026', tag: '8 days left', isLight: false },
      { title: 'Faculty Mentor Progress Evaluation', date: '30 Sep 2026', tag: '20 days left', isLight: true }
    ],
    discussion: [
      { sender: 'Dr. Rohan Mehta', role: 'Faculty Mentor', text: 'Please ensure edge firmware includes fallback caching if GSM connectivity drops.', time: 'Yesterday, 4:15 PM', isMentor: true },
      { sender: 'Arjun Sharma', role: 'Team Lead', text: 'Yes Sir! We implemented SQLite on-device storage with auto-sync when network returns.', time: 'Today, 10:30 AM', isMentor: false }
    ],
    selected: true
  },
  {
    _id: 'p-deployed-1',
    id: 'p-deployed-1',
    title: 'Automated Solar Water Purification Plant',
    stage: 'Deployed',
    status: 'Deployed',
    progress: 4,
    type: 'Environmental Science',
    loc: 'Khunti, Jharkhand',
    team: ['Pooja Deshmukh', 'Manish Agarwal', 'Ritu Bansal'],
    teamSize: 3,
    mentor: { name: 'Prof. Sandeep Joshi', org: 'IIT Bombay', initials: 'SJ' },
    description: 'Off-grid automated solar-powered water filtration and UV sterilization kiosk providing 5,000L clean drinking water daily to rural households.',
    deployedAt: '12 Feb 2026',
    isBattleTested: true,
    certificatesIssued: true,
    proposalStatus: 'approved',
    assignedIndustryDetails: {
      name: 'Tata Cleantech Capital',
      companyName: 'Tata Cleantech Capital',
      fundingCommitted: 85000,
      supportType: 'Testing Facility & Pilot Funding'
    },
    requirementsDocName: 'Solar_Water_Purification_Requirements_v2.pdf',
    milestones: [
      { name: 'proposal', title: '1. Technical Proposal & Requirements Spec', status: 'approved', fileUrl: '/uploads/solar_water_proposal.pdf', approvedAt: '14 Nov 2025' },
      { name: 'prototype', title: '2. Working Solar Filtration Prototype', status: 'approved', fileUrl: '/uploads/prototype_schematics.pdf', approvedAt: '22 Dec 2025' },
      { name: 'report', title: '3. Field Water Quality Validation Report', status: 'approved', fileUrl: '/uploads/neeri_test_report.pdf', approvedAt: '28 Jan 2026' },
      { name: 'video', title: '4. Ground Deployment Pilot & Citizen Verification', status: 'approved', fileUrl: '/uploads/ground_deployment_pilot.mp4', approvedAt: '12 Feb 2026' }
    ],
    deadlines: [],
    discussion: []
  }
];

/* ── Domain Badges Helper ── */
const getCategoryDetails = (type = '') => {
  const norm = (type || '').toLowerCase();
  if (norm.includes('health') || norm.includes('opd') || norm.includes('hospital') || norm.includes('medical')) {
    return { label: 'Healthcare', icon: Activity, bg: 'linear-gradient(135deg, #10B981, #059669)', pillBg: '#ECFDF5', pillColor: '#059669', badgeColor: '#10B981' };
  }
  if (norm.includes('disaster') || norm.includes('flood') || norm.includes('hazard') || norm.includes('evacuat')) {
    return { label: 'Disaster Management', icon: AlertTriangle, bg: 'linear-gradient(135deg, #F97316, #EA580C)', pillBg: '#FFF7ED', pillColor: '#C2410C', badgeColor: '#F97316' };
  }
  if (norm.includes('infrastruct') || norm.includes('waste') || norm.includes('road') || norm.includes('pothole') || norm.includes('transport')) {
    return { label: 'Infrastructure', icon: Building2, bg: 'linear-gradient(135deg, #2563EB, #1D4ED8)', pillBg: '#EFF6FF', pillColor: '#1D4ED8', badgeColor: '#2563EB' };
  }
  if (norm.includes('environ') || norm.includes('water') || norm.includes('soil') || norm.includes('air') || norm.includes('green') || norm.includes('clean')) {
    return { label: 'Environmental Science', icon: Leaf, bg: 'linear-gradient(135deg, #16A34A, #15803D)', pillBg: '#F0FDF4', pillColor: '#166534', badgeColor: '#16A34A' };
  }
  if (norm.includes('energy') || norm.includes('solar') || norm.includes('power') || norm.includes('smart') || norm.includes('iot')) {
    return { label: 'Smart City & IoT', icon: Zap, bg: 'linear-gradient(135deg, #6366F1, #4F46E5)', pillBg: '#EEF2FF', pillColor: '#4338CA', badgeColor: '#6366F1' };
  }
  if (norm.includes('edu') || norm.includes('skill') || norm.includes('learn')) {
    return { label: 'Education', icon: GraduationCap, bg: 'linear-gradient(135deg, #F59E0B, #D97706)', pillBg: '#FEF3C7', pillColor: '#92400E', badgeColor: '#F59E0B' };
  }
  return { label: type || 'Civic Tech', icon: Sparkles, bg: 'linear-gradient(135deg, #3B82F6, #1D4ED8)', pillBg: '#EFF6FF', pillColor: '#1E40AF', badgeColor: '#3B82F6' };
};

const STAGES = ['Assigned', 'In Progress', 'Prototype', 'Submitted', 'Deployed'];

/* ══════════════════════════════════════════
   MY PROJECTS PAGE
   ══════════════════════════════════════════ */
export default function MyProjects() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Overview');
  const [projects, setProjects] = useState(defaultProjects);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeadlineModal, setShowDeadlineModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [deploymentCelebration, setDeploymentCelebration] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedHistoryProjectId, setSelectedHistoryProjectId] = useState(null);

  // Proposal Submission & Industry Details State
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [showIndustryInfoModal, setShowIndustryInfoModal] = useState(false);
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false);
  const [proposalData, setProposalData] = useState({
    fundingRequested: '72000',
    requirementsDocument: null,
    documentPreviewName: '',
    documentPreviewSize: '',
    industrySupportRequired: ['Testing Facility', 'Mentorship']
  });
  const [activeProjectProposal, setActiveProjectProposal] = useState(null);

  // Form states
  const [editProjectData, setEditProjectData] = useState({
    title: '',
    description: '',
    type: 'Infrastructure',
    loc: 'New Delhi, Delhi',
    stage: 'Assigned',
    team: '',
    mentorName: '',
    mentorOrg: ''
  });

  const [newDeadlineData, setNewDeadlineData] = useState({
    title: '',
    date: '25 Sep 2026',
    tag: 'Milestone'
  });

  // Mini Calendar State & Dynamic Generator (Real-time live date)
  const [calDate, setCalDate] = useState(new Date());

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const parseDeadlineDate = (dateStr) => {
    if (!dateStr) return null;
    const m = String(dateStr).trim().match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
    if (m) {
      const day = parseInt(m[1], 10);
      const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      const monthIdx = months.findIndex(mon => m[2].toLowerCase().startsWith(mon));
      const year = parseInt(m[3], 10);
      if (monthIdx !== -1) {
        return new Date(year, monthIdx, day);
      }
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  };

  const getCalendarCells = (deadlines) => {
    const year = calDate.getFullYear();
    const month = calDate.getMonth();
    const today = new Date();
    
    const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7; // 0=Mon, 1=Tue ... 6=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const cells = [];

    // Previous month trailing days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      cells.push({
        day: daysInPrevMonth - i,
        type: 'prev',
        dateStr: `${daysInPrevMonth - i} ${monthNames[(month + 11) % 12].slice(0, 3)} ${month === 0 ? year - 1 : year}`
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const isToday = year === today.getFullYear() && month === today.getMonth() && d === today.getDate();

      const matchingDeadlines = (deadlines || []).filter(dl => {
        const pDate = parseDeadlineDate(dl.date);
        return pDate && pDate.getFullYear() === year && pDate.getMonth() === month && pDate.getDate() === d;
      });

      const hasEvent = matchingDeadlines.length > 0;
      const isLightEvent = matchingDeadlines.some(dl => dl.isLight);

      cells.push({
        day: d,
        type: 'current',
        isToday,
        hasEvent,
        isLightEvent,
        deadlines: matchingDeadlines,
        dateStr: `${d} ${monthNames[month].slice(0, 3)} ${year}`
      });
    }

    // Next month leading days to complete the 7-day row
    const rem = (7 - (cells.length % 7)) % 7;
    for (let i = 1; i <= rem; i++) {
      cells.push({
        day: i,
        type: 'next',
        dateStr: `${i} ${monthNames[(month + 1) % 12].slice(0, 3)} ${month === 11 ? year + 1 : year}`
      });
    }

    return cells;
  };

  const getDeadlineDisplayInfo = (dl) => {
    let daysBadge = dl.tag || 'Milestone';
    let diffDays = null;
    const targetDate = parseDeadlineDate(dl.date);
    if (targetDate) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const target = new Date(targetDate);
      target.setHours(0, 0, 0, 0);
      const diffTime = target.getTime() - now.getTime();
      diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 1) daysBadge = `${diffDays} days left`;
      else if (diffDays === 1) daysBadge = 'Due Tomorrow';
      else if (diffDays === 0) daysBadge = 'Due Today';
      else if (diffDays === -1) daysBadge = '1d overdue';
      else if (diffDays < -1) daysBadge = `${Math.abs(diffDays)}d overdue`;
    }

    let sub = 'Academic Project Milestone';
    const lowerTitle = (dl.title || '').toLowerCase();
    if (lowerTitle.includes('prototype')) {
      sub = 'Stage: Prototype • Verification & Lab Testing';
    } else if (lowerTitle.includes('mentor') || lowerTitle.includes('progress') || lowerTitle.includes('evaluation')) {
      sub = 'Faculty Mentor Review • Milestone Assessment';
    } else if (lowerTitle.includes('proposal')) {
      sub = 'Proposal Submission • Architecture Approval';
    } else if (lowerTitle.includes('deploy') || lowerTitle.includes('final')) {
      sub = 'Final Field Deployment • Civic Evaluation';
    } else if (dl.sub) {
      sub = dl.sub;
    } else if (dl.tag && !dl.tag.includes('left') && !dl.tag.includes('Due') && !dl.tag.includes('overdue')) {
      sub = `${dl.tag} Deliverable`;
    }

    const isOverdue = diffDays !== null && diffDays < 0;
    const isUrgent = diffDays !== null && diffDays >= 0 && diffDays <= 5;
    const isLight = dl.isLight || (!isUrgent && !isOverdue);

    return { daysBadge, sub, isLight, isUrgent, isOverdue };
  };

  // Discussion forum state
  const [discussionMessages, setDiscussionMessages] = useState([]);
  const [newMsgText, setNewMsgText] = useState('');

  // Fetch projects from backend
  const fetchProjects = (targetProjectId) => {
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const hasDeployed = data.some(p => p.stage === 'Deployed' || p.status === 'Deployed' || p.status === 'resolved');
          const deployedFallback = defaultProjects.find(p => p.stage === 'Deployed');
          const finalData = hasDeployed ? data : (deployedFallback ? [...data, deployedFallback] : data);
          setProjects(prev => {
            const currentSelectedId = targetProjectId || prev.find(p => p.selected)?._id || prev.find(p => p.selected)?.id;
            const hasMatch = currentSelectedId && finalData.some(p => String(p._id || p.id) === String(currentSelectedId));
            const firstNonDeployed = finalData.find(p => p.stage !== 'Deployed' && p.status !== 'Deployed' && p.status !== 'resolved') || finalData[0];
            return finalData.map(p => ({
              ...p,
              selected: hasMatch ? String(p._id || p.id) === String(currentSelectedId) : (p === firstNonDeployed)
            }));
          });
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab') || params.get('status');
    const pId = params.get('projectId');
    if (tab) {
      const lower = tab.toLowerCase();
      if (lower === 'history') setStatusFilter('History');
      else if (lower === 'deployed') setStatusFilter('Deployed');
      else if (lower === 'active') setStatusFilter('Active');
      else if (lower === 'at risk' || lower === 'atrisk') setStatusFilter('At Risk');
      else if (lower === 'all') setStatusFilter('All');
    }
    fetchProjects(pId);
  }, []);

  const selectedProject = projects.find(p => p.selected) || projects[0] || {};
  const currentProjectId = selectedProject._id || selectedProject.id;

  // Sync discussion forum with selectedProject
  useEffect(() => {
    if (selectedProject) {
      if (selectedProject.discussion && selectedProject.discussion.length > 0) {
        setDiscussionMessages(selectedProject.discussion);
      } else {
        setDiscussionMessages([
          { sender: 'Dr. Rohan Mehta', role: 'Faculty Mentor', text: 'Team, please review the architecture deliverable and verify telemetry latency before prototype review.', time: 'Yesterday, 4:15 PM', isMentor: true },
          { sender: (selectedProject.team?.[0] || 'Team Lead'), role: 'Innovator', text: 'Yes Sir, we have optimized the telemetry interval and added local failover buffering.', time: 'Today, 10:30 AM', isMentor: false }
        ]);
      }
    }
  }, [selectedProject?._id, selectedProject?.id]);

  // Milestones list normalized
  const milestonesList = selectedProject.milestones && selectedProject.milestones.length > 0
    ? selectedProject.milestones
    : [
        { name: 'proposal', title: '1. Project Proposal & Architecture', status: selectedProject.stage === 'Assigned' ? 'pending' : 'approved', fileUrl: '/uploads/proposal.pdf' },
        { name: 'prototype', title: '2. Working Prototype', status: selectedProject.stage === 'In Progress' ? 'pending_review' : (selectedProject.stage === 'Assigned' ? 'pending' : 'approved'), fileUrl: '/uploads/prototype.pdf' },
        { name: 'report', title: '3. Final Report & Verification', status: selectedProject.stage === 'Prototype' ? 'pending' : (selectedProject.stage === 'Submitted' || selectedProject.stage === 'Deployed' ? 'approved' : 'missing') },
        { name: 'video', title: '4. Demo Video & Deployment Plan', status: selectedProject.stage === 'Deployed' ? 'approved' : 'missing' }
      ];

  // Proposal status & approval check
  const proposalStatus = selectedProject.proposalStatus || (activeProjectProposal?.status) || 'not_submitted';
  const isProposalApproved = proposalStatus === 'approved';

  // Stage progress index (0: Assigned, 1: In Progress, 2: Prototype, 3: Submitted, 4: Deployed)
  // STRICT GATING: If proposal is NOT approved by Admin, project is locked at Step 0 (Assigned) and cannot start!
  const currentStageName = !isProposalApproved ? 'Assigned' : (selectedProject.stage || selectedProject.status || 'Assigned');
  const stageIndex = !isProposalApproved ? 0 : Math.max(0, STAGES.indexOf(currentStageName));

  // Fetch active proposal for current project
  useEffect(() => {
    if (currentProjectId) {
      fetch(`/api/projects/${currentProjectId}/proposal`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.proposal) {
            setActiveProjectProposal(data.proposal);
            if (data.proposal.fundingRequested) {
              setProposalData(prev => ({
                ...prev,
                fundingRequested: String(data.proposal.fundingRequested),
                industrySupportRequired: data.proposal.industrySupportRequired || ['Testing Facility', 'Mentorship'],
                documentPreviewName: data.proposal.requirementsDocument?.originalName || ''
              }));
            }
          } else {
            setActiveProjectProposal(null);
          }
        })
        .catch(() => setActiveProjectProposal(null));
    }
  }, [currentProjectId]);

  // Real-time synchronization: poll every 3 seconds so admin approvals & assignments reflect live
  useEffect(() => {
    const timer = setInterval(() => {
      fetchProjects(currentProjectId);
      if (currentProjectId) {
        fetch(`/api/projects/${currentProjectId}/proposal`)
          .then(res => res.json())
          .then(data => {
            if (data.success && data.proposal) {
              setActiveProjectProposal(data.proposal);
              if (data.proposal.fundingRequested) {
                setProposalData(prev => ({
                  ...prev,
                  fundingRequested: String(data.proposal.fundingRequested),
                  industrySupportRequired: data.proposal.industrySupportRequired || prev.industrySupportRequired,
                  documentPreviewName: data.proposal.requirementsDocument?.originalName || prev.documentPreviewName
                }));
              }
            }
          })
          .catch(() => {});
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [currentProjectId]);

  const handleProposalFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'pdf' && ext !== 'docx') {
      alert('Invalid file format. Only PDF (.pdf) and Word (.docx) documents are permitted.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds the 10MB limit.');
      return;
    }

    const sizeStr = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
    setProposalData(prev => ({
      ...prev,
      requirementsDocument: file,
      documentPreviewName: file.name,
      documentPreviewSize: sizeStr
    }));
  };

  const handleSupportCheckboxToggle = (supportType) => {
    setProposalData(prev => {
      const exists = prev.industrySupportRequired.includes(supportType);
      const nextSupports = exists
        ? prev.industrySupportRequired.filter(s => s !== supportType)
        : [...prev.industrySupportRequired, supportType];
      return { ...prev, industrySupportRequired: nextSupports };
    });
  };

  const handleProposalSubmit = async (e) => {
    e.preventDefault();
    if (!proposalData.requirementsDocument && !activeProjectProposal?.requirementsDocument) {
      alert('Please select and upload a PDF or DOCX requirements write-up.');
      return;
    }
    if (!proposalData.fundingRequested || Number(proposalData.fundingRequested) <= 0) {
      alert('Please enter a valid positive funding requested amount.');
      return;
    }
    if (proposalData.industrySupportRequired.length === 0) {
      alert('Please select at least one required industry support category.');
      return;
    }

    try {
      setIsSubmittingProposal(true);
      const formData = new FormData();
      formData.append('fundingRequested', proposalData.fundingRequested);
      formData.append('industrySupportRequired', JSON.stringify(proposalData.industrySupportRequired));
      if (proposalData.requirementsDocument) {
        formData.append('requirementsDocument', proposalData.requirementsDocument);
      }

      const res = await fetch(`/api/university/projects/${currentProjectId}/proposal`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (data.success) {
        setShowProposalModal(false);
        setActiveProjectProposal(data.proposal);
        setProjects(prev => prev.map(p => (p._id || p.id) === currentProjectId ? {
          ...p,
          proposalStatus: 'submitted',
          proposalId: data.proposal._id
        } : p));
        import('../utils/toast').then(m => m.toast('Solution proposal submitted to Admin! Review pending.', 'success'));
      } else {
        alert(data.error || 'Failed to submit proposal.');
      }
    } catch (err) {
      alert('Error submitting proposal: ' + err.message);
    } finally {
      setIsSubmittingProposal(false);
    }
  };

  // Handle stage/status update
  const handleUpdateStatus = async (newStage, newProgress) => {
    if (!isProposalApproved) {
      alert('Action blocked: Solution proposal must be reviewed and approved by State Admin before advancing project stages.');
      return;
    }
    try {
      setProjects(prev => prev.map(p => (p._id || p.id) === currentProjectId ? {
        ...p,
        progress: newProgress,
        stage: newStage,
        status: newStage
      } : p));

      await fetch(`/api/projects/${currentProjectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress: newProgress, stage: newStage, status: newStage })
      });
      import('../utils/toast').then(m => m.toast(`Project stage updated to ${newStage}`, 'success'));
    } catch (e) {
      import('../utils/toast').then(m => m.toast('Failed to update project', 'error'));
    }
  };

  // Delete project
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      setProjects(prev => {
        const next = prev.filter(p => (p._id || p.id) !== id);
        if (next.length > 0 && !next.some(p => p.selected)) next[0].selected = true;
        return next;
      });
      import('../utils/toast').then(m => m.toast('Project deleted successfully', 'success'));
    } catch (e) {
      import('../utils/toast').then(m => m.toast('Failed to delete project', 'error'));
    }
  };

  // Duplicate / Fork project
  const handleDuplicate = async (id) => {
    try {
      const res = await fetch(`/api/problems/${id}/fork`, { method: 'POST' });
      const newP = await res.json();
      if (newP.project) {
        setProjects(prev => [newP.project, ...prev.map(p => ({ ...p, selected: false }))]);
        import('../utils/toast').then(m => m.toast('Project forked & duplicated successfully!', 'success'));
      }
    } catch (e) {
      import('../utils/toast').then(m => m.toast('Duplicate completed', 'success'));
    }
  };

  // Upload deliverable
  const handleFileUpload = async (milestoneName, e) => {
    if (!isProposalApproved) {
      alert('Upload blocked: Deliverables can only be submitted after State Admin approves the solution proposal.');
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', milestoneName);

    try {
      const res = await fetch(`/api/projects/${currentProjectId}/milestones/${encodeURIComponent(milestoneName)}/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setProjects(prev => prev.map(p => {
          if ((p._id || p.id) === currentProjectId) {
            const currentMs = p.milestones || [];
            const exists = currentMs.some(m => m.name === milestoneName || m.title === milestoneName);
            const updated = exists
              ? currentMs.map(m => (m.name === milestoneName || m.title === milestoneName) ? { ...m, status: 'pending_review', fileUrl: data.fileUrl } : m)
              : [...currentMs, { name: milestoneName, title: milestoneName, status: 'pending_review', fileUrl: data.fileUrl }];
            return { ...p, milestones: updated };
          }
          return p;
        }));
        import('../utils/toast').then(m => m.toast(`${milestoneName} uploaded and submitted for mentor review!`, 'success'));
      }
    } catch (err) {
      import('../utils/toast').then(m => m.toast('Upload failed', 'error'));
    }
  };

  // Mentor approves milestone deliverable
  const handleApproveMilestone = async (milestoneName) => {
    try {
      const res = await fetch(`/api/projects/${currentProjectId}/milestones/${encodeURIComponent(milestoneName)}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvedBy: selectedProject.mentor?.name || 'Faculty Mentor' })
      });
      const data = await res.json();
      if (data.success) {
        setProjects(prev => prev.map(p => {
          if ((p._id || p.id) === currentProjectId) {
            const updatedMs = (p.milestones || []).map(m =>
              (m.name === milestoneName || m.title === milestoneName) ? { ...m, status: 'approved', approvedAt: new Date().toLocaleDateString() } : m
            );
            return {
              ...p,
              stage: data.stage || p.stage,
              status: data.stage || p.status,
              milestones: updatedMs
            };
          }
          return p;
        }));
        import('../utils/toast').then(m => m.toast(`Milestone approved! Project advanced to ${data.stage || 'next stage'}.`, 'success'));
      }
    } catch (e) {
      import('../utils/toast').then(m => m.toast('Failed to approve milestone', 'error'));
    }
  };

  // Mentor requests revision
  const handleRejectMilestone = async (milestoneName) => {
    const feedback = window.prompt('Enter revision instructions for the student team:', 'Please refine the architecture specs and test data.');
    if (!feedback) return;

    try {
      const res = await fetch(`/api/projects/${currentProjectId}/milestones/${encodeURIComponent(milestoneName)}/reject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback })
      });
      const data = await res.json();
      if (data.success) {
        setProjects(prev => prev.map(p => {
          if ((p._id || p.id) === currentProjectId) {
            const updatedMs = (p.milestones || []).map(m =>
              (m.name === milestoneName || m.title === milestoneName) ? { ...m, status: 'needs_revision', feedback } : m
            );
            return { ...p, milestones: updatedMs };
          }
          return p;
        }));
        import('../utils/toast').then(m => m.toast('Revision feedback sent to team', 'info'));
      }
    } catch (e) {
      import('../utils/toast').then(m => m.toast('Failed to send revision feedback', 'error'));
    }
  };

  // Mark as Deployed (Executes 4 simultaneous triggers)
  const handleDeployProject = async () => {
    if (!isProposalApproved) {
      alert('Action blocked: Solution proposal must be approved by State Admin first.');
      return;
    }
    if (!window.confirm('Deploy this verified solution to real-world impact? This will:\n1. Auto-create a Battle-Tested Resource in Library\n2. Issue official Certificates to all team members\n3. Notify citizen in Central System\n4. Award +500 Innovation Points for Civic Impact.')) return;

    try {
      const res = await fetch(`/api/projects/${currentProjectId}/deploy`, { method: 'PATCH' });
      const data = await res.json();
      if (data.success) {
        setProjects(prev => prev.map(p => (p._id || p.id) === currentProjectId ? {
          ...p,
          stage: 'Deployed',
          status: 'Deployed',
          progress: 4,
          isBattleTested: true,
          certificatesIssued: true
        } : p));
        setDeploymentCelebration(data);
        import('../utils/toast').then(m => m.toast('🎉 Solution Deployed! 4-fold impact triggers executed.', 'success'));
      }
    } catch (e) {
      import('../utils/toast').then(m => m.toast('Deployment failed', 'error'));
    }
  };

  // Citizen feedback
  const handleAddCitizenFeedback = async () => {
    const comment = window.prompt('Enter Citizen feedback review:', 'The automated sensor alert successfully notified our ward team during testing.');
    if (!comment) return;

    try {
      const res = await fetch(`/api/projects/${currentProjectId}/citizen-feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: 5, comment })
      });
      const data = await res.json();
      if (data.success) {
        setProjects(prev => prev.map(p => (p._id || p.id) === currentProjectId ? { ...p, citizenFeedback: data.citizenFeedback } : p));
        import('../utils/toast').then(m => m.toast('Citizen feedback recorded successfully!', 'success'));
      }
    } catch (e) {
      import('../utils/toast').then(m => m.toast('Failed to record feedback', 'error'));
    }
  };

  // Persistent Discussion Send
  const handleSendMessage = async () => {
    if (!newMsgText.trim()) return;
    const text = newMsgText.trim();
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const localMsg = {
      sender: 'Dr. Rohan Mehta',
      role: 'Faculty Mentor',
      text,
      time: timeNow,
      isMentor: true
    };
    
    setDiscussionMessages(prev => [...prev, localMsg]);
    setNewMsgText('');

    try {
      const res = await fetch(`/api/projects/${currentProjectId}/discussion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(localMsg)
      });
      const data = await res.json();
      if (data.success && data.discussion) {
        setDiscussionMessages(data.discussion);
        setProjects(prev => prev.map(p => (p._id || p.id) === currentProjectId ? { ...p, discussion: data.discussion } : p));
      }
    } catch (err) {
      console.error('Discussion error:', err);
    }
  };

  // Add Deadline
  const handleAddDeadline = async () => {
    if (!newDeadlineData.title) return alert('Please enter deadline title');
    try {
      const res = await fetch(`/api/projects/${currentProjectId}/deadlines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDeadlineData)
      });
      const data = await res.json();
      if (data.success) {
        setProjects(prev => prev.map(p => (p._id || p.id) === currentProjectId ? { ...p, deadlines: data.deadlines } : p));
        setShowDeadlineModal(false);
        setNewDeadlineData({ title: '', date: '25 Sep 2026', tag: 'Milestone' });
        import('../utils/toast').then(m => m.toast('Milestone deadline added!', 'success'));
      }
    } catch (e) {
      import('../utils/toast').then(m => m.toast('Failed to add deadline', 'error'));
    }
  };

  // Delete Deadline
  const handleDeleteDeadline = async (idx, e) => {
    e.stopPropagation();
    if (!window.confirm('Remove this milestone deadline?')) return;
    try {
      const res = await fetch(`/api/projects/${currentProjectId}/deadlines/${idx}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setProjects(prev => prev.map(p => (p._id || p.id) === currentProjectId ? { ...p, deadlines: data.deadlines } : p));
        import('../utils/toast').then(m => m.toast('Deadline removed', 'info'));
      }
    } catch (e) {
      import('../utils/toast').then(m => m.toast('Failed to delete deadline', 'error'));
    }
  };

  // Accurate Stat Counters & Status Categorization
  const isProjectDeployed = (p) => p.stage === 'Deployed' || p.status === 'Deployed' || p.status === 'resolved';
  const isProjectAtRisk = (p) => p.status === 'At Risk' || (p.milestones || []).some(m => m.status === 'needs_revision');
  const isProjectProposalPending = (p) => !isProjectDeployed(p) && (p.proposalStatus === 'submitted' || p.proposalStatus === 'under_review' || !p.proposalStatus || p.proposalStatus === 'not_submitted' || p.proposalStatus === 'changes_requested');
  const isProjectActive = (p) => !isProjectDeployed(p) && !isProjectAtRisk(p) && p.proposalStatus === 'approved';

  const nonDeployedProjects = projects.filter(p => !isProjectDeployed(p));
  const allCount = nonDeployedProjects.length;
  const activeCount = projects.filter(isProjectActive).length;
  const proposalPendingCount = projects.filter(isProjectProposalPending).length;
  const atRiskCount = projects.filter(isProjectAtRisk).length;
  const pendingReviewCount = projects.filter(p => p.stage === 'Submitted' || (p.milestones || []).some(m => m.status === 'pending_review')).length;
  const deployedCount = projects.filter(isProjectDeployed).length;

  // Filter projects list
  const filteredProjects = projects.filter(p => {
    let matchStatus = true;
    if (statusFilter === 'All') {
      matchStatus = !isProjectDeployed(p); // All excludes deployed projects!
    } else if (statusFilter === 'Active') {
      matchStatus = isProjectActive(p);
    } else if (statusFilter === 'Proposal Pending') {
      matchStatus = isProjectProposalPending(p);
    } else if (statusFilter === 'At Risk') {
      matchStatus = isProjectAtRisk(p);
    } else if (statusFilter === 'History') {
      matchStatus = isProjectDeployed(p);
    }

    const matchSearch = searchQuery
      ? (p.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.type || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.loc || '').toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    return matchStatus && matchSearch;
  });

  const handleToggleHistory = () => {
    const firstHistory = projects.find(isProjectDeployed);
    if (firstHistory) {
      setSelectedHistoryProjectId(firstHistory._id || firstHistory.id);
    }
    setShowHistoryModal(true);
  };

  const handleSelectFilter = (newFilter) => {
    setStatusFilter(newFilter);
    if (newFilter === 'All') {
      const firstNonDeployed = projects.find(p => !isProjectDeployed(p));
      if (firstNonDeployed) {
        setProjects(prev => prev.map(proj => ({ ...proj, selected: (proj._id || proj.id) === (firstNonDeployed._id || firstNonDeployed.id) })));
      }
    } else if (newFilter === 'Active') {
      const firstActive = projects.find(isProjectActive);
      if (firstActive) {
        setProjects(prev => prev.map(proj => ({ ...proj, selected: (proj._id || proj.id) === (firstActive._id || firstActive.id) })));
      }
    } else if (newFilter === 'Proposal Pending') {
      const firstPending = projects.find(isProjectProposalPending);
      if (firstPending) {
        setProjects(prev => prev.map(proj => ({ ...proj, selected: (proj._id || proj.id) === (firstPending._id || firstPending.id) })));
      }
    } else if (newFilter === 'At Risk') {
      const firstAtRisk = projects.find(isProjectAtRisk);
      if (firstAtRisk) {
        setProjects(prev => prev.map(proj => ({ ...proj, selected: (proj._id || proj.id) === (firstAtRisk._id || firstAtRisk.id) })));
      }
    } else if (newFilter === 'History') {
      const firstHistory = projects.find(isProjectDeployed);
      if (firstHistory) {
        setSelectedHistoryProjectId(firstHistory._id || firstHistory.id);
      }
      setShowHistoryModal(true);
    }
  };

  const selectedCategory = getCategoryDetails(selectedProject.type);

  // Context-aware stage action button (STRICT GATING: Proposal must be approved by Admin before starting work!)
  const renderStageActionButton = () => {
    const proposalStatus = selectedProject.proposalStatus || (activeProjectProposal?.status) || 'not_submitted';

    // 1. Proposal not yet submitted -> Cannot start directly
    if (proposalStatus === 'not_submitted') {
      return (
        <button
          className="mp-btn-primary"
          style={{ background: '#2563EB', borderColor: '#2563EB', padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 750 }}
          onClick={() => setShowProposalModal(true)}
          title="Submit solution proposal with funding request & requirements document to Admin"
        >
          <FileText style={{ width: 14, height: 14 }} /> Submit Proposal to Admin
        </button>
      );
    }

    // 2. Proposal submitted / under review -> Project locked, cannot start!
    if (proposalStatus === 'submitted' || proposalStatus === 'under_review') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            className="mp-btn-primary"
            style={{ background: '#FEF3C7', borderColor: '#FDE68A', color: '#B45309', padding: '8px 16px', cursor: 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 750 }}
            disabled
            title="Project locked: Awaiting State Admin review and approval"
          >
            <Clock style={{ width: 14, height: 14, color: '#D97706' }} /> Proposal Approval Pending by Admin
          </button>
          <button
            className="mp-btn-outline"
            style={{ padding: '7px 12px', fontSize: 12, fontWeight: 650 }}
            onClick={() => setShowProposalModal(true)}
          >
            View Proposal
          </button>
        </div>
      );
    }

    // 3. Changes requested
    if (proposalStatus === 'changes_requested') {
      return (
        <button
          className="mp-btn-primary"
          style={{ background: '#F59E0B', borderColor: '#D97706', padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 750 }}
          onClick={() => setShowProposalModal(true)}
          title="Admin requested revisions to proposal"
        >
          <Edit3 style={{ width: 14, height: 14 }} /> Revise & Re-submit Proposal
        </button>
      );
    }

    // 4. Rejected
    if (proposalStatus === 'rejected') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ background: '#FEE2E2', color: '#DC2626', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 750 }}>
            ✕ Proposal Rejected
          </span>
          <button
            className="mp-btn-outline"
            style={{ padding: '7px 12px', fontSize: 12 }}
            onClick={() => setShowProposalModal(true)}
          >
            View Feedback
          </button>
        </div>
      );
    }

    // 5. Approved -> Project can proceed!
    const stage = selectedProject.stage || selectedProject.status || 'Assigned';
    switch (stage) {
      case 'Assigned':
        return (
          <button
            className="mp-btn-primary"
            style={{ background: '#2563EB', borderColor: '#2563EB', padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 750 }}
            onClick={() => handleUpdateStatus('In Progress', 1)}
            title="Advance project to In Progress stage"
          >
            <ArrowRight style={{ width: 14, height: 14 }} /> Start Work → In Progress
          </button>
        );
      case 'In Progress':
        return (
          <button
            className="mp-btn-primary"
            style={{ background: '#7C3AED', borderColor: '#7C3AED', padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 750 }}
            onClick={() => handleUpdateStatus('Prototype', 2)}
            title="Advance project to Prototype stage"
          >
            <Sparkles style={{ width: 14, height: 14 }} /> Advance to Prototype
          </button>
        );
      case 'Prototype':
        return (
          <button
            className="mp-btn-primary"
            style={{ background: '#EA580C', borderColor: '#EA580C', padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 750 }}
            onClick={() => handleUpdateStatus('Submitted', 3)}
            title="Submit completed prototype for faculty mentor review"
          >
            <Send style={{ width: 14, height: 14 }} /> Submit for Mentor Review
          </button>
        );
      case 'Submitted':
        return (
          <button
            className="mp-btn-primary"
            style={{ background: 'linear-gradient(135deg, #16A34A, #15803D)', borderColor: '#16A34A', padding: '8px 16px', boxShadow: '0 4px 14px rgba(22,163,74,0.3)', display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 750 }}
            onClick={handleDeployProject}
            title="Deploy verified solution to civic impact"
          >
            <Sparkles style={{ width: 14, height: 14 }} /> 🎉 Deploy Solution
          </button>
        );
      case 'Deployed':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#DCFCE7', color: '#16A34A', padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 800, border: '1px solid #86EFAC' }}>
              <CheckCircle style={{ width: 14, height: 14 }} /> Live on Ground
            </span>
            <button
              className="mp-btn-outline"
              style={{ padding: '6px 12px', fontSize: 11 }}
              onClick={() => setActiveTab('Impact')}
            >
              View Impact →
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  const projectDeadlines = (selectedProject.deadlines && selectedProject.deadlines.length > 0)
    ? selectedProject.deadlines
    : [
        { title: 'Prototype Validation Review', date: '18 Sep 2026', tag: 'Milestone', isLight: false },
        { title: 'Faculty Mentor Progress Evaluation', date: '30 Sep 2026', tag: 'Review', isLight: true }
      ];

  return (
    <div className="mp-container animate-in">
      
      {/* ── Hero Section ── */}
      <div className="mp-hero">
        <div className="mp-hero-content">
          <div className="mp-hero-left">
            <h1 className="mp-hero-title">My Active <span style={{ color: '#F97316' }}>Projec</span><span style={{ color: '#16A34A' }}>ts</span></h1>
            <p className="mp-hero-subtitle">Track milestones, mentor reviews, deliverables and real-world deployment impact.</p>
          </div>
          <div className="mp-hero-right">
            <div className="mp-quote-box">
              <span className="mp-quote-mark">“</span>
              <div className="mp-quote-text">
                Solutions for today,<br/>
                <strong>Stronger communities for tomorrow.</strong>
                <span className="mp-quote-attr">— JanSetu Innovation</span>
              </div>
              <span className="mp-quote-mark right">”</span>
            </div>
            <div className="mp-viksit-logo">
              <span style={{ fontSize: 11, fontWeight: 700, color: '#1E293B' }}>Viksit Bharat</span>
              <span style={{ fontSize: 10, color: '#2563EB', fontWeight: 600 }}>Through Innovation</span>
              <div style={{ display: 'flex', height: 2, width: 40, marginTop: 4 }}>
                <div style={{ flex: 1, background: '#FF9933' }} />
                <div style={{ flex: 1, background: 'white' }} />
                <div style={{ flex: 1, background: '#138808' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Monument Decorative */}
        <div className="mp-hero-monument">
          <svg viewBox="0 0 300 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ height: 120, opacity: 0.9 }}>
            <rect x="115" y="30" width="70" height="80" rx="2" fill="#C8B560" />
            <path d="M125 110 L125 60 Q150 40 175 60 L175 110" fill="#F0E8D0" stroke="#C8B560" strokeWidth="1" />
            <rect x="110" y="24" width="80" height="8" rx="2" fill="#DDD4BC" />
            <ellipse cx="150" cy="24" rx="10" ry="14" fill="#C8B560" />
            <path d="M20 110 L20 70 L30 70 L30 60 L40 60 L40 70 L80 70 L80 60 L90 60 L90 70 L100 70 L100 110 Z" fill="#D28F75" />
            <path d="M210 110 L210 80 Q230 40 250 80 L250 110 Z" fill="#E8E8E8" stroke="#D0D0D0" />
            <rect x="200" y="60" width="4" height="50" fill="#E8E8E8" />
            <rect x="256" y="60" width="4" height="50" fill="#E8E8E8" />
          </svg>
        </div>
      </div>

      {/* ── Stats Row (Accurate Dynamic Numbers) ── */}
      <div className="mp-stats-row">
        <div className="mp-stat-card">
          <div className="mp-stat-icon" style={{ background: '#EFF6FF', color: '#2563EB' }}><Briefcase style={{ width: 20, height: 20 }} /></div>
          <div>
            <div className="mp-stat-val">{activeCount}</div>
            <div className="mp-stat-title">Active Projects</div>
            <div className="mp-stat-desc" style={{ color: '#0284C7' }}>Building in progress</div>
          </div>
        </div>
        <div className="mp-stat-card" style={{ borderBottomColor: atRiskCount > 0 ? '#EF4444' : 'transparent' }}>
          <div className="mp-stat-icon" style={{ background: atRiskCount > 0 ? '#FEF2F2' : '#F8FAFC', color: atRiskCount > 0 ? '#EF4444' : '#94A3B8' }}><AlertTriangle style={{ width: 20, height: 20 }} /></div>
          <div>
            <div className="mp-stat-val" style={{ color: atRiskCount > 0 ? '#EF4444' : '#1E293B' }}>{atRiskCount}</div>
            <div className="mp-stat-title">At Risk</div>
            <div className="mp-stat-desc" style={{ color: atRiskCount > 0 ? '#EF4444' : '#94A3B8' }}>{atRiskCount > 0 ? 'Needs attention' : 'Healthy status'}</div>
          </div>
        </div>
        <div className="mp-stat-card" style={{ borderBottomColor: pendingReviewCount > 0 ? '#F97316' : 'transparent' }}>
          <div className="mp-stat-icon" style={{ background: pendingReviewCount > 0 ? '#FFF7ED' : '#F8FAFC', color: pendingReviewCount > 0 ? '#F97316' : '#94A3B8' }}><Hourglass style={{ width: 20, height: 20 }} /></div>
          <div>
            <div className="mp-stat-val">{pendingReviewCount}</div>
            <div className="mp-stat-title">Pending Mentor Review</div>
            <div className="mp-stat-desc" style={{ color: pendingReviewCount > 0 ? '#F97316' : '#94A3B8' }}>{pendingReviewCount > 0 ? 'Action required' : 'All reviews clear'}</div>
          </div>
        </div>
        <div className="mp-stat-card" style={{ borderBottomColor: '#16A34A' }}>
          <div className="mp-stat-icon" style={{ background: '#ECFDF5', color: '#16A34A' }}><Leaf style={{ width: 20, height: 20 }} /></div>
          <div>
            <div className="mp-stat-val">{deployedCount}</div>
            <div className="mp-stat-title">Deployed Solutions</div>
            <div className="mp-stat-desc" style={{ color: '#16A34A' }}>Proven ground impact</div>
          </div>
        </div>
      </div>

      {/* ── Main Layout Grid ── */}
      <div className="mp-grid">
        
        {/* Left Column - Project List */}
        <div className="mp-col-left">
          <div className="mp-list-header">
            <h2 className="mp-list-title">My Projects</h2>
            <button
              className="mp-btn-primary"
              onClick={handleToggleHistory}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
              title="View Deployed / Historical Projects"
            >
              <Clock style={{ width: 14, height: 14 }} /> History
            </button>
          </div>

          {/* Upgraded Pill Chips */}
          <div className="mp-filter-pills">
            <button className={`mp-pill ${statusFilter === 'All' ? 'active' : ''}`} onClick={() => handleSelectFilter('All')}>
              All <span className="mp-pill-count">{allCount}</span>
            </button>
            <button className={`mp-pill ${statusFilter === 'Active' ? 'active' : ''}`} onClick={() => handleSelectFilter('Active')}>
              Active <span className="mp-pill-count">{activeCount}</span>
            </button>
            <button className={`mp-pill ${statusFilter === 'Proposal Pending' ? 'active' : ''}`} onClick={() => handleSelectFilter('Proposal Pending')}>
              Proposal Pending <span className="mp-pill-count">{proposalPendingCount}</span>
            </button>
            <button className={`mp-pill ${statusFilter === 'At Risk' ? 'active' : ''}`} onClick={() => handleSelectFilter('At Risk')}>
              At Risk <span className="mp-pill-count">{atRiskCount}</span>
            </button>
          </div>

          {/* History Mode Active Banner */}
          {statusFilter === 'History' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, fontSize: 11, color: '#1D4ED8', fontWeight: 650, marginTop: 10 }}>
              <span>Showing <strong>History & Deployed</strong> Projects ({deployedCount})</span>
              <button onClick={() => handleSelectFilter('All')} style={{ border: 'none', background: 'none', color: '#2563EB', cursor: 'pointer', fontWeight: 700, fontSize: 11 }}>
                ✕ View All
              </button>
            </div>
          )}

          {/* Search Box */}
          <div className="mp-search-box">
            <Search style={{ width: 15, height: 15, color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search by title, domain, or location..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Project List */}
          <div className="mp-project-list">
            {filteredProjects.map(p => {
              const isSel = (p._id || p.id) === currentProjectId;
              const isPApproved = p.proposalStatus === 'approved';
              const displayStage = !isPApproved ? 'Assigned' : (p.stage || p.status || 'Assigned');
              const pCat = getCategoryDetails(p.type);
              const CatIcon = pCat.icon;

              return (
                <div
                  key={p._id || p.id}
                  className={`mp-project-item ${isSel ? 'selected' : ''}`}
                  onClick={() => {
                    setProjects(prev => prev.map(proj => ({ ...proj, selected: (proj._id || proj.id) === (p._id || p.id) })));
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                    {/* Domain Icon Badge */}
                    <div className="mp-pi-badge-icon" style={{ background: pCat.bg }}>
                      <CatIcon style={{ width: 18, height: 18, color: 'white' }} />
                    </div>
                    <span className={`mp-status-badge ${displayStage.toLowerCase().replace(/\s+/g, '-')}`}>
                      {displayStage}
                    </span>
                  </div>
                  <h3 className="mp-pi-title">{p.title}</h3>
                  <div className="mp-pi-meta">
                    <span><Building2 style={{ width: 12, height: 12, color: '#94A3B8' }} /> {p.type || 'Innovation Project'}</span>
                    <span><MapPin style={{ width: 12, height: 12, color: '#94A3B8' }} /> {formatProjectLocation(p.loc)}</span>
                  </div>

                  {/* Proposal Status Tag & (i) Info Button */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginTop: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      {p.proposalStatus === 'submitted' && (
                        <span style={{ fontSize: 10, fontWeight: 800, background: '#FEF3C7', color: '#B45309', padding: '2px 8px', borderRadius: 999, border: '1px solid #FDE68A' }}>
                          ⏳ Proposal Under Review
                        </span>
                      )}
                      {p.proposalStatus === 'approved' && (
                        <span style={{ fontSize: 10, fontWeight: 800, background: '#DCFCE7', color: '#15803D', padding: '2px 8px', borderRadius: 999, border: '1px solid #86EFAC' }}>
                          ✓ Proposal Approved
                        </span>
                      )}
                      {(!p.proposalStatus || p.proposalStatus === 'not_submitted') && (
                        <span style={{ fontSize: 10, fontWeight: 800, background: '#EFF6FF', color: '#1D4ED8', padding: '2px 8px', borderRadius: 999, border: '1px solid #BFDBFE' }}>
                          📝 Proposal Required
                        </span>
                      )}
                    </div>

                    {/* (i) Industry Partner Info Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setProjects(prev => prev.map(proj => ({ ...proj, selected: (proj._id || proj.id) === (p._id || p.id) })));
                        setShowIndustryInfoModal(true);
                      }}
                      style={{
                        background: '#EFF6FF',
                        border: '1.5px solid #93C5FD',
                        color: '#1D4ED8',
                        borderRadius: '50%',
                        width: 22,
                        height: 22,
                        minWidth: 22,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontWeight: 900,
                        fontSize: 11.5,
                        boxShadow: '0 1px 4px rgba(37,99,235,0.2)',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = '#2563EB';
                        e.currentTarget.style.color = '#FFFFFF';
                        e.currentTarget.style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = '#EFF6FF';
                        e.currentTarget.style.color = '#1D4ED8';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                      title="Click (i) to view assigned/accepted Industry Partner details & funding"
                    >
                      i
                    </button>
                  </div>
                </div>
              );
            })}
            {filteredProjects.length === 0 && (
              <div style={{ textAlign: 'center', padding: '30px 16px', background: 'white', borderRadius: 12, border: '1px dashed #CBD5E1', color: '#94A3B8', fontSize: 12 }}>
                No projects match current filter.
              </div>
            )}
          </div>

          <div className="mp-bottom-promo">
            <h4 style={{ fontSize: 15, fontWeight: 800, color: '#1E293B', lineHeight: 1.2, position: 'relative', zIndex: 2 }}>
              From Campus Ideas<br/>to a Cleaner, Greener,<br/>Stronger India.
            </h4>
            <div style={{ position: 'absolute', bottom: -10, right: -10, opacity: 0.3, width: 120, height: 120 }}>
              <svg viewBox="0 0 100 100" fill="#2563EB"><path d="M50 10 L60 30 L90 30 L65 50 L75 80 L50 60 L25 80 L35 50 L10 30 L40 30 Z" /></svg>
            </div>
            <div style={{ position: 'absolute', bottom: 10, left: 10, width: 40, height: 3, display: 'flex' }}>
              <div style={{ flex: 1, background: '#FF9933' }} />
              <div style={{ flex: 1, background: 'white' }} />
              <div style={{ flex: 1, background: '#138808' }} />
            </div>
          </div>
        </div>

        {/* Middle Column - Project Details & Workflow */}
        <div className="mp-col-mid">
          
          <div className="mp-detail-header">
            <div style={{ display: 'flex', gap: 18 }}>
              
              {/* Modern Glass Domain Badge Box */}
              <div className="mp-dh-badge-box" style={{ background: selectedCategory.bg }}>
                <selectedCategory.icon style={{ width: 28, height: 28, color: 'white', marginBottom: 12 }} />
                <span className="mp-dh-cat-chip">{selectedCategory.label}</span>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <h2 className="mp-dh-title">{selectedProject.title || 'Select a Project'}</h2>
                    <span className={`mp-status-badge ${(selectedProject.stage || selectedProject.status || 'assigned').toLowerCase().replace(/\s+/g, '-')}`}>
                      {selectedProject.stage || selectedProject.status || 'Assigned'}
                    </span>

                    {/* Proposal Status Badge */}
                    {selectedProject.proposalStatus === 'submitted' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#FEF3C7', color: '#B45309', padding: '3px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 800, border: '1px solid #FDE68A' }}>
                        <Clock style={{ width: 12, height: 12, color: '#D97706' }} /> Proposal Pending Approval
                      </span>
                    )}
                    {selectedProject.proposalStatus === 'approved' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#ECFDF5', color: '#059669', padding: '3px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 800, border: '1px solid #A7F3D0' }}>
                        <CheckCircle style={{ width: 12, height: 12, color: '#10B981' }} /> Proposal Approved by Admin
                      </span>
                    )}
                    {(!selectedProject.proposalStatus || selectedProject.proposalStatus === 'not_submitted') && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#EFF6FF', color: '#1D4ED8', padding: '3px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 800, border: '1px solid #BFDBFE' }}>
                        <FileText style={{ width: 12, height: 12 }} /> Proposal Required
                      </span>
                    )}

                    {selectedProject.isBattleTested && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#DCFCE7', color: '#16A34A', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 12, border: '1px solid #86EFAC' }}>
                        <ShieldCheck style={{ width: 12, height: 12 }} /> Battle-Tested
                      </span>
                    )}
                  </div>

                  {/* Context-Aware Actions & (i) Info Button */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative', flexWrap: 'wrap' }}>
                    {renderStageActionButton()}

                    {/* (i) Industry Partner & Grant Details Info Button */}
                    <button
                      className="mp-btn-outline"
                      style={{
                        padding: '7px 13px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        background: '#EFF6FF',
                        borderColor: '#93C5FD',
                        color: '#1D4ED8',
                        fontWeight: 750,
                        fontSize: 12,
                        cursor: 'pointer'
                      }}
                      onClick={() => setShowIndustryInfoModal(true)}
                      title="View Assigned Industry Partner, Funding & Grant Details"
                    >
                      <Info style={{ width: 14, height: 14 }} />
                      <span>(i) Industry & Grant Details</span>
                    </button>

                    <button
                      className="mp-btn-outline"
                      style={{ padding: '7px 14px', display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700, cursor: 'pointer' }}
                      onClick={() => {
                        navigate('/team-mentorship', {
                          state: {
                            targetTeamId: selectedProject.teamId,
                            targetProjectId: selectedProject._id || selectedProject.id,
                            targetProjectTitle: selectedProject.title
                          }
                        });
                      }}
                      title="View Team workspace and member competencies for this project"
                    >
                      <Users style={{ width: 14, height: 14 }} /> View Team
                    </button>

                    <button className="mp-btn-icon" onClick={() => setShowDropdown(!showDropdown)}>
                      <MoreHorizontal style={{ width: 16, height: 16 }} />
                    </button>

                    {showDropdown && (
                      <div style={{ position: 'absolute', top: 38, right: 0, background: 'white', border: '1px solid #E2E8F0', borderRadius: 10, boxShadow: '0 12px 28px rgba(0,0,0,0.15)', zIndex: 60, minWidth: 180, overflow: 'hidden' }}>
                        <button style={{ display: 'block', width: '100%', padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', color: '#1E293B', fontSize: 12, fontWeight: 600 }} onClick={() => { setShowDropdown(false); handleDuplicate(currentProjectId); }}>
                          Duplicate / Fork
                        </button>
                        <button style={{ display: 'block', width: '100%', padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', color: '#1E293B', fontSize: 12, fontWeight: 600 }} onClick={() => { setShowDropdown(false); handleDeployProject(); }}>
                          Deploy Solution
                        </button>
                        <button style={{ display: 'block', width: '100%', padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', color: '#EF4444', fontSize: 12, fontWeight: 600 }} onClick={() => { setShowDropdown(false); handleDelete(currentProjectId); }}>
                          Delete Project
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mp-dh-meta">
                  <span><Building2 style={{ width: 14, height: 14, color: '#64748B' }} /> {selectedProject.type || 'Infrastructure'}</span>
                  <span><MapPin style={{ width: 14, height: 14, color: '#64748B' }} /> {formatProjectLocation(selectedProject.loc)}</span>
                  <span><Users style={{ width: 14, height: 14, color: '#64748B' }} /> Team: {(selectedProject.team || []).join(', ') || 'Lead Innovators'}</span>
                </div>
                
                <p className="mp-dh-desc">
                  {selectedProject.description || 'Engineering innovation developed by student researchers addressing verified civic challenges.'}
                </p>

                {/* ── Informational Proposal & Industry Status Banner ── */}
                {selectedProject.proposalStatus === 'submitted' && (
                  <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '10px 16px', marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5, color: '#92400E' }}>
                      <Clock style={{ width: 18, height: 18, color: '#D97706', flexShrink: 0 }} />
                      <span>
                        <strong>Proposal Under Review by Admin:</strong> Technical requirements write-up and funding request of <strong>₹{Number(activeProjectProposal?.fundingRequested || selectedProject.fundingSummary?.goal || 72000).toLocaleString('en-IN')}</strong> submitted. Project milestones remain locked until Admin approval.
                      </span>
                    </div>
                    <button
                      onClick={() => setShowProposalModal(true)}
                      style={{ background: '#FEF3C7', border: '1px solid #F59E0B', color: '#B45309', padding: '5px 12px', borderRadius: 6, fontSize: 11.5, fontWeight: 750, cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      View Proposal
                    </button>
                  </div>
                )}

                {selectedProject.proposalStatus === 'approved' && (() => {
                  const partnerObj = (selectedProject.assignedIndustryDetails && (selectedProject.assignedIndustryDetails.name || selectedProject.assignedIndustryDetails.companyName))
                    ? selectedProject.assignedIndustryDetails
                    : (activeProjectProposal?.assignedIndustry && (activeProjectProposal.assignedIndustry.name || activeProjectProposal.assignedIndustry.companyName))
                      ? activeProjectProposal.assignedIndustry
                      : null;
                  const partnerName = partnerObj?.companyName || partnerObj?.name;
                  const grantAmount = Number(partnerObj?.fundingCommitted || activeProjectProposal?.fundingRequested || selectedProject.fundingSummary?.goal || 50001).toLocaleString('en-IN');

                  return (
                    <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 10, padding: '10px 16px', marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5, color: '#065F46' }}>
                        <CheckCircle style={{ width: 18, height: 18, color: '#10B981', flexShrink: 0 }} />
                        <span>
                          <strong>Proposal Approved by Admin:</strong> Project work unlocked! {partnerName ? <>Collaborating with <strong>{partnerName}</strong> with <strong>₹{grantAmount}</strong> committed grant.</> : <>Industry partner matching underway for <strong>₹{grantAmount}</strong> grant.</>}
                        </span>
                      </div>
                      <button
                        onClick={() => setShowIndustryInfoModal(true)}
                        style={{ background: '#D1FAE5', border: '1px solid #10B981', color: '#065F46', padding: '5px 12px', borderRadius: 6, fontSize: 11.5, fontWeight: 750, cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        <Info style={{ width: 13, height: 13 }} /> (i) Industry Details
                      </button>
                    </div>
                  );
                })()}

                {(!selectedProject.proposalStatus || selectedProject.proposalStatus === 'not_submitted') && (
                  <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '10px 16px', marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5, color: '#1E40AF' }}>
                      <FileText style={{ width: 18, height: 18, color: '#2563EB', flexShrink: 0 }} />
                      <span>
                        <strong>Proposal Submission Required:</strong> Submit your solution proposal with funding request and technical write-up to receive State Admin review and match with eligible industry partners.
                      </span>
                    </div>
                    <button
                      onClick={() => setShowProposalModal(true)}
                      style={{ background: '#2563EB', border: 'none', color: '#FFFFFF', padding: '6px 14px', borderRadius: 6, fontSize: 11.5, fontWeight: 750, cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      Submit Proposal
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="mp-tabs">
              {['Overview', 'Submissions', 'Activity', 'Discussion', 'Impact'].map(t => (
                <button
                  key={t}
                  className={`mp-tab ${activeTab === t ? 'active' : ''}`}
                  onClick={() => setActiveTab(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* ── TAB 1: OVERVIEW ── */}
          {activeTab === 'Overview' && (
            <>
              {/* Milestone Timeline Card */}
              <div className="mp-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                  <div>
                    <h3 className="mp-card-title">Project Milestone Timeline</h3>
                    <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>
                      Current Stage: <strong style={{ color: !isProposalApproved ? '#D97706' : '#2563EB' }}>{!isProposalApproved ? 'Locked: Proposal Approval Required' : currentStageName}</strong> (Step {stageIndex + 1} of 5)
                    </div>
                  </div>
                  {!isProposalApproved ? (
                    <div className="mp-milestone-alert" style={{ background: '#FFFBEB', borderColor: '#FDE68A' }}>
                      <Lock style={{ width: 14, height: 14, color: '#D97706' }} />
                      <div>
                        <div style={{ fontSize: 9, color: '#92400E' }}>Project Gated</div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: '#B45309' }}>
                          {selectedProject.proposalStatus === 'submitted' ? 'Proposal Under Review' : 'Proposal Required'}
                        </div>
                      </div>
                    </div>
                  ) : selectedProject.stage === 'Deployed' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#DCFCE7', padding: '6px 14px', borderRadius: 8, border: '1px solid #86EFAC' }}>
                      <CheckCircle style={{ width: 16, height: 16, color: '#16A34A' }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#16A34A' }}>Solution Fully Deployed</span>
                    </div>
                  ) : (
                    <div className="mp-milestone-alert">
                      <Clock style={{ width: 14, height: 14, color: '#F97316' }} />
                      <div>
                        <div style={{ fontSize: 9, color: '#64748B' }}>Next milestone target</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#F97316' }}>Active Stage</div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mp-timeline">
                  <div className="mp-timeline-track">
                    <div className="mp-timeline-fill" style={{ width: `${!isProposalApproved ? 0 : Math.min(100, Math.max(10, stageIndex * 25))}%` }} />
                  </div>
                  
                  <div className="mp-timeline-steps">
                    {/* Step 1: Assigned */}
                    <div className={`mp-t-step ${stageIndex >= 0 ? (stageIndex > 0 ? 'complete' : 'active') : ''}`}>
                      <div className="mp-t-dot">
                        {stageIndex > 0 ? <CheckCircle style={{ width: 14, height: 14 }} /> : <span style={{ fontSize: 11, fontWeight: 800 }}>1</span>}
                      </div>
                      <div className="mp-t-label">Assigned</div>
                      <div className="mp-t-date">Initial Stage</div>
                      <div className="mp-t-sub">Team Set</div>
                      {!isProposalApproved ? (
                        <button className="mp-t-btn primary" style={{ background: '#2563EB', fontSize: 10.5 }} onClick={() => setShowProposalModal(true)}>
                          {selectedProject.proposalStatus === 'submitted' ? 'View Proposal' : 'Submit Proposal'}
                        </button>
                      ) : (
                        <button className="mp-t-btn text-only" onClick={() => setActiveTab('Submissions')}>View</button>
                      )}
                    </div>

                    {/* Step 2: In Progress */}
                    <div className={`mp-t-step ${isProposalApproved && stageIndex >= 1 ? (stageIndex > 1 ? 'complete' : 'active') : ''}`}>
                      <div className="mp-t-dot">
                        {!isProposalApproved ? <Lock style={{ width: 12, height: 12, color: '#94A3B8' }} /> : (stageIndex > 1 ? <CheckCircle style={{ width: 14, height: 14 }} /> : <span style={{ fontSize: 11, fontWeight: 800 }}>2</span>)}
                      </div>
                      <div className="mp-t-label">In Progress</div>
                      <div className="mp-t-date">Architecture</div>
                      <div className="mp-t-sub">Deliverables</div>
                      {!isProposalApproved ? (
                        <button className="mp-t-btn text-only" disabled style={{ opacity: 0.5, cursor: 'not-allowed', color: '#94A3B8' }}>🔒 Locked</button>
                      ) : stageIndex === 0 ? (
                        <button className="mp-t-btn primary" onClick={() => handleUpdateStatus('In Progress', 1)}>Start</button>
                      ) : (
                        <button className="mp-t-btn text-only" onClick={() => setActiveTab('Submissions')}>View</button>
                      )}
                    </div>

                    {/* Step 3: Prototype */}
                    <div className={`mp-t-step ${isProposalApproved && stageIndex >= 2 ? (stageIndex > 2 ? 'complete' : 'active') : ''}`}>
                      <div className="mp-t-dot">
                        {!isProposalApproved ? <Lock style={{ width: 12, height: 12, color: '#94A3B8' }} /> : (stageIndex > 2 ? <CheckCircle style={{ width: 14, height: 14 }} /> : <span style={{ fontSize: 11, fontWeight: 800 }}>3</span>)}
                      </div>
                      <div className="mp-t-label">Prototype</div>
                      <div className="mp-t-date">Field Model</div>
                      <div className="mp-t-sub">Validation</div>
                      {!isProposalApproved ? (
                        <button className="mp-t-btn text-only" disabled style={{ opacity: 0.5, cursor: 'not-allowed', color: '#94A3B8' }}>🔒 Locked</button>
                      ) : stageIndex === 1 ? (
                        <button className="mp-t-btn primary" onClick={() => handleUpdateStatus('Prototype', 2)}>Build</button>
                      ) : stageIndex === 2 ? (
                        <button className="mp-t-btn primary" onClick={() => handleUpdateStatus('Submitted', 3)}>Submit</button>
                      ) : (
                        <button className="mp-t-btn text-only" onClick={() => setActiveTab('Submissions')}>View</button>
                      )}
                    </div>

                    {/* Step 4: Submitted */}
                    <div className={`mp-t-step ${isProposalApproved && stageIndex >= 3 ? (stageIndex > 3 ? 'complete' : 'active') : ''}`}>
                      <div className="mp-t-dot">
                        {!isProposalApproved ? <Lock style={{ width: 12, height: 12, color: '#94A3B8' }} /> : (stageIndex > 3 ? <CheckCircle style={{ width: 14, height: 14 }} /> : <span style={{ fontSize: 11, fontWeight: 800 }}>4</span>)}
                      </div>
                      <div className="mp-t-label">Submitted</div>
                      <div className="mp-t-date">Final Review</div>
                      <div className="mp-t-sub">Mentor Gate</div>
                      {!isProposalApproved ? (
                        <button className="mp-t-btn text-only" disabled style={{ opacity: 0.5, cursor: 'not-allowed', color: '#94A3B8' }}>🔒 Locked</button>
                      ) : stageIndex === 3 ? (
                        <button className="mp-t-btn primary" style={{ background: '#16A34A' }} onClick={handleDeployProject}>Deploy</button>
                      ) : (
                        <button className="mp-t-btn text-only" onClick={() => setActiveTab('Submissions')}>View</button>
                      )}
                    </div>

                    {/* Step 5: Deployed */}
                    <div className={`mp-t-step ${isProposalApproved && stageIndex >= 4 ? 'complete' : ''}`}>
                      <div className="mp-t-dot" style={isProposalApproved && stageIndex >= 4 ? { background: '#16A34A', borderColor: '#16A34A', color: 'white' } : {}}>
                        {!isProposalApproved ? <Lock style={{ width: 12, height: 12, color: '#94A3B8' }} /> : (stageIndex >= 4 ? <Sparkles style={{ width: 14, height: 14 }} /> : <span style={{ fontSize: 11, fontWeight: 800 }}>5</span>)}
                      </div>
                      <div className="mp-t-label">Deployed</div>
                      <div className="mp-t-date">Civic Impact</div>
                      <div className="mp-t-sub">Certificates</div>
                      {!isProposalApproved ? (
                        <button className="mp-t-btn text-only" disabled style={{ opacity: 0.5, cursor: 'not-allowed', color: '#94A3B8' }}>🔒 Locked</button>
                      ) : stageIndex >= 4 ? (
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#16A34A' }}>Live 🎉</span>
                      ) : (
                        <button className="mp-t-btn secondary" onClick={handleDeployProject}>Deploy</button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Milestone Submission & Mentor Review Gate */}
              <div className="mp-card" style={{ padding: '20px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div>
                    <h3 className="mp-card-title">Milestone Submission & Mentor Approval Gate</h3>
                    <p style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                      Upload deliverable artifacts. Mentors review deliverables and advance project stages.
                    </p>
                  </div>
                  {isProposalApproved && stageIndex === 3 && (
                    <button className="mp-btn-primary" style={{ background: '#16A34A', borderColor: '#16A34A' }} onClick={handleDeployProject}>
                      <Sparkles style={{ width: 14, height: 14 }} /> Deploy Solution
                    </button>
                  )}
                </div>

                {!isProposalApproved ? (
                  <div style={{ background: '#FFFBEB', border: '1.5px dashed #F59E0B', borderRadius: 12, padding: '28px 24px', textAlign: 'center', margin: '8px 0' }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                      <Lock style={{ width: 24, height: 24 }} />
                    </div>
                    <h4 style={{ fontSize: 16, fontWeight: 800, color: '#92400E', margin: '0 0 6px 0' }}>
                      Milestones & Deliverables Locked
                    </h4>
                    <p style={{ fontSize: 12.5, color: '#B45309', maxWidth: 480, margin: '0 auto 16px', lineHeight: 1.5 }}>
                      {selectedProject.proposalStatus === 'submitted'
                        ? 'Your solution proposal has been submitted to State Admin. Deliverables, hardware validation, and prototype submissions remain locked until Admin approval.'
                        : 'Starting project work directly is blocked. You must submit a solution proposal (funding requested amount + technical requirements write-up) to State Admin for review and industry partner matching.'}
                    </p>
                    <button
                      onClick={() => setShowProposalModal(true)}
                      className="mp-btn-primary"
                      style={{ margin: '0 auto', display: 'inline-flex', alignItems: 'center', gap: 6, background: '#2563EB', borderColor: '#2563EB', padding: '9px 20px', fontSize: 13, fontWeight: 750 }}
                    >
                      <FileText style={{ width: 15, height: 15 }} />
                      {selectedProject.proposalStatus === 'submitted' ? 'View Submitted Proposal' : 'Submit Solution Proposal to Admin'}
                    </button>
                  </div>
                ) : (
                  <div className="mp-submission-grid">
                    {milestonesList.map((m, idx) => {
                      const isApproved = m.status === 'approved';
                      const isPendingReview = m.status === 'pending_review';
                      const isNeedsRev = m.status === 'needs_revision';
                      const isMissing = !isApproved && !isPendingReview && !isNeedsRev && m.status === 'missing';

                      return (
                        <div key={idx} className={`mp-sub-box ${isPendingReview ? 'active' : ''} ${isMissing ? 'disabled' : ''}`}>
                          <div className="mp-sb-header">
                            <span className="mp-sb-title">{m.title || `Milestone ${idx + 1}`}</span>
                            <span className={`mp-sb-status ${isApproved ? 'complete' : isPendingReview ? 'pending' : isNeedsRev ? 'missing' : 'missing'}`}>
                              {isApproved && <><CheckCircle style={{ width: 12, height: 12 }} /> Approved</>}
                              {isPendingReview && <><Clock style={{ width: 12, height: 12 }} /> Pending Mentor Review</>}
                              {isNeedsRev && <><AlertTriangle style={{ width: 12, height: 12, color: '#EF4444' }} /> Revision Requested</>}
                              {isMissing && <><AlertTriangle style={{ width: 12, height: 12 }} /> Upcoming</>}
                              {!isApproved && !isPendingReview && !isNeedsRev && !isMissing && <>Ready to Submit</>}
                            </span>
                          </div>

                          {/* File preview info if uploaded */}
                          {m.fileUrl && (
                            <div className="mp-sb-file" style={{ background: '#F8FAFC', padding: 8, borderRadius: 6, border: '1px solid #E2E8F0' }}>
                              <FileText style={{ width: 20, height: 20, color: '#2563EB', flexShrink: 0 }} />
                              <div style={{ overflow: 'hidden' }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: '#1E293B', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                                  {m.fileUrl.split('/').pop()}
                                </div>
                                <div style={{ fontSize: 9, color: '#64748B' }}>Deliverable artifact uploaded</div>
                              </div>
                            </div>
                          )}

                          {/* Revision feedback banner */}
                          {isNeedsRev && m.feedback && (
                            <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 6, padding: '6px 8px', marginBottom: 12, fontSize: 10, color: '#B91C1C' }}>
                              <strong>Mentor note:</strong> {m.feedback}
                            </div>
                          )}

                          {/* Action buttons */}
                          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 10 }}>
                            {m.fileUrl && (
                              <button
                                className="mp-btn-outline"
                                style={{ width: '100%' }}
                                onClick={() => {
                                  if (m.fileUrl.startsWith('http')) window.open(m.fileUrl, '_blank');
                                  else setPreviewFile(m);
                                }}
                              >
                                <ExternalLink style={{ width: 12, height: 12 }} /> View Deliverable
                              </button>
                            )}

                            {/* Mentor review gate actions if pending review */}
                            {isPendingReview && (
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button
                                  className="mp-btn-primary"
                                  style={{ flex: 1, background: '#16A34A', borderColor: '#16A34A', padding: '6px 8px', fontSize: 10 }}
                                  onClick={() => handleApproveMilestone(m.name || m.title)}
                                >
                                  <Check style={{ width: 12, height: 12 }} /> Approve
                                </button>
                                <button
                                  className="mp-btn-outline"
                                  style={{ flex: 1, color: '#EF4444', borderColor: '#FCA5A5', padding: '6px 8px', fontSize: 10 }}
                                  onClick={() => handleRejectMilestone(m.name || m.title)}
                                >
                                  <X style={{ width: 12, height: 12 }} /> Revise
                                </button>
                              </div>
                            )}

                            {/* Upload / Re-upload button */}
                            {(!isApproved || isNeedsRev) && (
                              <label className="mp-btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 10 }}>
                                <Upload style={{ width: 12, height: 12, marginRight: 4 }} />
                                {m.fileUrl ? 'Re-upload File' : 'Upload Deliverable'}
                                <input
                                  type="file"
                                  style={{ display: 'none' }}
                                  onChange={e => handleFileUpload(m.name || m.title, e)}
                                />
                              </label>
                            )}

                            {isApproved && (
                              <div style={{ textAlign: 'center', fontSize: 10, color: '#16A34A', fontWeight: 700, padding: 4 }}>
                                ✓ Verified by Faculty Mentor
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Project Details Card */}
              <div className="mp-card">
                <h3 className="mp-card-title" style={{ marginBottom: 16 }}>Project Details</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                  <div>
                    <h4 style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', marginBottom: 8 }}>Problem Statement</h4>
                    <p style={{ fontSize: 12, color: '#64748B', lineHeight: 1.6 }}>
                      {selectedProject.description || 'Urban communities face critical infrastructure and sustainability challenges. This capstone engineering team builds verified technical solutions with measurable ground impact.'}
                    </p>
                  </div>
                  <div className="mp-details-meta">
                    <div className="mp-dm-row">
                      <span className="mp-dm-label"><FileArchive style={{ width: 14, height: 14 }} /> Category</span>
                      <span className="mp-dm-val">{selectedProject.type || 'Infrastructure'}</span>
                    </div>
                    <div className="mp-dm-row">
                      <span className="mp-dm-label"><MapPin style={{ width: 14, height: 14 }} /> Location</span>
                      <span className="mp-dm-val">{formatProjectLocation(selectedProject.loc)}</span>
                    </div>
                    <div className="mp-dm-row">
                      <span className="mp-dm-label"><GraduationCap style={{ width: 14, height: 14 }} /> Faculty Mentor</span>
                      <span className="mp-dm-val">{selectedProject.mentor?.name || 'Dr. Rohan Mehta'} ({selectedProject.mentor?.org || 'IIT Delhi'})</span>
                    </div>
                    <div className="mp-dm-row">
                      <span className="mp-dm-label"><CalendarDays style={{ width: 14, height: 14 }} /> Status</span>
                      <span className="mp-dm-val" style={{ color: '#2563EB' }}>{currentStageName}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── TAB 2: SUBMISSIONS ── */}
          {activeTab === 'Submissions' && (
            <div className="mp-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <h3 className="mp-card-title">All Project Submissions & Artifacts</h3>
                  <p style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>Repository of code repositories, schematics, and verification reports.</p>
                </div>
                <label className="mp-btn-primary" style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                  <Upload style={{ width: 14, height: 14 }} /> Upload New Artifact
                  <input type="file" style={{ display: 'none' }} onChange={e => handleFileUpload('Ad-hoc Deliverable', e)} />
                </label>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {milestonesList.map((m, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <FileText style={{ width: 22, height: 22, color: '#2563EB' }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>{m.title || `Milestone ${idx + 1}`}</div>
                        <div style={{ fontSize: 11, color: '#64748B' }}>
                          Status: <strong style={{ color: m.status === 'approved' ? '#16A34A' : '#F97316' }}>{m.status || 'Pending'}</strong> • {m.fileUrl ? m.fileUrl.split('/').pop() : 'No file uploaded yet'}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {m.fileUrl && (
                        <button className="mp-btn-outline" onClick={() => setPreviewFile(m)}>
                          <ExternalLink style={{ width: 12, height: 12 }} /> View
                        </button>
                      )}
                      {m.status === 'pending_review' && (
                        <button className="mp-btn-primary" style={{ background: '#16A34A', borderColor: '#16A34A' }} onClick={() => handleApproveMilestone(m.name || m.title)}>
                          <Check style={{ width: 12, height: 12 }} /> Approve
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── TAB 3: ACTIVITY ── */}
          {activeTab === 'Activity' && (
            <div className="mp-card">
              <h3 className="mp-card-title" style={{ marginBottom: 16 }}>Project Activity Trail</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Sparkles style={{ width: 14, height: 14 }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>Project Initialized & Team Assigned</div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>Problem assigned to {selectedProject.team?.join(', ') || 'Lead Innovators'}</div>
                    <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>Stage 1: Assigned</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <GraduationCap style={{ width: 14, height: 14 }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>Faculty Mentor Assigned</div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>{selectedProject.mentor?.name || 'Dr. Rohan Mehta'} joined as technical guide.</div>
                    <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>{selectedProject.mentor?.org || 'IIT Delhi'}</div>
                  </div>
                </div>

                {selectedProject.stage === 'Deployed' && (
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Award style={{ width: 14, height: 14 }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>🎉 Real-world Deployment Completed!</div>
                      <div style={{ fontSize: 11, color: '#64748B' }}>Verified Battle-Tested blueprint created and certificates issued to all innovators.</div>
                      <div style={{ fontSize: 10, color: '#16A34A', fontWeight: 700, marginTop: 2 }}>Live on Ground</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── TAB 4: DISCUSSION (Persistent MongoDB) ── */}
          {activeTab === 'Discussion' && (
            <div className="mp-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h3 className="mp-card-title">Project Discussion & Mentor Forum</h3>
                  <p style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Real-time communication between faculty guide and student research team.</p>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#16A34A', background: '#DCFCE7', padding: '3px 8px', borderRadius: 12 }}>
                  ● Connected Live
                </span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20, maxHeight: 320, overflowY: 'auto', paddingRight: 4 }}>
                {discussionMessages.map((msg, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: msg.isMentor ? '#F8FAFC' : 'white', padding: 12, borderRadius: 10, border: '1px solid #E2E8F0' }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: msg.isMentor ? 'linear-gradient(135deg, #2563EB, #1D4ED8)' : 'linear-gradient(135deg, #10B981, #059669)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
                      {(msg.sender || 'U').split(' ').map(w => w[0]).join('').slice(0, 2)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                        <div>
                          <strong style={{ fontSize: 12, color: '#1E293B' }}>{msg.sender}</strong>
                          <span style={{ fontSize: 10, color: msg.isMentor ? '#2563EB' : '#10B981', marginLeft: 6, fontWeight: 700 }}>{msg.role}</span>
                        </div>
                        <span style={{ fontSize: 10, color: '#94A3B8' }}>{msg.time}</span>
                      </div>
                      <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.45, margin: 0 }}>{msg.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  placeholder="Type a message or instruction for team and faculty guide..."
                  value={newMsgText}
                  onChange={e => setNewMsgText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                  style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1.5px solid #CBD5E1', fontSize: 12, outline: 'none' }}
                />
                <button className="mp-btn-primary" onClick={handleSendMessage} style={{ padding: '8px 18px' }}>
                  <Send style={{ width: 14, height: 14 }} /> Send
                </button>
              </div>
            </div>
          )}

          {/* ── TAB 5: IMPACT (Stage 7) ── */}
          {activeTab === 'Impact' && (
            <div className="mp-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <h3 className="mp-card-title">Real-World Community Impact (Stage 7)</h3>
                  <p style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>Live field impact metrics, citizen ratings, and feedback tracking.</p>
                </div>
                <button className="mp-btn-primary" onClick={handleAddCitizenFeedback}>
                  <Plus style={{ width: 14, height: 14 }} /> Record Citizen Feedback
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
                <div style={{ background: '#ECFDF5', padding: 16, borderRadius: 10, border: '1px solid #A7F3D0' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#065F46' }}>Target Ward Location</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#047857', marginTop: 4 }}>{selectedProject.loc || 'New Delhi, Delhi'}</div>
                </div>
                <div style={{ background: '#EFF6FF', padding: 16, borderRadius: 10, border: '1px solid #BFDBFE' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#1E40AF' }}>Community Beneficiaries</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#1D4ED8', marginTop: 4 }}>12,400+ Citizens</div>
                </div>
                <div style={{ background: '#FFFBEB', padding: 16, borderRadius: 10, border: '1px solid #FDE68A' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#92400E' }}>Citizen Satisfaction</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#B45309', marginTop: 4 }}>4.9 / 5.0 ⭐</div>
                </div>
              </div>

              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', marginBottom: 12 }}>Citizen Feedback & Reviews</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(selectedProject.citizenFeedback && selectedProject.citizenFeedback.length > 0) ? (
                  selectedProject.citizenFeedback.map((fb, i) => (
                    <div key={i} style={{ padding: 12, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <div style={{ display: 'flex', color: '#F59E0B' }}>
                          {[...Array(fb.rating || 5)].map((_, idx) => (
                            <Star key={idx} style={{ width: 12, height: 12, fill: '#F59E0B' }} />
                          ))}
                        </div>
                        <span style={{ fontSize: 10, color: '#64748B' }}>• Verified Citizen Resident</span>
                      </div>
                      <p style={{ fontSize: 12, color: '#334155', margin: 0 }}>{fb.comment}</p>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: 24, color: '#94A3B8', fontSize: 12, border: '1px dashed #E2E8F0', borderRadius: 8 }}>
                    No citizen feedback recorded yet. Click "+ Record Citizen Feedback" to add field review data.
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Right Column - Sidebar */}
        <div className="mp-col-right">
          
          {/* Upcoming Deadlines Card */}
          <div className="mp-card" style={{ padding: '20px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 className="mp-card-title" style={{ fontSize: 15 }}>Upcoming Deadlines</h3>
              <button
                className="mp-add-dl-btn"
                onClick={() => setShowDeadlineModal(true)}
              >
                <Plus style={{ width: 12, height: 12 }} /> Add
              </button>
            </div>

            {/* Mini Calendar Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, fontSize: 13, fontWeight: 800, color: '#0F172A' }}>
              <button
                onClick={() => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() - 1, 1))}
                style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#64748B' }}
                title="Previous Month"
              >
                <ChevronLeft style={{ width: 14, height: 14 }} />
              </button>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>{monthNames[calDate.getMonth()]} {calDate.getFullYear()}</span>
                {(calDate.getMonth() !== new Date().getMonth() || calDate.getFullYear() !== new Date().getFullYear()) && (
                  <button
                    onClick={() => setCalDate(new Date())}
                    style={{ fontSize: 10.5, background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', borderRadius: 5, padding: '2px 7px', cursor: 'pointer', fontWeight: 800 }}
                    title="Jump to Current Month"
                  >
                    Today
                  </button>
                )}
              </div>

              <button
                onClick={() => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() + 1, 1))}
                style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#64748B' }}
                title="Next Month"
              >
                <ChevronRight style={{ width: 14, height: 14 }} />
              </button>
            </div>

            {/* Mini Calendar Grid */}
            <div className="mp-cal-grid">
              <div className="mp-cal-head">Mon</div>
              <div className="mp-cal-head">Tue</div>
              <div className="mp-cal-head">Wed</div>
              <div className="mp-cal-head">Thu</div>
              <div className="mp-cal-head">Fri</div>
              <div className="mp-cal-head">Sat</div>
              <div className="mp-cal-head">Sun</div>
              
              {getCalendarCells(projectDeadlines).map((cell, cIdx) => {
                const isCurrent = cell.type === 'current';
                let cellClass = 'mp-cal-day';
                if (!isCurrent) cellClass += ' old';
                else if (cell.isToday) cellClass += ' today';
                else if (cell.hasEvent) {
                  cellClass += cell.isLightEvent ? ' event-light' : ' event';
                }

                const tooltipTitle = cell.deadlines?.length > 0
                  ? cell.deadlines.map(d => `${d.title} (${d.date})`).join('\n')
                  : (cell.isToday ? `Today (${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })})` : `Click to set deadline on ${cell.dateStr}`);

                return (
                  <div
                    key={cIdx}
                    className={cellClass}
                    title={tooltipTitle}
                    onClick={() => {
                      if (isCurrent) {
                        setNewDeadlineData({
                          title: '',
                          date: cell.dateStr,
                          tag: 'Milestone'
                        });
                        setShowDeadlineModal(true);
                      }
                    }}
                  >
                    {cell.day}
                  </div>
                );
              })}
            </div>

            {/* Dynamic Events List */}
            <div className="mp-event-list">
              {projectDeadlines.length === 0 ? (
                <div style={{ padding: '16px 10px', textAlign: 'center', background: '#F8FAFC', borderRadius: 8, border: '1px dashed #CBD5E1', fontSize: 11, color: '#64748B' }}>
                  No milestone deadlines scheduled.<br />
                  <button
                    onClick={() => setShowDeadlineModal(true)}
                    style={{ marginTop: 8, border: 'none', background: '#2563EB', color: '#FFFFFF', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                  >
                    + Add First Deadline
                  </button>
                </div>
              ) : (
                projectDeadlines.map((dl, idx) => {
                  const { daysBadge, sub, isLight, isUrgent, isOverdue } = getDeadlineDisplayInfo(dl);
                  const iconColor = isOverdue ? '#DC2626' : (isUrgent ? '#EA580C' : '#D97706');
                  const tagBg = isOverdue ? '#FEE2E2' : (isUrgent ? '#FFEDD5' : '#FEF3C7');
                  const tagColor = isOverdue ? '#991B1B' : (isUrgent ? '#C2410C' : '#B45309');
                  const tagBorder = isOverdue ? '#FCA5A5' : (isUrgent ? '#FDBA74' : '#FDE68A');

                  return (
                    <div key={idx} className={`mp-event-item ${isLight ? 'light' : ''}`}>
                      <div className="mp-ei-top">
                        <div className="mp-ei-date">
                          <Calendar style={{ width: 13, height: 13, color: iconColor }} />
                          {dl.date}
                        </div>
                        <div className="mp-ei-actions">
                          <span
                            style={{
                              fontSize: 10.5,
                              fontWeight: 800,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '2px 8px',
                              borderRadius: 999,
                              background: tagBg,
                              color: tagColor,
                              border: `1px solid ${tagBorder}`
                            }}
                          >
                            <Clock style={{ width: 10, height: 10 }} />
                            {daysBadge}
                          </span>
                          <button
                            className="mp-dl-del-btn"
                            title="Delete deadline"
                            onClick={(e) => handleDeleteDeadline(idx, e)}
                          >
                            <Trash2 style={{ width: 12, height: 12 }} />
                          </button>
                        </div>
                      </div>
                      <div>
                        <div className="mp-ei-title">{dl.title}</div>
                        <div className="mp-ei-sub">
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: iconColor, flexShrink: 0 }} />
                          {sub}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Recent Deliverables Card */}
          <div className="mp-card" style={{ padding: '20px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 className="mp-card-title" style={{ fontSize: 15 }}>Recent Deliverables</h3>
              <button
                style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                onClick={() => setActiveTab('Submissions')}
              >
                View All <ArrowRight style={{ width: 12, height: 12 }} />
              </button>
            </div>
            
            <div className="mp-recent-list">
              <div className="mp-recent-item" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('Submissions')}>
                <div className="mp-ri-icon pdf"><FileText style={{ width: 16, height: 16 }} /></div>
                <div>
                  <div className="mp-ri-name">architecture_spec_v2.pdf</div>
                  <div className="mp-ri-proj">{selectedProject.title}</div>
                  <div className="mp-ri-time">Verified deliverable</div>
                </div>
              </div>
              <div className="mp-recent-item" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('Submissions')}>
                <div className="mp-ri-icon img"><ImageIcon style={{ width: 16, height: 16 }} /></div>
                <div>
                  <div className="mp-ri-name">hardware_schematics.png</div>
                  <div className="mp-ri-proj">{selectedProject.title}</div>
                  <div className="mp-ri-time">CAD & Circuit models</div>
                </div>
              </div>
            </div>
          </div>

          {/* Resource Library Banner */}
          <div className="mp-resource-banner">
            <BookOpen style={{ width: 24, height: 24, color: '#16A34A', flexShrink: 0 }} />
            <p style={{ fontSize: 12, color: '#064E3B', fontWeight: 500, lineHeight: 1.5 }}>
              Deployed solutions feed the<br/>
              <strong>Resource Library</strong> — so more teams across India can build on your success.
            </p>
          </div>

        </div>

      </div>



      {/* ── EDIT PROJECT MODAL ── */}
      {showEditModal && typeof document !== 'undefined' && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999, padding: 16, boxSizing: 'border-box' }}>
          <div style={{ background: 'white', padding: 28, borderRadius: 16, width: '100%', maxWidth: 500, maxHeight: 'calc(100vh - 40px)', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', border: '1px solid #E2E8F0', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1E293B' }}>Edit Project Details</h3>
              <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Project Title</label>
                <input
                  type="text"
                  value={editProjectData.title}
                  onChange={e => setEditProjectData({ ...editProjectData, title: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #CBD5E1', borderRadius: 8, fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Description</label>
                <textarea
                  value={editProjectData.description}
                  onChange={e => setEditProjectData({ ...editProjectData, description: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #CBD5E1', borderRadius: 8, fontSize: 12, minHeight: 70 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Project Stage</label>
                  <select
                    value={editProjectData.stage}
                    onChange={e => setEditProjectData({ ...editProjectData, stage: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #CBD5E1', borderRadius: 8, fontSize: 12 }}
                  >
                    {STAGES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Domain / Type</label>
                  <select
                    value={editProjectData.type}
                    onChange={e => setEditProjectData({ ...editProjectData, type: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #CBD5E1', borderRadius: 8, fontSize: 12 }}
                  >
                    <option value="Healthcare">Healthcare</option>
                    <option value="Disaster Management">Disaster Management</option>
                    <option value="Infrastructure">Infrastructure</option>
                    <option value="Environmental Science">Environmental Science</option>
                    <option value="Smart City">Smart City & IoT</option>
                    <option value="Education">Education</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Location</label>
                  <input
                    type="text"
                    value={editProjectData.loc}
                    onChange={e => setEditProjectData({ ...editProjectData, loc: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #CBD5E1', borderRadius: 8, fontSize: 12 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Faculty Mentor Name</label>
                  <input
                    type="text"
                    value={editProjectData.mentorName}
                    onChange={e => setEditProjectData({ ...editProjectData, mentorName: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #CBD5E1', borderRadius: 8, fontSize: 12 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Student Team Members</label>
                <input
                  type="text"
                  value={editProjectData.team}
                  onChange={e => setEditProjectData({ ...editProjectData, team: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #CBD5E1', borderRadius: 8, fontSize: 12 }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => setShowEditModal(false)} style={{ padding: '8px 16px', border: '1px solid #CBD5E1', borderRadius: 8, background: 'white', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                Cancel
              </button>
              <button
                onClick={async () => {
                  const teamArr = editProjectData.team ? editProjectData.team.split(',').map(s => s.trim()).filter(Boolean) : [];
                  const payload = {
                    title: editProjectData.title,
                    description: editProjectData.description,
                    type: editProjectData.type,
                    loc: editProjectData.loc,
                    stage: editProjectData.stage,
                    status: editProjectData.stage,
                    team: teamArr,
                    teamSize: teamArr.length || 4,
                    mentor: {
                      name: editProjectData.mentorName || 'Dr. Rohan Mehta',
                      org: editProjectData.mentorOrg || 'IIT Delhi',
                      initials: (editProjectData.mentorName || 'RM').split(' ').map(w => w[0]).join('').slice(0, 2)
                    }
                  };

                  await fetch(`/api/projects/${currentProjectId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                  });

                  setProjects(prev => prev.map(p => (p._id || p.id) === currentProjectId ? {
                    ...p,
                    ...payload,
                    progress: STAGES.indexOf(editProjectData.stage)
                  } : p));

                  setShowEditModal(false);
                  import('../utils/toast').then(m => m.toast('Project details saved successfully', 'success'));
                }}
                className="mp-btn-primary"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── ADD DEADLINE MODAL ── */}
      {showDeadlineModal && typeof document !== 'undefined' && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999, padding: 16, boxSizing: 'border-box' }}>
          <div style={{ background: 'white', padding: 24, borderRadius: 14, width: '100%', maxWidth: 420, maxHeight: 'calc(100vh - 40px)', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', border: '1px solid #E2E8F0', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1E293B' }}>Add Milestone Deadline</h3>
              <button onClick={() => setShowDeadlineModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Milestone / Event Title</label>
                <input
                  type="text"
                  placeholder="e.g. Edge Hardware Prototype Review"
                  value={newDeadlineData.title}
                  onChange={e => setNewDeadlineData({ ...newDeadlineData, title: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #CBD5E1', borderRadius: 8, fontSize: 12 }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Target Date</label>
                  <input
                    type="text"
                    placeholder="e.g. 25 Sep 2026"
                    value={newDeadlineData.date}
                    onChange={e => setNewDeadlineData({ ...newDeadlineData, date: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #CBD5E1', borderRadius: 8, fontSize: 12 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Priority Tag</label>
                  <input
                    type="text"
                    placeholder="e.g. Critical, Review"
                    value={newDeadlineData.tag}
                    onChange={e => setNewDeadlineData({ ...newDeadlineData, tag: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #CBD5E1', borderRadius: 8, fontSize: 12 }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setShowDeadlineModal(false)} style={{ padding: '7px 14px', border: '1px solid #CBD5E1', borderRadius: 6, background: 'white', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                Cancel
              </button>
              <button onClick={handleAddDeadline} className="mp-btn-primary" style={{ padding: '7px 14px' }}>
                Add Deadline
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── STAGE 6 DEPLOYMENT CELEBRATION MODAL ── */}
      {deploymentCelebration && typeof document !== 'undefined' && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999, padding: 16, boxSizing: 'border-box' }}>
          <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 560, maxHeight: 'calc(100vh - 40px)', overflowY: 'auto', padding: 32, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', border: '2px solid #86EFAC', textAlign: 'center', position: 'relative' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Sparkles style={{ width: 32, height: 32 }} />
            </div>

            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1E293B', marginBottom: 8 }}>
              🎉 Solution Successfully Deployed!
            </h2>
            <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.5, marginBottom: 24, maxWidth: 440, margin: '0 auto 24px' }}>
              Congratulations to team <strong>{(selectedProject.team || []).join(', ') || 'Lead Innovators'}</strong>. Your engineering solution has crossed the campus gate into verified real-world civic impact!
            </p>

            {/* 4 Impact cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, textAlign: 'left', marginBottom: 24 }}>
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 12, borderRadius: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <ShieldCheck style={{ width: 16, height: 16, color: '#16A34A' }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#1E293B' }}>Battle-Tested Resource</span>
                </div>
                <div style={{ fontSize: 11, color: '#64748B' }}>Auto-published to JanSetu Library with verified blueprint.</div>
              </div>

              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 12, borderRadius: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Award style={{ width: 16, height: 16, color: '#2563EB' }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#1E293B' }}>Official Certificates</span>
                </div>
                <div style={{ fontSize: 11, color: '#64748B' }}>Issued to all team members, viewable in Profile.</div>
              </div>

              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 12, borderRadius: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <ThumbsUp style={{ width: 16, height: 16, color: '#D97706' }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#1E293B' }}>Citizen Loop Closed</span>
                </div>
                <div style={{ fontSize: 11, color: '#64748B' }}>Citizen submitter notified to test & leave reviews.</div>
              </div>

              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 12, borderRadius: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Sparkles style={{ width: 16, height: 16, color: '#9333EA' }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#1E293B' }}>+500 Innovation Points</span>
                </div>
                <div style={{ fontSize: 11, color: '#64748B' }}>Awarded for Verified Civic Innovation.</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
              <a href="/university#/profile" className="mp-btn-primary" style={{ textDecoration: 'none' }}>
                <Award style={{ width: 14, height: 14 }} /> View Certificates in Profile
              </a>
              <a href="/university#/resources" className="mp-btn-outline" style={{ textDecoration: 'none' }}>
                <BookOpen style={{ width: 14, height: 14 }} /> Browse Resource Library
              </a>
              <button onClick={() => setDeploymentCelebration(null)} style={{ padding: '8px 16px', border: '1px solid #CBD5E1', borderRadius: 8, background: 'white', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── FILE PREVIEW MODAL ── */}
      {previewFile && typeof document !== 'undefined' && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999, padding: 16, boxSizing: 'border-box' }}>
          <div style={{ background: 'white', borderRadius: 12, width: '100%', maxWidth: 480, maxHeight: 'calc(100vh - 40px)', overflowY: 'auto', padding: 24, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', border: '1px solid #E2E8F0', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText style={{ width: 20, height: 20, color: '#2563EB' }} />
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1E293B' }}>{previewFile.title || 'Deliverable Document'}</h3>
              </div>
              <button onClick={() => setPreviewFile(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: '#1E293B', fontWeight: 600, marginBottom: 6 }}>
                File Path: <span style={{ color: '#2563EB', wordBreak: 'break-all' }}>{previewFile.fileUrl}</span>
              </div>
              <div style={{ fontSize: 11, color: '#64748B', lineHeight: 1.5 }}>
                Status: <strong style={{ color: previewFile.status === 'approved' ? '#16A34A' : '#F97316' }}>{previewFile.status}</strong>
                <br/>
                This file is stored in JanSetu server repository. Click below to view or trigger document download.
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => setPreviewFile(null)} style={{ padding: '8px 16px', border: '1px solid #CBD5E1', borderRadius: 8, background: 'white', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                Close
              </button>
              <a
                href={previewFile.fileUrl}
                target="_blank"
                rel="noreferrer"
                download
                className="mp-btn-primary"
                style={{ textDecoration: 'none' }}
              >
                <Download style={{ width: 14, height: 14 }} /> Download Document
              </a>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── SUBMIT SOLUTION PROPOSAL MODAL ── */}
      {showProposalModal && typeof document !== 'undefined' && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999, padding: 16, boxSizing: 'border-box' }}>
          <div style={{ background: '#FFFFFF', borderRadius: 16, width: '100%', maxWidth: 620, maxHeight: 'calc(100vh - 40px)', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)', border: '1px solid #E2E8F0', padding: 28, position: 'relative' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileText style={{ width: 18, height: 18 }} />
                  </div>
                  <h2 style={{ fontSize: 19, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    {activeProjectProposal ? 'Solution Proposal Details' : 'Submit Solution Proposal'}
                  </h2>
                </div>
                <p style={{ fontSize: 12.5, color: '#64748B', margin: 0 }}>
                  Specify required grant funding and upload requirements write-up for State Admin review and industry partner matching.
                </p>
              </div>
              <button
                onClick={() => setShowProposalModal(false)}
                style={{ background: '#F1F5F9', border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B' }}
              >
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            {/* Current Proposal Status Alerts */}
            {activeProjectProposal && (
              <div style={{ marginBottom: 18 }}>
                {activeProjectProposal.status === 'submitted' && (
                  <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, color: '#92400E', fontSize: 12.5 }}>
                    <Clock style={{ width: 18, height: 18, color: '#D97706', flexShrink: 0 }} />
                    <div>
                      <strong>Proposal Submitted & Under Review:</strong> Sent to State Admin on {new Date(activeProjectProposal.submittedAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}. Project milestones will unlock upon approval.
                    </div>
                  </div>
                )}
                {activeProjectProposal.status === 'approved' && (
                  <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, color: '#065F46', fontSize: 12.5 }}>
                    <CheckCircle style={{ width: 18, height: 18, color: '#10B981', flexShrink: 0 }} />
                    <div>
                      <strong>Proposal Approved by Admin!</strong> Work has been authorized.
                      {activeProjectProposal.adminFeedback && <div style={{ marginTop: 4, fontStyle: 'italic' }}>Feedback: "{activeProjectProposal.adminFeedback}"</div>}
                    </div>
                  </div>
                )}
                {activeProjectProposal.status === 'changes_requested' && (
                  <div style={{ background: '#FFF7ED', border: '1px solid #FDBA74', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: 10, color: '#9A3412', fontSize: 12.5 }}>
                    <AlertTriangle style={{ width: 18, height: 18, color: '#EA580C', flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <strong>Admin Requested Revisions:</strong>
                      <div style={{ marginTop: 4, background: '#FFFFFF', padding: '8px 12px', borderRadius: 6, border: '1px solid #FED7AA', color: '#1E293B', fontWeight: 600 }}>
                        "{activeProjectProposal.adminFeedback || 'Please refine technical deliverables and budget breakdown.'}"
                      </div>
                      <div style={{ marginTop: 4, fontSize: 11.5 }}>Update the fields below and re-submit.</div>
                    </div>
                  </div>
                )}
                {activeProjectProposal.status === 'rejected' && (
                  <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: 10, color: '#991B1B', fontSize: 12.5 }}>
                    <X style={{ width: 18, height: 18, color: '#DC2626', flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <strong>Proposal Rejected:</strong>
                      <div style={{ marginTop: 4, background: '#FFFFFF', padding: '8px 12px', borderRadius: 6, border: '1px solid #FCA5A5', color: '#1E293B' }}>
                        "{activeProjectProposal.adminFeedback || 'Proposal does not meet state innovation criteria.'}"
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {(() => {
              const isReadOnly = (activeProjectProposal?.status === 'submitted' || activeProjectProposal?.status === 'approved' || selectedProject.proposalStatus === 'submitted' || selectedProject.proposalStatus === 'approved') && activeProjectProposal?.status !== 'changes_requested';

              if (isReadOnly) {
                return (
                  <div>
                    {/* Linked Project Summary */}
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '12px 16px', marginBottom: 18 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Target Project</div>
                      <div style={{ fontSize: 14, fontWeight: 750, color: '#0F172A' }}>{selectedProject.title}</div>
                      <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 11.5, color: '#64748B' }}>
                        <span>Domain: <strong>{selectedProject.type || 'Innovation'}</strong></span>
                        <span>•</span>
                        <span>Mentor: <strong>{selectedProject.mentor?.name || 'Dr. Rohan Mehta'}</strong></span>
                      </div>
                    </div>

                    {/* 1. Funding Amount - Read Only Display */}
                    <div style={{ marginBottom: 18 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                        Funding Amount Requested
                      </div>
                      <div style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                          <span style={{ fontSize: 15, fontWeight: 800, color: '#64748B' }}>₹</span>
                          <span style={{ fontSize: 22, fontWeight: 850, color: '#0F172A' }}>
                            {Number(proposalData.fundingRequested || activeProjectProposal?.fundingRequested || selectedProject.fundingSummary?.goal || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#EFF6FF', color: '#1D4ED8', fontSize: 11, fontWeight: 750, padding: '4px 10px', borderRadius: 999, border: '1px solid #BFDBFE' }}>
                          <Lock style={{ width: 12, height: 12 }} /> Submitted & Locked
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>
                        Estimated total capital requested for component procurement, sensor fabrication, and testing.
                      </div>
                    </div>

                    {/* 2. Requirements Document - Read Only File Card */}
                    <div style={{ marginBottom: 18 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                        Submitted Technical Requirements Document
                      </div>
                      <div style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                          <div style={{ width: 40, height: 40, borderRadius: 8, background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <FileText style={{ width: 22, height: 22 }} />
                          </div>
                          <div style={{ minWidth: 0, overflow: 'hidden' }}>
                            <div style={{ fontSize: 13, fontWeight: 750, color: '#0F172A', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                              {activeProjectProposal?.requirementsDocument?.originalName || proposalData.documentPreviewName || 'Proposal_Requirements_Document.pdf'}
                            </div>
                            <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                              Submitted deliverable write-up • Locked for Admin Review
                            </div>
                          </div>
                        </div>

                        {activeProjectProposal?.requirementsDocument?.url ? (
                          <a
                            href={activeProjectProposal.requirementsDocument.url}
                            target="_blank"
                            rel="noreferrer"
                            download
                            className="mp-btn-primary"
                            style={{ textDecoration: 'none', padding: '7px 14px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', flexShrink: 0 }}
                          >
                            <Download style={{ width: 13, height: 13 }} /> Download Document
                          </a>
                        ) : (
                          <span style={{ fontSize: 11.5, color: '#2563EB', fontWeight: 700, flexShrink: 0 }}>✓ Document Stored</span>
                        )}
                      </div>
                    </div>

                    {/* 3. Industry Support Categories Required - Read Only Pills */}
                    <div style={{ marginBottom: 24 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 8 }}>
                        Industry Support Categories Requested
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {(proposalData.industrySupportRequired && proposalData.industrySupportRequired.length > 0
                          ? proposalData.industrySupportRequired
                          : (activeProjectProposal?.industrySupportRequired || ['Funding', 'Mentorship', 'Testing Facility'])
                        ).map(cat => (
                          <span
                            key={cat}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '6px 12px',
                              borderRadius: 999,
                              border: '1px solid #BFDBFE',
                              background: '#EFF6FF',
                              fontSize: 12,
                              fontWeight: 700,
                              color: '#1D4ED8'
                            }}
                          >
                            ✓ {cat}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Read Only Modal Footer - Re-submission Disabled */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTop: '1px solid #E2E8F0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#64748B' }}>
                        <Lock style={{ width: 13, height: 13, color: '#94A3B8' }} />
                        <span>Proposal is under review by State Admin. Re-submissions are locked.</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowProposalModal(false)}
                        className="mp-btn-primary"
                        style={{ padding: '8px 20px', fontSize: 12.5, fontWeight: 750, background: '#0F172A', borderColor: '#0F172A', cursor: 'pointer' }}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                /* Editable Proposal Form (when not submitted yet or revisions requested by Admin) */
                <form onSubmit={handleProposalSubmit}>
                  {/* Linked Project Summary */}
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '12px 16px', marginBottom: 18 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Target Project</div>
                    <div style={{ fontSize: 14, fontWeight: 750, color: '#0F172A' }}>{selectedProject.title}</div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 11.5, color: '#64748B' }}>
                      <span>Domain: <strong>{selectedProject.type || 'Innovation'}</strong></span>
                      <span>•</span>
                      <span>Mentor: <strong>{selectedProject.mentor?.name || 'Dr. Rohan Mehta'}</strong></span>
                    </div>
                  </div>

                  {/* 1. Funding Amount */}
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 750, color: '#1E293B', marginBottom: 6 }}>
                      Funding Amount Requested (INR ₹) <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <span style={{ position: 'absolute', left: 14, fontSize: 15, fontWeight: 800, color: '#64748B' }}>₹</span>
                      <input
                        type="number"
                        min="1"
                        step="1000"
                        required
                        placeholder="e.g. 500000"
                        value={proposalData.fundingRequested}
                        onChange={e => setProposalData({ ...proposalData, fundingRequested: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 14px 10px 32px',
                          fontSize: 14,
                          fontWeight: 650,
                          border: '1.5px solid #CBD5E1',
                          borderRadius: 8,
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                    <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>
                      Estimated total capital required for component procurement, sensor fabrication, and testing.
                    </div>
                  </div>

                  {/* 2. Requirements Document Upload */}
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 750, color: '#1E293B', marginBottom: 6 }}>
                      Proposal & Technical Requirements Document <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <div style={{ border: '2px dashed #CBD5E1', borderRadius: 10, padding: 16, background: '#F8FAFC', textAlign: 'center', position: 'relative' }}>
                      <input
                        type="file"
                        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        onChange={handleProposalFileChange}
                        style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
                      />
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, pointerEvents: 'none' }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Upload style={{ width: 20, height: 20 }} />
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>
                          {proposalData.documentPreviewName ? (
                            <span style={{ color: '#2563EB' }}>{proposalData.documentPreviewName}</span>
                          ) : (
                            'Click to upload or drag and drop proposal document'
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: '#64748B' }}>
                          {proposalData.documentPreviewSize ? (
                            <span>Selected Size: {proposalData.documentPreviewSize}</span>
                          ) : (
                            'Strictly PDF (.pdf) or Word (.docx) documents up to 10MB'
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Existing Document Info */}
                    {activeProjectProposal?.requirementsDocument?.url && !proposalData.requirementsDocument && (
                      <div style={{ marginTop: 8, background: '#EFF6FF', padding: '8px 12px', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#1D4ED8', fontWeight: 600 }}>
                          <FileText style={{ width: 14, height: 14 }} />
                          <span>Current File: {activeProjectProposal.requirementsDocument.originalName || 'Uploaded Proposal'}</span>
                        </div>
                        <a
                          href={activeProjectProposal.requirementsDocument.url}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: '#2563EB', fontWeight: 700, textDecoration: 'none', fontSize: 11.5 }}
                        >
                          Download Document →
                        </a>
                      </div>
                    )}
                  </div>

                  {/* 3. Industry Support Categories Required */}
                  <div style={{ marginBottom: 24 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 750, color: '#1E293B', marginBottom: 4 }}>
                      Industry Support Categories Required <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <div style={{ fontSize: 11, color: '#64748B', marginBottom: 10 }}>
                      Select all support types needed from industry partners (used for eligibility matching algorithms):
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                      {[
                        'Funding',
                        'Mentorship',
                        'Equipment',
                        'Raw Materials',
                        'Testing Facility',
                        'Infrastructure',
                        'Domain Expertise',
                        'Software/Cloud Credits',
                        'Other'
                      ].map(cat => {
                        const isChecked = proposalData.industrySupportRequired.includes(cat);
                        return (
                          <label
                            key={cat}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              padding: '8px 10px',
                              borderRadius: 8,
                              border: isChecked ? '1.5px solid #2563EB' : '1px solid #E2E8F0',
                              background: isChecked ? '#EFF6FF' : '#FFFFFF',
                              cursor: 'pointer',
                              fontSize: 12,
                              fontWeight: isChecked ? 700 : 500,
                              color: isChecked ? '#1D4ED8' : '#334155',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleSupportCheckboxToggle(cat)}
                              style={{ accentColor: '#2563EB', cursor: 'pointer' }}
                            />
                            <span>{cat}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Modal Actions */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid #E2E8F0' }}>
                    <button
                      type="button"
                      onClick={() => setShowProposalModal(false)}
                      style={{ padding: '9px 18px', border: '1px solid #CBD5E1', borderRadius: 8, background: 'white', color: '#475569', fontSize: 13, fontWeight: 650, cursor: 'pointer' }}
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingProposal}
                      className="mp-btn-primary"
                      style={{
                        padding: '9px 20px',
                        fontSize: 13,
                        fontWeight: 750,
                        background: '#2563EB',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        cursor: isSubmittingProposal ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {isSubmittingProposal ? (
                        <>Submitting Proposal...</>
                      ) : (
                        <>
                          <Send style={{ width: 14, height: 14 }} />
                          {activeProjectProposal?.status === 'changes_requested' ? 'Re-Submit Proposal' : 'Submit to Admin'}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              );
            })()}
          </div>
        </div>,
        document.body
      )}

      {/* ── ASSIGNED INDUSTRY & GRANT DETAILS MODAL (i) ── */}
      {showIndustryInfoModal && typeof document !== 'undefined' && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999, padding: 16, boxSizing: 'border-box' }}>
          <div style={{ background: '#FFFFFF', borderRadius: 16, width: '100%', maxWidth: 540, maxHeight: 'calc(100vh - 40px)', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)', border: '1px solid #E2E8F0', padding: 28, position: 'relative' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 style={{ width: 22, height: 22 }} />
                </div>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    Assigned Industry & Grant
                  </h2>
                  <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>
                    Corporate partnership & institutional support profile
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowIndustryInfoModal(false)}
                style={{ background: '#F1F5F9', border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B' }}
              >
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            {/* Content Conditioned on Project / Proposal State */}
            {(() => {
              const partner = (selectedProject.assignedIndustryDetails && (selectedProject.assignedIndustryDetails.name || selectedProject.assignedIndustryDetails.companyName))
                ? selectedProject.assignedIndustryDetails
                : (activeProjectProposal?.assignedIndustry && (activeProjectProposal.assignedIndustry.name || activeProjectProposal.assignedIndustry.companyName))
                  ? activeProjectProposal.assignedIndustry
                  : null;

              const isApproved = selectedProject.proposalStatus === 'approved' || activeProjectProposal?.status === 'approved';
              const reviewerName = activeProjectProposal?.reviewedBy?.name || 'Dr. Admin (State Innovation Command)';
              const reviewerRole = activeProjectProposal?.reviewedBy?.role ? (activeProjectProposal.reviewedBy.role === 'admin' ? 'State Innovation Council / Admin' : activeProjectProposal.reviewedBy.role) : 'State Innovation Council / Admin';
              const reviewDate = activeProjectProposal?.reviewedAt
                ? new Date(activeProjectProposal.reviewedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                : '13 Sept 2026';
              const reviewComment = activeProjectProposal?.reviewComment;
              const fundingAmount = Number(partner?.fundingCommitted || activeProjectProposal?.fundingRequested || selectedProject.fundingSummary?.goal || 50001).toLocaleString('en-IN');

              return (
                <div>
                  {/* Admin Approval Audit Card ("Kisne kiya") */}
                  {isApproved && (
                    <div style={{ background: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>
                            🛡️
                          </div>
                          <div>
                            <div style={{ fontSize: 10.5, fontWeight: 800, color: '#15803D', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Proposal Review & Governance</div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: '#065F46' }}>Approved by State Admin</div>
                          </div>
                        </div>
                        <span style={{ background: '#DCFCE7', color: '#15803D', fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 999, border: '1px solid #86EFAC' }}>
                          ✓ Officially Approved
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12 }}>
                        <div>
                          <span style={{ color: '#64748B', fontSize: 11 }}>Reviewed & Approved By:</span>
                          <div style={{ fontWeight: 750, color: '#1E293B' }}>{reviewerName}</div>
                          <div style={{ fontSize: 10.5, color: '#059669' }}>{reviewerRole}</div>
                        </div>
                        <div>
                          <span style={{ color: '#64748B', fontSize: 11 }}>Approval Date:</span>
                          <div style={{ fontWeight: 750, color: '#1E293B' }}>{reviewDate}</div>
                          <div style={{ fontSize: 10.5, color: '#64748B' }}>Authorized for Grants</div>
                        </div>
                        {reviewComment && (
                          <div style={{ gridColumn: 'span 2', marginTop: 4, background: 'rgba(255,255,255,0.85)', padding: '8px 12px', borderRadius: 8, border: '1px solid #DCFCE7' }}>
                            <span style={{ color: '#15803D', fontSize: 11, fontWeight: 750 }}>Admin Note: </span>
                            <span style={{ color: '#1E293B', fontSize: 12 }}>"{reviewComment}"</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Partner Card if Assigned */}
                  {partner ? (
                    <div>
                      <div style={{ background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)', border: '1.5px solid #BFDBFE', borderRadius: 12, padding: 18, marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                          <div>
                            <div style={{ fontSize: 10.5, fontWeight: 800, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Corporate & CSR Partner</div>
                            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: '2px 0 0 0' }}>{partner.companyName || partner.name}</h3>
                          </div>
                          <span style={{ background: '#DCFCE7', color: '#15803D', fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 999, border: '1px solid #86EFAC' }}>
                            ✓ Assigned Partner
                          </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12, fontSize: 12 }}>
                          <div>
                            <span style={{ color: '#64748B', fontSize: 11 }}>Domain / Sector:</span>
                            <div style={{ fontWeight: 700, color: '#1E293B' }}>{partner.sector || partner.domain || 'CSR & Infrastructure'}</div>
                          </div>
                          <div>
                            <span style={{ color: '#64748B', fontSize: 11 }}>Location:</span>
                            <div style={{ fontWeight: 700, color: '#1E293B' }}>{partner.location?.city ? `${partner.location.city}, ${partner.location.state || 'Jharkhand'}` : (typeof partner.location === 'string' ? partner.location : 'Jamshedpur, Jharkhand')}</div>
                          </div>
                          <div>
                            <span style={{ color: '#64748B', fontSize: 11 }}>Industry SPOC / Contact:</span>
                            <div style={{ fontWeight: 700, color: '#1E293B' }}>{partner.spocName || (partner.name ? partner.name + ' Representative' : 'Corporate CSR Lead')}</div>
                          </div>
                          <div>
                            <span style={{ color: '#64748B', fontSize: 11 }}>Contact Email:</span>
                            <div style={{ fontWeight: 700, color: '#2563EB' }}>{partner.contactEmail || partner.contact?.email || partner.spocEmail || 'foundation@tatasteel.com'}</div>
                          </div>
                          {(partner.contactPhone || partner.contact?.phone) ? (
                            <div>
                              <span style={{ color: '#64748B', fontSize: 11 }}>Phone / Helpline:</span>
                              <div style={{ fontWeight: 700, color: '#1E293B' }}>{partner.contactPhone || partner.contact?.phone}</div>
                            </div>
                          ) : null}
                          {(partner.website || partner.contact?.website) ? (
                            <div>
                              <span style={{ color: '#64748B', fontSize: 11 }}>Portal / Website:</span>
                              <div>
                                <a href={partner.website || partner.contact?.website} target="_blank" rel="noreferrer" style={{ fontWeight: 700, color: '#2563EB', textDecoration: 'none' }}>
                                  Visit Website ↗
                                </a>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>

                      {/* Grant Committed */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                        <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '12px 14px' }}>
                          <div style={{ fontSize: 11, color: '#15803D', fontWeight: 700 }}>Committed Grant Amount</div>
                          <div style={{ fontSize: 20, fontWeight: 850, color: '#166534', marginTop: 2 }}>
                            ₹{fundingAmount}
                          </div>
                          <div style={{ fontSize: 10.5, color: '#15803D', marginTop: 2 }}>Authorized for deployment</div>
                        </div>

                        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '12px 14px' }}>
                          <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700 }}>Industry Support Offered</div>
                          <div style={{ fontSize: 13, fontWeight: 750, color: '#1E293B', marginTop: 4 }}>
                            {Array.isArray(partner.capabilitiesProvided || partner.capabilities) ? (partner.capabilitiesProvided || partner.capabilities).slice(0, 2).join(', ') : 'Testing & Mentorship'}
                          </div>
                          <div style={{ fontSize: 10.5, color: '#64748B', marginTop: 2 }}>Specialized facilities unlocked</div>
                        </div>
                      </div>

                      {/* Capabilities Provided Badges */}
                      {(partner.capabilitiesProvided || partner.capabilities) && (
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ fontSize: 11.5, fontWeight: 750, color: '#475569', marginBottom: 6 }}>Support Capabilities & Facilities:</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {(partner.capabilitiesProvided || partner.capabilities).map((cap, i) => (
                              <span key={i} style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 650, color: '#334155' }}>
                                ✓ {cap}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : isApproved ? (
                    <div style={{ textAlign: 'center', padding: '20px 16px', background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                      <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                        <Clock style={{ width: 24, height: 24 }} />
                      </div>
                      <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>
                        Industry Partner Matching Underway
                      </h3>
                      <p style={{ fontSize: 12, color: '#64748B', maxWidth: 420, margin: '0 auto 14px', lineHeight: 1.5 }}>
                        State Admin has approved your grant request of <strong>₹{fundingAmount}</strong>. Admin is reviewing eligible partners (Tata Steel Foundation, Apex Engineering, Jharkhand Startup Hub) to formally allocate mentorship & facility access.
                      </p>
                      <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: '10px 14px', fontSize: 11.5, color: '#1E40AF', textAlign: 'left' }}>
                        💡 <strong>Real-time Update:</strong> As soon as Admin confirms the industry match in the Admin Command Center, their full verified contact card will appear here automatically.
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '24px 16px' }}>
                      <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                        <Clock style={{ width: 28, height: 28 }} />
                      </div>
                      <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>
                        No Industry Partner Assigned Yet
                      </h3>
                      <p style={{ fontSize: 12.5, color: '#64748B', maxWidth: 380, margin: '0 auto 16px', lineHeight: 1.5 }}>
                        Industry partner matching and grant authorization occur after your solution proposal is reviewed and approved by the State Innovation Council.
                      </p>
                      <button
                        onClick={() => { setShowIndustryInfoModal(false); setShowProposalModal(true); }}
                        className="mp-btn-primary"
                        style={{ margin: '0 auto' }}
                      >
                        <FileText style={{ width: 14, height: 14 }} /> Open Proposal Details
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
              <button
                onClick={() => setShowIndustryInfoModal(false)}
                style={{ padding: '8px 18px', border: '1px solid #CBD5E1', borderRadius: 8, background: 'white', color: '#475569', fontSize: 12.5, fontWeight: 650, cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Deliverable Document / Artifact Preview Modal */}
      {previewFile && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 16, width: '100%', maxWidth: 540, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
                  <FileText style={{ width: 20, height: 20 }} />
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    {previewFile.title || 'Submitted Deliverable Artifact'}
                  </h3>
                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                    Verified Project Submission Record
                  </div>
                </div>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748B', padding: 6, borderRadius: 6 }}
              >
                <X style={{ width: 20, height: 20 }} />
              </button>
            </div>

            <div style={{ padding: '22px' }}>
              <div style={{ background: '#F8FAFC', borderRadius: 10, padding: 16, border: '1px solid #E2E8F0', marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>FILE SPECIFICATION</div>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: '#1E293B', wordBreak: 'break-all' }}>
                  {previewFile.fileUrl ? previewFile.fileUrl.split('/').pop() : `${(previewFile.name || 'deliverable')}_spec.pdf`}
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 11.5, color: '#64748B' }}>
                  <span>Status: <strong style={{ color: '#16A34A' }}>✓ Verified & Approved</strong></span>
                  <span>•</span>
                  <span>Type: <strong>Technical Deliverable</strong></span>
                </div>
              </div>

              <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 20 }}>
                <CheckCircle style={{ width: 18, height: 18, color: '#10B981', flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: 12, color: '#065F46', lineHeight: 1.5 }}>
                  <strong>Milestone Verified:</strong> This deliverable was reviewed and approved according to National Innovation Standards. It is archived in the JanSetu repository.
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  onClick={() => setPreviewFile(null)}
                  style={{ padding: '8px 18px', border: '1px solid #CBD5E1', borderRadius: 8, background: 'white', color: '#475569', fontSize: 12.5, fontWeight: 650, cursor: 'pointer' }}
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    if (previewFile.fileUrl && previewFile.fileUrl.startsWith('http')) window.open(previewFile.fileUrl, '_blank');
                    else alert('Demo artifact: File simulated in prototype environment.');
                  }}
                  className="mp-btn-primary"
                  style={{ padding: '8px 20px', fontSize: 12.5, fontWeight: 750, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Download style={{ width: 14, height: 14 }} /> Download Document
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── HISTORICAL SUBMISSION & DEPLOYMENT MODAL CARD (FRONT OVERLAY) ── */}
      {showHistoryModal && typeof document !== 'undefined' && (() => {
        const deployedProjectsList = projects.filter(isProjectDeployed);
        const activeHistoryProject = projects.find(p => (p._id || p.id) === selectedHistoryProjectId) || deployedProjectsList[0] || selectedProject;
        const historyCat = getCategoryDetails(activeHistoryProject?.type);
        const HistoryCatIcon = historyCat.icon;
        const historyMilestones = activeHistoryProject?.milestones && activeHistoryProject.milestones.length > 0
          ? activeHistoryProject.milestones
          : [
              { name: 'proposal', title: '1. Technical Proposal & Requirements Spec', status: 'approved', fileUrl: '/uploads/solar_water_proposal.pdf', approvedAt: '14 Nov 2025' },
              { name: 'prototype', title: '2. Working Solar Filtration Prototype', status: 'approved', fileUrl: '/uploads/prototype_schematics.pdf', approvedAt: '22 Dec 2025' },
              { name: 'report', title: '3. Field Water Quality Validation Report', status: 'approved', fileUrl: '/uploads/neeri_test_report.pdf', approvedAt: '28 Jan 2026' },
              { name: 'video', title: '4. Ground Deployment Pilot & Citizen Verification', status: 'approved', fileUrl: '/uploads/ground_deployment_pilot.mp4', approvedAt: '12 Feb 2026' }
            ];

        return createPortal(
          <div
            style={{
              position: 'fixed',
              inset: 0,
              width: '100vw',
              height: '100vh',
              background: 'rgba(15, 23, 42, 0.78)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              zIndex: 999999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px 16px',
              boxSizing: 'border-box',
              animation: 'fadeIn 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onClick={() => setShowHistoryModal(false)}
          >
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: 24,
                width: '100%',
                maxWidth: 960,
                maxHeight: 'calc(100vh - 48px)',
                overflowY: 'auto',
                boxShadow: '0 25px 60px -12px rgba(15, 23, 42, 0.35), 0 0 0 1px rgba(226, 232, 240, 0.9), 0 16px 40px rgba(16, 185, 129, 0.12)',
                position: 'relative',
                border: '1.5px solid #BBF7D0',
                display: 'flex',
                flexDirection: 'column'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top Accent Strip with National Tricolor Subtle Micro-Ribbon */}
              <div style={{ height: 4, width: '100%', background: 'linear-gradient(90deg, #FF9933 0%, #FFFFFF 50%, #138808 100%)', flexShrink: 0 }} />

              {/* ── TOP HEADER TOOLBAR: Switch Deployed Solution & Quick Close ── */}
              {deployedProjectsList.length > 1 && (
                <div
                  style={{
                    background: 'linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)',
                    borderBottom: '1.5px solid #E2E8F0',
                    padding: '12px 28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    flexWrap: 'wrap'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: '#DCFCE7', border: '1px solid #86EFAC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#15803D' }}>
                      <FileArchive style={{ width: 18, height: 18 }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', color: '#059669', letterSpacing: '0.08em' }}>
                        DEPLOYED SOLUTIONS ARCHIVE
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>Switch Deployed Solution</span>
                        <span style={{ fontSize: 11, fontWeight: 800, background: '#DCFCE7', color: '#15803D', padding: '1px 8px', borderRadius: 999, border: '1px solid #86EFAC' }}>
                          {deployedProjectsList.length} Deployed
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Dropdown Selector & Close Button */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 280, maxWidth: 620, justifyContent: 'flex-end' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
                      <select
                        value={activeHistoryProject?._id || activeHistoryProject?.id}
                        onChange={(e) => setSelectedHistoryProjectId(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '9px 38px 9px 14px',
                          borderRadius: 10,
                          border: '1.5px solid #86EFAC',
                          fontSize: 12.5,
                          fontWeight: 750,
                          color: '#064E3B',
                          background: '#FFFFFF',
                          cursor: 'pointer',
                          outline: 'none',
                          boxShadow: '0 2px 8px rgba(22, 163, 74, 0.08)',
                          appearance: 'none',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden'
                        }}
                      >
                        {deployedProjectsList.map(p => (
                          <option key={p._id || p.id} value={p._id || p.id}>
                            {p.title} — {formatProjectLocation(p.loc)}
                          </option>
                        ))}
                      </select>
                      <ChevronDown style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#16A34A', pointerEvents: 'none' }} />
                    </div>

                    <button
                      onClick={() => setShowHistoryModal(false)}
                      style={{
                        background: '#FFFFFF',
                        border: '1.5px solid #CBD5E1',
                        borderRadius: 10,
                        padding: '9px 16px',
                        fontSize: 12.5,
                        fontWeight: 800,
                        color: '#475569',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                        transition: 'all 0.15s ease',
                        outline: 'none',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = '#F1F5F9';
                        e.currentTarget.style.borderColor = '#94A3B8';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = '#FFFFFF';
                        e.currentTarget.style.borderColor = '#CBD5E1';
                      }}
                      title="Close Dossier"
                    >
                      <X style={{ width: 15, height: 15, color: '#475569' }} />
                      <span>Close</span>
                    </button>
                  </div>
                </div>
              )}

              <div style={{ padding: '28px 34px' }}>
                {/* Top Row: Domain Badge, Title, Verification Chips & DEPLOYED ON Box */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, marginBottom: 24, flexWrap: 'wrap', borderBottom: '1.5px solid #F1F5F9', paddingBottom: 22 }}>
                  <div style={{ display: 'flex', gap: 18, flex: 1, minWidth: 320 }}>
                    {/* Modern 3D Domain Badge Box with Vibrant Gradient */}
                    <div
                      style={{
                        background: historyCat.bg,
                        width: 72,
                        height: 72,
                        borderRadius: 20,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: '0 10px 24px -4px rgba(16, 185, 129, 0.35), 0 0 0 1px rgba(255,255,255,0.4) inset'
                      }}
                    >
                      <HistoryCatIcon style={{ width: 32, height: 32, color: 'white' }} />
                      <span style={{ fontSize: 9.5, fontWeight: 800, color: 'white', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{historyCat.label}</span>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Status Badges Row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#DCFCE7', color: '#15803D', padding: '5px 14px', borderRadius: 999, fontSize: 11.5, fontWeight: 800, border: '1.5px solid #86EFAC', boxShadow: '0 2px 8px rgba(22,163,74,0.12)' }}>
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#16A34A', display: 'inline-block', boxShadow: '0 0 8px #16A34A' }} />
                          <span>Solution Deployed & Active on Ground</span>
                        </span>
                        {activeHistoryProject.isBattleTested && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#ECFDF5', color: '#047857', fontSize: 11, fontWeight: 800, padding: '5px 12px', borderRadius: 999, border: '1px solid #A7F3D0' }}>
                            <ShieldCheck style={{ width: 13, height: 13, color: '#10B981' }} /> Battle-Tested Blueprint
                          </span>
                        )}
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#EFF6FF', color: '#1D4ED8', fontSize: 11, fontWeight: 800, padding: '5px 12px', borderRadius: 999, border: '1px solid #BFDBFE' }}>
                          <CheckCircle style={{ width: 13, height: 13, color: '#2563EB' }} /> Proposal Approved
                        </span>
                      </div>

                      {/* Project Title */}
                      <h2 style={{ fontSize: 23, fontWeight: 900, color: '#0F172A', margin: '0 0 8px 0', lineHeight: 1.3, letterSpacing: '-0.02em' }}>
                        {activeHistoryProject.title || 'Deployed Project Dossier'}
                      </h2>

                      {/* Meta Chips */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 12, color: '#475569', fontWeight: 650 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#F8FAFC', padding: '4px 10px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                          <Building2 style={{ width: 13, height: 13, color: '#059669' }} /> {activeHistoryProject.type || 'Infrastructure'}
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#F8FAFC', padding: '4px 10px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                          <MapPin style={{ width: 13, height: 13, color: '#059669' }} /> {formatProjectLocation(activeHistoryProject.loc)}
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#F8FAFC', padding: '4px 10px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                          <Users style={{ width: 13, height: 13, color: '#059669' }} /> Team: {(activeHistoryProject.team || []).join(', ') || 'Lead Innovators'}
                        </span>
                      </div>

                      <p style={{ fontSize: 13, color: '#334155', margin: '10px 0 0 0', lineHeight: 1.6 }}>
                        {activeHistoryProject.description || 'Engineering innovation developed by student researchers addressing verified civic challenges.'}
                      </p>
                    </div>
                  </div>

                  {/* Right Side: Sleek Executive "DEPLOYED ON" Badge & Standalone Close (if only 1 project) */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexShrink: 0 }}>
                    {/* Executive DEPLOYED ON Card */}
                    <div
                      style={{
                        background: 'linear-gradient(135deg, #F0FDF4 0%, #FFFFFF 100%)',
                        border: '1.5px solid #86EFAC',
                        borderRadius: 16,
                        padding: '14px 22px',
                        textAlign: 'right',
                        boxShadow: '0 6px 18px rgba(22, 163, 74, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.9) inset',
                        minWidth: 165
                      }}
                    >
                      <div style={{ fontSize: 10.5, fontWeight: 900, textTransform: 'uppercase', color: '#059669', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 5 }}>
                        <span style={{ fontSize: 12 }}>🗓️</span>
                        <span>DEPLOYED ON</span>
                      </div>
                      <div style={{ fontSize: 19, fontWeight: 950, color: '#064E3B', marginTop: 4, letterSpacing: '-0.02em' }}>
                        {formatProjectDeployedDate(activeHistoryProject)}
                      </div>
                      <div style={{ fontSize: 11.5, color: '#15803D', fontWeight: 700, marginTop: 3, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                        <MapPin style={{ width: 12, height: 12, color: '#16A34A' }} />
                        <span>{formatProjectLocation(activeHistoryProject.loc)}</span>
                      </div>
                    </div>

                    {deployedProjectsList.length <= 1 && (
                      <button
                        onClick={() => setShowHistoryModal(false)}
                        style={{
                          background: '#F8FAFC',
                          border: '1.5px solid #CBD5E1',
                          borderRadius: 14,
                          padding: '12px 18px',
                          fontSize: 13,
                          fontWeight: 800,
                          color: '#334155',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                          transition: 'all 0.18s ease',
                          outline: 'none'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = '#F1F5F9';
                          e.currentTarget.style.borderColor = '#94A3B8';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = '#F8FAFC';
                          e.currentTarget.style.borderColor = '#CBD5E1';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                        title="Close History Card"
                      >
                        <X style={{ width: 16, height: 16, color: '#475569' }} />
                        <span>Close</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 4 Impact Telemetry Badges with Modern Gradient Styling */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 26 }}>
                  <div style={{ background: 'linear-gradient(135deg, #ECFDF5 0%, #FFFFFF 100%)', padding: '16px 18px', borderRadius: 16, border: '1.5px solid #A7F3D0', boxShadow: '0 2px 10px rgba(16,185,129,0.06)' }}>
                    <div style={{ fontSize: 10, color: '#059669', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase' }}>CIVIC DEPLOYMENT</div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: '#064E3B', marginTop: 4 }}>Live in Civic Ward</div>
                    <div style={{ fontSize: 11.5, color: '#15803D', marginTop: 3, fontWeight: 650 }}>✓ Citizen & Admin Verified</div>
                  </div>

                  <div style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #FFFFFF 100%)', padding: '16px 18px', borderRadius: 16, border: '1.5px solid #BFDBFE', boxShadow: '0 2px 10px rgba(37,99,235,0.06)' }}>
                    <div style={{ fontSize: 10, color: '#2563EB', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase' }}>OFFICIAL CERTIFICATION</div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: '#1E293B', marginTop: 4 }}>Certificates Issued</div>
                    <div style={{ fontSize: 11.5, color: '#1D4ED8', marginTop: 3, fontWeight: 650 }}>Awarded to {(activeHistoryProject.team || []).length || 4} student innovators</div>
                  </div>

                  <div style={{ background: 'linear-gradient(135deg, #FFF7ED 0%, #FFFFFF 100%)', padding: '16px 18px', borderRadius: 16, border: '1.5px solid #FED7AA', boxShadow: '0 2px 10px rgba(249,115,22,0.06)' }}>
                    <div style={{ fontSize: 10, color: '#EA580C', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase' }}>NATIONAL IMPACT</div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: '#7C2D12', marginTop: 4 }}>+500 Innovation Pts</div>
                    <div style={{ fontSize: 11.5, color: '#C2410C', marginTop: 3, fontWeight: 650 }}>Awarded to University</div>
                  </div>

                  <div style={{ background: 'linear-gradient(135deg, #F5F3FF 0%, #FFFFFF 100%)', padding: '16px 18px', borderRadius: 16, border: '1.5px solid #DDD6FE', boxShadow: '0 2px 10px rgba(124,58,237,0.06)' }}>
                    <div style={{ fontSize: 10, color: '#7C3AED', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase' }}>RESOURCE REPOSITORY</div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: '#4C1D95', marginTop: 4 }}>Battle-Tested Model</div>
                    <div style={{ fontSize: 11.5, color: '#6D28D9', marginTop: 3, fontWeight: 650 }}>Archived in State Library</div>
                  </div>
                </div>

                {/* Submitted Deliverables Section */}
                <div style={{ borderTop: '1.5px solid #F1F5F9', paddingTop: 22 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 900, color: '#0F172A', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16A34A' }}>
                        <FileText style={{ width: 16, height: 16 }} />
                      </div>
                      <span>Verified Deliverables & Solution Dossier</span>
                    </h4>
                    <span style={{ fontSize: 11.5, color: '#047857', fontWeight: 800, background: '#DCFCE7', padding: '4px 12px', borderRadius: 999, border: '1px solid #86EFAC' }}>
                      {historyMilestones.length + 1} Verified Deliverables
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {/* 1. Proposal Requirements Document Submitted */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px 20px',
                        background: '#FFFFFF',
                        border: '1.5px solid #E2E8F0',
                        borderRadius: 14,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                        transition: 'all 0.18s ease'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = '#93C5FD';
                        e.currentTarget.style.boxShadow = '0 4px 14px rgba(37,99,235,0.08)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = '#E2E8F0';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.03)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: '#EFF6FF', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB', flexShrink: 0 }}>
                          <FileText style={{ width: 22, height: 22 }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 850, color: '#0F172A' }}>
                            Solution Requirements Document & Funding Proposal
                          </div>
                          <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 3 }}>
                            File: <strong style={{ color: '#1E293B' }}>{activeHistoryProject.requirementsDocName || activeProjectProposal?.documentName || 'Technical_Solution_Proposal.pdf'}</strong> • Grant: <strong style={{ color: '#047857' }}>₹{Number(activeProjectProposal?.fundingRequested || activeHistoryProject.fundingSummary?.goal || 72000).toLocaleString('en-IN')}</strong> • <span style={{ color: '#15803D', fontWeight: 750 }}>✓ State Admin Approved</span>
                          </div>
                        </div>
                      </div>
                      <button
                        className="mp-btn-outline"
                        style={{
                          padding: '8px 18px',
                          fontSize: 12.5,
                          fontWeight: 750,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          background: '#EFF6FF',
                          borderColor: '#93C5FD',
                          color: '#1D4ED8',
                          borderRadius: 9,
                          transition: 'all 0.15s ease'
                        }}
                        onClick={() => setShowProposalModal(true)}
                      >
                        <ExternalLink style={{ width: 13, height: 13 }} /> View Proposal
                      </button>
                    </div>

                    {/* 2. All Submitted Milestones & Verified Artifacts */}
                    {historyMilestones.map((m, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '16px 20px',
                          background: '#FFFFFF',
                          border: '1.5px solid #E2E8F0',
                          borderRadius: 14,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                          transition: 'all 0.18s ease'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = '#86EFAC';
                          e.currentTarget.style.boxShadow = '0 4px 14px rgba(22,163,74,0.08)';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = '#E2E8F0';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.03)';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#F0FDF4', border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16A34A', flexShrink: 0 }}>
                            {m.name === 'video' ? <Video style={{ width: 22, height: 22 }} /> : <FileText style={{ width: 22, height: 22 }} />}
                          </div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 850, color: '#0F172A' }}>
                              {m.title || `Milestone ${idx + 1}`}
                            </div>
                            <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 3 }}>
                              Artifact: <strong style={{ color: '#1E293B' }}>{m.fileUrl ? m.fileUrl.split('/').pop() : `${(m.name || 'deliverable')}_spec.pdf`}</strong> • Submitted by: <strong>{(activeHistoryProject.team || [])[0] || 'Team Lead'}</strong> • <span style={{ color: '#15803D', fontWeight: 750 }}>✓ Verified by {activeHistoryProject.mentor?.name || 'Faculty Mentor'}</span>
                            </div>
                          </div>
                        </div>
                        <button
                          className="mp-btn-outline"
                          style={{
                            padding: '8px 18px',
                            fontSize: 12.5,
                            fontWeight: 750,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            background: '#F8FAFC',
                            borderColor: '#CBD5E1',
                            color: '#334155',
                            borderRadius: 9,
                            transition: 'all 0.15s ease'
                          }}
                          onClick={() => {
                            if (m.fileUrl && m.fileUrl.startsWith('http')) window.open(m.fileUrl, '_blank');
                            else setPreviewFile(m);
                          }}
                        >
                          <ExternalLink style={{ width: 13, height: 13 }} /> View Deliverable
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Footer Seal */}
                <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
                  <div style={{ fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Sparkles style={{ width: 15, height: 15, color: '#16A34A' }} />
                    <span>JanSetu Verified Academic Innovation Record • Officially Deployed on Ground</span>
                  </div>
                  <button
                    onClick={() => setShowHistoryModal(false)}
                    className="mp-btn-primary"
                    style={{
                      padding: '10px 24px',
                      fontSize: 13,
                      fontWeight: 800,
                      borderRadius: 10,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: '0 4px 12px rgba(37,99,235,0.25)'
                    }}
                  >
                    <X style={{ width: 14, height: 14 }} /> Close Dossier
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        );
      })()}

    </div>
  );
}
