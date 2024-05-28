const User = require('../models/User');
const Course = require('../models/Course');
const Assessment = require('../models/Assessment');
const Question = require('../models/Question');
const PDFDocument = require('pdfkit');

exports.getCourses = async (req, res) => {
  try {
    const faculty = await User.findById(req.user.id).populate('courses');
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }
    res.status(200).json(faculty.courses);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.createQuestion = async (req, res) => {
  try {
    const { assessmentId, text, type, options, bloomLevel, courseOutcome } = req.body;
    const assessment = await Assessment.findById(assessmentId);

    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    const facultyQuestions = assessment.facultyQuestions.find(fq => fq.faculty.equals(req.user.id));

    if (!facultyQuestions) {
      return res.status(403).json({ message: 'Not authorized to add questions to this assessment' });
    }

    const question = new Question({
      assessment: assessmentId,
      text,
      type,
      options,
      bloomLevel,
      courseOutcome
    });

    await question.save();

    facultyQuestions.questions.push(question._id);
    await assessment.save();

    res.status(201).json({ message: 'Question added successfully', question });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.getQuestions = async (req, res) => {
  try {
    const { assessmentId } = req.query;
    const assessment = await Assessment.findById(assessmentId).populate('facultyQuestions.questions');

    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    const facultyQuestions = assessment.facultyQuestions.find(fq => fq.faculty.equals(req.user.id));

    if (!facultyQuestions) {
      return res.status(403).json({ message: 'Not authorized to view questions for this assessment' });
    }

    const populatedQuestions = await Question.find({ _id: { $in: facultyQuestions.questions } });

    res.status(200).json(populatedQuestions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.submitAssessment = async (req, res) => {
  try {
    const { assessmentId } = req.body;
    const assessment = await Assessment.findById(assessmentId);

    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    const facultyQuestions = assessment.facultyQuestions.find(fq => fq.faculty.equals(req.user.id));

    if (!facultyQuestions) {
      return res.status(403).json({ message: 'Not authorized to submit questions for this assessment' });
    }

    facultyQuestions.status = 'Pending';
    await assessment.save();

    // Logic to notify HOD (e.g., send an email or notification)

    res.status(200).json({ message: 'Assessment submitted successfully for review' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.downloadAssessment = async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const assessment = await Assessment.findById(assessmentId).populate('facultyQuestions.questions');

    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    const facultyQuestions = assessment.facultyQuestions.find(fq => fq.faculty.equals(req.user.id));

    if (!facultyQuestions) {
      return res.status(403).json({ message: 'Not authorized to view questions for this assessment' });
    }

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=assessment_${assessmentId}.pdf`);

    doc.pipe(res);

    facultyQuestions.questions.forEach((question, index) => {
      doc.text(`${index + 1}. ${question.text}`);
      if (question.type === 'MCQ' && question.options.length) {
        question.options.forEach((option, optIndex) => {
          doc.text(`  ${String.fromCharCode(65 + optIndex)}. ${option}`);
        });
      }
      doc.moveDown();
    });

    doc.end();
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
