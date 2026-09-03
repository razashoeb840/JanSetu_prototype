const express = require('express');
const router = express.Router();
const { getDashboardAnalytics, getUserAnalytics, getUniversityAnalytics, getLeaderboard, getRecentActivity } = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

router.get('/dashboard', protect, getDashboardAnalytics);
router.get('/user', protect, authorize('citizen'), getUserAnalytics);
router.get('/university', protect, authorize('university_rep', 'admin'), getUniversityAnalytics);
router.get('/leaderboard', getLeaderboard);
router.get('/activity', protect, authorize('admin'), getRecentActivity);

module.exports = router;
