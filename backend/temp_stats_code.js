exports.getDashboardStats = async (req, res) => {
    try {
        const department = req.user.department;
        const { termId } = req.query;

        console.log(`[Stats DEBUG] Req Term: ${termId}, Dept: ${department}`);

        let targetTerm = termId;
        if (!targetTerm) {
            const config = await SystemConfig.findOne({ key: 'currentTerm' });
            targetTerm = config ? config.value : '24252';
        }
        const targetTermStr = String(targetTerm);
        console.log(`[Stats DEBUG] Target Term: ${targetTermStr}`);

        // 1. Fetch CURRENT Faculties in Department
        const currentFaculties = await User.find({
            department,
            role: { $in: ['Faculty', 'CourseCoordinator', 'HOD'] }
        }).select('name email uid _id').lean();
        console.log(`[Stats DEBUG] Current Faculties: ${currentFaculties.length}`);

        // 2. Fetch HISTORICAL Faculties from TermArchive
        const deptCourses = await Course.find({ department }).select('_id');
        const deptCourseIds = deptCourses.map(c => c._id);

        const historicalFacultyIds = await TermArchive.distinct('facultyId', {
            termId: targetTermStr,
            courseId: { $in: deptCourseIds }
        });
        console.log(`[Stats DEBUG] Historical Faculty IDs: ${historicalFacultyIds.length}`);

        const historicalFaculties = await User.find({ _id: { $in: historicalFacultyIds } }).select('name email uid _id').lean();

        // Merge lists (Unique by _id)
        const allFacultiesMap = new Map();
        [...currentFaculties, ...historicalFaculties].forEach(f => {
            allFacultiesMap.set(f._id.toString(), f);
        });
        const allFaculties = Array.from(allFacultiesMap.values());
        console.log(`[Stats DEBUG] Total Merged Faculties: ${allFaculties.length}`);

        // 3. Stats Calculation
        const courses = await Course.find({ department });

        const stats = await Promise.all(allFaculties.map(async (faculty) => {
            let assignedCoursesCount = 0;

            const archives = await TermArchive.countDocuments({
                termId: targetTermStr,
                facultyId: faculty._id,
                role: { $in: ['Faculty', 'CourseCoordinator'] }
            });

            if (archives > 0) {
                assignedCoursesCount = archives;
            } else {
                const config = await SystemConfig.findOne({ key: 'currentTerm' });
                const currentSystemTerm = config ? config.value : '24252';

                if (targetTermStr === String(currentSystemTerm)) {
                    const activeCourses = courses.filter(c =>
                        (c.faculties && c.faculties.map(id => id.toString()).includes(faculty._id.toString())) ||
                        (c.coordinator && c.coordinator.toString() === faculty._id.toString())
                    );
                    assignedCoursesCount = activeCourses.length;
                }
            }

            return {
                _id: faculty._id,
                name: faculty.name,
                uid: faculty.uid,
                coursesCount: assignedCoursesCount,
                pendingReviews: 0,
                totalQuestionsCreated: 0,
                approvedQuestions: 0
            };
        }));

        // B. Aggregate Assessment Stats
        const termQuery = [targetTermStr, Number(targetTerm)].filter(x => !isNaN(x) || typeof x === 'string');
        console.log(`[Stats DEBUG] Term Query for Assessments:`, termQuery);

        const assessments = await Assessment.find({
            course: { $in: deptCourseIds },
            termId: { $in: termQuery }
        });
        console.log(`[Stats DEBUG] Assessments Found: ${assessments.length}`);

        assessments.forEach(assessment => {
            assessment.facultyQuestions.forEach(fq => {
                const facultyStat = stats.find(s => s._id.toString() === fq.faculty.toString());
                if (facultyStat) {
                    let qCount = 0;
                    let approvedCount = 0;
                    let pendingCount = 0;

                    fq.sets.forEach(set => {
                        qCount += set.questions.length;
                        if (set.hodStatus === 'Submitted') pendingCount++;
                        if (set.hodStatus === 'Approved') approvedCount += set.questions.length;
                    });

                    facultyStat.totalQuestionsCreated += qCount;
                    facultyStat.pendingReviews += pendingCount;
                    facultyStat.approvedQuestions += approvedCount;
                }
            });
        });

        // Sort by name
        stats.sort((a, b) => a.name.localeCompare(b.name));

        res.status(200).json(stats);

    } catch (error) {
        console.error("Stats Error", error);
        res.status(500).json({ message: 'Server error', error: error.message, stack: error.stack });
    }
};
