const mongoose = require('mongoose');

const problemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  category: String,
  location: String,
  impact: { type: String, default: 'Medium' },
  status: { type: String, enum: ['Open', 'Assigned', 'In Progress', 'Deployed', 'Rejected'], default: 'Open' },
  universityAssigned: { type: String, default: null, trim: true },
  industryAssigned: { type: String, default: null, trim: true },
  assignedUniversityUid: { type: String, default: null, trim: true },
  assignedIndustryIid: { type: String, default: null, trim: true },
  assignedUniversity: { type: mongoose.Schema.Types.ObjectId, ref: 'University', default: null },
  assignedIndustry: { type: mongoose.Schema.Types.ObjectId, ref: 'IndustryPartner', default: null },
  sourceCitizenProblemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge' },
  submitterContact: {
    name: String,
    email: String,
    phone: String
  },
  filePath: { type: String, default: null },
  attachments: [{
    filename: String,
    originalName: String,
    url: String,
    filePath: { type: String, default: null },
    mimetype: String
  }],
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
    matchedAt: { type: Date, default: Date.now }
  }],
  interested: { type: Number, default: 0 },
  bookmarked: { type: Boolean, default: false },
  collaborationReady: { type: Boolean, default: false },
  daysUnassigned: { type: Number, default: 0 },
  challengeId: { type: String, default: '' },
  reportId: { type: String, default: '' },
  reportedAgo: { type: String, default: 'Reported 1 days ago' },
  adminVerified: { type: Boolean, default: true },
  submitterRole: { type: String, default: 'Primary Citizen Submitter' },
  supportCount: { type: Number, default: 24 },
  beforeImage: { type: String, default: '' },
  afterImage: { type: String, default: '' },
  videoUrl: { type: String, default: '' },
  audioUrl: { type: String, default: '' },
  evidenceMedia: [{
    mediaType: { type: String, default: 'image' },
    url: String,
    filePath: { type: String, default: null },
    title: String,
    size: String,
    timestamp: String
  }],
  fullLocation: {
    village: String,
    block: String,
    district: String,
    state: String,
    pincode: String,
    address: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  authority: { type: String, default: '' },
  department: { type: String, default: '' },
  officialSlipId: { type: String, default: '' },
  groundPainPoints: [String],
  citizenNotes: String,
  forkable: {
    university: String,
    similarity: Number,
    status: String,
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' }
  },
  chatMessages: [{
    sender: { type: String, default: 'University Guide' },
    senderRole: { type: String, default: 'University Faculty' },
    senderAvatar: String,
    senderType: { type: String, enum: ['citizen', 'university', 'admin'], default: 'university' },
    department: String,
    text: { type: String, required: true },
    time: String,
    timestamp: { type: Date, default: Date.now },
    isUniversity: { type: Boolean, default: true },
    readByCitizen: { type: Boolean, default: false },
    readByUniversity: { type: Boolean, default: false },
    readByAdmin: { type: Boolean, default: false }
  }]
}, { timestamps: true });

module.exports = mongoose.models.Problem || mongoose.model('Problem', problemSchema);
