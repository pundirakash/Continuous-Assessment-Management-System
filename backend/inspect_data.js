const mongoose = require('mongoose');
const User = require('./models/User');
const Course = require('./models/Course');
const Department = require('./models/Department');
require('dotenv').config();

const inspectData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const hods = await User.find({ role: 'HOD' });
        console.log('--- HODs ---');
        hods.forEach(h => console.log(`Name: ${h.name}, Dept: "${h.department}"`));

        const courses = await Course.find({});
        console.log('\n--- Courses ---');
        courses.forEach(c => console.log(`Code: ${c.code}, Name: ${c.name}, Dept: "${c.department}"`));

        const departments = await Department.find({});
        console.log('\n--- Departments Collection ---');
        departments.forEach(d => console.log(`Name: "${d.name}"`));

    } catch (err) {
        console.error(err);
    } finally {
        mongoose.connection.close();
    }
};

inspectData();
