const mongoose = require('mongoose');

async function seedUniversities() {
  await mongoose.connect('mongodb+srv://ankitkumar202800_db_user:Ankit2006_atlas@cluster0.xct3hpo.mongodb.net/Jansetu?retryWrites=true&w=majority');
  const University = require('../models/University');

  const universitiesData = [
    {
      name: 'Indian Institute of Technology (ISM) Dhanbad',
      shortName: 'IIT (ISM) Dhanbad',
      type: 'iit',
      location: { city: 'Dhanbad', district: 'Dhanbad', state: 'Jharkhand', address: 'Sardar Patel Nagar, Dhanbad, Jharkhand 826004' },
      departments: ['Civil Engineering', 'Urban Infrastructure', 'Healthcare Systems', 'Environmental Engineering', 'Mechanical Engineering'],
      expertiseDomains: ['Urban Infrastructure', 'Healthcare', 'Water Management', 'Energy & Technology', 'Sanitation & Environment'],
      stats: { totalAssigned: 18, totalResolved: 16, totalInProgress: 2, averageResolutionDays: 42, performanceScore: 94 },
      naacGrade: 'A++',
      facultyCount: 380,
      studentCount: 8200,
      establishedYear: 1926,
      isActive: true,
      isVerified: true
    },
    {
      name: 'Birla Institute of Technology, Mesra',
      shortName: 'BIT Mesra',
      type: 'deemed',
      location: { city: 'Ranchi', district: 'Ranchi', state: 'Jharkhand', address: 'Mesra, Ranchi, Jharkhand 835215' },
      departments: ['Civil Engineering', 'Infrastructure Design', 'Project Management', 'Computer Science', 'Architecture'],
      expertiseDomains: ['Urban Infrastructure', 'Education', 'Energy & Technology', 'Public Administration'],
      stats: { totalAssigned: 17, totalResolved: 14, totalInProgress: 3, averageResolutionDays: 46, performanceScore: 91 },
      naacGrade: 'A',
      facultyCount: 310,
      studentCount: 7500,
      establishedYear: 1955,
      isActive: true,
      isVerified: true
    },
    {
      name: 'National Institute of Technology Jamshedpur',
      shortName: 'NIT Jamshedpur',
      type: 'nit',
      location: { city: 'Jamshedpur', district: 'East Singhbhum', state: 'Jharkhand', address: 'Adityapur, Jamshedpur, Jharkhand 831014' },
      departments: ['Civil Engineering', 'Structural Design', 'Material Research', 'Metallurgical Engineering'],
      expertiseDomains: ['Urban Infrastructure', 'Energy & Technology', 'Water Management', 'Accessibility'],
      stats: { totalAssigned: 15, totalResolved: 12, totalInProgress: 3, averageResolutionDays: 48, performanceScore: 87 },
      naacGrade: 'A',
      facultyCount: 240,
      studentCount: 5400,
      establishedYear: 1960,
      isActive: true,
      isVerified: true
    },
    {
      name: 'Ranchi University',
      shortName: 'Ranchi University',
      type: 'state',
      location: { city: 'Ranchi', district: 'Ranchi', state: 'Jharkhand', address: 'Shaheed Chowk, Ranchi, Jharkhand 834001' },
      departments: ['Civil Engineering', 'Community Development', 'Infrastructure Planning', 'Social Sciences'],
      expertiseDomains: ['Urban Infrastructure', 'Education', 'Public Administration', 'Rural Livelihoods'],
      stats: { totalAssigned: 14, totalResolved: 10, totalInProgress: 4, averageResolutionDays: 55, performanceScore: 82 },
      naacGrade: 'B+',
      facultyCount: 420,
      studentCount: 18000,
      establishedYear: 1960,
      isActive: true,
      isVerified: true
    },
    {
      name: 'National Institute of Technology Patna',
      shortName: 'NIT Patna',
      type: 'nit',
      location: { city: 'Patna', district: 'Patna', state: 'Bihar', address: 'Ashok Rajpath, Patna, Bihar 800005' },
      departments: ['Infrastructure Design', 'Sustainable Solutions', 'Urban Planning', 'Architecture'],
      expertiseDomains: ['Urban Infrastructure', 'Energy & Technology', 'Water Management'],
      stats: { totalAssigned: 13, totalResolved: 9, totalInProgress: 4, averageResolutionDays: 60, performanceScore: 78 },
      naacGrade: 'A',
      facultyCount: 220,
      studentCount: 4800,
      establishedYear: 1886,
      isActive: true,
      isVerified: true
    }
  ];

  for (const u of universitiesData) {
    const existing = await University.findOne({
      $or: [{ name: u.name }, { shortName: u.shortName }]
    });
    if (existing) {
      Object.assign(existing, u);
      await existing.save();
      console.log('Updated university:', u.shortName);
    } else {
      await University.create(u);
      console.log('Created university:', u.shortName);
    }
  }

  console.log('All universities seeded/updated successfully.');
  process.exit(0);
}

seedUniversities().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
