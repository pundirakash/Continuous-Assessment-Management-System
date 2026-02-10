const User = require('../models/User');
const Course = require('../models/Course');
const Assessment = require('../models/Assessment');
const Question = require('../models/Question');
const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const ImageModule = require('docxtemplater-image-module-free');
const archiver = require('archiver');
const TermArchive = require('../models/TermArchive');
const SystemConfig = require('../models/SystemConfig');
const xlsx = require('xlsx');

exports.downloadPendencyReport = async (req, res) => {
  try {
    const { department, departmentId, universityId } = req.user;
    const { termId } = req.query;

    let targetTerm = termId;
    if (!targetTerm) {
      const config = await SystemConfig.findOne({ key: 'currentTerm' });
      targetTerm = config ? config.value : '24252';
    }

    // 1. Get All Active Courses for the Department in this Term
    const courseFilter = {
      isDeleted: { $ne: true },
      $or: [
        { activeTerms: { $in: [String(targetTerm)] } },
        { activeTerms: { $exists: false } },
        { activeTerms: { $size: 0 } }
      ]
    };

    if (departmentId) {
      courseFilter.departmentId = departmentId;
    } else {
      courseFilter.department = department;
    }
    if (universityId) courseFilter.universityId = universityId;

    const courses = await Course.find(courseFilter)
      .populate('faculties', 'name email uid')
      .populate('coordinator', 'name email uid');

    // 2. Get All Assessments for these courses in this Term
    const courseIds = courses.map(c => c._id);
    const assessments = await Assessment.find({
      course: { $in: courseIds },
      termId: targetTerm
    });

    // 3. Flatten Data for Report
    const reportData = [];

    for (const course of courses) {
      // Determine effective faculties (including coordinator)
      let effectiveFaculties = [...course.faculties];
      if (course.coordinator && !effectiveFaculties.some(f => f._id.toString() === course.coordinator._id.toString())) {
        effectiveFaculties.unshift(course.coordinator);
      }

      // Filter only valid faculty objects (in case of nulls)
      effectiveFaculties = effectiveFaculties.filter(f => f);

      // Group Assessments by Course
      const courseAssessments = assessments.filter(a => a.course.toString() === course._id.toString());

      for (const faculty of effectiveFaculties) {
        if (!courseAssessments.length) {
          // No assessments created for this course yet
          reportData.push({
            'Faculty Name': faculty.name,
            'Faculty UID': faculty.uid,
            'Faculty Email': faculty.email,
            'Course Name': course.name,
            'Course Code': course.code,
            'Assessment': 'N/A',
            'Set Name': 'N/A',
            'Status': 'No Active Assessments',
            'Questions Punched': 0,
            'Last Activity': 'N/A'
          });
          continue;
        }

        for (const assessment of courseAssessments) {
          const facultyWork = assessment.facultyQuestions.find(fq => fq.faculty.toString() === faculty._id.toString());

          if (!facultyWork || !facultyWork.sets || facultyWork.sets.length === 0) {
            // Assessment exists, but Faculty hasn't started any set
            reportData.push({
              'Faculty Name': faculty.name,
              'Faculty UID': faculty.uid,
              'Faculty Email': faculty.email,
              'Course Name': course.name,
              'Course Code': course.code,
              'Assessment': assessment.name,
              'Set Name': 'N/A',
              'Status': 'Not Started',
              'Questions Punched': 0,
              'Last Activity': 'N/A'
            });
          } else {
            // Faculty has sets
            for (const set of facultyWork.sets) {
              const lastLog = set.activityLog && set.activityLog.length > 0
                ? set.activityLog[set.activityLog.length - 1]
                : null;

              let lastActivityDisplay = 'N/A';
              const questionCount = set.questions ? set.questions.length : 0;

              if (lastLog) {
                if (questionCount === 0 && lastLog.action === 'Created') {
                  // If just created and empty, maybe show "Created: Date" or hide it to avoid confusion about "Activity"
                  lastActivityDisplay = `Set Created: ${new Date(lastLog.date).toLocaleDateString()}`;
                } else {
                  lastActivityDisplay = new Date(lastLog.date).toLocaleString();
                }
              }

              // Determine detailed status
              let preciseStatus = set.hodStatus; // Default to HOD Status

              // Refine Status Logic
              if (set.hodStatus === 'Pending') {
                if (questionCount === 0) {
                  preciseStatus = 'Set Created (Empty)';
                } else {
                  preciseStatus = 'In Progress (Not Submitted)';
                }
              } else if (set.hodStatus === 'Submitted') {
                // It is submitted by Faculty
                // Now check where it is pending
                if (set.coordinatorStatus === 'Pending') {
                  preciseStatus = 'Pending Coordinator Review';
                } else if (set.coordinatorStatus === 'Approved' || set.coordinatorStatus === 'Submitted') {
                  preciseStatus = 'Pending HOD Review';
                } else if (set.coordinatorStatus === 'Rejected') {
                  preciseStatus = 'Rejected by Coordinator';
                }
              } else if (set.hodStatus === 'Approved') {
                preciseStatus = 'Approved by HOD';
              } else if (set.hodStatus === 'Rejected') {
                preciseStatus = 'Rejected by HOD';
              } else if (set.hodStatus === 'Approved with Remarks') {
                preciseStatus = 'Approved w/ Remarks';
              }

              reportData.push({
                'Faculty Name': faculty.name,
                'Faculty UID': faculty.uid,
                'Faculty Email': faculty.email,
                'Course Name': course.name,
                'Course Code': course.code,
                'Assessment': assessment.name,
                'Set Name': set.setName,
                'Status': preciseStatus,
                'Questions Punched': questionCount,
                'Last Activity': lastActivityDisplay
              });
            }
          }
        }
      }
    }

    // 4. Generate Excel
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(reportData);

    // Auto-width columns roughly
    const colWidths = [
      { wch: 20 }, // Name
      { wch: 10 }, // UID
      { wch: 25 }, // Email
      { wch: 30 }, // Course Name
      { wch: 10 }, // Code
      { wch: 15 }, // Assessment
      { wch: 10 }, // Set
      { wch: 20 }, // Status
      { wch: 10 }, // Questions
      { wch: 20 }  // Last Activity
    ];
    ws['!cols'] = colWidths;

    xlsx.utils.book_append_sheet(wb, ws, 'Pendency Report');

    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="PendencyReport.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);

  } catch (error) {
    console.error('Error generating pendency report:', error);
    res.status(500).json({ message: 'Server error generating report', error });
  }
};

exports.getFaculties = async (req, res) => {
  try {
    const { universityId } = req.user;

    // To support cross-department teaching, we allow HODs to see all faculties in their UNIVERSITY
    // We removed strict schoolId filtering to allow cross-school assignments
    const filter = {
      role: { $in: ['Faculty', 'CourseCoordinator', 'HOD'] },
      isDeleted: { $ne: true }
    };

    if (universityId) filter.universityId = universityId;

    const faculties = await User.find(filter)
      .select('-password')
      .populate('schoolId', 'name') // Populate School Name for UI distinction
      .populate('departmentId', 'name'); // Populate Department Name

    res.status(200).json(faculties);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.getFacultiesByCourse = async (req, res) => {
  const { courseId } = req.params;
  const { termId } = req.query;

  try {
    let targetTerm = termId;
    if (!targetTerm) {
      const config = await SystemConfig.findOne({ key: 'currentTerm' });
      targetTerm = config ? config.value : '24252';
    }
    const config = await SystemConfig.findOne({ key: 'currentTerm' });
    const currentSystemTerm = config ? config.value : '24252';

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(403).json({ message: 'Not authorized to view faculties for this course' });
    }

    if (targetTerm === currentSystemTerm) {
      const faculties = await User.find({ role: ['Faculty', 'CourseCoordinator', 'HOD'], courses: courseId }).populate('courses');
      return res.status(200).json(faculties);
    } else {
      // Archived Data
      const archives = await TermArchive.find({ courseId, termId: targetTerm, role: { $in: ['Faculty', 'CourseCoordinator', 'HOD'] } }).populate('facultyId');
      // Extract users (faculties)
      const faculties = archives.map(a => a.facultyId).filter(u => u !== null);

      // Note: The original code populated 'courses' on the user object. 
      // We probably don't need that for the archived view, or it would be empty anyway.
      return res.status(200).json(faculties);
    }

  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.getFacultiesByDepartment = async (req, res) => {
  try {
    const { departmentId, schoolId, universityId } = req.user;

    const filter = {
      role: { $in: ['Faculty', 'CourseCoordinator', 'HOD'] },
      isDeleted: { $ne: true }
    };

    // If departmentId is provided in query, use it, otherwise use HOD's own department
    const targetDeptId = req.query.departmentId || departmentId;
    if (targetDeptId) filter.departmentId = targetDeptId;

    // Safety check: Ensure HOD only looks within their university
    if (universityId) filter.universityId = universityId;

    const faculties = await User.find(filter).select('-password');
    res.status(200).json(faculties);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.getCoursesByDepartment = async (req, res) => {
  try {
    const { department, departmentId, universityId } = req.user;
    const { termId } = req.query;

    let targetTerm = termId;
    if (!targetTerm) {
      const configFilter = { key: 'currentTerm' };
      if (universityId) configFilter.universityId = universityId;
      const config = await SystemConfig.findOne(configFilter);
      targetTerm = config ? config.value : '24252';
    }

    const config = await SystemConfig.findOne({ key: 'currentTerm' });
    const currentSystemTerm = config ? config.value : '24252';

    // Strict comparison using Strings to avoid Number vs String mismatch
    if (String(targetTerm) === String(currentSystemTerm)) {
      // Active Term: Show only non-deleted courses that are ACTIVE in this term
      // Filter by departmentId if available, fallback to department string
      const courseFilter = {
        isDeleted: { $ne: true },
        $or: [
          { activeTerms: { $in: [String(targetTerm)] } },
          { activeTerms: { $exists: false } },
          { activeTerms: { $size: 0 } }
        ]
      };

      if (req.user.departmentId) {
        courseFilter.departmentId = req.user.departmentId;
      } else {
        courseFilter.department = department; // Legacy
      }

      if (req.user.universityId) courseFilter.universityId = req.user.universityId;

      const courses = await Course.find(courseFilter)
        .populate('coordinator', 'name email uid')
        .populate('faculties', 'name email uid');

      // Enrichment: Ensure coordinator is part of the faculties list for UI visibility
      const enrichedCourses = courses.map(course => {
        const c = course.toObject();
        if (c.coordinator && !c.faculties.some(f => f._id.toString() === c.coordinator._id.toString())) {
          c.faculties.unshift(c.coordinator);
        }
        return c;
      });

      res.status(200).json(enrichedCourses);
    } else {
      // Archived Term: Reconstruct course state from archives
      const { universityId, departmentId, department } = req.user;

      // 1. Find all archives for this term with strict university scoping
      const archiveFilter = { termId: String(targetTerm) };
      if (universityId) archiveFilter.universityId = universityId;

      const archives = await TermArchive.find(archiveFilter)
        .populate('facultyId', 'name email uid')
        .populate('courseId');

      // 2. Group by Course
      const courseMap = {};

      archives.forEach(archive => {
        const course = archive.courseId;
        if (!course) return;

        // AUTH CHECK: Ensure course belongs to HOD's department
        const isMatch = (departmentId && course.departmentId?.toString() === departmentId.toString()) ||
          (course.department === department);

        if (!isMatch) return;

        if (!courseMap[course._id]) {
          courseMap[course._id] = {
            _id: course._id,
            name: course.name,
            code: course.code,
            department: course.department,
            coordinator: null,
            faculties: []
          };
        }

        if (archive.role === 'CourseCoordinator') {
          courseMap[course._id].coordinator = archive.facultyId;
          const exists = courseMap[course._id].faculties.find(f => f._id.toString() === archive.facultyId._id.toString());
          if (!exists) {
            courseMap[course._id].faculties.push(archive.facultyId);
          }
        } else if (archive.role === 'Faculty') {
          const exists = courseMap[course._id].faculties.find(f => f._id.toString() === archive.facultyId._id.toString());
          if (!exists) {
            courseMap[course._id].faculties.push(archive.facultyId);
          }
        }
      });

      // 3. Convert to array
      const historicalCourses = Object.values(courseMap);
      res.status(200).json(historicalCourses);
    }
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.activateCourse = async (req, res) => {
  try {
    const { courseId, termId } = req.body;
    const { departmentId, department, universityId } = req.user;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // AUTH CHECK: Ensure HOD owns this course and university matches
    const isOwner = (departmentId && course.departmentId?.toString() === departmentId.toString()) ||
      (course.department === department);

    if (!isOwner || (universityId && course.universityId?.toString() !== universityId.toString())) {
      return res.status(403).json({ message: 'Not authorized to activate this course' });
    }

    if (!course.activeTerms.includes(termId)) {
      // CLEANUP: Remove course from old faculties' profiles
      if (course.faculties && course.faculties.length > 0) {
        await User.updateMany(
          { _id: { $in: course.faculties } },
          { $pull: { courses: course._id } }
        );
      }

      // Reset Course State for new term
      course.activeTerms.push(termId);
      course.faculties = [];
      course.coordinator = null;

      await course.save();
    }

    res.status(200).json({ message: 'Course activated for the term', course });
  } catch (error) {
    console.error('Error activating course:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get all courses in the catalog (for import)
exports.getCatalogCourses = async (req, res) => {
  try {
    const { departmentId, department, universityId } = req.user;
    const { termId } = req.query;

    const filter = {
      isDeleted: { $ne: true },
      activeTerms: { $ne: termId }
    };

    if (departmentId) {
      filter.departmentId = departmentId;
    } else {
      filter.department = department;
    }

    if (universityId) filter.universityId = universityId;

    const courses = await Course.find(filter);
    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.assignCourse = async (req, res) => {
  try {
    const { facultyId, courseId } = req.body;
    const faculty = await User.findById(facultyId);
    const course = await Course.findById(courseId);

    if (!faculty || !course) {
      return res.status(404).json({ message: 'Faculty or Course not found' });
    }

    // CROSS-DEPARTMENT LOGIC:
    // 1. The HOD must own the COURSE (match departmentId)
    // 2. The Faculty must be in the same UNIVERSITY (or School)
    const isOwnerOfCourse = course.departmentId?.toString() === req.user.departmentId?.toString() ||
      course.department === req.user.department; // Legacy support

    if (!isOwnerOfCourse) {
      return res.status(403).json({ message: 'Not authorized: You can only assign courses belonging to your department' });
    }

    const inSameScope = (faculty.universityId?.toString() === req.user.universityId?.toString()) ||
      (faculty.schoolId?.toString() === req.user.schoolId?.toString());

    // If not in same scope and not a legacy user, block
    if (!inSameScope && (faculty.universityId || req.user.universityId)) {
      return res.status(403).json({ message: 'Not authorized: Faculty must be in the same university/school' });
    }

    if (!faculty.courses.includes(courseId)) {
      faculty.courses.push(courseId);
      await faculty.save();
    }

    course.faculties.push(facultyId);
    await course.save();

    // Update assessments related to the course
    const assessments = await Assessment.find({ course: courseId });
    assessments.forEach(async (assessment) => {
      const existingFacultyQuestion = assessment.facultyQuestions.find(
        (fq) => fq.faculty.toString() === facultyId
      );

      if (!existingFacultyQuestion) {
        assessment.facultyQuestions.push({
          faculty: facultyId,
          sets: [],
        });
        await assessment.save();
      }
    });

    const notificationMessage = `Dear ${faculty.name}, A new Course ${course.name} has been allotted to you.`;
    faculty.notifications.unshift({
      message: notificationMessage,
      read: false,
      createdAt: new Date()
    });
    await faculty.save();

    res.status(200).json({ message: 'Course assigned successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.appointCoordinator = async (req, res) => {
  try {
    const { facultyId, courseId, termId } = req.body;
    console.log(`[HOD] Appointing Coordinator: facultyId=${facultyId}, courseId=${courseId}, termId=${termId}`);

    const faculty = await User.findById(facultyId);
    const course = await Course.findById(courseId);

    if (!faculty || !course) {
      return res.status(404).json({ message: 'Faculty or Course not found' });
    }

    // AUTH CHECK: HOD must own the COURSE, but Faculty can be from anywhere in University
    const isCourseOwner = (req.user.departmentId && course.departmentId?.toString() === req.user.departmentId.toString()) ||
      (course.department === req.user.department);

    if (!isCourseOwner) {
      return res.status(403).json({ message: 'Not authorized to manage this course' });
    }

    // Ensure Faculty belongs to same University
    if (req.user.universityId && faculty.universityId && faculty.universityId.toString() !== req.user.universityId.toString()) {
      return res.status(403).json({ message: 'Cannot appoint faculty from another university' });
    }

    // 1. Update Course Model (for live current view)
    const prevCoordId = course.coordinator;
    course.coordinator = facultyId;
    await course.save();

    // 2. Update User Roles
    if (faculty.role !== 'HOD') {
      faculty.role = 'CourseCoordinator';
    }
    await faculty.save();

    if (prevCoordId && !prevCoordId.equals(facultyId)) {
      const otherCoursesAsCoord = await Course.find({ coordinator: prevCoordId, _id: { $ne: courseId } });
      if (otherCoursesAsCoord.length === 0) {
        await User.findByIdAndUpdate(prevCoordId, { role: 'Faculty' });
      }
    }

    // 3. Update/Sync TermArchive (for term-specific view)
    if (termId) {
      // Find or create archive for the NEW coordinator
      await TermArchive.findOneAndUpdate(
        { termId, courseId, facultyId },
        { role: 'CourseCoordinator' },
        { upsert: true, new: true }
      );

      // If there was a previous coordinator in this term, demote them in THIS archive record
      if (prevCoordId && !prevCoordId.equals(facultyId)) {
        await TermArchive.findOneAndUpdate(
          { termId, courseId, facultyId: prevCoordId },
          { role: 'Faculty' }
        );
      }
    }

    // 4. Notify Faculty
    faculty.notifications.unshift({
      message: `You have been appointed as Course Coordinator for ${course.name} (${course.code})${termId ? ` for term ${termId}` : ''}.`,
      read: false,
      createdAt: new Date()
    });
    await faculty.save();

    res.status(200).json({ message: 'Coordinator appointed successfully', course });
  } catch (error) {
    console.error("Appoint Coordinator Error:", error);
    res.status(500).json({ message: 'Server error', error });
  }
};



exports.deallocateCourse = async (req, res) => {
  try {
    const { facultyId, courseId } = req.body;

    const faculty = await User.findById(facultyId);
    const course = await Course.findById(courseId);

    if (!faculty || !course || faculty.department !== req.user.department) {
      return res.status(403).json({ message: 'Not authorized to deallocate this course' });
    }

    faculty.courses = faculty.courses.filter(id => !id.equals(courseId));
    await faculty.save();

    course.faculties = course.faculties.filter(id => !id.equals(facultyId));
    await course.save();

    res.status(200).json({ message: 'Course deallocated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Duplicate removed in replace chunk above

exports.createAssessment = async (req, res) => {
  try {
    const { courseId, name, termId, type } = req.body;
    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(403).json({ message: 'Not authorized to create assessments for this course' });
    }

    const faculties = await User.find({ courses: courseId });

    const facultyQuestions = faculties.map(faculty => ({
      faculty: faculty._id,
      questions: []
    }));

    const assessment = new Assessment({
      course: courseId,
      termId,
      name,
      type,
      facultyQuestions
    });

    await assessment.save();

    course.assessments.push(assessment._id);
    await course.save();

    res.status(201).json({ message: 'Assessment created successfully for the course', assessment });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.reviewAssessment = async (req, res) => {
  try {
    const { assessmentId, facultyId } = req.params;
    const assessment = await Assessment.findById(assessmentId).populate('facultyQuestions.sets.questions');

    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    const course = await Course.findById(assessment.course);
    if (!course || faculty.department !== req.user.department) {
      return res.status(403).json({ message: 'Not authorized to review this assessment' });
    }

    const facultyQuestions = assessment.facultyQuestions.find(fq => fq.faculty.equals(facultyId));

    if (!facultyQuestions) {
      return res.status(404).json({ message: 'No questions found for this faculty' });
    }

    const questionSet = facultyQuestions.sets.find(set => set.setName === req.params.setName);

    if (!questionSet) {
      return res.status(404).json({ message: 'Question set not found' });
    }

    res.status(200).json(questionSet);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.createCourse = async (req, res) => {
  try {
    const { name, code, termId } = req.body;
    const { department, departmentId, schoolId, universityId } = req.user;

    // Check for existing course with same code in the same school/university
    // We check BOTH active and deleted courses to handle index collisions
    const existingCourse = await Course.findOne({
      code,
      schoolId: schoolId || req.user.schoolId, // Use from user if available
      universityId: universityId || req.user.universityId // Use from user if available
    });

    if (existingCourse) {
      if (!existingCourse.isDeleted) {
        return res.status(400).json({ message: 'Course with this code already exists in your school' });
      } else {
        // ID COLLISION WITH DELETED COURSE
        // Rename the deleted course code to free up the namespace for the new course
        existingCourse.code = `${existingCourse.code}_DELETED_${Date.now()}`;
        await existingCourse.save();
      }
    }

    const course = new Course({
      name,
      code,
      department,
      departmentId,
      schoolId,
      universityId,
      activeTerms: termId ? [termId] : [] // Initialize with current term
    });
    await course.save();

    res.status(201).json({ message: 'Course created successfully', course });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Course code must be unique within the school.' });
    }
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.getCoursesByFaculty = async (req, res) => {
  try {
    const { facultyId } = req.params;
    const { termId } = req.query;

    let targetTerm = termId;
    if (!targetTerm) {
      const config = await SystemConfig.findOne({ key: 'currentTerm' });
      targetTerm = config ? config.value : '24252';
    }
    const config = await SystemConfig.findOne({ key: 'currentTerm' });
    const currentSystemTerm = config ? config.value : '24252';

    const faculty = await User.findById(facultyId); // Fetch logic separated
    if (!faculty || faculty.department !== req.user.department) {
      return res.status(403).json({ message: 'Not authorized to view courses for this faculty' });
    }

    if (targetTerm === currentSystemTerm) {
      // Re-fetch with populate FILTERED by activeTerms
      const facultyWithCourses = await User.findById(facultyId).populate({
        path: 'courses',
        match: {
          isDeleted: { $ne: true },
          $or: [
            { activeTerms: { $in: [String(targetTerm)] } },
            { activeTerms: { $exists: false } }, // Legacy support
            { activeTerms: { $size: 0 } }        // Legacy support
          ]
        }
      });
      return res.status(200).json(facultyWithCourses.courses);
    } else {
      const archives = await TermArchive.find({
        termId: targetTerm,
        facultyId: facultyId
      }).populate('courseId');

      const courses = archives.map(a => a.courseId).filter(c => c !== null);
      return res.status(200).json(courses);
    }

  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};


exports.approveAssessment = async (req, res) => {
  try {
    const { assessmentId, facultyId, setName } = req.params;
    const { status, remarks } = req.body;

    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    const course = await Course.findById(assessment.course);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // AUTH CHECK: Must be HOD of the department that OWNS the course
    const isOwnerHOD = (course.departmentId?.toString() === req.user.departmentId?.toString()) ||
      (course.department === req.user.department); // Legacy

    const isCoordinator = (course.coordinator?.toString() === req.user.id.toString());

    if (req.user.role !== 'Admin' && !isOwnerHOD && !isCoordinator) {
      return res.status(403).json({ message: 'Not authorized to approve this assessment' });
    }

    const facultyQuestions = assessment.facultyQuestions.find(fq => fq.faculty.equals(facultyId));
    if (!facultyQuestions) {
      return res.status(404).json({ message: 'No questions found for this faculty' });
    }

    const questionSet = facultyQuestions.sets.find(set => set.setName === setName);
    if (!questionSet) {
      return res.status(404).json({ message: 'Question set not found' });
    }

    // Strictly trim remarks
    let cleanRemarks = remarks ? String(remarks).trim() : '';

    // DEFENSIVE FIX: Auto-correct status if remarks are empty
    // If frontend sends 'Approved with Remarks' but remarks are empty, downgrade to 'Approved'
    if (status === 'Approved with Remarks' && !cleanRemarks) {
      status = 'Approved';
    }

    // Force clear remarks if status is Approved (just in case)
    if (status === 'Approved') {
      cleanRemarks = '';
    }

    if (status === 'Rejected' && !cleanRemarks) {
      return res.status(400).json({ message: 'Remarks are required for Rejected status' });
    }

    // Update with consolidated status and remarks
    questionSet.hodStatus = status;
    questionSet.hodRemarks = cleanRemarks;

    let questionStatus;
    if (status === 'Approved') {
      questionStatus = 'Approved';
    } else if (status === 'Approved with Remarks') {
      questionStatus = 'Approved';
    } else if (status === 'Rejected') {
      questionStatus = 'Rejected';
    }

    if (questionStatus) {
      await Question.updateMany(
        { _id: { $in: questionSet.questions } },
        { $set: { status: questionStatus } }
      );
    }

    // Determine role for logging (Coordinator or HOD)
    // We check the course coordinator field directly to handle stale JWT roles
    const reviewerRole = (isCoordinator || req.user.role === 'CourseCoordinator') ? 'Course Coordinator' : 'HOD';

    // Log Activity
    questionSet.activityLog.push({
      action: status,
      userId: req.user.id,
      details: `${reviewerRole} Review: ${status}${cleanRemarks ? ` - ${cleanRemarks}` : ''}`
    });

    console.log(`[PRE-SAVE] Sets found: ${facultyQuestions.sets.length}`);
    console.log(`[PRE-SAVE] Current Set Status: ${questionSet.hodStatus} | Remarks: '${questionSet.hodRemarks}'`);

    // FORCE Mongoose to detect the change in the nested array
    assessment.markModified('facultyQuestions');

    if (status === 'Approved' || status === 'Approved with Remarks') {
      const reviewerUser = await User.findById(req.user.id);
      questionSet.approvedBy = req.user.id;
      questionSet.approvedByName = reviewerUser ? reviewerUser.name : `Unknown ${reviewerRole}`;
      questionSet.approvalDate = new Date();
    } else if (status === 'Rejected') {
      questionSet.approvedBy = undefined;
      questionSet.approvedByName = undefined;
      questionSet.approvalDate = undefined;
    }

    await assessment.save();

    // Create and add notification
    const faculty = await User.findById(facultyId);
    if (faculty) {
      const notification = `Dear ${faculty.name}, Your Set ${setName} for ${assessment.name} of ${course.name} has been ${status} by the ${reviewerRole}.`;
      faculty.notifications.unshift({ message: notification });
      await faculty.save();
    }

    res.status(200).json({
      message: `Assessment set reviewed successfully by ${reviewerRole}`,
      reviewerRole: reviewerRole
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error });
  }
};

async function generateDocxFromTemplate(data, templateNumber) {
  try {
    const templateFilePath = path.resolve(__dirname, `../templates/template${templateNumber}.docx`);
    const content = fs.readFileSync(templateFilePath, 'binary');
    const zip = new PizZip(content);

    const imageOpts = {
      centered: false,
      getImage: (tagValue) => fs.readFileSync(tagValue),
      getSize: (img, tagValue, tagName) => [150, 150],
    };

    const imageModule = new ImageModule(imageOpts);

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      modules: [imageModule],
    });

    doc.setData(data);
    doc.render();

    const buffer = doc.getZip().generate({ type: 'nodebuffer' });
    return buffer;
  } catch (error) {
    console.error('Error generating DOCX file:', error);
    throw new Error(`Error generating DOCX file: ${error.message}`);
  }
}

exports.downloadAssessmentQuestions = async (req, res) => {
  try {
    const { courseId, assessmentId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // AUTH CHECK: Must be Admin or HOD of the department that OWNS the course
    const isOwner = req.user.role === 'Admin' ||
      (course.departmentId?.toString() === req.user.departmentId?.toString()) ||
      (course.department === req.user.department); // Legacy support

    if (!isOwner) {
      return res.status(403).json({ message: 'Not authorized to download questions for this course' });
    }

    const assessment = await Assessment.findOne({ _id: assessmentId, course: courseId })
      .populate('facultyQuestions.sets.questions')
      .populate('course');

    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found for the specified course' });
    }

    const allQuestions = assessment.facultyQuestions.flatMap(fq =>
      fq.sets.flatMap(set => set.questions)
    );

    const populatedQuestions = await Question.find({ _id: { $in: allQuestions } });

    const data = {
      assessmentName: assessment.name,
      courseCode: assessment.course.code,
      courseName: assessment.course.name,
      questions: populatedQuestions.map((question, index) => ({
        number: index + 1,
        text: question.text,
        courseOutcome: question.courseOutcome,
        bloomLevel: question.bloomLevel,
        marks: question.marks,
        image: question.image ? path.resolve(__dirname, '../', question.image) : null, // Include image path
      })),
    };

    const docxFilePath = await generateDocxFromTemplate(data, 'template3.docx');

    res.download(docxFilePath, `assessment_${assessmentId}_questions.docx`);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.downloadCourseQuestions = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // AUTH CHECK: Must be Admin or HOD of the department that OWNS the course
    const isOwner = req.user.role === 'Admin' ||
      (course.departmentId?.toString() === req.user.departmentId?.toString()) ||
      (course.department === req.user.department); // Legacy support

    if (!isOwner) {
      return res.status(403).json({ message: 'Not authorized to download questions for this course' });
    }

    const assessments = await Assessment.find({ course: courseId })
      .populate('facultyQuestions.sets.questions')
      .populate('course');

    if (assessments.length === 0) {
      return res.status(404).json({ message: 'No assessments found for the specified course' });
    }

    const allQuestions = assessments.flatMap(assessment =>
      assessment.facultyQuestions.flatMap(fq =>
        fq.sets.flatMap(set => set.questions)
      )
    );

    const populatedQuestions = await Question.find({ _id: { $in: allQuestions } });

    const data = {
      courseCode: course.code,
      courseName: course.name,
      questions: populatedQuestions.map((question, index) => ({
        number: index + 1,
        text: question.text,
        courseOutcome: question.courseOutcome,
        bloomLevel: question.bloomLevel,
        marks: question.marks,
        image: question.image ? path.resolve(__dirname, '../', question.image) : null, // Include image path
      })),
    };

    const docxFilePath = await generateDocxFromTemplate(data, 'template3.docx');

    res.download(docxFilePath, `course_${courseId}_questions.docx`);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.getSetsByFaculty = async (req, res) => {
  const { facultyId, assessmentId } = req.params;

  try {
    const assessment = await Assessment.findById(assessmentId)
      .populate('facultyQuestions.sets.questions');

    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    // Authorization Check
    if (req.user.role !== 'HOD') {
      const course = await Course.findById(assessment.course);
      const isCoordinator = course && course.coordinator && course.coordinator.toString() === req.user._id.toString();
      if (!isCoordinator) {
        return res.status(403).json({ message: 'Not authorized to view sets for this course' });
      }
    }

    const facultyQuestions = assessment.facultyQuestions.find(fq => fq.faculty.equals(facultyId));

    if (!facultyQuestions) {
      return res.status(404).json({ message: 'No question sets found for this faculty' });
    }

    res.status(200).json(facultyQuestions.sets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.editQuestionByHOD = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { text, type, options, bloomLevel, courseOutcome, marks } = req.body;

    const question = await Question.findById(questionId);

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Authorization Check
    if (req.user.role !== 'HOD') {
      // Find assessment to verify course ownership
      const assessment = await Assessment.findOne({
        'facultyQuestions.sets.questions': questionId
      });

      if (assessment) {
        const course = await Course.findById(assessment.course);
        const isCoordinator = course && course.coordinator && course.coordinator.toString() === req.user._id.toString();
        if (!isCoordinator) {
          return res.status(403).json({ message: 'Not authorized to edit this question' });
        }
      } else {
        // If question not linked to assessment, maybe created by faculty but not in set yet? 
        // Or orphan. For safety, allow only HOD if context is unclear, or check Creator?
        // Assuming strict coordinator control.
        return res.status(403).json({ message: 'Not authorized (Question context not found)' });
      }
    }

    question.text = text || question.text;
    question.type = type || question.type;
    question.options = options || question.options;
    question.bloomLevel = bloomLevel || question.bloomLevel;
    question.courseOutcome = courseOutcome || question.courseOutcome;
    question.marks = marks || question.marks;

    await question.save();

    res.status(200).json({ message: 'Question updated successfully', question });
  } catch (error) {
    console.error('Error updating question', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.deleteQuestionByHOD = async (req, res) => {
  try {
    const { questionId } = req.params;

    // Find the assessment that contains this question
    const assessment = await Assessment.findOne({
      'facultyQuestions.sets.questions': questionId
    });

    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    // Authorization Check
    if (req.user.role !== 'HOD') {
      const course = await Course.findById(assessment.course);
      const isCoordinator = course && course.coordinator && course.coordinator.toString() === req.user._id.toString();
      if (!isCoordinator) {
        return res.status(403).json({ message: 'Not authorized to delete this question' });
      }
    }

    // Remove the question from all sets in the assessment
    assessment.facultyQuestions.forEach(fq => {
      fq.sets.forEach(set => {
        set.questions = set.questions.filter(qId => qId.toString() !== questionId);
      });
    });

    await assessment.save();

    // Delete the question document
    const question = await Question.findById(questionId);
    if (question.image) {
      const imagePath = path.resolve(__dirname, '../', question.image);
      fs.unlink(imagePath, (err) => {
        if (err) {
          console.error('Error deleting image file:', err);
        }
      });
    }
    await Question.deleteOne({ _id: questionId });

    res.status(200).json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Error deleting question', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.getPendingAssessmentSets = async (req, res) => {
  try {
    const department = req.user.department;
    const { termId } = req.query;

    let targetTerm = termId;
    if (!targetTerm) {
      const config = await SystemConfig.findOne({ key: 'currentTerm' });
      targetTerm = config ? config.value : '24252';
    }

    let courses;
    const courseFilter = { isDeleted: { $ne: true } };
    if (req.user.universityId) courseFilter.universityId = req.user.universityId;

    if (req.user.departmentId) {
      courseFilter.departmentId = req.user.departmentId;
    } else {
      courseFilter.department = department; // Legacy support
    }

    if (req.user.role === 'HOD') {
      courses = await Course.find(courseFilter);
    } else if (req.user.role === 'CourseCoordinator' || req.user.role === 'Faculty') {
      // Find courses where THIS user is the coordinator
      courseFilter.coordinator = req.user._id;
      courses = await Course.find(courseFilter);
    } else {
      return res.status(200).json([]); // No access
    }

    const courseIds = courses.map(course => course._id);

    const assessments = await Assessment.find({
      course: { $in: courseIds },
      termId: targetTerm, // Filter by term
      'facultyQuestions.sets.hodStatus': 'Submitted'
    }).populate('course facultyQuestions.faculty');

    const pendingSets = assessments.map(assessment => {
      return assessment.facultyQuestions.flatMap(facultyQuestion => {
        const submittedSets = facultyQuestion.sets.filter(set => set.hodStatus === 'Submitted');
        if (submittedSets.length > 0) {
          return submittedSets.map(set => ({
            assessmentId: assessment._id,
            assessmentName: assessment.name,
            courseName: assessment.course.name,
            courseCode: assessment.course.code,
            facultyId: facultyQuestion.faculty ? facultyQuestion.faculty._id : null,
            facultyName: facultyQuestion.faculty ? facultyQuestion.faculty.name : 'Unknown Faculty',
            setName: set.setName,
            hodStatus: set.hodStatus,
            totalQuestions: set.questions ? set.questions.length : 0
          }));
        }
        return [];
      });
    }).flat();

    res.status(200).json(pendingSets);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { termId } = req.query; // Expect termId to know which term to remove from
    const department = req.user.department;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.department !== department) {
      return res.status(403).json({ message: 'Not authorized to delete this course' });
    }

    // Logic: Remove the term from activeTerms
    // If termId is provided, remove it. 
    // If not provided (legacy call), we might default to current, but it's safer to require it.

    if (termId) {
      // Cascading Delete: find all assessments for this course and term
      const assessments = await Assessment.find({ course: courseId, termId: termId });

      for (const assessment of assessments) {
        // Collect all question IDs for this assessment
        const questionIds = [];
        if (assessment.facultyQuestions && assessment.facultyQuestions.length > 0) {
          assessment.facultyQuestions.forEach(fq => {
            if (fq.sets && fq.sets.length > 0) {
              fq.sets.forEach(set => {
                if (set.questions && set.questions.length > 0) {
                  questionIds.push(...set.questions);
                }
              });
            }
          });
        }

        // Delete questions from DB
        if (questionIds.length > 0) {
          await Question.deleteMany({ _id: { $in: questionIds } });
          console.log(`[Cascade Delete] Deleted ${questionIds.length} questions for assessment ${assessment._id} during course removal`);
        }

        // Delete assessment
        await Assessment.findByIdAndDelete(assessment._id);
      }

      // Remove the term from Course activeTerms
      course.activeTerms = course.activeTerms.filter(t => t !== termId);
      await course.save();

      return res.status(200).json({
        message: `Course removed from term ${termId}, and ${assessments.length} assessments with their questions have been purged.`
      });
    } else {
      return res.status(400).json({ message: 'Term ID is required to remove course.' });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.getAssessmentsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { termId } = req.query;

    let targetTerm = termId;
    if (!targetTerm) {
      const config = await SystemConfig.findOne({ key: 'currentTerm' });
      targetTerm = config ? config.value : '24252';
    }

    // Get current system term to compare for legacy data handling
    const config = await SystemConfig.findOne({ key: 'currentTerm' });
    const currentSystemTerm = config ? config.value : '24252';

    let matchQuery = { termId: targetTerm };

    // If querying active term, include legacy assessments (no termId)
    // REVERTED: Data has been migrated. Strict filtering applied.
    /*
    if (targetTerm === currentSystemTerm) {
      matchQuery = {
        $or: [
          { termId: targetTerm },
          { termId: null },
          { termId: { $exists: false } }
        ]
      };
    }
    */

    const course = await Course.findById(courseId).populate({
      path: 'assessments',
      match: { termId: targetTerm }
    });

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.status(200).json(course.assessments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Edit Assessment
exports.editAssessment = async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const { name, termId, type } = req.body;

    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    assessment.name = name;
    assessment.termId = termId;
    assessment.type = type;

    await assessment.save();
    res.status(200).json({ message: 'Assessment updated successfully', assessment });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.deleteAssessment = async (req, res) => {
  try {
    const { assessmentId } = req.params;

    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    // Cascading Delete: collect all question IDs from all faculty sets
    const questionIds = [];
    if (assessment.facultyQuestions && assessment.facultyQuestions.length > 0) {
      assessment.facultyQuestions.forEach(fq => {
        if (fq.sets && fq.sets.length > 0) {
          fq.sets.forEach(set => {
            if (set.questions && set.questions.length > 0) {
              questionIds.push(...set.questions);
            }
          });
        }
      });
    }

    // Delete associated questions from Question collection
    if (questionIds.length > 0) {
      await Question.deleteMany({ _id: { $in: questionIds } });
      console.log(`[Cascade Delete] Deleted ${questionIds.length} questions for assessment ${assessmentId}`);
    }

    await Assessment.findByIdAndDelete(assessmentId);
    res.status(200).json({ message: 'Assessment deleted successfully and associated questions cleared.' });
  } catch (error) {
    console.error('Delete Assessment Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.downloadQuestions = async (req, res) => {
  try {
    const {
      courseId,
      assessmentId,
      type,
      bloomLevel,
      courseOutcome,
      numberOfQuestions,
      templateNumber,
    } = req.query;

    const filter = {};
    const { departmentId, universityId } = req.user;

    // Filter by courseId and its associated assessments
    if (courseId) {
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }

      // AUTH CHECK: Ensure HOD owns the course
      const isOwner = req.user.role === 'Admin' ||
        (course.departmentId?.toString() === departmentId?.toString()) ||
        (course.department === req.user.department); // Legacy

      if (!isOwner) {
        return res.status(403).json({ message: 'Not authorized to download questions for this course' });
      }

      const assessments = await Assessment.find({ course: courseId });
      const assessmentIds = assessments.map(assessment => assessment._id);
      filter.assessment = { $in: assessmentIds };
    } else {
      // If no courseId, scoping must be applied to find all questions in HOD's department
      const deptCourses = await Course.find({
        $or: [
          { departmentId: departmentId },
          { department: req.user.department }
        ]
      }).select('_id');
      const deptCourseIds = deptCourses.map(c => c._id);
      const assessments = await Assessment.find({ course: { $in: deptCourseIds } });
      const assessmentIds = assessments.map(a => a._id);
      filter.assessment = { $in: assessmentIds };
    }

    // Filter by assessmentId
    if (assessmentId) {
      filter.assessment = assessmentId;
    }

    // Filter by type, bloomLevel, and courseOutcome
    if (type) {
      filter.type = type;
    }
    if (bloomLevel) {
      filter.bloomLevel = bloomLevel;
    }
    if (courseOutcome) {
      filter.courseOutcome = courseOutcome;
    }

    // Fetch questions based on the filter
    let questions = await Question.find(filter);

    // Shuffle questions using Fisher-Yates algorithm
    const shuffleArray = (array) => {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    };

    // Apply shuffling
    questions = shuffleArray(questions);

    // Apply slicing if numberOfQuestions is specified
    if (numberOfQuestions) {
      questions = questions.slice(0, parseInt(numberOfQuestions));
    }

    // Function to clean up text by removing unwanted characters
    const sanitizeText = (text) => {
      return text.replace(/[\r\n]+/g, ' ').trim();
    };

    // Prepare question and solution data
    const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    const questionData = {
      questions: questions.map((question, index) => ({
        number: index + 1,
        text: sanitizeText(question.text),
        courseOutcome: question.courseOutcome,
        bloomLevel: question.bloomLevel,
        marks: question.marks,
        options: question.type === 'MCQ' ? question.options.map((option, i) => ({ option: `${optionLetters[i]}. ${option}` })) : [],
        image: question.image ? question.image : null,
      })),
    };

    const solutionData = {
      questions: questions.map((question, index) => ({
        number: index + 1,
        text: sanitizeText(question.text),
        solution: sanitizeText(question.solution),
        marks: question.marks,
      })),
    };

    // Generate documents from templates
    const questionDocBuffer = await generateDocxFromTemplate(questionData, templateNumber || '3');
    const solutionDocBuffer = await generateDocxFromTemplate(solutionData, '5');

    // Set headers and send zip file containing question and solution documents
    res.setHeader('Content-Disposition', 'attachment; filename=questions_and_solution.zip');
    res.setHeader('Content-Type', 'application/zip');

    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.pipe(res);

    // Append the generated documents to the zip archive
    archive.append(questionDocBuffer, { name: 'questions.docx' });
    archive.append(solutionDocBuffer, { name: 'solution.docx' });

    await archive.finalize();

  } catch (error) {
    console.error('Error downloading questions and solution:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};









exports.masterFilterQuestions = async (req, res) => {
  try {
    const { departmentId, universityId } = req.user;
    const department = req.user.department;
    // Helper to normalize input to array or undefined
    const toArray = (val) => {
      if (!val) return undefined;
      return Array.isArray(val) ? val : [val];
    };

    const termIds = toArray(req.query.termId);
    const courseIds = toArray(req.query.courseId);
    const facultyIds = toArray(req.query.facultyId);
    const assessmentIds = toArray(req.query.assessmentId);
    const types = toArray(req.query.type);
    const bloomLevels = toArray(req.query.bloomLevel);
    const courseOutcomes = toArray(req.query.courseOutcome);
    const statuses = toArray(req.query.status);

    // console.log("Master Filter Params (Arrays):", { termIds, courseIds, facultyIds, assessmentIds, types, bloomLevels, courseOutcomes, statuses });

    // 1. Determine Target Terms
    // If no term selected, default to current term
    let targetTerms = termIds;
    if (!targetTerms || targetTerms.length === 0) {
      const configFilter = { key: 'currentTerm' };
      if (universityId) configFilter.universityId = universityId;
      const config = await SystemConfig.findOne(configFilter);
      targetTerms = [config ? config.value : '24252'];
    }

    // Convert terms to handle schema inconsistencies (String vs Number)
    // Assessment.termId is Number, but input is usually String.
    // We create a mix to be safe if Mongoose casting in $in is ambiguous
    const mixedTerms = targetTerms.flatMap(t => [String(t), Number(t)]).filter(x => !isNaN(x) || typeof x === 'string');

    // 2. Base Query for Assessments
    let assessmentQuery = { termId: { $in: mixedTerms } };

    // Narrow down by course (and ensure department ownership)
    if (courseIds) {
      // Validate all requested courses belong to dept
      const courseFilter = { _id: { $in: courseIds } };
      if (departmentId) {
        courseFilter.departmentId = departmentId;
      } else {
        courseFilter.department = department;
      }
      const courses = await Course.find(courseFilter);
      const validCourseIds = courses.map(c => c._id);

      if (validCourseIds.length === 0) {
        return res.status(403).json({ message: "Invalid Course Access or None Found" });
      }
      assessmentQuery.course = { $in: validCourseIds };
    } else {
      // If no course selected, find ALL courses for this department first to get their IDs
      const courseFilter = {};
      if (departmentId) {
        courseFilter.departmentId = departmentId;
      } else {
        courseFilter.department = department;
      }
      const deptCourses = await Course.find(courseFilter).select('_id');
      const deptCourseIds = deptCourses.map(c => c._id);
      assessmentQuery.course = { $in: deptCourseIds };
    }

    if (assessmentIds) {
      assessmentQuery._id = { $in: assessmentIds };
    }

    // Fetch Assessments with minimal fields needed for filtering logic
    const assessments = await Assessment.find(assessmentQuery)
      .populate('course', 'name code')
      .populate('facultyQuestions.faculty', 'name')
      .lean();

    if (!assessments.length) {
      return res.status(200).json([]);
    }

    // 3. Aggregate Question IDs from Assessments
    const questionMetaMap = new Map();

    assessments.forEach(assessment => {
      assessment.facultyQuestions.forEach(fq => {
        // Filter by Faculty if requested
        if (facultyIds && !facultyIds.includes(fq.faculty._id.toString())) return;

        fq.sets.forEach(set => {
          // Filter by Status if requested
          if (statuses && !statuses.includes(set.hodStatus)) return;

          set.questions.forEach(qId => {
            // Store metadata. Last one wins if duplicate.
            questionMetaMap.set(qId.toString(), {
              status: set.hodStatus,
              facultyName: fq.faculty.name,
              assessmentName: assessment.name,
              courseName: assessment.course.name,
              courseCode: assessment.course.code,
              setName: set.setName,
              marks: 0 // Will fill from Question doc
            });
          });
        });
      });
    });

    const candidateQuestionIds = Array.from(questionMetaMap.keys());

    if (candidateQuestionIds.length === 0) {
      return res.status(200).json([]);
    }

    // 4. Query Actual Questions Collection
    const questionQuery = { _id: { $in: candidateQuestionIds } };

    if (types) questionQuery.type = { $in: types };
    if (bloomLevels) questionQuery.bloomLevel = { $in: bloomLevels };
    if (courseOutcomes) questionQuery.courseOutcome = { $in: courseOutcomes };

    const questions = await Question.find(questionQuery).lean();

    // 5. Merge Metadata and Return
    const finalResult = questions.map(q => {
      const meta = questionMetaMap.get(q._id.toString());
      return {
        _id: q._id,
        text: q.text,
        type: q.type,
        marks: q.marks,
        bloomLevel: q.bloomLevel,
        courseOutcome: q.courseOutcome,
        // Metadata from Assessment context
        status: meta.status,
        facultyName: meta.facultyName,
        assessmentName: meta.assessmentName,
        courseName: meta.courseName,
        courseCode: meta.courseCode,
        setName: meta.setName
      };
    });

    res.status(200).json(finalResult);

  } catch (error) {
    console.error("Master Filter Error:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    // Start timing
    const start = Date.now();

    const { departmentId, universityId } = req.user;
    const department = req.user.department;
    const { termId } = req.query;

    let targetTerm = termId;
    if (!targetTerm) {
      const configFilter = { key: 'currentTerm' };
      if (universityId) configFilter.universityId = universityId;
      const config = await SystemConfig.findOne(configFilter).lean();
      targetTerm = config ? config.value : '24252';
    }
    const targetTermStr = String(targetTerm);

    // --- STEP 1: Parallel Fetching of Base Data ---
    // We need:
    // 1. Current Faculties (User model)
    // 2. Historical Faculty IDs (TermArchive)
    // 3. Courses (active in this term, for this dept)

    const facultyFilter = {
      role: { $in: ['Faculty', 'CourseCoordinator', 'HOD'] },
      isDeleted: { $ne: true }
    };
    if (departmentId) facultyFilter.departmentId = departmentId;
    else facultyFilter.department = department;

    const courseFilter = {
      isDeleted: { $ne: true },
      $or: [
        { activeTerms: { $in: [targetTermStr] } },
        { activeTerms: { $exists: false } }, // Legacy
        { activeTerms: { $size: 0 } }        // Legacy
      ]
    };
    if (departmentId) courseFilter.departmentId = departmentId;
    else courseFilter.department = department;
    if (universityId) courseFilter.universityId = universityId;

    // Use deptCourseIds for TermArchive filtering
    const deptCourseFilter = { isDeleted: { $ne: true } };
    if (departmentId) deptCourseFilter.departmentId = departmentId;
    else deptCourseFilter.department = department;

    // Execute Initial Queries Parallel
    const [currentFaculties, deptCourses] = await Promise.all([
      User.find(facultyFilter).select('name email uid _id').lean(),
      Course.find(deptCourseFilter).select('_id').lean()
    ]);

    const deptCourseIds = deptCourses.map(c => c._id);

    // Fetch Historical Faculties separately (dependent on deptCourseIds)
    const historicalFacultyIds = await TermArchive.distinct('facultyId', {
      termId: targetTermStr,
      courseId: { $in: deptCourseIds }
    });

    // Fetch objects for historical faculties not already in currentFaculties
    const currentFacultyIds = new Set(currentFaculties.map(f => f._id.toString()));
    const missingHistoricalIds = historicalFacultyIds.filter(id => !currentFacultyIds.has(id.toString()));

    let additionalFaculties = [];
    if (missingHistoricalIds.length > 0) {
      additionalFaculties = await User.find({ _id: { $in: missingHistoricalIds } }).select('name email uid _id').lean();
    }

    // Combine Unique Faculties
    const allFaculties = [...currentFaculties, ...additionalFaculties];
    const facultyMap = new Map();
    allFaculties.forEach(f => {
      facultyMap.set(f._id.toString(), {
        _id: f._id,
        name: f.name,
        uid: f.uid,
        coursesCount: 0,
        allottedCAsCount: 0,
        allottedCAs: new Set(),
        pendingReviews: 0,
        pendingQuestions: 0, // This logic is tricky, usually means questions waiting for HOD? Or waiting for Faculty to finish? Previous code: (Created - Approved)
        totalQuestionsCreated: 0,
        approvedQuestions: 0
      });
    });

    // --- STEP 2: Fetch Operational Data (Archives, Courses, Assessments) ---

    // 2a. Term Archives for Course Counts
    // We want all archives for this term + these courses
    const allArchives = await TermArchive.find({
      termId: targetTermStr,
      courseId: { $in: deptCourseIds },
      role: { $in: ['Faculty', 'CourseCoordinator'] }
    }).select('facultyId').lean();

    // 2b. Active Courses (for current term mapping fallback)
    const activeCourses = await Course.find(courseFilter)
      .select('faculties coordinator activeTerms')
      .lean();
    const activeCourseIds = activeCourses.map(c => c._id);

    // 2c. Assessments
    // We need all assessments for these active/dept courses in this term
    // (Note: previous code handled Number/String termId mix, we'll do same)
    const mixedTerms = [targetTermStr, Number(targetTermStr)].filter(x => !isNaN(x) || typeof x === 'string');

    // We only care about assessments linked to the VALID courses for this dept/term
    const allAssessments = await Assessment.find({
      termId: { $in: mixedTerms },
      course: { $in: activeCourseIds }
    }).select('facultyQuestions name type').lean();


    // --- STEP 3: In-Memory Aggregation ---

    // A. Count Courses Assigned (Active + Historical)

    // Strategy: 
    // If TermArchive exists, use that count. 
    // If not, check Active Courses (fallback for current term).
    // The previous logic was: if (archives > 0) use it; else check active.

    const archiveCounts = {}; // facultyId -> count
    allArchives.forEach(arch => {
      const fid = arch.facultyId.toString();
      archiveCounts[fid] = (archiveCounts[fid] || 0) + 1;
    });

    // Fallback Check: Is targetTerm == Current System Term?
    // We can just query SystemConfig or assume checked. 
    // Let's do the active course mapping anyway for fallback
    const activeCounts = {}; // facultyId -> Set(courseIds)
    activeCourses.forEach(c => {
      if (c.faculties && c.faculties.length) {
        c.faculties.forEach(f => {
          const fid = f.toString();
          if (!activeCounts[fid]) activeCounts[fid] = new Set();
          activeCounts[fid].add(c._id.toString());
        });
      }
      if (c.coordinator) {
        const cid = c.coordinator.toString();
        if (!activeCounts[cid]) activeCounts[cid] = new Set();
        activeCounts[cid].add(c._id.toString());
      }
    });

    // Apply Course Counts to Faculty Map
    facultyMap.forEach((stats, fid) => {
      if (archiveCounts[fid]) {
        stats.coursesCount = archiveCounts[fid];
      } else {
        // Fallback
        if (activeCounts[fid]) {
          stats.coursesCount = activeCounts[fid].size;
        }
      }
    });

    // B. Process Assessments for Stats
    allAssessments.forEach(assessment => {
      if (!assessment.facultyQuestions) return;

      assessment.facultyQuestions.forEach(fq => {
        const fid = fq.faculty.toString();
        const stats = facultyMap.get(fid);

        if (stats) { // Only count for faculties belonging to this Dept (or historicals found)

          // 1. Allotted CAs
          // Just existence in facultyQuestions implies allocation
          stats.allottedCAs.add(assessment._id.toString());

          // 2. Question Stats
          if (fq.sets) {
            fq.sets.forEach(set => {
              const qCount = set.questions ? set.questions.length : 0;
              stats.totalQuestionsCreated += qCount;

              const isApproved =
                set.hodStatus === 'Approved' ||
                set.hodStatus === 'Approved with Remarks';

              // Approved Logic: If set approved, all questions approved? 
              // Previous code checked: question.status === 'Approved'.
              // But here we don't have joined Questions. 
              // Approximation: If Set is Approved, count all.
              // If Set is NOT approved, we can't easily know indiv status without joining Question.
              // PERFORMANCE TRADEOFF: 
              // Joining 1000s of Questions is slow.
              // HOD Dashboard usually cares about "Set Level" approval or just rough numbers.
              // However, previous code `getDashboardStats` did NOT join questions.
              // WAIT. Previous code `getDashboardStats` returned:
              // totalQuestionsCreated: 0, approvedQuestions: 0
              // AND THEN `getDashboardStats` logic inside loop was NOT fully implemented in snippet?
              // Let's look at the snippet I replaced.
              // It had `const stats = await Promise.all(faculties.map...)`. 
              // AND THEN `assessments.forEach...` logic was MISSING/CUT OFF in the snippet view?
              // Actually, looking at previous `view_file` (Step 164), lines 1643...
              // It seemed to do `questionMetaMap` logic but that was `getQuestions` (MASTER FILTER).
              // `getDashboardStats` (Step 165) ended at line 1908.
              // It seemed to contain the loop but...

              // Let's do the Logic:
              // If Set is Approved, count all qs as approved.
              // If Set is Pending, 0 approved.
              // If Status is Submitted/Pending, count as Pending Review?

              if (isApproved) {
                stats.approvedQuestions += qCount;
              } else {
                // Not approved yet
              }

              // Pending Reviews Logic (Sets waiting for HOD)
              // If status is "Pending HOD Review" context?
              // The status in DB is `hodStatus`.
              // if hodStatus == 'Submitted' or 'Pending' (but coordinator Approved)?
              // Simplification: if hodStatus == 'submitted' -> 1 pending review.
              if (set.hodStatus === 'Submitted') {
                stats.pendingReviews++;
              }

              // "Pending Questions" usually means (Created - Approved) or (Submitted)?
              // In UI `pendingQuestions`: displayed as Badge.
              // The UI calculates `pendingQuestions` itself based on `pendingReviews`?
              // No, UI uses `s.pendingQuestions`.
              // Let's calculate `pendingQuestions` as Total - Approved.
              stats.pendingQuestions = stats.totalQuestionsCreated - stats.approvedQuestions;

            });
          }
        }
      });
    });

    // --- STEP 4: Final Formatting ---
    const finalStats = Array.from(facultyMap.values()).map(s => ({
      _id: s._id,
      name: s.name,
      uid: s.uid,
      coursesCount: s.coursesCount,
      allottedCAsCount: s.allottedCAs.size,
      allottedCAs: Array.from(s.allottedCAs),
      pendingReviews: s.pendingReviews,
      pendingQuestions: s.pendingQuestions,
      totalQuestionsCreated: s.totalQuestionsCreated,
      approvedQuestions: s.approvedQuestions
    }));

    // console.log(`[Stats Optimization] Time taken: ${Date.now() - start}ms`);
    res.status(200).json(finalStats);

  } catch (error) {
    console.error("Error in getDashboardStats:", error);
    res.status(500).json({ message: 'Server error', error });
  }
};

