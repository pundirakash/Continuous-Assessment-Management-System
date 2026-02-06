const express = require('express');
const {
    registerUser, getAllUsers, getUsersByDepartment, editUser, deleteUser,
    bulkRegister, switchTerm, getSystemConfig, getArchivedTerms, restoreTerm,
    createDepartment, getDepartments, renameDepartment, getOrganization,
    createSchool, renameSchool, syncRoles
} = require('../controllers/adminController');
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/register', auth(['Admin', 'HOD']), registerUser);
router.get('/users', auth(['Admin']), getAllUsers);
router.get('/users/:department', auth(['Admin']), getUsersByDepartment);
router.put('/users/:userId', auth(['Admin']), editUser);
router.delete('/users/:userId', auth(['Admin']), deleteUser);
router.post('/bulk-register', auth(['Admin']), bulkRegister);
router.post('/switch-term', auth(['Admin']), switchTerm);
router.get('/system/config', auth(['Admin', 'HOD', 'Faculty', 'CourseCoordinator']), getSystemConfig);

// Restore / Archive Endpoints
router.get('/terms/archived', auth(['Admin', 'HOD', 'Faculty', 'CourseCoordinator']), getArchivedTerms);
router.post('/terms/restore', auth(['Admin']), restoreTerm);

// Department Endpoints
router.post('/departments', auth(['Admin']), createDepartment);
router.get('/departments', auth(['Admin']), getDepartments);
router.put('/departments', auth(['Admin']), renameDepartment);
router.get('/organization', auth(['Admin']), getOrganization);
router.post('/school', auth(['Admin']), createSchool);
router.put('/school', auth(['Admin']), renameSchool);
router.post('/sync-roles', auth(['Admin']), syncRoles);

module.exports = router;
