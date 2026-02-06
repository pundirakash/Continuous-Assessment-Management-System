const express = require('express');
const { getFaculties, createAssessment, getAssessments, approveAssessment } = require('../controllers/coordinatorController');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/faculties', auth(['CourseCoordinator']), getFaculties);
router.post('/create-assessment', auth(['CourseCoordinator']), createAssessment);
router.get('/assessments', auth(['CourseCoordinator']), getAssessments);
router.post('/approve-assessment/:assessmentId/:facultyId', auth(['CourseCoordinator']), approveAssessment);

module.exports = router;
