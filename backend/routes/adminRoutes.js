const express = require('express');
const { registerUser, assignRole } = require('../controllers/adminController'); // Ensure these functions are correctly imported
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/register', auth(['Admin']), registerUser);
router.post('/assign-role', auth(['Admin']), assignRole);

module.exports = router;
