const mongoose = require('mongoose');
require('dotenv').config();

const fixAllIndexes = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;

        const cleanup = async (collectionName, staleIndexes, correctIndex, options = { unique: true }) => {
            console.log(`\n--- Cleaning up collection: ${collectionName} ---`);
            const collection = db.collection(collectionName);
            const indexes = await collection.indexes();

            for (const stale of staleIndexes) {
                if (indexes.find(idx => idx.name === stale)) {
                    console.log(`Dropping stale index: ${stale}`);
                    await collection.dropIndex(stale);
                }
            }

            console.log(`Ensuring correct index: ${JSON.stringify(correctIndex)}`);
            await collection.createIndex(correctIndex, options);
            console.log('Done.');
        };

        // 1. Departments
        await cleanup('departments',
            ['name_1', 'name_1_schoolId_1'],
            { name: 1, schoolId: 1, universityId: 1 }
        );

        // 2. Courses
        await cleanup('courses',
            ['code_1'],
            { code: 1, schoolId: 1, universityId: 1 }
        );

        // 3. Users
        await cleanup('users',
            ['uid_1', 'email_1'],
            { uid: 1, universityId: 1 }
        );
        await db.collection('users').createIndex({ email: 1, universityId: 1 }, { unique: true });

        console.log('\nAll indexes fixed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Error fixing indexes:', err);
        process.exit(1);
    }
};

fixAllIndexes();
