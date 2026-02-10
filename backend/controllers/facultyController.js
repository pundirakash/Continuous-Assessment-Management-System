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
      config = await SystemConfig.findOne(configFilter).lean();
      targetTerm = config ? config.value : '24252';
    }

    // Get current system term to compare
    if (!config) config = await SystemConfig.findOne(configFilter).lean();
    const currentSystemTerm = config ? config.value : '24252';

    if (String(targetTerm) === String(currentSystemTerm)) {
      // Active Term: Return current courses from User model, but FILTER by activeTerms
      // Optimization: Use lean()
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
        select: 'name code activeTerms faculty coordinator faculties', // Select only needed fields
        populate: [
          { path: 'coordinator', select: 'name email role uid' },
          { path: 'faculties', select: 'name email role uid' }
        ]
      }).select('courses').lean();

      if (!faculty) {
        return res.status(404).json({ message: 'Faculty not found' });
      }
      return res.status(200).json(faculty.courses || []);
    } else {
      // Archived Term: Fetch from TermArchive
      const archives = await TermArchive.find({
        termId: String(targetTerm),
        facultyId: req.user.id
      }).populate({
        path: 'courseId',
        select: 'name code activeTerms faculty coordinator faculties'
      }).lean();

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
      config = await SystemConfig.findOne(configFilter).lean();
      targetTerm = config ? config.value : '24252';
    }

    // Optimization: query Assessments directly instead of populating Course
    // This is much faster as it avoids loading the heavy Course document
    // and we can select only needed fields.

    // Handle both string/number termIds just in case
    const targetTermStr = String(targetTerm);
    const mixedTerms = [targetTermStr, Number(targetTermStr)].filter(x => !isNaN(x) || typeof x === 'string');

    const assessments = await Assessment.find({
      course: courseId,
      termId: { $in: mixedTerms }
    })
      .select('name termId type facultyQuestions.sets facultyQuestions.faculty') // Select minimal fields
      .lean();

    // We need to return what the UI expects.
    // The UI likely expects the full assessment object or at least the parts used in the list.
    // The previous code returned `course.assessments`, which were full objects.

    // IMPORTANT: The UI might need `facultyQuestions` to calculate status/counts.
    // The `.select` above includes them.

    res.status(200).json(assessments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.getSetsForAssessment = async (req, res) => {
  try {
    const { assessmentId } = req.params;

    // Optimization: Use projection ($elemMatch) to fetch ONLY this faculty's questions
    // Also fetch course and termId for authorization checks if faculty entry is missing
    const assessment = await Assessment.findOne(
      { _id: assessmentId },
      { course: 1, termId: 1, 'facultyQuestions': { $elemMatch: { faculty: req.user.id } } }
    ).lean();

    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    // Because of $elemMatch, facultyQuestions will be an array of size 1 if found, or empty/undefined if not
    if (!assessment.facultyQuestions || assessment.facultyQuestions.length === 0) {
      // Check Authorization before returning 403
      // We need to know if they ARE allowed to be here (to see they have 0 sets)
      const course = await Course.findById(assessment.course);
      let isAuthorized = false;

      if (course) {
        // 1. Check Live
        isAuthorized = course.faculties.some(id => id.equals(req.user.id)) ||
          (course.coordinator && course.coordinator.equals(req.user.id)) ||
          req.user.role === 'HOD';

        // 2. Check Archive
        if (!isAuthorized && assessment.termId) {
          const archive = await TermArchive.findOne({
            termId: String(assessment.termId),
            courseId: assessment.course,
            facultyId: req.user.id
          });
          if (archive) isAuthorized = true;
        }
      }

      if (isAuthorized) {
        return res.status(200).json([]); // Authorized, but no sets yet. Return empty array.
      }

      return res.status(403).json({ message: 'Not authorized or no sets initiated for this assessment' });
    }

    const facultyQuestions = assessment.facultyQuestions[0];
    res.status(200).json(facultyQuestions.sets);
  } catch (error) {
    console.error("Error in getSetsForAssessment", error);
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.getQuestionsForSet = async (req, res) => {
  try {
    const { assessmentId, setName } = req.params;

    // Optimization: Do NOT populate the entire tree.
    // 1. Fetch Assessment with Projection for this faculty only.
    const assessment = await Assessment.findOne(
      { _id: assessmentId },
      { 'facultyQuestions': { $elemMatch: { faculty: req.user.id } } }
    ).lean();

    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    if (!assessment.facultyQuestions || assessment.facultyQuestions.length === 0) {
      return res.status(403).json({ message: 'Not authorized to view questions for this assessment' });
    }

    const facultyQuestions = assessment.facultyQuestions[0];
    const questionSet = facultyQuestions.sets.find(set => set.setName === setName);

    if (!questionSet) {
      return res.status(404).json({ message: 'Question set not found' });
    }

    if (!questionSet.questions || questionSet.questions.length === 0) {
      // Logic for Empty Set: verify status
      if (questionSet.hodStatus !== 'Pending') {
        // Auto-fix status if needed? 
        // Previous code did: questionSet.hodStatus = 'Pending'; await assessment.save();
        // To do that, we need a hydrated document or updateOne.
        // Let's do a quick updateOne to be safe if status is wrong, 
        // but strictly speaking a GET request shouldn't change state unless necessary.
        // Let's stick to returning empty array.
        await Assessment.updateOne(
          { _id: assessmentId, 'facultyQuestions.sets.setName': setName },
          { $set: { 'facultyQuestions.$[fq].sets.$[s].hodStatus': 'Pending' } },
          {
            arrayFilters: [
              { 'fq.faculty': req.user.id },
              { 's.setName': setName }
            ]
          }
        );
      }
      return res.status(200).json([]);
    }

    // 2. Fetch Questions Direct
    // Now we have the IDs, just fetch them. 
    // This avoids pulling thousands of other questions from other sets/faculties.
    const questions = await Question.find({ _id: { $in: questionSet.questions } }).lean();

    res.status(200).json(questions);
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
      getImage: function (tagValue, tagName) {
        // tagValue is now Base64 string (to avoid being treated as object by module)
        if (tagValue && typeof tagValue === 'string') {
          return Buffer.from(tagValue, 'base64');
        }

        if (!tagValue || !Buffer.isBuffer(tagValue)) {
          console.log(`[DOCX] Image missing for tag: ${tagName}, using placeholder.`);
          return Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
        }
        return tagValue;
      },
      getSize: function (img, tagValue, tagName) {
        console.log(`[DOCX] getSize called for ${tagName}`);
        return [150, 150];
      },
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

    // Optimization: Fetch Assessment with Projection first.
    // 1. Get Course Info & Faculty Set Info
    const assessment = await Assessment.findOne(
      { _id: assessmentId },
      {
        name: 1, termId: 1, type: 1, course: 1,
        'facultyQuestions': { $elemMatch: { faculty: req.user.id } }
      }
    )
      .populate({
        path: 'course',
        select: 'name code universityId schoolId departmentId department'
      });

    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    // AUTH CHECK: Ensure University matches
    if (universityId && assessment.course.universityId?.toString() !== universityId.toString()) {
      return res.status(403).json({ message: 'Not authorized: University mismatch' });
    }

    if (!assessment.facultyQuestions || assessment.facultyQuestions.length === 0) {
      return res.status(403).json({ message: 'Not authorized to view questions for this assessment' });
    }

    const facultyQuestions = assessment.facultyQuestions[0];
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
      // Basic sanitization
      if (!text) return '';
      return text.replace(/[\r\n]+/g, ' ').trim();
    };

    // Helper to fetch image buffer
    const fetchImage = (url) => {
      return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? require('https') : require('http');
        // Handle self-signed certs (e.g. detailed in error log)
        const options = url.startsWith('https') ? { rejectUnauthorized: false } : {};

        client.get(url, options, (res) => {
          if (res.statusCode !== 200) {
            // Consume response data to free up memory
            res.resume();
            return resolve(null); // Resolve null on error to let doc generation continue without image
          }
          const chunks = [];
          res.on('data', (chunk) => chunks.push(chunk));
          res.on('end', () => resolve(Buffer.concat(chunks)));
        }).on('error', (err) => {
          console.error('Error fetching image:', url, err);
          resolve(null);
        });
      });
    };

    // Optimization: Fetch only questions for this set directly
    const questionsRaw = await Question.find({ _id: { $in: questionSet.questions } }).lean();

    // Pre-process questions to fetch images
    const processedQuestions = await Promise.all(questionsRaw.map(async (question, index) => {
      let imageBuffer = null;
      if (question.image) {
        // Check if it's a remote URL
        if (question.image.startsWith('http') || question.image.startsWith('https')) {
          imageBuffer = await fetchImage(question.image);
        } else {
          // Local file fallback
          try {
            const localPath = path.resolve(__dirname, '../', question.image);
            if (fs.existsSync(localPath)) {
              imageBuffer = fs.readFileSync(localPath);
            }
          } catch (e) {
            console.error('Error reading local image:', question.image, e);
          }
        }
      }

      return {
        number: index + 1,
        text: sanitizeText(question.text),
        courseOutcome: question.courseOutcome,
        bloomLevel: question.bloomLevel,
        marks: question.marks,
        // PASS BASE64 STRING to avoid 'typeof object' check in image module which causes crash
        image: imageBuffer ? imageBuffer.toString('base64') : null,
        options: question.type === 'MCQ' ? question.options.map((option, i) => ({ option: `${optionLetters[i]}. ${option}` })) : []
      };
    }));

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
      questions: processedQuestions,
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
      // Basic sanitization
      if (!text) return '';
      return text.replace(/[\r\n]+/g, ' ').trim();
    };

    // Helper to fetch image buffer
    const fetchImage = (url) => {
      return new Promise((resolve, reject) => {
        // Log URLs being fetched
        console.log(`[DOCX] Fetching image: ${url}`);
        const client = url.startsWith('https') ? require('https') : require('http');
        // Handle self-signed certs
        const options = url.startsWith('https') ? { rejectUnauthorized: false } : {};

        client.get(url, options, (res) => {
          if (res.statusCode !== 200) {
            console.log(`[DOCX] Fetch failed (${res.statusCode}): ${url}`);
            res.resume();
            return resolve(null);
          }
          const chunks = [];
          res.on('data', (chunk) => chunks.push(chunk));
          res.on('end', () => {
            console.log(`[DOCX] Fetched ${chunks.length} chunks for: ${url}`);
            resolve(Buffer.concat(chunks));
          });
        }).on('error', (err) => {
          console.error('[DOCX] Error fetching image:', url, err);
          resolve(null);
        });
      });
    };

    const questionsRaw = await Promise.all(questionSet.questions.map(async (questionId) => {
      return await Question.findById(questionId);
    }));

    // Pre-process questions to fetch images
    const processedQuestions = await Promise.all(questionsRaw.map(async (question, index) => {
      let imageBuffer = null;
      if (question.image) {
        try {
          if (question.image.startsWith('http') || question.image.startsWith('https')) {
            imageBuffer = await fetchImage(question.image);
          } else {
            const localPath = path.resolve(__dirname, '../', question.image);
            if (fs.existsSync(localPath)) {
              imageBuffer = fs.readFileSync(localPath);
            }
          }
        } catch (err) {
          console.error(`[DOCX] Failed to load image for Q${index + 1}:`, err.message);
        }
      }

      return {
        number: index + 1,
        text: sanitizeText(question.text),
        solution: sanitizeText(question.solution),
        marks: question.marks,
        image: imageBuffer ? imageBuffer.toString('base64') : null,
      };
    }));

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
      questions: processedQuestions,
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

      // 1. Validation Checks (Light queries)
      const existingQuestion = await Question.findOne({ text, assessment: assessmentId }).select('_id'); // Scope to assessment? Or global unique?
      // Original code was global unique on text. Keeping that but selecting only _id.
      if (existingQuestion) {
        return res.status(400).json({ message: 'A question with this text already exists' });
      }

      // Check Assessment existence & type & Authorization (Single Lean Query)
      const assessment = await Assessment.findOne(
        { _id: assessmentId },
        { type: 1, 'facultyQuestions': { $elemMatch: { faculty: req.user.id } } }
      ).lean();

      if (!assessment) {
        return res.status(404).json({ message: 'Assessment not found' });
      }

      if (type !== assessment.type) {
        return res.status(400).json({ message: `Question type must be ${assessment.type} for this assessment` });
      }

      if (!assessment.facultyQuestions || assessment.facultyQuestions.length === 0) {
        return res.status(403).json({ message: 'Not authorized or no sets allocated' });
      }

      // 2. Upload Image (Parallel if possible, but depends on req.file)
      let imageUrl = null;
      if (req.file) {
        imageUrl = await uploadToCloudinary(req.file);
      }

      // 3. Create Question Document
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

      // 4. Update Assessment (Push to Set) - Optimized
      // Use arrayFilters to identify the correct Set within the Correct Faculty
      // Also potentially reset status to Pending if it was Approved.

      // We need to know if the set exists specifically.
      // The lean query returned `facultyQuestions` array (size 1).
      const fq = assessment.facultyQuestions[0];
      const setExists = fq.sets.some(s => s.setName === setName);

      if (!setExists) {
        // Case: Set doesn't exist? (Should be created via createSet usually?)
        // Original code created it on the fly:
        // if (!questionSet) { questionSet = { setName, questions: [] }; facultyQuestions.sets.push... }

        // If we need to PUSH a new SET, we do that via updateOne too.
        await Assessment.updateOne(
          { _id: assessmentId, 'facultyQuestions.faculty': req.user.id },
          {
            $push: {
              'facultyQuestions.$.sets': {
                setName: setName,
                questions: [question._id],
                hodStatus: 'Pending'
              }
            }
          }
        );
      } else {
        // Case: Set exists. Push question and Update Status.
        // Note: resetting status to 'Pending' if it was 'Approved' is logic from before.
        // We can unconditionally set hodStatus to 'Pending' on every new question add.

        await Assessment.updateOne(
          { _id: assessmentId },
          {
            $push: { 'facultyQuestions.$[fq].sets.$[s].questions': question._id },
            $set: { 'facultyQuestions.$[fq].sets.$[s].hodStatus': 'Pending' }
          },
          {
            arrayFilters: [
              { 'fq.faculty': req.user.id },
              { 's.setName': setName }
            ]
          }
        );
      }

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
    // Delete the image from Cloudinary if it exists
    if (question.image) {
      try {
        // Robust Public ID extraction: Matches everything after 'upload/(v.../)?' and before the file extension
        const regex = /\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/;
        const match = question.image.match(regex);

        if (match && match[1]) {
          const publicId = match[1];
          console.log(`[Cloudinary] Deleting image: ${publicId}`);
          await cloudinary.uploader.destroy(publicId);
          console.log('[Cloudinary] Image deleted successfully');
        } else {
          console.warn('[Cloudinary] Could not extract public_id from URL:', question.image);
        }
      } catch (err) {
        console.error('[Cloudinary] Error deleting image:', err.message);
        // We do NOT block question deletion if image deletion fails
      }
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

    let facultyQuestions = assessment.facultyQuestions.find(fq => fq.faculty.equals(req.user.id));
    if (!facultyQuestions) {
      // Self-healing: Check if user is authorized (Faculty/Coordinator/HOD) for this course
      // If so, initialize their entry in facultyQuestions
      const course = await Course.findById(assessment.course);

      let isAuthorized = false;
      if (course) {
        // 1. Check Live Course (Current Term)
        isAuthorized = course.faculties.some(id => id.equals(req.user.id)) ||
          (course.coordinator && course.coordinator.equals(req.user.id)) ||
          req.user.role === 'HOD';

        // 2. Check Term Archive (Past/Future Terms)
        if (!isAuthorized && assessment.termId) {
          const archive = await TermArchive.findOne({
            termId: String(assessment.termId),
            courseId: assessment.course,
            facultyId: req.user.id
          });
          if (archive) isAuthorized = true;
        }
      }

      if (isAuthorized) {
        assessment.facultyQuestions.push({ faculty: req.user.id, sets: [] });
        // We must reach into the array we just pushed to
        facultyQuestions = assessment.facultyQuestions[assessment.facultyQuestions.length - 1];
      } else {
        return res.status(403).json({ message: 'Not authorized to add sets to this assessment' });
      }
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

    // NEW: Fetch full question documents to get image URLs
    const questionsToDelete = await Question.find({ _id: { $in: setToDelete.questions } });

    // NEW: Iterate and delete images from Cloudinary
    for (const question of questionsToDelete) {
      if (question.image) {
        try {
          const regex = /\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/;
          const match = question.image.match(regex);
          if (match && match[1]) {
            const publicId = match[1];
            console.log(`[Cloudinary] Deleting image for Set Delete: ${publicId}`);
            await cloudinary.uploader.destroy(publicId);
          }
        } catch (err) {
          console.error(`[Cloudinary] Failed to delete image for Q ${question._id}:`, err.message);
          // Continue deleting other images and the set
        }
      }
    }

    facultyQuestions.sets.splice(setIndex, 1);

    await Question.deleteMany({ _id: { $in: setToDelete.questions } });

    await assessment.save();

    res.status(200).json({ message: 'Set and associated images deleted successfully' });
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
    // Optimization: Use countDocuments directly instead of fetching the user and courses array.
    // Wait, courses are in User.courses array (references).
    // So we need to fetch User, but only the courses field, and populate just enough to filter.

    // Better: Fetch User with lean() and populate courses with match
    const user = await User.findById(userId).populate({
      path: 'courses',
      match: {
        isDeleted: { $ne: true },
        $or: [
          { activeTerms: { $in: [String(termId)] } },
          { activeTerms: { $exists: false } },
          { activeTerms: { $size: 0 } }
        ]
      },
      select: '_id' // We only need the count
    }).select('courses').lean();

    const totalCourses = user && user.courses ? user.courses.length : 0;

    // 2. Get Assessments & Question/Set Stats
    // Optimization: Use lean() and specific projection
    // We only need 'facultyQuestions' for THIS user, and 'hodStatus'.
    // We don't need to populate 'course' completely, maybe just checking if it exists/valid?
    // The previous code checked `if (!assessment.course) return;`. 
    // This implies we filters out assessments where course is missing/deleted?

    const assessments = await Assessment.find({
      termId: termId,
      'facultyQuestions.faculty': userId
    })
      .select('facultyQuestions course')
      .populate({ path: 'course', select: '_id' }) // Just to check existence
      .lean();

    const uniqueQuestionIds = new Set();
    let approvedSets = 0;
    let pendingSets = 0;
    let rejectedSets = 0;
    let totalSets = 0;

    assessments.forEach(assessment => {
      if (!assessment.course) return; // Skip if course is null (deleted)

      // Find my workload in the array using simple JS find (fast enough for lean docs)
      // Since we filtered in query, it SHOULD be there, but `facultyQuestions` is an array.
      const myWorkload = assessment.facultyQuestions.find(fq => fq.faculty.toString() === userId.toString());

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
            pendingSets++; // Covers 'Pending', 'Submitted', etc.
          }
        });
      }
    });

    const totalQuestions = uniqueQuestionIds.size;

    // 3. Gamification Logic (Unchanged calculations)
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
