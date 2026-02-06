const mongoose = require('mongoose');

const chatReadStateSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    lastReadAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Ensure unique combination of user and course
chatReadStateSchema.index({ user: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('ChatReadState', chatReadStateSchema);
