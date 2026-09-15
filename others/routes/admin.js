const express = require('express');
const router = express.Router();
const {
  getUsers, updateUser, deleteUser, getSystemStats, getAdminAnalytics,
  getUniversities, createUniversity, updateUniversity,
  getIndustryPartners, getActivityLogs, broadcastNotification
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleCheck');
const University = require('../models/University');
const IndustryPartner = require('../models/IndustryPartner');
const Proposal = require('../models/Proposal');
const CentralNotification = require('../models/Notification');
const User = require('../models/User');
const Team = require('../../university/database/Team');
const Project = require('../../university/database/Project');

const Challenge = require('../models/Challenge');
const geminiService = require('../services/geminiService');

router.use(protect, isAdmin);

// ── Proposal Governance & Industry Matching ─────────────────────────────────

// 1. List proposals
router.get('/proposals', async (req, res, next) => {
  try {
    const { status, search } = req.query;
    let query = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { problemTitle: new RegExp(search, 'i') },
        { universityName: new RegExp(search, 'i') },
        { submitterName: new RegExp(search, 'i') }
      ];
    }
    const proposals = await Proposal.find(query)
      .populate('assignedIndustry', 'name companyName sector logo')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, count: proposals.length, data: proposals });
  } catch (e) {
    next(e);
  }
});

// 2. Proposal Detail Card (STRICT DATA PRIVACY: teamMemberCount only, NO member names!)
router.get('/proposals/:id', async (req, res, next) => {
  try {
    const proposal = await Proposal.findById(req.params.id)
      .populate('university', 'name')
      .populate('submittedBy', 'name email')
      .populate('problemId', 'title category')
      .populate('assignedIndustry', 'name companyName sector logo fundingCapacity capabilities contact location')
      .lean();

    if (!proposal) {
      return res.status(404).json({ success: false, error: 'Proposal not found' });
    }

    let teamMemberCount = 6;
    if (proposal.teamId) {
      // Shape the API response itself to only return count, never the members array
      const team = await Team.findById(proposal.teamId).select('members').lean();
      if (team && Array.isArray(team.members)) {
        teamMemberCount = team.members.length;
      }
    }

    const payload = {
      ...proposal,
      universityName: proposal.university?.name || proposal.universityName || 'IIT Ranchi',
      submitterName: proposal.submittedBy?.name || proposal.submitterName || 'Dr. Rohan Mehta',
      submitterEmail: proposal.submittedBy?.email || proposal.submitterEmail || 'rohan.mehta@iitranchi.ac.in',
      problemTitle: proposal.problemId?.title || proposal.problemTitle || 'Damaged Main Road with Potholes',
      teamMemberCount // count only — do not include team.members itself in this response
    };

    res.json({
      success: true,
      data: payload,
      ...payload
    });
  } catch (e) {
    next(e);
  }
});

// 3. Admin Review Actions (Approve / Request Changes / Reject)
router.post('/proposals/:id/review', async (req, res, next) => {
  try {
    const { decision, comment } = req.body;
    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) {
      return res.status(404).json({ success: false, error: 'Proposal not found' });
    }

    let newStatus = 'approved';
    if (decision === 'request_changes') newStatus = 'changes_requested';
    else if (decision === 'reject') newStatus = 'rejected';
    else if (decision === 'approve') newStatus = 'approved';

    proposal.status = newStatus;
    proposal.reviewedAt = new Date();
    proposal.reviewComment = comment || '';
    proposal.reviewedBy = req.user?._id || null;
    await proposal.save();

    // Update linked Project
    if (proposal.projectId) {
      const project = await Project.findById(proposal.projectId);
      if (project) {
        project.proposalStatus = newStatus;
        if (newStatus === 'approved') {
          project.stage = 'In Progress';
          project.status = 'In Progress';
          project.progress = Math.max(project.progress || 0, 1);
          if (project.milestones && project.milestones[0]) {
            project.milestones[0].status = 'approved';
            project.milestones[0].approvedAt = new Date();
          }
        }
        await project.save();
      }
    }

    // Create notification to university submitter
    try {
      const recipientUser = proposal.submittedBy || (await User.findOne({ role: 'university_rep' }))?._id;
      if (recipientUser) {
        let msg = `Your solution proposal for "${proposal.problemTitle}" has been approved by the State Admin! Industry matching is now underway.`;
        if (newStatus === 'changes_requested') {
          msg = `Changes requested on your solution proposal for "${proposal.problemTitle}": ${comment || 'Please review feedback.'}`;
        } else if (newStatus === 'rejected') {
          msg = `Your solution proposal for "${proposal.problemTitle}" was not approved: ${comment || 'Criteria not met.'}`;
        }

        await new CentralNotification({
          recipient: recipientUser,
          type: newStatus === 'approved' ? 'proposal_approved' : 'system_alert',
          title: `Proposal Update: ${newStatus.replace('_', ' ').toUpperCase()}`,
          message: msg,
          data: {
            proposalId: proposal._id,
            projectId: proposal.projectId?.toString()
          },
          priority: newStatus === 'approved' ? 'high' : 'normal'
        }).save();
      }
    } catch (notifErr) {
      console.warn('University notification error:', notifErr.message);
    }

    res.json({
      success: true,
      message: `Proposal successfully marked as ${newStatus}`,
      proposal
    });
  } catch (e) {
    next(e);
  }
});

// 4. Eligible Industry Matching (ONLY accessible after Admin approval)
router.get('/proposals/:id/eligible-industries', async (req, res, next) => {
  try {
    const proposal = await Proposal.findById(req.params.id).lean();
    if (!proposal) {
      return res.status(404).json({ success: false, error: 'Proposal not found' });
    }

    // Strict Gating: Only accessible after proposal is approved
    if (proposal.status !== 'approved') {
      return res.status(403).json({
        success: false,
        error: 'Industry matching is only accessible after the proposal is approved by Admin.'
      });
    }

    const requestedFunding = proposal.fundingRequested || 0;
    const requestedSupports = proposal.industrySupportRequired || [];

    // Query partners where fundingCapacity >= proposal.fundingRequested
    // and capabilities contains at least one requested support
    const eligiblePartners = await IndustryPartner.find({
      fundingCapacity: { $gte: requestedFunding },
      capabilities: { $in: requestedSupports }
    }).select('companyName name sector fundingCapacity capabilities pastCollaborations contact location logo description').lean();

    // Rank by how many of the requested support types each partner actually covers,
    // so the best-matching partners surface first rather than an unordered list.
    eligiblePartners.sort((a, b) => {
      const aCaps = Array.isArray(a.capabilities) ? a.capabilities : [];
      const bCaps = Array.isArray(b.capabilities) ? b.capabilities : [];
      const aMatch = aCaps.filter(c => requestedSupports.includes(c)).length;
      const bMatch = bCaps.filter(c => requestedSupports.includes(c)).length;
      return bMatch - aMatch;
    });

    const annotatedPartners = eligiblePartners.map(p => {
      const pCaps = Array.isArray(p.capabilities) ? p.capabilities : [];
      const matchedCaps = pCaps.filter(c => requestedSupports.includes(c));
      return {
        ...p,
        displayName: p.companyName || p.name,
        matchedCapabilities: matchedCaps,
        matchCount: matchedCaps.length,
        totalRequestedCount: requestedSupports.length,
        matchPercentage: requestedSupports.length > 0 ? Math.round((matchedCaps.length / requestedSupports.length) * 100) : 100
      };
    });

    res.json({
      success: true,
      count: annotatedPartners.length,
      proposalFundingRequested: requestedFunding,
      requestedSupports,
      data: annotatedPartners
    });
  } catch (e) {
    next(e);
  }
});

// 4b. AI Matching for Solution Proposal & Industry Partners
router.get('/proposals/:id/ai-match', async (req, res, next) => {
  try {
    const proposal = await Proposal.findById(req.params.id).lean();
    if (!proposal) {
      return res.status(404).json({ success: false, error: 'Proposal not found' });
    }

    let problem = null;
    if (proposal.problemId) {
      problem = await Challenge.findById(proposal.problemId).lean();
    }
    if (!problem && proposal.projectId) {
      const project = await Project.findById(proposal.projectId).lean();
      if (project?.challengeId) {
        problem = await Challenge.findById(project.challengeId).lean();
      }
    }

    const partners = await IndustryPartner.find({ isActive: true }).lean();
    const refresh = req.query.refresh === 'true';

    const aiResult = await geminiService.matchIndustryForProposal({
      proposal,
      problem,
      partners,
      refresh
    });

    res.json({
      success: true,
      data: aiResult
    });
  } catch (e) {
    console.error('AI Matching error:', e);
    res.status(500).json({
      success: false,
      error: 'AI analysis temporarily unavailable: ' + e.message
    });
  }
});

// 4c. AI Matching for Challenges & Universities
router.get('/challenges/:id/ai-match', async (req, res, next) => {
  try {
    const challenge = await Challenge.findById(req.params.id).lean();
    if (!challenge) {
      return res.status(404).json({ success: false, error: 'Challenge not found' });
    }

    const universities = await University.find({ isActive: true }).lean();
    const refresh = req.query.refresh === 'true';

    const aiResult = await geminiService.matchUniversityForChallenge({
      challenge,
      universities,
      refresh
    });

    res.json({
      success: true,
      data: aiResult
    });
  } catch (e) {
    console.error('University AI Matching error:', e);
    res.status(500).json({
      success: false,
      error: 'AI analysis temporarily unavailable: ' + e.message
    });
  }
});

// 5. Directly assign one partner
router.post('/proposals/:id/assign-industry', async (req, res, next) => {
  try {
    const { industryPartnerId } = req.body;
    if (!industryPartnerId) {
      return res.status(400).json({ success: false, error: 'industryPartnerId is required' });
    }

    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) return res.status(404).json({ success: false, error: 'Proposal not found' });

    const partner = await IndustryPartner.findById(industryPartnerId);
    if (!partner) return res.status(404).json({ success: false, error: 'Industry partner not found' });

    proposal.assignedIndustry = partner._id;
    proposal.acceptanceStatus = 'pending';
    await proposal.save();

    // Update linked Project with assigned industry details
    if (proposal.projectId) {
      const project = await Project.findById(proposal.projectId);
      if (project) {
        project.assignedIndustry = partner._id;
        project.assignedIndustryDetails = {
          partnerId: partner._id,
          name: partner.name,
          companyName: partner.companyName || partner.name,
          sector: partner.sector || 'Industry CSR & Innovation',
          logo: partner.logo || '',
          location: partner.location?.city ? `${partner.location.city}, ${partner.location.state || 'Jharkhand'}` : 'Jharkhand',
          contactEmail: partner.contact?.email || 'csr@partner.in',
          contactPhone: partner.contact?.phone || '+91 651 220 0000',
          website: partner.contact?.website || '',
          fundingCommitted: proposal.fundingRequested,
          fundingStatus: 'Pending Industry Acceptance',
          acceptanceStatus: 'pending',
          capabilitiesProvided: partner.capabilities || proposal.industrySupportRequired,
          assignedAt: new Date()
        };
        project.fundingSummary = {
          committed: proposal.fundingRequested,
          goal: proposal.fundingRequested,
          sponsor: partner.companyName || partner.name,
          status: 'Pending Industry Acceptance'
        };
        project.industryMentor = {
          name: partner.name + ' Collaboration Team',
          org: partner.companyName || partner.name,
          initials: (partner.name || 'IP').slice(0, 2).toUpperCase(),
          status: 'Pending Acceptance',
          requestedAt: new Date()
        };
        await project.save();
      }
    }

    // Notify Partner and University
    try {
      if (proposal.submittedBy) {
        await new CentralNotification({
          recipient: proposal.submittedBy,
          type: 'new_collaboration',
          title: 'Industry Partner Assigned for Review!',
          message: `${partner.companyName || partner.name} has been assigned to review your proposal "${proposal.problemTitle}" with ₹${Number(proposal.fundingRequested).toLocaleString('en-IN')}. Awaiting partner acceptance.`,
          data: { proposalId: proposal._id, projectId: proposal.projectId?.toString() },
          priority: 'high'
        }).save();
      }

      // Notify Industry Representatives of this partner
      const indUsers = await User.find({
        $or: [
          { organization: partner.companyName },
          { organization: partner.name },
          { uniqueId: partner.uniqueId }
        ]
      });
      for (const indUser of indUsers) {
        await new CentralNotification({
          recipient: indUser._id,
          type: 'new_collaboration',
          title: 'New Solution Proposal Assigned for Review',
          message: `State Admin has routed the solution proposal "${proposal.problemTitle}" from ${proposal.universityName} to your organization for CSR partnership review.`,
          data: { proposalId: proposal._id, projectId: proposal.projectId?.toString() },
          priority: 'high'
        }).save();
      }

      await IndustryPartner.findByIdAndUpdate(partner._id, {
        $inc: { 'stats.activeCollaborations': 1, 'stats.totalCollaborations': 1 }
      });
    } catch (notifErr) {
      console.warn('Assignment notification error:', notifErr.message);
    }

    res.json({
      success: true,
      message: `Successfully assigned ${partner.companyName || partner.name} to this project.`,
      assignedIndustry: partner
    });
  } catch (e) {
    next(e);
  }
});

// 6. Invite multiple eligible partners for interest expression
router.post('/proposals/:id/invite-industries', async (req, res, next) => {
  try {
    const { industryPartnerIds } = req.body;
    const partnerIds = Array.isArray(industryPartnerIds) ? industryPartnerIds : [industryPartnerIds].filter(Boolean);
    if (!partnerIds.length) {
      return res.status(400).json({ success: false, error: 'At least one industryPartnerId is required' });
    }

    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) return res.status(404).json({ success: false, error: 'Proposal not found' });

    proposal.invitedIndustries = partnerIds;
    await proposal.save();

    res.json({
      success: true,
      message: `Invitations sent to ${partnerIds.length} eligible industry partners for expression of interest.`,
      invitedCount: partnerIds.length
    });
  } catch (e) {
    next(e);
  }
});


// Analytics & Stats
router.get('/analytics', getAdminAnalytics);
router.get('/stats', getSystemStats);

// Users
router.get('/users', getUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Activity Logs
router.get('/activity', getActivityLogs);
router.get('/activity-logs', getActivityLogs);



// Universities
router.get('/universities', getUniversities);
router.post('/universities', createUniversity);
router.put('/universities/:id', updateUniversity);
router.delete('/universities/:id', async (req, res, next) => {
  try {
    await University.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'University deleted' });
  } catch (e) { next(e); }
});

// Industry partners
router.get('/industry', getIndustryPartners);
router.post('/industry', async (req, res, next) => {
  try {
    const partner = await IndustryPartner.create(req.body);
    res.status(201).json({ success: true, data: partner });
  } catch (e) { next(e); }
});
router.put('/industry/:id', async (req, res, next) => {
  try {
    const partner = await IndustryPartner.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, data: partner });
  } catch (e) { next(e); }
});

// Logs
router.get('/activity-logs', getActivityLogs);

// Broadcast
router.post('/broadcast', broadcastNotification);

module.exports = router;
