const mongoose = require('mongoose');
const User = require('./models/User');
const Course = require('./models/Course');
const Department = require('./models/Department');
require('dotenv').config();

const fixDepartmentName = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const oldName = 'System Programming';
        const newName = 'Full Stack Application Development';

        // 1. Update Courses
        const courseResult = await Course.updateMany(
            { department: oldName },
            { $set: { department: newName } }
        );
        console.log(`Updated ${courseResult.modifiedCount} courses from "${oldName}" to "${newName}"`);

        // 2. Update Users (Faculty/HOD)
        const userResult = await User.updateMany(
            { department: oldName },
            { $set: { department: newName } }
        );
        console.log(`Updated ${userResult.modifiedCount} users from "${oldName}" to "${newName}"`);

        // 3. Cleanup Department Collection
        const oldDept = await Department.findOne({ name: oldName });
        const newDept = await Department.findOne({ name: newName });

        if (oldDept) {
            if (newDept) {
                // Both exist, so just delete the old one
                await Department.findByIdAndDelete(oldDept._id);
                console.log(`Deleted old department document: "${oldName}"`);
            } else {
                // Only old exists, rename it
                oldDept.name = newName;
                await oldDept.save();
                console.log(`Renamed department document from "${oldName}" to "${newName}"`);
            }
        } else {
            // Check if new one needs to be created (if it wasn't there before)
            if (!newDept) {
                // This case is unlikely if we just ran sync, but for safety
                // We need the School ID if we create it.
                console.log(`Warning: "${newName}" department document not found. Run syncDepartments.js if needed or create manually.`);
            }
        }

        console.log('Correction Complete.');

    } catch (err) {
        console.error(err);
    } finally {
        mongoose.connection.close();
    }
};

fixDepartmentName();
