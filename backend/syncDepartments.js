const mongoose = require('mongoose');
const User = require('./models/User');
const Course = require('./models/Course');
const Department = require('./models/Department');
const School = require('./models/School');
require('dotenv').config();

const syncDepartments = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // 1. Get Default School
        const school = await School.findOne({ name: 'School of Computer Science and Engineering' });
        if (!school) {
            console.error('Default School not found!');
            return;
        }

        // 2. Find all distinct departments in Courses
        const courseDepts = await Course.distinct('department');
        console.log('Departments found in Courses:', courseDepts);

        // 3. Create missing Department documents
        for (const deptName of courseDepts) {
            let dept = await Department.findOne({ name: deptName });
            if (!dept) {
                dept = await Department.create({
                    name: deptName,
                    schoolId: school._id
                });
                console.log(`Created Department: "${deptName}"`);
            } else {
                if (!dept.schoolId) {
                    dept.schoolId = school._id;
                    await dept.save();
                    console.log(`Linked "${deptName}" to School`);
                }
            }
        }

        // 4. Update HOD to one of these departments (System Programming)
        const hod = await User.findOne({ name: 'Pushpendra Kumar Pateriya', role: 'HOD' });
        if (hod) {
            console.log(`Updating HOD ${hod.name} from "${hod.department}" to "System Programming"`);
            hod.department = 'System Programming';
            await hod.save();
        } else {
            console.log('HOD Pushpendra Kumar Pateriya not found.');
        }

        console.log('Sync Complete.');

    } catch (err) {
        console.error(err);
    } finally {
        mongoose.connection.close();
    }
};

syncDepartments();
