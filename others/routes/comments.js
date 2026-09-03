const express = require('express');
const router = express.Router({ mergeParams: true }); // to get :id from challenges route
const { getComments, createComment } = require('../controllers/commentController');
const { protect, optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, getComments);
router.post('/', protect, createComment);

module.exports = router;
