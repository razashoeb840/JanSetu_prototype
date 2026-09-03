const express = require('express');
const router = express.Router();
const {
  getUsers, updateUser, deleteUser, getSystemStats, getAdminAnalytics,
  getUniversities, createUniversity, updateUniversity,
  getIndustryPartners, getActivityLogs, broadcastNotification
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleCheck');
const University = require('../models/University');
const IndustryPartner = require('../models/IndustryPartner');

router.use(protect, isAdmin);

// Analytics & Stats
router.get('/analytics', getAdminAnalytics);
router.get('/stats', getSystemStats);

// Users
router.get('/users', getUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Activity Logs
router.get('/activity', getActivityLogs);
router.get('/activity-logs', getActivityLogs);



// Universities
router.get('/universities', getUniversities);
router.post('/universities', createUniversity);
router.put('/universities/:id', updateUniversity);
router.delete('/universities/:id', async (req, res, next) => {
  try {
    await University.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'University deleted' });
  } catch (e) { next(e); }
});

// Industry partners
router.get('/industry', getIndustryPartners);
router.post('/industry', async (req, res, next) => {
  try {
    const partner = await IndustryPartner.create(req.body);
    res.status(201).json({ success: true, data: partner });
  } catch (e) { next(e); }
});
router.put('/industry/:id', async (req, res, next) => {
  try {
    const partner = await IndustryPartner.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, data: partner });
  } catch (e) { next(e); }
});

// Logs
router.get('/activity-logs', getActivityLogs);

// Broadcast
router.post('/broadcast', broadcastNotification);

module.exports = router;
