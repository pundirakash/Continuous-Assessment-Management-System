const User = require('../models/User');
const Course = require('../models/Course');
const Assessment = require('../models/Assessment');
const Question = require('../models/Question');

exports.getFaculties = async (req, res) => {
  try {
    const faculties = await User.find({ role: ['Faculty', 'CourseCoordinator'] });
    res.status(200).json(faculties);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.getFacultiesByCourse = async (req, res) => {
  const { courseId } = req.params;
  try {
    const faculties = await User.find({ role: ['Faculty', 'CourseCoordinator'], courses: courseId }).populate('courses');
    res.status(200).json(faculties);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.getFacultiesByDepartment = async (req, res) => {
  const { department } = req.params;
  try {
    const faculties = await User.find({ role: ['Faculty', 'CourseCoordinator'], department });
    res.status(200).json(faculties);
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

    // Add the course to the faculty's courses
    faculty.courses.push(courseId);
    await faculty.save();

    // Add the faculty to the course's faculties
    course.faculties.push(facultyId);
    await course.save();

    res.status(200).json({ message: 'Course assigned successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.appointCoordinator = async (req, res) => {
  try {
    const { facultyId, courseId } = req.body;
    const faculty = await User.findById(facultyId);

    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    faculty.role = 'CourseCoordinator';
    faculty.course = courseId;
    await faculty.save();

    // Update the course to set the coordinator
    const course = await Course.findById(courseId);
    if (course) {
      course.coordinator = facultyId;
      await course.save();
    }

    res.status(200).json({ message: 'Coordinator appointed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.createAssessment = async (req, res) => {
  try {
    const { courseId, name, termId,type } = req.body;
    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
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

    // Add the assessment to the course's assessments
    course.assessments.push(assessment._id);
    await course.save();

    res.status(201).json({ message: 'Assessment created successfully for the course', assessment });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.reviewAssessment = async (req, res) => {
  try {
    const { id, facultyId } = req.params;
    const assessment = await Assessment.findOne({ _id: id, 'facultyQuestions.faculty': facultyId }).populate('facultyQuestions.questions');

    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    res.status(200).json(assessment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.createCourse = async (req, res) => {
  try {
    const { name, code } = req.body;
    const existingCourse = await Course.findOne({ code });

    if (existingCourse) {
      return res.status(400).json({ message: 'Course with this code already exists' });
    }

    const course = new Course({ name, code });
    await course.save();

    res.status(201).json({ message: 'Course created successfully', course });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.reviewAssessment = async (req, res) => {
  try {
    const { assessmentId, facultyId } = req.params;
    const assessment = await Assessment.findById(assessmentId).populate('facultyQuestions.questions');

    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    const facultyQuestions = assessment.facultyQuestions.find(fq => fq.faculty.equals(facultyId));

    if (!facultyQuestions) {
      return res.status(404).json({ message: 'No questions found for this faculty' });
    }

    res.status(200).json(facultyQuestions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.approveAssessment = async (req, res) => {
  try {
    const { assessmentId, facultyId } = req.params;
    const { status, remarks } = req.body;

    const assessment = await Assessment.findById(assessmentId);

    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    const facultyQuestions = assessment.facultyQuestions.find(fq => fq.faculty.equals(facultyId));

    if (!facultyQuestions) {
      return res.status(404).json({ message: 'No questions found for this faculty' });
    }

    facultyQuestions.status = status;
    facultyQuestions.remarks = remarks;
    await assessment.save();

    res.status(200).json({ message: 'Assessment reviewed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
