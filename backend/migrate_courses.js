const mongoose = require('mongoose');
const Course = require('./models/Course');
const path = require('path');
// Try to load from root .env or backend .env
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const run = async () => {
    try {
        console.log("Connecting to DB...");
        // Fallback to specific URI if env fails, but assuming standard env var names
        const uri = process.env.MONGO_URI || process.env.REACT_APP_MONGO_URI;
        if (!uri) throw new Error("MONGO_URI is not defined");

        await mongoose.connect(uri);
        console.log("Connected to DB");

        // Strategy: Find courses with NO activeTerms and set to ['24252'] (Previous Term)
        const result = await Course.updateMany(
            {
                $or: [
                    { activeTerms: { $exists: false } },
                    { activeTerms: { $size: 0 } },
                    { activeTerms: null }
                ]
            },
            { $set: { activeTerms: ['24252'] } }
        );

        console.log(`Migrated ${result.modifiedCount} courses to term '24252'.`);
        console.log("These courses will now NOT show in '25262' but will be available in Catalog.");

    } catch (e) { console.error(e); } finally { mongoose.disconnect(); }
};
run();
