const User = require('../models/User');
const Course = require('../models/Course');
const Assessment = require('../models/Assessment');
const Question = require('../models/Question');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

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
    const { assessmentId, text, type, options, bloomLevel, courseOutcome, allotmentDate, submissionDate, maximumMarks,marks } = req.body;
    const assessment = await Assessment.findById(assessmentId);

    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    const facultyQuestions = assessment.facultyQuestions.find(fq => fq.faculty.equals(req.user.id));

    if (!facultyQuestions) {
      return res.status(403).json({ message: 'Not authorized to add questions to this assessment' });
    }

    // Set the subfields if they are not already set
    if (!facultyQuestions.allotmentDate) {
      facultyQuestions.allotmentDate = allotmentDate;
    }
    if (!facultyQuestions.submissionDate) {
      facultyQuestions.submissionDate = submissionDate;
    }
    if (!facultyQuestions.maximumMarks) {
      facultyQuestions.maximumMarks = maximumMarks;
    }

    const question = new Question({
      assessment: assessmentId,
      text,
      type,
      options,
      bloomLevel,
      courseOutcome,
      marks
    });

    await question.save();

    facultyQuestions.questions.push(question._id);
    await assessment.save();

    res.status(201).json({ message: 'Question added successfully', question });
  } catch (error) {
    console.log(error);
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

// Helper function to generate DOCX file
async function generateDocxFromTemplate(data) {
  try {
    const templateFilePath = path.resolve(__dirname, 'template.docx');
    const outputDocxFilePath = path.resolve(__dirname, 'output.docx');

    const content = fs.readFileSync(templateFilePath, 'binary');
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    doc.setData(data);
    doc.render();

    const buffer = doc.getZip().generate({ type: 'nodebuffer' });
    fs.writeFileSync(outputDocxFilePath, buffer);

    return outputDocxFilePath;
  } catch (error) {
    throw new Error(`Error generating DOCX file: ${error.message}`);
  }
}

exports.downloadAssessment = async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const assessment = await Assessment.findById(assessmentId)
      .populate('facultyQuestions.questions')
      .populate('course');

    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    const facultyQuestions = assessment.facultyQuestions.find(fq => fq.faculty.equals(req.user.id));

    if (!facultyQuestions) {
      return res.status(403).json({ message: 'Not authorized to view questions for this assessment' });
    }

    if (facultyQuestions.status !== 'Approved' && facultyQuestions.status !== 'Approved with Remarks') {
      return res.status(403).json({ message: 'Assessment not approved by HOD' });
    }

    // Prepare data for DOCX generation
    const data = {
      assessmentName: assessment.name,
      courseCode: assessment.course.code,
      allotmentDate: facultyQuestions.allotmentDate,
      courseName: assessment.course.name,
      submissionDate: facultyQuestions.submissionDate,
      maximumMarks: facultyQuestions.maximumMarks,
      taskType: assessment.type,  // Assuming taskType is a field in the assessment model
      questions: facultyQuestions.questions.map((question, index) => ({
        number: index + 1,
        text: question.text,
        courseOutcome: question.courseOutcome,
        bloomLevel: question.bloomLevel,
        marks: question.marks,
      })),
    };

    const docxFilePath = await generateDocxFromTemplate(data);

    res.download(docxFilePath, `assessment_${assessmentId}.docx`);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
