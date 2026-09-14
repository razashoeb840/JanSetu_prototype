import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Users, UserPlus, Crown, Code, Palette, Database,
  Video, CheckCircle, ArrowRight, Star, ExternalLink,
  MapPin, Clock, BookOpen, User, MoreVertical, Plus, X,
  Search, Filter, ShieldCheck, AlertTriangle, Sparkles,
  Layers, CheckCircle2, ChevronRight, Mail, Phone, Edit2, Trash2,
  MessageSquare, Send
} from 'lucide-react';
import { toast } from '../utils/toast';

/* ── Fallback Seed Teams (Used if DB returns empty) ── */
const defaultFallbackTeams = [
  {
    _id: 't1',
    name: 'EcoSolvers',
    project: 'Smart Waste Management System',
    initiative: 'Clean India Initiative',
    category: 'Infrastructure & Environment',
    location: 'New Delhi, Delhi',
    projectType: 'Capstone Project',
    stage: 'In Progress',
    progress: 65,
    courseRecommendation: {
      skill: 'IoT',
      title: 'IoT Fundamentals & Embedded Edge Architectures',
      provider: 'IIT Kharagpur (NPTEL)',
      duration: '8 Weeks',
      cost: 'Free',
      hasCertificate: true,
      url: 'https://nptel.ac.in/courses/106/105/106105166/'
    },
    members: [
      { name: 'Arjun Sharma', email: 'arjun.s@iitd.ac.in', role: 'Team Lead', avatar: 'AS', color: 'linear-gradient(135deg, #10B981, #059669)', expertise: 'Full Stack Dev', status: 'Active' },
      { name: 'Priya Kumar', email: 'priya.k@iitd.ac.in', role: 'ML Engineer', avatar: 'PK', color: 'linear-gradient(135deg, #8B5CF6, #6366F1)', expertise: 'Python, TensorFlow', status: 'Active' },
      { name: 'Rahul Mehra', email: 'rahul.m@iitd.ac.in', role: 'Backend Developer', avatar: 'RM', color: 'linear-gradient(135deg, #3B82F6, #1D4ED8)', expertise: 'Node.js, MongoDB', status: 'Active' },
      { name: 'Sneha Tiwari', email: 'sneha.t@iitd.ac.in', role: 'UI/UX Designer', avatar: 'ST', color: 'linear-gradient(135deg, #F97316, #EA580C)', expertise: 'Figma, React', status: 'Busy' }
    ],
    requiredSkills: [
      { name: 'Python', status: 'present' },
      { name: 'IoT', status: 'missing' },
      { name: 'Data Analysis', status: 'present' },
      { name: 'React', status: 'present' },
      { name: 'Cloud', status: 'present' }
    ]
  },
  {
    _id: 't2',
    name: 'AquaGuardians',
    project: 'Flood Alert & Evacuation System',
    initiative: 'Disaster Resilience Mission',
    category: 'Disaster Management',
    location: 'Patna, Bihar',
    projectType: 'Capstone Project',
    stage: 'Assigned',
    progress: 25,
    courseRecommendation: {
      skill: 'Early Warning Cloud APIs',
      title: 'Spatial Technologies & Early Warning Systems for Disasters',
      provider: 'IIT Roorkee (NPTEL)',
      duration: '6 Weeks',
      cost: 'Free',
      hasCertificate: true,
      url: 'https://nptel.ac.in/'
    },
    members: [
      { name: 'Dr. Rohan Verma', email: 'rohan.v@iitd.ac.in', role: 'Team Lead', avatar: 'RV', color: 'linear-gradient(135deg, #EA580C, #C2410C)', expertise: 'Embedded Systems & Telemetry', status: 'Active' },
      { name: 'Tanvi Sethi', email: 'tanvi.s@iitd.ac.in', role: 'GIS & Sensor Specialist', avatar: 'TS', color: 'linear-gradient(135deg, #06B6D4, #0891B2)', expertise: 'ArcGIS, Python', status: 'Active' },
      { name: 'Aditya Rao', email: 'aditya.r@iitd.ac.in', role: 'Firmware Engineer', avatar: 'AR', color: 'linear-gradient(135deg, #3B82F6, #2563EB)', expertise: 'C++, ESP32, LoRaWAN', status: 'Active' },
      { name: 'Kavita Menon', email: 'kavita.m@iitd.ac.in', role: 'Hydrology Modeler', avatar: 'KM', color: 'linear-gradient(135deg, #8B5CF6, #7C3AED)', expertise: 'Predictive Modeling', status: 'Busy' }
    ],
    requiredSkills: [
      { name: 'GIS Mapping', status: 'present' },
      { name: 'Embedded C++', status: 'present' },
      { name: 'Sensor Telemetry', status: 'present' },
      { name: 'Early Warning Cloud APIs', status: 'missing' },
      { name: 'LoRaWAN', status: 'present' }
    ]
  },
  {
    _id: 't3',
    name: 'CareFlow Innovations',
    project: 'Smart Queue Management for Government Hospitals',
    initiative: 'Ayushman Bharat Digital Health',
    category: 'Healthcare Technology',
    location: 'Ranchi, Jharkhand',
    projectType: 'Capstone Project',
    stage: 'Deployed',
    progress: 100,
    courseRecommendation: {
      skill: 'HL7 / FHIR Standards',
      title: 'Healthcare Informatics, Standards (FHIR/HL7) & Telemedicine',
      provider: 'AIIMS & IIT Delhi',
      duration: '10 Weeks',
      cost: 'Free',
      hasCertificate: true,
      url: 'https://swayam.gov.in/'
    },
    members: [
      { name: 'Aarav Patel', email: 'aarav.p@iitd.ac.in', role: 'Team Lead', avatar: 'AP', color: 'linear-gradient(135deg, #2563EB, #1D4ED8)', expertise: 'Systems Architect', status: 'Active' },
      { name: 'Simran Kaur', email: 'simran.k@iitd.ac.in', role: 'Frontend Engineer', avatar: 'SK', color: 'linear-gradient(135deg, #EC4899, #DB2777)', expertise: 'React, Touch Kiosk UI', status: 'Active' },
      { name: 'Deepak Joshi', email: 'deepak.j@iitd.ac.in', role: 'Backend & DB Specialist', avatar: 'DJ', color: 'linear-gradient(135deg, #059669, #047857)', expertise: 'PostgreSQL, Express', status: 'Busy' },
      { name: 'Nisha Roy', email: 'nisha.r@iitd.ac.in', role: 'Clinical Workflow Analyst', avatar: 'NR', color: 'linear-gradient(135deg, #7C3AED, #6D28D9)', expertise: 'Hospital Informatics', status: 'Active' }
    ],
    requiredSkills: [
      { name: 'React / Kiosk UI', status: 'present' },
      { name: 'Queue Algorithms', status: 'present' },
      { name: 'HL7 / FHIR Standards', status: 'missing' },
      { name: 'Node.js Backend', status: 'present' },
      { name: 'Data Security', status: 'present' }
    ]
  },
  {
    _id: 't4',
    name: 'VoltVisionaries',
    project: 'Smart Campus Energy Monitor',
    initiative: 'Green Campus Initiative',
    category: 'Smart Energy & Electronics',
    location: 'New Delhi, Delhi',
    projectType: 'Mini Project',
    stage: 'Assigned',
    progress: 30,
    courseRecommendation: {
      skill: 'Hardware PCB Design',
      title: 'PCB Design & Smart Grid Metering Instrumentation',
      provider: 'IIT Madras (NPTEL)',
      duration: '8 Weeks',
      cost: 'Free',
      hasCertificate: true,
      url: 'https://nptel.ac.in/'
    },
    members: [
      { name: 'Kabir Sen', email: 'kabir.s@iitd.ac.in', role: 'Team Lead', avatar: 'KS', color: 'linear-gradient(135deg, #F59E0B, #D97706)', expertise: 'Power Systems & Analytics', status: 'Active' },
      { name: 'Meera Nambiar', email: 'meera.n@iitd.ac.in', role: 'Smart Metering Specialist', avatar: 'MN', color: 'linear-gradient(135deg, #10B981, #059669)', expertise: 'Microgrids, MODBUS', status: 'Active' },
      { name: 'Siddharth Nair', email: 'siddharth.n@iitd.ac.in', role: 'IoT Cloud Architect', avatar: 'SN', color: 'linear-gradient(135deg, #3B82F6, #2563EB)', expertise: 'AWS IoT, Time-series DB', status: 'Active' }
    ],
    requiredSkills: [
      { name: 'Energy Analytics', status: 'present' },
      { name: 'Smart Meter Protocols', status: 'present' },
      { name: 'Dashboard UI', status: 'present' },
      { name: 'Hardware PCB Design', status: 'missing' }
    ]
  },
  {
    _id: 't5',
    name: 'JalSuraksha',
    project: 'Low-cost Water Quality Testing Kit',
    initiative: 'Jal Jeevan Mission',
    category: 'Water Quality & Sanitation',
    location: 'Khunti, Jharkhand',
    projectType: 'Capstone Project',
    stage: 'Deployed',
    progress: 100,
    courseRecommendation: {
      skill: 'Portable Microfluidics Hardware',
      title: 'Water Quality Monitoring Technologies & Field Testing',
      provider: 'NEERI & IIT Bombay',
      duration: '6 Weeks',
      cost: 'Free',
      hasCertificate: true,
      url: 'https://nptel.ac.in/'
    },
    members: [
      { name: 'Pooja Deshmukh', email: 'pooja.d@iitd.ac.in', role: 'Team Lead', avatar: 'PD', color: 'linear-gradient(135deg, #0284C7, #0369A1)', expertise: 'Biochemical Sensing', status: 'Active' },
      { name: 'Manish Agarwal', email: 'manish.a@iitd.ac.in', role: 'Microfluidics Engineer', avatar: 'MA', color: 'linear-gradient(135deg, #14B8A6, #0D9488)', expertise: 'Lab-on-chip Devices', status: 'Active' },
      { name: 'Ritu Bansal', email: 'ritu.b@iitd.ac.in', role: 'Spectrophotometry Analyst', avatar: 'RB', color: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', expertise: 'Optical Sensors & Data', status: 'Active' }
    ],
    requiredSkills: [
      { name: 'Electrochemical Sensing', status: 'present' },
      { name: 'Spectrometry Data', status: 'present' },
      { name: 'Mobile Companion App', status: 'present' },
      { name: 'Portable Microfluidics Hardware', status: 'missing' }
    ]
  }
];

const defaultMentors = [
  { id: 1, name: 'Ms. Ananya Gupta', org: 'Microsoft', role: 'Senior Software Engineer', expertise: ['Cloud Computing', 'AI/ML', 'Product Design'], avatar: 'img-1', rating: 4.9, reviews: 120 },
  { id: 2, name: 'Dr. Arvind Rao', org: 'IISc Bengaluru', role: 'Research Scientist', expertise: ['Distributed Systems', 'IoT', 'Edge Computing'], avatar: 'img-2', rating: 4.8, reviews: 95 },
  { id: 3, name: 'Dr. Meera Nair', org: 'TCS Research', role: 'Principal Scientist', expertise: ['Data Analytics', 'Sustainability', 'Smart Cities'], avatar: 'img-3', rating: 4.7, reviews: 88 },
  { id: 4, name: 'Prof. Sandeep Joshi', org: 'IIT Bombay', role: 'Professor of Biosensors', expertise: ['Water Quality', 'Electrochemical', 'Sensors'], avatar: 'img-4', rating: 4.9, reviews: 140 },
  { id: 5, name: 'Dr. Alok Verma', org: 'AIIMS New Delhi', role: 'Director of Medical Informatics', expertise: ['Healthcare IT', 'FHIR Standards', 'Clinical Data'], avatar: 'img-5', rating: 4.9, reviews: 110 }
];

const avatarColors = [
  'linear-gradient(135deg, #6366F1, #8B5CF6)',
  'linear-gradient(135deg, #EC4899, #F43F5E)',
  'linear-gradient(135deg, #14B8A6, #06B6D4)',
  'linear-gradient(135deg, #F97316, #EF4444)',
  'linear-gradient(135deg, #8B5CF6, #3B82F6)',
  'linear-gradient(135deg, #10B981, #059669)',
  'linear-gradient(135deg, #0284C7, #0369A1)'
];

export default function TeamMentorship() {
  const navigate = useNavigate();
  const location = useLocation();

  // Multi-project & team states
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('single'); // 'single' (focused project team) or 'all' (all teams directory)

  // Filters within active team
  const [memberSearch, setMemberSearch] = useState('');
  const [memberStatusFilter, setMemberStatusFilter] = useState('All');
  const [projectQuery, setProjectQuery] = useState('');

  // Mentors state & filters
  const [availableMentors, setAvailableMentors] = useState([]);
  const [mentorDomain, setMentorDomain] = useState('All Domains');
  const [mentorOrg, setMentorOrg] = useState('All Organizations');
  const [mentorSearch, setMentorSearch] = useState('');
  const [requestedMentors, setRequestedMentors] = useState(new Set());
  const [selectedMentor, setSelectedMentor] = useState(null);

  // Invitations and Sessions
  const [invitations, setInvitations] = useState([
    { id: 1, name: 'Aisha Jain', role: 'Senior Data Scientist, Microsoft', type: 'Invited to be Mentor', time: '2 days ago', img: 'https://i.pravatar.cc/100?img=5' },
    { id: 2, name: 'Dev Khanna', role: 'Product Manager, Google', type: 'Invited for Project Review', time: '3 days ago', img: 'https://i.pravatar.cc/100?img=11' }
  ]);

  // Modals
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    role: 'Full Stack Dev',
    expertise: 'React, Node.js',
    status: 'Active'
  });

  const [showEditMemberModal, setShowEditMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  const [showSkillsModal, setShowSkillsModal] = useState(false);
  const [editSkillsData, setEditSkillsData] = useState([]);

  const [showCourseModal, setShowCourseModal] = useState(false);
  const [activeCourse, setActiveCourse] = useState(null);

  // Create Team Modal State
  const [availableProblems, setAvailableProblems] = useState([]);
  const [availableProjects, setAvailableProjects] = useState([]);
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [createTeamLoading, setCreateTeamLoading] = useState(false);

  const initialCreateTeamForm = {
    selectedProblemId: '',
    customProjectTitle: '',
    project: '',
    name: '',
    category: 'Infrastructure & Environment',
    initiative: 'National Innovation & Civic Tech Mission',
    location: 'New Delhi, Delhi',
    projectType: 'Capstone Project',
    stage: 'Assigned',
    progress: 15,
    leadName: '',
    leadEmail: '',
    leadRole: 'Team Lead',
    leadExpertise: 'Full Stack & Systems Architecture',
    extraMembers: []
  };

  const [createTeamForm, setCreateTeamForm] = useState(initialCreateTeamForm);

  // Helper to check if a team is deployed
  const isTeamDeployed = (t) => {
    if (!t) return false;
    const stage = (t.stage || '').toLowerCase().trim();
    const status = (t.status || '').toLowerCase().trim();
    return stage === 'deployed' || status === 'deployed' || (Number(t.progress) >= 100 && stage !== 'in progress');
  };

  // Helper to get reliable timestamp (MongoDB ObjectId hex or Date)
  const getTeamTimestamp = (t) => {
    if (!t) return 0;
    if (t.updatedAt) {
      const d = new Date(t.updatedAt).getTime();
      if (!isNaN(d)) return d;
    }
    if (t.createdAt) {
      const d = new Date(t.createdAt).getTime();
      if (!isNaN(d)) return d;
    }
    if (t._id && typeof t._id === 'string' && t._id.length === 24) {
      const hex = t._id.substring(0, 8);
      const ts = parseInt(hex, 16) * 1000;
      if (!isNaN(ts)) return ts;
    }
    return 0;
  };

  // Fetch teams, mentors, problems, and projects from backend
  const fetchTeams = () => {
    fetch('/api/teams')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          // Sort newest first
          const sorted = [...data].sort((a, b) => getTeamTimestamp(b) - getTeamTimestamp(a));
          setTeams(sorted);
          // Preserve selected team or pick first active non-deployed team
          const firstActive = sorted.find(t => !isTeamDeployed(t)) || sorted[0];
          setSelectedTeamId(prev => {
            const exists = sorted.some(t => (t._id || t.id) === prev);
            return exists ? prev : (firstActive._id || firstActive.id);
          });
        }
      })
      .catch(() => {});
  };

  const fetchProblemsAndProjects = () => {
    fetch('/api/problems')
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : (data && Array.isArray(data.data) ? data.data : []);
        if (list.length > 0) setAvailableProblems(list);
      })
      .catch(() => {});

    fetch('/api/projects')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setAvailableProjects(data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.showJanSetuCivicLoader === 'function') {
      window.showJanSetuCivicLoader('University Innovation Cell: Loading Teams & Mentorship Data...', { autoDismiss: false });
    }
    setLoading(true);

    const loadAll = async () => {
      try {
        const [teamsRes, mentorsRes, probRes, projRes] = await Promise.all([
          fetch('/api/teams').then(r => r.json()).catch(() => []),
          fetch('/api/mentors').then(r => r.json()).catch(() => []),
          fetch('/api/problems').then(r => r.json()).catch(() => []),
          fetch('/api/projects').then(r => r.json()).catch(() => [])
        ]);

        if (Array.isArray(teamsRes) && teamsRes.length > 0) {
          const sorted = [...teamsRes].sort((a, b) => getTeamTimestamp(b) - getTeamTimestamp(a));
          setTeams(sorted);
          const firstActive = sorted.find(t => !isTeamDeployed(t)) || sorted[0];
          setSelectedTeamId(firstActive?._id || firstActive?.id);
        } else {
          setTeams([]);
        }

        if (Array.isArray(mentorsRes) && mentorsRes.length > 0) {
          setAvailableMentors(mentorsRes);
        }

        const probList = Array.isArray(probRes) ? probRes : (probRes && Array.isArray(probRes.data) ? probRes.data : []);
        if (probList.length > 0) setAvailableProblems(probList);

        if (Array.isArray(projRes) && projRes.length > 0) {
          setAvailableProjects(projRes);
        }
      } catch (err) {
        console.error('Error loading team mentorship data:', err);
      } finally {
        setLoading(false);
        if (typeof window !== 'undefined' && typeof window.hideJanSetuCivicLoader === 'function') {
          window.hideJanSetuCivicLoader();
        }
      }
    };

    loadAll();
  }, []);

  // Determine current active team (defaulting to latest active non-deployed team)
  const currentTeam = teams.find(t => (t._id || t.id) === selectedTeamId) || teams.find(t => !isTeamDeployed(t)) || teams[0] || null;

  // Team Chat State
  const [showTeamChat, setShowTeamChat] = useState(false);
  const [teamChatMessages, setTeamChatMessages] = useState({});
  const [chatInputText, setChatInputText] = useState('');

  // Helper to get chat for a team
  const getTeamChatList = (team) => {
    const teamKey = team?._id || team?.id || 'default';
    if (teamChatMessages[teamKey]) {
      return teamChatMessages[teamKey];
    }
    const lead = team?.members?.[0]?.name || 'Arjun Sharma';
    const m2 = team?.members?.[1]?.name || 'Priya Kumar';

    return [
      {
        id: 1,
        sender: lead,
        role: team?.members?.[0]?.role || 'Team Lead',
        text: `Team, let's coordinate on the upcoming deliverable review for ${team?.project || 'our project'}.`,
        time: '10:15 AM',
        avatar: team?.members?.[0]?.avatar || lead.slice(0, 2).toUpperCase(),
        color: team?.members?.[0]?.color || 'linear-gradient(135deg, #10B981, #059669)'
      },
      {
        id: 2,
        sender: m2,
        role: team?.members?.[1]?.role || 'Researcher',
        text: 'Working on the architecture specs and circuit telemetry models. Ready for mentor testing!',
        time: '10:32 AM',
        avatar: team?.members?.[1]?.avatar || m2.slice(0, 2).toUpperCase(),
        color: team?.members?.[1]?.color || 'linear-gradient(135deg, #8B5CF6, #6366F1)'
      },
      {
        id: 3,
        sender: 'Dr. Rohan Mehta',
        role: 'Faculty Mentor',
        text: 'Solid progress team. Make sure telemetry handles offline buffering cleanly before submission.',
        time: '11:05 AM',
        avatar: 'RM',
        color: 'linear-gradient(135deg, #F97316, #EA580C)'
      }
    ];
  };

  const currentTeamChatList = currentTeam ? getTeamChatList(currentTeam) : [];

  const handleSendTeamChatMessage = () => {
    if (!chatInputText.trim() || !currentTeam) return;
    const teamKey = currentTeam._id || currentTeam.id || 'default';
    const newMsg = {
      id: Date.now(),
      sender: 'Dr. Rohan Mehta',
      role: 'Faculty Mentor',
      text: chatInputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      avatar: 'RM',
      color: 'linear-gradient(135deg, #2563EB, #1D4ED8)'
    };
    setTeamChatMessages(prev => {
      const existing = prev[teamKey] || currentTeamChatList;
      return { ...prev, [teamKey]: [...existing, newMsg] };
    });
    setChatInputText('');
  };

  // Filter members of the active team
  const filteredMembers = (currentTeam?.members || []).filter(m => {
    const matchesSearch = !memberSearch.trim() ||
      (m.name || '').toLowerCase().includes(memberSearch.toLowerCase()) ||
      (m.role || '').toLowerCase().includes(memberSearch.toLowerCase()) ||
      (m.expertise || '').toLowerCase().includes(memberSearch.toLowerCase());
    const matchesStatus = memberStatusFilter === 'All' || m.status === memberStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate skill coverage for current team
  const presentSkillsCount = (currentTeam?.requiredSkills || []).filter(s => s.status === 'present').length;
  const totalSkillsCount = (currentTeam?.requiredSkills || []).length || 1;
  const skillCoveragePct = Math.round((presentSkillsCount / totalSkillsCount) * 100);

  // Total members across university
  const totalUniMembers = teams.reduce((acc, t) => acc + (t.members?.length || 0), 0);

  // Filter mentors
  const filteredMentors = availableMentors.filter(m => {
    const matchesDomain = mentorDomain === 'All Domains' || (m.expertise || []).some(e => e.toLowerCase().includes(mentorDomain.toLowerCase()));
    const matchesOrg = mentorOrg === 'All Organizations' || (m.org || '').toLowerCase().includes(mentorOrg.toLowerCase());
    const matchesSearch = !mentorSearch.trim() || (m.name || '').toLowerCase().includes(mentorSearch.toLowerCase()) || (m.role || '').toLowerCase().includes(mentorSearch.toLowerCase());
    return matchesDomain && matchesOrg && matchesSearch;
  });

  // Action: Add / Invite member to current team
  const handleInviteMember = async (e) => {
    e.preventDefault();
    if (!inviteForm.name.trim()) {
      toast('Please enter a member name', 'error');
      return;
    }
    try {
      const res = await fetch(`/api/teams/${currentTeam._id || currentTeam.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteForm)
      });
      const data = await res.json();
      if (data && data.members) {
        setTeams(prev => prev.map(t => (t._id || t.id) === (currentTeam._id || currentTeam.id) ? data : t));
        toast(`Added ${inviteForm.name} to Team ${currentTeam.name}!`, 'success');
      } else {
        fetchTeams();
        toast(`Invitation dispatched to ${inviteForm.name}!`, 'success');
      }
      setShowInviteModal(false);
      setInviteForm({ name: '', email: '', role: 'Full Stack Dev', expertise: 'React, Node.js', status: 'Active' });
    } catch (err) {
      toast('Member added to team locally', 'info');
      setShowInviteModal(false);
    }
  };

  // Action: Edit member role/status
  const handleUpdateMember = async (e) => {
    e.preventDefault();
    if (!editingMember) return;
    try {
      const res = await fetch(`/api/teams/${currentTeam._id || currentTeam.id}/members/${editingMember.index}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingMember.data)
      });
      const resData = await res.json();
      if (resData.success) {
        setTeams(prev => prev.map(t => (t._id || t.id) === (currentTeam._id || currentTeam.id) ? resData.team : t));
        toast('Member updated successfully', 'success');
      } else {
        fetchTeams();
      }
      setShowEditMemberModal(false);
      setEditingMember(null);
    } catch (err) {
      toast('Member updated', 'success');
      setShowEditMemberModal(false);
    }
  };

  // Action: Remove member from team
  const handleRemoveMember = async (memberIndex, memberName) => {
    if (!confirm(`Are you sure you want to remove ${memberName || 'this member'} from Team ${currentTeam.name}?`)) return;
    try {
      await fetch(`/api/teams/${currentTeam._id || currentTeam.id}/members/${memberIndex}`, { method: 'DELETE' });
      setTeams(prev => prev.map(t => {
        if ((t._id || t.id) === (currentTeam._id || currentTeam.id)) {
          return { ...t, members: t.members.filter((_, idx) => idx !== memberIndex) };
        }
        return t;
      }));
      toast('Member removed from team', 'success');
    } catch (err) {
      toast('Member removed', 'info');
    }
  };

  // Action: Save skills
  const handleSaveSkills = async () => {
    try {
      await fetch(`/api/teams/${currentTeam._id || currentTeam.id}/skills`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills: editSkillsData })
      });
      setTeams(prev => prev.map(t => {
        if ((t._id || t.id) === (currentTeam._id || currentTeam.id)) {
          return { ...t, requiredSkills: editSkillsData };
        }
        return t;
      }));
      setShowSkillsModal(false);
      toast('Project required skills updated!', 'success');
    } catch (err) {
      toast('Skills updated', 'info');
      setShowSkillsModal(false);
    }
  };

  // Action: Request mentor
  const handleRequestMentor = async (mentorId) => {
    setRequestedMentors(prev => new Set([...prev, mentorId]));
    const mentor = availableMentors.find(m => (m._id || m.id) === mentorId);
    try {
      await fetch(`/api/projects/${currentTeam.projectId || 1}/request-mentor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mentorId,
          mentorName: mentor?.name || 'Industry Mentor',
          org: mentor?.org || 'Industry Partner',
          projectName: currentTeam.project
        })
      });
      toast(`Mentorship request sent to ${mentor?.name || 'mentor'} for "${currentTeam.project}"!`, 'success');
    } catch (e) {
      toast(`Mentorship requested for ${mentor?.name || 'mentor'}!`, 'success');
    }
  };

  const handleInviteResponse = (id, accepted) => {
    setInvitations(prev => prev.filter(inv => inv.id !== id));
    toast(accepted ? 'Invitation accepted! Linked to project team.' : 'Invitation declined', accepted ? 'success' : 'info');
  };

  // Projects & Problems identification for Team creation
  const assignedProjectTitles = new Set(
    teams.map(t => (t.project || '').toLowerCase().trim())
  );

  const unassignedProblems = availableProblems.filter(p => 
    p.title && !assignedProjectTitles.has(p.title.toLowerCase().trim())
  );

  const alreadyAssignedProblems = availableProblems.filter(p =>
    p.title && assignedProjectTitles.has(p.title.toLowerCase().trim())
  );

  const applySelectedProblem = (prob, baseForm) => {
    if (!prob) return;
    const formToUpdate = baseForm || createTeamForm;
    const words = prob.title.replace(/[^a-zA-Z0-9 ]/g, '').split(' ').filter(w => w.length > 3);
    const suggestedTeam = words.length >= 2 
      ? words.slice(0, 2).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('') + ' Innovators'
      : (words[0] || 'Civic') + ' Solutions';

    let init = 'National Innovation & Civic Tech Mission';
    const catLower = (prob.category || '').toLowerCase();
    const titleLower = prob.title.toLowerCase();

    if (catLower.includes('health') || titleLower.includes('health') || titleLower.includes('hospital') || titleLower.includes('telemedicine')) {
      init = 'National Health Mission (Ayushman Bharat)';
    } else if (catLower.includes('disaster') || titleLower.includes('flood') || titleLower.includes('landslide')) {
      init = 'Disaster Resilience & Early Warning Mission';
    } else if (catLower.includes('infra') || titleLower.includes('road') || titleLower.includes('traffic') || titleLower.includes('transport')) {
      init = 'Smart Cities & Urban Infrastructure Mission';
    } else if (catLower.includes('water') || titleLower.includes('water') || titleLower.includes('sanitation')) {
      init = 'Jal Jeevan Mission & Clean Water Initiative';
    } else if (catLower.includes('rural') || titleLower.includes('rural') || titleLower.includes('artisan')) {
      init = 'Rural Digital Empowerment & Livelihoods Mission';
    } else if (catLower.includes('energy') || titleLower.includes('energy') || titleLower.includes('grid')) {
      init = 'Green Energy & Microgrid Technology Mission';
    }

    setCreateTeamForm({
      ...formToUpdate,
      selectedProblemId: prob._id,
      project: prob.title,
      name: suggestedTeam,
      category: prob.category || 'Infrastructure & Environment',
      location: prob.location || 'New Delhi, Delhi',
      initiative: init,
      stage: 'Assigned',
      progress: 15
    });
  };

  const handleProblemSelectChange = (val) => {
    if (val === 'custom') {
      setCreateTeamForm(prev => ({
        ...prev,
        selectedProblemId: 'custom',
        project: prev.customProjectTitle || '',
        name: prev.name || 'Innovation Squad',
        category: 'General Technology',
        initiative: 'University Civic Tech Mission'
      }));
    } else {
      const selectedProb = availableProblems.find(p => (p._id || p.id) === val);
      if (selectedProb) {
        applySelectedProblem(selectedProb);
      }
    }
  };

  const handleOpenCreateTeamModal = () => {
    if (unassignedProblems.length > 0) {
      const first = unassignedProblems[0];
      applySelectedProblem(first, {
        ...initialCreateTeamForm,
        selectedProblemId: first._id
      });
    } else {
      setCreateTeamForm(initialCreateTeamForm);
    }
    setShowCreateTeamModal(true);
  };

  // Check for redirected navigation state (from Browse Problems or My Projects)
  useEffect(() => {
    // 1. Problem redirected from Browse Problems -> Open create team modal pre-filled
    const redirectedProblem = location.state?.startProjectProblem;
    let pendingProblem = redirectedProblem;
    if (!pendingProblem) {
      try {
        const stored = sessionStorage.getItem('pendingProjectProblem');
        if (stored) pendingProblem = JSON.parse(stored);
      } catch (e) {}
    }

    if (pendingProblem) {
      applySelectedProblem(pendingProblem, {
        ...initialCreateTeamForm,
        selectedProblemId: pendingProblem._id || pendingProblem.id
      });
      setShowCreateTeamModal(true);
    }

    // 2. Focused Team from MyProjects "View Team"
    const targetTeamId = location.state?.targetTeamId;
    const targetProjectTitle = location.state?.targetProjectTitle;
    if (targetTeamId && teams.length > 0) {
      const match = teams.find(t => (t._id || t.id) === targetTeamId || t.projectId === targetTeamId);
      if (match) {
        setSelectedTeamId(match._id || match.id);
        setViewMode('single');
      }
    } else if (targetProjectTitle && teams.length > 0) {
      const match = teams.find(t => (t.project || '').toLowerCase().trim() === targetProjectTitle.toLowerCase().trim());
      if (match) {
        setSelectedTeamId(match._id || match.id);
        setViewMode('single');
      }
    }
  }, [location.state, teams]);

  const handleAddExtraMember = () => {
    setCreateTeamForm(prev => ({
      ...prev,
      extraMembers: [
        ...prev.extraMembers,
        { name: '', email: '', role: 'Research Member', expertise: 'Software Engineering' }
      ]
    }));
  };

  const handleUpdateExtraMember = (index, field, value) => {
    setCreateTeamForm(prev => {
      const updated = [...prev.extraMembers];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, extraMembers: updated };
    });
  };

  const handleRemoveExtraMember = (index) => {
    setCreateTeamForm(prev => ({
      ...prev,
      extraMembers: prev.extraMembers.filter((_, idx) => idx !== index)
    }));
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    const targetProject = createTeamForm.selectedProblemId === 'custom'
      ? createTeamForm.customProjectTitle.trim()
      : createTeamForm.project.trim();

    if (!targetProject) {
      toast('Please select or specify a project for this team', 'error');
      return;
    }
    if (!createTeamForm.name.trim()) {
      toast('Please enter a team name', 'error');
      return;
    }
    if (!createTeamForm.leadName.trim()) {
      toast('Please enter at least 1 team member (Team Lead)', 'error');
      return;
    }

    setCreateTeamLoading(true);

    const avatarGradients = [
      'linear-gradient(135deg, #10B981, #059669)',
      'linear-gradient(135deg, #8B5CF6, #6366F1)',
      'linear-gradient(135deg, #3B82F6, #1D4ED8)',
      'linear-gradient(135deg, #F97316, #EA580C)',
      'linear-gradient(135deg, #EC4899, #BE185D)',
      'linear-gradient(135deg, #06B6D4, #0891B2)'
    ];

    const leadInitials = createTeamForm.leadName.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'TL';

    const membersPayload = [
      {
        name: createTeamForm.leadName.trim(),
        email: createTeamForm.leadEmail.trim() || `${createTeamForm.leadName.toLowerCase().replace(/\s+/g, '.')}@iitd.ac.in`,
        role: createTeamForm.leadRole || 'Team Lead',
        avatar: leadInitials,
        color: avatarGradients[0],
        expertise: createTeamForm.leadExpertise || 'Full Stack & Systems',
        status: 'Active',
        joinedDate: 'Just now'
      },
      ...createTeamForm.extraMembers.filter(m => m.name && m.name.trim()).map((m, idx) => {
        const initials = m.name.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'TM';
        return {
          name: m.name.trim(),
          email: m.email.trim() || `${m.name.toLowerCase().replace(/\s+/g, '.')}@iitd.ac.in`,
          role: m.role || 'Team Member',
          avatar: initials,
          color: avatarGradients[(idx + 1) % avatarGradients.length],
          expertise: m.expertise || 'Software & Testing',
          status: 'Active',
          joinedDate: 'Just now'
        };
      })
    ];

    // Compute course recommendation
    const pLower = (targetProject + ' ' + (createTeamForm.category || '')).toLowerCase();
    let course;
    if (pLower.includes('road') || pLower.includes('traffic') || pLower.includes('transport') || pLower.includes('mobility')) {
      course = {
        skill: 'Urban Mobility & Edge AI',
        title: 'Intelligent Transportation Systems & Urban Sensor Networks',
        provider: 'IIT Madras (NPTEL)',
        duration: '8 Weeks',
        cost: 'Free',
        hasCertificate: true,
        url: 'https://nptel.ac.in/'
      };
    } else if (pLower.includes('health') || pLower.includes('telemedicine') || pLower.includes('medical') || pLower.includes('clinic')) {
      course = {
        skill: 'Telehealth & Medical IoT',
        title: 'Healthcare Informatics, Standards (FHIR/HL7) & Telemedicine',
        provider: 'AIIMS New Delhi / IIT Kharagpur',
        duration: '8 Weeks',
        cost: 'Free',
        hasCertificate: true,
        url: 'https://nptel.ac.in/'
      };
    } else if (pLower.includes('landslide') || pLower.includes('flood') || pLower.includes('disaster')) {
      course = {
        skill: 'Spatial Early Warning APIs',
        title: 'Spatial Technologies & Early Warning Systems for Disasters',
        provider: 'IIT Roorkee (NPTEL)',
        duration: '6 Weeks',
        cost: 'Free',
        hasCertificate: true,
        url: 'https://nptel.ac.in/'
      };
    } else if (pLower.includes('water') || pLower.includes('sanitation') || pLower.includes('river')) {
      course = {
        skill: 'Sensors & Colorimetry',
        title: 'Water Quality Monitoring Technologies & Field Testing',
        provider: 'IIT Bombay (NPTEL)',
        duration: '8 Weeks',
        cost: 'Free',
        hasCertificate: true,
        url: 'https://nptel.ac.in/'
      };
    } else if (pLower.includes('energy') || pLower.includes('power') || pLower.includes('grid') || pLower.includes('solar')) {
      course = {
        skill: 'Smart Metering & Telemetry',
        title: 'PCB Design & Smart Grid Metering Instrumentation',
        provider: 'IIT Madras (NPTEL)',
        duration: '10 Weeks',
        cost: 'Free',
        hasCertificate: true,
        url: 'https://nptel.ac.in/'
      };
    } else {
      course = {
        skill: 'Edge AI & Cloud Deployments',
        title: 'Scalable Cloud Systems & Embedded Edge Intelligence',
        provider: 'IIT Delhi (NPTEL)',
        duration: '8 Weeks',
        cost: 'Free',
        hasCertificate: true,
        url: 'https://nptel.ac.in/'
      };
    }

    const skills = [
      { name: 'Python / C++', status: 'present' },
      { name: course.skill, status: 'missing' },
      { name: 'Data Pipeline', status: 'present' },
      { name: 'React UI', status: 'present' },
      { name: 'Cloud APIs', status: 'present' }
    ];

    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createTeamForm.name.trim(),
          project: targetProject,
          problemId: createTeamForm.selectedProblemId !== 'custom' ? createTeamForm.selectedProblemId : undefined,
          category: createTeamForm.category,
          initiative: createTeamForm.initiative,
          location: createTeamForm.location,
          projectType: createTeamForm.projectType || 'Capstone Project',
          stage: createTeamForm.stage || 'Assigned',
          progress: 15,
          courseRecommendation: course,
          requiredSkills: skills,
          members: membersPayload
        })
      });

      const createdTeam = await res.json();
      try {
        sessionStorage.removeItem('pendingProjectProblem');
      } catch (e) {}

      if (createdTeam && (createdTeam._id || createdTeam.id)) {
        setTeams(prev => [createdTeam, ...prev]);
        setSelectedTeamId(createdTeam._id || createdTeam.id);
        setViewMode('single');
        setShowCreateTeamModal(false);
        toast(`🎉 Team "${createdTeam.name}" created! Project initialized in My Projects.`, 'success');

        // Refresh problems list
        fetchProblemsAndProjects();
      } else {
        fetchTeams();
        fetchProblemsAndProjects();
        setShowCreateTeamModal(false);
        toast('Team created! Project added to My Projects.', 'success');
      }
    } catch (err) {
      toast('Failed to create team: ' + err.message, 'error');
    } finally {
      setCreateTeamLoading(false);
    }
  };

  // Active (non-deployed) project teams, sorted newest first
  const activeProjectTeams = teams
    .filter(t => !isTeamDeployed(t))
    .filter(t => 
      !projectQuery.trim() || 
      (t.project && t.project.toLowerCase().includes(projectQuery.toLowerCase())) || 
      (t.name && t.name.toLowerCase().includes(projectQuery.toLowerCase()))
    )
    .sort((a, b) => getTeamTimestamp(b) - getTeamTimestamp(a));



  // 1. Loading state (Rendered after ALL hooks execute to obey React Rules of Hooks)
  if (loading) {
    return (
      <div className="tm-container animate-in" style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '70px 20px' }}>
        <div style={{ position: 'relative', width: 92, height: 92, marginBottom: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', border: '2px dashed rgba(0, 45, 98, 0.25)', animation: 'civicChakraSpin 12s linear infinite' }} />
          <div style={{ position: 'absolute', width: 84, height: 84, borderRadius: '50%', border: '4px solid transparent', borderTopColor: '#FF9933', borderRightColor: '#002D62', borderBottomColor: '#138808', animation: 'civicCircleSpin 1s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite', filter: 'drop-shadow(0 0 10px rgba(255, 153, 51, 0.35))' }} />
          <div style={{ width: 50, height: 50, borderRadius: '50%', background: '#002D62', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,45,98,0.45)' }}>
            <Users style={{ width: 26, height: 26, color: '#FFF' }} />
          </div>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#EFF6FF', border: '1.5px solid #BFDBFE', padding: '6px 18px', borderRadius: 20, marginBottom: 12 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid #BFDBFE', borderTopColor: '#2563EB', animation: 'civicCircleSpin 0.75s linear infinite' }} />
          <span style={{ fontSize: 13, fontWeight: 800, color: '#1E40AF' }}>Loading Teams & Mentors...</span>
        </div>
        <p style={{ fontSize: 13, color: '#64748B', margin: 0, fontWeight: 500 }}>
          Loading live teams, civic challenges, and domain mentors from database...
        </p>
      </div>
    );
  }

  // 2. Empty state if genuinely no teams in database
  if (!loading && (!currentTeam || teams.length === 0)) {
    return (
      <div className="tm-container animate-in">
        <div className="bp-hero tm-hero">
          <div className="bp-breadcrumb">Home &nbsp;›&nbsp; Team & Mentorship Workspace</div>
          <div className="bp-hero-content">
            <div className="bp-hero-left">
              <h1 className="bp-hero-title">
                Team & <span style={{ color: '#F97316' }}>Mentorship</span> Workspace
              </h1>
              <p className="bp-hero-subtitle">
                Build cross-disciplinary student teams, switch across live projects, track competencies, and bridge skill gaps.
              </p>
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'center', padding: '80px 20px', background: '#FFF', borderRadius: 16, border: '1px solid #E2E8F0', marginTop: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <Users size={52} color="#94A3B8" style={{ marginBottom: 16 }} />
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>No Innovation Teams Yet</h3>
          <p style={{ fontSize: 13, color: '#64748B', maxWidth: 440, margin: '0 auto 20px', lineHeight: 1.5 }}>
            Create your university's first student innovation team to start assigning researchers and collaborating with verified industry mentors.
          </p>
          <button onClick={() => setShowCreateTeamModal(true)} className="tm-btn-primary" style={{ padding: '10px 24px', fontSize: 13, fontWeight: 800, borderRadius: 8, cursor: 'pointer' }}>
            + Create New Team
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tm-container animate-in">
      {/* ── Hero ── */}
      <div className="bp-hero tm-hero">
        <div className="bp-breadcrumb">Home &nbsp;›&nbsp; Team & Mentorship Workspace</div>

        <div className="bp-hero-content">
          <div className="bp-hero-left">
            <h1 className="bp-hero-title">
              Team & <span style={{ color: '#F97316' }}>Mentorship</span> Workspace
            </h1>
            <p className="bp-hero-subtitle">
              Build cross-disciplinary student teams, switch across live projects, track competencies, and bridge skill gaps with accredited IIT/NPTEL courses.
            </p>
          </div>

          <div className="bp-hero-right">
            <div className="bp-hero-quote">
              <span className="bp-hq-mark">"</span>
              <div>
                <span className="bp-hq-text">
                  Mentoring the innovators<br />of a <strong style={{ color: '#22C55E' }}>stronger tomorrow.</strong>
                </span>
                <div style={{ height: 2, background: 'linear-gradient(90deg, #F97316 0%, #22C55E 100%)', width: '80%', marginTop: 8 }} />
              </div>
            </div>
          </div>
        </div>

        {/* Tricolor baseline strip */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, display: 'flex' }}>
          <div style={{ flex: 1, background: '#FF9933' }} />
          <div style={{ flex: 1, background: 'white' }} />
          <div style={{ flex: 1, background: '#138808' }} />
        </div>
      </div>

      {/* ── Multi-Project Selector Bar ── */}
      <div className="tm-project-bar">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Layers size={16} color="#F97316" />
            <span style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.01em' }}>
              Select Active Project Team:
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, background: '#F1F5F9', color: '#475569', padding: '2px 8px', borderRadius: 10 }}>
              {activeProjectTeams.length} Active Projects
            </span>
          </div>

          <div className="tm-bar-actions" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: 8, padding: '4px 10px', flex: '1 1 120px' }}>
              <Search size={13} color="#94A3B8" />
              <input
                type="text"
                placeholder="Find project / team..."
                value={projectQuery}
                onChange={e => setProjectQuery(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 11.5, color: '#334155', width: '100%', minWidth: 70 }}
              />
            </div>

            {/* View Mode Toggle: Single Team vs All Teams */}
            <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: 8, padding: 2, flexShrink: 0 }}>
              <button
                onClick={() => setViewMode('single')}
                style={{
                  border: 'none',
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: viewMode === 'single' ? '#FFFFFF' : 'transparent',
                  color: viewMode === 'single' ? '#0F172A' : '#64748B',
                  boxShadow: viewMode === 'single' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
                }}
              >
                Active Project
              </button>
              <button
                onClick={() => setViewMode('all')}
                style={{
                  border: 'none',
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: viewMode === 'all' ? '#FFFFFF' : 'transparent',
                  color: viewMode === 'all' ? '#0F172A' : '#64748B',
                  boxShadow: viewMode === 'all' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
                }}
              >
                All Teams ({teams.length})
              </button>
            </div>

            {/* Create Team Quick Action */}
            <button
              className="tm-btn-primary"
              onClick={handleOpenCreateTeamModal}
              style={{
                padding: '5px 12px',
                fontSize: 11.5,
                fontWeight: 700,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                height: 30,
                background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                boxShadow: '0 2px 6px rgba(37,99,235,0.25)',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              <Plus size={13} /> Create Team
            </button>
          </div>
        </div>

        {/* Project Selector Horizontal Pills */}
        <div className="tm-project-tabs-scroll">
          {activeProjectTeams.length === 0 ? (
            <div style={{ padding: '12px 18px', color: '#64748B', fontSize: 12, fontStyle: 'italic' }}>
              No active in-progress project teams found.
            </div>
          ) : (
            activeProjectTeams.map((t, idx) => {
              const isSelected = (t._id || t.id) === (currentTeam._id || currentTeam.id) && viewMode === 'single';
              const iconBg = avatarColors[idx % avatarColors.length];
              const memberCount = t.members?.length || 0;

              return (
                <div
                  key={t._id || t.id || idx}
                  className={`tm-project-pill ${isSelected ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedTeamId(t._id || t.id);
                    setViewMode('single');
                  }}
                  title={t.project}
                >
                  <div className="tm-project-pill-icon" style={{ background: iconBg, color: '#FFFFFF', fontWeight: 800 }}>
                    {t.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="tm-project-pill-title">
                      <span>{t.project.length > 28 ? t.project.slice(0, 28) + '...' : t.project}</span>
                      <span style={{
                        fontSize: 9.5,
                        fontWeight: 800,
                        padding: '1px 6px',
                        borderRadius: 10,
                        background: t.stage === 'Deployed' ? '#DCFCE7' : t.stage === 'In Progress' ? '#DBEAFE' : '#FEF3C7',
                        color: t.stage === 'Deployed' ? '#16A34A' : t.stage === 'In Progress' ? '#2563EB' : '#D97706'
                      }}>
                        {t.stage || 'In Progress'}
                      </span>
                    </div>
                    <div className="tm-project-pill-sub">
                      <span style={{ fontWeight: 700, color: isSelected ? '#EA580C' : '#475569' }}>Team {t.name}</span>
                      <span style={{ margin: '0 4px', opacity: 0.5 }}>•</span>
                      {memberCount === 0 ? (
                        <span style={{ color: '#D97706', fontWeight: 700, background: '#FEF3C7', padding: '1px 5px', borderRadius: 4, fontSize: 10 }}>
                          0 Members • Assign
                        </span>
                      ) : (
                        <span>{memberCount} Members</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── ALL TEAMS MASTER DIRECTORY (When viewMode === 'all') ── */}
      {viewMode === 'all' ? (
        <div style={{ padding: '24px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                All University Project Teams Directory
              </h2>
              <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
                Review, compare, and switch across student innovation teams working across all active challenges.
              </p>
            </div>
            <button
              className="tm-btn-primary"
              onClick={handleOpenCreateTeamModal}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 16px',
                fontSize: 13,
                fontWeight: 700,
                background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                boxShadow: '0 3px 10px rgba(37,99,235,0.3)'
              }}
            >
              <Plus size={16} /> Create Team
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {teams.map((t, idx) => (
              <div
                key={t._id || t.id || idx}
                style={{
                  background: '#FFFFFF',
                  borderRadius: 16,
                  border: (t._id || t.id) === (currentTeam._id || currentTeam.id) ? '2px solid #FF9933' : '1px solid #E2E8F0',
                  padding: 20,
                  boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  transition: 'all 0.2s',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  setSelectedTeamId(t._id || t.id);
                  setViewMode('single');
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#EA580C', background: '#FFF7ED', padding: '2px 8px', borderRadius: 6 }}>
                      Team {t.name}
                    </span>
                    <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginTop: 6, lineHeight: 1.3 }}>
                      {t.project}
                    </h3>
                  </div>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 12,
                    background: t.stage === 'Deployed' ? '#DCFCE7' : t.stage === 'In Progress' ? '#DBEAFE' : '#FEF3C7',
                    color: t.stage === 'Deployed' ? '#16A34A' : t.stage === 'In Progress' ? '#2563EB' : '#D97706',
                    whiteSpace: 'nowrap'
                  }}>
                    {t.stage || 'In Progress'}
                  </span>
                </div>

                <div style={{ fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MapPin size={13} color="#94A3B8" />
                  <span>{t.location || 'India'}</span>
                  <span>•</span>
                  <span>{t.category || 'Engineering'}</span>
                </div>

                {/* Team member avatars list */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 6 }}>
                    Team Roster ({t.members?.length || 0} Members)
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {(t.members || []).map((m, mIdx) => (
                      <span
                        key={mIdx}
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          background: '#F8FAFC',
                          border: '1px solid #E2E8F0',
                          color: '#334155',
                          padding: '3px 8px',
                          borderRadius: 8,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                      >
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.status === 'Active' ? '#22C55E' : '#F59E0B' }} />
                        {m.name} ({m.role.split(' ')[0]})
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #F1F5F9', paddingTop: 12, marginTop: 'auto' }}>
                  <span style={{ fontSize: 11, color: '#64748B' }}>
                    Initiative: <strong style={{ color: '#0F172A' }}>{t.initiative || 'Civic Tech'}</strong>
                  </span>
                  <button
                    style={{
                      padding: '6px 12px',
                      borderRadius: 8,
                      border: '1px solid #BFDBFE',
                      background: '#EFF6FF',
                      color: '#2563EB',
                      fontSize: 11.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    Open Workspace <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ── SINGLE ACTIVE PROJECT WORKSPACE ── */
        <div className="tm-grid">
          {/* LEFT COLUMN: Project Details, Team Members, Skills & Mentors */}
          <div className="tm-col-main">
            {/* Active Project Banner */}
            <div className="tm-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', flexWrap: 'wrap', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {/* Project Bins/Domain Thumbnail */}
                <div style={{ width: 60, height: 48, borderRadius: 10, background: 'linear-gradient(135deg, #0F172A, #1E293B)', padding: 4, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', boxShadow: '0 4px 12px rgba(15,23,42,0.15)' }}>
                  <Sparkles size={18} color="#FF9933" />
                  <span style={{ fontSize: 8, fontWeight: 800, color: '#FFFFFF', marginTop: 2 }}>{currentTeam.name.slice(0, 4).toUpperCase()}</span>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: 17, fontWeight: 800, color: '#1E293B', margin: 0 }}>
                      {currentTeam.project}
                    </h3>
                    <span style={{
                      background: currentTeam.stage === 'Deployed' ? '#DCFCE7' : currentTeam.stage === 'In Progress' ? '#DCFCE7' : '#FEF3C7',
                      color: currentTeam.stage === 'Deployed' ? '#16A34A' : currentTeam.stage === 'In Progress' ? '#16A34A' : '#D97706',
                      fontSize: 10.5,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} />
                      {currentTeam.stage || 'In Progress'}
                    </span>
                  </div>

                  <div style={{ fontSize: 11.5, color: '#2563EB', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563EB' }} />
                    {currentTeam.initiative || 'Clean India & Civic Tech Initiative'}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, fontSize: 11, color: '#64748B', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin style={{ width: 12, height: 12, color: '#94A3B8' }} /> {currentTeam.location || 'New Delhi, Delhi'}
                    </span>
                    <span style={{ background: '#FEF3C7', color: '#D97706', padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>
                      {currentTeam.category || 'Infrastructure'}
                    </span>
                    <span style={{ background: '#EFF6FF', color: '#2563EB', padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>
                      {currentTeam.projectType || 'Capstone Project'}
                    </span>
                    <span style={{ color: '#16A34A', fontWeight: 700 }}>
                      Progress: {currentTeam.progress || 60}%
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  className="tm-btn-outline"
                  onClick={() => navigate('/my-projects')}
                  title="Open this project in My Projects dashboard"
                >
                  View in My Projects <ArrowRight style={{ width: 14, height: 14 }} />
                </button>
              </div>
            </div>

            {/* ── My Team Section for Current Project ── */}
            <div className="tm-card">
              <div className="tm-card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h3 className="tm-card-title">
                      Team {currentTeam.name}
                    </h3>
                    <span style={{ 
                      fontSize: 11, 
                      fontWeight: 700, 
                      background: (currentTeam.members?.length || 0) === 0 ? '#FEF3C7' : '#EFF6FF', 
                      color: (currentTeam.members?.length || 0) === 0 ? '#D97706' : '#2563EB', 
                      padding: '2px 8px', 
                      borderRadius: 10 
                    }}>
                      {(currentTeam.members?.length || 0) === 0 ? '0 Members • Manual Assignment Needed' : `${currentTeam.members?.length || 0} Members`}
                    </span>
                  </div>
                  <p className="tm-card-sub">
                    Assigned innovators, student researchers, and contributors for <em>{currentTeam.project}</em>.
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  {/* Status pills filter */}
                  <div style={{ display: 'flex', gap: 4, background: '#F1F5F9', borderRadius: 8, padding: 2 }}>
                    {['All', 'Active', 'Busy'].map(st => (
                      <button
                        key={st}
                        onClick={() => setMemberStatusFilter(st)}
                        style={{
                          border: 'none',
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                          background: memberStatusFilter === st ? '#FFFFFF' : 'transparent',
                          color: memberStatusFilter === st ? '#0F172A' : '#64748B',
                          boxShadow: memberStatusFilter === st ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                        }}
                      >
                        {st}
                      </button>
                    ))}
                  </div>

                  {/* Search member input */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 6, padding: '4px 8px' }}>
                    <Search size={12} color="#94A3B8" />
                    <input
                      type="text"
                      placeholder="Filter members..."
                      value={memberSearch}
                      onChange={e => setMemberSearch(e.target.value)}
                      style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 11, width: 90 }}
                    />
                  </div>

                  <button
                    className="tm-btn-primary"
                    onClick={() => {
                      setInviteForm({ name: '', email: '', role: 'Full Stack Dev', expertise: 'React, Node.js', status: 'Active' });
                      setShowInviteModal(true);
                    }}
                  >
                    <Plus style={{ width: 14, height: 14 }} /> Add Member
                  </button>

                  {/* Chat button */}
                  <button
                    onClick={() => setShowTeamChat(prev => !prev)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: showTeamChat ? '#0F172A' : '#EFF6FF',
                      color: showTeamChat ? '#FFFFFF' : '#2563EB',
                      border: showTeamChat ? '1.5px solid #0F172A' : '1.5px solid #BFDBFE',
                      borderRadius: 8,
                      padding: '8px 14px',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: showTeamChat ? '0 2px 8px rgba(15,23,42,0.2)' : '0 1px 3px rgba(37,99,235,0.08)'
                    }}
                    title={showTeamChat ? "Close Chat & view members" : "Open Team Chat"}
                  >
                    <MessageSquare style={{ width: 14, height: 14 }} />
                    {showTeamChat ? 'Close Chat' : 'Chat'}
                  </button>
                </div>
              </div>

              {/* Conditional: Show Chat Box OR Members Grid */}
              {showTeamChat ? (
                <div style={{
                  background: '#FFFFFF',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: 14,
                  overflow: 'hidden',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                  animation: 'fadeInSlide 0.25s ease forwards'
                }}>
                  {/* Chat Header */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 18px',
                    background: 'linear-gradient(135deg, #0F172A, #1E293B)',
                    color: '#FFFFFF',
                    borderBottom: '1px solid rgba(255,255,255,0.08)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 34,
                        height: 34,
                        borderRadius: 8,
                        background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFFFFF'
                      }}>
                        <MessageSquare size={16} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <h4 style={{ fontSize: 13.5, fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                            Team {currentTeam.name} Live Chat
                          </h4>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 10,
                            fontWeight: 700,
                            background: 'rgba(34,197,94,0.2)',
                            color: '#4ADE80',
                            padding: '2px 8px',
                            borderRadius: 12,
                            border: '1px solid rgba(34,197,94,0.3)'
                          }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E' }} />
                            Active Now
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>
                          Topic: <strong>{currentTeam.project}</strong> • {currentTeam.members?.length || 0} team members
                        </div>
                      </div>
                    </div>

                    {/* Top Right Close / Cross Button */}
                    <button
                      onClick={() => setShowTeamChat(false)}
                      style={{
                        background: 'rgba(255,255,255,0.1)',
                        border: 'none',
                        borderRadius: 8,
                        width: 32,
                        height: 32,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: '#CBD5E1',
                        transition: 'all 0.15s'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#EF4444'; e.currentTarget.style.color = '#FFFFFF'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#CBD5E1'; }}
                      title="Close Chat (Show Team Members)"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Messages Scroll Area */}
                  <div style={{
                    padding: '16px 20px',
                    maxHeight: '320px',
                    minHeight: '220px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    background: '#F8FAFC'
                  }}>
                    {currentTeamChatList.map((msg, idx) => {
                      const isMe = msg.sender === 'Dr. Rohan Mehta';
                      return (
                        <div
                          key={msg.id || idx}
                          style={{
                            display: 'flex',
                            gap: 10,
                            alignItems: 'flex-start',
                            maxWidth: '82%',
                            alignSelf: isMe ? 'flex-end' : 'flex-start',
                            flexDirection: isMe ? 'row-reverse' : 'row'
                          }}
                        >
                          <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: msg.color || 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
                            color: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 10.5,
                            fontWeight: 800,
                            flexShrink: 0,
                            boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                          }}>
                            {msg.avatar || (msg.sender || 'U').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              marginBottom: 3,
                              justifyContent: isMe ? 'flex-end' : 'flex-start'
                            }}>
                              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#1E293B' }}>{msg.sender}</span>
                              <span style={{ fontSize: 10, color: isMe ? '#2563EB' : '#64748B', fontWeight: 600 }}>{msg.role}</span>
                              <span style={{ fontSize: 9.5, color: '#94A3B8' }}>{msg.time}</span>
                            </div>
                            <div style={{
                              padding: '9px 13px',
                              borderRadius: isMe ? '12px 2px 12px 12px' : '2px 12px 12px 12px',
                              background: isMe ? '#2563EB' : '#FFFFFF',
                              color: isMe ? '#FFFFFF' : '#334155',
                              fontSize: 12,
                              lineHeight: 1.45,
                              border: isMe ? 'none' : '1px solid #E2E8F0',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                            }}>
                              {msg.text}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Chat Input Bar */}
                  <div style={{
                    padding: '12px 16px',
                    background: '#FFFFFF',
                    borderTop: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}>
                    <input
                      type="text"
                      placeholder={`Send a message to Team ${currentTeam.name} and faculty mentor...`}
                      value={chatInputText}
                      onChange={e => setChatInputText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSendTeamChatMessage()}
                      style={{
                        flex: 1,
                        padding: '9px 13px',
                        border: '1.5px solid #CBD5E1',
                        borderRadius: 8,
                        fontSize: 12,
                        outline: 'none',
                        color: '#1E293B'
                      }}
                    />
                    <button
                      onClick={handleSendTeamChatMessage}
                      className="tm-btn-primary"
                      style={{
                        padding: '9px 16px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 11.5
                      }}
                    >
                      <Send size={13} /> Send
                    </button>
                    <button
                      onClick={() => setShowTeamChat(false)}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #E2E8F0',
                        borderRadius: 8,
                        background: '#F8FAFC',
                        color: '#64748B',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Close Chat
                    </button>
                  </div>
                </div>
              ) : (
                /* Members Grid */
                (!currentTeam.members || currentTeam.members.length === 0) ? (
                  <div style={{ padding: '40px 24px', textAlign: 'center', background: '#F8FAFC', borderRadius: 14, border: '2px dashed #CBD5E1', margin: '12px 0' }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                      <Users size={24} color="#2563EB" />
                    </div>
                    <h4 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: '0 0 6px' }}>No Team Members Assigned Yet</h4>
                    <p style={{ fontSize: 12.5, color: '#64748B', maxWidth: 440, margin: '0 auto 16px', lineHeight: 1.5 }}>
                      This newly initiated project currently has 0 members. Please manually assign student researchers, engineers, and contributors to form the team.
                    </p>
                    <button
                      onClick={() => {
                        setInviteForm({ name: '', email: '', role: 'Full Stack Dev', expertise: 'React, Node.js', status: 'Active' });
                        setShowInviteModal(true);
                      }}
                      className="tm-btn-primary"
                      style={{ padding: '8px 18px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <Plus size={14} /> Add First Team Member
                    </button>
                  </div>
                ) : filteredMembers.length === 0 ? (
                  <div style={{ padding: '36px 20px', textAlign: 'center', background: '#F8FAFC', borderRadius: 12, border: '1px dashed #E2E8F0' }}>
                    <Users size={32} color="#94A3B8" style={{ marginBottom: 8 }} />
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#334155', margin: 0 }}>No team members match "{memberSearch}"</p>
                    <button
                      onClick={() => { setMemberSearch(''); setMemberStatusFilter('All'); }}
                      style={{ marginTop: 10, background: '#2563EB', color: '#FFFFFF', border: 'none', padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                    >
                      Clear Search
                    </button>
                  </div>
                ) : (
                  <div className="tm-team-grid">
                    {filteredMembers.map((m, i) => {
                      const originalIndex = currentTeam.members.indexOf(m);
                      const avatarBg = m.color || avatarColors[i % avatarColors.length];

                      return (
                        <div key={i} className="tm-member-card-new">
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div className="tm-member-avatar" style={{ background: avatarBg }}>
                                {m.avatar || m.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span className={`tm-member-status-dot ${m.status?.toLowerCase() === 'busy' ? 'busy' : m.status?.toLowerCase() === 'in lab' ? 'inlab' : 'active'}`} />
                                  <span style={{ fontSize: 10.5, fontWeight: 700, color: m.status === 'Active' ? '#16A34A' : '#D97706' }}>
                                    {m.status || 'Active'}
                                  </span>
                                </div>
                                <div className="tm-member-name" style={{ fontSize: 13, marginTop: 1 }}>{m.name}</div>
                              </div>
                            </div>

                            {/* Kebab menu for actions */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <button
                                onClick={() => {
                                  setEditingMember({ index: originalIndex, data: { ...m } });
                                  setShowEditMemberModal(true);
                                }}
                                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 4 }}
                                title="Edit Member"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={() => handleRemoveMember(originalIndex, m.name)}
                                style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 4 }}
                                title="Remove Member"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>

                          <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 8 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#2563EB' }}>{m.role}</div>
                            <div style={{ fontSize: 10.5, color: '#64748B', marginTop: 2 }}>{m.expertise}</div>
                            {m.email && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#94A3B8', marginTop: 4 }}>
                                <Mail size={10} /> {m.email}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              )}
            </div>

            {/* ── Skills & Gap Analysis Row ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 16 }}>
              {/* Required Skills for THIS active project */}
              <div className="tm-card">
                <div className="tm-card-header" style={{ marginBottom: 12 }}>
                  <div>
                    <h3 className="tm-card-title" style={{ fontSize: 14 }}>
                      Required Skills for {currentTeam.name}
                    </h3>
                    <p className="tm-card-sub" style={{ fontSize: 11 }}>
                      Team skill coverage: <strong style={{ color: skillCoveragePct >= 75 ? '#16A34A' : '#D97706' }}>{skillCoveragePct}%</strong>
                    </p>
                  </div>
                  <button
                    style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}
                    onClick={() => { setEditSkillsData([...(currentTeam.requiredSkills || [])]); setShowSkillsModal(true); }}
                  >
                    <Plus style={{ width: 12, height: 12 }} /> Edit Skills
                  </button>
                </div>

                {/* Progress bar */}
                <div style={{ width: '100%', height: 6, background: '#E2E8F0', borderRadius: 3, overflow: 'hidden', marginBottom: 14 }}>
                  <div style={{ width: `${skillCoveragePct}%`, height: '100%', background: skillCoveragePct >= 80 ? '#22C55E' : '#F97316', transition: 'width 0.3s' }} />
                </div>

                <div className="tm-skills-cloud">
                  {(currentTeam.requiredSkills || []).map(s => (
                    <div key={s.name} className="tm-skill-tag" data-status={s.status}>
                      {s.status === 'present' ? <CheckCircle style={{ width: 13, height: 13 }} /> : <AlertTriangle style={{ width: 13, height: 13 }} />}
                      {s.name}
                      {s.status === 'missing' && <div className="tm-skill-missing-label">Missing</div>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Course Recommendation tailored to current project gap */}
              <div className="tm-card" style={{ background: '#FFFDF5', borderColor: '#FEF08A' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 className="tm-card-title" style={{ fontSize: 14, color: '#D97706', display: 'flex', alignItems: 'center', gap: 6 }}>
                    🎓 AI Skill Gap <ArrowRight style={{ width: 12, height: 12 }} /> Recommended Course
                  </h3>
                  <span style={{ background: '#FFEDD5', color: '#EA580C', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>
                    Govt Certified
                  </span>
                </div>

                <p className="tm-card-sub" style={{ fontSize: 11, marginTop: 4, marginBottom: 12 }}>
                  Your team has a skill gap in <strong>{currentTeam.courseRecommendation?.skill || 'Specialized Domain Skills'}</strong> for this challenge.
                </p>

                <div style={{ background: 'white', borderRadius: 10, padding: 14, border: '1.5px solid #FEF08A', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 2px 8px rgba(217, 119, 6, 0.05)' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 8, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', flexShrink: 0 }}>
                    <BookOpen size={20} color="#D97706" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {currentTeam.courseRecommendation?.title || 'Advanced Domain Engineering Course'}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>
                      by {currentTeam.courseRecommendation?.provider || 'IIT / NPTEL Platform'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, fontSize: 10, color: '#64748B', fontWeight: 500 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock style={{ width: 10, height: 10 }} /> {currentTeam.courseRecommendation?.duration || '8 Weeks'}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><CheckCircle style={{ width: 10, height: 10, color: '#16A34A' }} /> Free</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><ShieldCheck style={{ width: 10, height: 10, color: '#2563EB' }} /> Certificate</span>
                    </div>
                  </div>
                  <button
                    className="tm-btn-outline"
                    style={{ color: '#16A34A', borderColor: '#16A34A', padding: '7px 12px', whiteSpace: 'nowrap' }}
                    onClick={() => {
                      setActiveCourse(currentTeam.courseRecommendation || {
                        title: 'Domain Fundamentals & Specialized Engineering',
                        provider: 'IIT Kharagpur / NPTEL',
                        duration: '8 Weeks',
                        skill: 'Domain Specialization'
                      });
                      setShowCourseModal(true);
                    }}
                  >
                    Course Details <ArrowRight style={{ width: 12, height: 12 }} />
                  </button>
                </div>
              </div>
            </div>

            {/* ── Available Mentors Section ── */}
            <div className="tm-card">
              <div className="tm-card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h3 className="tm-card-title">Available Industry & Academic Mentors</h3>
                  <p className="tm-card-sub">
                    Connect verified mentors directly to <em>{currentTeam.project}</em> for code reviews, field deployment guidance, and capstone evaluations.
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <select
                    className="tm-select"
                    value={mentorDomain}
                    onChange={e => setMentorDomain(e.target.value)}
                  >
                    <option>All Domains</option>
                    <option>Cloud Computing</option>
                    <option>AI/ML</option>
                    <option>IoT</option>
                    <option>Data Analytics</option>
                    <option>Healthcare</option>
                    <option>Water Quality</option>
                  </select>

                  <select
                    className="tm-select"
                    value={mentorOrg}
                    onChange={e => setMentorOrg(e.target.value)}
                  >
                    <option>All Organizations</option>
                    <option>Microsoft</option>
                    <option>IISc</option>
                    <option>TCS Research</option>
                    <option>IIT</option>
                    <option>AIIMS</option>
                  </select>

                  <div className="tm-search-box">
                    <User style={{ width: 13, height: 13, color: '#94A3B8' }} />
                    <input
                      type="text"
                      placeholder="Search mentor..."
                      value={mentorSearch}
                      onChange={e => setMentorSearch(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="tm-mentors-grid">
                {filteredMentors.map((mentor, i) => {
                  const isReq = requestedMentors.has(mentor._id || mentor.id);

                  return (
                    <div key={i} className="tm-mentor-card">
                      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                        <div className="tm-member-avatar" style={{ background: avatarColors[i % avatarColors.length], width: 44, height: 44 }}>
                          <img src={`https://i.pravatar.cc/100?img=${i + 40}`} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                        </div>
                        <div>
                          <div className="tm-member-name" style={{ fontSize: 13 }}>{mentor.name}</div>
                          <div className="tm-member-role" style={{ fontSize: 11 }}>{mentor.role}</div>
                          <div className="tm-member-exp" style={{ fontSize: 11, color: '#2563EB', fontWeight: 600 }}>{mentor.org}</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 10 }}>
                        <Star style={{ width: 12, height: 12, fill: '#F59E0B', color: '#F59E0B' }} />
                        {mentor.rating} <span style={{ color: '#94A3B8', fontWeight: 500 }}>({mentor.reviews} reviews)</span>
                      </div>

                      <div className="tm-mentor-tags">
                        {(mentor.expertise || []).map(exp => (
                          <span key={exp}>{exp}</span>
                        ))}
                      </div>

                      <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                        <button
                          className="tm-btn-outline"
                          style={{ flex: 1, padding: '8px 0', fontSize: 11 }}
                          onClick={() => setSelectedMentor(mentor)}
                        >
                          View Bio
                        </button>
                        <button
                          className="tm-btn-primary"
                          style={{
                            flex: 2,
                            padding: '8px 0',
                            fontSize: 11,
                            background: isReq ? '#10B981' : '#0F172A',
                            borderColor: isReq ? '#10B981' : '#0F172A'
                          }}
                          onClick={() => handleRequestMentor(mentor._id || mentor.id)}
                          disabled={isReq}
                        >
                          {isReq ? (
                            <><CheckCircle style={{ width: 12, height: 12 }} /> Requested</>
                          ) : (
                            <><UserPlus style={{ width: 12, height: 12 }} /> Request Mentorship</>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN (Sidebar): Team Stats, Invitations, Sessions */}
          <div className="tm-col-side">
            {/* Team Stats Card */}
            <div className="tm-card">
              <div className="tm-card-header" style={{ marginBottom: 16 }}>
                <div>
                  <h3 className="tm-card-title" style={{ fontSize: 15 }}>Team Stats</h3>
                  <div style={{ fontSize: 10.5, color: '#94A3B8' }}>For {currentTeam.name}</div>
                </div>
                <a href="#/my-projects" className="tm-link">View Projects <ArrowRight style={{ width: 12, height: 12 }} /></a>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="tm-stat-box">
                  <div className="tm-stat-icon" style={{ background: '#EFF6FF', color: '#3B82F6' }}>
                    <Users style={{ width: 16, height: 16 }} />
                  </div>
                  <div>
                    <div className="tm-stat-val">{currentTeam.members?.length || 0}</div>
                    <div className="tm-stat-label">In This Team</div>
                    <div style={{ fontSize: 9, color: '#94A3B8' }}>{totalUniMembers} Total Uni</div>
                  </div>
                </div>

                <div className="tm-stat-box">
                  <div className="tm-stat-icon" style={{ background: '#ECFDF5', color: '#10B981' }}>
                    <UserPlus style={{ width: 16, height: 16 }} />
                  </div>
                  <div>
                    <div className="tm-stat-val">2</div>
                    <div className="tm-stat-label">Mentors Connected</div>
                    <div style={{ fontSize: 9, color: '#10B981', fontWeight: 600 }}>Active guide</div>
                  </div>
                </div>

                <div className="tm-stat-box">
                  <div className="tm-stat-icon" style={{ background: '#FFF7ED', color: '#F97316' }}>
                    <CheckCircle style={{ width: 16, height: 16 }} />
                  </div>
                  <div>
                    <div className="tm-stat-val">{skillCoveragePct}%</div>
                    <div className="tm-stat-label">Skill Coverage</div>
                    <div style={{ fontSize: 9, color: '#F97316' }}>{presentSkillsCount}/{totalSkillsCount} Skills</div>
                  </div>
                </div>

                <div className="tm-stat-box">
                  <div className="tm-stat-icon" style={{ background: '#F3E8FF', color: '#9333EA' }}>
                    <Layers style={{ width: 16, height: 16 }} />
                  </div>
                  <div>
                    <div className="tm-stat-val">{teams.length}</div>
                    <div className="tm-stat-label">Uni Projects</div>
                    <div style={{ fontSize: 9, color: '#9333EA' }}>Assigned</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pending Invitations */}
            <div className="tm-card">
              <div className="tm-card-header" style={{ marginBottom: 16 }}>
                <h3 className="tm-card-title" style={{ fontSize: 15 }}>Pending Invitations</h3>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#2563EB', background: '#EFF6FF', padding: '2px 8px', borderRadius: 10 }}>
                  {invitations.length} New
                </span>
              </div>

              <div className="tm-invite-list">
                {invitations.length > 0 ? (
                  invitations.map((inv) => (
                    <div key={inv.id} className="tm-invite-item">
                      <img src={inv.img} className="tm-invite-img" alt="" />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div className="tm-invite-name">{inv.name}</div>
                          <div className="tm-invite-time">{inv.time}</div>
                        </div>
                        <div className="tm-invite-role">{inv.role}</div>
                        <div className="tm-invite-type" style={{ color: '#2563EB' }}>{inv.type}</div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                          <button
                            className="tm-btn-primary"
                            style={{ background: '#10B981', borderColor: '#10B981', padding: '4px 12px', fontSize: 11 }}
                            onClick={() => handleInviteResponse(inv.id, true)}
                          >
                            Accept
                          </button>
                          <button
                            className="tm-btn-outline"
                            style={{ padding: '4px 12px', fontSize: 11 }}
                            onClick={() => handleInviteResponse(inv.id, false)}
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '20px 10px', color: '#64748B', textAlign: 'center', fontSize: 12 }}>
                    No pending invitations at this time.
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming Sessions */}
            <div className="tm-card">
              <div className="tm-card-header" style={{ marginBottom: 16 }}>
                <h3 className="tm-card-title" style={{ fontSize: 15 }}>Upcoming Sessions</h3>
                <span style={{ fontSize: 11, color: '#16A34A', fontWeight: 700 }}>Live Link Ready</span>
              </div>

              <div className="tm-session-list">
                {[
                  {
                    date: '14',
                    m: 'Sep',
                    title: `Review: ${currentTeam.project.slice(0, 24)}...`,
                    mentor: 'Ms. Ananya Gupta (Microsoft)',
                    time: '11:00 AM – 12:00 PM'
                  },
                  {
                    date: '18',
                    m: 'Sep',
                    title: 'Architecture & Scalability Check',
                    mentor: 'Dr. Arvind Rao (IISc)',
                    time: '02:00 PM – 03:00 PM'
                  }
                ].map((ses, i) => (
                  <div key={i} className="tm-session-item">
                    <div className="tm-session-date">
                      <span className="d">{ses.date}</span>
                      <span className="m">{ses.m}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="tm-session-title">{ses.title}</div>
                      <div className="tm-session-mentor">{ses.mentor}</div>
                      <div className="tm-session-time">{ses.time}</div>
                    </div>
                    <button
                      className="tm-btn-outline"
                      style={{ color: '#2563EB', borderColor: '#BFDBFE', background: '#EFF6FF', padding: '6px 12px', fontSize: 11 }}
                      onClick={() => {
                        toast('Connecting to secure video mentorship room...', 'success');
                        window.open('https://meet.google.com/new', '_blank');
                      }}
                    >
                      <Video style={{ width: 12, height: 12 }} /> Join
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Motivation Banner */}
            <div className="tm-bottom-banner">
              <div style={{ position: 'relative', zIndex: 2 }}>
                <h4 style={{ fontSize: 15, fontWeight: 800, color: '#1E293B', lineHeight: 1.2 }}>Viksit Bharat Innovators</h4>
                <p style={{ fontSize: 12, color: '#475569', fontWeight: 500, marginTop: 4 }}>Together building stronger, field-tested civic technology for India.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODALS ── */}

      {/* 0. Create Team Modal */}
      {showCreateTeamModal && (
        <div className="tm-modal-overlay" onClick={() => setShowCreateTeamModal(false)}>
          <div className="tm-modal-content" style={{ maxWidth: 640, padding: '26px 30px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
                  flexShrink: 0
                }}>
                  <Users size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: 19, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    Create Innovation Team
                  </h3>
                  <p style={{ fontSize: 12, color: '#64748B', marginTop: 3 }}>
                    Form a student research team and assign them to an unassigned civic challenge or active initiative.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateTeamModal(false)}
                style={{
                  background: '#F1F5F9',
                  border: 'none',
                  borderRadius: '50%',
                  width: 32,
                  height: 32,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={16} color="#64748B" />
              </button>
            </div>

            <form onSubmit={handleCreateTeam} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* STEP 1: Assign to Project / Challenge */}
              <div style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: 12, padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 800, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Sparkles size={14} color="#EA580C" /> Select Project / Civic Challenge *
                  </label>
                  {unassignedProblems.length > 0 && (
                    <span style={{
                      fontSize: 10,
                      fontWeight: 800,
                      background: '#FEF3C7',
                      color: '#D97706',
                      padding: '2px 8px',
                      borderRadius: 12
                    }}>
                      ⚡ {unassignedProblems.length} Challenges Needing Teams
                    </span>
                  )}
                </div>

                <select
                  value={createTeamForm.selectedProblemId}
                  onChange={e => handleProblemSelectChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    border: '1.5px solid #CBD5E1',
                    borderRadius: 8,
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: '#0F172A',
                    background: '#FFFFFF',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">-- Choose Challenge or Project --</option>
                  {unassignedProblems.length > 0 && (
                    <optgroup label={`⚡ Unassigned Challenges Needing Teams (${unassignedProblems.length})`}>
                      {unassignedProblems.map(p => (
                        <option key={p._id} value={p._id}>
                          ⚡ {p.title} • {p.category || 'Civic'} ({p.location || 'India'})
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {alreadyAssignedProblems.length > 0 && (
                    <optgroup label={`📁 Existing Challenges (${alreadyAssignedProblems.length})`}>
                      {alreadyAssignedProblems.map(p => (
                        <option key={p._id} value={p._id}>
                          {p.title} (Team already active)
                        </option>
                      ))}
                    </optgroup>
                  )}
                  <option value="custom">✏️ + Enter Custom Project / Topic</option>
                </select>

                {/* If custom project selected */}
                {createTeamForm.selectedProblemId === 'custom' ? (
                  <div style={{ marginTop: 10 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                      Custom Project Title *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. AI-driven Solar Microgrid Monitoring & Rural Distribution"
                      value={createTeamForm.customProjectTitle}
                      onChange={e => setCreateTeamForm({ ...createTeamForm, customProjectTitle: e.target.value, project: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #CBD5E1', borderRadius: 8, fontSize: 12.5, background: 'white' }}
                      required
                    />
                  </div>
                ) : createTeamForm.project ? (
                  /* Display Selected Challenge Summary Card */
                  <div style={{
                    marginTop: 10,
                    padding: '10px 12px',
                    background: '#FFFFFF',
                    border: '1px solid #BFDBFE',
                    borderRadius: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6
                  }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1E40AF' }}>
                      {createTeamForm.project}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 11 }}>
                      <span style={{ background: '#EFF6FF', color: '#2563EB', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>
                        {createTeamForm.category}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#64748B' }}>
                        <MapPin size={11} color="#94A3B8" /> {createTeamForm.location}
                      </span>
                      <span style={{ color: '#16A34A', fontWeight: 700, background: '#DCFCE7', padding: '2px 8px', borderRadius: 6 }}>
                        ✨ Needs Team Formation
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* STEP 2: Team Name & Specifications */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                    Team Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. RoadSense Innovators"
                    required
                    value={createTeamForm.name}
                    onChange={e => setCreateTeamForm({ ...createTeamForm, name: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 12.5 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                    Project Stage
                  </label>
                  <select
                    value={createTeamForm.stage}
                    onChange={e => setCreateTeamForm({ ...createTeamForm, stage: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 12.5, background: 'white' }}
                  >
                    <option>Assigned</option>
                    <option>In Progress</option>
                    <option>Prototype</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                    Discipline / Category
                  </label>
                  <input
                    type="text"
                    value={createTeamForm.category}
                    onChange={e => setCreateTeamForm({ ...createTeamForm, category: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 12 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                    Campus / Field Location
                  </label>
                  <input
                    type="text"
                    value={createTeamForm.location}
                    onChange={e => setCreateTeamForm({ ...createTeamForm, location: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 12 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                  Civic Initiative / Mission
                </label>
                <input
                  type="text"
                  value={createTeamForm.initiative}
                  onChange={e => setCreateTeamForm({ ...createTeamForm, initiative: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 12 }}
                />
              </div>

              {/* STEP 3: Founding Team Lead */}
              <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <Crown size={15} color="#D97706" />
                  <span style={{ fontSize: 12.5, fontWeight: 800, color: '#0F172A' }}>
                    Founding Team Lead
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 3 }}>
                      Lead Full Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Aarav Sharma"
                      required
                      value={createTeamForm.leadName}
                      onChange={e => setCreateTeamForm({ ...createTeamForm, leadName: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 12 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 3 }}>
                      Lead Institutional Email
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. aarav.s@iitd.ac.in"
                      value={createTeamForm.leadEmail}
                      onChange={e => setCreateTeamForm({ ...createTeamForm, leadEmail: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 12 }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 3 }}>
                      Lead Role
                    </label>
                    <select
                      value={createTeamForm.leadRole}
                      onChange={e => setCreateTeamForm({ ...createTeamForm, leadRole: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 12, background: 'white' }}
                    >
                      <option>Team Lead</option>
                      <option>ML Engineer</option>
                      <option>Full Stack Developer</option>
                      <option>Firmware & IoT Engineer</option>
                      <option>GIS Specialist</option>
                      <option>Biomedical Analyst</option>
                      <option>UI/UX Designer</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 3 }}>
                      Technical Expertise
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Python, PyTorch, React Native"
                      value={createTeamForm.leadExpertise}
                      onChange={e => setCreateTeamForm({ ...createTeamForm, leadExpertise: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 12 }}
                    />
                  </div>
                </div>
              </div>

              {/* STEP 4: Additional Members (Optional) */}
              <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>
                    Additional Team Members ({createTeamForm.extraMembers.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddExtraMember}
                    style={{
                      background: '#EFF6FF',
                      border: '1px solid #BFDBFE',
                      color: '#2563EB',
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <Plus size={12} /> Add Member
                  </button>
                </div>

                {createTeamForm.extraMembers.map((em, idx) => (
                  <div key={idx} style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr auto',
                    gap: 8,
                    alignItems: 'center',
                    marginBottom: 8,
                    background: '#F8FAFC',
                    padding: 8,
                    borderRadius: 8,
                    border: '1px solid #E2E8F0'
                  }}>
                    <input
                      type="text"
                      placeholder="Member Name"
                      value={em.name}
                      onChange={e => handleUpdateExtraMember(idx, 'name', e.target.value)}
                      style={{ padding: '6px 10px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 11.5 }}
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={em.email}
                      onChange={e => handleUpdateExtraMember(idx, 'email', e.target.value)}
                      style={{ padding: '6px 10px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 11.5 }}
                    />
                    <select
                      value={em.role}
                      onChange={e => handleUpdateExtraMember(idx, 'role', e.target.value)}
                      style={{ padding: '6px 8px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 11.5, background: 'white' }}
                    >
                      <option>ML Engineer</option>
                      <option>Backend Developer</option>
                      <option>Frontend Engineer</option>
                      <option>UI/UX Designer</option>
                      <option>IoT Specialist</option>
                      <option>Research Member</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => handleRemoveExtraMember(idx)}
                      style={{ background: '#FEE2E2', border: 'none', color: '#DC2626', width: 28, height: 28, borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title="Remove member"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Submit & Cancel Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6, borderTop: '1px solid #F1F5F9', paddingTop: 14 }}>
                <button
                  type="button"
                  onClick={() => setShowCreateTeamModal(false)}
                  style={{ padding: '9px 18px', border: '1px solid #E2E8F0', borderRadius: 8, background: 'white', cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color: '#475569' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTeamLoading}
                  style={{
                    padding: '9px 22px',
                    border: 'none',
                    borderRadius: 8,
                    background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                    color: 'white',
                    fontWeight: 700,
                    cursor: createTeamLoading ? 'not-allowed' : 'pointer',
                    fontSize: 12.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 3px 10px rgba(37,99,235,0.3)',
                    opacity: createTeamLoading ? 0.7 : 1
                  }}
                >
                  {createTeamLoading ? (
                    <span>Creating Team...</span>
                  ) : (
                    <>
                      <CheckCircle2 size={15} /> Create Team & Open Workspace
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 1. Add / Invite Member Modal */}
      {showInviteModal && (
        <div className="tm-modal-overlay" onClick={() => setShowInviteModal(false)}>
          <div className="tm-modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>Add Team Member</h3>
                <p style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                  Assigning to: <strong>Team {currentTeam.name}</strong> ({currentTeam.project})
                </p>
              </div>
              <button onClick={() => setShowInviteModal(false)} style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} color="#64748B" />
              </button>
            </div>

            <form onSubmit={handleInviteMember} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Vikramaditya Singh"
                  required
                  value={inviteForm.name}
                  onChange={e => setInviteForm({ ...inviteForm, name: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Institutional Email *</label>
                <input
                  type="email"
                  placeholder="e.g. vikram.s@iitd.ac.in"
                  required
                  value={inviteForm.email}
                  onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 13 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Project Role</label>
                  <select
                    value={inviteForm.role}
                    onChange={e => setInviteForm({ ...inviteForm, role: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 13, background: 'white' }}
                  >
                    <option>Team Lead</option>
                    <option>ML Engineer</option>
                    <option>Backend Developer</option>
                    <option>Frontend Engineer</option>
                    <option>UI/UX Designer</option>
                    <option>Embedded Systems Engineer</option>
                    <option>GIS Specialist</option>
                    <option>Biochemical Analyst</option>
                    <option>Research Member</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Current Status</label>
                  <select
                    value={inviteForm.status}
                    onChange={e => setInviteForm({ ...inviteForm, status: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 13, background: 'white' }}
                  >
                    <option>Active</option>
                    <option>Busy</option>
                    <option>In Lab</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Key Expertise / Technical Stack</label>
                <input
                  type="text"
                  placeholder="e.g. Python, TensorFlow, Docker, LoRaWAN"
                  value={inviteForm.expertise}
                  onChange={e => setInviteForm({ ...inviteForm, expertise: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 13 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10, borderTop: '1px solid #F1F5F9', paddingTop: 14 }}>
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  style={{ padding: '8px 16px', border: '1px solid #E2E8F0', borderRadius: 8, background: 'white', cursor: 'pointer', fontSize: 13 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 20px', border: 'none', borderRadius: 8, background: '#2563EB', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}
                >
                  Add to Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Edit Member Modal */}
      {showEditMemberModal && editingMember && (
        <div className="tm-modal-overlay" onClick={() => setShowEditMemberModal(false)}>
          <div className="tm-modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>Edit Team Member Details</h3>
              <button onClick={() => setShowEditMemberModal(false)} style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} color="#64748B" />
              </button>
            </div>

            <form onSubmit={handleUpdateMember} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Member Name</label>
                <input
                  type="text"
                  value={editingMember.data.name}
                  onChange={e => setEditingMember({ ...editingMember, data: { ...editingMember.data, name: e.target.value } })}
                  style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Role</label>
                <input
                  type="text"
                  value={editingMember.data.role}
                  onChange={e => setEditingMember({ ...editingMember, data: { ...editingMember.data, role: e.target.value } })}
                  style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Expertise</label>
                <input
                  type="text"
                  value={editingMember.data.expertise}
                  onChange={e => setEditingMember({ ...editingMember, data: { ...editingMember.data, expertise: e.target.value } })}
                  style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Status</label>
                <select
                  value={editingMember.data.status}
                  onChange={e => setEditingMember({ ...editingMember, data: { ...editingMember.data, status: e.target.value } })}
                  style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 13, background: 'white' }}
                >
                  <option>Active</option>
                  <option>Busy</option>
                  <option>In Lab</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10, borderTop: '1px solid #F1F5F9', paddingTop: 14 }}>
                <button
                  type="button"
                  onClick={() => setShowEditMemberModal(false)}
                  style={{ padding: '8px 16px', border: '1px solid #E2E8F0', borderRadius: 8, background: 'white', cursor: 'pointer', fontSize: 13 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 20px', border: 'none', borderRadius: 8, background: '#16A34A', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Edit Skills Modal */}
      {showSkillsModal && (
        <div className="tm-modal-overlay" onClick={() => setShowSkillsModal(false)}>
          <div className="tm-modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Required Skills for {currentTeam.project}
              </h3>
              <button onClick={() => setShowSkillsModal(false)} style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} color="#64748B" />
              </button>
            </div>

            <p style={{ fontSize: 12, color: '#64748B', marginBottom: 14 }}>
              Tag skills as <strong>Present</strong> in the team or <strong>Missing</strong> to trigger targeted course recommendations.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 300, overflowY: 'auto', marginBottom: 16, paddingRight: 4 }}>
              {editSkillsData.map((skill, index) => (
                <div key={index} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="text"
                    value={skill.name}
                    onChange={e => {
                      const updated = [...editSkillsData];
                      updated[index].name = e.target.value;
                      setEditSkillsData(updated);
                    }}
                    style={{ flex: 1, padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13 }}
                  />
                  <select
                    value={skill.status}
                    onChange={e => {
                      const updated = [...editSkillsData];
                      updated[index].status = e.target.value;
                      setEditSkillsData(updated);
                    }}
                    style={{
                      padding: '8px 10px',
                      border: '1px solid #E2E8F0',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 700,
                      background: skill.status === 'present' ? '#DCFCE7' : '#FEE2E2',
                      color: skill.status === 'present' ? '#16A34A' : '#DC2626'
                    }}
                  >
                    <option value="present">Present</option>
                    <option value="missing">Missing</option>
                  </select>
                  <button
                    onClick={() => setEditSkillsData(editSkillsData.filter((_, i) => i !== index))}
                    style={{ background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                onClick={() => setEditSkillsData([...editSkillsData, { name: '', status: 'present' }])}
                style={{ padding: '8px 12px', border: '1.5px dashed #CBD5E1', borderRadius: 8, background: 'none', cursor: 'pointer', color: '#2563EB', fontWeight: 600, fontSize: 12 }}
              >
                + Add Required Skill
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid #F1F5F9', paddingTop: 14 }}>
              <button
                onClick={() => setShowSkillsModal(false)}
                style={{ padding: '8px 16px', border: '1px solid #E2E8F0', borderRadius: 8, background: 'white', cursor: 'pointer', fontSize: 13 }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSkills}
                style={{ padding: '8px 20px', border: 'none', borderRadius: 8, background: '#16A34A', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}
              >
                Save Skill Matrix
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Course Details Modal */}
      {showCourseModal && activeCourse && (
        <div className="tm-modal-overlay" onClick={() => setShowCourseModal(false)}>
          <div className="tm-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 11, fontWeight: 800, background: '#FFEDD5', color: '#C2410C', padding: '3px 10px', borderRadius: 6 }}>
                National Certification Program
              </span>
              <button onClick={() => setShowCourseModal(false)} style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} color="#64748B" />
              </button>
            </div>

            <h3 style={{ fontSize: 19, fontWeight: 800, color: '#0F172A', margin: 0, lineHeight: 1.3 }}>
              {activeCourse.title}
            </h3>
            <div style={{ fontSize: 13, color: '#2563EB', fontWeight: 700, marginTop: 4 }}>
              Offered by {activeCourse.provider}
            </div>

            <div style={{ display: 'flex', gap: 12, margin: '14px 0', padding: '12px 16px', background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0' }}>
              <div>
                <div style={{ fontSize: 10.5, color: '#64748B', fontWeight: 600 }}>Duration</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>{activeCourse.duration || '8 Weeks'}</div>
              </div>
              <div style={{ borderLeft: '1px solid #E2E8F0', paddingLeft: 12 }}>
                <div style={{ fontSize: 10.5, color: '#64748B', fontWeight: 600 }}>Tuition</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#16A34A' }}>Free (MoE Funded)</div>
              </div>
              <div style={{ borderLeft: '1px solid #E2E8F0', paddingLeft: 12 }}>
                <div style={{ fontSize: 10.5, color: '#64748B', fontWeight: 600 }}>Target Competency</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#C2410C' }}>{activeCourse.skill || 'Domain Specialization'}</div>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <h4 style={{ fontSize: 13, fontWeight: 800, color: '#1E293B', marginBottom: 6 }}>Key Modules Covered:</h4>
              <ul style={{ paddingLeft: 18, fontSize: 12.5, color: '#475569', lineHeight: 1.7, margin: 0 }}>
                <li>Fundamentals, protocols, and standard architectures</li>
                <li>Edge computing, data serialization, and cloud telemetry</li>
                <li>Sensor hardware interfacing and field telemetry protocols</li>
                <li>Practical prototyping lab for civic & municipal deployment</li>
              </ul>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid #F1F5F9', paddingTop: 14 }}>
              <button
                onClick={() => setShowCourseModal(false)}
                style={{ padding: '8px 16px', border: '1px solid #E2E8F0', borderRadius: 8, background: 'white', cursor: 'pointer', fontSize: 13 }}
              >
                Close
              </button>
              <button
                onClick={() => {
                  window.open(activeCourse.url || 'https://nptel.ac.in/', '_blank');
                  toast('Redirecting to official NPTEL/Swayam course portal...', 'success');
                }}
                style={{ padding: '8px 20px', border: 'none', borderRadius: 8, background: '#16A34A', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
              >
                Enroll on Swayam/NPTEL <ExternalLink size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Mentor Profile Modal */}
      {selectedMentor && (
        <div className="tm-modal-overlay" onClick={() => setSelectedMentor(null)}>
          <div className="tm-modal-content" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setSelectedMentor(null)}
              style={{ position: 'absolute', top: 16, right: 16, background: '#F1F5F9', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}
            >
              <X size={16} />
            </button>

            <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 18 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 20, fontWeight: 700 }}>
                {selectedMentor.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>{selectedMentor.name}</h3>
                <div style={{ fontSize: 13, color: '#2563EB', fontWeight: 600 }}>{selectedMentor.role}</div>
                <div style={{ fontSize: 12, color: '#64748B' }}>{selectedMentor.org}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 16 }}>
              <Star style={{ width: 14, height: 14, fill: '#F59E0B', color: '#F59E0B' }} />
              {selectedMentor.rating || 4.9} Rating <span style={{ color: '#94A3B8', fontWeight: 500 }}>({selectedMentor.reviews || 95} reviews)</span>
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Expertise Domains</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {(selectedMentor.expertise || []).map(exp => (
                  <span key={exp} style={{ background: '#EFF6FF', color: '#1D4ED8', padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{exp}</span>
                ))}
              </div>
            </div>

            <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0', marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Target Project for Mentorship:</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginTop: 2 }}>{currentTeam.project}</div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 14, borderTop: '1px solid #E2E8F0' }}>
              <button onClick={() => setSelectedMentor(null)} style={{ padding: '8px 16px', border: '1px solid #E2E8F0', borderRadius: 8, background: 'white', cursor: 'pointer', fontSize: 13 }}>
                Close
              </button>
              <button
                onClick={() => {
                  handleRequestMentor(selectedMentor._id || selectedMentor.id);
                  setSelectedMentor(null);
                }}
                disabled={requestedMentors.has(selectedMentor._id || selectedMentor.id)}
                style={{
                  padding: '8px 20px',
                  border: 'none',
                  borderRadius: 8,
                  background: requestedMentors.has(selectedMentor._id || selectedMentor.id) ? '#10B981' : '#0F172A',
                  color: 'white',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 13
                }}
              >
                {requestedMentors.has(selectedMentor._id || selectedMentor.id) ? 'Requested ✓' : 'Request Mentorship'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
