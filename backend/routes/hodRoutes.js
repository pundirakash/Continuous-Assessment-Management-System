const express = require('express');
const router = express.Router();
const hodController = require('../controllers/hodController');
const auth = require('../middleware/auth');

router.get('/faculties',  auth(['HOD']), hodController.getFaculties);
router.get('/faculties/course/:courseId',  auth(['HOD']), hodController.getFacultiesByCourse);
// router.get('/faculties/department',  auth(['HOD']), hodController.getFacultiesByDepartment);
router.post('/assign-course',  auth(['HOD']), hodController.assignCourse);
router.post('/appoint-coordinator',  auth(['HOD']), hodController.appointCoordinator);
router.post('/create-assessment',  auth(['HOD']), hodController.createAssessment);
router.get('/review-assessment/:assessmentId/faculty/:facultyId',  auth(['HOD']), hodController.reviewAssessment);
router.post('/create-course',  auth(['HOD']), hodController.createCourse);
router.post('/approve-assessment/:assessmentId/faculty/:facultyId/set/:setName',  auth(['HOD']), hodController.approveAssessment);
router.get('/download-assessment-questions/:courseId/:assessmentId',  auth(['HOD']), hodController.downloadAssessmentQuestions);
router.get('/download-course-questions/:courseId',  auth(['HOD']), hodController.downloadCourseQuestions);

module.exports = router;
