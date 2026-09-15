const mongoose = require('mongoose');

const proposalSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  university: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'University'
  },
  universityName: {
    type: String,
    default: 'IIT Ranchi'
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  submitterName: {
    type: String,
    default: 'Dr. Rohan Mehta'
  },
  submitterEmail: {
    type: String,
    default: 'rohan.mehta@iitranchi.ac.in'
  },
  problemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Challenge'
  },
  problemTitle: {
    type: String,
    default: 'Damaged Main Road with Potholes'
  },
  problemCategory: {
    type: String,
    default: 'Infrastructure'
  },
  fundingRequested: {
    type: Number,
    required: [true, 'Funding requested is required'],
    min: [1, 'Funding requested must be a positive number']
  },
  industrySupportRequired: [{
    type: String,
    enum: [
      'Funding',
      'Mentorship',
      'Equipment',
      'Raw Materials',
      'Testing Facility',
      'Infrastructure',
      'Domain Expertise',
      'Software/Cloud Credits',
      'Software / Cloud Credits',
      'Other'
    ]
  }],
  requirementsDocument: {
    url: {
      type: String,
      required: true
    },
    filename: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      default: 0
    },
    mimetype: {
      type: String,
      default: 'application/pdf'
    },
    storageType: {
      type: String,
      default: 'supabase'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'under_review', 'approved', 'changes_requested', 'rejected'],
    default: 'submitted',
    index: true
  },
  assignedIndustry: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'IndustryPartner',
    default: null
  },
  invitedIndustries: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'IndustryPartner'
  }],
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  reviewComment: {
    type: String,
    maxlength: 500
  },
  acceptanceStatus: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
    index: true
  },
  acceptedAt: {
    type: Date
  },
  acceptedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  acceptedIndustryName: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.Proposal || mongoose.model('Proposal', proposalSchema);
