const mongoose = require('mongoose');
const TermArchive = require('./models/TermArchive');
const Assessment = require('./models/Assessment');
const User = require('./models/User');
const Course = require('./models/Course');
const SystemConfig = require('./models/SystemConfig');

require('dotenv').config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const targetTermStr = '24252';
        const department = 'Full Stack Application Development';

        console.log(`Testing Stats for Dept: ${department}, Term: ${targetTermStr}`);

        // 1. Fetch Faculties in Department
        const currentFaculties = await User.find({
            department,
            role: { $in: ['Faculty', 'CourseCoordinator', 'HOD'] }
        }).select('name email uid _id').lean();
        console.log(`Current Faculties: ${currentFaculties.length}`);

        // 2. Fetch HISTORICAL Faculties
        const deptCourses = await Course.find({ department }).select('_id');
        const deptCourseIds = deptCourses.map(c => c._id);

        const historicalFacultyIds = await TermArchive.distinct('facultyId', {
            termId: targetTermStr,
            courseId: { $in: deptCourseIds }
        });
        console.log(`Historical Faculty IDs found: ${historicalFacultyIds.length}`);

        const historicalFaculties = await User.find({ _id: { $in: historicalFacultyIds } }).select('name email uid _id').lean();

        // Merge
        const allFacultiesMap = new Map();
        [...currentFaculties, ...historicalFaculties].forEach(f => {
            allFacultiesMap.set(f._id.toString(), f);
        });
        const allFaculties = Array.from(allFacultiesMap.values());
        console.log(`Total Merged Faculties: ${allFaculties.length}`);

        // 3. Stats Calculation
        const courses = await Course.find({ department });

        const termQuery = [targetTermStr, Number(targetTermStr)].filter(x => !isNaN(x));
        console.log("Term Query:", termQuery);

        const assessments = await Assessment.find({
            course: { $in: deptCourseIds },
            termId: { $in: termQuery }
        });
        console.log(`Assessments found: ${assessments.length}`);

        // Calculate final stats
        const stats = await Promise.all(allFaculties.map(async (faculty) => {
            const archives = await TermArchive.countDocuments({
                termId: targetTermStr,
                facultyId: faculty._id,
                role: { $in: ['Faculty', 'CourseCoordinator'] }
            });
            let assignedCoursesCount = archives;
            if (archives === 0) {
                // Fallback check logic (omitted for brevity as archives found is priority)
            }

            // Find Q's
            let totalQuestionsCreated = 0;
            assessments.forEach(ass => {
                ass.facultyQuestions.forEach(fq => {
                    if (fq.faculty.toString() === faculty._id.toString()) {
                        fq.sets.forEach(set => totalQuestionsCreated += set.questions.length);
                    }
                });
            });

            return {
                name: faculty.name,
                coursesCount: assignedCoursesCount,
                totalQuestionsCreated
            };
        }));

        console.log("--- FINAL STATS ---");
        stats.filter(s => s.totalQuestionsCreated > 0 || s.coursesCount > 0).forEach(s => {
            console.log(`${s.name}: Courses=${s.coursesCount}, Questions=${s.totalQuestionsCreated}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
};

run();
