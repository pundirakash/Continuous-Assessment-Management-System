const mongoose = require('mongoose');
const University = require('./backend/models/University');
const School = require('./backend/models/School');
const Department = require('./backend/models/Department');
const User = require('./backend/models/User');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, './backend/.env') });

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const universities = await University.find();
        const schools = await School.find();
        const departments = await Department.find();

        console.log("Universities:", JSON.stringify(universities, null, 2));
        console.log("Schools:", JSON.stringify(schools, null, 2));
        console.log("Departments:", JSON.stringify(departments, null, 2));

        const fsDept = await Department.findOne({ name: /Full Stack Application Development/i });
        if (fsDept) {
            const userCount = await User.countDocuments({ departmentId: fsDept._id });
            console.log(`Department "${fsDept.name}" found (ID: ${fsDept._id}) under School ID: ${fsDept.schoolId}. User Count: ${userCount}`);
        } else {
            console.log("Department 'Full Stack Application Development' not found.");
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

check();
