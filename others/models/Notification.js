const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: [
      'challenge_submitted',
      'challenge_validated',
      'challenge_rejected',
      'challenge_assigned',
      'challenge_in_progress',
      'challenge_testing',
      'challenge_resolved',
      'challenge_closed',
      'new_collaboration',
      'proposal_submitted',
      'proposal_approved',
      'milestone_completed',
      'milestone_delayed',
      'message',
      'system_alert',
      'welcome',
      'feedback_requested'
    ],
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 150
  },
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  data: {
    challengeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge' },
    challengeRefId: String,
    universityId: { type: mongoose.Schema.Types.ObjectId, ref: 'University' },
    industryId: { type: mongoose.Schema.Types.ObjectId, ref: 'IndustryPartner' },
    url: String
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: Date,
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  }
}, {
  timestamps: true
});

// Auto-set readAt when marked as read
notificationSchema.pre('save', function(next) {
  if (this.isModified('isRead') && this.isRead && !this.readAt) {
    this.readAt = new Date();
  }
  next();
});

module.exports = mongoose.model('Notification', notificationSchema);
