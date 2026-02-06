const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const faculty = await User.findOne({ name: 'Harsh Sharma' }); // Find "Harsh Sharma"
        if (!faculty) {
            console.log('Faculty not found');
            return;
        }

        console.log(`Checking notifications for ${faculty.name} (ID: ${faculty._id})`);
        console.log(`Total notifications: ${faculty.notifications.length}`);

        // Print raw notifications (using .toObject() to bypass mongoose casting if possible, or just print what we get)
        // Mongoose might auto-cast or strip fields, so let's try to get raw from collection if possible
        // But first, let's see what mongoose gives us.

        faculty.notifications.forEach((n, i) => {
            console.log(`[${i}] Message: '${n.message}', Type: ${typeof n}, Keys: ${Object.keys(n)}`);
            // Check if it's a string disguised as object?
        });

        // Use native driver to see RAW data
        const rawUser = await mongoose.connection.db.collection('users').findOne({ _id: faculty._id });
        console.log('\n--- RAW DB DATA (Sample) ---');
        if (rawUser && rawUser.notifications) {
            rawUser.notifications.slice(0, 5).forEach((n, i) => {
                console.log(`[${i}]`, n);
            });
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
};

run();
