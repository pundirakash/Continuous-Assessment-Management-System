const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    universityId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'University',
        required: true,
    },
}, { timestamps: true });

// A school name is unique within a university
schoolSchema.index({ name: 1, universityId: 1 }, { unique: true });

module.exports = mongoose.model('School', schoolSchema);
