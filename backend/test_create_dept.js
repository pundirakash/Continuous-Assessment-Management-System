const mongoose = require('mongoose');
const Department = require('./models/Department');
require('dotenv').config();

const test = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected');

        const name = "Full Stack Application Development";
        const schoolId = "6986b8835e85de84654f1a9b"; // New School
        const universityId = "697d4d41ad084cf846542b63"; // LPU universityId from debug output

        console.log(`Attempting to create: Name="${name}", School="${schoolId}", Uni="${universityId}"`);

        try {
            const dept = await Department.create({ name, schoolId, universityId });
            console.log('Successfully created:', dept);
        } catch (err) {
            console.error('FAILED TO CREATE DEPARTMENT');
            console.error('Error Code:', err.code);
            console.error('Error Message:', err.message);
            if (err.keyPattern) console.error('Key Pattern:', JSON.stringify(err.keyPattern));
            if (err.keyValue) console.error('Key Value:', JSON.stringify(err.keyValue));
        }

        process.exit(0);
    } catch (err) {
        console.error('Connection/Test Setup Error:', err);
        process.exit(1);
    }
};

test();
