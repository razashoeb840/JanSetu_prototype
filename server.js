require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const os = require('os');

const connectDB = require('./others/config/database');
const errorHandler = require('./others/middleware/errorHandler');

// Connect Database
connectDB();

const app = express();
app.set('trust proxy', true);

const cacheService = require('./others/services/cacheService');

// Ensure upload directory exists
const uploadDir = process.env.UPLOAD_PATH || './others/public/uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Helper to check if IP is local/private network
const isLanIp = (req) => {
  const ip = req.ip || req.connection?.remoteAddress || '';
  return /^(::ffff:)?(127\.|192\.168\.|10\.|172\.(1[6-9]|2\d|3[0-1])\.|::1)/.test(ip);
};

// Rate limiting (with local LAN whitelist)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000, // Generous limit for real-time dev/demo polling
  skip: isLanIp,
  message: { success: false, message: 'Too many requests, please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000, // Generous limit for dev, evaluation & demo login
  skip: isLanIp,
  message: { success: false, message: 'Too many auth attempts.' }
});

// Body parsers
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Compression
app.use(compression());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limit auth routes
app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);

// Static files caching options (Media/fonts cached for LAN speed; scripts/html revalidated instantly)
const staticOptions = {
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    if (/\.(jpg|jpeg|png|gif|webp|svg|ico|woff2?|ttf|eot)$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=86400');
    } else {
      res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    }
  }
};

// Static files - Modular and Public directories
app.use('/citizen', express.static(path.join(__dirname, 'citizen/dist'), staticOptions));
app.use('/university', express.static(path.join(__dirname, 'university/dist'), staticOptions));
app.use('/admin', express.static(path.join(__dirname, 'admin/dist'), staticOptions));
app.use('/industries', express.static(path.join(__dirname, 'industries/dist'), staticOptions));
app.use('/industry', express.static(path.join(__dirname, 'industries/dist'), staticOptions));
app.use('/others', express.static(path.join(__dirname, 'others/public'), staticOptions));
app.use(express.static(path.join(__dirname, 'others/public'), staticOptions));

// No-cache helper for dashboard views to prevent back-button history leaks
const sendDashboard = (filePath) => (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.sendFile(path.join(__dirname, filePath));
};

// Clean Modular Routes & Navigation
app.get('/citizen', sendDashboard('citizen/dist/index.html'));
app.get('/citizen/*', sendDashboard('citizen/dist/index.html'));
app.get('/university', sendDashboard('university/dist/index.html'));
app.get('/university/*', sendDashboard('university/dist/index.html'));
app.get('/admin', sendDashboard('admin/dist/index.html'));
app.get('/admin/*', sendDashboard('admin/dist/index.html'));
app.get('/industries', sendDashboard('industries/dist/index.html'));
app.get('/industries/*', sendDashboard('industries/dist/index.html'));
app.get('/industry', sendDashboard('industries/dist/index.html'));

// Backward-compatible dashboard paths
app.get('/dashboard/citizen.html', (req, res) => res.redirect('/citizen'));
app.get('/dashboard/university.html', (req, res) => res.redirect('/university'));
app.get('/dashboard/admin.html', (req, res) => res.redirect('/admin'));
app.get('/dashboard/industry.html', (req, res) => res.redirect('/industries'));

// Mount API Routes
const { setupVoiceAgentRoutes, setupVoiceAgentWebSocket } = require('./citizen/ai/voiceRelayNode.cjs');
setupVoiceAgentRoutes(app);

app.use('/api/auth', require('./others/routes/auth'));
app.use('/api/challenges', require('./others/routes/challenges'));
app.use('/api/notifications', require('./others/routes/notifications'));
app.use('/api/admin', require('./others/routes/admin'));
app.use('/api', require('./university/api'));

// Comments standalone route (for delete, like, flag)
const { deleteComment, toggleCommentLike, flagComment } = require('./others/controllers/commentController');
const { protect: commentProtect, optionalAuth: commentOptionalAuth } = require('./others/middleware/auth');
app.delete('/api/comments/:id', commentProtect, deleteComment);
app.post('/api/comments/:id/like', commentProtect, toggleCommentLike);
app.post('/api/comments/:id/flag', commentOptionalAuth, flagComment);

// Public map-data shortcut
app.get('/api/map-data', (req, res, next) => { req.url = '/challenges/map-data'; require('./others/routes/challenges')(req, res, next); });

// Reverse Geocode endpoint for accurate GPS auto-detection
app.get('/api/location/reverse-geocode', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ success: false, message: 'Valid lat and lng query params required' });
    }

    const jharkhandDistricts = [
      'Ranchi', 'Dhanbad', 'Bokaro', 'East Singhbhum', 'West Singhbhum',
      'Hazaribagh', 'Deoghar', 'Giridih', 'Ramgarh', 'Palamu',
      'Garhwa', 'Chatra', 'Koderma', 'Jamtara', 'Godda',
      'Sahibganj', 'Pakur', 'Khunti', 'Gumla', 'Simdega',
      'Lohardaga', 'Seraikela Kharsawan', 'Latehar', 'Dumka'
    ];

    const districtCenters = {
      'Ranchi': { lat: 23.3441, lng: 85.3096 },
      'Dhanbad': { lat: 23.7957, lng: 86.4304 },
      'Bokaro': { lat: 23.6693, lng: 86.1511 },
      'East Singhbhum': { lat: 22.8046, lng: 86.2029 },
      'West Singhbhum': { lat: 22.5668, lng: 85.8080 },
      'Hazaribagh': { lat: 23.9925, lng: 85.3637 },
      'Deoghar': { lat: 24.4826, lng: 86.7000 },
      'Giridih': { lat: 24.1852, lng: 86.3079 },
      'Ramgarh': { lat: 23.6300, lng: 85.5100 },
      'Palamu': { lat: 24.0300, lng: 84.0700 },
      'Garhwa': { lat: 24.1800, lng: 83.8100 },
      'Chatra': { lat: 24.2100, lng: 84.8700 },
      'Koderma': { lat: 24.4700, lng: 85.5900 },
      'Jamtara': { lat: 23.9600, lng: 86.8000 },
      'Godda': { lat: 24.8300, lng: 87.2100 },
      'Sahibganj': { lat: 25.2500, lng: 87.6500 },
      'Pakur': { lat: 24.6300, lng: 87.8500 },
      'Khunti': { lat: 23.0700, lng: 85.2800 },
      'Gumla': { lat: 23.0400, lng: 84.5400 },
      'Simdega': { lat: 22.6200, lng: 84.5000 },
      'Lohardaga': { lat: 23.4400, lng: 84.6800 },
      'Seraikela Kharsawan': { lat: 22.7000, lng: 85.9800 },
      'Latehar': { lat: 23.7400, lng: 84.5000 },
      'Dumka': { lat: 24.2700, lng: 87.2500 }
    };

    // Check if coordinates are inside Jharkhand
    const JHARKHAND_BOUNDS = { minLat: 21.9, maxLat: 25.4, minLng: 83.3, maxLng: 87.9 };
    const isInsideJharkhand = (lat >= JHARKHAND_BOUNDS.minLat && lat <= JHARKHAND_BOUNDS.maxLat &&
                               lng >= JHARKHAND_BOUNDS.minLng && lng <= JHARKHAND_BOUNDS.maxLng);

    let nominatimData = null;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);
      const osmUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&countrycodes=in`;
      const resp = await fetch(osmUrl, {
        headers: { 'User-Agent': 'JanSetuCivicApp/2.0 (jansetu.jharkhand.gov)' },
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (resp.ok) {
        nominatimData = await resp.json();
      }
    } catch (e) {
      // Graceful timeout or offline fallback
    }

    let state = isInsideJharkhand ? 'Jharkhand' : 'India';
    let rawDistrict = '';
    let block = '';
    let panchayat = '';
    let village = '';
    let landmark = '';
    let formattedAddress = '';

    if (nominatimData && nominatimData.address) {
      const a = nominatimData.address;
      formattedAddress = nominatimData.display_name || '';
      state = a.state || (isInsideJharkhand ? 'Jharkhand' : 'India');
      rawDistrict = (a.state_district || a.district || a.county || a.city || a.town || '').replace(/\s+District$/i, '').trim();
      block = a.county || a.subdistrict || a.tehsil || a.taluk || a.municipality || a.city_district || '';
      panchayat = a.suburb || a.neighbourhood || a.quarter || a.hamlet || village || '';
      village = a.village || a.town || a.suburb || a.residential || '';
      landmark = a.amenity || a.building || a.road || '';
    }

    let matchedDistrict = '';
    if (isInsideJharkhand) {
      // Match district against valid 24 Jharkhand districts
      matchedDistrict = jharkhandDistricts.find(d => 
        rawDistrict && (rawDistrict.toLowerCase() === d.toLowerCase() || rawDistrict.toLowerCase().includes(d.toLowerCase()) || d.toLowerCase().includes(rawDistrict.toLowerCase()))
      );

      if (!matchedDistrict) {
        let minDistance = Infinity;
        matchedDistrict = 'Ranchi';
        for (const [name, coords] of Object.entries(districtCenters)) {
          const d = Math.hypot(coords.lat - lat, coords.lng - lng);
          if (d < minDistance) {
            minDistance = d;
            matchedDistrict = name;
          }
        }
      }
    } else {
      // Outside Jharkhand — use real district/city name
      matchedDistrict = rawDistrict || (nominatimData && nominatimData.address ? (nominatimData.address.city || nominatimData.address.town || nominatimData.address.state) : 'District');
    }

    if (!block) block = `${matchedDistrict} Sadar`;
    if (!panchayat) panchayat = village || `${matchedDistrict} Area`;
    if (!village) village = landmark || 'Ward 1';
    if (!landmark && formattedAddress) {
      landmark = formattedAddress.split(',')[0] || '';
    }

    res.json({
      success: true,
      isOutsideJharkhand: !isInsideJharkhand,
      data: {
        state,
        district: matchedDistrict,
        block,
        panchayat,
        village,
        landmark,
        formattedAddress,
        coordinates: { lat, lng }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Universities public route
const University = require('./others/models/University');
const IndustryPartner = require('./others/models/IndustryPartner');

app.get('/api/universities', cacheService.middleware('universities', 30), async (req, res) => {
  try {
    // Automatically ensure active university profiles exist in background without blocking response
    setImmediate(async () => {
      try {
        const { UniversityProfile } = require('./university/database');
        const profiles = await UniversityProfile.find().lean();
        for (const profile of profiles) {
          if (profile && profile.institution) {
            const instName = profile.institution.trim();
            const escaped = instName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const existing = await University.findOne({
              $or: [
                { name: { $regex: new RegExp('^' + escaped + '$', 'i') } },
                { shortName: { $regex: new RegExp('^' + escaped + '$', 'i') } }
              ]
            });
            if (!existing) {
              await University.create({
                name: instName,
                shortName: instName.length > 20 ? (instName.match(/\b([A-Z])/g)?.join('') || instName) : instName,
                type: instName.toLowerCase().includes('iit') ? 'iit' : instName.toLowerCase().includes('nit') ? 'nit' : 'central',
                location: {
                  city: profile.location?.split(',')[0]?.trim() || 'New Delhi',
                  district: 'University Campus',
                  state: profile.location?.split(',')[1]?.trim() || 'Delhi',
                  pincode: '110016'
                },
                contact: {
                  email: profile.email || 'faculty@university.ac.in',
                  phone: profile.phone || '+91 11 2659 1000'
                },
                departments: [profile.department || 'Department of Engineering and Technology'],
                expertiseDomains: [
                  'Energy & Technology',
                  'Healthcare',
                  'Water Management',
                  'Urban Infrastructure',
                  'Sanitation & Environment',
                  'Public Administration'
                ],
                facilities: { hasIncubationCenter: true, hasResearchLab: true, hasInnovationHub: true, hasTBICenter: true },
                naacGrade: 'A++',
                stats: { totalAssigned: 18, totalResolved: 14, performanceScore: 98 },
                isActive: true,
                isVerified: true
              });
            }
          }
        }
      } catch (e) {
        // silent background sync catch
      }
    });

    const { search, domain } = req.query;
    const query = { isActive: true };
    if (search) query.name = { $regex: search, $options: 'i' };
    if (domain) query.expertiseDomains = domain;
    const universities = await University.find(query)
      .select('name shortName type location contact logo expertiseDomains departments facilities stats naacGrade')
      .sort('-stats.performanceScore');
    res.json({ success: true, data: universities });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.get('/api/universities/:id', async (req, res) => {
  try {
    const u = await University.findById(req.params.id).populate('representatives', 'name email avatar designation');
    if (!u) return res.status(404).json({ success: false, message: 'University not found' });
    res.json({ success: true, data: u });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/industry', cacheService.middleware('industry', 30), async (req, res) => {
  try {
    const partners = await IndustryPartner.find({ isActive: true })
      .select('name type sector description logo location contact capabilities stats');
    res.json({ success: true, data: partners });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// SPA fallback - serve index.html for non-API routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'others/public', 'index.html'));
});

// Dashboard routes
app.get('/dashboard/citizen', sendDashboard('citizen/dist/index.html'));
app.get('/dashboard/university', sendDashboard('university/dist/index.html'));
app.get('/dashboard/industry', sendDashboard('industries/dist/index.html'));
app.get('/dashboard/admin', sendDashboard('admin/dist/index.html'));

// Auth pages
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'others/public', 'login.html')));
app.get(['/register', '/register.html'], (req, res) => {
  const query = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
  const separator = query ? (query.includes('mode=') ? '' : '&mode=register') : '?mode=register';
  res.redirect(`/login${query}${separator}`);
});
app.get('/forgot-password', (req, res) => res.sendFile(path.join(__dirname, 'others/public', 'forgot-password.html')));

// Pages
app.get('/feed', (req, res) => res.redirect('/dashboard/citizen'));
app.get('/map', (req, res) => res.sendFile(path.join(__dirname, 'others/public', 'map.html')));
app.get('/intro', (req, res) => res.sendFile(path.join(__dirname, 'others/public', 'intro.html')));


// API 404
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: `API route ${req.originalUrl} not found` });
});

// Page 404
app.use((req, res) => {
  const p404 = path.join(__dirname, 'others/public', '404.html');
  if (fs.existsSync(p404)) {
    return res.status(404).sendFile(p404);
  }
  res.status(404).json({ success: false, message: 'Resource not found' });
});

// Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

function getNetworkIp() {
  try {
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        if ((net.family === 'IPv4' || net.family === 4) && !net.internal) {
          return net.address;
        }
      }
    }
  } catch (e) {}
  return 'localhost';
}

const server = app.listen(PORT, HOST, () => {
  const localIp = getNetworkIp();
  console.log(`\n🚀 InnovateSphere Server running on all network interfaces (${HOST}:${PORT})`);
  console.log(`🌐 Local:   http://localhost:${PORT}`);
  console.log(`📡 Network: http://${localIp}:${PORT}`);
  console.log(`📊 Admin Dashboard: http://${localIp}:${PORT}/dashboard/admin`);
  console.log(`👤 Citizen Dashboard: http://${localIp}:${PORT}/dashboard/citizen`);
  console.log(`\n📌 Demo Credentials:`);
  console.log(`   Admin:      admin@innovatesphere.in / admin123`);
  console.log(`   Citizen:    rajesh@gmail.com / citizen123`);
  console.log(`   University: rajesh@iitjharkhand.ac.in / univ123`);
  console.log(`   Industry:   tata@steel.com / industry123\n`);
});

// Voice Agent WebSocket Upgrade Handler
const voiceWss = setupVoiceAgentWebSocket(server);
server.on('upgrade', (request, socket, head) => {
  try {
    const host = request.headers.host || 'localhost';
    const { pathname } = new URL(request.url, `http://${host}`);
    if (pathname === '/ws/voice-agent') {
      voiceWss.handleUpgrade(request, socket, head, (ws) => {
        voiceWss.emit('connection', ws, request);
      });
    }
  } catch (e) {
    socket.destroy();
  }
});

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err?.message || err);
});

module.exports = app;
