const mongoose = require('mongoose');
const User = require('./models/User');
const Department = require('./models/Department');
require('dotenv').config();

const migrateDepartments = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB Connected');

        // 1. Get all distinct departments from Users
        const distinctDepartments = await User.distinct('department');
        console.log('Found existing departments in Users:', distinctDepartments);

        // 2. Insert into Department collection if not exists
        let count = 0;
        for (const deptName of distinctDepartments) {
            if (!deptName) continue; // Skip empty/null

            const exists = await Department.findOne({ name: deptName });
            if (!exists) {
                await Department.create({ name: deptName });
                console.log(`Created Department: ${deptName}`);
                count++;
            } else {
                console.log(`Department already exists: ${deptName}`);
            }
        }

        console.log(`Migration Complete. Added ${count} new departments.`);
        process.exit(0);
    } catch (err) {
        console.error('Migration Failed:', err);
        process.exit(1);
    }
};

migrateDepartments();
