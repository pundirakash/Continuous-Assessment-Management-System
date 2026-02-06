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

        const config = await SystemConfig.findOne({ key: 'currentTerm' });
        console.log("Current Term:", config?.value);

        // 1. Dump distinct TermArchives
        const terms = await TermArchive.distinct('termId');
        console.log("Archived Terms:", terms);

        // 2. Dump distinct Assessment terms
        const assessTerms = await Assessment.distinct('termId');
        console.log("Assessment Terms:", assessTerms);

        // 3. Pick a previous term (e.g. 24251 or similar) if exists
        const targetTerm = terms[0];
        console.log(`--- Inspecting Term: ${targetTerm} ---`);

        if (targetTerm) {
            const archives = await TermArchive.find({ termId: targetTerm }).limit(5).populate('courseId facultyId');
            console.log(`Sample Archives (${archives.length}):`);
            archives.forEach(a => {
                console.log(` - Role: ${a.role}, Faculty: ${a.facultyId?.name}, Course: ${a.courseId?.code}`);
            });

            const assessments = await Assessment.find({ termId: targetTerm }).limit(2); // Strict match
            console.log(`Strict Assessment Match (${assessments.length}):`);

            // Try mixed match
            const termQuery = [targetTerm.toString(), Number(targetTerm)].filter(x => !isNaN(x));
            const assessmentsMixed = await Assessment.find({ termId: { $in: termQuery } }).limit(2);
            console.log(`Mixed Assessment Match (${assessmentsMixed.length}):`);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
};

run();
