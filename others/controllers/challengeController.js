const Challenge = require('../models/Challenge');
const University = require('../models/University');
const User = require('../models/User');
const IndustryPartner = require('../models/IndustryPartner');
const { classifyChallenge, generateTags, suggestPriority, parseVoiceTranscript, findSimilarChallenges } = require('../services/aiClassifier');
const { notifyChallenge, notifyStatusChange, notifyUniversityAssignment, logActivity } = require('../services/notificationService');
const { uploadBufferToSupabase, uploadBase64ToSupabase, deleteFileFromSupabase } = require('../services/supabaseStorage');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// @desc    Get all challenges (with search, filter, pagination)
// @route   GET /api/challenges
// @access  Public/Private (different views)
exports.getChallenges = async (req, res, next) => {
  try {
    const {
      search, category, status, priority, district, assignedUniversity,
      page = 1, limit = 10, sort = '-createdAt', startDate, endDate, myOnly
    } = req.query;

    let query = {};

    // Role-based filtering
    if (req.user) {
      if (req.user.role === 'citizen') {
        if (myOnly === 'true') {
          query.submittedBy = req.user.id;
        } else {
          query.isPublic = true;
          query.status = { $nin: ['draft', 'rejected'] };
        }
      } else if (req.user.role === 'university_rep' || (req.user.uniqueId && req.user.uniqueId.startsWith('U'))) {
        // Only visible to members of the particular university assigned
        const uName = req.user.institution || req.user.organization;
        const uUid = req.user.uniqueId || req.user.universityIdString;
        const uId = req.user.universityId;
        const univConditions = [];
        if (uName) univConditions.push({ universityAssigned: uName }, { universityAssigned: new RegExp(uName.split(' ')[0], 'i') });
        if (uUid) univConditions.push({ assignedUniversityUid: uUid });
        if (uId) univConditions.push({ assignedUniversity: uId });
        if (univConditions.length > 0) {
          query.$or = univConditions;
        } else {
          query.universityAssigned = { $ne: null };
        }
      } else if (req.user.role === 'industry_rep' || (req.user.uniqueId && req.user.uniqueId.startsWith('I'))) {
        // Only visible to members of the particular industry assigned
        const iName = req.user.organization || req.user.name;
        const iIid = req.user.uniqueId || req.user.industryIdString;
        const iId = req.user.industryPartnerId;
        const indConditions = [];
        if (iName) indConditions.push({ industryAssigned: iName }, { industryAssigned: new RegExp(iName.split(' ')[0], 'i') });
        if (iIid) indConditions.push({ assignedIndustryIid: iIid });
        if (iId) indConditions.push({ assignedIndustry: iId }, { 'industryCollaborators.partner': iId });
        if (indConditions.length > 0) {
          query.$or = indConditions;
        } else {
          query.industryAssigned = { $ne: null };
        }
      }
    } else {
      // Public: show all active public challenges
      query.isPublic = true;
      query.status = { $nin: ['draft', 'rejected'] };
    }

    // Filters
    if (search) query.$text = { $search: search };
    if (category) query.category = category;
    if (status && status !== 'all') {
      if (status.includes(',')) {
        query.status = { $in: status.split(',').map(s => s.trim()) };
      } else {
        query.status = status;
      }
    }
    if (priority) query.priority = priority;
    if (district) query['location.district'] = new RegExp('^' + district.trim() + '$', 'i');
    if (assignedUniversity) query.assignedUniversity = assignedUniversity;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [challenges, total] = await Promise.all([
      Challenge.find(query)
        .select('-resolutionProof.beforeImage -resolutionProof.afterImage -needMoreInfo.responses.mediaUrls -chatMessages')
        .populate('submittedBy', 'name email avatar role')
        .populate('assignedUniversity', 'name shortName logo')
        .populate('assignedBy', 'name')
        .populate('statusHistory.changedBy', 'name email role')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Challenge.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      count: challenges.length,
      total,
      pages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      data: challenges
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single challenge
// @route   GET /api/challenges/:id
// @access  Public
exports.getChallenge = async (req, res, next) => {
  try {
    const targetId = req.params.id;
    let challenge = null;

    if (mongoose.Types.ObjectId.isValid(targetId)) {
      challenge = await Challenge.findById(targetId)
        .populate('submittedBy', 'name email role avatar stats')
        .populate('assignedUniversity', 'name shortName code location logo stats')
        .populate('assignedBy', 'name email role')
        .populate('statusHistory.changedBy', 'name email role')
        .populate('projectTeam.faculty', 'name email avatar department designation')
        .populate('projectTeam.students', 'name email avatar department currentYear')
        .populate('industryCollaborators.partner', 'name companyType logo website')
        .populate('resolutionProof.verifiedBy', 'name role')
        .populate('feedback.submittedBy', 'name avatar');
    }

    if (!challenge) {
      challenge = await Challenge.findOne({
        $or: [
          { challengeId: targetId.toUpperCase().trim() },
          { challengeId: { $regex: targetId.trim(), $options: 'i' } }
        ]
      })
        .populate('submittedBy', 'name email role avatar stats')
        .populate('assignedUniversity', 'name shortName code location logo stats')
        .populate('assignedBy', 'name email role')
        .populate('statusHistory.changedBy', 'name email role')
        .populate('projectTeam.faculty', 'name email avatar department designation')
        .populate('projectTeam.students', 'name email avatar department currentYear')
        .populate('industryCollaborators.partner', 'name companyType logo website')
        .populate('resolutionProof.verifiedBy', 'name role')
        .populate('feedback.submittedBy', 'name avatar');
    }

    if (!challenge) {
      return res.status(404).json({ success: false, message: 'Challenge not found' });
    }

    // Increment view count (fire and forget)
    Challenge.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } }).exec();

    res.status(200).json({ success: true, data: challenge });
  } catch (error) {
    next(error);
  }
};

// @desc    Get friendly live status updates and estimated resolution time for citizen problem tracker
// @route   GET /api/challenges/:id/updates
// @access  Public / Optional Auth
exports.getChallengeUpdates = async (req, res, next) => {
  try {
    const targetId = req.params.id;
    let challenge = null;
    if (mongoose.Types.ObjectId.isValid(targetId)) {
      challenge = await Challenge.findById(targetId)
        .populate('assignedUniversity', 'name shortName code location')
        .populate('industryCollaborators.partner', 'name companyType')
        .populate('projectTeam.students', 'name')
        .populate('projectTeam.faculty', 'name');
    }
    if (!challenge) {
      challenge = await Challenge.findOne({ challengeId: targetId })
        .populate('assignedUniversity', 'name shortName code location')
        .populate('industryCollaborators.partner', 'name companyType')
        .populate('projectTeam.students', 'name')
        .populate('projectTeam.faculty', 'name');
    }

    if (!challenge) {
      return res.status(404).json({ success: false, message: 'Problem not found' });
    }

    // Build chronological friendly citizen updates
    const updates = [];
    const univName = challenge.assignedUniversity?.name || challenge.assignedUniversity?.shortName || 'University Innovation Taskforce';

    // 1. Citizen submits
    updates.push({
      stage: 'submitted',
      dot: 'gray',
      messageHi: 'Aapki shikayat safaltapoorvak darj ho gayi hai.',
      messageEn: 'Your grievance has been successfully submitted.',
      timestamp: challenge.createdAt || new Date()
    });

    // 2. Admin review
    const isUnderReview = challenge.statusHistory?.some(h => h.status === 'under_review') || challenge.status === 'under_review';
    const isVerified = ['validated', 'assigned', 'in_progress', 'testing', 'resolved', 'closed'].includes(challenge.status);
    if (isUnderReview || isVerified) {
      const reviewTime = challenge.statusHistory?.find(h => h.status === 'under_review')?.changedAt || new Date(new Date(challenge.createdAt).getTime() + 15 * 60000);
      updates.push({
        stage: 'under_review',
        dot: 'blue',
        messageHi: 'Admin aapki shikayat ki jaanch kar rahe hain.',
        messageEn: 'Administrative authority is reviewing your grievance.',
        timestamp: reviewTime
      });
    }

    // 3. Admin assigns to university
    const isAssigned = isVerified && (challenge.assignedUniversity || ['assigned', 'in_progress', 'testing', 'resolved', 'closed'].includes(challenge.status));
    if (isAssigned) {
      const assignTime = challenge.assignedAt || challenge.statusHistory?.find(h => h.status === 'assigned')?.changedAt || new Date(new Date(challenge.createdAt).getTime() + 45 * 60000);
      updates.push({
        stage: 'assigned',
        dot: 'blue',
        messageHi: `Aapki samasya ${univName} ko bhej di gayi hai samadhan ke liye.`,
        messageEn: `Problem assigned to ${univName} for technical solution.`,
        timestamp: assignTime
      });

      // 4. University accepts
      updates.push({
        stage: 'university_accepted',
        dot: 'blue',
        messageHi: `${univName} ne is samasya ko sweekar kar liya hai.`,
        messageEn: `${univName} has accepted this problem.`,
        timestamp: new Date(new Date(assignTime).getTime() + 20 * 60000)
      });
    }

    // 5. Student team picks it up
    const isWorking = ['in_progress', 'testing', 'resolved', 'closed'].includes(challenge.status) || (challenge.projectTeam && (challenge.projectTeam.students?.length > 0 || challenge.projectTeam.faculty?.length > 0));
    if (isWorking) {
      const workTime = challenge.statusHistory?.find(h => h.status === 'in_progress')?.changedAt || new Date(new Date(challenge.createdAt).getTime() + 120 * 60000);
      updates.push({
        stage: 'team_started',
        dot: 'blue',
        messageHi: 'Ek team ne is samasya par kaam shuru kar diya hai.',
        messageEn: 'An innovation taskforce team has started work on this problem.',
        timestamp: workTime
      });
    }

    // 6. Mentor guidance (only if mentor involved)
    const mentorCollab = challenge.industryCollaborators?.find(c => c.role === 'mentor');
    if (mentorCollab) {
      updates.push({
        stage: 'mentor_assigned',
        dot: 'blue',
        messageHi: 'Team ko ek industry expert se margdarshan mil raha hai.',
        messageEn: 'Team is receiving guidance from an industry expert.',
        timestamp: mentorCollab.joinedAt || new Date(new Date(challenge.createdAt).getTime() + 180 * 60000)
      });
    }

    // 7. Milestones completed (only completed ones)
    if (Array.isArray(challenge.milestones)) {
      challenge.milestones.filter(m => m.status === 'completed' || m.completedAt).forEach((m, idx) => {
        updates.push({
          stage: 'milestone_completed',
          dot: 'blue',
          messageHi: `${m.title || (idx === 0 ? 'Pratham charan' : 'Agla charan')} poora ho gaya — prototype taiyar ho raha hai.`,
          messageEn: `Milestone completed: ${m.title || 'Engineering phase complete'}.`,
          timestamp: m.completedAt || new Date(new Date(challenge.createdAt).getTime() + (240 + idx * 60) * 60000)
        });
      });
    }

    // 8. Project deployed / Solution prepared
    const isDeployed = ['testing', 'resolved', 'closed'].includes(challenge.status);
    if (isDeployed) {
      updates.push({
        stage: 'solution_ready',
        dot: 'green',
        messageHi: 'Aapki samasya ka samadhan taiyaar ho gaya hai! Jald hi implement kiya jayega.',
        messageEn: 'Technical solution is ready and queued for ground implementation.',
        timestamp: challenge.statusHistory?.find(h => h.status === 'testing')?.changedAt || new Date(new Date(challenge.createdAt).getTime() + 360 * 60000)
      });
    }

    // 9. Industry adopts/implements (only if industry partner involved)
    const industryPartner = challenge.industryCollaborators?.find(c => c.partner && c.role !== 'mentor');
    if (industryPartner && isDeployed) {
      const orgName = industryPartner.partner?.name || 'Tata Steel Foundation';
      updates.push({
        stage: 'industry_adopted',
        dot: 'green',
        messageHi: `${orgName} dwara samadhan ko zameeni star par laagu kiya ja raha hai.`,
        messageEn: `Solution is being implemented on-ground supported by ${orgName}.`,
        timestamp: industryPartner.joinedAt || new Date(new Date(challenge.createdAt).getTime() + 420 * 60000)
      });
    }

    // 10. Marked resolved
    const isResolved = ['resolved', 'closed'].includes(challenge.status) || challenge.resolvedAt;
    if (isResolved) {
      updates.push({
        stage: 'resolved',
        dot: 'green',
        messageHi: 'Aapki samasya safaltapoorvak hal ho gayi hai. Dhanyawad!',
        messageEn: 'Your grievance has been successfully resolved. Thank you!',
        timestamp: challenge.resolvedAt || challenge.statusHistory?.find(h => h.status === 'resolved')?.changedAt || challenge.updatedAt
      });
    }

    // Sort newest first
    updates.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Calculate historical average resolution time for category
    const resolvedInCat = await Challenge.find({
      category: challenge.category,
      status: { $in: ['resolved', 'closed'] },
      resolvedAt: { $ne: null }
    }).select('createdAt resolvedAt').lean();

    let avgDays = 12;
    if (resolvedInCat.length > 0) {
      const totalDays = resolvedInCat.reduce((sum, r) => {
        return sum + Math.max(1, (new Date(r.resolvedAt) - new Date(r.createdAt)) / (1000 * 60 * 60 * 24));
      }, 0);
      avgDays = Math.round(totalDays / resolvedInCat.length);
    }

    const daysSince = Math.max(0, Math.floor((Date.now() - new Date(challenge.createdAt).getTime()) / (1000 * 60 * 60 * 24)));

    res.status(200).json({
      success: true,
      challengeId: challenge.challengeId,
      title: challenge.title,
      description: challenge.description,
      status: challenge.status,
      category: challenge.category,
      avgResolutionDays: avgDays,
      daysSinceSubmission: daysSince,
      updates
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create challenge
// @route   POST /api/challenges
// @access  Private (Citizen, Admin) or Guest/Demo with submitterContact
exports.createChallenge = async (req, res, next) => {
  try {
    const {
      title, description, category, priority, location,
      submitterContact, deadline, isPublic = true,
      coverImage: reqCoverImage, image: reqImage
    } = req.body;

    // AI classification
    const aiResult = classifyChallenge(title, description);
    const tags = generateTags(`${title} ${description}`);
    const suggestedPriority = suggestPriority(`${title} ${description}`);

    let attachments = [];
    let topFilePath = null;

    if (req.files && req.files.length > 0) {
      for (const f of req.files) {
        try {
          const fileBuffer = fs.readFileSync(f.path);
          const uploadRes = await uploadBufferToSupabase({
            buffer: fileBuffer,
            originalname: f.originalname,
            mimetype: f.mimetype,
            folder: 'problems'
          });
          attachments.push({
            filename: uploadRes.filename,
            originalName: f.originalname,
            mimetype: uploadRes.mimetype,
            size: uploadRes.size,
            url: uploadRes.publicUrl,
            filePath: uploadRes.filePath
          });
          if (!topFilePath) topFilePath = uploadRes.filePath;
        } catch (err) {
          console.error('[ChallengeController] Error uploading file to storage:', err);
          attachments.push({
            filename: f.filename,
            originalName: f.originalname,
            mimetype: f.mimetype,
            size: f.size,
            url: `/uploads/challenges/${f.filename}`,
            filePath: `problems/${f.filename}`
          });
        }
      }
    } else if (req.body.attachments && Array.isArray(req.body.attachments) && req.body.attachments.length > 0) {
      for (const att of req.body.attachments) {
        if (att && att.url && typeof att.url === 'string' && att.url.startsWith('data:')) {
          try {
            const uploadRes = await uploadBase64ToSupabase(att.url, att.filename || 'citizen_evidence.png', 'problems');
            if (uploadRes) {
              attachments.push({
                filename: uploadRes.filename,
                originalName: att.originalName || att.filename || 'citizen_evidence.png',
                mimetype: uploadRes.mimetype,
                size: uploadRes.size,
                url: uploadRes.publicUrl,
                filePath: uploadRes.filePath
              });
              if (!topFilePath) topFilePath = uploadRes.filePath;
            }
          } catch (e) {
            attachments.push(att);
          }
        } else if (att) {
          attachments.push(att);
          if (!topFilePath && att.filePath) topFilePath = att.filePath;
        }
      }
    } else if (reqImage || reqCoverImage) {
      const rawImg = reqCoverImage || reqImage;
      if (rawImg && typeof rawImg === 'string' && rawImg.startsWith('data:')) {
        try {
          const uploadRes = await uploadBase64ToSupabase(rawImg, 'citizen_evidence.png', 'problems');
          if (uploadRes) {
            topFilePath = uploadRes.filePath;
            attachments.push({
              filename: uploadRes.filename,
              originalName: 'citizen_evidence.png',
              mimetype: uploadRes.mimetype,
              size: uploadRes.size,
              url: uploadRes.publicUrl,
              filePath: uploadRes.filePath
            });
          }
        } catch (e) {
          console.warn('[ChallengeController] Base64 upload fallback:', e.message);
        }
      } else if (rawImg) {
        attachments.push({
          filename: 'citizen_evidence.png',
          originalName: 'citizen_evidence.png',
          mimetype: 'image/png',
          size: typeof rawImg === 'string' ? rawImg.length : 1000,
          url: rawImg,
          filePath: null
        });
      }
    }

    const photoAttachments = attachments.filter(a => !(a.mimetype && a.mimetype.startsWith('video/')) && !/\.(mp4|webm|mov|ogg|mkv)$/i.test(a.url || a.filename));
    const videoAttachment = attachments.find(a => (a.mimetype && a.mimetype.startsWith('video/')) || /\.(mp4|webm|mov|ogg|mkv)$/i.test(a.url || a.filename));
    let videoUrl = videoAttachment ? videoAttachment.url : (req.body.videoUrl || null);

    // If videoUrl was passed as raw base64 data URL, upload to Supabase
    if (videoUrl && typeof videoUrl === 'string' && videoUrl.startsWith('data:')) {
      try {
        const vidUpload = await uploadBase64ToSupabase(videoUrl, 'citizen_video.mp4', 'problems');
        if (vidUpload && vidUpload.publicUrl) {
          videoUrl = vidUpload.publicUrl;
          if (!videoAttachment) {
            attachments.push({
              filename: vidUpload.filename,
              originalName: 'citizen_video.mp4',
              mimetype: 'video/mp4',
              size: vidUpload.size,
              url: vidUpload.publicUrl,
              filePath: vidUpload.filePath
            });
          }
        }
      } catch (vidErr) {
        console.warn('[ChallengeController] Video base64 upload fallback:', vidErr.message);
      }
    }

    const coverImage = (photoAttachments.length > 0 ? photoAttachments[0].url : null) || (attachments.length > 0 ? attachments[0].url : null) || reqCoverImage || reqImage || null;
    const finalFilePath = (photoAttachments.length > 0 ? photoAttachments[0].filePath : null) || topFilePath || (attachments.length > 0 ? attachments[0].filePath : null);

    // Resolve submitting user (support guest demo submission if token not present)
    let submitterUserId = req.user ? req.user.id : null;
    let submitterName = req.user ? req.user.name : (submitterContact && submitterContact.name ? submitterContact.name : 'Citizen');
    let submitterEmail = req.user ? req.user.email : (submitterContact && submitterContact.email ? submitterContact.email : 'citizen@jansetu.in');
    let submitterPhone = req.user ? req.user.phone : (submitterContact && submitterContact.phone ? submitterContact.phone : '9876543210');

    if (!submitterUserId) {
      const existingUser = await User.findOne({ email: submitterEmail.toLowerCase() });
      if (existingUser) {
        submitterUserId = existingUser._id;
      } else {
        const fallbackCitizen = await User.findOne({ role: 'citizen' });
        if (fallbackCitizen) submitterUserId = fallbackCitizen._id;
      }
    }

    // Normalize priority value for database compatibility ('normal' -> 'medium', uppercase -> lowercase)
    let sanitizedPriority = (priority || suggestedPriority || 'medium').toString().toLowerCase();
    if (sanitizedPriority === 'normal') sanitizedPriority = 'medium';
    if (!['low', 'medium', 'high', 'urgent'].includes(sanitizedPriority)) {
      sanitizedPriority = 'medium';
    }

    let parsedLoc = typeof location === 'string' ? JSON.parse(location) : (location || {});
    if (!parsedLoc.district) parsedLoc.district = 'Ranchi';
    if (!parsedLoc.state) parsedLoc.state = 'Jharkhand';

    const challenge = await Challenge.create({
      title: title.trim(),
      description,
      category: category || aiResult.category,
      aiSuggestedCategory: aiResult.category,
      aiConfidenceScore: aiResult.confidence,
      tags,
      priority: sanitizedPriority,
      submittedBy: submitterUserId,
      submitterContact: submitterContact || {
        name: submitterName,
        email: submitterEmail,
        phone: submitterPhone
      },
      location: parsedLoc,
      filePath: finalFilePath,
      attachments,
      coverImage,
      image: (photoAttachments.length > 0 ? photoAttachments[0].url : null) || coverImage || reqImage,
      videoUrl,
      resolutionProof: {
        beforeImage: (photoAttachments.length > 0 ? photoAttachments[0].url : null) || coverImage || reqImage,
        beforeFilePath: finalFilePath,
        summary: 'Citizen ground reality evidence'
      },
      deadline: deadline ? new Date(deadline) : null,
      isPublic,
      status: 'submitted',
      statusHistory: [{
        status: 'submitted',
        changedBy: submitterUserId,
        note: 'Challenge submitted by citizen'
      }]
    });


    // Update user stats if submitter is tracked
    if (submitterUserId) {
      await User.findByIdAndUpdate(submitterUserId, { $inc: { 'stats.challengesSubmitted': 1 } }).catch(() => {});
    }

    // Notify
    if (req.user) {
      await notifyChallenge(challenge, req.user).catch(() => {});
    }

    await logActivity({
      actor: req.user || { name: submitterName, role: 'citizen', id: submitterUserId },
      action: 'challenge_created',
      description: `New grievance submitted: ${challenge.title}`,
      target: { type: 'Challenge', id: challenge._id, name: challenge.title },
    }).catch(() => {});

    res.status(201).json({ success: true, data: challenge, message: `Challenge submitted! ID: ${challenge.challengeId}` });
  } catch (error) {
    next(error);
  }
};

// @desc    Update challenge (admin/university)
// @route   PUT /api/challenges/:id
// @access  Private
exports.updateChallenge = async (req, res, next) => {
  try {
    let challenge = await Challenge.findById(req.params.id);
    if (!challenge) return res.status(404).json({ success: false, message: 'Challenge not found' });

    // Only submitter or admin can update
    if (challenge.submittedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const allowedUpdates = ['title', 'description', 'category', 'priority', 'location', 'deadline', 'isPublic', 'validationNotes', 'rejectionReason', 'impactMetrics'];
    const updateData = {};
    allowedUpdates.forEach(f => { if (req.body[f] !== undefined) updateData[f] = req.body[f]; });

    challenge = await Challenge.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });

    await logActivity({
      actor: req.user,
      action: 'challenge_updated',
      target: { type: 'Challenge', id: challenge._id, name: challenge.title },
      description: `Challenge updated: "${challenge.title}"`,
      req
    });

    res.status(200).json({ success: true, data: challenge });
  } catch (error) {
    next(error);
  }
};

// @desc    Update challenge status (Admin)
// @route   PUT /api/challenges/:id/status
// @access  Private (Admin, UniversityRep)
exports.updateStatus = async (req, res, next) => {
  try {
    const { status, note, rejectionReason } = req.body;
    const challenge = await Challenge.findById(req.params.id).populate('submittedBy', 'name email');

    if (!challenge) return res.status(404).json({ success: false, message: 'Challenge not found' });

    const validTransitions = {
      submitted: ['under_review', 'validated', 'rejected'],
      under_review: ['validated', 'rejected', 'submitted'],
      validated: ['assigned', 'under_review', 'rejected'],
      assigned: ['in_progress', 'escalated', 'validated', 'rejected'],
      in_progress: ['testing', 'resolved', 'escalated', 'assigned', 'rejected'],
      testing: ['resolved', 'in_progress', 'escalated'],
      escalated: ['assigned', 'in_progress', 'testing', 'resolved', 'closed'],
      resolved: ['closed', 'in_progress'],
      closed: ['resolved', 'in_progress'],
      rejected: ['under_review', 'submitted']
    };

    const allowed = validTransitions[challenge.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition from '${challenge.status}' to '${status}'`
      });
    }

    const oldStatus = challenge.status;
    challenge.status = status;
    if (rejectionReason) challenge.rejectionReason = rejectionReason;
    if (note) challenge.validationNotes = note;
    if (status === 'resolved') {
      challenge.resolvedAt = new Date();
      await User.findByIdAndUpdate(challenge.submittedBy, { $inc: { 'stats.challengesResolved': 1 } });
    }

    const finalNote = note || (rejectionReason ? `Rejected: ${rejectionReason}` : `Status updated to ${status}`);
    challenge.statusHistory.push({
      status,
      changedBy: req.user.id,
      changedAt: new Date(),
      note: finalNote
    });

    await challenge.save();

    // Notify submitter
    await notifyStatusChange(challenge, oldStatus, status, req.user);

    await logActivity({
      actor: req.user,
      action: 'challenge_status_changed',
      target: { type: 'Challenge', id: challenge._id, name: challenge.title },
      description: `Status changed: ${oldStatus} → ${status}`,
      metadata: new Map([['oldStatus', oldStatus], ['newStatus', status]]),
      req
    });

    res.status(200).json({ success: true, data: challenge, message: `Status updated to ${status}` });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign challenge to university
// @route   POST /api/challenges/:id/assign
// @access  Private (Admin)
exports.assignChallenge = async (req, res, next) => {
  try {
    const { universityId, deadline, note, notes } = req.body;
    const assignmentNote = note || notes || '';

    const [challenge, university] = await Promise.all([
      Challenge.findById(req.params.id).populate('submittedBy'),
      University.findById(universityId).populate('representatives', 'name email')
    ]);

    if (!challenge) return res.status(404).json({ success: false, message: 'Challenge not found' });
    if (!university) return res.status(404).json({ success: false, message: 'University not found' });

    const oldStatus = challenge.status;
    challenge.assignedUniversity = universityId;
    challenge.assignedUniversityUid = university.uid || ('U' + String(university._id).slice(-4));
    challenge.universityAssigned = university.name; // updated only when admin assigns
    challenge.assignedAt = new Date();
    challenge.assignedBy = req.user.id;
    challenge.status = 'assigned';
    if (deadline) challenge.deadline = new Date(deadline);

    challenge.statusHistory.push({
      status: 'assigned',
      changedBy: req.user.id,
      changedAt: new Date(),
      note: assignmentNote || `Assigned to ${university.name}`
    });

    await challenge.save();

    // Update university stats
    await University.findByIdAndUpdate(universityId, { $inc: { 'stats.totalAssigned': 1 } });

    // Notify citizen
    await notifyStatusChange(challenge, oldStatus, 'assigned', req.user);

    // Notify university reps
    for (const rep of (university.representatives || [])) {
      await notifyUniversityAssignment(challenge, rep._id, req.user);
    }

    // Sync into University Portal (UniversityNotification)
    try {
      const { Notification: UnivNotification } = require('../../university/database');
      const locStr = challenge.location?.district 
        ? `${challenge.location.district}, ${challenge.location.state || ''}`
        : (challenge.location?.address || 'India');

      if (UnivNotification) {
        const un = new UnivNotification({
          title: `New Problem Assigned by Admin: ${challenge.title}`,
          subtitle: `Assigned to ${university.name}. Action required: Review and initiate student project team.`,
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
            location: locStr,
            description: challenge.description,
            priority: challenge.priority || 'high',
            submitterContact: challenge.submitterContact || { name: 'Verified Citizen Submitter' },
            attachments: challenge.attachments || []
          },
          reviewed: false
        });
        await un.save();
      }

      challenge.authority = `Assigned Taskforce: ${university.name}`;
      await challenge.save();
    } catch (syncErr) {
      console.error('Error syncing challenge notification:', syncErr);
    }

    await logActivity({
      actor: req.user,
      action: 'challenge_assigned',
      target: { type: 'Challenge', id: challenge._id, name: challenge.title },
      description: `Challenge assigned to ${university.name}`,
      req
    });

    const populated = await Challenge.findById(challenge._id)
      .populate('assignedUniversity', 'name shortName logo');

    res.status(200).json({ success: true, data: populated, message: `Challenge assigned to ${university.name}` });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit feedback/rating for resolved challenge
// @route   POST /api/challenges/:id/feedback
// @access  Private (Citizen - submitter only)
exports.submitFeedback = async (req, res, next) => {
  try {
    const { rating, review } = req.body;
    const challenge = await Challenge.findById(req.params.id);

    if (!challenge) return res.status(404).json({ success: false, message: 'Challenge not found' });
    if (challenge.submittedBy.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only the submitter can provide feedback' });
    }
    if (challenge.status !== 'resolved') {
      return res.status(400).json({ success: false, message: 'Feedback can only be submitted for resolved challenges' });
    }
    if (challenge.feedback && challenge.feedback.rating) {
      return res.status(400).json({ success: false, message: 'Feedback already submitted' });
    }

    challenge.feedback = {
      rating: parseInt(rating),
      review,
      submittedAt: new Date(),
      submittedBy: req.user.id
    };

    await challenge.save();

    await logActivity({
      actor: req.user,
      action: 'feedback_submitted',
      target: { type: 'Challenge', id: challenge._id, name: challenge.title },
      description: `Feedback submitted: ${rating}/5 stars`,
      req
    });

    res.status(200).json({ success: true, message: 'Thank you for your feedback!', data: challenge.feedback });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete challenge
// @route   DELETE /api/challenges/:id
// @access  Private (Admin or submitter)
exports.deleteChallenge = async (req, res, next) => {
  try {
    let challenge = null;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      challenge = await Challenge.findById(req.params.id);
    }
    if (!challenge) {
      challenge = await Challenge.findOne({ challengeId: req.params.id });
    }
    if (!challenge) return res.status(404).json({ success: false, message: 'Challenge not found' });

    // Authorization check
    const clientEmail = (req.headers['x-citizen-email'] || (req.user && req.user.email) || '').toLowerCase().trim();
    const subEmail = (challenge.submitterContact?.email || (challenge.submittedBy && challenge.submittedBy.email) || '').toLowerCase().trim();
    const subId = challenge.submittedBy ? (challenge.submittedBy._id || challenge.submittedBy).toString() : '';
    const userId = req.user ? (req.user.id || req.user._id || '').toString() : '';
    const isSubmitter = (userId && subId && subId === userId)
      || (clientEmail && subEmail && clientEmail === subEmail)
      || (!challenge.submittedBy && !subEmail);
    const isAdmin = req.user && req.user.role === 'admin';

    if (!isAdmin && !isSubmitter && req.user) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this challenge' });
    }

    // Citizens can only delete unverified/submitted or draft grievances (not verified, assigned, or in-progress)
    const unverifiedStatuses = ['draft', 'submitted', 'pending', 'under_review'];
    if (!isAdmin && !unverifiedStatuses.includes(challenge.status)) {
      return res.status(400).json({ success: false, message: 'Cannot delete a grievance once it is verified, assigned, or in progress' });
    }

    // Safely cleanup associated cloud files if any
    try {
      const filePaths = [];
      if (challenge.filePath) filePaths.push(challenge.filePath);
      if (challenge.resolutionProof?.beforeFilePath) filePaths.push(challenge.resolutionProof.beforeFilePath);
      if (challenge.resolutionProof?.afterFilePath) filePaths.push(challenge.resolutionProof.afterFilePath);
      if (Array.isArray(challenge.attachments)) {
        challenge.attachments.forEach(att => {
          if (att && att.filePath && !filePaths.includes(att.filePath)) {
            filePaths.push(att.filePath);
          }
        });
      }
      if (filePaths.length > 0 && typeof deleteFileFromSupabase === 'function') {
        await deleteFileFromSupabase(filePaths);
      }
    } catch (cleanErr) {
      console.warn('Storage cleanup notice on challenge delete:', cleanErr.message);
    }

    await challenge.deleteOne();
    res.status(200).json({ success: true, message: 'Challenge deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get challenges submitted by current user
// @route   GET /api/challenges/my
// @access  Private
exports.getMyChallenges = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = { submittedBy: req.user.id };
    if (status) query.status = status;

    const [challenges, total] = await Promise.all([
      Challenge.find(query)
        .populate('assignedUniversity', 'name shortName logo')
        .sort('-createdAt')
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit)),
      Challenge.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: challenges,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get public challenge stats
// @route   GET /api/challenges/stats
// @access  Public
exports.getChallengeStats = async (req, res, next) => {
  try {
    const [statusStats, categoryStats, districtStats] = await Promise.all([
      Challenge.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Challenge.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Challenge.aggregate([
        { $group: { _id: '$location.district', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    const total = await Challenge.countDocuments();
    const resolved = await Challenge.countDocuments({ status: 'resolved' });

    res.status(200).json({
      success: true,
      data: {
        total,
        resolved,
        resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0,
        byStatus: statusStats.reduce((acc, s) => { acc[s._id] = s.count; return acc; }, {}),
        byCategory: categoryStats,
        byDistrict: districtStats
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Live classify challenge text with AI
// @route   POST /api/challenges/classify
// @access  Public
exports.classifyChallengeText = async (req, res, next) => {
  try {
    const { title = '', description = '' } = req.body;
    const classification = classifyChallenge(title, description);
    const suggestedPriority = suggestPriority(`${title} ${description}`);
    const tags = generateTags(`${title} ${description}`);

    res.status(200).json({
      success: true,
      data: {
        category: classification.category,
        confidence: classification.confidence,
        suggestedPriority,
        tags,
        scores: classification.scores
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle support (like) on a challenge
// @route   POST /api/challenges/:id/support
// @access  Private
exports.toggleSupport = async (req, res, next) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) return res.status(404).json({ success: false, message: 'Challenge not found' });

    const userId = req.user.id;
    const alreadySupported = challenge.supports.some(id => id.toString() === userId);

    if (alreadySupported) {
      challenge.supports = challenge.supports.filter(id => id.toString() !== userId);
      challenge.supportCount = Math.max(0, (challenge.supportCount || 1) - 1);
    } else {
      challenge.supports.push(userId);
      challenge.supportCount = (challenge.supportCount || 0) + 1;
    }

    await challenge.save();

    res.status(200).json({
      success: true,
      data: {
        supported: !alreadySupported,
        supportCount: challenge.supportCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get public social feed
// @route   GET /api/feed or /api/challenges/feed or /api/problems/feed
// @access  Public
exports.getPublicFeed = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 10, cursor,
      state, district, category, status, scope,
      sort = 'recent', search, lat, lng, radius = 25
    } = req.query;

    const query = {
      isPublic: true,
      status: { $nin: ['draft', 'rejected'] }
    };

    if (state && state !== 'all' && state !== 'All') query['location.state'] = state;
    if (district && district !== 'all' && district !== 'All') {
      query['location.district'] = new RegExp('^' + district.trim(), 'i');
    }
    if (category && category !== 'all' && category !== 'All' && category !== 'All Categories') {
      query.category = new RegExp(category.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    }
    if (status && status !== 'all' && status !== 'All') {
      query.status = status;
    }
    if (search && search.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
        { 'location.district': { $regex: search.trim(), $options: 'i' } }
      ];
    }

    if (lat && lng) {
      const pLat = parseFloat(lat);
      const pLng = parseFloat(lng);
      const radKm = parseFloat(radius) || 25;
      if (!isNaN(pLat) && !isNaN(pLng)) {
        const degDeltaLat = radKm / 110;
        const degDeltaLng = radKm / (110 * Math.max(Math.cos(pLat * Math.PI / 180), 0.5));
        query['location.coordinates.lat'] = { $gte: pLat - degDeltaLat, $lte: pLat + degDeltaLat };
        query['location.coordinates.lng'] = { $gte: pLng - degDeltaLng, $lte: pLng + degDeltaLng };
      }
    }

    // Cursor-based pagination (created before cursor)
    if (cursor) {
      const cursorDate = new Date(cursor);
      if (!isNaN(cursorDate.getTime())) {
        query.createdAt = { $lt: cursorDate };
      } else if (mongoose.Types.ObjectId.isValid(cursor)) {
        query._id = { $lt: new mongoose.Types.ObjectId(cursor) };
      }
    }

    const sortOptions = {
      recent: { createdAt: -1 },
      latest: { createdAt: -1 },
      'most-affected': { duplicateCount: -1, createdAt: -1 },
      affected: { duplicateCount: -1, createdAt: -1 },
      supported: { praiseCount: -1, supportCount: -1, createdAt: -1 },
      praised: { praiseCount: -1, supportCount: -1, createdAt: -1 },
      discussed: { commentCount: -1, createdAt: -1 },
      oldest: { createdAt: 1 }
    };
    const sortBy = sortOptions[sort] || { createdAt: -1 };

    const parsedLimit = Math.min(Math.max(parseInt(limit) || 10, 1), 50);
    const parsedPage = Math.max(parseInt(page) || 1, 1);
    const skip = cursor ? 0 : (parsedPage - 1) * parsedLimit;

    const [challenges, total] = await Promise.all([
      Challenge.find(query)
        .populate('submittedBy', 'name avatar role')
        .populate('assignedUniversity', 'name shortName logo')
        .select('title description category priority status location attachments coverImage image filePath videoUrl video media resolutionProof supportCount supports praiseCount praisedBy displayNamePublicly commentCount viewCount createdAt submittedBy assignedUniversity isFeatured submitterContact reportedBy duplicateCount twinnedChallenges twinnedWith officialSlipId authority department challengeId')
        .sort(sortBy)
        .skip(skip)
        .limit(parsedLimit)
        .lean(),
      Challenge.countDocuments(query)
    ]);

    const currentUserId = req.user ? (req.user.id || req.user._id || '').toString() : (req.headers['x-citizen-id'] || '');

    // Enrich challenges for the social feed
    const enriched = challenges.map(c => {
      const pCount = c.praiseCount !== undefined ? c.praiseCount : (Array.isArray(c.praisedBy) ? c.praisedBy.length : 0);
      const sCount = c.supportCount !== undefined ? c.supportCount : (Array.isArray(c.supports) ? c.supports.length : 0);
      const repCount = Array.isArray(c.reportedBy) ? c.reportedBy.length : 0;
      const dupCount = typeof c.duplicateCount === 'number' ? c.duplicateCount : 0;
      const mCount = Math.max(repCount, dupCount);

      const isPraisedByMe = Boolean(currentUserId && Array.isArray(c.praisedBy) && c.praisedBy.some(id => id.toString() === currentUserId));
      const isMeTooByMe = Boolean(currentUserId && Array.isArray(c.reportedBy) && c.reportedBy.some(r => r.citizenId && r.citizenId.toString() === currentUserId));
      const isMyReport = Boolean(currentUserId && c.submittedBy && (c.submittedBy._id || c.submittedBy).toString() === currentUserId);

      // Extract all media attachments
      let mediaList = [];
      if (Array.isArray(c.attachments) && c.attachments.length > 0) {
        mediaList = c.attachments.map((a, idx) => {
          const u = a.url || a.filePath;
          const isVid = (a.mimetype && a.mimetype.startsWith('video/')) || /\.(mp4|webm|mov|ogg|mkv)$/i.test(u || '');
          return {
            url: u,
            mimetype: a.mimetype || (isVid ? 'video/mp4' : 'image/jpeg'),
            originalName: a.originalName || a.filename || (isVid ? `Video ${idx + 1}` : `Photo ${idx + 1}`)
          };
        }).filter(m => m.url);
      }
      if (c.filePath && typeof c.filePath === 'string') {
        const isVid = /\.(mp4|webm|mov|ogg|mkv)$/i.test(c.filePath);
        if (!mediaList.some(m => m.url === c.filePath)) {
          mediaList.push({
            url: c.filePath,
            mimetype: isVid ? 'video/mp4' : 'image/jpeg',
            originalName: isVid ? 'Field Video' : 'Ground Photo'
          });
        }
      }
      if (c.videoUrl || c.video) {
        const v = c.videoUrl || c.video;
        if (!mediaList.some(m => m.url === v)) {
          mediaList.push({
            url: v,
            mimetype: 'video/mp4',
            originalName: 'Citizen Video Evidence'
          });
        }
      }
      if (Array.isArray(c.media)) {
        c.media.forEach((m, idx) => {
          const u = typeof m === 'string' ? m : (m.url || m.filePath);
          const isVid = m.mediaType === 'video' || /\.(mp4|webm|mov|ogg|mkv)$/i.test(u || '');
          if (u && !mediaList.some(x => x.url === u)) {
            mediaList.push({
              url: u,
              mimetype: isVid ? 'video/mp4' : 'image/jpeg',
              originalName: m.title || `Media ${idx + 1}`
            });
          }
        });
      }
      if (mediaList.length === 0 && (c.coverImage || c.image)) {
        mediaList.push({
          url: c.coverImage || c.image,
          mimetype: 'image/jpeg',
          originalName: 'Ground Evidence Photo'
        });
      }

      // Respect privacy flag
      let authorName = 'Verified Citizen';
      let isVerified = true;
      if (c.displayNamePublicly === false) {
        authorName = 'Anonymous Citizen';
      } else if (c.submittedBy && c.submittedBy.name) {
        authorName = c.submittedBy.name;
      } else if (c.submitterContact && c.submitterContact.name) {
        authorName = c.submitterContact.name;
      }

      let displayLocation = 'Ranchi, Jharkhand';
      let district = 'Ranchi';
      let state = 'Jharkhand';
      if (c.location) {
        if (typeof c.location === 'object') {
          district = c.location.district || c.location.city || 'Ranchi';
          state = c.location.state || 'Jharkhand';
          displayLocation = `${district}, ${state}`.replace(/^, |, $/g, '') || c.location.address || 'Ranchi, Jharkhand';
        } else if (typeof c.location === 'string') {
          displayLocation = c.location;
          district = c.location.split(',')[0]?.trim() || 'Ranchi';
          state = c.location.split(',')[1]?.trim() || 'Jharkhand';
        }
      }

      // Calculate distance in km if client provided lat/lng
      let distanceKm = null;
      if (lat && lng && c.location?.coordinates?.lat != null && c.location?.coordinates?.lng != null) {
        const uLat = parseFloat(lat);
        const uLng = parseFloat(lng);
        const dLat = (c.location.coordinates.lat - uLat) * 111;
        const dLng = (c.location.coordinates.lng - uLng) * 111 * Math.cos(uLat * Math.PI / 180);
        distanceKm = Math.round(Math.sqrt(dLat * dLat + dLng * dLng) * 10) / 10;
      }

      return {
        ...c,
        authorName,
        isVerified,
        district,
        state,
        displayLocation,
        distanceKm,
        praiseCount: pCount,
        supportCount: sCount,
        meTooCount: mCount,
        isPraisedByMe,
        isMeTooByMe,
        isMyReport,
        mediaList
      };
    });

    // Fire & forget view count update
    const ids = challenges.map(c => c._id);
    if (ids.length > 0) {
      Challenge.updateMany({ _id: { $in: ids } }, { $inc: { viewCount: 1 } }).exec();
    }

    const nextCursor = challenges.length === parsedLimit ? challenges[challenges.length - 1].createdAt : null;

    res.status(200).json({
      success: true,
      data: enriched,
      nextCursor,
      hasMore: Boolean(nextCursor),
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        pages: Math.ceil(total / parsedLimit),
        hasMore: cursor ? Boolean(nextCursor) : (parsedPage * parsedLimit < total)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle praise on challenge/problem (❤️ Like)
// @route   POST /api/challenges/:id/praise
// @access  Public / Private
exports.togglePraise = async (req, res, next) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) return res.status(404).json({ success: false, message: 'Challenge not found' });

    const userId = req.user ? (req.user.id || req.user._id) : (req.headers['x-citizen-id'] || '67cb56000000000000000002');
    if (!Array.isArray(challenge.praisedBy)) challenge.praisedBy = [];

    const praisedIndex = challenge.praisedBy.findIndex(id => id.toString() === userId.toString());
    let isPraised = false;

    if (praisedIndex > -1) {
      challenge.praisedBy.splice(praisedIndex, 1);
      challenge.praiseCount = Math.max(0, (challenge.praiseCount || 1) - 1);
      isPraised = false;
    } else {
      challenge.praisedBy.push(userId);
      challenge.praiseCount = (challenge.praiseCount || 0) + 1;
      isPraised = true;
    }

    await challenge.save();

    res.status(200).json({
      success: true,
      praised: isPraised,
      praiseCount: challenge.praiseCount
    });
  } catch (error) {
    next(error);
  }
};

// @desc    "I am also affected" (Me Too) co-reporting and twinning action
// @route   POST /api/challenges/:id/me-too
// @access  Public / Private
exports.meTooChallenge = async (req, res, next) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) return res.status(404).json({ success: false, message: 'Challenge not found' });

    const userId = req.user ? (req.user.id || req.user._id) : (req.headers['x-citizen-id'] || '67cb56000000000000000002');
    const userName = req.user ? req.user.name : (req.headers['x-citizen-name'] || 'Citizen');

    // Check if citizen is the original submitter
    const submitterId = challenge.submittedBy ? challenge.submittedBy.toString() : '';
    if (submitterId && submitterId === userId.toString()) {
      return res.status(400).json({
        success: false,
        isMyReport: true,
        message: 'This is your report — you cannot co-report your own submission'
      });
    }

    if (!Array.isArray(challenge.reportedBy)) challenge.reportedBy = [];
    const alreadyReported = challenge.reportedBy.some(r => r.citizenId && r.citizenId.toString() === userId.toString());

    if (alreadyReported) {
      // Toggle OFF: remove citizen from co-reporters
      challenge.reportedBy = challenge.reportedBy.filter(r => r.citizenId && r.citizenId.toString() !== userId.toString());
      challenge.duplicateCount = Math.max(0, (challenge.duplicateCount || 1) - 1);
      challenge.supportCount = Math.max(0, (challenge.supportCount || 1) - 1);
      if (Array.isArray(challenge.supports)) {
        challenge.supports = challenge.supports.filter(s => s.toString() !== userId.toString());
      }
      await challenge.save();
      return res.status(200).json({
        success: true,
        isMeTooByMe: false,
        meTooCount: challenge.reportedBy.length,
        duplicateCount: challenge.duplicateCount,
        message: 'Co-report removed'
      });
    }

    // Add citizen to co-reporters
    challenge.reportedBy.push({
      citizenId: userId,
      citizenName: userName,
      reportedAt: new Date(),
      viaVoiceAgent: false
    });

    // Increment duplicate / support signals
    challenge.duplicateCount = (challenge.duplicateCount || 0) + 1;
    challenge.supportCount = (challenge.supportCount || 0) + 1;
    if (!Array.isArray(challenge.supports)) challenge.supports = [];
    if (!challenge.supports.includes(userId)) challenge.supports.push(userId);

    // Elevate urgency / twinning signal if duplicate count crosses threshold
    if (challenge.duplicateCount >= 3 && challenge.priority !== 'urgent') {
      challenge.priority = challenge.duplicateCount >= 5 ? 'urgent' : 'high';
      challenge.collaborationReady = true;
    }

    await challenge.save();

    res.status(200).json({
      success: true,
      meTooCount: challenge.reportedBy.length,
      duplicateCount: challenge.duplicateCount,
      isMeTooByMe: true,
      priority: challenge.priority,
      message: 'Thank you! Your co-report has been recorded and reinforces this community priority.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get India-wide map data (state-wise counts)
// @route   GET /api/map-data
// @access  Public
exports.getMapData = async (req, res, next) => {
  try {
    const { category, startDate, endDate } = req.query;

    const matchQuery = {};
    if (category) matchQuery.category = category;
    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
    }

    const stateData = await Challenge.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$location.state',
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $in: ['$status', ['submitted', 'under_review', 'validated', 'assigned', 'in_progress', 'testing']] }, 1, 0] } },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $in: ['$status', ['submitted', 'under_review']] }, 1, 0] } },
          urgent: { $sum: { $cond: [{ $eq: ['$priority', 'urgent'] }, 1, 0] } },
          avgLat: { $avg: '$location.coordinates.lat' },
          avgLng: { $avg: '$location.coordinates.lng' }
        }
      },
      { $sort: { total: -1 } }
    ]);

    // Category breakdown per state
    const categoryData = await Challenge.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: { state: '$location.state', category: '$category' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Format category data
    const categoryByState = {};
    categoryData.forEach(item => {
      const state = item._id.state;
      if (!categoryByState[state]) categoryByState[state] = {};
      categoryByState[state][item._id.category] = item.count;
    });

    const formattedData = stateData.map(s => ({
      state: s._id || 'Unknown',
      total: s.total,
      active: s.active,
      resolved: s.resolved,
      pending: s.pending,
      urgent: s.urgent,
      resolutionRate: s.total > 0 ? Math.round((s.resolved / s.total) * 100) : 0,
      categories: categoryByState[s._id] || {}
    }));

    const summary = {
      totalStates: stateData.length,
      totalChallenges: stateData.reduce((sum, s) => sum + s.total, 0),
      totalActive: stateData.reduce((sum, s) => sum + s.active, 0),
      totalResolved: stateData.reduce((sum, s) => sum + s.resolved, 0),
      topState: stateData[0]?._id || 'N/A'
    };

    res.status(200).json({
      success: true,
      data: formattedData,
      summary
    });
  } catch (error) {
    next(error);
  }
};



// @desc    Check for potential duplicate challenges nearby
// @route   POST /api/challenges/check-duplicates
// @access  Public/Private
exports.checkDuplicates = async (req, res, next) => {
  try {
    const { title, description, category, location } = req.body;
    const district = location && location.district ? location.district : '';

    let candidateQuery = { status: { $in: ['submitted', 'under_review', 'validated', 'assigned', 'in_progress', 'testing', 'resolved'] } };
    if (district) {
      candidateQuery['location.district'] = new RegExp(district, 'i');
    }

    const candidateList = await Challenge.find(candidateQuery)
      .select('title description category status location challengeId supportCount supports createdAt')
      .limit(50)
      .lean();

    const duplicates = findSimilarChallenges({ title, description, category, location }, candidateList);

    res.status(200).json({
      success: true,
      hasDuplicates: duplicates.length > 0,
      data: duplicates
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Parse speech-to-text transcript into structured challenge data
// @route   POST /api/challenges/parse-voice
// @access  Public/Private
exports.parseVoice = async (req, res, next) => {
  try {
    const { transcript = '' } = req.body;
    const parsed = parseVoiceTranscript(transcript);
    res.status(200).json({
      success: true,
      data: parsed
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Citizen validates resolution of problem (Confirm / Reopen)
// @route   POST /api/challenges/:id/validate-resolution
// @access  Private (Citizen submitter)
exports.validateResolution = async (req, res, next) => {
  try {
    const { isSolved, feedback, reopenReason } = req.body;
    const challenge = await Challenge.findById(req.params.id);

    if (!challenge) return res.status(404).json({ success: false, message: 'Challenge not found' });

    if (challenge.submittedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only the original citizen can validate the solution' });
    }

    if (isSolved) {
      challenge.status = 'closed';
      challenge.resolvedAt = challenge.resolvedAt || new Date();
      challenge.resolutionProof = {
        ...(challenge.resolutionProof || {}),
        citizenVerified: true,
        citizenFeedback: feedback || 'Citizen confirmed solution is working satisfactorily.',
        verifiedAt: new Date()
      };
      challenge.statusHistory.push({
        status: 'closed',
        changedBy: req.user.id,
        note: 'Citizen verified solution: ' + (feedback || 'Problem solved satisfactorily')
      });
    } else {
      challenge.status = 'in_progress';
      challenge.resolutionProof = {
        ...(challenge.resolutionProof || {}),
        citizenVerified: false,
        citizenFeedback: reopenReason || 'Citizen indicated problem still persists.',
        verifiedAt: new Date()
      };
      challenge.statusHistory.push({
        status: 'in_progress',
        changedBy: req.user.id,
        note: 'Citizen reported problem NOT resolved: ' + (reopenReason || 'Issue persists')
      });
    }

    await challenge.save();

    res.status(200).json({
      success: true,
      status: challenge.status,
      message: isSolved ? 'Thank you! Solution citizen-verified & report closed.' : 'Report reopened. University and taskforce have been alerted.',
      data: challenge
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Citizen provides additional info requested by authority
// @route   POST /api/challenges/:id/provide-info
// @access  Private (Citizen submitter)
exports.provideAdditionalInfo = async (req, res, next) => {
  try {
    const { notes, landmark, voiceTranscript } = req.body;
    const challenge = await Challenge.findById(req.params.id);

    if (!challenge) return res.status(404).json({ success: false, message: 'Challenge not found' });

    const mediaUrls = req.files ? req.files.map(f => '/uploads/challenges/' + f.filename) : [];

    challenge.needMoreInfo = challenge.needMoreInfo || {};
    challenge.needMoreInfo.isActive = false;
    challenge.needMoreInfo.responses = challenge.needMoreInfo.responses || [];
    challenge.needMoreInfo.responses.push({
      notes: notes || '',
      landmark: landmark || '',
      voiceTranscript: voiceTranscript || '',
      mediaUrls,
      submittedAt: new Date()
    });

    challenge.statusHistory.push({
      status: challenge.status,
      changedBy: req.user.id,
      note: 'Citizen submitted additional information' + (landmark ? ' (Landmark: ' + landmark + ')' : '')
    });

    await challenge.save();

    res.status(200).json({
      success: true,
      message: 'Additional information successfully submitted to JanSetu!',
      data: challenge
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign industry partner to challenge
// @route   POST /api/challenges/:id/assign-industry
// @access  Private (Admin)
exports.assignIndustryPartner = async (req, res, next) => {
  try {
    const { partnerId, role, note } = req.body;

    const [challenge, partner] = await Promise.all([
      Challenge.findById(req.params.id),
      IndustryPartner.findById(partnerId)
    ]);

    if (!challenge) return res.status(404).json({ success: false, message: 'Challenge not found' });
    if (!partner) return res.status(404).json({ success: false, message: 'Industry Partner not found' });

    // Prevent duplicate assignment
    const alreadyAssigned = challenge.industryCollaborators.some(c => c.partner.toString() === partnerId);
    if (alreadyAssigned) {
      return res.status(400).json({ success: false, message: 'Partner is already collaborating on this challenge' });
    }

    challenge.assignedIndustry = partnerId;
    challenge.assignedIndustryIid = partner.iid || ('I' + String(partner._id).slice(-4));
    challenge.industryAssigned = partner.name; // updated only when admin assigns

    challenge.industryCollaborators.push({
      partner: partnerId,
      role: role || 'funder',
      joinedAt: new Date()
    });

    challenge.statusHistory.push({
      status: challenge.status,
      changedBy: req.user.id,
      note: note || `Industry Partner ${partner.name} joined as ${role || 'funder'}`
    });

    await challenge.save();

    // Update partner stats
    await IndustryPartner.findByIdAndUpdate(partnerId, { $inc: { 'stats.totalCollaborations': 1 } });

    await logActivity({
      actor: req.user,
      action: 'challenge_assigned',
      target: { type: 'Challenge', id: challenge._id, name: challenge.title },
      description: `Industry partner ${partner.name} joined challenge`,
      req
    });

    res.status(200).json({ success: true, message: `Industry Partner ${partner.name} assigned` });
  } catch (error) {
    next(error);
  }
};



// @desc    Delete only uploaded files of a challenge (e.g. when problem is done/resolved to save Supabase storage space)
// @route   DELETE /api/challenges/:id/files
// @access  Public/Private (Citizen submitter or Admin)
exports.deleteChallengeFiles = async (req, res, next) => {
  try {
    const id = req.params.id;
    let challenge = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      challenge = await Challenge.findById(id);
    }
    if (!challenge) {
      challenge = await Challenge.findOne({ challengeId: id });
    }
    if (!challenge) {
      return res.status(404).json({ success: false, message: 'Challenge not found' });
    }

    // Collect all file paths to delete from Supabase storage
    const filePaths = [];
    if (challenge.filePath) filePaths.push(challenge.filePath);
    if (challenge.resolutionProof?.beforeFilePath) filePaths.push(challenge.resolutionProof.beforeFilePath);
    if (challenge.resolutionProof?.afterFilePath) filePaths.push(challenge.resolutionProof.afterFilePath);
    if (Array.isArray(challenge.attachments)) {
      challenge.attachments.forEach(att => {
        if (att && att.filePath && !filePaths.includes(att.filePath)) {
          filePaths.push(att.filePath);
        }
      });
    }

    let deletedFiles = [];
    if (filePaths.length > 0) {
      const delRes = await deleteFileFromSupabase(filePaths);
      deletedFiles = delRes.deleted || filePaths;
    }

    // Clear file paths & image references in Challenge model
    challenge.filePath = null;
    challenge.coverImage = null;
    challenge.image = null;
    challenge.attachments = [];
    if (challenge.resolutionProof) {
      challenge.resolutionProof.beforeImage = null;
      challenge.resolutionProof.beforeFilePath = null;
      challenge.resolutionProof.afterImage = null;
      challenge.resolutionProof.afterFilePath = null;
    }
    await challenge.save();

    // File paths & evidence are stored solely in unified Challenge collection

    res.status(200).json({
      success: true,
      message: 'Files deleted from Supabase cloud storage and removed from databases successfully',
      data: {
        id: challenge._id,
        filePath: null,
        deletedFiles
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get chat messages for a challenge/problem
// @route   GET /api/challenges/:id/chat or /api/problems/:id/chat
// @access  Public / Private
exports.getChallengeChat = async (req, res, next) => {
  try {
    const id = req.params.id;
    let challenge = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      challenge = await Challenge.findById(id).populate('assignedUniversity');
    }
    if (!challenge) {
      challenge = await Challenge.findOne({ challengeId: id }).populate('assignedUniversity');
    }

    const Problem = Challenge;
    let problem = null;
    if (Problem) {
      problem = await Problem.findOne({
        $or: [
          ...(mongoose.Types.ObjectId.isValid(id) ? [{ _id: id }, { sourceCitizenProblemId: id }] : []),
          { challengeId: id }
        ]
      });
    }

    // Cross-link resolution: if only one record was matched, find the other
    if (challenge && !problem && Problem) {
      problem = await Problem.findOne({
        $or: [
          { sourceCitizenProblemId: challenge._id.toString() },
          { challengeId: challenge.challengeId }
        ]
      });
    }
    if (problem && !challenge) {
      if (problem.sourceCitizenProblemId && mongoose.Types.ObjectId.isValid(problem.sourceCitizenProblemId)) {
        challenge = await Challenge.findById(problem.sourceCitizenProblemId).populate('assignedUniversity');
      }
      if (!challenge && problem.challengeId) {
        challenge = await Challenge.findOne({ challengeId: problem.challengeId }).populate('assignedUniversity');
      }
    }

    if (!challenge && !problem) {
      return res.status(404).json({ success: false, message: 'Problem/Challenge record not found' });
    }

    let messages = [];
    const pool = [];
    if (challenge && Array.isArray(challenge.chatMessages)) pool.push(...challenge.chatMessages);
    if (problem && Array.isArray(problem.chatMessages)) pool.push(...problem.chatMessages);

    const seenSignatures = new Set();
    pool.forEach(m => {
      if (!m || !m.text) return;
      const txt = m.text.trim();
      const sdr = (m.sender || '').trim().toLowerCase();
      const sig = `${sdr}:::${txt}`;
      const idSig = m._id ? String(m._id) : null;
      if (idSig && seenSignatures.has('id_' + idSig)) return;
      if (seenSignatures.has(sig)) return;

      if (idSig) seenSignatures.add('id_' + idSig);
      seenSignatures.add(sig);
      messages.push(m);
    });
    messages.sort((a, b) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime());

    // If no messages exist yet, initialize tripartite welcome conversation
    if (messages.length === 0) {
      const univName = (challenge && challenge.assignedUniversity && challenge.assignedUniversity.name) ||
                        (problem && problem.authority) || 'BIT Mesra Civil & Environmental Lab';
      const createdTime = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

      const welcomeAdmin = {
        sender: 'Shri S. K. Verma',
        senderRole: 'JanSetu Administrative Officer',
        senderAvatar: '🛡️',
        senderType: 'admin',
        department: 'District Municipal Desk, Ranchi',
        text: `Namaste. Your grievance has been registered and verified by JanSetu District Administration. An official work order has been forwarded to ${univName}.`,
        time: createdTime,
        timestamp: new Date(Date.now() - 3600000),
        readByCitizen: false,
        readByUniversity: true,
        readByAdmin: true
      };

      const welcomeUniv = {
        sender: 'Prof. R. K. Sharma',
        senderRole: 'University Faculty Guide',
        senderAvatar: '🏛️',
        senderType: 'university',
        department: `${univName} - Engineering Taskforce`,
        text: `Greetings from the University Innovation Cell! Our student engineering team has taken up this problem statement. We are analyzing the ground evidence provided.`,
        time: createdTime,
        timestamp: new Date(),
        readByCitizen: false,
        readByUniversity: true,
        readByAdmin: true
      };

      messages = [welcomeAdmin, welcomeUniv];

      if (challenge) {
        challenge.chatMessages = messages;
        await challenge.save().catch(() => {});
      }
      if (problem) {
        problem.chatMessages = messages;
        await problem.save().catch(() => {});
      }
    }

    res.status(200).json({
      success: true,
      data: messages,
      chatMessages: messages,
      participants: {
        admin: {
          name: 'Shri S. K. Verma',
          role: 'JanSetu Administrative Officer',
          department: 'District Municipal Desk, Ranchi'
        },
        university: {
          name: 'Prof. R. K. Sharma',
          role: 'University Faculty Guide',
          department: (challenge?.assignedUniversity?.name) || 'BIT Mesra - Civil & Environmental Lab'
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Post a new chat message to a challenge/problem
// @route   POST /api/challenges/:id/chat or /api/problems/:id/chat
// @access  Public / Private
exports.postChallengeChatMessage = async (req, res, next) => {
  try {
    const id = req.params.id;
    const { text, sender, senderRole, senderType, department, senderAvatar } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Message text is required' });
    }

    let challenge = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      challenge = await Challenge.findById(id).populate('assignedUniversity');
    }
    if (!challenge) {
      challenge = await Challenge.findOne({ challengeId: id }).populate('assignedUniversity');
    }

    const Problem = Challenge;
    let problem = null;
    if (Problem) {
      problem = await Problem.findOne({
        $or: [
          ...(mongoose.Types.ObjectId.isValid(id) ? [{ _id: id }, { sourceCitizenProblemId: id }] : []),
          { challengeId: id }
        ]
      });
    }

    // Cross-link resolution: if only one record was matched, find the other
    if (challenge && !problem && Problem) {
      problem = await Problem.findOne({
        $or: [
          { sourceCitizenProblemId: challenge._id.toString() },
          { challengeId: challenge.challengeId }
        ]
      });
    }
    if (problem && !challenge) {
      if (problem.sourceCitizenProblemId && mongoose.Types.ObjectId.isValid(problem.sourceCitizenProblemId)) {
        challenge = await Challenge.findById(problem.sourceCitizenProblemId).populate('assignedUniversity');
      }
      if (!challenge && problem.challengeId) {
        challenge = await Challenge.findOne({ challengeId: problem.challengeId }).populate('assignedUniversity');
      }
    }

    const detectedSenderType = senderType || (senderRole?.toLowerCase().includes('university') ? 'university' : senderRole?.toLowerCase().includes('admin') ? 'admin' : 'citizen');
    const detectedSender = sender || (detectedSenderType === 'university' ? 'University Innovation Guide' : detectedSenderType === 'admin' ? 'District Admin Officer' : 'Citizen');
    const detectedRole = senderRole || (detectedSenderType === 'university' ? 'University Faculty Guide' : detectedSenderType === 'admin' ? 'JanSetu Administrative Officer' : 'Citizen Submitter');
    const detectedAvatar = senderAvatar || (detectedSenderType === 'university' ? '🏛️' : detectedSenderType === 'admin' ? '🛡️' : '👤');

    const newMsg = {
      sender: detectedSender,
      senderRole: detectedRole,
      senderAvatar: detectedAvatar,
      senderType: detectedSenderType,
      department: department || (detectedSenderType === 'university' ? 'University Engineering Taskforce' : detectedSenderType === 'admin' ? 'District Municipal Desk' : 'Citizen Ground Reporter'),
      text: text.trim(),
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      timestamp: new Date(),
      isUniversity: detectedSenderType === 'university',
      readByCitizen: detectedSenderType === 'citizen',
      readByUniversity: detectedSenderType === 'university',
      readByAdmin: detectedSenderType === 'admin'
    };

    if (challenge) {
      if (!Array.isArray(challenge.chatMessages)) challenge.chatMessages = [];
      const isAlreadyThere = challenge.chatMessages.some(m => m && m.text && m.text.trim() === newMsg.text.trim() && m.sender === newMsg.sender && Math.abs(new Date(m.timestamp || 0) - new Date(newMsg.timestamp || 0)) < 45000);
      if (!isAlreadyThere) {
        challenge.chatMessages.push(newMsg);
        await challenge.save();
      }
    }

    if (problem) {
      if (!Array.isArray(problem.chatMessages)) problem.chatMessages = [];
      const isAlreadyThere = problem.chatMessages.some(m => m && m.text && m.text.trim() === newMsg.text.trim() && m.sender === newMsg.sender && Math.abs(new Date(m.timestamp || 0) - new Date(newMsg.timestamp || 0)) < 45000);
      if (!isAlreadyThere) {
        problem.chatMessages.push(newMsg);
        await problem.save();
      }
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: newMsg,
      chatMessages: (challenge && challenge.chatMessages) || (problem && problem.chatMessages) || [newMsg]
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark chat messages as read for citizen
// @route   POST /api/challenges/:id/chat/mark-read or /api/problems/:id/chat/mark-read
// @access  Public / Private
exports.markChallengeChatRead = async (req, res, next) => {
  try {
    const id = req.params.id;
    let challenge = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      challenge = await Challenge.findById(id);
    }
    if (!challenge) {
      challenge = await Challenge.findOne({ challengeId: id });
    }

    if (challenge && Array.isArray(challenge.chatMessages)) {
      challenge.chatMessages.forEach(m => {
        m.readByCitizen = true;
      });
      await challenge.save();
    }

    const Problem = Challenge;
    if (Problem) {
      await Problem.updateMany(
        {
          $or: [
            ...(mongoose.Types.ObjectId.isValid(id) ? [{ _id: id }, { sourceCitizenProblemId: id }] : []),
            { challengeId: id }
          ]
        },
        { $set: { 'chatMessages.$[].readByCitizen': true } }
      ).catch(() => {});
    }

    res.status(200).json({ success: true, message: 'Chat messages marked as read by citizen' });
  } catch (error) {
    next(error);
  }
};
