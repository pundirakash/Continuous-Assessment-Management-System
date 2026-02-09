const mongoose = require('mongoose');
const Course = require('../models/Course');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('MongoDB Connected to:', process.env.MONGO_URI);
    } catch (err) {
        console.error('Failed to connect to MongoDB', err);
        process.exit(1);
    }
};

const fixSwappedCourses = async () => {
    await connectDB();

    try {
        // Heuristic: If Code Length > Name Length, it's likely swapped.
        // e.g. Code="Operating Systems Laboratory" (28 chars) > Name="CSE325" (6 chars)
        // Filter for code length > 10 to ignore valid long codes if any exist (though rare)
        // and name length < 10 to ignore valid short names (though rare)

        console.log("Scanning for swapped courses...");

        const courses = await Course.find({
            isDeleted: { $ne: true }
        });

        let count = 0;

        for (const course of courses) {
            // Heuristic:
            // 1. Code has spaces AND Name has no spaces?
            // 2. Code length significantly greater than Name length?

            const codeHasSpaces = course.code.includes(' ');
            const nameHasSpaces = course.name.includes(' ');
            const codeLen = course.code.length;
            const nameLen = course.name.length;

            // Identify Swap: Code looks like name (spaces, long) AND Name looks like code (short, no spaces)
            if (codeHasSpaces && !nameHasSpaces && codeLen > nameLen) {
                console.log(`\n[FOUND] Potential Swap:`);
                console.log(`  Current Name: "${course.name}"`);
                console.log(`  Current Code: "${course.code}"`);

                // Confirm swap
                const oldName = course.name;
                const oldCode = course.code;

                course.name = oldCode;
                course.code = oldName;

                await course.save();
                console.log(`  [FIXED]  Name: "${course.name}" | Code: "${course.code}"`);
                count++;
            }
        }

        console.log(`\n\nTotal courses fixed: ${count}`);

    } catch (error) {
        console.error('Error fixing courses:', error);
    } finally {
        mongoose.connection.close();
    }
};

fixSwappedCourses();
