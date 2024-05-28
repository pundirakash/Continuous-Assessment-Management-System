const User = require('../models/User');
const Course = require('../models/Course');
const Assessment = require('../models/Assessment');

exports.getFaculties = async (req, res) => {
  try {
    const { courseId } = req.query;
    const course = await Course.findById(courseId).populate('faculty');
    res.status(200).json(course.faculty);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.createAssessment = async (req, res) => {
  try {
    const { courseId, createdBy } = req.body;
    const assessment = new Assessment({ course: courseId, createdBy });
    await assessment.save();
    res.status(201).json({ message: 'Assessment created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.getAssessments = async (req, res) => {
  try {
    const { courseId } = req.query;
    const assessments = await Assessment.find({ course: courseId }).populate('createdBy');
    res.status(200).json(assessments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.approveAssessment = async (req, res) => {
  try {
    const { assessmentId, approvalStatus, remarks } = req.body;
    const assessment = await Assessment.findById(assessmentId);

    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    assessment.approvedByCoordinator = approvalStatus;
    assessment.remarks = remarks;
    await assessment.save();

    res.status(200).json({ message: 'Assessment status updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
