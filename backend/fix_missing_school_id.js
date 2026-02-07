const mongoose = require('mongoose');
const User = require('./models/User');
const School = require('./models/School');
require('dotenv').config();

const fixMissingSchoolId = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // 1. Find the School
        const schoolName = "School of Computer Science and Engineering";
        const school = await School.findOne({ name: schoolName });

        if (!school) {
            console.error(`School '${schoolName}' not found!`);
            process.exit(1);
        }

        console.log(`Found School: ${school.name} (${school._id})`);

        // 2. Find Users with matching department string but missing schoolId
        // Note: The user mentioned "Pushpender Kumar Pateriya" specifically. 
        // We target the department name appearing in previous logs/context.
        const departmentName = "Computer Science and Engineering";

        // We look for users who have this department name string OR are Pushpender
        const filter = {
            $or: [
                { department: departmentName },
                { name: /Pushpender/i }
            ],
            schoolId: { $exists: false }
        };

        const usersToUpdate = await User.find(filter);
        console.log(`Found ${usersToUpdate.length} users to update.`);

        if (usersToUpdate.length === 0) {
            console.log("No users found matching criteria (or they already have schoolId). Checking for users with schoolId key but null value...");
            // Check for null schoolId just in case
            const nullSchoolUsers = await User.find({
                $or: [
                    { department: departmentName },
                    { name: /Pushpender/i }
                ],
                schoolId: null
            });
            console.log(`Found ${nullSchoolUsers.length} users with null schoolId.`);

            if (nullSchoolUsers.length > 0) {
                const res = await User.updateMany(
                    { _id: { $in: nullSchoolUsers.map(u => u._id) } },
                    { $set: { schoolId: school._id } }
                );
                console.log(`Updated ${res.modifiedCount} users.`);
            }

        } else {
            const res = await User.updateMany(filter, { $set: { schoolId: school._id } });
            console.log(`Updated ${res.modifiedCount} users.`);
        }

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

fixMissingSchoolId();
