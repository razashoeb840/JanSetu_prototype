const express = require('express');
const router = express.Router();
const {
  getChallenges, getChallenge, createChallenge, updateChallenge,
  updateStatus, assignChallenge, submitFeedback, deleteChallenge,
  getMyChallenges, getChallengeStats, classifyChallengeText,
  toggleSupport, getPublicFeed, getMapData
} = require('../controllers/challengeController');
const { protect, optionalAuth } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');
const upload = require('../middleware/upload');

// Public feed & map
router.get('/feed', optionalAuth, getPublicFeed);
router.get('/map-data', getMapData);
router.get('/stats', getChallengeStats);
router.post('/classify', classifyChallengeText);
router.get('/my', protect, getMyChallenges);
router.get('/', optionalAuth, getChallenges);
router.post('/', protect, authorize('citizen', 'admin'), (req, res, next) => { req.uploadSubDir = 'challenges'; next(); }, upload.array('attachments', 10), createChallenge);
router.get('/:id', optionalAuth, getChallenge);
router.put('/:id', protect, updateChallenge);
router.delete('/:id', protect, deleteChallenge);
router.put('/:id/status', protect, authorize('admin', 'university_rep'), updateStatus);
router.post('/:id/assign', protect, authorize('admin'), assignChallenge);
router.put('/:id/assign', protect, authorize('admin'), assignChallenge);
router.post('/:id/support', protect, toggleSupport);
router.post('/:id/feedback', protect, authorize('citizen'), submitFeedback);

// Comments — nested router
router.use('/:id/comments', require('./comments'));

module.exports = router;

