const mongoose = require('mongoose');
require('dotenv').config(); // .env is in backend/, but running from backend/ might need ../.env if script is in scripts/ ??? 
// Actually dotenv.config() looks in CWD by default. If CWD is backend/, it finds .env.
// But valid requirement is to locate it explicitly if needed.
// However, the main issue was models.
const User = require('../models/User');
const Course = require('../models/Course');
const Assessment = require('../models/Assessment');
const Question = require('../models/Question');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

const deleteSet = async () => {
    await connectDB();

    try {
        // 1. Find Faculty
        const facultyName = "Akash pundir";
        const faculty = await User.findOne({ name: { $regex: new RegExp(facultyName, 'i') } });
        if (!faculty) {
            console.log(`Faculty '${facultyName}' not found.`);
            process.exit(1);
        }
        console.log(`Found Faculty: ${faculty.name} (${faculty._id})`);

        // 2. Find Course
        const courseCode = "CSE372";
        const course = await Course.findOne({ code: courseCode });
        if (!course) {
            console.log(`Course '${courseCode}' not found.`);
            process.exit(1);
        }
        console.log(`Found Course: ${course.name} (${course._id})`);

        // 3. Find Assessment
        const termId = "24252";
        const assessmentNamePartial = "CA1";
        const assessment = await Assessment.findOne({
            course: course._id,
            termId: termId,
            name: { $regex: new RegExp(assessmentNamePartial, 'i') }
        });

        if (!assessment) {
            console.log(`Assessment 'CA1' for ${courseCode} in term ${termId} not found.`);
            // List all assessments for this course to help debug
            const allAssessments = await Assessment.find({ course: course._id, termId: termId });
            console.log("Available Assessments:", allAssessments.map(a => `${a.name} (${a._id})`));
            process.exit(1);
        }
        console.log(`Found Assessment: ${assessment.name} (${assessment._id})`);

        // 4. Find Hierarchy
        // We need to look for faculty ID in the array of facultyQuestions
        // The faculty field in facultyQuestions is an ObjectId
        const facultyIndex = assessment.facultyQuestions.findIndex(fq => fq.faculty && fq.faculty.toString() === faculty._id.toString());
        if (facultyIndex === -1) {
            console.log(`Faculty ${faculty.name} (${faculty._id}) has no submissions in this assessment.`);
            console.log("Faculties in Assessment:");
            assessment.facultyQuestions.forEach(fq => {
                console.log(`- Faculty ID: ${fq.faculty}`);
            });
            process.exit(1);
        }

        const facultyEntry = assessment.facultyQuestions[facultyIndex];
        const setName = "B";
        const setIndex = facultyEntry.sets.findIndex(s => s.setName === setName);

        if (setIndex === -1) {
            console.log(`Set '${setName}' not found for this faculty.`);
            console.log("Available Sets:", facultyEntry.sets.map(s => s.setName));
            process.exit(1);
        }

        const setToDelete = facultyEntry.sets[setIndex];
        const questionIds = setToDelete.questions;

        console.log(`Found Set ${setName} with ${questionIds.length} questions.`);
        console.log(`Status: ${setToDelete.hodStatus}`);

        // 5. Delete Questions
        if (questionIds.length > 0) {
            const deleteResult = await Question.deleteMany({ _id: { $in: questionIds } });
            console.log(`Deleted ${deleteResult.deletedCount} questions from Question collection.`);
        }

        // 6. Remove Set from Assessment
        facultyEntry.sets.splice(setIndex, 1);
        await assessment.save();
        console.log(`Removed Set ${setName} from Assessment document.`);

        console.log("Deletion Complete.");

    } catch (error) {
        console.error("Error:", error);
    } finally {
        mongoose.connection.close();
    }
};

deleteSet();
