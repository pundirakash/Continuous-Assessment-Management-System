const express = require('express');
const { registerUser, getAllUsers, getUsersByDepartment, editUser, deleteUser } = require('../controllers/adminController');
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/register', auth(['Admin','HOD']), registerUser);
router.get('/users', auth(['Admin']), getAllUsers);
router.get('/users/:department', auth(['Admin']), getUsersByDepartment);
router.put('/users/:userId', auth(['Admin']), editUser);
router.delete('/users/:userId', auth(['Admin']), deleteUser);

module.exports = router;
