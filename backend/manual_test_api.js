const mongoose = require('mongoose');
const User = require('./models/User');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        // 1. Get HOD User
        const hod = await User.findOne({ role: 'HOD', department: 'Full Stack Application Development' });
        if (!hod) {
            console.error("HOD not found!");
            return;
        }
        console.log(`Found HOD: ${hod.name} (${hod._id})`);

        // 2. Generate Token
        const token = jwt.sign(
            { _id: hod._id, role: hod.role, department: hod.department },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        console.log("Generated Test Token");

        // 3. Hit Endpoint
        const url = 'http://localhost:5000/api/HOD/stats?termId=24252';
        console.log(`Requesting: ${url}`);

        try {
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log("--- RESPONSE STATUS ---");
            console.log(res.status);

            if (res.ok) {
                const data = await res.json();
                console.log("--- RESPONSE DATA SAMPLE ---");
                if (Array.isArray(data)) {
                    console.log(`Received ${data.length} records.`);
                    if (data.length > 0) {
                        console.log("First Record:", JSON.stringify(data[0], null, 2));
                    } else {
                        console.log("Data is empty array []");
                    }
                } else {
                    console.log("Data:", data);
                }
            } else {
                console.log("Error Status:", res.status);
                const txt = await res.text();
                console.log("Error Body:", txt);
            }

        } catch (err) {
            console.error("API Request Failed:", err.message);
        }

    } catch (e) {
        console.error("Script Error:", e);
    } finally {
        await mongoose.disconnect();
    }
};

run();
