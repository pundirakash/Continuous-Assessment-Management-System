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
    const { assessmentId, setName, text, type, options, bloomLevel, courseOutcome, allotmentDate, submissionDate, maximumMarks, marks } = req.body;
    const assessment = await Assessment.findById(assessmentId);

    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    const facultyQuestions = assessment.facultyQuestions.find(fq => fq.faculty.equals(req.user.id));

    if (!facultyQuestions) {
      return res.status(403).json({ message: 'Not authorized to add questions to this assessment' });
    }

    let questionSet = facultyQuestions.sets.find(set => set.setName === setName);

    if (!questionSet) {
      questionSet = {
        setName,
        questions: [],
        allotmentDate,
        submissionDate,
        maximumMarks
      };
      facultyQuestions.sets.push(questionSet);
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

    questionSet.questions.push(question._id);
    await assessment.save();

    res.status(201).json({ message: 'Question added successfully', question });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error', error });
  }
};


exports.getQuestions = async (req, res) => {
  try {
    const { assessmentId, setName } = req.query;
    const assessment = await Assessment.findById(assessmentId).populate('facultyQuestions.sets.questions');

    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    const facultyQuestions = assessment.facultyQuestions.find(fq => fq.faculty.equals(req.user.id));

    if (!facultyQuestions) {
      return res.status(403).json({ message: 'Not authorized to view questions for this assessment' });
    }

    const questionSet = facultyQuestions.sets.find(set => set.setName === setName);

    if (!questionSet) {
      return res.status(404).json({ message: 'Question set not found' });
    }

    const populatedQuestions = await Question.find({ _id: { $in: questionSet.questions } });

    res.status(200).json(populatedQuestions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};


exports.submitAssessment = async (req, res) => {
  try {
    const { assessmentId, setName } = req.body;
    const assessment = await Assessment.findById(assessmentId);

    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    const facultyQuestions = assessment.facultyQuestions.find(fq => fq.faculty.equals(req.user.id));

    if (!facultyQuestions) {
      return res.status(403).json({ message: 'Not authorized to submit questions for this assessment' });
    }

    const questionSet = facultyQuestions.sets.find(set => set.setName === setName);

    if (!questionSet) {
      return res.status(404).json({ message: 'Question set not found' });
    }

    questionSet.status = 'Pending';
    await assessment.save();

    // Logic to notify HOD (e.g., send an email or notification)

    res.status(200).json({ message: 'Assessment set submitted successfully for review' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};


// Helper function to generate DOCX file
async function generateDocxFromTemplate(data) {
  try {
    const templateFilePath = path.resolve(__dirname, '../templates/template3.docx');
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

    const hodApproved = facultyQuestions.hodStatus === 'Approved' || facultyQuestions.hodStatus === 'Approved with Remarks';
    const coordinatorApproved = facultyQuestions.coordinatorStatus === 'Approved' || facultyQuestions.coordinatorStatus === 'Approved with Remarks';

    if (!hodApproved && !coordinatorApproved) {
      return res.status(403).json({ message: 'Assessment not approved by HOD or CourseCoordinator' });
    }

    // Prepare data for DOCX generation
    const data = {
      termId: assessment.termId,
      assessmentName: assessment.name,
      courseCode: assessment.course.code,
      allotmentDate: facultyQuestions.allotmentDate,
      courseName: assessment.course.name,
      submissionDate: facultyQuestions.submissionDate,
      maximumMarks: facultyQuestions.maximumMarks,
      taskType: assessment.type,  
      questions: await Promise.all(facultyQuestions.questions.map(async (questionId, index) => {
        const question = await Question.findById(questionId);
        return {
          number: index + 1,
          text: question.text,
          courseOutcome: question.courseOutcome,
          bloomLevel: question.bloomLevel,
          marks: question.marks,
          options: question.type === 'MCQ' ? question.options.map(option => ({ option })) : []
        };
      })),
    };

    const docxFilePath = await generateDocxFromTemplate(data);

    res.download(docxFilePath, `assessment_${assessmentId}.docx`);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error', error });
  }
};


