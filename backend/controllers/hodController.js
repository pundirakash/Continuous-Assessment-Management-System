const User = require('../models/User');
const Course = require('../models/Course');
const Assessment = require('../models/Assessment');
const Question = require('../models/Question');
const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const ImageModule = require('docxtemplater-image-module-free');
const archiver = require('archiver');

exports.getFaculties = async (req, res) => {
  try {
    const department = req.user.department; 
    const faculties = await User.find({ role: ['Faculty', 'CourseCoordinator', 'HOD'], department });
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

    const faculties = await User.find({ role: ['Faculty', 'CourseCoordinator', 'HOD'], courses: courseId }).populate('courses');
    res.status(200).json(faculties);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.getFacultiesByDepartment = async (req, res) => {
  const department = req.user.department;
  try {
    const faculties = await User.find({ role: ['Faculty', 'CourseCoordinator','HOD'], department });
    res.status(200).json(faculties);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.getCoursesByDepartment = async (req, res) => {
  try {
    const department = req.user.department;
    const courses = await Course.find({ department });
    res.status(200).json(courses);
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

    // Update assessments related to the course
    const assessments = await Assessment.find({ course: courseId });
    assessments.forEach(async (assessment) => {
      const existingFacultyQuestion = assessment.facultyQuestions.find(
        (fq) => fq.faculty.toString() === facultyId
      );

      if (!existingFacultyQuestion) {
        assessment.facultyQuestions.push({
          faculty: facultyId,
          sets: [],
        });
        await assessment.save();
      }
    });

    const notificationMessage = `Dear ${faculty.name}, A new Course ${course.name} has been allotted to you.`;
    faculty.notifications.unshift(notificationMessage);
    await faculty.save();

    res.status(200).json({ message: 'Course assigned successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};



exports.deallocateCourse = async (req, res) => {
  try {
    const { facultyId, courseId } = req.body;

    const faculty = await User.findById(facultyId);
    const course = await Course.findById(courseId);

    if (!faculty || !course || faculty.department !== req.user.department) {
      return res.status(403).json({ message: 'Not authorized to deallocate this course' });
    }

    faculty.courses = faculty.courses.filter(id => !id.equals(courseId));
    await faculty.save();

    course.faculties = course.faculties.filter(id => !id.equals(facultyId));
    await course.save();

    res.status(200).json({ message: 'Course deallocated successfully' });
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

    if (course.coordinator && !course.coordinator.equals(facultyId)) {
      const previousCoordinator = await User.findById(course.coordinator);
      if (previousCoordinator) {
        previousCoordinator.role = 'Faculty';
        await previousCoordinator.save();
      }
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
    const department = req.user.department;

    const existingCourse = await Course.findOne({ code, department });

    if (existingCourse) {
      return res.status(400).json({ message: 'Course with this code already exists in your department' });
    }

    const course = new Course({ name, code, department });
    await course.save();

    res.status(201).json({ message: 'Course created successfully', course });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.getCoursesByFaculty = async (req, res) => {
  try {
    const { facultyId } = req.params;
    const faculty = await User.findById(facultyId).populate('courses');

    if (!faculty || faculty.department !== req.user.department) {
      return res.status(403).json({ message: 'Not authorized to view courses for this faculty' });
    }

    res.status(200).json(faculty.courses);
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

    if ((status === 'Approved with Remarks' || status === 'Rejected') && !remarks) {
      return res.status(400).json({ message: 'Remarks are required for Approved with Remarks and Rejected statuses' });
    }

    questionSet.hodStatus = status;
    questionSet.hodRemarks = remarks;

    let questionStatus;
    if (status === 'Approved') {
      questionStatus = 'Approved';
    } else if (status === 'Approved with Remarks') {
      questionStatus = 'Approved';
    } else if (status === 'Rejected') {
      questionStatus = 'Rejected';
    }

    if (questionStatus) {
      await Question.updateMany(
        { _id: { $in: questionSet.questions } },
        { $set: { status: questionStatus } }
      );
    }

    await assessment.save();

    // Create and add notification
    const faculty = await User.findById(facultyId);
    if (faculty) {
      const notification = `Dear ${faculty.name}, Your Set ${setName} for ${assessment.name} of ${course.name} is ${status}.`;
      faculty.notifications.unshift(notification); // Add notification to the beginning
      await faculty.save();
    }

    res.status(200).json({ message: 'Assessment set reviewed successfully by HOD' });
  } catch (error) {
    console.error(error);
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

    const buffer = doc.getZip().generate({ type: 'nodebuffer' });
    return buffer;
  } catch (error) {
    console.error('Error generating DOCX file:', error);
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
    
    const assessment = await Assessment.findOne({ _id: assessmentId, course: courseId })
      .populate('facultyQuestions.sets.questions')
      .populate('course');

    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found for the specified course' });
    }

    const allQuestions = assessment.facultyQuestions.flatMap(fq => 
      fq.sets.flatMap(set => set.questions)
    );

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
        image: question.image ? path.resolve(__dirname, '../', question.image) : null, // Include image path
      })),
    };

    const docxFilePath = await generateDocxFromTemplate(data, 'template3.docx');

    res.download(docxFilePath, `assessment_${assessmentId}_questions.docx`);
  } catch (error) {
    console.error(error);
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
    
    const assessments = await Assessment.find({ course: courseId })
      .populate('facultyQuestions.sets.questions')
      .populate('course');

    if (assessments.length === 0) {
      return res.status(404).json({ message: 'No assessments found for the specified course' });
    }

    const allQuestions = assessments.flatMap(assessment => 
      assessment.facultyQuestions.flatMap(fq => 
        fq.sets.flatMap(set => set.questions)
      )
    );

    const populatedQuestions = await Question.find({ _id: { $in: allQuestions } });

    const data = {
      courseCode: course.code,
      courseName: course.name,
      questions: populatedQuestions.map((question, index) => ({
        number: index + 1,
        text: question.text,
        courseOutcome: question.courseOutcome,
        bloomLevel: question.bloomLevel,
        marks: question.marks,
        image: question.image ? path.resolve(__dirname, '../', question.image) : null, // Include image path
      })),
    };

    const docxFilePath = await generateDocxFromTemplate(data, 'template3.docx');

    res.download(docxFilePath, `course_${courseId}_questions.docx`);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.getSetsByFaculty = async (req, res) => {
  const { facultyId, assessmentId } = req.params;

  try {
    const assessment = await Assessment.findById(assessmentId)
      .populate('facultyQuestions.sets.questions');

    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    const facultyQuestions = assessment.facultyQuestions.find(fq => fq.faculty.equals(facultyId));

    if (!facultyQuestions) {
      return res.status(404).json({ message: 'No question sets found for this faculty' });
    }

    res.status(200).json(facultyQuestions.sets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.editQuestionByHOD = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { text, type, options, bloomLevel, courseOutcome, marks } = req.body;

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

    await question.save();

    res.status(200).json({ message: 'Question updated successfully', question });
  } catch (error) {
    console.error('Error updating question', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.deleteQuestionByHOD = async (req, res) => {
  try {
    const { questionId } = req.params;

    // Find the assessment that contains this question
    const assessment = await Assessment.findOne({
      'facultyQuestions.sets.questions': questionId
    });

    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    // Remove the question from all sets in the assessment
    assessment.facultyQuestions.forEach(fq => {
      fq.sets.forEach(set => {
        set.questions = set.questions.filter(qId => qId.toString() !== questionId);
      });
    });

    await assessment.save();

    // Delete the question document
    const question = await Question.findById(questionId);
    if (question.image) {
      const imagePath = path.resolve(__dirname, '../', question.image);
      fs.unlink(imagePath, (err) => {
        if (err) {
          console.error('Error deleting image file:', err);
        }
      });
    }
    await Question.deleteOne({ _id: questionId });

    res.status(200).json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Error deleting question', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.getPendingAssessmentSets = async (req, res) => {
  try {
    const department = req.user.department;

    const courses = await Course.find({ department });

    const courseIds = courses.map(course => course._id);

    const assessments = await Assessment.find({
      course: { $in: courseIds },
      'facultyQuestions.sets.hodStatus': 'Submitted'
    }).populate('course facultyQuestions.faculty');

    const pendingSets = assessments.map(assessment => {
      return assessment.facultyQuestions.flatMap(facultyQuestion => {
        const submittedSets = facultyQuestion.sets.filter(set => set.hodStatus === 'Submitted');
        if (submittedSets.length > 0) {
          return submittedSets.map(set => ({
            assessmentId: assessment._id,
            assessmentName: assessment.name,
            courseName: assessment.course.name,
            facultyId: facultyQuestion.faculty._id,
            setName: set.setName,
            hodStatus: set.hodStatus
          }));
        }
        return [];
      });
    }).flat();

    res.status(200).json(pendingSets);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    await Course.findByIdAndDelete(courseId);
    res.status(200).json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.getAssessmentsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId).populate('assessments');
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.status(200).json(course.assessments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Edit Assessment
exports.editAssessment = async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const { name, termId, type } = req.body;

    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    assessment.name = name;
    assessment.termId = termId;
    assessment.type = type;

    await assessment.save();
    res.status(200).json({ message: 'Assessment updated successfully', assessment });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Delete Assessment
exports.deleteAssessment = async (req, res) => {
  try {
    const { assessmentId } = req.params;

    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    await Assessment.findByIdAndDelete(assessmentId);
    res.status(200).json({ message: 'Assessment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.downloadQuestions = async (req, res) => {
  try {
    const {
      courseId,
      assessmentId,
      facultyId,
      type,
      bloomLevel,
      courseOutcome,
      numberOfQuestions,
      templateNumber,
      setName,
    } = req.query;

    const filter = {};

    if (courseId) {
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }
      const assessments = await Assessment.find({ course: courseId });
      const assessmentIds = assessments.map(assessment => assessment._id);
      filter.assessment = { $in: assessmentIds };
    }

    if (assessmentId) {
      filter.assessment = assessmentId;
    }

    if (facultyId) {
      const assessments = await Assessment.find({ 'facultyQuestions.faculty': facultyId });
      const assessmentIds = assessments.map(assessment => assessment._id);
      filter.assessment = { $in: assessmentIds };
    }

    if (setName) {
      filter['facultyQuestions.sets.setName'] = setName;
    }

    if (type) {
      filter.type = type;
    }

    if (bloomLevel) {
      filter.bloomLevel = bloomLevel;
    }

    if (courseOutcome) {
      filter.courseOutcome = courseOutcome;
    }

    let questions = await Question.find(filter);

    if (numberOfQuestions) {
      questions = questions.slice(0, parseInt(numberOfQuestions));
    }

    const questionData = {
      questions: questions.map((question, index) => ({
        number: index + 1,
        text: question.text,
        courseOutcome: question.courseOutcome,
        bloomLevel: question.bloomLevel,
        marks: question.marks,
        image: question.image ? question.image : null,
      })),
    };

    const solutionData = {
      questions: questions.map((question, index) => ({
        number: index + 1,
        text: question.text,
        solution: question.solution,
        marks: question.marks,
      })),
    };

    const questionDocBuffer = await generateDocxFromTemplate(questionData, templateNumber || '3');
    const solutionDocBuffer = await generateDocxFromTemplate(solutionData, '5');

    res.setHeader('Content-Disposition', 'attachment; filename=questions_and_solution.zip');
    res.setHeader('Content-Type', 'application/zip');

    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.pipe(res);

    archive.append(questionDocBuffer, { name: 'questions.docx' });
    archive.append(solutionDocBuffer, { name: 'solution.docx' });

    await archive.finalize();

  } catch (error) {
    console.error('Error downloading questions and solution:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};






