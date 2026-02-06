const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const auth = require('../middleware/auth');

// Routes
router.get('/:courseId', auth(), chatController.getCourseMessages);
router.post('/send', auth(), chatController.sendMessage);
router.post('/mark-read', auth(), chatController.markAsRead);
router.post('/unread-counts', auth(), chatController.getUnreadCounts);

module.exports = router;
