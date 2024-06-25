const express = require('express');
const {
  getCourses,
  getAssignments,
  getSetsForAssessment,
  submitAssessment,
  downloadAssessment,
  createQuestion,
  getQuestionsForSet,
  deleteQuestions 
} = require('../controllers/facultyController');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/courses', auth(['Faculty', 'CourseCoordinator', 'HOD']), getCourses);
router.get('/assignments', auth(['Faculty', 'CourseCoordinator', 'HOD']), getAssignments);
router.get('/sets/:assessmentId', auth(['Faculty', 'CourseCoordinator', 'HOD']), getSetsForAssessment);
router.get('/questions/:assessmentId/:setName', auth(['Faculty', 'CourseCoordinator', 'HOD']), getQuestionsForSet);
router.post('/submit-assessment', auth(['Faculty', 'CourseCoordinator', 'HOD']), submitAssessment);
router.get('/download-assessment/:assessmentId/:setName', auth(['Faculty', 'CourseCoordinator', 'HOD']), downloadAssessment);
router.post('/create-question', auth(['Faculty', 'CourseCoordinator', 'HOD']), createQuestion);
router.delete('/delete-questions', auth(['Faculty', 'CourseCoordinator', 'HOD']), deleteQuestions); // Add deleteQuestions route

module.exports = router;
