const User = require('../models/User');
const Course = require('../models/Course');
const Assessment = require('../models/Assessment');
const Question = require('../models/Question');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const multer = require('multer');
const ImageModule = require('docxtemplater-image-module-free');

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

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

exports.createQuestion = [
  upload.single('image'), 
  async (req, res) => {
    try {
      const { assessmentId, setName, text, type, options, bloomLevel, courseOutcome, marks } = req.body;
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
        marks,
        image: req.file ? req.file.path : null
      });

      await question.save();

      questionSet.questions.push(question._id);

      facultyQuestions.sets = facultyQuestions.sets.map(set => {
        if (set.setName === setName) {
          return questionSet;
        }
        return set;
      });
      
      await assessment.save();

      res.status(201).json({ message: 'Question added successfully', question });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: 'Server error', error });
    }
  }
];


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

    res.status(200).json({ message: 'Assessment set submitted successfully for review' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

async function generateDocxFromTemplate(data) {
  try {
    const templateFilePath = path.resolve(__dirname, '../templates/template3.docx');
    const outputDocxFilePath = path.resolve(__dirname, 'output.docx');

    const content = fs.readFileSync(templateFilePath, 'binary');
    const zip = new PizZip(content);

    const imageOpts = {
      centered: false,
      getImage: (tagValue) => fs.readFileSync(tagValue),
      getSize: (img, tagValue, tagName) => [150, 150], // Adjust size as needed
    };

    const imageModule = new ImageModule(imageOpts);

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      modules: [imageModule], // Add image module here
    });

    doc.setData(data);
    doc.render();

    const buffer = doc.getZip().generate({ type: 'nodebuffer' });
    fs.writeFileSync(outputDocxFilePath, buffer);

    return outputDocxFilePath;
  } catch (error) {
    console.error('Error generating DOCX file:', error);
    throw new Error(`Error generating DOCX file: ${error.message}`);
  }
}

exports.downloadAssessment = async (req, res) => {
  try {
    const { assessmentId, setName } = req.params;
    const assessment = await Assessment.findById(assessmentId)
      .populate('facultyQuestions.sets.questions')
      .populate('course');

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

    const allowedStatuses = ['Approved', 'Approved with Remarks'];
    if (
      !allowedStatuses.includes(questionSet.hodStatus) &&
      !allowedStatuses.includes(questionSet.coordinatorStatus)
    ) {
      return res.status(403).json({ message: 'Question set is not approved yet' });
    }

    const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

    const data = {
      termId: assessment.termId,
      assessmentName: assessment.name,
      courseCode: assessment.course.code,
      courseName: assessment.course.name,
      setName: questionSet.setName,
      questions: await Promise.all(questionSet.questions.map(async (questionId, index) => {
        const question = await Question.findById(questionId);
        return {
          number: index + 1,
          text: question.text,
          courseOutcome: question.courseOutcome,
          bloomLevel: question.bloomLevel,
          marks: question.marks,
          image: question.image ? path.resolve(__dirname, '../', question.image) : null, // Include image path
          options: question.type === 'MCQ' ? question.options.map((option, i) => ({ option: `${optionLetters[i]}. ${option}` })) : []
        };
      })),
    };

    const docxFilePath = await generateDocxFromTemplate(data);

    res.download(docxFilePath, `assessment_${assessmentId}_${setName}.docx`);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error', error });
  }
};




