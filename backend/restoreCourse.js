const mongoose = require('mongoose');
const Course = require('./models/Course');
require('dotenv').config();

const restoreCourse = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const courseCodePattern = /^CSE372_deleted_/;

        // Find the most recently deleted version of this course
        const course = await Course.findOne({ code: courseCodePattern }).sort({ _id: -1 });

        if (!course) {
            console.log('No deleted course found for CSE372.');
        } else {
            console.log(`Found deleted course: ${course.name} (Code: ${course.code})`);

            // Check if active course with same name exists (collision check)
            const activeCourse = await Course.findOne({ code: 'CSE372', isDeleted: false });
            if (activeCourse) {
                console.log('Error: An active course with code "CSE372" already exists. Cannot restore.');
            } else {
                course.isDeleted = false;
                course.code = 'CSE372';
                await course.save();
                console.log(`Successfully restored course "CSE372"`);
            }
        }

    } catch (err) {
        console.error(err);
    } finally {
        mongoose.connection.close();
    }
};

restoreCourse();
