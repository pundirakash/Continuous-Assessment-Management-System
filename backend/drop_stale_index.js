const mongoose = require('mongoose');
require('dotenv').config();

const fixIndexes = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const collection = mongoose.connection.collection('departments');

        // 1. List existing indexes
        const indexes = await collection.indexes();
        console.log('Existing indexes:', JSON.stringify(indexes, null, 2));

        // 2. Drop the stale 'name_1' index if it exists
        const nameIndex = indexes.find(idx => idx.name === 'name_1' && idx.unique);
        if (nameIndex) {
            console.log('Dropping stale unique index: name_1');
            await collection.dropIndex('name_1');
            console.log('Index dropped successfully');
        } else {
            console.log('No stale unique index "name_1" found.');
        }

        // 3. Ensure the correct compound index exists
        console.log('Ensuring compound index { name: 1, schoolId: 1, universityId: 1 }');
        await collection.createIndex({ name: 1, schoolId: 1, universityId: 1 }, { unique: true });
        console.log('Compound index verified/created.');

        process.exit(0);
    } catch (err) {
        console.error('Error fixing indexes:', err);
        process.exit(1);
    }
};

fixIndexes();
