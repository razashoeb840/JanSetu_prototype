const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem' },
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  status: { type: String, default: 'Assigned' }, // Matches stage for backwards compatibility
  stage: { 
    type: String, 
    enum: ['Assigned', 'In Progress', 'Prototype', 'Submitted', 'Deployed'], 
    default: 'Assigned' 
  },
  progress: { type: Number, default: 0 }, // 0: Assigned, 1: In Progress, 2: Prototype, 3: Submitted, 4: Deployed
  type: { type: String, default: 'General' },
  loc: String,
  selected: { type: Boolean, default: false },
  team: [String],
  teamSize: { type: Number, default: 4 },
  mentor: {
    name: { type: String, default: 'Dr. Rohan Mehta' },
    org: { type: String, default: 'IIT Delhi' },
    initials: { type: String, default: 'RM' }
  },
  proposalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Proposal' },
  proposalStatus: { 
    type: String, 
    enum: ['not_submitted', 'submitted', 'under_review', 'approved', 'changes_requested', 'rejected'], 
    default: 'not_submitted' 
  },
  assignedIndustry: { type: mongoose.Schema.Types.ObjectId, ref: 'IndustryPartner' },
  assignedIndustryDetails: {
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'IndustryPartner' },
    name: String,
    companyName: String,
    sector: String,
    logo: String,
    location: String,
    contactEmail: String,
    contactPhone: String,
    website: String,
    fundingCommitted: { type: Number, default: 0 },
    fundingStatus: { type: String, default: 'Committed' },
    capabilitiesProvided: [String],
    assignedAt: Date
  },
  industryMentor: {
    name: String,
    org: String,
    initials: String,
    status: { type: String, enum: ['None', 'Requested', 'Accepted', 'Declined'], default: 'None' },
    requestedAt: Date
  },
  fundingSummary: {
    committed: { type: Number, default: 0 },
    goal: { type: Number, default: 100000 },
    sponsor: String,
    status: { type: String, default: 'Pending' }
  },
  milestones: [{
    name: { type: String, required: true },
    title: String,
    fileUrl: String,
    uploadedAt: Date,
    status: { 
      type: String, 
      enum: ['pending', 'pending_review', 'approved', 'needs_revision'], 
      default: 'pending' 
    },
    feedback: String,
    approvedAt: Date,
    approvedBy: String
  }],
  citizenFeedback: [{
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    submittedAt: { type: Date, default: Date.now }
  }],
  description: { type: String, default: 'Engineering innovation developed by student researchers addressing verified civic challenges.' },
  deadlines: [{
    title: String,
    date: String,
    tag: String,
    isLight: Boolean
  }],
  discussion: [{
    sender: String,
    role: String,
    text: String,
    time: String,
    isMentor: Boolean
  }],
  certificatesIssued: { type: Boolean, default: false },
  isBattleTested: { type: Boolean, default: false },
  deployedAt: { type: String },
  requirementsDocName: { type: String, default: 'Solution_Requirements_Specification.pdf' },
  battleTestedResourceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource' },
  forkableFrom: {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    university: String
  },
  imgBg: { type: String, default: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' }
}, { timestamps: true });

module.exports = mongoose.models.Project || mongoose.model('Project', projectSchema);
