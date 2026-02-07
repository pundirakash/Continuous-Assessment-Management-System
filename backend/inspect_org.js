const mongoose = require('mongoose');
const User = require('./models/User');
const School = require('./models/School');
const Department = require('./models/Department');
const University = require('./models/University');
require('dotenv').config();

const inspectOrg = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const admin = await User.findOne({ role: 'Admin' });
        const universityId = admin.universityId;

        const university = await University.findById(universityId);
        const schools = await School.find({ universityId }).lean();

        for (let school of schools) {
            school.departments = await Department.find({ schoolId: school._id }).distinct('name');
        }

        const result = {
            university: university.name,
            universityId: university._id,
            schools: schools.map(s => ({
                _id: s._id,
                name: s.name,
                departments: s.departments
            }))
        };

        console.log(JSON.stringify(result, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

inspectOrg();
