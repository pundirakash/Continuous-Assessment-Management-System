const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Course = require('./models/Course');
const Assessment = require('./models/Assessment');

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // Check HOD logic
        // The user reporting the error is "Pushpendra Kumar Pateriya"
        const hod = await User.findOne({ name: /Pushpendra/i });
        if (hod) {
            console.log(`Found HOD: ${hod.name}\n - ID: ${hod._id}\n - Role: '${hod.role}'\n - Dept: '${hod.department}'`);
            if (hod.role !== 'HOD') {
                console.error('CRITICAL WARNING: User is NOT HOD! This might be why they cannot assign courses.');
                // Attempt to fix it?
                // hod.role = 'HOD';
                // await hod.save();
                // console.log('Fixed HOD role temporarily for test.');
            }
        } else {
            console.error('HOD Pushpendra not found!');
        }

        // Find Faculty
        const faculty = await User.findOne({ name: 'Harsh Sharma' });
        if (!faculty) {
            console.log('Faculty "Harsh Sharma" not found.');
            return;
        }
        console.log(`Found Faculty: ${faculty.name}\n - ID: ${faculty._id}\n - Role: '${faculty.role}'\n - Dept: '${faculty.department}'`);

        // Find Course
        const course = await Course.findOne({ name: /Combinatorial Studies/i });
        if (!course) {
            console.log('Course "Combinatorial Studies" not found.');
            return;
        }
        console.log(`Found Course: ${course.name} (${course._id})`);

        console.log('--- Simulating Assignment ---');

        // Check Department Match
        if (faculty.department !== hod.department) {
            console.error(`Department Mismatch! Faculty: ${faculty.department}, HOD: ${hod.department}`);
        }

        // Add to arrays
        console.log(`Before: Faculty has ${faculty.courses.length} courses. Course has ${course.faculties.length} faculties.`);

        faculty.courses.push(course._id);
        await faculty.save();
        console.log('Faculty save successful.');

        course.faculties.push(faculty._id);
        await course.save();
        console.log('Course save successful.');

        // Notification
        console.log('Adding Notification...');
        const notificationMessage = `Dear ${faculty.name}, A new Course ${course.name} has been allotted to you.`;
        if (!faculty.notifications) faculty.notifications = [];
        faculty.notifications.unshift({
            message: notificationMessage,
            read: false,
            createdAt: new Date()
        });
        await faculty.save();
        console.log('Notification saved.');

    } catch (err) {
        console.error('CAUGHT ERROR:', err);
    } finally {
        await mongoose.disconnect();
    }
};

run();
