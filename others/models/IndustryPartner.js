const mongoose = require('mongoose');

const industryPartnerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Organization name is required'],
    trim: true,
    unique: true
  },
  iid: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    uppercase: true,
    index: true
  },
  industryId: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['industry', 'startup', 'msme', 'csr', 'research_lab', 'innovation_hub', 'ngo', 'government_agency'],
    required: true
  },
  sector: {
    type: String,
    enum: [
      'Education',
      'Healthcare',
      'Agriculture',
      'Water Management',
      'Sanitation & Environment',
      'Rural Livelihoods',
      'Accessibility',
      'Urban Infrastructure',
      'Public Administration',
      'Energy & Technology',
      'Multiple'
    ]
  },
  description: String,
  logo: String,
  location: {
    city: String,
    state: String,
    country: { type: String, default: 'India' }
  },
  companyName: {
    type: String,
    trim: true
  },
  contact: {
    email: String,
    phone: String,
    website: String
  },
  // Collaboration capabilities (supports array of capability strings and legacy capability flags)
  capabilities: {
    type: mongoose.Schema.Types.Mixed,
    default: () => ['Funding', 'Mentorship']
  },
  fundingCapacity: {
    type: mongoose.Schema.Types.Mixed,
    default: 1000000
  },
  pastCollaborations: {
    type: Number,
    default: 5
  },
  // Representatives
  representatives: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Stats
  stats: {
    totalCollaborations: { type: Number, default: 0 },
    activeCollaborations: { type: Number, default: 0 },
    completedProjects: { type: Number, default: 0 },
    totalFunding: { type: Number, default: 0 },
    studentsImpacted: { type: Number, default: 0 }
  },
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  csrBudget: Number,
  establishedYear: Number,
  employeeCount: String
}, {
  timestamps: true
});

industryPartnerSchema.pre('validate', function(next) {
  if (!this.iid) {
    this.iid = 'I' + Math.floor(1000 + Math.random() * 9000);
  } else {
    this.iid = String(this.iid).trim().toUpperCase();
    if (!this.iid.startsWith('I')) {
      this.iid = 'I' + this.iid.replace(/^[^0-9]+/, '');
    }
  }
  this.industryId = this.iid;
  next();
});

industryPartnerSchema.pre('save', function(next) {
  if (!this.companyName && this.name) {
    this.companyName = this.name;
  } else if (!this.name && this.companyName) {
    this.name = this.companyName;
  }
  next();
});

module.exports = mongoose.model('IndustryPartner', industryPartnerSchema);

