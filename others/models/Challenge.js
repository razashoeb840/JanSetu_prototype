const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const challengeSchema = new mongoose.Schema({
  challengeId: {
    type: String,
    unique: true,
    default: () => 'JH-' + new Date().getFullYear() + '-' + Math.floor(100000 + Math.random() * 900000)
  },
  title: {
    type: String,
    required: [true, 'Challenge title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    minlength: [5, 'Description must be at least 5 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  aiSuggestedCategory: String,
  aiConfidenceScore: { type: Number, min: 0, max: 1 },
  tags: [String],
  priority: {
    type: String,
    enum: ['low', 'medium', 'normal', 'high', 'urgent', 'NORMAL', 'HIGH', 'URGENT', 'Low', 'Medium', 'Normal', 'High', 'Urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: [
      'draft', 'submitted', 'under_review', 'validated', 'assigned', 'in_progress', 'testing', 'resolved', 'rejected', 'closed',
      'Open', 'Assigned', 'In Progress', 'Deployed', 'Rejected'
    ],
    default: 'submitted'
  },
  // Submitter
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  submitterContact: {
    name: String,
    email: String,
    phone: String
  },
  // Location
  location: {
    type: mongoose.Schema.Types.Mixed,
    default: () => ({
      address: '',
      village: '',
      panchayat: '',
      block: '',
      district: 'Ranchi',
      state: 'Jharkhand',
      pincode: '',
      coordinates: { lat: null, lng: null }
    })
  },

  // Media
  filePath: { type: String, default: null },
  coverImage: { type: String, default: null },
  image: { type: String, default: null },
  videoUrl: { type: String, default: null },
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    url: String,
    filePath: { type: String, default: null },
    uploadedAt: { type: Date, default: Date.now }
  }],
  // Assignment variables (empty by default until assigned by Admin)
  universityAssigned: {
    type: String,
    default: null,
    trim: true,
    index: true
  },
  industryAssigned: {
    type: String,
    default: null,
    trim: true,
    index: true
  },
  assignedUniversityUid: {
    type: String,
    default: null,
    trim: true,
    index: true
  },
  assignedIndustry: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'IndustryPartner',
    default: null
  },
  assignedIndustryIid: {
    type: String,
    default: null,
    trim: true,
    index: true
  },
  assignedUniversity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'University',
    default: null
  },
  assignedAt: Date,
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Industry collaboration
  industryCollaborators: [{
    partner: { type: mongoose.Schema.Types.ObjectId, ref: 'IndustryPartner' },
    role: { type: String, enum: ['mentor', 'funder', 'co_developer', 'pilot_partner'] },
    joinedAt: { type: Date, default: Date.now }
  }],
  // Team
  projectTeam: {
    faculty: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  // Milestones
  milestones: [{
    title: String,
    description: String,
    deadline: Date,
    completedAt: Date,
    status: { type: String, enum: ['pending', 'in_progress', 'completed', 'delayed'], default: 'pending' }
  }],
  // Solution
  solutionProposal: {
    title: String,
    description: String,
    approach: String,
    expectedOutcome: String,
    timeline: String,
    budget: Number,
    submittedAt: Date,
    approvedAt: Date,
    status: { type: String, enum: ['not_submitted', 'submitted', 'approved', 'revision_needed'], default: 'not_submitted' }
  },
  // Feedback
  feedback: {
    rating: { type: Number, min: 1, max: 5 },
    review: String,
    submittedAt: Date,
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  // Audit trail
  statusHistory: [{
    status: String,
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now },
    note: String
  }],
  // Validation
  validationNotes: String,
  rejectionReason: String,
  // Deadline
  deadline: Date,
  resolvedAt: Date,
  // Impact metrics
    // Before / After Evidence & Resolution Proof
  resolutionProof: {
    beforeImage: { type: String, default: null },
    beforeFilePath: { type: String, default: null },
    afterImage: { type: String, default: null },
    afterFilePath: { type: String, default: null },
    summary: { type: String, default: null },
    citizenVerified: { type: Boolean, default: false },
    citizenFeedback: { type: String, default: null },
    verifiedAt: { type: Date, default: null },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  },
  // Need More Info Interactive Workflow
  needMoreInfo: {
    isActive: { type: Boolean, default: false },
    query: { type: String, default: null },
    requestedAt: { type: Date, default: null },
    responses: [{
      notes: String,
      mediaUrls: [String],
      landmark: String,
      voiceTranscript: String,
      submittedAt: { type: Date, default: Date.now }
    }]
  },
  impactMetrics: {
    beneficiaries: Number,
    patentsGenerated: Number,
    startupsCreated: Number,
    implementationStatus: String
  },
  // Support & Praise social system
  supports: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  supportCount: { type: Number, default: 0 },
  praisedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  praiseCount: { type: Number, default: 0 },
  displayNamePublicly: { type: Boolean, default: true },
  commentCount: { type: Number, default: 0 },
  bookmarkedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  // Tripartite Problem Chat Messages (Citizen, University Taskforce, Admin)
  chatMessages: [{
    sender: { type: String, required: true },
    senderRole: { type: String, default: 'Citizen' },
    senderAvatar: String,
    senderType: { type: String, enum: ['citizen', 'university', 'admin'], default: 'citizen' },
    department: String,
    text: { type: String, required: true },
    time: String,
    timestamp: { type: Date, default: Date.now },
    readByCitizen: { type: Boolean, default: false },
    readByUniversity: { type: Boolean, default: false },
    readByAdmin: { type: Boolean, default: false }
  }],
  // Co-reporting & Voice AI Metadata
  reportedBy: [{
    citizenId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    citizenName: String,
    reportedAt: { type: Date, default: Date.now },
    viaVoiceAgent: { type: Boolean, default: true }
  }],
  duplicateCount: { type: Number, default: 0 },
  submittedViaVoice: { type: Boolean, default: false },
  twinnedChallenges: [{
    challengeId: String,
    similarityScore: Number,
    linkedAt: { type: Date, default: Date.now }
  }],
  // University academic & collaboration fields
  academicBrief: {
    projectType: { type: String, default: 'Capstone Project' },
    discipline: { type: String, default: 'Computer Science' },
    duration: { type: String, default: '6-8 Months' },
    semesterFit: { type: String, default: 'Semester 7-8' }
  },
  twinnedWith: [{
    university: String,
    region: String,
    status: { type: String, default: 'In Progress' },
    matchedAt: { type: Date, default: Date.now },
    challenge: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge' }
  }],
  impact: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
  forkable: {
    university: String,
    similarity: Number,
    status: String,
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    sourceProjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' }
  },
  isBattleTestedSource: { type: Boolean, default: false },
  interested: { type: Number, default: 0 },
  bookmarked: { type: Boolean, default: false },
  collaborationReady: { type: Boolean, default: false },
  daysUnassigned: { type: Number, default: 0 },
  authority: { type: String, default: '' },
  department: { type: String, default: '' },
  officialSlipId: { type: String, default: '' },
  groundPainPoints: [String],
  citizenNotes: String,
  audioUrl: { type: String, default: '' },
  evidenceMedia: [{
    mediaType: { type: String, default: 'image' },
    url: String,
    filePath: { type: String, default: null },
    title: String,
    size: String,
    timestamp: String
  }],
  // Meta
  viewCount: { type: Number, default: 0 },
  isPublic: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false }
}, {
  collection: 'problems',
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Text search & query indexes
challengeSchema.index({ title: 'text', description: 'text', tags: 'text' });
challengeSchema.index({ category: 1, status: 1 });
challengeSchema.index({ createdAt: -1 });
challengeSchema.index({ 'location.district': 1 });
challengeSchema.index({ 'location.coordinates.lat': 1, 'location.coordinates.lng': 1 });
challengeSchema.index({ submittedBy: 1 });
challengeSchema.index({ assignedUniversity: 1 });
challengeSchema.index({ 'twinnedWith.university': 1 });

// Virtual: days since submission
challengeSchema.virtual('daysSinceSubmission').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual: is overdue
challengeSchema.virtual('isOverdue').get(function() {
  if (!this.deadline) return false;
  return Date.now() > this.deadline && this.status !== 'resolved' && this.status !== 'closed';
});

module.exports = mongoose.models.Challenge || mongoose.model('Challenge', challengeSchema);

