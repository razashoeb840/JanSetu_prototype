const University = require('../models/University');
const Challenge = require('../models/Challenge');
const IndustryPartner = require('../models/IndustryPartner');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

// @desc    Get overall analytics for dashboards
// @route   GET /api/analytics/dashboard
// @access  Private
exports.getDashboardAnalytics = async (req, res, next) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const sixMonthsAgo = new Date(now - 180 * 24 * 60 * 60 * 1000);

    const [
      totalChallenges, resolvedChallenges, pendingChallenges,
      totalUsers, totalUniversities, totalIndustryPartners,
      categoryStats, monthlyTrend, districtStats,
      urgentCount, inProgressCount, assignedCount
    ] = await Promise.all([
      Challenge.countDocuments(),
      Challenge.countDocuments({ status: 'resolved' }),
      Challenge.countDocuments({ status: { $in: ['submitted', 'under_review'] } }),
      User.countDocuments({ role: 'citizen' }),
      University.countDocuments({ isActive: true }),
      IndustryPartner.countDocuments({ isActive: true }),
      Challenge.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 }, resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } } } },
        { $sort: { count: -1 } }
      ]),
      Challenge.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 }, resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]),
      Challenge.aggregate([
        { $group: { _id: '$location.district', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      Challenge.countDocuments({ priority: 'urgent' }),
      Challenge.countDocuments({ status: 'in_progress' }),
      Challenge.countDocuments({ status: 'assigned' })
    ]);

    // Average resolution time
    const resolvedChallengesData = await Challenge.find({
      status: 'resolved', resolvedAt: { $exists: true }
    }).select('createdAt resolvedAt');

    let avgResolutionDays = 0;
    if (resolvedChallengesData.length > 0) {
      const totalDays = resolvedChallengesData.reduce((sum, c) => {
        return sum + (c.resolvedAt - c.createdAt) / (1000 * 60 * 60 * 24);
      }, 0);
      avgResolutionDays = Math.round(totalDays / resolvedChallengesData.length);
    }

    // New challenges in last 30 days
    const recentChallenges = await Challenge.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
    const recentUsers = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo }, role: 'citizen' });

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalChallenges,
          resolvedChallenges,
          pendingChallenges,
          inProgressCount,
          assignedCount,
          urgentCount,
          totalUsers,
          totalUniversities,
          totalIndustryPartners,
          resolutionRate: totalChallenges > 0 ? Math.round((resolvedChallenges / totalChallenges) * 100) : 0,
          avgResolutionDays,
          recentChallenges,
          recentUsers
        },
        charts: {
          categoryStats,
          monthlyTrend,
          districtStats
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user-specific analytics
// @route   GET /api/analytics/user
// @access  Private (Citizen)
exports.getUserAnalytics = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);

    const [statusStats, categoryStats, monthlyTrend] = await Promise.all([
      Challenge.aggregate([
        { $match: { submittedBy: require('mongoose').Types.ObjectId(userId) } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Challenge.aggregate([
        { $match: { submittedBy: require('mongoose').Types.ObjectId(userId) } },
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]),
      Challenge.aggregate([
        { $match: { submittedBy: require('mongoose').Types.ObjectId(userId), createdAt: { $gte: sixMonthsAgo } } },
        { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ])
    ]);

    res.status(200).json({ success: true, data: { statusStats, categoryStats, monthlyTrend } });
  } catch (error) {
    next(error);
  }
};

// @desc    Get university analytics
// @route   GET /api/analytics/university
// @access  Private (UniversityRep, Admin)
exports.getUniversityAnalytics = async (req, res, next) => {
  try {
    const universityId = req.user.role === 'admin' ? req.query.universityId : req.user.universityId;
    if (!universityId) return res.status(400).json({ success: false, message: 'University ID required' });

    const mongoose = require('mongoose');
    const uid = mongoose.Types.ObjectId(universityId);

    const [statusStats, categoryStats, monthlyTrend, weeklyTrend] = await Promise.all([
      Challenge.aggregate([
        { $match: { assignedUniversity: uid } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Challenge.aggregate([
        { $match: { assignedUniversity: uid } },
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]),
      Challenge.aggregate([
        { $match: { assignedUniversity: uid, createdAt: { $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) } } },
        { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 }, resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]),
      Challenge.aggregate([
        { $match: { assignedUniversity: uid, createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
        { $group: { _id: { $dayOfWeek: '$createdAt' }, count: { $sum: 1 } } }
      ])
    ]);

    res.status(200).json({ success: true, data: { statusStats, categoryStats, monthlyTrend, weeklyTrend } });
  } catch (error) {
    next(error);
  }
};

// @desc    University performance leaderboard
// @route   GET /api/analytics/leaderboard
// @access  Public
exports.getLeaderboard = async (req, res, next) => {
  try {
    const universities = await University.find({ isActive: true })
      .select('name shortName logo stats location')
      .sort('-stats.performanceScore')
      .limit(10);

    res.status(200).json({ success: true, data: universities });
  } catch (error) {
    next(error);
  }
};

// @desc    Recent activity for admin
// @route   GET /api/analytics/activity
// @access  Private (Admin)
exports.getRecentActivity = async (req, res, next) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const [logs, total] = await Promise.all([
      ActivityLog.find()
        .populate('actor', 'name avatar role')
        .sort('-createdAt')
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit)),
      ActivityLog.countDocuments()
    ]);

    res.status(200).json({
      success: true,
      data: logs,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    next(error);
  }
};
