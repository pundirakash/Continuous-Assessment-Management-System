const mongoose = require('mongoose');
const Course = require('./models/Course');
const SystemConfig = require('./models/SystemConfig');
require('dotenv').config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const config = await SystemConfig.findOne({ key: 'currentTerm' });
        console.log("Current System Term:", config?.value);

        const courses = await Course.find({});
        console.log(`Found ${courses.length} courses.`);

        courses.forEach(c => {
            console.log(`Course: ${c.code} (${c.name}) | ActiveTerms: ${JSON.stringify(c.activeTerms)} | IsDeleted: ${c.isDeleted}`);
        });

    } catch (e) { console.error(e); } finally { mongoose.disconnect(); }
};
run();
