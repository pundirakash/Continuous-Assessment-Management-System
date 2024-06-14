const User = require('../models/User');
const Course = require('../models/Course');
const Assessment = require('../models/Assessment');
const Question = require('../models/Question');
const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

exports.getFaculties = async (req, res) => {
  try {
    const department = req.user.department; 
    const faculties = await User.find({ role: ['Faculty', 'CourseCoordinator'], department });
    res.status(200).json(faculties);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.getFacultiesByCourse = async (req, res) => {
  const { courseId } = req.params;
  try {
    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(403).json({ message: 'Not authorized to view faculties for this course' });
    }

    const faculties = await User.find({ role: ['Faculty', 'CourseCoordinator'], courses: courseId }).populate('courses');
    res.status(200).json(faculties);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.getFacultiesByDepartment = async (req, res) => {
  const department = req.user.department;
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

    if (!faculty || !course || faculty.department !== req.user.department) {
      return res.status(403).json({ message: 'Not authorized to assign this course' });
    }

    faculty.courses.push(courseId);
    await faculty.save();


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
    const course = await Course.findById(courseId);

    if (!faculty || !course || faculty.department !== req.user.department) {
      return res.status(403).json({ message: 'Not authorized to appoint this coordinator' });
    }

    faculty.role = 'CourseCoordinator';
    await faculty.save();

    course.coordinator = facultyId;
    await course.save();

    res.status(200).json({ message: 'Coordinator appointed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

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
    const { name, code } = req.body;
    const existingCourse = await Course.findOne({ code});

    if (existingCourse) {
      return res.status(400).json({ message: 'Course with this code already exists in your department' });
    }

    const course = new Course({ name, code});
    await course.save();

    res.status(201).json({ message: 'Course created successfully', course });
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

    questionSet.hodStatus = status;
    questionSet.hodRemarks = remarks;
    await assessment.save();

    res.status(200).json({ message: 'Assessment set reviewed successfully by HOD' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};


async function generateDocxFromTemplate(data) {
  try {
    const templateFilePath = path.resolve(__dirname, '../templates/template2.docx');
    const outputDocxFilePath = path.resolve(__dirname, 'output2.docx');

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

exports.downloadAssessmentQuestions = async (req, res) => {
  try {
    const { courseId, assessmentId } = req.params;
    
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(403).json({ message: 'Not authorized to download questions for this course' });
    }
    
    const assessment = await Assessment.findOne({ _id: assessmentId, course: courseId }).populate('facultyQuestions.questions').populate('course');
    
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found for the specified course' });
    }

    const allQuestions = assessment.facultyQuestions.flatMap(fq => fq.questions);
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
      })),
    };

    const docxFilePath = await generateDocxFromTemplate(data);

    res.download(docxFilePath, `assessment_${assessmentId}_questions.docx`);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.downloadCourseQuestions = async (req, res) => {
  try {
    const { courseId } = req.params;
    
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(403).json({ message: 'Not authorized to download questions for this course' });
    }
    
    const assessments = await Assessment.find({ course: courseId }).populate('facultyQuestions.questions');

    if (assessments.length === 0) {
      return res.status(404).json({ message: 'No assessments found for the specified course' });
    }

    const allQuestions = assessments.flatMap(assessment => 
      assessment.facultyQuestions.flatMap(fq => fq.questions)
    );

    const populatedQuestions = await Question.find({ _id: { $in: allQuestions } });

    const data = {
      courseId: courseId,
      questions: populatedQuestions.map((question, index) => ({
        number: index + 1,
        text: question.text,
        courseOutcome: question.courseOutcome,
        bloomLevel: question.bloomLevel,
        marks: question.marks,
      })),
    };

    const docxFilePath = await generateDocxFromTemplate(data);

    res.download(docxFilePath, `course_${courseId}_questions.docx`);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
