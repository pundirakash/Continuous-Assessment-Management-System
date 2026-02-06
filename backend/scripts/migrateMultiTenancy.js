const mongoose = require('mongoose');
const User = require('../models/User');
const Course = require('../models/Course');
const University = require('../models/University');
const School = require('../models/School');
const Department = require('../models/Department');
const SystemConfig = require('../models/SystemConfig');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const migrate = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB...");

        // 1. Create Default University
        let university = await University.findOne();
        if (!university) {
            university = await University.create({ name: "Default University", location: "Global" });
            console.log("Created Default University.");
        }

        // 2. Create Default School
        let school = await School.findOne({ universityId: university._id });
        if (!school) {
            school = await School.create({ name: "Default School", universityId: university._id });
            console.log("Created Default School.");
        }

        // 3. Map Departments
        const departments = await User.distinct('department');
        const courseDepartments = await Course.distinct('department');
        const allDepts = [...new Set([...departments, ...courseDepartments])].filter(d => d);

        const deptMap = {};
        for (const deptName of allDepts) {
            let dept = await Department.findOne({ name: deptName, schoolId: school._id });
            if (!dept) {
                dept = await Department.create({ name: deptName, schoolId: school._id });
                console.log(`Created Department: ${deptName}`);
            }
            deptMap[deptName] = dept._id;
        }

        // 4. Update Users
        const users = await User.find({ universityId: { $exists: false } });
        console.log(`Updating ${users.length} users...`);
        for (const user of users) {
            user.universityId = university._id;
            user.schoolId = school._id;
            if (user.department && deptMap[user.department]) {
                user.departmentId = deptMap[user.department];
            }
            await user.save();
        }

        // 5. Update Courses
        const courses = await Course.find({ universityId: { $exists: false } });
        console.log(`Updating ${courses.length} courses...`);
        for (const course of courses) {
            course.universityId = university._id;
            course.schoolId = school._id;
            if (course.department && deptMap[course.department]) {
                course.departmentId = deptMap[course.department];
            }
            await course.save();
        }

        // 6. Update SystemConfigs
        const configs = await SystemConfig.find({ universityId: { $exists: false } });
        console.log(`Updating ${configs.length} configs...`);
        for (const config of configs) {
            config.universityId = university._id;
            await config.save();
        }

        console.log("Migration completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
};

migrate();
