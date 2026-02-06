const mongoose = require('mongoose');

const universitySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    location: {
        type: String,
        default: '',
    },
}, { timestamps: true });

module.exports = mongoose.model('University', universitySchema);
