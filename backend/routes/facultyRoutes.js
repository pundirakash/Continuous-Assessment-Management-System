const express = require('express');
const {
  getCourses,
  getAssignments,
  getSetsForAssessment,
  submitAssessment,
  downloadAssessment,
  createQuestion,
  getQuestionsForSet,
  deleteQuestion,
  editQuestion,
  createSet,
  deleteSet,
  downloadRandomApprovedQuestions,
  updateSetDetails,
  getSetDetails,
  getNotifications,
  downloadSolution,
  markNotificationsRead,
  getFacultyStats,
  downloadImportTemplate,
  bulkImportQuestions,
  undoBulkImport,
  deleteMultipleQuestions

} = require('../controllers/facultyController');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/courses', auth(['Faculty', 'CourseCoordinator', 'HOD']), getCourses);
router.get('/assignments', auth(['Faculty', 'CourseCoordinator', 'HOD']), getAssignments);
router.get('/sets/:assessmentId', auth(['Faculty', 'CourseCoordinator', 'HOD']), getSetsForAssessment);
router.get('/questions/:assessmentId/:setName', auth(['Faculty', 'CourseCoordinator', 'HOD']), getQuestionsForSet);
router.post('/submit-assessment', auth(['Faculty', 'CourseCoordinator', 'HOD']), submitAssessment);
router.get('/download-assessment/:assessmentId/:setName/:templateNumber', auth(['Faculty', 'CourseCoordinator', 'HOD']), downloadAssessment);
router.get('/download-solution/:assessmentId/:setName/:templateNumber', auth(['Faculty', 'CourseCoordinator', 'HOD']), downloadSolution);
router.post('/create-question', auth(['Faculty', 'CourseCoordinator', 'HOD']), createQuestion);
router.delete('/delete-question/:questionId', auth(['Faculty', 'CourseCoordinator', 'HOD']), deleteQuestion);
router.put('/edit-question/:questionId', auth(['Faculty', 'CourseCoordinator', 'HOD']), editQuestion);
router.post('/create-set', auth(['Faculty', 'CourseCoordinator', 'HOD']), createSet);
router.delete('/delete-set/:assessmentId/:facultyId/:setName', auth(['Faculty', 'CourseCoordinator', 'HOD']), deleteSet);
router.post('/download-random-questions', auth(['Faculty', 'CourseCoordinator', 'HOD']), downloadRandomApprovedQuestions);
router.put('/update-set-details/:assessmentId/:setName', auth(['Faculty', 'CourseCoordinator', 'HOD']), updateSetDetails);
router.get('/sets/:assessmentId/:setName', auth(['Faculty', 'CourseCoordinator', 'HOD']), getSetDetails);
// Dashboard Stats
router.get('/stats', auth(['Faculty', 'CourseCoordinator', 'HOD']), getFacultyStats);
router.get('/notifications', auth(['Faculty', 'CourseCoordinator', 'HOD']), getNotifications);
router.post('/notifications/read', auth(['Faculty', 'CourseCoordinator', 'HOD']), markNotificationsRead);

// Bulk Import Routes
router.get('/download-template', auth(['Faculty', 'CourseCoordinator', 'HOD']), downloadImportTemplate);
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
router.post('/bulk-import', auth(['Faculty', 'CourseCoordinator', 'HOD']), upload.single('file'), bulkImportQuestions);
router.post('/undo-bulk-import', auth(['Faculty', 'CourseCoordinator', 'HOD']), undoBulkImport);
router.post('/delete-multiple-questions', auth(['Faculty', 'CourseCoordinator', 'HOD']), deleteMultipleQuestions);

module.exports = router;
