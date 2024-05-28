const express = require('express');
const {
  getFaculties,
  getFacultiesByCourse,
  getFacultiesByDepartment,
  assignCourse,
  appointCoordinator,
  createAssessment,
  reviewAssessment, approveAssessment,
  createCourse // New route for creating courses
} = require('../controllers/hodController');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/faculties', auth(['HOD']), getFaculties);
router.get('/faculties/course/:courseId', auth(['HOD']), getFacultiesByCourse);
router.get('/faculties/department/:department', auth(['HOD']), getFacultiesByDepartment);
router.post('/assign-course', auth(['HOD']), assignCourse);
router.post('/appoint-coordinator', auth(['HOD']), appointCoordinator);
router.post('/create-assessment', auth(['HOD']), createAssessment);
router.post('/create-course', auth(['HOD']), createCourse); // New route for creating courses
router.get('/review-assessment/:assessmentId/:facultyId', auth(['HOD']), reviewAssessment);
router.post('/approve-assessment/:assessmentId/:facultyId', auth(['HOD']), approveAssessment);
module.exports = router;