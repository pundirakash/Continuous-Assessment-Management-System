const User = require('../models/User');
const Course = require('../models/Course');
const Assessment = require('../models/Assessment');

exports.getFaculties = async (req, res) => {
  try {
    const courseId = req.query.courseId;
    const coordinatorId = req.user.id;
    const course = await Course.findOne({ _id: courseId, coordinator: coordinatorId }).populate('faculties');

    if (!course) {
      return res.status(403).json({ message: 'Not authorized to view faculties for this course' });
    }

    res.status(200).json(course.faculties);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.createAssessment = async (req, res) => {
  try {
    const { courseId, name, termId, type, sets } = req.body; // Added 'sets' to the request body
    const coordinatorId = req.user.id;

    // Find the course where the logged-in user is the coordinator
    const course = await Course.findOne({ _id: courseId, coordinator: coordinatorId });

    if (!course) {
      return res.status(403).json({ message: 'Not authorized to create assessments for this course' });
    }

    const faculties = await User.find({ courses: courseId });

    const facultyQuestions = faculties.map(faculty => ({
      faculty: faculty._id,
      sets: Array.from({ length: sets }, () => ({ questions: [] })) // Initialize multiple sets
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

exports.getAssessments = async (req, res) => {
  try {
    const { courseId } = req.query;
    const coordinatorId = req.user.id;

    // Find the course where the logged-in user is the coordinator
    const course = await Course.findOne({ _id: courseId, coordinator: coordinatorId });

    if (!course) {
      return res.status(403).json({ message: 'Not authorized to view assessments for this course' });
    }

    const assessments = await Assessment.find({ course: courseId }).populate('facultyQuestions.faculty');
    res.status(200).json(assessments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.approveAssessment = async (req, res) => {
  try {
    const { assessmentId, facultyId } = req.params;
    const { status, remarks, setIndex } = req.body; // Added 'setIndex' to the request body
    const coordinatorId = req.user.id;

    // Find the assessment and populate the course
    const assessment = await Assessment.findById(assessmentId).populate('course');

    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    // Check if the logged-in user is the coordinator of the course related to this assessment
    if (!assessment.course.coordinator.equals(coordinatorId)) {
      return res.status(403).json({ message: 'Not authorized to approve assessments for this course' });
    }

    const facultyQuestions = assessment.facultyQuestions.find(fq => fq.faculty.equals(facultyId));

    if (!facultyQuestions) {
      return res.status(404).json({ message: 'No questions found for this faculty' });
    }

    // Update the specific set's status and remarks
    if (facultyQuestions.sets[setIndex]) {
      facultyQuestions.sets[setIndex].coordinatorStatus = status;
      facultyQuestions.sets[setIndex].coordinatorRemarks = remarks;
    } else {
      return res.status(400).json({ message: 'Invalid set index' });
    }

    await assessment.save();

    res.status(200).json({ message: 'Assessment reviewed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
