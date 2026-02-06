const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        // Find the HOD user to check their department
        const hod = await User.findOne({ role: 'HOD' });
        console.log("HOD Name:", hod?.name);
        console.log("HOD Dept:", hod?.department);
        console.log("Dept Length:", hod?.department?.length);
    } catch (e) { console.error(e); } finally { mongoose.disconnect(); }
};
run();
