const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const user = await User.findOne({ role: 'Faculty' });
        console.log("Sample Faculty Dept:", user ? user.department : "None");
    } catch (e) { console.error(e); } finally { mongoose.disconnect(); }
};
run();
