const mongoose = require('mongoose');

const universitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'University name is required'],
    trim: true,
    unique: true
  },
  shortName: String,
  type: {
    type: String,
    enum: ['central', 'state', 'deemed', 'private', 'iit', 'nit', 'iiit', 'other'],
    required: true
  },
  location: {
    city: String,
    district: String,
    state: { type: String, default: 'Jharkhand' },
    address: String,
    pincode: String
  },
  contact: {
    email: String,
    phone: String,
    website: String
  },
  logo: String,
  description: String,
  // Academic capabilities
  departments: [String],
  expertiseDomains: [{
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
      'Energy & Technology'
    ]
  }],
  // Facilities
  facilities: {
    hasIncubationCenter: { type: Boolean, default: false },
    hasResearchLab: { type: Boolean, default: false },
    hasInnovationHub: { type: Boolean, default: false },
    hasTBICenter: { type: Boolean, default: false }
  },
  facultyCount: { type: Number, default: 0 },
  studentCount: { type: Number, default: 0 },
  naacGrade: String,
  // Stats
  stats: {
    totalAssigned: { type: Number, default: 0 },
    totalResolved: { type: Number, default: 0 },
    totalInProgress: { type: Number, default: 0 },
    averageResolutionDays: { type: Number, default: 0 },
    totalPatents: { type: Number, default: 0 },
    totalStartups: { type: Number, default: 0 },
    performanceScore: { type: Number, default: 0, min: 0, max: 100 }
  },
  // Representatives
  representatives: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  primaryContact: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  accreditation: String,
  establishedYear: Number
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

universitySchema.virtual('resolutionRate').get(function() {
  if (this.stats.totalAssigned === 0) return 0;
  return Math.round((this.stats.totalResolved / this.stats.totalAssigned) * 100);
});

module.exports = mongoose.model('University', universitySchema);
