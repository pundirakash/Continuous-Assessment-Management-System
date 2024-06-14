const express = require('express');
const { getCourses, createQuestion, getQuestions, submitAssessment, downloadAssessment } = require('../controllers/facultyController');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/courses', auth(['Faculty', 'CourseCoordinator', 'HOD']), getCourses);
router.post('/create-question', auth(['Faculty', 'CourseCoordinator', 'HOD']), createQuestion);
router.get('/questions', auth(['Faculty', 'CourseCoordinator', 'HOD']), getQuestions);
router.post('/submit-assessment', auth(['Faculty', 'CourseCoordinator', 'HOD']), submitAssessment);
router.get('/download-assessment/:assessmentId/:setName', auth(['Faculty', 'CourseCoordinator', 'HOD']), downloadAssessment);

module.exports = router;
