const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const Problem = require('../others/models/Challenge');
const { Project, Team, Mentor, Resource, Notification, UniversityProfile: User } = require('./database');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/innovatesphere';

/* ══════════════════════════════════════════
   PROBLEMS — Exact match from BrowseProblems.jsx
   ══════════════════════════════════════════ */
const problems = [
  {
    title: 'AI-based Early Flood Warning System for Urban Areas',
    description: 'Develop a predictive system using real-time data to forecast urban flooding and alert citizens and authorities.',
    category: 'Disaster Management',
    location: 'Patna, Bihar',
    impact: 'High',
    academicBrief: { projectType: 'Capstone Project', discipline: 'Computer Science', duration: '6-8 Months' },
    twinnedWith: [
      { university: 'NIT Patna', region: 'Assam', status: 'In Progress' },
      { university: 'IIT Roorkee', region: 'Kerala', status: 'Prototype' },
      { university: 'IIIT Allahabad', region: 'Maharashtra', status: 'Assigned' }
    ],
    interested: 24,
    bookmarked: false,
    collaborationReady: true,
    daysUnassigned: 0,
    forkable: null
  },
  {
    title: 'Smart Queue Management for Government Hospitals',
    description: 'Create a digital queue and appointment system to reduce waiting time in public hospitals.',
    category: 'Healthcare',
    location: 'New Delhi, Delhi',
    impact: 'Medium',
    academicBrief: { projectType: 'Mini Project', discipline: 'Information Technology', duration: '3-6 Months' },
    twinnedWith: [],
    interested: 18,
    bookmarked: true,
    collaborationReady: false,
    daysUnassigned: 5,
    forkable: null
  },
  {
    title: 'Crowdsourced Road Damage Reporting System',
    description: 'Build a platform for citizens to report and track road infrastructure issues with image verification.',
    category: 'Infrastructure',
    location: 'Bengaluru, Karnataka',
    impact: 'Medium',
    academicBrief: { projectType: 'Capstone Project', discipline: 'Civil Engineering', duration: '6-8 Months' },
    twinnedWith: [{ university: 'PES University', region: 'Chennai', status: 'Prototype' }],
    interested: 31,
    bookmarked: false,
    collaborationReady: true,
    daysUnassigned: 0,
    forkable: { university: 'IIT Delhi', similarity: 87, status: 'Deployed' }
  },
  {
    title: 'Community Waste Segregation Monitoring',
    description: 'Design a system to monitor and improve waste segregation at the ward level using computer vision or IoT.',
    category: 'Environmental Science',
    location: 'Indore, Madhya Pradesh',
    impact: 'High',
    academicBrief: { projectType: 'Research Project', discipline: 'Electronics & IoT', duration: '6-8 Months' },
    twinnedWith: [
      { university: 'IIT Indore', region: 'MP', status: 'In Progress' },
      { university: 'MANIT Bhopal', region: 'Rajasthan', status: 'Assigned' }
    ],
    interested: 27,
    bookmarked: false,
    collaborationReady: true,
    daysUnassigned: 14,
    forkable: null
  },
  {
    title: 'Real-time Public Transport Tracking & Optimization',
    description: 'Develop a solution to track public transport in real-time and suggest optimal routes using data analytics.',
    category: 'Smart City',
    location: 'Pune, Maharashtra',
    impact: 'Medium',
    academicBrief: { projectType: 'Capstone Project', discipline: 'Data Science', duration: '6-8 Months' },
    twinnedWith: [],
    interested: 19,
    bookmarked: false,
    collaborationReady: false,
    daysUnassigned: 7,
    forkable: { university: 'IIT Bombay', similarity: 72, status: 'Deployed' }
  },
  {
    title: 'Skill Mapping for Rural Youth',
    description: 'Build a platform to map local skills and connect rural youth with training and employment opportunities.',
    category: 'Education',
    location: 'Ranchi, Jharkhand',
    impact: 'Low',
    academicBrief: { projectType: 'Mini Project', discipline: 'Computer Science', duration: '3-5 Months' },
    twinnedWith: [],
    interested: 15,
    bookmarked: false,
    collaborationReady: false,
    daysUnassigned: 2,
    forkable: null
  },
  {
    title: 'Water Quality Monitoring Dashboard',
    description: 'Build an IoT-based water quality monitoring system for rural ponds and rivers with real-time alerts.',
    category: 'Environmental Science',
    location: 'Varanasi, UP',
    impact: 'High',
    academicBrief: { projectType: 'Capstone Project', discipline: 'Electronics & IoT', duration: '6-8 Months' },
    twinnedWith: [],
    interested: 22,
    bookmarked: false,
    collaborationReady: false,
    daysUnassigned: 21,
    forkable: { university: 'NIT Trichy', similarity: 91, status: 'Deployed' }
  },
  {
    title: 'Smart Traffic Signal Optimization',
    description: 'Use AI to dynamically optimize traffic signal timings based on real-time vehicle density and pedestrian flow.',
    category: 'Smart City',
    location: 'Hyderabad, Telangana',
    impact: 'Medium',
    academicBrief: { projectType: 'Capstone Project', discipline: 'Computer Science', duration: '6-8 Months' },
    twinnedWith: [{ university: 'IIIT Hyderabad', region: 'Telangana', status: 'Prototype' }],
    interested: 33,
    bookmarked: false,
    collaborationReady: true,
    daysUnassigned: 0,
    forkable: null
  },
  {
    title: 'Telemedicine for Tribal Areas',
    description: 'Create a low-bandwidth telemedicine platform connecting tribal health centers with specialists in cities.',
    category: 'Healthcare',
    location: 'Ranchi, Jharkhand',
    impact: 'High',
    academicBrief: { projectType: 'Capstone Project', discipline: 'Information Technology', duration: '6-8 Months' },
    twinnedWith: [],
    interested: 28,
    bookmarked: false,
    collaborationReady: false,
    daysUnassigned: 30,
    forkable: null
  },
  {
    title: 'Landslide Prediction System for Hill Stations',
    description: 'Develop a machine learning model to predict landslide-prone zones using geological and weather data.',
    category: 'Disaster Management',
    location: 'Shimla, Himachal Pradesh',
    impact: 'High',
    academicBrief: { projectType: 'Research Project', discipline: 'Data Science', duration: '6-8 Months' },
    twinnedWith: [],
    interested: 20,
    bookmarked: false,
    collaborationReady: false,
    daysUnassigned: 45,
    forkable: { university: 'IISc Bengaluru', similarity: 79, status: 'Deployed' }
  },
  {
    title: 'Digital Marketplace for Local Artisans',
    description: 'Build an e-commerce platform specifically for local artisans to showcase and sell their handmade products.',
    category: 'Education',
    location: 'Jaipur, Rajasthan',
    impact: 'Medium',
    academicBrief: { projectType: 'Mini Project', discipline: 'Computer Science', duration: '3-5 Months' },
    twinnedWith: [],
    interested: 12,
    bookmarked: false,
    collaborationReady: false,
    daysUnassigned: 3,
    forkable: null
  },
  {
    title: 'Air Quality Index Prediction & Alert System',
    description: 'Use sensor networks and ML models to predict AQI for the next 48 hours and issue public health advisories.',
    category: 'Environmental Science',
    location: 'Delhi NCR',
    impact: 'High',
    academicBrief: { projectType: 'Capstone Project', discipline: 'Data Science', duration: '6-8 Months' },
    twinnedWith: [{ university: 'DTU', region: 'Delhi', status: 'In Progress' }],
    interested: 36,
    bookmarked: false,
    collaborationReady: true,
    daysUnassigned: 0,
    forkable: null
  }
];

/* ══════════════════════════════════════════
   PROJECTS — From MyProjects.jsx + Home.jsx
   ══════════════════════════════════════════ */
const projects = [
  {
    title: 'Smart Waste Management System',
    status: 'In Progress',
    type: 'Infrastructure',
    loc: 'New Delhi, Delhi',
    selected: true,
    team: ['A', 'B', 'C', 'D', 'E'],
    teamSize: 5,
    mentor: { name: 'Ms. Ananya Gupta', org: 'Microsoft', initials: 'AG' },
    progress: 1,
    imgBg: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)'
  },
  {
    title: 'Flood Alert & Evacuation System',
    status: 'At Risk',
    type: 'Disaster Management',
    loc: 'Assam, India',
    selected: false,
    team: ['P', 'Q', 'R'],
    teamSize: 3,
    mentor: { name: 'Dr. Neha Verma', org: 'TCS Research', initials: 'NV' },
    progress: 0,
    imgBg: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)'
  },
  {
    title: 'Smart Campus Energy Monitor',
    status: 'Deployed',
    type: 'Sustainable Infrastructure',
    loc: 'IIT Delhi, Delhi',
    selected: false,
    team: ['X', 'Y', 'Z', 'W'],
    teamSize: 4,
    mentor: { name: 'Mr. Arvind Rao', org: 'IISc, Bengaluru', initials: 'AR' },
    progress: 2,
    imgBg: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)'
  }
];

/* ══════════════════════════════════════════
   TEAM — From TeamMentorship.jsx
   ══════════════════════════════════════════ */
const teams = [
  {
    name: 'EcoSolvers',
    project: 'Smart Waste Management System',
    initiative: 'Clean India Initiative',
    createdAt: 'Aug 2026',
    members: [
      { name: 'Arjun Sharma', role: 'Team Lead', avatar: 'AS', color: 'bg-teal-500', expertise: 'Full Stack Dev', status: 'Active' },
      { name: 'Priya Kumar', role: 'ML Engineer', avatar: 'PK', color: 'bg-purple-500', expertise: 'Python, TensorFlow', status: 'Active' },
      { name: 'Rahul Mehra', role: 'Backend Developer', avatar: 'RM', color: 'bg-blue-500', expertise: 'Node.js, MongoDB', status: 'Active' },
      { name: 'Sneha Tiwari', role: 'UI/UX Designer', avatar: 'ST', color: 'bg-pink-500', expertise: 'Figma, React', status: 'Busy' }
    ],
    requiredSkills: [
      { name: 'Python', status: 'present' },
      { name: 'IoT', status: 'missing' },
      { name: 'Data Analysis', status: 'present' },
      { name: 'React', status: 'present' },
      { name: 'Cloud', status: 'present' }
    ]
  }
];

/* ══════════════════════════════════════════
   MENTORS — From TeamMentorship.jsx
   ══════════════════════════════════════════ */
const mentors = [
  { name: 'Ms. Ananya Gupta', org: 'Microsoft', role: 'Senior Software Engineer', expertise: ['Cloud Computing', 'AI/ML', 'Product Design'], avatar: 'img-1', rating: 4.9, reviews: 120 },
  { name: 'Dr. Arvind Rao', org: 'IISc Bengaluru', role: 'Research Scientist', expertise: ['Distributed Systems', 'IoT', 'Edge Computing'], avatar: 'img-2', rating: 4.8, reviews: 95 },
  { name: 'Dr. Meera Nair', org: 'TCS Research', role: 'Principal Scientist', expertise: ['Data Analytics', 'Sustainability', 'Smart Cities'], avatar: 'img-3', rating: 4.7, reviews: 88 }
];

/* ══════════════════════════════════════════
   RESOURCES — From Resources.jsx
   ══════════════════════════════════════════ */
const resources = [
  {
    title: 'Machine Learning for Waste Classification — A Systematic Review',
    type: 'Research Paper',
    discipline: 'Environmental Science',
    format: 'PDF',
    size: '4.2 MB',
    source: 'IISc Bengaluru, Published in IEEE Access',
    description: 'Comprehensive review of ML/DL approaches for automated waste segregation and classification at municipal scale. Covers datasets, models, and performance benchmarks.',
    downloads: 189,
    date: 'Jul 2026',
    linkedProblems: ['Smart Waste Management System', 'Urban Sanitation Monitoring'],
    rating: 4.6,
    ratingCount: 120
  },
  {
    title: 'Urban Flood Risk Assessment Dataset — Bihar & UP',
    type: 'Dataset',
    discipline: 'Disaster Management',
    format: 'CSV / GeoJSON',
    size: '248 MB',
    source: 'National Disaster Management Authority',
    description: 'Historical flood data, satellite imagery analysis, and risk zone mapping for urban areas in Bihar and Uttar Pradesh. Includes rainfall, water level, and affected zone coordinates.',
    downloads: 342,
    date: 'Aug 2026',
    linkedProblems: ['AI-based Flood Warning System', 'River Basin Risk Analysis'],
    rating: 4.8,
    ratingCount: 312
  },
  {
    title: 'IoT-Based Smart Energy Monitoring — Implementation Guide',
    type: 'Guide/Report',
    discipline: 'Sustainable Infrastructure',
    format: 'PDF',
    size: '8.7 MB',
    source: 'IIT Bombay',
    description: 'Technical guide covering sensor deployment, data pipelines, and dashboard design for campus-scale energy monitoring. Includes system architecture and cost breakdown.',
    downloads: 267,
    date: 'Jun 2026',
    linkedProblems: ['Smart Campus Energy Monitor', 'Green Campus Initiative'],
    rating: 4.4,
    ratingCount: 95
  },
  {
    title: 'Indian Public Healthcare Infrastructure — Open Data',
    type: 'Dataset',
    discipline: 'Healthcare',
    format: 'JSON / SQL',
    size: '156 MB',
    source: 'Ministry of Health and Family Welfare',
    description: 'District-wise hospital, clinic, and medical staff data covering all states and union territories.',
    downloads: 524,
    date: 'Sep 2026',
    linkedProblems: ['Smart Queue Management', 'Telemedicine for Tribal Areas'],
    rating: 4.5,
    ratingCount: 200
  },
  {
    title: 'Road Surface Quality Dataset — India (2024–2026)',
    type: 'Dataset',
    discipline: 'Infrastructure',
    format: 'Images / CSV',
    size: '1.8 GB',
    source: 'NHAI & IIT Delhi Collaboration',
    description: 'Labeled image dataset of road surface conditions across 12 states, suitable for training pothole and damage detection models.',
    downloads: 631,
    date: 'May 2026',
    linkedProblems: ['Crowdsourced Road Damage Reporting', 'Rural Road Safety Analytics'],
    rating: 4.7,
    ratingCount: 280
  }
];

/* ══════════════════════════════════════════
   NOTIFICATIONS — From App.jsx
   ══════════════════════════════════════════ */
const notifications = [
  // ── Today (4) ──
  {
    title: 'Dr. Ananya Gupta accepted your mentorship request',
    subtitle: 'You can now connect and schedule sessions.',
    text: 'Dr. Ananya Gupta accepted your mentorship request',
    time: '10:24 AM',
    timeGroup: 'Today',
    category: 'mentor',
    iconType: 'user-check',
    iconColor: '#EA580C',
    iconBg: '#FFEDD5',
    dotColor: '#3B82F6',
    actionText: 'View Mentor',
    actionUrl: '/team-mentorship',
    unread: true,
    isMention: false,
    isHighPriority: false
  },
  {
    title: 'New matching problem found for your expertise!',
    subtitle: '"AI for Waste Segregation" matches your skills in Computer Vision.',
    text: 'New matching problem found: AI for Waste Segregation',
    time: '09:15 AM',
    timeGroup: 'Today',
    category: 'problem',
    iconType: 'sprout',
    iconColor: '#16A34A',
    iconBg: '#DCFCE7',
    dotColor: '#22C55E',
    actionText: 'View Problem',
    actionUrl: '/browse-problems',
    unread: true,
    isMention: false,
    isHighPriority: false
  },
  {
    title: 'Rahul Mehra accepted your team invitation',
    subtitle: 'Rahul is now a member of Smart Waste Management System.',
    text: 'Rahul Mehra accepted your team invitation',
    time: '08:40 AM',
    timeGroup: 'Today',
    category: 'team',
    iconType: 'users',
    iconColor: '#E11D48',
    iconBg: '#FFE4E6',
    dotColor: '#3B82F6',
    actionText: 'View Team',
    actionUrl: '/team-mentorship',
    unread: true,
    isMention: true,
    isHighPriority: false
  },
  {
    title: 'Milestone deadline approaching',
    subtitle: 'Prototype submission for Flood Alert & Evacuation System is due in 5 days.',
    text: 'Milestone deadline approaching: Prototype due in 5 days',
    time: '07:30 AM',
    timeGroup: 'Today',
    category: 'deadline',
    iconType: 'alert-triangle',
    iconColor: '#DC2626',
    iconBg: '#FEE2E2',
    dotColor: '#3B82F6',
    actionText: 'View Project',
    actionUrl: '/my-projects',
    unread: true,
    isMention: false,
    isHighPriority: true
  },

  // ── Yesterday (3) ──
  {
    title: 'Dr. Arvind Rao left feedback on your prototype',
    subtitle: '"Good progress! Consider adding real-time data visualization."',
    text: 'Dr. Arvind Rao left feedback on your prototype',
    time: 'Yesterday, 6:12 PM',
    timeGroup: 'Yesterday',
    category: 'mentor',
    iconType: 'message-circle',
    iconColor: '#9333EA',
    iconBg: '#F3E8FF',
    dotColor: '#3B82F6',
    actionText: 'View Feedback',
    actionUrl: '/my-projects',
    unread: true,
    isMention: true,
    isHighPriority: false
  },
  {
    title: 'Your problem has been twinned with 2 new regions',
    subtitle: 'Now also reported in Chennai, Tamil Nadu and Bhopal, Madhya Pradesh.',
    text: 'Problem twinned with 2 new regions',
    time: 'Yesterday, 3:45 PM',
    timeGroup: 'Yesterday',
    category: 'problem',
    iconType: 'git-merge',
    iconColor: '#2563EB',
    iconBg: '#DBEAFE',
    dotColor: '#3B82F6',
    actionText: 'View Details',
    actionUrl: '/browse-problems',
    unread: true,
    isMention: false,
    isHighPriority: false
  },
  {
    title: 'New Student Innovation Milestone achieved!',
    subtitle: 'Great work! Keep contributing to create real impact.',
    text: 'Student teams have submitted milestone review solutions.',
    time: 'Yesterday, 11:20 AM',
    timeGroup: 'Yesterday',
    category: 'system',
    iconType: 'trophy',
    iconColor: '#D97706',
    iconBg: '#FEF3C7',
    dotColor: '#3B82F6',
    actionText: 'View Projects',
    actionUrl: '/my-projects',
    unread: false,
    isMention: false,
    isHighPriority: false
  },

  // ── This Week (5) ──
  {
    title: 'Smart Campus Energy Monitor has been deployed!',
    subtitle: 'This solution is now available as a Battle-Tested Resource for other teams.',
    text: 'Smart Campus Energy Monitor has been deployed!',
    time: '12 Aug 2026',
    timeGroup: 'This Week',
    category: 'problem',
    iconType: 'shield-check',
    iconColor: '#16A34A',
    iconBg: '#DCFCE7',
    dotColor: '#22C55E',
    actionText: 'View Impact',
    actionUrl: '/resources',
    unread: false,
    isMention: false,
    isHighPriority: false
  },
  {
    title: 'Certificate earned 🎉',
    subtitle: "You've earned the 'Deployed Project Contributor' certificate.",
    text: 'Certificate earned: Deployed Project Contributor',
    time: '10 Aug 2026',
    timeGroup: 'This Week',
    category: 'system',
    iconType: 'award',
    iconColor: '#7C3AED',
    iconBg: '#EDE9FE',
    dotColor: '#3B82F6',
    actionText: 'View Certificate',
    actionUrl: '/profile',
    unread: false,
    isMention: false,
    isHighPriority: false
  },
  {
    title: 'Your final report has been approved',
    subtitle: 'Great work! You can now move to the Deployment stage.',
    text: 'Your final report has been approved',
    time: '9 Aug 2026',
    timeGroup: 'This Week',
    category: 'deadline',
    iconType: 'file-text',
    iconColor: '#EA580C',
    iconBg: '#FFEDD5',
    dotColor: '#3B82F6',
    actionText: 'View Project',
    actionUrl: '/my-projects',
    unread: false,
    isMention: false,
    isHighPriority: true
  },
  {
    title: 'Inter-University Smart Grid Hackathon announced',
    subtitle: 'Register your team before 25th August to participate.',
    text: 'Hackathon announced: Inter-University Smart Grid',
    time: '8 Aug 2026',
    timeGroup: 'This Week',
    category: 'deadline',
    iconType: 'calendar',
    iconColor: '#DC2626',
    iconBg: '#FEE2E2',
    dotColor: '#3B82F6',
    actionText: 'Register Now',
    actionUrl: '/browse-problems',
    unread: false,
    isMention: false,
    isHighPriority: true
  },
  {
    title: 'Dr. Rajiv Kapoor joined as external advisory mentor',
    subtitle: 'Expertise in IoT & Renewable Grid Integration.',
    text: 'Dr. Rajiv Kapoor joined as advisory mentor',
    time: '7 Aug 2026',
    timeGroup: 'This Week',
    category: 'mentor',
    iconType: 'user-plus',
    iconColor: '#4F46E5',
    iconBg: '#E0E7FF',
    dotColor: '#3B82F6',
    actionText: 'Connect',
    actionUrl: '/team-mentorship',
    unread: false,
    isMention: false,
    isHighPriority: false
  },

  // ── Earlier (12) ──
  {
    title: 'Welcome to ByteBridge!',
    subtitle: 'Start exploring problems and build solutions for a stronger India.',
    text: 'Welcome to ByteBridge!',
    time: '1 Aug 2026',
    timeGroup: 'Earlier',
    category: 'system',
    iconType: 'sparkles',
    iconColor: '#475569',
    iconBg: '#F1F5F9',
    dotColor: '#3B82F6',
    actionText: 'Get Started',
    actionUrl: '/',
    unread: false,
    isMention: false,
    isHighPriority: false
  },
  {
    title: 'New collaborative dataset uploaded: Air Quality Monitoring Index',
    subtitle: 'Open-access verified dataset from Delhi CPCB monitoring stations.',
    text: 'New dataset uploaded: Air Quality Monitoring',
    time: '28 Jul 2026',
    timeGroup: 'Earlier',
    category: 'problem',
    iconType: 'database',
    iconColor: '#059669',
    iconBg: '#D1FAE5',
    dotColor: '#22C55E',
    actionText: 'Explore Dataset',
    actionUrl: '/resources',
    unread: false,
    isMention: false,
    isHighPriority: false
  },
  {
    title: 'Faculty Advisor approved semester milestones for Team Agni',
    subtitle: 'Milestones: Literature review, Sensor integration, Field testing.',
    text: 'Faculty Advisor approved milestones for Team Agni',
    time: '26 Jul 2026',
    timeGroup: 'Earlier',
    category: 'team',
    iconType: 'check-circle-2',
    iconColor: '#2563EB',
    iconBg: '#EFF6FF',
    dotColor: '#3B82F6',
    actionText: 'View Team',
    actionUrl: '/team-mentorship',
    unread: false,
    isMention: false,
    isHighPriority: false
  },
  {
    title: 'Team invited new member: Sneha Verma (Data Analyst)',
    subtitle: 'Invitation sent for AI Traffic Management project.',
    text: 'Team invited Sneha Verma as Data Analyst',
    time: '25 Jul 2026',
    timeGroup: 'Earlier',
    category: 'team',
    iconType: 'user-plus',
    iconColor: '#7C3AED',
    iconBg: '#F5F3FF',
    dotColor: '#3B82F6',
    actionText: 'View Team',
    actionUrl: '/team-mentorship',
    unread: false,
    isMention: false,
    isHighPriority: false
  },
  {
    title: 'Peer review session scheduled with Prof. Verma',
    subtitle: 'Discussion on Edge Computing Optimization.',
    text: 'Peer review session scheduled with Prof. Verma',
    time: '24 Jul 2026',
    timeGroup: 'Earlier',
    category: 'mentor',
    iconType: 'calendar',
    iconColor: '#EA580C',
    iconBg: '#FFF7ED',
    dotColor: '#3B82F6',
    actionText: 'View Schedule',
    actionUrl: '/team-mentorship',
    unread: false,
    isMention: false,
    isHighPriority: false
  },
  {
    title: 'Patent application filing guide updated in Resources',
    subtitle: 'New IPR guidelines issued for university student innovations.',
    text: 'Patent application filing guide updated',
    time: '22 Jul 2026',
    timeGroup: 'Earlier',
    category: 'system',
    iconType: 'book-open',
    iconColor: '#4F46E5',
    iconBg: '#EEF2FF',
    dotColor: '#3B82F6',
    actionText: 'View Guide',
    actionUrl: '/resources',
    unread: false,
    isMention: false,
    isHighPriority: false
  },
  {
    title: 'Sprint 2 review deadline set for 30th July',
    subtitle: 'Ensure code repository and documentation are updated.',
    text: 'Sprint 2 review deadline set for 30th July',
    time: '20 Jul 2026',
    timeGroup: 'Earlier',
    category: 'deadline',
    iconType: 'clock',
    iconColor: '#DC2626',
    iconBg: '#FEF2F2',
    dotColor: '#3B82F6',
    actionText: 'View Tasks',
    actionUrl: '/my-projects',
    unread: false,
    isMention: false,
    isHighPriority: false
  },
  {
    title: 'New cross-institutional synergy request from IIT Bombay',
    subtitle: 'Collaborate on Hybrid Solar-Biomass Microgrid project.',
    text: 'Synergy request from IIT Bombay',
    time: '18 Jul 2026',
    timeGroup: 'Earlier',
    category: 'team',
    iconType: 'network',
    iconColor: '#0891B2',
    iconBg: '#ECFEFF',
    dotColor: '#3B82F6',
    actionText: 'Review Request',
    actionUrl: '/team-mentorship',
    unread: false,
    isMention: false,
    isHighPriority: false
  },
  {
    title: 'Mentor Dr. Ananya Gupta shared 3 research papers',
    subtitle: 'Topics: Decentralized Waste Processing in Urban Centers.',
    text: 'Dr. Ananya Gupta shared 3 research papers',
    time: '15 Jul 2026',
    timeGroup: 'Earlier',
    category: 'mentor',
    iconType: 'file-text',
    iconColor: '#2563EB',
    iconBg: '#EFF6FF',
    dotColor: '#3B82F6',
    actionText: 'Read Papers',
    actionUrl: '/resources',
    unread: false,
    isMention: false,
    isHighPriority: false
  },
  {
    title: 'System Maintenance Notice: Scheduled upgrades completed',
    subtitle: 'Platform performance improved with faster search indexing.',
    text: 'System Maintenance: Upgrades completed',
    time: '12 Jul 2026',
    timeGroup: 'Earlier',
    category: 'system',
    iconType: 'server',
    iconColor: '#64748B',
    iconBg: '#F8FAFC',
    dotColor: '#3B82F6',
    actionText: 'Changelog',
    actionUrl: '/',
    unread: false,
    isMention: false,
    isHighPriority: false
  },
  {
    title: 'Civic Tech Grant applications now open',
    subtitle: 'Grants up to ₹5,00,000 for field-deployable student prototypes.',
    text: 'Civic Tech Grant applications now open',
    time: '10 Jul 2026',
    timeGroup: 'Earlier',
    category: 'system',
    iconType: 'zap',
    iconColor: '#D97706',
    iconBg: '#FFFBEB',
    dotColor: '#3B82F6',
    actionText: 'Apply Now',
    actionUrl: '/resources',
    unread: false,
    isMention: false,
    isHighPriority: false
  },
  {
    title: 'Quarterly University Impact Ranking published',
    subtitle: 'Your institution ranks in the Top 5 for societal impact projects.',
    text: 'Quarterly University Impact Ranking published',
    time: '5 Jul 2026',
    timeGroup: 'Earlier',
    category: 'system',
    iconType: 'trending-up',
    iconColor: '#16A34A',
    iconBg: '#F0FDF4',
    dotColor: '#22C55E',
    actionText: 'View Rankings',
    actionUrl: '/profile',
    unread: false,
    isMention: false,
    isHighPriority: false
  }
];

/* ══════════════════════════════════════════
   USER / PROFILE — From Profile.jsx
   ══════════════════════════════════════════ */
const users = [
  {
    name: 'Dr. Rohan Mehta',
    initials: 'RM',
    email: 'rohan.mehta@iitd.ac.in',
    role: 'Faculty Member',
    department: 'Department of Computer Science and Engineering',
    institution: 'Indian Institute of Technology Delhi',
    location: 'New Delhi, India',
    bio: 'Using technology and education to build inclusive, sustainable solutions for a better India.',
    skills: ['Machine Learning', 'IoT Systems', 'Data Analytics', 'Cloud Architecture', 'Full Stack Dev'],
    contributions: [
      { title: 'Smart Waste Management System', role: 'Infrastructure | Faculty Guide', status: 'In Progress', date: '15 Aug 2026', color: '#16A34A' },
      { title: 'Flood Alert & Evacuation System', role: 'Disaster Management | Mentor', status: 'Prototype', date: '10 Aug 2026', color: '#D97706' },
      { title: 'Real-time Public Transport Tracking', role: 'Smart City | Faculty Guide', status: 'Submitted', date: '28 Jul 2025', color: '#2563EB' },
      { title: 'Smart Campus Energy Monitor', role: 'Sustainability | Mentor', status: 'Deployed', date: '12 Jun 2025', color: '#059669' }
    ],
    stats: {
      totalProblems: 124,
      studentTeams: 28,
      projectsInProgress: 18,
      projectsDeployed: 9,
      needAttention: 7,
      projectsGuided: 12,
      activeMentorships: 5,
      teamsSupported: 28,
      impactScore: 94
    },
    badges: [
      { name: 'Innovator', icon: 'lightbulb', color: '#F97316' },
      { name: 'Mentor Pro', icon: 'shield', color: '#2563EB' },
      { name: 'Top Guide', icon: 'star', color: '#EAB308' },
      { name: 'Early Adopter', icon: 'sparkles', color: '#8B5CF6' },
      { name: 'Impact Leader', icon: 'hexagon', color: '#10B981' }
    ]
  }
];

/* ══════════════════════════════════════════
   SEED RUNNER
   ══════════════════════════════════════════ */
async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('🗑️  Clearing old data...');
    await Promise.all([
      Problem.deleteMany({}),
      Project.deleteMany({}),
      Team.deleteMany({}),
      Mentor.deleteMany({}),
      Resource.deleteMany({}),
      Notification.deleteMany({}),
      User.deleteMany({})
    ]);

    console.log('📝 Inserting seed data...');
    await Problem.insertMany(problems);
    console.log(`  ✓ ${problems.length} problems`);
    
    await Project.insertMany(projects);
    console.log(`  ✓ ${projects.length} projects`);
    
    await Team.insertMany(teams);
    console.log(`  ✓ ${teams.length} teams`);
    
    await Mentor.insertMany(mentors);
    console.log(`  ✓ ${mentors.length} mentors`);
    
    await Resource.insertMany(resources);
    console.log(`  ✓ ${resources.length} resources`);
    
    await Notification.insertMany(notifications);
    console.log(`  ✓ ${notifications.length} notifications`);
    
    await User.insertMany(users);
    console.log(`  ✓ ${users.length} users`);

    console.log('\n🎉 Seeding complete! Database is ready.');
    await mongoose.connection.close();
  } catch (err) {
    console.error('❌ Seeding error:', err);
    await mongoose.connection.close();
    process.exit(1);
  }
}

seed();
