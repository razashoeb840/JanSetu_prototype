const mongoose = require('mongoose');

const industryPartnerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Organization name is required'],
    trim: true,
    unique: true
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
  contact: {
    email: String,
    phone: String,
    website: String
  },
  // Collaboration capabilities
  capabilities: {
    canMentor: { type: Boolean, default: false },
    canFund: { type: Boolean, default: false },
    canCoDevelop: { type: Boolean, default: false },
    canPilot: { type: Boolean, default: false },
    canProvideInfrastructure: { type: Boolean, default: false }
  },
  fundingCapacity: {
    type: String,
    enum: ['under_5L', '5L_to_25L', '25L_to_1Cr', 'above_1Cr', 'na'],
    default: 'na'
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

module.exports = mongoose.model('IndustryPartner', industryPartnerSchema);
