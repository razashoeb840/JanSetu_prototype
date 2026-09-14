const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');

// Upload setup to statically-served directory
const uploadDir = path.join(__dirname, '../others/public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Real central models
const Challenge = require('../others/models/Challenge');
const Problem = Challenge; // Single source of truth: Problem is Challenge
const User = require('../others/models/User');
const CentralNotification = require('../others/models/Notification');
const IndustryPartner = require('../others/models/IndustryPartner');
const { uploadBufferToSupabase } = require('../others/services/supabaseStorage');

// University database models
const {
  Project,
  Team,
  Mentor,
  Resource,
  Notification,
  UniversityProfile,
  Certificate,
  Proposal
} = require('./database');

// Memory storage Multer setup specifically for proposal requirements documents
const proposalDocUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (ext === '.pdf' || ext === '.docx') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file format. Only PDF (.pdf) and Word (.docx) documents are permitted.'));
    }
  }
});

const cacheService = require('../others/services/cacheService');

// Auto-invalidate problems and dependent caches on mutations
router.use((req, res, next) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    cacheService.del('problems');
    cacheService.del('challenges');
    cacheService.del('analytics');
  }
  next();
});

/* ══════════════════════════════════════════
   HEURISTIC HELPER FUNCTIONS (Stages 1 & 2)
   ══════════════════════════════════════════ */

function computeAcademicBrief(title, description, priority, category) {
  const text = `${title} ${description} ${category}`.toLowerCase();
  
  // Discipline heuristic
  let discipline = 'Computer Science';
  if (text.match(/iot|sensor|embedded|circuit|hardware|solar|microgrid|energy|meter/)) {
    discipline = 'Electronics & IoT';
  } else if (text.match(/waste|road|bridge|pothole|water|flood|drainage|civil|building/)) {
    discipline = 'Civil Engineering';
  } else if (text.match(/health|patient|hospital|clinic|doctor|telemedicine|medical/)) {
    discipline = 'Healthcare Technology';
  } else if (text.match(/data|analytics|predict|ai|ml|vision|model|forecast/)) {
    discipline = 'Data Science';
  } else if (text.match(/crop|farm|soil|agriculture|irrigation/)) {
    discipline = 'Agricultural Technology';
  }

  // Project Type & Duration heuristic
  const isHighPriority = priority === 'urgent' || priority === 'high';
  const isLengthy = (description || '').length > 100;
  const projectType = (isHighPriority || isLengthy) ? 'Capstone Project' : 'Mini Project';
  const duration = projectType === 'Capstone Project' ? '6-8 Months' : '3-5 Months';
  const semesterFit = projectType === 'Capstone Project' ? 'Semester 7-8' : 'Semester 5-6';

  return { projectType, discipline, duration, semesterFit };
}

function mapImpact(priority) {
  if (priority === 'urgent' || priority === 'high') return 'High';
  if (priority === 'low') return 'Low';
  return 'Medium';
}

async function runTwinningCheck(problem) {
  try {
    const query = { _id: { $ne: problem._id }, status: 'Open' };
    const candidates = await Problem.find(query);
    for (const cand of candidates) {
      if (cand.category === problem.category && (!problem.twinnedWith || problem.twinnedWith.length === 0)) {
        const twinA = { university: 'NIT Patna', region: cand.location || 'Bihar', status: 'In Progress', matchedAt: new Date() };
        const twinB = { university: 'IIT Delhi', region: problem.location || 'Delhi', status: 'In Progress', matchedAt: new Date() };
        
        problem.twinnedWith.push(twinA);
        cand.twinnedWith.push(twinB);
        problem.collaborationReady = true;
        cand.collaborationReady = true;
        await cand.save();
        break;
      }
    }
  } catch (e) {
    console.error('Twinning check error:', e);
  }
}

async function runForkCheck(problem) {
  try {
    const deployedProject = await Project.findOne({ stage: 'Deployed' });
    if (deployedProject) {
      problem.forkable = {
        university: deployedProject.mentor?.org || 'IIT Delhi',
        similarity: 86,
        status: 'Deployed',
        projectId: deployedProject._id
      };
    }
  } catch (e) {
    console.error('Fork check error:', e);
  }
}


/* ══════════════════════════════════════════
   STAGE 0 & 1 — REVIEW & DECIDE
   ══════════════════════════════════════════ */

// Ensure seed problem request notification exists if notifications collection is empty
router.get('/problems/ensure-seed-request', async (req, res) => {
  try {
    const count = await Notification.countDocuments({ category: 'new-problem-request' });
    if (count === 0) {
      // Find or create a mock challenge
      let challenge = await Challenge.findOne();
      if (!challenge) {
        challenge = new Challenge({
          title: 'AI-based Early Flood Warning and Drainage System',
          description: 'Develop a predictive system using water-level sensors and real-time alerts to prevent urban inundation during monsoon seasons.',
          category: 'Disaster Management',
          priority: 'high',
          status: 'submitted',
          location: { district: 'Patna', state: 'Bihar' },
          submitterContact: { name: 'Sunil Kumar', email: 'sunil.patna@gov.in', phone: '+91 98765 43210' }
        });
        await challenge.save();
      }

      const notif = new Notification({
        title: `New Problem Assigned by Admin: ${challenge.title}`,
        subtitle: `Action required: Review citizen submission from ${challenge.location?.district || 'Patna'}.`,
        text: challenge.description,
        time: 'Just now',
        timeGroup: 'Today',
        category: 'new-problem-request',
        iconType: 'shield-alert',
        iconColor: '#EA580C',
        iconBg: '#FFEDD5',
        dotColor: '#EA580C',
        actionText: 'Review Submission',
        actionUrl: '/notifications',
        unread: true,
        isHighPriority: true,
        citizenProblemId: challenge._id,
        previewSnapshot: {
          title: challenge.title,
          category: challenge.category,
          location: `${challenge.location?.district || 'Patna'}, ${challenge.location?.state || 'Bihar'}`,
          description: challenge.description,
          priority: challenge.priority || 'high',
          submitterContact: challenge.submitterContact || { name: 'Sunil Kumar', email: 'sunil.patna@gov.in' },
          attachments: challenge.attachments || []
        },
        reviewed: false
      });
      await notif.save();
      return res.json({ success: true, created: true, notification: notif });
    }
    res.json({ success: true, created: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ACCEPT CITIZEN PROBLEM (Stage 1)
router.post('/problems/review/:notifId/accept', async (req, res) => {
  try {
    const notif = await Notification.findById(req.params.notifId);
    if (!notif) return res.status(404).json({ error: 'Notification not found' });

    let citizenProblem = null;
    if (notif.citizenProblemId) {
      citizenProblem = await Challenge.findById(notif.citizenProblemId);
    }

    const title = citizenProblem?.title || notif.previewSnapshot?.title || notif.title;
    const description = citizenProblem?.description || notif.previewSnapshot?.description || notif.text;
    const category = citizenProblem?.category || notif.previewSnapshot?.category || 'General';
    const location = citizenProblem?.location 
      ? `${citizenProblem.location.district || ''}, ${citizenProblem.location.state || ''}`.replace(/^, |, $/g, '')
      : (notif.previewSnapshot?.location || 'New Delhi, Delhi');
    const priority = citizenProblem?.priority || notif.previewSnapshot?.priority || 'high';

    const academicBrief = computeAcademicBrief(title, description, priority, category);
    const impact = mapImpact(priority);

    // 1. Find or obtain Problem document
    let problem = citizenProblem;
    if (!problem && notif.citizenProblemId) {
      problem = await Problem.findById(notif.citizenProblemId);
    }

    if (!problem) {
      problem = new Problem({
        title,
        description,
        category,
        status: 'assigned',
        submitterContact: notif.previewSnapshot?.submitterContact,
        attachments: notif.previewSnapshot?.attachments || [],
        filePath: (notif.previewSnapshot?.attachments && notif.previewSnapshot.attachments[0]?.filePath) || null,
        beforeImage: notif.previewSnapshot?.attachments && notif.previewSnapshot.attachments[0]?.url || '',
        academicBrief,
        impact,
        interested: 1,
        bookmarked: false,
        collaborationReady: false,
        daysUnassigned: 0,
        twinnedWith: []
      });
    } else {
      problem.status = 'assigned';
      if (!problem.academicBrief) problem.academicBrief = academicBrief;
      if (!problem.impact) problem.impact = impact;
      if (problem.interested === undefined || problem.interested === null) problem.interested = 1;
    }

    // 2. Run Twinning and Fork Checks
    await runTwinningCheck(problem);
    await runForkCheck(problem);
    await problem.save();

    // 3. Notify citizen in CentralNotification
    try {
      const citizenUser = problem.submittedBy || (await User.findOne({ role: 'citizen' }))?._id;
      if (citizenUser) {
        const citizenNotif = new CentralNotification({
          recipient: citizenUser,
          type: 'challenge_assigned',
          title: 'Problem Accepted by University',
          message: `Your reported problem "${title}" has been accepted by IIT Delhi faculty and published for student project teams.`,
          data: { challengeId: problem._id },
          priority: 'high'
        });
        await citizenNotif.save();
      }
    } catch (e) {
      console.error('Citizen notification error:', e);
    }

    // 4. Update university notification status
    notif.reviewed = true;
    notif.reviewDecision = 'accepted';
    notif.unread = false;
    notif.subtitle = 'Accepted and added to Browse Problems.';
    notif.actionText = 'View Problem';
    notif.actionUrl = '/browse-problems';
    await notif.save();

    res.json({
      success: true,
      message: 'Problem accepted, published to Browse Problems, and citizen notified!',
      problem
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DECLINE CITIZEN PROBLEM (Stage 1)
router.post('/problems/review/:notifId/decline', async (req, res) => {
  try {
    const { reason } = req.body;
    const notif = await Notification.findById(req.params.notifId);
    if (!notif) return res.status(404).json({ error: 'Notification not found' });

    if (notif.citizenProblemId) {
      const challenge = await Challenge.findById(notif.citizenProblemId);
      if (challenge) {
        challenge.status = 'rejected';
        challenge.rejectionReason = reason || 'Does not match current university project criteria.';
        await challenge.save();

        // Notify citizen in central DB
        try {
          const citizenUser = challenge.submittedBy || (await User.findOne({ role: 'citizen' }))?._id;
          if (citizenUser) {
            const citizenNotif = new CentralNotification({
              recipient: citizenUser,
              type: 'challenge_rejected',
              title: 'Problem Review Update',
              message: `Your reported problem "${challenge.title}" was declined by the university: ${challenge.rejectionReason}`,
              data: { challengeId: challenge._id }
            });
            await citizenNotif.save();
          }
        } catch (e) {
          console.error('Citizen notification error:', e);
        }
      }
    }

    notif.reviewed = true;
    notif.reviewDecision = 'declined';
    notif.unread = false;
    notif.subtitle = `Declined: ${reason || 'Criteria mismatch'}.`;
    await notif.save();

    res.json({ success: true, message: 'Problem declined and citizen notified.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


/* ══════════════════════════════════════════
   STAGE 2 — BROWSE PROBLEMS & DISCOVERY
   ══════════════════════════════════════════ */

function enrichProblemDoc(p) {
  const obj = p.toObject ? p.toObject() : { ...p };
  const cat = (obj.category || '').toLowerCase();
  const t = (obj.title || '').toLowerCase();

  // Extract citizen photos and video from attachments if present
  let photoAttachments = [];
  let videoAttachment = null;

  if (Array.isArray(obj.attachments) && obj.attachments.length > 0) {
    obj.attachments.forEach(att => {
      if (!att || !att.url) return;
      const url = att.url;
      const isVideo = (att.mimetype && att.mimetype.startsWith('video/')) ||
                      /\.(mp4|webm|mov|ogg)$/i.test(url) ||
                      (att.filename && /\.(mp4|webm|mov|ogg)$/i.test(att.filename));
      if (isVideo) {
        if (!videoAttachment) videoAttachment = att;
      } else {
        photoAttachments.push(att);
      }
    });
  }

  // Set videoUrl if detected from citizen attachments
  if (videoAttachment && !obj.videoUrl) {
    obj.videoUrl = videoAttachment.url;
  }

  // Set beforeImage - STRICTLY real citizen uploaded photo only, no fake AI images
  let before = null;
  if (photoAttachments.length > 0) {
    before = photoAttachments[0].url;
  } else if (obj.beforeImage && !obj.beforeImage.startsWith('/images/')) {
    before = obj.beforeImage;
  }

  obj.beforeImage = before;
  obj.hasCitizenPhoto = Boolean(before);
  obj.photoCount = photoAttachments.length || (before ? 1 : 0);
  obj.challengeId = obj.challengeId || obj.reportId || ('JH-2026-' + (Math.abs(((obj._id || '').toString()).charCodeAt(0) * 85 % 9000 + 1000)));
  obj.reportId = obj.challengeId;
  obj.supportCount = obj.supportCount || 24;
  obj.reportedAgo = obj.reportedAgo || 'Reported 1 days ago';
  obj.adminVerified = true;
  obj.submitterRole = obj.submitterRole || 'Primary Submitter';
  obj.officialSlipId = obj.officialSlipId || `SLIP-${obj.challengeId}`;

  // Handle both object and string location safely
  if (obj.location && typeof obj.location === 'object') {
    const locObj = obj.location;
    if (!obj.fullLocation || !obj.fullLocation.district) {
      obj.fullLocation = {
        village: locObj.city || locObj.district || 'Chaibasa Village',
        block: 'Chaibasa Block',
        district: locObj.district || 'West Singhbhum',
        state: locObj.state || 'Jharkhand',
        pincode: locObj.pincode || '833201',
        address: locObj.address || `${locObj.district || ''}, ${locObj.state || ''}`.replace(/^, |, $/g, ''),
        coordinates: locObj.coordinates || { lat: 22.5544, lng: 85.8096 }
      };
    }
    obj.location = `${locObj.district || locObj.city || ''}, ${locObj.state || ''}`.replace(/^, |, $/g, '') || locObj.address || 'West Singhbhum, Jharkhand';
  } else {
    const locParts = (typeof obj.location === 'string' ? obj.location : 'West Singhbhum, Jharkhand').split(',');
    if (!obj.fullLocation || !obj.fullLocation.district) {
      obj.fullLocation = {
        village: 'Chaibasa Village',
        block: 'Chaibasa Block',
        district: locParts[0]?.trim() || 'West Singhbhum',
        state: locParts[1]?.trim() || 'Jharkhand',
        pincode: '833201',
        address: `${locParts[0]?.trim() || 'West Singhbhum'}, ${locParts[1]?.trim() || 'Jharkhand'}`,
        coordinates: { lat: 22.5544, lng: 85.8096 }
      };
    }
  }

  if (!obj.authority) {
    obj.authority = 'Assigned Taskforce: National Institute of Technology Jamshedpur';
  }

  if (!obj.department) {
    obj.department = cat.includes('health') ? 'Department of Health & Family Welfare' :
      cat.includes('water') ? 'Jal Shakti & Rural Drinking Water Mission' :
      cat.includes('rural') ? 'Department of Rural Development & Tribal Welfare' :
      'Department of Municipal Affairs & Infrastructure';
  }

  // Populate evidenceMedia from real citizen photo attachments
  if (photoAttachments.length > 0) {
    obj.evidenceMedia = photoAttachments.map((att, idx) => ({
      mediaType: 'image',
      url: att.url,
      filePath: att.filePath || null,
      title: att.originalName || `Citizen Ground Evidence Photo ${idx + 1}`,
      size: att.size ? `${(att.size / (1024 * 1024)).toFixed(1)} MB` : '2.4 MB',
      timestamp: 'Verified Field Evidence'
    }));
  } else if (before) {
    obj.evidenceMedia = [
      { mediaType: 'image', url: before, title: 'Ground Evidence Photo 1 (Citizen Upload)', size: '2.4 MB', timestamp: 'Verified Field Evidence' }
    ];
  } else {
    obj.evidenceMedia = [];
  }

  return obj;
}

router.get('/problems', cacheService.middleware('problems:list', 60), async (req, res) => {
  try {
    const { category, impact, discipline, search } = req.query;

    let query = {};
    if (category && category !== 'All') query.category = category;
    if (impact && impact !== 'All Levels') query.impact = impact.replace(' Impact', '');
    if (discipline && discipline !== 'All Disciplines') query['academicBrief.discipline'] = discipline;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { challengeId: { $regex: search, $options: 'i' } }
      ];
    }

    let problems = await Problem.find(query).sort({ createdAt: -1 }).lean();

    const enriched = problems.map(enrichProblemDoc);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/problems/:id', async (req, res) => {
  try {
    const p = await Problem.findById(req.params.id);
    if (p) return res.json(enrichProblemDoc(p));

    const c = await Challenge.findById(req.params.id);
    if (c) {
      return res.json(enrichProblemDoc({
        _id: c._id,
        id: c._id,
        title: c.title,
        description: c.description,
        category: c.category,
        location: `${c.location?.district || 'West Singhbhum'}, ${c.location?.state || 'Jharkhand'}`,
        impact: mapImpact(c.priority),
        academicBrief: computeAcademicBrief(c.title, c.description, c.priority, c.category),
        attachments: c.attachments,
        submitterContact: c.submitterContact,
        challengeId: c.challengeId,
        twinnedWith: [],
        status: 'Open'
      }));
    }
    res.status(404).json({ error: 'Problem not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/problems/:id/bookmark', async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);
    if (problem) {
      problem.bookmarked = !problem.bookmarked;
      await problem.save();
      return res.json({ success: true, bookmarked: problem.bookmarked });
    }
    res.json({ success: true, bookmarked: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CLAIM PROBLEM (Pre-Team Formation)
router.post('/problems/:id/claim', async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);
    if (problem) {
      problem.status = 'Assigned';
      problem.collaborationReady = true;
      await problem.save();
      return res.json({ success: true, problem });
    }
    const challenge = await Challenge.findById(req.params.id);
    if (challenge) {
      challenge.status = 'in_progress';
      await challenge.save();
      return res.json({ success: true, challenge });
    }
    res.status(404).json({ error: 'Problem not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// FORK SOLUTION (Stage 2/3)
router.post('/problems/:id/fork', async (req, res) => {
  try {
    const original = await Problem.findById(req.params.id);
    const title = original ? `[Fork] ${original.title}` : 'Forked Solution Project';
    
    const project = new Project({
      title,
      problemId: original?._id,
      stage: 'Assigned',
      status: 'Assigned',
      progress: 0,
      type: original?.category || 'General',
      loc: original?.location || 'New Delhi',
      team: ['Arjun Sharma', 'Priya Kumar', 'Rahul Mehra', 'Sneha Tiwari'],
      teamSize: 4,
      milestones: [
        { name: 'proposal', title: 'Fork Architecture & Customization Plan', status: 'pending' },
        { name: 'prototype', title: 'Adapted Working Model', status: 'pending' },
        { name: 'report', title: 'Validation & Deployment Report', status: 'pending' }
      ],
      forkableFrom: original?.forkable ? {
        projectId: original.forkable.projectId,
        university: original.forkable.university
      } : null
    });
    await project.save();

    // Fire notification to faculty mentor
    const notif = new Notification({
      title: `Forked Project Initialized: ${title}`,
      subtitle: 'Starting adaptation from proven solution.',
      category: 'team',
      actionUrl: '/my-projects'
    });
    await notif.save();

    res.json({ success: true, message: 'Project forked successfully!', project });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ══════════════════════════════════════════
   UNIVERSITY <-> CITIZEN CHAT & INQUIRIES
   ══════════════════════════════════════════ */

// Unified Tripartite Problem Chat Routes (Citizen, University Guide, Admin)
const { getChallengeChat, postChallengeChatMessage, markChallengeChatRead } = require('../others/controllers/challengeController');
router.get('/problems/:id/chat', getChallengeChat);
router.post('/problems/:id/chat', postChallengeChatMessage);
router.post('/problems/:id/chat/mark-read', markChallengeChatRead);


// 3. Citizen Replies to University
router.post('/problems/:id/citizen-reply', async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);
    if (!problem) return res.status(404).json({ error: 'Problem not found' });

    const text = (req.body.text || '').trim();
    if (!text) return res.status(400).json({ error: 'Reply text is required' });

    const citizenName = req.body.citizenName || problem.submitterContact?.name || 'Verified Citizen';
    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const replyMsg = {
      sender: citizenName,
      senderRole: 'Citizen Submitter',
      senderAvatar: (citizenName[0] || 'C').toUpperCase(),
      text,
      time: timeStr,
      timestamp: new Date(),
      isUniversity: false
    };

    if (!problem.chatMessages) problem.chatMessages = [];
    problem.chatMessages.push(replyMsg);
    await problem.save();

    // Create high-priority University Notification for University workspace
    const uniNotif = new Notification({
      title: `💬 Citizen Reply: ${citizenName}`,
      subtitle: `"${text.length > 120 ? text.slice(0, 120) + '...' : text}" on ${problem.title}`,
      category: 'problem',
      iconType: 'message',
      iconColor: '#10B981',
      iconBg: '#DCFCE7',
      dotColor: '#10B981',
      actionText: 'View & Reply',
      actionUrl: `/browse-problems?openChat=${problem._id}`,
      unread: true,
      timeGroup: 'Today'
    });
    await uniNotif.save();

    res.json({ success: true, message: 'Reply sent to university team', chatMessages: problem.chatMessages, replyMsg });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Public route for Citizen portal to read problem details & messages
router.get('/citizen-chat/problems/:id', async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);
    if (!problem) return res.status(404).json({ error: 'Problem not found' });
    res.json({
      success: true,
      problem: {
        _id: problem._id,
        title: problem.title,
        category: problem.category,
        location: problem.location,
        submitterContact: problem.submitterContact
      },
      messages: problem.chatMessages || []
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Citizen notifications fallback endpoint
router.get('/citizen-notifications', async (req, res) => {
  try {
    const notifs = await CentralNotification.find({
      $or: [
        { type: 'message' },
        { priority: 'high' }
      ]
    }).sort({ createdAt: -1 }).limit(25);
    res.json({ success: true, data: notifs });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


/* ══════════════════════════════════════════
   STAGE 3 — A TEAM PICKS IT UP
   ══════════════════════════════════════════ */

router.post('/projects', async (req, res) => {
  try {
    const { problemId, title, description, team, teamId } = req.body;
    let projTitle = title || 'New Innovation Project';
    let category = 'General';
    let location = 'New Delhi';

    let linkedProblem = null;
    if (problemId) {
      linkedProblem = await Problem.findById(problemId);
      if (linkedProblem) {
        projTitle = linkedProblem.title;
        category = linkedProblem.category;
        location = linkedProblem.location;
        
        // Problem status updates to 'Assigned'
        linkedProblem.status = 'Assigned';
        await linkedProblem.save();
      }
    }

    const defaultMilestones = [
      { name: 'proposal', title: 'Problem Proposal & Architecture Spec', status: 'pending' },
      { name: 'prototype', title: 'Functional Prototype / Field Model', status: 'pending' },
      { name: 'report', title: 'Final Report & Verification Testing', status: 'pending' }
    ];

    const project = new Project({
      title: projTitle,
      problemId: linkedProblem?._id,
      teamId: teamId || null,
      stage: 'Assigned',
      status: 'Assigned',
      progress: 0,
      type: category,
      loc: location,
      team: team || [],
      teamSize: (team || []).length,
      mentor: { name: 'Dr. Rohan Mehta', org: 'IIT Delhi', initials: 'RM' },
      milestones: defaultMilestones,
      forkableFrom: linkedProblem?.forkable ? {
        projectId: linkedProblem.forkable.projectId,
        university: linkedProblem.forkable.university
      } : null
    });
    await project.save();

    // Generate team name from project title
    const cleanWords = projTitle.replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/).filter(Boolean);
    const shortName = cleanWords.slice(0, 2).map(w => w[0].toUpperCase() + w.slice(1).toLowerCase()).join('');
    const teamName = `${shortName || 'Innovators'}`;

    // Create Team in database with members: [] so members can be manually added by faculty
    const newTeam = new Team({
      name: teamName,
      project: projTitle,
      projectId: project._id,
      initiative: linkedProblem?.initiative || 'National Civic Tech Mission',
      category: category,
      location: location,
      projectType: 'Capstone Project',
      stage: 'Assigned',
      progress: 10,
      courseRecommendation: {
        skill: linkedProblem?.academicBrief?.discipline || 'Systems Engineering',
        title: `Foundations in ${linkedProblem?.academicBrief?.discipline || 'Civic Tech & Engineering'}`,
        provider: 'NPTEL & IIT Delhi',
        duration: '8 Weeks',
        cost: 'Free',
        hasCertificate: true,
        url: 'https://nptel.ac.in/'
      },
      members: [], // Empty team roster ready for manual addition
      requiredSkills: [
        { name: 'Core Architecture', status: 'missing' },
        { name: 'Full Stack Dev', status: 'missing' },
        { name: 'Field Validation & QA', status: 'missing' }
      ]
    });
    await newTeam.save();

    project.teamId = newTeam._id;
    await project.save();

    // Stage 3 Notification: Notify faculty mentor
    const notif = new Notification({
      title: `Project Picked Up: ${projTitle}`,
      subtitle: `Stage: Assigned. Ready for manual team member assignment in Team Workspace.`,
      category: 'team',
      actionText: 'Assemble Team',
      actionUrl: '/team-mentorship'
    });
    await notif.save();

    res.status(201).json({ success: true, project, team: newTeam, message: 'Project picked up and assigned to your team!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/projects', cacheService.middleware('problems:projects', 60), async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    if (status && status !== 'All') {
      if (status.toLowerCase() === 'deployed' || status.toLowerCase() === 'history') {
        query.$or = [{ stage: 'Deployed' }, { status: 'Deployed' }, { stage: 'Completed' }, { status: 'Completed' }];
      } else {
        query.$or = [{ stage: status }, { status: status }];
      }
    }
    let projects = await Project.find(query).sort({ createdAt: -1 }).lean();

    // If projects table is empty, seed defaults
    if (projects.length === 0) {
      const p1 = new Project({
        title: 'Smart Waste Management System',
        stage: 'In Progress',
        status: 'In Progress',
        progress: 1,
        type: 'Infrastructure',
        loc: 'New Delhi',
        team: ['Arjun Sharma', 'Priya Kumar', 'Rahul Mehra', 'Sneha Tiwari'],
        teamSize: 4,
        mentor: { name: 'Ms. Ananya Gupta', org: 'Microsoft', initials: 'AG' },
        milestones: [
          { name: 'proposal', title: 'Architecture Proposal', status: 'approved', approvedAt: new Date() },
          { name: 'prototype', title: 'IoT Bin Sensors Prototype', status: 'pending' },
          { name: 'report', title: 'Final Field Testing', status: 'pending' }
        ]
      });
      const p2 = new Project({
        title: 'Low-cost Water Quality Testing Kit',
        stage: 'Prototype',
        status: 'Prototype',
        progress: 2,
        type: 'Environmental Science',
        loc: 'Varanasi',
        team: ['Vikas S.', 'Neha D.'],
        teamSize: 2,
        mentor: { name: 'Dr. Arvind Rao', org: 'IISc Bengaluru', initials: 'AR' },
        milestones: [
          { name: 'proposal', title: 'Hardware Design', status: 'approved' },
          { name: 'prototype', title: 'Field Calibration', status: 'approved' },
          { name: 'report', title: 'Pond Testing Report', status: 'pending' }
        ]
      });
      await Promise.all([p1.save(), p2.save()]);
    }

    // Ensure at least one deployed project exists in DB for History tracking
    const deployedExists = await Project.exists({ $or: [{ stage: 'Deployed' }, { status: 'Deployed' }] });
    if (!deployedExists) {
      const pDeployed = new Project({
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
          { name: 'proposal', title: '1. Technical Proposal & Requirements Spec', status: 'approved', fileUrl: '/uploads/solar_water_proposal.pdf', approvedAt: new Date('2025-11-14') },
          { name: 'prototype', title: '2. Working Solar Filtration Prototype', status: 'approved', fileUrl: '/uploads/prototype_schematics.pdf', approvedAt: new Date('2025-12-22') },
          { name: 'report', title: '3. Field Water Quality Validation Report', status: 'approved', fileUrl: '/uploads/neeri_test_report.pdf', approvedAt: new Date('2026-01-28') },
          { name: 'video', title: '4. Ground Deployment Pilot & Citizen Verification', status: 'approved', fileUrl: '/uploads/ground_deployment_pilot.mp4', approvedAt: new Date('2026-02-12') }
        ]
      });
      await pDeployed.save();
      projects = await Project.find(query).sort({ createdAt: -1 }).lean();
    }

    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/projects/:id', async (req, res) => {
  try {
    const p = await Project.findById(req.params.id);
    if (!p) return res.status(404).json({ error: 'Project not found' });
    res.json(p);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/projects/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    if (req.body.stage === 'Deployed' || req.body.status === 'Deployed') {
      return deployProjectInternal(project, res);
    }

    Object.assign(project, req.body);
    if (req.body.stage) {
      project.status = req.body.stage;
      const stageMap = { 'Assigned': 0, 'In Progress': 1, 'Prototype': 2, 'Submitted': 3, 'Deployed': 4 };
      if (stageMap[req.body.stage] !== undefined) {
        project.progress = stageMap[req.body.stage];
      }
    }
    await project.save();
    res.json({ success: true, project });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/projects/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    if (req.body.stage === 'Deployed' || req.body.status === 'Deployed') {
      return deployProjectInternal(project, res);
    }

    Object.assign(project, req.body);
    if (req.body.stage) {
      project.status = req.body.stage;
      const stageMap = { 'Assigned': 0, 'In Progress': 1, 'Prototype': 2, 'Submitted': 3, 'Deployed': 4 };
      if (stageMap[req.body.stage] !== undefined) {
        project.progress = stageMap[req.body.stage];
      }
    }
    await project.save();
    res.json({ success: true, project });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/projects/:id', async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ══════════════════════════════════════════
   PROPOSAL SUBMISSION & GATING (UNIVERSITY SIDE)
   ══════════════════════════════════════════ */

const proposalUploadMiddleware = (req, res, next) => {
  proposalDocUpload.single('requirementsDocument')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, error: 'File size limit exceeded. Maximum file size allowed is 10MB.' });
      }
      return res.status(400).json({ success: false, error: err.message || 'File upload error.' });
    }
    next();
  });
};

const handleProposalSubmission = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found.' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Requirements document (PDF or DOCX) is required.' });
    }

    const ext = path.extname(req.file.originalname || '').toLowerCase();
    if (!['.pdf', '.docx'].includes(ext)) {
      return res.status(400).json({ success: false, error: 'Invalid file format. Only .pdf and .docx documents are accepted.' });
    }

    const fundingNum = Number(req.body.fundingRequested);
    if (isNaN(fundingNum) || fundingNum <= 0) {
      return res.status(400).json({ success: false, error: 'Funding requested must be a positive number.' });
    }

    let supportArray = [];
    if (req.body.industrySupportRequired) {
      if (Array.isArray(req.body.industrySupportRequired)) {
        supportArray = req.body.industrySupportRequired;
      } else if (typeof req.body.industrySupportRequired === 'string') {
        try {
          const parsed = JSON.parse(req.body.industrySupportRequired);
          supportArray = Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          supportArray = req.body.industrySupportRequired.split(',').map(s => s.trim()).filter(Boolean);
        }
      }
    }

    // Upload to Supabase Storage (with fallback to local storage)
    const uploadResult = await uploadBufferToSupabase({
      buffer: req.file.buffer,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      folder: 'proposals'
    });

    let submitterName = project.mentor?.name || 'Dr. Rohan Mehta';
    let submitterEmail = 'rohan.mehta@iitranchi.ac.in';
    let universityName = project.mentor?.org || 'IIT Ranchi';
    let submittedBy = null;

    if (req.headers.authorization) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        if (decoded && decoded.id) {
          const u = await User.findById(decoded.id);
          if (u) {
            submittedBy = u._id;
            submitterName = u.name || submitterName;
            submitterEmail = u.email || submitterEmail;
          }
        }
      } catch (err) {
        // ignore jwt error
      }
    }

    let proposal = await Proposal.findOne({ projectId: project._id });
    if (!proposal) {
      proposal = new Proposal({
        projectId: project._id,
        teamId: project.teamId || null,
        university: null,
        universityName,
        submittedBy,
        submitterName,
        submitterEmail,
        problemId: project.problemId || null,
        problemTitle: project.title,
        problemCategory: project.type || 'Infrastructure',
        fundingRequested: fundingNum,
        industrySupportRequired: supportArray,
        requirementsDocument: {
          url: uploadResult.publicUrl,
          filename: req.file.originalname,
          size: req.file.size || (req.file.buffer ? req.file.buffer.length : 0),
          mimetype: uploadResult.mimetype || req.file.mimetype,
          storageType: uploadResult.storageType || 'supabase',
          uploadedAt: new Date()
        },
        status: 'submitted'
      });
    } else {
      proposal.fundingRequested = fundingNum;
      proposal.industrySupportRequired = supportArray;
      proposal.requirementsDocument = {
        url: uploadResult.publicUrl,
        filename: req.file.originalname,
        size: req.file.size || (req.file.buffer ? req.file.buffer.length : 0),
        mimetype: uploadResult.mimetype || req.file.mimetype,
        storageType: uploadResult.storageType || 'supabase',
        uploadedAt: new Date()
      };
      proposal.status = 'submitted';
      proposal.reviewedBy = null;
      proposal.reviewedAt = null;
      proposal.reviewComment = null;
    }
    await proposal.save();

    // Lock project in proposal submitted state
    project.proposalId = proposal._id;
    project.proposalStatus = 'submitted';
    if (!project.fundingSummary) project.fundingSummary = {};
    project.fundingSummary.goal = fundingNum;
    project.fundingSummary.status = 'Pending Admin Approval';
    await project.save();

    // Dispatch CentralNotification to Admin
    try {
      const adminUsers = await User.find({ role: 'admin' });
      for (const adm of adminUsers) {
        await new CentralNotification({
          recipient: adm._id,
          type: 'proposal_submitted',
          title: 'New Solution Proposal Submitted',
          message: `New solution proposal submitted for review: "${project.title}" by ${submitterName} (${universityName}).`,
          data: {
            url: `/admin#proposals`,
            problemId: project.problemId?.toString()
          },
          priority: 'high'
        }).save();
      }
    } catch (e) {
      console.warn('Central admin notification error:', e.message);
    }

    res.status(201).json({
      success: true,
      message: 'Solution proposal submitted successfully for admin review.',
      proposal,
      project
    });
  } catch (err) {
    console.error('Proposal submission error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// University Proposal endpoints
router.post('/university/projects/:projectId/proposal', proposalUploadMiddleware, handleProposalSubmission);
router.post('/projects/:projectId/proposal', proposalUploadMiddleware, handleProposalSubmission);

router.get(['/university/projects/:projectId/proposal', '/projects/:projectId/proposal'], async (req, res) => {
  try {
    const proposal = await Proposal.findOne({ projectId: req.params.projectId })
      .populate('assignedIndustry', 'name companyName sector logo contact capabilities fundingCapacity pastCollaborations')
      .populate('reviewedBy', 'name email role')
      .lean();
    if (!proposal) {
      return res.status(404).json({ success: false, error: 'No proposal found for this project.' });
    }
    res.json({ success: true, proposal });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});



/* ══════════════════════════════════════════
   STAGE 4 — REQUESTING SUPPORT (MENTOR & FUNDING)
   ══════════════════════════════════════════ */

router.post('/projects/:id/request-mentor', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const { mentorName, org, mentorId } = req.body;
    project.industryMentor = {
      name: mentorName || 'Ms. Ananya Gupta',
      org: org || 'Microsoft',
      initials: (mentorName || 'AG').split(' ').map(w => w[0]).join('').slice(0, 2),
      status: 'Requested',
      requestedAt: new Date()
    };
    await project.save();

    // Fire notification
    const notif = new Notification({
      title: `Mentorship Requested: ${project.industryMentor.name}`,
      subtitle: `Request sent to ${project.industryMentor.org} for "${project.title}".`,
      category: 'mentor',
      actionUrl: '/team-mentorship'
    });
    await notif.save();

    res.json({ success: true, message: 'Mentorship request sent successfully!', mentor: project.industryMentor });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/projects/:id/accept-mentor', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    if (project.industryMentor) {
      project.industryMentor.status = 'Accepted';
      await project.save();
    }
    res.json({ success: true, message: 'Mentor accepted!', mentor: project.industryMentor });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/projects/:id/commit-funding', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const { amount, sponsor } = req.body;
    project.fundingSummary = {
      committed: (project.fundingSummary?.committed || 0) + (amount || 25000),
      goal: project.fundingSummary?.goal || 100000,
      sponsor: sponsor || 'Industry CSR Partner'
    };
    await project.save();
    res.json({ success: true, fundingSummary: project.fundingSummary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


/* ══════════════════════════════════════════
   STAGE 5 — ACTIVE WORK (MILESTONES & APPROVAL GATE)
   ══════════════════════════════════════════ */

// 1. Team uploads milestone artifact via multer
router.post('/projects/:id/milestones/:name/upload', upload.single('file'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const fileUrl = req.file ? `/uploads/${req.file.filename}` : '/uploads/submission.pdf';
    
    let milestone = project.milestones.find(m => m.name === req.params.name || m.title === req.params.name);
    if (!milestone) {
      milestone = {
        name: req.params.name,
        title: req.body.title || req.params.name,
        status: 'pending_review'
      };
      project.milestones.push(milestone);
    }
    
    milestone.fileUrl = fileUrl;
    milestone.uploadedAt = new Date();
    milestone.status = 'pending_review';

    await project.save();

    // Fire notification to assigned mentor
    const notif = new Notification({
      title: `New Milestone Submitted for Review: ${milestone.title || req.params.name}`,
      subtitle: `Project "${project.title}" requires mentor review and approval.`,
      category: 'deadline',
      actionText: 'Review Milestone',
      actionUrl: '/my-projects'
    });
    await notif.save();

    res.json({ success: true, fileUrl, milestone, message: 'Milestone uploaded and sent for mentor review!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Mentor explicitly approves milestone (Stage advances on approval)
router.patch('/projects/:id/milestones/:name/approve', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    let milestone = project.milestones.find(m => m.name === req.params.name || m.title === req.params.name);
    if (milestone) {
      milestone.status = 'approved';
      milestone.approvedAt = new Date();
      milestone.approvedBy = req.body.approvedBy || 'Mentor';
    }

    // Advance Stage Gate
    if (project.stage === 'Assigned') {
      project.stage = 'In Progress';
      project.status = 'In Progress';
      project.progress = 1;
    } else if (project.stage === 'In Progress') {
      project.stage = 'Prototype';
      project.status = 'Prototype';
      project.progress = 2;
    } else if (project.stage === 'Prototype') {
      project.stage = 'Submitted';
      project.status = 'Submitted';
      project.progress = 3;
    }

    await project.save();

    // Fire notification back to team
    const notif = new Notification({
      title: `Milestone Approved: ${milestone?.title || req.params.name}`,
      subtitle: `Project stage advanced to "${project.stage}"! Keep up the momentum.`,
      category: 'team',
      actionUrl: '/my-projects'
    });
    await notif.save();

    res.json({
      success: true,
      message: `Milestone approved! Project advanced to ${project.stage}.`,
      stage: project.stage,
      project
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Mentor rejects/requests revision
router.patch('/projects/:id/milestones/:name/reject', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    let milestone = project.milestones.find(m => m.name === req.params.name || m.title === req.params.name);
    if (milestone) {
      milestone.status = 'needs_revision';
      milestone.feedback = req.body.feedback || 'Please refine the architecture specifications.';
    }
    await project.save();

    const notif = new Notification({
      title: `Milestone Needs Revision: ${milestone?.title || req.params.name}`,
      subtitle: req.body.feedback || 'Please update your submission based on mentor feedback.',
      category: 'deadline',
      actionUrl: '/my-projects'
    });
    await notif.save();

    res.json({ success: true, message: 'Revision feedback sent to team.', project });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


/* ══════════════════════════════════════════
   STAGE 6 — DEPLOYED (4 ACTIONS AT ONCE)
   ══════════════════════════════════════════ */

async function deployProjectInternal(project, res) {
  project.stage = 'Deployed';
  project.status = 'Deployed';
  project.progress = 4;
  project.isBattleTested = true;
  project.deployedAt = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  // 1. Action 1: Auto-generate Battle-Tested Resource
  let resource = await Resource.findOne({ linkedProblems: project.problemId });
  if (!resource) {
    resource = new Resource({
      title: `${project.title} — Verified Deployment Model`,
      type: 'Solution Blueprint',
      discipline: project.type || 'Computer Science',
      format: 'ZIP / Code & Docs',
      size: '18.4 MB',
      source: 'JanSetu Innovation Hub',
      description: `Complete verified and deployed solution for "${project.title}". Contains architecture diagrams, deployment scripts, firmware/app binaries, and verified test results.`,
      downloads: 14,
      date: new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
      linkedProblems: project.problemId ? [project.problemId.toString()] : [],
      rating: 4.9,
      ratingCount: 18,
      fileUrl: project.milestones?.[0]?.fileUrl || '/uploads/deployment-package.zip',
      isBattleTested: true
    });
    await resource.save();
    project.battleTestedResourceId = resource._id;
  }

  // 2. Action 2: Certificates issued for all team members
  const issuedCerts = [];
  const teamMembers = (project.team && project.team.length > 0) ? project.team : ['Arjun Sharma', 'Priya Kumar', 'Rahul Mehra', 'Sneha Tiwari'];
  
  for (const member of teamMembers) {
    const cert = new Certificate({
      projectId: project._id,
      projectTitle: project.title,
      recipientName: member,
      recipientRole: 'Lead Innovator',
      university: 'IIT Delhi',
      issueDate: new Date(),
      status: 'Issued',
      downloadUrl: `/uploads/certificates/${project._id}-${member.replace(/\s+/g, '_')}.pdf`
    });
    await cert.save();
    issuedCerts.push(cert);
  }
  project.certificatesIssued = true;

  // 3. Action 3: Notify Citizen & Close Feedback Loop in central DB
  try {
    let challengeId = null;
    let citizenUser = null;
    if (project.problemId) {
      const prob = await Problem.findById(project.problemId);
      if (prob && prob.sourceCitizenProblemId) {
        challengeId = prob.sourceCitizenProblemId;
        const chal = await Challenge.findById(challengeId);
        if (chal) {
          chal.status = 'resolved';
          chal.resolvedAt = new Date();
          await chal.save();
          citizenUser = chal.submittedBy;
        }
      }
    }

    if (!citizenUser) {
      const defaultCitizen = await User.findOne({ role: 'citizen' });
      citizenUser = defaultCitizen?._id;
    }

    if (citizenUser) {
      const citizenNotif = new CentralNotification({
        recipient: citizenUser,
        type: 'challenge_resolved',
        title: 'Solution Deployed for Your Reported Problem! 🚀',
        message: `Your reported problem now has a deployed solution developed by university teams. Please test it and leave your rating and feedback.`,
        data: { challengeId: challengeId || project._id },
        priority: 'high'
      });
      await citizenNotif.save();
    }
  } catch (e) {
    console.error('Citizen feedback notification error:', e);
  }

  // University notification
  const uniNotif = new Notification({
    title: `🎉 Project Successfully Deployed: ${project.title}`,
    subtitle: `Battle-Tested Resource created and official certificates issued to ${teamMembers.length} members!`,
    category: 'system',
    iconType: 'trophy',
    iconColor: '#16A34A',
    iconBg: '#DCFCE7',
    dotColor: '#16A34A',
    actionText: 'View Certificates',
    actionUrl: '/profile'
  });
  await uniNotif.save();

  await project.save();

  return res.json({
    success: true,
    message: 'Project marked DEPLOYED! Deployment triggers fired: Proven Resource published, Certificates issued, Citizen notified!',
    project,
    resource,
    certificatesCount: issuedCerts.length,
    innovationPoints: 500
  });
}

router.patch('/projects/:id/deploy', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    return deployProjectInternal(project, res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


/* ══════════════════════════════════════════
   STAGE 7 — CITIZEN FEEDBACK & CERTIFICATES
   ══════════════════════════════════════════ */

router.post('/projects/:id/citizen-feedback', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const feedbackItem = {
      rating: req.body.rating || 5,
      comment: req.body.comment || 'The solution resolved our area issue effectively.',
      submittedAt: new Date()
    };
    if (!project.citizenFeedback) project.citizenFeedback = [];
    project.citizenFeedback.push(feedbackItem);
    await project.save();

    res.json({ success: true, message: 'Citizen feedback recorded!', citizenFeedback: project.citizenFeedback });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PROJECT DISCUSSION (Live Faculty-Student Discussion)
router.post('/projects/:id/discussion', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const newMsg = {
      sender: req.body.sender || 'Faculty Guide',
      role: req.body.role || 'Faculty / Mentor',
      text: req.body.text || '',
      time: req.body.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMentor: req.body.isMentor !== undefined ? req.body.isMentor : true
    };
    if (!project.discussion) project.discussion = [];
    project.discussion.push(newMsg);
    await project.save();

    res.json({ success: true, discussion: project.discussion, message: newMsg });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PROJECT DEADLINES (Milestone Deadlines Management)
router.post('/projects/:id/deadlines', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const newDeadline = {
      title: req.body.title || 'Milestone Target',
      date: req.body.date || 'TBD',
      tag: req.body.tag || 'Target',
      isLight: req.body.isLight || false
    };
    if (!project.deadlines) project.deadlines = [];
    project.deadlines.push(newDeadline);
    await project.save();

    res.json({ success: true, deadlines: project.deadlines });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/projects/:id/deadlines/:index', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const idx = parseInt(req.params.index, 10);
    if (!project.deadlines || isNaN(idx) || idx < 0 || idx >= project.deadlines.length) {
      return res.status(400).json({ error: 'Invalid deadline index' });
    }
    project.deadlines.splice(idx, 1);
    await project.save();

    res.json({ success: true, deadlines: project.deadlines });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/certificates', async (req, res) => {
  try {
    const certs = await Certificate.find().sort({ createdAt: -1 });
    res.json(certs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


/* ══════════════════════════════════════════
   NOTIFICATIONS API (University Module)
   ══════════════════════════════════════════ */

router.get('/university-notifications', async (req, res) => {
  try {
    let notifs = await Notification.find().sort({ createdAt: -1 });
    
    // Ensure initial Stage 0 request exists if not found
    const hasStage0 = notifs.some(n => n.category === 'new-problem-request');
    if (!hasStage0) {
      const initNotif = new Notification({
        title: 'New Problem Assigned by Admin: AI-based Early Flood Warning System',
        subtitle: 'Review submission from Patna, Bihar with accept/decline action.',
        category: 'new-problem-request',
        timeGroup: 'Today',
        iconType: 'shield-alert',
        iconColor: '#EA580C',
        iconBg: '#FFEDD5',
        dotColor: '#EA580C',
        actionText: 'Review Submission',
        actionUrl: '/notifications',
        unread: true,
        isHighPriority: true,
        previewSnapshot: {
          title: 'AI-based Early Flood Warning and Drainage System',
          category: 'Disaster Management',
          location: 'Patna, Bihar',
          description: 'Deploy low-cost ultrasonic water level sensors and cloud-based notification platform to warn low-lying urban wards of flash flooding 3 hours in advance.',
          priority: 'high',
          submitterContact: { name: 'Sunil Kumar (Ward Officer)', email: 'sunil.patna@gov.in' }
        },
        reviewed: false
      });
      await initNotif.save();
      notifs = await Notification.find().sort({ createdAt: -1 });
    }

    res.json(notifs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/university-notifications/read-all', async (req, res) => {
  try {
    await Notification.updateMany({ unread: true }, { unread: false });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/university-notifications/:id/toggle-read', async (req, res) => {
  try {
    const n = await Notification.findById(req.params.id);
    if (!n) return res.status(404).json({ error: 'Not found' });
    n.unread = !n.unread;
    await n.save();
    res.json(n);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/university-notifications/:id', async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


/* ══════════════════════════════════════════
   RESOURCES & DOWNLOADS API
   ══════════════════════════════════════════ */

router.get('/resources', async (req, res) => {
  try {
    let resources = await Resource.find().sort({ isBattleTested: -1, createdAt: -1 });
    if (resources.length === 0) {
      // Seed initial sample resources
      const r1 = new Resource({
        title: 'IoT Sensor Firmware for Urban Waste Containers',
        type: 'Source Code',
        discipline: 'Electronics & IoT',
        format: 'C++ / ESP32',
        size: '4.2 MB',
        source: 'IIT Delhi Innovation Lab',
        description: 'Ultra low-power ultrasonic bin sensor firmware with LoRaWAN and 4G transmission protocol.',
        downloads: 142,
        date: 'Aug 2026',
        rating: 4.9,
        ratingCount: 38,
        isBattleTested: true
      });
      const r2 = new Resource({
        title: 'Water Potability ML Classifier Model & Dataset',
        type: 'Dataset',
        discipline: 'Data Science',
        format: 'Python / PyTorch',
        size: '48.1 MB',
        source: 'IISc Bengaluru',
        description: 'Random Forest and Deep Neural Network classifier trained on 120,000 rural groundwater samples.',
        downloads: 215,
        date: 'Jul 2026',
        rating: 4.8,
        ratingCount: 52,
        isBattleTested: true
      });
      await r1.save();
      await r2.save();
      resources = await Resource.find().sort({ isBattleTested: -1, createdAt: -1 });
    }
    res.json(resources);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/resources/:id/bookmark', async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ error: 'Resource not found' });
    const mockUserId = '111122223333444455556666'; 
    if (!resource.bookmarkedBy) resource.bookmarkedBy = [];
    if (resource.bookmarkedBy.includes(mockUserId)) {
      resource.bookmarkedBy = resource.bookmarkedBy.filter(id => id.toString() !== mockUserId);
    } else {
      resource.bookmarkedBy.push(mockUserId);
    }
    await resource.save();
    res.json({ success: true, bookmarked: resource.bookmarkedBy.includes(mockUserId) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/resources/:id/download-count', async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ error: 'Resource not found' });
    resource.downloads = (resource.downloads || 0) + 1;
    await resource.save();
    res.json({ success: true, downloads: resource.downloads });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/resources', upload.single('file'), async (req, res) => {
  try {
    const resource = new Resource({
      ...req.body,
      fileUrl: req.file ? `/uploads/${req.file.filename}` : null,
      date: new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    });
    await resource.save();
    res.status(201).json(resource);
  } catch (err) { res.status(500).json({ error: err.message }); }
});


/* ══════════════════════════════════════════
   TEAMS & MENTORS API
   ══════════════════════════════════════════ */

router.get('/teams', async (req, res) => {
  try {
    let teams = await Team.find();
    if (teams.length < 5) {
      const initialTeams = [
        {
          name: 'EcoSolvers',
          project: 'Smart Waste Management System',
          initiative: 'Clean India Initiative',
          category: 'Infrastructure & Environment',
          location: 'New Delhi, Delhi',
          projectType: 'Capstone Project',
          stage: 'In Progress',
          progress: 65,
          createdAt: 'Aug 2026',
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
          name: 'AquaGuardians',
          project: 'Flood Alert & Evacuation System',
          initiative: 'Disaster Resilience Mission',
          category: 'Disaster Management',
          location: 'Patna, Bihar',
          projectType: 'Capstone Project',
          stage: 'Assigned',
          progress: 25,
          createdAt: 'Sep 2026',
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
          name: 'CareFlow Innovations',
          project: 'Smart Queue Management for Government Hospitals',
          initiative: 'Ayushman Bharat Digital Health',
          category: 'Healthcare Technology',
          location: 'Ranchi, Jharkhand',
          projectType: 'Capstone Project',
          stage: 'Deployed',
          progress: 100,
          createdAt: 'Jul 2026',
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
          name: 'VoltVisionaries',
          project: 'Smart Campus Energy Monitor',
          initiative: 'Green Campus Initiative',
          category: 'Smart Energy & Electronics',
          location: 'New Delhi, Delhi',
          projectType: 'Mini Project',
          stage: 'Assigned',
          progress: 30,
          createdAt: 'Aug 2026',
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
          name: 'JalSuraksha',
          project: 'Low-cost Water Quality Testing Kit',
          initiative: 'Jal Jeevan Mission',
          category: 'Water Quality & Sanitation',
          location: 'Khunti, Jharkhand',
          projectType: 'Capstone Project',
          stage: 'Deployed',
          progress: 100,
          createdAt: 'Jun 2026',
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

      for (const t of initialTeams) {
        const existing = await Team.findOne({ project: t.project });
        if (!existing) {
          await Team.create(t);
        }
      }
    }

    // Auto-sync: ensure any active (non-deployed) Project has a corresponding Team document
    const activeProjects = await Project.find({
      stage: { $nin: ['Deployed', 'Completed'] },
      status: { $nin: ['Deployed', 'Completed'] }
    }).sort({ createdAt: -1 });

    for (const proj of activeProjects) {
      const existingTeam = await Team.findOne({
        $or: [{ projectId: proj._id }, { project: proj.title }]
      });
      if (!existingTeam) {
        const cleanWords = (proj.title || 'Project').replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/).filter(Boolean);
        const shortName = cleanWords.slice(0, 2).map(w => w[0].toUpperCase() + w.slice(1).toLowerCase()).join('');
        const teamName = `${shortName || 'Innovators'}`;

        const createdTeam = await Team.create({
          name: teamName,
          project: proj.title,
          projectId: proj._id,
          initiative: 'National Civic Tech Mission',
          category: proj.type || 'Engineering & Civic Tech',
          location: proj.loc || 'India',
          projectType: 'Capstone Project',
          stage: proj.stage || 'Assigned',
          progress: proj.progress || 10,
          members: Array.isArray(proj.team) && proj.team.length > 0 && typeof proj.team[0] === 'object'
            ? proj.team
            : [],
          requiredSkills: [
            { name: 'Core Architecture', status: 'missing' },
            { name: 'Full Stack Dev', status: 'missing' },
            { name: 'Field Validation & QA', status: 'missing' }
          ]
        });
        proj.teamId = createdTeam._id;
        await proj.save();
      } else if (!existingTeam.projectId) {
        existingTeam.projectId = proj._id;
        if (proj.stage) existingTeam.stage = proj.stage;
        await existingTeam.save();
      }
    }

    // Sync any deployed projects to ensure Team.stage matches Deployed (only if no active project exists for that title)
    const deployedProjects = await Project.find({
      $or: [{ stage: 'Deployed' }, { status: 'Deployed' }]
    }).select('_id title stage');
    for (const dp of deployedProjects) {
      const hasActive = await Project.findOne({
        title: dp.title,
        stage: { $nin: ['Deployed', 'Completed'] },
        status: { $nin: ['Deployed', 'Completed'] }
      });
      if (!hasActive) {
        await Team.updateMany(
          { $or: [{ projectId: dp._id }, { project: dp.title }] },
          { stage: 'Deployed', progress: 100 }
        );
      } else {
        await Team.updateMany(
          { projectId: dp._id },
          { stage: 'Deployed', progress: 100 }
        );
      }
    }

    // Return all teams sorted newest first
    teams = await Team.find().sort({ _id: -1 });
    res.json(teams);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/teams', async (req, res) => {
  try {
    const {
      name,
      project,
      projectId,
      problemId,
      initiative,
      category,
      location,
      projectType,
      stage,
      progress,
      members,
      leadName,
      leadEmail,
      leadRole,
      leadExpertise,
      requiredSkills,
      courseRecommendation
    } = req.body;

    const teamName = (name || `${project || 'Civic'} Innovators`).trim();
    const projectName = (project || 'Innovation Challenge').trim();

    // Prepare members list
    const avatarGradients = [
      'linear-gradient(135deg, #10B981, #059669)',
      'linear-gradient(135deg, #8B5CF6, #6366F1)',
      'linear-gradient(135deg, #3B82F6, #1D4ED8)',
      'linear-gradient(135deg, #F97316, #EA580C)',
      'linear-gradient(135deg, #EC4899, #BE185D)',
      'linear-gradient(135deg, #06B6D4, #0891B2)'
    ];

    let teamMembers = [];
    if (Array.isArray(members) && members.length > 0) {
      teamMembers = members.map((m, idx) => {
        const mName = m.name || `Member ${idx + 1}`;
        const initials = mName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'TM';
        return {
          name: mName,
          email: m.email || `${mName.toLowerCase().replace(/\s+/g, '.')}@iitd.ac.in`,
          role: m.role || (idx === 0 ? 'Team Lead' : 'Team Member'),
          avatar: initials,
          color: m.color || avatarGradients[idx % avatarGradients.length],
          expertise: m.expertise || 'Software Engineering',
          status: m.status || 'Active',
          joinedDate: 'Just now'
        };
      });
    } else if (leadName) {
      const initials = leadName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'TL';
      teamMembers.push({
        name: leadName,
        email: leadEmail || `${leadName.toLowerCase().replace(/\s+/g, '.')}@iitd.ac.in`,
        role: leadRole || 'Team Lead',
        avatar: initials,
        color: avatarGradients[0],
        expertise: leadExpertise || 'Full Stack & Architecture',
        status: 'Active',
        joinedDate: 'Just now'
      });
    } else {
      teamMembers.push({
        name: 'Student Lead',
        email: 'lead@iitd.ac.in',
        role: 'Team Lead',
        avatar: 'SL',
        color: avatarGradients[0],
        expertise: 'Software & Systems',
        status: 'Active',
        joinedDate: 'Just now'
      });
    }

    // Determine domain course recommendation
    let course = courseRecommendation;
    if (!course || !course.title) {
      const pLower = (projectName + ' ' + (category || '')).toLowerCase();
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
    }

    // Determine domain skills
    let skills = requiredSkills;
    if (!Array.isArray(skills) || skills.length === 0) {
      skills = [
        { name: 'Python / C++', status: 'present' },
        { name: course.skill || 'Domain Specialization', status: 'missing' },
        { name: 'Data Pipeline', status: 'present' },
        { name: 'React UI', status: 'present' },
        { name: 'Cloud APIs', status: 'present' }
      ];
    }

    // Create Team document
    const newTeam = new Team({
      name: teamName,
      project: projectName,
      projectId: projectId || undefined,
      initiative: initiative || 'National Innovation & Civic Tech Mission',
      category: category || 'Infrastructure & Environment',
      location: location || 'New Delhi, Delhi',
      projectType: projectType || 'Capstone Project',
      stage: stage || 'Assigned',
      progress: typeof progress === 'number' ? progress : 20,
      courseRecommendation: course,
      members: teamMembers,
      requiredSkills: skills,
      createdAt: 'Sep 2026'
    });

    await newTeam.save();

    // If a Problem is referenced, update its status to 'Assigned'
    if (problemId) {
      try {
        await Problem.findByIdAndUpdate(problemId, {
          status: 'Assigned',
          collaborationReady: true
        });
      } catch (e) {
        console.warn('Could not update problem status:', e.message);
      }
    }

    // Link or create corresponding Project document
    try {
      let linkedProject = null;
      if (projectId) {
        linkedProject = await Project.findById(projectId);
      }
      if (!linkedProject) {
        linkedProject = await Project.findOne({ title: projectName });
      }

      if (!linkedProject) {
        linkedProject = new Project({
          title: projectName,
          problemId: problemId || undefined,
          teamId: newTeam._id,
          stage: stage || 'Assigned',
          status: stage || 'Assigned',
          progress: typeof progress === 'number' ? progress : 15,
          loc: location || 'New Delhi, Delhi',
          type: projectType || 'Capstone Project',
          team: teamMembers.map(m => m.name),
          teamSize: teamMembers.length,
          milestones: [
            { name: 'm1', title: 'Problem Formulation & Literature Study', status: 'approved', uploadedAt: new Date() },
            { name: 'm2', title: 'System Architecture & Blueprint Review', status: 'pending_review' },
            { name: 'm3', title: 'Working Prototype & Laboratory Simulation', status: 'pending' },
            { name: 'm4', title: 'Field Pilot, Validation & Citizen Feedback', status: 'pending' }
          ]
        });
        await linkedProject.save();
      } else {
        linkedProject.teamId = newTeam._id;
        linkedProject.team = teamMembers.map(m => m.name);
        linkedProject.teamSize = teamMembers.length;
        if (linkedProject.stage === 'Open') linkedProject.stage = 'Assigned';
        await linkedProject.save();
      }

      newTeam.projectId = linkedProject._id;
      await newTeam.save();
    } catch (projErr) {
      console.warn('Project linking notice:', projErr.message);
    }

    res.status(201).json(newTeam);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/teams/:id/members', async (req, res) => {
  try {
    const team = await Team.findById(req.params.id) || await Team.findOne({ project: req.params.id });
    if (!team) return res.status(404).json({ error: 'Team not found' });
    
    const name = req.body.name || (req.body.email || 'Member').split('@')[0];
    const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'TM';
    
    team.members.push({
      name: name,
      email: req.body.email || `${name.toLowerCase().replace(/\s+/g, '.')}@iitd.ac.in`,
      role: req.body.role || 'Team Member',
      avatar: initials,
      color: req.body.color || 'linear-gradient(135deg, #6366F1, #8B5CF6)',
      expertise: req.body.expertise || 'Software Engineering',
      status: req.body.status || 'Active',
      joinedDate: 'Just now'
    });
    await team.save();

    // Sync back to Project
    if (team.projectId || team.project) {
      await Project.updateMany(
        { $or: [{ _id: team.projectId }, { title: team.project }] },
        { team: team.members.map(m => m.name), teamSize: team.members.length }
      );
    }

    res.json(team);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/teams/:id/members/:memberIndex', async (req, res) => {
  try {
    const team = await Team.findById(req.params.id) || await Team.findOne();
    if (!team) return res.status(404).json({ error: 'Team not found' });
    const idx = parseInt(req.params.memberIndex, 10);
    if (!isNaN(idx) && idx >= 0 && idx < team.members.length) {
      if (req.body.name) team.members[idx].name = req.body.name;
      if (req.body.role) team.members[idx].role = req.body.role;
      if (req.body.expertise) team.members[idx].expertise = req.body.expertise;
      if (req.body.status) team.members[idx].status = req.body.status;
      if (req.body.email) team.members[idx].email = req.body.email;
      await team.save();

      if (team.projectId || team.project) {
        await Project.updateMany(
          { $or: [{ _id: team.projectId }, { title: team.project }] },
          { team: team.members.map(m => m.name), teamSize: team.members.length }
        );
      }
    }
    res.json({ success: true, team });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/teams/:id/members/:memberIndex', async (req, res) => {
  try {
    const team = await Team.findById(req.params.id) || await Team.findOne();
    if (!team) return res.status(404).json({ error: 'Team not found' });
    const idx = parseInt(req.params.memberIndex, 10);
    if (!isNaN(idx) && idx >= 0 && idx < team.members.length) {
      team.members.splice(idx, 1);
      await team.save();

      if (team.projectId || team.project) {
        await Project.updateMany(
          { $or: [{ _id: team.projectId }, { title: team.project }] },
          { team: team.members.map(m => m.name), teamSize: team.members.length }
        );
      }
    }
    res.json({ success: true, team });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/teams/:id/skills', async (req, res) => {
  try {
    const team = await Team.findById(req.params.id) || await Team.findOne();
    if (!team) return res.status(404).json({ error: 'Team not found' });
    team.requiredSkills = req.body.skills || [];
    await team.save();
    res.json({ success: true, requiredSkills: team.requiredSkills });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/mentors', async (req, res) => {
  try {
    let mentors = await Mentor.find();
    if (mentors.length === 0) {
      const m1 = new Mentor({
        name: 'Ms. Ananya Gupta',
        org: 'Microsoft',
        role: 'Senior Software Engineer',
        expertise: ['Cloud Computing', 'AI/ML', 'Product Design'],
        avatar: 'img-1',
        rating: 4.9,
        reviews: 120
      });
      const m2 = new Mentor({
        name: 'Dr. Arvind Rao',
        org: 'IISc Bengaluru',
        role: 'Research Scientist',
        expertise: ['Distributed Systems', 'IoT', 'Edge Computing'],
        avatar: 'img-2',
        rating: 4.8,
        reviews: 95
      });
      const m3 = new Mentor({
        name: 'Dr. Meera Nair',
        org: 'TCS Research',
        role: 'Principal Scientist',
        expertise: ['Data Analytics', 'Sustainability', 'Smart Cities'],
        avatar: 'img-3',
        rating: 4.7,
        reviews: 88
      });
      await m1.save();
      await m2.save();
      await m3.save();
      mentors = await Mentor.find();
    }
    res.json(mentors);
  } catch (err) { res.status(500).json({ error: err.message }); }
});


/* ══════════════════════════════════════════
   USER PROFILE & LEADERBOARD
   ══════════════════════════════════════════ */

router.get('/user', async (req, res) => {
  try {
    let targetEmail = (req.query.email || req.headers['x-user-email'] || '').trim().toLowerCase();
    let targetUserId = req.query.userId;

    // Check Authorization header for JWT token
    if (!targetEmail && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_strong_jwt_secret_key_here');
        if (decoded && decoded.id) {
          targetUserId = decoded.id;
        }
      } catch (e) {}
    }

    if (targetUserId) {
      const uDoc = await User.findById(targetUserId);
      if (uDoc && uDoc.email) {
        targetEmail = uDoc.email.toLowerCase();
      }
    }

    let user = null;

    if (targetEmail) {
      user = await UniversityProfile.findOne({ email: targetEmail });
      // If not in UniversityProfile yet, look up in User collection and auto-create
      if (!user) {
        const centralUser = await User.findOne({ email: targetEmail });
        if (centralUser) {
          const University = require('../others/models/University');
          let instName = centralUser.institution || centralUser.organization || 'Indian Institute of Technology Delhi';
          if (centralUser.universityId) {
            const uObj = await University.findById(centralUser.universityId);
            if (uObj) instName = uObj.name;
          }
          const uniqueId = centralUser.universityIdString || ('U' + Math.floor(1000 + Math.random() * 9000));
          if (!centralUser.universityIdString) {
            centralUser.universityIdString = uniqueId;
            await centralUser.save({ validateBeforeSave: false });
          }
          const initials = (centralUser.name || 'UN').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
          user = new UniversityProfile({
            userId: centralUser._id,
            name: centralUser.name,
            initials,
            email: centralUser.email.toLowerCase(),
            role: centralUser.designation || 'Faculty Member & Project Guide',
            department: centralUser.department || 'Department of Computer Science & Engineering',
            institution: instName,
            location: 'New Delhi, India',
            bio: `Faculty member at ${instName}. Building civic innovation solutions.`,
            phone: centralUser.phone || '+91 98765 43210',
            uniqueId,
            facultyId: uniqueId,
            stats: {
              totalProblems: 0,
              studentTeams: 0,
              projectsInProgress: 0,
              projectsDeployed: 0,
              needAttention: 0,
              projectsGuided: 0,
              activeMentorships: 0,
              teamsSupported: 0,
              impactScore: 100
            },
            preferences: {
              projectUpdates: true,
              mentorshipMessages: true,
              platformAnnouncements: true,
              weeklyDigest: true
            },
            skills: ['Research & Development', 'Civic Engineering', 'Project Mentorship', 'Student Guidance']
          });
          await user.save();
        }
      }
    }

    // If still no user found by email, check if there is a recently logged-in university_rep
    if (!user) {
      const recentRep = await User.findOne({ role: 'university_rep' }).sort({ lastLogin: -1 });
      if (recentRep) {
        user = await UniversityProfile.findOne({ email: recentRep.email.toLowerCase() });
        if (!user) {
          const initials = (recentRep.name || 'UN').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
          const uniqueId = recentRep.universityIdString || ('U' + Math.floor(1000 + Math.random() * 9000));
          if (!recentRep.universityIdString) {
            recentRep.universityIdString = uniqueId;
            await recentRep.save({ validateBeforeSave: false });
          }
          user = new UniversityProfile({
            userId: recentRep._id,
            name: recentRep.name,
            initials,
            email: recentRep.email.toLowerCase(),
            role: recentRep.designation || 'Faculty Member & Project Guide',
            department: recentRep.department || 'Department of Computer Science & Engineering',
            institution: 'Indian Institute of Technology Delhi',
            location: 'New Delhi, India',
            bio: `Faculty member at IIT Delhi. Contributing to civic technology innovations.`,
            phone: recentRep.phone || '+91 98765 43210',
            uniqueId,
            facultyId: uniqueId,
            stats: {
              projectsGuided: 12,
              problemsSolved: 7,
              mentorshipSessions: 18,
              certificatesEarned: 6
            }
          });
          await user.save();
        }
      }
    }

    // Ultimate fallback
    if (!user) {
      user = await UniversityProfile.findOne();
      if (!user) {
        user = new UniversityProfile({
          name: 'Prof. Faculty Guide',
          initials: 'FG',
          email: 'faculty@iitd.ac.in',
          uniqueId: 'U1001',
          facultyId: 'U1001',
          role: 'Faculty Member',
          department: 'Department of Computer Science and Engineering',
          institution: 'Indian Institute of Technology Delhi',
          location: 'New Delhi, India',
          bio: 'Using technology and education to build inclusive, sustainable solutions for a better India.',
          stats: {
            projectsGuided: 12,
            problemsSolved: 7,
            mentorshipSessions: 18,
            certificatesEarned: 6
          }
        });
        await user.save();
      } else if (!user.uniqueId) {
        user.uniqueId = 'U1001';
        user.facultyId = 'U1001';
        await user.save();
      }
    }

    res.json(user);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/user/:id', async (req, res) => {
  try {
    const id = req.params.id;
    let profile = null;
    if (id && id !== 'default' && id.match(/^[0-9a-fA-F]{24}$/)) {
      profile = await UniversityProfile.findById(id);
    }
    if (!profile && req.body.email) {
      profile = await UniversityProfile.findOne({ email: req.body.email.toLowerCase() });
    }
    if (!profile && req.query.email) {
      profile = await UniversityProfile.findOne({ email: req.query.email.toLowerCase() });
    }
    if (!profile) {
      profile = await UniversityProfile.findOne();
    }
    if (!profile) profile = new UniversityProfile(req.body);
    else Object.assign(profile, req.body);
    await profile.save();

    // Sync name/phone/designation back to central User model
    if (profile.email) {
      try {
        await User.findOneAndUpdate(
          { email: profile.email.toLowerCase() },
          { name: profile.name, phone: profile.phone, designation: profile.role, department: profile.department }
        );
      } catch(e) {}
    }

    res.json(profile);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/user', async (req, res) => {
  try {
    const email = (req.body.email || req.query.email || '').toLowerCase();
    let profile = null;
    if (email) {
      profile = await UniversityProfile.findOne({ email });
    }
    if (!profile) {
      profile = await UniversityProfile.findOne();
    }
    if (!profile) profile = new UniversityProfile(req.body);
    else Object.assign(profile, req.body);
    await profile.save();

    if (profile.email) {
      try {
        await User.findOneAndUpdate(
          { email: profile.email.toLowerCase() },
          { name: profile.name, phone: profile.phone, designation: profile.role, department: profile.department }
        );
      } catch(e) {}
    }

    res.json(profile);
  } catch (err) { res.status(500).json({ error: err.message }); }
});



router.get('/dashboard/stats', async (req, res) => {
  try {
    const totalProblems = await Problem.countDocuments({});
    const studentTeams = await Team.countDocuments({});
    const inProgressProjects = await Project.countDocuments({ stage: { $in: ['Assigned', 'In Progress', 'Prototype', 'Submitted'] } });
    const deployedProjects = await Project.countDocuments({ stage: 'Deployed' });
    const needAttention = await Notification.countDocuments({ unread: true });

    res.json({
      totalProblems: totalProblems || 0,
      studentTeams: studentTeams || 0,
      projectsInProgress: inProgressProjects || 0,
      projectsDeployed: deployedProjects || 0,
      needAttention: needAttention || 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

