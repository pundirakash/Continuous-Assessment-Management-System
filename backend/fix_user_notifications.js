const mongoose = require('mongoose');
const dotenv = require('dotenv');
// We need to access the raw collection to see the strings, 
// because Mongoose might mangle them upon load if we use the Schema.
// However, we can use lean() or just update using $set.
// But we need to Read, Transform, Write.
// If we load via Mongoose model, it might error.
// Let's use the native driver for this operation to be safe and precise.

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');

        const users = await usersCollection.find({}).toArray();
        console.log(`Found ${users.length} users. Checking for string notifications...`);

        let updatedCount = 0;

        for (const user of users) {
            let needsUpdate = false;
            if (user.notifications && Array.isArray(user.notifications)) {
                const fixedNotifications = user.notifications.map(n => {
                    if (typeof n === 'string') {
                        needsUpdate = true;
                        return {
                            message: n,
                            read: false,
                            createdAt: new Date()
                        };
                    }
                    return n; // Already an object (hopefully)
                });

                if (needsUpdate) {
                    console.log(`Fixing user: ${user.name} (${user._id}) - converted strings to objects.`);
                    await usersCollection.updateOne(
                        { _id: user._id },
                        { $set: { notifications: fixedNotifications } }
                    );
                    updatedCount++;
                }
            }
        }

        console.log(`Migration complete. Updated ${updatedCount} users.`);

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
};

run();
