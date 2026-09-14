const express = require('express');
const router = express.Router();
const {
  getChallenges, getChallenge, getChallengeUpdates, createChallenge, updateChallenge,
  updateStatus, assignChallenge, submitFeedback, deleteChallenge,
  deleteChallengeFiles,
  getChallengeChat, postChallengeChatMessage, markChallengeChatRead,
  getMyChallenges, getChallengeStats, classifyChallengeText,
  toggleSupport, getPublicFeed, getMapData,
  checkDuplicates, parseVoice, validateResolution, provideAdditionalInfo,
  assignIndustryPartner, togglePraise, meTooChallenge
} = require('../controllers/challengeController');
const { protect, optionalAuth } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');
const upload = require('../middleware/upload');
const cacheService = require('../services/cacheService');

// Auto-invalidate challenges and dependent caches on any mutation
router.use((req, res, next) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    cacheService.del('challenges');
    cacheService.del('problems');
    cacheService.del('analytics');
  }
  next();
});

// Public feed & map
router.get('/feed', optionalAuth, getPublicFeed);
router.get('/map-data', cacheService.middleware('challenges:map', 15), getMapData);
router.get('/stats', cacheService.middleware('challenges:stats', 15), getChallengeStats);
router.post('/classify', classifyChallengeText);
router.post('/check-duplicates', checkDuplicates);
router.post('/parse-voice', parseVoice);
router.get('/my', protect, cacheService.middleware('challenges:my', 5), getMyChallenges);
router.get('/', optionalAuth, cacheService.middleware('challenges:list', 5), getChallenges);
router.post('/', optionalAuth, (req, res, next) => { req.uploadSubDir = 'challenges'; next(); }, upload.array('attachments', 10), createChallenge);
router.get('/:id/updates', optionalAuth, getChallengeUpdates);
router.get('/:id', optionalAuth, cacheService.middleware('challenges:single', 10), getChallenge);
router.put('/:id', protect, updateChallenge);
router.get('/:id/chat', optionalAuth, getChallengeChat);
router.post('/:id/chat', optionalAuth, postChallengeChatMessage);
router.post('/:id/chat/mark-read', optionalAuth, markChallengeChatRead);
router.delete('/:id/files', optionalAuth, deleteChallengeFiles);
router.post('/:id/delete-files', optionalAuth, deleteChallengeFiles);
router.delete('/:id', optionalAuth, deleteChallenge);
router.put('/:id/status', protect, authorize('admin', 'university_rep'), updateStatus);
router.patch('/:id/status', protect, authorize('admin', 'university_rep'), updateStatus);
router.post('/:id/assign', protect, authorize('admin'), assignChallenge);
router.put('/:id/assign', protect, authorize('admin'), assignChallenge);
router.post('/:id/assign-industry', protect, authorize('admin'), assignIndustryPartner);
router.post('/:id/support', protect, toggleSupport);
router.post('/:id/praise', optionalAuth, togglePraise);
router.post('/:id/me-too', optionalAuth, meTooChallenge);
router.post('/:id/feedback', protect, authorize('citizen'), submitFeedback);
router.post('/:id/validate-resolution', protect, authorize('citizen', 'admin'), validateResolution);
router.post('/:id/provide-info', protect, authorize('citizen', 'admin'), (req, res, next) => { req.uploadSubDir = 'challenges'; next(); }, upload.array('attachments', 10), provideAdditionalInfo);

// Comments — nested router
router.use('/:id/comments', require('./comments'));

module.exports = router;
