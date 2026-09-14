const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const { logActivity } = require('../services/notificationService');
const { sendRealOtp, verifyRealOtp } = require('../public/otpService');

const DEMO_PRESETS = {
  'admin@jansetu.in': {
    _id: '67cb56000000000000000001',
    name: 'JanSetu Admin',
    email: 'admin@jansetu.in',
    role: 'admin',
    uniqueId: 'ADM-001',
    passwords: ['admin123'],
    department: 'Municipal Administration'
  },
  'admin@innovatesphere.in': {
    _id: '67cb56000000000000000001',
    name: 'JanSetu Admin',
    email: 'admin@innovatesphere.in',
    role: 'admin',
    uniqueId: 'ADM-001',
    passwords: ['admin123'],
    department: 'Municipal Administration'
  },
  'rajesh@gmail.com': {
    _id: '67cb56000000000000000002',
    name: 'Rajesh Mahto',
    email: 'rajesh@gmail.com',
    role: 'citizen',
    uniqueId: 'C4819',
    citizenId: 'C4819',
    passwords: ['citizen123'],
    phone: '9431100003',
    aadhaar: '8492-3840-4819'
  },
  'kavya@gmail.com': {
    _id: '67cb56000000000000000003',
    name: 'Kavya Sharma',
    email: 'kavya@gmail.com',
    role: 'citizen',
    uniqueId: 'C1002',
    citizenId: 'C1002',
    passwords: ['citizen123'],
    phone: '9431100002'
  },
  'rajesh@iitjharkhand.ac.in': {
    _id: '67cb56000000000000000004',
    name: 'Dr. Rajesh Sharma',
    email: 'rajesh@iitjharkhand.ac.in',
    role: 'university_rep',
    uniqueId: 'U4819',
    universityIdString: 'U4819',
    passwords: ['univ123'],
    institution: 'IIT Delhi',
    department: 'Department of Computer Science & Engineering'
  },
  'tata@steel.com': {
    _id: '67cb56000000000000000005',
    name: 'Tata Steel CSR',
    email: 'tata@steel.com',
    role: 'industry_rep',
    uniqueId: 'I1001',
    industryIdString: 'I1001',
    passwords: ['industry123'],
    organization: 'Tata Steel'
  }
};

const sendTokenResponse = (user, statusCode, res) => {
  const token = typeof user.getSignedJwtToken === 'function'
    ? user.getSignedJwtToken()
    : jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET || 'your_strong_jwt_secret_key_here',
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
      );
  let uniqueId = user.uniqueId;
  if (!uniqueId) {
    if (user.role === 'citizen') uniqueId = user.citizenId || ('C' + (user._id ? user._id.toString().slice(-4) : '4819'));
    else if (user.role === 'university_rep') uniqueId = user.universityIdString || ('U' + (user._id ? user._id.toString().slice(-4) : '1001'));
    else if (user.role === 'industry_rep') uniqueId = user.industryIdString || ('I' + (user._id ? user._id.toString().slice(-4) : '1001'));
    else if (user.role === 'admin') uniqueId = 'ADM-001';
  }
  uniqueId = String(uniqueId || '').toUpperCase().trim();

  // Role routing based on ID first letter (C -> citizen, U -> university, I -> industry, ADM -> admin)
  let redirectUrl = '/citizen';
  if (user.role === 'admin' || uniqueId.startsWith('ADM') || user.email === 'admin@innovatesphere.in' || user.email === 'admin@jansetu.in') {
    redirectUrl = '/admin';
  } else if (uniqueId.startsWith('C')) {
    redirectUrl = '/citizen';
  } else if (uniqueId.startsWith('U')) {
    redirectUrl = '/university';
  } else if (uniqueId.startsWith('I')) {
    redirectUrl = '/industries';
  } else if (user.role === 'university_rep' || user.role === 'university') {
    redirectUrl = '/university';
  } else if (user.role === 'industry_rep' || user.role === 'industry') {
    redirectUrl = '/industries';
  }

  const citizenId = uniqueId.startsWith('C') ? uniqueId : (user.citizenId || null);
  const universityIdString = uniqueId.startsWith('U') ? uniqueId : (user.universityIdString || null);
  const industryIdString = uniqueId.startsWith('I') ? uniqueId : (user.industryIdString || null);

  res.status(statusCode).json({
    success: true,
    token,
    redirectUrl,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      uniqueId: uniqueId,
      citizenId: citizenId,
      universityIdString: universityIdString,
      industryIdString: industryIdString,
      facultyId: universityIdString,
      phone: user.phone || '9431100003',
      aadhaar: user.aadhaar || '8492-3840-4819',
      aadhaarVerified: user.aadhaarVerified !== false,
      phoneVerified: user.phoneVerified !== false,
      emailVerified: user.emailVerified !== false,
      address: user.address,
      avatar: user.avatar,
      isVerified: user.isVerified !== false,
      designation: user.designation,
      department: user.department,
      institution: user.institution,
      organization: user.organization,
      universityId: user.universityId,
      industryPartnerId: user.industryPartnerId
    }
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, aadhaar, address, universityId, industryPartnerId, designation, department } = req.body;

    // Validate role
    const allowedRoles = ['citizen', 'university_rep', 'industry_rep'];
    if (role && !allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role specified' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Generate single unified uniqueId:
    // C... for citizen, U... for university, I... for industry
    let citizenId = req.body.citizenId;
    let universityIdString = req.body.universityIdString;
    let industryIdString = req.body.industryIdString;
    let uniqueId = req.body.uniqueId;

    if (!uniqueId) {
      if (!role || role === 'citizen') {
        uniqueId = citizenId || ('C' + Math.floor(1000 + Math.random() * 9000));
        citizenId = uniqueId;
      } else if (role === 'university_rep') {
        uniqueId = universityIdString || ('U' + Math.floor(1000 + Math.random() * 9000));
        universityIdString = uniqueId;
      } else if (role === 'industry_rep') {
        uniqueId = industryIdString || ('I' + Math.floor(1000 + Math.random() * 9000));
        industryIdString = uniqueId;
      }
    }

    let orgName = req.body.organization || req.body.institution || '';
    let targetUnivId = req.body.universityId;
    let customCity = req.body.city || '';

    // Handle "+ Add University" with name & city
    if (role === 'university_rep' && (req.body.isNewUniversity || req.body.institution === '__ADD_NEW__' || req.body.customUniversityName)) {
      const customName = (req.body.customUniversityName || req.body.institution || '').replace(/^__ADD_NEW__$/, '').trim();
      if (customName) {
        orgName = customName;
        try {
          const University = require('../models/University');
          let uDoc = await University.findOne({ name: new RegExp('^' + customName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') });
          if (!uDoc) {
            const newUid = 'U' + Math.floor(1000 + Math.random() * 9000);
            uDoc = await University.create({
              name: customName,
              shortName: customName.split(' ').map(w => w[0]).join('').slice(0, 6).toUpperCase(),
              uid: newUid,
              type: 'other',
              location: { city: customCity || 'Ranchi', district: customCity || 'Ranchi', state: 'Jharkhand' }
            });
            uniqueId = newUid;
            universityIdString = newUid;
          }
          targetUnivId = uDoc._id;
          if (uDoc.uid) {
            uniqueId = uDoc.uid;
            universityIdString = uDoc.uid;
          }
        } catch(uErr) {
          console.error('Error creating custom university:', uErr.message);
        }
      }
    }

    const userData = {
      name,
      email,
      password,
      role: role || 'citizen',
      uniqueId: String(uniqueId).toUpperCase().trim(),
      citizenId,
      universityIdString,
      industryIdString,
      phone: phone || '9431100003',
      aadhaar: aadhaar || '8492-3840-4819',
      aadhaarVerified: true,
      phoneVerified: true,
      emailVerified: true,
      address,
      designation,
      department,
      organization: orgName,
      institution: orgName
    };
    if (role === 'university_rep' && targetUnivId) userData.universityId = targetUnivId;
    if (role === 'industry_rep' && industryPartnerId) userData.industryPartnerId = industryPartnerId;

    const user = await User.create(userData);

    // If university_rep, create or link UniversityProfile for this specific user
    if (role === 'university_rep') {
      try {
        const { UniversityProfile } = require('../../university/database');
        const University = require('../models/University');
        let institutionName = orgName || 'Birla Institute of Technology (BIT) Mesra, Ranchi';
        let univLocation = customCity ? `${customCity}, Jharkhand` : 'Jharkhand';

        if (universityId) {
          const uDoc = await University.findById(universityId);
          if (uDoc) {
            institutionName = uDoc.name;
            univLocation = uDoc.location?.city ? `${uDoc.location.city}, ${uDoc.location.state || 'India'}` : 'India';
            if (!uDoc.representatives.includes(user._id)) {
              uDoc.representatives.push(user._id);
              await uDoc.save();
            }
          }
        }

        const initials = (name || '').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'UN';

        let uProfile = await UniversityProfile.findOne({ email: user.email.toLowerCase() });
        if (!uProfile) {
          uProfile = new UniversityProfile({
            userId: user._id,
            name: user.name,
            initials,
            email: user.email.toLowerCase(),
            role: designation || 'Faculty Member & Project Guide',
            department: department || 'Department of Computer Science & Engineering',
            institution: institutionName,
            location: univLocation,
            bio: `Faculty member at ${institutionName}. Contributing to university civic technology innovations.`,
            phone: phone || '+91 98765 43210',
            uniqueId: universityIdString,
            facultyId: universityIdString,
            avatarUrl: user.avatar || '',
            stats: {
              totalProblems: 0,
              studentTeams: 0,
              projectsInProgress: 0,
              projectsDeployed: 0,
              needAttention: 0,
              projectsGuided: 0,
              activeMentorships: 0,
              teamsSupported: 0,
              impactScore: 100
            },
            preferences: {
              projectUpdates: true,
              mentorshipMessages: true,
              platformAnnouncements: true,
              weeklyDigest: true
            },
            skills: ['Research & Development', 'Civic Engineering', 'Project Mentorship', 'Student Guidance']
          });
          await uProfile.save();
        }
      } catch (profileErr) {
        console.error('Error creating UniversityProfile on register:', profileErr.message);
      }
    }

    await logActivity({
      actor: user,
      action: 'user_registered',
      target: { type: 'User', id: user._id, name: user.name },
      description: `New user registered: ${user.name} (${user.role}) - ID: ${user.universityIdString || citizenId || user._id}`
    });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Login user (supports Email, Phone, Citizen ID e.g. C9604, University ID e.g. U1024, or Aadhaar)
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const identifier = req.body.email || req.body.identifier || req.body.citizenId || req.body.universityIdString;
    const { password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email/mobile/citizen ID/university ID and password' });
    }

    const cleanId = identifier.trim();
    const cleanLower = cleanId.toLowerCase();

    // Check demo presets for instant 1-click demo login
    const demoPreset = DEMO_PRESETS[cleanLower]
      || (cleanId === '9431100003' ? DEMO_PRESETS['rajesh@gmail.com'] : null)
      || (cleanId.toUpperCase() === 'C4819' ? DEMO_PRESETS['rajesh@gmail.com'] : null)
      || (cleanId.toUpperCase() === 'U4819' ? DEMO_PRESETS['rajesh@iitjharkhand.ac.in'] : null);

    if (demoPreset && demoPreset.passwords.includes(password.trim())) {
      if (mongoose.connection.readyState === 1) {
        try {
          const dbUser = await User.findOne({ email: demoPreset.email }).select('+password');
          if (dbUser) {
            dbUser.lastLogin = new Date();
            await dbUser.save({ validateBeforeSave: false }).catch(() => {});
            return sendTokenResponse(dbUser, 200, res);
          }
        } catch (dbErr) {
          console.warn('DB search failed for demo user, using demo preset:', dbErr.message);
        }
      }
      return sendTokenResponse(demoPreset, 200, res);
    }

    const queryConditions = [
      { email: cleanLower },
      { phone: cleanId },
      { uniqueId: cleanId.toUpperCase() },
      { citizenId: cleanId.toUpperCase() },
      { universityIdString: cleanId.toUpperCase() },
      { industryIdString: cleanId.toUpperCase() },
      { aadhaar: cleanId },
      { aadhaar: cleanId.replace(/[^0-9]/g, '') }
    ];
    if (cleanLower === 'admin@jansetu.in') {
      queryConditions.push({ email: 'admin@innovatesphere.in' });
    }
    if (cleanLower === 'admin@innovatesphere.in') {
      queryConditions.push({ email: 'admin@jansetu.in' });
    }
    const user = await User.findOne({
      $or: queryConditions
    }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Your account has been deactivated. Contact support.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Ensure universityIdString exists if university_rep
    if (user.role === 'university_rep' && !user.universityIdString) {
      user.universityIdString = 'U' + Math.floor(1000 + Math.random() * 9000);
      try {
        const { UniversityProfile } = require('../../university/database');
        let uProfile = await UniversityProfile.findOne({ email: user.email.toLowerCase() });
        if (uProfile && !uProfile.uniqueId) {
          uProfile.uniqueId = user.universityIdString;
          uProfile.facultyId = user.universityIdString;
          await uProfile.save();
        }
      } catch(e) {}
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    await logActivity({
      actor: user,
      action: 'user_login',
      target: { type: 'User', id: user._id, name: user.name },
      description: `User logged in: ${user.name}`
    });

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    let user = null;
    if (mongoose.connection.readyState === 1 && req.user?.id) {
      try {
        user = await User.findById(req.user.id)
          .populate('universityId', 'name shortName logo')
          .populate('industryPartnerId', 'name type logo');
      } catch (e) {}
    }
    if (!user) {
      user = req.user;
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update profile
// @route   PUT /api/auth/update-profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const allowedFields = ['name', 'email', 'phone', 'aadhaar', 'bio', 'designation', 'department', 'address', 'notificationPreferences'];
    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    });

    if (req.file) {
      updateData.avatar = '/uploads/avatars/' + req.file.filename;
    }

    const user = await User.findByIdAndUpdate(req.user.id, updateData, {
      new: true, runValidators: true
    });

    if (user && !user.citizenId && user.role === 'citizen') {
      user.citizenId = 'C' + (user.aadhaar ? user.aadhaar.replace(/[^0-9]/g, '').slice(-4) : user._id.toString().slice(-4));
      await user.save({ validateBeforeSave: false });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Send Real Random OTP (Nodemailer Email / Phone Support)
// @route   POST /api/auth/send-otp
// @access  Public
exports.sendOtp = async (req, res, next) => {
  try {
    const { target, email, mobile, name } = req.body;
    const recipient = (target || email || mobile || '').trim();

    if (!recipient) {
      return res.status(400).json({ success: false, message: 'Please provide email or mobile number.' });
    }

    try {
      delete require.cache[require.resolve('../public/otpService')];
    } catch (_) {}
    const freshOtpService = require('../public/otpService');

    const result = await freshOtpService.sendRealOtp(recipient, name || 'Citizen', req.body.purpose || 'create_account');
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOtp = async (req, res, next) => {
  try {
    const { target, email, mobile, otp } = req.body;
    const recipient = (target || email || mobile || '').trim();

    if (!otp) {
      return res.status(400).json({ success: false, message: 'Please enter the 6-digit OTP.' });
    }

    const freshOtpService = require('../public/otpService');
    const verification = freshOtpService.verifyRealOtp(recipient, otp);
    if (!verification.success) {
      return res.status(400).json(verification);
    }

    res.status(200).json(verification);
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password via verified OTP
// @route   POST /api/auth/reset-password-otp
// @access  Public
exports.resetPasswordOtp = async (req, res, next) => {
  try {
    const { target, otp, newPassword } = req.body;
    const recipient = (target || '').trim();

    if (!recipient || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Missing target, OTP or new password.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const verification = verifyRealOtp(recipient, otp);
    if (!verification.success) {
      return res.status(400).json(verification);
    }

    // Try finding and updating user in database
    const user = await User.findOne({
      $or: [
        { email: recipient.toLowerCase() },
        { phone: recipient },
        { citizenId: recipient.toUpperCase() }
      ]
    }).select('+password');

    if (user) {
      user.password = newPassword;
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: 'Password updated successfully! You can now log in with your new password.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password (requires current password and new password)
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!currentPassword) {
      return res.status(400).json({ success: false, message: 'कृपया वर्तमान पासवर्ड दर्ज करें (Please enter current password).' });
    }

    if (!(await user.matchPassword(currentPassword))) {
      return res.status(400).json({ success: false, message: 'मूल/वर्तमान पासवर्ड गलत है (Incorrect current password)' });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'नया पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'पासवर्ड सफलतापूर्वक बदल दिया गया (Password changed successfully)!' });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password (generates reset token - simplified for demo)
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with that email' });
    }

    // In production, send reset email; for demo, return token
    const resetToken = require('crypto').randomBytes(32).toString('hex');
    user.resetPasswordToken = require('crypto').createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Password reset link sent to your email (Demo: token returned)',
      resetToken // Remove in production
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    const resetPasswordToken = require('crypto').createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};
