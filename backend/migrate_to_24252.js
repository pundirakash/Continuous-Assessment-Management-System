const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Assessment = require('./models/Assessment');

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // Update all assessments that are either 24251 (from my previous test) or null/missing to 24252
        const result = await Assessment.updateMany(
            {
                $or: [
                    { termId: '24251' },
                    { termId: null },
                    { termId: { $exists: false } }
                ]
            },
            { $set: { termId: '24252' } }
        );

        console.log(`Matched and updated: ${result.matchCount} documents.`);
        console.log(`Modified: ${result.modifiedCount} documents.`);

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
};

run();
