const User = require('../models/User');
const Challenge = require('../models/Challenge');
const University = require('../models/University');
const IndustryPartner = require('../models/IndustryPartner');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const { logActivity } = require('../services/notificationService');

// @desc    Get all users (with pagination/filter)
// @route   GET /api/admin/users
// @access  Admin
exports.getUsers = async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 20, isActive } = req.query;
    const query = {};
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];

    const [users, total] = await Promise.all([
      User.find(query)
        .populate('universityId', 'name shortName')
        .populate('industryPartnerId', 'name type')
        .sort('-createdAt')
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit))
        .select('-password'),
      User.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: users,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user (activate/deactivate/change role)
// @route   PUT /api/admin/users/:id
// @access  Admin
exports.updateUser = async (req, res, next) => {
  try {
    const { isActive, role, isVerified } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ success: false, message: 'Cannot modify admin users' });

    const updateData = {};
    if (isActive !== undefined) updateData.isActive = isActive;
    if (role) updateData.role = role;
    if (isVerified !== undefined) updateData.isVerified = isVerified;

    const updated = await User.findByIdAndUpdate(req.params.id, updateData, { new: true }).select('-password');

    await logActivity({
      actor: req.user,
      action: 'user_updated',
      target: { type: 'User', id: user._id, name: user.name },
      description: `Admin updated user: ${user.name} - ${JSON.stringify(updateData)}`
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Admin
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ success: false, message: 'Cannot delete admin users' });

    await user.deleteOne();
    await logActivity({
      actor: req.user,
      action: 'user_deactivated',
      target: { type: 'User', id: user._id, name: user.name },
      description: `Admin deleted user: ${user.name}`
    });

    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get comprehensive admin analytics
// @route   GET /api/admin/analytics
// @access  Admin
exports.getAdminAnalytics = async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalChallenges,
      totalUniversities,
      totalIndustryPartners,
      pendingChallenges,
      activeChallenges,
      resolvedChallenges,
      thisMonthChallenges,
      byStatus,
      byCategory,
      byDistrict,
      monthlyTrend
    ] = await Promise.all([
      User.countDocuments(),
      Challenge.countDocuments(),
      University.countDocuments(),
      IndustryPartner.countDocuments(),
      Challenge.countDocuments({ status: { $in: ['submitted', 'under_review'] } }),
      Challenge.countDocuments({ status: { $in: ['validated', 'assigned', 'in_progress', 'testing'] } }),
      Challenge.countDocuments({ status: 'resolved' }),
      Challenge.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Challenge.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Challenge.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Challenge.aggregate([{ $group: { _id: '$location.district', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }]),
      Challenge.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 }, resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ])
    ]);

    // Average resolution days calculation
    const resolvedData = await Challenge.find({ status: 'resolved', resolvedAt: { $exists: true } }).select('createdAt resolvedAt');
    let avgResolutionDays = 0;
    if (resolvedData.length > 0) {
      const totalDays = resolvedData.reduce((sum, c) => sum + (c.resolvedAt - c.createdAt) / (1000 * 60 * 60 * 24), 0);
      avgResolutionDays = Math.round(totalDays / resolvedData.length);
    }

    const resolutionRate = totalChallenges > 0 ? Math.round((resolvedChallenges / totalChallenges) * 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        totalChallenges,
        pendingChallenges,
        activeChallenges,
        resolvedChallenges,
        thisMonth: thisMonthChallenges,
        totalUsers,
        activeUniversities: totalUniversities,
        industryPartners: totalIndustryPartners,
        avgResolutionDays: avgResolutionDays || 14,
        resolutionRate,
        monthlyTrend,
        byStatus,
        byCategory,
        byDistrict,
        overview: {
          totalUsers,
          totalChallenges,
          totalUniversities,
          totalIndustryPartners,
          pendingChallenges,
          resolvedChallenges,
          resolutionRate
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get system statistics
// @route   GET /api/admin/stats
// @access  Admin
exports.getSystemStats = async (req, res, next) => {
  return exports.getAdminAnalytics(req, res, next);
};


// @desc    Get/Manage universities
// @route   GET /api/admin/universities
// @access  Admin
exports.getUniversities = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = {};
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { 'location.city': { $regex: search, $options: 'i' } }];

    const [universities, total] = await Promise.all([
      University.find(query).sort('-stats.performanceScore').skip((parseInt(page) - 1) * parseInt(limit)).limit(parseInt(limit)),
      University.countDocuments(query)
    ]);

    res.status(200).json({ success: true, data: universities, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) {
    next(error);
  }
};

// @desc    Create university
// @route   POST /api/admin/universities
// @access  Admin
exports.createUniversity = async (req, res, next) => {
  try {
    const university = await University.create(req.body);
    await logActivity({ actor: req.user, action: 'university_created', target: { type: 'University', id: university._id, name: university.name }, description: `University created: ${university.name}` });
    res.status(201).json({ success: true, data: university });
  } catch (error) {
    next(error);
  }
};

// @desc    Update university
// @route   PUT /api/admin/universities/:id
// @access  Admin
exports.updateUniversity = async (req, res, next) => {
  try {
    const university = await University.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!university) return res.status(404).json({ success: false, message: 'University not found' });
    res.status(200).json({ success: true, data: university });
  } catch (error) {
    next(error);
  }
};

// @desc    Get/Manage industry partners
// @route   GET /api/admin/industry
// @access  Admin
exports.getIndustryPartners = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const [partners, total] = await Promise.all([
      IndustryPartner.find().sort('-createdAt').skip((parseInt(page) - 1) * parseInt(limit)).limit(parseInt(limit)),
      IndustryPartner.countDocuments()
    ]);
    res.status(200).json({ success: true, data: partners, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) {
    next(error);
  }
};

// @desc    Get activity logs
// @route   GET /api/admin/activity-logs
// @access  Admin
exports.getActivityLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, action, severity } = req.query;
    const query = {};
    if (action) query.action = action;
    if (severity) query.severity = severity;

    const [logs, total] = await Promise.all([
      ActivityLog.find(query)
        .populate('actor', 'name avatar role')
        .sort('-createdAt')
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit)),
      ActivityLog.countDocuments(query)
    ]);

    res.status(200).json({ success: true, data: logs, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) {
    next(error);
  }
};

// @desc    Broadcast notification to all users
// @route   POST /api/admin/broadcast
// @access  Admin
exports.broadcastNotification = async (req, res, next) => {
  try {
    const { title, message, role } = req.body;
    const query = {};
    if (role) query.role = role;

    const users = await User.find(query).select('_id');
    const notifications = users.map(u => ({
      recipient: u._id,
      sender: req.user.id,
      type: 'system_alert',
      title,
      message,
      priority: 'high'
    }));

    await Notification.insertMany(notifications);

    res.status(200).json({ success: true, message: `Notification sent to ${users.length} users` });
  } catch (error) {
    next(error);
  }
};
