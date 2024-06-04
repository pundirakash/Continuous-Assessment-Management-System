const express = require('express');
const router = express.Router();
const hodController = require('../controllers/hodController');
const auth = require('../middleware/auth'); // Assuming this middleware handles authentication

// Routes for HOD functionalities
router.get('/faculties', auth, hodController.getFaculties);
router.get('/faculties/course/:courseId', auth, hodController.getFacultiesByCourse);
router.get('/faculties/department', auth, hodController.getFacultiesByDepartment);
router.post('/assign-course', auth, hodController.assignCourse);
router.post('/appoint-coordinator', auth, hodController.appointCoordinator);
router.post('/create-assessment', auth, hodController.createAssessment);
router.get('/review-assessment/:assessmentId/faculty/:facultyId', auth, hodController.reviewAssessment);
router.post('/create-course', auth, hodController.createCourse);
router.post('/approve-assessment/:assessmentId/faculty/:facultyId/set/:setName', auth, hodController.approveAssessment);
router.get('/download-assessment-questions/:courseId/:assessmentId', auth, hodController.downloadAssessmentQuestions);
router.get('/download-course-questions/:courseId', auth, hodController.downloadCourseQuestions);

module.exports = router;
