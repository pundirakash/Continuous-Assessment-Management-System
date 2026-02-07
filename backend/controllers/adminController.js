const bcrypt = require('bcryptjs');
const User = require('../models/User');
const TermArchive = require('../models/TermArchive');
const SystemConfig = require('../models/SystemConfig');
const Course = require('../models/Course');
const University = require('../models/University');
const School = require('../models/School');
const Department = require('../models/Department');

exports.getOrganization = async (req, res) => {
  try {
    const { universityId } = req.user;
    if (!universityId) return res.status(403).json({ message: 'University context required' });

    const university = await University.findById(universityId);
    if (!university) return res.status(404).json({ message: 'University not found' });

    const schools = await School.find({ universityId }).lean();

    // Enhance schools with their departments
    for (let school of schools) {
      school.departments = await Department.find({ schoolId: school._id }).select('name _id').lean();
    }

    res.status(200).json({
      university: university.name,
      universityId: university._id,
      schools: schools.map(s => ({
        _id: s._id,
        name: s.name,
        departments: s.departments
      }))
    });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

exports.registerUser = async (req, res) => {
  try {
    const { name, uid, departmentId, schoolId, email, password, role, department } = req.body;
    let { universityId } = req.body;

    // Hard-scope to Admin's university if available in token
    if (req.user && req.user.universityId) {
      universityId = req.user.universityId;
    }

    if (!universityId) {
      return res.status(400).json({ message: 'University context required for registration' });
    }

    const existingUser = await User.findOne({ email, universityId });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists in this university' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name, email, uid,
      departmentId, schoolId, universityId,
      department, // Fallback string
      password: hashedPassword,
      role
    });
    await user.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get all users (excluding passwords and soft-deleted) - Scoped by University
exports.getAllUsers = async (req, res) => {
  try {
    const { universityId } = req.user;
    const filter = { isDeleted: { $ne: true } };
    if (universityId) filter.universityId = universityId;

    const users = await User.find(filter).select('-password');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get users by department - Scoped by University
exports.getUsersByDepartment = async (req, res) => {
  try {
    const { department: departmentId } = req.params;
    let { universityId, schoolId } = req.query;

    // Hard-scope to Admin's university if available in token
    if (req.user && req.user.universityId) {
      universityId = req.user.universityId;
    }

    const filter = { isDeleted: { $ne: true } };
    if (departmentId.length === 24) { // Check if ObjectID
      filter.departmentId = departmentId;
    } else {
      filter.department = departmentId;
    }

    if (universityId) filter.universityId = universityId;
    if (schoolId) filter.schoolId = schoolId;

    const users = await User.find(filter).select('-password');

    if (!users || users.length === 0) {
      return res.status(404).json({ message: 'No users found in this department' });
    }

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Edit user details
exports.editUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, uid, departmentId, schoolId, universityId, email, role, department } = req.body;

    const user = await User.findByIdAndUpdate(userId,
      { name, uid, departmentId, schoolId, universityId, email, role, department },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Soft Delete a user
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    // Soft Delete: Mark as deleted instead of removing
    const user = await User.findByIdAndUpdate(userId, { isDeleted: true, isActive: false }, { new: true });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User deleted (archived) successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Bulk register users
exports.bulkRegister = async (req, res) => {
  try {
    const { users } = req.body;
    const { universityId: adminUniId } = req.user; // Admin's university

    const userPromises = users.map(async (userData) => {
      const existingUser = await User.findOne({
        email: userData.email,
        universityId: userData.universityId || adminUniId
      });

      if (existingUser) {
        throw new Error(`User with email ${userData.email} already exists in this university`);
      }

      userData.password = await bcrypt.hash(userData.password || 'Welcome@123', 10);

      // Enforce Admin's university if not specified in bulk data
      if (!userData.universityId) userData.universityId = adminUniId;

      return User.create(userData);
    });

    await Promise.all(userPromises);

    res.status(201).send({ message: 'Users created successfully' });
  } catch (error) {
    console.error('Error creating users:', error);
    res.status(500).send({ message: `Error creating users: ${error.message}` });
  }
};

// --- DEPARTMENT MANAGEMENT ---

exports.createDepartment = async (req, res) => {
  const { name, schoolId } = req.body;
  const { universityId } = req.user;

  if (!name || !schoolId) return res.status(400).json({ message: 'Department name and School ID are required' });
  try {
    const existing = await Department.findOne({ name, schoolId });
    if (existing) return res.status(400).json({ message: 'Department already exists in this school' });

    const dept = await Department.create({ name, schoolId, universityId });
    res.status(201).json(dept);
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

exports.getDepartments = async (req, res) => {
  try {
    const { schoolId } = req.query;
    const { universityId } = req.user;

    const filter = {};
    if (schoolId) filter.schoolId = schoolId;

    // Scoping check: If universityId is present in token, strictly enforce it
    if (universityId) {
      filter.universityId = universityId;
    }

    const depts = await Department.find(filter).lean();
    res.status(200).json(depts);
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

exports.renameDepartment = async (req, res) => {
  const { id, name } = req.body;
  const { universityId } = req.user;

  try {
    const oldDept = await Department.findById(id);
    if (!oldDept) return res.status(404).json({ message: 'Department not found' });

    // AUTH CHECK: Ensure HOD/Admin belongs to same university
    if (universityId && oldDept.universityId?.toString() !== universityId.toString()) {
      return res.status(403).json({ message: 'Not authorized to rename this department' });
    }

    const oldName = oldDept.name;

    // Update Department Model
    oldDept.name = name;
    await oldDept.save();

    // Bulk Update Users (ONLY within THIS university)
    const userFilter = { department: oldName };
    if (universityId) userFilter.universityId = universityId;

    await User.updateMany(userFilter, { $set: { department: name } });

    res.status(200).json({ message: `Renamed ${oldName} to ${name} and updated references for your university.` });

  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

exports.getSystemConfig = async (req, res) => {
  try {
    const { universityId } = req.user;
    const filter = { key: 'currentTerm' };
    if (universityId) filter.universityId = universityId;

    let config = await SystemConfig.findOne(filter);
    if (!config) {
      config = await SystemConfig.create({ key: 'currentTerm', value: '24252', universityId });
    }
    res.status(200).json(config);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.switchTerm = async (req, res) => {
  const { newTerm } = req.body;
  const { universityId } = req.user;

  if (!newTerm) return res.status(400).json({ message: 'New Term ID is required' });
  if (!universityId) return res.status(403).json({ message: 'University context required' });

  try {
    const filter = { key: 'currentTerm', universityId };
    let currentTermConfig = await SystemConfig.findOne(filter);
    const retiringTerm = currentTermConfig ? currentTermConfig.value : '24252';

    if (retiringTerm === newTerm) {
      return res.status(400).json({ message: 'New term cannot be same as current term' });
    }

    console.log(`[Term Switch][Uni: ${universityId}] Archiving ${retiringTerm} -> Starting ${newTerm}`);

    // ONLY archive courses belonging to THIS university
    const universityCourses = await Course.find({ universityId });
    const archiveEntries = [];

    for (const course of universityCourses) {
      if (course.faculties && course.faculties.length > 0) {
        for (const facultyId of course.faculties) {
          archiveEntries.push({
            termId: retiringTerm,
            courseId: course._id,
            facultyId: facultyId,
            role: 'Faculty',
            universityId,
            schoolId: course.schoolId,
            departmentId: course.departmentId
          });
        }
      }
      if (course.coordinator) {
        archiveEntries.push({
          termId: retiringTerm,
          courseId: course._id,
          facultyId: course.coordinator,
          role: 'CourseCoordinator',
          universityId,
          schoolId: course.schoolId,
          departmentId: course.departmentId
        });
      }
    }

    if (archiveEntries.length > 0) {
      try {
        await TermArchive.insertMany(archiveEntries, { ordered: false });
      } catch (e) {
        console.warn("Some duplicate archive entries ignored", e.message);
      }
    }

    // ONLY clear courses for THIS university
    const courseIds = universityCourses.map(c => c._id);
    await Course.updateMany({ _id: { $in: courseIds } }, {
      $set: { faculties: [], coordinator: null }
    });

    // Clear ONLY users belonging to THIS university
    await User.updateMany(
      { universityId, role: { $in: ['Faculty', 'CourseCoordinator', 'HOD'] } },
      { $set: { courses: [] } }
    );

    // Revert coordinators to faculty within this university
    await User.updateMany(
      { universityId, role: 'CourseCoordinator' },
      { $set: { role: 'Faculty' } }
    );

    if (currentTermConfig) {
      currentTermConfig.value = newTerm;
      await currentTermConfig.save();
    } else {
      await SystemConfig.create({ key: 'currentTerm', value: newTerm, universityId });
    }

    res.status(200).json({ message: `Successfully archived ${retiringTerm} and switched to ${newTerm} for your university.` });

  } catch (error) {
    console.error('Term switch failed:', error);
    res.status(500).json({ message: 'Server error during term switch', error: error.message });
  }
};

exports.getArchivedTerms = async (req, res) => {
  try {
    const { universityId } = req.user;
    const filter = {};
    if (universityId) filter.universityId = universityId;

    const archives = await TermArchive.find(filter).distinct('termId');
    res.status(200).json(archives.sort().reverse()); // Show newest first
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching archives', error });
  }
};

exports.restoreTerm = async (req, res) => {
  const { termId } = req.body;
  const { universityId } = req.user;

  if (!termId) return res.status(400).json({ message: 'Term ID is required to restore' });
  if (!universityId) return res.status(403).json({ message: 'University context required' });

  try {
    const filter = { key: 'currentTerm', universityId };
    let currentTermConfig = await SystemConfig.findOne(filter);
    const activeTerm = currentTermConfig ? currentTermConfig.value : 'UNKNOWN_TERM';

    console.log(`[Term Restore][Uni: ${universityId}] restoring ${termId} (Current active: ${activeTerm})`);

    if (activeTerm === termId) {
      return res.status(400).json({ message: 'Cannot restore the currently active term.' });
    }

    // --- STEP 1: Archive Current Active Term (University Scoped) ---
    const universityCourses = await Course.find({ universityId });
    const archiveEntries = [];

    for (const course of universityCourses) {
      if (course.faculties && course.faculties.length > 0) {
        for (const facultyId of course.faculties) {
          archiveEntries.push({
            termId: activeTerm,
            courseId: course._id,
            facultyId: facultyId,
            role: 'Faculty',
            universityId
          });
        }
      }
      if (course.coordinator) {
        archiveEntries.push({
          termId: activeTerm,
          courseId: course._id,
          facultyId: course.coordinator,
          role: 'CourseCoordinator',
          universityId
        });
      }
    }

    if (archiveEntries.length > 0) {
      try {
        await TermArchive.insertMany(archiveEntries, { ordered: false });
      } catch (e) { console.warn('Archive duplicate ignored'); }
    }

    // --- STEP 2: Clear Active State (University Scoped) ---
    const courseIds = universityCourses.map(c => c._id);
    await Course.updateMany({ _id: { $in: courseIds } }, {
      $set: { faculties: [], coordinator: null }
    });
    await User.updateMany({ universityId }, { $set: { courses: [] } });
    await User.updateMany({ universityId, role: 'CourseCoordinator' }, { $set: { role: 'Faculty' } });


    // --- STEP 3: Restore Data from Archive for `termId` (University Scoped) ---
    const archivedData = await TermArchive.find({ termId, universityId });

    if (archivedData.length === 0) {
      console.log(`No data found in archive for ${termId} (Uni: ${universityId}), switching to empty state.`);
    }

    for (const entry of archivedData) {
      if (entry.role === 'Faculty' || entry.role === 'CourseCoordinator') {
        // Restore Course -> Faculty link
        await Course.findByIdAndUpdate(entry.courseId, {
          $addToSet: { faculties: entry.facultyId }
        });

        // Restore Faculty -> Course link
        await User.findByIdAndUpdate(entry.facultyId, {
          $addToSet: { courses: entry.courseId }
        });

        // Restore Coordinator
        if (entry.role === 'CourseCoordinator') {
          await Course.findByIdAndUpdate(entry.courseId, {
            coordinator: entry.facultyId
          });
          await User.findByIdAndUpdate(entry.facultyId, {
            role: 'CourseCoordinator'
          });
        }
      }
    }

    // --- STEP 4: Update System Config ---
    if (currentTermConfig) {
      currentTermConfig.value = termId;
      await currentTermConfig.save();
    } else {
      await SystemConfig.create({ key: 'currentTerm', value: termId, universityId });
    }

    res.status(200).json({ message: `Successfully restored term ${termId} as active for your university.` });

  } catch (error) {
    console.error('Term restore failed:', error);
    res.status(500).json({ message: 'Server error during term restore', error: error.message });
  }
};

exports.createSchool = async (req, res) => {
  const { name, universityId } = req.body;
  if (!name || !universityId) return res.status(400).json({ message: 'Name and University ID are required' });

  try {
    const school = await School.create({ name, universityId });
    res.status(201).json(school);
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

exports.renameSchool = async (req, res) => {
  const { id, name } = req.body;
  try {
    await School.findByIdAndUpdate(id, { name });
    res.status(200).json({ message: 'School renamed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// End of switchTerm (Cleaned up duplicate)

exports.syncRoles = async (req, res) => {
  try {
    const { universityId } = req.user;
    if (!universityId) {
      return res.status(400).json({ message: 'University context missing' });
    }

    const config = await SystemConfig.findOne({ key: 'currentTerm', universityId });
    const currentTerm = config ? config.value : null;

    if (!currentTerm) {
      return res.status(400).json({ message: 'Current term not configured for this university' });
    }

    const coordinators = await User.find({ universityId, role: 'CourseCoordinator' });

    let count = 0;
    for (const user of coordinators) {
      const activeCourses = await Course.find({
        universityId,
        coordinator: user._id,
        activeTerms: { $in: [currentTerm] }
      });

      if (activeCourses.length === 0) {
        user.role = 'Faculty';
        await user.save();
        count++;
      }
    }

    res.status(200).json({
      message: `Role synchronization complete. Reverted ${count} stale coordinator roles to Faculty.`,
      revertedCount: count
    });
  } catch (error) {
    console.error("Sync Roles Error:", error);
    res.status(500).json({ message: 'Server error', error });
  }
};
