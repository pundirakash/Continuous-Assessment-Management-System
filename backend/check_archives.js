const mongoose = require('mongoose');
const dotenv = require('dotenv');
const TermArchive = require('./models/TermArchive');

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const archives = await TermArchive.distinct('termId');
        console.log('Distinct Term IDs in TermArchive:', archives);

        const count = await TermArchive.countDocuments();
        console.log('Total Archive Entries:', count);

        if (archives.length > 0) {
            const sample = await TermArchive.findOne();
            console.log('Sample Entry:', sample);
        } else {
            console.log('No archives found! Did advance_term.js actually run?');
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
};

run();
