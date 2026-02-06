const mongoose = require('mongoose');
const dotenv = require('dotenv');
// Mocking the request/response for the controller
const adminController = require('./controllers/adminController');
const SystemConfig = require('./models/SystemConfig');

dotenv.config();

const mockRes = () => {
    return {
        status: (code) => ({
            json: (data) => console.log(`[${code}]`, data),
            send: (data) => console.log(`[${code}]`, data)
        }),
        json: (data) => console.log(data)
    };
};

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        console.log('--- SWITCHING TO 25261 ---');
        await adminController.switchTerm({ body: { newTerm: '25261' } }, mockRes());

        // Wait a bit to ensure async ops settle
        await new Promise(r => setTimeout(r, 2000));

        console.log('--- SWITCHING TO 25262 ---');
        await adminController.switchTerm({ body: { newTerm: '25262' } }, mockRes());

        const config = await SystemConfig.findOne({ key: 'currentTerm' });
        console.log('FINAL SYSTEM TERM:', config.value);

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
};

run();
