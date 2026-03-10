const express = require('express');
const { register, login, adminResetPassword, changePassword, updateProfile } = require('../controllers/authController');
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/admin/reset-password', auth(['Admin']), adminResetPassword);
router.post('/user/change-password', auth(), changePassword);
router.put('/user/profile', auth(), updateProfile);

module.exports = router;
