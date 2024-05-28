const express = require('express');
const { getCourses, createQuestion, getQuestions, submitAssessment, downloadAssessment } = require('../controllers/facultyController');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/courses', auth(['Faculty']), getCourses);
router.post('/create-question', auth(['Faculty']), createQuestion);
router.get('/questions', auth(['Faculty']), getQuestions);
router.post('/submit-assessment', auth(['Faculty']), submitAssessment);
router.get('/download-assessment/:assessmentId', auth(['Faculty']), downloadAssessment);

module.exports = router;
