const mongoose = require('mongoose');
const User = require('./models/User');
const School = require('./models/School');
const Department = require('./models/Department');
const University = require('./models/University');
require('dotenv').config();

const inspect = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const admin = await User.findOne({ role: 'Admin' });
        console.log('Admin User:', JSON.stringify(admin, null, 2));

        const universities = await University.find();
        console.log('Universities:', JSON.stringify(universities, null, 2));

        const schools = await School.find();
        console.log('Schools:', JSON.stringify(schools, null, 2));

        const departments = await Department.find();
        console.log('Departments:', JSON.stringify(departments, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

inspect();
