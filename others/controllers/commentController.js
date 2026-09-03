const Comment = require('../models/Comment');
const Challenge = require('../models/Challenge');

// @desc    Get comments for a challenge
// @route   GET /api/challenges/:id/comments
// @access  Public
exports.getComments = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const challengeId = req.params.id;

    // Get top-level comments only
    const [comments, total] = await Promise.all([
      Comment.find({ challenge: challengeId, parentComment: null, isDeleted: false })
        .populate('author', 'name avatar role')
        .populate({
          path: 'replies',
          match: { isDeleted: false },
          populate: { path: 'author', select: 'name avatar role' },
          options: { sort: { createdAt: 1 }, limit: 5 }
        })
        .sort('-createdAt')
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit)),
      Comment.countDocuments({ challenge: challengeId, parentComment: null, isDeleted: false })
    ]);

    res.status(200).json({
      success: true,
      data: comments,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Post a comment
// @route   POST /api/challenges/:id/comments
// @access  Private
exports.createComment = async (req, res, next) => {
  try {
    const { text, parentCommentId } = req.body;
    const challengeId = req.params.id;

    const challenge = await Challenge.findById(challengeId);
    if (!challenge) return res.status(404).json({ success: false, message: 'Challenge not found' });

    const commentData = {
      challenge: challengeId,
      author: req.user.id,
      text: text.trim()
    };

    if (parentCommentId) {
      const parent = await Comment.findById(parentCommentId);
      if (!parent) return res.status(404).json({ success: false, message: 'Parent comment not found' });
      commentData.parentComment = parentCommentId;
    }

    const comment = await Comment.create(commentData);

    // If reply, add to parent's replies array
    if (parentCommentId) {
      await Comment.findByIdAndUpdate(parentCommentId, { $push: { replies: comment._id } });
    }

    // Update challenge comment count
    await Challenge.findByIdAndUpdate(challengeId, { $inc: { commentCount: 1 } });

    // Populate author
    await comment.populate('author', 'name avatar role');

    res.status(201).json({ success: true, data: comment });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a comment
// @route   DELETE /api/comments/:id
// @access  Private
exports.deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

    // Only author or admin can delete
    if (comment.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this comment' });
    }

    // Soft delete
    comment.isDeleted = true;
    comment.deletedAt = new Date();
    await comment.save();

    // Decrement challenge comment count
    await Challenge.findByIdAndUpdate(comment.challenge, { $inc: { commentCount: -1 } });

    res.status(200).json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Like/Unlike a comment
// @route   POST /api/comments/:id/like
// @access  Private
exports.toggleCommentLike = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

    const userId = req.user.id;
    const alreadyLiked = comment.likedBy.some(id => id.toString() === userId);

    if (alreadyLiked) {
      comment.likedBy = comment.likedBy.filter(id => id.toString() !== userId);
    } else {
      comment.likedBy.push(userId);
    }

    await comment.save();

    res.status(200).json({
      success: true,
      data: { liked: !alreadyLiked, likeCount: comment.likedBy.length }
    });
  } catch (error) {
    next(error);
  }
};
