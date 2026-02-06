const mongoose = require('mongoose');
const User = require('./models/User');
const Course = require('./models/Course');
const Assessment = require('./models/Assessment');
const SystemConfig = require('./models/SystemConfig');

const dotenv = require('dotenv');
dotenv.config();

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const verify = async () => {
    try {
        // 1. Find Pushpendra
        // 1. Find Pushpendra
        const user = await User.findOne({ uid: 14623 });
        if (!user) {
            console.log("User '14623' not found.");
            return;
        }
        // const user = users[0];
        console.log(`User Found: ${user.name} (ID: ${user._id})`);
        console.log(`User.courses: ${user.courses}`);

        const termId = '24252';

        // 2. Find Courses via Query (Truth in Course Collection)
        const courses = await Course.find({
            faculties: user._id,
            activeTerms: termId
        });
        console.log(`\n--- Courses in Term ${termId} (via Course.find) ---`);
        console.log(`Count: ${courses.length}`);
        courses.forEach(c => console.log(`- ${c.name} (${c.code})`));

        // 3. Find Assessments and Sets
        console.log(`\n--- Set Stats (via Assessment.find) ---`);
        // Note: Assessment.termId might be Number
        const assessments = await Assessment.find({
            // termId: 24252, // Try Number first
            $or: [{ termId: 24252 }, { termId: '24252' }],
            'facultyQuestions.faculty': user._id
        }).populate('course');

        let approved = 0;
        assessments.forEach(assessment => {
            const fq = assessment.facultyQuestions.find(f => f.faculty.equals(user._id));
            if (fq) {
                fq.sets.forEach(set => {
                    console.log(`Set: [${set.setName}] | Status: ${set.hodStatus} | Assessment: ${assessment.name} | Course: ${assessment.course?.name}`);
                    if (['Approved', 'Approved with Remarks'].includes(set.hodStatus)) {
                        approved++;
                    }
                });
            }
        });

        console.log(`Total Approved Sets Found: ${approved}`);

    } catch (err) {
        console.error(err);
    } finally {
        mongoose.connection.close();
    }
};

verify();
