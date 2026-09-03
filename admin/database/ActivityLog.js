const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  actorName: String,
  actorRole: String,
  action: {
    type: String,
    required: true,
    enum: [
      'user_registered', 'user_login', 'user_logout', 'user_updated', 'user_deactivated',
      'challenge_created', 'challenge_updated', 'challenge_validated', 'challenge_rejected',
      'challenge_assigned', 'challenge_status_changed', 'challenge_resolved', 'challenge_deleted',
      'university_created', 'university_updated', 'university_accepted_challenge',
      'industry_joined', 'collaboration_started',
      'proposal_submitted', 'proposal_approved',
      'milestone_updated', 'feedback_submitted',
      'notification_sent', 'system_event'
    ]
  },
  target: {
    type: { type: String, enum: ['Challenge', 'User', 'University', 'IndustryPartner', 'System'] },
    id: mongoose.Schema.Types.ObjectId,
    name: String
  },
  description: {
    type: String,
    required: true
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  ipAddress: String,
  userAgent: String,
  severity: {
    type: String,
    enum: ['info', 'warning', 'error', 'critical'],
    default: 'info'
  }
}, {
  timestamps: true
});

activityLogSchema.index({ actor: 1, createdAt: -1 });
activityLogSchema.index({ action: 1 });
activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ 'target.type': 1, 'target.id': 1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
