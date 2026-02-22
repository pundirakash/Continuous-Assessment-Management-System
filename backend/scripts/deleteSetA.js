/**
 * One-time script: Delete Set "A" for CSE316 / CA-1 / UID 14623 / Term 25262
 * Run: node backend/scripts/deleteSetA.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Course = require('../models/Course');
const Assessment = require('../models/Assessment');
const Question = require('../models/Question');

// ---- Configuration ----
const TARGET_UID = 14623;
const TARGET_COURSE = 'CSE316';
const TARGET_TERM = 25262;
const TARGET_ASSESS = 'CA-1';
const TARGET_SET = 'A';
// -----------------------

async function main() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅  Connected to MongoDB');

    // 1. Find faculty by UID
    const faculty = await User.findOne({ uid: TARGET_UID });
    if (!faculty) throw new Error(`No user found with UID ${TARGET_UID}`);
    console.log(`✅  Faculty: ${faculty.name} (${faculty._id})`);

    // 2. Find course by code
    const course = await Course.findOne({ code: TARGET_COURSE });
    if (!course) throw new Error(`No course found with code ${TARGET_COURSE}`);
    console.log(`✅  Course: ${course.name} (${course._id})`);

    // 3. Find assessment
    const assessment = await Assessment.findOne({
        termId: TARGET_TERM,
        course: course._id,
        name: { $regex: new RegExp(`^${TARGET_ASSESS}$`, 'i') }
    });
    if (!assessment) throw new Error(`No assessment "${TARGET_ASSESS}" found in term ${TARGET_TERM} for ${TARGET_COURSE}`);
    console.log(`✅  Assessment: ${assessment.name} (${assessment._id})`);

    // 4. Find the faculty record in facultyQuestions
    const fqEntry = assessment.facultyQuestions.find(fq => fq.faculty.equals(faculty._id));
    if (!fqEntry) throw new Error(`Faculty UID ${TARGET_UID} has no questions in this assessment`);

    const targetSet = fqEntry.sets.find(s => s.setName === TARGET_SET);
    if (!targetSet) throw new Error(`Set "${TARGET_SET}" not found for this faculty in this assessment`);

    const questionIds = targetSet.questions;
    console.log(`ℹ️   Set "${TARGET_SET}" found with ${questionIds.length} question(s).`);

    // 5. Confirm before deleting (Skipping delay for agent run)
    console.log('\n⚠️   Deleting Set A and all its questions...');

    // 6. Delete all associated Question documents
    if (questionIds.length > 0) {
        const qResult = await Question.deleteMany({ _id: { $in: questionIds } });
        console.log(`🗑️   Deleted ${qResult.deletedCount} Question document(s).`);
    }

    // 7. Pull the set from the sets array using $pull
    const updateResult = await Assessment.updateOne(
        { _id: assessment._id, 'facultyQuestions.faculty': faculty._id },
        { $pull: { 'facultyQuestions.$.sets': { setName: TARGET_SET } } }
    );

    console.log(`🗑️   Set pull result:`, updateResult);
    console.log(`\n✅  Done! Set "${TARGET_SET}" has been removed from the assessment.`);

    await mongoose.disconnect();
}

main().catch(err => {
    console.error('❌  Error:', err.message);
    if (mongoose.connection.readyState !== 0) {
        mongoose.disconnect();
    }
    process.exit(1);
});
