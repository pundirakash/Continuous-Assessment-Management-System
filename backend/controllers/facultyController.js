const User = require('../models/User');
const Course = require('../models/Course');
const Assessment = require('../models/Assessment');
const Question = require('../models/Question');
const path = require('path');
const fs = require('fs');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const moment = require('moment');
const multer = require('multer');
const storage = multer.memoryStorage();
const ImageModule = require('docxtemplater-image-module-free');
const archiver = require('archiver');
const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');
const XLSX = require('xlsx');
dotenv.config();

cloudinary.config({
  cloud_name: `${process.env.CLOUD_NAME}`,
  api_key: `${process.env.API_KEY_CLOUD}`,
  api_secret: `${process.env.API_SECRET_CLOUD}`,
});


const TermArchive = require('../models/TermArchive');
const SystemConfig = require('../models/SystemConfig');

exports.getCourses = async (req, res) => {
  try {
    const { termId } = req.query;
    let targetTerm = termId;

    // If termId is not provided, fetch current term from system config
    // Scope by HOD's universityId
    const configFilter = { key: 'currentTerm' };
    if (req.user.universityId) configFilter.universityId = req.user.universityId;

    let config;
    if (!targetTerm) {
      config = await SystemConfig.findOne(configFilter);
      targetTerm = config ? config.value : '24252';
    }

    // Get current system term to compare
    if (!config) config = await SystemConfig.findOne(configFilter);
    const currentSystemTerm = config ? config.value : '24252';

    if (targetTerm === currentSystemTerm) {
      // Active Term: Return current courses from User model, but FILTER by activeTerms
      const faculty = await User.findById(req.user.id).populate({
        path: 'courses',
        match: {
          isDeleted: { $ne: true },
          $or: [
            { activeTerms: { $in: [String(targetTerm)] } },
            { activeTerms: { $exists: false } }, // Legacy support
            { activeTerms: { $size: 0 } }        // Legacy support
          ]
        },
        populate: [
          { path: 'coordinator', select: 'name email role uid' },
          { path: 'faculties', select: 'name email role uid' }
        ]
      });
      if (!faculty) {
        return res.status(404).json({ message: 'Faculty not found' });
      }
      return res.status(200).json(faculty.courses);
    } else {
      // Archived Term: Fetch from TermArchive
      const archives = await TermArchive.find({
        termId: targetTerm,
        facultyId: req.user.id
      }).populate('courseId');

      // Extract courses from archives
      const courses = archives.map(a => a.courseId).filter(c => c !== null);
      return res.status(200).json(courses);
    }

  } catch (error) {
    console.error("Error in getCourses:", error);
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.getAssignments = async (req, res) => {
  try {
    const { courseId, termId } = req.query;

    const configFilter = { key: 'currentTerm' };
    if (req.user.universityId) configFilter.universityId = req.user.universityId;

    let targetTerm = termId;
    let config;
    if (!targetTerm) {
      config = await SystemConfig.findOne(configFilter);
      targetTerm = config ? config.value : '24252';
    }

    // Get current system term to compare for legacy data handling
    if (!config) config = await SystemConfig.findOne(configFilter);
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

exports.getSetsForAssessment = async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    const facultyQuestions = assessment.facultyQuestions.find(fq => fq.faculty.equals(req.user.id));
    if (!facultyQuestions) {
      return res.status(403).json({ message: 'Not authorized to view sets for this assessment' });
    }

    res.status(200).json(facultyQuestions.sets);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.getQuestionsForSet = async (req, res) => {
  try {
    const { assessmentId, setName } = req.params;
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

    if (questionSet.questions.length === 0) {
      questionSet.hodStatus = 'Pending';
      await assessment.save();
      return res.status(200).json([]);
    }

    const populatedQuestions = await Question.find({ _id: { $in: questionSet.questions } });

    const allApproved = populatedQuestions.every(question => question.status === 'Approved');

    if (allApproved) {
      questionSet.hodStatus = 'Approved with Remarks';
      await assessment.save();
    }

    res.status(200).json(populatedQuestions);
  } catch (error) {
    console.error('Error fetching questions for set', error);
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

    if (!questionSet.questions || questionSet.questions.length === 0) {
      return res.status(400).json({ message: 'Cannot submit an empty question set' });
    }

    // Special rule for MCQ: Minimum 30 questions
    const minRequired = assessment.type === 'MCQ' ? Math.max(30, questionSet.totalQuestions || 0) : (questionSet.totalQuestions || 0);

    if (questionSet.questions.length < minRequired) {
      return res.status(400).json({
        message: assessment.type === 'MCQ'
          ? `MCQ sets must have at least 30 questions for vetting. You have only ${questionSet.questions.length}.`
          : `You must add at least ${questionSet.totalQuestions} questions to submit this assessment`
      });
    }

    await Question.updateMany(
      { _id: { $in: questionSet.questions } },
      { $set: { status: 'Submitted' } }
    );

    questionSet.hodStatus = 'Submitted';
    questionSet.submissionDate = new Date();

    // Log Activity
    questionSet.activityLog.push({
      action: 'Submitted',
      userId: req.user.id,
      details: `Submitted ${questionSet.questions.length} questions for review`
    });

    await assessment.save();

    res.status(200).json({ message: 'Assessment set submitted successfully for review' });
  } catch (error) {
    console.error('Error submitting assessment', error);
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

    // Generate the file buffer instead of writing it to disk
    const buffer = doc.getZip().generate({ type: 'nodebuffer' });

    return buffer;
  } catch (error) {
    console.error('Error generating DOCX file:', error);
    throw new Error(`Error generating DOCX file: ${error.message}`);
  }
}

exports.downloadAssessment = async (req, res) => {
  try {
    const { assessmentId, setName, templateNumber } = req.params;
    const { universityId } = req.user;
    const assessment = await Assessment.findById(assessmentId)
      .populate({
        path: 'course',
        select: 'name code universityId schoolId departmentId department'
      })
      .populate('facultyQuestions.sets.questions');

    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    // AUTH CHECK: Ensure University matches
    if (universityId && assessment.course.universityId?.toString() !== universityId.toString()) {
      return res.status(403).json({ message: 'Not authorized: University mismatch' });
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
    const sanitizeText = (text) => {
      return text.replace(/[\r\n]+/g, ' ').trim();
    };
    const data = {
      termId: assessment.termId,
      assessmentName: assessment.name,
      courseCode: assessment.course.code,
      courseName: assessment.course.name,
      setName: questionSet.setName,
      taskType: assessment.type,
      allotmentDate: moment(questionSet.allotmentDate).format('DD/MM/YYYY'),
      submissionDate: moment(questionSet.submissionDate).format('DD/MM/YYYY'),
      maximumMarks: questionSet.maximumMarks,
      questions: await Promise.all(questionSet.questions.map(async (questionId, index) => {
        const question = await Question.findById(questionId);
        return {
          number: index + 1,
          text: sanitizeText(question.text),
          courseOutcome: question.courseOutcome,
          bloomLevel: question.bloomLevel,
          marks: question.marks,
          image: question.image ? path.resolve(__dirname, '../', question.image) : null,
          options: question.type === 'MCQ' ? question.options.map((option, i) => ({ option: `${optionLetters[i]}. ${option}` })) : []
        };
      })),
    };

    const docxBuffer = await generateDocxFromTemplate(data, templateNumber);

    // Log Activity
    questionSet.activityLog.push({
      action: 'Downloaded',
      userId: req.user.id,
      details: `Downloaded Assessment (Template ${templateNumber})`
    });
    await assessment.save();

    // Set headers to indicate a file download
    res.setHeader('Content-Disposition', `attachment; filename="assessment_${assessmentId}_${setName}.docx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

    // Send the file buffer directly to the client
    res.send(docxBuffer);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.downloadSolution = async (req, res) => {
  try {
    const { assessmentId, setName, templateNumber } = req.params;
    const { universityId } = req.user;
    const assessment = await Assessment.findById(assessmentId)
      .populate({
        path: 'course',
        select: 'name code universityId schoolId departmentId department'
      })
      .populate('facultyQuestions.sets.questions');

    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    // AUTH CHECK: Ensure University matches
    if (universityId && assessment.course.universityId?.toString() !== universityId.toString()) {
      return res.status(403).json({ message: 'Not authorized: University mismatch' });
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
    const sanitizeText = (text) => {
      return text.replace(/[\r\n]+/g, ' ').trim();
    };
    const data = {
      termId: assessment.termId,
      assessmentName: assessment.name,
      courseCode: assessment.course.code,
      courseName: assessment.course.name,
      setName: questionSet.setName,
      taskType: assessment.type,
      allotmentDate: moment(questionSet.allotmentDate).format('DD/MM/YYYY'),
      submissionDate: moment(questionSet.submissionDate).format('DD/MM/YYYY'),
      maximumMarks: questionSet.maximumMarks,
      questions: await Promise.all(questionSet.questions.map(async (questionId, index) => {
        const question = await Question.findById(questionId);
        return {
          number: index + 1,
          text: sanitizeText(question.text),
          solution: sanitizeText(question.solution),
          marks: question.marks,
        };
      })),
    };

    const docxBuffer = await generateDocxFromTemplate(data, templateNumber);

    // Log Activity
    questionSet.activityLog.push({
      action: 'Downloaded',
      userId: req.user.id,
      details: `Downloaded Solution (Template ${templateNumber})`
    });
    await assessment.save();

    // Set headers to indicate a file download
    res.setHeader('Content-Disposition', `attachment; filename="solution_${assessmentId}_${setName}.docx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

    // Send the file buffer directly to the client
    res.send(docxBuffer);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.downloadRandomApprovedQuestions = async (req, res) => {
  try {
    const { assessmentId, numberOfQuestions, setName } = req.body;
    const userId = req.user.id;
    const { universityId, schoolId } = req.user;

    // Fetch the assessment and populate necessary fields in a single query
    const assessment = await Assessment.findById(assessmentId)
      .populate({
        path: 'course',
        select: 'name code universityId schoolId departmentId department'
      })
      .populate('facultyQuestions.sets.questions');

    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    // AUTH CHECK: Ensure University/School matches
    if (universityId && assessment.course.universityId?.toString() !== universityId.toString()) {
      return res.status(403).json({ message: 'Not authorized: University mismatch' });
    }


    // Find the faculty questions for the current user
    const facultyQuestions = assessment.facultyQuestions.find(fq => fq.faculty.equals(userId));
    if (!facultyQuestions) {
      return res.status(403).json({ message: 'Not authorized to view questions for this assessment' });
    }

    const questionSet = facultyQuestions.sets.find(set => set.setName === setName);
    if (!questionSet) {
      return res.status(404).json({ message: 'Question set not found' });
    }

    // Check if enough questions have been uploaded
    const uploadedQuestionsCount = facultyQuestions.sets.reduce((count, set) => count + set.questions.length, 0);
    if (uploadedQuestionsCount < numberOfQuestions) {
      return res.status(403).json({ message: 'You have not uploaded enough questions to download this many questions' });
    }

    // Fetch all question IDs in a single batch operation
    const questionIds = assessment.facultyQuestions.flatMap(fq => fq.sets.flatMap(set => set.questions));

    // Fetch approved questions in one query
    const approvedQuestions = await Question.find({
      _id: { $in: questionIds },
      status: 'Approved'
    });

    if (approvedQuestions.length < numberOfQuestions) {
      return res.status(400).json({ message: 'Not enough approved questions available' });
    }

    // Shuffle and select the required number of questions
    const shuffleArray = (array) => array.sort(() => Math.random() - 0.5);
    const selectedQuestions = shuffleArray(approvedQuestions).slice(0, numberOfQuestions);

    // Prepare data for DOCX generation
    const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    const sanitizeText = (text) => text.replace(/[\r\n]+/g, ' ').trim();

    const data = {
      termId: assessment.termId,
      assessmentName: assessment.name,
      courseCode: assessment.course.code,
      courseName: assessment.course.name,
      setName: `Random_${numberOfQuestions}_Questions`,
      taskType: assessment.type,
      allotmentDate: moment(questionSet.allotmentDate).format('DD/MM/YYYY'),
      submissionDate: moment(questionSet.submissionDate).format('DD/MM/YYYY'),
      maximumMarks: questionSet.maximumMarks,
      questions: selectedQuestions.map((question, index) => ({
        number: index + 1,
        text: sanitizeText(question.text),
        courseOutcome: question.courseOutcome,
        bloomLevel: question.bloomLevel,
        marks: question.marks,
        image: question.image ? path.resolve(__dirname, '../', question.image) : null,
        options: question.type === 'MCQ' ? question.options.map((option, i) => ({ option: `${optionLetters[i]}. ${option}` })) : []
      }))
    };

    const solutionData = {
      ...data,
      questions: selectedQuestions.map((question, index) => ({
        number: index + 1,
        text: sanitizeText(question.text),
        solution: sanitizeText(question.solution),
        marks: question.marks,
      }))
    };

    // Generate DOCX files concurrently
    const [docxBuffer1, docxBuffer2, docxBuffer3] = await Promise.all([
      generateDocxFromTemplate(data, 1),
      generateDocxFromTemplate(data, assessment.type === 'MCQ' ? 3 : 4),
      generateDocxFromTemplate(solutionData, 5)
    ]);

    // Stream the ZIP file directly to the client
    const archive = archiver('zip', { zlib: { level: 9 } });
    res.attachment(`assessment_${data.assessmentName}_random_${numberOfQuestions}.zip`);

    archive.on('error', (err) => {
      console.error('Error creating archive', err);
      res.status(500).json({ message: 'Error creating ZIP archive', error: err });
    });

    // Pipe archive stream to response
    archive.pipe(res);

    // Append buffers to archive
    archive.append(docxBuffer1, { name: `CourseFileFormat_${data.assessmentName}_random_${numberOfQuestions}_1.docx` });
    archive.append(docxBuffer2, { name: `assessment_${data.assessmentName}_random_${numberOfQuestions}_${assessment.type === 'MCQ' ? 3 : 4}.docx` });
    archive.append(docxBuffer3, { name: `solution_${data.assessmentName}_random_${numberOfQuestions}_5.docx` });

    // Log Activity
    questionSet.activityLog.push({
      action: 'Downloaded',
      userId: req.user.id,
      details: `Downloaded Random Set (${numberOfQuestions} Questions)`
    });
    await assessment.save();

    await archive.finalize();
  } catch (error) {
    console.error('Error downloading random questions', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    req.fileValidationError = 'Only image files are allowed';
    cb(null, false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 500 * 1024 }, // 500KB limit
}).single('image');

const uploadToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'question_images',
        public_id: `${Date.now()}-${file.originalname}`,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          console.log(error);
          reject(new Error('Failed to upload image to Cloudinary'));
        } else {
          resolve(result.secure_url);
        }
      }
    );
    uploadStream.end(file.buffer);
  });
};

exports.createQuestion = [
  (req, res, next) => {
    upload(req, res, function (err) {
      if (req.fileValidationError) {
        return res.status(400).json({ message: req.fileValidationError });
      } else if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'File size should not exceed 500KB' });
        }
        return res.status(400).json({ message: err.message });
      } else if (err) {
        return res.status(500).json({ message: 'An unknown error occurred during file upload' });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      const { assessmentId, setName, text, type, bloomLevel, courseOutcome, marks, solution, options } = req.body;

      const existingQuestion = await Question.findOne({ text });
      if (existingQuestion) {
        return res.status(400).json({ message: 'A question with this text already exists' });
      }

      const assessment = await Assessment.findById(assessmentId);
      if (!assessment) {
        return res.status(404).json({ message: 'Assessment not found' });
      }

      if (type !== assessment.type) {
        return res.status(400).json({ message: `Question type must be ${assessment.type} for this assessment` });
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

      if (facultyQuestions.sets.length > 0 && facultyQuestions.sets[0].hodStatus === 'Approved') {
        facultyQuestions.sets[0].hodStatus = 'Pending';
      }

      let imageUrl = null;
      if (req.file) {
        imageUrl = await uploadToCloudinary(req.file);  // Wait for the image URL
      }

      const question = new Question({
        assessment: assessmentId,
        text,
        type,
        options,
        bloomLevel,
        courseOutcome,
        marks,
        image: imageUrl,
        solution,
        status: 'Pending'
      });

      await question.save();

      questionSet.questions.push(question._id);
      questionSet.hodStatus = "Pending";
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

exports.deleteQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const userId = req.user.id;

    const assessment = await Assessment.findOne({
      'facultyQuestions.sets.questions': questionId,
      'facultyQuestions.faculty': userId
    });

    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found or you do not have permission to delete this question' });
    }

    const facultyQuestions = assessment.facultyQuestions.find(fq => fq.faculty.equals(userId));
    const questionSet = facultyQuestions.sets.find(set => set.questions.includes(questionId));

    if (!questionSet) {
      return res.status(404).json({ message: 'Question set not found' });
    }

    // Check if hodStatus is 'Approved' or 'Approved with Remarks'
    if (['Approved', 'Approved with Remarks'].includes(questionSet.hodStatus)) {
      return res.status(403).json({ message: 'Question cannot be deleted because the set is approved or approved with remarks' });
    }

    questionSet.questions = questionSet.questions.filter(qId => qId.toString() !== questionId);

    await assessment.save();

    const question = await Question.findById(questionId);

    // Delete the image from Cloudinary if it exists
    if (question.image) {
      const urlParts = question.image.split('/');
      const fileName = urlParts.pop();  // Extract the file name with extension
      const folderPath = urlParts.slice(7).join('/');  // Extract the folder path from URL
      const publicId = `${folderPath}/${fileName.split('.').slice(0, -1).join('.')}`;  // Remove the file extension

      await cloudinary.uploader.destroy(publicId, function (error, result) {
        if (error) {
          console.error('Error deleting image from Cloudinary:', error);
        } else {
          console.log('Image deleted from Cloudinary:', result);
        }
      });
    }

    await Question.deleteOne({ _id: questionId });

    res.status(200).json({ message: 'Question deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};


exports.editQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { text, type, options, bloomLevel, courseOutcome, marks, solution } = req.body;
    const userId = req.user.id;

    const assessment = await Assessment.findOne({
      'facultyQuestions.faculty': userId,
      'facultyQuestions.sets.questions': questionId
    });

    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found or you do not have permission to edit this question' });
    }

    const facultyQuestions = assessment.facultyQuestions.find(fq => fq.faculty.equals(userId));

    if (!facultyQuestions) {
      return res.status(404).json({ message: 'Faculty questions not found' });
    }

    let questionSet;
    for (const set of facultyQuestions.sets) {
      if (set.questions.includes(questionId)) {
        questionSet = set;
        break;
      }
    }
    if (!questionSet) {
      return res.status(404).json({ message: 'Question set not found' });
    }

    const question = await Question.findById(questionId);

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    question.text = text || question.text;
    question.type = type || question.type;
    question.options = options || question.options;
    question.bloomLevel = bloomLevel || question.bloomLevel;
    question.courseOutcome = courseOutcome || question.courseOutcome;
    question.marks = marks || question.marks;
    question.solution = solution || question.solution;

    await question.save();

    res.status(200).json({ message: 'Question updated successfully', question });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.createSet = async (req, res) => {
  const { assessmentId, setName } = req.body;

  try {
    const assessment = await Assessment.findById(assessmentId);

    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    const facultyQuestions = assessment.facultyQuestions.find(fq => fq.faculty.equals(req.user.id));
    if (!facultyQuestions) {
      return res.status(403).json({ message: 'Not authorized to add sets to this assessment' });
    }

    const newSet = {
      setName,
      questions: [],
      hodStatus: 'Pending',
      coordinatorStatus: 'Pending',
      allotmentDate: new Date(),
      activityLog: [{
        action: 'Created',
        userId: req.user.id,
        details: `Set ${setName} created`
      }]
    };

    facultyQuestions.sets.push(newSet);

    await assessment.save();

    res.status(201).json({ message: 'Set created successfully', newSet });
  } catch (error) {
    console.error('Error creating set', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.deleteSet = async (req, res) => {
  const { assessmentId, facultyId, setName } = req.params;

  try {
    const assessment = await Assessment.findById(assessmentId);

    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    const targetFacultyId = (facultyId === 'undefined' || !facultyId) ? req.user.id : facultyId;

    const facultyQuestions = assessment.facultyQuestions.find(fq => fq.faculty.equals(targetFacultyId));
    if (!facultyQuestions) {
      console.log(`Delete Set Error: No workload found for faculty ${targetFacultyId} in assessment ${assessmentId}`);
      return res.status(404).json({ message: 'No questions found for this faculty' });
    }

    const setIndex = facultyQuestions.sets.findIndex(set => set.setName === setName);
    if (setIndex === -1) {
      return res.status(404).json({ message: 'Set not found' });
    }

    const setToDelete = facultyQuestions.sets[setIndex];

    // Check if the set is already approved
    if (['Approved', 'Approved with Remarks'].includes(setToDelete.hodStatus)) {
      return res.status(403).json({ message: 'Approved sets cannot be deleted' });
    }

    facultyQuestions.sets.splice(setIndex, 1);

    await Question.deleteMany({ _id: { $in: setToDelete.questions } });

    await assessment.save();

    res.status(200).json({ message: 'Set deleted successfully' });
  } catch (error) {
    console.error('Error deleting set', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.updateSetDetails = async (req, res) => {
  try {
    const { assessmentId, setName } = req.params;
    const { allotmentDate, submissionDate, maximumMarks, totalQuestions } = req.body;

    const assessment = await Assessment.findById(assessmentId);

    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    const facultyQuestions = assessment.facultyQuestions.find(fq => fq.faculty.equals(req.user.id));
    if (!facultyQuestions) {
      return res.status(403).json({ message: 'Not authorized to update sets for this assessment' });
    }

    const questionSet = facultyQuestions.sets.find(set => set.setName === setName);
    if (!questionSet) {
      return res.status(404).json({ message: 'Question set not found' });
    }

    questionSet.allotmentDate = allotmentDate;
    questionSet.submissionDate = submissionDate;
    questionSet.maximumMarks = maximumMarks;
    questionSet.totalQuestions = totalQuestions;

    await assessment.save();

    res.status(200).json({ message: 'Assessment set updated successfully' });
  } catch (error) {
    console.error('Error updating assessment set details', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.getSetDetails = async (req, res) => {
  const { assessmentId, setName } = req.params;

  try {
    const assessment = await Assessment.findById(assessmentId);

    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    const facultyQuestions = assessment.facultyQuestions.find(fq => fq.faculty.equals(req.user.id));
    if (!facultyQuestions) {
      return res.status(403).json({ message: 'Not authorized to access this assessment' });
    }

    const questionSet = facultyQuestions.sets.find(set => set.setName === setName);
    if (!questionSet) {
      return res.status(404).json({ message: 'Question set not found' });
    }

    res.status(200).json(questionSet);
  } catch (error) {
    console.error('Error fetching assessment set details', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.getFacultyStats = async (req, res) => {
  try {
    const { termId } = req.query;
    const userId = req.user.id;
    // 1. Get Courses Count - FILTER by activeTerms
    const user = await User.findById(userId).populate({
      path: 'courses',
      match: {
        isDeleted: { $ne: true },
        $or: [
          { activeTerms: { $in: [String(termId)] } },
          { activeTerms: { $exists: false } },
          { activeTerms: { $size: 0 } }
        ]
      }
    });
    const totalCourses = user.courses ? user.courses.length : 0;

    // 2. Get Assessments & Question/Set Stats
    const assessments = await Assessment.find({ termId: termId, 'facultyQuestions.faculty': userId }).populate('course');

    const uniqueQuestionIds = new Set();

    let approvedSets = 0;
    let pendingSets = 0;
    let rejectedSets = 0;
    let totalSets = 0;

    assessments.forEach(assessment => {
      if (!assessment.course) return;

      const myWorkload = assessment.facultyQuestions.find(fq => fq.faculty.equals(userId));
      if (myWorkload && myWorkload.sets) {
        myWorkload.sets.forEach(set => {
          totalSets++;

          if (set.questions && Array.isArray(set.questions)) {
            set.questions.forEach(qId => uniqueQuestionIds.add(qId.toString()));
          }

          if (['Approved', 'Approved with Remarks'].includes(set.hodStatus)) {
            approvedSets++;
          } else if (set.hodStatus === 'Rejected') {
            rejectedSets++;
          } else {
            pendingSets++;
          }
        });
      }
    });

    const totalQuestions = uniqueQuestionIds.size;

    // 3. Gamification Logic
    // XP Calculation:
    // - 50 XP per Approved Set
    // - 10 XP per Question Created
    // - 5 XP per Pending Set (Encouragement)
    const xp = (approvedSets * 50) + (totalQuestions * 10) + (pendingSets * 5);

    let rank = "Novice";
    let rankIcon = "🌱";
    let nextRankXP = 500;

    if (xp >= 500) { rank = "Contributor"; rankIcon = "✏️"; nextRankXP = 1500; }
    if (xp >= 1500) { rank = "Specialist"; rankIcon = "🎓"; nextRankXP = 3000; }
    if (xp >= 3000) { rank = "Expert"; rankIcon = "🚀"; nextRankXP = 5000; }
    if (xp >= 5000) { rank = "Master"; rankIcon = "⭐"; nextRankXP = 10000; }
    if (xp >= 10000) { rank = "Legend"; rankIcon = "👑"; nextRankXP = Math.floor(xp * 1.5); }

    const progress = Math.min(100, Math.floor((xp / nextRankXP) * 100));

    res.json({
      stats: {
        totalCourses,
        totalQuestions,
        totalSets,
        approvedSets,
        pendingSets,
        rejectedSets
      },
      gamification: {
        xp,
        rank,
        rankIcon,
        progress,
        nextRankXP
      }
    });

  } catch (error) {
    console.error("Stats Error", error);
    res.status(500).json({ message: "Failed to fetch stats", error });
  }
};


exports.getNotifications = async (req, res) => {
  try {
    const faculty = await User.findById(req.user.id);
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    res.status(200).json(faculty.notifications);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.markNotificationsRead = async (req, res) => {
  try {
    const faculty = await User.findById(req.user.id);
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    faculty.notifications.forEach(n => {
      n.read = true;
    });

    await faculty.save();
    res.status(200).json({ message: 'Notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};



exports.downloadImportTemplate = async (req, res) => {
  try {
    const data = [
      {
        'Question Text': 'What is the capital of France?',
        'Question Type': 'MCQ',
        'Option A': 'Paris',
        'Option B': 'London',
        'Option C': 'Berlin',
        'Option D': 'Madrid',
        'Marks': 1,
        'Bloom Level': 'L1: Remember',
        'Course Outcome': 'CO1',
        'Solution': 'Paris'
      },
      {
        'Question Text': 'Explain the process of photosynthesis.',
        'Question Type': 'Subjective',
        'Option A': '',
        'Option B': '',
        'Option C': '',
        'Option D': '',
        'Marks': 5,
        'Bloom Level': 'L2: Understand',
        'Course Outcome': 'CO2',
        'Solution': 'Photosynthesis is the process by which plants use sunlight...'
      }
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Questions Template');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename=PrashnaMitra_Bulk_Import_Template.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (error) {
    console.error('Template logic failed', error);
    res.status(500).json({ message: 'Failed to generate template' });
  }
};

exports.bulkImportQuestions = async (req, res) => {
  try {
    const { assessmentId, setName } = req.body;
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) return res.status(404).json({ message: 'Assessment not found' });

    const facultyQuestions = assessment.facultyQuestions.find(fq => fq.faculty.equals(req.user.id));
    if (!facultyQuestions) return res.status(403).json({ message: 'Not authorized' });

    let questionSet = facultyQuestions.sets.find(set => set.setName === setName);
    if (!questionSet) {
      questionSet = { setName, questions: [], hodStatus: 'Pending' };
      facultyQuestions.sets.push(questionSet);
    }

    if (['Approved', 'Approved with Remarks'].includes(questionSet.hodStatus)) {
      return res.status(403).json({ message: 'Cannot add questions to an approved set' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const batchId = `${Date.now()}-${req.user.id}`;
    const importedQuestions = [];
    const errors = [];

    const normalizedData = data.map(row => {
      const newRow = {};
      Object.keys(row).forEach(key => {
        newRow[key.trim().toLowerCase()] = row[key];
      });
      return newRow;
    });

    for (const [index, row] of normalizedData.entries()) {
      // Map using normalized lowercase keys
      const qText = row['question text'];
      const qType = row['question type'];
      const marks = row['marks'];
      const bloom = row['bloom level'];
      const co = row['course outcome'];
      const solution = row['solution'];

      if (!qText || !qType || !marks || !bloom || !co) {
        console.warn(`Row ${index + 1} Skipped - Missing Fields. Found:`, Object.keys(row));
        errors.push(`Row ${index + 1}: Missing required fields (Question Text, Type, Marks, Bloom, CO)`);
        continue;
      }

      if (qType !== assessment.type) {
        errors.push(`Row ${index + 1}: Invalid question type "${qType}". Must be "${assessment.type}".`);
        continue;
      }

      const existing = await Question.findOne({ text: qText });
      if (existing) {
        errors.push(`Row ${index + 1}: Question text already exists in database`);
        continue;
      }

      const options = [];
      if (qType === 'MCQ') {
        if (row['option a']) options.push(row['option a']);
        if (row['option b']) options.push(row['option b']);
        if (row['option c']) options.push(row['option c']);
        if (row['option d']) options.push(row['option d']);
      }

      const question = new Question({
        assessment: assessmentId,
        text: qText,
        type: qType,
        options,
        bloomLevel: bloom,
        courseOutcome: co,
        marks,
        solution,
        status: 'Pending',
        batchId
      });

      importedQuestions.push(question);
    }

    if (importedQuestions.length === 0) {
      return res.status(400).json({ message: 'No valid questions found to import', errors });
    }

    const savedQuestions = await Question.insertMany(importedQuestions);
    const questionIds = savedQuestions.map(q => q._id);

    questionSet.questions.push(...questionIds);
    questionSet.hodStatus = 'Pending';

    questionSet.activityLog.push({
      action: 'Bulk Imported',
      userId: req.user.id,
      details: `Imported ${savedQuestions.length} questions`
    });

    await assessment.save();

    res.status(200).json({
      message: `Successfully imported ${savedQuestions.length} questions`,
      errors,
      batchId
    });

  } catch (error) {
    console.error('Bulk Import Error', error);
    res.status(500).json({ message: 'Import failed', error: error.message });
  }
};

exports.undoBulkImport = async (req, res) => {
  try {
    const { assessmentId, setName } = req.body;
    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) return res.status(404).json({ message: 'Assessment not found' });

    const facultyQuestions = assessment.facultyQuestions.find(fq => fq.faculty.equals(req.user.id));
    if (!facultyQuestions) return res.status(403).json({ message: 'Not authorized' });

    const questionSet = facultyQuestions.sets.find(set => set.setName === setName);
    if (!questionSet) return res.status(404).json({ message: 'Set not found' });

    if (['Approved', 'Approved with Remarks'].includes(questionSet.hodStatus)) {
      return res.status(403).json({ message: 'Cannot undo import for an approved set' });
    }

    // Find the latest batchId for this set of questions
    const setQuestions = await Question.find({ _id: { $in: questionSet.questions } }).sort({ _id: -1 });
    const latestBatchId = setQuestions.find(q => q.batchId)?.batchId;

    if (!latestBatchId) {
      return res.status(404).json({ message: 'No bulk import batch found to undo' });
    }

    // Delete questions from DB
    await Question.deleteMany({ batchId: latestBatchId });

    // Remove from Assessment set
    const batchQuestions = setQuestions.filter(q => q.batchId === latestBatchId);
    const batchIds = batchQuestions.map(q => q._id.toString());

    questionSet.questions = questionSet.questions.filter(id => !batchIds.includes(id.toString()));
    questionSet.hodStatus = 'Pending';

    await assessment.save();

    res.status(200).json({ message: 'Last bulk import undone successfully' });

  } catch (error) {
    console.error('Undo error', error);
    res.status(500).json({ message: 'Undo failed', error: error.message });
  }
};
