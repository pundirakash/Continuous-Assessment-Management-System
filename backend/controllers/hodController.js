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
    const { assessmentId, facultyId, setName } = req.params;
    const assessment = await Assessment.findById(assessmentId).populate('facultyQuestions.sets.questions');

    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    const facultyQuestions = assessment.facultyQuestions.find(fq => fq.faculty.equals(facultyId));

    if (!facultyQuestions) {
      return res.status(404).json({ message: 'No questions found for this faculty' });
    }

    const questionSet = facultyQuestions.sets.find(set => set.setName === setName);

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
    const { assessmentId, facultyId, setName } = req.params;
    const { status, remarks } = req.body;

    const assessment = await Assessment.findById(assessmentId);

    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
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




// Helper function to generate DOCX file
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
    
    // Ensure the assessment belongs to the specified course
    const assessment = await Assessment.findOne({ _id: assessmentId, course: courseId }).populate('facultyQuestions.questions').populate('course');;
    
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found for the specified course' });
    }

    const allQuestions = assessment.facultyQuestions.flatMap(fq => fq.questions);

    const populatedQuestions = await Question.find({ _id: { $in: allQuestions } });

    // Prepare data for DOCX generation
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
    
    // Find all assessments for the specified course
    const assessments = await Assessment.find({ course: courseId }).populate('facultyQuestions.questions');

    if (assessments.length === 0) {
      return res.status(404).json({ message: 'No assessments found for the specified course' });
    }

    // Collect all questions from all assessments
    const allQuestions = assessments.flatMap(assessment => 
      assessment.facultyQuestions.flatMap(fq => fq.questions)
    );

    const populatedQuestions = await Question.find({ _id: { $in: allQuestions } });

    // Prepare data for DOCX generation
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



