const mongoose = require('mongoose');
const University = require('./models/University');
const School = require('./models/School');
const Department = require('./models/Department');
require('dotenv').config();

const migrateHierarchy = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB Connected');

        // 1. Create Default University
        let university = await University.findOne({ name: 'Default University' });
        if (!university) {
            university = await University.create({ name: 'Default University', location: 'Main Campus' });
            console.log('Created Default University');
        } else {
            console.log('Default University already exists');
        }

        // 2. Create or Update Default School
        const oldName = 'School of CSE';
        const newName = 'School of Computer Science and Engineering';

        let school = await School.findOne({ name: newName, universityId: university._id });

        if (!school) {
            // Check for old name and rename it if exists
            const oldSchool = await School.findOne({ name: oldName, universityId: university._id });
            if (oldSchool) {
                oldSchool.name = newName;
                school = await oldSchool.save();
                console.log(`Renamed "${oldName}" to "${newName}"`);
            } else {
                school = await School.create({ name: newName, universityId: university._id });
                console.log(`Created "${newName}"`);
            }
        } else {
            console.log(`"${newName}" already exists`);
        }

        // 3. Link all existing Departments to this School
        const departments = await Department.find({ schoolId: { $exists: false } });
        console.log(`Found ${departments.length} departments to link.`);

        for (const dept of departments) {
            dept.schoolId = school._id;
            await dept.save();
            console.log(`Linked ${dept.name} to ${school.name}`);
        }

        console.log('Hierarchy Migration Complete');
        process.exit(0);
    } catch (err) {
        console.error('Migration Failed:', err);
        process.exit(1);
    }
};

migrateHierarchy();
