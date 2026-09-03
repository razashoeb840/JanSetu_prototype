const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');

/**
 * Create an in-app notification
 */
const createNotification = async ({ recipient, sender, type, title, message, data = {}, priority = 'normal' }) => {
  try {
    const notification = await Notification.create({
      recipient, sender, type, title, message, data, priority
    });
    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error.message);
    return null;
  }
};

/**
 * Notify when a challenge is submitted
 */
const notifyChallenge = async (challenge, actor) => {
  const notifications = [];

  // Notify submitter
  notifications.push({
    recipient: challenge.submittedBy,
    sender: actor?._id,
    type: 'challenge_submitted',
    title: 'Challenge Submitted Successfully',
    message: `Your challenge "${challenge.title}" has been submitted with ID: ${challenge.challengeId}. Our team will review it shortly.`,
    data: { challengeId: challenge._id, challengeRefId: challenge.challengeId },
    priority: 'normal'
  });

  await Promise.all(notifications.map(n => createNotification(n)));
};

/**
 * Notify when a challenge status changes
 */
const notifyStatusChange = async (challenge, oldStatus, newStatus, actor) => {
  const statusMessages = {
    validated: { title: 'Challenge Validated', message: `Your challenge "${challenge.title}" has been validated and will be assigned to a university soon.`, priority: 'high' },
    rejected: { title: 'Challenge Rejected', message: `Your challenge "${challenge.title}" was not validated. Reason: ${challenge.rejectionReason || 'Does not meet criteria'}`, priority: 'high' },
    assigned: { title: 'Challenge Assigned to University', message: `Great news! Your challenge "${challenge.title}" has been assigned to a university for solution development.`, priority: 'high' },
    in_progress: { title: 'Work in Progress', message: `A university team is actively working on your challenge "${challenge.title}".`, priority: 'normal' },
    testing: { title: 'Solution Being Tested', message: `A solution for your challenge "${challenge.title}" is currently being tested and validated.`, priority: 'normal' },
    resolved: { title: '🎉 Challenge Resolved!', message: `Your challenge "${challenge.title}" has been successfully resolved. Please provide your feedback!`, priority: 'high' }
  };

  const msg = statusMessages[newStatus];
  if (msg && challenge.submittedBy) {
    await createNotification({
      recipient: challenge.submittedBy,
      sender: actor?._id,
      type: `challenge_${newStatus}`,
      title: msg.title,
      message: msg.message,
      data: { challengeId: challenge._id, challengeRefId: challenge.challengeId },
      priority: msg.priority
    });
  }
};

/**
 * Notify university rep when a challenge is assigned
 */
const notifyUniversityAssignment = async (challenge, universityRepId, actor) => {
  if (!universityRepId) return;
  await createNotification({
    recipient: universityRepId,
    sender: actor?._id,
    type: 'challenge_assigned',
    title: 'New Challenge Assigned to Your University',
    message: `Challenge "${challenge.title}" (${challenge.challengeId}) has been assigned to your university for review and solution development.`,
    data: { challengeId: challenge._id, challengeRefId: challenge.challengeId, url: `/dashboard/university.html#challenge-${challenge._id}` },
    priority: 'high'
  });
};

/**
 * Log activity
 */
const logActivity = async ({ actor, action, target, description, metadata, severity = 'info', req = null }) => {
  try {
    await ActivityLog.create({
      actor: actor?._id,
      actorName: actor?.name,
      actorRole: actor?.role,
      action,
      target,
      description,
      metadata,
      severity,
      ipAddress: req?.ip,
      userAgent: req?.get('user-agent')
    });
  } catch (error) {
    console.error('Failed to log activity:', error.message);
  }
};

module.exports = { createNotification, notifyChallenge, notifyStatusChange, notifyUniversityAssignment, logActivity };
