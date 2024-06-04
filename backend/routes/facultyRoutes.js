const express = require('express');
const { getCourses, createQuestion, getQuestions, submitAssessment, downloadAssessment } = require('../controllers/facultyController');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/courses', auth(['Faculty', 'CourseCoordinator']), getCourses);
router.post('/create-question', auth(['Faculty', 'CourseCoordinator']), createQuestion);
router.get('/questions', auth(['Faculty', 'CourseCoordinator']), getQuestions);
router.post('/submit-assessment', auth(['Faculty', 'CourseCoordinator']), submitAssessment);
router.get('/download-assessment/:assessmentId/:setName', auth(['Faculty', 'CourseCoordinator']), downloadAssessment);

module.exports = router;
