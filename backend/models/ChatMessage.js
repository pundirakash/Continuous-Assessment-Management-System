const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    message: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// Index for faster fetching of messages for a specific course
chatMessageSchema.index({ course: 1, timestamp: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
